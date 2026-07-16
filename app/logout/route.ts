import { NextResponse } from 'next/server'
import { signOut } from '@/auth'

export async function GET(request: Request) {
  // Perform server-side sign out and redirect to login
  try {
    await signOut({ redirectTo: '/login' })
  } catch (err) {
    // ignore errors; still redirect to login
  }

  return NextResponse.redirect(new URL('/login', request.url))
}

export async function POST(request: Request) {
  return GET(request)
}
