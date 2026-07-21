import { Suspense } from 'react';
import { getPembinaanList } from '@/app/actions/pembinaan';
import { PembinaanTable } from './pembinaan-table';
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
  searchParams: { page?: string; pageSize?: string; search?: string };
}) {
  const page = parseInt(searchParams.page || '1');
  const pageSize = parseInt(searchParams.pageSize || '20');
  const search = searchParams.search || '';

  const result = await getPembinaanList({ page, pageSize, search });

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Sesi Pembinaan</h1>
          <p className="text-muted-foreground">Kelola sesi pembinaan anak</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/sesi/new">
            <Plus className="mr-2 h-4 w-4" />
            Tambah Sesi
          </Link>
        </Button>
      </div>

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
