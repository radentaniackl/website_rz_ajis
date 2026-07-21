import { Suspense } from 'react';
import { getKantorList } from '@/app/actions/kantor';
import { KantorTable } from '@/components/kantor/kantor-table';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import Link from 'next/link';
import { auth } from '@/auth';

interface PageProps {
  searchParams: Promise<{
    page?: string;
    search?: string;
    aktif?: 'y' | 'n';
  }>;
}

export default async function KantorPage(props: PageProps) {
  const searchParams = await props.searchParams;
  const session = await auth();
  const userRole = session?.user?.id_group_user || 1;
  
  const page = parseInt(searchParams.page || '1');
  const search = searchParams.search;
  const aktif = searchParams.aktif;

  // RBAC: Only Super Admin can access kantor
  if (userRole !== 1) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Kantor</h1>
            <p className="text-sm text-muted-foreground">
              Kelola data kantor cabang
            </p>
          </div>
        </div>
        <div className="p-4 border border-red-200 bg-red-50 rounded-lg">
          <p className="text-red-600">Akses ditolak - Hanya Super Admin yang dapat mengakses modul ini</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Kantor</h1>
          <p className="text-sm text-muted-foreground">
            Kelola data kantor cabang
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/kantor/new">
            <Plus className="mr-2 h-4 w-4" />
            Tambah Kantor
          </Link>
        </Button>
      </div>

      <Suspense fallback={<div className="p-4">Memuat data...</div>}>
        <KantorList
          page={page}
          search={search}
          aktif={aktif}
        />
      </Suspense>
    </div>
  );
}

async function KantorList({
  page,
  search,
  aktif,
}: {
  page: number;
  search?: string;
  aktif?: 'y' | 'n';
}) {
  const result = await getKantorList({
    page,
    pageSize: 20,
    search,
    aktif,
  });

  if (!result.success || !result.data) {
    return (
      <div className="p-4 border border-red-200 bg-red-50 rounded-lg">
        <p className="text-red-600">{result.error || 'Gagal memuat data kantor'}</p>
      </div>
    );
  }

  return (
    <KantorTable
      data={result.data.data}
      total={result.data.total}
      currentPage={page}
      totalPages={result.data.totalPages}
      canEdit={true}
      canDelete={true}
    />
  );
}
