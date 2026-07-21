import { getPembinaanDokumentasiDetail } from '@/app/actions/pembinaan-dokumentasi';
import { PageHeader } from '@/components/shared/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Edit, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { deletePembinaanDokumentasiAction } from '@/app/actions/pembinaan-dokumentasi';
import { redirect } from 'next/navigation';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function PembinaanDokumentasiDetailPage({ params }: PageProps) {
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
        title="Detail Dokumentasi"
        description="Informasi lengkap dokumentasi pembinaan"
        action={
          <Button variant="outline" asChild>
            <Link href="/dashboard/pembinaan-dokumentasi">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Kembali
            </Link>
          </Button>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>{dokumentasi.nama}</CardTitle>
        </CardHeader>
        <CardContent>
          {dokumentasi.image && (
            <div className="mb-6">
              <img
                src={dokumentasi.image}
                alt={dokumentasi.nama}
                className="w-full max-w-2xl rounded-lg object-cover"
              />
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Semester ID</label>
              <p className="text-sm">{dokumentasi.semesterId || '-'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Kantor ID</label>
              <p className="text-sm">{dokumentasi.kantorId || '-'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Wilayah Pembinaan ID</label>
              <p className="text-sm">{dokumentasi.wilayahPembinaanId || '-'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Upload Google Drive</label>
              <p className="text-sm">{dokumentasi.uploadGdrive || '-'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-4">
        <Button variant="outline" asChild>
          <Link href={`/dashboard/pembinaan-dokumentasi/${id}/edit`}>
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Link>
        </Button>
        <form action={async () => {
          'use server';
          await deletePembinaanDokumentasiAction(id);
          redirect('/dashboard/pembinaan-dokumentasi');
        }}>
          <Button type="submit" variant="destructive">
            <Trash2 className="h-4 w-4 mr-2" />
            Hapus
          </Button>
        </form>
      </div>
    </div>
  );
}
