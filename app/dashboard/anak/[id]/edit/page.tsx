import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { AnakForm } from "@/components/anak/anak-form";
import { getAnakDetail } from "@/app/actions/anak";
import { updateAnakAction } from "@/app/actions/anak";
import { notFound } from "next/navigation";
import { redirect } from "next/navigation";

async function AnakEditForm({ id }: { id: string }) {
  const result = await getAnakDetail(parseInt(id));
  
  if (!result.success) {
    if (result.error === 'Forbidden - You do not have access to this anak' || result.error === 'Forbidden - You do not have permission to edit this anak') {
      return (
        <div className="text-center py-12">
          <p className="text-destructive font-medium">Akses Ditolak</p>
          <p className="text-muted-foreground mt-2">Anda tidak memiliki akses untuk mengedit data anak ini.</p>
        </div>
      );
    }
    return (
      <div className="text-center py-12">
        <p className="text-destructive font-medium">Terjadi Kesalahan</p>
        <p className="text-muted-foreground mt-2">{result.error || 'Gagal memuat data anak'}</p>
      </div>
    );
  }

  const anak = result.data;
  if (!anak) {
    return (
      <div className="text-center py-12">
        <p className="text-destructive font-medium">Data Tidak Ditemukan</p>
        <p className="text-muted-foreground mt-2">Data anak tidak ditemukan atau telah dihapus.</p>
      </div>
    );
  }

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

  const handleSubmit = async (data: any) => {
    const result = await updateAnakAction(parseInt(id), data);
    if (result.success) {
      redirect(`/dashboard/anak/${id}`);
    }
    return result;
  };

  return (
    <AnakForm 
      initialData={initialData} 
      onSubmit={handleSubmit} 
      isEdit={true} 
    />
  );
}

export default function EditAnakPage({
  params,
}: {
  params: { id: string };
}) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/dashboard/anak/${params.id}`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <PageHeader 
          title="Edit Data Anak" 
          description="Perbarui informasi data anak"
        />
      </div>

      <AnakEditForm id={params.id} />
    </div>
  );
}
