import { PageHeader } from '@/components/shared/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { HafalanForm } from '../../components/hafalan-form';
import { getHafalanById, updateHafalanAction } from '@/app/actions/hafalan';
import { ajisAnak, ajisSemester, itemHafalan } from '@/db/schema';
import { db } from '@/lib/repositories/base.repository';
import { eq, and } from 'drizzle-orm';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';

export const metadata = {
  title: 'Edit Hafalan - AJIS',
  description: 'Edit data hafalan',
};

export default async function EditHafalanPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const hafalanId = parseInt(id);

  if (isNaN(hafalanId)) {
    redirect('/dashboard/hafalan');
  }

  const session = await auth();
  
  if (!session?.user) {
    redirect('/login');
  }

  const result = await getHafalanById(hafalanId);

  if (!result.success || !result.data) {
    redirect('/dashboard/hafalan');
  }

  const hafalan = result.data;

  // Fetch anak list with RBAC filter
  const { buildRbacFilter } = await import('@/lib/rbac/filters');
  const rbacFilter = buildRbacFilter(
    {
      id_group_user: session.user.id_group_user,
      kantor_id: session.user.kantor_id,
      id_wilayah_pembinaan: session.user.id_wilayah_pembinaan,
    },
    ajisAnak
  );

  const anakList = await db
    .select({ id: ajisAnak.id, namaLengkap: ajisAnak.namaLengkap, kodeAnak: ajisAnak.kodeAnak })
    .from(ajisAnak)
    .where(rbacFilter ? and(rbacFilter, eq(ajisAnak.aktif, 'y')) : eq(ajisAnak.aktif, 'y'))
    .orderBy(ajisAnak.namaLengkap)
    .limit(100);

  // Fetch item hafalan list
  const itemHafalanList = await db
    .select({ id: itemHafalan.id, konten: itemHafalan.konten, jenis: itemHafalan.jenis })
    .from(itemHafalan)
    .orderBy(itemHafalan.konten);

  // Fetch semester list
  const semesterList = await db
    .select({ id: ajisSemester.id, nama: ajisSemester.nama })
    .from(ajisSemester)
    .orderBy(ajisSemester.nama);

  // Convert bigint to number for type compatibility
  const anakListFormatted = anakList.map(a => ({ ...a, id: Number(a.id) }));
  const itemHafalanListFormatted = itemHafalanList.map(i => ({ ...i, id: Number(i.id) }));
  const semesterListFormatted = semesterList.map(s => ({ ...s, id: Number(s.id) }));

  // Prepare initial data for the form
  const initialData = {
    anakId: hafalan.anakId ? Number(hafalan.anakId) : undefined,
    itemHafalanId: hafalan.itemHafalanId ? Number(hafalan.itemHafalanId) : undefined,
    jenis: hafalan.jenis || '',
    kontenUji: hafalan.kontenUji || '',
    tglPengujian: hafalan.tglPengujian ? new Date(hafalan.tglPengujian).toISOString().split('T')[0] : '',
    keterangan: hafalan.keterangan || '',
    semesterId: hafalan.semesterId ? Number(hafalan.semesterId) : undefined,
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Edit Hafalan"
        description="Edit data hafalan yang sudah ada"
      />

      <Card>
        <CardHeader>
          <CardTitle>Edit Form Hafalan</CardTitle>
        </CardHeader>
        <CardContent>
          <HafalanForm
            isEdit={true}
            hafalanId={hafalanId}
            initialData={initialData}
            anakList={anakListFormatted}
            itemHafalanList={itemHafalanListFormatted}
            semesterList={semesterListFormatted}
          />
        </CardContent>
      </Card>
    </div>
  );
}
