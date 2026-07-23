import { Suspense } from 'react';
import { getPembinaanList } from '@/app/actions/pembinaan';
import { PembinaanTable } from './pembinaan-table';
import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import Link from 'next/link';

export const metadata = {
  title: 'Sesi Pembinaan - AJIS',
  description: 'Daftar sesi pembinaan anak',
};

export default async function PembinaanPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; pageSize?: string; search?: string }>;
}) {
  const params = await searchParams;
  const page = parseInt(params.page || '1');
  const pageSize = parseInt(params.pageSize || '20');
  const search = params.search || '';

  const result = await getPembinaanList({ page, pageSize, search });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Sesi Pembinaan"
        description="Kelola sesi pembinaan anak"
        action={
          <Button asChild>
            <Link href="/dashboard/sesi/new">
              <Plus className="mr-2 h-4 w-4" />
              Tambah Sesi
            </Link>
          </Button>
        }
      />

      <Suspense fallback={<div>Loading...</div>}>
        <PembinaanTable 
          data={result.success ? result.data : []}
          total={result.success ? result.total : 0}
          page={page}
          pageSize={pageSize}
          search={search}
        />
      </Suspense>
    </div>
  );
}
