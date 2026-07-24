import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { refDesa, refKecamatan, refKabupaten } from '@/lib/db/schema';
import { db } from '@/lib/db';
import { eq } from 'drizzle-orm';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Get all active desa with kecamatan and kabupaten info
    const desaList = await db
      .select({
        id: refDesa.id,
        nama: refDesa.nama,
        kode: refDesa.kode,
        kecamatanNama: refKecamatan.nama,
        kabupatenNama: refKabupaten.nama,
      })
      .from(refDesa)
      .leftJoin(refKecamatan, eq(refDesa.kecamatanId, refKecamatan.id))
      .leftJoin(refKabupaten, eq(refKecamatan.kabupatenId, refKabupaten.id))
      .where(eq(refDesa.aktif, 'y'))
      .orderBy(refDesa.nama);

    // Convert BigInt to Number for JSON serialization
    const serializedDesaList = desaList.map(d => ({
      id: Number(d.id),
      nama: d.nama,
      kode: d.kode,
      kecamatanNama: d.kecamatanNama,
      kabupatenNama: d.kabupatenNama,
    }));

    return NextResponse.json({
      success: true,
      data: serializedDesaList,
    });
  } catch (error) {
    console.error('Error fetching desa list:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch desa list' },
      { status: 500 }
    );
  }
}
