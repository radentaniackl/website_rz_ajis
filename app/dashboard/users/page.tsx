import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/empty-state";
import { Users } from "lucide-react";

export default function UsersPage() {
  return (
    <div className="space-y-6">
      <PageHeader 
        title="Users" 
        description="Kelola data pengguna sistem"
      />

      <Card>
        <CardHeader>
          <CardTitle>Manajemen Users</CardTitle>
          <CardDescription>
            Modul ini sedang dalam pengembangan. Fitur akan segera tersedia.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <EmptyState 
            icon={Users}
            title="Modul Users" 
            description="Fitur manajemen data users sedang dalam pengembangan. Silakan kembali nanti."
          />
        </CardContent>
      </Card>
    </div>
  );
}
