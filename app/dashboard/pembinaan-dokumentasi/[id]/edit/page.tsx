import { DokumentasiForm } from '@/components/pembinaan-dokumentasi/dokumentasi-form';
import { getPembinaanDokumentasiDetail } from '@/app/actions/pembinaan-dokumentasi';
import { PageHeader } from '@/components/shared/page-header';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export const metadata = {
  title: 'Edit Dokumentasi Pembinaan',
};

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditPembinaanDokumentasiPage({ params }: PageProps) {
  const resolvedParams = await params;
  const id = Number(resolvedParams.id);
  const result = await getPembinaanDokumentasiDetail(id);

  if (!result.success || !result.data) {
    return <div>Dokumentasi tidak ditemukan</div>;
  }

  const dokumentasi = result.data;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Edit Dokumentasi Pembinaan"
        description="Perbarui dokumentasi kegiatan pembinaan"
        action={
          <Button variant="outline" asChild>
            <Link href="/dashboard/pembinaan-dokumentasi">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Kembali
            </Link>
          </Button>
        }
      />

      <DokumentasiForm 
        initialData={dokumentasi} 
        isEdit={true} 
        dokumentasiId={id} 
      />
    </div>
  );
}
