import { config } from 'dotenv';
config({ path: '.env.local' });

import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import { ajisGroupUser, ajisKantor, ajisUser } from '@/db/schema';
import bcrypt from 'bcryptjs';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set');
}

const sql = neon(process.env.DATABASE_URL);
const db = drizzle(sql);

async function seed() {
  console.log('🌱 Starting database seed...\n');

  // ─── 1. SEED GROUP USER (ROLES) ──────────────────────────────────────────
  console.log('📋 Seeding group users (roles)...');
  await db.insert(ajisGroupUser).values([
    {
      id: BigInt(1),
      nama: 'Super Admin',
      keterangan: 'Akses penuh ke seluruh sistem',
      aktif: 'y',
    },
    {
      id: BigInt(2),
      nama: 'Branch Admin',
      keterangan: 'Akses terbatas pada kantor cabang tertentu',
      aktif: 'y',
    },
    {
      id: BigInt(9),
      nama: 'Korwil',
      keterangan: 'Koordinator wilayah pembinaan',
      aktif: 'y',
    },
  ]).onConflictDoNothing();
  console.log('  ✅ Group users seeded.\n');

  // ─── 2. SEED KANTOR PUSAT ────────────────────────────────────────────────
  console.log('🏢 Seeding kantor pusat...');
  await db.insert(ajisKantor).values([
    {
      kode: '00-001',
      nama: 'Kantor Pusat AJIS',
      alamat: 'Jakarta Pusat',
      aktif: 'y',
    },
  ]).onConflictDoNothing();
  console.log('  ✅ Kantor seeded.\n');

  // ─── 3. SEED USER SUPER ADMIN ────────────────────────────────────────────
  console.log('👤 Seeding super admin user...');
  const hashedPassword = await bcrypt.hash('Admin@AJIS2025!', 12);

  await db.insert(ajisUser).values([
    {
      username: 'superadmin',
      passwordHash: hashedPassword,
      mustResetPassword: true,
      groupUserId: 1,
      kantorId: 1,
      aktif: 'y',
      userInsert: 'system',
    },
  ]).onConflictDoNothing();
  console.log('  ✅ Super admin user seeded.\n');

  console.log('🎉 Database seed completed successfully!');
  console.log('');
  console.log('  Default credentials:');
  console.log('  Username: superadmin');
  console.log('  Password: Admin@AJIS2025!');
  console.log('  ⚠️  Change this password after first login!');
}

seed().catch((error) => {
  console.error('❌ Seed failed:', error);
  process.exit(1);
});
