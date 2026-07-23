import { Card, CardContent } from "@/components/ui/card";
import { getAnakList } from "@/app/actions/anak";
import { Suspense } from "react";
import { auth } from "@/auth";
import { AnakTableClient } from "@/components/anak/anak-table-client";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";

async function AnakDataWrapper({ userRole }: { userRole: number }) {
  // Fetch a larger dataset so the client-side DataTable can handle filtering and pagination
  const result = await getAnakList({ page: 1, pageSize: 1000, search: "" });
  
  if (!result.success || !result.data) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Gagal memuat data anak
      </div>
    );
  }

  const canCreate = userRole !== 9; // Korwil cannot create anak

  return <AnakTableClient data={result.data.data} userRole={userRole} canCreate={canCreate} />;
}

export default async function AnakPage() {
  const session = await auth();
  const userRole = session?.user?.id_group_user || 1;
  const canCreate = userRole !== 9;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Data Anak"
        description="Kelola data anak binaan"
        action={
          canCreate ? (
            <Button asChild>
              <Link href="/dashboard/anak/new">
                <Plus className="h-4 w-4 mr-2" />
                Tambah Anak
              </Link>
            </Button>
          ) : undefined
        }
      />

      <Card>
        <CardContent className="pt-6">
          <Suspense fallback={<div className="text-center py-8">Memuat data...</div>}>
            <AnakDataWrapper userRole={userRole} />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}

