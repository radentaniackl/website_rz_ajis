import { db } from '@/lib/db';
import { refPropinsi, refKabupaten, refKecamatan, refDesa } from '@/db/schema';

export async function seedGeographic() {
  console.log('📍 Seeding geographic data...');

  // Propinsi
  const propinsiData = [
    { kode: '11', nama: 'Aceh', ibukota: 'Banda Aceh', aktif: 'y' },
    { kode: '32', nama: 'Jawa Barat', ibukota: 'Bandung', aktif: 'y' },
    { kode: '31', nama: 'DKI Jakarta', ibukota: 'Jakarta', aktif: 'y' },
  ];

  const insertedPropinsi = await db.insert(refPropinsi).values(propinsiData).returning();
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

  const insertedKabupaten = await db.insert(refKabupaten).values(kabupatenData).returning();
  console.log(`✅ Inserted ${insertedKabupaten.length} kabupaten`);

  // Kecamatan (3 per kabupaten)
  const kecamatanData = [
    // Aceh Barat
    { kode: '110101', kabupatenId: Number(insertedKabupaten[0].id), nama: 'Kecamatan Johan Pahlawan', kodepos: '23615', aktif: 'y' },
    { kode: '110102', kabupatenId: Number(insertedKabupaten[0].id), nama: 'Kecamatan Samatiga', kodepos: '23681', aktif: 'y' },
    { kode: '110103', kabupatenId: Number(insertedKabupaten[0].id), nama: 'Kecamatan Arongan Lambalek', kodepos: '23681', aktif: 'y' },
    // Aceh Besar
    { kode: '110201', kabupatenId: Number(insertedKabupaten[1].id), nama: 'Kecamatan Jantho', kodepos: '23912', aktif: 'y' },
    { kode: '110202', kabupatenId: Number(insertedKabupaten[1].id), nama: 'Kecamatan Krueng Barona Jaya', kodepos: '23915', aktif: 'y' },
    { kode: '110203', kabupatenId: Number(insertedKabupaten[1].id), nama: 'Kecamatan Ingin Jaya', kodepos: '23916', aktif: 'y' },
    // Bogor
    { kode: '320101', kabupatenId: Number(insertedKabupaten[3].id), nama: 'Kecamatan Cibinong', kodepos: '16911', aktif: 'y' },
    { kode: '320102', kabupatenId: Number(insertedKabupaten[3].id), nama: 'Kecamatan Citeureup', kodepos: '16810', aktif: 'y' },
    { kode: '320103', kabupatenId: Number(insertedKabupaten[3].id), nama: 'Kecamatan Gunung Putri', kodepos: '16962', aktif: 'y' },
    // Jakarta Pusat
    { kode: '310101', kabupatenId: Number(insertedKabupaten[6].id), nama: 'Kecamatan Gambir', kodepos: '10119', aktif: 'y' },
    { kode: '310102', kabupatenId: Number(insertedKabupaten[6].id), nama: 'Kecamatan Tanah Abang', kodepos: '10160', aktif: 'y' },
    { kode: '310103', kabupatenId: Number(insertedKabupaten[6].id), nama: 'Kecamatan Menteng', kodepos: '10310', aktif: 'y' },
  ];

  const insertedKecamatan = await db.insert(refKecamatan).values(kecamatanData).returning();
  console.log(`✅ Inserted ${insertedKecamatan.length} kecamatan`);

  // Desa (3 per kecamatan)
  const desaData = [
    // Johan Pahlawan
    { kode: '110101001', kecamatanId: Number(insertedKecamatan[0].id), nama: 'Desa Suak Ribee', isKelurahan: false, nomorIndukDesa: '110101001', aktif: 'y' },
    { kode: '110101002', kecamatanId: Number(insertedKecamatan[0].id), nama: 'Desa Meulaboh', isKelurahan: false, nomorIndukDesa: '110101002', aktif: 'y' },
    { kode: '110101003', kecamatanId: Number(insertedKecamatan[0].id), nama: 'Desa Ujong Tanoh', isKelurahan: false, nomorIndukDesa: '110101003', aktif: 'y' },
    // Jantho
    { kode: '110201001', kecamatanId: Number(insertedKecamatan[3].id), nama: 'Desa Jantho', isKelurahan: false, nomorIndukDesa: '110201001', aktif: 'y' },
    { kode: '110201002', kecamatanId: Number(insertedKecamatan[3].id), nama: 'Desa Lampanah', isKelurahan: false, nomorIndukDesa: '110201002', aktif: 'y' },
    { kode: '110201003', kecamatanId: Number(insertedKecamatan[3].id), nama: 'Desa Cot Girek', isKelurahan: false, nomorIndukDesa: '110201003', aktif: 'y' },
    // Cibinong
    { kode: '320101001', kecamatanId: Number(insertedKecamatan[6].id), nama: 'Kelurahan Cibinong', isKelurahan: true, nomorIndukDesa: '320101001', aktif: 'y' },
    { kode: '320101002', kecamatanId: Number(insertedKecamatan[6].id), nama: 'Kelurahan Ciriung', isKelurahan: true, nomorIndukDesa: '320101002', aktif: 'y' },
    { kode: '320101003', kecamatanId: Number(insertedKecamatan[6].id), nama: 'Kelurahan Pakansari', isKelurahan: true, nomorIndukDesa: '320101003', aktif: 'y' },
    // Gambir
    { kode: '310101001', kecamatanId: Number(insertedKecamatan[9].id), nama: 'Kelurahan Gambir', isKelurahan: true, nomorIndukDesa: '310101001', aktif: 'y' },
    { kode: '310101002', kecamatanId: Number(insertedKecamatan[9].id), nama: 'Kelurahan Kebon Kelapa', isKelurahan: true, nomorIndukDesa: '310101002', aktif: 'y' },
    { kode: '310101003', kecamatanId: Number(insertedKecamatan[9].id), nama: 'Kelurahan Petojo Utara', isKelurahan: true, nomorIndukDesa: '310101003', aktif: 'y' },
  ];

  const insertedDesa = await db.insert(refDesa).values(desaData).returning();
  console.log(`✅ Inserted ${insertedDesa.length} desa`);

  return {
    propinsi: insertedPropinsi,
    kabupaten: insertedKabupaten,
    kecamatan: insertedKecamatan,
    desa: insertedDesa,
  };
}
