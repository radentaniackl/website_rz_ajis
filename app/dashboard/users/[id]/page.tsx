import { Suspense } from 'react';
import { getUserDetail } from '@/app/actions/user';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Pencil } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { auth } from '@/auth';
import { Badge } from '@/components/ui/badge';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function UserDetailPage(props: PageProps) {
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
            <h1 className="text-2xl font-bold">Detail User</h1>
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
            <Link href="/dashboard/users">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Kembali
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Detail User</h1>
          </div>
        </div>
        <Button asChild>
          <Link href={`/dashboard/users/${id}/edit`}>
            <Pencil className="mr-2 h-4 w-4" />
            Edit
          </Link>
        </Button>
      </div>

      <Suspense fallback={<div className="p-4">Loading...</div>}>
        <UserDetail id={id} />
      </Suspense>
    </div>
  );
}

async function UserDetail({ id }: { id: number }) {
  const result = await getUserDetail(id);

  if (!result.success || !result.data) {
    notFound();
  }

  const user = result.data;

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <div className="space-y-4">
        <div>
          <h3 className="text-sm font-medium text-muted-foreground">Kode Lama</h3>
          <p className="text-lg font-semibold">{user.kodeLama ? String(user.kodeLama) : '-'}</p>
        </div>
        <div>
          <h3 className="text-sm font-medium text-muted-foreground">Username</h3>
          <p className="text-lg font-semibold">{user.username}</p>
        </div>
        <div>
          <h3 className="text-sm font-medium text-muted-foreground">Email</h3>
          <p className="text-lg">{user.email || '-'}</p>
        </div>
        <div>
          <h3 className="text-sm font-medium text-muted-foreground">NIK</h3>
          <p className="text-lg">{user.nik || '-'}</p>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <h3 className="text-sm font-medium text-muted-foreground">Kantor ID</h3>
          <p className="text-lg">{user.kantorId ? String(user.kantorId) : '-'}</p>
        </div>
        <div>
          <h3 className="text-sm font-medium text-muted-foreground">Group User ID</h3>
          <p className="text-lg">{user.groupUserId ? String(user.groupUserId) : '-'}</p>
        </div>
        <div>
          <h3 className="text-sm font-medium text-muted-foreground">Status</h3>
          <Badge variant={user.aktif === 'y' ? 'default' : 'secondary'}>
            {user.aktif === 'y' ? 'Aktif' : 'Nonaktif'}
          </Badge>
        </div>
        <div>
          <h3 className="text-sm font-medium text-muted-foreground">Password Reset</h3>
          <Badge variant={user.mustResetPassword ? 'destructive' : 'secondary'}>
            {user.mustResetPassword ? 'Required' : 'Not Required'}
          </Badge>
        </div>
        <div>
          <h3 className="text-sm font-medium text-muted-foreground">Account Status</h3>
          <Badge variant={user.lockedUntil ? 'destructive' : 'secondary'}>
            {user.lockedUntil ? 'Locked' : 'Unlocked'}
          </Badge>
        </div>
      </div>

      <div className="md:col-span-2 space-y-4 border-t pt-4">
        <div>
          <h3 className="text-sm font-medium text-muted-foreground">Failed Login Attempts</h3>
          <p className="text-lg">{user.failedLoginAttempts}</p>
        </div>
        <div>
          <h3 className="text-sm font-medium text-muted-foreground">Locked Until</h3>
          <p className="text-lg">{user.lockedUntil ? new Date(user.lockedUntil).toLocaleString('id-ID') : '-'}</p>
        </div>
        <div>
          <h3 className="text-sm font-medium text-muted-foreground">User Insert</h3>
          <p className="text-lg">{user.userInsert || '-'}</p>
        </div>
        <div>
          <h3 className="text-sm font-medium text-muted-foreground">Date Insert</h3>
          <p className="text-lg">{user.dateInsert ? new Date(user.dateInsert).toLocaleString('id-ID') : '-'}</p>
        </div>
      </div>
    </div>
  );
}
