import { Suspense } from 'react';
import { getRefKabupatenById } from '@/app/actions/ref-kabupaten';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Edit } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function RefKabupatenDetailPage(props: PageProps) {
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
            <Link href="/dashboard/referensi/kabupaten">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Kembali
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Detail Kabupaten/Kota</h1>
            <p className="text-sm text-muted-foreground">Informasi lengkap kabupaten/kota</p>
          </div>
        </div>
        <Button asChild>
          <Link href={`/dashboard/referensi/kabupaten/${id}/edit`}>
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </Link>
        </Button>
      </div>

      <Suspense fallback={<div className="p-4">Loading...</div>}>
        <RefKabupatenDetail id={id} />
      </Suspense>
    </div>
  );
}

async function RefKabupatenDetail({ id }: { id: number }) {
  const result = await getRefKabupatenById(id);

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
            <dt className="text-sm font-medium">Kode Kabupaten/Kota</dt>
            <dd className="text-sm">{data.kode}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-sm font-medium">Nama Kabupaten/Kota</dt>
            <dd className="text-sm">{data.nama}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-sm font-medium">Propinsi</dt>
            <dd className="text-sm">{data.propinsiNama || '-'}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-sm font-medium">Ibukota</dt>
            <dd className="text-sm">{data.ibukota || '-'}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-sm font-medium">Jenis</dt>
            <dd className="text-sm">{data.isKota ? 'Kota' : 'Kabupaten'}</dd>
          </div>
        </div>
      </div>
    </div>
  );
}
