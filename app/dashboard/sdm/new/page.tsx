import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { SdmForm } from "@/components/sdm/sdm-form";

export default function NewSdmPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" asChild>
          <Link href="/dashboard/sdm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Kembali
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Tambah SDM Baru</h1>
          <p className="text-sm text-muted-foreground">
            Masukkan data SDM atau Fasilitator baru
          </p>
        </div>
      </div>

      <SdmForm />
    </div>
  );
}
