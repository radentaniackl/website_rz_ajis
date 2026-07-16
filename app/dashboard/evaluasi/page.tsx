import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/empty-state";
import { FileCheck2 } from "lucide-react";

export default function EvaluasiPage() {
  return (
    <div className="space-y-6">
      <PageHeader 
        title="Evaluasi" 
        description="Kelola data evaluasi anak"
      />

      <Card>
        <CardHeader>
          <CardTitle>Manajemen Evaluasi</CardTitle>
          <CardDescription>
            Modul ini sedang dalam pengembangan. Fitur akan segera tersedia.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <EmptyState 
            icon={FileCheck2}
            title="Modul Evaluasi" 
            description="Fitur manajemen data evaluasi sedang dalam pengembangan. Silakan kembali nanti."
          />
        </CardContent>
      </Card>
    </div>
  );
}
