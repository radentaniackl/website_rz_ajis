import { Suspense } from 'react';
import { getWilayahDetail } from '@/app/actions/wilayah';
import { WilayahForm } from '@/components/wilayah/wilayah-form';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { auth } from '@/auth';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditWilayahPage(props: PageProps) {
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
            <h1 className="text-2xl font-bold">Edit Wilayah</h1>
            <p className="text-sm text-muted-foreground">
              Ubah data wilayah yang ada
            </p>
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
          <h1 className="text-2xl font-bold">Edit Wilayah</h1>
          <p className="text-sm text-muted-foreground">
            Ubah data wilayah yang ada
          </p>
        </div>
      </div>

      <Suspense fallback={<div className="p-4">Loading...</div>}>
        <WilayahEdit id={id} />
      </Suspense>
    </div>
  );
}

async function WilayahEdit({ id }: { id: number }) {
  const result = await getWilayahDetail(id);

  if (!result.success || !result.data) {
    notFound();
  }

  return (
    <WilayahForm
      mode="edit"
      initialData={{
        id: result.data.id ? Number(result.data.id) : id,
        kodeLama: result.data.kodeLama ? Number(result.data.kodeLama) : null,
        namaWilayah: result.data.namaWilayah,
        alamatWilayah: result.data.alamatWilayah,
        kantorId: result.data.kantorId ? Number(result.data.kantorId) : null,
        desaId: result.data.desaId ? Number(result.data.desaId) : null,
        statusApprove: result.data.statusApprove,
        aktif: result.data.aktif,
      }}
    />
  );
}
