import { DokumentasiForm } from '@/components/pembinaan-dokumentasi/dokumentasi-form';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export const metadata = {
  title: 'Tambah Dokumentasi Pembinaan',
};

export default function NewPembinaanDokumentasiPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" asChild>
          <Link href="/dashboard/pembinaan-dokumentasi">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Kembali
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Tambah Dokumentasi Pembinaan</h1>
          <p className="text-sm text-muted-foreground">
            Unggah dokumentasi kegiatan pembinaan
          </p>
        </div>
      </div>

      <DokumentasiForm />
    </div>
  );
}
