import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { AnakForm } from "@/components/anak/anak-form";
import { getAnakDetail } from "@/app/actions/anak";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { mapAnakToFormValues } from "@/lib/validation/anak-helpers";

async function AnakEditForm({ id }: { id: string }) {
  // Validate id is a valid number
  const idNumber = parseInt(id);
  if (isNaN(idNumber)) {
    notFound();
  }

  const result = await getAnakDetail(idNumber);
  
  if (!result.success || !result.data) {
    notFound();
  }

  const anak = result.data;
  const initialData = mapAnakToFormValues(anak as unknown as Record<string, unknown>);

  return (
    <AnakForm 
      initialData={initialData} 
      isEdit={true}
      anakId={idNumber}
    />
  );
}

export default async function EditAnakPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  const userRole = session?.user?.id_group_user || 1;
  
  // RBAC check: Korwil cannot edit anak (read-only access)
  if (userRole === 9) {
    notFound();
  }
  
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/dashboard/anak/${id}`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <PageHeader 
          title="Edit Data Anak" 
          description="Perbarui informasi data anak"
        />
      </div>

      <AnakEditForm id={id} />
    </div>
  );
}
