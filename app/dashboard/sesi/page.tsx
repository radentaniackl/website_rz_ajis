import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/empty-state";
import { CalendarDays } from "lucide-react";

export default function SesiPage() {
  return (
    <div className="space-y-6">
      <PageHeader 
        title="Sesi Pembinaan" 
        description="Kelola data sesi pembinaan"
      />

      <Card>
        <CardHeader>
          <CardTitle>Manajemen Sesi Pembinaan</CardTitle>
          <CardDescription>
            Modul ini sedang dalam pengembangan. Fitur akan segera tersedia.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <EmptyState 
            icon={CalendarDays}
            title="Modul Sesi Pembinaan" 
            description="Fitur manajemen data sesi pembinaan sedang dalam pengembangan. Silakan kembali nanti."
          />
        </CardContent>
      </Card>
    </div>
  );
}
