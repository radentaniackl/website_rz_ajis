import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const user = req.auth?.user as any;
  
  const pathname = req.nextUrl.pathname;
  const isOnAuthPage = pathname.startsWith('/login');
  const isOnResetPassword = pathname.startsWith('/reset-password');
  
  const isProtectedRoute = [
    '/dashboard', '/anak', '/sesi', '/hafalan', '/evaluasi', 
    '/laporan', '/kantor', '/wilayah', '/users', '/settings'
  ].some(route => pathname.startsWith(route));

  // 1. Auth Page Logic
  if (isOnAuthPage) {
    // Allow access to the auth page (`/login`) even when already logged in.
    // This prevents automatic redirection away from the login page so the
    // root route can redirect there unconditionally if desired.
    return NextResponse.next();
  }

  // 2. Protected Routes Logic
  if (isProtectedRoute) {
    if (!isLoggedIn) {
      return NextResponse.redirect(new URL('/login', req.nextUrl));
    }

    // 3. Force Reset Password
    if (user?.mustResetPassword && !isOnResetPassword) {
      return NextResponse.redirect(new URL('/reset-password', req.nextUrl));
    }

    // 4. RBAC Route Protection
    const role = user?.id_group_user;

    // Super Admin Only Routes
    const isSuperAdminOnly = ['/kantor', '/settings'].some(route => pathname.startsWith(route));
    if (isSuperAdminOnly && role !== 1) {
      return NextResponse.redirect(new URL('/unauthorized', req.nextUrl));
    }

    // Branch Admin & Super Admin Routes
    const isBranchOrSuperAdmin = ['/wilayah', '/users'].some(route => pathname.startsWith(route));
    if (isBranchOrSuperAdmin && role !== 1 && role !== 2) {
      return NextResponse.redirect(new URL('/unauthorized', req.nextUrl));
    }

    return NextResponse.next();
  }

  // Allow logged-in users to access reset-password to change their password voluntarily.
  // If not logged in, redirect to login page when trying to access reset-password.
  if (isOnResetPassword && !isLoggedIn) {
    return NextResponse.redirect(new URL('/login', req.nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
