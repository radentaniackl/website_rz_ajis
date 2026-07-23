import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const user = req.auth?.user as any;
  const pathname = req.nextUrl.pathname;

  // Fast path: skip auth checks for public routes
  if (pathname.startsWith('/login') || pathname.startsWith('/api')) {
    return NextResponse.next();
  }

  // Protected routes check
  const isProtectedRoute = pathname.startsWith('/dashboard') ||
    pathname.startsWith('/anak') ||
    pathname.startsWith('/sesi') ||
    pathname.startsWith('/hafalan') ||
    pathname.startsWith('/evaluasi') ||
    pathname.startsWith('/laporan') ||
    pathname.startsWith('/kantor') ||
    pathname.startsWith('/wilayah') ||
    pathname.startsWith('/users') ||
    pathname.startsWith('/settings');

  if (!isProtectedRoute) {
    return NextResponse.next();
  }

  // Require authentication for protected routes
  if (!isLoggedIn) {
    return NextResponse.redirect(new URL('/login', req.nextUrl));
  }

  // Force reset password if needed
  if (user?.mustResetPassword && !pathname.startsWith('/reset-password')) {
    return NextResponse.redirect(new URL('/reset-password', req.nextUrl));
  }

  // RBAC checks
  const role = user?.id_group_user;

  // Super Admin only routes
  if (pathname.startsWith('/kantor') || pathname.startsWith('/settings')) {
    if (role !== 1) {
      return NextResponse.redirect(new URL('/unauthorized', req.nextUrl));
    }
  }

  // Branch Admin & Super Admin routes
  if (pathname.startsWith('/wilayah') || pathname.startsWith('/users')) {
    if (role !== 1 && role !== 2) {
      return NextResponse.redirect(new URL('/unauthorized', req.nextUrl));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
