import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/empty-state";
import { Building2 } from "lucide-react";

export default function KantorPage() {
  return (
    <div className="space-y-6">
      <PageHeader 
        title="Kantor" 
        description="Kelola data kantor cabang"
      />

      <Card>
        <CardHeader>
          <CardTitle>Manajemen Kantor</CardTitle>
          <CardDescription>
            Modul ini sedang dalam pengembangan. Fitur akan segera tersedia.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <EmptyState 
            icon={Building2}
            title="Modul Kantor" 
            description="Fitur manajemen data kantor sedang dalam pengembangan. Silakan kembali nanti."
          />
        </CardContent>
      </Card>
    </div>
  );
}
