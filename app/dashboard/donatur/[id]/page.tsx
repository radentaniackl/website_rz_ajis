import { getDonaturDetail } from '@/app/actions/donatur';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, CheckCircle, XCircle, Edit, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { deleteDonaturAction } from '@/app/actions/donatur';
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

export default async function DonaturDetailPage({ params }: PageProps) {
  const resolvedParams = await params;
  const id = Number(resolvedParams.id);
  const result = await getDonaturDetail(id);

  if (!result.success || !result.data) {
    return <div>Donatur tidak ditemukan</div>;
  }

  const donatur = result.data;

  const formatDate = (date: Date | string | null) => {
    if (!date) return '-';
    const d = new Date(date);
    return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' }> = {
      'individu': { label: 'Individu', variant: 'default' },
      'corporate': { label: 'Corporate', variant: 'secondary' },
      'komunitas': { label: 'Komunitas', variant: 'outline' },
      'lembaga': { label: 'Lembaga', variant: 'outline' },
      'masjid': { label: 'Masjid', variant: 'secondary' },
      'sekolah': { label: 'Sekolah', variant: 'outline' },
      'yayasan': { label: 'Yayasan', variant: 'secondary' },
      'instansi': { label: 'Instansi', variant: 'outline' },
      'organisasi': { label: 'Organisasi', variant: 'outline' },
      'media': { label: 'Media', variant: 'outline' },
      'lainnya': { label: 'Lainnya', variant: 'outline' },
    };
    const config = statusMap[status] || { label: status, variant: 'outline' };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" asChild>
          <Link href="/dashboard/donatur">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Kembali
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Detail Donatur</h1>
          <p className="text-sm text-muted-foreground">Informasi lengkap donatur</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>{donatur.namaLengkap}</span>
            {donatur.aktif === 'y' ? (
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
              <h3 className="font-semibold text-sm text-muted-foreground mb-2">Informasi Identitas</h3>
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Kode Lama</label>
                  <p className="text-sm">{donatur.kodeLama || '-'}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Nama Publikasi</label>
                  <p className="text-sm">{donatur.namaPublikasi || '-'}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Status Donatur</label>
                  <p className="text-sm">{getStatusBadge(donatur.statusDonatur)}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Tanggal Lahir</label>
                  <p className="text-sm">{formatDate(donatur.tglLahir)}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Jenis Kelamin</label>
                  <p className="text-sm">
                    {donatur.jenisKelamin === 'l' ? 'Laki-laki' : donatur.jenisKelamin === 'p' ? 'Perempuan' : 'Tidak Diketahui'}
                  </p>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Tanggal Registrasi</label>
                  <p className="text-sm">{formatDate(donatur.tglRegistrasi)}</p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-sm text-muted-foreground mb-2">Status</h3>
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Kirim SMS</label>
                  <p className="text-sm">{donatur.kirimSms === 'y' ? 'Ya' : 'Tidak'}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Verifikasi 1</label>
                  <p className="text-sm">{donatur.verifikasi1 ? '✓ Terverifikasi' : '✗ Belum'}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Verifikasi 2</label>
                  <p className="text-sm">{donatur.verifikasi2 ? '✓ Terverifikasi' : '✗ Belum'}</p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-sm text-muted-foreground mb-2">Alamat</h3>
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Alamat Lengkap</label>
                  <p className="text-sm">{donatur.alamatLengkap || '-'}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Alamat Silaturahmi</label>
                  <p className="text-sm">{donatur.alamatSilaturahmi || '-'}</p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-sm text-muted-foreground mb-2">Kontak</h3>
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Telepon</label>
                  <p className="text-sm">{donatur.telp || '-'}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">HP</label>
                  <p className="text-sm">{donatur.hp || '-'}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Fax</label>
                  <p className="text-sm">{donatur.fax || '-'}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Email</label>
                  <p className="text-sm">{donatur.email || '-'}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Website</label>
                  <p className="text-sm">{donatur.website || '-'}</p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-sm text-muted-foreground mb-2">Kontak Person</h3>
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Nama Kontak</label>
                  <p className="text-sm">{donatur.namaKontak || '-'}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Telepon Kontak</label>
                  <p className="text-sm">{donatur.telpKontak || '-'}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Email Kontak</label>
                  <p className="text-sm">{donatur.emailKontak || '-'}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Jabatan Kontak</label>
                  <p className="text-sm">{donatur.jabatanKontak || '-'}</p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-sm text-muted-foreground mb-2">Rekening</h3>
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Nama Bank</label>
                  <p className="text-sm">{donatur.namaBank || '-'}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Nomor Rekening</label>
                  <p className="text-sm">{donatur.noRekening || '-'}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">NPWP</label>
                  <p className="text-sm">{donatur.npwp || '-'}</p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-sm text-muted-foreground mb-2">Informasi Lainnya</h3>
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">NIA RFO</label>
                  <p className="text-sm">{donatur.niaRfo || '-'}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Nama RFO</label>
                  <p className="text-sm">{donatur.namaRfo || '-'}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Tipe Pelayanan</label>
                  <p className="text-sm">{donatur.tipePelayanan || '-'}</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-4">
        <Button variant="outline" asChild>
          <Link href={`/dashboard/donatur/${id}/edit`}>
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Link>
        </Button>
        <form action={async () => {
          'use server';
          const res = await deleteDonaturAction(id);
          if (res.success) {
            redirect('/dashboard/donatur');
          }
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
