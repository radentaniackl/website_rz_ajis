import type { NextAuthConfig } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import Google from 'next-auth/providers/google';
// Microsoft provider commented out - requires separate installation
// import Microsoft from 'next-auth/providers/microsoft';
import { db } from '@/lib/db';
import { ajisUser, ajisAuditLog, ajisUserWilayahPembinaan } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

export const authConfig: NextAuthConfig = {
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60, // 24 hours
  },
  pages: {
    signIn: '/login',
    signOut: '/login',
    error: '/auth/error',
    verifyRequest: '/auth/verify-request',
    newUser: '/auth/new-user',
  },
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      // Update token on sign in or session update
      if (user) {
        token.id = Number(user.id);
        token.username = (user as any).username;
        token.id_group_user = (user as any).id_group_user;
        token.kantor_id = (user as any).kantor_id;
        token.id_wilayah_pembinaan = (user as any).id_wilayah_pembinaan;
        token.aktif = (user as any).aktif;
        token.mustResetPassword = (user as any).mustResetPassword;
      }
      
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        (session.user as any).id = token.id;
        (session.user as any).username = token.username;
        (session.user as any).id_group_user = token.id_group_user;
        (session.user as any).kantor_id = token.kantor_id;
        (session.user as any).id_wilayah_pembinaan = token.id_wilayah_pembinaan;
        (session.user as any).aktif = token.aktif;
        (session.user as any).mustResetPassword = token.mustResetPassword;
      }
      return session;
    },
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnDashboard = nextUrl.pathname.startsWith('/dashboard');
      const isOnAuthPage = nextUrl.pathname.startsWith('/login');

      // Allow access to the auth page without forcing a redirect from NextAuth.
      // Middleware will handle protection and redirects centrally.
      if (isOnAuthPage) {
        return true;
      }

      if (isOnDashboard) {
        if (isLoggedIn) {
          return true;
        }
        return false; // Redirect to login
      }

      return true;
    },
  },
  providers: [
    // Google OAuth (Perlu Klarifikasi: AUTH_GOOGLE_ID, AUTH_GOOGLE_SECRET)
    ...(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET
      ? [
          Google({
            clientId: process.env.AUTH_GOOGLE_ID,
            clientSecret: process.env.AUTH_GOOGLE_SECRET,
            authorization: {
              params: {
                prompt: 'consent',
                access_type: 'offline',
                response_type: 'code',
              },
            },
          }),
        ]
      : []),
    // Microsoft Azure AD (Perlu Klarifikasi: AUTH_MICROSOFT_ID, AUTH_MICROSOFT_SECRET)
    // Commented out - requires separate package installation
    // ...(process.env.AUTH_MICROSOFT_ID && process.env.AUTH_MICROSOFT_SECRET
    //   ? [
    //       Microsoft({
    //         clientId: process.env.AUTH_MICROSOFT_ID,
    //         clientSecret: process.env.AUTH_MICROSOFT_SECRET,
    //         tenantId: process.env.AZURE_TENANT_ID || 'common',
    //       }),
    //     ]
    //   : []),
    // Credentials provider for development/fallback
    Credentials({
      credentials: {
        username: { label: 'Username', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          return null;
        }

        const dbUser = await db
          .select()
          .from(ajisUser)
          .where(eq(ajisUser.username, credentials.username as string))
          .limit(1);

        if (!dbUser.length) {
          return null;
        }

        const user = dbUser[0];

        if (user.lockedUntil && new Date() < new Date(user.lockedUntil)) {
          return null; // Locked
        }

        const isValidPassword = await bcrypt.compare(
          credentials.password as string,
          user.passwordHash
        );

        if (!isValidPassword) {
          const failedAttempts = (user.failedLoginAttempts || 0) + 1;
          const lockedUntil = failedAttempts >= 5 ? new Date(Date.now() + 15 * 60 * 1000).toISOString() : null;
          
          await db.update(ajisUser).set({
            failedLoginAttempts: failedAttempts,
            lockedUntil: lockedUntil as any,
          }).where(eq(ajisUser.id, user.id));

          await db.insert(ajisAuditLog).values({
            userId: Number(user.id),
            action: 'LOGIN_FAILED',
            details: { username: credentials.username },
          });

          return null;
        }

        if (user.aktif !== 'y') {
          return null;
        }

        await db.update(ajisUser).set({
          failedLoginAttempts: 0,
          lockedUntil: null,
        }).where(eq(ajisUser.id, user.id));

        // Fetch wilayah pembinaan assignments for this user
        const wilayahAssignments = await db
          .select({ wilayahPembinaanId: ajisUserWilayahPembinaan.wilayahPembinaanId })
          .from(ajisUserWilayahPembinaan)
          .where(eq(ajisUserWilayahPembinaan.userId, Number(user.id)));

        const wilayahIds = wilayahAssignments.map(w => Number(w.wilayahPembinaanId));

        await db.insert(ajisAuditLog).values({
          userId: Number(user.id),
          action: 'LOGIN_SUCCESS',
          details: { username: user.username },
        });

        return {
          id: String(user.id),
          username: user.username,
          email: user.email,
          id_group_user: Number(user.groupUserId),
          aktif: user.aktif,
          kantor_id: user.kantorId ? Number(user.kantorId) : null,
          id_wilayah_pembinaan: wilayahIds.length > 0 ? wilayahIds : undefined,
          mustResetPassword: user.mustResetPassword,
        } as any;
      },
    }),
  ],
};
