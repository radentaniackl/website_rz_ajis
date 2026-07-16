import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/empty-state";
import { Settings } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <PageHeader 
        title="Settings" 
        description="Pengaturan sistem"
      />

      <Card>
        <CardHeader>
          <CardTitle>Pengaturan Sistem</CardTitle>
          <CardDescription>
            Modul ini sedang dalam pengembangan. Fitur akan segera tersedia.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <EmptyState 
            icon={Settings}
            title="Modul Settings" 
            description="Fitur pengaturan sistem sedang dalam pengembangan. Silakan kembali nanti."
          />
        </CardContent>
      </Card>
    </div>
  );
}
