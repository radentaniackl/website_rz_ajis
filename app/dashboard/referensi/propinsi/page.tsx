import { Suspense } from 'react';
import { getRefPropinsiList } from '@/app/actions/ref-propinsi';
import { RefPropinsiTable } from '@/components/referensi/propinsi/ref-propinsi-table';
import { RefPropinsiTableSkeleton } from '@/components/referensi/propinsi/ref-propinsi-table-skeleton';
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

export default async function RefPropinsiPage(props: PageProps) {
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
          <h1 className="text-2xl font-bold">Referensi Propinsi</h1>
          <p className="text-sm text-muted-foreground">
            Kelola data provinsi untuk sistem
          </p>
        </div>
        {canCreate && (
          <Button asChild>
            <Link href="/dashboard/referensi/propinsi/new">
              <Plus className="mr-2 h-4 w-4" />
              Tambah Propinsi
            </Link>
          </Button>
        )}
      </div>

      <Suspense fallback={<RefPropinsiTableSkeleton />}>
        <RefPropinsiList
          page={page}
          search={search}
          aktif={aktif}
          field={field}
          direction={direction}
          userRole={userRole}
        />
      </Suspense>
    </div>
  );
}

async function RefPropinsiList({
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
  console.log('RefPropinsiList component started');

  const result = await getRefPropinsiList({
    page,
    pageSize: 20,
    search,
    aktif,
    field,
    direction,
  });

  console.log('RefPropinsiList result:', result);

  if (!result.success || !result.data) {
    return (
      <div className="p-4 border border-red-200 bg-red-50 rounded-lg">
        <p className="text-red-600">{result.error || 'Gagal memuat data propinsi'}</p>
      </div>
    );
  }

  const canEdit = userRole !== 9;
  const canDelete = userRole !== 9;

  console.log('RefPropinsiList data:', result.data);
  console.log('RefPropinsiList data.data:', result.data.data);

  return (
    <RefPropinsiTable
      data={result.data.data}
      total={result.data.total}
      currentPage={page}
      totalPages={result.data.totalPages}
      canEdit={canEdit}
      canDelete={canDelete}
    />
  );
}
