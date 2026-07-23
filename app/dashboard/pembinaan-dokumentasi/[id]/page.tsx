import { getPembinaanDokumentasiDetail } from '@/app/actions/pembinaan-dokumentasi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, CheckCircle, XCircle, MoreVertical } from 'lucide-react';
import Link from 'next/link';
import { deletePembinaanDokumentasiAction } from '@/app/actions/pembinaan-dokumentasi';
import { redirect } from 'next/navigation';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

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

  const formatDate = (date: Date | string | null) => {
    if (!date) return '-';
    const d = new Date(date);
    return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });
  };

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
          <h1 className="text-2xl font-bold">Detail Dokumentasi</h1>
          <p className="text-sm text-muted-foreground">Informasi lengkap dokumentasi pembinaan</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>{dokumentasi.nama}</span>
            {dokumentasi.aktif === 'y' ? (
              <Badge className="bg-green-500">
                <CheckCircle className="h-3 w-3 mr-1" />
                Aktif
              </Badge>
            ) : (
              <Badge variant="outline">
                <XCircle className="h-3 w-3 mr-1" />
                Nonaktif
              </Badge>
            )}
          </CardTitle>
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-sm text-muted-foreground mb-2">Informasi Umum</h3>
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Nama</label>
                  <p className="text-sm">{dokumentasi.nama || '-'}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Deskripsi</label>
                  <p className="text-sm">{dokumentasi.deskripsi || '-'}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Tanggal Dokumentasi</label>
                  <p className="text-sm">{formatDate(dokumentasi.tglDokumentasi)}</p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-sm text-muted-foreground mb-2">Relasi</h3>
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Semester ID</label>
                  <p className="text-sm">{dokumentasi.semesterId || '-'}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Kantor ID</label>
                  <p className="text-sm">{dokumentasi.kantorId || '-'}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Wilayah Pembinaan ID</label>
                  <p className="text-sm">{dokumentasi.wilayahPembinaanId || '-'}</p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-sm text-muted-foreground mb-2">File & Link</h3>
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Upload Google Drive</label>
                  <p className="text-sm">{dokumentasi.uploadGdrive || '-'}</p>
                </div>
                {dokumentasi.image && (
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Image URL</label>
                    <p className="text-sm truncate">{dokumentasi.image}</p>
                  </div>
                )}
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-sm text-muted-foreground mb-2">Audit</h3>
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">User Insert</label>
                  <p className="text-sm">{dokumentasi.userInsert || '-'}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Date Insert</label>
                  <p className="text-sm">{formatDate(dokumentasi.dateInsert)}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">User Update</label>
                  <p className="text-sm">{dokumentasi.userUpdate || '-'}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Date Update</label>
                  <p className="text-sm">{formatDate(dokumentasi.dateUpdate)}</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">
              <MoreVertical className="h-4 w-4 mr-2" />
              Aksi
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link href={`/dashboard/pembinaan-dokumentasi/${id}/edit`}>
                Edit
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <form action={async () => {
                'use server';
                await deletePembinaanDokumentasiAction(id);
                redirect('/dashboard/pembinaan-dokumentasi');
              }}>
                <button type="submit" className="w-full text-left text-destructive">
                  Hapus
                </button>
              </form>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
