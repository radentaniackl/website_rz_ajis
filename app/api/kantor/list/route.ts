import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { ajisKantor } from '@/lib/db/schema';
import { db } from '@/lib/db';
import { eq } from 'drizzle-orm';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // RBAC: Super Admin gets all kantor, Branch Admin gets only their kantor
    let kantorList;
    if (session.user.id_group_user === 1) {
      // Super Admin: all active kantor
      kantorList = await db
        .select({
          id: ajisKantor.id,
          nama: ajisKantor.nama,
          kode: ajisKantor.kode,
        })
        .from(ajisKantor)
        .where(eq(ajisKantor.aktif, 'y'))
        .orderBy(ajisKantor.nama);
    } else if (session.user.id_group_user === 2 && session.user.kantor_id) {
      // Branch Admin: only their kantor
      kantorList = await db
        .select({
          id: ajisKantor.id,
          nama: ajisKantor.nama,
          kode: ajisKantor.kode,
        })
        .from(ajisKantor)
        .where(eq(ajisKantor.id, BigInt(session.user.kantor_id)));
    } else {
      // Korwil: no access to kantor list
      return NextResponse.json({ success: true, data: [] });
    }

    // Convert BigInt to Number for JSON serialization
    const serializedKantorList = kantorList.map(k => ({
      id: Number(k.id),
      nama: k.nama,
      kode: k.kode,
    }));

    return NextResponse.json({
      success: true,
      data: serializedKantorList,
    });
  } catch (error) {
    console.error('Error fetching kantor list:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch kantor list' },
      { status: 500 }
    );
  }
}
