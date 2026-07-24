import { Suspense } from 'react';
import { getHafalanList, deleteHafalanAction } from '@/app/actions/hafalan';
import { HafalanTable } from './components/hafalan-table';
import { HafalanFilters } from './components/hafalan-filters';
import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import Link from 'next/link';
import { ajisAnak, ajisSemester } from '@/db/schema';
import { db } from '@/lib/repositories/base.repository';
import { eq, and } from 'drizzle-orm';
import { auth } from '@/auth';

export const metadata = {
  title: 'Hafalan - AJIS',
  description: 'Kelola data hafalan anak',
};

async function HafalanList({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; pageSize?: string; search?: string; semesterId?: string; anakId?: string }>;
}) {
  const params = await searchParams;
  const page = parseInt(params.page || '1');
  const pageSize = parseInt(params.pageSize || '20');
  const search = params.search || '';
  const semesterId = params.semesterId ? parseInt(params.semesterId) : undefined;
  const anakId = params.anakId ? parseInt(params.anakId) : undefined;

  const result = await getHafalanList({ page, pageSize, search, semesterId, anakId });

  // Fetch anak list for filter dropdown
  const session = await auth();
  let anakList: any[] = [];
  let semesterList: any[] = [];

  if (session?.user) {
    const { buildRbacFilter } = await import('@/lib/rbac/filters');
    const rbacFilter = buildRbacFilter(
      {
        id_group_user: session.user.id_group_user,
        kantor_id: session.user.kantor_id,
        id_wilayah_pembinaan: session.user.id_wilayah_pembinaan,
      },
      ajisAnak
    );

    anakList = await db
      .select({ id: ajisAnak.id, namaLengkap: ajisAnak.namaLengkap, kodeAnak: ajisAnak.kodeAnak })
      .from(ajisAnak)
      .where(rbacFilter ? and(rbacFilter, eq(ajisAnak.aktif, 'y')) : eq(ajisAnak.aktif, 'y'))
      .orderBy(ajisAnak.namaLengkap)
      .limit(100);

    semesterList = await db
      .select({ id: ajisSemester.id, nama: ajisSemester.nama })
      .from(ajisSemester)
      .orderBy(ajisSemester.nama);
  }

  // Convert bigint to number for type compatibility
  const anakListFormatted = anakList.map(a => ({ ...a, id: Number(a.id) }));
  const semesterListFormatted = semesterList.map(s => ({ ...s, id: Number(s.id) }));

  return (
    <HafalanTable
      data={result.success ? result.data : []}
      total={result.success ? result.total : 0}
      currentPage={page}
      totalPages={result.success ? result.totalPages : 1}
    />
  );
}

export default async function HafalanPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; pageSize?: string; search?: string; semesterId?: string; anakId?: string }>;
}) {
  const params = await searchParams;
  const search = params.search || '';
  const semesterId = params.semesterId || '';
  const anakId = params.anakId || '';

  // Fetch anak and semester lists for filters
  const session = await auth();
  let anakList: any[] = [];
  let semesterList: any[] = [];

  if (session?.user) {
    const { buildRbacFilter } = await import('@/lib/rbac/filters');
    const rbacFilter = buildRbacFilter(
      {
        id_group_user: session.user.id_group_user,
        kantor_id: session.user.kantor_id,
        id_wilayah_pembinaan: session.user.id_wilayah_pembinaan,
      },
      ajisAnak
    );

    anakList = await db
      .select({ id: ajisAnak.id, namaLengkap: ajisAnak.namaLengkap, kodeAnak: ajisAnak.kodeAnak })
      .from(ajisAnak)
      .where(rbacFilter ? and(rbacFilter, eq(ajisAnak.aktif, 'y')) : eq(ajisAnak.aktif, 'y'))
      .orderBy(ajisAnak.namaLengkap)
      .limit(100);

    semesterList = await db
      .select({ id: ajisSemester.id, nama: ajisSemester.nama })
      .from(ajisSemester)
      .orderBy(ajisSemester.nama);
  }

  // Convert bigint to number for type compatibility
  const anakListFormatted = anakList.map(a => ({ ...a, id: Number(a.id) }));
  const semesterListFormatted = semesterList.map(s => ({ ...s, id: Number(s.id) }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Hafalan"
        description="Kelola data hafalan anak"
        action={
          <Button asChild>
            <Link href="/dashboard/hafalan/create">
              <Plus className="mr-2 h-4 w-4" />
              Tambah Hafalan
            </Link>
          </Button>
        }
      />

      <HafalanFilters
        semesters={semesterListFormatted}
        anakList={anakListFormatted}
      />

      <Suspense fallback={<div>Loading...</div>}>
        <HafalanList searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
