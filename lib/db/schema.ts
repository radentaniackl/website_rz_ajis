import { pgTable, bigserial, varchar, index, foreignKey, bigint, smallint, text, date, jsonb, check } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

// Re-export core tables from db/schema.ts
export {
  ajisUser,
  ajisAuditLog,
  ajisUserWilayahPembinaan,
  ajisGroupUser,
  ajisKantor,
  ajisWilayahPembinaan,
  ajisAnak,
  ajisSemester,
  donatur,
  refPropinsi,
  refKabupaten,
  refKecamatan,
  refDesa,
  ajisSdmWilayah,
  ajisSdmWilayahRiwayat,
  ajisSurvey,
  program,
  ajisSession,
  ajisAccount,
  ajisVerificationToken,
  pemasangan,
  donasiTransaksi,
  penyaluran,
  opnameSaldo,
  pengajuanPergantianAnak,
  peminjamanAjisAnak,
  hafalanAnak,
  itemHafalan,
  penilaianAnak,
  laporanSemester,
  laporanSemesterPembinaan,
  laporanPrestasi,
  prestasiAnak,
} from "@/db/schema";

/**
 * Tabel Pembinaan (Sesi Pembinaan/Coaching Anak)
 * Menyimpan catatan sesi pembinaan yang dilakukan oleh Korwil
 */
export const pembinaan = pgTable("pembinaan", {
  id: bigserial({ mode: "bigint" }).primaryKey().notNull(),
  idRowLama: smallint("id_row_lama").unique(),
  kodePembinaan: varchar("kode_pembinaan", { length: 100 }),
  tglPembinaan: date("tgl_pembinaan").notNull(),
  semesterId: bigint("semester_id", { mode: "number" }),
  bulan: smallint("bulan"),
  tahun: smallint("tahun"),
  jenisPembinaan: text("jenis_pembinaan"),
  p3a: text("p3A"),
  judulMateri: text("judul_materi"),
  anakId: bigint("anak_id", { mode: "number" }).notNull(),
  kehadiran: varchar("kehadiran", { length: 15 }),
  keterangan: varchar("keterangan", { length: 50 }),
  wilayahPembinaanId: bigint("wilayah_pembinaan_id", { mode: "number" }),
  kantorId: bigint("kantor_id", { mode: "number" }),
  pemateri: text("pemateri"),
  pemateriPersonal: text("pemateri_personal"),
  ortuHadir: varchar("ortu_hadir", { length: 50 }),
  donaturId: bigint("donatur_id", { mode: "number" }),
  programDonasi: varchar("program_donasi", { length: 50 }),
  tampil: varchar("tampil", { length: 1 }).notNull().default('y'),
  viaInput: varchar("via_input", { length: 50 }),
  capaianTilawah: varchar("capaian_tilawah", { length: 50 }),
  capaianTahfidz: varchar("capaian_tahfidz", { length: 50 }),
  capaianTahfidzHalaman: varchar("capaian_tahfidz_halaman", { length: 50 }),
  pembiasaanShalatWajib: smallint("pembiasaan_shalat_wajib"),
  pembiasaanTilawah: smallint("pembiasaan_tilawah"),
  pembiasaanSedekah: smallint("pembiasaan_sedekah"),
  membantuOrtu: smallint("membantu_ortu"),
  externalRef: jsonb("external_ref"),
  userInsert: varchar("user_insert", { length: 100 }),
  dateInsert: date("date_insert").notNull(),
  userUpdate: varchar("user_update", { length: 100 }),
  dateUpdate: date("date_update"),
}, (table) => [
  index("idx_pembinaan_anak").using("btree", table.anakId, table.tglPembinaan),
  index("idx_pembinaan_kode").using("btree", table.kodePembinaan),
  index("idx_pembinaan_wilayah").using("btree", table.wilayahPembinaanId),
  index("idx_pembinaan_kantor").using("btree", table.kantorId),
  index("idx_pembinaan_semester").using("btree", table.semesterId),
  index("idx_pembinaan_tgl_brin").using("brin", table.tglPembinaan),
  foreignKey({
    columns: [table.anakId],
    foreignColumns: [ajisAnak.id],
    name: "pembinaan_anak_id_fkey"
  }).onDelete("cascade"),
  foreignKey({
    columns: [table.wilayahPembinaanId],
    foreignColumns: [ajisWilayahPembinaan.id],
    name: "pembinaan_wilayah_pembinaan_id_fkey"
  }).onDelete("set null"),
  foreignKey({
    columns: [table.kantorId],
    foreignColumns: [ajisKantor.id],
    name: "pembinaan_kantor_id_fkey"
  }).onDelete("set null"),
  foreignKey({
    columns: [table.semesterId],
    foreignColumns: [ajisSemester.id],
    name: "pembinaan_semester_id_fkey"
  }).onDelete("set null"),
  foreignKey({
    columns: [table.donaturId],
    foreignColumns: [donatur.id],
    name: "pembinaan_donatur_id_fkey"
  }).onDelete("set null"),
  check("ck_pembinaan_tampil", sql`(tampil)::text = ANY ((ARRAY['y'::character varying, 'n'::character varying])::text[])`),
]);

/**
 * Tabel Pembinaan Dokumentasi (Foto Kegiatan)
 * Menyimpan dokumentasi foto kegiatan pembinaan
 */
export const pembinaanDokumentasi = pgTable("pembinaan_dokumentasi", {
  id: bigserial({ mode: "bigint" }).primaryKey().notNull(),
  semesterId: bigint("semester_id", { mode: "number" }),
  kantorId: bigint("kantor_id", { mode: "number" }),
  wilayahPembinaanId: bigint("wilayah_pembinaan_id", { mode: "number" }),
  image: text("image").notNull(),
  nama: varchar("nama", { length: 50 }),
  uploadGdrive: varchar("upload_gdrive", { length: 50 }),
  externalRef: jsonb("external_ref"),
}, (table) => [
  index("idx_pembinaan_dok_kombo").using("btree", table.semesterId, table.kantorId, table.wilayahPembinaanId),
  foreignKey({
    columns: [table.semesterId],
    foreignColumns: [ajisSemester.id],
    name: "pembinaan_dokumentasi_semester_id_fkey"
  }).onDelete("set null"),
  foreignKey({
    columns: [table.kantorId],
    foreignColumns: [ajisKantor.id],
    name: "pembinaan_dokumentasi_kantor_id_fkey"
  }).onDelete("set null"),
  foreignKey({
    columns: [table.wilayahPembinaanId],
    foreignColumns: [ajisWilayahPembinaan.id],
    name: "pembinaan_dokumentasi_wilayah_pembinaan_id_fkey"
  }).onDelete("set null"),
]);
