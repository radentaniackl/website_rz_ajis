import { Suspense } from 'react';
import { DonaturTable } from '@/components/donatur/donatur-table';
import { getDonaturList } from '@/app/actions/donatur';
import { PageHeader } from '@/components/shared/page-header';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default async function DonaturPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; search?: string }>;
}) {
  const resolvedSearchParams = await searchParams;
  const page = Number(resolvedSearchParams.page) || 1;
  const search = resolvedSearchParams.search || '';
  const pageSize = 20;

  const result = await getDonaturList({ page, pageSize, search });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Donatur"
        description="Kelola data donatur"
        action={
          <Button asChild>
            <Link href="/dashboard/donatur/new">
              <Plus className="h-4 w-4 mr-2" />
              Tambah Donatur
            </Link>
          </Button>
        }
      />

      <Suspense fallback={<div>Loading...</div>}>
        {result.success ? (
          <DonaturTable
            data={result.data.data}
            total={result.data.total}
            page={page}
            pageSize={pageSize}
            search={search}
          />
        ) : (
          <div className="text-red-500">{result.error}</div>
        )}
      </Suspense>
    </div>
  );
}
