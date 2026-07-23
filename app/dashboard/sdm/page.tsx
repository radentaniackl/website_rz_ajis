import { getSdmList } from "@/app/actions/sdm";
import { Suspense } from "react";
import { auth } from "@/auth";
import { SdmTableClient } from "@/components/sdm/sdm-table-client";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";

interface PageProps {
  searchParams: Promise<{
    page?: string;
    search?: string;
  }>;
}

async function SdmDataWrapper({
  userRole,
  page,
  search,
}: {
  userRole: number;
  page: number;
  search?: string;
}) {
  const result = await getSdmList({ page, pageSize: 20, search });

  if (!result.success || !result.data) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Gagal memuat data SDM
      </div>
    );
  }

  const canCreate = userRole !== 9;

  return (
    <SdmTableClient
      data={result.data.data}
      total={result.data.total}
      page={result.data.page}
      pageSize={result.data.pageSize}
      search={search || ""}
      userRole={userRole}
      canCreate={canCreate}
    />
  );
}

export default async function SdmPage(props: PageProps) {
  const searchParams = await props.searchParams;
  const session = await auth();
  const userRole = session?.user?.id_group_user || 1;
  const page = parseInt(searchParams.page || "1");
  const search = searchParams.search;
  const canCreate = userRole !== 9;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Data SDM / Fasilitator"
        description="Kelola data SDM, Relawan, dan Fasilitator"
        action={
          canCreate ? (
            <Button asChild>
              <Link href="/dashboard/sdm/new">
                <Plus className="mr-2 h-4 w-4" />
                Tambah SDM
              </Link>
            </Button>
          ) : undefined
        }
      />

      <Card>
        <CardContent className="pt-6">
          <Suspense fallback={<div className="text-center py-8">Memuat data...</div>}>
            <SdmDataWrapper userRole={userRole} page={page} search={search} />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}
