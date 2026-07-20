import { Suspense } from 'react';
import { getRefDesaList } from '@/app/actions/ref-desa';
import { RefDesaTable } from '@/components/referensi/desa/ref-desa-table';
import { RefDesaTableSkeleton } from '@/components/referensi/desa/ref-desa-table-skeleton';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import Link from 'next/link';
import { auth } from '@/auth';

interface PageProps {
  searchParams: Promise<{
    page?: string;
    search?: string;
    aktif?: 'y' | 'n';
    field?: string;
    direction?: 'asc' | 'desc';
  }>;
}

export default async function RefDesaPage(props: PageProps) {
  const searchParams = await props.searchParams;
  const session = await auth();
  const userRole = session?.user?.id_group_user || 1;
  
  const page = parseInt(searchParams.page || '1');
  const search = searchParams.search;
  const aktif = searchParams.aktif;
  const field = searchParams.field;
  const direction = searchParams.direction;

  // Determine if user can create reference data
  const canCreate = userRole !== 9; // Korwil cannot create reference data

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Referensi Desa/Kelurahan</h1>
          <p className="text-sm text-muted-foreground">Kelola data desa/kelurahan</p>
        </div>
        {canCreate && (
          <Button asChild>
            <Link href="/dashboard/referensi/desa/new">
              <Plus className="mr-2 h-4 w-4" />
              Tambah Desa
            </Link>
          </Button>
        )}
      </div>

      <Suspense fallback={<RefDesaTableSkeleton />}>
        <RefDesaList page={page} search={search} aktif={aktif} field={field} direction={direction} userRole={userRole} />
      </Suspense>
    </div>
  );
}

async function RefDesaList({
  page,
  search,
  aktif,
  field,
  direction,
  userRole,
}: {
  page: number;
  search?: string;
  aktif?: 'y' | 'n';
  field?: string;
  direction?: 'asc' | 'desc';
  userRole: number;
}) {
  const result = await getRefDesaList({ page, pageSize: 20, search, aktif, field, direction });

  if (!result.success || !result.data) {
    return (
      <div className="p-4 border border-red-200 bg-red-50 rounded-lg">
        <p className="text-red-600">{result.error || 'Gagal memuat data desa'}</p>
      </div>
    );
  }

  const canEdit = userRole !== 9; // Korwil cannot edit reference data
  const canDelete = userRole !== 9; // Korwil cannot delete reference data

  return (
    <RefDesaTable 
      data={result.data.data} 
      total={result.data.total} 
      currentPage={page} 
      totalPages={result.data.totalPages}
      canEdit={canEdit}
      canDelete={canDelete}
    />
  );
}
