import { getSdmDetail } from '@/app/actions/sdm';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Edit, Trash2, CheckCircle, XCircle } from 'lucide-react';
import Link from 'next/link';
import { deleteSdmAction } from '@/app/actions/sdm';
import { redirect, notFound } from 'next/navigation';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function SdmDetailPage({ params }: PageProps) {
  const resolvedParams = await params;
  const id = Number(resolvedParams.id);

  if (isNaN(id)) {
    notFound();
  }

  const result = await getSdmDetail(id);

  if (!result.success || !result.data) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard/sdm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Kembali
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Detail SDM</h1>
          </div>
        </div>
        <div className="p-4 border border-red-200 bg-red-50 rounded-lg">
          <p className="text-red-600">Data SDM tidak ditemukan</p>
        </div>
      </div>
    );
  }

  const sdm = result.data;

  const formatDate = (date: Date | string | null) => {
    if (!date) return '-';
    const d = new Date(date);
    return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" asChild>
          <Link href="/dashboard/sdm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Kembali
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Detail SDM / Fasilitator</h1>
          <p className="text-sm text-muted-foreground">Informasi lengkap data SDM</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>{sdm.namaLengkap}</span>
            {sdm.aktif === 'y' ? (
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
              <h3 className="font-semibold text-sm text-muted-foreground mb-2">Informasi Pribadi</h3>
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">NIK KTP</label>
                  <p className="text-sm">{sdm.nik || '-'}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Nama Lengkap</label>
                  <p className="text-sm">{sdm.namaLengkap || '-'}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Jenis Kelamin</label>
                  <p className="text-sm">{sdm.jenisKelamin === 'l' ? 'Laki-laki' : sdm.jenisKelamin === 'p' ? 'Perempuan' : '-'}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Jenjang Pendidikan</label>
                  <p className="text-sm">{sdm.jenjangPendidikan || '-'}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Alamat</label>
                  <p className="text-sm">{sdm.alamat || '-'}</p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-sm text-muted-foreground mb-2">Kontak & Penugasan</h3>
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">No. HP / WhatsApp</label>
                  <p className="text-sm">{sdm.hp || '-'}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">No. Telepon</label>
                  <p className="text-sm">{sdm.telp || '-'}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Email</label>
                  <p className="text-sm">{sdm.email || '-'}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">ID Penugasan Kantor</label>
                  <p className="text-sm">{sdm.penugasanKantorId ? String(sdm.penugasanKantorId) : '-'}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">ID Penugasan Wilayah</label>
                  <p className="text-sm">{sdm.penugasanWilayahId ? String(sdm.penugasanWilayahId) : '-'}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Fungsi / Jabatan</label>
                  <p className="text-sm">{sdm.penugasanFungsiStruktur || '-'}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Tanggal Bergabung</label>
                  <p className="text-sm">{formatDate(sdm.tglBergabung)}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t pt-6 mt-6">
            <h3 className="font-semibold text-sm text-muted-foreground mb-2">Audit</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground">User Insert</label>
                <p className="text-sm">{sdm.userInsert || '-'}</p>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Date Insert</label>
                <p className="text-sm">{formatDate(sdm.dateInsert)}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-4">
        <Button variant="outline" asChild>
          <Link href={`/dashboard/sdm/${id}/edit`}>
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Link>
        </Button>
        <form action={async () => {
          'use server';
          await deleteSdmAction(id);
          redirect('/dashboard/sdm');
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
