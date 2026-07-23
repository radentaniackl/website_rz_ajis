import { notFound } from 'next/navigation';
import { getPembinaanById } from '@/app/actions/pembinaan';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Edit, Trash2, CheckCircle, XCircle } from 'lucide-react';
import Link from 'next/link';
import { deletePembinaanAction } from '@/app/actions/pembinaan';
import { redirect } from 'next/navigation';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  return {
    title: `Detail Sesi Pembinaan ${resolvedParams.id} - AJIS`,
    description: 'Detail sesi pembinaan anak',
  };
}

export default async function PembinaanDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const result = await getPembinaanById(Number(resolvedParams.id));

  if (!result.success || !result.data) {
    notFound();
  }

  const pembinaan = result.data;

  const formatDate = (date: Date | string | null) => {
    if (!date) return '-';
    const d = new Date(date);
    return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" asChild>
          <Link href="/dashboard/sesi">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Kembali
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Detail Sesi Pembinaan</h1>
          <p className="text-sm text-muted-foreground">Informasi lengkap sesi pembinaan</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Sesi #{pembinaan.id}</span>
            {pembinaan.tampil === 'y' ? (
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-sm text-muted-foreground mb-2">Informasi Umum</h3>
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Tanggal Pembinaan</label>
                  <p className="text-sm">{formatDate(pembinaan.tglPembinaan)}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Anak Binaan</label>
                  <p className="text-sm font-medium">{pembinaan.anakNama ? `${pembinaan.anakNama} (${pembinaan.anakKode || pembinaan.anakId})` : pembinaan.anakId || '-'}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Semester</label>
                  <p className="text-sm">{pembinaan.semesterNama || (pembinaan.semesterId ? `Semester ID: ${pembinaan.semesterId}` : '-')}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Bulan</label>
                  <p className="text-sm">{pembinaan.bulan || '-'}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Tahun</label>
                  <p className="text-sm">{pembinaan.tahun || '-'}</p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-sm text-muted-foreground mb-2">Informasi Pembinaan</h3>
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Jenis Pembinaan</label>
                  <p className="text-sm">{pembinaan.jenisPembinaan || '-'}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Judul Materi</label>
                  <p className="text-sm">{pembinaan.judulMateri || '-'}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Kehadiran</label>
                  <p className="text-sm">{pembinaan.kehadiran || '-'}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Keterangan</label>
                  <p className="text-sm">{pembinaan.keterangan || '-'}</p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-sm text-muted-foreground mb-2">Informasi Pemateri</h3>
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Pemateri</label>
                  <p className="text-sm">{pembinaan.pemateri || '-'}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Pemateri Personal</label>
                  <p className="text-sm">{pembinaan.pemateriPersonal || '-'}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Orang Tua Hadir</label>
                  <p className="text-sm">{pembinaan.ortuHadir || '-'}</p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-sm text-muted-foreground mb-2">Capaian</h3>
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Capaian Tilawah</label>
                  <p className="text-sm">{pembinaan.capaianTilawah || '-'}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Capaian Tahfidz</label>
                  <p className="text-sm">{pembinaan.capaianTahfidz || '-'}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Capaian Tahfidz Halaman</label>
                  <p className="text-sm">{pembinaan.capaianTahfidzHalaman || '-'}</p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-sm text-muted-foreground mb-2">Pembiasaan (Skala 1-5)</h3>
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Pembiasaan Shalat Wajib</label>
                  <p className="text-sm">{pembinaan.pembiasaanShalatWajib || '-'}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Pembiasaan Tilawah</label>
                  <p className="text-sm">{pembinaan.pembiasaanTilawah || '-'}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Pembiasaan Sedekah</label>
                  <p className="text-sm">{pembinaan.pembiasaanSedekah || '-'}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Membantu Orang Tua</label>
                  <p className="text-sm">{pembinaan.membantuOrtu || '-'}</p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-sm text-muted-foreground mb-2">Audit</h3>
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">User Insert</label>
                  <p className="text-sm">{pembinaan.userInsert || '-'}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Date Insert</label>
                  <p className="text-sm">{formatDate(pembinaan.dateInsert)}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">User Update</label>
                  <p className="text-sm">{pembinaan.userUpdate || '-'}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Date Update</label>
                  <p className="text-sm">{formatDate(pembinaan.dateUpdate)}</p>
                </div>
              </div>
            </div>
          </div>

          {pembinaan.p3a && (
            <div className="border-t pt-6 mt-6">
              <h3 className="font-semibold text-sm text-muted-foreground mb-2">P3A</h3>
              <p className="text-sm">{pembinaan.p3a}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end gap-4">
        <Button variant="outline" asChild>
          <Link href={`/dashboard/sesi/${pembinaan.id}/edit`}>
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Link>
        </Button>
        <form action={async () => {
          'use server';
          await deletePembinaanAction(pembinaan.id);
          redirect('/dashboard/sesi');
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
