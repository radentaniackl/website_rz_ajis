import { Suspense } from 'react';
import { getRefKabupatenList } from '@/app/actions/ref-kabupaten';
import { RefKabupatenTable } from '@/components/referensi/kabupaten/ref-kabupaten-table';
import { RefKabupatenTableSkeleton } from '@/components/referensi/kabupaten/ref-kabupaten-table-skeleton';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import Link from 'next/link';

interface PageProps {
  searchParams: Promise<{
    page?: string;
    search?: string;
    aktif?: 'y' | 'n';
    field?: string;
    direction?: 'asc' | 'desc';
  }>;
}

export default async function RefKabupatenPage(props: PageProps) {
  const searchParams = await props.searchParams;
  const page = parseInt(searchParams.page || '1');
  const search = searchParams.search;
  const aktif = searchParams.aktif;
  const field = searchParams.field;
  const direction = searchParams.direction;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Referensi Kabupaten/Kota</h1>
          <p className="text-sm text-muted-foreground">Kelola data kabupaten/kota</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/referensi/kabupaten/new">
            <Plus className="mr-2 h-4 w-4" />
            Tambah Kabupaten
          </Link>
        </Button>
      </div>

      <Suspense fallback={<RefKabupatenTableSkeleton />}>
        <RefKabupatenList page={page} search={search} aktif={aktif} field={field} direction={direction} />
      </Suspense>
    </div>
  );
}

async function RefKabupatenList({
  page,
  search,
  aktif,
  field,
  direction,
}: {
  page: number;
  search?: string;
  aktif?: 'y' | 'n';
  field?: string;
  direction?: 'asc' | 'desc';
}) {
  const result = await getRefKabupatenList({ page, pageSize: 20, search, aktif, field, direction });

  if (!result.success || !result.data) {
    return (
      <div className="p-4 border border-red-200 bg-red-50 rounded-lg">
        <p className="text-red-600">{result.error || 'Gagal memuat data kabupaten'}</p>
      </div>
    );
  }

  return (
    <RefKabupatenTable
      data={result.data.data}
      total={result.data.total}
      currentPage={page}
      totalPages={result.data.totalPages}
    />
  );
}
