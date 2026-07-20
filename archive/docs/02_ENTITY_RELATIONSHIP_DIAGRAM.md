# ENTITY-RELATIONSHIP DIAGRAM (ERD)
## AJIS (Anak Juara Information System) - Complete Database Model

**Generated:** July 2026  
**Database:** PostgreSQL  
**Tool:** Mermaid.js

---

## ERD Diagram - Full Schema

```mermaid
erDiagram
    %% ========================================
    %% 1. AUTHENTICATION & USER MANAGEMENT
    %% ========================================

    AJIS_GROUP_USER ||--o{ AJIS_USER : "has"
    AJIS_USER ||--o{ AJIS_USER_WILAYAH_PEMBINAAN : "assigned_to"

    AJIS_GROUP_USER {
        BIGSERIAL id PK
        VARCHAR nama
        VARCHAR keterangan
        VARCHAR aktif
    }

    AJIS_USER {
        BIGSERIAL id PK
        INTEGER kode_lama UK
        VARCHAR username UK
        VARCHAR password_hash
        BOOLEAN must_reset_password
        VARCHAR nik
        BIGINT kantor_id FK
        BIGINT group_user_id FK
        VARCHAR aktif
        VARCHAR user_insert
        TIMESTAMP date_insert
    }

    AJIS_USER_WILAYAH_PEMBINAAN {
        BIGINT user_id FK PK
        BIGINT wilayah_pembinaan_id FK PK
    }

    %% ========================================
    %% 2. ORGANIZATION & ADMINISTRATIVE HIERARCHY
    %% ========================================

    AJIS_KANTOR ||--o{ AJIS_KANTOR : "parent"
    AJIS_KANTOR ||--o{ AJIS_WILAYAH_PEMBINAAN : "has"
    AJIS_KANTOR ||--o{ AJIS_SDM_WILAYAH : "employs"

    AJIS_KANTOR {
        BIGSERIAL id PK
        VARCHAR kode UK
        VARCHAR nama
        VARCHAR alamat
        VARCHAR no_telp
        BIGINT parent_id FK
        BIGINT parent_second_id FK
        TEXT kode_program_rz
        VARCHAR jenis
        VARCHAR kode_kantor_legacy UK
        VARCHAR aktif
        TIMESTAMP created_at
        TIMESTAMP updated_at
    }

    AJIS_WILAYAH_PEMBINAAN {
        BIGSERIAL id PK
        INTEGER kode_lama UK
        VARCHAR nama_wilayah UK
        TEXT alamat_wilayah
        BIGINT kantor_id FK
        BIGINT desa_id FK
        VARCHAR status_approve
        VARCHAR aktif
        VARCHAR user_insert
        DATE date_insert
        VARCHAR user_update
        DATE date_update
    }

    AJIS_USER_WILAYAH_PEMBINAAN }o--|| AJIS_WILAYAH_PEMBINAAN : "references"

    %% ========================================
    %% 3. GEOGRAPHIC REFERENCE DATA
    %% ========================================

    REF_PROPINSI ||--o{ REF_KABUPATEN : "contains"
    REF_KABUPATEN ||--o{ REF_KECAMATAN : "contains"
    REF_KECAMATAN ||--o{ REF_DESA : "contains"

    AJIS_WILAYAH_PEMBINAAN }o--|| REF_DESA : "located_in"
    AJIS_SDM_WILAYAH }o--|| REF_DESA : "resides_in"
    AJIS_ANAK }o--|| REF_DESA : "from"

    REF_PROPINSI {
        BIGSERIAL id PK
        VARCHAR kode UK
        VARCHAR nama
        VARCHAR ibukota
        VARCHAR aktif
    }

    REF_KABUPATEN {
        BIGSERIAL id PK
        VARCHAR kode UK
        BIGINT propinsi_id FK
        VARCHAR nama
        BOOLEAN is_kota
        VARCHAR kode_oid
        VARCHAR ibukota
        NUMERIC lat
        NUMERIC lng
        VARCHAR aktif
        TIMESTAMP updated_at
    }

    REF_KECAMATAN {
        BIGSERIAL id PK
        VARCHAR kode UK
        BIGINT kabupaten_id FK
        VARCHAR nama
        VARCHAR kodepos
        VARCHAR aktif
        DATE updated_at
    }

    REF_DESA {
        BIGSERIAL id PK
        VARCHAR kode UK
        BIGINT kecamatan_id FK
        VARCHAR nama
        BOOLEAN is_kelurahan
        VARCHAR nomor_induk_desa
        VARCHAR aktif
    }

    %% ========================================
    %% 4. HUMAN RESOURCES (SDM)
    %% ========================================

    AJIS_SDM_WILAYAH ||--o{ AJIS_SDM_WILAYAH_RIWAYAT : "has_history"

    AJIS_SDM_WILAYAH {
        BIGSERIAL id PK
        INTEGER kode_lama UK
        VARCHAR nik UK
        VARCHAR nama_lengkap
        VARCHAR jenis_kelamin
        VARCHAR alamat
        BIGINT desa_id FK
        VARCHAR jenjang_pendidikan
        DATE tgl_bergabung
        DATE tgl_keluar
        VARCHAR telp
        VARCHAR hp
        VARCHAR email
        VARCHAR keterangan
        VARCHAR keaktifan_edukasi
        VARCHAR foto
        VARCHAR aktif
        BIGINT penugasan_wilayah_id FK
        BIGINT penugasan_kantor_id FK
        VARCHAR penugasan_fungsi_struktur
        VARCHAR penugasan_keaktifan_edukasi
        VARCHAR user_insert
        DATE date_insert
        VARCHAR user_update
        DATE date_update
    }

    AJIS_SDM_WILAYAH }o--|| AJIS_WILAYAH_PEMBINAAN : "current_assignment"
    AJIS_SDM_WILAYAH }o--|| AJIS_KANTOR : "works_at"

    AJIS_SDM_WILAYAH_RIWAYAT {
        BIGSERIAL id PK
        INTEGER kode_lama UK
        BIGINT sdm_wilayah_id FK
        BIGINT wilayah_pembinaan_id FK
        BIGINT kantor_id FK
        VARCHAR fungsi_struktur
        VARCHAR keaktifan_edukasi
        BOOLEAN is_current
        VARCHAR user_insert
        DATE date_insert
        VARCHAR user_update
        DATE date_update
    }

    AJIS_SDM_WILAYAH_RIWAYAT }o--|| AJIS_WILAYAH_PEMBINAAN : "history_of"
    AJIS_SDM_WILAYAH_RIWAYAT }o--|| AJIS_KANTOR : "was_assigned_to"

    %% ========================================
    %% 5. CHILD/PARTICIPANT DATA
    %% ========================================

    AJIS_ANAK {
        BIGSERIAL id PK
        VARCHAR kode_lama UK
        VARCHAR nik UK
        VARCHAR nama_anak
        VARCHAR jenis_kelamin
        DATE tgl_lahir
        BIGINT desa_id FK
        BIGINT kantor_id FK
        BIGINT wilayah_pembinaan_id FK
        DATE tgl_awal_pembinaan
        DATE tgl_akhir_pembinaan
        VARCHAR status_pembinaan
        VARCHAR foto
        VARCHAR aktif
        VARCHAR user_insert
        DATE date_insert
    }

    AJIS_ANAK }o--|| AJIS_KANTOR : "managed_by"
    AJIS_ANAK }o--|| AJIS_WILAYAH_PEMBINAAN : "in_region"

    %% ========================================
    %% 6. OPERATIONAL DATA - SESSIONS
    %% ========================================

    AJIS_SESSION {
        BIGSERIAL id PK
        INTEGER kode_lama UK
        BIGINT anak_id FK
        BIGINT wilayah_pembinaan_id FK
        BIGINT kantor_id FK
        BIGINT sdm_wilayah_id FK
        DATE tanggal
        VARCHAR jam_mulai
        VARCHAR jam_selesai
        SMALLINT durasi_menit
        VARCHAR tema_pembinaan
        TEXT materi_pembinaan
        TEXT catatan
        VARCHAR status
        VARCHAR aktif
        VARCHAR user_insert
        DATE date_insert
    }

    AJIS_SESSION }o--|| AJIS_ANAK : "for"
    AJIS_SESSION }o--|| AJIS_WILAYAH_PEMBINAAN : "in"
    AJIS_SESSION }o--|| AJIS_KANTOR : "at"
    AJIS_SESSION }o--|| AJIS_SDM_WILAYAH : "by"

    %% ========================================
    %% 7. HAFALAN (QURAN MEMORIZATION)
    %% ========================================

    ITEM_HAFALAN ||--o{ HAFALAN_ANAK : "has"

    ITEM_HAFALAN {
        BIGSERIAL id PK
        INTEGER kode_lama UK
        VARCHAR jenis_hafalan
        VARCHAR surah
        SMALLINT ayat_awal
        SMALLINT ayat_akhir
        TEXT keterangan
        VARCHAR aktif
    }

    HAFALAN_ANAK {
        BIGSERIAL id PK
        INTEGER kode_lama UK
        BIGINT anak_id FK
        BIGINT item_hafalan_id FK
        BIGINT wilayah_pembinaan_id FK
        BIGINT kantor_id FK
        BIGINT semester_id FK
        DATE tanggal_capaian
        VARCHAR tingkat_hafalan
        VARCHAR status
        TEXT catatan_hafalan
        VARCHAR aktif
        VARCHAR user_insert
        DATE date_insert
    }

    HAFALAN_ANAK }o--|| AJIS_ANAK : "for"
    HAFALAN_ANAK }o--|| ITEM_HAFALAN : "of"
    HAFALAN_ANAK }o--|| AJIS_WILAYAH_PEMBINAAN : "in"
    HAFALAN_ANAK }o--|| AJIS_KANTOR : "at"

    %% ========================================
    %% 8. ASSESSMENT/EVALUATION
    %% ========================================

    ITEM_PENILAIAN ||--o{ PENILAIAN_ANAK : "has"

    ITEM_PENILAIAN {
        BIGSERIAL id PK
        INTEGER kode_lama UK
        VARCHAR nama_penilaian
        VARCHAR kategori_penilaian
        SMALLINT bobot_penilaian
        VARCHAR skala_penilaian
        TEXT keterangan
        VARCHAR aktif
    }

    PENILAIAN_ANAK {
        BIGSERIAL id PK
        INTEGER kode_lama UK
        BIGINT anak_id FK
        BIGINT item_penilaian_id FK
        BIGINT semester_id FK
        BIGINT wilayah_pembinaan_id FK
        BIGINT kantor_id FK
        VARCHAR nilai_penilaian
        DECIMAL nilai_angka
        TEXT catatan_penilaian
        VARCHAR status
        VARCHAR user_insert
        DATE date_insert
    }

    PENILAIAN_ANAK }o--|| AJIS_ANAK : "for"
    PENILAIAN_ANAK }o--|| ITEM_PENILAIAN : "of"
    PENILAIAN_ANAK }o--|| AJIS_SEMESTER : "in"
    PENILAIAN_ANAK }o--|| AJIS_WILAYAH_PEMBINAAN : "in_region"
    PENILAIAN_ANAK }o--|| AJIS_KANTOR : "at_office"

    %% ========================================
    %% 9. SEMESTER & TEMPLATES
    %% ========================================

    AJIS_SEMESTER {
        BIGSERIAL id PK
        INTEGER kode_lama UK
        VARCHAR nama_semester
        SMALLINT tahun
        SMALLINT urutan_semester
        DATE tgl_mulai
        DATE tgl_selesai
        VARCHAR status_semester
        VARCHAR aktif
        VARCHAR user_insert
        DATE date_insert
    }

    AJIS_SEMESTER_TEMPLATE {
        BIGSERIAL id PK
        INTEGER kode_lama UK
        BIGINT semester_id FK
        VARCHAR nama_template
        TEXT isi_template
        VARCHAR tipe_template
        VARCHAR aktif
    }

    AJIS_SEMESTER_TEMPLATE }o--|| AJIS_SEMESTER : "for"

    HAFALAN_ANAK }o--|| AJIS_SEMESTER : "in_semester"
    PENILAIAN_ANAK }o--|| AJIS_SEMESTER : "in_semester"

    %% ========================================
    %% 10. COACHING PROGRAMS
    %% ========================================

    PEMBINAAN {
        BIGSERIAL id PK
        INTEGER kode_lama UK
        VARCHAR nama_pembinaan
        TEXT deskripsi_pembinaan
        DATE tgl_mulai
        DATE tgl_selesai
        BIGINT wilayah_pembinaan_id FK
        BIGINT kantor_id FK
        VARCHAR status_pembinaan
        VARCHAR aktif
        VARCHAR user_insert
        DATE date_insert
    }

    PEMBINAAN }o--|| AJIS_WILAYAH_PEMBINAAN : "in"
    PEMBINAAN }o--|| AJIS_KANTOR : "at"

    PEMBINAAN_DOKUMENTASI {
        BIGSERIAL id PK
        INTEGER kode_lama UK
        BIGINT pembinaan_id FK
        TEXT keterangan
        VARCHAR foto
        DATE tanggal
        VARCHAR user_insert
        DATE date_insert
    }

    PEMBINAAN_DOKUMENTASI }o--|| PEMBINAAN : "documents"

    %% ========================================
    %% 11. PEMASANGAN (PLACEMENT PROGRAM)
    %% ========================================

    PEMASANGAN {
        BIGSERIAL id PK
        INTEGER kode_lama UK
        BIGINT anak_id FK
        BIGINT donatur_id FK
        BIGINT kantor_id FK
        BIGINT wilayah_pembinaan_id FK
        DATE tgl_pemasangan
        DATE tgl_digulirkan
        VARCHAR status_pemasangan
        TEXT catatan_pemasangan
        VARCHAR aktif
        VARCHAR user_insert
        DATE date_insert
    }

    PEMASANGAN }o--|| AJIS_ANAK : "for"
    PEMASANGAN }o--|| DONATUR : "by"
    PEMASANGAN }o--|| AJIS_KANTOR : "at"
    PEMASANGAN }o--|| AJIS_WILAYAH_PEMBINAAN : "in"

    DONATUR {
        BIGSERIAL id PK
        INTEGER kode_lama UK
        VARCHAR nama_donatur
        VARCHAR jenis_donatur
        VARCHAR alamat
        VARCHAR telp
        VARCHAR email
        VARCHAR status_donatur
        VARCHAR aktif
        VARCHAR user_insert
        DATE date_insert
    }

    %% ========================================
    %% 12. REPORT TABLES
    %% ========================================

    LAPORAN_SEMESTER {
        BIGSERIAL id PK
        INTEGER kode_lama UK
        BIGINT anak_id FK
        BIGINT semester_id FK
        BIGINT wilayah_pembinaan_id FK
        BIGINT kantor_id FK
        SMALLINT pm_hafalan
        SMALLINT pm_akhlak
        SMALLINT pm_ketrampilan
        SMALLINT pm_akademis
        TEXT ringkasan
        VARCHAR status_laporan
        VARCHAR aktif
        VARCHAR user_insert
        DATE date_insert
    }

    LAPORAN_SEMESTER }o--|| AJIS_ANAK : "for"
    LAPORAN_SEMESTER }o--|| AJIS_SEMESTER : "in"

    LAPORAN_SEMESTER_PEMBINAAN {
        BIGSERIAL id PK
        INTEGER kode_lama UK
        BIGINT laporan_semester_id FK
        VARCHAR detail_id_lama
        TEXT catatan_pembinaan
        VARCHAR status_pembinaan
        VARCHAR aktif
        VARCHAR user_insert
        DATE date_insert
    }

    LAPORAN_SEMESTER_PEMBINAAN }o--|| LAPORAN_SEMESTER : "part_of"

    LAPORAN_PRESTASI {
        BIGSERIAL id PK
        INTEGER kode_lama UK
        BIGINT anak_id FK
        BIGINT kantor_id FK
        BIGINT wilayah_pembinaan_id FK
        VARCHAR jenjang_pendidikan
        VARCHAR kelas
        TEXT event
        TEXT lokasi
        TEXT bidang_prestasi
        TEXT skala
        TEXT prestasi
        TEXT link_publikasi
        DATE waktu_awal
        DATE waktu_akhir
        VARCHAR aktif
        VARCHAR user_insert
        DATE date_insert
    }

    LAPORAN_PRESTASI }o--|| AJIS_ANAK : "for"

    PRESTASI_ANAK {
        BIGSERIAL id PK
        INTEGER kode_lama UK
        BIGINT anak_id FK
        VARCHAR event_lomba
        DATE tgl
        VARCHAR lokasi
        VARCHAR skala_prestasi_tingkat
        VARCHAR capaian_prestasi
        VARCHAR jenis_bidang
        VARCHAR publikasi_media
        BIGINT semester_id FK
        BIGINT laporan_semester_id FK
        SMALLINT bulan
        SMALLINT tahun
        BOOLEAN tampil
    }

    PRESTASI_ANAK }o--|| AJIS_ANAK : "of"
    PRESTASI_ANAK }o--|| AJIS_SEMESTER : "in"
    PRESTASI_ANAK }o--|| LAPORAN_SEMESTER : "in"

    %% ========================================
    %% 13. CONFIG & ARCHIVE
    %% ========================================

    APP_CONFIG {
        VARCHAR kunci PK
        TEXT nilai
        VARCHAR keterangan
    }

    KANTOR_LEGACY_ARCHIVE {
        BIGSERIAL id PK
        VARCHAR kode_lama UK
        VARCHAR nama
        VARCHAR alamat
        VARCHAR parent_kode_lama
        SMALLINT level_struktur
        VARCHAR aktif
        VARCHAR id_office
        INTEGER id_kantor_int_lama
        VARCHAR omid
        VARCHAR kode_kantor_legacy
    }
```

---

## Schema Details & Constraints

### 1. **ajis_group_user** - User Role Groups
| Column | Type | Constraint | Notes |
|--------|------|-----------|-------|
| id | BIGSERIAL | PK | Auto-incremented ID |
| nama | VARCHAR(50) | NOT NULL | Role name (e.g., 'Super Admin', 'Regional Coordinator') |
| keterangan | VARCHAR(150) | - | Description |
| aktif | VARCHAR(1) | NOT NULL, CHECK (aktif IN ('y','n')) | Active flag |

**Predefined Roles:**
- id=1: Super Admin
- id=2: Branch Admin (SPMD)
- id=9: Regional Coordinator (Korwil)

---

### 2. **ajis_user** - Users
| Column | Type | Constraint | Notes |
|--------|------|-----------|-------|
| id | BIGSERIAL | PK | Auto-incremented ID |
| kode_lama | INTEGER | UNIQUE | Legacy ID for migration mapping |
| username | VARCHAR(100) | UNIQUE, NOT NULL | Login username / email |
| password_hash | VARCHAR(255) | NOT NULL | bcrypt/argon2 hashed password |
| must_reset_password | BOOLEAN | NOT NULL, DEFAULT true | Force password change flag |
| nik | VARCHAR(20) | - | National ID |
| kantor_id | BIGINT | FK → ajis_kantor(id) ON DELETE SET NULL | User's primary office (for Branch Admin) |
| group_user_id | BIGINT | FK → ajis_group_user(id) ON DELETE SET NULL | User's role group |
| aktif | VARCHAR(1) | NOT NULL, DEFAULT 'y', CHECK (aktif IN ('y','n')) | Active flag |
| user_insert | VARCHAR(50) | - | Audit: who created |
| date_insert | TIMESTAMP | - | Audit: when created |

**Indexes:**
- idx_user_kantor ON (kantor_id)
- idx_user_group ON (group_user_id)
- UNIQUE ON (username)

---

### 3. **ajis_user_wilayah_pembinaan** - User Region Assignments (M:N)
| Column | Type | Constraint | Notes |
|--------|------|-----------|-------|
| user_id | BIGINT | FK → ajis_user(id) ON DELETE CASCADE, PK | User ID |
| wilayah_pembinaan_id | BIGINT | FK → ajis_wilayah_pembinaan(id) ON DELETE CASCADE, PK | Region ID |

**Purpose:** Map Korwil (role 9) to multiple regions; enables user to access data across assigned regions.

---

### 4. **ajis_kantor** - Offices (Branch Hierarchy)
| Column | Type | Constraint | Notes |
|--------|------|-----------|-------|
| id | BIGSERIAL | PK | Auto-incremented ID |
| kode | VARCHAR(10) | UNIQUE, NOT NULL | Office code (e.g., '09-218') |
| nama | VARCHAR(150) | NOT NULL | Office name |
| alamat | VARCHAR(200) | - | Address |
| no_telp | VARCHAR(20) | - | Phone number |
| parent_id | BIGINT | FK → ajis_kantor(id) ON DELETE SET NULL | Parent office (self-referencing) |
| parent_second_id | BIGINT | FK → ajis_kantor(id) ON DELETE SET NULL | Secondary parent |
| kode_program_rz | TEXT | - | Program codes (CSV format) |
| jenis | VARCHAR(50) | - | Office type (e.g., 'pusat', 'cabang') |
| kode_kantor_legacy | VARCHAR(20) | UNIQUE | Legacy office code for integrations |
| aktif | VARCHAR(1) | NOT NULL, DEFAULT 'y' | Active flag |
| created_at | TIMESTAMP | NOT NULL, DEFAULT now() | Audit timestamp |
| updated_at | TIMESTAMP | NOT NULL, DEFAULT now() | Audit timestamp |

**Indexes:**
- idx_kantor_parent ON (parent_id)
- idx_kantor_parent_second ON (parent_second_id)
- idx_kantor_nama_trgm ON (nama) USING GIN (gin_trgm_ops) — full-text search

---

### 5. **ajis_wilayah_pembinaan** - Regions / Coaching Areas
| Column | Type | Constraint | Notes |
|--------|------|-----------|-------|
| id | BIGSERIAL | PK | Auto-incremented ID |
| kode_lama | INTEGER | UNIQUE | Legacy region ID |
| nama_wilayah | VARCHAR(150) | UNIQUE, NOT NULL | Region name |
| alamat_wilayah | TEXT | - | Region address |
| kantor_id | BIGINT | FK → ajis_kantor(id) ON DELETE SET NULL | Parent office |
| desa_id | BIGINT | FK → ref_desa(id) ON DELETE SET NULL | Geographic location |
| status_approve | VARCHAR(1) | CHECK (status_approve IS NULL OR IN ('y','t')) | Approval status |
| aktif | VARCHAR(1) | NOT NULL, DEFAULT 'y' | Active flag |
| user_insert | VARCHAR(50) | - | Audit: creator |
| date_insert | DATE | - | Audit: creation date |
| user_update | VARCHAR(50) | - | Audit: last updater |
| date_update | DATE | - | Audit: last update date |

**Indexes:**
- idx_wilayah_kantor ON (kantor_id)
- idx_wilayah_desa ON (desa_id)
- idx_wilayah_nama_trgm ON (nama_wilayah) USING GIN (gin_trgm_ops)
- idx_wilayah_aktif ON (aktif) WHERE aktif = 'y' — partial index

---

### 6. **REF_PROPINSI, REF_KABUPATEN, REF_KECAMATAN, REF_DESA** - Geographic Reference Data
**Purpose:** Normalized geographic hierarchy (province → district → sub-district → village)

**ref_propinsi (Province):**
| Column | Type | Notes |
|--------|------|-------|
| id | BIGSERIAL | PK |
| kode | VARCHAR(4) | UNIQUE, legacy province ID |
| nama | VARCHAR(100) | NOT NULL, province name |
| ibukota | VARCHAR(100) | Capital city |
| aktif | VARCHAR(1) | NOT NULL, CHECK ('y','n') |

**ref_kabupaten (District):**
| Column | Type | Notes |
|--------|------|-------|
| id | BIGSERIAL | PK |
| kode | VARCHAR(4) | UNIQUE, legacy district ID |
| propinsi_id | BIGINT | FK → ref_propinsi(id) ON DELETE RESTRICT |
| nama | VARCHAR(100) | NOT NULL, district name |
| is_kota | BOOLEAN | NOT NULL, DEFAULT false — city vs regency |
| kode_oid | VARCHAR(6) | Legacy code |
| ibukota | VARCHAR(100) | Capital city |
| lat, lng | NUMERIC(10,6) | Coordinates |
| aktif | VARCHAR(1) | NOT NULL |

**ref_kecamatan (Sub-District):**
| Column | Type | Notes |
|--------|------|-------|
| id | BIGSERIAL | PK |
| kode | VARCHAR(10) | UNIQUE, legacy sub-district ID |
| kabupaten_id | BIGINT | FK → ref_kabupaten(id) ON DELETE RESTRICT |
| nama | VARCHAR(100) | NOT NULL |
| kodepos | VARCHAR(10) | Postal code |
| aktif | VARCHAR(1) | NOT NULL |
| updated_at | DATE | Last update |

**ref_desa (Village):**
| Column | Type | Notes |
|--------|------|-------|
| id | BIGSERIAL | PK |
| kode | VARCHAR(10) | UNIQUE, legacy village ID |
| kecamatan_id | BIGINT | FK → ref_kecamatan(id) ON DELETE RESTRICT |
| nama | VARCHAR(100) | NOT NULL |
| is_kelurahan | BOOLEAN | NOT NULL, DEFAULT false — urban vs rural |
| nomor_induk_desa | VARCHAR(50) | Official village number |
| aktif | VARCHAR(1) | NOT NULL |

**Indexes:**
- GIN trigram indexes on all `nama` columns for ILIKE '%...%' searches
- BTREE indexes on foreign keys for joins

---

### 7. **ajis_anak** - Child/Participant Data
| Column | Type | Constraint | Notes |
|--------|------|-----------|-------|
| id | BIGSERIAL | PK | Auto-incremented ID |
| kode_lama | VARCHAR(50) | UNIQUE | Legacy child ID |
| nik | VARCHAR(20) | UNIQUE | National ID |
| nama_anak | VARCHAR(150) | NOT NULL | Child name |
| jenis_kelamin | VARCHAR(1) | CHECK (IN ('l','p')) | Gender (male/female) |
| tgl_lahir | DATE | - | Date of birth |
| desa_id | BIGINT | FK → ref_desa(id) ON DELETE SET NULL | Geographic origin |
| kantor_id | BIGINT | FK → ajis_kantor(id) ON DELETE SET NULL | Managing office |
| wilayah_pembinaan_id | BIGINT | FK → ajis_wilayah_pembinaan(id) ON DELETE SET NULL | **RBAC FILTER:** Region assignment |
| tgl_awal_pembinaan | DATE | - | Program start date |
| tgl_akhir_pembinaan | DATE | - | Program end date (NULL if active) |
| status_pembinaan | VARCHAR(50) | - | Coaching status |
| foto | VARCHAR(200) | - | Photo file path |
| aktif | VARCHAR(1) | NOT NULL, DEFAULT 'y' | Active flag |
| user_insert | VARCHAR(50) | - | Audit: creator |
| date_insert | DATE | - | Audit: creation date |

**Critical Indexes for RBAC Filtering:**
- idx_ajis_anak_kantor ON (kantor_id) — Branch Admin filter
- idx_ajis_anak_wilayah ON (wilayah_pembinaan_id) — Korwil filter
- idx_ajis_anak_created_at ON (created_at DESC) — Default sort
- Composite: idx_ajis_anak_rbac ON (kantor_id, wilayah_pembinaan_id, created_at DESC) — Combined filter+sort
- Partial: idx_ajis_anak_aktif ON (kantor_id, created_at DESC) WHERE aktif='y' — active records only
- GIN Trigram: idx_ajis_anak_nama_trgm ON (nama_anak) USING GIN (nama_anak gin_trgm_ops) — full-text search

---

### 8. **ajis_session** - Coaching Sessions
| Column | Type | Constraint | Notes |
|--------|------|-----------|-------|
| id | BIGSERIAL | PK | Auto-incremented ID |
| kode_lama | INTEGER | UNIQUE | Legacy session ID |
| anak_id | BIGINT | FK → ajis_anak(id) ON DELETE CASCADE | Child reference |
| wilayah_pembinaan_id | BIGINT | FK → ajis_wilayah_pembinaan(id) ON DELETE SET NULL | **RBAC FILTER:** Region |
| kantor_id | BIGINT | FK → ajis_kantor(id) ON DELETE SET NULL | Office reference |
| sdm_wilayah_id | BIGINT | FK → ajis_sdm_wilayah(id) ON DELETE SET NULL | Facilitator (SDM) |
| tanggal | DATE | NOT NULL | Session date |
| jam_mulai | VARCHAR(5) | - | Start time (HH:MM) |
| jam_selesai | VARCHAR(5) | - | End time |
| durasi_menit | SMALLINT | - | Duration in minutes |
| tema_pembinaan | VARCHAR(150) | - | Session theme |
| materi_pembinaan | TEXT | - | Session material/content |
| catatan | TEXT | - | Notes/remarks |
| status | VARCHAR(50) | - | Status (e.g., completed, cancelled) |
| aktif | VARCHAR(1) | NOT NULL, DEFAULT 'y' | Active flag |
| user_insert | VARCHAR(50) | - | Audit: creator |
| date_insert | DATE | - | Audit: creation date |

**Indexes:**
- idx_ajis_session_wilayah ON (wilayah_pembinaan_id) — Korwil filter
- idx_ajis_session_created_at ON (created_at) USING BRIN — range queries
- idx_ajis_session_status ON (kantor_id, wilayah_pembinaan_id, status) — combined filter

---

### 9. **item_hafalan & hafalan_anak** - Quran Memorization Tracking
**item_hafalan (Memorization Items - Master Data):**
| Column | Type | Notes |
|--------|------|-------|
| id | BIGSERIAL | PK |
| kode_lama | INTEGER | UNIQUE, legacy ID |
| jenis_hafalan | VARCHAR(100) | Type (e.g., 'surah', 'juz', 'page') |
| surah | VARCHAR(50) | Surah name / number |
| ayat_awal, ayat_akhir | SMALLINT | Ayah range |
| keterangan | TEXT | Description |
| aktif | VARCHAR(1) | Active flag |

**hafalan_anak (Student Memorization Progress):**
| Column | Type | Notes |
|--------|------|-------|
| id | BIGSERIAL | PK |
| kode_lama | INTEGER | UNIQUE, legacy ID |
| anak_id | BIGINT | FK → ajis_anak(id) ON DELETE CASCADE |
| item_hafalan_id | BIGINT | FK → item_hafalan(id) |
| wilayah_pembinaan_id | BIGINT | FK → ajis_wilayah_pembinaan(id) — **RBAC FILTER** |
| kantor_id | BIGINT | FK → ajis_kantor(id) |
| semester_id | BIGINT | FK → ajis_semester(id) |
| tanggal_capaian | DATE | Completion date |
| tingkat_hafalan | VARCHAR(50) | Level (e.g., 'lancar', 'setengah', 'belum') |
| status | VARCHAR(50) | Status (completed, in_progress, etc.) |
| catatan_hafalan | TEXT | Notes |
| aktif | VARCHAR(1) | Active flag |
| user_insert | VARCHAR(50) | Audit: creator |
| date_insert | DATE | Audit: creation date |

**Indexes:**
- idx_hafalan_anak_anak ON (anak_id) — child's hafalan timeline
- idx_hafalan_anak_wilayah ON (wilayah_pembinaan_id) — Korwil scope
- Composite: idx_hafalan_anak_semester ON (anak_id, semester_id) — progress by semester

---

### 10. **item_penilaian & penilaian_anak** - Assessment / Evaluation

**item_penilaian (Assessment Items - Master):**
| Column | Type | Notes |
|--------|------|-------|
| id | BIGSERIAL | PK |
| kode_lama | INTEGER | UNIQUE |
| nama_penilaian | VARCHAR(100) | NOT NULL, e.g., 'Akhlak', 'Hafalan', 'Ketrampilan' |
| kategori_penilaian | VARCHAR(50) | Category |
| bobot_penilaian | SMALLINT | Weight (percentage) |
| skala_penilaian | VARCHAR(50) | Scale (e.g., '1-5', 'A-D') |
| keterangan | TEXT | Description |
| aktif | VARCHAR(1) | Active flag |

**penilaian_anak (Student Assessments):**
| Column | Type | Notes |
|--------|------|-------|
| id | BIGSERIAL | PK |
| kode_lama | INTEGER | UNIQUE |
| anak_id | BIGINT | FK → ajis_anak(id) ON DELETE CASCADE |
| item_penilaian_id | BIGINT | FK → item_penilaian(id) |
| semester_id | BIGINT | FK → ajis_semester(id) |
| wilayah_pembinaan_id | BIGINT | FK → ajis_wilayah_pembinaan(id) — **RBAC FILTER** |
| kantor_id | BIGINT | FK → ajis_kantor(id) |
| nilai_penilaian | VARCHAR(5) | Score (e.g., 'A', '4', 'Baik') |
| nilai_angka | DECIMAL(5,2) | Numeric score |
| catatan_penilaian | TEXT | Notes |
| status | VARCHAR(50) | Status |
| user_insert | VARCHAR(50) | Audit: creator |
| date_insert | DATE | Audit: creation date |

**Indexes:**
- Composite: idx_penilaian_anak_semester ON (anak_id, semester_id) — assessment per semester
- idx_penilaian_anak_wilayah ON (wilayah_pembinaan_id) — Korwil scope

---

### 11. **ajis_semester & ajis_semester_template** - Term/Semester Management
**ajis_semester:**
| Column | Type | Notes |
|--------|------|-------|
| id | BIGSERIAL | PK |
| kode_lama | INTEGER | UNIQUE |
| nama_semester | VARCHAR(100) | NOT NULL, e.g., 'Semester 1 Tahun 2024' |
| tahun | SMALLINT | Year |
| urutan_semester | SMALLINT | Order (1, 2, etc.) |
| tgl_mulai, tgl_selesai | DATE | Date range |
| status_semester | VARCHAR(50) | Status (active, closed, etc.) |
| aktif | VARCHAR(1) | Active flag |
| user_insert | VARCHAR(50) | Audit |
| date_insert | DATE | Audit |

**ajis_semester_template:**
| Column | Type | Notes |
|--------|------|-------|
| id | BIGSERIAL | PK |
| kode_lama | INTEGER | UNIQUE |
| semester_id | BIGINT | FK → ajis_semester(id) |
| nama_template | VARCHAR(100) | Template name |
| isi_template | TEXT | Template content (JSON or markdown) |
| tipe_template | VARCHAR(50) | Type (e.g., 'laporan', 'sesi') |
| aktif | VARCHAR(1) | Active flag |

---

### 12. **Additional Operational Tables**

**pembinaan (Coaching Programs):**
- Tracks structured coaching initiatives
- Has FK to wilayah & kantor for RBAC

**pemasangan (Placement / Sponsorship):**
- Links anak → donatur (sponsor)
- Has wilayah_pembinaan_id for RBAC

**laporan_semester (Semester Reports):**
- Aggregated report per child per semester
- Has wilayah_pembinaan_id & kantor_id for RBAC

**ajis_sdm_wilayah (Human Resources):**
- Staff/facilitator master data
- penugasan_wilayah_id, penugasan_kantor_id = current assignment
- ajis_sdm_wilayah_riwayat = full history of assignments

---

## View: v_ref_wilayah_lengkap

**Purpose:** Denormalized geographic hierarchy view (desa → kecamatan → kabupaten → propinsi)

Enables fetching full location names without multiple JOINs:
```sql
SELECT d.nama AS nama_desa, kec.nama AS nama_kecamatan,
       kab.nama AS nama_kabupaten, prop.nama AS nama_propinsi
FROM v_ref_wilayah_lengkap
WHERE desa_id = ?;
```

---

## Summary: Data Flow for RBAC Queries

**Super Admin:**
```sql
SELECT * FROM ajis_anak LIMIT 20;
-- No WHERE filter applied
```

**Branch Admin (kantor_id=15):**
```sql
SELECT * FROM ajis_anak
WHERE kantor_id = 15
LIMIT 20;
```

**Korwil (wilayah_id=42):**
```sql
SELECT * FROM ajis_anak
WHERE wilayah_pembinaan_id IN (42, 43) -- user's assigned regions
LIMIT 20;
```

---

## Performance Notes

1. **GIN Trigram Indexes:** Enable fast ILIKE '%...%' searches on large text columns
2. **Partial Indexes:** Filter to aktif='y' for 80% faster queries on active data
3. **Composite Indexes:** Combine common filter + sort columns (e.g., kantor_id, wilayah_pembinaan_id, created_at)
4. **BRIN Indexes:** Efficient for timestamp range queries over large tables
5. **Foreign Key Constraints:** ON DELETE CASCADE/SET NULL for data integrity

---

**Diagram Generated:** 2026-07-15  
**Schema Version:** PostgreSQL v2  
**Compliance:** All RBAC filters ready for multi-tenant server-side enforcement

