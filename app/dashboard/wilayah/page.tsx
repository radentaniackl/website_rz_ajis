import { Suspense } from 'react';
import { getWilayahList } from '@/app/actions/wilayah';
import { WilayahTable } from '@/components/wilayah/wilayah-table';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import Link from 'next/link';
import { auth } from '@/auth';

interface PageProps {
  searchParams: Promise<{
    page?: string;
    search?: string;
  }>;
}

export default async function WilayahPage(props: PageProps) {
  const searchParams = await props.searchParams;
  const session = await auth();
  const userRole = session?.user?.id_group_user || 1;
  
  const page = parseInt(searchParams.page || '1');
  const search = searchParams.search;

  // RBAC: Only Super Admin and Branch Admin can access wilayah
  if (userRole === 9) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Wilayah</h1>
            <p className="text-sm text-muted-foreground">
              Kelola data wilayah pembinaan
            </p>
          </div>
        </div>
        <div className="p-4 border border-red-200 bg-red-50 rounded-lg">
          <p className="text-red-600">Akses ditolak - Hanya Super Admin dan Branch Admin yang dapat mengakses modul ini</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Wilayah</h1>
          <p className="text-sm text-muted-foreground">
            Kelola data wilayah pembinaan
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/wilayah/new">
            <Plus className="mr-2 h-4 w-4" />
            Tambah Wilayah
          </Link>
        </Button>
      </div>

      <Suspense fallback={<div className="p-4">Memuat data...</div>}>
        <WilayahList
          page={page}
          search={search}
        />
      </Suspense>
    </div>
  );
}

async function WilayahList({
  page,
  search,
}: {
  page: number;
  search?: string;
}) {
  const result = await getWilayahList({
    page,
    pageSize: 20,
    search,
  });

  if (!result.success || !result.data) {
    return (
      <div className="p-4 border border-red-200 bg-red-50 rounded-lg">
        <p className="text-red-600">{result.error || 'Gagal memuat data wilayah'}</p>
      </div>
    );
  }

  return (
    <WilayahTable
      data={result.data.data}
      total={result.data.total}
      currentPage={page}
      totalPages={result.data.totalPages}
      canEdit={true}
      canDelete={true}
    />
  );
}
