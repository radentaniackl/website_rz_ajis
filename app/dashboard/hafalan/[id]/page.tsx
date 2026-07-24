import { PageHeader } from '@/components/shared/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Pencil, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { getHafalanById, deleteHafalanAction } from '@/app/actions/hafalan';
import { redirect } from 'next/navigation';

const formatDate = (date: string | Date | null | undefined) => {
  if (!date) return '-';
  const d = new Date(date);
  return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
};

const formatDateTime = (date: string | Date | null | undefined) => {
  if (!date) return '-';
  const d = new Date(date);
  return d.toLocaleString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

export const metadata = {
  title: 'Detail Hafalan - AJIS',
  description: 'Detail data hafalan anak',
};

export default async function HafalanDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const hafalanId = parseInt(id);

  if (isNaN(hafalanId)) {
    redirect('/dashboard/hafalan');
  }

  const result = await getHafalanById(hafalanId);

  if (!result.success || !result.data) {
    redirect('/dashboard/hafalan');
  }

  const hafalan = result.data;

  async function handleDelete() {
    'use server';
    const deleteResult = await deleteHafalanAction(hafalanId);
    if (deleteResult.success) {
      redirect('/dashboard/hafalan');
    } else {
      throw new Error(deleteResult.error || 'Gagal menghapus data hafalan');
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Detail Hafalan"
        description="Informasi lengkap data hafalan"
        action={
          <Button variant="outline" asChild>
            <Link href="/dashboard/hafalan">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Kembali
            </Link>
          </Button>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>Informasi Hafalan</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Anak</p>
              <p className="font-medium">{hafalan.anakNama || '-'}</p>
              <p className="text-sm text-muted-foreground">{hafalan.anakKode || '-'}</p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground mb-1">Konten Uji</p>
              <p className="font-medium">{hafalan.kontenUji}</p>
              {hafalan.itemHafalanKonten && (
                <p className="text-sm text-muted-foreground">{hafalan.itemHafalanKonten}</p>
              )}
            </div>

            <div>
              <p className="text-sm text-muted-foreground mb-1">Jenis Hafalan</p>
              <p className="font-medium">{hafalan.jenis || '-'}</p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground mb-1">Tanggal Pengujian</p>
              <p className="font-medium">{formatDate(hafalan.tglPengujian)}</p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground mb-1">Semester</p>
              <Badge variant="outline">{hafalan.semesterNama || '-'}</Badge>
            </div>

            <div>
              <p className="text-sm text-muted-foreground mb-1">Tanggal Input</p>
              <p className="font-medium">{formatDateTime(hafalan.tglInsert)}</p>
            </div>
          </div>

          {hafalan.keterangan && (
            <div>
              <p className="text-sm text-muted-foreground mb-1">Keterangan</p>
              <p className="font-medium">{hafalan.keterangan}</p>
            </div>
          )}

          <div className="flex gap-4 pt-4 border-t">
            <Button asChild>
              <Link href={`/dashboard/hafalan/${hafalanId}/edit`}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </Link>
            </Button>
            <form action={handleDelete}>
              <Button type="submit" variant="destructive">
                <Trash2 className="mr-2 h-4 w-4" />
                Hapus
              </Button>
            </form>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
