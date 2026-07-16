import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/empty-state";
import { Map } from "lucide-react";

export default function WilayahPage() {
  return (
    <div className="space-y-6">
      <PageHeader 
        title="Wilayah" 
        description="Kelola data wilayah pembinaan"
      />

      <Card>
        <CardHeader>
          <CardTitle>Manajemen Wilayah</CardTitle>
          <CardDescription>
            Modul ini sedang dalam pengembangan. Fitur akan segera tersedia.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <EmptyState 
            icon={Map}
            title="Modul Wilayah" 
            description="Fitur manajemen data wilayah sedang dalam pengembangan. Silakan kembali nanti."
          />
        </CardContent>
      </Card>
    </div>
  );
}
