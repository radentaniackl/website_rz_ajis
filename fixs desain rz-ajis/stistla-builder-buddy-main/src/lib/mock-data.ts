// Mock in-memory data for AJIS. 10 rows per table, keyed by ERD field names.
// IDs are consistent so joins render real names.

export type Aktif = "y" | "n";

export interface Propinsi {
  id: number;
  kode: string;
  nama: string;
}
export interface Kabupaten {
  id: number;
  kode: string;
  nama: string;
  propinsi_id: number;
}
export interface Kecamatan {
  id: number;
  kode: string;
  nama: string;
  kabupaten_id: number;
}
export interface Desa {
  id: number;
  kode: string;
  nama: string;
  kecamatan_id: number;
}
export interface Kantor {
  id: number;
  kode: string;
  nama: string;
  alamat: string;
  no_telp: string;
  jenis: "pusat" | "regional" | "cabang";
  parent_id: number | null;
  aktif: Aktif;
}
export interface WilayahPembinaan {
  id: number;
  kode_lama: number;
  nama_wilayah: string;
  alamat_wilayah: string;
  kantor_id: number;
  desa_id: number;
  status_approve: "approved" | "pending" | "rejected";
  aktif: Aktif;
}
export interface JabatanSDM {
  id: number;
  kode: string;
  nama: string;
  level: number;
}
export interface SDM {
  id: number;
  kode_lama: string;
  nama: string;
  nik: string;
  jabatan_id: number;
  kantor_id: number;
  no_hp: string;
  aktif: Aktif;
}
export interface GroupUser {
  id: number;
  nama: string;
  keterangan: string;
  aktif: Aktif;
}
export interface User {
  id: number;
  username: string;
  nik: string;
  kantor_id: number;
  group_user_id: number;
  wilayah_ids: number[];
  aktif: Aktif;
  date_insert: string;
}
export interface Anak {
  id: number;
  kode_lama: string;
  nama: string;
  jenis_kelamin: "L" | "P";
  tanggal_lahir: string;
  wilayah_pembinaan_id: number;
  kantor_id: number;
  nama_wali: string;
  no_hp_wali: string;
  status: "aktif" | "lulus" | "keluar";
}
export interface Sesi {
  id: number;
  tanggal: string;
  wilayah_pembinaan_id: number;
  kantor_id: number;
  materi: string;
  durasi_menit: number;
  jumlah_hadir: number;
  pengajar: string;
}
export interface Hafalan {
  id: number;
  anak_id: number;
  wilayah_pembinaan_id: number;
  surat: string;
  ayat_dari: number;
  ayat_sampai: number;
  nilai: "A" | "B" | "C";
  tanggal: string;
}
export interface Evaluasi {
  id: number;
  anak_id: number;
  wilayah_pembinaan_id: number;
  aspek: string;
  skor: number;
  semester: string;
  tanggal: string;
}
export interface Survey {
  id: number;
  wilayah_pembinaan_id: number;
  judul: string;
  responden: number;
  tanggal: string;
  status: "draft" | "berjalan" | "selesai";
}
export interface LaporanSemester {
  id: number;
  semester: string;
  kantor_id: number;
  wilayah_pembinaan_id: number;
  total_anak: number;
  total_sesi: number;
  rata_hafalan: number;
  status: "draft" | "final";
}

export interface SurveiKelayakan {
  id: number;
  tanggal: string;
  nama_calon: string;
  wilayah_pembinaan_id: number;
  kantor_id: number;
  status_ortu: "yatim" | "piatu" | "yatim_piatu" | "dhuafa";
  penghasilan_wali: number;
  jumlah_saudara: number;
  kondisi_rumah: "layak" | "cukup" | "kurang";
  skor_kelayakan: number;
  rekomendasi: "layak" | "ditinjau" | "tidak_layak";
  catatan: string;
}

export const propinsi: Propinsi[] = [
  { id: 1, kode: "11", nama: "Aceh" },
  { id: 2, kode: "12", nama: "Sumatera Utara" },
  { id: 3, kode: "13", nama: "Sumatera Barat" },
  { id: 4, kode: "31", nama: "DKI Jakarta" },
  { id: 5, kode: "32", nama: "Jawa Barat" },
  { id: 6, kode: "33", nama: "Jawa Tengah" },
  { id: 7, kode: "35", nama: "Jawa Timur" },
  { id: 8, kode: "51", nama: "Bali" },
  { id: 9, kode: "64", nama: "Kalimantan Timur" },
  { id: 10, kode: "73", nama: "Sulawesi Selatan" },
];

export const kabupaten: Kabupaten[] = [
  { id: 1, kode: "1101", nama: "Kab. Aceh Selatan", propinsi_id: 1 },
  { id: 2, kode: "1275", nama: "Kota Medan", propinsi_id: 2 },
  { id: 3, kode: "1371", nama: "Kota Padang", propinsi_id: 3 },
  { id: 4, kode: "3171", nama: "Jakarta Pusat", propinsi_id: 4 },
  { id: 5, kode: "3273", nama: "Kota Bandung", propinsi_id: 5 },
  { id: 6, kode: "3374", nama: "Kota Semarang", propinsi_id: 6 },
  { id: 7, kode: "3578", nama: "Kota Surabaya", propinsi_id: 7 },
  { id: 8, kode: "5171", nama: "Kota Denpasar", propinsi_id: 8 },
  { id: 9, kode: "6472", nama: "Kota Samarinda", propinsi_id: 9 },
  { id: 10, kode: "7371", nama: "Kota Makassar", propinsi_id: 10 },
];

export const kecamatan: Kecamatan[] = [
  { id: 1, kode: "110101", nama: "Trumon", kabupaten_id: 1 },
  { id: 2, kode: "127501", nama: "Medan Kota", kabupaten_id: 2 },
  { id: 3, kode: "137101", nama: "Padang Barat", kabupaten_id: 3 },
  { id: 4, kode: "317101", nama: "Gambir", kabupaten_id: 4 },
  { id: 5, kode: "327301", nama: "Coblong", kabupaten_id: 5 },
  { id: 6, kode: "337401", nama: "Semarang Tengah", kabupaten_id: 6 },
  { id: 7, kode: "357801", nama: "Wonokromo", kabupaten_id: 7 },
  { id: 8, kode: "517101", nama: "Denpasar Selatan", kabupaten_id: 8 },
  { id: 9, kode: "647201", nama: "Samarinda Ulu", kabupaten_id: 9 },
  { id: 10, kode: "737101", nama: "Rappocini", kabupaten_id: 10 },
];

export const desa: Desa[] = [
  { id: 1, kode: "1101010001", nama: "Ladang Rimba", kecamatan_id: 1 },
  { id: 2, kode: "1275010002", nama: "Kesawan", kecamatan_id: 2 },
  { id: 3, kode: "1371010003", nama: "Purus", kecamatan_id: 3 },
  { id: 4, kode: "3171010004", nama: "Petojo Utara", kecamatan_id: 4 },
  { id: 5, kode: "3273010005", nama: "Dago", kecamatan_id: 5 },
  { id: 6, kode: "3374010006", nama: "Pandansari", kecamatan_id: 6 },
  { id: 7, kode: "3578010007", nama: "Sawunggaling", kecamatan_id: 7 },
  { id: 8, kode: "5171010008", nama: "Sanur", kecamatan_id: 8 },
  { id: 9, kode: "6472010009", nama: "Air Hitam", kecamatan_id: 9 },
  { id: 10, kode: "7371010010", nama: "Gunung Sari", kecamatan_id: 10 },
];

export const kantor: Kantor[] = [
  { id: 1, kode: "PST", nama: "Kantor Pusat Jakarta", alamat: "Jl. Sudirman No. 1", no_telp: "021-5550001", jenis: "pusat", parent_id: null, aktif: "y" },
  { id: 2, kode: "REG-SMT", nama: "Regional Sumatera", alamat: "Jl. Diponegoro 45, Medan", no_telp: "061-4550002", jenis: "regional", parent_id: 1, aktif: "y" },
  { id: 3, kode: "REG-JWB", nama: "Regional Jawa Barat", alamat: "Jl. Asia Afrika 88, Bandung", no_telp: "022-4230003", jenis: "regional", parent_id: 1, aktif: "y" },
  { id: 4, kode: "REG-JTG", nama: "Regional Jawa Tengah", alamat: "Jl. Pemuda 12, Semarang", no_telp: "024-3550004", jenis: "regional", parent_id: 1, aktif: "y" },
  { id: 5, kode: "REG-JTM", nama: "Regional Jawa Timur", alamat: "Jl. Basuki Rahmat 21, Surabaya", no_telp: "031-5470005", jenis: "regional", parent_id: 1, aktif: "y" },
  { id: 6, kode: "CBG-MDN", nama: "Cabang Medan Kota", alamat: "Jl. Sisingamangaraja 5", no_telp: "061-7660006", jenis: "cabang", parent_id: 2, aktif: "y" },
  { id: 7, kode: "CBG-PDG", nama: "Cabang Padang", alamat: "Jl. Khatib Sulaiman 10", no_telp: "0751-880007", jenis: "cabang", parent_id: 2, aktif: "y" },
  { id: 8, kode: "CBG-BDG", nama: "Cabang Bandung Utara", alamat: "Jl. Setiabudi 210", no_telp: "022-2010008", jenis: "cabang", parent_id: 3, aktif: "y" },
  { id: 9, kode: "CBG-SBY", nama: "Cabang Surabaya Barat", alamat: "Jl. Mayjen Sungkono 33", no_telp: "031-5610009", jenis: "cabang", parent_id: 5, aktif: "y" },
  { id: 10, kode: "CBG-MKS", nama: "Cabang Makassar", alamat: "Jl. AP Pettarani 8", no_telp: "0411-450010", jenis: "cabang", parent_id: 1, aktif: "n" },
];

export const wilayahPembinaan: WilayahPembinaan[] = [
  { id: 1, kode_lama: 1001, nama_wilayah: "Wilayah Trumon", alamat_wilayah: "Ds. Ladang Rimba", kantor_id: 2, desa_id: 1, status_approve: "approved", aktif: "y" },
  { id: 2, kode_lama: 1002, nama_wilayah: "Wilayah Medan Kesawan", alamat_wilayah: "Jl. Ahmad Yani", kantor_id: 6, desa_id: 2, status_approve: "approved", aktif: "y" },
  { id: 3, kode_lama: 1003, nama_wilayah: "Wilayah Padang Purus", alamat_wilayah: "Jl. Purus III", kantor_id: 7, desa_id: 3, status_approve: "approved", aktif: "y" },
  { id: 4, kode_lama: 1004, nama_wilayah: "Wilayah Jakarta Gambir", alamat_wilayah: "Jl. Kebon Sirih", kantor_id: 1, desa_id: 4, status_approve: "approved", aktif: "y" },
  { id: 5, kode_lama: 1005, nama_wilayah: "Wilayah Bandung Dago", alamat_wilayah: "Jl. Ir. H. Juanda", kantor_id: 8, desa_id: 5, status_approve: "approved", aktif: "y" },
  { id: 6, kode_lama: 1006, nama_wilayah: "Wilayah Semarang Tengah", alamat_wilayah: "Jl. Pandanaran", kantor_id: 4, desa_id: 6, status_approve: "approved", aktif: "y" },
  { id: 7, kode_lama: 1007, nama_wilayah: "Wilayah Surabaya Wonokromo", alamat_wilayah: "Jl. Wonokromo", kantor_id: 9, desa_id: 7, status_approve: "approved", aktif: "y" },
  { id: 8, kode_lama: 1008, nama_wilayah: "Wilayah Denpasar Sanur", alamat_wilayah: "Jl. Danau Tamblingan", kantor_id: 1, desa_id: 8, status_approve: "pending", aktif: "y" },
  { id: 9, kode_lama: 1009, nama_wilayah: "Wilayah Samarinda Ulu", alamat_wilayah: "Jl. AW Syahranie", kantor_id: 1, desa_id: 9, status_approve: "approved", aktif: "y" },
  { id: 10, kode_lama: 1010, nama_wilayah: "Wilayah Makassar Rappocini", alamat_wilayah: "Jl. Rappocini Raya", kantor_id: 10, desa_id: 10, status_approve: "rejected", aktif: "n" },
];

export const jabatanSDM: JabatanSDM[] = [
  { id: 1, kode: "DIR", nama: "Direktur Utama", level: 1 },
  { id: 2, kode: "MGR-REG", nama: "Manajer Regional", level: 2 },
  { id: 3, kode: "MGR-CBG", nama: "Manajer Cabang", level: 3 },
  { id: 4, kode: "KORWIL", nama: "Koordinator Wilayah", level: 4 },
  { id: 5, kode: "PEMBINA", nama: "Pembina", level: 5 },
  { id: 6, kode: "ADM", nama: "Administrasi", level: 5 },
  { id: 7, kode: "KEU", nama: "Keuangan", level: 5 },
  { id: 8, kode: "IT", nama: "IT Support", level: 5 },
  { id: 9, kode: "MRK", nama: "Marketing", level: 5 },
  { id: 10, kode: "MGR-HRD", nama: "Manajer HRD", level: 3 },
];

export const sdm: SDM[] = [
  { id: 1, kode_lama: "S001", nama: "Ahmad Rifai", nik: "3171012501850001", jabatan_id: 1, kantor_id: 1, no_hp: "0812-1111-0001", aktif: "y" },
  { id: 2, kode_lama: "S002", nama: "Siti Nurhaliza", nik: "1275022002900002", jabatan_id: 2, kantor_id: 2, no_hp: "0812-1111-0002", aktif: "y" },
  { id: 3, kode_lama: "S003", nama: "Bambang Sutrisno", nik: "3273031503880003", jabatan_id: 2, kantor_id: 3, no_hp: "0812-1111-0003", aktif: "y" },
  { id: 4, kode_lama: "S004", nama: "Dewi Lestari", nik: "3374041104920004", jabatan_id: 3, kantor_id: 4, no_hp: "0812-1111-0004", aktif: "y" },
  { id: 5, kode_lama: "S005", nama: "Rizky Pratama", nik: "3578052506870005", jabatan_id: 4, kantor_id: 5, no_hp: "0812-1111-0005", aktif: "y" },
  { id: 6, kode_lama: "S006", nama: "Aisyah Putri", nik: "1275061809930006", jabatan_id: 4, kantor_id: 6, no_hp: "0812-1111-0006", aktif: "y" },
  { id: 7, kode_lama: "S007", nama: "Fahmi Idris", nik: "1371072204890007", jabatan_id: 5, kantor_id: 7, no_hp: "0812-1111-0007", aktif: "y" },
  { id: 8, kode_lama: "S008", nama: "Nurul Hidayah", nik: "3273081306940008", jabatan_id: 5, kantor_id: 8, no_hp: "0812-1111-0008", aktif: "y" },
  { id: 9, kode_lama: "S009", nama: "Yusuf Maulana", nik: "3578091507910009", jabatan_id: 6, kantor_id: 9, no_hp: "0812-1111-0009", aktif: "y" },
  { id: 10, kode_lama: "S010", nama: "Fatimah Zahra", nik: "7371102809950010", jabatan_id: 4, kantor_id: 10, no_hp: "0812-1111-0010", aktif: "n" },
];

export const groupUser: GroupUser[] = [
  { id: 1, nama: "Super Admin", keterangan: "Akses penuh seluruh sistem", aktif: "y" },
  { id: 2, nama: "Branch Admin", keterangan: "Akses per kantor cabang (SPMD)", aktif: "y" },
  { id: 3, nama: "Regional Manager", keterangan: "Akses regional (multi cabang)", aktif: "y" },
  { id: 4, nama: "Finance", keterangan: "Modul keuangan & laporan", aktif: "y" },
  { id: 5, nama: "HRD", keterangan: "Manajemen SDM & jabatan", aktif: "y" },
  { id: 6, nama: "IT Support", keterangan: "Konfigurasi teknis", aktif: "y" },
  { id: 7, nama: "Marketing", keterangan: "Modul promosi & survey", aktif: "y" },
  { id: 8, nama: "Auditor", keterangan: "Read-only seluruh data", aktif: "y" },
  { id: 9, nama: "Regional Coordinator", keterangan: "Korwil - entri sesi & hafalan", aktif: "y" },
  { id: 10, nama: "Guest", keterangan: "Akses terbatas demo", aktif: "n" },
];

export const users: User[] = [
  { id: 1, username: "superadmin", nik: "3171010001", kantor_id: 1, group_user_id: 1, wilayah_ids: [], aktif: "y", date_insert: "2025-01-10" },
  { id: 2, username: "admin.medan", nik: "1275020002", kantor_id: 6, group_user_id: 2, wilayah_ids: [2], aktif: "y", date_insert: "2025-02-15" },
  { id: 3, username: "admin.padang", nik: "1371030003", kantor_id: 7, group_user_id: 2, wilayah_ids: [3], aktif: "y", date_insert: "2025-02-18" },
  { id: 4, username: "admin.bandung", nik: "3273040004", kantor_id: 8, group_user_id: 2, wilayah_ids: [5], aktif: "y", date_insert: "2025-03-01" },
  { id: 5, username: "admin.surabaya", nik: "3578050005", kantor_id: 9, group_user_id: 2, wilayah_ids: [7], aktif: "y", date_insert: "2025-03-05" },
  { id: 6, username: "korwil.medan", nik: "1275060006", kantor_id: 6, group_user_id: 9, wilayah_ids: [2], aktif: "y", date_insert: "2025-04-10" },
  { id: 7, username: "korwil.padang", nik: "1371070007", kantor_id: 7, group_user_id: 9, wilayah_ids: [3], aktif: "y", date_insert: "2025-04-12" },
  { id: 8, username: "korwil.jakarta", nik: "3171080008", kantor_id: 1, group_user_id: 9, wilayah_ids: [4, 8], aktif: "y", date_insert: "2025-04-20" },
  { id: 9, username: "korwil.bandung", nik: "3273090009", kantor_id: 8, group_user_id: 9, wilayah_ids: [5], aktif: "y", date_insert: "2025-05-01" },
  { id: 10, username: "korwil.surabaya", nik: "3578100010", kantor_id: 9, group_user_id: 9, wilayah_ids: [7], aktif: "n", date_insert: "2025-05-11" },
];

export const anak: Anak[] = [
  { id: 1, kode_lama: "A0001", nama: "Muhammad Alif", jenis_kelamin: "L", tanggal_lahir: "2013-03-15", wilayah_pembinaan_id: 1, kantor_id: 2, nama_wali: "Bapak Sudirman", no_hp_wali: "0813-2001-0001", status: "aktif" },
  { id: 2, kode_lama: "A0002", nama: "Aisha Zahra", jenis_kelamin: "P", tanggal_lahir: "2014-06-22", wilayah_pembinaan_id: 2, kantor_id: 6, nama_wali: "Ibu Ratna", no_hp_wali: "0813-2001-0002", status: "aktif" },
  { id: 3, kode_lama: "A0003", nama: "Rizky Ramadhan", jenis_kelamin: "L", tanggal_lahir: "2012-11-05", wilayah_pembinaan_id: 3, kantor_id: 7, nama_wali: "Bapak Iwan", no_hp_wali: "0813-2001-0003", status: "aktif" },
  { id: 4, kode_lama: "A0004", nama: "Nadya Salsabila", jenis_kelamin: "P", tanggal_lahir: "2013-08-19", wilayah_pembinaan_id: 4, kantor_id: 1, nama_wali: "Bapak Hendra", no_hp_wali: "0813-2001-0004", status: "aktif" },
  { id: 5, kode_lama: "A0005", nama: "Faisal Hakim", jenis_kelamin: "L", tanggal_lahir: "2011-01-30", wilayah_pembinaan_id: 5, kantor_id: 8, nama_wali: "Ibu Yanti", no_hp_wali: "0813-2001-0005", status: "lulus" },
  { id: 6, kode_lama: "A0006", nama: "Salma Aulia", jenis_kelamin: "P", tanggal_lahir: "2015-04-14", wilayah_pembinaan_id: 6, kantor_id: 4, nama_wali: "Bapak Rudi", no_hp_wali: "0813-2001-0006", status: "aktif" },
  { id: 7, kode_lama: "A0007", nama: "Ilham Nugraha", jenis_kelamin: "L", tanggal_lahir: "2014-09-27", wilayah_pembinaan_id: 7, kantor_id: 9, nama_wali: "Ibu Dewi", no_hp_wali: "0813-2001-0007", status: "aktif" },
  { id: 8, kode_lama: "A0008", nama: "Zahra Kirana", jenis_kelamin: "P", tanggal_lahir: "2013-12-02", wilayah_pembinaan_id: 8, kantor_id: 1, nama_wali: "Bapak Andi", no_hp_wali: "0813-2001-0008", status: "aktif" },
  { id: 9, kode_lama: "A0009", nama: "Hafizh Abdillah", jenis_kelamin: "L", tanggal_lahir: "2012-07-10", wilayah_pembinaan_id: 9, kantor_id: 1, nama_wali: "Ibu Rina", no_hp_wali: "0813-2001-0009", status: "aktif" },
  { id: 10, kode_lama: "A0010", nama: "Kayla Ramadhani", jenis_kelamin: "P", tanggal_lahir: "2014-02-25", wilayah_pembinaan_id: 10, kantor_id: 10, nama_wali: "Bapak Fajar", no_hp_wali: "0813-2001-0010", status: "keluar" },
];

export const sesi: Sesi[] = [
  { id: 1, tanggal: "2026-07-01", wilayah_pembinaan_id: 1, kantor_id: 2, materi: "Tajwid Dasar", durasi_menit: 90, jumlah_hadir: 18, pengajar: "Ust. Fahmi" },
  { id: 2, tanggal: "2026-07-02", wilayah_pembinaan_id: 2, kantor_id: 6, materi: "Hafalan Juz 30", durasi_menit: 120, jumlah_hadir: 22, pengajar: "Ust. Aisyah" },
  { id: 3, tanggal: "2026-07-03", wilayah_pembinaan_id: 3, kantor_id: 7, materi: "Sirah Nabawiyah", durasi_menit: 60, jumlah_hadir: 15, pengajar: "Ust. Yusuf" },
  { id: 4, tanggal: "2026-07-04", wilayah_pembinaan_id: 4, kantor_id: 1, materi: "Akhlak Terpuji", durasi_menit: 90, jumlah_hadir: 20, pengajar: "Ust. Nurul" },
  { id: 5, tanggal: "2026-07-05", wilayah_pembinaan_id: 5, kantor_id: 8, materi: "Fiqih Ibadah", durasi_menit: 90, jumlah_hadir: 25, pengajar: "Ust. Bambang" },
  { id: 6, tanggal: "2026-07-06", wilayah_pembinaan_id: 6, kantor_id: 4, materi: "Doa Harian", durasi_menit: 60, jumlah_hadir: 17, pengajar: "Ust. Dewi" },
  { id: 7, tanggal: "2026-07-07", wilayah_pembinaan_id: 7, kantor_id: 9, materi: "Tafsir Al-Fatihah", durasi_menit: 90, jumlah_hadir: 19, pengajar: "Ust. Rizky" },
  { id: 8, tanggal: "2026-07-08", wilayah_pembinaan_id: 8, kantor_id: 1, materi: "Adab Menuntut Ilmu", durasi_menit: 60, jumlah_hadir: 14, pengajar: "Ust. Ahmad" },
  { id: 9, tanggal: "2026-07-09", wilayah_pembinaan_id: 9, kantor_id: 1, materi: "Hafalan An-Naba", durasi_menit: 120, jumlah_hadir: 21, pengajar: "Ust. Siti" },
  { id: 10, tanggal: "2026-07-10", wilayah_pembinaan_id: 10, kantor_id: 10, materi: "Praktek Sholat", durasi_menit: 90, jumlah_hadir: 16, pengajar: "Ust. Fatimah" },
];

export const hafalan: Hafalan[] = [
  { id: 1, anak_id: 1, wilayah_pembinaan_id: 1, surat: "An-Naba", ayat_dari: 1, ayat_sampai: 20, nilai: "A", tanggal: "2026-07-01" },
  { id: 2, anak_id: 2, wilayah_pembinaan_id: 2, surat: "An-Nazi'at", ayat_dari: 1, ayat_sampai: 15, nilai: "B", tanggal: "2026-07-02" },
  { id: 3, anak_id: 3, wilayah_pembinaan_id: 3, surat: "'Abasa", ayat_dari: 1, ayat_sampai: 42, nilai: "A", tanggal: "2026-07-03" },
  { id: 4, anak_id: 4, wilayah_pembinaan_id: 4, surat: "At-Takwir", ayat_dari: 1, ayat_sampai: 29, nilai: "A", tanggal: "2026-07-04" },
  { id: 5, anak_id: 5, wilayah_pembinaan_id: 5, surat: "Al-Infitar", ayat_dari: 1, ayat_sampai: 19, nilai: "B", tanggal: "2026-07-05" },
  { id: 6, anak_id: 6, wilayah_pembinaan_id: 6, surat: "Al-Mutaffifin", ayat_dari: 1, ayat_sampai: 36, nilai: "C", tanggal: "2026-07-06" },
  { id: 7, anak_id: 7, wilayah_pembinaan_id: 7, surat: "Al-Insyiqaq", ayat_dari: 1, ayat_sampai: 25, nilai: "A", tanggal: "2026-07-07" },
  { id: 8, anak_id: 8, wilayah_pembinaan_id: 8, surat: "Al-Buruj", ayat_dari: 1, ayat_sampai: 22, nilai: "B", tanggal: "2026-07-08" },
  { id: 9, anak_id: 9, wilayah_pembinaan_id: 9, surat: "At-Tariq", ayat_dari: 1, ayat_sampai: 17, nilai: "A", tanggal: "2026-07-09" },
  { id: 10, anak_id: 10, wilayah_pembinaan_id: 10, surat: "Al-A'la", ayat_dari: 1, ayat_sampai: 19, nilai: "A", tanggal: "2026-07-10" },
];

export const evaluasi: Evaluasi[] = [
  { id: 1, anak_id: 1, wilayah_pembinaan_id: 1, aspek: "Akhlak", skor: 88, semester: "2026-1", tanggal: "2026-07-01" },
  { id: 2, anak_id: 2, wilayah_pembinaan_id: 2, aspek: "Hafalan", skor: 92, semester: "2026-1", tanggal: "2026-07-02" },
  { id: 3, anak_id: 3, wilayah_pembinaan_id: 3, aspek: "Kedisiplinan", skor: 85, semester: "2026-1", tanggal: "2026-07-03" },
  { id: 4, anak_id: 4, wilayah_pembinaan_id: 4, aspek: "Kehadiran", skor: 95, semester: "2026-1", tanggal: "2026-07-04" },
  { id: 5, anak_id: 5, wilayah_pembinaan_id: 5, aspek: "Pemahaman", skor: 80, semester: "2026-1", tanggal: "2026-07-05" },
  { id: 6, anak_id: 6, wilayah_pembinaan_id: 6, aspek: "Akhlak", skor: 90, semester: "2026-1", tanggal: "2026-07-06" },
  { id: 7, anak_id: 7, wilayah_pembinaan_id: 7, aspek: "Hafalan", skor: 87, semester: "2026-1", tanggal: "2026-07-07" },
  { id: 8, anak_id: 8, wilayah_pembinaan_id: 8, aspek: "Kedisiplinan", skor: 78, semester: "2026-1", tanggal: "2026-07-08" },
  { id: 9, anak_id: 9, wilayah_pembinaan_id: 9, aspek: "Kehadiran", skor: 93, semester: "2026-1", tanggal: "2026-07-09" },
  { id: 10, anak_id: 10, wilayah_pembinaan_id: 10, aspek: "Pemahaman", skor: 82, semester: "2026-1", tanggal: "2026-07-10" },
];

export const survey: Survey[] = [
  { id: 1, wilayah_pembinaan_id: 1, judul: "Kepuasan Orang Tua Q3", responden: 40, tanggal: "2026-06-01", status: "selesai" },
  { id: 2, wilayah_pembinaan_id: 2, judul: "Efektivitas Pembinaan", responden: 55, tanggal: "2026-06-05", status: "selesai" },
  { id: 3, wilayah_pembinaan_id: 3, judul: "Fasilitas Pembelajaran", responden: 32, tanggal: "2026-06-10", status: "berjalan" },
  { id: 4, wilayah_pembinaan_id: 4, judul: "Kualitas Pengajar", responden: 48, tanggal: "2026-06-15", status: "selesai" },
  { id: 5, wilayah_pembinaan_id: 5, judul: "Materi Ajar Semester 1", responden: 60, tanggal: "2026-06-20", status: "berjalan" },
  { id: 6, wilayah_pembinaan_id: 6, judul: "Interaksi Anak & Pembina", responden: 38, tanggal: "2026-06-25", status: "draft" },
  { id: 7, wilayah_pembinaan_id: 7, judul: "Program Hafalan", responden: 44, tanggal: "2026-07-01", status: "berjalan" },
  { id: 8, wilayah_pembinaan_id: 8, judul: "Kegiatan Ekstra", responden: 29, tanggal: "2026-07-03", status: "draft" },
  { id: 9, wilayah_pembinaan_id: 9, judul: "Sarana Prasarana", responden: 51, tanggal: "2026-07-05", status: "selesai" },
  { id: 10, wilayah_pembinaan_id: 10, judul: "Komunikasi Wali Santri", responden: 35, tanggal: "2026-07-08", status: "berjalan" },
];

export const laporanSemester: LaporanSemester[] = [
  { id: 1, semester: "2026-1", kantor_id: 2, wilayah_pembinaan_id: 1, total_anak: 45, total_sesi: 24, rata_hafalan: 87.5, status: "final" },
  { id: 2, semester: "2026-1", kantor_id: 6, wilayah_pembinaan_id: 2, total_anak: 52, total_sesi: 26, rata_hafalan: 89.1, status: "final" },
  { id: 3, semester: "2026-1", kantor_id: 7, wilayah_pembinaan_id: 3, total_anak: 38, total_sesi: 22, rata_hafalan: 85.3, status: "final" },
  { id: 4, semester: "2026-1", kantor_id: 1, wilayah_pembinaan_id: 4, total_anak: 60, total_sesi: 28, rata_hafalan: 90.2, status: "draft" },
  { id: 5, semester: "2026-1", kantor_id: 8, wilayah_pembinaan_id: 5, total_anak: 41, total_sesi: 20, rata_hafalan: 82.7, status: "final" },
  { id: 6, semester: "2026-1", kantor_id: 4, wilayah_pembinaan_id: 6, total_anak: 47, total_sesi: 25, rata_hafalan: 86.9, status: "draft" },
  { id: 7, semester: "2026-1", kantor_id: 9, wilayah_pembinaan_id: 7, total_anak: 53, total_sesi: 27, rata_hafalan: 88.4, status: "final" },
  { id: 8, semester: "2026-1", kantor_id: 1, wilayah_pembinaan_id: 8, total_anak: 36, total_sesi: 18, rata_hafalan: 84.1, status: "draft" },
  { id: 9, semester: "2026-1", kantor_id: 1, wilayah_pembinaan_id: 9, total_anak: 44, total_sesi: 23, rata_hafalan: 87.0, status: "final" },
  { id: 10, semester: "2026-1", kantor_id: 10, wilayah_pembinaan_id: 10, total_anak: 30, total_sesi: 16, rata_hafalan: 80.5, status: "draft" },
];

// Lookup helpers
export const kantorMap = new Map(kantor.map((k) => [k.id, k]));
export const wilayahMap = new Map(wilayahPembinaan.map((w) => [w.id, w]));
export const anakMap = new Map(anak.map((a) => [a.id, a]));
export const jabatanMap = new Map(jabatanSDM.map((j) => [j.id, j]));
export const groupUserMap = new Map(groupUser.map((g) => [g.id, g]));
export const desaMap = new Map(desa.map((d) => [d.id, d]));
export const kecamatanMap = new Map(kecamatan.map((k) => [k.id, k]));
export const kabupatenMap = new Map(kabupaten.map((k) => [k.id, k]));
export const propinsiMap = new Map(propinsi.map((p) => [p.id, p]));

export const surveiKelayakan: SurveiKelayakan[] = [
  { id: 1, tanggal: "2026-06-01", nama_calon: "Rafi Ardiansyah", wilayah_pembinaan_id: 1, kantor_id: 2, status_ortu: "yatim", penghasilan_wali: 1200000, jumlah_saudara: 3, kondisi_rumah: "kurang", skor_kelayakan: 88, rekomendasi: "layak", catatan: "Ayah wafat, ibu buruh cuci." },
  { id: 2, tanggal: "2026-06-03", nama_calon: "Ainun Mahya", wilayah_pembinaan_id: 2, kantor_id: 6, status_ortu: "dhuafa", penghasilan_wali: 900000, jumlah_saudara: 4, kondisi_rumah: "kurang", skor_kelayakan: 92, rekomendasi: "layak", catatan: "Keluarga pra-sejahtera, penghasilan tidak tetap." },
  { id: 3, tanggal: "2026-06-05", nama_calon: "Dimas Prasetyo", wilayah_pembinaan_id: 3, kantor_id: 7, status_ortu: "piatu", penghasilan_wali: 2100000, jumlah_saudara: 2, kondisi_rumah: "cukup", skor_kelayakan: 74, rekomendasi: "ditinjau", catatan: "Ayah bekerja informal." },
  { id: 4, tanggal: "2026-06-08", nama_calon: "Kirana Salsabila", wilayah_pembinaan_id: 4, kantor_id: 1, status_ortu: "dhuafa", penghasilan_wali: 1500000, jumlah_saudara: 3, kondisi_rumah: "cukup", skor_kelayakan: 81, rekomendasi: "layak", catatan: "" },
  { id: 5, tanggal: "2026-06-10", nama_calon: "Bagas Wibisono", wilayah_pembinaan_id: 5, kantor_id: 8, status_ortu: "yatim_piatu", penghasilan_wali: 0, jumlah_saudara: 2, kondisi_rumah: "kurang", skor_kelayakan: 96, rekomendasi: "layak", catatan: "Diasuh nenek." },
  { id: 6, tanggal: "2026-06-12", nama_calon: "Hanifa Zulaikha", wilayah_pembinaan_id: 6, kantor_id: 4, status_ortu: "dhuafa", penghasilan_wali: 1800000, jumlah_saudara: 5, kondisi_rumah: "kurang", skor_kelayakan: 84, rekomendasi: "layak", catatan: "" },
  { id: 7, tanggal: "2026-06-15", nama_calon: "Reza Ananta", wilayah_pembinaan_id: 7, kantor_id: 9, status_ortu: "yatim", penghasilan_wali: 2500000, jumlah_saudara: 1, kondisi_rumah: "cukup", skor_kelayakan: 68, rekomendasi: "ditinjau", catatan: "Ibu bekerja tetap." },
  { id: 8, tanggal: "2026-06-18", nama_calon: "Naila Putri", wilayah_pembinaan_id: 8, kantor_id: 1, status_ortu: "dhuafa", penghasilan_wali: 3200000, jumlah_saudara: 2, kondisi_rumah: "layak", skor_kelayakan: 55, rekomendasi: "tidak_layak", catatan: "Ekonomi mencukupi." },
  { id: 9, tanggal: "2026-06-22", nama_calon: "Fauzan Malik", wilayah_pembinaan_id: 9, kantor_id: 1, status_ortu: "yatim", penghasilan_wali: 1100000, jumlah_saudara: 4, kondisi_rumah: "kurang", skor_kelayakan: 90, rekomendasi: "layak", catatan: "" },
  { id: 10, tanggal: "2026-06-25", nama_calon: "Lulu Anggraini", wilayah_pembinaan_id: 10, kantor_id: 10, status_ortu: "dhuafa", penghasilan_wali: 1400000, jumlah_saudara: 3, kondisi_rumah: "kurang", skor_kelayakan: 86, rekomendasi: "layak", catatan: "" },
];

// Opinion polls (Jajak Pendapat) — each with tally of jawaban
export interface JajakPendapat {
  id: number;
  judul: string;
  pertanyaan: string;
  wilayah_pembinaan_id: number;
  tanggal: string;
  status: "draft" | "berjalan" | "selesai";
  opsi: { label: string; votes: number }[];
}

export const jajakPendapat: JajakPendapat[] = [
  { id: 1, judul: "Materi Favorit Anak", pertanyaan: "Materi apa yang paling disukai anak?", wilayah_pembinaan_id: 1, tanggal: "2026-06-01", status: "selesai", opsi: [{ label: "Tajwid", votes: 22 }, { label: "Hafalan", votes: 38 }, { label: "Sirah", votes: 14 }, { label: "Fiqih", votes: 11 }] },
  { id: 2, judul: "Waktu Pembinaan Ideal", pertanyaan: "Kapan waktu terbaik untuk kegiatan?", wilayah_pembinaan_id: 2, tanggal: "2026-06-05", status: "selesai", opsi: [{ label: "Pagi", votes: 12 }, { label: "Siang", votes: 8 }, { label: "Sore", votes: 41 }, { label: "Malam", votes: 6 }] },
  { id: 3, judul: "Media Pendukung", pertanyaan: "Media pendukung yang dibutuhkan?", wilayah_pembinaan_id: 3, tanggal: "2026-06-10", status: "berjalan", opsi: [{ label: "Buku", votes: 18 }, { label: "Video", votes: 27 }, { label: "Aplikasi", votes: 33 }] },
  { id: 4, judul: "Frekuensi Setoran", pertanyaan: "Frekuensi setoran hafalan mingguan?", wilayah_pembinaan_id: 4, tanggal: "2026-06-15", status: "selesai", opsi: [{ label: "1x", votes: 9 }, { label: "2x", votes: 34 }, { label: "3x", votes: 21 }, { label: ">3x", votes: 5 }] },
  { id: 5, judul: "Kegiatan Ekstra", pertanyaan: "Ekstrakurikuler yang diminati?", wilayah_pembinaan_id: 5, tanggal: "2026-06-20", status: "berjalan", opsi: [{ label: "Kaligrafi", votes: 16 }, { label: "Nasyid", votes: 24 }, { label: "Olahraga", votes: 30 }, { label: "Robotik", votes: 12 }] },
  { id: 6, judul: "Metode Belajar", pertanyaan: "Metode paling efektif?", wilayah_pembinaan_id: 6, tanggal: "2026-06-25", status: "draft", opsi: [{ label: "Ceramah", votes: 0 }, { label: "Diskusi", votes: 0 }, { label: "Praktek", votes: 0 }] },
  { id: 7, judul: "Reward Anak", pertanyaan: "Bentuk apresiasi yang cocok?", wilayah_pembinaan_id: 7, tanggal: "2026-07-01", status: "berjalan", opsi: [{ label: "Sertifikat", votes: 15 }, { label: "Buku", votes: 20 }, { label: "Umrah", votes: 8 }, { label: "Uang", votes: 4 }] },
  { id: 8, judul: "Komunikasi Wali", pertanyaan: "Kanal komunikasi utama?", wilayah_pembinaan_id: 8, tanggal: "2026-07-03", status: "draft", opsi: [{ label: "WhatsApp", votes: 0 }, { label: "Telegram", votes: 0 }, { label: "Grup Kelas", votes: 0 }] },
  { id: 9, judul: "Frekuensi Rapat", pertanyaan: "Kebutuhan rapat pembina?", wilayah_pembinaan_id: 9, tanggal: "2026-07-05", status: "selesai", opsi: [{ label: "Mingguan", votes: 22 }, { label: "Bulanan", votes: 29 }, { label: "Triwulanan", votes: 6 }] },
  { id: 10, judul: "Prioritas Bantuan", pertanyaan: "Bantuan yang paling dibutuhkan?", wilayah_pembinaan_id: 10, tanggal: "2026-07-08", status: "berjalan", opsi: [{ label: "Beasiswa", votes: 41 }, { label: "Buku", votes: 12 }, { label: "Gizi", votes: 18 }, { label: "Kesehatan", votes: 10 }] },
];