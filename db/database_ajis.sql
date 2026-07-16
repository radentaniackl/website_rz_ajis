-- =====================================================================
-- AJIS (Anak Juara Information System) — PostgreSQL Schema
-- PERBAIKAN v2 — disesuaikan penuh dengan database_dump.sql (MySQL sipc_ijf)
-- =====================================================================
-- Scope tabel (sesuai permintaan): ajis_anak, ajis_kantor,
-- ajis_wilayah_pembinaan, ajis_user, ajis_sdm_wilayah, ajis_jabatan_sdm,
-- ajis_survey, ref_propinsi, ref_kabupaten, ref_kecamatan, ref_desa
-- (+ ajis_group_user, karena ajis_user.id_group_user FK ke situ)
--
-- Prinsip perbaikan (5 poin permintaan):
--   1. Konversi penuh MySQL -> PostgreSQL syntax
--   2. Rasionalisasi & normalisasi: semua kolom teks duplikat
--      (nama_propinsi/nama_kabupaten/nama_kecamatan/nama_desa/nama_kantor/
--      nama_wilayah yang di MySQL disimpan berulang di banyak tabel)
--      DIHAPUS, diganti FK ke ref_desa / ajis_kantor / ajis_wilayah_pembinaan.
--      ajis_sdm_wilayah + ajis_jabatan_sdm DIGABUNG (lihat bagian SDM).
--   3. Index untuk pencarian jutaan baris: GIN trigram utk nama (partial
--      match ILIKE '%...%'), composite btree utk kombinasi filter yang
--      dipakai UI, partial index utk baris aktif, BRIN utk kolom tanggal
--      di tabel besar (ajis_anak, ajis_survey).
--   4. PK 100% BIGSERIAL, TIDAK ADA UUID. Kode bisnis lama (id_anak, oid,
--      id_sdm, dst) disimpan sbg kolom UNIQUE "kode_lama_*" agar sistem
--      lama & proses migrasi tetap bisa mapping.
--   5. TIDAK ADA type ENUM Postgres. Semua eks-ENUM MySQL jadi VARCHAR
--      pendek + CHECK constraint (mempertahankan validasi tanpa memakai
--      CREATE TYPE ... AS ENUM).
-- =====================================================================

CREATE EXTENSION IF NOT EXISTS pg_trgm;   -- index pencarian nama (partial match)
CREATE EXTENSION IF NOT EXISTS btree_gin; -- untuk index gabungan trigram + kolom lain bila perlu

-- =====================================================================
-- 1. REFERENSI WILAYAH ADMINISTRATIF
-- =====================================================================
-- Catatan data lama: ref_desa MySQL punya kolom propid/kabid duplikat
-- (denormalisasi) padahal desa sudah bisa ditelusuri lewat camatid ->
-- kabupaten -> propinsi. Kolom itu DIHAPUS di sini; propinsi/kabupaten
-- didapat lewat JOIN berantai desa -> kecamatan -> kabupaten -> propinsi.
-- Juga ada inkonsistensi tipe: ref_kecamatan.camatid char(10) tapi
-- ref_desa.camatid char(7) — di Postgres disamakan VARCHAR(10).

CREATE TABLE ref_propinsi (
  id            BIGSERIAL PRIMARY KEY,
  kode          VARCHAR(4)   NOT NULL UNIQUE,      -- dulu propid
  nama          VARCHAR(100) NOT NULL,
  ibukota       VARCHAR(100),
  aktif         VARCHAR(1)   NOT NULL DEFAULT 'y',
  CONSTRAINT ck_propinsi_aktif CHECK (aktif IN ('y','n'))
);

CREATE TABLE ref_kabupaten (
  id            BIGSERIAL PRIMARY KEY,
  kode          VARCHAR(4)   NOT NULL UNIQUE,      -- dulu kabid
  propinsi_id   BIGINT       NOT NULL REFERENCES ref_propinsi(id) ON DELETE RESTRICT,
  nama          VARCHAR(100) NOT NULL,             -- dulu 'kabupaten'
  is_kota       BOOLEAN      NOT NULL DEFAULT false, -- dulu enum('0','1')
  kode_oid      VARCHAR(6),                        -- dulu 'oid'
  ibukota       VARCHAR(100),
  lat           NUMERIC(10,6),
  lng           NUMERIC(10,6),
  aktif         VARCHAR(1)   NOT NULL DEFAULT 'y',
  updated_at    TIMESTAMP,
  CONSTRAINT ck_kabupaten_aktif CHECK (aktif IN ('y','n'))
);
CREATE INDEX idx_kabupaten_propinsi ON ref_kabupaten(propinsi_id);
CREATE INDEX idx_kabupaten_nama_trgm ON ref_kabupaten USING GIN (nama gin_trgm_ops);

CREATE TABLE ref_kecamatan (
  id            BIGSERIAL PRIMARY KEY,
  kode          VARCHAR(10)  NOT NULL UNIQUE,      -- dulu camatid
  kabupaten_id  BIGINT       NOT NULL REFERENCES ref_kabupaten(id) ON DELETE RESTRICT,
  nama          VARCHAR(100) NOT NULL,             -- dulu nama_kecamatan
  kodepos       VARCHAR(10),
  aktif         VARCHAR(1)   NOT NULL DEFAULT 'y',
  updated_at    DATE,
  CONSTRAINT ck_kecamatan_aktif CHECK (aktif IN ('y','n'))
);
CREATE INDEX idx_kecamatan_kabupaten ON ref_kecamatan(kabupaten_id);
CREATE INDEX idx_kecamatan_nama_trgm ON ref_kecamatan USING GIN (nama gin_trgm_ops);

CREATE TABLE ref_desa (
  id               BIGSERIAL PRIMARY KEY,
  kode             VARCHAR(10)  NOT NULL UNIQUE,   -- dulu desaid
  kecamatan_id     BIGINT       NOT NULL REFERENCES ref_kecamatan(id) ON DELETE RESTRICT,
  nama             VARCHAR(100) NOT NULL,          -- dulu nama_desa
  is_kelurahan     BOOLEAN      NOT NULL DEFAULT false, -- dulu enum('y','n') 'kelurahan'
  nomor_induk_desa VARCHAR(50),
  aktif            VARCHAR(1)   NOT NULL DEFAULT 'y',
  CONSTRAINT ck_desa_aktif CHECK (aktif IN ('y','n'))
);
CREATE INDEX idx_desa_kecamatan ON ref_desa(kecamatan_id);
CREATE INDEX idx_desa_nama_trgm ON ref_desa USING GIN (nama gin_trgm_ops);

-- View bantu untuk laporan yang butuh nama wilayah lengkap tanpa
-- menyimpan ulang teksnya di tabel transaksi (gantinya kolom nama_propinsi
-- dkk yang dulu didenormalisasi di ajis_anak/ajis_survey/ajis_sdm_wilayah)
CREATE VIEW v_ref_wilayah_lengkap AS
SELECT
  d.id            AS desa_id,
  d.kode          AS kode_desa,
  d.nama          AS nama_desa,
  d.is_kelurahan,
  kec.id          AS kecamatan_id,
  kec.kode        AS kode_kecamatan,
  kec.nama        AS nama_kecamatan,
  kab.id          AS kabupaten_id,
  kab.kode        AS kode_kabupaten,
  kab.nama        AS nama_kabupaten,
  kab.is_kota,
  prop.id         AS propinsi_id,
  prop.kode       AS kode_propinsi,
  prop.nama       AS nama_propinsi
FROM ref_desa d
JOIN ref_kecamatan kec ON kec.id = d.kecamatan_id
JOIN ref_kabupaten kab ON kab.id = kec.kabupaten_id
JOIN ref_propinsi prop ON prop.id = kab.propinsi_id;

-- =====================================================================
-- 2. KANTOR (cabang RZ, struktur self-referencing 2 level parent)
-- =====================================================================
-- Perbaikan vs draft sebelumnya: melengkapi kolom yang sempat terlewat
-- dari MySQL -> oid_parent_second, oid_rz (daftar kode program, comma-
-- separated di data lama, tetap disimpan sbg TEXT), dan id_kantor_postgree
-- (kode kantor dari sistem lain yang sudah ada duluan, dipakai sbg
-- referensi silang oleh ajis_anak.id_kantor_postgree — disimpan sbg kode
-- bisnis, BUKAN dijadikan PK baru).

CREATE TABLE ajis_kantor (
  id                    BIGSERIAL PRIMARY KEY,
  kode                  VARCHAR(10)  NOT NULL UNIQUE,   -- dulu oid
  nama                  VARCHAR(150) NOT NULL,          -- dulu kantor
  alamat                VARCHAR(200),
  no_telp               VARCHAR(20),
  parent_id             BIGINT REFERENCES ajis_kantor(id) ON DELETE SET NULL, -- dulu oid_parent
  parent_second_id      BIGINT REFERENCES ajis_kantor(id) ON DELETE SET NULL, -- dulu oid_parent_second
  kode_program_rz       TEXT,                            -- dulu oid_rz (list kode program, csv)
  jenis                 VARCHAR(50),
  kode_kantor_legacy    VARCHAR(20) UNIQUE,               -- dulu id_kantor_postgree
  aktif                 VARCHAR(1)  NOT NULL DEFAULT 'y',
  created_at            TIMESTAMP   NOT NULL DEFAULT now(),
  updated_at            TIMESTAMP   NOT NULL DEFAULT now(),
  CONSTRAINT ck_kantor_aktif CHECK (aktif IN ('y','n'))
);
CREATE INDEX idx_kantor_parent        ON ajis_kantor(parent_id);
CREATE INDEX idx_kantor_parent_second ON ajis_kantor(parent_second_id);
CREATE INDEX idx_kantor_nama_trgm     ON ajis_kantor USING GIN (nama gin_trgm_ops);

-- =====================================================================
-- 3. WILAYAH PEMBINAAN
-- =====================================================================
-- Catatan data lama: banyak baris punya propid/kabid/camatid/desaid = 0
-- atau kosong (contoh nyata di dump: wilayah id 2 "Medan Sunggal..." tidak
-- ada desaid valid). Karena itu desa_id dibuat NULLABLE, jangan NOT NULL,
-- supaya migrasi tidak gagal pada baris yang memang datanya tidak lengkap.

CREATE TABLE ajis_wilayah_pembinaan (
  id                    BIGSERIAL PRIMARY KEY,
  kode_lama             INTEGER UNIQUE,                 -- dulu id_wilayah_pembinaan
  nama_wilayah          VARCHAR(150) NOT NULL UNIQUE,
  alamat_wilayah        TEXT,
  kantor_id             BIGINT REFERENCES ajis_kantor(id) ON DELETE SET NULL,
  desa_id               BIGINT REFERENCES ref_desa(id) ON DELETE SET NULL,
  status_approve        VARCHAR(1),                     -- dulu enum('y','t')
  aktif                 VARCHAR(1)  NOT NULL DEFAULT 'y',
  user_insert           VARCHAR(50),
  date_insert           DATE,
  user_update           VARCHAR(50),
  date_update           DATE,
  CONSTRAINT ck_wilayah_status_approve CHECK (status_approve IS NULL OR status_approve IN ('y','t')),
  CONSTRAINT ck_wilayah_aktif CHECK (aktif IN ('y','n'))
);
CREATE INDEX idx_wilayah_kantor      ON ajis_wilayah_pembinaan(kantor_id);
CREATE INDEX idx_wilayah_desa        ON ajis_wilayah_pembinaan(desa_id);
CREATE INDEX idx_wilayah_nama_trgm   ON ajis_wilayah_pembinaan USING GIN (nama_wilayah gin_trgm_ops);
CREATE INDEX idx_wilayah_aktif       ON ajis_wilayah_pembinaan(aktif) WHERE aktif = 'y';

-- =====================================================================
-- 4. USER & GROUP USER (auth)
-- =====================================================================

CREATE TABLE ajis_group_user (
  id            BIGSERIAL PRIMARY KEY,
  nama          VARCHAR(50)  NOT NULL,           -- dulu group_user
  keterangan    VARCHAR(150),
  aktif         VARCHAR(1)   NOT NULL DEFAULT 'y',
  CONSTRAINT ck_group_user_aktif CHECK (aktif IN ('y','n'))
);

-- PENTING: kolom `username` di MySQL lama bertipe TEXT tanpa UNIQUE KEY
-- sama sekali — artinya kemungkinan ada duplikat di data produksi.
-- UNIQUE di bawah ini WAJIB dicek & dedup dulu saat migrasi data
-- (lihat 04_DATA_MIGRATION_GUIDE.md), baru constraint ini bisa aktif.
-- Password lama MD5 (contoh: '44ec292ceee21f916dc93286e458fa6d') —
-- WAJIB rehash ke bcrypt/argon2 + force reset saat migrasi, jangan
-- dipertahankan apa adanya.

CREATE TABLE ajis_user (
  id                    BIGSERIAL PRIMARY KEY,
  kode_lama             INTEGER UNIQUE,                  -- dulu id_user
  username              VARCHAR(100) NOT NULL UNIQUE,
  password_hash         VARCHAR(255) NOT NULL,           -- rehash bcrypt/argon2 saat migrasi
  must_reset_password   BOOLEAN NOT NULL DEFAULT true,    -- flag paksa ganti password pasca migrasi
  nik                   VARCHAR(20),
  kantor_id             BIGINT REFERENCES ajis_kantor(id) ON DELETE SET NULL,
  group_user_id         BIGINT REFERENCES ajis_group_user(id) ON DELETE SET NULL,
  aktif                 VARCHAR(1) NOT NULL DEFAULT 'y',
  user_insert           VARCHAR(50),
  date_insert           TIMESTAMP,
  CONSTRAINT ck_user_aktif CHECK (aktif IN ('y','n'))
);
CREATE INDEX idx_user_kantor  ON ajis_user(kantor_id);
CREATE INDEX idx_user_group   ON ajis_user(group_user_id);

-- id_wilayah_pembinaan di ajis_user MySQL bertipe VARCHAR(50) (bukan int),
-- indikasi kuat kolom ini dulu memuat MULTI-VALUE (beberapa id dipisah
-- koma) — pola yang sama seperti ajis_kantor.oid_rz. Karena itu TIDAK
-- dibuat 1 kolom FK tunggal (akan hilang data kalau user aslinya punya
-- akses ke >1 wilayah), tapi tabel jembatan many-to-many:
CREATE TABLE ajis_user_wilayah_pembinaan (
  user_id               BIGINT NOT NULL REFERENCES ajis_user(id) ON DELETE CASCADE,
  wilayah_pembinaan_id  BIGINT NOT NULL REFERENCES ajis_wilayah_pembinaan(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, wilayah_pembinaan_id)
);
CREATE INDEX idx_user_wilayah_wilayah ON ajis_user_wilayah_pembinaan(wilayah_pembinaan_id);
-- Saat migrasi: split id_wilayah_pembinaan lama per-koma, insert 1 baris
-- per nilai. Kalau ternyata di data produksi kolom ini SELALU 1 nilai,
-- tabel ini tetap aman dipakai (tinggal 1 baris per user), tidak rugi.

-- =====================================================================
-- 5. SDM WILAYAH — HASIL MERGE ajis_sdm_wilayah + ajis_jabatan_sdm
-- =====================================================================
-- Kenapa digabung, dan bagaimana caranya:
-- ajis_jabatan_sdm lama = "penugasan" 1 SDM ke 1 kantor/wilayah/fungsi.
-- Awalnya diasumsikan 1 SDM = 1 penugasan aktif, tapi data contoh di
-- dump membuktikan sebaliknya: id_sdm='6' punya 2 baris jabatan berbeda
-- (id_jabatan_sdm 1521 & 1522, kantor sama 09-218). Artinya relasinya
-- 1-ke-banyak, bukan 1-ke-1. Solusi yang benar (bukan sekadar comment
-- seperti draft sebelumnya):
--   a) ajis_sdm_wilayah  = identitas SDM + PENUGASAN TERKINI (current),
--      supaya query "SDM aktif di kantor X" tetap 1 JOIN saja (cepat).
--   b) ajis_sdm_wilayah_riwayat = seluruh riwayat penugasan (termasuk
--      yang sekarang), 1 baris = 1 record ajis_jabatan_sdm lama.
-- Ini yang dimaksud "rasionalisasi" — bukan menghapus data jabatan,
-- tapi memisahkan "state saat ini" (cepat dibaca) dari "histori"
-- (lengkap, jarang diakses, tidak membebani query harian).

CREATE TABLE ajis_sdm_wilayah (
  id                        BIGSERIAL PRIMARY KEY,
  kode_lama                 INTEGER UNIQUE,               -- dulu id_sdm
  nik                       VARCHAR(20) UNIQUE,
  nama_lengkap              VARCHAR(100) NOT NULL,
  jenis_kelamin             VARCHAR(1),                    -- dulu enum('l','p')
  alamat                    VARCHAR(200),
  desa_id                   BIGINT REFERENCES ref_desa(id) ON DELETE SET NULL,
  jenjang_pendidikan        VARCHAR(10),
  tgl_bergabung             DATE,
  tgl_keluar                DATE,
  telp                      VARCHAR(20),
  hp                        VARCHAR(20),
  email                     VARCHAR(100),
  keterangan                VARCHAR(200),
  keaktifan_edukasi         VARCHAR(1),                    -- dulu enum('y','t') level-orang
  foto                      VARCHAR(200),
  aktif                     VARCHAR(10) NOT NULL DEFAULT 'y',

  -- kolom hasil merge: PENUGASAN TERKINI dari ajis_jabatan_sdm
  penugasan_wilayah_id      BIGINT REFERENCES ajis_wilayah_pembinaan(id) ON DELETE SET NULL,
  penugasan_kantor_id       BIGINT REFERENCES ajis_kantor(id) ON DELETE SET NULL,
  penugasan_fungsi_struktur VARCHAR(16),                   -- dulu id_fungsi_struktur (tabel ref-nya
                                                             -- tidak ada di dump/excluded, disimpan
                                                             -- sbg kode, bukan FK)
  penugasan_keaktifan_edukasi VARCHAR(1),                  -- dulu keaktifan_edukasi level-jabatan

  user_insert               VARCHAR(30),
  date_insert               DATE,
  user_update                VARCHAR(30),
  date_update                DATE,
  CONSTRAINT ck_sdm_jk CHECK (jenis_kelamin IS NULL OR jenis_kelamin IN ('l','p')),
  CONSTRAINT ck_sdm_keaktifan CHECK (keaktifan_edukasi IS NULL OR keaktifan_edukasi IN ('y','t')),
  CONSTRAINT ck_sdm_keaktifan_jabatan CHECK (penugasan_keaktifan_edukasi IS NULL OR penugasan_keaktifan_edukasi IN ('y','t'))
);
CREATE INDEX idx_sdm_wilayah_penugasan_wilayah ON ajis_sdm_wilayah(penugasan_wilayah_id);
CREATE INDEX idx_sdm_wilayah_penugasan_kantor  ON ajis_sdm_wilayah(penugasan_kantor_id);
CREATE INDEX idx_sdm_wilayah_nama_trgm         ON ajis_sdm_wilayah USING GIN (nama_lengkap gin_trgm_ops);
CREATE INDEX idx_sdm_wilayah_aktif             ON ajis_sdm_wilayah(aktif) WHERE aktif = 'y';

CREATE TABLE ajis_sdm_wilayah_riwayat (
  id                     BIGSERIAL PRIMARY KEY,
  kode_lama              INTEGER UNIQUE,                  -- dulu id_jabatan_sdm
  sdm_wilayah_id         BIGINT NOT NULL REFERENCES ajis_sdm_wilayah(id) ON DELETE CASCADE,
  wilayah_pembinaan_id   BIGINT REFERENCES ajis_wilayah_pembinaan(id) ON DELETE SET NULL,
  kantor_id              BIGINT REFERENCES ajis_kantor(id) ON DELETE SET NULL,
  fungsi_struktur        VARCHAR(16),
  keaktifan_edukasi      VARCHAR(1),
  is_current             BOOLEAN NOT NULL DEFAULT false,   -- true utk baris yg jadi "penugasan terkini"
  user_insert            VARCHAR(30),
  date_insert            DATE,
  user_update            VARCHAR(30),
  date_update            DATE,
  CONSTRAINT ck_riwayat_keaktifan CHECK (keaktifan_edukasi IS NULL OR keaktifan_edukasi IN ('y','t'))
);
CREATE INDEX idx_sdm_riwayat_sdm     ON ajis_sdm_wilayah_riwayat(sdm_wilayah_id);
CREATE INDEX idx_sdm_riwayat_wilayah ON ajis_sdm_wilayah_riwayat(wilayah_pembinaan_id);
CREATE INDEX idx_sdm_riwayat_kantor  ON ajis_sdm_wilayah_riwayat(kantor_id);

-- =====================================================================
-- 6. ANAK (data anak binaan) — 118 kolom MySQL dilengkapi semua,
--    kolom teks alamat administratif dinormalisasi jadi FK ref_desa.
-- =====================================================================

CREATE TABLE ajis_anak (
  id                        BIGSERIAL PRIMARY KEY,
  kode_anak                 VARCHAR(25)  NOT NULL UNIQUE,  -- dulu id_anak (PK lama)
  nik                       VARCHAR(50)  NOT NULL UNIQUE,
  nama_lengkap              TEXT NOT NULL,
  nama_panggilan            VARCHAR(50),
  agama                     VARCHAR(50),
  jns_kel                   VARCHAR(1)   NOT NULL,          -- dulu enum('l','p')
  tempat_lahir              VARCHAR(50),
  tgl_lahir                 DATE NOT NULL,
  anak_ke                   SMALLINT,
  dari_saudara               SMALLINT,
  alamat                    VARCHAR(150),
  desa_id                   BIGINT REFERENCES ref_desa(id) ON DELETE SET NULL,

  jenjang_pendidikan        VARCHAR(10),
  kelas                     VARCHAR(50),
  nama_sekolah               TEXT,
  alamat_sekolah             TEXT,
  jurusan                   VARCHAR(50),
  semester                  SMALLINT,
  nama_pt                   TEXT,
  alamat_pt                  TEXT,

  no_rekening                VARCHAR(30),
  pemilik_rekening           VARCHAR(50),
  nama_bank                  VARCHAR(50),
  foto                       TEXT,

  nilai                      VARCHAR(50),
  pelajaran_favorit          VARCHAR(50),
  jarak_rumah                VARCHAR(50),
  alat_transportasi          VARCHAR(50),
  hobi                       TEXT,
  prestasi                   TEXT,
  no_kartu_keluarga          VARCHAR(30),
  asnaf                      VARCHAR(50),
  status_ortu                VARCHAR(50),

  status_survey               VARCHAR(1) NOT NULL DEFAULT 'n',  -- dulu enum('y','n')
  status_kelayakan            VARCHAR(1) NOT NULL DEFAULT 'n',
  status_anak_juara           VARCHAR(3),
  status_tersantuni           VARCHAR(2),                       -- dulu enum('su','b','se','t')
  status_pinjam               VARCHAR(1) NOT NULL DEFAULT 'n',
  status_mentor                VARCHAR(1) NOT NULL DEFAULT 'n',
  aktif                       VARCHAR(1) NOT NULL DEFAULT 'y',
  alumni_juara                 VARCHAR(1),                       -- dulu enum('','y','n')
  juara                        VARCHAR(10),

  wilayah_pembinaan_id         BIGINT REFERENCES ajis_wilayah_pembinaan(id) ON DELETE SET NULL,
  kantor_id                    BIGINT REFERENCES ajis_kantor(id) ON DELETE SET NULL,
  sdm_wilayah_id                BIGINT REFERENCES ajis_sdm_wilayah(id) ON DELETE SET NULL, -- dulu id_sdm (mentor)
  nama_mentor_manual            VARCHAR(100), -- dulu nama_mentor (teks bebas, kadang beda dgn sdm_wilayah_id;
                                                -- disimpan sbg fallback, prioritas baca tetap lewat JOIN sdm_wilayah_id)

  tgl_terdaftar                 DATE,
  tgl_pengajuan                 DATE,

  -- data ayah
  nama_lengkap_ayah              VARCHAR(100),
  alamat_ayah                    VARCHAR(150),
  desa_ayah_id                   BIGINT REFERENCES ref_desa(id) ON DELETE SET NULL,
  pekerjaan_ayah                  TEXT,
  penghasilan_ayah                NUMERIC(14,2),
  tgl_kematian_ayah                DATE,
  penyebab_kematian_ayah           VARCHAR(150),

  -- data ibu
  nama_lengkap_ibu                 VARCHAR(100),
  alamat_ibu                       VARCHAR(150),
  desa_ibu_id                      BIGINT REFERENCES ref_desa(id) ON DELETE SET NULL,
  pekerjaan_ibu                     TEXT,
  penghasilan_ibu                   NUMERIC(14,2),
  tgl_kematian_ibu                  DATE,
  penyebab_kematian_ibu              VARCHAR(150),

  -- data wali
  nama_lengkap_wali                  VARCHAR(100),
  alamat_wali                        VARCHAR(150),
  desa_wali_id                       BIGINT REFERENCES ref_desa(id) ON DELETE SET NULL,
  pekerjaan_wali                      TEXT,
  penghasilan_wali                    NUMERIC(14,2),

  telp_dihubungi                      VARCHAR(20),
  atas_nama                           VARCHAR(50),
  hubungan_kerabat                    VARCHAR(30),

  via_input                           VARCHAR(100),
  approval_ijf                        VARCHAR(50),
  kode_program_rz                     TEXT,                 -- dulu oid_rz (csv kode program)

  -- program peminjaman (RFO)
  nia_rfo_book                        VARCHAR(50),
  nama_rfo_book                       VARCHAR(100),
  tgl_peminjaman                      DATE,
  tgl_expired                         DATE,
  book_via                            VARCHAR(50),
  user_book                           VARCHAR(50),

  tinggal_bersama                     TEXT,
  nama_tinggal                        TEXT,
  ket_tinggal                         TEXT,
  penghasilan_tinggal                 TEXT,
  pekerjaan_tinggal                   TEXT,
  tidak_serumah_ortu                  VARCHAR(50),

  kode_kantor_legacy                  VARCHAR(10),          -- dulu id_kantor_postgree
  kode_ijgs_anak                      VARCHAR(50),           -- dulu id_ijgs_anak (id sistem eksternal)
  upload_gdrive                       VARCHAR(50),

  created_at                          TIMESTAMP NOT NULL DEFAULT now(),
  updated_at                          TIMESTAMP NOT NULL DEFAULT now(),

  CONSTRAINT ck_anak_jns_kel        CHECK (jns_kel IN ('l','p')),
  CONSTRAINT ck_anak_status_survey  CHECK (status_survey IN ('y','n')),
  CONSTRAINT ck_anak_status_layak   CHECK (status_kelayakan IN ('y','n')),
  CONSTRAINT ck_anak_status_pinjam  CHECK (status_pinjam IN ('y','n')),
  CONSTRAINT ck_anak_status_mentor  CHECK (status_mentor IN ('y','n')),
  CONSTRAINT ck_anak_aktif          CHECK (aktif IN ('y','n')),
  -- status_tersantuni: enum MySQL asli TIDAK mengizinkan '', tapi data produksi nyatanya
  -- banyak berisi '' (MySQL diam-diam menyimpan '' utk nilai enum invalid yg di-insert).
  -- '' diizinkan di sini supaya migrasi data lama tidak gagal; baca notes di bawah file.
  CONSTRAINT ck_anak_tersantuni     CHECK (status_tersantuni IS NULL OR status_tersantuni IN ('su','b','se','t','')),
  -- alumni_juara: MySQL enum('','y','n') MEMANG resmi mengizinkan '' sbg salah satu nilainya.
  CONSTRAINT ck_anak_alumni_juara   CHECK (alumni_juara IS NULL OR alumni_juara IN ('','y','n'))
);

CREATE INDEX idx_anak_wilayah    ON ajis_anak(wilayah_pembinaan_id);
CREATE INDEX idx_anak_kantor     ON ajis_anak(kantor_id);
CREATE INDEX idx_anak_sdm        ON ajis_anak(sdm_wilayah_id);
CREATE INDEX idx_anak_desa       ON ajis_anak(desa_id);
CREATE INDEX idx_anak_desa_ayah  ON ajis_anak(desa_ayah_id);
CREATE INDEX idx_anak_desa_ibu   ON ajis_anak(desa_ibu_id);
CREATE INDEX idx_anak_desa_wali  ON ajis_anak(desa_wali_id);
CREATE INDEX idx_anak_status     ON ajis_anak(aktif, status_tersantuni, jenjang_pendidikan);
CREATE INDEX idx_anak_nama_trgm  ON ajis_anak USING GIN (nama_lengkap gin_trgm_ops);
CREATE INDEX idx_anak_nik_trgm   ON ajis_anak USING GIN (nik gin_trgm_ops);
-- Kombinasi filter yang paling sering dipakai UI: wilayah + kantor + status aktif
CREATE INDEX idx_anak_filter_combo ON ajis_anak(wilayah_pembinaan_id, kantor_id, aktif);
-- Baris aktif jauh lebih sering dibaca daripada nonaktif -> partial index lebih ramping
CREATE INDEX idx_anak_aktif_only  ON ajis_anak(kantor_id, wilayah_pembinaan_id) WHERE aktif = 'y';
-- BRIN cocok utk kolom tanggal yang terurut dgn waktu insert, jauh lebih kecil dari btree di tabel jutaan baris
CREATE INDEX idx_anak_tgl_lahir_brin     ON ajis_anak USING BRIN (tgl_lahir);
CREATE INDEX idx_anak_tgl_terdaftar_brin ON ajis_anak USING BRIN (tgl_terdaftar);

-- =====================================================================
-- 7. SURVEY (asesmen kelayakan anak)
-- =====================================================================
-- Catatan data lama: PK MySQL komposit (id_survey, id_anak) dan ada
-- baris duplikat persis (contoh nyata di dump: id_survey 99-102 untuk
-- id_anak yang sama, isi identik). Di Postgres id_survey dibuat PK
-- tunggal (kode_lama UNIQUE), duplikasi murni dibuang saat migrasi
-- (lihat 04_DATA_MIGRATION_GUIDE.md — strategi: keep baris dgn
-- kode_lama terbesar per anak_id+tgl_survey, sisanya diarsipkan bukan
-- dihapus permanen).

CREATE TABLE ajis_survey (
  id                        BIGSERIAL PRIMARY KEY,
  kode_lama                 INTEGER UNIQUE,             -- dulu id_survey
  anak_id                    BIGINT NOT NULL REFERENCES ajis_anak(id) ON DELETE CASCADE,
  tgl_survey                 DATE,
  petugas_survey              VARCHAR(50),
  kantor_id                   BIGINT REFERENCES ajis_kantor(id) ON DELETE SET NULL,
  wilayah_pembinaan_id         BIGINT REFERENCES ajis_wilayah_pembinaan(id) ON DELETE SET NULL,

  asnaf                        VARCHAR(50),
  alamat                       TEXT,
  jns_kel                      VARCHAR(1),
  jenjang_pendidikan            VARCHAR(50),
  tgl_pengajuan                 DATE,
  status_anak                   VARCHAR(20),
  hasil_kesimpulan_survey        VARCHAR(150),

  kepemilikan_tanah                     VARCHAR(150),
  kepemilikan_rumah                     TEXT,
  kondisi_dinding_rumah                  TEXT,
  kondisi_lantai_rumah                   TEXT,
  kepemilikan_kendaraan                  TEXT,
  kepemilikan_barang_elektronik           TEXT,
  pekerjaan_kepala_keluarga                TEXT,
  rata_rata_penghasilan_perbulan            VARCHAR(150),
  kepemilikan_tabungan                      TEXT,
  makan_2x                                  VARCHAR(150),
  nama_kepala_keluarga                       TEXT,
  pendidikan_terakhir_kepala_keluarga         TEXT,
  jml_tanggungan_kepala_keluarga               SMALLINT,
  sumber_air_bersih                             TEXT,
  jamban_dan_saluran_limbah                      TEXT,
  tempat_pembuangan_sampah                        TEXT,
  terdapat_perokok                                VARCHAR(150),
  terdapat_konsumen_miras                          VARCHAR(150),
  terdapat_persediaan_obat_p3k                      VARCHAR(150),
  makan_buah_dan_sayur_tiap_hari                     VARCHAR(150),
  shalat_5_waktu                                      TEXT,
  membaca_alquran                                      TEXT,
  majelis_taklim                                        TEXT,
  membaca_koran                                          TEXT,
  aktif_sebagai_pengurus_organisasi                       TEXT,

  asnaf_anak                          VARCHAR(10) NOT NULL,            -- dulu enum('yatim','piatu','dhuafa')
  biaya_pendidikan_spp_perbulan        NUMERIC(14,2) NOT NULL DEFAULT 0,
  bantuan_rutin_dari_lembaga_lain       VARCHAR(10) NOT NULL DEFAULT 'tidak', -- dulu enum('tidak','ada')
  jml_bantuan_rutin_dari_lembaga_lain    NUMERIC(14,2),
  resume_deskriptif                       TEXT,
  kode_anak_odoo                          VARCHAR(50),                 -- dulu id_anak_odoo

  user_insert                             VARCHAR(30),
  date_insert                             DATE,
  user_update                             VARCHAR(30),
  date_update                             DATE,

  CONSTRAINT ck_survey_jns_kel     CHECK (jns_kel IS NULL OR jns_kel IN ('l','p')),
  CONSTRAINT ck_survey_asnaf_anak  CHECK (asnaf_anak IN ('yatim','piatu','dhuafa')),
  CONSTRAINT ck_survey_bantuan     CHECK (bantuan_rutin_dari_lembaga_lain IN ('tidak','ada'))
);

CREATE INDEX idx_survey_anak      ON ajis_survey(anak_id);
CREATE INDEX idx_survey_wilayah   ON ajis_survey(wilayah_pembinaan_id);
CREATE INDEX idx_survey_kantor    ON ajis_survey(kantor_id);
CREATE INDEX idx_survey_tgl_brin  ON ajis_survey USING BRIN (tgl_survey);
CREATE INDEX idx_survey_anak_tgl  ON ajis_survey(anak_id, tgl_survey DESC); -- "riwayat survey anak X, terbaru dulu"

-- =====================================================================
-- CATATAN MIGRASI PENTING
-- =====================================================================
-- 1. Semua PK bisnis lama (id_anak, oid kantor, id_sdm, id_jabatan_sdm,
--    id_wilayah_pembinaan, id_survey, id_user) disimpan sbg kolom
--    UNIQUE "kode_lama"/"kode_*" — dipakai utk mapping FK saat migrasi
--    data (resolve dulu ke id BIGSERIAL baru, baru insert), dan supaya
--    laporan/skrip lama yang masih pakai kode itu tetap bisa jalan.
-- 2. Semua kolom nama_propinsi/nama_kabupaten/nama_kecamatan/nama_desa/
--    nama_kantor/nama_wilayah yang di MySQL disimpan berulang sbg teks
--    di ajis_anak/ajis_survey/ajis_sdm_wilayah/ajis_wilayah_pembinaan
--    DIHAPUS — didapat via v_ref_wilayah_lengkap atau JOIN langsung ke
--    ref_desa/ajis_kantor/ajis_wilayah_pembinaan. Kalau laporan butuh
--    baca super cepat, buat MATERIALIZED VIEW, jangan ulangi teksnya di
--    tabel utama lagi (itu akar masalah data lama).
-- 3. Password ajis_user masih MD5 di data lama -> WAJIB force reset +
--    rehash bcrypt/argon2 saat migrasi (kolom must_reset_password sudah
--    disiapkan, default true).
-- 4. ajis_user.id_wilayah_pembinaan (varchar, indikasi multi-value) ->
--    dipecah ke ajis_user_wilayah_pembinaan saat migrasi.
-- 5. ajis_sdm_wilayah + ajis_jabatan_sdm digabung: identitas + penugasan
--    terkini di ajis_sdm_wilayah, seluruh histori penugasan (termasuk
--    kasus 1 SDM dgn >1 jabatan spt id_sdm=6 di data contoh) masuk ke
--    ajis_sdm_wilayah_riwayat.
-- 6. ajis_survey: duplikat exact-row di data lama (spt id_survey 99-102
--    utk id_anak yg sama) perlu dedup manual saat migrasi, bukan
--    dipertahankan apa adanya.
-- 6a. TANGGAL '0000-00-00': dump MySQL diset SQL_MODE = 'NO_AUTO_VALUE_ON_ZERO'
--    (bukan strict mode), sehingga banyak kolom DATE berisi literal
--    '0000-00-00' (contoh nyata: ajis_anak.tgl_peminjaman, tgl_expired
--    DEFAULT '0000-00-00'). Nilai ini TIDAK VALID di PostgreSQL —
--    WAJIB dikonversi jadi NULL saat ETL (semua kolom DATE relevan di
--    schema ini sudah dibuat NULLABLE supaya ini bisa dilakukan).
-- 6b. ENUM KOSONG: sebagian kolom enum MySQL diisi '' padahal bukan
--    anggota resmi enum-nya (mis. status_tersantuni), krn MySQL diam-
--    diam menerima nilai invalid jadi ''. CHECK constraint terkait di
--    schema ini sengaja mengizinkan '' supaya data lama tetap bisa
--    masuk; di layer aplikasi perlakukan '' setara "belum diisi".
-- 7. Tabel ajis_group_user, ref_propinsi..ref_desa harus dimigrasi PALING
--    AWAL (tier 0), disusul ajis_kantor (tier 1, self-ref), lalu
--    ajis_wilayah_pembinaan (tier 2), ajis_user & ajis_sdm_wilayah
--    (tier 3), terakhir ajis_anak & ajis_survey (tier 4) — urutan ini
--    wajib diikuti karena FK constraint akan menolak insert child
--    sebelum parent-nya ada.
-- =====================================================================

-- =====================================================================
-- AJIS — MODUL 2: DONASI, PEMBINAAN, PENILAIAN, LAPORAN
-- PostgreSQL Schema — lanjutan dari ajis_postgres_schema.sql
-- =====================================================================
-- Mencakup 25 tabel sisa dari database_dump.sql (di luar 12 tabel modul
-- inti anak/wilayah/user/sdm yang sudah dikerjakan sebelumnya):
--   program, setting_program(digabung ke program), donatur, kantor(legacy,
--   diarsipkan), ajis_pemasangan, ajis_input_donasi, ajis_penyaluran,
--   ajis_opname, ajis_view_ajuan, transaksi, ajis_semester,
--   ajis_pembinaan_baru, ajis_dokumentasi_pembinaan, ajis_hafalan,
--   ajis_item_hafalan, ajis_periode_penilaian, ajis_item_penilaian,
--   ajis_penilaian, materi, manual_laporan, manual_laporan_pembinaan,
--   manual_laporan_prestasi, ajis_data_prestasi, ajis_peminjaman_anak,
--   ajis_batas_expired_peminjaman.
--
-- PRASYARAT: file ini HARUS dijalankan SETELAH ajis_postgres_schema.sql,
-- karena semua FK di sini menunjuk ke ajis_anak, ajis_kantor,
-- ajis_wilayah_pembinaan, ajis_sdm_wilayah, ajis_user yang didefinisikan
-- di file itu.
--
-- Prinsip tambahan khusus modul ini (di luar 5 poin dasar):
--   - Kolom integrasi sistem lain yang bertebaran di banyak tabel lama
--     (id_xxx_postgree, id_xxx_erpwh, jcustid, dst — bisa belasan kolom
--     per tabel) DIRASIONALISASI jadi SATU kolom JSONB `external_ref`,
--     bukan dipertahankan sbg belasan kolom VARCHAR nullable terpisah.
--     Tidak ada data yang hilang, cuma dikonsolidasi.
--   - Kolom teks duplikat (nama_anak, nama_donatur, nama_kantor,
--     nama_wilayah, nik, alamat, dst yang sebenarnya bisa didapat dari
--     JOIN ke ajis_anak/donatur/ajis_kantor) DIHAPUS di semua tabel
--     transaksional modul ini — KECUALI di `laporan_semester`, yang
--     kolom pm_*-nya SENGAJA dipertahankan sbg snapshot titik-waktu
--     (laporan semester harus tetap tampil sama persis walau data anak
--     berubah setelahnya — itu snapshot, bukan duplikasi liar).
-- =====================================================================

-- -------------------------------------------------------------
-- 1. PROGRAM DONASI (program + setting_program digabung, setting_program
--    murni duplikat program dgn kolom tambahan jenjang_pendidikan/baru)
-- -------------------------------------------------------------

CREATE TABLE program (
  id                    BIGSERIAL PRIMARY KEY,
  kode_lama             VARCHAR(6)  UNIQUE,           -- dulu progid
  kode_program_legacy   INTEGER     UNIQUE,            -- dulu id_program (dipakai byk tabel lain sbg FK int)
  parent_id             BIGINT REFERENCES program(id) ON DELETE SET NULL, -- dulu parent_progid
  nama                  VARCHAR(100) NOT NULL,
  nama_inggris          VARCHAR(100),
  jenis_program         VARCHAR(2)  NOT NULL DEFAULT 'dn',   -- dulu enum('dn','ln')
  coa_program           VARCHAR(20),
  sifat_program         VARCHAR(2)  NOT NULL DEFAULT 'tt',   -- dulu enum('t','tt')
  keterangan            VARCHAR(100),
  jenjang_pendidikan    VARCHAR(10),                  -- dulu cuma ada di setting_program
  tgl_digulirkan        DATE,
  aktif                 VARCHAR(1)  NOT NULL DEFAULT 'y',
  tgl_inaktif           TIMESTAMP,
  kprogid               VARCHAR(2),
  status_program        VARCHAR(2)  NOT NULL DEFAULT 'nm',   -- dulu enum('m','nm')
  dana_pengelola        VARCHAR(1)  NOT NULL DEFAULT 'n',
  nama_alias            VARCHAR(30),
  pdanaid               INTEGER,
  kode_anggaran         VARCHAR(50),
  harga_program         NUMERIC(16,2),
  harga_penyaluran      NUMERIC(16,2),
  nominal_dp            NUMERIC(16,2),
  nominal_dss           NUMERIC(16,2),
  persentase_dp         NUMERIC(7,4),
  persentase_dss        NUMERIC(7,4),
  kredit_account        VARCHAR(50),
  created_at            TIMESTAMP NOT NULL DEFAULT now(),
  updated_at            TIMESTAMP NOT NULL DEFAULT now(),
  CONSTRAINT ck_program_jenis  CHECK (jenis_program IN ('dn','ln')),
  CONSTRAINT ck_program_sifat  CHECK (sifat_program IN ('t','tt')),
  CONSTRAINT ck_program_status CHECK (status_program IN ('m','nm')),
  CONSTRAINT ck_program_aktif  CHECK (aktif IN ('y','n'))
);
CREATE INDEX idx_program_parent     ON program(parent_id);
CREATE INDEX idx_program_nama_trgm  ON program USING GIN (nama gin_trgm_ops);
CREATE INDEX idx_program_aktif      ON program(aktif) WHERE aktif = 'y';
-- CATATAN: `setting_program` (MySQL) DIBUANG sbg tabel terpisah karena
-- isinya duplikat `program` + kolom jenjang_pendidikan/baru yang sudah
-- ditambahkan langsung ke `program` di atas (pola sama spt ajis_propinsi
-- yg dibuang krn duplikat ref_propinsi).

-- -------------------------------------------------------------
-- 2. DONATUR
-- -------------------------------------------------------------

CREATE TABLE donatur (
  id                        BIGSERIAL PRIMARY KEY,
  kode_lama                 VARCHAR(30) UNIQUE,        -- dulu did
  nama_lengkap               VARCHAR(100) NOT NULL,
  nama_publikasi              VARCHAR(100),
  tgl_lahir                    DATE,
  jenis_kelamin                 VARCHAR(1),              -- dulu enum('l','p','t')
  alamat_lengkap                 TEXT,
  alamat_silaturahmi               TEXT,
  kecamatan_domisili_id              BIGINT REFERENCES ref_kecamatan(id) ON DELETE SET NULL, -- dulu camatid (kabid/propid dihapus, redundan)
  kecamatan_silaturahmi_id             BIGINT REFERENCES ref_kecamatan(id) ON DELETE SET NULL, -- dulu camatid_silaturahmi
  status_donatur                        VARCHAR(10) NOT NULL, -- dulu enum 11 nilai ('d','oc','upz',...)
  tgl_registrasi                          DATE,
  aktif                                     VARCHAR(1) NOT NULL DEFAULT 'y', -- dulu enum('y','n','p')
  kirim_sms                                 VARCHAR(1) NOT NULL DEFAULT 'n',
  telp                                      VARCHAR(30),
  fax                                       VARCHAR(15),
  hp                                        VARCHAR(30),
  email                                     VARCHAR(100),
  website                                   VARCHAR(100),
  verifikasi1                               BOOLEAN NOT NULL DEFAULT false,
  verifikasi2                               BOOLEAN NOT NULL DEFAULT false,
  nama_kontak                               VARCHAR(50),
  telp_kontak                               VARCHAR(30),
  email_kontak                              VARCHAR(100),
  jabatan_kontak                            VARCHAR(50),
  nama_bank                                 VARCHAR(50),
  no_rekening                               VARCHAR(30),
  kantor_donatur_id                         BIGINT REFERENCES ajis_kantor(id) ON DELETE SET NULL, -- dulu oid_donatur
  nia_rfo                                   VARCHAR(15),
  nama_rfo                                  VARCHAR(50),
  username                                  VARCHAR(50),
  tipe_pelayanan                            VARCHAR(30),
  periode_rutinitas_transaksi               SMALLINT,
  sumber_informasi                          TEXT,
  jalur_komunikasi                          TEXT,
  npwp                                      VARCHAR(30),
  tag                                       VARCHAR(100),
  external_ref                              JSONB,      -- id_donatur_postgree, id_erp_wh
  user_insert                               VARCHAR(50),
  user_update                               VARCHAR(50),
  tgl_update                                DATE,
  created_at                                TIMESTAMP NOT NULL DEFAULT now(),
  updated_at                                TIMESTAMP NOT NULL DEFAULT now(),
  CONSTRAINT ck_donatur_jk     CHECK (jenis_kelamin IS NULL OR jenis_kelamin IN ('l','p','t')),
  CONSTRAINT ck_donatur_aktif  CHECK (aktif IN ('y','n','p')),
  CONSTRAINT ck_donatur_sms    CHECK (kirim_sms IN ('y','n'))
);
CREATE INDEX idx_donatur_nama_trgm  ON donatur USING GIN (nama_lengkap gin_trgm_ops);
CREATE INDEX idx_donatur_kantor     ON donatur(kantor_donatur_id);
CREATE INDEX idx_donatur_kec_domisili ON donatur(kecamatan_domisili_id);
CREATE INDEX idx_donatur_nia_rfo    ON donatur(nia_rfo);
CREATE INDEX idx_donatur_aktif      ON donatur(aktif) WHERE aktif = 'y';

-- -------------------------------------------------------------
-- 3. PEMASANGAN (pairing anak <-> donatur <-> program) — tabel hub modul ini
-- -------------------------------------------------------------

CREATE TABLE pemasangan (
  id                        BIGSERIAL PRIMARY KEY,
  kode_lama                 VARCHAR(100) NOT NULL UNIQUE,  -- dulu id_pemasangan_baru
  tahun                     SMALLINT NOT NULL,
  tgl_pemasangan             DATE,
  tgl_pemberhentian            DATE,
  donatur_id                    BIGINT NOT NULL REFERENCES donatur(id) ON DELETE RESTRICT,
  anak_id                          BIGINT NOT NULL REFERENCES ajis_anak(id) ON DELETE RESTRICT,
  wilayah_pembinaan_id                BIGINT REFERENCES ajis_wilayah_pembinaan(id) ON DELETE SET NULL,
  kantor_id                              BIGINT REFERENCES ajis_kantor(id) ON DELETE SET NULL,
  program_id                                BIGINT REFERENCES program(id) ON DELETE SET NULL,
  harga_program                              NUMERIC(16,2),
  harga_penyaluran                           NUMERIC(16,2),
  keterangan_pemberhentian                   TEXT,
  status_pasangan                            VARCHAR(1) NOT NULL DEFAULT 'y', -- dulu enum('y','n')
  saldo_awal                                 NUMERIC(16,2) DEFAULT 0,
  saldo_akhir                                NUMERIC(16,2),
  status_saldo                               VARCHAR(1)  DEFAULT 'n',        -- dulu enum('n','y')
  status_saldo_akhir                         VARCHAR(10),
  program_sebelumnya                         VARCHAR(40),
  sdm_wilayah_id                             BIGINT REFERENCES ajis_sdm_wilayah(id) ON DELETE SET NULL, -- dulu id_sdm (mentor)
  status_mentor                              VARCHAR(10),
  nia_rfo                                    VARCHAR(50),
  nama_rfo                                   TEXT,
  tunda_penyaluran                           VARCHAR(50),
  kode_naik_jenjang                          VARCHAR(100),  -- dulu id_naik_jenjang
  via_input                                  VARCHAR(50),
  is_riwayat                                 BOOLEAN NOT NULL DEFAULT false, -- dulu 'history' varchar(1)
  user_stop                                  VARCHAR(50),
  via_stop                                   VARCHAR(50),
  alasan_aktif                               VARCHAR(50),
  external_ref                               JSONB,   -- jcustid + semua *_postgree/*_erpwh id (10+ kolom lama)
  user_insert                                VARCHAR(30),
  date_insert                                TIMESTAMP,
  user_update                                VARCHAR(30),
  date_update                                TIMESTAMP,
  updated_saldo                              TIMESTAMP,
  CONSTRAINT ck_pemasangan_status CHECK (status_pasangan IN ('y','n')),
  CONSTRAINT ck_pemasangan_saldo  CHECK (status_saldo IS NULL OR status_saldo IN ('y','n'))
);
-- pengganti PK komposit lama (id_donatur,id_anak,id_program,id_pemasangan_baru,tahun):
CREATE UNIQUE INDEX ux_pemasangan_kombo ON pemasangan(donatur_id, anak_id, program_id, tahun);
CREATE INDEX idx_pemasangan_anak     ON pemasangan(anak_id);
CREATE INDEX idx_pemasangan_donatur  ON pemasangan(donatur_id);
CREATE INDEX idx_pemasangan_kantor   ON pemasangan(kantor_id);
CREATE INDEX idx_pemasangan_wilayah  ON pemasangan(wilayah_pembinaan_id);
CREATE INDEX idx_pemasangan_program  ON pemasangan(program_id);
CREATE INDEX idx_pemasangan_sdm      ON pemasangan(sdm_wilayah_id);
CREATE INDEX idx_pemasangan_aktif    ON pemasangan(kantor_id, status_pasangan) WHERE status_pasangan = 'y';
CREATE INDEX idx_pemasangan_tahun_brin ON pemasangan USING BRIN (tahun);

-- -------------------------------------------------------------
-- 4. TRANSAKSI DONASI (input per anak per bulan, dulu ajis_input_donasi)
-- -------------------------------------------------------------

CREATE TABLE donasi_transaksi (
  id                     BIGSERIAL PRIMARY KEY,
  kode_lama              INTEGER UNIQUE,                -- dulu id_input_donasi
  pemasangan_id           BIGINT REFERENCES pemasangan(id) ON DELETE SET NULL,
  tgl_transaksi            DATE NOT NULL,
  anak_id                    BIGINT REFERENCES ajis_anak(id) ON DELETE SET NULL,
  donatur_id                    BIGINT REFERENCES donatur(id) ON DELETE SET NULL,
  program_id                       BIGINT REFERENCES program(id) ON DELETE SET NULL,
  kantor_id                           BIGINT REFERENCES ajis_kantor(id) ON DELETE SET NULL,
  wilayah_pembinaan_id                    BIGINT REFERENCES ajis_wilayah_pembinaan(id) ON DELETE SET NULL,
  qty                                        INTEGER DEFAULT 1,
  pilihan_donasi                             NUMERIC(16,2),
  nominal_donasi                             NUMERIC(16,2),
  bulan                                      SMALLINT,
  tahun                                      SMALLINT,
  periode                                    VARCHAR(10),
  jenis                                      VARCHAR(10) NOT NULL DEFAULT 'trans', -- dulu enum('trans','saldo')
  jenjang_pendidikan                         VARCHAR(10),
  kode_transaksi                             VARCHAR(50),   -- dulu transid (grup ke tabel transaksi)
  detail_id_lama                             INTEGER,       -- dulu detailid
  via_input                                  VARCHAR(100),
  external_ref                               JSONB,         -- jcustid + *_postgree
  user_insert                                VARCHAR(30),
  date_insert                                TIMESTAMP,
  user_update                                VARCHAR(30),
  date_update                                DATE,
  CONSTRAINT ck_donasi_transaksi_jenis CHECK (jenis IN ('trans','saldo'))
);
CREATE INDEX idx_donasi_transaksi_anak       ON donasi_transaksi(anak_id, bulan, tahun);
CREATE INDEX idx_donasi_transaksi_donatur    ON donasi_transaksi(donatur_id);
CREATE INDEX idx_donasi_transaksi_pemasangan ON donasi_transaksi(pemasangan_id);
CREATE INDEX idx_donasi_transaksi_kantor     ON donasi_transaksi(kantor_id);
CREATE INDEX idx_donasi_transaksi_tgl_brin   ON donasi_transaksi USING BRIN (tgl_transaksi);

-- -------------------------------------------------------------
-- 5. PENYALURAN (eksekusi penyaluran dana ke anak)
-- -------------------------------------------------------------

CREATE TABLE penyaluran (
  id                     BIGSERIAL PRIMARY KEY,
  id_row_lama             INTEGER UNIQUE,               -- dulu id_row (PK asli sesungguhnya)
  kode_penyaluran           VARCHAR(50) NOT NULL,        -- dulu id_penyaluran
  pemasangan_id                BIGINT REFERENCES pemasangan(id) ON DELETE SET NULL,
  tgl_penyaluran                  DATE,
  anak_id                            BIGINT REFERENCES ajis_anak(id) ON DELETE SET NULL,
  donatur_id                            BIGINT REFERENCES donatur(id) ON DELETE SET NULL,
  sdm_wilayah_id                           BIGINT REFERENCES ajis_sdm_wilayah(id) ON DELETE SET NULL,
  wilayah_pembinaan_id                        BIGINT REFERENCES ajis_wilayah_pembinaan(id) ON DELETE SET NULL,
  kantor_id                                      BIGINT REFERENCES ajis_kantor(id) ON DELETE SET NULL,
  program_id                                        BIGINT REFERENCES program(id) ON DELETE SET NULL,
  jenjang_pendidikan                                   VARCHAR(10),
  kelas                                                VARCHAR(50),
  nominal_penyaluran                                   NUMERIC(16,2),
  nominal_hpp                                          NUMERIC(16,2),
  bulan                                                SMALLINT,
  tahun                                                SMALLINT,
  periode                                              VARCHAR(10),
  kode_transaksi                                       VARCHAR(50),  -- dulu transid
  detail_id_lama                                       VARCHAR(50),  -- dulu detailid
  donasi_transaksi_id                                  BIGINT REFERENCES donasi_transaksi(id) ON DELETE SET NULL,
  jenis                                                VARCHAR(50),
  status_akhir                                         VARCHAR(1) NOT NULL DEFAULT 'n',
  status_tersalurkan                                   VARCHAR(1) NOT NULL DEFAULT 'n',
  via_input                                            VARCHAR(10) NOT NULL DEFAULT 'single', -- dulu enum('massal','single')
  external_ref                                         JSONB,
  user_insert                                          VARCHAR(30),
  date_insert                                          TIMESTAMP,
  user_update                                          VARCHAR(30),
  date_update                                          DATE,
  CONSTRAINT ck_penyaluran_status_akhir CHECK (status_akhir IN ('y','n')),
  CONSTRAINT ck_penyaluran_tersalurkan  CHECK (status_tersalurkan IN ('y','n')),
  CONSTRAINT ck_penyaluran_via_input    CHECK (via_input IN ('massal','single'))
);
CREATE INDEX idx_penyaluran_kode      ON penyaluran(kode_penyaluran);
CREATE INDEX idx_penyaluran_anak      ON penyaluran(anak_id, bulan, tahun);
CREATE INDEX idx_penyaluran_donatur   ON penyaluran(donatur_id);
CREATE INDEX idx_penyaluran_pemasangan ON penyaluran(pemasangan_id);
CREATE INDEX idx_penyaluran_kantor    ON penyaluran(kantor_id);
CREATE INDEX idx_penyaluran_tgl_brin  ON penyaluran USING BRIN (tgl_penyaluran);

-- -------------------------------------------------------------
-- 6. OPNAME SALDO (dulu ajis_opname — saldo per pemasangan per tahun)
-- -------------------------------------------------------------
-- Rasionalisasi besar: PK lama (tahun,id_anak,id_donatur,id_program,
-- id_pemasangan_baru) sangat redundan — semua itu SUDAH melekat di 1
-- baris `pemasangan`. Cukup FK ke pemasangan_id + tahun.

CREATE TABLE opname_saldo (
  id                     BIGSERIAL PRIMARY KEY,
  pemasangan_id           BIGINT NOT NULL REFERENCES pemasangan(id) ON DELETE CASCADE,
  tahun                   SMALLINT NOT NULL,
  saldo_awal_ganjil        NUMERIC(16,2),
  saldo_akhir_ganjil          NUMERIC(16,2),
  tupo_jan_jun                   VARCHAR(100),
  tgl_opname_ganjil                 TIMESTAMP,
  user_opname_ganjil                   VARCHAR(100),
  saldo_awal_genap                        NUMERIC(16,2),
  saldo_akhir_genap                          NUMERIC(16,2),
  tupo_jul_des                                  VARCHAR(100),
  tgl_opname_genap                                 TIMESTAMP,
  user_opname_genap                                   VARCHAR(100),
  keterangan                                             TEXT,
  user_input                                             VARCHAR(50),
  user_update                                            VARCHAR(100),
  external_ref                                           JSONB, -- jcustid
  updated_at                                             TIMESTAMP,
  UNIQUE (pemasangan_id, tahun)
);
CREATE INDEX idx_opname_saldo_tahun_brin ON opname_saldo USING BRIN (tahun);

-- -------------------------------------------------------------
-- 7. PENGAJUAN PERGANTIAN ANAK/DONATUR (dulu ajis_view_ajuan — TABEL asli
--    meski namanya "view")
-- -------------------------------------------------------------

CREATE TABLE pengajuan_pergantian_anak (
  id                     BIGSERIAL PRIMARY KEY,
  kode_lama              INTEGER UNIQUE,                -- dulu id_ajuan
  tgl_ajuan               DATE,
  kantor_id                  BIGINT REFERENCES ajis_kantor(id) ON DELETE SET NULL,      -- dulu id_kantor
  wilayah_pembinaan_id           BIGINT REFERENCES ajis_wilayah_pembinaan(id) ON DELETE SET NULL,
  donatur_id                        BIGINT REFERENCES donatur(id) ON DELETE SET NULL,
  kantor_donatur_id                    BIGINT REFERENCES ajis_kantor(id) ON DELETE SET NULL, -- dulu oid_donatur
  program_donasi                          VARCHAR(80),
  nia_rfo                                    VARCHAR(30),
  nama_rfo                                      VARCHAR(80),
  anak_asal_id                                     BIGINT REFERENCES ajis_anak(id) ON DELETE SET NULL, -- dulu id_anak
  anak_pengganti_id                                   BIGINT REFERENCES ajis_anak(id) ON DELETE SET NULL, -- dulu id_anak_pengganti
  pemasangan_id                                          BIGINT REFERENCES pemasangan(id) ON DELETE SET NULL, -- dulu id_pemasangan_baru
  alasan_pergantian                                         VARCHAR(200),
  keterangan                                                   VARCHAR(200),
  tipe_ganti                                                      VARCHAR(20),  -- 'anak_existing','ganti donatur','pemasangan_baru', dst
  pindah_saldo                                                       NUMERIC(16,2),
  approve_funding                                                       VARCHAR(1) NOT NULL DEFAULT 'n', -- dulu enum('t','n','y')
  status_eksekusi                                                          VARCHAR(1), -- dulu enum('','y','n')
  tgl_eksekusi                                                                DATE,
  tgl_approve_funding                                                            TIMESTAMP,
  jenis_donatur                                                                    VARCHAR(100),
  hp                                                                                  VARCHAR(50),
  alasan_reject                                                                        TEXT,
  external_ref                                                                          JSONB, -- jcustid
  CONSTRAINT ck_ajuan_approve CHECK (approve_funding IN ('t','n','y')),
  CONSTRAINT ck_ajuan_eksekusi CHECK (status_eksekusi IS NULL OR status_eksekusi IN ('','y','n'))
);
CREATE INDEX idx_ajuan_anak_asal      ON pengajuan_pergantian_anak(anak_asal_id);
CREATE INDEX idx_ajuan_anak_pengganti ON pengajuan_pergantian_anak(anak_pengganti_id);
CREATE INDEX idx_ajuan_donatur        ON pengajuan_pergantian_anak(donatur_id);
CREATE INDEX idx_ajuan_kantor         ON pengajuan_pergantian_anak(kantor_id);
CREATE INDEX idx_ajuan_tgl_brin       ON pengajuan_pergantian_anak USING BRIN (tgl_ajuan);

-- -------------------------------------------------------------
-- 8. TRANSAKSI (ledger keuangan donasi, level cash/bank/noncash)
-- -------------------------------------------------------------

CREATE TABLE transaksi (
  id                     BIGSERIAL PRIMARY KEY,
  kode_lama               VARCHAR(50) NOT NULL,          -- dulu transid
  detail_id_lama              INTEGER NOT NULL,              -- dulu detailid
  jenis_transaksi                 VARCHAR(10) NOT NULL,          -- dulu enum('cash','noncash','bank','pccash','pcnoncash')
  donatur_id                          BIGINT REFERENCES donatur(id) ON DELETE SET NULL,
  program_id                              BIGINT REFERENCES program(id) ON DELETE SET NULL,
  perkiraan_rp                                NUMERIC(18,2),
  tgl_donasi                                     DATE,
  tgl_transaksi                                     DATE,
  kantor_transaksi_id                                  BIGINT REFERENCES ajis_kantor(id) ON DELETE SET NULL, -- dulu oid_transaksi
  kantor_donatur_id                                       BIGINT REFERENCES ajis_kantor(id) ON DELETE SET NULL, -- dulu oid_donatur
  vbayarid                                                   VARCHAR(100),
  mbayarid                                                      VARCHAR(100),
  nik_rfo                                                          VARCHAR(15),
  nik_claim                                                           VARCHAR(14),
  jid_claim                                                              VARCHAR(6),
  approved_claim                                                            VARCHAR(1) NOT NULL DEFAULT 'n',
  approved_trans                                                               VARCHAR(1) NOT NULL DEFAULT 'n',
  atas_nama                                                                       TEXT,
  tgl_generate                                                                       TIMESTAMP,
  keterangan                                                                            TEXT,
  jml_mustahik                                                                            VARCHAR(50),
  bulan_disantuni                                                                            VARCHAR(50),
  nama_rfo                                                                                      VARCHAR(50),
  nama_claim                                                                                       VARCHAR(50),
  status_pasang                                                                                       VARCHAR(1) NOT NULL DEFAULT 'n',
  approve_salur                                                                                          VARCHAR(1) NOT NULL DEFAULT 'n',
  ket_approve_salur                                                                                         TEXT,
  user_approve_salur                                                                                           VARCHAR(50),
  tgl_approve_salur                                                                                               TIMESTAMP,
  deleted_trans                                                                                                     VARCHAR(1) NOT NULL DEFAULT 'n',
  deleted_detail                                                                                                       VARCHAR(1) NOT NULL DEFAULT 'n',
  review                                                                                                                 VARCHAR(1) NOT NULL DEFAULT 'n',
  bulan_salur                                                                                                              VARCHAR(50),
  tahun_salur                                                                                                                 VARCHAR(50),
  selisih_donasi                                                                                                                 NUMERIC(16,2),
  total_input_donasi                                                                                                                NUMERIC(16,2),
  jml_anak_ijis                                                                                                                        INTEGER,
  kantor_ijis_id                                                                                                                          BIGINT REFERENCES ajis_kantor(id) ON DELETE SET NULL, -- dulu id_kantor_ijis
  harga_program                                                                                                                              NUMERIC(16,2),
  id_review                                                                                                                                     VARCHAR(50),
  cicilan                                                                                                                                          VARCHAR(1) NOT NULL DEFAULT 'n',
  external_ref                                                                                                                                        JSONB, -- jcustid + *_postgree + *_erp_wh + valid4 (fungsi tak jelas di data lama)
  user_insert                                                                                                                                            VARCHAR(50),
  date_insert                                                                                                                                            TIMESTAMP,
  user_insert_cf                                                                                                                                         VARCHAR(50),
  user_update_cf                                                                                                                                         VARCHAR(50),
  CONSTRAINT ck_transaksi_jenis CHECK (jenis_transaksi IN ('cash','noncash','bank','pccash','pcnoncash')),
  UNIQUE (kode_lama, detail_id_lama)
);
CREATE INDEX idx_transaksi_donatur    ON transaksi(donatur_id);
CREATE INDEX idx_transaksi_program    ON transaksi(program_id);
CREATE INDEX idx_transaksi_kantor     ON transaksi(kantor_transaksi_id);
CREATE INDEX idx_transaksi_jenis_tgl  ON transaksi(jenis_transaksi, tgl_donasi, tgl_transaksi);
CREATE INDEX idx_transaksi_tgl_brin   ON transaksi USING BRIN (tgl_transaksi);

-- -------------------------------------------------------------
-- 9. SEMESTER (periode laporan) — konten template CMS lama dipisah
--    ke tabel sendiri (jarang diakses vs metadata inti yg sering di-query)
-- -------------------------------------------------------------

CREATE TABLE ajis_semester (
  id                BIGSERIAL PRIMARY KEY,
  kode_lama         VARCHAR(50) UNIQUE,          -- dulu semesterid
  nama              VARCHAR(100),                -- dulu 'semester'
  tgl_awal          DATE,
  tgl_akhir         DATE,
  onprogress        VARCHAR(1) NOT NULL DEFAULT 'n',  -- dulu enum('n','y')
  tgl_awal_donasi   DATE,
  tgl_akhir_donasi  DATE,
  tgl_awal_saldo    DATE,
  tgl_akhir_saldo   DATE,
  jenis             VARCHAR(10),                 -- ganjil/genap
  tahun             SMALLINT,
  lapsem            VARCHAR(1) NOT NULL,
  CONSTRAINT ck_semester_onprogress CHECK (onprogress IN ('n','y'))
);
CREATE INDEX idx_semester_tahun ON ajis_semester(tahun, jenis);

CREATE TABLE ajis_semester_template (
  semester_id           BIGINT PRIMARY KEY REFERENCES ajis_semester(id) ON DELETE CASCADE,
  cover                 TEXT,
  cover_siswa           TEXT,
  kata_pengantar        TEXT,
  profil                TEXT,
  kotak_profil_ceria    TEXT,
  kotak_pembinaan_ceria TEXT,
  kotak_profil_siswa    TEXT,
  kotak_pembinaan_siswa TEXT,
  keuangan              TEXT,
  surat                 TEXT,
  bawah                 TEXT,
  kata_pengantar_siswa  TEXT,
  bawah_siswa           TEXT
);

-- -------------------------------------------------------------
-- 10. PEMBINAAN (sesi pembinaan/coaching anak, dulu ajis_pembinaan_baru)
-- -------------------------------------------------------------

CREATE TABLE pembinaan (
  id                     BIGSERIAL PRIMARY KEY,
  id_row_lama              INTEGER UNIQUE,              -- dulu id_row (PK asli)
  kode_pembinaan             VARCHAR(100),                -- dulu id_pembinaan (grup multi-anak/sesi)
  tgl_pembinaan                 DATE NOT NULL,
  semester_id                      BIGINT REFERENCES ajis_semester(id) ON DELETE SET NULL,
  bulan                               SMALLINT,
  tahun                                  SMALLINT,
  jenis_pembinaan                          TEXT,
  p3a                                         TEXT,
  judul_materi                                   TEXT,
  anak_id                                           BIGINT NOT NULL REFERENCES ajis_anak(id) ON DELETE CASCADE,
  kehadiran                                            VARCHAR(15),
  keterangan                                              VARCHAR(50),
  wilayah_pembinaan_id                                       BIGINT REFERENCES ajis_wilayah_pembinaan(id) ON DELETE SET NULL,
  kantor_id                                                     BIGINT REFERENCES ajis_kantor(id) ON DELETE SET NULL,
  pemateri                                                         TEXT,
  pemateri_personal                                                   TEXT,
  ortu_hadir                                                             VARCHAR(50),
  donatur_id                                                                BIGINT REFERENCES donatur(id) ON DELETE SET NULL,
  program_donasi                                                               VARCHAR(50),
  tampil                                                                          VARCHAR(1) NOT NULL DEFAULT 'y',  -- dulu enum('y','n')
  via_input                                                                          VARCHAR(50),
  capaian_tilawah                                                                       VARCHAR(50),
  capaian_tahfidz                                                                          VARCHAR(50),
  capaian_tahfidz_halaman                                                                     VARCHAR(50),
  pembiasaan_shalat_wajib                                                                        INTEGER,
  pembiasaan_tilawah                                                                                INTEGER,
  pembiasaan_sedekah                                                                                   INTEGER,
  membantu_ortu                                                                                           INTEGER,
  external_ref                                                                                               JSONB, -- *_postgree
  user_insert                                                                                                   VARCHAR(100),
  date_insert                                                                                                      TIMESTAMP NOT NULL DEFAULT now(),
  user_update                                                                                                         VARCHAR(100),
  date_update                                                                                                            DATE,
  CONSTRAINT ck_pembinaan_tampil CHECK (tampil IN ('y','n'))
);
CREATE INDEX idx_pembinaan_anak       ON pembinaan(anak_id, tgl_pembinaan);
CREATE INDEX idx_pembinaan_kode       ON pembinaan(kode_pembinaan);
CREATE INDEX idx_pembinaan_wilayah    ON pembinaan(wilayah_pembinaan_id);
CREATE INDEX idx_pembinaan_kantor     ON pembinaan(kantor_id);
CREATE INDEX idx_pembinaan_semester   ON pembinaan(semester_id);
CREATE INDEX idx_pembinaan_tgl_brin   ON pembinaan USING BRIN (tgl_pembinaan);

-- -------------------------------------------------------------
-- 11. DOKUMENTASI PEMBINAAN (foto kegiatan)
-- -------------------------------------------------------------
-- CATATAN DESAIN: PK lama MySQL komposit (semesterid, kantor_id,
-- id_wilayah_pembinaan) artinya SECARA DESAIN cuma 1 foto per kombinasi
-- itu. Ini keterbatasan desain lama, bukan aturan bisnis yang wajib
-- dipertahankan — di sini sengaja dilonggarkan jadi BIGSERIAL biasa
-- (boleh >1 foto per kombinasi semester+kantor+wilayah), krn "1 kantor
-- cuma boleh upload 1 foto per semester" jelas bukan requirement asli,
-- cuma efek samping desain PK lama.

CREATE TABLE pembinaan_dokumentasi (
  id                     BIGSERIAL PRIMARY KEY,
  semester_id             BIGINT REFERENCES ajis_semester(id) ON DELETE SET NULL,
  kantor_id                  BIGINT REFERENCES ajis_kantor(id) ON DELETE SET NULL,
  wilayah_pembinaan_id           BIGINT REFERENCES ajis_wilayah_pembinaan(id) ON DELETE SET NULL,
  image                              TEXT NOT NULL,
  nama                                  VARCHAR(50),
  upload_gdrive                           VARCHAR(50),
  external_ref                               JSONB   -- id_kantor_postgree, id_ijgs_dokumentasi
);
CREATE INDEX idx_pembinaan_dok_kombo ON pembinaan_dokumentasi(semester_id, kantor_id, wilayah_pembinaan_id);

-- -------------------------------------------------------------
-- 12. HAFALAN
-- -------------------------------------------------------------

CREATE TABLE item_hafalan (
  id            BIGSERIAL PRIMARY KEY,
  kode_lama     INTEGER UNIQUE,
  jenis         INTEGER,
  konten        VARCHAR(100) NOT NULL
);

CREATE TABLE hafalan_anak (
  id                BIGSERIAL PRIMARY KEY,
  kode_lama         INTEGER UNIQUE,               -- dulu id_hafalan
  anak_id           BIGINT NOT NULL REFERENCES ajis_anak(id) ON DELETE CASCADE,
  item_hafalan_id   BIGINT REFERENCES item_hafalan(id) ON DELETE SET NULL,
  jenis             VARCHAR(50),
  konten_uji        VARCHAR(100) NOT NULL,
  tgl_pengujian     DATE,
  tgl_insert        TIMESTAMP,
  keterangan        TEXT,
  semester_id       BIGINT REFERENCES ajis_semester(id) ON DELETE SET NULL,
  external_ref      JSONB,                        -- id_anak_postgree, id_item_hafalan (teks lama)
  UNIQUE (anak_id, konten_uji)                     -- pengganti PK komposit lama (id_anak, konten_uji)
);
CREATE INDEX idx_hafalan_anak_semester ON hafalan_anak(anak_id, semester_id);

-- -------------------------------------------------------------
-- 13. PENILAIAN
-- -------------------------------------------------------------

CREATE TABLE periode_penilaian (
  id            BIGSERIAL PRIMARY KEY,
  kode_lama     INTEGER UNIQUE,                    -- dulu id_periode_penilaian
  nama          VARCHAR(30),
  tgl_awal      DATE,
  tgl_akhir     DATE,
  aktif         VARCHAR(5)
);

CREATE TABLE item_penilaian (
  id            BIGSERIAL PRIMARY KEY,
  kode_lama     INTEGER UNIQUE,
  nama_item     TEXT,
  parent_id     BIGINT REFERENCES item_penilaian(id) ON DELETE SET NULL,
  is_parent     BOOLEAN NOT NULL DEFAULT false,
  jenis         VARCHAR(100),
  target        TEXT
);
CREATE INDEX idx_item_penilaian_parent ON item_penilaian(parent_id);

CREATE TABLE penilaian_anak (
  id                     BIGSERIAL PRIMARY KEY,
  anak_id                 BIGINT NOT NULL REFERENCES ajis_anak(id) ON DELETE CASCADE,
  kantor_id                  BIGINT REFERENCES ajis_kantor(id) ON DELETE SET NULL,
  wilayah_pembinaan_id           BIGINT REFERENCES ajis_wilayah_pembinaan(id) ON DELETE SET NULL,
  tgl_insert                        TIMESTAMP,
  semester_id                          BIGINT REFERENCES ajis_semester(id) ON DELETE SET NULL,
  kategori                                VARCHAR(100),
  aspek                                      VARCHAR(150) NOT NULL,
  item_penilaian_id                             BIGINT REFERENCES item_penilaian(id) ON DELETE SET NULL,
  target                                           TEXT,
  kondisi_awal                                        TEXT,
  nilai_capaian                                          INTEGER,
  perkembangan_capaian                                      TEXT,
  skor                                                         INTEGER,
  hasil_akhir                                                     VARCHAR(100),
  keterangan                                                         TEXT,
  via_input                                                             VARCHAR(20),
  tampil                                                                   BOOLEAN NOT NULL DEFAULT true,
  external_ref                                                                JSONB, -- *_postgree
  UNIQUE (anak_id, semester_id, aspek)              -- pengganti PK komposit lama (id_anak, semesterid, aspek)
);
CREATE INDEX idx_penilaian_anak_semester ON penilaian_anak(anak_id, semester_id);
CREATE INDEX idx_penilaian_kantor        ON penilaian_anak(kantor_id);

-- -------------------------------------------------------------
-- 14. MATERI PEMBINAAN
-- -------------------------------------------------------------

CREATE TABLE materi_pembinaan (
  id                     BIGSERIAL PRIMARY KEY,
  kode_lama               INTEGER UNIQUE,              -- dulu id_materi
  detail_id_lama              VARCHAR(50),                 -- dulu detailid
  materi                         TEXT NOT NULL,
  tanggal                           DATE,
  jenjang                              VARCHAR(50),
  semester_id                            BIGINT REFERENCES ajis_semester(id) ON DELETE SET NULL,
  kantor_id                                 BIGINT REFERENCES ajis_kantor(id) ON DELETE SET NULL, -- dulu oid
  wilayah_pembinaan_id                         BIGINT REFERENCES ajis_wilayah_pembinaan(id) ON DELETE SET NULL
);
CREATE INDEX idx_materi_semester ON materi_pembinaan(semester_id);
CREATE INDEX idx_materi_wilayah  ON materi_pembinaan(wilayah_pembinaan_id);

-- -------------------------------------------------------------
-- 15. LAPORAN SEMESTER (dulu manual_laporan) — laporan cetak per anak
--     per semester utk dikirim ke donatur.
-- -------------------------------------------------------------
-- CATATAN PENTING: kolom `pm_*` di bawah ini SENGAJA dipertahankan
-- sbg SNAPSHOT data anak pada saat laporan dibuat — ini BUKAN
-- duplikasi liar spt di tabel lain, karena laporan semester yg sudah
-- dicetak/dikirim ke donatur HARUS tetap tampil persis sama walau
-- data ajis_anak berubah sesudahnya (anak pindah sekolah, ganti kelas,
-- dst). Kalau field ini di-JOIN live ke ajis_anak, riwayat laporan lama
-- akan "berubah sendiri" — itu bug, bukan fitur.

CREATE TABLE laporan_semester (
  id                             BIGSERIAL PRIMARY KEY,
  kode_lama                      VARCHAR(50) NOT NULL UNIQUE,  -- dulu laporanid
  donatur_id                     BIGINT REFERENCES donatur(id) ON DELETE SET NULL,
  anak_id                        BIGINT REFERENCES ajis_anak(id) ON DELETE SET NULL,
  pemasangan_id                  BIGINT REFERENCES pemasangan(id) ON DELETE SET NULL,
  kantor_id                      BIGINT REFERENCES ajis_kantor(id) ON DELETE SET NULL,
  wilayah_pembinaan_id           BIGINT REFERENCES ajis_wilayah_pembinaan(id) ON DELETE SET NULL,
  semester_id                    BIGINT REFERENCES ajis_semester(id) ON DELETE SET NULL,
  kode_program_lama              INTEGER,        -- dulu programid (int, namespace berbeda dari program.kode_program_legacy)
  jenis                          VARCHAR(10),
  tahun                          SMALLINT,
  format_id                      SMALLINT,
  aktif                          VARCHAR(1) NOT NULL DEFAULT 'y',
  kode_naik_jenjang               VARCHAR(100),

  -- snapshot data anak titik-waktu (lihat catatan di atas)
  pm_nama_lengkap    TEXT,
  pm_jns_kel         VARCHAR(1),
  pm_tempat_lahir    VARCHAR(100),
  pm_tgl_lahir       DATE,
  pm_anak_ke         SMALLINT,
  pm_saudara         SMALLINT,
  pm_nama_orang_tua  TEXT,
  pm_pekerjaan       TEXT,
  pm_sekolah_nama    TEXT,
  pm_sekolah_alamat  TEXT,
  pm_kelas           VARCHAR(5),
  pm_jenjang         VARCHAR(5),
  pm_mhs_institusi   VARCHAR(100),
  pm_mhs_prodi       VARCHAR(100),
  pm_mhs_semester    SMALLINT,
  pm_mhs_jurusan     VARCHAR(100),

  pembinaan_wilayah        TEXT,
  pembinaan_alamat         TEXT,
  pembinaan_jml_anak       SMALLINT,
  pembinaan_jenjang        VARCHAR(5),
  pembinaan_perkembangan   TEXT,
  pembinaan_prestasi       TEXT,

  dana_saldo_awal      NUMERIC(18,2),
  dana_penerimaan      NUMERIC(18,2),
  dana_penyaluran      NUMERIC(18,2),
  tgl_update_keuangan  TIMESTAMP,

  wajib_materi              INTEGER,
  jml_materi                INTEGER,
  jml_materi_tampil         INTEGER,
  tgl_penyaluran_text       TEXT,   -- dulu tgl_penyaluran (TEXT bebas di data lama, bukan DATE asli)
  tgl_pembinaan_text        TEXT,
  jml_prestasi              INTEGER,
  wajib_materi_bulan        INTEGER,
  jml_materi_tampil_bulan   INTEGER,
  tgl_penyaluran_bulan_text TEXT,
  tgl_pembinaan_bulan_text  TEXT,

  -- dokumen & status QC per jenis dokumen (dikelompokkan biar rapi)
  foto_url TEXT, foto_status VARCHAR(1), foto_keterangan VARCHAR(225),
  foto_pembinaan_url TEXT, foto_pembinaan_status VARCHAR(1), foto_pembinaan_keterangan VARCHAR(225),
  ssh_url TEXT, ssh_status VARCHAR(1), ssh_keterangan VARCHAR(225),                              -- surat suara hati
  raport_ceria_url TEXT, raport_ceria_status VARCHAR(1), raport_ceria_keterangan VARCHAR(225),
  raport_1_url TEXT, raport_1_status VARCHAR(1), raport_1_keterangan VARCHAR(225),
  raport_2_url TEXT, raport_2_status VARCHAR(1), raport_2_keterangan VARCHAR(225),
  materi_status VARCHAR(1), materi_keterangan TEXT,
  perkembangan_siswa_status VARCHAR(1), perkembangan_siswa_keterangan VARCHAR(225),

  status_terbuat                    BOOLEAN NOT NULL DEFAULT false,
  tgl_status_terbuat                   DATE,
  status_terkirim_fundraising             BOOLEAN NOT NULL DEFAULT false,
  tgl_status_terkirim_fundraising            DATE,
  status_terkirim_donatur                       BOOLEAN NOT NULL DEFAULT false,
  tgl_status_terkirim_donatur                      DATE,

  hasil_qc              VARCHAR(25),
  keterangan             TEXT,
  jenis_laporan            VARCHAR(50),
  suara_anak_juara            TEXT,
  catatan_pembinaan              TEXT,
  upload_gdrive                     VARCHAR(50),

  external_ref                          JSONB,   -- *_postgree, id_ijgs_foto_lapsem
  tgl_insert                                TIMESTAMP,
  user_insert                                  VARCHAR(50),
  CONSTRAINT ck_laporan_aktif CHECK (aktif IN ('y','n'))
);
CREATE INDEX idx_laporan_semester_anak     ON laporan_semester(anak_id);
CREATE INDEX idx_laporan_semester_donatur  ON laporan_semester(donatur_id);
CREATE INDEX idx_laporan_semester_periode  ON laporan_semester(semester_id, format_id);
CREATE INDEX idx_laporan_semester_wilayah  ON laporan_semester(wilayah_pembinaan_id, kantor_id);

CREATE TABLE laporan_semester_pembinaan (
  id                     BIGSERIAL PRIMARY KEY,
  laporan_semester_id     BIGINT NOT NULL REFERENCES laporan_semester(id) ON DELETE CASCADE,
  detail_id_lama              SMALLINT,             -- dulu detailid
  anak_id                        BIGINT REFERENCES ajis_anak(id) ON DELETE SET NULL,
  semester_id                       BIGINT REFERENCES ajis_semester(id) ON DELETE SET NULL,
  tanggal                              DATE,
  materi                                  VARCHAR(200),
  aktif                                      VARCHAR(1) NOT NULL DEFAULT 'y',
  user_insert                                   VARCHAR(50),
  date_insert                                      DATE,
  UNIQUE (laporan_semester_id, detail_id_lama),
  CONSTRAINT ck_laporan_pembinaan_aktif CHECK (aktif IN ('y','n'))
);
CREATE INDEX idx_laporan_semester_pembinaan_anak ON laporan_semester_pembinaan(anak_id);

-- -------------------------------------------------------------
-- 16. LAPORAN PRESTASI & DATA PRESTASI ANAK
-- -------------------------------------------------------------

CREATE TABLE laporan_prestasi (
  id                     BIGSERIAL PRIMARY KEY,
  kode_lama               INTEGER UNIQUE,             -- dulu id_prestasi
  anak_id                    BIGINT NOT NULL REFERENCES ajis_anak(id) ON DELETE CASCADE,
  kantor_id                     BIGINT REFERENCES ajis_kantor(id) ON DELETE SET NULL,
  wilayah_pembinaan_id              BIGINT REFERENCES ajis_wilayah_pembinaan(id) ON DELETE SET NULL,
  jenjang_pendidikan                   VARCHAR(50),
  kelas                                   VARCHAR(50),
  event                                      TEXT,
  lokasi                                        TEXT,
  bidang_prestasi                                  TEXT,
  skala                                               TEXT,
  prestasi                                               TEXT,
  link_publikasi                                            TEXT,
  waktu_awal                                                   DATE,
  waktu_akhir                                                     DATE,
  aktif                                                              VARCHAR(1) NOT NULL DEFAULT 'y',
  user_insert                                                           VARCHAR(50),
  date_insert                                                              DATE,
  CONSTRAINT ck_laporan_prestasi_aktif CHECK (aktif IN ('y','n'))
);
CREATE INDEX idx_laporan_prestasi_anak ON laporan_prestasi(anak_id);

CREATE TABLE prestasi_anak (
  id                     BIGSERIAL PRIMARY KEY,
  kode_lama               INTEGER UNIQUE,             -- dulu ajis_data_prestasi.id
  anak_id                    BIGINT NOT NULL REFERENCES ajis_anak(id) ON DELETE CASCADE,
  event_lomba                   VARCHAR(50),
  tgl                              DATE,
  lokasi                              VARCHAR(50),
  skala_prestasi_tingkat                 VARCHAR(30),
  capaian_prestasi                          VARCHAR(50),
  jenis_bidang                                 VARCHAR(30),
  publikasi_media                                 VARCHAR(50),
  semester_id                                        BIGINT REFERENCES ajis_semester(id) ON DELETE SET NULL,
  laporan_semester_id                                    BIGINT REFERENCES laporan_semester(id) ON DELETE SET NULL, -- dulu laporanid
  bulan                                                     SMALLINT,
  tahun                                                        SMALLINT,
  tampil                                                          BOOLEAN NOT NULL DEFAULT true
);
CREATE INDEX idx_prestasi_anak_anak ON prestasi_anak(anak_id);

-- -------------------------------------------------------------
-- 17. PEMINJAMAN AJIS ANAK (program RFO) & KONFIGURASINYA
-- -------------------------------------------------------------

CREATE TABLE peminjaman_ajis_anak (
  id                     BIGSERIAL PRIMARY KEY,
  kode_lama               INTEGER UNIQUE,             -- dulu id_peminjaman
  anak_id                    BIGINT REFERENCES ajis_anak(id) ON DELETE SET NULL,
  wilayah_pembinaan_id          BIGINT REFERENCES ajis_wilayah_pembinaan(id) ON DELETE SET NULL,
  kantor_id                        BIGINT REFERENCES ajis_kantor(id) ON DELETE SET NULL,
  nama_peminjam                        TEXT,
  peminjam_kode                           VARCHAR(16),  -- dulu id_peminjam (referensi SDM/user, tipe campur di data lama)
  tgl_awal_peminjaman                        DATE,
  tgl_selesai_peminjaman                        DATE,
  tgl_expired                                      DATE,
  status_pinjam                                       VARCHAR(1) NOT NULL DEFAULT 'n',
  status_terpasangkan                                    VARCHAR(1) NOT NULL DEFAULT 'n',
  cancel                                                    VARCHAR(1) NOT NULL DEFAULT 'n',
  alasan_cancel                                                TEXT,
  foto                                                            TEXT,
  user_insert                                                        VARCHAR(30),
  date_insert                                                           DATE,
  CONSTRAINT ck_peminjaman_status  CHECK (status_pinjam IN ('y','n')),
  CONSTRAINT ck_peminjaman_pasang  CHECK (status_terpasangkan IN ('y','n')),
  CONSTRAINT ck_peminjaman_cancel  CHECK (cancel IN ('y','n'))
);
CREATE INDEX idx_peminjaman_anak    ON peminjaman_ajis_anak(anak_id);
CREATE INDEX idx_peminjaman_status  ON peminjaman_ajis_anak(kantor_id, wilayah_pembinaan_id, status_pinjam);

-- ajis_batas_expired_peminjaman (MySQL) cuma 1 kolom `jml_hari`, 1 baris
-- konfigurasi global -> jadi baris di tabel config generik, bukan tabel
-- 1-kolom terpisah:
CREATE TABLE app_config (
  kunci        VARCHAR(50) PRIMARY KEY,
  nilai        TEXT NOT NULL,
  keterangan   VARCHAR(200)
);
-- migrasi: INSERT INTO app_config(kunci, nilai, keterangan) VALUES
--   ('batas_expired_peminjaman_hari', '<isi jml_hari lama>',
--    'Batas hari peminjaman ajis RFO sebelum dianggap expired');

-- -------------------------------------------------------------
-- 18. ARSIP KANTOR LEGACY (tabel `kantor` di dump, BEDA dari ajis_kantor)
-- -------------------------------------------------------------
-- Tabel `kantor` di database_dump.sql punya namespace oid yang beda
-- format dari ajis_kantor ('00-004' vs '09-194') dan kolom tambahan
-- (id_office, id_kantor int, omid) yang tidak ada relasinya yang jelas
-- ke tabel lain dalam scope dump ini. Kemungkinan sisa integrasi/migrasi
-- sistem office lain. Diarsipkan read-only, BUKAN dijadikan source of
-- truth aktif (source of truth tetap ajis_kantor) — kalau tim konfirmasi
-- masih dipakai aktif, perlu analisis relasi terpisah sebelum dipakai FK.

CREATE TABLE kantor_legacy_archive (
  id                    BIGSERIAL PRIMARY KEY,
  kode_lama             VARCHAR(6) UNIQUE,   -- dulu oid
  nama                  VARCHAR(150),
  alamat                VARCHAR(200),
  parent_kode_lama      VARCHAR(6),          -- dulu oid_parent (self-ref via kode, tdk di-FK-kan krn sifatnya arsip)
  level_struktur        SMALLINT,
  aktif                 VARCHAR(1),
  id_office             VARCHAR(50),
  id_kantor_int_lama    INTEGER,
  omid                  VARCHAR(20),
  kode_kantor_legacy    VARCHAR(20)          -- dulu id_kantor_postgree
);

-- =====================================================================
-- CATATAN MIGRASI MODUL 2
-- =====================================================================
-- 1. Urutan migrasi WAJIB: program -> donatur -> pemasangan ->
--    (donasi_transaksi, penyaluran, opname_saldo, pengajuan_pergantian_anak,
--    transaksi) -> ajis_semester -> ajis_semester_template ->
--    (pembinaan, pembinaan_dokumentasi, item_hafalan -> hafalan_anak,
--    periode_penilaian, item_penilaian -> penilaian_anak,
--    materi_pembinaan) -> laporan_semester -> (laporan_semester_pembinaan,
--    laporan_prestasi, prestasi_anak) -> peminjaman_ajis_anak -> app_config.
--    (kantor_legacy_archive tidak punya dependensi, boleh kapan saja.)
-- 2. Semua kolom integrasi sistem lain (id_xxx_postgree, id_xxx_erpwh,
--    jcustid) dikonsolidasi ke kolom JSONB `external_ref`. Contoh isi:
--    {"id_anak_postgree": "...", "jcustid": 1}. Kalau ada proses lama yg
--    masih query salah satu id itu, tinggal query
--    `external_ref->>'id_anak_postgree'`, tidak perlu kolom terpisah.
-- 3. Nilai '0000-00-00' pada kolom DATE/DATETIME (mis. tgl_pemberhentian_
--    pemasangan, tgl_digulirkan, tgl_inaktif) WAJIB dikonversi ke NULL
--    saat ETL — sama seperti catatan di modul inti.
-- 4. `laporan_semester.pm_*`: JANGAN diisi otomatis dari JOIN ke ajis_anak
--    saat migrasi awal — migrasikan APA ADANYA dari kolom pm_* MySQL,
--    karena itu snapshot historis, bukan data yang harus disinkronkan.
-- 5. Tabel `kantor` (legacy) diarsipkan tanpa FK aktif ke tabel lain
--    di schema baru — perlu keputusan bisnis terpisah apakah tabel ini
--    masih relevan sebelum diintegrasikan lebih lanjut.
-- =====================================================================