'use server';

import { signIn, signOut } from '@/auth';
import { loginSchema, LoginInput, resetPasswordSchema, ResetPasswordInput } from '@/lib/validations/auth';
import { AuthError } from 'next-auth';
import { db } from '@/lib/db';
import { ajisUser } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { hashPassword } from '@/lib/auth/password';

export async function loginAction(data: LoginInput, redirectTo?: string) {
  try {
    const validatedData = loginSchema.parse(data);

    await signIn('credentials', {
      username: validatedData.username,
      password: validatedData.password,
      redirect: false,
    });

    return { success: true, redirectTo: redirectTo || '/dashboard' };
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case 'CredentialsSignin':
          return { success: false, error: 'Username atau password salah atau akun terkunci.' };
        case 'AccessDenied':
          return { success: false, error: 'Akses ditolak.' };
        default:
          return { success: false, error: 'Terjadi kesalahan saat login.' };
      }
    }
    
    // Zod validation error or other unexpected error
    return { success: false, error: 'Data tidak valid atau terjadi kesalahan sistem.' };
  }
}

export async function logoutAction() {
  await signOut({ redirectTo: '/login' });
}

export async function resetPasswordAction(username: string, data: ResetPasswordInput) {
  try {
    const validatedData = resetPasswordSchema.parse(data);

    const user = await db.select().from(ajisUser).where(eq(ajisUser.username, username)).limit(1);

    if (!user.length) {
      console.error('User not found:', username);
      return { success: false, error: 'User tidak ditemukan.' };
    }

    console.log('User found:', user[0].username);

    const hashedPassword = await hashPassword(validatedData.password);
    console.log('Password hashed successfully');

    await db.update(ajisUser)
      .set({ 
        passwordHash: hashedPassword,
        mustResetPassword: false,
        failedLoginAttempts: 0,
        lockedUntil: null
      })
      .where(eq(ajisUser.id, user[0].id));

    console.log('Password updated successfully');
    return { success: true };
  } catch (error) {
    console.error('Reset password error:', error);
    return { success: false, error: 'Terjadi kesalahan saat mereset password.' };
  }
}
