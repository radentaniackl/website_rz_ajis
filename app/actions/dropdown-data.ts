'use server';

import { db } from '@/lib/repositories/base.repository';
import { refDesa, ajisWilayahPembinaan, ajisKantor, ajisSdmWilayah } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function getDesaOptions() {
  try {
    const desa = await db
      .select({
        id: refDesa.id,
        nama: refDesa.nama,
        kode: refDesa.kode,
      })
      .from(refDesa)
      .where(eq(refDesa.aktif, 'y'))
      .orderBy(refDesa.nama);
    
    return { success: true, data: desa.map(d => ({ value: Number(d.id), label: `${d.kode} - ${d.nama}` })) };
  } catch (error) {
    console.error('Error fetching desa options:', error);
    return { success: false, error: 'Failed to fetch desa options' };
  }
}

export async function getWilayahOptions() {
  try {
    const wilayah = await db
      .select({
        id: ajisWilayahPembinaan.id,
        nama: ajisWilayahPembinaan.namaWilayah,
        kodeLama: ajisWilayahPembinaan.kodeLama,
      })
      .from(ajisWilayahPembinaan)
      .where(eq(ajisWilayahPembinaan.aktif, 'y'))
      .orderBy(ajisWilayahPembinaan.namaWilayah);
    
    return { success: true, data: wilayah.map(w => ({ value: Number(w.id), label: `${w.kodeLama} - ${w.nama}` })) };
  } catch (error) {
    console.error('Error fetching wilayah options:', error);
    return { success: false, error: 'Failed to fetch wilayah options' };
  }
}

export async function getKantorOptions() {
  try {
    const kantor = await db
      .select({
        id: ajisKantor.id,
        nama: ajisKantor.nama,
        kode: ajisKantor.kode,
      })
      .from(ajisKantor)
      .where(eq(ajisKantor.aktif, 'y'))
      .orderBy(ajisKantor.nama);
    
    return { success: true, data: kantor.map(k => ({ value: Number(k.id), label: `${k.kode} - ${k.nama}` })) };
  } catch (error) {
    console.error('Error fetching kantor options:', error);
    return { success: false, error: 'Failed to fetch kantor options' };
  }
}

export async function getSdmWilayahOptions() {
  try {
    const sdm = await db
      .select({
        id: ajisSdmWilayah.id,
        nama: ajisSdmWilayah.namaLengkap,
        kodeLama: ajisSdmWilayah.kodeLama,
      })
      .from(ajisSdmWilayah)
      .where(eq(ajisSdmWilayah.aktif, 'y'))
      .orderBy(ajisSdmWilayah.namaLengkap);
    
    return { success: true, data: sdm.map(s => ({ value: Number(s.id), label: `${s.kodeLama} - ${s.nama}` })) };
  } catch (error) {
    console.error('Error fetching sdm wilayah options:', error);
    return { success: false, error: 'Failed to fetch sdm wilayah options' };
  }
}
