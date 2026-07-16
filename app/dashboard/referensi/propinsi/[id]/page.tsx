import { Suspense } from 'react';
import { getRefPropinsiById } from '@/app/actions/ref-propinsi';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Edit } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function RefPropinsiDetailPage(props: PageProps) {
  const params = await props.params;
  const id = parseInt(params.id);

  if (isNaN(id)) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard/referensi/propinsi">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Kembali
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Detail Propinsi</h1>
            <p className="text-sm text-muted-foreground">
              Informasi lengkap data propinsi
            </p>
          </div>
        </div>
        <Button asChild>
          <Link href={`/dashboard/referensi/propinsi/${id}/edit`}>
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </Link>
        </Button>
      </div>

      <Suspense fallback={<div className="p-4">Loading...</div>}>
        <RefPropinsiDetail id={id} />
      </Suspense>
    </div>
  );
}

async function RefPropinsiDetail({ id }: { id: number }) {
  const result = await getRefPropinsiById(id);

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

        <div className="border-t pt-4">
          <h3 className="text-sm font-medium text-muted-foreground mb-2">
            Informasi Propinsi
          </h3>
          <dl className="grid gap-3">
            <div className="flex justify-between">
              <dt className="text-sm font-medium">Kode Propinsi</dt>
              <dd className="text-sm">{data.kode}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm font-medium">Nama Propinsi</dt>
              <dd className="text-sm">{data.nama}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm font-medium">Ibukota</dt>
              <dd className="text-sm">{data.ibukota || '-'}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm font-medium">Status</dt>
              <dd className="text-sm">
                <Badge variant={data.aktif === 'y' ? 'default' : 'secondary'}>
                  {data.aktif === 'y' ? 'Aktif' : 'Nonaktif'}
                </Badge>
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  );
}
