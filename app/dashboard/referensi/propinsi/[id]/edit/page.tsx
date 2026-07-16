import { Suspense } from 'react';
import { getRefPropinsiById } from '@/app/actions/ref-propinsi';
import { RefPropinsiForm } from '@/components/referensi/propinsi/ref-propinsi-form';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditRefPropinsiPage(props: PageProps) {
  const params = await props.params;
  const id = parseInt(params.id);

  if (isNaN(id)) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" asChild>
          <Link href="/dashboard/referensi/propinsi">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Kembali
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Edit Propinsi</h1>
          <p className="text-sm text-muted-foreground">
            Ubah data propinsi yang ada
          </p>
        </div>
      </div>

      <Suspense fallback={<div className="p-4">Loading...</div>}>
        <RefPropinsiEdit id={id} />
      </Suspense>
    </div>
  );
}

async function RefPropinsiEdit({ id }: { id: number }) {
  const result = await getRefPropinsiById(id);

  if (!result.success || !result.data) {
    notFound();
  }

  return (
    <RefPropinsiForm
      mode="edit"
      initialData={{
        id: result.data.id ? Number(result.data.id) : id,
        kode: result.data.kode,
        nama: result.data.nama,
        ibukota: result.data.ibukota,
        aktif: result.data.aktif,
      }}
    />
  );
}
