import { Suspense } from 'react';
import { getWilayahDetail } from '@/app/actions/wilayah';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, CheckCircle, XCircle, Edit, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { auth } from '@/auth';
import { deleteWilayahAction } from '@/app/actions/wilayah';
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

export default async function WilayahDetailPage(props: PageProps) {
  const params = await props.params;
  const id = parseInt(params.id);
  const session = await auth();
  const userRole = session?.user?.id_group_user || 1;

  if (isNaN(id)) {
    notFound();
  }

  // RBAC: Only Super Admin and Branch Admin can access wilayah
  if (userRole === 9) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard/wilayah">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Kembali
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Detail Wilayah</h1>
          </div>
        </div>
        <div className="p-4 border border-red-200 bg-red-50 rounded-lg">
          <p className="text-red-600">Akses ditolak - Hanya Super Admin dan Branch Admin yang dapat mengakses modul ini</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" asChild>
          <Link href="/dashboard/wilayah">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Kembali
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Detail Wilayah</h1>
          <p className="text-sm text-muted-foreground">Informasi lengkap wilayah pembinaan</p>
        </div>
      </div>

      <Suspense fallback={<div className="p-4">Loading...</div>}>
        <WilayahDetail id={id} />
      </Suspense>
    </div>
  );
}

async function WilayahDetail({ id }: { id: number }) {
  const result = await getWilayahDetail(id);

  if (!result.success || !result.data) {
    notFound();
  }

  const wilayah = result.data;

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
            <span>{wilayah.namaWilayah}</span>
            {wilayah.aktif === 'y' ? (
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
                  <label className="text-xs font-medium text-muted-foreground">Kode Lama</label>
                  <p className="text-sm">{wilayah.kodeLama ? String(wilayah.kodeLama) : '-'}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Nama Wilayah</label>
                  <p className="text-sm">{wilayah.namaWilayah || '-'}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Alamat Wilayah</label>
                  <p className="text-sm">{wilayah.alamatWilayah || '-'}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Status Approve</label>
                  <p className="text-sm">
                    <Badge variant={wilayah.statusApprove === 'y' || wilayah.statusApprove === 't' ? 'default' : 'secondary'}>
                      {wilayah.statusApprove === 'y' || wilayah.statusApprove === 't' ? 'Approved' : 'Pending'}
                    </Badge>
                  </p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-sm text-muted-foreground mb-2">Relasi</h3>
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Kantor ID</label>
                  <p className="text-sm">{wilayah.kantorId ? String(wilayah.kantorId) : '-'}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Desa ID</label>
                  <p className="text-sm">{wilayah.desaId ? String(wilayah.desaId) : '-'}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t pt-6 mt-6">
            <h3 className="font-semibold text-sm text-muted-foreground mb-2">Audit</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground">User Insert</label>
                <p className="text-sm">{wilayah.userInsert || '-'}</p>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Date Insert</label>
                <p className="text-sm">{formatDate(wilayah.dateInsert)}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-4">
        <Button variant="outline" asChild>
          <Link href={`/dashboard/wilayah/${id}/edit`}>
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Link>
        </Button>
        <form action={async () => {
          'use server';
          await deleteWilayahAction(id);
          redirect('/dashboard/wilayah');
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
