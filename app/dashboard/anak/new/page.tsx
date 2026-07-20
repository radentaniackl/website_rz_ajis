import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { AnakForm } from "@/components/anak/anak-form";
import { createAnakAction } from "@/app/actions/anak";
import { redirect } from "next/navigation";
import { auth } from "@/auth";

export default async function NewAnakPage() {
  const session = await auth();
  
  // RBAC check: Korwil cannot create anak (read-only access)
  if (session?.user?.id_group_user === 9) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/anak">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <PageHeader 
            title="Tambah Anak Baru" 
            description="Isi form di bawah untuk menambahkan data anak baru"
          />
        </div>
        <div className="text-center py-12">
          <p className="text-destructive font-medium">Akses Ditolak</p>
          <p className="text-muted-foreground mt-2">Korwil memiliki akses read-only untuk data anak.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/anak">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <PageHeader 
          title="Tambah Anak Baru" 
          description="Isi form di bawah untuk menambahkan data anak baru"
        />
      </div>

      <AnakForm isEdit={false} />
    </div>
  );
}
