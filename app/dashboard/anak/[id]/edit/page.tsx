import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { getAnakDetail } from "@/app/actions/anak";
import { notFound } from "next/navigation";
import { Suspense } from "react";

function AnakFormSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-8 bg-muted animate-pulse rounded" />
      <div className="h-4 bg-muted animate-pulse rounded w-1/2" />
      <div className="space-y-4">
        {[...Array(10)].map((_, i) => (
          <div key={i} className="h-10 bg-muted animate-pulse rounded" />
        ))}
      </div>
    </div>
  );
}

async function AnakEditForm({ id }: { id: string }) {
  const result = await getAnakDetail(parseInt(id));
  
  if (!result.success || !result.data) {
    notFound();
  }

  const anak = result.data;

  return (
    <div className="space-y-6">
      <div className="text-center py-12 text-muted-foreground">
        Form edit anak akan diimplementasikan di sini
        <br />
        <span className="text-sm">(Menggunakan React Hook Form + Zod validation)</span>
        <br />
        <span className="text-xs text-muted-foreground mt-2 block">
          Data anak: {anak.namaLengkap} ({anak.kodeAnak})
        </span>
      </div>
    </div>
  );
}

export default function EditAnakPage({
  params,
}: {
  params: { id: string };
}) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/dashboard/anak/${params.id}`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <PageHeader 
          title="Edit Data Anak" 
          description="Perbarui informasi data anak"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Form Edit Anak</CardTitle>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<AnakFormSkeleton />}>
            <AnakEditForm id={params.id} />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}
