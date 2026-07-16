import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
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

export default function NewAnakPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/anak">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <PageHeader 
          title="Tambah Anak Baru" 
          description="Isi form di bawah untuk menambahkan data anak baru"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Form Data Anak</CardTitle>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<AnakFormSkeleton />}>
            <div className="text-center py-12 text-muted-foreground">
              Form anak akan diimplementasikan di sini
              <br />
              <span className="text-sm">(Menggunakan React Hook Form + Zod validation)</span>
            </div>
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}
