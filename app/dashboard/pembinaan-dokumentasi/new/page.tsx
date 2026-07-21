import { DokumentasiForm } from '@/components/pembinaan-dokumentasi/dokumentasi-form';
import { PageHeader } from '@/components/shared/page-header';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export const metadata = {
  title: 'Tambah Dokumentasi Pembinaan',
};

export default function NewPembinaanDokumentasiPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Tambah Dokumentasi Pembinaan"
        description="Unggah dokumentasi kegiatan pembinaan"
        action={
          <Button variant="outline" asChild>
            <Link href="/dashboard/pembinaan-dokumentasi">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Kembali
            </Link>
          </Button>
        }
      />

      <DokumentasiForm />
    </div>
  );
}
