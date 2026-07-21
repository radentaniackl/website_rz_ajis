import { Suspense } from 'react';
import { getKantorDetail } from '@/app/actions/kantor';
import { KantorForm } from '@/components/kantor/kantor-form';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { auth } from '@/auth';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditKantorPage(props: PageProps) {
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
            <h1 className="text-2xl font-bold">Edit Kantor</h1>
            <p className="text-sm text-muted-foreground">
              Ubah data kantor yang ada
            </p>
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
          <h1 className="text-2xl font-bold">Edit Kantor</h1>
          <p className="text-sm text-muted-foreground">
            Ubah data kantor yang ada
          </p>
        </div>
      </div>

      <Suspense fallback={<div className="p-4">Loading...</div>}>
        <KantorEdit id={id} />
      </Suspense>
    </div>
  );
}

async function KantorEdit({ id }: { id: number }) {
  const result = await getKantorDetail(id);

  if (!result.success || !result.data) {
    notFound();
  }

  return (
    <KantorForm
      mode="edit"
      initialData={{
        id: result.data.id ? Number(result.data.id) : id,
        kode: result.data.kode,
        nama: result.data.nama,
        alamat: result.data.alamat,
        noTelp: result.data.noTelp,
        parentId: result.data.parentId ? Number(result.data.parentId) : null,
        parentSecondId: result.data.parentSecondId ? Number(result.data.parentSecondId) : null,
        kodeProgramRz: result.data.kodeProgramRz,
        jenis: result.data.jenis,
        kodeKantorLegacy: result.data.kodeKantorLegacy,
        aktif: result.data.aktif,
      }}
    />
  );
}
