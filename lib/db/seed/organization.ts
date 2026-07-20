import { db } from '@/lib/db';
import { ajisKantor, ajisWilayahPembinaan } from '@/db/schema';
import { seedGeographic } from './geographic';

export async function seedOrganization() {
  console.log('🏢 Seeding organization data...');

  const { desa } = await seedGeographic();

  // Kantor (3 records)
  const kantorData = [
    {
      kode: 'K001',
      nama: 'Kantor Pusat RZ Jakarta',
      alamat: 'Jl. Sudirman No. 123, Jakarta Pusat',
      noTelp: '021-12345678',
      parentId: null,
      parentSecondId: null,
      kodeProgramRz: 'RZ-JKT',
      jenis: 'Pusat',
      kodeKantorLegacy: 'K001',
      aktif: 'y',
    },
    {
      kode: 'K002',
      nama: 'Kantor Cabang RZ Bandung',
      alamat: 'Jl. Asia Afrika No. 456, Bandung',
      noTelp: '022-87654321',
      parentId: null,
      parentSecondId: null,
      kodeProgramRz: 'RZ-BDG',
      jenis: 'Cabang',
      kodeKantorLegacy: 'K002',
      aktif: 'y',
    },
    {
      kode: 'K003',
      nama: 'Kantor Cabang RZ Aceh',
      alamat: 'Jl. Teuku Umar No. 789, Banda Aceh',
      noTelp: '0651-11122233',
      parentId: null,
      parentSecondId: null,
      kodeProgramRz: 'RZ-ACEH',
      jenis: 'Cabang',
      kodeKantorLegacy: 'K003',
      aktif: 'y',
    },
  ];

  const insertedKantor = await db.insert(ajisKantor).values(kantorData).returning();
  console.log(`✅ Inserted ${insertedKantor.length} kantor`);

  // Wilayah Pembinaan (3 per kantor = 9 total)
  const wilayahData = [
    // Kantor Pusat Jakarta
    {
      kodeLama: 1,
      namaWilayah: 'Wilayah Pembinaan Jakarta Pusat',
      alamatWilayah: 'Jl. Sudirman No. 123, Jakarta Pusat',
      kantorId: Number(insertedKantor[0].id),
      desaId: Number(desa[9].id), // Gambir
      statusApprove: 'y',
      aktif: 'y',
      userInsert: 'seed',
      dateInsert: new Date().toISOString().split('T')[0],
    },
    {
      kodeLama: 2,
      namaWilayah: 'Wilayah Pembinaan Jakarta Selatan',
      alamatWilayah: 'Jl. Fatmawati No. 100, Jakarta Selatan',
      kantorId: Number(insertedKantor[0].id),
      desaId: Number(desa[10].id), // Kebon Kelapa
      statusApprove: 'y',
      aktif: 'y',
      userInsert: 'seed',
      dateInsert: new Date().toISOString().split('T')[0],
    },
    {
      kodeLama: 3,
      namaWilayah: 'Wilayah Pembinaan Jakarta Barat',
      alamatWilayah: 'Jl. Palmerah No. 50, Jakarta Barat',
      kantorId: Number(insertedKantor[0].id),
      desaId: Number(desa[11].id), // Petojo Utara
      statusApprove: 'y',
      aktif: 'y',
      userInsert: 'seed',
      dateInsert: new Date().toISOString().split('T')[0],
    },
    // Kantor Cabang Bandung
    {
      kodeLama: 4,
      namaWilayah: 'Wilayah Pembinaan Cibinong',
      alamatWilayah: 'Jl. Raya Cibinong No. 200, Cibinong',
      kantorId: Number(insertedKantor[1].id),
      desaId: Number(desa[6].id), // Cibinong
      statusApprove: 'y',
      aktif: 'y',
      userInsert: 'seed',
      dateInsert: new Date().toISOString().split('T')[0],
    },
    {
      kodeLama: 5,
      namaWilayah: 'Wilayah Pembinaan Citeureup',
      alamatWilayah: 'Jl. Raya Citeureup No. 150, Citeureup',
      kantorId: Number(insertedKantor[1].id),
      desaId: Number(desa[7].id), // Ciriung
      statusApprove: 'y',
      aktif: 'y',
      userInsert: 'seed',
      dateInsert: new Date().toISOString().split('T')[0],
    },
    {
      kodeLama: 6,
      namaWilayah: 'Wilayah Pembinaan Gunung Putri',
      alamatWilayah: 'Jl. Gunung Putri No. 75, Gunung Putri',
      kantorId: Number(insertedKantor[1].id),
      desaId: Number(desa[8].id), // Pakansari
      statusApprove: 'y',
      aktif: 'y',
      userInsert: 'seed',
      dateInsert: new Date().toISOString().split('T')[0],
    },
    // Kantor Cabang Aceh
    {
      kodeLama: 7,
      namaWilayah: 'Wilayah Pembinaan Johan Pahlawan',
      alamatWilayah: 'Jl. Johan Pahlawan No. 50, Meulaboh',
      kantorId: Number(insertedKantor[2].id),
      desaId: Number(desa[0].id), // Suak Ribee
      statusApprove: 'y',
      aktif: 'y',
      userInsert: 'seed',
      dateInsert: new Date().toISOString().split('T')[0],
    },
    {
      kodeLama: 8,
      namaWilayah: 'Wilayah Pembinaan Jantho',
      alamatWilayah: 'Jl. Jantho No. 100, Jantho',
      kantorId: Number(insertedKantor[2].id),
      desaId: Number(desa[3].id), // Jantho
      statusApprove: 'y',
      aktif: 'y',
      userInsert: 'seed',
      dateInsert: new Date().toISOString().split('T')[0],
    },
    {
      kodeLama: 9,
      namaWilayah: 'Wilayah Pembinaan Samatiga',
      alamatWilayah: 'Jl. Samatiga No. 75, Samatiga',
      kantorId: Number(insertedKantor[2].id),
      desaId: Number(desa[1].id), // Meulaboh
      statusApprove: 'y',
      aktif: 'y',
      userInsert: 'seed',
      dateInsert: new Date().toISOString().split('T')[0],
    },
  ];

  const insertedWilayah = await db.insert(ajisWilayahPembinaan).values(wilayahData).returning();
  console.log(`✅ Inserted ${insertedWilayah.length} wilayah pembinaan`);

  return {
    kantor: insertedKantor,
    wilayah: insertedWilayah,
  };
}
