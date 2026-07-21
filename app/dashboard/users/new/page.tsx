import { UserForm } from '@/components/user/user-form';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { auth } from '@/auth';

export default async function NewUserPage() {
  const session = await auth();
  const userRole = session?.user?.id_group_user || 1;

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
            <h1 className="text-2xl font-bold">Tambah User Baru</h1>
            <p className="text-sm text-muted-foreground">
              Isi form di bawah untuk menambah data user baru
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
          <h1 className="text-2xl font-bold">Tambah User Baru</h1>
          <p className="text-sm text-muted-foreground">
            Isi form di bawah untuk menambah data user baru
          </p>
        </div>
      </div>

      <UserForm mode="create" />
    </div>
  );
}
