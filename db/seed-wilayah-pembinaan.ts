import { sql } from "drizzle-orm";
import { db } from '@/lib/db';
import {
  refPropinsi,
  refKabupaten,
  refKecamatan,
  refDesa,
  ajisKantor,
  ajisWilayahPembinaan,
  ajisUserWilayahPembinaan,
  ajisAnak,
  ajisSdmWilayah,
  ajisGroupUser,
  ajisUser,
} from '@/lib/db/schema';

/**
 * Seed Data untuk Wilayah Pembinaan dan Data Terkait
 * 
 * Struktur data yang di-seed:
 * 1. Geographic Reference (3 levels): Propinsi → Kabupaten → Kecamatan → Desa
 * 2. Organization: Kantor (3 rows)
 * 3. Wilayah Pembinaan (3 rows)
 * 4. User & User-Wilayah Assignment (untuk RBAC demo)
 * 5. Related Data: Anak & SDM Wilayah (untuk demo korelasi)
 */

export async function seedWilayahPembinaanData() {
  console.log('🌱 Seeding Wilayah Pembinaan data...');

  try {
    // ─── 1. GEOGRAPHIC REFERENCE DATA ────────────────────────────────────────────────
    
    // Propinsi (3 rows)
    // Contoh data propinsi
    const propinsiData = [
      { kode: '31', nama: 'DKI Jakarta', aktif: 'y' },
      { kode: '32', nama: 'Jawa Barat', aktif: 'y' },
      { kode: '33', nama: 'Jawa Tengah', aktif: 'y' },
    ];

    const insertedPropinsi = await db
      .insert(refPropinsi)
      .values(propinsiData)
      .onConflictDoUpdate({
        target: refPropinsi.kode, // Kolom unik untuk pengecekan konflik
        set: { nama: sql`excluded.nama` },
      })
      .returning();

    console.log(`✅ Inserted ${insertedPropinsi.length} propinsi`);

    // Kabupaten (3 rows - 1 per propinsi)
    const kabupatenData = [
      {
        kode: '3171',
        propinsiId: insertedPropinsi[0].id,
        nama: 'Jakarta Pusat',
        isKota: true,
        kodeOid: '3171',
        ibukota: 'Jakarta Pusat',
        lat: -6.1754,
        lng: 106.8272,
        aktif: 'y',
      },
      {
        kode: '3201',
        propinsiId: insertedPropinsi[1].id,
        nama: 'Bandung',
        isKota: true,
        kodeOid: '3201',
        ibukota: 'Bandung',
        lat: -6.9175,
        lng: 107.6191,
        aktif: 'y',
      },
      {
        kode: '3371',
        propinsiId: insertedPropinsi[2].id,
        nama: 'Semarang',
        isKota: true,
        kodeOid: '3371',
        ibukota: 'Semarang',
        lat: -6.9667,
        lng: 110.4167,
        aktif: 'y',
      },
    ];

    const insertedKabupaten = await db
      .insert(refKabupaten)
      .values(kabupatenData)
      .onConflictDoUpdate({
        target: refKabupaten.kode, // Sesuaikan dengan kolom unik di tabel Anda
        set: { nama: sql`excluded.nama` }, // Update data jika sudah ada
      })
      .returning();

    console.log(`✅ Inserted ${insertedKabupaten.length} kabupaten`);

    // Kecamatan (3 rows - 1 per kabupaten)
    const kecamatanData = [
      {
        kode: '3171010',
        kabupatenId: insertedKabupaten[0].id,
        nama: 'Gambir',
        kodepos: '10110',
        aktif: 'y',
      },
      {
        kode: '3201010',
        kabupatenId: insertedKabupaten[1].id,
        nama: 'Coblong',
        kodepos: '40126',
        aktif: 'y',
      },
      {
        kode: '3371010',
        kabupatenId: insertedKabupaten[2].id,
        nama: 'Semarang Tengah',
        kodepos: '50131',
        aktif: 'y',
      },
    ];

    const insertedKecamatan = await db
      .insert(refKecamatan)
      .values(kecamatanData)
      .onConflictDoUpdate({
        target: refKecamatan.kode,
        set: { nama: sql`excluded.nama` },
      })
      .returning();

    console.log(`✅ Inserted ${insertedKecamatan.length} kecamatan`);

    // Desa (3 rows - 1 per kecamatan)
    const desaData = [
      {
        kode: '3171010001',
        kecamatanId: insertedKecamatan[0].id,
        nama: 'Gambir',
        isKelurahan: true,
        nomorIndukDesa: '3171010001',
        aktif: 'y',
      },
      {
        kode: '3201010001',
        kecamatanId: insertedKecamatan[1].id,
        nama: 'Cipaganti',
        isKelurahan: true,
        nomorIndukDesa: '3201010001',
        aktif: 'y',
      },
      {
        kode: '3371010001',
        kecamatanId: insertedKecamatan[2].id,
        nama: 'Karangkidul',
        isKelurahan: true,
        nomorIndukDesa: '3371010001',
        aktif: 'y',
      },
    ];

    const insertedDesa = await db
      .insert(refDesa)
      .values(desaData)
      .onConflictDoUpdate({
        target: refDesa.kode,
        set: { nama: sql`excluded.nama` },
      })
      .returning();

    console.log(`✅ Inserted ${insertedDesa.length} desa`);

    // ─── 2. ORGANIZATION DATA (KANTOR) ──────────────────────────────────────────────

    // Kantor (3 rows)
    const kantorData = [
      {
        kode: '09-218',
        nama: 'Kantor Pusat Jakarta',
        alamat: 'Jl. Sudirman No. 1, Jakarta Pusat',
        noTelp: '021-1234567',
        parentId: null,
        parentSecondId: null,
        kodeProgramRz: 'ANAK-JUARA',
        jenis: 'pusat',
        kodeKantorLegacy: 'KPT-JKT',
        aktif: 'y',
      },
      {
        kode: '09-219',
        nama: 'Kantor Cabang Bandung',
        alamat: 'Jl. Asia Afrika No. 100, Bandung',
        noTelp: '022-7654321',
        parentId: null,
        parentSecondId: null,
        kodeProgramRz: 'ANAK-JUARA',
        jenis: 'cabang',
        kodeKantorLegacy: 'KCB-BDG',
        aktif: 'y',
      },
      {
        kode: '09-220',
        nama: 'Kantor Cabang Semarang',
        alamat: 'Jl. Pemuda No. 50, Semarang',
        noTelp: '024-8765432',
        parentId: null,
        parentSecondId: null,
        kodeProgramRz: 'ANAK-JUARA',
        jenis: 'cabang',
        kodeKantorLegacy: 'KCB-SMG',
        aktif: 'y',
      },
    ];

    const insertedKantor = await db
      .insert(ajisKantor)
      .values(kantorData)
      .onConflictDoUpdate({
        target: ajisKantor.kode, // Pastikan kolom ini benar-benar unik/primary key di tabel ajisKantor
        set: { nama: sql`excluded.nama` },
      })
      .returning();

    console.log(`✅ Inserted ${insertedKantor.length} kantor`);

    // ─── 3. WILAYAH PEMBINAAN (3 rows) ───────────────────────────────────────────────

    const wilayahData = [
      {
        kodeLama: 1,
        namaWilayah: 'Wilayah Pembinaan Gambir',
        alamatWilayah: 'Jl. Gambir Raya No. 10, Jakarta Pusat',
        kantorId: insertedKantor[0].id,
        desaId: insertedDesa[0].id,
        statusApprove: 'y',
        aktif: 'y',
        userInsert: 'system',
        dateInsert: new Date(),
      },
      {
        kodeLama: 2,
        namaWilayah: 'Wilayah Pembinaan Cipaganti',
        alamatWilayah: 'Jl. Cipaganti No. 25, Bandung',
        kantorId: insertedKantor[1].id,
        desaId: insertedDesa[1].id,
        statusApprove: 'y',
        aktif: 'y',
        userInsert: 'system',
        dateInsert: new Date(),
      },
      {
        kodeLama: 3,
        namaWilayah: 'Wilayah Pembinaan Karangkidul',
        alamatWilayah: 'Jl. Karangkidul No. 15, Semarang',
        kantorId: insertedKantor[2].id,
        desaId: insertedDesa[2].id,
        statusApprove: 'y',
        aktif: 'y',
        userInsert: 'system',
        dateInsert: new Date(),
      },
    ];

   const insertedWilayah = await db
      .insert(ajisWilayahPembinaan) // Pastikan nama variabel ini sesuai dengan import di atas
      .values(wilayahData)
      .onConflictDoUpdate({
        target: ajisWilayahPembinaan.kodeLama, // Sesuai dengan CONSTRAINT UNIQUE(kode_lama) di SQL
        set: { namaWilayah: sql`excluded.nama_wilayah` },
      })
      .returning();

    console.log(`✅ Inserted ${insertedWilayah.length} wilayah pembinaan`);

   // ─── 4. USER GROUP & USER DATA (untuk RBAC demo) ───────────────────────────────

   // ─── 4. USER GROUP & USER DATA (untuk RBAC demo) ───────────────────────────────

    // Group User
    const groupUserData = [
      { nama: 'Super Admin', keterangan: 'Full access to all data', aktif: 'y' },
      { nama: 'Branch Admin', keterangan: 'Access to office data', aktif: 'y' },
      { nama: 'Regional Coordinator', keterangan: 'Access to assigned regions', aktif: 'y' },
    ];

    // Insert menggunakan onConflictDoNothing agar aman
    await db
      .insert(ajisGroupUser)
      .values(groupUserData)
      .onConflictDoNothing();

    // Ambil kembali data group user dari database untuk memastikan ID-nya selalu ada
    const insertedGroupUser = await db.select().from(ajisGroupUser);
    console.log(`✅ Loaded/Inserted ${insertedGroupUser.length} group user`);

    // User (untuk demo RBAC)
    const userData = [
      {
        kodeLama: 1,
        username: 'superadmin',
        passwordHash: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYFqWq4jy4i',
        mustResetPassword: false,
        nik: '1234567890123456',
        kantorId: insertedKantor[0].id,
        groupUserId: insertedGroupUser[0].id,
        aktif: 'y',
        userInsert: 'system',
        dateInsert: new Date(),
      },
      {
        kodeLama: 2,
        username: 'admin_bandung',
        passwordHash: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYFqWq4jy4i',
        mustResetPassword: false,
        nik: '1234567890123457',
        kantorId: insertedKantor[1].id,
        groupUserId: insertedGroupUser[1].id,
        aktif: 'y',
        userInsert: 'system',
        dateInsert: new Date(),
      },
      {
        kodeLama: 3,
        username: 'korwil_semarang',
        passwordHash: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYFqWq4jy4i',
        mustResetPassword: false,
        nik: '1234567890123458',
        kantorId: insertedKantor[2].id,
        groupUserId: insertedGroupUser[2].id,
        aktif: 'y',
        userInsert: 'system',
        dateInsert: new Date(),
      },
    ];

    await db
      .insert(ajisUser)
      .values(userData)
      .onConflictDoNothing();

    // Ambil kembali data user dari database untuk memastikan ID-nya tersedia
    const insertedUser = await db.select().from(ajisUser);
    console.log(`✅ Loaded/Inserted ${insertedUser.length} user`);

    // User-Wilayah Assignment (untuk RBAC Korwil)
    const userWilayahData = [
      {
        userId: insertedUser[2].id, // korwil_semarang
        wilayahPembinaanId: insertedWilayah[2].id, // Wilayah Karangkidul
      },
    ];

    await db
      .insert(ajisUserWilayahPembinaan)
      .values(userWilayahData)
      .onConflictDoNothing(); // Aman karena tidak pakai .returning()

    console.log(`✅ Inserted user-wilayah assignments for RBAC demo`);

    // ─── 5. RELATED DATA (Anak & SDM Wilayah) ───────────────────────────────────────

    // ─── 5. RELATED DATA (Anak & SDM Wilayah) ───────────────────────────────────────

    // SDM Wilayah
    const sdmData = [
      {
        kodeLama: 1,
        nik: '1111111111111111',
        namaLengkap: 'Ahmad Fauzi',
        jenisKelamin: 'l',
        alamat: 'Jl. Gambir No. 5',
        desaId: insertedDesa[0].id,
        jenjangPendidikan: 'S1',
        tglBergabung: new Date('2020-01-15'),
        telp: '081234567890',
        hp: '081234567890',
        email: 'ahmad@example.com',
        keterangan: 'Pembina senior',
        keaktifanEdukasi: 'y',
        aktif: 'y',
        penugasanWilayahId: insertedWilayah[0].id,
        penugasanKantorId: insertedKantor[0].id,
        penugasanFungsiStruktur: 'PEMBINA',
        penugasanKeaktifanEdukasi: 'y',
        userInsert: 'system',
        dateInsert: new Date(),
      },
      {
        kodeLama: 2,
        nik: '2222222222222222',
        namaLengkap: 'Siti Aminah',
        jenisKelamin: 'p',
        alamat: 'Jl. Cipaganti No. 10',
        desaId: insertedDesa[1].id,
        jenjangPendidikan: 'D3',
        tglBergabung: new Date('2021-03-20'),
        telp: '082345678901',
        hp: '082345678901',
        email: 'siti@example.com',
        keterangan: 'Pembina junior',
        keaktifanEdukasi: 'y',
        aktif: 'y',
        penugasanWilayahId: insertedWilayah[1].id,
        penugasanKantorId: insertedKantor[1].id,
        penugasanFungsiStruktur: 'PEMBINA',
        penugasanKeaktifanEdukasi: 'y',
        userInsert: 'system',
        dateInsert: new Date(),
      },
      {
        kodeLama: 3,
        nik: '3333333333333333',
        namaLengkap: 'Budi Santoso',
        jenisKelamin: 'l',
        alamat: 'Jl. Karangkidul No. 8',
        desaId: insertedDesa[2].id,
        jenjangPendidikan: 'S1',
        tglBergabung: new Date('2019-06-10'),
        telp: '083456789012',
        hp: '083456789012',
        email: 'budi@example.com',
        keterangan: 'Koordinator Wilayah',
        keaktifanEdukasi: 'y',
        aktif: 'y',
        penugasanWilayahId: insertedWilayah[2].id,
        penugasanKantorId: insertedKantor[2].id,
        penugasanFungsiStruktur: 'KORWIL',
        penugasanKeaktifanEdukasi: 'y',
        userInsert: 'system',
        dateInsert: new Date(),
      },
    ];

    await db
      .insert(ajisSdmWilayah)
      .values(sdmData)
      .onConflictDoNothing();

    const insertedSdm = await db.select().from(ajisSdmWilayah);
    console.log(`✅ Loaded/Inserted ${insertedSdm.length} SDM wilayah`);

    // Anak
    // Anak
    const anakData = [
      {
        kodeAnak: 'AJ-2024-001',
        nik: '4444444444444444',
        namaLengkap: 'Muhammad Rizky',
        jnsKel: 'l', // Ubah dari jenisKelamin menjadi jnsKel
        tglLahir: new Date('2012-05-10'),
        desaId: insertedDesa[0].id,
        kantorId: insertedKantor[0].id,
        wilayahPembinaanId: insertedWilayah[0].id,
        tglAwalPembinaan: new Date('2023-01-15'),
        statusPembinaan: 'aktif',
        aktif: 'y',
        userInsert: 'system',
        dateInsert: new Date(),
      },
      {
        kodeAnak: 'AJ-2024-002',
        nik: '5555555555555555',
        namaLengkap: 'Nur Halimah',
        jnsKel: 'p', // Ubah dari jenisKelamin menjadi jnsKel
        tglLahir: new Date('2013-08-22'),
        desaId: insertedDesa[1].id,
        kantorId: insertedKantor[1].id,
        wilayahPembinaanId: insertedWilayah[1].id,
        tglAwalPembinaan: new Date('2023-03-10'),
        statusPembinaan: 'aktif',
        aktif: 'y',
        userInsert: 'system',
        dateInsert: new Date(),
      },
      {
        kodeAnak: 'AJ-2024-003',
        nik: '6666666666666666',
        namaLengkap: 'Dewi Kartika',
        jnsKel: 'p', // Ubah dari jenisKelamin menjadi jnsKel
        tglLahir: new Date('2014-12-05'),
        desaId: insertedDesa[2].id,
        kantorId: insertedKantor[2].id,
        wilayahPembinaanId: insertedWilayah[2].id,
        tglAwalPembinaan: new Date('2023-06-20'),
        statusPembinaan: 'aktif',
        aktif: 'y',
        userInsert: 'system',
        dateInsert: new Date(),
      },
    ];

    await db
      .insert(ajisAnak)
      .values(anakData)
      .onConflictDoNothing();

    const insertedAnak = await db.select().from(ajisAnak);
    console.log(`✅ Loaded/Inserted ${insertedAnak.length} anak`);
    // ─── SUMMARY ───────────────────────────────────────────────────────────────────

    console.log('\n📊 SEED SUMMARY:');
    console.log('========================================');
    console.log(`Geographic Data:`);
    console.log(`  - Propinsi: ${insertedPropinsi.length}`);
    console.log(`  - Kabupaten: ${insertedKabupaten.length}`);
    console.log(`  - Kecamatan: ${insertedKecamatan.length}`);
    console.log(`  - Desa: ${insertedDesa.length}`);
    console.log(`\nOrganization Data:`);
    console.log(`  - Kantor: ${insertedKantor.length}`);
    console.log(`\nWilayah Pembinaan Data:`);
    console.log(`  - Wilayah Pembinaan: ${insertedWilayah.length}`);
    console.log(`\nUser & RBAC Data:`);
    console.log(`  - Group User: ${insertedGroupUser.length}`);
    console.log(`  - User: ${insertedUser.length}`);
    console.log(`  - User-Wilayah Assignment: ${userWilayahData.length}`);
    console.log(`\nRelated Data:`);
    console.log(`  - SDM Wilayah: ${insertedSdm.length}`);
    console.log(`  - Anak: ${insertedAnak.length}`);
    console.log('========================================\n');

    console.log('✅ Wilayah Pembinaan seed data completed successfully!\n');

    return {
      success: true,
      data: {
        propinsi: insertedPropinsi,
        kabupaten: insertedKabupaten,
        kecamatan: insertedKecamatan,
        desa: insertedDesa,
        kantor: insertedKantor,
        wilayah: insertedWilayah,
        groupUser: insertedGroupUser,
        user: insertedUser,
        sdm: insertedSdm,
        anak: insertedAnak,
      },
    };
  } catch (error) {
    console.error('❌ Error seeding wilayah pembinaan data:', error);
    throw error;
  }
}

// Run seed if executed directly
if (require.main === module) {
  seedWilayahPembinaanData()
    .then(() => {
      console.log('✅ Seed completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Seed failed:', error);
      process.exit(1);
    });
}
