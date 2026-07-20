import { RefDesaForm } from '@/components/referensi/desa/ref-desa-form';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { getActiveRefKecamatanList } from '@/app/actions/ref-kecamatan';
import { getRefDesaById } from '@/app/actions/ref-desa';
import { notFound } from 'next/navigation';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditRefDesaPage(props: PageProps) {
  const params = await props.params;
  const id = parseInt(params.id);

  if (isNaN(id)) {
    notFound();
  }

  const [desaResult, kecamatanResult] = await Promise.all([
    getRefDesaById(id),
    getActiveRefKecamatanList(),
  ]);

  if (!desaResult.success || !desaResult.data) {
    notFound();
  }

  if (!kecamatanResult.success || !kecamatanResult.data) {
    return (
      <div className="p-4 border border-red-200 bg-red-50 rounded-lg">
        <p className="text-red-600">{kecamatanResult.error || 'Gagal memuat data kecamatan'}</p>
      </div>
    );
  }

  const kecamatanOptions = kecamatanResult.data.map((k) => ({
    id: Number(k.id),
    nama: k.nama,
  }));

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
          <h1 className="text-2xl font-bold">Edit Desa/Kelurahan</h1>
          <p className="text-sm text-muted-foreground">Ubah data desa/kelurahan yang ada</p>
        </div>
      </div>

      <RefDesaForm
        mode="edit"
        initialData={{
          id: Number(desaResult.data.id),
          kode: desaResult.data.kode,
          nama: desaResult.data.nama,
          kecamatanId: desaResult.data.kecamatanId,
          isKelurahan: desaResult.data.isKelurahan,
          nomorIndukDesa: desaResult.data.nomorIndukDesa,
          aktif: desaResult.data.aktif,
        }}
        kecamatanOptions={kecamatanOptions}
      />
    </div>
  );
}
