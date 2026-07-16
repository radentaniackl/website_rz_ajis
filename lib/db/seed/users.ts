import { db } from '../index';
import { ajisGroupUser, ajisUser, ajisUserWilayahPembinaan } from '@/db/schema';
import { hashPassword } from '@/lib/auth/password';

export async function seedUsers() {
  console.log('🌱 Seeding user data...');

  // 1. Create user groups if not exist
  const groups = await db.insert(ajisGroupUser).values([
    { id: 1, nama: 'Super Admin', keterangan: 'Full system access', aktif: 'y' },
    { id: 2, nama: 'Branch Admin', keterangan: 'Office level access', aktif: 'y' },
    { id: 9, nama: 'Regional Coordinator', keterangan: 'Regional operational access', aktif: 'y' },
  ]).onConflictDoNothing();

  // 2. Create default Super Admin user
  const adminPassword = await hashPassword('Admin@123'); // CHANGE IN PRODUCTION
  const adminUser = await db.insert(ajisUser).values({
    username: 'superadmin',
    passwordHash: adminPassword,
    mustResetPassword: true,
    groupUserId: 1,
    aktif: 'y',
    userInsert: 'system',
    dateInsert: new Date(),
  }).onConflictDoNothing().returning();

  // 3. Create test Branch Admin user
  const branchPassword = await hashPassword('Branch@123');
  const branchUser = await db.insert(ajisUser).values({
    username: 'branch_admin',
    passwordHash: branchPassword,
    mustResetPassword: true,
    groupUserId: 2,
    kantorId: 1, // Assuming kantor with id=1 exists
    aktif: 'y',
    userInsert: 'system',
    dateInsert: new Date(),
  }).onConflictDoNothing().returning();

  // 4. Create test Korwil user
  const korwilPassword = await hashPassword('Korwil@123');
  const korwilUser = await db.insert(ajisUser).values({
    username: 'korwil',
    passwordHash: korwilPassword,
    mustResetPassword: true,
    groupUserId: 9,
    aktif: 'y',
    userInsert: 'system',
    dateInsert: new Date(),
  }).onConflictDoNothing().returning();

  // 5. Assign regions to Korwil (if wilayah data exists)
  if (korwilUser.length > 0) {
    await db.insert(ajisUserWilayahPembinaan).values({
      userId: korwilUser[0].id,
      wilayahPembinaanId: 1, // Assuming wilayah with id=1 exists
    }).onConflictDoNothing();
  }

  console.log('✅ User seeding completed');
  console.log('📝 Default credentials (CHANGE IN PRODUCTION):');
  console.log('   Super Admin: admin / Admin@123');
  console.log('   Branch Admin: branch_admin / Branch@123');
  console.log('   Korwil: korwil / Korwil@123');
}
