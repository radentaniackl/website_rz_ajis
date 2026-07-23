import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { SdmForm } from "@/components/sdm/sdm-form";

export default function NewSdmPage() {
  return (
    <div className="space-y-6">
      <PageHeader 
        title="Tambah SDM Baru" 
        description="Masukkan data SDM atau Fasilitator baru"
        backButton={true}
      />
      <Card>
        <CardContent className="pt-6">
          <SdmForm />
        </CardContent>
      </Card>
    </div>
  );
}
