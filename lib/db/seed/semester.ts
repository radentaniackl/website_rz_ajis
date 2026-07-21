import { ajisSemester } from '@/db/schema';
import { db } from '@/lib/repositories/base.repository';

export async function seedSemester() {
  console.log('🌱 Seeding ajis_semester...');

  const semesters = [
    {
      kodeLama: 'SEM2026-1',
      nama: 'Januari - Juni 2026',
      tglAwal: new Date('2026-01-01'),
      tglAkhir: new Date('2026-06-30'),
      onprogress: 'n',
      tglAwalDonasi: new Date('2026-01-01'),
      tglAkhirDonasi: new Date('2026-06-30'),
      tglAwalSaldo: new Date('2026-01-01'),
      tglAkhirSaldo: new Date('2026-06-30'),
      jenis: 'ganjil',
      tahun: 2026,
      lapsem: 'y',
      userInsert: 'seed',
      dateInsert: new Date(),
    },
    {
      kodeLama: 'SEM2026-2',
      nama: 'Juli - Desember 2026',
      tglAwal: new Date('2026-07-01'),
      tglAkhir: new Date('2026-12-31'),
      onprogress: 'y', // Active semester
      tglAwalDonasi: new Date('2026-07-01'),
      tglAkhirDonasi: new Date('2026-12-31'),
      tglAwalSaldo: new Date('2026-07-01'),
      tglAkhirSaldo: new Date('2026-12-31'),
      jenis: 'genap',
      tahun: 2026,
      lapsem: 'y',
      userInsert: 'seed',
      dateInsert: new Date(),
    },
    {
      kodeLama: 'SEM2025-1',
      nama: 'Januari - Juni 2025',
      tglAwal: new Date('2025-01-01'),
      tglAkhir: new Date('2025-06-30'),
      onprogress: 'n',
      tglAwalDonasi: new Date('2025-01-01'),
      tglAkhirDonasi: new Date('2025-06-30'),
      tglAwalSaldo: new Date('2025-01-01'),
      tglAkhirSaldo: new Date('2025-06-30'),
      jenis: 'ganjil',
      tahun: 2025,
      lapsem: 'y',
      userInsert: 'seed',
      dateInsert: new Date(),
    },
    {
      kodeLama: 'SEM2025-2',
      nama: 'Juli - Desember 2025',
      tglAwal: new Date('2025-07-01'),
      tglAkhir: new Date('2025-12-31'),
      onprogress: 'n',
      tglAwalDonasi: new Date('2025-07-01'),
      tglAkhirDonasi: new Date('2025-12-31'),
      tglAwalSaldo: new Date('2025-07-01'),
      tglAkhirSaldo: new Date('2025-12-31'),
      jenis: 'genap',
      tahun: 2025,
      lapsem: 'y',
      userInsert: 'seed',
      dateInsert: new Date(),
    },
    {
      kodeLama: 'SEM2024-1',
      nama: 'Januari - Juni 2024',
      tglAwal: new Date('2024-01-01'),
      tglAkhir: new Date('2024-06-30'),
      onprogress: 'n',
      tglAwalDonasi: new Date('2024-01-01'),
      tglAkhirDonasi: new Date('2024-06-30'),
      tglAwalSaldo: new Date('2024-01-01'),
      tglAkhirSaldo: new Date('2024-06-30'),
      jenis: 'ganjil',
      tahun: 2024,
      lapsem: 'y',
      userInsert: 'seed',
      dateInsert: new Date(),
    },
    {
      kodeLama: 'SEM2024-2',
      nama: 'Juli - Desember 2024',
      tglAwal: new Date('2024-07-01'),
      tglAkhir: new Date('2024-12-31'),
      onprogress: 'n',
      tglAwalDonasi: new Date('2024-07-01'),
      tglAkhirDonasi: new Date('2024-12-31'),
      tglAwalSaldo: new Date('2024-07-01'),
      tglAkhirSaldo: new Date('2024-12-31'),
      jenis: 'genap',
      tahun: 2024,
      lapsem: 'y',
      userInsert: 'seed',
      dateInsert: new Date(),
    },
    {
      kodeLama: 'SEM2027-1',
      nama: 'Januari - Juni 2027',
      tglAwal: new Date('2027-01-01'),
      tglAkhir: new Date('2027-06-30'),
      onprogress: 'n',
      tglAwalDonasi: new Date('2027-01-01'),
      tglAkhirDonasi: new Date('2027-06-30'),
      tglAwalSaldo: new Date('2027-01-01'),
      tglAkhirSaldo: new Date('2027-06-30'),
      jenis: 'ganjil',
      tahun: 2027,
      lapsem: 'y',
      userInsert: 'seed',
      dateInsert: new Date(),
    },
    {
      kodeLama: 'SEM2027-2',
      nama: 'Juli - Desember 2027',
      tglAwal: new Date('2027-07-01'),
      tglAkhir: new Date('2027-12-31'),
      onprogress: 'n',
      tglAwalDonasi: new Date('2027-07-01'),
      tglAkhirDonasi: new Date('2027-12-31'),
      tglAwalSaldo: new Date('2027-07-01'),
      tglAkhirSaldo: new Date('2027-12-31'),
      jenis: 'genap',
      tahun: 2027,
      lapsem: 'y',
      userInsert: 'seed',
      dateInsert: new Date(),
    },
  ];

  try {
    // Check if semesters already exist
    const existing = await db.select().from(ajisSemester).limit(1);
    if (existing.length > 0) {
      console.log('✓ Semesters already exist, skipping seed');
      return;
    }

    // Insert semesters
    await db.insert(ajisSemester).values(semesters);
    console.log(`✓ Seeded ${semesters.length} semesters`);
  } catch (error) {
    console.error('Error seeding semesters:', error);
    throw error;
  }
}
