import { Suspense } from 'react';
import { getRefKabupatenById } from '@/app/actions/ref-kabupaten';
import { RefKabupatenForm } from '@/components/referensi/kabupaten/ref-kabupaten-form';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getActiveRefPropinsiList } from '@/app/actions/ref-propinsi';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditRefKabupatenPage(props: PageProps) {
  const params = await props.params;
  const id = parseInt(params.id);

  if (isNaN(id)) {
    notFound();
  }

  const [kabupatenResult, propinsiResult] = await Promise.all([
    getRefKabupatenById(id),
    getActiveRefPropinsiList(),
  ]);

  if (!kabupatenResult.success || !kabupatenResult.data) {
    notFound();
  }

  if (!propinsiResult.success) {
    return (
      <div className="p-4 border border-red-200 bg-red-50 rounded-lg">
        <p className="text-red-600">{propinsiResult.error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" asChild>
          <Link href="/dashboard/referensi/kabupaten">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Kembali
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Edit Kabupaten/Kota</h1>
          <p className="text-sm text-muted-foreground">Ubah data kabupaten/kota yang ada</p>
        </div>
      </div>

      <RefKabupatenForm
        mode="edit"
        initialData={{
          id: Number(kabupatenResult.data.id),
          kode: kabupatenResult.data.kode,
          nama: kabupatenResult.data.nama,
          propinsiId: kabupatenResult.data.propinsiId,
          isKota: kabupatenResult.data.isKota,
          ibukota: kabupatenResult.data.ibukota,
          aktif: kabupatenResult.data.aktif,
        }}
        propinsiOptions={propinsiResult.data}
      />
    </div>
  );
}
