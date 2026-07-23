import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { AnakForm } from "@/components/anak/anak-form";
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
        <Button variant="outline" size="sm" asChild>
          <Link href="/dashboard/anak">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Kembali
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Tambah Anak Baru</h1>
          <p className="text-sm text-muted-foreground">
            Isi form di bawah untuk menambahkan data anak baru
          </p>
        </div>
      </div>

      <AnakForm isEdit={false} />
    </div>
  );
}
