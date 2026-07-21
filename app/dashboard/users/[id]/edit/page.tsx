import { Suspense } from 'react';
import { getUserDetail } from '@/app/actions/user';
import { UserForm } from '@/components/user/user-form';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { auth } from '@/auth';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditUserPage(props: PageProps) {
  const params = await props.params;
  const id = parseInt(params.id);
  const session = await auth();
  const userRole = session?.user?.id_group_user || 1;

  if (isNaN(id)) {
    notFound();
  }

  // RBAC: Only Super Admin and Branch Admin can access users
  if (userRole === 9) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard/users">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Kembali
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Edit User</h1>
            <p className="text-sm text-muted-foreground">
              Ubah data user yang ada
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
          <Link href="/dashboard/users">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Kembali
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Edit User</h1>
          <p className="text-sm text-muted-foreground">
            Ubah data user yang ada
          </p>
        </div>
      </div>

      <Suspense fallback={<div className="p-4">Loading...</div>}>
        <UserEdit id={id} />
      </Suspense>
    </div>
  );
}

async function UserEdit({ id }: { id: number }) {
  const result = await getUserDetail(id);

  if (!result.success || !result.data) {
    notFound();
  }

  return (
    <UserForm
      mode="edit"
      initialData={{
        id: result.data.id ? Number(result.data.id) : id,
        kodeLama: result.data.kodeLama ? Number(result.data.kodeLama) : null,
        username: result.data.username,
        email: result.data.email,
        nik: result.data.nik,
        kantorId: result.data.kantorId ? Number(result.data.kantorId) : null,
        groupUserId: result.data.groupUserId ? Number(result.data.groupUserId) : null,
        aktif: result.data.aktif,
        mustResetPassword: result.data.mustResetPassword,
      }}
    />
  );
}
