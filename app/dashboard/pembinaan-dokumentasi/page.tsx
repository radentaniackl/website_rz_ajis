import { Suspense } from 'react';
import { DokumentasiGallery } from '@/components/pembinaan-dokumentasi/dokumentasi-gallery';
import { getPembinaanDokumentasiList } from '@/app/actions/pembinaan-dokumentasi';
import { PageHeader } from '@/components/shared/page-header';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { deletePembinaanDokumentasiAction } from '@/app/actions/pembinaan-dokumentasi';
import { toast } from 'sonner';

interface PageProps {
  searchParams: Promise<{ page?: string; search?: string }>;
}

export default async function PembinaanDokumentasiPage({ searchParams }: PageProps) {
  const resolvedSearchParams = await searchParams;
  const page = Number(resolvedSearchParams.page) || 1;
  const search = resolvedSearchParams.search || '';
  const pageSize = 20;

  const result = await getPembinaanDokumentasiList({ page, pageSize, search });

  const handleDelete = async (id: number) => {
    'use server';
    
    const deleteResult = await deletePembinaanDokumentasiAction(id);
    if (deleteResult.success) {
      return { success: true };
    } else {
      return { success: false, error: deleteResult.error };
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dokumentasi Pembinaan"
        description="Kelola dokumentasi kegiatan pembinaan"
        action={
          <Button asChild>
            <Link href="/dashboard/pembinaan-dokumentasi/new">
              <Plus className="h-4 w-4 mr-2" />
              Tambah Dokumentasi
            </Link>
          </Button>
        }
      />

      <Suspense fallback={<div>Loading...</div>}>
        {result.success ? (
          <DokumentasiGallery
            items={result.data.data}
            canDelete={true}
            onDelete={handleDelete}
          />
        ) : (
          <div className="text-red-500">{result.error}</div>
        )}
      </Suspense>
    </div>
  );
}
