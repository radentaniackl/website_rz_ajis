import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Edit, User } from "lucide-react";
import Link from "next/link";
import { getAnakDetail } from "@/app/actions/anak";
import { notFound } from "next/navigation";
import { AnakActions } from "@/components/anak/anak-actions";
import { auth } from "@/auth";

async function AnakDetail({ id, userRole }: { id: string; userRole: number }) {
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

  // Determine permissions based on user role
  const canEdit = userRole !== 9; // Korwil cannot edit anak
  const canDelete = userRole !== 9; // Korwil cannot delete anak

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {anak.foto ? (
            <img
              src={anak.foto as string}
              alt={anak.namaLengkap}
              className="w-20 h-20 rounded-full object-cover border"
            />
          ) : (
            <div className="w-20 h-20 rounded-full bg-slate-200 flex items-center justify-center border">
              <User className="h-10 w-10 text-slate-400" />
            </div>
          )}
          <div>
            <h2 className="text-2xl font-bold">{anak.namaLengkap}</h2>
            <p className="text-muted-foreground">{anak.kodeAnak} - {anak.nik}</p>
          </div>
        </div>
        <div className="flex gap-2">
          {canEdit && (
            <Link href={`/dashboard/anak/${id}/edit`}>
              <Button variant="outline">
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
            </Link>
          )}
          <AnakActions id={Number(anak.id)} canEdit={canEdit} canDelete={canDelete} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Identitas Dasar</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Kode Anak</label>
              <p className="text-sm">{anak.kodeAnak}</p>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">NIK</label>
              <p className="text-sm">{anak.nik}</p>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Nama Lengkap</label>
              <p className="text-sm">{anak.namaLengkap}</p>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Nama Panggilan</label>
              <p className="text-sm">{anak.namaPanggilan || '-'}</p>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Agama</label>
              <p className="text-sm">{anak.agama || '-'}</p>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Jenis Kelamin</label>
              <p className="text-sm">{anak.jnsKel === 'L' || anak.jnsKel === 'l' ? 'Laki-laki' : 'Perempuan'}</p>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Tempat Lahir</label>
              <p className="text-sm">{anak.tempatLahir || '-'}</p>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Tanggal Lahir</label>
              <p className="text-sm">{anak.tglLahir ? new Date(anak.tglLahir).toLocaleDateString('id-ID') : '-'}</p>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Anak Ke</label>
              <p className="text-sm">{anak.anakKe || '-'}</p>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Dari Saudara</label>
              <p className="text-sm">{anak.dariSaudara || '-'}</p>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Alamat</label>
              <p className="text-sm">{anak.alamat || '-'}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pendidikan</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Jenjang Pendidikan</label>
              <p className="text-sm">{anak.jenjangPendidikan || '-'}</p>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Kelas</label>
              <p className="text-sm">{anak.kelas || '-'}</p>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Nama Sekolah</label>
              <p className="text-sm">{anak.namaSekolah || '-'}</p>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Alamat Sekolah</label>
              <p className="text-sm">{anak.alamatSekolah || '-'}</p>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Jurusan</label>
              <p className="text-sm">{anak.jurusan || '-'}</p>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Semester</label>
              <p className="text-sm">{anak.semester || '-'}</p>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Nama PT</label>
              <p className="text-sm">{anak.namaPt || '-'}</p>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Alamat PT</label>
              <p className="text-sm">{anak.alamatPt || '-'}</p>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Nilai</label>
              <p className="text-sm">{anak.nilai || '-'}</p>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Pelajaran Favorit</label>
              <p className="text-sm">{anak.pelajaranFavorit || '-'}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Karakter & Minat</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Jarak Rumah</label>
              <p className="text-sm">{anak.jarakRumah || '-'}</p>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Alat Transportasi</label>
              <p className="text-sm">{anak.alatTransportasi || '-'}</p>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Hobi</label>
              <p className="text-sm">{anak.hobi || '-'}</p>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Prestasi</label>
              <p className="text-sm">{anak.prestasi || '-'}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Keluarga</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground">No. Kartu Keluarga</label>
              <p className="text-sm">{anak.noKartuKeluarga || '-'}</p>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Asnaf</label>
              <p className="text-sm">{anak.asnaf || '-'}</p>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Status Orang Tua</label>
              <p className="text-sm">{anak.statusOrtu || '-'}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Data Ayah</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Nama Lengkap</label>
              <p className="text-sm">{anak.namaLengkapAyah || '-'}</p>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Alamat</label>
              <p className="text-sm">{anak.alamatAyah || '-'}</p>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Pekerjaan</label>
              <p className="text-sm">{anak.pekerjaanAyah || '-'}</p>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Penghasilan</label>
              <p className="text-sm">{anak.penghasilanAyah || '-'}</p>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Tanggal Kematian</label>
              <p className="text-sm">{anak.tglKematianAyah ? new Date(anak.tglKematianAyah).toLocaleDateString('id-ID') : '-'}</p>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Penyebab Kematian</label>
              <p className="text-sm">{anak.penyebabKematianAyah || '-'}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Data Ibu</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Nama Lengkap</label>
              <p className="text-sm">{anak.namaLengkapIbu || '-'}</p>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Alamat</label>
              <p className="text-sm">{anak.alamatIbu || '-'}</p>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Pekerjaan</label>
              <p className="text-sm">{anak.pekerjaanIbu || '-'}</p>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Penghasilan</label>
              <p className="text-sm">{anak.penghasilanIbu || '-'}</p>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Tanggal Kematian</label>
              <p className="text-sm">{anak.tglKematianIbu ? new Date(anak.tglKematianIbu).toLocaleDateString('id-ID') : '-'}</p>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Penyebab Kematian</label>
              <p className="text-sm">{anak.penyebabKematianIbu || '-'}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Data Wali</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Nama Lengkap</label>
              <p className="text-sm">{anak.namaLengkapWali || '-'}</p>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Alamat</label>
              <p className="text-sm">{anak.alamatWali || '-'}</p>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Pekerjaan</label>
              <p className="text-sm">{anak.pekerjaanWali || '-'}</p>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Penghasilan</label>
              <p className="text-sm">{anak.penghasilanWali || '-'}</p>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Telepon Dihubungi</label>
              <p className="text-sm">{anak.telpDihubungi || '-'}</p>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Atas Nama</label>
              <p className="text-sm">{anak.atasNama || '-'}</p>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Hubungan Kerabat</label>
              <p className="text-sm">{anak.hubunganKerabat || '-'}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Status Program</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Status Survey</label>
              <p className="text-sm">{anak.statusSurvey === 'y' ? 'Ya' : 'Tidak'}</p>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Status Kelayakan</label>
              <p className="text-sm">{anak.statusKelayakan === 'y' ? 'Layak' : 'Tidak Layak'}</p>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Status Anak Juara</label>
              <p className="text-sm">{anak.statusAnakJuara || '-'}</p>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Status Tersantuni</label>
              <p className="text-sm">{anak.statusTersantuni || '-'}</p>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Status Pinjam</label>
              <p className="text-sm">{anak.statusPinjam === 'y' ? 'Ya' : 'Tidak'}</p>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Status Mentor</label>
              <p className="text-sm">{anak.statusMentor === 'y' ? 'Ya' : 'Tidak'}</p>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Aktif</label>
              <p className="text-sm">
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
              <label className="text-xs font-medium text-muted-foreground">Alumni Juara</label>
              <p className="text-sm">{anak.alumniJuara || '-'}</p>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Juara</label>
              <p className="text-sm">{anak.juara || '-'}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Organisasi & Penugasan</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Wilayah Pembinaan ID</label>
              <p className="text-sm">{anak.wilayahPembinaanId || '-'}</p>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Kantor ID</label>
              <p className="text-sm">{anak.kantorId || '-'}</p>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">SDM Wilayah ID (Mentor)</label>
              <p className="text-sm">{anak.sdmWilayahId || '-'}</p>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Nama Mentor Manual</label>
              <p className="text-sm">{anak.namaMentorManual || '-'}</p>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Tanggal Terdaftar</label>
              <p className="text-sm">{anak.tglTerdaftar ? new Date(anak.tglTerdaftar).toLocaleDateString('id-ID') : '-'}</p>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Tanggal Pengajuan</label>
              <p className="text-sm">{anak.tglPengajuan ? new Date(anak.tglPengajuan).toLocaleDateString('id-ID') : '-'}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Rekening Bank</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground">No Rekening</label>
              <p className="text-sm">{anak.noRekening || '-'}</p>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Pemilik Rekening</label>
              <p className="text-sm">{anak.pemilikRekening || '-'}</p>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Nama Bank</label>
              <p className="text-sm">{anak.namaBank || '-'}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Program Peminjaman (RFO)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground">NIA RFO Book</label>
              <p className="text-sm">{anak.niaRfoBook || '-'}</p>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Nama RFO Book</label>
              <p className="text-sm">{anak.namaRfoBook || '-'}</p>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Tanggal Peminjaman</label>
              <p className="text-sm">{anak.tglPeminjaman ? new Date(anak.tglPeminjaman).toLocaleDateString('id-ID') : '-'}</p>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Tanggal Expired</label>
              <p className="text-sm">{anak.tglExpired ? new Date(anak.tglExpired).toLocaleDateString('id-ID') : '-'}</p>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Book Via</label>
              <p className="text-sm">{anak.bookVia || '-'}</p>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">User Book</label>
              <p className="text-sm">{anak.userBook || '-'}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tempat Tinggal</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Tinggal Bersama</label>
              <p className="text-sm">{anak.tinggalBersama || '-'}</p>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Nama Tinggal</label>
              <p className="text-sm">{anak.namaTinggal || '-'}</p>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Keterangan Tinggal</label>
              <p className="text-sm">{anak.ketTinggal || '-'}</p>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Penghasilan Tinggal</label>
              <p className="text-sm">{anak.penghasilanTinggal || '-'}</p>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Pekerjaan Tinggal</label>
              <p className="text-sm">{anak.pekerjaanTinggal || '-'}</p>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Tidak Serumah Ortu</label>
              <p className="text-sm">{anak.tidakSerumahOrtu || '-'}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Metadata Input</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Via Input</label>
              <p className="text-sm">{anak.viaInput || '-'}</p>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Approval IJF</label>
              <p className="text-sm">{anak.approvalIjf || '-'}</p>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Kode Program RZ</label>
              <p className="text-sm">{anak.kodeProgramRz || '-'}</p>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Kode Kantor Legacy</label>
              <p className="text-sm">{anak.kodeKantorLegacy || '-'}</p>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Kode IJGS Anak</label>
              <p className="text-sm">{anak.kodeIjgsAnak || '-'}</p>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Upload GDrive</label>
              <p className="text-sm">{anak.uploadGdrive || '-'}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default async function AnakDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  const userRole = session?.user?.id_group_user || 1;
  
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
          <AnakDetail id={id} userRole={userRole} />
        </CardContent>
      </Card>
    </div>
  );
}
