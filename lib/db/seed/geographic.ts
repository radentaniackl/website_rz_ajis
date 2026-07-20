import { refPropinsi, refKabupaten, refKecamatan, refDesa } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function seedGeographic(db: any) {
  console.log('📍 Seeding geographic data...');

  // Propinsi
  const propinsiData = [
    { kode: '11', nama: 'Aceh', ibukota: 'Banda Aceh', aktif: 'y' },
    { kode: '32', nama: 'Jawa Barat', ibukota: 'Bandung', aktif: 'y' },
    { kode: '31', nama: 'DKI Jakarta', ibukota: 'Jakarta', aktif: 'y' },
  ];

  let insertedPropinsi = await db.insert(refPropinsi).values(propinsiData).onConflictDoNothing().returning();

  // If no propinsi were inserted (already exist), fetch existing ones
  if (insertedPropinsi.length === 0) {
    insertedPropinsi = await db.select().from(refPropinsi).where(eq(refPropinsi.aktif, 'y'));
  }
  console.log(`✅ Inserted ${insertedPropinsi.length} propinsi`);

  // Kabupaten (3 per propinsi)
  const kabupatenData = [
    // Aceh
    { kode: '1101', propinsiId: Number(insertedPropinsi[0].id), nama: 'Kabupaten Aceh Barat', isKota: false, kodeOid: '1101', ibukota: 'Meulaboh', aktif: 'y' },
    { kode: '1102', propinsiId: Number(insertedPropinsi[0].id), nama: 'Kabupaten Aceh Besar', isKota: false, kodeOid: '1102', ibukota: 'Jantho', aktif: 'y' },
    { kode: '1103', propinsiId: Number(insertedPropinsi[0].id), nama: 'Kabupaten Pidie', isKota: false, kodeOid: '1103', ibukota: 'Sigli', aktif: 'y' },
    // Jawa Barat
    { kode: '3201', propinsiId: Number(insertedPropinsi[1].id), nama: 'Kabupaten Bogor', isKota: false, kodeOid: '3201', ibukota: 'Cibinong', aktif: 'y' },
    { kode: '3202', propinsiId: Number(insertedPropinsi[1].id), nama: 'Kabupaten Sukabumi', isKota: false, kodeOid: '3202', ibukota: 'Pelabuan Ratu', aktif: 'y' },
    { kode: '3203', propinsiId: Number(insertedPropinsi[1].id), nama: 'Kabupaten Cianjur', isKota: false, kodeOid: '3203', ibukota: 'Cianjur', aktif: 'y' },
    // DKI Jakarta
    { kode: '3101', propinsiId: Number(insertedPropinsi[2].id), nama: 'Kota Jakarta Pusat', isKota: true, kodeOid: '3101', ibukota: 'Jakarta Pusat', aktif: 'y' },
    { kode: '3102', propinsiId: Number(insertedPropinsi[2].id), nama: 'Kota Jakarta Selatan', isKota: true, kodeOid: '3102', ibukota: 'Kebayoran Baru', aktif: 'y' },
    { kode: '3103', propinsiId: Number(insertedPropinsi[2].id), nama: 'Kota Jakarta Barat', isKota: true, kodeOid: '3103', ibukota: 'Palmerah', aktif: 'y' },
  ];

  // Insert kabupaten (skip if already exists)
  await db.insert(refKabupaten).values(kabupatenData).onConflictDoNothing();

  // Fetch all kabupaten
  const insertedKabupaten = await db.select().from(refKabupaten).where(eq(refKabupaten.aktif, 'y'));
  console.log(`✅ Inserted ${insertedKabupaten.length} kabupaten`);

  // Kecamatan (3 per kabupaten) - use find to get correct IDs
  const getKabupatenId = (kode: string) => {
    const kab = insertedKabupaten.find((k: any) => k.kode === kode);
    if (!kab) throw new Error(`Kabupaten with kode ${kode} not found`);
    return Number(kab.id);
  };
  const kecamatanData = [
    // Aceh Barat
    { kode: '110101', kabupatenId: getKabupatenId('1101'), nama: 'Kecamatan Johan Pahlawan', kodepos: '23615', aktif: 'y' },
    { kode: '110102', kabupatenId: getKabupatenId('1101'), nama: 'Kecamatan Samatiga', kodepos: '23681', aktif: 'y' },
    { kode: '110103', kabupatenId: getKabupatenId('1101'), nama: 'Kecamatan Arongan Lambalek', kodepos: '23681', aktif: 'y' },
    // Aceh Besar
    { kode: '110201', kabupatenId: getKabupatenId('1102'), nama: 'Kecamatan Jantho', kodepos: '23912', aktif: 'y' },
    { kode: '110202', kabupatenId: getKabupatenId('1102'), nama: 'Kecamatan Krueng Barona Jaya', kodepos: '23915', aktif: 'y' },
    { kode: '110203', kabupatenId: getKabupatenId('1102'), nama: 'Kecamatan Ingin Jaya', kodepos: '23916', aktif: 'y' },
    // Bogor
    { kode: '320101', kabupatenId: getKabupatenId('3201'), nama: 'Kecamatan Cibinong', kodepos: '16911', aktif: 'y' },
    { kode: '320102', kabupatenId: getKabupatenId('3201'), nama: 'Kecamatan Citeureup', kodepos: '16810', aktif: 'y' },
    { kode: '320103', kabupatenId: getKabupatenId('3201'), nama: 'Kecamatan Gunung Putri', kodepos: '16962', aktif: 'y' },
    // Jakarta Pusat
    { kode: '310101', kabupatenId: getKabupatenId('3101'), nama: 'Kecamatan Gambir', kodepos: '10119', aktif: 'y' },
    { kode: '310102', kabupatenId: getKabupatenId('3101'), nama: 'Kecamatan Tanah Abang', kodepos: '10160', aktif: 'y' },
    { kode: '310103', kabupatenId: getKabupatenId('3101'), nama: 'Kecamatan Menteng', kodepos: '10310', aktif: 'y' },
  ];

  // Insert kecamatan (skip if already exists)
  await db.insert(refKecamatan).values(kecamatanData).onConflictDoNothing();

  // Fetch all kecamatan
  const insertedKecamatan = await db.select().from(refKecamatan).where(eq(refKecamatan.aktif, 'y'));
  console.log(`✅ Inserted ${insertedKecamatan.length} kecamatan`);

  // Desa (3 per kecamatan) - use find to get correct IDs
  const getKecamatanId = (kode: string) => {
    const kec = insertedKecamatan.find((k: any) => k.kode === kode);
    if (!kec) throw new Error(`Kecamatan with kode ${kode} not found`);
    return Number(kec.id);
  };
  const desaData = [
    // Johan Pahlawan
    { kode: '110101001', kecamatanId: getKecamatanId('110101'), nama: 'Desa Suak Ribee', isKelurahan: false, nomorIndukDesa: '110101001', aktif: 'y' },
    { kode: '110101002', kecamatanId: getKecamatanId('110101'), nama: 'Desa Meulaboh', isKelurahan: false, nomorIndukDesa: '110101002', aktif: 'y' },
    { kode: '110101003', kecamatanId: getKecamatanId('110101'), nama: 'Desa Ujong Tanoh', isKelurahan: false, nomorIndukDesa: '110101003', aktif: 'y' },
    // Jantho
    { kode: '110201001', kecamatanId: getKecamatanId('110201'), nama: 'Desa Jantho', isKelurahan: false, nomorIndukDesa: '110201001', aktif: 'y' },
    { kode: '110201002', kecamatanId: getKecamatanId('110201'), nama: 'Desa Lampanah', isKelurahan: false, nomorIndukDesa: '110201002', aktif: 'y' },
    { kode: '110201003', kecamatanId: getKecamatanId('110201'), nama: 'Desa Cot Girek', isKelurahan: false, nomorIndukDesa: '110201003', aktif: 'y' },
    // Cibinong
    { kode: '320101001', kecamatanId: getKecamatanId('320101'), nama: 'Kelurahan Cibinong', isKelurahan: true, nomorIndukDesa: '320101001', aktif: 'y' },
    { kode: '320101002', kecamatanId: getKecamatanId('320101'), nama: 'Kelurahan Ciriung', isKelurahan: true, nomorIndukDesa: '320101002', aktif: 'y' },
    { kode: '320101003', kecamatanId: getKecamatanId('320101'), nama: 'Kelurahan Pakansari', isKelurahan: true, nomorIndukDesa: '320101003', aktif: 'y' },
    // Gambir
    { kode: '310101001', kecamatanId: getKecamatanId('310101'), nama: 'Kelurahan Gambir', isKelurahan: true, nomorIndukDesa: '310101001', aktif: 'y' },
    { kode: '310101002', kecamatanId: getKecamatanId('310101'), nama: 'Kelurahan Kebon Kelapa', isKelurahan: true, nomorIndukDesa: '310101002', aktif: 'y' },
    { kode: '310101003', kecamatanId: getKecamatanId('310101'), nama: 'Kelurahan Petojo Utara', isKelurahan: true, nomorIndukDesa: '310101003', aktif: 'y' },
  ];

  // Insert desa (skip if already exists)
  await db.insert(refDesa).values(desaData).onConflictDoNothing();

  // Fetch all desa
  const insertedDesa = await db.select().from(refDesa).where(eq(refDesa.aktif, 'y'));
  console.log(`✅ Inserted ${insertedDesa.length} desa`);

  return {
    propinsi: insertedPropinsi,
    kabupaten: insertedKabupaten,
    kecamatan: insertedKecamatan,
    desa: insertedDesa,
  };
}
