import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/empty-state";
import { FileText } from "lucide-react";

export default function LaporanPage() {
  return (
    <div className="space-y-6">
      <PageHeader 
        title="Laporan Semester" 
        description="Lihat laporan semester anak"
      />

      <Card>
        <CardHeader>
          <CardTitle>Laporan Semester</CardTitle>
          <CardDescription>
            Modul ini sedang dalam pengembangan. Fitur akan segera tersedia.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <EmptyState 
            icon={FileText}
            title="Modul Laporan Semester" 
            description="Fitur laporan semester sedang dalam pengembangan. Silakan kembali nanti."
          />
        </CardContent>
      </Card>
    </div>
  );
}
