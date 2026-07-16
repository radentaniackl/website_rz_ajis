import { pgTable, unique, check, bigserial, varchar, index, foreignKey, bigint, boolean, numeric, timestamp, date, text, integer, smallint, jsonb, uniqueIndex, primaryKey, pgView } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"



export const refPropinsi = pgTable("ref_propinsi", {
	id: bigserial({ mode: "bigint" }).primaryKey().notNull(),
	kode: varchar({ length: 4 }).notNull(),
	nama: varchar({ length: 100 }).notNull(),
	ibukota: varchar({ length: 100 }),
	aktif: varchar({ length: 1 }).default('y').notNull(),
}, (table) => [
	unique("ref_propinsi_kode_key").on(table.kode),
	check("ck_propinsi_aktif", sql`(aktif)::text = ANY ((ARRAY['y'::character varying, 'n'::character varying])::text[])`),
]);

export const refKabupaten = pgTable("ref_kabupaten", {
	id: bigserial({ mode: "bigint" }).primaryKey().notNull(),
	kode: varchar({ length: 4 }).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	propinsiId: bigint("propinsi_id", { mode: "number" }).notNull(),
	nama: varchar({ length: 100 }).notNull(),
	isKota: boolean("is_kota").default(false).notNull(),
	kodeOid: varchar("kode_oid", { length: 6 }),
	ibukota: varchar({ length: 100 }),
	lat: numeric({ precision: 10, scale:  6 }),
	lng: numeric({ precision: 10, scale:  6 }),
	aktif: varchar({ length: 1 }).default('y').notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
}, (table) => [
	index("idx_kabupaten_nama_trgm").using("gin", table.nama.asc().nullsLast().op("gin_trgm_ops")),
	index("idx_kabupaten_propinsi").using("btree", table.propinsiId.asc().nullsLast().op("int8_ops")),
	foreignKey({
			columns: [table.propinsiId],
			foreignColumns: [refPropinsi.id],
			name: "ref_kabupaten_propinsi_id_fkey"
		}).onDelete("restrict"),
	unique("ref_kabupaten_kode_key").on(table.kode),
	check("ck_kabupaten_aktif", sql`(aktif)::text = ANY ((ARRAY['y'::character varying, 'n'::character varying])::text[])`),
]);

export const refKecamatan = pgTable("ref_kecamatan", {
	id: bigserial({ mode: "bigint" }).primaryKey().notNull(),
	kode: varchar({ length: 10 }).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	kabupatenId: bigint("kabupaten_id", { mode: "number" }).notNull(),
	nama: varchar({ length: 100 }).notNull(),
	kodepos: varchar({ length: 10 }),
	aktif: varchar({ length: 1 }).default('y').notNull(),
	updatedAt: date("updated_at"),
}, (table) => [
	index("idx_kecamatan_kabupaten").using("btree", table.kabupatenId.asc().nullsLast().op("int8_ops")),
	index("idx_kecamatan_nama_trgm").using("gin", table.nama.asc().nullsLast().op("gin_trgm_ops")),
	foreignKey({
			columns: [table.kabupatenId],
			foreignColumns: [refKabupaten.id],
			name: "ref_kecamatan_kabupaten_id_fkey"
		}).onDelete("restrict"),
	unique("ref_kecamatan_kode_key").on(table.kode),
	check("ck_kecamatan_aktif", sql`(aktif)::text = ANY ((ARRAY['y'::character varying, 'n'::character varying])::text[])`),
]);

export const refDesa = pgTable("ref_desa", {
	id: bigserial({ mode: "bigint" }).primaryKey().notNull(),
	kode: varchar({ length: 10 }).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	kecamatanId: bigint("kecamatan_id", { mode: "number" }).notNull(),
	nama: varchar({ length: 100 }).notNull(),
	isKelurahan: boolean("is_kelurahan").default(false).notNull(),
	nomorIndukDesa: varchar("nomor_induk_desa", { length: 50 }),
	aktif: varchar({ length: 1 }).default('y').notNull(),
}, (table) => [
	index("idx_desa_kecamatan").using("btree", table.kecamatanId.asc().nullsLast().op("int8_ops")),
	index("idx_desa_nama_trgm").using("gin", table.nama.asc().nullsLast().op("gin_trgm_ops")),
	foreignKey({
			columns: [table.kecamatanId],
			foreignColumns: [refKecamatan.id],
			name: "ref_desa_kecamatan_id_fkey"
		}).onDelete("restrict"),
	unique("ref_desa_kode_key").on(table.kode),
	check("ck_desa_aktif", sql`(aktif)::text = ANY ((ARRAY['y'::character varying, 'n'::character varying])::text[])`),
]);

export const ajisKantor = pgTable("ajis_kantor", {
	id: bigserial({ mode: "bigint" }).primaryKey().notNull(),
	kode: varchar({ length: 10 }).notNull(),
	nama: varchar({ length: 150 }).notNull(),
	alamat: varchar({ length: 200 }),
	noTelp: varchar("no_telp", { length: 20 }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	parentId: bigint("parent_id", { mode: "number" }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	parentSecondId: bigint("parent_second_id", { mode: "number" }),
	kodeProgramRz: text("kode_program_rz"),
	jenis: varchar({ length: 50 }),
	kodeKantorLegacy: varchar("kode_kantor_legacy", { length: 20 }),
	aktif: varchar({ length: 1 }).default('y').notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_kantor_nama_trgm").using("gin", table.nama.asc().nullsLast().op("gin_trgm_ops")),
	index("idx_kantor_parent").using("btree", table.parentId.asc().nullsLast().op("int8_ops")),
	index("idx_kantor_parent_second").using("btree", table.parentSecondId.asc().nullsLast().op("int8_ops")),
	foreignKey({
			columns: [table.parentId],
			foreignColumns: [table.id],
			name: "ajis_kantor_parent_id_fkey"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.parentSecondId],
			foreignColumns: [table.id],
			name: "ajis_kantor_parent_second_id_fkey"
		}).onDelete("set null"),
	unique("ajis_kantor_kode_key").on(table.kode),
	unique("ajis_kantor_kode_kantor_legacy_key").on(table.kodeKantorLegacy),
	check("ck_kantor_aktif", sql`(aktif)::text = ANY ((ARRAY['y'::character varying, 'n'::character varying])::text[])`),
]);

export const ajisWilayahPembinaan = pgTable("ajis_wilayah_pembinaan", {
	id: bigserial({ mode: "bigint" }).primaryKey().notNull(),
	kodeLama: integer("kode_lama"),
	namaWilayah: varchar("nama_wilayah", { length: 150 }).notNull(),
	alamatWilayah: text("alamat_wilayah"),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	kantorId: bigint("kantor_id", { mode: "number" }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	desaId: bigint("desa_id", { mode: "number" }),
	statusApprove: varchar("status_approve", { length: 1 }),
	aktif: varchar({ length: 1 }).default('y').notNull(),
	userInsert: varchar("user_insert", { length: 50 }),
	dateInsert: date("date_insert"),
	userUpdate: varchar("user_update", { length: 50 }),
	dateUpdate: date("date_update"),
}, (table) => [
	index("idx_wilayah_aktif").using("btree", table.aktif.asc().nullsLast().op("text_ops")).where(sql`((aktif)::text = 'y'::text)`),
	index("idx_wilayah_desa").using("btree", table.desaId.asc().nullsLast().op("int8_ops")),
	index("idx_wilayah_kantor").using("btree", table.kantorId.asc().nullsLast().op("int8_ops")),
	index("idx_wilayah_nama_trgm").using("gin", table.namaWilayah.asc().nullsLast().op("gin_trgm_ops")),
	foreignKey({
			columns: [table.kantorId],
			foreignColumns: [ajisKantor.id],
			name: "ajis_wilayah_pembinaan_kantor_id_fkey"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.desaId],
			foreignColumns: [refDesa.id],
			name: "ajis_wilayah_pembinaan_desa_id_fkey"
		}).onDelete("set null"),
	unique("ajis_wilayah_pembinaan_kode_lama_key").on(table.kodeLama),
	unique("ajis_wilayah_pembinaan_nama_wilayah_key").on(table.namaWilayah),
	check("ck_wilayah_status_approve", sql`(status_approve IS NULL) OR ((status_approve)::text = ANY ((ARRAY['y'::character varying, 't'::character varying])::text[]))`),
	check("ck_wilayah_aktif", sql`(aktif)::text = ANY ((ARRAY['y'::character varying, 'n'::character varying])::text[])`),
]);

export const ajisUser = pgTable("ajis_user", {
	id: bigserial({ mode: "bigint" }).primaryKey().notNull(),
	kodeLama: integer("kode_lama"),
	username: varchar({ length: 100 }).notNull(),
	email: varchar({ length: 255 }),
	passwordHash: varchar("password_hash", { length: 255 }).notNull(),
	mustResetPassword: boolean("must_reset_password").default(true).notNull(),
	failedLoginAttempts: integer("failed_login_attempts").default(0).notNull(),
	lockedUntil: timestamp("locked_until"),
	nik: varchar({ length: 20 }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	kantorId: bigint("kantor_id", { mode: "number" }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	groupUserId: bigint("group_user_id", { mode: "number" }),
	aktif: varchar({ length: 1 }).default('y').notNull(),
	userInsert: varchar("user_insert", { length: 50 }),
	dateInsert: timestamp("date_insert", { mode: 'string' }),
}, (table) => [
	index("idx_user_group").using("btree", table.groupUserId.asc().nullsLast().op("int8_ops")),
	index("idx_user_kantor").using("btree", table.kantorId.asc().nullsLast().op("int8_ops")),
	foreignKey({
			columns: [table.kantorId],
			foreignColumns: [ajisKantor.id],
			name: "ajis_user_kantor_id_fkey"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.groupUserId],
			foreignColumns: [ajisGroupUser.id],
			name: "ajis_user_group_user_id_fkey"
		}).onDelete("set null"),
	unique("ajis_user_kode_lama_key").on(table.kodeLama),
	unique("ajis_user_username_key").on(table.username),
	check("ck_user_aktif", sql`(aktif)::text = ANY ((ARRAY['y'::character varying, 'n'::character varying])::text[])`),
]);

export const ajisGroupUser = pgTable("ajis_group_user", {
	id: bigserial({ mode: "bigint" }).primaryKey().notNull(),
	nama: varchar({ length: 50 }).notNull(),
	keterangan: varchar({ length: 150 }),
	aktif: varchar({ length: 1 }).default('y').notNull(),
}, () => [
    check("ck_group_user_aktif", sql`(aktif)::text = ANY ((ARRAY['y'::character varying, 'n'::character varying])::text[])`),
]);

export const ajisSdmWilayah = pgTable("ajis_sdm_wilayah", {
	id: bigserial({ mode: "bigint" }).primaryKey().notNull(),
	kodeLama: integer("kode_lama"),
	nik: varchar({ length: 20 }),
	namaLengkap: varchar("nama_lengkap", { length: 100 }).notNull(),
	jenisKelamin: varchar("jenis_kelamin", { length: 1 }),
	alamat: varchar({ length: 200 }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	desaId: bigint("desa_id", { mode: "number" }),
	jenjangPendidikan: varchar("jenjang_pendidikan", { length: 10 }),
	tglBergabung: date("tgl_bergabung"),
	tglKeluar: date("tgl_keluar"),
	telp: varchar({ length: 20 }),
	hp: varchar({ length: 20 }),
	email: varchar({ length: 100 }),
	keterangan: varchar({ length: 200 }),
	keaktifanEdukasi: varchar("keaktifan_edukasi", { length: 1 }),
	foto: varchar({ length: 200 }),
	aktif: varchar({ length: 10 }).default('y').notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	penugasanWilayahId: bigint("penugasan_wilayah_id", { mode: "number" }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	penugasanKantorId: bigint("penugasan_kantor_id", { mode: "number" }),
	penugasanFungsiStruktur: varchar("penugasan_fungsi_struktur", { length: 16 }),
	penugasanKeaktifanEdukasi: varchar("penugasan_keaktifan_edukasi", { length: 1 }),
	userInsert: varchar("user_insert", { length: 30 }),
	dateInsert: date("date_insert"),
	userUpdate: varchar("user_update", { length: 30 }),
	dateUpdate: date("date_update"),
}, (table) => [
	index("idx_sdm_wilayah_aktif").using("btree", table.aktif.asc().nullsLast().op("text_ops")).where(sql`((aktif)::text = 'y'::text)`),
	index("idx_sdm_wilayah_nama_trgm").using("gin", table.namaLengkap.asc().nullsLast().op("gin_trgm_ops")),
	index("idx_sdm_wilayah_penugasan_kantor").using("btree", table.penugasanKantorId.asc().nullsLast().op("int8_ops")),
	index("idx_sdm_wilayah_penugasan_wilayah").using("btree", table.penugasanWilayahId.asc().nullsLast().op("int8_ops")),
	foreignKey({
			columns: [table.desaId],
			foreignColumns: [refDesa.id],
			name: "ajis_sdm_wilayah_desa_id_fkey"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.penugasanWilayahId],
			foreignColumns: [ajisWilayahPembinaan.id],
			name: "ajis_sdm_wilayah_penugasan_wilayah_id_fkey"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.penugasanKantorId],
			foreignColumns: [ajisKantor.id],
			name: "ajis_sdm_wilayah_penugasan_kantor_id_fkey"
		}).onDelete("set null"),
	unique("ajis_sdm_wilayah_kode_lama_key").on(table.kodeLama),
	unique("ajis_sdm_wilayah_nik_key").on(table.nik),
	check("ck_sdm_jk", sql`(jenis_kelamin IS NULL) OR ((jenis_kelamin)::text = ANY ((ARRAY['l'::character varying, 'p'::character varying])::text[]))`),
	check("ck_sdm_keaktifan", sql`(keaktifan_edukasi IS NULL) OR ((keaktifan_edukasi)::text = ANY ((ARRAY['y'::character varying, 't'::character varying])::text[]))`),
	check("ck_sdm_keaktifan_jabatan", sql`(penugasan_keaktifan_edukasi IS NULL) OR ((penugasan_keaktifan_edukasi)::text = ANY ((ARRAY['y'::character varying, 't'::character varying])::text[]))`),
]);

export const ajisSdmWilayahRiwayat = pgTable("ajis_sdm_wilayah_riwayat", {
	id: bigserial({ mode: "bigint" }).primaryKey().notNull(),
	kodeLama: integer("kode_lama"),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	sdmWilayahId: bigint("sdm_wilayah_id", { mode: "number" }).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	wilayahPembinaanId: bigint("wilayah_pembinaan_id", { mode: "number" }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	kantorId: bigint("kantor_id", { mode: "number" }),
	fungsiStruktur: varchar("fungsi_struktur", { length: 16 }),
	keaktifanEdukasi: varchar("keaktifan_edukasi", { length: 1 }),
	isCurrent: boolean("is_current").default(false).notNull(),
	userInsert: varchar("user_insert", { length: 30 }),
	dateInsert: date("date_insert"),
	userUpdate: varchar("user_update", { length: 30 }),
	dateUpdate: date("date_update"),
}, (table) => [
	index("idx_sdm_riwayat_kantor").using("btree", table.kantorId.asc().nullsLast().op("int8_ops")),
	index("idx_sdm_riwayat_sdm").using("btree", table.sdmWilayahId.asc().nullsLast().op("int8_ops")),
	index("idx_sdm_riwayat_wilayah").using("btree", table.wilayahPembinaanId.asc().nullsLast().op("int8_ops")),
	foreignKey({
			columns: [table.sdmWilayahId],
			foreignColumns: [ajisSdmWilayah.id],
			name: "ajis_sdm_wilayah_riwayat_sdm_wilayah_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.wilayahPembinaanId],
			foreignColumns: [ajisWilayahPembinaan.id],
			name: "ajis_sdm_wilayah_riwayat_wilayah_pembinaan_id_fkey"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.kantorId],
			foreignColumns: [ajisKantor.id],
			name: "ajis_sdm_wilayah_riwayat_kantor_id_fkey"
		}).onDelete("set null"),
	unique("ajis_sdm_wilayah_riwayat_kode_lama_key").on(table.kodeLama),
	check("ck_riwayat_keaktifan", sql`(keaktifan_edukasi IS NULL) OR ((keaktifan_edukasi)::text = ANY ((ARRAY['y'::character varying, 't'::character varying])::text[]))`),
]);

export const ajisAnak = pgTable("ajis_anak", {
	id: bigserial({ mode: "bigint" }).primaryKey().notNull(),
	kodeAnak: varchar("kode_anak", { length: 25 }).notNull(),
	nik: varchar({ length: 50 }).notNull(),
	namaLengkap: text("nama_lengkap").notNull(),
	namaPanggilan: varchar("nama_panggilan", { length: 50 }),
	agama: varchar({ length: 50 }),
	jnsKel: varchar("jns_kel", { length: 1 }).notNull(),
	tempatLahir: varchar("tempat_lahir", { length: 50 }),
	tglLahir: date("tgl_lahir").notNull(),
	anakKe: smallint("anak_ke"),
	dariSaudara: smallint("dari_saudara"),
	alamat: varchar({ length: 150 }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	desaId: bigint("desa_id", { mode: "number" }),
	jenjangPendidikan: varchar("jenjang_pendidikan", { length: 10 }),
	kelas: varchar({ length: 50 }),
	namaSekolah: text("nama_sekolah"),
	alamatSekolah: text("alamat_sekolah"),
	jurusan: varchar({ length: 50 }),
	semester: smallint(),
	namaPt: text("nama_pt"),
	alamatPt: text("alamat_pt"),
	noRekening: varchar("no_rekening", { length: 30 }),
	pemilikRekening: varchar("pemilik_rekening", { length: 50 }),
	namaBank: varchar("nama_bank", { length: 50 }),
	foto: text(),
	nilai: varchar({ length: 50 }),
	pelajaranFavorit: varchar("pelajaran_favorit", { length: 50 }),
	jarakRumah: varchar("jarak_rumah", { length: 50 }),
	alatTransportasi: varchar("alat_transportasi", { length: 50 }),
	hobi: text(),
	prestasi: text(),
	noKartuKeluarga: varchar("no_kartu_keluarga", { length: 30 }),
	asnaf: varchar({ length: 50 }),
	statusOrtu: varchar("status_ortu", { length: 50 }),
	statusSurvey: varchar("status_survey", { length: 1 }).default('n').notNull(),
	statusKelayakan: varchar("status_kelayakan", { length: 1 }).default('n').notNull(),
	statusAnakJuara: varchar("status_anak_juara", { length: 3 }),
	statusTersantuni: varchar("status_tersantuni", { length: 2 }),
	statusPinjam: varchar("status_pinjam", { length: 1 }).default('n').notNull(),
	statusMentor: varchar("status_mentor", { length: 1 }).default('n').notNull(),
	aktif: varchar({ length: 1 }).default('y').notNull(),
	alumniJuara: varchar("alumni_juara", { length: 1 }),
	juara: varchar({ length: 10 }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	wilayahPembinaanId: bigint("wilayah_pembinaan_id", { mode: "number" }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	kantorId: bigint("kantor_id", { mode: "number" }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	sdmWilayahId: bigint("sdm_wilayah_id", { mode: "number" }),
	namaMentorManual: varchar("nama_mentor_manual", { length: 100 }),
	tglTerdaftar: date("tgl_terdaftar"),
	tglPengajuan: date("tgl_pengajuan"),
	namaLengkapAyah: varchar("nama_lengkap_ayah", { length: 100 }),
	alamatAyah: varchar("alamat_ayah", { length: 150 }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	desaAyahId: bigint("desa_ayah_id", { mode: "number" }),
	pekerjaanAyah: text("pekerjaan_ayah"),
	penghasilanAyah: numeric("penghasilan_ayah", { precision: 14, scale:  2 }),
	tglKematianAyah: date("tgl_kematian_ayah"),
	penyebabKematianAyah: varchar("penyebab_kematian_ayah", { length: 150 }),
	namaLengkapIbu: varchar("nama_lengkap_ibu", { length: 100 }),
	alamatIbu: varchar("alamat_ibu", { length: 150 }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	desaIbuId: bigint("desa_ibu_id", { mode: "number" }),
	pekerjaanIbu: text("pekerjaan_ibu"),
	penghasilanIbu: numeric("penghasilan_ibu", { precision: 14, scale:  2 }),
	tglKematianIbu: date("tgl_kematian_ibu"),
	penyebabKematianIbu: varchar("penyebab_kematian_ibu", { length: 150 }),
	namaLengkapWali: varchar("nama_lengkap_wali", { length: 100 }),
	alamatWali: varchar("alamat_wali", { length: 150 }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	desaWaliId: bigint("desa_wali_id", { mode: "number" }),
	pekerjaanWali: text("pekerjaan_wali"),
	penghasilanWali: numeric("penghasilan_wali", { precision: 14, scale:  2 }),
	telpDihubungi: varchar("telp_dihubungi", { length: 20 }),
	atasNama: varchar("atas_nama", { length: 50 }),
	hubunganKerabat: varchar("hubungan_kerabat", { length: 30 }),
	viaInput: varchar("via_input", { length: 100 }),
	approvalIjf: varchar("approval_ijf", { length: 50 }),
	kodeProgramRz: text("kode_program_rz"),
	niaRfoBook: varchar("nia_rfo_book", { length: 50 }),
	namaRfoBook: varchar("nama_rfo_book", { length: 100 }),
	tglPeminjaman: date("tgl_peminjaman"),
	tglExpired: date("tgl_expired"),
	bookVia: varchar("book_via", { length: 50 }),
	userBook: varchar("user_book", { length: 50 }),
	tinggalBersama: text("tinggal_bersama"),
	namaTinggal: text("nama_tinggal"),
	ketTinggal: text("ket_tinggal"),
	penghasilanTinggal: text("penghasilan_tinggal"),
	pekerjaanTinggal: text("pekerjaan_tinggal"),
	tidakSerumahOrtu: varchar("tidak_serumah_ortu", { length: 50 }),
	kodeKantorLegacy: varchar("kode_kantor_legacy", { length: 10 }),
	kodeIjgsAnak: varchar("kode_ijgs_anak", { length: 50 }),
	uploadGdrive: varchar("upload_gdrive", { length: 50 }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_anak_aktif_only").using("btree", table.kantorId.asc().nullsLast().op("int8_ops"), table.wilayahPembinaanId.asc().nullsLast().op("int8_ops")).where(sql`((aktif)::text = 'y'::text)`),
	index("idx_anak_desa").using("btree", table.desaId.asc().nullsLast().op("int8_ops")),
	index("idx_anak_desa_ayah").using("btree", table.desaAyahId.asc().nullsLast().op("int8_ops")),
	index("idx_anak_desa_ibu").using("btree", table.desaIbuId.asc().nullsLast().op("int8_ops")),
	index("idx_anak_desa_wali").using("btree", table.desaWaliId.asc().nullsLast().op("int8_ops")),
	index("idx_anak_filter_combo").using("btree", table.wilayahPembinaanId.asc().nullsLast().op("int8_ops"), table.kantorId.asc().nullsLast().op("int8_ops"), table.aktif.asc().nullsLast().op("text_ops")),
	index("idx_anak_kantor").using("btree", table.kantorId.asc().nullsLast().op("int8_ops")),
	index("idx_anak_nama_trgm").using("gin", table.namaLengkap.asc().nullsLast().op("gin_trgm_ops")),
	index("idx_anak_nik_trgm").using("gin", table.nik.asc().nullsLast().op("gin_trgm_ops")),
	index("idx_anak_sdm").using("btree", table.sdmWilayahId.asc().nullsLast().op("int8_ops")),
	index("idx_anak_status").using("btree", table.aktif.asc().nullsLast().op("text_ops"), table.statusTersantuni.asc().nullsLast().op("text_ops"), table.jenjangPendidikan.asc().nullsLast().op("text_ops")),
	index("idx_anak_tgl_lahir_brin").using("brin", table.tglLahir.asc().nullsLast().op("date_minmax_ops")),
	index("idx_anak_tgl_terdaftar_brin").using("brin", table.tglTerdaftar.asc().nullsLast().op("date_minmax_ops")),
	index("idx_anak_wilayah").using("btree", table.wilayahPembinaanId.asc().nullsLast().op("int8_ops")),
	foreignKey({
			columns: [table.desaId],
			foreignColumns: [refDesa.id],
			name: "ajis_anak_desa_id_fkey"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.wilayahPembinaanId],
			foreignColumns: [ajisWilayahPembinaan.id],
			name: "ajis_anak_wilayah_pembinaan_id_fkey"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.kantorId],
			foreignColumns: [ajisKantor.id],
			name: "ajis_anak_kantor_id_fkey"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.sdmWilayahId],
			foreignColumns: [ajisSdmWilayah.id],
			name: "ajis_anak_sdm_wilayah_id_fkey"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.desaAyahId],
			foreignColumns: [refDesa.id],
			name: "ajis_anak_desa_ayah_id_fkey"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.desaIbuId],
			foreignColumns: [refDesa.id],
			name: "ajis_anak_desa_ibu_id_fkey"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.desaWaliId],
			foreignColumns: [refDesa.id],
			name: "ajis_anak_desa_wali_id_fkey"
		}).onDelete("set null"),
	unique("ajis_anak_kode_anak_key").on(table.kodeAnak),
	unique("ajis_anak_nik_key").on(table.nik),
	check("ck_anak_jns_kel", sql`(jns_kel)::text = ANY ((ARRAY['l'::character varying, 'p'::character varying])::text[])`),
	check("ck_anak_status_survey", sql`(status_survey)::text = ANY ((ARRAY['y'::character varying, 'n'::character varying])::text[])`),
	check("ck_anak_status_layak", sql`(status_kelayakan)::text = ANY ((ARRAY['y'::character varying, 'n'::character varying])::text[])`),
	check("ck_anak_status_pinjam", sql`(status_pinjam)::text = ANY ((ARRAY['y'::character varying, 'n'::character varying])::text[])`),
	check("ck_anak_status_mentor", sql`(status_mentor)::text = ANY ((ARRAY['y'::character varying, 'n'::character varying])::text[])`),
	check("ck_anak_aktif", sql`(aktif)::text = ANY ((ARRAY['y'::character varying, 'n'::character varying])::text[])`),
	check("ck_anak_tersantuni", sql`(status_tersantuni IS NULL) OR ((status_tersantuni)::text = ANY ((ARRAY['su'::character varying, 'b'::character varying, 'se'::character varying, 't'::character varying, ''::character varying])::text[]))`),
	check("ck_anak_alumni_juara", sql`(alumni_juara IS NULL) OR ((alumni_juara)::text = ANY ((ARRAY[''::character varying, 'y'::character varying, 'n'::character varying])::text[]))`),
]);

export const donatur = pgTable("donatur", {
	id: bigserial({ mode: "bigint" }).primaryKey().notNull(),
	kodeLama: varchar("kode_lama", { length: 30 }),
	namaLengkap: varchar("nama_lengkap", { length: 100 }).notNull(),
	namaPublikasi: varchar("nama_publikasi", { length: 100 }),
	tglLahir: date("tgl_lahir"),
	jenisKelamin: varchar("jenis_kelamin", { length: 1 }),
	alamatLengkap: text("alamat_lengkap"),
	alamatSilaturahmi: text("alamat_silaturahmi"),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	kecamatanDomisiliId: bigint("kecamatan_domisili_id", { mode: "number" }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	kecamatanSilaturahmiId: bigint("kecamatan_silaturahmi_id", { mode: "number" }),
	statusDonatur: varchar("status_donatur", { length: 10 }).notNull(),
	tglRegistrasi: date("tgl_registrasi"),
	aktif: varchar({ length: 1 }).default('y').notNull(),
	kirimSms: varchar("kirim_sms", { length: 1 }).default('n').notNull(),
	telp: varchar({ length: 30 }),
	fax: varchar({ length: 15 }),
	hp: varchar({ length: 30 }),
	email: varchar({ length: 100 }),
	website: varchar({ length: 100 }),
	verifikasi1: boolean().default(false).notNull(),
	verifikasi2: boolean().default(false).notNull(),
	namaKontak: varchar("nama_kontak", { length: 50 }),
	telpKontak: varchar("telp_kontak", { length: 30 }),
	emailKontak: varchar("email_kontak", { length: 100 }),
	jabatanKontak: varchar("jabatan_kontak", { length: 50 }),
	namaBank: varchar("nama_bank", { length: 50 }),
	noRekening: varchar("no_rekening", { length: 30 }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	kantorDonaturId: bigint("kantor_donatur_id", { mode: "number" }),
	niaRfo: varchar("nia_rfo", { length: 15 }),
	namaRfo: varchar("nama_rfo", { length: 50 }),
	username: varchar({ length: 50 }),
	tipePelayanan: varchar("tipe_pelayanan", { length: 30 }),
	periodeRutinitasTransaksi: smallint("periode_rutinitas_transaksi"),
	sumberInformasi: text("sumber_informasi"),
	jalurKomunikasi: text("jalur_komunikasi"),
	npwp: varchar({ length: 30 }),
	tag: varchar({ length: 100 }),
	externalRef: jsonb("external_ref"),
	userInsert: varchar("user_insert", { length: 50 }),
	userUpdate: varchar("user_update", { length: 50 }),
	tglUpdate: date("tgl_update"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_donatur_aktif").using("btree", table.aktif.asc().nullsLast().op("text_ops")).where(sql`((aktif)::text = 'y'::text)`),
	index("idx_donatur_kantor").using("btree", table.kantorDonaturId.asc().nullsLast().op("int8_ops")),
	index("idx_donatur_kec_domisili").using("btree", table.kecamatanDomisiliId.asc().nullsLast().op("int8_ops")),
	index("idx_donatur_nama_trgm").using("gin", table.namaLengkap.asc().nullsLast().op("gin_trgm_ops")),
	index("idx_donatur_nia_rfo").using("btree", table.niaRfo.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.kecamatanDomisiliId],
			foreignColumns: [refKecamatan.id],
			name: "donatur_kecamatan_domisili_id_fkey"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.kecamatanSilaturahmiId],
			foreignColumns: [refKecamatan.id],
			name: "donatur_kecamatan_silaturahmi_id_fkey"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.kantorDonaturId],
			foreignColumns: [ajisKantor.id],
			name: "donatur_kantor_donatur_id_fkey"
		}).onDelete("set null"),
	unique("donatur_kode_lama_key").on(table.kodeLama),
	check("ck_donatur_jk", sql`(jenis_kelamin IS NULL) OR ((jenis_kelamin)::text = ANY ((ARRAY['l'::character varying, 'p'::character varying, 't'::character varying])::text[]))`),
	check("ck_donatur_aktif", sql`(aktif)::text = ANY ((ARRAY['y'::character varying, 'n'::character varying, 'p'::character varying])::text[])`),
	check("ck_donatur_sms", sql`(kirim_sms)::text = ANY ((ARRAY['y'::character varying, 'n'::character varying])::text[])`),
]);

export const ajisSurvey = pgTable("ajis_survey", {
	id: bigserial({ mode: "bigint" }).primaryKey().notNull(),
	kodeLama: integer("kode_lama"),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	anakId: bigint("anak_id", { mode: "number" }).notNull(),
	tglSurvey: date("tgl_survey"),
	petugasSurvey: varchar("petugas_survey", { length: 50 }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	kantorId: bigint("kantor_id", { mode: "number" }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	wilayahPembinaanId: bigint("wilayah_pembinaan_id", { mode: "number" }),
	asnaf: varchar({ length: 50 }),
	alamat: text(),
	jnsKel: varchar("jns_kel", { length: 1 }),
	jenjangPendidikan: varchar("jenjang_pendidikan", { length: 50 }),
	tglPengajuan: date("tgl_pengajuan"),
	statusAnak: varchar("status_anak", { length: 20 }),
	hasilKesimpulanSurvey: varchar("hasil_kesimpulan_survey", { length: 150 }),
	kepemilikanTanah: varchar("kepemilikan_tanah", { length: 150 }),
	kepemilikanRumah: text("kepemilikan_rumah"),
	kondisiDindingRumah: text("kondisi_dinding_rumah"),
	kondisiLantaiRumah: text("kondisi_lantai_rumah"),
	kepemilikanKendaraan: text("kepemilikan_kendaraan"),
	kepemilikanBarangElektronik: text("kepemilikan_barang_elektronik"),
	pekerjaanKepalaKeluarga: text("pekerjaan_kepala_keluarga"),
	rataRataPenghasilanPerbulan: varchar("rata_rata_penghasilan_perbulan", { length: 150 }),
	kepemilikanTabungan: text("kepemilikan_tabungan"),
	makan2X: varchar("makan_2x", { length: 150 }),
	namaKepalaKeluarga: text("nama_kepala_keluarga"),
	pendidikanTerakhirKepalaKeluarga: text("pendidikan_terakhir_kepala_keluarga"),
	jmlTanggunganKepalaKeluarga: smallint("jml_tanggungan_kepala_keluarga"),
	sumberAirBersih: text("sumber_air_bersih"),
	jambanDanSaluranLimbah: text("jamban_dan_saluran_limbah"),
	tempatPembuanganSampah: text("tempat_pembuangan_sampah"),
	terdapatPerokok: varchar("terdapat_perokok", { length: 150 }),
	terdapatKonsumenMiras: varchar("terdapat_konsumen_miras", { length: 150 }),
	terdapatPersediaanObatP3K: varchar("terdapat_persediaan_obat_p3k", { length: 150 }),
	makanBuahDanSayurTiapHari: varchar("makan_buah_dan_sayur_tiap_hari", { length: 150 }),
	shalat5Waktu: text("shalat_5_waktu"),
	membacaAlquran: text("membaca_alquran"),
	majelisTaklim: text("majelis_taklim"),
	membacaKoran: text("membaca_koran"),
	aktifSebagaiPengurusOrganisasi: text("aktif_sebagai_pengurus_organisasi"),
	asnafAnak: varchar("asnaf_anak", { length: 10 }).notNull(),
	biayaPendidikanSppPerbulan: numeric("biaya_pendidikan_spp_perbulan", { precision: 14, scale:  2 }).default('0').notNull(),
	bantuanRutinDariLembagaLain: varchar("bantuan_rutin_dari_lembaga_lain", { length: 10 }).default('tidak').notNull(),
	jmlBantuanRutinDariLembagaLain: numeric("jml_bantuan_rutin_dari_lembaga_lain", { precision: 14, scale:  2 }),
	resumeDeskriptif: text("resume_deskriptif"),
	kodeAnakOdoo: varchar("kode_anak_odoo", { length: 50 }),
	userInsert: varchar("user_insert", { length: 30 }),
	dateInsert: date("date_insert"),
	userUpdate: varchar("user_update", { length: 30 }),
	dateUpdate: date("date_update"),
}, (table) => [
	index("idx_survey_anak").using("btree", table.anakId.asc().nullsLast().op("int8_ops")),
	index("idx_survey_anak_tgl").using("btree", table.anakId.asc().nullsLast().op("date_ops"), table.tglSurvey.desc().nullsFirst().op("int8_ops")),
	index("idx_survey_kantor").using("btree", table.kantorId.asc().nullsLast().op("int8_ops")),
	index("idx_survey_tgl_brin").using("brin", table.tglSurvey.asc().nullsLast().op("date_minmax_ops")),
	index("idx_survey_wilayah").using("btree", table.wilayahPembinaanId.asc().nullsLast().op("int8_ops")),
	foreignKey({
			columns: [table.anakId],
			foreignColumns: [ajisAnak.id],
			name: "ajis_survey_anak_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.kantorId],
			foreignColumns: [ajisKantor.id],
			name: "ajis_survey_kantor_id_fkey"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.wilayahPembinaanId],
			foreignColumns: [ajisWilayahPembinaan.id],
			name: "ajis_survey_wilayah_pembinaan_id_fkey"
		}).onDelete("set null"),
	unique("ajis_survey_kode_lama_key").on(table.kodeLama),
	check("ck_survey_jns_kel", sql`(jns_kel IS NULL) OR ((jns_kel)::text = ANY ((ARRAY['l'::character varying, 'p'::character varying])::text[]))`),
	check("ck_survey_asnaf_anak", sql`(asnaf_anak)::text = ANY ((ARRAY['yatim'::character varying, 'piatu'::character varying, 'dhuafa'::character varying])::text[])`),
	check("ck_survey_bantuan", sql`(bantuan_rutin_dari_lembaga_lain)::text = ANY ((ARRAY['tidak'::character varying, 'ada'::character varying])::text[])`),
]);

export const program = pgTable("program", {
	id: bigserial({ mode: "bigint" }).primaryKey().notNull(),
	kodeLama: varchar("kode_lama", { length: 6 }),
	kodeProgramLegacy: integer("kode_program_legacy"),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	parentId: bigint("parent_id", { mode: "number" }),
	nama: varchar({ length: 100 }).notNull(),
	namaInggris: varchar("nama_inggris", { length: 100 }),
	jenisProgram: varchar("jenis_program", { length: 2 }).default('dn').notNull(),
	coaProgram: varchar("coa_program", { length: 20 }),
	sifatProgram: varchar("sifat_program", { length: 2 }).default('tt').notNull(),
	keterangan: varchar({ length: 100 }),
	jenjangPendidikan: varchar("jenjang_pendidikan", { length: 10 }),
	tglDigulirkan: date("tgl_digulirkan"),
	aktif: varchar({ length: 1 }).default('y').notNull(),
	tglInaktif: timestamp("tgl_inaktif", { mode: 'string' }),
	kprogid: varchar({ length: 2 }),
	statusProgram: varchar("status_program", { length: 2 }).default('nm').notNull(),
	danaPengelola: varchar("dana_pengelola", { length: 1 }).default('n').notNull(),
	namaAlias: varchar("nama_alias", { length: 30 }),
	pdanaid: integer(),
	kodeAnggaran: varchar("kode_anggaran", { length: 50 }),
	hargaProgram: numeric("harga_program", { precision: 16, scale:  2 }),
	hargaPenyaluran: numeric("harga_penyaluran", { precision: 16, scale:  2 }),
	nominalDp: numeric("nominal_dp", { precision: 16, scale:  2 }),
	nominalDss: numeric("nominal_dss", { precision: 16, scale:  2 }),
	persentaseDp: numeric("persentase_dp", { precision: 7, scale:  4 }),
	persentaseDss: numeric("persentase_dss", { precision: 7, scale:  4 }),
	kreditAccount: varchar("kredit_account", { length: 50 }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_program_aktif").using("btree", table.aktif.asc().nullsLast().op("text_ops")).where(sql`((aktif)::text = 'y'::text)`),
	index("idx_program_nama_trgm").using("gin", table.nama.asc().nullsLast().op("gin_trgm_ops")),
	index("idx_program_parent").using("btree", table.parentId.asc().nullsLast().op("int8_ops")),
	foreignKey({
			columns: [table.parentId],
			foreignColumns: [table.id],
			name: "program_parent_id_fkey"
		}).onDelete("set null"),
	unique("program_kode_lama_key").on(table.kodeLama),
	unique("program_kode_program_legacy_key").on(table.kodeProgramLegacy),
	check("ck_program_jenis", sql`(jenis_program)::text = ANY ((ARRAY['dn'::character varying, 'ln'::character varying])::text[])`),
	check("ck_program_sifat", sql`(sifat_program)::text = ANY ((ARRAY['t'::character varying, 'tt'::character varying])::text[])`),
	check("ck_program_status", sql`(status_program)::text = ANY ((ARRAY['m'::character varying, 'nm'::character varying])::text[])`),
	check("ck_program_aktif", sql`(aktif)::text = ANY ((ARRAY['y'::character varying, 'n'::character varying])::text[])`),
]);

// Auth.js tables for authentication
export const ajisSession = pgTable("ajis_session", {
	id: text("id").primaryKey(),
	userId: bigint("user_id", { mode: "number" }).notNull().references(() => ajisUser.id, { onDelete: "cascade" }),
	expires: timestamp("expires").notNull(),
	sessionToken: text("session_token").notNull().unique(),
	accessToken: text("access_token"),
	createdAt: timestamp("created_at").defaultNow(),
	updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
	unique("ajis_session_session_token_key").on(table.sessionToken),
]);

export const ajisAccount = pgTable("ajis_account", {
	userId: bigint("user_id", { mode: "number" }).notNull().references(() => ajisUser.id, { onDelete: "cascade" }),
	type: text("type").notNull(),
	provider: text("provider").notNull(),
	providerAccountId: text("provider_account_id").notNull(),
	refresh_token: text("refresh_token"),
	access_token: text("access_token"),
	expires_at: integer("expires_at"),
	token_type: text("token_type"),
	scope: text("scope"),
	id_token: text("id_token"),
	session_state: text("session_state"),
}, (table) => [
	primaryKey({ columns: [table.provider, table.providerAccountId], name: "ajis_account_pkey" }),
	index("ajis_account_user_id_idx").using("btree", table.userId.asc().nullsLast().op("int8_ops")),
]);

export const ajisVerificationToken = pgTable("ajis_verification_token", {
	identifier: text("identifier").notNull(),
	token: text("token").notNull(),
	expires: timestamp("expires").notNull(),
}, (table) => [
	primaryKey({ columns: [table.identifier, table.token], name: "ajis_verification_token_pkey" }),
]);

export const pemasangan = pgTable("pemasangan", {
	id: bigserial({ mode: "bigint" }).primaryKey().notNull(),
	kodeLama: varchar("kode_lama", { length: 100 }).notNull(),
	tahun: smallint().notNull(),
	tglPemasangan: date("tgl_pemasangan"),
	tglPemberhentian: date("tgl_pemberhentian"),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	donaturId: bigint("donatur_id", { mode: "number" }).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	anakId: bigint("anak_id", { mode: "number" }).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	wilayahPembinaanId: bigint("wilayah_pembinaan_id", { mode: "number" }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	kantorId: bigint("kantor_id", { mode: "number" }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	programId: bigint("program_id", { mode: "number" }),
	hargaProgram: numeric("harga_program", { precision: 16, scale:  2 }),
	hargaPenyaluran: numeric("harga_penyaluran", { precision: 16, scale:  2 }),
	keteranganPemberhentian: text("keterangan_pemberhentian"),
	statusPasangan: varchar("status_pasangan", { length: 1 }).default('y').notNull(),
	saldoAwal: numeric("saldo_awal", { precision: 16, scale:  2 }).default('0'),
	saldoAkhir: numeric("saldo_akhir", { precision: 16, scale:  2 }),
	statusSaldo: varchar("status_saldo", { length: 1 }).default('n'),
	statusSaldoAkhir: varchar("status_saldo_akhir", { length: 10 }),
	programSebelumnya: varchar("program_sebelumnya", { length: 40 }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	sdmWilayahId: bigint("sdm_wilayah_id", { mode: "number" }),
	statusMentor: varchar("status_mentor", { length: 10 }),
	niaRfo: varchar("nia_rfo", { length: 50 }),
	namaRfo: text("nama_rfo"),
	tundaPenyaluran: varchar("tunda_penyaluran", { length: 50 }),
	kodeNaikJenjang: varchar("kode_naik_jenjang", { length: 100 }),
	viaInput: varchar("via_input", { length: 50 }),
	isRiwayat: boolean("is_riwayat").default(false).notNull(),
	userStop: varchar("user_stop", { length: 50 }),
	viaStop: varchar("via_stop", { length: 50 }),
	alasanAktif: varchar("alasan_aktif", { length: 50 }),
	externalRef: jsonb("external_ref"),
	userInsert: varchar("user_insert", { length: 30 }),
	dateInsert: timestamp("date_insert", { mode: 'string' }),
	userUpdate: varchar("user_update", { length: 30 }),
	dateUpdate: timestamp("date_update", { mode: 'string' }),
	updatedSaldo: timestamp("updated_saldo", { mode: 'string' }),
}, (table) => [
	index("idx_pemasangan_aktif").using("btree", table.kantorId.asc().nullsLast().op("int8_ops"), table.statusPasangan.asc().nullsLast().op("text_ops")).where(sql`((status_pasangan)::text = 'y'::text)`),
	index("idx_pemasangan_anak").using("btree", table.anakId.asc().nullsLast().op("int8_ops")),
	index("idx_pemasangan_donatur").using("btree", table.donaturId.asc().nullsLast().op("int8_ops")),
	index("idx_pemasangan_kantor").using("btree", table.kantorId.asc().nullsLast().op("int8_ops")),
	index("idx_pemasangan_program").using("btree", table.programId.asc().nullsLast().op("int8_ops")),
	index("idx_pemasangan_sdm").using("btree", table.sdmWilayahId.asc().nullsLast().op("int8_ops")),
	index("idx_pemasangan_tahun_brin").using("brin", table.tahun.asc().nullsLast().op("int2_minmax_ops")),
	index("idx_pemasangan_wilayah").using("btree", table.wilayahPembinaanId.asc().nullsLast().op("int8_ops")),
	uniqueIndex("ux_pemasangan_kombo").using("btree", table.donaturId.asc().nullsLast().op("int8_ops"), table.anakId.asc().nullsLast().op("int8_ops"), table.programId.asc().nullsLast().op("int2_ops"), table.tahun.asc().nullsLast().op("int8_ops")),
	foreignKey({
			columns: [table.sdmWilayahId],
			foreignColumns: [ajisSdmWilayah.id],
			name: "pemasangan_sdm_wilayah_id_fkey"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.donaturId],
			foreignColumns: [donatur.id],
			name: "pemasangan_donatur_id_fkey"
		}).onDelete("restrict"),
	foreignKey({
			columns: [table.anakId],
			foreignColumns: [ajisAnak.id],
			name: "pemasangan_anak_id_fkey"
		}).onDelete("restrict"),
	foreignKey({
			columns: [table.wilayahPembinaanId],
			foreignColumns: [ajisWilayahPembinaan.id],
			name: "pemasangan_wilayah_pembinaan_id_fkey"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.kantorId],
			foreignColumns: [ajisKantor.id],
			name: "pemasangan_kantor_id_fkey"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.programId],
			foreignColumns: [program.id],
			name: "pemasangan_program_id_fkey"
		}).onDelete("set null"),
	unique("pemasangan_kode_lama_key").on(table.kodeLama),
	check("ck_pemasangan_status", sql`(status_pasangan)::text = ANY ((ARRAY['y'::character varying, 'n'::character varying])::text[])`),
	check("ck_pemasangan_saldo", sql`(status_saldo IS NULL) OR ((status_saldo)::text = ANY ((ARRAY['y'::character varying, 'n'::character varying])::text[]))`),
]);

export const donasiTransaksi = pgTable("donasi_transaksi", {
	id: bigserial({ mode: "bigint" }).primaryKey().notNull(),
	kodeLama: integer("kode_lama"),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	pemasanganId: bigint("pemasangan_id", { mode: "number" }),
	tglTransaksi: date("tgl_transaksi").notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	anakId: bigint("anak_id", { mode: "number" }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	donaturId: bigint("donatur_id", { mode: "number" }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	programId: bigint("program_id", { mode: "number" }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	kantorId: bigint("kantor_id", { mode: "number" }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	wilayahPembinaanId: bigint("wilayah_pembinaan_id", { mode: "number" }),
	qty: integer().default(1),
	pilihanDonasi: numeric("pilihan_donasi", { precision: 16, scale:  2 }),
	nominalDonasi: numeric("nominal_donasi", { precision: 16, scale:  2 }),
	bulan: smallint(),
	tahun: smallint(),
	periode: varchar({ length: 10 }),
	jenis: varchar({ length: 10 }).default('trans').notNull(),
	jenjangPendidikan: varchar("jenjang_pendidikan", { length: 10 }),
	kodeTransaksi: varchar("kode_transaksi", { length: 50 }),
	detailIdLama: integer("detail_id_lama"),
	viaInput: varchar("via_input", { length: 100 }),
	externalRef: jsonb("external_ref"),
	userInsert: varchar("user_insert", { length: 30 }),
	dateInsert: timestamp("date_insert", { mode: 'string' }),
	userUpdate: varchar("user_update", { length: 30 }),
	dateUpdate: date("date_update"),
}, (table) => [
	index("idx_donasi_transaksi_anak").using("btree", table.anakId.asc().nullsLast().op("int2_ops"), table.bulan.asc().nullsLast().op("int2_ops"), table.tahun.asc().nullsLast().op("int2_ops")),
	index("idx_donasi_transaksi_donatur").using("btree", table.donaturId.asc().nullsLast().op("int8_ops")),
	index("idx_donasi_transaksi_kantor").using("btree", table.kantorId.asc().nullsLast().op("int8_ops")),
	index("idx_donasi_transaksi_pemasangan").using("btree", table.pemasanganId.asc().nullsLast().op("int8_ops")),
	index("idx_donasi_transaksi_tgl_brin").using("brin", table.tglTransaksi.asc().nullsLast().op("date_minmax_ops")),
	foreignKey({
			columns: [table.pemasanganId],
			foreignColumns: [pemasangan.id],
			name: "donasi_transaksi_pemasangan_id_fkey"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.anakId],
			foreignColumns: [ajisAnak.id],
			name: "donasi_transaksi_anak_id_fkey"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.donaturId],
			foreignColumns: [donatur.id],
			name: "donasi_transaksi_donatur_id_fkey"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.programId],
			foreignColumns: [program.id],
			name: "donasi_transaksi_program_id_fkey"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.kantorId],
			foreignColumns: [ajisKantor.id],
			name: "donasi_transaksi_kantor_id_fkey"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.wilayahPembinaanId],
			foreignColumns: [ajisWilayahPembinaan.id],
			name: "donasi_transaksi_wilayah_pembinaan_id_fkey"
		}).onDelete("set null"),
	unique("donasi_transaksi_kode_lama_key").on(table.kodeLama),
	check("ck_donasi_transaksi_jenis", sql`(jenis)::text = ANY ((ARRAY['trans'::character varying, 'saldo'::character varying])::text[])`),
]);

export const penyaluran = pgTable("penyaluran", {
	id: bigserial({ mode: "bigint" }).primaryKey().notNull(),
	idRowLama: integer("id_row_lama"),
	kodePenyaluran: varchar("kode_penyaluran", { length: 50 }).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	pemasanganId: bigint("pemasangan_id", { mode: "number" }),
	tglPenyaluran: date("tgl_penyaluran"),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	anakId: bigint("anak_id", { mode: "number" }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	donaturId: bigint("donatur_id", { mode: "number" }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	sdmWilayahId: bigint("sdm_wilayah_id", { mode: "number" }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	wilayahPembinaanId: bigint("wilayah_pembinaan_id", { mode: "number" }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	kantorId: bigint("kantor_id", { mode: "number" }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	programId: bigint("program_id", { mode: "number" }),
	jenjangPendidikan: varchar("jenjang_pendidikan", { length: 10 }),
	kelas: varchar({ length: 50 }),
	nominalPenyaluran: numeric("nominal_penyaluran", { precision: 16, scale:  2 }),
	nominalHpp: numeric("nominal_hpp", { precision: 16, scale:  2 }),
	bulan: smallint(),
	tahun: smallint(),
	periode: varchar({ length: 10 }),
	kodeTransaksi: varchar("kode_transaksi", { length: 50 }),
	detailIdLama: varchar("detail_id_lama", { length: 50 }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	donasiTransaksiId: bigint("donasi_transaksi_id", { mode: "number" }),
	jenis: varchar({ length: 50 }),
	statusAkhir: varchar("status_akhir", { length: 1 }).default('n').notNull(),
	statusTersalurkan: varchar("status_tersalurkan", { length: 1 }).default('n').notNull(),
	viaInput: varchar("via_input", { length: 10 }).default('single').notNull(),
	externalRef: jsonb("external_ref"),
	userInsert: varchar("user_insert", { length: 30 }),
	dateInsert: timestamp("date_insert", { mode: 'string' }),
	userUpdate: varchar("user_update", { length: 30 }),
	dateUpdate: date("date_update"),
}, (table) => [
	index("idx_penyaluran_anak").using("btree", table.anakId.asc().nullsLast().op("int2_ops"), table.bulan.asc().nullsLast().op("int2_ops"), table.tahun.asc().nullsLast().op("int2_ops")),
	index("idx_penyaluran_donatur").using("btree", table.donaturId.asc().nullsLast().op("int8_ops")),
	index("idx_penyaluran_kantor").using("btree", table.kantorId.asc().nullsLast().op("int8_ops")),
	index("idx_penyaluran_kode").using("btree", table.kodePenyaluran.asc().nullsLast().op("text_ops")),
	index("idx_penyaluran_pemasangan").using("btree", table.pemasanganId.asc().nullsLast().op("int8_ops")),
	index("idx_penyaluran_tgl_brin").using("brin", table.tglPenyaluran.asc().nullsLast().op("date_minmax_ops")),
	foreignKey({
			columns: [table.pemasanganId],
			foreignColumns: [pemasangan.id],
			name: "penyaluran_pemasangan_id_fkey"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.anakId],
			foreignColumns: [ajisAnak.id],
			name: "penyaluran_anak_id_fkey"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.donaturId],
			foreignColumns: [donatur.id],
			name: "penyaluran_donatur_id_fkey"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.sdmWilayahId],
			foreignColumns: [ajisSdmWilayah.id],
			name: "penyaluran_sdm_wilayah_id_fkey"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.wilayahPembinaanId],
			foreignColumns: [ajisWilayahPembinaan.id],
			name: "penyaluran_wilayah_pembinaan_id_fkey"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.kantorId],
			foreignColumns: [ajisKantor.id],
			name: "penyaluran_kantor_id_fkey"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.programId],
			foreignColumns: [program.id],
			name: "penyaluran_program_id_fkey"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.donasiTransaksiId],
			foreignColumns: [donasiTransaksi.id],
			name: "penyaluran_donasi_transaksi_id_fkey"
		}).onDelete("set null"),
	unique("penyaluran_id_row_lama_key").on(table.idRowLama),
	check("ck_penyaluran_status_akhir", sql`(status_akhir)::text = ANY ((ARRAY['y'::character varying, 'n'::character varying])::text[])`),
	check("ck_penyaluran_tersalurkan", sql`(status_tersalurkan)::text = ANY ((ARRAY['y'::character varying, 'n'::character varying])::text[])`),
	check("ck_penyaluran_via_input", sql`(via_input)::text = ANY ((ARRAY['massal'::character varying, 'single'::character varying])::text[])`),
]);

export const opnameSaldo = pgTable("opname_saldo", {
	id: bigserial({ mode: "bigint" }).primaryKey().notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	pemasanganId: bigint("pemasangan_id", { mode: "number" }).notNull(),
	tahun: smallint().notNull(),
	saldoAwalGanjil: numeric("saldo_awal_ganjil", { precision: 16, scale:  2 }),
	saldoAkhirGanjil: numeric("saldo_akhir_ganjil", { precision: 16, scale:  2 }),
	tupoJanJun: varchar("tupo_jan_jun", { length: 100 }),
	tglOpnameGanjil: timestamp("tgl_opname_ganjil", { mode: 'string' }),
	userOpnameGanjil: varchar("user_opname_ganjil", { length: 100 }),
	saldoAwalGenap: numeric("saldo_awal_genap", { precision: 16, scale:  2 }),
	saldoAkhirGenap: numeric("saldo_akhir_genap", { precision: 16, scale:  2 }),
	tupoJulDes: varchar("tupo_jul_des", { length: 100 }),
	tglOpnameGenap: timestamp("tgl_opname_genap", { mode: 'string' }),
	userOpnameGenap: varchar("user_opname_genap", { length: 100 }),
	keterangan: text(),
	userInput: varchar("user_input", { length: 50 }),
	userUpdate: varchar("user_update", { length: 100 }),
	externalRef: jsonb("external_ref"),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
}, (table) => [
	index("idx_opname_saldo_tahun_brin").using("brin", table.tahun.asc().nullsLast().op("int2_minmax_ops")),
	foreignKey({
			columns: [table.pemasanganId],
			foreignColumns: [pemasangan.id],
			name: "opname_saldo_pemasangan_id_fkey"
		}).onDelete("cascade"),
	unique("opname_saldo_pemasangan_id_tahun_key").on(table.pemasanganId, table.tahun),
]);

export const pengajuanPergantianAnak = pgTable("pengajuan_pergantian_anak", {
	id: bigserial({ mode: "bigint" }).primaryKey().notNull(),
	kodeLama: integer("kode_lama"),
	tglAjuan: date("tgl_ajuan"),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	kantorId: bigint("kantor_id", { mode: "number" }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	wilayahPembinaanId: bigint("wilayah_pembinaan_id", { mode: "number" }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	donaturId: bigint("donatur_id", { mode: "number" }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	kantorDonaturId: bigint("kantor_donatur_id", { mode: "number" }),
	programDonasi: varchar("program_donasi", { length: 80 }),
	niaRfo: varchar("nia_rfo", { length: 30 }),
	namaRfo: varchar("nama_rfo", { length: 80 }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	anakAsalId: bigint("anak_asal_id", { mode: "number" }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	anakPenggantiId: bigint("anak_pengganti_id", { mode: "number" }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	pemasanganId: bigint("pemasangan_id", { mode: "number" }),
	alasanPergantian: varchar("alasan_pergantian", { length: 200 }),
	keterangan: varchar({ length: 200 }),
	tipeGanti: varchar("tipe_ganti", { length: 20 }),
	pindahSaldo: numeric("pindah_saldo", { precision: 16, scale:  2 }),
	approveFunding: varchar("approve_funding", { length: 1 }).default('n').notNull(),
	statusEksekusi: varchar("status_eksekusi", { length: 1 }),
	tglEksekusi: date("tgl_eksekusi"),
	tglApproveFunding: timestamp("tgl_approve_funding", { mode: 'string' }),
	jenisDonatur: varchar("jenis_donatur", { length: 100 }),
	hp: varchar({ length: 50 }),
	alasanReject: text("alasan_reject"),
	externalRef: jsonb("external_ref"),
}, (table) => [
	index("idx_ajuan_anak_asal").using("btree", table.anakAsalId.asc().nullsLast().op("int8_ops")),
	index("idx_ajuan_anak_pengganti").using("btree", table.anakPenggantiId.asc().nullsLast().op("int8_ops")),
	index("idx_ajuan_donatur").using("btree", table.donaturId.asc().nullsLast().op("int8_ops")),
	index("idx_ajuan_kantor").using("btree", table.kantorId.asc().nullsLast().op("int8_ops")),
	index("idx_ajuan_tgl_brin").using("brin", table.tglAjuan.asc().nullsLast().op("date_minmax_ops")),
	foreignKey({
			columns: [table.kantorId],
			foreignColumns: [ajisKantor.id],
			name: "pengajuan_pergantian_anak_kantor_id_fkey"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.wilayahPembinaanId],
			foreignColumns: [ajisWilayahPembinaan.id],
			name: "pengajuan_pergantian_anak_wilayah_pembinaan_id_fkey"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.donaturId],
			foreignColumns: [donatur.id],
			name: "pengajuan_pergantian_anak_donatur_id_fkey"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.kantorDonaturId],
			foreignColumns: [ajisKantor.id],
			name: "pengajuan_pergantian_anak_kantor_donatur_id_fkey"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.anakAsalId],
			foreignColumns: [ajisAnak.id],
			name: "pengajuan_pergantian_anak_anak_asal_id_fkey"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.anakPenggantiId],
			foreignColumns: [ajisAnak.id],
			name: "pengajuan_pergantian_anak_anak_pengganti_id_fkey"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.pemasanganId],
			foreignColumns: [pemasangan.id],
			name: "pengajuan_pergantian_anak_pemasangan_id_fkey"
		}).onDelete("set null"),
	unique("pengajuan_pergantian_anak_kode_lama_key").on(table.kodeLama),
	check("ck_ajuan_approve", sql`(approve_funding)::text = ANY ((ARRAY['t'::character varying, 'n'::character varying, 'y'::character varying])::text[])`),
	check("ck_ajuan_eksekusi", sql`(status_eksekusi IS NULL) OR ((status_eksekusi)::text = ANY ((ARRAY[''::character varying, 'y'::character varying, 'n'::character varying])::text[]))`),
]);

export const transaksi = pgTable("transaksi", {
	id: bigserial({ mode: "bigint" }).primaryKey().notNull(),
	kodeLama: varchar("kode_lama", { length: 50 }).notNull(),
	detailIdLama: integer("detail_id_lama").notNull(),
	jenisTransaksi: varchar("jenis_transaksi", { length: 10 }).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	donaturId: bigint("donatur_id", { mode: "number" }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	programId: bigint("program_id", { mode: "number" }),
	perkiraanRp: numeric("perkiraan_rp", { precision: 18, scale:  2 }),
	tglDonasi: date("tgl_donasi"),
	tglTransaksi: date("tgl_transaksi"),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	kantorTransaksiId: bigint("kantor_transaksi_id", { mode: "number" }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	kantorDonaturId: bigint("kantor_donatur_id", { mode: "number" }),
	vbayarid: varchar({ length: 100 }),
	mbayarid: varchar({ length: 100 }),
	nikRfo: varchar("nik_rfo", { length: 15 }),
	nikClaim: varchar("nik_claim", { length: 14 }),
	jidClaim: varchar("jid_claim", { length: 6 }),
	approvedClaim: varchar("approved_claim", { length: 1 }).default('n').notNull(),
	approvedTrans: varchar("approved_trans", { length: 1 }).default('n').notNull(),
	atasNama: text("atas_nama"),
	tglGenerate: timestamp("tgl_generate", { mode: 'string' }),
	keterangan: text(),
	jmlMustahik: varchar("jml_mustahik", { length: 50 }),
	bulanDisantuni: varchar("bulan_disantuni", { length: 50 }),
	namaRfo: varchar("nama_rfo", { length: 50 }),
	namaClaim: varchar("nama_claim", { length: 50 }),
	statusPasang: varchar("status_pasang", { length: 1 }).default('n').notNull(),
	approveSalur: varchar("approve_salur", { length: 1 }).default('n').notNull(),
	ketApproveSalur: text("ket_approve_salur"),
	userApproveSalur: varchar("user_approve_salur", { length: 50 }),
	tglApproveSalur: timestamp("tgl_approve_salur", { mode: 'string' }),
	deletedTrans: varchar("deleted_trans", { length: 1 }).default('n').notNull(),
	deletedDetail: varchar("deleted_detail", { length: 1 }).default('n').notNull(),
	review: varchar({ length: 1 }).default('n').notNull(),
	bulanSalur: varchar("bulan_salur", { length: 50 }),
	tahunSalur: varchar("tahun_salur", { length: 50 }),
	selisihDonasi: numeric("selisih_donasi", { precision: 16, scale:  2 }),
	totalInputDonasi: numeric("total_input_donasi", { precision: 16, scale:  2 }),
	jmlAnakIjis: integer("jml_anak_ijis"),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	kantorIjisId: bigint("kantor_ijis_id", { mode: "number" }),
	hargaProgram: numeric("harga_program", { precision: 16, scale:  2 }),
	idReview: varchar("id_review", { length: 50 }),
	cicilan: varchar({ length: 1 }).default('n').notNull(),
	externalRef: jsonb("external_ref"),
	userInsert: varchar("user_insert", { length: 50 }),
	dateInsert: timestamp("date_insert", { mode: 'string' }),
	userInsertCf: varchar("user_insert_cf", { length: 50 }),
	userUpdateCf: varchar("user_update_cf", { length: 50 }),
}, (table) => [
	index("idx_transaksi_donatur").using("btree", table.donaturId.asc().nullsLast().op("int8_ops")),
	index("idx_transaksi_jenis_tgl").using("btree", table.jenisTransaksi.asc().nullsLast().op("text_ops"), table.tglDonasi.asc().nullsLast().op("text_ops"), table.tglTransaksi.asc().nullsLast().op("text_ops")),
	index("idx_transaksi_kantor").using("btree", table.kantorTransaksiId.asc().nullsLast().op("int8_ops")),
	index("idx_transaksi_program").using("btree", table.programId.asc().nullsLast().op("int8_ops")),
	index("idx_transaksi_tgl_brin").using("brin", table.tglTransaksi.asc().nullsLast().op("date_minmax_ops")),
	foreignKey({
			columns: [table.donaturId],
			foreignColumns: [donatur.id],
			name: "transaksi_donatur_id_fkey"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.programId],
			foreignColumns: [program.id],
			name: "transaksi_program_id_fkey"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.kantorTransaksiId],
			foreignColumns: [ajisKantor.id],
			name: "transaksi_kantor_transaksi_id_fkey"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.kantorDonaturId],
			foreignColumns: [ajisKantor.id],
			name: "transaksi_kantor_donatur_id_fkey"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.kantorIjisId],
			foreignColumns: [ajisKantor.id],
			name: "transaksi_kantor_ijis_id_fkey"
		}).onDelete("set null"),
	unique("transaksi_kode_lama_detail_id_lama_key").on(table.kodeLama, table.detailIdLama),
	check("ck_transaksi_jenis", sql`(jenis_transaksi)::text = ANY ((ARRAY['cash'::character varying, 'noncash'::character varying, 'bank'::character varying, 'pccash'::character varying, 'pcnoncash'::character varying])::text[])`),
]);

export const ajisSemester = pgTable("ajis_semester", {
	id: bigserial({ mode: "bigint" }).primaryKey().notNull(),
	kodeLama: varchar("kode_lama", { length: 50 }),
	nama: varchar({ length: 100 }),
	tglAwal: date("tgl_awal"),
	tglAkhir: date("tgl_akhir"),
	onprogress: varchar({ length: 1 }).default('n').notNull(),
	tglAwalDonasi: date("tgl_awal_donasi"),
	tglAkhirDonasi: date("tgl_akhir_donasi"),
	tglAwalSaldo: date("tgl_awal_saldo"),
	tglAkhirSaldo: date("tgl_akhir_saldo"),
	jenis: varchar({ length: 10 }),
	tahun: smallint(),
	lapsem: varchar({ length: 1 }).notNull(),
}, (table) => [
	index("idx_semester_tahun").using("btree", table.tahun.asc().nullsLast().op("int2_ops"), table.jenis.asc().nullsLast().op("int2_ops")),
	unique("ajis_semester_kode_lama_key").on(table.kodeLama),
	check("ck_semester_onprogress", sql`(onprogress)::text = ANY ((ARRAY['n'::character varying, 'y'::character varying])::text[])`),
]);

export const ajisSemesterTemplate = pgTable("ajis_semester_template", {
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	semesterId: bigint("semester_id", { mode: "number" }).primaryKey().notNull(),
	cover: text(),
	coverSiswa: text("cover_siswa"),
	kataPengantar: text("kata_pengantar"),
	profil: text(),
	kotakProfilCeria: text("kotak_profil_ceria"),
	kotakPembinaanCeria: text("kotak_pembinaan_ceria"),
	kotakProfilSiswa: text("kotak_profil_siswa"),
	kotakPembinaanSiswa: text("kotak_pembinaan_siswa"),
	keuangan: text(),
	surat: text(),
	bawah: text(),
	kataPengantarSiswa: text("kata_pengantar_siswa"),
	bawahSiswa: text("bawah_siswa"),
}, (table) => [
	foreignKey({
			columns: [table.semesterId],
			foreignColumns: [ajisSemester.id],
			name: "ajis_semester_template_semester_id_fkey"
		}).onDelete("cascade"),
]);

export const pembinaan = pgTable("pembinaan", {
	id: bigserial({ mode: "bigint" }).primaryKey().notNull(),
	idRowLama: integer("id_row_lama"),
	kodePembinaan: varchar("kode_pembinaan", { length: 100 }),
	tglPembinaan: date("tgl_pembinaan").notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	semesterId: bigint("semester_id", { mode: "number" }),
	bulan: smallint(),
	tahun: smallint(),
	jenisPembinaan: text("jenis_pembinaan"),
	p3A: text(),
	judulMateri: text("judul_materi"),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	anakId: bigint("anak_id", { mode: "number" }).notNull(),
	kehadiran: varchar({ length: 15 }),
	keterangan: varchar({ length: 50 }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	wilayahPembinaanId: bigint("wilayah_pembinaan_id", { mode: "number" }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	kantorId: bigint("kantor_id", { mode: "number" }),
	pemateri: text(),
	pemateriPersonal: text("pemateri_personal"),
	ortuHadir: varchar("ortu_hadir", { length: 50 }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	donaturId: bigint("donatur_id", { mode: "number" }),
	programDonasi: varchar("program_donasi", { length: 50 }),
	tampil: varchar({ length: 1 }).default('y').notNull(),
	viaInput: varchar("via_input", { length: 50 }),
	capaianTilawah: varchar("capaian_tilawah", { length: 50 }),
	capaianTahfidz: varchar("capaian_tahfidz", { length: 50 }),
	capaianTahfidzHalaman: varchar("capaian_tahfidz_halaman", { length: 50 }),
	pembiasaanShalatWajib: integer("pembiasaan_shalat_wajib"),
	pembiasaanTilawah: integer("pembiasaan_tilawah"),
	pembiasaanSedekah: integer("pembiasaan_sedekah"),
	membantuOrtu: integer("membantu_ortu"),
	externalRef: jsonb("external_ref"),
	userInsert: varchar("user_insert", { length: 100 }),
	dateInsert: timestamp("date_insert", { mode: 'string' }).defaultNow().notNull(),
	userUpdate: varchar("user_update", { length: 100 }),
	dateUpdate: date("date_update"),
}, (table) => [
	index("idx_pembinaan_anak").using("btree", table.anakId.asc().nullsLast().op("int8_ops"), table.tglPembinaan.asc().nullsLast().op("date_ops")),
	index("idx_pembinaan_kantor").using("btree", table.kantorId.asc().nullsLast().op("int8_ops")),
	index("idx_pembinaan_kode").using("btree", table.kodePembinaan.asc().nullsLast().op("text_ops")),
	index("idx_pembinaan_semester").using("btree", table.semesterId.asc().nullsLast().op("int8_ops")),
	index("idx_pembinaan_tgl_brin").using("brin", table.tglPembinaan.asc().nullsLast().op("date_minmax_ops")),
	index("idx_pembinaan_wilayah").using("btree", table.wilayahPembinaanId.asc().nullsLast().op("int8_ops")),
	foreignKey({
			columns: [table.donaturId],
			foreignColumns: [donatur.id],
			name: "pembinaan_donatur_id_fkey"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.semesterId],
			foreignColumns: [ajisSemester.id],
			name: "pembinaan_semester_id_fkey"
		}).onDelete("set null"),
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
	unique("pembinaan_id_row_lama_key").on(table.idRowLama),
	check("ck_pembinaan_tampil", sql`(tampil)::text = ANY ((ARRAY['y'::character varying, 'n'::character varying])::text[])`),
]);

export const pembinaanDokumentasi = pgTable("pembinaan_dokumentasi", {
	id: bigserial({ mode: "bigint" }).primaryKey().notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	semesterId: bigint("semester_id", { mode: "number" }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	kantorId: bigint("kantor_id", { mode: "number" }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	wilayahPembinaanId: bigint("wilayah_pembinaan_id", { mode: "number" }),
	image: text().notNull(),
	nama: varchar({ length: 50 }),
	uploadGdrive: varchar("upload_gdrive", { length: 50 }),
	externalRef: jsonb("external_ref"),
}, (table) => [
	index("idx_pembinaan_dok_kombo").using("btree", table.semesterId.asc().nullsLast().op("int8_ops"), table.kantorId.asc().nullsLast().op("int8_ops"), table.wilayahPembinaanId.asc().nullsLast().op("int8_ops")),
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

export const hafalanAnak = pgTable("hafalan_anak", {
	id: bigserial({ mode: "bigint" }).primaryKey().notNull(),
	kodeLama: integer("kode_lama"),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	anakId: bigint("anak_id", { mode: "number" }).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	itemHafalanId: bigint("item_hafalan_id", { mode: "number" }),
	jenis: varchar({ length: 50 }),
	kontenUji: varchar("konten_uji", { length: 100 }).notNull(),
	tglPengujian: date("tgl_pengujian"),
	tglInsert: timestamp("tgl_insert", { mode: 'string' }),
	keterangan: text(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	semesterId: bigint("semester_id", { mode: "number" }),
	externalRef: jsonb("external_ref"),
}, (table) => [
	index("idx_hafalan_anak_semester").using("btree", table.anakId.asc().nullsLast().op("int8_ops"), table.semesterId.asc().nullsLast().op("int8_ops")),
	foreignKey({
			columns: [table.anakId],
			foreignColumns: [ajisAnak.id],
			name: "hafalan_anak_anak_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.itemHafalanId],
			foreignColumns: [itemHafalan.id],
			name: "hafalan_anak_item_hafalan_id_fkey"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.semesterId],
			foreignColumns: [ajisSemester.id],
			name: "hafalan_anak_semester_id_fkey"
		}).onDelete("set null"),
	unique("hafalan_anak_kode_lama_key").on(table.kodeLama),
	unique("hafalan_anak_anak_id_konten_uji_key").on(table.anakId, table.kontenUji),
]);

export const itemHafalan = pgTable("item_hafalan", {
	id: bigserial({ mode: "bigint" }).primaryKey().notNull(),
	kodeLama: integer("kode_lama"),
	jenis: integer(),
	konten: varchar({ length: 100 }).notNull(),
}, (table) => [
	unique("item_hafalan_kode_lama_key").on(table.kodeLama),
]);

export const periodePenilaian = pgTable("periode_penilaian", {
	id: bigserial({ mode: "bigint" }).primaryKey().notNull(),
	kodeLama: integer("kode_lama"),
	nama: varchar({ length: 30 }),
	tglAwal: date("tgl_awal"),
	tglAkhir: date("tgl_akhir"),
	aktif: varchar({ length: 5 }),
}, (table) => [
	unique("periode_penilaian_kode_lama_key").on(table.kodeLama),
]);

export const itemPenilaian = pgTable("item_penilaian", {
	id: bigserial({ mode: "bigint" }).primaryKey().notNull(),
	kodeLama: integer("kode_lama"),
	namaItem: text("nama_item"),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	parentId: bigint("parent_id", { mode: "number" }),
	isParent: boolean("is_parent").default(false).notNull(),
	jenis: varchar({ length: 100 }),
	target: text(),
}, (table) => [
	index("idx_item_penilaian_parent").using("btree", table.parentId.asc().nullsLast().op("int8_ops")),
	foreignKey({
			columns: [table.parentId],
			foreignColumns: [table.id],
			name: "item_penilaian_parent_id_fkey"
		}).onDelete("set null"),
	unique("item_penilaian_kode_lama_key").on(table.kodeLama),
]);

export const penilaianAnak = pgTable("penilaian_anak", {
	id: bigserial({ mode: "bigint" }).primaryKey().notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	anakId: bigint("anak_id", { mode: "number" }).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	kantorId: bigint("kantor_id", { mode: "number" }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	wilayahPembinaanId: bigint("wilayah_pembinaan_id", { mode: "number" }),
	tglInsert: timestamp("tgl_insert", { mode: 'string' }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	semesterId: bigint("semester_id", { mode: "number" }),
	kategori: varchar({ length: 100 }),
	aspek: varchar({ length: 150 }).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	itemPenilaianId: bigint("item_penilaian_id", { mode: "number" }),
	target: text(),
	kondisiAwal: text("kondisi_awal"),
	nilaiCapaian: integer("nilai_capaian"),
	perkembanganCapaian: text("perkembangan_capaian"),
	skor: integer(),
	hasilAkhir: varchar("hasil_akhir", { length: 100 }),
	keterangan: text(),
	viaInput: varchar("via_input", { length: 20 }),
	tampil: boolean().default(true).notNull(),
	externalRef: jsonb("external_ref"),
}, (table) => [
	index("idx_penilaian_anak_semester").using("btree", table.anakId.asc().nullsLast().op("int8_ops"), table.semesterId.asc().nullsLast().op("int8_ops")),
	index("idx_penilaian_kantor").using("btree", table.kantorId.asc().nullsLast().op("int8_ops")),
	foreignKey({
			columns: [table.anakId],
			foreignColumns: [ajisAnak.id],
			name: "penilaian_anak_anak_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.kantorId],
			foreignColumns: [ajisKantor.id],
			name: "penilaian_anak_kantor_id_fkey"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.wilayahPembinaanId],
			foreignColumns: [ajisWilayahPembinaan.id],
			name: "penilaian_anak_wilayah_pembinaan_id_fkey"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.semesterId],
			foreignColumns: [ajisSemester.id],
			name: "penilaian_anak_semester_id_fkey"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.itemPenilaianId],
			foreignColumns: [itemPenilaian.id],
			name: "penilaian_anak_item_penilaian_id_fkey"
		}).onDelete("set null"),
	unique("penilaian_anak_anak_id_semester_id_aspek_key").on(table.anakId, table.semesterId, table.aspek),
]);

export const materiPembinaan = pgTable("materi_pembinaan", {
	id: bigserial({ mode: "bigint" }).primaryKey().notNull(),
	kodeLama: integer("kode_lama"),
	detailIdLama: varchar("detail_id_lama", { length: 50 }),
	materi: text().notNull(),
	tanggal: date(),
	jenjang: varchar({ length: 50 }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	semesterId: bigint("semester_id", { mode: "number" }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	kantorId: bigint("kantor_id", { mode: "number" }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	wilayahPembinaanId: bigint("wilayah_pembinaan_id", { mode: "number" }),
}, (table) => [
	index("idx_materi_semester").using("btree", table.semesterId.asc().nullsLast().op("int8_ops")),
	index("idx_materi_wilayah").using("btree", table.wilayahPembinaanId.asc().nullsLast().op("int8_ops")),
	foreignKey({
			columns: [table.semesterId],
			foreignColumns: [ajisSemester.id],
			name: "materi_pembinaan_semester_id_fkey"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.kantorId],
			foreignColumns: [ajisKantor.id],
			name: "materi_pembinaan_kantor_id_fkey"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.wilayahPembinaanId],
			foreignColumns: [ajisWilayahPembinaan.id],
			name: "materi_pembinaan_wilayah_pembinaan_id_fkey"
		}).onDelete("set null"),
	unique("materi_pembinaan_kode_lama_key").on(table.kodeLama),
]);

export const laporanSemester = pgTable("laporan_semester", {
	id: bigserial({ mode: "bigint" }).primaryKey().notNull(),
	kodeLama: varchar("kode_lama", { length: 50 }).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	donaturId: bigint("donatur_id", { mode: "number" }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	anakId: bigint("anak_id", { mode: "number" }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	pemasanganId: bigint("pemasangan_id", { mode: "number" }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	kantorId: bigint("kantor_id", { mode: "number" }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	wilayahPembinaanId: bigint("wilayah_pembinaan_id", { mode: "number" }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	semesterId: bigint("semester_id", { mode: "number" }),
	kodeProgramLama: integer("kode_program_lama"),
	jenis: varchar({ length: 10 }),
	tahun: smallint(),
	formatId: smallint("format_id"),
	aktif: varchar({ length: 1 }).default('y').notNull(),
	kodeNaikJenjang: varchar("kode_naik_jenjang", { length: 100 }),
	pmNamaLengkap: text("pm_nama_lengkap"),
	pmJnsKel: varchar("pm_jns_kel", { length: 1 }),
	pmTempatLahir: varchar("pm_tempat_lahir", { length: 100 }),
	pmTglLahir: date("pm_tgl_lahir"),
	pmAnakKe: smallint("pm_anak_ke"),
	pmSaudara: smallint("pm_saudara"),
	pmNamaOrangTua: text("pm_nama_orang_tua"),
	pmPekerjaan: text("pm_pekerjaan"),
	pmSekolahNama: text("pm_sekolah_nama"),
	pmSekolahAlamat: text("pm_sekolah_alamat"),
	pmKelas: varchar("pm_kelas", { length: 5 }),
	pmJenjang: varchar("pm_jenjang", { length: 5 }),
	pmMhsInstitusi: varchar("pm_mhs_institusi", { length: 100 }),
	pmMhsProdi: varchar("pm_mhs_prodi", { length: 100 }),
	pmMhsSemester: smallint("pm_mhs_semester"),
	pmMhsJurusan: varchar("pm_mhs_jurusan", { length: 100 }),
	pembinaanWilayah: text("pembinaan_wilayah"),
	pembinaanAlamat: text("pembinaan_alamat"),
	pembinaanJmlAnak: smallint("pembinaan_jml_anak"),
	pembinaanJenjang: varchar("pembinaan_jenjang", { length: 5 }),
	pembinaanPerkembangan: text("pembinaan_perkembangan"),
	pembinaanPrestasi: text("pembinaan_prestasi"),
	danaSaldoAwal: numeric("dana_saldo_awal", { precision: 18, scale:  2 }),
	danaPenerimaan: numeric("dana_penerimaan", { precision: 18, scale:  2 }),
	danaPenyaluran: numeric("dana_penyaluran", { precision: 18, scale:  2 }),
	tglUpdateKeuangan: timestamp("tgl_update_keuangan", { mode: 'string' }),
	wajibMateri: integer("wajib_materi"),
	jmlMateri: integer("jml_materi"),
	jmlMateriTampil: integer("jml_materi_tampil"),
	tglPenyaluranText: text("tgl_penyaluran_text"),
	tglPembinaanText: text("tgl_pembinaan_text"),
	jmlPrestasi: integer("jml_prestasi"),
	wajibMateriBulan: integer("wajib_materi_bulan"),
	jmlMateriTampilBulan: integer("jml_materi_tampil_bulan"),
	tglPenyaluranBulanText: text("tgl_penyaluran_bulan_text"),
	tglPembinaanBulanText: text("tgl_pembinaan_bulan_text"),
	fotoUrl: text("foto_url"),
	fotoStatus: varchar("foto_status", { length: 1 }),
	fotoKeterangan: varchar("foto_keterangan", { length: 225 }),
	fotoPembinaanUrl: text("foto_pembinaan_url"),
	fotoPembinaanStatus: varchar("foto_pembinaan_status", { length: 1 }),
	fotoPembinaanKeterangan: varchar("foto_pembinaan_keterangan", { length: 225 }),
	sshUrl: text("ssh_url"),
	sshStatus: varchar("ssh_status", { length: 1 }),
	sshKeterangan: varchar("ssh_keterangan", { length: 225 }),
	raportCeriaUrl: text("raport_ceria_url"),
	raportCeriaStatus: varchar("raport_ceria_status", { length: 1 }),
	raportCeriaKeterangan: varchar("raport_ceria_keterangan", { length: 225 }),
	raport1Url: text("raport_1_url"),
	raport1Status: varchar("raport_1_status", { length: 1 }),
	raport1Keterangan: varchar("raport_1_keterangan", { length: 225 }),
	raport2Url: text("raport_2_url"),
	raport2Status: varchar("raport_2_status", { length: 1 }),
	raport2Keterangan: varchar("raport_2_keterangan", { length: 225 }),
	materiStatus: varchar("materi_status", { length: 1 }),
	materiKeterangan: text("materi_keterangan"),
	perkembanganSiswaStatus: varchar("perkembangan_siswa_status", { length: 1 }),
	perkembanganSiswaKeterangan: varchar("perkembangan_siswa_keterangan", { length: 225 }),
	statusTerbuat: boolean("status_terbuat").default(false).notNull(),
	tglStatusTerbuat: date("tgl_status_terbuat"),
	statusTerkirimFundraising: boolean("status_terkirim_fundraising").default(false).notNull(),
	tglStatusTerkirimFundraising: date("tgl_status_terkirim_fundraising"),
	statusTerkirimDonatur: boolean("status_terkirim_donatur").default(false).notNull(),
	tglStatusTerkirimDonatur: date("tgl_status_terkirim_donatur"),
	hasilQc: varchar("hasil_qc", { length: 25 }),
	keterangan: text(),
	jenisLaporan: varchar("jenis_laporan", { length: 50 }),
	suaraAnakJuara: text("suara_anak_juara"),
	catatanPembinaan: text("catatan_pembinaan"),
	uploadGdrive: varchar("upload_gdrive", { length: 50 }),
	externalRef: jsonb("external_ref"),
	tglInsert: timestamp("tgl_insert", { mode: 'string' }),
	userInsert: varchar("user_insert", { length: 50 }),
}, (table) => [
	index("idx_laporan_semester_anak").using("btree", table.anakId.asc().nullsLast().op("int8_ops")),
	index("idx_laporan_semester_donatur").using("btree", table.donaturId.asc().nullsLast().op("int8_ops")),
	index("idx_laporan_semester_periode").using("btree", table.semesterId.asc().nullsLast().op("int2_ops"), table.formatId.asc().nullsLast().op("int8_ops")),
	index("idx_laporan_semester_wilayah").using("btree", table.wilayahPembinaanId.asc().nullsLast().op("int8_ops"), table.kantorId.asc().nullsLast().op("int8_ops")),
	foreignKey({
			columns: [table.donaturId],
			foreignColumns: [donatur.id],
			name: "laporan_semester_donatur_id_fkey"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.anakId],
			foreignColumns: [ajisAnak.id],
			name: "laporan_semester_anak_id_fkey"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.pemasanganId],
			foreignColumns: [pemasangan.id],
			name: "laporan_semester_pemasangan_id_fkey"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.kantorId],
			foreignColumns: [ajisKantor.id],
			name: "laporan_semester_kantor_id_fkey"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.wilayahPembinaanId],
			foreignColumns: [ajisWilayahPembinaan.id],
			name: "laporan_semester_wilayah_pembinaan_id_fkey"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.semesterId],
			foreignColumns: [ajisSemester.id],
			name: "laporan_semester_semester_id_fkey"
		}).onDelete("set null"),
	unique("laporan_semester_kode_lama_key").on(table.kodeLama),
	check("ck_laporan_aktif", sql`(aktif)::text = ANY ((ARRAY['y'::character varying, 'n'::character varying])::text[])`),
]);

export const peminjamanAjisAnak = pgTable("peminjaman_ajis_anak", {
	id: bigserial({ mode: "bigint" }).primaryKey().notNull(),
	kodeLama: integer("kode_lama"),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	anakId: bigint("anak_id", { mode: "number" }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	wilayahPembinaanId: bigint("wilayah_pembinaan_id", { mode: "number" }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	kantorId: bigint("kantor_id", { mode: "number" }),
	namaPeminjam: text("nama_peminjam"),
	peminjamKode: varchar("peminjam_kode", { length: 16 }),
	tglAwalPeminjaman: date("tgl_awal_peminjaman"),
	tglSelesaiPeminjaman: date("tgl_selesai_peminjaman"),
	tglExpired: date("tgl_expired"),
	statusPinjam: varchar("status_pinjam", { length: 1 }).default('n').notNull(),
	statusTerpasangkan: varchar("status_terpasangkan", { length: 1 }).default('n').notNull(),
	cancel: varchar({ length: 1 }).default('n').notNull(),
	alasanCancel: text("alasan_cancel"),
	foto: text(),
	userInsert: varchar("user_insert", { length: 30 }),
	dateInsert: date("date_insert"),
}, (table) => [
	index("idx_peminjaman_anak").using("btree", table.anakId.asc().nullsLast().op("int8_ops")),
	index("idx_peminjaman_status").using("btree", table.kantorId.asc().nullsLast().op("int8_ops"), table.wilayahPembinaanId.asc().nullsLast().op("int8_ops"), table.statusPinjam.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.anakId],
			foreignColumns: [ajisAnak.id],
			name: "peminjaman_ajis_anak_anak_id_fkey"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.wilayahPembinaanId],
			foreignColumns: [ajisWilayahPembinaan.id],
			name: "peminjaman_ajis_anak_wilayah_pembinaan_id_fkey"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.kantorId],
			foreignColumns: [ajisKantor.id],
			name: "peminjaman_ajis_anak_kantor_id_fkey"
		}).onDelete("set null"),
	unique("peminjaman_ajis_anak_kode_lama_key").on(table.kodeLama),
	check("ck_peminjaman_status", sql`(status_pinjam)::text = ANY ((ARRAY['y'::character varying, 'n'::character varying])::text[])`),
	check("ck_peminjaman_pasang", sql`(status_terpasangkan)::text = ANY ((ARRAY['y'::character varying, 'n'::character varying])::text[])`),
	check("ck_peminjaman_cancel", sql`(cancel)::text = ANY ((ARRAY['y'::character varying, 'n'::character varying])::text[])`),
]);

export const laporanSemesterPembinaan = pgTable("laporan_semester_pembinaan", {
	id: bigserial({ mode: "bigint" }).primaryKey().notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	laporanSemesterId: bigint("laporan_semester_id", { mode: "number" }).notNull(),
	detailIdLama: smallint("detail_id_lama"),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	anakId: bigint("anak_id", { mode: "number" }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	semesterId: bigint("semester_id", { mode: "number" }),
	tanggal: date(),
	materi: varchar({ length: 200 }),
	aktif: varchar({ length: 1 }).default('y').notNull(),
	userInsert: varchar("user_insert", { length: 50 }),
	dateInsert: date("date_insert"),
}, (table) => [
	index("idx_laporan_semester_pembinaan_anak").using("btree", table.anakId.asc().nullsLast().op("int8_ops")),
	foreignKey({
			columns: [table.laporanSemesterId],
			foreignColumns: [laporanSemester.id],
			name: "laporan_semester_pembinaan_laporan_semester_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.anakId],
			foreignColumns: [ajisAnak.id],
			name: "laporan_semester_pembinaan_anak_id_fkey"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.semesterId],
			foreignColumns: [ajisSemester.id],
			name: "laporan_semester_pembinaan_semester_id_fkey"
		}).onDelete("set null"),
	unique("laporan_semester_pembinaan_laporan_semester_id_detail_id_la_key").on(table.laporanSemesterId, table.detailIdLama),
	check("ck_laporan_pembinaan_aktif", sql`(aktif)::text = ANY ((ARRAY['y'::character varying, 'n'::character varying])::text[])`),
]);

export const laporanPrestasi = pgTable("laporan_prestasi", {
	id: bigserial({ mode: "bigint" }).primaryKey().notNull(),
	kodeLama: integer("kode_lama"),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	anakId: bigint("anak_id", { mode: "number" }).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	kantorId: bigint("kantor_id", { mode: "number" }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	wilayahPembinaanId: bigint("wilayah_pembinaan_id", { mode: "number" }),
	jenjangPendidikan: varchar("jenjang_pendidikan", { length: 50 }),
	kelas: varchar({ length: 50 }),
	event: text(),
	lokasi: text(),
	bidangPrestasi: text("bidang_prestasi"),
	skala: text(),
	prestasi: text(),
	linkPublikasi: text("link_publikasi"),
	waktuAwal: date("waktu_awal"),
	waktuAkhir: date("waktu_akhir"),
	aktif: varchar({ length: 1 }).default('y').notNull(),
	userInsert: varchar("user_insert", { length: 50 }),
	dateInsert: date("date_insert"),
}, (table) => [
	index("idx_laporan_prestasi_anak").using("btree", table.anakId.asc().nullsLast().op("int8_ops")),
	foreignKey({
			columns: [table.anakId],
			foreignColumns: [ajisAnak.id],
			name: "laporan_prestasi_anak_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.kantorId],
			foreignColumns: [ajisKantor.id],
			name: "laporan_prestasi_kantor_id_fkey"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.wilayahPembinaanId],
			foreignColumns: [ajisWilayahPembinaan.id],
			name: "laporan_prestasi_wilayah_pembinaan_id_fkey"
		}).onDelete("set null"),
	unique("laporan_prestasi_kode_lama_key").on(table.kodeLama),
	check("ck_laporan_prestasi_aktif", sql`(aktif)::text = ANY ((ARRAY['y'::character varying, 'n'::character varying])::text[])`),
]);

export const prestasiAnak = pgTable("prestasi_anak", {
	id: bigserial({ mode: "bigint" }).primaryKey().notNull(),
	kodeLama: integer("kode_lama"),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	anakId: bigint("anak_id", { mode: "number" }).notNull(),
	eventLomba: varchar("event_lomba", { length: 50 }),
	tgl: date(),
	lokasi: varchar({ length: 50 }),
	skalaPrestasiTingkat: varchar("skala_prestasi_tingkat", { length: 30 }),
	capaianPrestasi: varchar("capaian_prestasi", { length: 50 }),
	jenisBidang: varchar("jenis_bidang", { length: 30 }),
	publikasiMedia: varchar("publikasi_media", { length: 50 }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	semesterId: bigint("semester_id", { mode: "number" }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	laporanSemesterId: bigint("laporan_semester_id", { mode: "number" }),
	bulan: smallint(),
	tahun: smallint(),
	tampil: boolean().default(true).notNull(),
}, (table) => [
	index("idx_prestasi_anak_anak").using("btree", table.anakId.asc().nullsLast().op("int8_ops")),
	foreignKey({
			columns: [table.anakId],
			foreignColumns: [ajisAnak.id],
			name: "prestasi_anak_anak_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.semesterId],
			foreignColumns: [ajisSemester.id],
			name: "prestasi_anak_semester_id_fkey"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.laporanSemesterId],
			foreignColumns: [laporanSemester.id],
			name: "prestasi_anak_laporan_semester_id_fkey"
		}).onDelete("set null"),
	unique("prestasi_anak_kode_lama_key").on(table.kodeLama),
]);

export const appConfig = pgTable("app_config", {
	kunci: varchar({ length: 50 }).primaryKey().notNull(),
	nilai: text().notNull(),
	keterangan: varchar({ length: 200 }),
});

export const kantorLegacyArchive = pgTable("kantor_legacy_archive", {
	id: bigserial({ mode: "bigint" }).primaryKey().notNull(),
	kodeLama: varchar("kode_lama", { length: 6 }),
	nama: varchar({ length: 150 }),
	alamat: varchar({ length: 200 }),
	parentKodeLama: varchar("parent_kode_lama", { length: 6 }),
	levelStruktur: smallint("level_struktur"),
	aktif: varchar({ length: 1 }),
	idOffice: varchar("id_office", { length: 50 }),
	idKantorIntLama: integer("id_kantor_int_lama"),
	omid: varchar({ length: 20 }),
	kodeKantorLegacy: varchar("kode_kantor_legacy", { length: 20 }),
}, (table) => [
	unique("kantor_legacy_archive_kode_lama_key").on(table.kodeLama),
]);

export const ajisUserWilayahPembinaan = pgTable("ajis_user_wilayah_pembinaan", {
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	userId: bigint("user_id", { mode: "number" }).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	wilayahPembinaanId: bigint("wilayah_pembinaan_id", { mode: "number" }).notNull(),
}, (table) => [
	index("idx_user_wilayah_wilayah").using("btree", table.wilayahPembinaanId.asc().nullsLast().op("int8_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [ajisUser.id],
			name: "ajis_user_wilayah_pembinaan_user_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.wilayahPembinaanId],
			foreignColumns: [ajisWilayahPembinaan.id],
			name: "ajis_user_wilayah_pembinaan_wilayah_pembinaan_id_fkey"
		}).onDelete("cascade"),
	primaryKey({ columns: [table.userId, table.wilayahPembinaanId], name: "ajis_user_wilayah_pembinaan_pkey"}),
]);
export const vRefWilayahLengkap = pgView("v_ref_wilayah_lengkap", {	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	desaId: bigint("desa_id", { mode: "number" }),
	kodeDesa: varchar("kode_desa", { length: 10 }),
	namaDesa: varchar("nama_desa", { length: 100 }),
	isKelurahan: boolean("is_kelurahan"),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	kecamatanId: bigint("kecamatan_id", { mode: "number" }),
	kodeKecamatan: varchar("kode_kecamatan", { length: 10 }),
	namaKecamatan: varchar("nama_kecamatan", { length: 100 }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	kabupatenId: bigint("kabupaten_id", { mode: "number" }),
	kodeKabupaten: varchar("kode_kabupaten", { length: 4 }),
	namaKabupaten: varchar("nama_kabupaten", { length: 100 }),
	isKota: boolean("is_kota"),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	propinsiId: bigint("propinsi_id", { mode: "number" }),
	kodePropinsi: varchar("kode_propinsi", { length: 4 }),
	namaPropinsi: varchar("nama_propinsi", { length: 100 }),
}).as(sql`SELECT d.id AS desa_id, d.kode AS kode_desa, d.nama AS nama_desa, d.is_kelurahan, kec.id AS kecamatan_id, kec.kode AS kode_kecamatan, kec.nama AS nama_kecamatan, kab.id AS kabupaten_id, kab.kode AS kode_kabupaten, kab.nama AS nama_kabupaten, kab.is_kota, prop.id AS propinsi_id, prop.kode AS kode_propinsi, prop.nama AS nama_propinsi FROM ref_desa d JOIN ref_kecamatan kec ON kec.id = d.kecamatan_id JOIN ref_kabupaten kab ON kab.id = kec.kabupaten_id JOIN ref_propinsi prop ON prop.id = kab.propinsi_id`);

export const ajisAuditLog = pgTable("ajis_audit_log", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  userId: bigint("user_id", { mode: "number" }).references(() => ajisUser.id, { onDelete: "set null" }),
  action: varchar("action", { length: 100 }).notNull(),
  ipAddress: varchar("ip_address", { length: 45 }),
  userAgent: text("user_agent"),
  details: jsonb("details"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});