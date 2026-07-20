import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { AnakForm } from "@/components/anak/anak-form";
import { createAnakAction } from "@/app/actions/anak";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { notFound } from "next/navigation";

export default async function NewAnakPage() {
  const session = await auth();
  const userRole = session?.user?.id_group_user || 1;
  
  // RBAC check: Korwil cannot create anak (read-only access)
  if (userRole === 9) {
    notFound();
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
