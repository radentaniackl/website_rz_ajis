import { RefKabupatenForm } from '@/components/referensi/kabupaten/ref-kabupaten-form';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { getActiveRefPropinsiList } from '@/app/actions/ref-propinsi';

export default async function NewRefKabupatenPage() {
  const propinsiResult = await getActiveRefPropinsiList();

  if (!propinsiResult.success || !propinsiResult.data) {
    return (
      <div className="p-4 border border-red-200 bg-red-50 rounded-lg">
        <p className="text-red-600">{propinsiResult.error || 'Gagal memuat data propinsi'}</p>
      </div>
    );
  }

  const propinsiOptions = propinsiResult.data.map((p) => ({
    id: Number(p.id),
    nama: p.nama,
  }));

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
          <h1 className="text-2xl font-bold">Tambah Kabupaten/Kota Baru</h1>
          <p className="text-sm text-muted-foreground">
            Isi form untuk menambahkan kabupaten/kota baru
          </p>
        </div>
      </div>

      <RefKabupatenForm mode="create" propinsiOptions={propinsiOptions} />
    </div>
  );
}
