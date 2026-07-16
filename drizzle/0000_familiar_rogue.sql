-- Current sql file was generated after introspecting the database
-- If you want to run this migration please uncomment this code before executing migrations

CREATE TABLE "ref_propinsi" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"kode" varchar(4) NOT NULL,
	"nama" varchar(100) NOT NULL,
	"ibukota" varchar(100),
	"aktif" varchar(1) DEFAULT 'y' NOT NULL,
	CONSTRAINT "ref_propinsi_kode_key" UNIQUE("kode"),
	CONSTRAINT "ck_propinsi_aktif" CHECK ((aktif)::text = ANY ((ARRAY['y'::character varying, 'n'::character varying])::text[]))
);
--> statement-breakpoint
CREATE TABLE "ref_kabupaten" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"kode" varchar(4) NOT NULL,
	"propinsi_id" bigint NOT NULL,
	"nama" varchar(100) NOT NULL,
	"is_kota" boolean DEFAULT false NOT NULL,
	"kode_oid" varchar(6),
	"ibukota" varchar(100),
	"lat" numeric(10, 6),
	"lng" numeric(10, 6),
	"aktif" varchar(1) DEFAULT 'y' NOT NULL,
	"updated_at" timestamp,
	CONSTRAINT "ref_kabupaten_kode_key" UNIQUE("kode"),
	CONSTRAINT "ck_kabupaten_aktif" CHECK ((aktif)::text = ANY ((ARRAY['y'::character varying, 'n'::character varying])::text[]))
);
--> statement-breakpoint
CREATE TABLE "ref_kecamatan" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"kode" varchar(10) NOT NULL,
	"kabupaten_id" bigint NOT NULL,
	"nama" varchar(100) NOT NULL,
	"kodepos" varchar(10),
	"aktif" varchar(1) DEFAULT 'y' NOT NULL,
	"updated_at" date,
	CONSTRAINT "ref_kecamatan_kode_key" UNIQUE("kode"),
	CONSTRAINT "ck_kecamatan_aktif" CHECK ((aktif)::text = ANY ((ARRAY['y'::character varying, 'n'::character varying])::text[]))
);
--> statement-breakpoint
CREATE TABLE "ref_desa" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"kode" varchar(10) NOT NULL,
	"kecamatan_id" bigint NOT NULL,
	"nama" varchar(100) NOT NULL,
	"is_kelurahan" boolean DEFAULT false NOT NULL,
	"nomor_induk_desa" varchar(50),
	"aktif" varchar(1) DEFAULT 'y' NOT NULL,
	CONSTRAINT "ref_desa_kode_key" UNIQUE("kode"),
	CONSTRAINT "ck_desa_aktif" CHECK ((aktif)::text = ANY ((ARRAY['y'::character varying, 'n'::character varying])::text[]))
);
--> statement-breakpoint
CREATE TABLE "ajis_kantor" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"kode" varchar(10) NOT NULL,
	"nama" varchar(150) NOT NULL,
	"alamat" varchar(200),
	"no_telp" varchar(20),
	"parent_id" bigint,
	"parent_second_id" bigint,
	"kode_program_rz" text,
	"jenis" varchar(50),
	"kode_kantor_legacy" varchar(20),
	"aktif" varchar(1) DEFAULT 'y' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "ajis_kantor_kode_key" UNIQUE("kode"),
	CONSTRAINT "ajis_kantor_kode_kantor_legacy_key" UNIQUE("kode_kantor_legacy"),
	CONSTRAINT "ck_kantor_aktif" CHECK ((aktif)::text = ANY ((ARRAY['y'::character varying, 'n'::character varying])::text[]))
);
--> statement-breakpoint
CREATE TABLE "ajis_wilayah_pembinaan" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"kode_lama" integer,
	"nama_wilayah" varchar(150) NOT NULL,
	"alamat_wilayah" text,
	"kantor_id" bigint,
	"desa_id" bigint,
	"status_approve" varchar(1),
	"aktif" varchar(1) DEFAULT 'y' NOT NULL,
	"user_insert" varchar(50),
	"date_insert" date,
	"user_update" varchar(50),
	"date_update" date,
	CONSTRAINT "ajis_wilayah_pembinaan_kode_lama_key" UNIQUE("kode_lama"),
	CONSTRAINT "ajis_wilayah_pembinaan_nama_wilayah_key" UNIQUE("nama_wilayah"),
	CONSTRAINT "ck_wilayah_status_approve" CHECK ((status_approve IS NULL) OR ((status_approve)::text = ANY ((ARRAY['y'::character varying, 't'::character varying])::text[]))),
	CONSTRAINT "ck_wilayah_aktif" CHECK ((aktif)::text = ANY ((ARRAY['y'::character varying, 'n'::character varying])::text[]))
);
--> statement-breakpoint
CREATE TABLE "ajis_user" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"kode_lama" integer,
	"username" varchar(100) NOT NULL,
	"password_hash" varchar(255) NOT NULL,
	"must_reset_password" boolean DEFAULT true NOT NULL,
	"nik" varchar(20),
	"kantor_id" bigint,
	"group_user_id" bigint,
	"aktif" varchar(1) DEFAULT 'y' NOT NULL,
	"user_insert" varchar(50),
	"date_insert" timestamp,
	CONSTRAINT "ajis_user_kode_lama_key" UNIQUE("kode_lama"),
	CONSTRAINT "ajis_user_username_key" UNIQUE("username"),
	CONSTRAINT "ck_user_aktif" CHECK ((aktif)::text = ANY ((ARRAY['y'::character varying, 'n'::character varying])::text[]))
);
--> statement-breakpoint
CREATE TABLE "ajis_group_user" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"nama" varchar(50) NOT NULL,
	"keterangan" varchar(150),
	"aktif" varchar(1) DEFAULT 'y' NOT NULL,
	CONSTRAINT "ck_group_user_aktif" CHECK ((aktif)::text = ANY ((ARRAY['y'::character varying, 'n'::character varying])::text[]))
);
--> statement-breakpoint
CREATE TABLE "ajis_sdm_wilayah" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"kode_lama" integer,
	"nik" varchar(20),
	"nama_lengkap" varchar(100) NOT NULL,
	"jenis_kelamin" varchar(1),
	"alamat" varchar(200),
	"desa_id" bigint,
	"jenjang_pendidikan" varchar(10),
	"tgl_bergabung" date,
	"tgl_keluar" date,
	"telp" varchar(20),
	"hp" varchar(20),
	"email" varchar(100),
	"keterangan" varchar(200),
	"keaktifan_edukasi" varchar(1),
	"foto" varchar(200),
	"aktif" varchar(10) DEFAULT 'y' NOT NULL,
	"penugasan_wilayah_id" bigint,
	"penugasan_kantor_id" bigint,
	"penugasan_fungsi_struktur" varchar(16),
	"penugasan_keaktifan_edukasi" varchar(1),
	"user_insert" varchar(30),
	"date_insert" date,
	"user_update" varchar(30),
	"date_update" date,
	CONSTRAINT "ajis_sdm_wilayah_kode_lama_key" UNIQUE("kode_lama"),
	CONSTRAINT "ajis_sdm_wilayah_nik_key" UNIQUE("nik"),
	CONSTRAINT "ck_sdm_jk" CHECK ((jenis_kelamin IS NULL) OR ((jenis_kelamin)::text = ANY ((ARRAY['l'::character varying, 'p'::character varying])::text[]))),
	CONSTRAINT "ck_sdm_keaktifan" CHECK ((keaktifan_edukasi IS NULL) OR ((keaktifan_edukasi)::text = ANY ((ARRAY['y'::character varying, 't'::character varying])::text[]))),
	CONSTRAINT "ck_sdm_keaktifan_jabatan" CHECK ((penugasan_keaktifan_edukasi IS NULL) OR ((penugasan_keaktifan_edukasi)::text = ANY ((ARRAY['y'::character varying, 't'::character varying])::text[])))
);
--> statement-breakpoint
CREATE TABLE "ajis_sdm_wilayah_riwayat" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"kode_lama" integer,
	"sdm_wilayah_id" bigint NOT NULL,
	"wilayah_pembinaan_id" bigint,
	"kantor_id" bigint,
	"fungsi_struktur" varchar(16),
	"keaktifan_edukasi" varchar(1),
	"is_current" boolean DEFAULT false NOT NULL,
	"user_insert" varchar(30),
	"date_insert" date,
	"user_update" varchar(30),
	"date_update" date,
	CONSTRAINT "ajis_sdm_wilayah_riwayat_kode_lama_key" UNIQUE("kode_lama"),
	CONSTRAINT "ck_riwayat_keaktifan" CHECK ((keaktifan_edukasi IS NULL) OR ((keaktifan_edukasi)::text = ANY ((ARRAY['y'::character varying, 't'::character varying])::text[])))
);
--> statement-breakpoint
CREATE TABLE "ajis_anak" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"kode_anak" varchar(25) NOT NULL,
	"nik" varchar(50) NOT NULL,
	"nama_lengkap" text NOT NULL,
	"nama_panggilan" varchar(50),
	"agama" varchar(50),
	"jns_kel" varchar(1) NOT NULL,
	"tempat_lahir" varchar(50),
	"tgl_lahir" date NOT NULL,
	"anak_ke" smallint,
	"dari_saudara" smallint,
	"alamat" varchar(150),
	"desa_id" bigint,
	"jenjang_pendidikan" varchar(10),
	"kelas" varchar(50),
	"nama_sekolah" text,
	"alamat_sekolah" text,
	"jurusan" varchar(50),
	"semester" smallint,
	"nama_pt" text,
	"alamat_pt" text,
	"no_rekening" varchar(30),
	"pemilik_rekening" varchar(50),
	"nama_bank" varchar(50),
	"foto" text,
	"nilai" varchar(50),
	"pelajaran_favorit" varchar(50),
	"jarak_rumah" varchar(50),
	"alat_transportasi" varchar(50),
	"hobi" text,
	"prestasi" text,
	"no_kartu_keluarga" varchar(30),
	"asnaf" varchar(50),
	"status_ortu" varchar(50),
	"status_survey" varchar(1) DEFAULT 'n' NOT NULL,
	"status_kelayakan" varchar(1) DEFAULT 'n' NOT NULL,
	"status_anak_juara" varchar(3),
	"status_tersantuni" varchar(2),
	"status_pinjam" varchar(1) DEFAULT 'n' NOT NULL,
	"status_mentor" varchar(1) DEFAULT 'n' NOT NULL,
	"aktif" varchar(1) DEFAULT 'y' NOT NULL,
	"alumni_juara" varchar(1),
	"juara" varchar(10),
	"wilayah_pembinaan_id" bigint,
	"kantor_id" bigint,
	"sdm_wilayah_id" bigint,
	"nama_mentor_manual" varchar(100),
	"tgl_terdaftar" date,
	"tgl_pengajuan" date,
	"nama_lengkap_ayah" varchar(100),
	"alamat_ayah" varchar(150),
	"desa_ayah_id" bigint,
	"pekerjaan_ayah" text,
	"penghasilan_ayah" numeric(14, 2),
	"tgl_kematian_ayah" date,
	"penyebab_kematian_ayah" varchar(150),
	"nama_lengkap_ibu" varchar(100),
	"alamat_ibu" varchar(150),
	"desa_ibu_id" bigint,
	"pekerjaan_ibu" text,
	"penghasilan_ibu" numeric(14, 2),
	"tgl_kematian_ibu" date,
	"penyebab_kematian_ibu" varchar(150),
	"nama_lengkap_wali" varchar(100),
	"alamat_wali" varchar(150),
	"desa_wali_id" bigint,
	"pekerjaan_wali" text,
	"penghasilan_wali" numeric(14, 2),
	"telp_dihubungi" varchar(20),
	"atas_nama" varchar(50),
	"hubungan_kerabat" varchar(30),
	"via_input" varchar(100),
	"approval_ijf" varchar(50),
	"kode_program_rz" text,
	"nia_rfo_book" varchar(50),
	"nama_rfo_book" varchar(100),
	"tgl_peminjaman" date,
	"tgl_expired" date,
	"book_via" varchar(50),
	"user_book" varchar(50),
	"tinggal_bersama" text,
	"nama_tinggal" text,
	"ket_tinggal" text,
	"penghasilan_tinggal" text,
	"pekerjaan_tinggal" text,
	"tidak_serumah_ortu" varchar(50),
	"kode_kantor_legacy" varchar(10),
	"kode_ijgs_anak" varchar(50),
	"upload_gdrive" varchar(50),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "ajis_anak_kode_anak_key" UNIQUE("kode_anak"),
	CONSTRAINT "ajis_anak_nik_key" UNIQUE("nik"),
	CONSTRAINT "ck_anak_jns_kel" CHECK ((jns_kel)::text = ANY ((ARRAY['l'::character varying, 'p'::character varying])::text[])),
	CONSTRAINT "ck_anak_status_survey" CHECK ((status_survey)::text = ANY ((ARRAY['y'::character varying, 'n'::character varying])::text[])),
	CONSTRAINT "ck_anak_status_layak" CHECK ((status_kelayakan)::text = ANY ((ARRAY['y'::character varying, 'n'::character varying])::text[])),
	CONSTRAINT "ck_anak_status_pinjam" CHECK ((status_pinjam)::text = ANY ((ARRAY['y'::character varying, 'n'::character varying])::text[])),
	CONSTRAINT "ck_anak_status_mentor" CHECK ((status_mentor)::text = ANY ((ARRAY['y'::character varying, 'n'::character varying])::text[])),
	CONSTRAINT "ck_anak_aktif" CHECK ((aktif)::text = ANY ((ARRAY['y'::character varying, 'n'::character varying])::text[])),
	CONSTRAINT "ck_anak_tersantuni" CHECK ((status_tersantuni IS NULL) OR ((status_tersantuni)::text = ANY ((ARRAY['su'::character varying, 'b'::character varying, 'se'::character varying, 't'::character varying, ''::character varying])::text[]))),
	CONSTRAINT "ck_anak_alumni_juara" CHECK ((alumni_juara IS NULL) OR ((alumni_juara)::text = ANY ((ARRAY[''::character varying, 'y'::character varying, 'n'::character varying])::text[])))
);
--> statement-breakpoint
CREATE TABLE "donatur" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"kode_lama" varchar(30),
	"nama_lengkap" varchar(100) NOT NULL,
	"nama_publikasi" varchar(100),
	"tgl_lahir" date,
	"jenis_kelamin" varchar(1),
	"alamat_lengkap" text,
	"alamat_silaturahmi" text,
	"kecamatan_domisili_id" bigint,
	"kecamatan_silaturahmi_id" bigint,
	"status_donatur" varchar(10) NOT NULL,
	"tgl_registrasi" date,
	"aktif" varchar(1) DEFAULT 'y' NOT NULL,
	"kirim_sms" varchar(1) DEFAULT 'n' NOT NULL,
	"telp" varchar(30),
	"fax" varchar(15),
	"hp" varchar(30),
	"email" varchar(100),
	"website" varchar(100),
	"verifikasi1" boolean DEFAULT false NOT NULL,
	"verifikasi2" boolean DEFAULT false NOT NULL,
	"nama_kontak" varchar(50),
	"telp_kontak" varchar(30),
	"email_kontak" varchar(100),
	"jabatan_kontak" varchar(50),
	"nama_bank" varchar(50),
	"no_rekening" varchar(30),
	"kantor_donatur_id" bigint,
	"nia_rfo" varchar(15),
	"nama_rfo" varchar(50),
	"username" varchar(50),
	"tipe_pelayanan" varchar(30),
	"periode_rutinitas_transaksi" smallint,
	"sumber_informasi" text,
	"jalur_komunikasi" text,
	"npwp" varchar(30),
	"tag" varchar(100),
	"external_ref" jsonb,
	"user_insert" varchar(50),
	"user_update" varchar(50),
	"tgl_update" date,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "donatur_kode_lama_key" UNIQUE("kode_lama"),
	CONSTRAINT "ck_donatur_jk" CHECK ((jenis_kelamin IS NULL) OR ((jenis_kelamin)::text = ANY ((ARRAY['l'::character varying, 'p'::character varying, 't'::character varying])::text[]))),
	CONSTRAINT "ck_donatur_aktif" CHECK ((aktif)::text = ANY ((ARRAY['y'::character varying, 'n'::character varying, 'p'::character varying])::text[])),
	CONSTRAINT "ck_donatur_sms" CHECK ((kirim_sms)::text = ANY ((ARRAY['y'::character varying, 'n'::character varying])::text[]))
);
--> statement-breakpoint
CREATE TABLE "ajis_survey" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"kode_lama" integer,
	"anak_id" bigint NOT NULL,
	"tgl_survey" date,
	"petugas_survey" varchar(50),
	"kantor_id" bigint,
	"wilayah_pembinaan_id" bigint,
	"asnaf" varchar(50),
	"alamat" text,
	"jns_kel" varchar(1),
	"jenjang_pendidikan" varchar(50),
	"tgl_pengajuan" date,
	"status_anak" varchar(20),
	"hasil_kesimpulan_survey" varchar(150),
	"kepemilikan_tanah" varchar(150),
	"kepemilikan_rumah" text,
	"kondisi_dinding_rumah" text,
	"kondisi_lantai_rumah" text,
	"kepemilikan_kendaraan" text,
	"kepemilikan_barang_elektronik" text,
	"pekerjaan_kepala_keluarga" text,
	"rata_rata_penghasilan_perbulan" varchar(150),
	"kepemilikan_tabungan" text,
	"makan_2x" varchar(150),
	"nama_kepala_keluarga" text,
	"pendidikan_terakhir_kepala_keluarga" text,
	"jml_tanggungan_kepala_keluarga" smallint,
	"sumber_air_bersih" text,
	"jamban_dan_saluran_limbah" text,
	"tempat_pembuangan_sampah" text,
	"terdapat_perokok" varchar(150),
	"terdapat_konsumen_miras" varchar(150),
	"terdapat_persediaan_obat_p3k" varchar(150),
	"makan_buah_dan_sayur_tiap_hari" varchar(150),
	"shalat_5_waktu" text,
	"membaca_alquran" text,
	"majelis_taklim" text,
	"membaca_koran" text,
	"aktif_sebagai_pengurus_organisasi" text,
	"asnaf_anak" varchar(10) NOT NULL,
	"biaya_pendidikan_spp_perbulan" numeric(14, 2) DEFAULT '0' NOT NULL,
	"bantuan_rutin_dari_lembaga_lain" varchar(10) DEFAULT 'tidak' NOT NULL,
	"jml_bantuan_rutin_dari_lembaga_lain" numeric(14, 2),
	"resume_deskriptif" text,
	"kode_anak_odoo" varchar(50),
	"user_insert" varchar(30),
	"date_insert" date,
	"user_update" varchar(30),
	"date_update" date,
	CONSTRAINT "ajis_survey_kode_lama_key" UNIQUE("kode_lama"),
	CONSTRAINT "ck_survey_jns_kel" CHECK ((jns_kel IS NULL) OR ((jns_kel)::text = ANY ((ARRAY['l'::character varying, 'p'::character varying])::text[]))),
	CONSTRAINT "ck_survey_asnaf_anak" CHECK ((asnaf_anak)::text = ANY ((ARRAY['yatim'::character varying, 'piatu'::character varying, 'dhuafa'::character varying])::text[])),
	CONSTRAINT "ck_survey_bantuan" CHECK ((bantuan_rutin_dari_lembaga_lain)::text = ANY ((ARRAY['tidak'::character varying, 'ada'::character varying])::text[]))
);
--> statement-breakpoint
CREATE TABLE "program" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"kode_lama" varchar(6),
	"kode_program_legacy" integer,
	"parent_id" bigint,
	"nama" varchar(100) NOT NULL,
	"nama_inggris" varchar(100),
	"jenis_program" varchar(2) DEFAULT 'dn' NOT NULL,
	"coa_program" varchar(20),
	"sifat_program" varchar(2) DEFAULT 'tt' NOT NULL,
	"keterangan" varchar(100),
	"jenjang_pendidikan" varchar(10),
	"tgl_digulirkan" date,
	"aktif" varchar(1) DEFAULT 'y' NOT NULL,
	"tgl_inaktif" timestamp,
	"kprogid" varchar(2),
	"status_program" varchar(2) DEFAULT 'nm' NOT NULL,
	"dana_pengelola" varchar(1) DEFAULT 'n' NOT NULL,
	"nama_alias" varchar(30),
	"pdanaid" integer,
	"kode_anggaran" varchar(50),
	"harga_program" numeric(16, 2),
	"harga_penyaluran" numeric(16, 2),
	"nominal_dp" numeric(16, 2),
	"nominal_dss" numeric(16, 2),
	"persentase_dp" numeric(7, 4),
	"persentase_dss" numeric(7, 4),
	"kredit_account" varchar(50),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "program_kode_lama_key" UNIQUE("kode_lama"),
	CONSTRAINT "program_kode_program_legacy_key" UNIQUE("kode_program_legacy"),
	CONSTRAINT "ck_program_jenis" CHECK ((jenis_program)::text = ANY ((ARRAY['dn'::character varying, 'ln'::character varying])::text[])),
	CONSTRAINT "ck_program_sifat" CHECK ((sifat_program)::text = ANY ((ARRAY['t'::character varying, 'tt'::character varying])::text[])),
	CONSTRAINT "ck_program_status" CHECK ((status_program)::text = ANY ((ARRAY['m'::character varying, 'nm'::character varying])::text[])),
	CONSTRAINT "ck_program_aktif" CHECK ((aktif)::text = ANY ((ARRAY['y'::character varying, 'n'::character varying])::text[]))
);
--> statement-breakpoint
CREATE TABLE "pemasangan" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"kode_lama" varchar(100) NOT NULL,
	"tahun" smallint NOT NULL,
	"tgl_pemasangan" date,
	"tgl_pemberhentian" date,
	"donatur_id" bigint NOT NULL,
	"anak_id" bigint NOT NULL,
	"wilayah_pembinaan_id" bigint,
	"kantor_id" bigint,
	"program_id" bigint,
	"harga_program" numeric(16, 2),
	"harga_penyaluran" numeric(16, 2),
	"keterangan_pemberhentian" text,
	"status_pasangan" varchar(1) DEFAULT 'y' NOT NULL,
	"saldo_awal" numeric(16, 2) DEFAULT '0',
	"saldo_akhir" numeric(16, 2),
	"status_saldo" varchar(1) DEFAULT 'n',
	"status_saldo_akhir" varchar(10),
	"program_sebelumnya" varchar(40),
	"sdm_wilayah_id" bigint,
	"status_mentor" varchar(10),
	"nia_rfo" varchar(50),
	"nama_rfo" text,
	"tunda_penyaluran" varchar(50),
	"kode_naik_jenjang" varchar(100),
	"via_input" varchar(50),
	"is_riwayat" boolean DEFAULT false NOT NULL,
	"user_stop" varchar(50),
	"via_stop" varchar(50),
	"alasan_aktif" varchar(50),
	"external_ref" jsonb,
	"user_insert" varchar(30),
	"date_insert" timestamp,
	"user_update" varchar(30),
	"date_update" timestamp,
	"updated_saldo" timestamp,
	CONSTRAINT "pemasangan_kode_lama_key" UNIQUE("kode_lama"),
	CONSTRAINT "ck_pemasangan_status" CHECK ((status_pasangan)::text = ANY ((ARRAY['y'::character varying, 'n'::character varying])::text[])),
	CONSTRAINT "ck_pemasangan_saldo" CHECK ((status_saldo IS NULL) OR ((status_saldo)::text = ANY ((ARRAY['y'::character varying, 'n'::character varying])::text[])))
);
--> statement-breakpoint
CREATE TABLE "donasi_transaksi" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"kode_lama" integer,
	"pemasangan_id" bigint,
	"tgl_transaksi" date NOT NULL,
	"anak_id" bigint,
	"donatur_id" bigint,
	"program_id" bigint,
	"kantor_id" bigint,
	"wilayah_pembinaan_id" bigint,
	"qty" integer DEFAULT 1,
	"pilihan_donasi" numeric(16, 2),
	"nominal_donasi" numeric(16, 2),
	"bulan" smallint,
	"tahun" smallint,
	"periode" varchar(10),
	"jenis" varchar(10) DEFAULT 'trans' NOT NULL,
	"jenjang_pendidikan" varchar(10),
	"kode_transaksi" varchar(50),
	"detail_id_lama" integer,
	"via_input" varchar(100),
	"external_ref" jsonb,
	"user_insert" varchar(30),
	"date_insert" timestamp,
	"user_update" varchar(30),
	"date_update" date,
	CONSTRAINT "donasi_transaksi_kode_lama_key" UNIQUE("kode_lama"),
	CONSTRAINT "ck_donasi_transaksi_jenis" CHECK ((jenis)::text = ANY ((ARRAY['trans'::character varying, 'saldo'::character varying])::text[]))
);
--> statement-breakpoint
CREATE TABLE "penyaluran" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"id_row_lama" integer,
	"kode_penyaluran" varchar(50) NOT NULL,
	"pemasangan_id" bigint,
	"tgl_penyaluran" date,
	"anak_id" bigint,
	"donatur_id" bigint,
	"sdm_wilayah_id" bigint,
	"wilayah_pembinaan_id" bigint,
	"kantor_id" bigint,
	"program_id" bigint,
	"jenjang_pendidikan" varchar(10),
	"kelas" varchar(50),
	"nominal_penyaluran" numeric(16, 2),
	"nominal_hpp" numeric(16, 2),
	"bulan" smallint,
	"tahun" smallint,
	"periode" varchar(10),
	"kode_transaksi" varchar(50),
	"detail_id_lama" varchar(50),
	"donasi_transaksi_id" bigint,
	"jenis" varchar(50),
	"status_akhir" varchar(1) DEFAULT 'n' NOT NULL,
	"status_tersalurkan" varchar(1) DEFAULT 'n' NOT NULL,
	"via_input" varchar(10) DEFAULT 'single' NOT NULL,
	"external_ref" jsonb,
	"user_insert" varchar(30),
	"date_insert" timestamp,
	"user_update" varchar(30),
	"date_update" date,
	CONSTRAINT "penyaluran_id_row_lama_key" UNIQUE("id_row_lama"),
	CONSTRAINT "ck_penyaluran_status_akhir" CHECK ((status_akhir)::text = ANY ((ARRAY['y'::character varying, 'n'::character varying])::text[])),
	CONSTRAINT "ck_penyaluran_tersalurkan" CHECK ((status_tersalurkan)::text = ANY ((ARRAY['y'::character varying, 'n'::character varying])::text[])),
	CONSTRAINT "ck_penyaluran_via_input" CHECK ((via_input)::text = ANY ((ARRAY['massal'::character varying, 'single'::character varying])::text[]))
);
--> statement-breakpoint
CREATE TABLE "opname_saldo" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"pemasangan_id" bigint NOT NULL,
	"tahun" smallint NOT NULL,
	"saldo_awal_ganjil" numeric(16, 2),
	"saldo_akhir_ganjil" numeric(16, 2),
	"tupo_jan_jun" varchar(100),
	"tgl_opname_ganjil" timestamp,
	"user_opname_ganjil" varchar(100),
	"saldo_awal_genap" numeric(16, 2),
	"saldo_akhir_genap" numeric(16, 2),
	"tupo_jul_des" varchar(100),
	"tgl_opname_genap" timestamp,
	"user_opname_genap" varchar(100),
	"keterangan" text,
	"user_input" varchar(50),
	"user_update" varchar(100),
	"external_ref" jsonb,
	"updated_at" timestamp,
	CONSTRAINT "opname_saldo_pemasangan_id_tahun_key" UNIQUE("pemasangan_id","tahun")
);
--> statement-breakpoint
CREATE TABLE "pengajuan_pergantian_anak" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"kode_lama" integer,
	"tgl_ajuan" date,
	"kantor_id" bigint,
	"wilayah_pembinaan_id" bigint,
	"donatur_id" bigint,
	"kantor_donatur_id" bigint,
	"program_donasi" varchar(80),
	"nia_rfo" varchar(30),
	"nama_rfo" varchar(80),
	"anak_asal_id" bigint,
	"anak_pengganti_id" bigint,
	"pemasangan_id" bigint,
	"alasan_pergantian" varchar(200),
	"keterangan" varchar(200),
	"tipe_ganti" varchar(20),
	"pindah_saldo" numeric(16, 2),
	"approve_funding" varchar(1) DEFAULT 'n' NOT NULL,
	"status_eksekusi" varchar(1),
	"tgl_eksekusi" date,
	"tgl_approve_funding" timestamp,
	"jenis_donatur" varchar(100),
	"hp" varchar(50),
	"alasan_reject" text,
	"external_ref" jsonb,
	CONSTRAINT "pengajuan_pergantian_anak_kode_lama_key" UNIQUE("kode_lama"),
	CONSTRAINT "ck_ajuan_approve" CHECK ((approve_funding)::text = ANY ((ARRAY['t'::character varying, 'n'::character varying, 'y'::character varying])::text[])),
	CONSTRAINT "ck_ajuan_eksekusi" CHECK ((status_eksekusi IS NULL) OR ((status_eksekusi)::text = ANY ((ARRAY[''::character varying, 'y'::character varying, 'n'::character varying])::text[])))
);
--> statement-breakpoint
CREATE TABLE "transaksi" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"kode_lama" varchar(50) NOT NULL,
	"detail_id_lama" integer NOT NULL,
	"jenis_transaksi" varchar(10) NOT NULL,
	"donatur_id" bigint,
	"program_id" bigint,
	"perkiraan_rp" numeric(18, 2),
	"tgl_donasi" date,
	"tgl_transaksi" date,
	"kantor_transaksi_id" bigint,
	"kantor_donatur_id" bigint,
	"vbayarid" varchar(100),
	"mbayarid" varchar(100),
	"nik_rfo" varchar(15),
	"nik_claim" varchar(14),
	"jid_claim" varchar(6),
	"approved_claim" varchar(1) DEFAULT 'n' NOT NULL,
	"approved_trans" varchar(1) DEFAULT 'n' NOT NULL,
	"atas_nama" text,
	"tgl_generate" timestamp,
	"keterangan" text,
	"jml_mustahik" varchar(50),
	"bulan_disantuni" varchar(50),
	"nama_rfo" varchar(50),
	"nama_claim" varchar(50),
	"status_pasang" varchar(1) DEFAULT 'n' NOT NULL,
	"approve_salur" varchar(1) DEFAULT 'n' NOT NULL,
	"ket_approve_salur" text,
	"user_approve_salur" varchar(50),
	"tgl_approve_salur" timestamp,
	"deleted_trans" varchar(1) DEFAULT 'n' NOT NULL,
	"deleted_detail" varchar(1) DEFAULT 'n' NOT NULL,
	"review" varchar(1) DEFAULT 'n' NOT NULL,
	"bulan_salur" varchar(50),
	"tahun_salur" varchar(50),
	"selisih_donasi" numeric(16, 2),
	"total_input_donasi" numeric(16, 2),
	"jml_anak_ijis" integer,
	"kantor_ijis_id" bigint,
	"harga_program" numeric(16, 2),
	"id_review" varchar(50),
	"cicilan" varchar(1) DEFAULT 'n' NOT NULL,
	"external_ref" jsonb,
	"user_insert" varchar(50),
	"date_insert" timestamp,
	"user_insert_cf" varchar(50),
	"user_update_cf" varchar(50),
	CONSTRAINT "transaksi_kode_lama_detail_id_lama_key" UNIQUE("kode_lama","detail_id_lama"),
	CONSTRAINT "ck_transaksi_jenis" CHECK ((jenis_transaksi)::text = ANY ((ARRAY['cash'::character varying, 'noncash'::character varying, 'bank'::character varying, 'pccash'::character varying, 'pcnoncash'::character varying])::text[]))
);
--> statement-breakpoint
CREATE TABLE "ajis_semester" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"kode_lama" varchar(50),
	"nama" varchar(100),
	"tgl_awal" date,
	"tgl_akhir" date,
	"onprogress" varchar(1) DEFAULT 'n' NOT NULL,
	"tgl_awal_donasi" date,
	"tgl_akhir_donasi" date,
	"tgl_awal_saldo" date,
	"tgl_akhir_saldo" date,
	"jenis" varchar(10),
	"tahun" smallint,
	"lapsem" varchar(1) NOT NULL,
	CONSTRAINT "ajis_semester_kode_lama_key" UNIQUE("kode_lama"),
	CONSTRAINT "ck_semester_onprogress" CHECK ((onprogress)::text = ANY ((ARRAY['n'::character varying, 'y'::character varying])::text[]))
);
--> statement-breakpoint
CREATE TABLE "ajis_semester_template" (
	"semester_id" bigint PRIMARY KEY NOT NULL,
	"cover" text,
	"cover_siswa" text,
	"kata_pengantar" text,
	"profil" text,
	"kotak_profil_ceria" text,
	"kotak_pembinaan_ceria" text,
	"kotak_profil_siswa" text,
	"kotak_pembinaan_siswa" text,
	"keuangan" text,
	"surat" text,
	"bawah" text,
	"kata_pengantar_siswa" text,
	"bawah_siswa" text
);
--> statement-breakpoint
CREATE TABLE "pembinaan" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"id_row_lama" integer,
	"kode_pembinaan" varchar(100),
	"tgl_pembinaan" date NOT NULL,
	"semester_id" bigint,
	"bulan" smallint,
	"tahun" smallint,
	"jenis_pembinaan" text,
	"p3a" text,
	"judul_materi" text,
	"anak_id" bigint NOT NULL,
	"kehadiran" varchar(15),
	"keterangan" varchar(50),
	"wilayah_pembinaan_id" bigint,
	"kantor_id" bigint,
	"pemateri" text,
	"pemateri_personal" text,
	"ortu_hadir" varchar(50),
	"donatur_id" bigint,
	"program_donasi" varchar(50),
	"tampil" varchar(1) DEFAULT 'y' NOT NULL,
	"via_input" varchar(50),
	"capaian_tilawah" varchar(50),
	"capaian_tahfidz" varchar(50),
	"capaian_tahfidz_halaman" varchar(50),
	"pembiasaan_shalat_wajib" integer,
	"pembiasaan_tilawah" integer,
	"pembiasaan_sedekah" integer,
	"membantu_ortu" integer,
	"external_ref" jsonb,
	"user_insert" varchar(100),
	"date_insert" timestamp DEFAULT now() NOT NULL,
	"user_update" varchar(100),
	"date_update" date,
	CONSTRAINT "pembinaan_id_row_lama_key" UNIQUE("id_row_lama"),
	CONSTRAINT "ck_pembinaan_tampil" CHECK ((tampil)::text = ANY ((ARRAY['y'::character varying, 'n'::character varying])::text[]))
);
--> statement-breakpoint
CREATE TABLE "pembinaan_dokumentasi" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"semester_id" bigint,
	"kantor_id" bigint,
	"wilayah_pembinaan_id" bigint,
	"image" text NOT NULL,
	"nama" varchar(50),
	"upload_gdrive" varchar(50),
	"external_ref" jsonb
);
--> statement-breakpoint
CREATE TABLE "hafalan_anak" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"kode_lama" integer,
	"anak_id" bigint NOT NULL,
	"item_hafalan_id" bigint,
	"jenis" varchar(50),
	"konten_uji" varchar(100) NOT NULL,
	"tgl_pengujian" date,
	"tgl_insert" timestamp,
	"keterangan" text,
	"semester_id" bigint,
	"external_ref" jsonb,
	CONSTRAINT "hafalan_anak_kode_lama_key" UNIQUE("kode_lama"),
	CONSTRAINT "hafalan_anak_anak_id_konten_uji_key" UNIQUE("anak_id","konten_uji")
);
--> statement-breakpoint
CREATE TABLE "item_hafalan" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"kode_lama" integer,
	"jenis" integer,
	"konten" varchar(100) NOT NULL,
	CONSTRAINT "item_hafalan_kode_lama_key" UNIQUE("kode_lama")
);
--> statement-breakpoint
CREATE TABLE "periode_penilaian" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"kode_lama" integer,
	"nama" varchar(30),
	"tgl_awal" date,
	"tgl_akhir" date,
	"aktif" varchar(5),
	CONSTRAINT "periode_penilaian_kode_lama_key" UNIQUE("kode_lama")
);
--> statement-breakpoint
CREATE TABLE "item_penilaian" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"kode_lama" integer,
	"nama_item" text,
	"parent_id" bigint,
	"is_parent" boolean DEFAULT false NOT NULL,
	"jenis" varchar(100),
	"target" text,
	CONSTRAINT "item_penilaian_kode_lama_key" UNIQUE("kode_lama")
);
--> statement-breakpoint
CREATE TABLE "penilaian_anak" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"anak_id" bigint NOT NULL,
	"kantor_id" bigint,
	"wilayah_pembinaan_id" bigint,
	"tgl_insert" timestamp,
	"semester_id" bigint,
	"kategori" varchar(100),
	"aspek" varchar(150) NOT NULL,
	"item_penilaian_id" bigint,
	"target" text,
	"kondisi_awal" text,
	"nilai_capaian" integer,
	"perkembangan_capaian" text,
	"skor" integer,
	"hasil_akhir" varchar(100),
	"keterangan" text,
	"via_input" varchar(20),
	"tampil" boolean DEFAULT true NOT NULL,
	"external_ref" jsonb,
	CONSTRAINT "penilaian_anak_anak_id_semester_id_aspek_key" UNIQUE("anak_id","semester_id","aspek")
);
--> statement-breakpoint
CREATE TABLE "materi_pembinaan" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"kode_lama" integer,
	"detail_id_lama" varchar(50),
	"materi" text NOT NULL,
	"tanggal" date,
	"jenjang" varchar(50),
	"semester_id" bigint,
	"kantor_id" bigint,
	"wilayah_pembinaan_id" bigint,
	CONSTRAINT "materi_pembinaan_kode_lama_key" UNIQUE("kode_lama")
);
--> statement-breakpoint
CREATE TABLE "laporan_semester" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"kode_lama" varchar(50) NOT NULL,
	"donatur_id" bigint,
	"anak_id" bigint,
	"pemasangan_id" bigint,
	"kantor_id" bigint,
	"wilayah_pembinaan_id" bigint,
	"semester_id" bigint,
	"kode_program_lama" integer,
	"jenis" varchar(10),
	"tahun" smallint,
	"format_id" smallint,
	"aktif" varchar(1) DEFAULT 'y' NOT NULL,
	"kode_naik_jenjang" varchar(100),
	"pm_nama_lengkap" text,
	"pm_jns_kel" varchar(1),
	"pm_tempat_lahir" varchar(100),
	"pm_tgl_lahir" date,
	"pm_anak_ke" smallint,
	"pm_saudara" smallint,
	"pm_nama_orang_tua" text,
	"pm_pekerjaan" text,
	"pm_sekolah_nama" text,
	"pm_sekolah_alamat" text,
	"pm_kelas" varchar(5),
	"pm_jenjang" varchar(5),
	"pm_mhs_institusi" varchar(100),
	"pm_mhs_prodi" varchar(100),
	"pm_mhs_semester" smallint,
	"pm_mhs_jurusan" varchar(100),
	"pembinaan_wilayah" text,
	"pembinaan_alamat" text,
	"pembinaan_jml_anak" smallint,
	"pembinaan_jenjang" varchar(5),
	"pembinaan_perkembangan" text,
	"pembinaan_prestasi" text,
	"dana_saldo_awal" numeric(18, 2),
	"dana_penerimaan" numeric(18, 2),
	"dana_penyaluran" numeric(18, 2),
	"tgl_update_keuangan" timestamp,
	"wajib_materi" integer,
	"jml_materi" integer,
	"jml_materi_tampil" integer,
	"tgl_penyaluran_text" text,
	"tgl_pembinaan_text" text,
	"jml_prestasi" integer,
	"wajib_materi_bulan" integer,
	"jml_materi_tampil_bulan" integer,
	"tgl_penyaluran_bulan_text" text,
	"tgl_pembinaan_bulan_text" text,
	"foto_url" text,
	"foto_status" varchar(1),
	"foto_keterangan" varchar(225),
	"foto_pembinaan_url" text,
	"foto_pembinaan_status" varchar(1),
	"foto_pembinaan_keterangan" varchar(225),
	"ssh_url" text,
	"ssh_status" varchar(1),
	"ssh_keterangan" varchar(225),
	"raport_ceria_url" text,
	"raport_ceria_status" varchar(1),
	"raport_ceria_keterangan" varchar(225),
	"raport_1_url" text,
	"raport_1_status" varchar(1),
	"raport_1_keterangan" varchar(225),
	"raport_2_url" text,
	"raport_2_status" varchar(1),
	"raport_2_keterangan" varchar(225),
	"materi_status" varchar(1),
	"materi_keterangan" text,
	"perkembangan_siswa_status" varchar(1),
	"perkembangan_siswa_keterangan" varchar(225),
	"status_terbuat" boolean DEFAULT false NOT NULL,
	"tgl_status_terbuat" date,
	"status_terkirim_fundraising" boolean DEFAULT false NOT NULL,
	"tgl_status_terkirim_fundraising" date,
	"status_terkirim_donatur" boolean DEFAULT false NOT NULL,
	"tgl_status_terkirim_donatur" date,
	"hasil_qc" varchar(25),
	"keterangan" text,
	"jenis_laporan" varchar(50),
	"suara_anak_juara" text,
	"catatan_pembinaan" text,
	"upload_gdrive" varchar(50),
	"external_ref" jsonb,
	"tgl_insert" timestamp,
	"user_insert" varchar(50),
	CONSTRAINT "laporan_semester_kode_lama_key" UNIQUE("kode_lama"),
	CONSTRAINT "ck_laporan_aktif" CHECK ((aktif)::text = ANY ((ARRAY['y'::character varying, 'n'::character varying])::text[]))
);
--> statement-breakpoint
CREATE TABLE "peminjaman_ajis_anak" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"kode_lama" integer,
	"anak_id" bigint,
	"wilayah_pembinaan_id" bigint,
	"kantor_id" bigint,
	"nama_peminjam" text,
	"peminjam_kode" varchar(16),
	"tgl_awal_peminjaman" date,
	"tgl_selesai_peminjaman" date,
	"tgl_expired" date,
	"status_pinjam" varchar(1) DEFAULT 'n' NOT NULL,
	"status_terpasangkan" varchar(1) DEFAULT 'n' NOT NULL,
	"cancel" varchar(1) DEFAULT 'n' NOT NULL,
	"alasan_cancel" text,
	"foto" text,
	"user_insert" varchar(30),
	"date_insert" date,
	CONSTRAINT "peminjaman_ajis_anak_kode_lama_key" UNIQUE("kode_lama"),
	CONSTRAINT "ck_peminjaman_status" CHECK ((status_pinjam)::text = ANY ((ARRAY['y'::character varying, 'n'::character varying])::text[])),
	CONSTRAINT "ck_peminjaman_pasang" CHECK ((status_terpasangkan)::text = ANY ((ARRAY['y'::character varying, 'n'::character varying])::text[])),
	CONSTRAINT "ck_peminjaman_cancel" CHECK ((cancel)::text = ANY ((ARRAY['y'::character varying, 'n'::character varying])::text[]))
);
--> statement-breakpoint
CREATE TABLE "laporan_semester_pembinaan" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"laporan_semester_id" bigint NOT NULL,
	"detail_id_lama" smallint,
	"anak_id" bigint,
	"semester_id" bigint,
	"tanggal" date,
	"materi" varchar(200),
	"aktif" varchar(1) DEFAULT 'y' NOT NULL,
	"user_insert" varchar(50),
	"date_insert" date,
	CONSTRAINT "laporan_semester_pembinaan_laporan_semester_id_detail_id_la_key" UNIQUE("laporan_semester_id","detail_id_lama"),
	CONSTRAINT "ck_laporan_pembinaan_aktif" CHECK ((aktif)::text = ANY ((ARRAY['y'::character varying, 'n'::character varying])::text[]))
);
--> statement-breakpoint
CREATE TABLE "laporan_prestasi" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"kode_lama" integer,
	"anak_id" bigint NOT NULL,
	"kantor_id" bigint,
	"wilayah_pembinaan_id" bigint,
	"jenjang_pendidikan" varchar(50),
	"kelas" varchar(50),
	"event" text,
	"lokasi" text,
	"bidang_prestasi" text,
	"skala" text,
	"prestasi" text,
	"link_publikasi" text,
	"waktu_awal" date,
	"waktu_akhir" date,
	"aktif" varchar(1) DEFAULT 'y' NOT NULL,
	"user_insert" varchar(50),
	"date_insert" date,
	CONSTRAINT "laporan_prestasi_kode_lama_key" UNIQUE("kode_lama"),
	CONSTRAINT "ck_laporan_prestasi_aktif" CHECK ((aktif)::text = ANY ((ARRAY['y'::character varying, 'n'::character varying])::text[]))
);
--> statement-breakpoint
CREATE TABLE "prestasi_anak" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"kode_lama" integer,
	"anak_id" bigint NOT NULL,
	"event_lomba" varchar(50),
	"tgl" date,
	"lokasi" varchar(50),
	"skala_prestasi_tingkat" varchar(30),
	"capaian_prestasi" varchar(50),
	"jenis_bidang" varchar(30),
	"publikasi_media" varchar(50),
	"semester_id" bigint,
	"laporan_semester_id" bigint,
	"bulan" smallint,
	"tahun" smallint,
	"tampil" boolean DEFAULT true NOT NULL,
	CONSTRAINT "prestasi_anak_kode_lama_key" UNIQUE("kode_lama")
);
--> statement-breakpoint
CREATE TABLE "app_config" (
	"kunci" varchar(50) PRIMARY KEY NOT NULL,
	"nilai" text NOT NULL,
	"keterangan" varchar(200)
);
--> statement-breakpoint
CREATE TABLE "kantor_legacy_archive" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"kode_lama" varchar(6),
	"nama" varchar(150),
	"alamat" varchar(200),
	"parent_kode_lama" varchar(6),
	"level_struktur" smallint,
	"aktif" varchar(1),
	"id_office" varchar(50),
	"id_kantor_int_lama" integer,
	"omid" varchar(20),
	"kode_kantor_legacy" varchar(20),
	CONSTRAINT "kantor_legacy_archive_kode_lama_key" UNIQUE("kode_lama")
);
--> statement-breakpoint
CREATE TABLE "ajis_user_wilayah_pembinaan" (
	"user_id" bigint NOT NULL,
	"wilayah_pembinaan_id" bigint NOT NULL,
	CONSTRAINT "ajis_user_wilayah_pembinaan_pkey" PRIMARY KEY("user_id","wilayah_pembinaan_id")
);
--> statement-breakpoint
ALTER TABLE "ref_kabupaten" ADD CONSTRAINT "ref_kabupaten_propinsi_id_fkey" FOREIGN KEY ("propinsi_id") REFERENCES "public"."ref_propinsi"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ref_kecamatan" ADD CONSTRAINT "ref_kecamatan_kabupaten_id_fkey" FOREIGN KEY ("kabupaten_id") REFERENCES "public"."ref_kabupaten"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ref_desa" ADD CONSTRAINT "ref_desa_kecamatan_id_fkey" FOREIGN KEY ("kecamatan_id") REFERENCES "public"."ref_kecamatan"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ajis_kantor" ADD CONSTRAINT "ajis_kantor_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "public"."ajis_kantor"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ajis_kantor" ADD CONSTRAINT "ajis_kantor_parent_second_id_fkey" FOREIGN KEY ("parent_second_id") REFERENCES "public"."ajis_kantor"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ajis_wilayah_pembinaan" ADD CONSTRAINT "ajis_wilayah_pembinaan_kantor_id_fkey" FOREIGN KEY ("kantor_id") REFERENCES "public"."ajis_kantor"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ajis_wilayah_pembinaan" ADD CONSTRAINT "ajis_wilayah_pembinaan_desa_id_fkey" FOREIGN KEY ("desa_id") REFERENCES "public"."ref_desa"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ajis_user" ADD CONSTRAINT "ajis_user_kantor_id_fkey" FOREIGN KEY ("kantor_id") REFERENCES "public"."ajis_kantor"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ajis_user" ADD CONSTRAINT "ajis_user_group_user_id_fkey" FOREIGN KEY ("group_user_id") REFERENCES "public"."ajis_group_user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ajis_sdm_wilayah" ADD CONSTRAINT "ajis_sdm_wilayah_desa_id_fkey" FOREIGN KEY ("desa_id") REFERENCES "public"."ref_desa"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ajis_sdm_wilayah" ADD CONSTRAINT "ajis_sdm_wilayah_penugasan_wilayah_id_fkey" FOREIGN KEY ("penugasan_wilayah_id") REFERENCES "public"."ajis_wilayah_pembinaan"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ajis_sdm_wilayah" ADD CONSTRAINT "ajis_sdm_wilayah_penugasan_kantor_id_fkey" FOREIGN KEY ("penugasan_kantor_id") REFERENCES "public"."ajis_kantor"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ajis_sdm_wilayah_riwayat" ADD CONSTRAINT "ajis_sdm_wilayah_riwayat_sdm_wilayah_id_fkey" FOREIGN KEY ("sdm_wilayah_id") REFERENCES "public"."ajis_sdm_wilayah"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ajis_sdm_wilayah_riwayat" ADD CONSTRAINT "ajis_sdm_wilayah_riwayat_wilayah_pembinaan_id_fkey" FOREIGN KEY ("wilayah_pembinaan_id") REFERENCES "public"."ajis_wilayah_pembinaan"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ajis_sdm_wilayah_riwayat" ADD CONSTRAINT "ajis_sdm_wilayah_riwayat_kantor_id_fkey" FOREIGN KEY ("kantor_id") REFERENCES "public"."ajis_kantor"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ajis_anak" ADD CONSTRAINT "ajis_anak_desa_id_fkey" FOREIGN KEY ("desa_id") REFERENCES "public"."ref_desa"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ajis_anak" ADD CONSTRAINT "ajis_anak_wilayah_pembinaan_id_fkey" FOREIGN KEY ("wilayah_pembinaan_id") REFERENCES "public"."ajis_wilayah_pembinaan"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ajis_anak" ADD CONSTRAINT "ajis_anak_kantor_id_fkey" FOREIGN KEY ("kantor_id") REFERENCES "public"."ajis_kantor"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ajis_anak" ADD CONSTRAINT "ajis_anak_sdm_wilayah_id_fkey" FOREIGN KEY ("sdm_wilayah_id") REFERENCES "public"."ajis_sdm_wilayah"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ajis_anak" ADD CONSTRAINT "ajis_anak_desa_ayah_id_fkey" FOREIGN KEY ("desa_ayah_id") REFERENCES "public"."ref_desa"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ajis_anak" ADD CONSTRAINT "ajis_anak_desa_ibu_id_fkey" FOREIGN KEY ("desa_ibu_id") REFERENCES "public"."ref_desa"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ajis_anak" ADD CONSTRAINT "ajis_anak_desa_wali_id_fkey" FOREIGN KEY ("desa_wali_id") REFERENCES "public"."ref_desa"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "donatur" ADD CONSTRAINT "donatur_kecamatan_domisili_id_fkey" FOREIGN KEY ("kecamatan_domisili_id") REFERENCES "public"."ref_kecamatan"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "donatur" ADD CONSTRAINT "donatur_kecamatan_silaturahmi_id_fkey" FOREIGN KEY ("kecamatan_silaturahmi_id") REFERENCES "public"."ref_kecamatan"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "donatur" ADD CONSTRAINT "donatur_kantor_donatur_id_fkey" FOREIGN KEY ("kantor_donatur_id") REFERENCES "public"."ajis_kantor"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ajis_survey" ADD CONSTRAINT "ajis_survey_anak_id_fkey" FOREIGN KEY ("anak_id") REFERENCES "public"."ajis_anak"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ajis_survey" ADD CONSTRAINT "ajis_survey_kantor_id_fkey" FOREIGN KEY ("kantor_id") REFERENCES "public"."ajis_kantor"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ajis_survey" ADD CONSTRAINT "ajis_survey_wilayah_pembinaan_id_fkey" FOREIGN KEY ("wilayah_pembinaan_id") REFERENCES "public"."ajis_wilayah_pembinaan"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "program" ADD CONSTRAINT "program_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "public"."program"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pemasangan" ADD CONSTRAINT "pemasangan_sdm_wilayah_id_fkey" FOREIGN KEY ("sdm_wilayah_id") REFERENCES "public"."ajis_sdm_wilayah"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pemasangan" ADD CONSTRAINT "pemasangan_donatur_id_fkey" FOREIGN KEY ("donatur_id") REFERENCES "public"."donatur"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pemasangan" ADD CONSTRAINT "pemasangan_anak_id_fkey" FOREIGN KEY ("anak_id") REFERENCES "public"."ajis_anak"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pemasangan" ADD CONSTRAINT "pemasangan_wilayah_pembinaan_id_fkey" FOREIGN KEY ("wilayah_pembinaan_id") REFERENCES "public"."ajis_wilayah_pembinaan"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pemasangan" ADD CONSTRAINT "pemasangan_kantor_id_fkey" FOREIGN KEY ("kantor_id") REFERENCES "public"."ajis_kantor"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pemasangan" ADD CONSTRAINT "pemasangan_program_id_fkey" FOREIGN KEY ("program_id") REFERENCES "public"."program"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "donasi_transaksi" ADD CONSTRAINT "donasi_transaksi_pemasangan_id_fkey" FOREIGN KEY ("pemasangan_id") REFERENCES "public"."pemasangan"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "donasi_transaksi" ADD CONSTRAINT "donasi_transaksi_anak_id_fkey" FOREIGN KEY ("anak_id") REFERENCES "public"."ajis_anak"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "donasi_transaksi" ADD CONSTRAINT "donasi_transaksi_donatur_id_fkey" FOREIGN KEY ("donatur_id") REFERENCES "public"."donatur"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "donasi_transaksi" ADD CONSTRAINT "donasi_transaksi_program_id_fkey" FOREIGN KEY ("program_id") REFERENCES "public"."program"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "donasi_transaksi" ADD CONSTRAINT "donasi_transaksi_kantor_id_fkey" FOREIGN KEY ("kantor_id") REFERENCES "public"."ajis_kantor"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "donasi_transaksi" ADD CONSTRAINT "donasi_transaksi_wilayah_pembinaan_id_fkey" FOREIGN KEY ("wilayah_pembinaan_id") REFERENCES "public"."ajis_wilayah_pembinaan"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "penyaluran" ADD CONSTRAINT "penyaluran_pemasangan_id_fkey" FOREIGN KEY ("pemasangan_id") REFERENCES "public"."pemasangan"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "penyaluran" ADD CONSTRAINT "penyaluran_anak_id_fkey" FOREIGN KEY ("anak_id") REFERENCES "public"."ajis_anak"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "penyaluran" ADD CONSTRAINT "penyaluran_donatur_id_fkey" FOREIGN KEY ("donatur_id") REFERENCES "public"."donatur"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "penyaluran" ADD CONSTRAINT "penyaluran_sdm_wilayah_id_fkey" FOREIGN KEY ("sdm_wilayah_id") REFERENCES "public"."ajis_sdm_wilayah"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "penyaluran" ADD CONSTRAINT "penyaluran_wilayah_pembinaan_id_fkey" FOREIGN KEY ("wilayah_pembinaan_id") REFERENCES "public"."ajis_wilayah_pembinaan"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "penyaluran" ADD CONSTRAINT "penyaluran_kantor_id_fkey" FOREIGN KEY ("kantor_id") REFERENCES "public"."ajis_kantor"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "penyaluran" ADD CONSTRAINT "penyaluran_program_id_fkey" FOREIGN KEY ("program_id") REFERENCES "public"."program"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "penyaluran" ADD CONSTRAINT "penyaluran_donasi_transaksi_id_fkey" FOREIGN KEY ("donasi_transaksi_id") REFERENCES "public"."donasi_transaksi"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "opname_saldo" ADD CONSTRAINT "opname_saldo_pemasangan_id_fkey" FOREIGN KEY ("pemasangan_id") REFERENCES "public"."pemasangan"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pengajuan_pergantian_anak" ADD CONSTRAINT "pengajuan_pergantian_anak_kantor_id_fkey" FOREIGN KEY ("kantor_id") REFERENCES "public"."ajis_kantor"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pengajuan_pergantian_anak" ADD CONSTRAINT "pengajuan_pergantian_anak_wilayah_pembinaan_id_fkey" FOREIGN KEY ("wilayah_pembinaan_id") REFERENCES "public"."ajis_wilayah_pembinaan"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pengajuan_pergantian_anak" ADD CONSTRAINT "pengajuan_pergantian_anak_donatur_id_fkey" FOREIGN KEY ("donatur_id") REFERENCES "public"."donatur"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pengajuan_pergantian_anak" ADD CONSTRAINT "pengajuan_pergantian_anak_kantor_donatur_id_fkey" FOREIGN KEY ("kantor_donatur_id") REFERENCES "public"."ajis_kantor"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pengajuan_pergantian_anak" ADD CONSTRAINT "pengajuan_pergantian_anak_anak_asal_id_fkey" FOREIGN KEY ("anak_asal_id") REFERENCES "public"."ajis_anak"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pengajuan_pergantian_anak" ADD CONSTRAINT "pengajuan_pergantian_anak_anak_pengganti_id_fkey" FOREIGN KEY ("anak_pengganti_id") REFERENCES "public"."ajis_anak"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pengajuan_pergantian_anak" ADD CONSTRAINT "pengajuan_pergantian_anak_pemasangan_id_fkey" FOREIGN KEY ("pemasangan_id") REFERENCES "public"."pemasangan"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transaksi" ADD CONSTRAINT "transaksi_donatur_id_fkey" FOREIGN KEY ("donatur_id") REFERENCES "public"."donatur"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transaksi" ADD CONSTRAINT "transaksi_program_id_fkey" FOREIGN KEY ("program_id") REFERENCES "public"."program"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transaksi" ADD CONSTRAINT "transaksi_kantor_transaksi_id_fkey" FOREIGN KEY ("kantor_transaksi_id") REFERENCES "public"."ajis_kantor"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transaksi" ADD CONSTRAINT "transaksi_kantor_donatur_id_fkey" FOREIGN KEY ("kantor_donatur_id") REFERENCES "public"."ajis_kantor"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transaksi" ADD CONSTRAINT "transaksi_kantor_ijis_id_fkey" FOREIGN KEY ("kantor_ijis_id") REFERENCES "public"."ajis_kantor"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ajis_semester_template" ADD CONSTRAINT "ajis_semester_template_semester_id_fkey" FOREIGN KEY ("semester_id") REFERENCES "public"."ajis_semester"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pembinaan" ADD CONSTRAINT "pembinaan_donatur_id_fkey" FOREIGN KEY ("donatur_id") REFERENCES "public"."donatur"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pembinaan" ADD CONSTRAINT "pembinaan_semester_id_fkey" FOREIGN KEY ("semester_id") REFERENCES "public"."ajis_semester"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pembinaan" ADD CONSTRAINT "pembinaan_anak_id_fkey" FOREIGN KEY ("anak_id") REFERENCES "public"."ajis_anak"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pembinaan" ADD CONSTRAINT "pembinaan_wilayah_pembinaan_id_fkey" FOREIGN KEY ("wilayah_pembinaan_id") REFERENCES "public"."ajis_wilayah_pembinaan"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pembinaan" ADD CONSTRAINT "pembinaan_kantor_id_fkey" FOREIGN KEY ("kantor_id") REFERENCES "public"."ajis_kantor"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pembinaan_dokumentasi" ADD CONSTRAINT "pembinaan_dokumentasi_semester_id_fkey" FOREIGN KEY ("semester_id") REFERENCES "public"."ajis_semester"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pembinaan_dokumentasi" ADD CONSTRAINT "pembinaan_dokumentasi_kantor_id_fkey" FOREIGN KEY ("kantor_id") REFERENCES "public"."ajis_kantor"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pembinaan_dokumentasi" ADD CONSTRAINT "pembinaan_dokumentasi_wilayah_pembinaan_id_fkey" FOREIGN KEY ("wilayah_pembinaan_id") REFERENCES "public"."ajis_wilayah_pembinaan"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hafalan_anak" ADD CONSTRAINT "hafalan_anak_anak_id_fkey" FOREIGN KEY ("anak_id") REFERENCES "public"."ajis_anak"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hafalan_anak" ADD CONSTRAINT "hafalan_anak_item_hafalan_id_fkey" FOREIGN KEY ("item_hafalan_id") REFERENCES "public"."item_hafalan"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hafalan_anak" ADD CONSTRAINT "hafalan_anak_semester_id_fkey" FOREIGN KEY ("semester_id") REFERENCES "public"."ajis_semester"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "item_penilaian" ADD CONSTRAINT "item_penilaian_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "public"."item_penilaian"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "penilaian_anak" ADD CONSTRAINT "penilaian_anak_anak_id_fkey" FOREIGN KEY ("anak_id") REFERENCES "public"."ajis_anak"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "penilaian_anak" ADD CONSTRAINT "penilaian_anak_kantor_id_fkey" FOREIGN KEY ("kantor_id") REFERENCES "public"."ajis_kantor"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "penilaian_anak" ADD CONSTRAINT "penilaian_anak_wilayah_pembinaan_id_fkey" FOREIGN KEY ("wilayah_pembinaan_id") REFERENCES "public"."ajis_wilayah_pembinaan"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "penilaian_anak" ADD CONSTRAINT "penilaian_anak_semester_id_fkey" FOREIGN KEY ("semester_id") REFERENCES "public"."ajis_semester"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "penilaian_anak" ADD CONSTRAINT "penilaian_anak_item_penilaian_id_fkey" FOREIGN KEY ("item_penilaian_id") REFERENCES "public"."item_penilaian"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "materi_pembinaan" ADD CONSTRAINT "materi_pembinaan_semester_id_fkey" FOREIGN KEY ("semester_id") REFERENCES "public"."ajis_semester"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "materi_pembinaan" ADD CONSTRAINT "materi_pembinaan_kantor_id_fkey" FOREIGN KEY ("kantor_id") REFERENCES "public"."ajis_kantor"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "materi_pembinaan" ADD CONSTRAINT "materi_pembinaan_wilayah_pembinaan_id_fkey" FOREIGN KEY ("wilayah_pembinaan_id") REFERENCES "public"."ajis_wilayah_pembinaan"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "laporan_semester" ADD CONSTRAINT "laporan_semester_donatur_id_fkey" FOREIGN KEY ("donatur_id") REFERENCES "public"."donatur"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "laporan_semester" ADD CONSTRAINT "laporan_semester_anak_id_fkey" FOREIGN KEY ("anak_id") REFERENCES "public"."ajis_anak"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "laporan_semester" ADD CONSTRAINT "laporan_semester_pemasangan_id_fkey" FOREIGN KEY ("pemasangan_id") REFERENCES "public"."pemasangan"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "laporan_semester" ADD CONSTRAINT "laporan_semester_kantor_id_fkey" FOREIGN KEY ("kantor_id") REFERENCES "public"."ajis_kantor"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "laporan_semester" ADD CONSTRAINT "laporan_semester_wilayah_pembinaan_id_fkey" FOREIGN KEY ("wilayah_pembinaan_id") REFERENCES "public"."ajis_wilayah_pembinaan"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "laporan_semester" ADD CONSTRAINT "laporan_semester_semester_id_fkey" FOREIGN KEY ("semester_id") REFERENCES "public"."ajis_semester"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "peminjaman_ajis_anak" ADD CONSTRAINT "peminjaman_ajis_anak_anak_id_fkey" FOREIGN KEY ("anak_id") REFERENCES "public"."ajis_anak"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "peminjaman_ajis_anak" ADD CONSTRAINT "peminjaman_ajis_anak_wilayah_pembinaan_id_fkey" FOREIGN KEY ("wilayah_pembinaan_id") REFERENCES "public"."ajis_wilayah_pembinaan"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "peminjaman_ajis_anak" ADD CONSTRAINT "peminjaman_ajis_anak_kantor_id_fkey" FOREIGN KEY ("kantor_id") REFERENCES "public"."ajis_kantor"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "laporan_semester_pembinaan" ADD CONSTRAINT "laporan_semester_pembinaan_laporan_semester_id_fkey" FOREIGN KEY ("laporan_semester_id") REFERENCES "public"."laporan_semester"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "laporan_semester_pembinaan" ADD CONSTRAINT "laporan_semester_pembinaan_anak_id_fkey" FOREIGN KEY ("anak_id") REFERENCES "public"."ajis_anak"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "laporan_semester_pembinaan" ADD CONSTRAINT "laporan_semester_pembinaan_semester_id_fkey" FOREIGN KEY ("semester_id") REFERENCES "public"."ajis_semester"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "laporan_prestasi" ADD CONSTRAINT "laporan_prestasi_anak_id_fkey" FOREIGN KEY ("anak_id") REFERENCES "public"."ajis_anak"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "laporan_prestasi" ADD CONSTRAINT "laporan_prestasi_kantor_id_fkey" FOREIGN KEY ("kantor_id") REFERENCES "public"."ajis_kantor"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "laporan_prestasi" ADD CONSTRAINT "laporan_prestasi_wilayah_pembinaan_id_fkey" FOREIGN KEY ("wilayah_pembinaan_id") REFERENCES "public"."ajis_wilayah_pembinaan"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prestasi_anak" ADD CONSTRAINT "prestasi_anak_anak_id_fkey" FOREIGN KEY ("anak_id") REFERENCES "public"."ajis_anak"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prestasi_anak" ADD CONSTRAINT "prestasi_anak_semester_id_fkey" FOREIGN KEY ("semester_id") REFERENCES "public"."ajis_semester"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prestasi_anak" ADD CONSTRAINT "prestasi_anak_laporan_semester_id_fkey" FOREIGN KEY ("laporan_semester_id") REFERENCES "public"."laporan_semester"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ajis_user_wilayah_pembinaan" ADD CONSTRAINT "ajis_user_wilayah_pembinaan_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."ajis_user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ajis_user_wilayah_pembinaan" ADD CONSTRAINT "ajis_user_wilayah_pembinaan_wilayah_pembinaan_id_fkey" FOREIGN KEY ("wilayah_pembinaan_id") REFERENCES "public"."ajis_wilayah_pembinaan"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_kabupaten_nama_trgm" ON "ref_kabupaten" USING gin ("nama" gin_trgm_ops);--> statement-breakpoint
CREATE INDEX "idx_kabupaten_propinsi" ON "ref_kabupaten" USING btree ("propinsi_id" int8_ops);--> statement-breakpoint
CREATE INDEX "idx_kecamatan_kabupaten" ON "ref_kecamatan" USING btree ("kabupaten_id" int8_ops);--> statement-breakpoint
CREATE INDEX "idx_kecamatan_nama_trgm" ON "ref_kecamatan" USING gin ("nama" gin_trgm_ops);--> statement-breakpoint
CREATE INDEX "idx_desa_kecamatan" ON "ref_desa" USING btree ("kecamatan_id" int8_ops);--> statement-breakpoint
CREATE INDEX "idx_desa_nama_trgm" ON "ref_desa" USING gin ("nama" gin_trgm_ops);--> statement-breakpoint
CREATE INDEX "idx_kantor_nama_trgm" ON "ajis_kantor" USING gin ("nama" gin_trgm_ops);--> statement-breakpoint
CREATE INDEX "idx_kantor_parent" ON "ajis_kantor" USING btree ("parent_id" int8_ops);--> statement-breakpoint
CREATE INDEX "idx_kantor_parent_second" ON "ajis_kantor" USING btree ("parent_second_id" int8_ops);--> statement-breakpoint
CREATE INDEX "idx_wilayah_aktif" ON "ajis_wilayah_pembinaan" USING btree ("aktif" text_ops) WHERE ((aktif)::text = 'y'::text);--> statement-breakpoint
CREATE INDEX "idx_wilayah_desa" ON "ajis_wilayah_pembinaan" USING btree ("desa_id" int8_ops);--> statement-breakpoint
CREATE INDEX "idx_wilayah_kantor" ON "ajis_wilayah_pembinaan" USING btree ("kantor_id" int8_ops);--> statement-breakpoint
CREATE INDEX "idx_wilayah_nama_trgm" ON "ajis_wilayah_pembinaan" USING gin ("nama_wilayah" gin_trgm_ops);--> statement-breakpoint
CREATE INDEX "idx_user_group" ON "ajis_user" USING btree ("group_user_id" int8_ops);--> statement-breakpoint
CREATE INDEX "idx_user_kantor" ON "ajis_user" USING btree ("kantor_id" int8_ops);--> statement-breakpoint
CREATE INDEX "idx_sdm_wilayah_aktif" ON "ajis_sdm_wilayah" USING btree ("aktif" text_ops) WHERE ((aktif)::text = 'y'::text);--> statement-breakpoint
CREATE INDEX "idx_sdm_wilayah_nama_trgm" ON "ajis_sdm_wilayah" USING gin ("nama_lengkap" gin_trgm_ops);--> statement-breakpoint
CREATE INDEX "idx_sdm_wilayah_penugasan_kantor" ON "ajis_sdm_wilayah" USING btree ("penugasan_kantor_id" int8_ops);--> statement-breakpoint
CREATE INDEX "idx_sdm_wilayah_penugasan_wilayah" ON "ajis_sdm_wilayah" USING btree ("penugasan_wilayah_id" int8_ops);--> statement-breakpoint
CREATE INDEX "idx_sdm_riwayat_kantor" ON "ajis_sdm_wilayah_riwayat" USING btree ("kantor_id" int8_ops);--> statement-breakpoint
CREATE INDEX "idx_sdm_riwayat_sdm" ON "ajis_sdm_wilayah_riwayat" USING btree ("sdm_wilayah_id" int8_ops);--> statement-breakpoint
CREATE INDEX "idx_sdm_riwayat_wilayah" ON "ajis_sdm_wilayah_riwayat" USING btree ("wilayah_pembinaan_id" int8_ops);--> statement-breakpoint
CREATE INDEX "idx_anak_aktif_only" ON "ajis_anak" USING btree ("kantor_id" int8_ops,"wilayah_pembinaan_id" int8_ops) WHERE ((aktif)::text = 'y'::text);--> statement-breakpoint
CREATE INDEX "idx_anak_desa" ON "ajis_anak" USING btree ("desa_id" int8_ops);--> statement-breakpoint
CREATE INDEX "idx_anak_desa_ayah" ON "ajis_anak" USING btree ("desa_ayah_id" int8_ops);--> statement-breakpoint
CREATE INDEX "idx_anak_desa_ibu" ON "ajis_anak" USING btree ("desa_ibu_id" int8_ops);--> statement-breakpoint
CREATE INDEX "idx_anak_desa_wali" ON "ajis_anak" USING btree ("desa_wali_id" int8_ops);--> statement-breakpoint
CREATE INDEX "idx_anak_filter_combo" ON "ajis_anak" USING btree ("wilayah_pembinaan_id" int8_ops,"kantor_id" int8_ops,"aktif" text_ops);--> statement-breakpoint
CREATE INDEX "idx_anak_kantor" ON "ajis_anak" USING btree ("kantor_id" int8_ops);--> statement-breakpoint
CREATE INDEX "idx_anak_nama_trgm" ON "ajis_anak" USING gin ("nama_lengkap" gin_trgm_ops);--> statement-breakpoint
CREATE INDEX "idx_anak_nik_trgm" ON "ajis_anak" USING gin ("nik" gin_trgm_ops);--> statement-breakpoint
CREATE INDEX "idx_anak_sdm" ON "ajis_anak" USING btree ("sdm_wilayah_id" int8_ops);--> statement-breakpoint
CREATE INDEX "idx_anak_status" ON "ajis_anak" USING btree ("aktif" text_ops,"status_tersantuni" text_ops,"jenjang_pendidikan" text_ops);--> statement-breakpoint
CREATE INDEX "idx_anak_tgl_lahir_brin" ON "ajis_anak" USING brin ("tgl_lahir" date_minmax_ops);--> statement-breakpoint
CREATE INDEX "idx_anak_tgl_terdaftar_brin" ON "ajis_anak" USING brin ("tgl_terdaftar" date_minmax_ops);--> statement-breakpoint
CREATE INDEX "idx_anak_wilayah" ON "ajis_anak" USING btree ("wilayah_pembinaan_id" int8_ops);--> statement-breakpoint
CREATE INDEX "idx_donatur_aktif" ON "donatur" USING btree ("aktif" text_ops) WHERE ((aktif)::text = 'y'::text);--> statement-breakpoint
CREATE INDEX "idx_donatur_kantor" ON "donatur" USING btree ("kantor_donatur_id" int8_ops);--> statement-breakpoint
CREATE INDEX "idx_donatur_kec_domisili" ON "donatur" USING btree ("kecamatan_domisili_id" int8_ops);--> statement-breakpoint
CREATE INDEX "idx_donatur_nama_trgm" ON "donatur" USING gin ("nama_lengkap" gin_trgm_ops);--> statement-breakpoint
CREATE INDEX "idx_donatur_nia_rfo" ON "donatur" USING btree ("nia_rfo" text_ops);--> statement-breakpoint
CREATE INDEX "idx_survey_anak" ON "ajis_survey" USING btree ("anak_id" int8_ops);--> statement-breakpoint
CREATE INDEX "idx_survey_anak_tgl" ON "ajis_survey" USING btree ("anak_id" date_ops,"tgl_survey" int8_ops);--> statement-breakpoint
CREATE INDEX "idx_survey_kantor" ON "ajis_survey" USING btree ("kantor_id" int8_ops);--> statement-breakpoint
CREATE INDEX "idx_survey_tgl_brin" ON "ajis_survey" USING brin ("tgl_survey" date_minmax_ops);--> statement-breakpoint
CREATE INDEX "idx_survey_wilayah" ON "ajis_survey" USING btree ("wilayah_pembinaan_id" int8_ops);--> statement-breakpoint
CREATE INDEX "idx_program_aktif" ON "program" USING btree ("aktif" text_ops) WHERE ((aktif)::text = 'y'::text);--> statement-breakpoint
CREATE INDEX "idx_program_nama_trgm" ON "program" USING gin ("nama" gin_trgm_ops);--> statement-breakpoint
CREATE INDEX "idx_program_parent" ON "program" USING btree ("parent_id" int8_ops);--> statement-breakpoint
CREATE INDEX "idx_pemasangan_aktif" ON "pemasangan" USING btree ("kantor_id" int8_ops,"status_pasangan" text_ops) WHERE ((status_pasangan)::text = 'y'::text);--> statement-breakpoint
CREATE INDEX "idx_pemasangan_anak" ON "pemasangan" USING btree ("anak_id" int8_ops);--> statement-breakpoint
CREATE INDEX "idx_pemasangan_donatur" ON "pemasangan" USING btree ("donatur_id" int8_ops);--> statement-breakpoint
CREATE INDEX "idx_pemasangan_kantor" ON "pemasangan" USING btree ("kantor_id" int8_ops);--> statement-breakpoint
CREATE INDEX "idx_pemasangan_program" ON "pemasangan" USING btree ("program_id" int8_ops);--> statement-breakpoint
CREATE INDEX "idx_pemasangan_sdm" ON "pemasangan" USING btree ("sdm_wilayah_id" int8_ops);--> statement-breakpoint
CREATE INDEX "idx_pemasangan_tahun_brin" ON "pemasangan" USING brin ("tahun" int2_minmax_ops);--> statement-breakpoint
CREATE INDEX "idx_pemasangan_wilayah" ON "pemasangan" USING btree ("wilayah_pembinaan_id" int8_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "ux_pemasangan_kombo" ON "pemasangan" USING btree ("donatur_id" int8_ops,"anak_id" int8_ops,"program_id" int2_ops,"tahun" int8_ops);--> statement-breakpoint
CREATE INDEX "idx_donasi_transaksi_anak" ON "donasi_transaksi" USING btree ("anak_id" int2_ops,"bulan" int2_ops,"tahun" int2_ops);--> statement-breakpoint
CREATE INDEX "idx_donasi_transaksi_donatur" ON "donasi_transaksi" USING btree ("donatur_id" int8_ops);--> statement-breakpoint
CREATE INDEX "idx_donasi_transaksi_kantor" ON "donasi_transaksi" USING btree ("kantor_id" int8_ops);--> statement-breakpoint
CREATE INDEX "idx_donasi_transaksi_pemasangan" ON "donasi_transaksi" USING btree ("pemasangan_id" int8_ops);--> statement-breakpoint
CREATE INDEX "idx_donasi_transaksi_tgl_brin" ON "donasi_transaksi" USING brin ("tgl_transaksi" date_minmax_ops);--> statement-breakpoint
CREATE INDEX "idx_penyaluran_anak" ON "penyaluran" USING btree ("anak_id" int2_ops,"bulan" int2_ops,"tahun" int2_ops);--> statement-breakpoint
CREATE INDEX "idx_penyaluran_donatur" ON "penyaluran" USING btree ("donatur_id" int8_ops);--> statement-breakpoint
CREATE INDEX "idx_penyaluran_kantor" ON "penyaluran" USING btree ("kantor_id" int8_ops);--> statement-breakpoint
CREATE INDEX "idx_penyaluran_kode" ON "penyaluran" USING btree ("kode_penyaluran" text_ops);--> statement-breakpoint
CREATE INDEX "idx_penyaluran_pemasangan" ON "penyaluran" USING btree ("pemasangan_id" int8_ops);--> statement-breakpoint
CREATE INDEX "idx_penyaluran_tgl_brin" ON "penyaluran" USING brin ("tgl_penyaluran" date_minmax_ops);--> statement-breakpoint
CREATE INDEX "idx_opname_saldo_tahun_brin" ON "opname_saldo" USING brin ("tahun" int2_minmax_ops);--> statement-breakpoint
CREATE INDEX "idx_ajuan_anak_asal" ON "pengajuan_pergantian_anak" USING btree ("anak_asal_id" int8_ops);--> statement-breakpoint
CREATE INDEX "idx_ajuan_anak_pengganti" ON "pengajuan_pergantian_anak" USING btree ("anak_pengganti_id" int8_ops);--> statement-breakpoint
CREATE INDEX "idx_ajuan_donatur" ON "pengajuan_pergantian_anak" USING btree ("donatur_id" int8_ops);--> statement-breakpoint
CREATE INDEX "idx_ajuan_kantor" ON "pengajuan_pergantian_anak" USING btree ("kantor_id" int8_ops);--> statement-breakpoint
CREATE INDEX "idx_ajuan_tgl_brin" ON "pengajuan_pergantian_anak" USING brin ("tgl_ajuan" date_minmax_ops);--> statement-breakpoint
CREATE INDEX "idx_transaksi_donatur" ON "transaksi" USING btree ("donatur_id" int8_ops);--> statement-breakpoint
CREATE INDEX "idx_transaksi_jenis_tgl" ON "transaksi" USING btree ("jenis_transaksi" text_ops,"tgl_donasi" text_ops,"tgl_transaksi" text_ops);--> statement-breakpoint
CREATE INDEX "idx_transaksi_kantor" ON "transaksi" USING btree ("kantor_transaksi_id" int8_ops);--> statement-breakpoint
CREATE INDEX "idx_transaksi_program" ON "transaksi" USING btree ("program_id" int8_ops);--> statement-breakpoint
CREATE INDEX "idx_transaksi_tgl_brin" ON "transaksi" USING brin ("tgl_transaksi" date_minmax_ops);--> statement-breakpoint
CREATE INDEX "idx_semester_tahun" ON "ajis_semester" USING btree ("tahun" int2_ops,"jenis" int2_ops);--> statement-breakpoint
CREATE INDEX "idx_pembinaan_anak" ON "pembinaan" USING btree ("anak_id" int8_ops,"tgl_pembinaan" date_ops);--> statement-breakpoint
CREATE INDEX "idx_pembinaan_kantor" ON "pembinaan" USING btree ("kantor_id" int8_ops);--> statement-breakpoint
CREATE INDEX "idx_pembinaan_kode" ON "pembinaan" USING btree ("kode_pembinaan" text_ops);--> statement-breakpoint
CREATE INDEX "idx_pembinaan_semester" ON "pembinaan" USING btree ("semester_id" int8_ops);--> statement-breakpoint
CREATE INDEX "idx_pembinaan_tgl_brin" ON "pembinaan" USING brin ("tgl_pembinaan" date_minmax_ops);--> statement-breakpoint
CREATE INDEX "idx_pembinaan_wilayah" ON "pembinaan" USING btree ("wilayah_pembinaan_id" int8_ops);--> statement-breakpoint
CREATE INDEX "idx_pembinaan_dok_kombo" ON "pembinaan_dokumentasi" USING btree ("semester_id" int8_ops,"kantor_id" int8_ops,"wilayah_pembinaan_id" int8_ops);--> statement-breakpoint
CREATE INDEX "idx_hafalan_anak_semester" ON "hafalan_anak" USING btree ("anak_id" int8_ops,"semester_id" int8_ops);--> statement-breakpoint
CREATE INDEX "idx_item_penilaian_parent" ON "item_penilaian" USING btree ("parent_id" int8_ops);--> statement-breakpoint
CREATE INDEX "idx_penilaian_anak_semester" ON "penilaian_anak" USING btree ("anak_id" int8_ops,"semester_id" int8_ops);--> statement-breakpoint
CREATE INDEX "idx_penilaian_kantor" ON "penilaian_anak" USING btree ("kantor_id" int8_ops);--> statement-breakpoint
CREATE INDEX "idx_materi_semester" ON "materi_pembinaan" USING btree ("semester_id" int8_ops);--> statement-breakpoint
CREATE INDEX "idx_materi_wilayah" ON "materi_pembinaan" USING btree ("wilayah_pembinaan_id" int8_ops);--> statement-breakpoint
CREATE INDEX "idx_laporan_semester_anak" ON "laporan_semester" USING btree ("anak_id" int8_ops);--> statement-breakpoint
CREATE INDEX "idx_laporan_semester_donatur" ON "laporan_semester" USING btree ("donatur_id" int8_ops);--> statement-breakpoint
CREATE INDEX "idx_laporan_semester_periode" ON "laporan_semester" USING btree ("semester_id" int2_ops,"format_id" int8_ops);--> statement-breakpoint
CREATE INDEX "idx_laporan_semester_wilayah" ON "laporan_semester" USING btree ("wilayah_pembinaan_id" int8_ops,"kantor_id" int8_ops);--> statement-breakpoint
CREATE INDEX "idx_peminjaman_anak" ON "peminjaman_ajis_anak" USING btree ("anak_id" int8_ops);--> statement-breakpoint
CREATE INDEX "idx_peminjaman_status" ON "peminjaman_ajis_anak" USING btree ("kantor_id" int8_ops,"wilayah_pembinaan_id" int8_ops,"status_pinjam" text_ops);--> statement-breakpoint
CREATE INDEX "idx_laporan_semester_pembinaan_anak" ON "laporan_semester_pembinaan" USING btree ("anak_id" int8_ops);--> statement-breakpoint
CREATE INDEX "idx_laporan_prestasi_anak" ON "laporan_prestasi" USING btree ("anak_id" int8_ops);--> statement-breakpoint
CREATE INDEX "idx_prestasi_anak_anak" ON "prestasi_anak" USING btree ("anak_id" int8_ops);--> statement-breakpoint
CREATE INDEX "idx_user_wilayah_wilayah" ON "ajis_user_wilayah_pembinaan" USING btree ("wilayah_pembinaan_id" int8_ops);--> statement-breakpoint
CREATE VIEW "public"."v_ref_wilayah_lengkap" AS (SELECT d.id AS desa_id, d.kode AS kode_desa, d.nama AS nama_desa, d.is_kelurahan, kec.id AS kecamatan_id, kec.kode AS kode_kecamatan, kec.nama AS nama_kecamatan, kab.id AS kabupaten_id, kab.kode AS kode_kabupaten, kab.nama AS nama_kabupaten, kab.is_kota, prop.id AS propinsi_id, prop.kode AS kode_propinsi, prop.nama AS nama_propinsi FROM ref_desa d JOIN ref_kecamatan kec ON kec.id = d.kecamatan_id JOIN ref_kabupaten kab ON kab.id = kec.kabupaten_id JOIN ref_propinsi prop ON prop.id = kab.propinsi_id);