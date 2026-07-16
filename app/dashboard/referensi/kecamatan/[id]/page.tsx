import { Suspense } from 'react';
import { getRefKecamatanById } from '@/app/actions/ref-kecamatan';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Edit } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function RefKecamatanDetailPage(props: PageProps) {
  const params = await props.params;
  const id = parseInt(params.id);

  if (isNaN(id)) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard/referensi/kecamatan">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Kembali
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Detail Kecamatan</h1>
            <p className="text-sm text-muted-foreground">Informasi lengkap kecamatan</p>
          </div>
        </div>
        <Button asChild>
          <Link href={`/dashboard/referensi/kecamatan/${id}/edit`}>
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </Link>
        </Button>
      </div>

      <Suspense fallback={<div className="p-4">Loading...</div>}>
        <RefKecamatanDetail id={id} />
      </Suspense>
    </div>
  );
}

async function RefKecamatanDetail({ id }: { id: number }) {
  const result = await getRefKecamatanById(id);
  if (!result.success || !result.data) {
    notFound();
  }

  const data = result.data;

  return (
    <div className="border rounded-lg p-6 space-y-6 max-w-2xl">
      <div className="grid gap-4">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-xl font-semibold">{data.nama}</h2>
            <p className="text-sm text-muted-foreground">Kode: {data.kode}</p>
          </div>
          <Badge variant={data.aktif === 'y' ? 'default' : 'secondary'}>
            {data.aktif === 'y' ? 'Aktif' : 'Nonaktif'}
          </Badge>
        </div>

        <div className="border-t pt-4 grid gap-3">
          <div className="flex justify-between">
            <dt className="text-sm font-medium">Kode Kecamatan</dt>
            <dd className="text-sm">{data.kode}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-sm font-medium">Nama Kecamatan</dt>
            <dd className="text-sm">{data.nama}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-sm font-medium">Kabupaten</dt>
            <dd className="text-sm">{data.kabupatenNama || '-'}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-sm font-medium">Kodepos</dt>
            <dd className="text-sm">{data.kodepos || '-'}</dd>
          </div>
        </div>
      </div>
    </div>
  );
}
