#!/usr/bin/env tsx
import { db } from '@/lib/db'
import { ajisUser } from '@/db/schema'
import { eq } from 'drizzle-orm'

async function run() {
  const arg = process.argv[2]
  if (!arg) {
    console.error('Usage: tsx scripts/activate-user.ts <username|id>')
    process.exit(1)
  }

  try {
    if (/^\d+$/.test(arg)) {
      const id = BigInt(arg)
      await db.update(ajisUser).set({ aktif: 'y' }).where(eq(ajisUser.id, id))
      console.log(`Activated user id=${arg}`)
    } else {
      const username = arg
      await db.update(ajisUser).set({ aktif: 'y' }).where(eq(ajisUser.username, username))
      console.log(`Activated user username=${username}`)
    }
  } catch (err) {
    console.error('Error activating user:', err)
    process.exit(2)
  }
}

run()
