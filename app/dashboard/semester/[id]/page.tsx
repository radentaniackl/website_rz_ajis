import { getSemesterDetail } from '@/app/actions/semester';
import { PageHeader } from '@/components/shared/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Edit, Trash2, CheckCircle, XCircle } from 'lucide-react';
import Link from 'next/link';
import { deleteSemesterAction, setActiveSemesterAction } from '@/app/actions/semester';
import { redirect } from 'next/navigation';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function SemesterDetailPage({ params }: PageProps) {
  const resolvedParams = await params;
  const id = Number(resolvedParams.id);
  const result = await getSemesterDetail(id);

  if (!result.success || !result.data) {
    return <div>Semester tidak ditemukan</div>;
  }

  const semester = result.data;

  const formatDate = (date: Date | string | null) => {
    if (!date) return '-';
    const d = new Date(date);
    return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Detail Semester"
        description="Informasi lengkap semester"
        action={
          <Button variant="outline" asChild>
            <Link href="/dashboard/semester">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Kembali
            </Link>
          </Button>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>{semester.nama}</span>
            {semester.onprogress === 'y' ? (
              <Badge className="bg-green-500">
                <CheckCircle className="h-3 w-3 mr-1" />
                Aktif
              </Badge>
            ) : (
              <Badge variant="outline">
                <XCircle className="h-3 w-3 mr-1" />
                Tidak Aktif
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
                  <label className="text-xs font-medium text-muted-foreground">Kode Lama</label>
                  <p className="text-sm">{semester.kodeLama || '-'}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Jenis Semester</label>
                  <p className="text-sm">
                    <Badge variant={semester.jenis === 'ganjil' ? 'default' : 'secondary'}>
                      {semester.jenis === 'ganjil' ? 'Ganjil' : 'Genap'}
                    </Badge>
                  </p>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Tahun</label>
                  <p className="text-sm">{semester.tahun || '-'}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Laporan Semester</label>
                  <p className="text-sm">
                    {semester.lapsem === 'y' ? (
                      <Badge variant="outline">Ya</Badge>
                    ) : (
                      <Badge variant="secondary">Tidak</Badge>
                    )}
                  </p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-sm text-muted-foreground mb-2">Periode Semester</h3>
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Tanggal Awal</label>
                  <p className="text-sm">{formatDate(semester.tglAwal)}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Tanggal Akhir</label>
                  <p className="text-sm">{formatDate(semester.tglAkhir)}</p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-sm text-muted-foreground mb-2">Periode Donasi</h3>
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Tanggal Awal Donasi</label>
                  <p className="text-sm">{formatDate(semester.tglAwalDonasi)}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Tanggal Akhir Donasi</label>
                  <p className="text-sm">{formatDate(semester.tglAkhirDonasi)}</p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-sm text-muted-foreground mb-2">Periode Saldo</h3>
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Tanggal Awal Saldo</label>
                  <p className="text-sm">{formatDate(semester.tglAwalSaldo)}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Tanggal Akhir Saldo</label>
                  <p className="text-sm">{formatDate(semester.tglAkhirSaldo)}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t pt-6 mt-6">
            <h3 className="font-semibold text-sm text-muted-foreground mb-2">Audit</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground">User Insert</label>
                <p className="text-sm">{semester.userInsert || '-'}</p>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Date Insert</label>
                <p className="text-sm">{formatDate(semester.dateInsert)}</p>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">User Update</label>
                <p className="text-sm">{semester.userUpdate || '-'}</p>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Date Update</label>
                <p className="text-sm">{formatDate(semester.dateUpdate)}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-4">
        {semester.onprogress !== 'y' && (
          <form action={async () => {
            'use server';
            await setActiveSemesterAction(id);
            redirect(`/dashboard/semester/${id}`);
          }}>
            <Button type="submit" variant="outline">
              <CheckCircle className="h-4 w-4 mr-2" />
              Set Aktif
            </Button>
          </form>
        )}
        <Button variant="outline" asChild>
          <Link href={`/dashboard/semester/${id}/edit`}>
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Link>
        </Button>
        <form action={async () => {
          'use server';
          await deleteSemesterAction(id);
          redirect('/dashboard/semester');
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
