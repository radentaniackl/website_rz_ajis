import { RefKecamatanForm } from '@/components/referensi/kecamatan/ref-kecamatan-form';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getRefKecamatanById } from '@/app/actions/ref-kecamatan';
import { getActiveRefKabupatenList } from '@/app/actions/ref-kabupaten';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditRefKecamatanPage(props: PageProps) {
  const params = await props.params;
  const id = parseInt(params.id);

  if (isNaN(id)) {
    notFound();
  }

  const [kecamatanResult, kabupatenResult] = await Promise.all([
    getRefKecamatanById(id),
    getActiveRefKabupatenList(),
  ]);

  if (!kecamatanResult.success || !kecamatanResult.data) {
    notFound();
  }

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
          <h1 className="text-2xl font-bold">Edit Kecamatan</h1>
          <p className="text-sm text-muted-foreground">Ubah data kecamatan yang ada</p>
        </div>
      </div>

      <RefKecamatanForm
        mode="edit"
        initialData={{
          id: Number(kecamatanResult.data.id),
          kode: kecamatanResult.data.kode,
          nama: kecamatanResult.data.nama,
          kabupatenId: kecamatanResult.data.kabupatenId,
          kodepos: kecamatanResult.data.kodepos,
          aktif: kecamatanResult.data.aktif,
        }}
        kabupatenOptions={kabupatenOptions}
      />
    </div>
  );
}
