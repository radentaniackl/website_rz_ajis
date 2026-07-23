import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getSdmList } from "@/app/actions/sdm";
import { Suspense } from "react";
import { auth } from "@/auth";
import { SdmTableClient } from "@/components/sdm/sdm-table-client";

async function SdmDataWrapper({ userRole }: { userRole: number }) {
  // Fetch a larger dataset so the client-side DataTable can handle filtering and pagination
  const result = await getSdmList({ page: 1, pageSize: 1000, search: "" });
  
  if (!result.success || !result.data) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Gagal memuat data SDM
      </div>
    );
  }

  // Determine permissions based on user role
  const canCreate = userRole !== 9; // Korwil cannot create SDM by default? Usually Admin/Cabang

  return <SdmTableClient data={result.data.data} userRole={userRole} canCreate={canCreate} />;
}

export default async function SdmPage() {
  const session = await auth();
  const userRole = session?.user?.id_group_user || 1;

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Data SDM / Fasilitator" 
        description="Kelola data SDM, Relawan, dan Fasilitator"
      />

      <Card>
        <CardHeader>
          <CardTitle>Daftar SDM</CardTitle>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<div className="text-center py-8">Memuat data...</div>}>
            <SdmDataWrapper userRole={userRole} />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}
