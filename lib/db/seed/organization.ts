import { ajisKantor, ajisWilayahPembinaan } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function seedOrganization(db: any, desa: any) {
  console.log('🏢 Seeding organization data...');

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

  // Insert kantor (skip if already exists)
  await db.insert(ajisKantor).values(kantorData).onConflictDoNothing();

  // Fetch all kantor
  const insertedKantor = await db.select().from(ajisKantor).where(eq(ajisKantor.aktif, 'y'));
  const kantorByKode = new Map(insertedKantor.map((k: any) => [k.kode, k]));
  console.log(`✅ Inserted ${insertedKantor.length} kantor`);

  // Helper function to get kantor ID by kode
  const getKantorId = (kode: string) => {
    const kantor = kantorByKode.get(kode) as any;
    if (!kantor) throw new Error(`Kantor with kode ${kode} not found`);
    return Number(kantor.id);
  };

  // Helper function to get desa ID by kode
  const desaByKode = new Map(desa.map((d: any) => [d.kode, d]));
  const getDesaId = (kode: string) => {
    const d = desaByKode.get(kode) as any;
    if (!d) throw new Error(`Desa with kode ${kode} not found`);
    return Number(d.id);
  };

  // Wilayah Pembinaan (3 per kantor = 9 total)
  const wilayahData = [
    // Kantor Pusat Jakarta
    {
      kodeLama: 1,
      namaWilayah: 'Wilayah Pembinaan Jakarta Pusat',
      alamatWilayah: 'Jl. Sudirman No. 123, Jakarta Pusat',
      kantorId: getKantorId('K001'),
      desaId: getDesaId('310101001'), // Gambir
      statusApprove: 'y',
      aktif: 'y',
      userInsert: 'seed',
      dateInsert: new Date().toISOString().split('T')[0],
    },
    {
      kodeLama: 2,
      namaWilayah: 'Wilayah Pembinaan Jakarta Selatan',
      alamatWilayah: 'Jl. Fatmawati No. 100, Jakarta Selatan',
      kantorId: getKantorId('K001'),
      desaId: getDesaId('310101002'), // Kebon Kelapa
      statusApprove: 'y',
      aktif: 'y',
      userInsert: 'seed',
      dateInsert: new Date().toISOString().split('T')[0],
    },
    {
      kodeLama: 3,
      namaWilayah: 'Wilayah Pembinaan Jakarta Barat',
      alamatWilayah: 'Jl. Palmerah No. 50, Jakarta Barat',
      kantorId: getKantorId('K001'),
      desaId: getDesaId('310101003'), // Petojo Utara
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
      kantorId: getKantorId('K002'),
      desaId: getDesaId('320101001'), // Cibinong
      statusApprove: 'y',
      aktif: 'y',
      userInsert: 'seed',
      dateInsert: new Date().toISOString().split('T')[0],
    },
    {
      kodeLama: 5,
      namaWilayah: 'Wilayah Pembinaan Citeureup',
      alamatWilayah: 'Jl. Raya Citeureup No. 150, Citeureup',
      kantorId: getKantorId('K002'),
      desaId: getDesaId('320101002'), // Ciriung
      statusApprove: 'y',
      aktif: 'y',
      userInsert: 'seed',
      dateInsert: new Date().toISOString().split('T')[0],
    },
    {
      kodeLama: 6,
      namaWilayah: 'Wilayah Pembinaan Gunung Putri',
      alamatWilayah: 'Jl. Gunung Putri No. 75, Gunung Putri',
      kantorId: getKantorId('K002'),
      desaId: getDesaId('320101003'), // Pakansari
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
      kantorId: getKantorId('K003'),
      desaId: getDesaId('110101001'), // Suak Ribee
      statusApprove: 'y',
      aktif: 'y',
      userInsert: 'seed',
      dateInsert: new Date().toISOString().split('T')[0],
    },
    {
      kodeLama: 8,
      namaWilayah: 'Wilayah Pembinaan Jantho',
      alamatWilayah: 'Jl. Jantho No. 100, Jantho',
      kantorId: getKantorId('K003'),
      desaId: getDesaId('110201001'), // Jantho
      statusApprove: 'y',
      aktif: 'y',
      userInsert: 'seed',
      dateInsert: new Date().toISOString().split('T')[0],
    },
    {
      kodeLama: 9,
      namaWilayah: 'Wilayah Pembinaan Samatiga',
      alamatWilayah: 'Jl. Samatiga No. 75, Samatiga',
      kantorId: getKantorId('K003'),
      desaId: getDesaId('110101002'), // Meulaboh
      statusApprove: 'y',
      aktif: 'y',
      userInsert: 'seed',
      dateInsert: new Date().toISOString().split('T')[0],
    },
  ];

  // Insert wilayah pembinaan (skip if already exists)
  await db.insert(ajisWilayahPembinaan).values(wilayahData).onConflictDoNothing();

  // Fetch all wilayah pembinaan
  const insertedWilayah = await db.select().from(ajisWilayahPembinaan).where(eq(ajisWilayahPembinaan.aktif, 'y'));
  console.log(`✅ Inserted ${insertedWilayah.length} wilayah pembinaan`);

  return {
    kantor: insertedKantor,
    wilayah: insertedWilayah,
  };
}
