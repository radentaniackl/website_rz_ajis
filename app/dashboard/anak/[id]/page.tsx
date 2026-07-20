import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Edit } from "lucide-react";
import Link from "next/link";
import { getAnakDetail } from "@/app/actions/anak";
import { notFound } from "next/navigation";
import { AnakActions } from "@/components/anak/anak-actions";

async function AnakDetail({ id }: { id: string }) {
  // Validate id is a valid number
  const idNumber = parseInt(id);
  if (isNaN(idNumber)) {
    return (
      <div className="text-center py-12">
        <p className="text-destructive font-medium">ID tidak valid</p>
        <p className="text-muted-foreground mt-2">ID anak harus berupa angka yang valid.</p>
      </div>
    );
  }

  const result = await getAnakDetail(idNumber);
  
  if (!result.success) {
    if (result.error === 'Forbidden - You do not have access to this anak') {
      return (
        <div className="text-center py-12">
          <p className="text-destructive font-medium">Akses Ditolak</p>
          <p className="text-muted-foreground mt-2">Anda tidak memiliki akses untuk melihat data anak ini.</p>
        </div>
      );
    }
    return (
      <div className="text-center py-12">
        <p className="text-destructive font-medium">Terjadi Kesalahan</p>
        <p className="text-muted-foreground mt-2">{result.error || 'Gagal memuat data anak'}</p>
      </div>
    );
  }

  const anak = result.data;

  if (!anak) {
    return (
      <div className="text-center py-12">
        <p className="text-destructive font-medium">Data tidak ditemukan</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">{anak.namaLengkap}</h2>
          <p className="text-muted-foreground">{anak.kodeAnak} - {anak.nik}</p>
        </div>
        <div className="flex gap-2">
          <Link href={`/dashboard/anak/${id}/edit`}>
            <Button variant="outline">
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          </Link>
          <AnakActions id={Number(anak.id)} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Informasi Pribadi</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Nama Lengkap</label>
              <p className="text-base">{anak.namaLengkap}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Nama Panggilan</label>
              <p className="text-base">{anak.namaPanggilan || '-'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Jenis Kelamin</label>
              <p className="text-base">{anak.jnsKel === 'L' || anak.jnsKel === 'l' ? 'Laki-laki' : 'Perempuan'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Tempat, Tanggal Lahir</label>
              <p className="text-base">{anak.tempatLahir || '-'}, {anak.tglLahir ? new Date(anak.tglLahir).toLocaleDateString('id-ID') : '-'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Agama</label>
              <p className="text-base">{anak.agama || '-'}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Informasi Keluarga</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Nama Ayah</label>
              <p className="text-base">{anak.namaLengkapAyah || '-'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Nama Ibu</label>
              <p className="text-base">{anak.namaLengkapIbu || '-'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Nama Wali</label>
              <p className="text-base">{anak.namaLengkapWali || '-'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">No. Kartu Keluarga</label>
              <p className="text-base">{anak.noKartuKeluarga || '-'}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Informasi Pendidikan</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Jenjang Pendidikan</label>
              <p className="text-base">{anak.jenjangPendidikan || '-'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Nama Sekolah</label>
              <p className="text-base">{anak.namaSekolah || '-'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Kelas</label>
              <p className="text-base">{anak.kelas || '-'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Jurusan</label>
              <p className="text-base">{anak.jurusan || '-'}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Informasi Program</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Status</label>
              <p className="text-base">
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                  anak.aktif === 'y' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {anak.aktif === 'y' ? 'Aktif' : 'Nonaktif'}
                </span>
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Tanggal Terdaftar</label>
              <p className="text-base">{anak.tglTerdaftar ? new Date(anak.tglTerdaftar).toLocaleDateString('id-ID') : '-'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Asnaf</label>
              <p className="text-base">{anak.asnaf || '-'}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function AnakDetailPage({
  params,
}: {
  params: { id: string };
}) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/anak">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <PageHeader 
          title="Detail Anak" 
          description="Lihat informasi lengkap anak"
        />
      </div>

      <Card>
        <CardContent className="pt-6">
          <AnakDetail id={params.id} />
        </CardContent>
      </Card>
    </div>
  );
}
