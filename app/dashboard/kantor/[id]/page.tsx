import { Suspense } from 'react';
import { getKantorDetail } from '@/app/actions/kantor';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Pencil } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { auth } from '@/auth';
import { Badge } from '@/components/ui/badge';

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
      <div className="flex items-center justify-between">
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
        <Button asChild>
          <Link href={`/dashboard/kantor/${id}/edit`}>
            <Pencil className="mr-2 h-4 w-4" />
            Edit
          </Link>
        </Button>
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

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <div className="space-y-4">
        <div>
          <h3 className="text-sm font-medium text-muted-foreground">Kode Kantor</h3>
          <p className="text-lg font-semibold">{kantor.kode}</p>
        </div>
        <div>
          <h3 className="text-sm font-medium text-muted-foreground">Nama Kantor</h3>
          <p className="text-lg font-semibold">{kantor.nama}</p>
        </div>
        <div>
          <h3 className="text-sm font-medium text-muted-foreground">Alamat</h3>
          <p className="text-lg">{kantor.alamat || '-'}</p>
        </div>
        <div>
          <h3 className="text-sm font-medium text-muted-foreground">No Telepon</h3>
          <p className="text-lg">{kantor.noTelp || '-'}</p>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <h3 className="text-sm font-medium text-muted-foreground">Kode Program RZ</h3>
          <p className="text-lg">{kantor.kodeProgramRz || '-'}</p>
        </div>
        <div>
          <h3 className="text-sm font-medium text-muted-foreground">Jenis</h3>
          <p className="text-lg">{kantor.jenis || '-'}</p>
        </div>
        <div>
          <h3 className="text-sm font-medium text-muted-foreground">Kode Kantor Legacy</h3>
          <p className="text-lg">{kantor.kodeKantorLegacy || '-'}</p>
        </div>
        <div>
          <h3 className="text-sm font-medium text-muted-foreground">Status</h3>
          <Badge variant={kantor.aktif === 'y' ? 'default' : 'secondary'}>
            {kantor.aktif === 'y' ? 'Aktif' : 'Nonaktif'}
          </Badge>
        </div>
      </div>

      <div className="md:col-span-2 space-y-4 border-t pt-4">
        <div>
          <h3 className="text-sm font-medium text-muted-foreground">Parent ID</h3>
          <p className="text-lg">{kantor.parentId ? String(kantor.parentId) : '-'}</p>
        </div>
        <div>
          <h3 className="text-sm font-medium text-muted-foreground">Parent Second ID</h3>
          <p className="text-lg">{kantor.parentSecondId ? String(kantor.parentSecondId) : '-'}</p>
        </div>
        <div>
          <h3 className="text-sm font-medium text-muted-foreground">Dibuat pada</h3>
          <p className="text-lg">{new Date(kantor.createdAt).toLocaleString('id-ID')}</p>
        </div>
        <div>
          <h3 className="text-sm font-medium text-muted-foreground">Diperbarui pada</h3>
          <p className="text-lg">{new Date(kantor.updatedAt).toLocaleString('id-ID')}</p>
        </div>
      </div>
    </div>
  );
}
