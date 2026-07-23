import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { SdmForm } from "@/components/sdm/sdm-form";
import { getSdmDetail } from "@/app/actions/sdm";
import { redirect } from "next/navigation";

export default async function EditSdmPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = await params;
  const id = parseInt(resolvedParams.id);
  
  if (isNaN(id)) {
    redirect('/dashboard/sdm');
  }

  const result = await getSdmDetail(id);
  
  if (!result.success || !result.data) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-xl font-bold text-red-600 mb-2">Error</h2>
        <p>{result.error || "Data SDM tidak ditemukan"}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Ubah Data SDM" 
        description={`Mengedit data SDM: ${result.data.namaLengkap}`}
        backButton={true}
      />
      <Card>
        <CardContent className="pt-6">
          <SdmForm initialData={result.data} />
        </CardContent>
      </Card>
    </div>
  );
}
