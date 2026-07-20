import { RefKecamatanForm } from '@/components/referensi/kecamatan/ref-kecamatan-form';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { getActiveRefKabupatenList } from '@/app/actions/ref-kabupaten';

export default async function NewRefKecamatanPage() {
  const kabupatenResult = await getActiveRefKabupatenList();

  if (!kabupatenResult.success || !kabupatenResult.data) {
    return (
      <div className="p-4 border border-red-200 bg-red-50 rounded-lg">
        <p className="text-red-600">{kabupatenResult.error || 'Gagal memuat data kabupaten'}</p>
      </div>
    );
  }

  const kabupatenOptions = kabupatenResult.data.map((k) => ({
    id: Number(k.id),
    nama: k.nama,
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" asChild>
          <Link href="/dashboard/referensi/kecamatan">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Kembali
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Tambah Kecamatan Baru</h1>
          <p className="text-sm text-muted-foreground">Isi form untuk menambahkan kecamatan baru</p>
        </div>
      </div>

      <RefKecamatanForm mode="create" kabupatenOptions={kabupatenOptions} />
    </div>
  );
}
