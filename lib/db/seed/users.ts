import { ajisGroupUser, ajisUser, ajisUserWilayahPembinaan, ajisWilayahPembinaan } from '@/db/schema';
import { hashPassword } from '@/lib/auth/password';
import { sql, inArray } from 'drizzle-orm';

export async function seedUsers(db: any, organizationData: any) {
  console.log('👤 Seeding user data...');

  const { kantor, wilayah } = organizationData;

  // Create maps for ID lookup
  const kantorByKode = new Map(kantor.map((k: any) => [k.kode, k]));
  const wilayahByKodeLama = new Map(wilayah.map((w: any) => [w.kodeLama, w]));

  // Helper functions
  const getKantorId = (kode: string) => {
    const k = kantorByKode.get(kode) as any;
    if (!k) throw new Error(`Kantor with kode ${kode} not found`);
    return Number(k.id);
  };

  const getWilayahId = (kodeLama: number) => {
    const w = wilayahByKodeLama.get(kodeLama) as any;
    if (!w) throw new Error(`Wilayah with kodeLama ${kodeLama} not found`);
    return Number(w.id);
  };

  // 1. Create user groups if not exist
  await db.insert(ajisGroupUser).values([
    { nama: 'Super Admin', keterangan: 'Full system access', aktif: 'y' },
    { nama: 'Branch Admin', keterangan: 'Office level access', aktif: 'y' },
    { nama: 'Regional Coordinator', keterangan: 'Regional operational access', aktif: 'y' },
  ]).onConflictDoNothing();

  // Get the created groups
  const groups = await db.select().from(ajisGroupUser).where(sql`${ajisGroupUser.aktif} = 'y'`);

  // 2. Create default Super Admin user
  const adminPassword = await hashPassword('Admin@123'); // CHANGE IN PRODUCTION
  await db.insert(ajisUser).values({
    username: 'superadmin',
    email: 'superadmin@rz-ajis.com',
    passwordHash: adminPassword,
    mustResetPassword: true,
    groupUserId: Number(groups[0].id),
    aktif: 'y',
    userInsert: 'system',
    dateInsert: new Date().toISOString(),
  }).onConflictDoNothing();

  // 3. Create test Branch Admin users (3 per kantor = 3 total)
  const branchPassword = await hashPassword('Branch@123');
  await db.insert(ajisUser).values([
    {
      username: 'branch_admin_jkt',
      email: 'branch_jkt@rz-ajis.com',
      passwordHash: branchPassword,
      mustResetPassword: true,
      groupUserId: Number(groups[1].id),
      kantorId: getKantorId('K001'), // Jakarta
      aktif: 'y',
      userInsert: 'system',
      dateInsert: new Date().toISOString(),
    },
    {
      username: 'branch_admin_bdg',
      email: 'branch_bdg@rz-ajis.com',
      passwordHash: branchPassword,
      mustResetPassword: true,
      groupUserId: Number(groups[1].id),
      kantorId: getKantorId('K002'), // Bandung
      aktif: 'y',
      userInsert: 'system',
      dateInsert: new Date().toISOString(),
    },
    {
      username: 'branch_admin_aceh',
      email: 'branch_aceh@rz-ajis.com',
      passwordHash: branchPassword,
      mustResetPassword: true,
      groupUserId: Number(groups[1].id),
      kantorId: getKantorId('K003'), // Aceh
      aktif: 'y',
      userInsert: 'system',
      dateInsert: new Date().toISOString(),
    },
  ]).onConflictDoNothing();

  // 4. Create test Korwil users (3 per wilayah = 9 total)
  const korwilPassword = await hashPassword('Korwil@123');
  await db.insert(ajisUser).values([
    { username: 'korwil_jkt_pusat', email: 'korwil_jkt_pusat@rz-ajis.com', passwordHash: korwilPassword, mustResetPassword: true, groupUserId: Number(groups[2].id), aktif: 'y', userInsert: 'system', dateInsert: new Date().toISOString() },
    { username: 'korwil_jkt_selatan', email: 'korwil_jkt_selatan@rz-ajis.com', passwordHash: korwilPassword, mustResetPassword: true, groupUserId: Number(groups[2].id), aktif: 'y', userInsert: 'system', dateInsert: new Date().toISOString() },
    { username: 'korwil_jkt_barat', email: 'korwil_jkt_barat@rz-ajis.com', passwordHash: korwilPassword, mustResetPassword: true, groupUserId: Number(groups[2].id), aktif: 'y', userInsert: 'system', dateInsert: new Date().toISOString() },
    { username: 'korwil_cibinong', email: 'korwil_cibinong@rz-ajis.com', passwordHash: korwilPassword, mustResetPassword: true, groupUserId: Number(groups[2].id), aktif: 'y', userInsert: 'system', dateInsert: new Date().toISOString() },
    { username: 'korwil_citeureup', email: 'korwil_citeureup@rz-ajis.com', passwordHash: korwilPassword, mustResetPassword: true, groupUserId: Number(groups[2].id), aktif: 'y', userInsert: 'system', dateInsert: new Date().toISOString() },
    { username: 'korwil_gunungputri', email: 'korwil_gunungputri@rz-ajis.com', passwordHash: korwilPassword, mustResetPassword: true, groupUserId: Number(groups[2].id), aktif: 'y', userInsert: 'system', dateInsert: new Date().toISOString() },
    { username: 'korwil_johan', email: 'korwil_johan@rz-ajis.com', passwordHash: korwilPassword, mustResetPassword: true, groupUserId: Number(groups[2].id), aktif: 'y', userInsert: 'system', dateInsert: new Date().toISOString() },
    { username: 'korwil_jantho', email: 'korwil_jantho@rz-ajis.com', passwordHash: korwilPassword, mustResetPassword: true, groupUserId: Number(groups[2].id), aktif: 'y', userInsert: 'system', dateInsert: new Date().toISOString() },
    { username: 'korwil_samatiga', email: 'korwil_samatiga@rz-ajis.com', passwordHash: korwilPassword, mustResetPassword: true, groupUserId: Number(groups[2].id), aktif: 'y', userInsert: 'system', dateInsert: new Date().toISOString() },
  ]).onConflictDoNothing();

  // 5. Assign regions to Korwil users based on username
  const korwilUsers = await db.select().from(ajisUser).where(sql`${ajisUser.username} LIKE 'korwil_%'`);
  
  console.log(`Found ${korwilUsers.length} Korwil users`);
  
  if (korwilUsers.length > 0 && wilayah.length > 0) {
    // Delete existing assignments for these users
    const korwilUserIds = korwilUsers.map((user: any) => Number(user.id));
    console.log(`Deleting existing assignments for user IDs:`, korwilUserIds);
    await db.delete(ajisUserWilayahPembinaan).where(inArray(ajisUserWilayahPembinaan.userId, korwilUserIds));
    
    // Map username to wilayah kodeLama
    const usernameToWilayah: Record<string, number> = {
      'korwil_jkt_pusat': 1,
      'korwil_jkt_selatan': 2,
      'korwil_jkt_barat': 3,
      'korwil_cibinong': 4,
      'korwil_citeureup': 5,
      'korwil_gunungputri': 6,
      'korwil_johan': 7,
      'korwil_jantho': 8,
      'korwil_samatiga': 9,
    };
    
    // Insert new assignments based on username
    const userWilayahAssignments = korwilUsers
      .filter((user: any) => usernameToWilayah[user.username])
      .map((user: any) => ({
        userId: Number(user.id),
        wilayahPembinaanId: getWilayahId(usernameToWilayah[user.username]),
      }));

    console.log(`Inserting ${userWilayahAssignments.length} wilayah assignments:`, userWilayahAssignments);
    await db.insert(ajisUserWilayahPembinaan).values(userWilayahAssignments);
    
    // Verify assignments
    const verifyAssignments = await db.select().from(ajisUserWilayahPembinaan);
    console.log(`Total wilayah assignments in database: ${verifyAssignments.length}`);
  }

  console.log('✅ User seeding completed');
  console.log('📝 Default credentials (CHANGE IN PRODUCTION):');
  console.log('   Super Admin: superadmin / Admin@123');
  console.log('   Branch Admins: branch_admin_jkt, branch_admin_bdg, branch_admin_aceh / Branch@123');
  console.log('   Korwils: korwil_jkt_pusat, korwil_jkt_selatan, korwil_jkt_barat, korwil_cibinong, korwil_citeureup, korwil_gunungputri, korwil_johan, korwil_jantho, korwil_samatiga / Korwil@123');
}
