import { Suspense } from 'react';
import { SemesterTable } from '@/components/semester/semester-table';
import { getSemesterList } from '@/app/actions/semester';
import { PageHeader } from '@/components/shared/page-header';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default async function SemesterPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; search?: string }>;
}) {
  const resolvedSearchParams = await searchParams;
  const page = Number(resolvedSearchParams.page) || 1;
  const search = resolvedSearchParams.search || '';
  const pageSize = 20;

  const result = await getSemesterList({ page, pageSize, search });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Semester"
        description="Kelola data semester pembinaan"
        action={
          <Button asChild>
            <Link href="/dashboard/semester/new">
              <Plus className="h-4 w-4 mr-2" />
              Tambah Semester
            </Link>
          </Button>
        }
      />

      <Suspense fallback={<div>Loading...</div>}>
        {result.success ? (
          <SemesterTable
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
