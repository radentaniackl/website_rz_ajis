# AJIS Database Analysis - Comprehensive Schema Review

**Database:** sipc_ijf (MySQL)  
**System:** Anak Juara Information System (AJIS)  
**Last Updated:** 2026-07-08  
**Analysis Date:** 2026-07-14

---

## Executive Summary

The AJIS database manages a child sponsorship program operated by Rumah Zakat, tracking children (Anak), coaching sessions (Pembinaan), Quran memorization (Hafalan), evaluations (Penilaian), donor-child pairings (Pemasangan), and financial transactions. The schema uses MyISAM and InnoDB engines with inconsistent naming conventions, denormalization patterns, and numerous data quality issues that impact performance and maintainability.

---

## Database Tables Overview

### Core Tables (1-15)

---

## TABLE: `ajis_anak`

**Purpose**  
Master table storing all child/beneficiary profiles, including personal data, family information, educational status, registration details, and program eligibility.

**Columns** (130 columns total)
- `id_anak` (varchar 25, PK) — Unique child identifier
- `nik` (varchar 50, UNIQUE) — National ID (KTP)
- `nama_lengkap` (text) — Full name
- `nama_panggilan` (varchar 50) — Nickname
- `agama` (varchar 50) — Religion
- `jns_kel` (enum 'l','p') — Gender
- `tempat_lahir` (varchar 30) — Birth place
- `tgl_lahir` (date) — Date of birth
- `anak_ke` (tinyint) — Birth order
- `dari_saudara` (tinyint) — Number of siblings
- `alamat` (varchar 75) — Address
- Geographic fields (propid, kabid, camatid, desaid, nama_*) — Hierarchical location data (15+ columns)
- Education fields (jenjang_pendidikan, kelas, nama_sekolah, alamat_sekolah, semester, jurusan) — School info
- Higher ed fields (nama_pt, alamat_pt) — College information
- `no_rekening` (varchar 25) — Bank account number
- `foto` (text) — Photo path/URL
- Personal interests (nilai, pelajaran_favorit, jarak_rumah, alat_transportasi, hobi, prestasi)
- `no_kartu_keluarga` (varchar 25) — Family card number
- Program status fields (asnaf, status_ortu, status_survey, status_kelayakan, status_anak_juara, status_tersantuni, status_pinjam, status_mentor)
- Father info (nama_lengkap_ayah, alamat_ayah, propid_ayah, kabid_ayah, ..., pekerjaan_ayah, penghasilan_rata_rata_ayah, tanggal_kematian_ayah, penyebab_kematian_ayah) — 10+ columns
- Mother info (nama_lengkap_ibu, alamat_ibu, propid_ibu, ..., tanggal_kematian_ibu, penyebab_kematian_ibu) — 10+ columns
- Guardian info (nama_lengkap_wali, alamat_wali, propid_wali, ..., penghasilan_rata_rata_wali) — 10+ columns
- Contact & household (telp_yang_bisa_dihubungi, atas_nama, hubungan_kerabat, tinggal_bersama, nama_tinggal, penghasilan_tinggal, pekerjaan_tinggal)
- `id_wilayah_pembinaan` (int 2, FK) — Coaching region
- `kantor_id` (varchar 50, FK) — Office/branch
- `id_sdm` (varchar 50) — Coordinator ID
- `nama_mentor` (varchar 100) — Mentor name
- Dates (tgl_terdaftar, tgl_pengajuan) — Registration & application dates
- Legacy/meta fields (aktif, via_input, approval_ijf, oid_rz, nia_rfo_book, nama_rfo_book, tgl_peminjaman, tgl_expired, book_via, user_book, alumni_juara, juara)
- Reference fields (id_kantor_postgree, id_ijgs_anak, upload_gdrive, pemilik_rekening, nama_bank)

**Primary Key**  
`id_anak` (varchar 25)

**Foreign Keys**  
- `id_wilayah_pembinaan` → `ajis_wilayah_pembinaan.id_wilayah_pembinaan` (not enforced)
- `kantor_id` → `ajis_kantor.kantor_id` (not enforced)

**Indexes**
- `nik` (UNIQUE)
- `id_wilayah_pembinaan, kantor_id, id_sdm` (composite)
- `id_anak` (single)
- `kantor_id` (single)

**Relationships**
- 1:N with `ajis_pembinaan_baru` (sessions per child)
- 1:N with `ajis_hafalan` (memorization tests per child)
- 1:N with `ajis_penilaian` (evaluations per child)
- 1:N with `ajis_pemasangan` (sponsorships per child)
- 1:N with `ajis_penyaluran` (disbursements per child)
- 1:N with `ajis_input_donasi` (donations per child)

**Problems**

1. **Severe Denormalization** — Contains ~130 columns; stores parent/mother/guardian data that should be separate tables. Parent death dates, occupations, and income duplicated across three blocks (father/mother/guardian).

2. **Redundant Denormalized Columns** — Stores copies of `nama_wilayah`, `nama_kantor`, `id_wilayah_pembinaan`, `kantor_id` that should be looked up via join; increases update burden.

3. **Inconsistent NULL Placeholders** — Uses both `'0000-00-00'` dates and empty strings ('') to represent missing values; `tgl_peminjaman`, `tgl_expired` default to `'0000-00-00'`, inconsistent with NULL.

4. **Missing Foreign Key Constraints** — No enforced FK relationships; reliance on application-layer referential integrity (error-prone).

5. **Geographic Denormalization** — Stores complete location hierarchies (propid, kabid, camatid, desaid, and their text names) for child address, father address, mother address, and guardian address; should use `ref_propinsi`, `ref_kabupaten`, `ref_kecamatan`, `ref_desa` via FK.

6. **Duplicate Data Across Parents** — Fields like jenjang_pendidikan, kelas, nama_sekolah appear only for child, but parent/sibling education not structured; creates asymmetry.

7. **Legacy Unused Columns** — `nia_rfo_book`, `nama_rfo_book`, `tgl_peminjaman`, `tgl_expired`, `book_via`, `user_book` (book lending system) not used by rebuild; creates schema bloat.

8. **Charset Mismatch Risk** — `latin1` default for table; geographic/name data may be UTF-8, risking data corruption if not explicitly set column-wise.

9. **No Audit Trail** — No `user_update`, `date_update` columns; cannot track who modified what or when.

10. **Composite PK Weak** — PK is single column `id_anak`, but no uniqueness constraint on NIK beyond UNIQUE index (good), yet no temporal dimension (child could theoretically be re-registered).

---

## TABLE: `ajis_pembinaan_baru`

**Purpose**  
Records each coaching session held with children, including attendance, habit tracking (mandiri: prayer, charity, Quran recitation, helping parents), and material delivered.

**Columns** (55 columns)
- `id_row` (int 11 AUTO_INCREMENT) — Internal row number
- `id_pembinaan` (varchar 100) — Unique session identifier
- `tgl_pembinaan` (date) — Session date
- `semesterid` (varchar 2) — Semester ID
- `bulan` (varchar 2) — Month (01-12)
- `tahun` (varchar 4) — Year
- `jenis_pembinaan` (text) — Session type (Reguler, Edukasi Pekanan, P3A, Parenting)
- `p3a` (text) — P3A topic
- `judul_materi` (text) — Material title
- `id_anak` (varchar 16, FK) — Child ID
- `kehadiran` (varchar 15) — Attendance status (y/n/izin/alfa)
- `keterangan` (varchar 50) — Notes
- `id_wilayah_pembinaan` (varchar 16, FK) — Coaching region
- `user_insert` (varchar 100) — Entry user (literal empty string used as NULL)
- `date_insert` (timestamp, DEFAULT CURRENT_TIMESTAMP) — Entry timestamp
- `user_update` (varchar 100) — Update user (literal empty string '0000-00-00' used)
- `date_update` (date) — Update date
- Denormalized child data (kantor_id, jns_kel, asnaf, nik, nama_lengkap, jenjang_pendidikan, status_ortu, nama_lengkap_ayah, nama_lengkap_ibu, nama_lengkap_wali, nama_kantor, nama_wilayah) — 16 columns
- Presenter info (pemateri, pemateri_personal)
- Parent attendance (ortu_hadir) — For Parenting sessions
- Donor linkage (id_donatur, nama_donatur, program_donasi) — Links session to specific donor program
- Habit tracking/mandiri fields (pembiasaan_shalat_wajib, pembiasaan_tilawah, pembiasaan_sedekah, membantu_ortu) — Stored as int (0/1 or score)
- Recitation tracking (capaian_tilawah, capaian_tahfidz, capaian_tahfidz_hal) — varchar 50
- Display flag (tampil enum y/n)
- Entry method (via_input)
- Reference/migration fields (id_anak_postgree, id_pembinaan_postgree, id_kantor_postgree)

**Primary Key**  
`id_row` (AUTO_INCREMENT), but sessions grouped logically by `id_pembinaan`

**Foreign Keys**  
- `id_anak` → `ajis_anak.id_anak` (not enforced)
- `id_wilayah_pembinaan` → `ajis_wilayah_pembinaan.id_wilayah_pembinaan` (not enforced)

**Indexes**
- `id_pembinaan` (single)
- `id_anak, id_pembinaan, id_row, tgl_pembinaan` (composite) — Query by child and date
- `tgl_pembinaan` (single)
- `id_row, bulan, tahun` (composite)

**Relationships**
- N:1 with `ajis_anak` (many sessions per child)
- 1:N conceptually (one session header, multiple child rows per session)
- 1:N with `ajis_hafalan` (hafalan recorded same semester as session)

**Problems**

1. **Denormalization Anti-Pattern** — Stores child name, gender, education, parent names, kantor, wilayah for each session row; 16 columns copied from `ajis_anak`. Each session update requires re-copying this data; if child name corrected, old sessions not updated.

2. **Composite Session Header Issue** — Table mixes session-level data (jenis_pembinaan, p3a, judul_materi, tgl_pembinaan, pemateri) with child-attendance-level data (kehadiran, keterangan per child); no true normalization. Querying "who attended session X" requires GROUP BY and de-duplication.

3. **Mandatory Columns Stored as Placeholder Strings** — `user_update` and `date_update` stored as empty string and `'0000-00-00'` literals; should be NULL or NOT NULL with real values. Audit trail is effectively broken (line 319 in analysis document confirms `date_update` is `'0000-00-00'`).

4. **Habit Tracking Semantics Unclear** — Four columns (pembiasaan_shalat_wajib, pembiasaan_tilawah, pembiasaan_sedekah, membantu_ortu) store integer values (observed as 0 in seed data); unclear if these are presence/absence flags, scores, or counts. No column comments explain semantics.

5. **Donor Linkage Unused** — id_donatur, nama_donatur, program_donasi present but never read by rebuild API/UI (§15 in analysis document). Unclear if this is intentional feature-removal or oversight.

6. **MyISAM Engine, No Transactions** — Table uses MyISAM; if multi-child session creation/update loop fails mid-way (e.g., network drop), partial inserts remain with no rollback. Analysis document (§16) notes this risk exists.

7. **Charset Latin1 Risk** — Table default charset latin1, but jenis_pembinaan, judul_materi, keterangan may contain Indonesian diacritics; risk of mojibake if not explicitly UTF-8 at column level.

8. **Session ID Generation Not Documented** — id_pembinaan format is custom (e.g., '20170905092000001'); no documented pattern for uniqueness or parsing.

9. **Kehadiran Enum Inconsistent** — Observed values: 'y', 'n', 'izin', 'alfa'; schema shows only varchar 15, not enum; allows typos.

10. **No Soft Deletes** — No active/deleted flag; if session entered by mistake, must physically delete, losing referential data.

11. **Partial INDEX Coverage** — Composite index on (id_anak, id_pembinaan, id_row, tgl_pembinaan) is not optimal for queries filtering by (id_wilayah_pembinaan, tgl_pembinaan); requires separate index or table scan.

12. **Migration Fields Present** — id_anak_postgree, id_pembinaan_postgree, id_kantor_postgree suggest ongoing data sync to PostgreSQL; these are dead weight if migration complete.

---

## TABLE: `ajis_hafalan`

**Purpose**  
Tracks child's Quran memorization and religious recitation tests, recording which surahs/items mastered and test date.

**Columns** (10 columns)
- `id_anak` (varchar 20, PK) — Child ID
- `jenis` (varchar 50, PK) — Item type (category code: '2'=Quran surahs, '3'=prayer recitations, '4'=selected du'a)
- `konten_uji` (varchar 100, PK) — Item name (e.g., 'Al-Fatihah', 'Akan Tidur')
- `tgl_pengujian` (date) — Test/mastery date
- `tgl_insert` (datetime) — Record insertion timestamp
- `keterangan` (text) — Notes
- `semesterid` (varchar 2) — Semester reference
- `id_hafalan` (int 11, nullable) — Alternative ID
- `id_anak_postgree` (varchar 50, nullable) — PostgreSQL migration reference
- `id_item_hafalan` (varchar 50, nullable) — Reference to ajis_item_hafalan

**Primary Key**  
Composite: (id_anak, konten_uji) — Child can test each item only once in this schema

**Foreign Keys**  
- `id_anak` → `ajis_anak.id_anak` (not enforced)
- `jenis` implicitly references concept (should be FK to item-type lookup)

**Indexes**  
None explicitly defined beyond PK.

**Relationships**
- N:1 with `ajis_anak` (many memorization records per child)
- Logical relationship to `ajis_item_hafalan` (via jenis, konten_uji name-match)

**Problems**

1. **Composite PK Prevents Retesting** — PK is (id_anak, konten_uji), which means a child cannot re-test the same item (e.g., if failed first attempt or wants to attempt in different semester). To retry, would require DELETE then INSERT, or a separate retry column.

2. **Item Lookup by String Name** — konten_uji is varchar(100) name like 'Al-Fatihah'; no FK to ajis_item_hafalan.id. If item name spelled differently or typo'd, creates duplicate records. E.g., 'Al-Falaq' vs 'Al-Falak'.

3. **Missing Mastery Level** — No column for score/level achieved; only tgl_pengujian recorded. Schema cannot express "mastered level 3" vs "failed". Analysis document mentions hafalan levels (e.g., "Level 4 (Juz 30)") in penilaian table, but not here.

4. **Jenis Stored as String, Not Enum** — jenis is varchar(50), observed as '2', '3', '4'; should be enum or FK to a jenis_hafalan lookup table. Typo risk (e.g., '02' or '2.0').

5. **Redundant Date Fields** — tgl_pengujian and tgl_insert both present; tgl_insert likely timestamp of record creation. Unclear if tgl_pengujian is the date child was tested or date manually entered; no user audit trail.

6. **tgl_insert Defaults to Zero Date** — Seed data shows tgl_insert = '0000-00-00 00:00:00' (all rows), indicating placeholder; audit trail is broken.

7. **No Ordering for Multiple Semesters** — semesterid stored but no constraint; if same child tested same item in semesters 19 and 20, both records exist but PK prevents second insert. Schema inconsistency.

8. **No Performance Indexes on Joins** — No index on (semesterid, id_anak) to quickly retrieve "all items tested in semester 19"; full table scan required.

9. **ID Redundancy** — id_hafalan and id_anak_postgree suggest this table is being dual-keyed during migration; unclear if id_hafalan is used or dead.

10. **InnoDB But No Referential Integrity** — Table is InnoDB (supports transactions), but FKs not enforced; child delete does not cascade.

---

## TABLE: `ajis_penilaian`

**Purpose**  
Semester evaluations of child progress across religious, academic, and personal development dimensions (multiple rows per child per semester, one per item).

**Columns** (23 columns)
- `id_anak` (varchar 25, PK) — Child ID
- `nama_anak` (text) — Child name (denormalized)
- `nama_kantor` (varchar 50, FK implied) — Office name (denormalized)
- `nama_wilayah` (text) — Region name (denormalized)
- `kantor_id` (varchar 50, FK) — Office ID
- `id_wilayah_pembinaan` (varchar 50, FK) — Region ID
- `tgl_insert` (datetime) — Entry timestamp
- `semesterid` (varchar 2) — Semester reference
- `kategori` (varchar 100) — Category/aspect grouping (e.g., 'Aspek Cerdas', 'Catatan Pembinaan', 'Suara Anak Juara')
- `aspek` (varchar 100) — Item label/name (e.g., 'Hafalan Alquran', 'Kemampuan Membaca Alquran')
- `target` (text) — Expected goal
- `kondisi_awal` (text) — Baseline/starting condition
- `nilai_capaian` (varchar 50) — Achievement value/score
- `perkembangan_capaian` (text) — Development narrative/description
- `skor` (varchar 50) — Score (appears unused or redundant with nilai_capaian)
- `hasil_akhir` (text) — Final result description
- `keterangan` (text) — Notes/comments
- `via_input` (varchar 50) — Entry method (e.g., 'import')
- `tampil` (enum 'y','n') — Display flag
- `id_item_penilaian` (int 11) — FK to ajis_item_penilaian
- Migration fields: `id_anak_postgree`, `id_kantor_postgree`, `id_penilaian_postgree`, `id_item_postgree`, `id_kategori_postgree` (all nullable)

**Primary Key**  
Composite implicit: (id_anak, semesterid, id_item_penilaian) — But no explicit PK defined; table allows duplicates.

**Foreign Keys**  
- `id_anak` → `ajis_anak.id_anak` (not enforced)
- `kantor_id`, `id_wilayah_pembinaan` (not enforced)
- `id_item_penilaian` → `ajis_item_penilaian.id` (implied, not enforced)

**Indexes**  
None explicitly defined.

**Relationships**
- N:1 with `ajis_anak` (multiple evaluations per child)
- 1:N with `ajis_item_penilaian` (multiple items evaluated)

**Problems**

1. **No Primary Key Defined** — Table structure allows duplicate (id_anak, semesterid, id_item_penilaian) rows; no uniqueness guarantee. Can have 5 identical evaluation rows by mistake.

2. **Aspek as Item Identifier, Not Property** — Column `aspek` stores item names like 'Hafalan Alquran', 'Kemampuan Membaca Alquran' as free text, not as FK. If name misspelled or renamed, orphans old data. Analysis document (§14) flags this explicitly: "misleading column semantics" — aspek functions as item identifier but stored as text.

3. **Kategori Unused or Ambiguous** — Examples: 'Catatan Pembinaan' (coaching notes), 'Suara Anak Juara' (child voice/letter), 'Aspek Cerdas' (smart aspect); unclear classification scheme. Some rows have kategori='Aspek Cerdas', others have kategori='Catatan Pembinaan'; no foreign key to standardize.

4. **Redundant Denormalization** — Stores nama_anak, nama_kantor, nama_wilayah copied from ajis_anak; if child/office name changes, historical evaluations not updated.

5. **Ambiguous Score Columns** — Both `nilai_capaian` and `skor` present; seed data shows skor='0' for all rows, suggesting unused/placeholder. Unclear which is authoritative score.

6. **Missing Score Scale/Range** — No column defining what 0-100 or A-F scale means; nilai_capaian observed as '0' or text ('15 Surah', '7 Bacaan'). Mixed data types.

7. **Free-Text Descriptions as Structure** — perkembangan_capaian is text narrative (e.g., "Agung sangat aktif mengikuti pembinaan..."), not structured. Cannot aggregate or query easily; analysis must be manual reading.

8. **Timestamp Audit Trail Incomplete** — tgl_insert present, but no user_insert, user_update, date_update columns; cannot trace who entered evaluation or when last changed.

9. **Via_input='import' Everywhere** — Seed data shows all rows have via_input='import', suggesting bulk historical import; no distinction between manual entry and import.

10. **InnoDB Engine But No Transactions Observed** — Table is InnoDB, but application never uses transactions (confirmed in analysis §16); benefit of ACID not realized.

11. **Charset Latin1 Risk** — Table charset latin1; perkembangan_capaian contains Bahasa Indonesia text; UTF-8 not enforced.

12. **No Soft Deletes** — If evaluation entered incorrectly, must delete to remove; cannot mark as superseded.

---

## TABLE: `ajis_pemasangan`

**Purpose**  
Child-donor sponsorship pairing records, linking each child to a donor for a specific program and time period, with financial details (program price, distribution cost, balance).

**Columns** (60 columns)
- `id_pemasangan_baru` (varchar 100, PK) — Unique pairing ID
- `tahun` (char 4, PK) — Year of pairing
- `tgl_pemasangan` (date) — Pairing start date
- `tgl_pemberhentian_pemasangan` (date DEFAULT '0000-00-00') — Pairing end date
- `id_donatur` (varchar 30, PK) — Donor ID
- `id_anak` (varchar 25, PK) — Child ID
- `id_wilayah_pembinaan` (varchar 50) — Region
- `kantor_id` (varchar 50) — Office
- `program_donasi` (varchar 50) — Program name
- `id_program` (int 11, PK) — Program ID
- `harga_program` (double) — Program cost per period
- `harga_penyaluran` (int 11) — Distribution cost
- `keterangan_pemberhentian` (text) — Stop reason
- `status_pasangan` (enum 'y','n') — Active pairing
- `saldo_awal` (int 11) — Opening balance
- `status_saldo` (enum 'n','y') — Balance status
- `program_sebelumnya` (varchar 40) — Previous program if switched
- `user_insert`, `date_insert`, `user_update`, `date_update` — Audit
- Denormalized child & donor data (25+ columns): jns_kel, nama_anak, kelas, nama_donatur, nama_wilayah, nama_kantor, jenjang_pendidikan, asnaf, status_ortu, status_aj, id_sdm, nama_mentor, nik, status_mentor, no_rekening
- Linking to RFO (nia_rfo, nama_rfo)
- Status & control (tunda_penyaluran, id_naik_jenjang, via_input, history, user_stop, via_stop, alasan_aktif)
- Migration/audit (jcustid, id_pemasangan_new, id_*_postgree fields, id_*_erpwh fields)
- `saldo_akhir` (int 11, nullable) — Closing balance
- `status_saldo_akhir` (varchar 10, nullable)
- `updated_saldo` (datetime, nullable)

**Primary Key**  
Composite: (id_donatur, id_anak, id_program, id_pemasangan_baru, tahun) — Odd choice to include tahun in PK; allows same donor-child-program pairing in different years.

**Foreign Keys**  
- `id_anak` → `ajis_anak.id_anak` (not enforced)
- `id_donatur` → `donatur.did` (not enforced)

**Indexes**
- `id_donatur, id_anak` (composite) — Lookup pairings by donor/child
- `id_pemasangan_baru` (single)
- `kantor_id` (single)
- `id_anak` (BTREE)
- `status_pasangan` (single)
- `tahun` (single)

**Relationships**
- N:1 with `ajis_anak` (multiple pairings per child)
- N:1 with `donatur` (multiple pairings per donor)
- 1:N with `ajis_penyaluran` (multiple disbursements per pairing)
- 1:N with `ajis_input_donasi` (multiple donations per pairing)

**Problems**

1. **Composite PK Too Granular** — PK includes both id_pemasangan_baru (globally unique identifier) AND (id_donatur, id_anak, id_program, tahun). This means the table can be queried via either the surrogate key or the semantic key; redundancy and query confusion.

2. **Massive Denormalization** — 25+ columns copied from ajis_anak, ajis_kantor, ajis_wilayah_pembinaan; includes jns_kel, nama_anak, kelas, jenjang_pendidikan, asnaf, status_ortu, nik, no_rekening, etc. Each pairing update requires data re-copy; if child name corrected, historical pairings not updated.

3. **Zero-Date Placeholders** — tgl_pemberhentian_pemasangan defaults to '0000-00-00'; should be NULL to indicate active pairing. Querying "active pairings" requires `WHERE tgl_pemberhentian_pemasangan = '0000-00-00' OR tgl_pemberhentian_pemasangan IS NULL`, inefficient and error-prone.

4. **Status Redundancy** — Both status_pasangan and tgl_pemberhentian_pemasangan indicate pairing end; if status_pasangan='n' but tgl_pemberhentian_pemasangan='0000-00-00', data inconsistency.

5. **Balance Columns Unclear** — saldo_awal, status_saldo, saldo_akhir present; updated_saldo timestamp only on some rows. It's unclear whether balance is updated with each disbursement or periodically. No column comments explain semantics.

6. **MyISAM Engine (Old)** — Table uses MyISAM; no transaction support. Complex multi-row updates (e.g., pairing + disbursement) not atomic.

7. **Charset Latin1** — Text fields (keterangan_pemberhentian, program_sebelumnya, program_donasi) use latin1; Indonesian characters may corrupt.

8. **No Soft Delete** — If pairing entered by error, must physically delete; referential penyaluran/donasi records remain orphaned or cascade-deleted.

9. **RFO Linkage Optional** — nia_rfo, nama_rfo nullable; pairing may have no RFO link, unclear if intentional.

10. **Audit Trail Incomplete** — user_update and date_update always literal empty string/'0000-00-00'; cannot trace who stopped pairing or when.

11. **Unused/Dead Fields** — id_pemasangan_new, history, via_stop, alasan_aktif suggest historical edits or migration; if migration complete, these are schema bloat.

12. **No Temporal Versioning** — If child/donor details change mid-pairing, historical correctness lost; no way to query "what was child's grade when pairing started?"

---

## TABLE: `ajis_wilayah_pembinaan`

**Purpose**  
Master list of coaching regions/areas, each tied to an office and containing geographic/location data.

**Columns** (17 columns)
- `id_wilayah_pembinaan` (int 2, PK) — Region ID (small range 1-999)
- `nama_wilayah` (text, UNIQUE) — Region name (e.g., 'Tallo_Rappokalling')
- `alamat_wilayah` (text) — Region address/meeting location
- `kantor_id` (varchar 50, FK) — Parent office
- `nama_kantor` (text) — Office name (denormalized)
- `status_approve` (varchar) — Approval status
- Geographic fields (propid, nama_propinsi, kabid, nama_kabupaten, camatid, nama_kecamatan, desaid, nama_desa) — 8 columns linking to ref_* tables
- `aktif` (enum 'y','n') — Active flag
- `user_insert`, `date_insert`, `user_update`, `date_update` — Audit

**Primary Key**  
Composite: (id_wilayah_pembinaan, nama_wilayah)

**Foreign Keys**  
- `kantor_id` → `ajis_kantor.oid` or `kantor.oid` (not enforced; type mismatch: varchar 50 vs int/varchar)
- Geographic fields implicitly reference ref_* tables (not enforced)

**Indexes**
- Composite PK (id_wilayah_pembinaan, nama_wilayah)
- `nama_wilayah` (UNIQUE)

**Relationships**
- N:1 with `ajis_kantor` (multiple regions per office)
- 1:N with `ajis_anak` (children assigned to region)
- 1:N with `ajis_pembinaan_baru` (sessions in region)

**Problems**

1. **Redundant Primary Key** — PK is (id_wilayah_pembinaan, nama_wilayah), but id alone should be unique and sufficient; nama_wilayah has its own UNIQUE index. Two unique identifiers unnecessary.

2. **Small ID Range** — id_wilayah_pembinaan is int(2), limiting to ~99 regions; 652 regions created (AUTO_INCREMENT=652), overflow risk or type mismatch.

3. **Denormalized Office Name** — nama_kantor stored; if office renamed, regions not auto-updated.

4. **Geographic Denormalization** — Stores propid, nama_propinsi, kabid, nama_kabupaten, etc.; should use FK to ref_propinsi → ref_kabupaten → ref_kecamatan → ref_desa. Copying text names duplicates and risksinconsistency.

5. **Null Status Approval** — status_approve is varchar, observed as empty in seed; should be enum or have default 'pending'.

6. **Charset Latin1** — nama_wilayah, alamat_wilayah use latin1; Indonesian names/addresses may corrupt.

7. **Audit Trail Incomplete** — user_update, date_update often empty/'0000-00-00'; cannot trace changes.

8. **No Temporal Validity** — No tgl_awal_berlaku, tgl_akhir_berlaku to track when region was active; aktif flag only.

---

## TABLE: `ajis_kantor`

**Purpose**  
Office/branch master list for Rumah Zakat operations, organizing organizational hierarchy.

**Columns** (10 columns)
- `id` (int 11 AUTO_INCREMENT, PK) — Internal auto-increment ID
- `oid` (varchar 10, UNIQUE) — Organizational ID (e.g., '09-200', '09-194')
- `kantor` (varchar 30) — Office name
- `alamat` (varchar 50) — Address
- `no_telp` (varchar 15) — Phone
- `oid_parent` (varchar 10) — Parent org OID (hierarchical)
- `oid_parent_second` (varchar 10) — Second parent
- `oid_rz` (text) — Related RZ OID
- `jenis` (varchar 50) — Office type (e.g., 'anakjuara')
- `id_kantor_postgree` (int 11) — PostgreSQL reference

**Primary Key**  
`id` (AUTO_INCREMENT)

**Foreign Keys**  
- `oid_parent` → `ajis_kantor.oid` (hierarchical, not enforced)

**Indexes**
- `oid` (UNIQUE)
- `kantor` (single)
- `oid_parent` (single) — For hierarchy queries

**Relationships**
- 1:N with `ajis_anak` (children assigned to office)
- 1:N with `ajis_wilayah_pembinaan` (regions within office)
- 1:N with `ajis_user` (users assigned to office)

**Problems**

1. **Two Primary Keys** — PK is `id`, but `oid` is UNIQUE and serves as semantic key; querying by oid is more common than by id. Two keys create confusion and redundant indexes.

2. **Weak Type for Organizational IDs** — `oid` and `oid_parent` are varchar(10), but formatted like "09-200"; should use an organizational reference table or enforce pattern validation.

3. **Two Parent Columns** — Both oid_parent and oid_parent_second suggest complex hierarchy (e.g., dotted-line reporting), but no explanation. Unused if organization is purely tree-structured.

4. **Missing Depth/Level** — No `level` column to indicate regional vs. district vs. head office; must traverse parent chain at query time.

5. **Charset Latin1** — kantor, alamat may contain Indonesian names; UTF-8 not enforced.

6. **No Soft Delete** — If office closed, must delete; children/regions orphaned.

---

## TABLE: `ajis_user`

**Purpose**  
User account table for login credentials and role assignment (not a full user profile).

**Columns** (12 columns)
- `id_user` (int 11 AUTO_INCREMENT, PK)
- `username` (text) — Login username
- `password` (varchar 100) — Password hash (MD5 observed; legacy, weak)
- `nik` (int 13) — NIK (mostly '0' in seed)
- `id_kantor` (varchar 10) — Office assignment
- `nama_kantor` (varchar 30) — Office name (denormalized)
- `nama_wilayah` (varchar 50) — Region name (denormalized)
- `aktif` (enum 'y','n') — Active flag
- `user_insert` (varchar 50) — Creator
- `date_insert` (datetime) — Creation date
- `id_group_user` (int 11, FK) — User role/group
- `id_wilayah_pembinaan` (varchar 50, FK) — Assigned region

**Primary Key**  
`id_user` (AUTO_INCREMENT)

**Foreign Keys**  
- `id_group_user` → `ajis_group_user.id_group_user` (not enforced)
- `id_kantor` → `ajis_kantor.oid` (not enforced; type mismatch)
- `id_wilayah_pembinaan` → `ajis_wilayah_pembinaan.id_wilayah_pembinaan` (not enforced)

**Indexes**  
None explicitly defined (PK only).

**Relationships**
- N:1 with `ajis_group_user` (multiple users per role)
- Logical N:1 with `ajis_kantor` (users per office)

**Problems**

1. **Weak Password Hashing** — Observed hash format is MD5 (32 hex chars), a cryptographically broken hash. Analysis document (§17) recommends bcrypt/argon2 migration.

2. **No Username Uniqueness** — username is text, no UNIQUE constraint; multiple users could have same username, leading to login ambiguity.

3. **No Email Column** — No email; cannot send password reset or notifications.

4. **Denormalized Office/Region Names** — nama_kantor, nama_wilayah stored; if office renamed, user profile not auto-updated.

5. **NIK Often Null/Zero** — Observed nik='0' in seed data; field not used. Removing would reduce schema surface.

6. **No Last Login Tracking** — No tgl_last_login, last_ip, failed_login_attempts; cannot detect inactive accounts or suspicious access.

7. **No Rate Limiting or Brute-Force Protection** — Application-layer check missing (analysis §14 flags this).

8. **No Password Change Tracking** — No tgl_password_changed; cannot enforce "change password every 90 days" policy.

9. **No User Profile Separation** — Name, contact, photo belong in separate user_profile table; this table mixes auth (username, password) with admin (id_kantor, id_group_user).

10. **InnoDB Engine Unused** — Table is MyISAM; no benefit, no change.

---

## TABLE: `ajis_group_user`

**Purpose**  
User role/group definitions for access control (Super Admin, Branch Admin, Coordinator).

**Columns** (4 columns)
- `id_group_user` (int 11 AUTO_INCREMENT, PK) — Role ID
- `group_user` (varchar 20) — Role name (e.g., 'SpMD', 'SpMD Cabang')
- `keterangan` (varchar 100) — Description
- `aktif` (enum 'y','n') — Active flag

**Primary Key**  
`id_group_user`

**Foreign Keys**  
None.

**Indexes**  
None (PK only).

**Relationships**
- 1:N with `ajis_user` (multiple users per group)

**Problems**

1. **No Permissions Defined** — Table stores role names only (e.g., 'SpMD', 'Kontroler', 'SMD'); no feature/page-level permissions attached. Access control enforced via data scoping in code, not via role-permission mapping (analysis §13).

2. **Incomplete Role List** — Seed data shows only 5 of 11 possible groups (id 1, 2, 8, 5, 6); ids 3, 4, 7, 9, 10, 11 missing. Suggests historical roles deleted.

3. **Semantic Gaps** — Role names use organizational jargon (SpMD=Pusat, PMD Cabang, Kontroler, SMD) without clear mapping to AJIS functions. Analysis document mentions 3 AJIS roles (Super Admin, Branch Admin, Korwil) but this table has different names.

4. **No Audit Trail** — No user_insert, date_insert tracking who created role.

---

## TABLE: `ajis_sdm_wilayah`

**Purpose**  
Coordinator/volunteer staff (SDM=Sumber Daya Manusia) assigned to coaching regions.

**Columns** (27 columns)
- `id_sdm` (int 16 AUTO_INCREMENT, PK) — Coordinator ID
- `nik` (varchar 50, UNIQUE) — National ID
- `nama_lengkap` (varchar 30) — Name
- `jenis_kelamin` (enum 'l','p') — Gender
- `alamat` (varchar 50) — Address
- Geographic fields (propid, nama_propinsi, kabid, nama_kabupaten, camatid, nama_kecamatan, desaid, nama_desa) — 8 columns
- `jenjang_pendidikan` (varchar 5) — Education level (e.g., 'SMA', 'S1')
- `tgl_bergabung` (date) — Join date
- `tgl_keluar` (date) — Exit date
- Contact (telp, hp, email)
- `keterangan` (varchar 50) — Notes
- `keaktifan_edukasi` (enum 'y','t') — Education activity status
- `foto` (varchar 100) — Photo filename
- `aktif` (varchar 10) — Active flag
- `user_insert`, `date_insert`, `user_update`, `date_update` — Audit

**Primary Key**  
`id_sdm`

**Foreign Keys**  
- Geographic fields implicitly reference ref_* tables (not enforced)

**Indexes**
- `nik` (UNIQUE)
- `id_sdm` (single)

**Relationships**
- 1:N with `ajis_anak` (children mentored by coordinator)
- 1:N with `ajis_pembinaan_baru` (sessions led by coordinator)
- 1:N with `ajis_jabatan_sdm` (coordinator may have multiple roles)

**Problems**

1. **Geographic Denormalization** — Stores propid, kabid, camatid, desaid + text names; should FK to ref_* tables.

2. **Two Active Flags** — Both `aktif` and `keaktifan_edukasi`; unclear distinction. Is koordinator aktif but educational activity inactive (on leave)?

3. **Charset Latin1** — nama_lengkap, alamat use latin1; Indonesian names may corrupt.

4. **Audit Trail Incomplete** — user_update, date_update often empty/'0000-00-00'.

5. **Foto Filename Only** — Stores filename, not path/URL; no indication where photos stored or served.

6. **jenjang_pendidikan varchar(5)** — Should be enum (SD, SMP, SMA, S1, S2, S3).

7. **No Soft Delete** — Coordinator deleted removes referential data; should use aktif='n' flag instead.

---

## TABLE: `ajis_semester`

**Purpose**  
Semester definitions and configuration (dates, associated images, report templates).

**Columns** (25 columns)
- `id` (int 11 AUTO_INCREMENT, PK) — Internal ID
- `semesterid` (varchar 50) — Semester code (e.g., '01', '02')
- `semester` (varchar 100) — Semester name (e.g., 'Januari - Juni 2014')
- `tgl_awal` (date) — Start date
- `tgl_akhir` (date) — End date
- `onprogress` (enum 'n','y') — Currently active
- Image/template fields (cover, cover_siswa, kata_pengantar, profil, kotak_profil_ceria, kotak_pembinaan_ceria, profil_siswa, kotak_pembinaan_siswa, keuangan, surat, bawah, kata_pengantar_siswa, bawah_siswa) — 15 text fields (filenames)
- Financial date ranges (tgl_awal_donasi, tgl_akhir_donasi, tgl_awal_saldo, tgl_akhir_saldo)
- `jenis` (varchar 50) — Type (ganjil/genap = odd/even semester)
- `tahun` (varchar 50) — Year
- `lapsem` (varchar 1) — Report flag

**Primary Key**  
`id`

**Foreign Keys**  
None.

**Indexes**
- `semesterid, semester` (composite)
- `tgl_awal, tgl_akhir` (composite) — For date range queries

**Relationships**
- 1:N with `ajis_penilaian` (evaluations per semester)
- 1:N with `ajis_hafalan` (memorization tests per semester)
- 1:N with `ajis_pembinaan_baru` (sessions per semester)

**Problems**

1. **Denormalized Cover/Template Filenames** — 15 text columns store filenames (e.g., '1_photo_2020-02-21_15-01-48.jpg'); should use a separate `semester_assets` table or file storage system. Makes schema brittle; if filenames change, must update table.

2. **File References Without Paths** — Filenames only, no directory/URL; implies external convention for file location.

3. **No File Validation** — No check that referenced files exist or are accessible.

4. **Redundant Financial Dates** — Both tgl_awal_donasi/tgl_akhir_donasi and tgl_awal_saldo/tgl_akhir_saldo; unclear which is authoritative for calculating fund balances.

5. **Jenis Stored as Text** — Should be enum (ganjil, genap).

6. **Lapsem Flag Ambiguous** — Varchar(1) with unclear meaning; should be enum or named column.

7. **Multiple Rows for Same Semesterid/Tahun** — Seed data (lines 911-917) shows ids 1-4 for semesters 01-02, then 3-4 repeated as 03-04; unclear if rows 3-4 are duplicates or different.

---

## TABLE: `ajis_penyaluran`

**Purpose**  
Disbursement/payment records, tracking when funds distributed to children's sponsors or bank accounts.

**Columns** (60+ columns)
- `id_row` (int 11 AUTO_INCREMENT) — Row number
- `id_penyaluran` (varchar 50) — Disbursement ID
- `id_pemasangan_baru` (varchar 100, FK) — Pairing reference
- `tgl_penyaluran` (date) — Disbursement date
- `id_pemasangan` (varchar 50) — Legacy pairing ID
- `id_anak` (varchar 16, FK) — Child
- Education & child status (jenjang_pendidikan, kelas, jns_kel, asnaf, nama_anak)
- Donor fields (id_donatur, nama_donatur)
- `id_sdm` (varchar 16, FK) — Coordinator
- Region/office (id_wilayah_pembinaan, id_kantor, nama_wilayah, nama_kantor)
- `program_donasi` (varchar 50) — Program
- Payment (nominal_penyaluran, nominal_hpp) — Amount and cost
- Dates (user_insert, date_insert, user_update, date_update)
- Period (bulan, tahun)
- Transaction reference (transid, detailid, id_input_donasi)
- `jenis` (varchar 50) — Disbursement type
- Status (status_akhir, status_tersalurkan) — enum 'y','n'
- Bank/account (no_rekening, nama_bank, pemilik_rekening)
- NIK/ID (nik)
- Geographic (tempat_lahir, no_kartu_keluarga, desaid, nama_desa, nama_kecamatan, nama_kabupaten, nama_propinsi)
- Entry method (via_input) — enum massal/single
- Address (alamat)
- Migration (id_pemasangan_postgree, id_kantor_postgree, id_penyaluran_postgree)

**Primary Key**  
Composite: (id_row, id_penyaluran)

**Foreign Keys**  
- `id_anak` → `ajis_anak.id_anak` (not enforced)
- `id_pemasangan_baru` → `ajis_pemasangan.id_pemasangan_baru` (not enforced)

**Indexes**
- `id_penyaluran` (single)
- `tgl_penyaluran, id_anak, id_donatur, id_sdm, id_wilayah_pembinaan, id_kantor, bulan, tahun` (composite)
- `id_pemasangan` (single)
- `id_pemasangan_baru` (single)
- `id_kantor` (single)

**Relationships**
- N:1 with `ajis_anak` (multiple disbursements per child)
- N:1 with `ajis_pemasangan` (multiple disbursements per pairing)

**Problems**

1. **Extreme Denormalization** — 60+ columns including denormalized child data (jenjang_pendidikan, kelas, jns_kel, asnaf, nama_anak), address fields (tempat_lahir, no_kartu_keluarga, desaid, nama_desa, …), and organization info (nama_wilayah, nama_kantor). Each disbursement row copies this snapshot; if child address changes, historical disbursements show outdated address.

2. **Two Pairing IDs** — Both id_pemasangan (legacy) and id_pemasangan_baru (current); unclear when legacy vs. new used. Query confusion.

3. **Composite PK Odd Choice** — PK (id_row, id_penyaluran) where id_row is AUTO_INCREMENT (row number) and id_penyaluran is semantic key; id_penyaluran alone should be unique.

4. **MyISAM Engine** — No transactions; multi-row disbursement updates not atomic.

5. **Status Redundancy** — Both status_akhir and status_tersalurkan track disbursement completion; unclear if they mean the same thing or different stages.

6. **NIL or Empty Placeholders** — Observed empty id_anak, id_donatur in seed (lines 461-465); causes foreign key issues if enforced.

7. **Geographic Denormalization Extreme** — Stores individual propinsi, kabupaten, kecamatan, desa text for each disbursement; should FK to child record.

8. **Account Owner Info** — no_rekening, pemilik_rekening, nama_bank stored per disbursement; if account changes, historical disbursements not updated. Should FK to child's bank account record.

9. **Via_input enum Misleading** — 'massal' (bulk) vs. 'single' only distinguishes input method, not actual row count; single row marked 'massal' is possible.

---

## TABLE: `ajis_input_donasi`

**Purpose**  
Donation transaction input records, tracking donor contributions linked to child sponsorships, for cash flow and balance calculations.

**Columns** (42 columns)
- `id_input_donasi` (int 11 AUTO_INCREMENT, PK) — Record ID
- `id_pemasangan_baru` (varchar 100) — Pairing reference
- `tgl_transaksi` (date) — Donation date
- `id_anak` (varchar 16, FK) — Child
- `id_donatur` (varchar 16, FK) — Donor
- `program_donasi` (varchar 50) — Program
- `qty` (int 11) — Quantity
- `pilihan_donasi` (double) — Donation choice/option amount
- `nominal_donasi` (double) — Actual donation amount
- Period (bulan, tahun)
- Audit (user_insert, date_insert, user_update, date_update)
- Reference (transid, detailid)
- Office/region (kantor_id, id_wilayah_pembinaan)
- `jenis` (enum 'trans','saldo') — Transaction or balance correction
- Child denormalized (jenjang_pendidikan, jns_kel, asnaf, nik, nama_anak)
- Donor denormalized (nama_donatur)
- Region/office denormalized (nama_wilayah, nama_kantor)
- Period & program (periode, id_program)
- Entry method (via_input)
- CRM reference (jcustid)
- Legacy pairing (id_pemasangan, id_pemasangan_new)
- Migration (id_transaksi_postgree, id_pemasangan_postgree, id_anak_postgree, id_donatur_postgree, id_program_postgree)

**Primary Key**  
`id_input_donasi` (AUTO_INCREMENT)

**Foreign Keys**  
- `id_anak` → `ajis_anak.id_anak` (not enforced)
- `id_donatur` → `donatur.did` (not enforced)

**Indexes**
- `id_anak, id_donatur, bulan, tahun, kantor_id, id_pemasangan_baru, id_wilayah_pembinaan` (composite)

**Relationships**
- N:1 with `ajis_anak` (multiple donations per child)
- N:1 with `donatur` (multiple donations per donor)
- 1:N with `ajis_penyaluran` (potentially linked to disbursement)

**Problems**

1. **Denormalization** — Stores child (jenjang_pendidikan, jns_kel, asnaf, nik, nama_anak) and donor (nama_donatur) info; should FK.

2. **Dual Pairing IDs** — Both id_pemasangan (legacy) and id_pemasangan_new; confusing.

3. **Ambiguous Jenis** — enum 'trans' vs 'saldo' (transaction vs. balance adjustment); seed data shows 'trans' only. Purpose of 'saldo' option unclear.

4. **InnoDB Engine Unused** — Has 500k+ rows but no transaction-level operations observed in code.

5. **Date Audit Incomplete** — date_update often '0000-00-00'; no user_update.

6. **Periode Redundant** — Both bulan/tahun and periode (e.g., 'ganjil'); redundant representations.

7. **Qty & Pilihan_donasi Ambiguous** — qty could mean "number of units" or "number of installments"; pilihan_donasi could mean "donor chose this amount" vs. "actual nominal_donasi". Semantics unclear.

---

## TABLE: `donatur`

**Purpose**  
Donor/sponsor master data, including personal info, contact, banking, and RFO (fundraiser) assignment.

**Columns** (54 columns)
- `did` (varchar 30, PK) — Donor ID
- Name & identity (nama_lengkap, nama_publikasi, tgl_lahir)
- Address (alamat_lengkap, alamat_silaturahmi)
- Geographic (camatid, kabid, propid)
- CRM (`jcustid`) — Customer ID
- Status (enum 'd','oc','upz','m','doc','dupz','dm','ocm','upzm','docm','dupzm') — Donor status (unclear codes)
- `tgl_registrasi` (date) — Registration date
- `aktif` (enum 'y','n','p') — Active flag
- Communication (kirim_sms, telp, fax, hp, email, website)
- Verification (verifikasi1, verifikasi2) — Boolean flags
- `jenis_kelamin` (enum 'l','p','t') — Gender
- Domicile & silaturahmi (kecamatan_domisili, camatid_silaturahmi, kecamatan_silaturahmi)
- Contact person (nama_kontak, telp_kontak, email_kontak, jabatan_kontak) — For organization
- Banking (nama_bank, no_rek)
- Organization assignment (omid_donatur, oid_donatur, kantor_donatur, nia_rfo, nama_rfo, user_name)
- Engagement (tipe_pelayanan, user_insert, periode_rutinitas_transaksiid, sumber_informasi, jalur_komunikasi, user_update, tgl_update)
- Admin (tag, npwp, cat1, cat2, updated)
- Migration (id_donatur_postgree, id_erp_wh)

**Primary Key**  
`did` (varchar 30)

**Foreign Keys**  
- Geographic fields implicitly reference ref_* tables (not enforced)
- `nia_rfo` logical reference (not enforced)

**Indexes**
- `nama_lengkap, tgl_lahir, camatid, jcustid` (composite)
- `did` (single)
- `nia_rfo` (idx_nia_rfo)

**Relationships**
- 1:N with `ajis_pemasangan` (multiple sponsorships per donor)
- 1:N with `ajis_input_donasi` (multiple donations per donor)

**Problems**

1. **Opaque Status Codes** — Enum status has 11 values (d, oc, upz, m, doc, dupz, dm, ocm, upzm, docm, dupzm); no documentation of what each letter combination means. Suggests legacy system codes.

2. **Verification Flags Incomplete** — verifikasi1, verifikasi2 are bit fields; no clear meaning or dates of verification.

3. **Geographic Denormalization** — Stores geographic codes + silaturahmi (relationship visit) location separately; should normalize to location table.

4. **Two RFO Columns** — nia_rfo (RFO ID) and nama_rfo (RFO name); if RFO renamed, historical donors show old name.

5. **Contact Person Optional** — Some donors are individuals (jenis_kelamin set), others organizations (contact_person set); schema doesn't distinguish entity type.

6. **Charset Latin1** — Names, addresses use latin1; Indonesian characters may corrupt.

7. **Inactive Donor Records Never Deleted** — No soft delete flag; historical data kept but clutters active queries.

8. **No Donor Segment/Category** — cat1, cat2 present but seed data empty; purpose unclear.

---

## Reference Tables (Geographic Master Data)

### TABLE: `ajis_propinsi`, `ref_propinsi`

**Purpose**  
Province/state master list for Indonesia. Duplicate tables: `ajis_propinsi` and `ref_propinsi`.

**Columns** (propid, propinsi, ibukota, aktif)

**Problems**
- **Duplicate Tables** — Both `ajis_propinsi` and `ref_propinsi` exist with identical schema; used inconsistently throughout database. One should be removed.
- **Charset Latin1** — propinsi names use latin1.

---

### TABLE: `ajis_wilayah_pembinaan` vs. `ref_kecamatan`

**Note:** Geographic hierarchy uses both AJIS-prefixed tables (ajis_propinsi, ajis_wilayah_pembinaan) and ref_* tables (ref_propinsi, ref_kabupaten, ref_kecamatan, ref_desa). Mixed usage creates inconsistency.

---

## TABLE: `ajis_item_hafalan`

**Purpose**  
Lookup table for memorization items (114 surahs, 10 prayer recitations, 14 du'as).

**Columns** (3 columns)
- `id` (int 11 AUTO_INCREMENT, PK)
- `jenis` (int 11) — Item type (2=Quran, 3=prayer, 4=du'a)
- `konten` (varchar 100 utf8mb4) — Item name (e.g., 'Al-Fatihah')

**Problems**
- **Jenis as Numeric String** — Stored as int but meaning hardcoded (2, 3, 4); should be enum or FK to jenis_hafalan table.
- **Charset Mismatch** — konten column uses utf8mb4, but table default is latin1; inconsistent.

---

## TABLE: `ajis_item_penilaian`

**Purpose**  
Lookup table for evaluation items (religious, academic, personal development).

**Columns** (6 columns)
- `id` (int 11 AUTO_INCREMENT, PK)
- `item_penilaian` (text) — Item name
- `parent_id` (varchar 100) — Hierarchical parent
- `is_parent` (varchar 1) — Flag (y/n)
- `jenis` (varchar 100) — Type (e.g., 'anakjuara')
- `target` (text) — Expected goal

**Problems**
- **Hierarchical Structure Unclear** — parent_id is text, not FK; is_parent flag is varchar(1), should be tinyint or boolean.
- **Jenis All 'anakjuara'** — Seed data shows all jenis='anakjuara'; column unused or redundant.

---

## TABLE: `ajis_group_user`

(See earlier detailed analysis.)

---

## TABLE: `ajis_jabatan_sdm`

**Purpose**  
Coordinator role/position assignment within organizational structure.

**Columns** (10 columns)
- `id_wilayah_pembinaan` (varchar 16, PK) — Region
- `kantor_id` (varchar 50, PK) — Office
- `id_jabatan_sdm` (int 16 AUTO_INCREMENT, PK) — Role ID
- `id_sdm` (varchar 16, FK) — Coordinator
- `keaktifan_edukasi` (enum 'y','t') — Active in education
- `id_fungsi_struktur` (varchar 16) — Organizational function (not a table)
- `user_insert`, `date_insert`, `user_update`, `date_update` — Audit

**Problems**
- **Three-Column Composite PK** — (id_wilayah_pembinaan, kantor_id, id_jabatan_sdm) forces role to be tied to region/office; should be (id_sdm, id_jabatan_sdm) or use FK separately.
- **id_fungsi_struktur** — Stored as varchar, no reference table; lookup data missing.
- **Audit Trail Incomplete** — Often empty/'0000-00-00'.

---

## TABLE: `ajis_opname`

**Purpose**  
Inventory accounting (opname) records for semester balance reconciliation per child-donor pairing.

**Columns** (25 columns)
- `tahun` (year, PK) — Year
- `id_anak`, `id_donatur`, `program_donasi`, `id_program`, `id_pemasangan_baru` (PK) — Pairing reference
- `saldo_awal_ganjil`, `saldo_akhir_ganjil` — Odd semester balance
- `tupo_jan_jun`, `date_opname_ganjil`, `user_opname_ganjil` — Odd semester accounting
- `saldo_awal_genap`, `saldo_akhir_genap` — Even semester balance
- `tupo_jul_des`, `date_opname_genap`, `user_opname_genap` — Even semester accounting
- `user_input`, `id_kantor`, `updated`, `keterangan`, `user_update`, `jcustid`, `id_pemasangan_new`

**Problems**
- **Composite PK Too Broad** — Includes too many columns; semantic key should be (tahun, id_pemasangan_baru) only.
- **Tupo Columns** — Unclear what TUPO means; no documentation.
- **Semester-Specific Columns** — Separate ganjil/genap columns; should use separate rows with semesterid column for normalization.

---

## View Tables

The database includes several views (not base tables):

- `ajis_view_rekap_penilaian` — Aggregated evaluation report
- `ajis_view_resume_penilaian` — Evaluation summary
- `ajis_view_rfo` — Fundraiser aggregation
- `ajis_view_saldo_anak_habis_by_rfo` — Balance reconciliation
- `ajis_view_saldo_anak_urgent_by_rfo` — Urgent balance alerts
- `ajis_view_selisih_tgl_donasi` — Donation date difference calculations
- `ajis_view_selisih_transaksi_donasi` — Transaction vs. donation reconciliation
- `ajis_view_transaksi_by_donatur_inserted` — Donor transaction report

These views are computationally expensive (complex JOINs, no materialization); used only for reporting, not transactional queries.

---

## Cross-Cutting Issues

### 1. Missing Foreign Key Constraints
**Severity: HIGH**
- All FK relationships are application-enforced only; database does not validate referential integrity.
- Child deletion does not cascade to penyaluran, penilaian, hafalan.
- Deleting donatur leaves orphaned pemasangan and input_donasi records.
- **Impact:** Data corruption risk, inconsistent state, debugging difficulty.

### 2. Charset Inconsistency
**Severity: MEDIUM**
- Table default charset is latin1 (Western European), but content is Bahasa Indonesia with diacritics (ä, ö, ü, etc.).
- Some columns explicitly utf8mb4 (ajis_item_hafalan.konten), creating inconsistency.
- **Impact:** Character data corruption, mojibake (display gibberish), if not carefully managed.

### 3. Denormalization Overload
**Severity: HIGH**
- Core tables (ajis_anak, ajis_pembinaan_baru, ajis_pemasangan, ajis_penyaluran) copy denormalized snapshots (names, addresses, phone numbers).
- Update any child/office/donor name requires updating multiple tables or accepting historical inaccuracy.
- **Impact:** Data consistency burden, query complexity, storage bloat, maintenance risk.

### 4. Null/Empty Value Inconsistency
**Severity: MEDIUM**
- Null values represented as literal empty strings (''), '0000-00-00' dates, or actual NULL.
- No standard convention; querying for "missing" data requires multiple conditions (WHERE col IS NULL OR col = '' OR col = '0000-00-00').
- **Impact:** Query errors, missed data, performance degradation.

### 5. Audit Trail Broken
**Severity: HIGH**
- Most tables have user_update, date_update columns but populate with empty strings or '0000-00-00'.
- Analysis document (§319) confirms `user_update` written as literal empty string; date_update='0000-00-00'.
- No reliable change history; cannot trace who modified what or when.
- **Impact:** Compliance failure, debugging difficulty, no recourse for data disputes.

### 6. Mixed PK Strategies
**Severity: MEDIUM**
- Some tables use surrogate AUTO_INCREMENT keys, others use semantic composite keys.
- Some tables have both (e.g., ajis_pemasangan: id_row + id_pemasangan_baru + tahun + id_donatur + id_anak + id_program).
- **Impact:** Query ambiguity, performance unpredictability.

### 7. Engine Inconsistency
**Severity: LOW-MEDIUM**
- Most AJIS tables use MyISAM (no transaction, no FK support); some use InnoDB (supports transactions, FKs).
- ajis_pembinaan_baru is MyISAM; multi-child session updates not atomic (analysis §328).
- **Impact:** No transactional safety, partial write risk.

### 8. Duplicate/Dead Columns
**Severity: LOW-MEDIUM**
- Many `id_*_postgree` columns suggest ongoing migration to PostgreSQL; if migration complete, these are dead weight.
- Some columns always empty in seed (e.g., skor in penilaian, jenis='anakjuara' in item_penilaian).
- **Impact:** Schema bloat, confusion, maintenance burden.

### 9. Weak Password Security
**Severity: HIGH**
- ajis_user.password stored as MD5 hash (cryptographically broken).
- Analysis document (§358) recommends bcrypt/argon2 migration.
- No password change tracking or rate limiting.
- **Impact:** Account compromise risk, brute-force vulnerability.

### 10. No Data Partitioning / Archive Strategy
**Severity: MEDIUM**
- Large tables (ajis_pembinaan_baru ~4.5M rows, ajis_input_donasi ~500k rows) not partitioned.
- No age-based archival (e.g., move sessions > 5 years old to archive table).
- **Impact:** Query performance degradation, backup/restore time, disk bloat.

---

## Data Quality Issues Observed

### Duplicate/Orphaned Records
- `ajis_opname` seed row with empty id_anak, id_donatur (line 461-465); violates implicit FK.
- ajis_hafalan has leading whitespace in id_anak values (' \n09200210073'); data corruption or ETL error.

### Inconsistent Statuses
- `ajis_pemasangan.status_pasangan` vs. tgl_pemberhentian_pemasangan could be out-of-sync.
- Multiple active flags (aktif, keaktifan_edukasi, onprogress) without clear semantics.

### Free-Text Overload
- perkembangan_capaian in penilaian is unstructured narrative; cannot query "children with achievement X".
- jenis_pembinaan in pembinaan_baru is free text (should be enum).

---

## Recommendations Summary

### Normalization
1. Separate parent/mother/guardian data into family_member table.
2. Create proper lookup tables for status codes, jenis, kategori values.
3. Split pembinaan_baru into session header + attendance detail.

### Referential Integrity
1. Add enforced FK constraints for all references.
2. Enable CASCADE deletes where appropriate (e.g., child deletion → sessions, hafalan, penilaian).

### Audit Trail
1. Implement real user_update, date_update in all tables.
2. Add optional audit log table capturing before/after for sensitive fields.

### Charset
1. Migrate all tables to utf8mb4 DEFAULT CHARSET.

### Indexes
1. Add composite indexes for common query patterns (e.g., (id_wilayah_pembinaan, tgl_pembinaan) for session queries).
2. Remove redundant single-column indexes if composite exists.

### Migration
1. Remove `id_*_postgree`, `id_*_erpwh` columns if PostgreSQL migration complete.

### Security
1. Migrate MD5 password hashes to bcrypt/argon2 (§358 strategy).
2. Add rate limiting on login endpoint.

### Data Cleanup
1. Purge orphaned donatur records (status='p').
2. Standardize NULL representation (use actual NULL, not empty string/'0000-00-00').
3. Fix leading/trailing whitespace in id fields.

---

## End of Database Analysis

**Database**: Operational (production), but schema redesign recommended before major scaling or new features.  
**Complexity**: High denormalization, weak referential integrity, inconsistent conventions.  
**Priority for Rebuild**: HIGH — PostgreSQL migration with proper normalization is justified (analysis §17).
