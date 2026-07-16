import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/empty-state";
import { BookOpen } from "lucide-react";

export default function HafalanPage() {
  return (
    <div className="space-y-6">
      <PageHeader 
        title="Hafalan" 
        description="Kelola data hafalan anak"
      />

      <Card>
        <CardHeader>
          <CardTitle>Manajemen Hafalan</CardTitle>
          <CardDescription>
            Modul ini sedang dalam pengembangan. Fitur akan segera tersedia.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <EmptyState 
            icon={BookOpen}
            title="Modul Hafalan" 
            description="Fitur manajemen data hafalan sedang dalam pengembangan. Silakan kembali nanti."
          />
        </CardContent>
      </Card>
    </div>
  );
}
