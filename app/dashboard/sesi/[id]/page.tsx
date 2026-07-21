import { notFound } from 'next/navigation';
import { getPembinaanById } from '@/app/actions/pembinaan';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Edit, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { deletePembinaanAction } from '@/app/actions/pembinaan';

export async function generateMetadata({ params }: { params: { id: string } }) {
  return {
    title: `Detail Sesi Pembinaan - AJIS`,
    description: 'Detail sesi pembinaan anak',
  };
}

export default async function PembinaanDetailPage({ params }: { params: { id: string } }) {
  const result = await getPembinaanById(Number(params.id));

  if (!result.success || !result.data) {
    notFound();
  }

  const pembinaan = result.data;

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/sesi">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Detail Sesi Pembinaan</h1>
          <p className="text-muted-foreground">Informasi lengkap sesi pembinaan</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <CardTitle>Informasi Sesi Pembinaan</CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" asChild>
                <Link href={`/dashboard/sesi/${pembinaan.id}/edit`}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </Link>
              </Button>
              <Button variant="destructive" size="sm" asChild>
                <Link href={`/dashboard/sesi/${pembinaan.id}/delete`}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Hapus
                </Link>
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-sm text-muted-foreground mb-2">ID Sesi</h3>
              <p className="text-lg">{pembinaan.id}</p>
            </div>
            <div>
              <h3 className="font-semibold text-sm text-muted-foreground mb-2">Tanggal Pembinaan</h3>
              <p className="text-lg">{pembinaan.tglPembinaan}</p>
            </div>
            <div>
              <h3 className="font-semibold text-sm text-muted-foreground mb-2">Anak ID</h3>
              <p className="text-lg">{pembinaan.anakId}</p>
            </div>
            <div>
              <h3 className="font-semibold text-sm text-muted-foreground mb-2">Semester ID</h3>
              <p className="text-lg">{pembinaan.semesterId || '-'}</p>
            </div>
            <div>
              <h3 className="font-semibold text-sm text-muted-foreground mb-2">Bulan</h3>
              <p className="text-lg">{pembinaan.bulan || '-'}</p>
            </div>
            <div>
              <h3 className="font-semibold text-sm text-muted-foreground mb-2">Tahun</h3>
              <p className="text-lg">{pembinaan.tahun || '-'}</p>
            </div>
          </div>

          <div className="border-t pt-6">
            <h3 className="font-semibold mb-4">Informasi Pembinaan</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold text-sm text-muted-foreground mb-2">Jenis Pembinaan</h3>
                <p className="text-lg">{pembinaan.jenisPembinaan || '-'}</p>
              </div>
              <div>
                <h3 className="font-semibold text-sm text-muted-foreground mb-2">Judul Materi</h3>
                <p className="text-lg">{pembinaan.judulMateri || '-'}</p>
              </div>
              <div>
                <h3 className="font-semibold text-sm text-muted-foreground mb-2">Kehadiran</h3>
                <p className="text-lg">{pembinaan.kehadiran || '-'}</p>
              </div>
              <div>
                <h3 className="font-semibold text-sm text-muted-foreground mb-2">Keterangan</h3>
                <p className="text-lg">{pembinaan.keterangan || '-'}</p>
              </div>
              <div>
                <h3 className="font-semibold text-sm text-muted-foreground mb-2">Tampil</h3>
                <Badge variant={pembinaan.tampil === 'y' ? 'default' : 'secondary'}>
                  {pembinaan.tampil === 'y' ? 'Ya' : 'Tidak'}
                </Badge>
              </div>
            </div>
          </div>

          {pembinaan.p3a && (
            <div className="border-t pt-6">
              <h3 className="font-semibold mb-2">P3A</h3>
              <p className="text-muted-foreground">{pembinaan.p3a}</p>
            </div>
          )}

          <div className="border-t pt-6">
            <h3 className="font-semibold mb-4">Informasi Pemateri</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold text-sm text-muted-foreground mb-2">Pemateri</h3>
                <p className="text-lg">{pembinaan.pemateri || '-'}</p>
              </div>
              <div>
                <h3 className="font-semibold text-sm text-muted-foreground mb-2">Pemateri Personal</h3>
                <p className="text-lg">{pembinaan.pemateriPersonal || '-'}</p>
              </div>
              <div>
                <h3 className="font-semibold text-sm text-muted-foreground mb-2">Orang Tua Hadir</h3>
                <p className="text-lg">{pembinaan.ortuHadir || '-'}</p>
              </div>
            </div>
          </div>

          <div className="border-t pt-6">
            <h3 className="font-semibold mb-4">Capaian</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold text-sm text-muted-foreground mb-2">Capaian Tilawah</h3>
                <p className="text-lg">{pembinaan.capaianTilawah || '-'}</p>
              </div>
              <div>
                <h3 className="font-semibold text-sm text-muted-foreground mb-2">Capaian Tahfidz</h3>
                <p className="text-lg">{pembinaan.capaianTahfidz || '-'}</p>
              </div>
              <div>
                <h3 className="font-semibold text-sm text-muted-foreground mb-2">Capaian Tahfidz Halaman</h3>
                <p className="text-lg">{pembinaan.capaianTahfidzHalaman || '-'}</p>
              </div>
            </div>
          </div>

          <div className="border-t pt-6">
            <h3 className="font-semibold mb-4">Pembiasaan (Skala 1-5)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold text-sm text-muted-foreground mb-2">Pembiasaan Shalat Wajib</h3>
                <p className="text-lg">{pembinaan.pembiasaanShalatWajib || '-'}</p>
              </div>
              <div>
                <h3 className="font-semibold text-sm text-muted-foreground mb-2">Pembiasaan Tilawah</h3>
                <p className="text-lg">{pembinaan.pembiasaanTilawah || '-'}</p>
              </div>
              <div>
                <h3 className="font-semibold text-sm text-muted-foreground mb-2">Pembiasaan Sedekah</h3>
                <p className="text-lg">{pembinaan.pembiasaanSedekah || '-'}</p>
              </div>
              <div>
                <h3 className="font-semibold text-sm text-muted-foreground mb-2">Membantu Orang Tua</h3>
                <p className="text-lg">{pembinaan.membantuOrtu || '-'}</p>
              </div>
            </div>
          </div>

          <div className="border-t pt-6">
            <h3 className="font-semibold mb-4">Informasi Sistem</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold text-sm text-muted-foreground mb-2">User Insert</h3>
                <p className="text-lg">{pembinaan.userInsert || '-'}</p>
              </div>
              <div>
                <h3 className="font-semibold text-sm text-muted-foreground mb-2">Date Insert</h3>
                <p className="text-lg">{pembinaan.dateInsert || '-'}</p>
              </div>
              <div>
                <h3 className="font-semibold text-sm text-muted-foreground mb-2">User Update</h3>
                <p className="text-lg">{pembinaan.userUpdate || '-'}</p>
              </div>
              <div>
                <h3 className="font-semibold text-sm text-muted-foreground mb-2">Date Update</h3>
                <p className="text-lg">{pembinaan.dateUpdate || '-'}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
