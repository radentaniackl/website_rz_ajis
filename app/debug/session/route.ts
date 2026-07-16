import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'

export async function GET(request: Request) {
  try {
    const session = await auth()
    return NextResponse.json({ ok: true, session })
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 })
  }
}
