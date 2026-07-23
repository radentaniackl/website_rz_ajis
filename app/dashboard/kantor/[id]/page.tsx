import { Suspense } from 'react';
import { getKantorDetail } from '@/app/actions/kantor';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, CheckCircle, XCircle, Edit, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { auth } from '@/auth';
import { deleteKantorAction } from '@/app/actions/kantor';
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

export default async function KantorDetailPage(props: PageProps) {
  const params = await props.params;
  const id = parseInt(params.id);
  const session = await auth();
  const userRole = session?.user?.id_group_user || 1;

  if (isNaN(id)) {
    notFound();
  }

  // RBAC: Only Super Admin can access kantor
  if (userRole !== 1) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard/kantor">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Kembali
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Detail Kantor</h1>
          </div>
        </div>
        <div className="p-4 border border-red-200 bg-red-50 rounded-lg">
          <p className="text-red-600">Akses ditolak - Hanya Super Admin yang dapat mengakses modul ini</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" asChild>
          <Link href="/dashboard/kantor">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Kembali
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Detail Kantor</h1>
          <p className="text-sm text-muted-foreground">Informasi lengkap kantor</p>
        </div>
      </div>

      <Suspense fallback={<div className="p-4">Loading...</div>}>
        <KantorDetail id={id} />
      </Suspense>
    </div>
  );
}

async function KantorDetail({ id }: { id: number }) {
  const result = await getKantorDetail(id);

  if (!result.success || !result.data) {
    notFound();
  }

  const kantor = result.data;

  const formatDate = (date: Date | string | null) => {
    if (!date) return '-';
    const d = new Date(date);
    return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>{kantor.nama}</span>
            {kantor.aktif === 'y' ? (
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
                  <label className="text-xs font-medium text-muted-foreground">Kode Kantor</label>
                  <p className="text-sm">{kantor.kode || '-'}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Nama Kantor</label>
                  <p className="text-sm">{kantor.nama || '-'}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Jenis</label>
                  <p className="text-sm">{kantor.jenis || '-'}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Kode Program RZ</label>
                  <p className="text-sm">{kantor.kodeProgramRz || '-'}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Kode Kantor Legacy</label>
                  <p className="text-sm">{kantor.kodeKantorLegacy || '-'}</p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-sm text-muted-foreground mb-2">Kontak & Lokasi</h3>
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Alamat</label>
                  <p className="text-sm">{kantor.alamat || '-'}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">No Telepon</label>
                  <p className="text-sm">{kantor.noTelp || '-'}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Parent ID</label>
                  <p className="text-sm">{kantor.parentId ? String(kantor.parentId) : '-'}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Parent Second ID</label>
                  <p className="text-sm">{kantor.parentSecondId ? String(kantor.parentSecondId) : '-'}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t pt-6 mt-6">
            <h3 className="font-semibold text-sm text-muted-foreground mb-2">Audit</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground">Dibuat pada</label>
                <p className="text-sm">{formatDate(kantor.createdAt)}</p>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Diperbarui pada</label>
                <p className="text-sm">{formatDate(kantor.updatedAt)}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-4">
        <Button variant="outline" asChild>
          <Link href={`/dashboard/kantor/${id}/edit`}>
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Link>
        </Button>
        <form action={async () => {
          'use server';
          await deleteKantorAction(id);
          redirect('/dashboard/kantor');
        }}>
          <Button type="submit" variant="destructive">
            <Trash2 className="h-4 w-4 mr-2" />
            Hapus
          </Button>
        </form>
      </div>
    </>
  );
}
