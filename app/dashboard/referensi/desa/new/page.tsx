import { RefDesaForm } from '@/components/referensi/desa/ref-desa-form';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { getActiveRefKecamatanList } from '@/app/actions/ref-kecamatan';

export default async function NewRefDesaPage() {
  const kecamatanResult = await getActiveRefKecamatanList();

  if (!kecamatanResult.success) {
    return (
      <div className="p-4 border border-red-200 bg-red-50 rounded-lg">
        <p className="text-red-600">{kecamatanResult.error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" asChild>
          <Link href="/dashboard/referensi/desa">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Kembali
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Tambah Desa/Kelurahan Baru</h1>
          <p className="text-sm text-muted-foreground">Isi form untuk menambahkan desa/kelurahan baru</p>
        </div>
      </div>

      <RefDesaForm mode="create" kecamatanOptions={kecamatanResult.data} />
    </div>
  );
}
