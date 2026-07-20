import { ajisSdmWilayah } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function seedSdm(db: any, organizationData: any) {
  console.log('👥 Seeding SDM data...');

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

  // SDM Wilayah data (3 per wilayah = 9 total)
  const sdmData = [
    // Jakarta Pusat (wilayah kodeLama 1)
    {
      kodeLama: 1,
      nik: '3171234567890010',
      namaLengkap: 'Budi Santoso',
      jenisKelamin: 'l',
      alamat: 'Jl. Sudirman No. 100, Jakarta Pusat',
      jenjangPendidikan: 'S1',
      tglBergabung: '2019-01-15',
      telp: '021-12345678',
      hp: '081234567800',
      email: 'budi.santoso@rz-ajis.com',
      keterangan: 'SDM Wilayah Jakarta Pusat',
      keaktifanEdukasi: 'y',
      penugasanWilayahId: getWilayahId(1),
      penugasanKantorId: getKantorId('K001'),
      penugasanFungsiStruktur: 'Mentor',
      penugasanKeaktifanEdukasi: 'y',
      aktif: 'y',
      userInsert: 'seed',
      dateInsert: new Date().toISOString(),
    },
    // Jakarta Selatan (wilayah kodeLama 2)
    {
      kodeLama: 2,
      nik: '3171234567890011',
      namaLengkap: 'Dewi Kartika',
      jenisKelamin: 'p',
      alamat: 'Jl. Fatmawati No. 50, Jakarta Selatan',
      jenjangPendidikan: 'S1',
      tglBergabung: '2019-02-20',
      telp: '021-87654321',
      hp: '081234567801',
      email: 'dewi.kartika@rz-ajis.com',
      keterangan: 'SDM Wilayah Jakarta Selatan',
      keaktifanEdukasi: 'y',
      penugasanWilayahId: getWilayahId(2),
      penugasanKantorId: getKantorId('K001'),
      penugasanFungsiStruktur: 'Mentor',
      penugasanKeaktifanEdukasi: 'y',
      aktif: 'y',
      userInsert: 'seed',
      dateInsert: new Date().toISOString(),
    },
    // Jakarta Barat (wilayah kodeLama 3)
    {
      kodeLama: 3,
      nik: '3171234567890012',
      namaLengkap: 'Agus Setiawan',
      jenisKelamin: 'l',
      alamat: 'Jl. Palmerah No. 30, Jakarta Barat',
      jenjangPendidikan: 'D3',
      tglBergabung: '2019-03-25',
      telp: '021-11122233',
      hp: '081234567802',
      email: 'agus.setiawan@rz-ajis.com',
      keterangan: 'SDM Wilayah Jakarta Barat',
      keaktifanEdukasi: 'y',
      penugasanWilayahId: getWilayahId(3),
      penugasanKantorId: getKantorId('K001'),
      penugasanFungsiStruktur: 'Mentor',
      penugasanKeaktifanEdukasi: 'y',
      aktif: 'y',
      userInsert: 'seed',
      dateInsert: new Date().toISOString(),
    },
    // Cibinong (wilayah kodeLama 4)
    {
      kodeLama: 4,
      nik: '3201234567890010',
      namaLengkap: 'Siti Aminah',
      jenisKelamin: 'p',
      alamat: 'Jl. Raya Cibinong No. 150, Cibinong',
      jenjangPendidikan: 'S1',
      tglBergabung: '2019-04-10',
      telp: '021-44455566',
      hp: '081234567803',
      email: 'siti.aminah@rz-ajis.com',
      keterangan: 'SDM Wilayah Cibinong',
      keaktifanEdukasi: 'y',
      penugasanWilayahId: getWilayahId(4),
      penugasanKantorId: getKantorId('K002'),
      penugasanFungsiStruktur: 'Mentor',
      penugasanKeaktifanEdukasi: 'y',
      aktif: 'y',
      userInsert: 'seed',
      dateInsert: new Date().toISOString(),
    },
    // Citeureup (wilayah kodeLama 5)
    {
      kodeLama: 5,
      nik: '3201234567890011',
      namaLengkap: 'Joko Susilo',
      jenisKelamin: 'l',
      alamat: 'Jl. Citeureup No. 100, Citeureup',
      jenjangPendidikan: 'SMA',
      tglBergabung: '2019-05-15',
      telp: '021-77788899',
      hp: '081234567804',
      email: 'joko.susilo@rz-ajis.com',
      keterangan: 'SDM Wilayah Citeureup',
      keaktifanEdukasi: 'y',
      penugasanWilayahId: getWilayahId(5),
      penugasanKantorId: getKantorId('K002'),
      penugasanFungsiStruktur: 'Mentor',
      penugasanKeaktifanEdukasi: 'y',
      aktif: 'y',
      userInsert: 'seed',
      dateInsert: new Date().toISOString(),
    },
    // Gunung Putri (wilayah kodeLama 6)
    {
      kodeLama: 6,
      nik: '3201234567890012',
      namaLengkap: 'Ratna Sari',
      jenisKelamin: 'p',
      alamat: 'Jl. Gunung Putri No. 50, Gunung Putri',
      jenjangPendidikan: 'S1',
      tglBergabung: '2019-06-20',
      telp: '021-99900011',
      hp: '081234567805',
      email: 'ratna.sari@rz-ajis.com',
      keterangan: 'SDM Wilayah Gunung Putri',
      keaktifanEdukasi: 'y',
      penugasanWilayahId: getWilayahId(6),
      penugasanKantorId: getKantorId('K002'),
      penugasanFungsiStruktur: 'Mentor',
      penugasanKeaktifanEdukasi: 'y',
      aktif: 'y',
      userInsert: 'seed',
      dateInsert: new Date().toISOString(),
    },
    // Johan Pahlawan (wilayah kodeLama 7)
    {
      kodeLama: 7,
      nik: '1101234567890010',
      namaLengkap: 'Teuku Iskandar',
      jenisKelamin: 'l',
      alamat: 'Jl. Johan Pahlawan No. 30, Meulaboh',
      jenjangPendidikan: 'S1',
      tglBergabung: '2019-07-10',
      telp: '0651-111222',
      hp: '081234567806',
      email: 'teuku.iskandar@rz-ajis.com',
      keterangan: 'SDM Wilayah Johan Pahlawan',
      keaktifanEdukasi: 'y',
      penugasanWilayahId: getWilayahId(7),
      penugasanKantorId: getKantorId('K003'),
      penugasanFungsiStruktur: 'Mentor',
      penugasanKeaktifanEdukasi: 'y',
      aktif: 'y',
      userInsert: 'seed',
      dateInsert: new Date().toISOString(),
    },
    // Jantho (wilayah kodeLama 8)
    {
      kodeLama: 8,
      nik: '1101234567890011',
      namaLengkap: 'Siti Sarah',
      jenisKelamin: 'p',
      alamat: 'Jl. Jantho No. 50, Jantho',
      jenjangPendidikan: 'D3',
      tglBergabung: '2019-08-15',
      telp: '0651-333444',
      hp: '081234567807',
      email: 'siti.sarah@rz-ajis.com',
      keterangan: 'SDM Wilayah Jantho',
      keaktifanEdukasi: 'y',
      penugasanWilayahId: getWilayahId(8),
      penugasanKantorId: getKantorId('K003'),
      penugasanFungsiStruktur: 'Mentor',
      penugasanKeaktifanEdukasi: 'y',
      aktif: 'y',
      userInsert: 'seed',
      dateInsert: new Date().toISOString(),
    },
    // Samatiga (wilayah kodeLama 9)
    {
      kodeLama: 9,
      nik: '1101234567890012',
      namaLengkap: 'Abdullah',
      jenisKelamin: 'l',
      alamat: 'Jl. Samatiga No. 30, Samatiga',
      jenjangPendidikan: 'SMA',
      tglBergabung: '2019-09-20',
      telp: '0651-555666',
      hp: '081234567808',
      email: 'abdullah@rz-ajis.com',
      keterangan: 'SDM Wilayah Samatiga',
      keaktifanEdukasi: 'y',
      penugasanWilayahId: getWilayahId(9),
      penugasanKantorId: getKantorId('K003'),
      penugasanFungsiStruktur: 'Mentor',
      penugasanKeaktifanEdukasi: 'y',
      aktif: 'y',
      userInsert: 'seed',
      dateInsert: new Date().toISOString(),
    },
  ];

  // Insert SDM wilayah (skip if already exists)
  await db.insert(ajisSdmWilayah).values(sdmData).onConflictDoNothing();

  // Fetch all SDM wilayah
  const insertedSdm = await db.select().from(ajisSdmWilayah).where(eq(ajisSdmWilayah.aktif, 'y'));
  console.log(`✅ Inserted ${insertedSdm.length} SDM wilayah`);

  return insertedSdm;
}
