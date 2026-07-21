import { Suspense } from 'react';
import { getWilayahDetail } from '@/app/actions/wilayah';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Pencil } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { auth } from '@/auth';
import { Badge } from '@/components/ui/badge';

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
      <div className="flex items-center justify-between">
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
        <Button asChild>
          <Link href={`/dashboard/wilayah/${id}/edit`}>
            <Pencil className="mr-2 h-4 w-4" />
            Edit
          </Link>
        </Button>
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

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <div className="space-y-4">
        <div>
          <h3 className="text-sm font-medium text-muted-foreground">Kode Lama</h3>
          <p className="text-lg font-semibold">{wilayah.kodeLama ? String(wilayah.kodeLama) : '-'}</p>
        </div>
        <div>
          <h3 className="text-sm font-medium text-muted-foreground">Nama Wilayah</h3>
          <p className="text-lg font-semibold">{wilayah.namaWilayah}</p>
        </div>
        <div>
          <h3 className="text-sm font-medium text-muted-foreground">Alamat Wilayah</h3>
          <p className="text-lg">{wilayah.alamatWilayah || '-'}</p>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <h3 className="text-sm font-medium text-muted-foreground">Kantor ID</h3>
          <p className="text-lg">{wilayah.kantorId ? String(wilayah.kantorId) : '-'}</p>
        </div>
        <div>
          <h3 className="text-sm font-medium text-muted-foreground">Desa ID</h3>
          <p className="text-lg">{wilayah.desaId ? String(wilayah.desaId) : '-'}</p>
        </div>
        <div>
          <h3 className="text-sm font-medium text-muted-foreground">Status Approve</h3>
          <Badge variant={wilayah.statusApprove === 'y' || wilayah.statusApprove === 't' ? 'default' : 'secondary'}>
            {wilayah.statusApprove === 'y' || wilayah.statusApprove === 't' ? 'Approved' : 'Pending'}
          </Badge>
        </div>
        <div>
          <h3 className="text-sm font-medium text-muted-foreground">Status</h3>
          <Badge variant={wilayah.aktif === 'y' ? 'default' : 'secondary'}>
            {wilayah.aktif === 'y' ? 'Aktif' : 'Nonaktif'}
          </Badge>
        </div>
      </div>

      <div className="md:col-span-2 space-y-4 border-t pt-4">
        <div>
          <h3 className="text-sm font-medium text-muted-foreground">User Insert</h3>
          <p className="text-lg">{wilayah.userInsert || '-'}</p>
        </div>
        <div>
          <h3 className="text-sm font-medium text-muted-foreground">Date Insert</h3>
          <p className="text-lg">{wilayah.dateInsert ? new Date(wilayah.dateInsert).toLocaleDateString('id-ID') : '-'}</p>
        </div>
      </div>
    </div>
  );
}
