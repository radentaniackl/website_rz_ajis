import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/empty-state";
import { Award } from "lucide-react";

export default function PrestasiPage() {
  return (
    <div className="space-y-6">
      <PageHeader 
        title="Laporan Prestasi" 
        description="Lihat laporan prestasi anak"
      />

      <Card>
        <CardHeader>
          <CardTitle>Laporan Prestasi</CardTitle>
          <CardDescription>
            Modul ini sedang dalam pengembangan. Fitur akan segera tersedia.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <EmptyState 
            icon={Award}
            title="Modul Laporan Prestasi" 
            description="Fitur laporan prestasi sedang dalam pengembangan. Silakan kembali nanti."
          />
        </CardContent>
      </Card>
    </div>
  );
}
