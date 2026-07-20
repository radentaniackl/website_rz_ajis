import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { AnakForm } from "@/components/anak/anak-form";
import { getAnakDetail } from "@/app/actions/anak";
import { updateAnakAction } from "@/app/actions/anak";
import { notFound } from "next/navigation";
import { redirect } from "next/navigation";
import { auth } from "@/auth";

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

  // Transform database data to match schema types
  const initialData: any = {
    ...anak,
    jnsKel: anak.jnsKel as "L" | "P",
    tglLahir: anak.tglLahir || "",
    tglTerdaftar: anak.tglTerdaftar || "",
    tglPengajuan: anak.tglPengajuan || "",
    tglKematianAyah: anak.tglKematianAyah || "",
    tglKematianIbu: anak.tglKematianIbu || "",
    tglPeminjaman: anak.tglPeminjaman || "",
    tglExpired: anak.tglExpired || "",
    penghasilanAyah: anak.penghasilanAyah ? Number(anak.penghasilanAyah) : undefined,
    penghasilanIbu: anak.penghasilanIbu ? Number(anak.penghasilanIbu) : undefined,
    penghasilanWali: anak.penghasilanWali ? Number(anak.penghasilanWali) : undefined,
    penghasilanTinggal: anak.penghasilanTinggal ? Number(anak.penghasilanTinggal) : undefined,
    // Handle enum fields with proper validation
    statusSurvey: (anak.statusSurvey === 'y' || anak.statusSurvey === 'n') ? anak.statusSurvey : 'n',
    statusKelayakan: (anak.statusKelayakan === 'y' || anak.statusKelayakan === 'n') ? anak.statusKelayakan : 'n',
    statusPinjam: (anak.statusPinjam === 'y' || anak.statusPinjam === 'n') ? anak.statusPinjam : 'n',
    statusMentor: (anak.statusMentor === 'y' || anak.statusMentor === 'n') ? anak.statusMentor : 'n',
    aktif: (anak.aktif === 'y' || anak.aktif === 'n') ? anak.aktif : 'y',
  };

  return (
    <AnakForm 
      initialData={initialData} 
      isEdit={true}
      anakId={parseInt(id)}
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
