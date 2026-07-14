# AJIS PostgreSQL Architecture Redesign
## Database Schema Normalization & Consolidation Strategy

**Role:** PostgreSQL Database Architect  
**Current State:** MySQL with MyISAM/InnoDB, denormalized, no referential integrity  
**Target State:** PostgreSQL 14+, 3NF/BCNF normalized, transactional, auditable  

---

## EXECUTIVE SUMMARY

The current AJIS schema is a **denormalized, write-scattered design** optimized for legacy reporting and ad-hoc queries. It mixes operational data (who received what) with denormalized snapshots (what the child's name was at that moment), creating 15+ tables where **5-7 normalized core tables** would suffice.

**Key Findings:**
- **9 tables are 60% denormalized snapshots** of 3 core entities (children, sessions, transactions)
- **2 duplicate geographic hierarchies** (ajis_propinsi + ref_propinsi)
- **6 tables can be merged** with proper normalization
- **50+ denormalized columns** should move to historical snapshots or become lookups
- **Zero foreign key enforcement** enables silent data corruption

**Redesign Outcome:**
- Reduce from 15 operational tables → **8 normalized core tables**
- Add **2-3 audit/history tables** for temporal correctness
- Add **4 normalized lookup tables** for master data
- Total: ~13 tables (same count, but far cleaner)

---

## PART 1: ENTITY IDENTIFICATION & CURRENT PROBLEMS

### Core Business Entities (What Actually Exists)

1. **Person** (Child, Coordinator, Donor, Family Member)
2. **Organization** (Office, Region, Program)
3. **Sponsorship** (Child-Donor Pairing)
4. **Activity** (Coaching Session, Memorization Test)
5. **Evaluation** (Semester Assessment)
6. **Transaction** (Donation, Disbursement)
7. **Access Control** (User Account, Role)

### Current Table-to-Entity Mapping (The Problem)

| Business Entity | Current Tables | Issue |
|---|---|---|
| **Child** | ajis_anak | Single table (good), but stores parent/guardian data (should separate) |
| **Family Member** | *Embedded in ajis_anak* | 20+ columns for father, mother, guardian (denormalized) |
| **Coaching Session** | ajis_pembinaan_baru | Stores session + attendance + child snapshot (mixed levels) |
| **Memorization Test** | ajis_hafalan | Lookup + test record mixed; no test result/score |
| **Evaluation** | ajis_penilaian | Free-text items, no schema enforcement; category+aspek redundancy |
| **Sponsorship** | ajis_pemasangan | Stores pairing + child snapshot + financial (3 concepts) |
| **Transaction** | ajis_input_donasi + ajis_penyaluran | Two separate tables for donation input vs. disbursement |
| **Donation Flow** | *Scattered* | Input recorded in ajis_input_donasi, disbursed via ajis_penyaluran, reconciled in ajis_opname |
| **Inventory/Balance** | ajis_opname | Semester accounting, should be derived/cached, not stored |
| **Office** | ajis_kantor | Stores organization hierarchy (good), but referenced by id + oid (redundancy) |
| **Region** | ajis_wilayah_pembinaan | Duplicates ajis_kantor hierarchy + geographic denormalization |
| **Coordinator** | ajis_sdm_wilayah | Staff/volunteer, good structure but geographic denormalization |
| **User** | ajis_user | Auth + profile mixed; denormalized office/region |
| **Role** | ajis_group_user | Good; minimal data, but no permissions attached |
| **Geographic** | ajis_propinsi, ref_propinsi, ref_kabupaten, ref_kecamatan, ref_desa | Duplicate propinsi table; hierarchy partially implemented |
| **Lookup** | ajis_item_hafalan, ajis_item_penilaian, ajis_semester, ajis_periode_penilaian | Mixed; some should be enums, others should be proper lookup tables |

---

## PART 2: DUPLICATE & DENORMALIZED TABLE ANALYSIS

### Duplicate Tables

#### **Issue 1: Geographic Province Table (Duplicate)**

**Tables:** `ajis_propinsi` AND `ref_propinsi` (identical schema)

```
ajis_propinsi columns: propid, propinsi, ibukota, aktif
ref_propinsi columns:  propid, propinsi, ibukota, aktif
```

**Why This Is Wrong:**
- Two tables store identical data (Indonesia's 34 provinces).
- Insertion/update burden doubled; if one updated, must sync other.
- Foreign keys point to both (confusing); unclear which is authoritative.
- Seed data shows both tables seeded with same data (lines 819-824 vs 1561-1566).

**Architectural Fix:** **CONSOLIDATE → Single `province` lookup table**
- Keep one master: `geography.province` (propid PK, propinsi name, ibukota)
- Delete duplicate tables entirely.
- Update all FKs to point to single source.

**WHY:** A geographic hierarchy is immutable (never changes); one lookup table suffices. Having two introduces versioning risk.

---

#### **Issue 2: Office vs. Region Hierarchy (Partial Duplication)**

**Tables:** `ajis_kantor` (office hierarchy) AND `ajis_wilayah_pembinaan` (coaching region hierarchy)

**Current Structure:**
```
ajis_kantor:
  - id (PK), oid (UNIQUE semantic key), kantor (name), oid_parent (hierarchy)
  - Represents: RZ regional branches, central office, sub-offices

ajis_wilayah_pembinaan:
  - id_wilayah_pembinaan (PK), nama_wilayah, kantor_id (FK to ajis_kantor)
  - Represents: Coaching regions WITHIN an office
```

**The Problem:**
- ajis_kantor stores organizational hierarchy (organizational chart).
- ajis_wilayah_pembinaan stores geographic coaching areas (geographic mapping).
- They represent DIFFERENT concepts but overlap:
  - A region (wilayah) is assigned to an office (kantor).
  - A region duplicates geographic location (propid, kabid, camatid, desaid + names).
  - An office has oid, oid_parent (hierarchy); a region has no hierarchy.

**Root Cause:** Confusion between **organizational structure** (who reports to whom) and **operational geography** (where we operate).

**Architectural Fix:** **SEPARATE CONCERNS**

*New design:*
```
organization.office
  ├─ id (PK, UUID)
  ├─ code (oid, UNIQUE) [e.g., '09-200']
  ├─ name (e.g., 'RZ - Cimahi')
  ├─ parent_id (FK self-reference) [organizational hierarchy]
  ├─ office_type (enum: 'regional', 'branch', 'central')
  ├─ phone, email, address
  └─ timestamps

geography.coaching_region
  ├─ id (PK, UUID)
  ├─ name (e.g., 'Cimahi Tengah_Padasuka')
  ├─ office_id (FK to office) [which office operates this region]
  ├─ location_id (FK to geography.location) [geographic coordinates]
  ├─ active (boolean)
  └─ timestamps

(NO duplicate geographic fields in coaching_region; FK to location instead)
```

**WHY:** 
- Organizational structure changes (restructuring); geographic structure changes (population growth). Coupling them creates update complexity.
- Regions should be reusable: a region might be operated by multiple offices over time (history).
- This enables clean migration: "Region X was managed by office A, now by office B" (temporal correctness).

---

### Denormalized Tables Analysis

#### **Issue 3: Child Table — 130 Columns (Severe Denormalization)**

**Current:** `ajis_anak` (id_anak PK + 129 other columns)

**Denormalization Breakdown:**

| Concept | Current Columns | Issue |
|---|---|---|
| Child (self) | ~25 | name, gender, birthplace, birthdate, education, contact, religion, etc. |
| Father | ~10 | name, address (full hierarchy), job, income, death date, cause |
| Mother | ~10 | name, address (full hierarchy), job, income, death date, cause |
| Guardian | ~10 | name, address (full hierarchy), job, income, phone |
| Location (child's address) | ~8 | propid, kabid, camatid, desaid + full names (2x: child + father/mother/guardian) |
| Program status | ~8 | asnaf, status_ortu, status_survey, status_kelayakan, etc. |
| Household | ~5 | tinggal_bersama, nama_tinggal, penghasilan_tinggal, pekerjaan_tinggal |
| Organizational denorm | ~5 | id_wilayah_pembinaan, kantor_id, nama_wilayah, nama_kantor, id_sdm, nama_mentor |
| Legacy/reference fields | ~30 | nia_rfo_book, upload_gdrive, id_kantor_postgree, id_ijgs_anak, etc. |

**Why This Is Wrong:**

1. **Multiple Entities in One Row:** Child record stores data about 3+ family members, violating 1NF (first normal form). A child has at most 1 biological father, 1 mother, 1 guardian, but the schema treats them as fixed columns (not flexible).

2. **Update Anomaly:** If child's name corrected from "Ahmad" → "Ahmad Syahdan", this row updated. But **every child-session, child-transaction, child-evaluation row copied this name** as denormalized snapshot. If not all updated, historical inconsistency.

3. **Storage Waste:** Father/mother data is sparse (mostly NULL or ""; some children deceased parent, others unknown). Storing full columns for each parent wastes space.

4. **Organizational Denorm:** Storing id_wilayah_pembinaan, kantor_id, nama_wilayah, nama_kantor duplicates lookup. If coordinator reassigned to different region, child record not updated (stale organizational data).

5. **Geographic Duplication Extreme:** Stores propid + nama_propinsi + kabid + nama_kabupaten + camatid + nama_kecamatan + desaid + nama_desa for **child address, father address, mother address, guardian address**. This is 8 columns × 3 = 24 geographic columns (plus one set for child's school).

**Architectural Fix: DECOMPOSE INTO RELATED TABLES**

*New design:*
```
person.child
  ├─ id (PK, UUID)
  ├─ nik (UNIQUE)
  ├─ first_name, last_name, display_name
  ├─ date_of_birth
  ├─ gender (enum)
  ├─ birthplace_id (FK to geography.location)
  ├─ current_address_id (FK to geography.address)
  ├─ current_education_id (FK to person.education_record)
  ├─ registration_date, application_date
  ├─ active (boolean)
  └─ timestamps
  
person.family_member
  ├─ id (PK, UUID)
  ├─ child_id (FK to child)
  ├─ relation_type (enum: 'father', 'mother', 'guardian', 'sibling')
  ├─ first_name, last_name, [other name fields]
  ├─ date_of_birth (nullable)
  ├─ gender (enum)
  ├─ occupation
  ├─ address_id (FK to geography.address)
  ├─ income_estimate (nullable)
  ├─ death_date (nullable)
  ├─ death_cause (nullable)
  └─ timestamps

person.education_record
  ├─ id (PK, UUID)
  ├─ child_id (FK to child)
  ├─ level (enum: 'SD', 'SMP', 'SMA', 'PT')
  ├─ grade/class
  ├─ school_name
  ├─ school_id (FK to organization.institution, optional)
  ├─ start_date, end_date (optional)
  ├─ is_current (boolean)
  └─ timestamps

person.child_program_status
  ├─ id (PK, UUID)
  ├─ child_id (FK to child)
  ├─ program_status (enum: 'prospect', 'beneficiary', 'alumni')
  ├─ eligibility_status (enum: 'eligible', 'ineligible')
  ├─ survey_completed (boolean)
  ├─ asnaf (enum: 'yatim', 'piatu', 'dhuafa')
  ├─ parent_status (enum: 'lengkap', 'yatim', 'piatu', 'dhuafa')
  ├─ status_date, valid_from, valid_to (temporal)
  └─ timestamps
```

**WHY:**
- **Flexibility:** A child can have multiple family members; store as separate rows, not fixed columns.
- **Clean History:** If child's education level changes (SD → SMP), old record remains, new record added (temporal correctness).
- **Eliminates Updates:** Correcting child's name updates ONE row (person.child), not 10,000 session/transaction rows.
- **Single Responsibility:** Each table represents ONE concept (child, family member, education, program status).
- **Reduces Storage:** Geographic data stored once in geography.location; FKs reference it, not denormalized names in every table.

---

#### **Issue 4: Pembinaan (Session) Table — Mixed Levels (55 Columns)**

**Current:** `ajis_pembinaan_baru` (id_row PK, but logically: session header + child attendance + habit tracking)

**The Mixed Levels Problem:**

```
Session Level:
  ├─ id_pembinaan (unique session ID)
  ├─ tgl_pembinaan (session date)
  ├─ jenis_pembinaan (Reguler, P3A, Parenting)
  ├─ judul_materi (material title)
  ├─ pemateri (who taught)
  └─ [data SHARED across all children in that session]

Child-Attendance Level:
  ├─ id_anak (which child)
  ├─ kehadiran (y/n/izin/alfa) [per-child attendance]
  ├─ pembiasaan_shalat_wajib, pembiasaan_tilawah, pembiasaan_sedekah, membantu_ortu
  │  [habit tracking, PER child]
  ├─ ortu_hadir (for Parenting sessions, did parent attend)
  └─ [data UNIQUE to this child in this session]

Child Snapshot:
  ├─ nama_lengkap, jns_kel, nik, jenjang_pendidikan, asnaf, status_ortu, [16 columns]
  └─ [DENORMALIZED from ajis_anak at time of insertion]
```

**Why This Is Wrong:**

1. **Multiple Levels in One Table:** A single row represents "child's attendance in session," but stores both session-level data (date, material) and child-level data (attendance, habits). Querying "what session was held on 2023-01-15" requires GROUP BY id_pembinaan; querying "how many children attended" requires COUNT.

2. **Session Header Data Repeated:** If a session had 50 children, the date, material title, and presenter name are stored **50 times** (wasteful).

3. **Session Header Updates Problematic:** If session date wrong (2023-01-15 → 2023-01-16), all 50 rows must be updated, or historical data becomes inconsistent.

4. **Child Snapshot Stored:** Stores nama_lengkap, jns_kel, etc. at time of session. If child's name later corrected, session record shows outdated name (historical inconsistency if not desired, or required if we want "what was the child's name then" — but no flag indicates this is intentional).

5. **Habit Tracking Ambiguous:** pembiasaan_shalat_wajib, etc. stored as int (observed 0 in seed). Are these:
   - Presence flags (0/1)?
   - Scores (0-100)?
   - Counts (how many times)?
   - No schema clarifies.

**Architectural Fix: DECOMPOSE INTO HEADER + DETAIL**

*New design:*
```
activity.coaching_session
  ├─ id (PK, UUID)
  ├─ session_date
  ├─ session_type (enum: 'reguler', 'edukasi_mingguan', 'p3a', 'parenting')
  ├─ region_id (FK to geography.coaching_region)
  ├─ office_id (FK to organization.office)
  ├─ material_title
  ├─ material_id (FK to activity.coaching_material, optional)
  ├─ lead_instructor_id (FK to person.coordinator)
  ├─ description/notes
  ├─ is_cancelled (boolean)
  └─ timestamps

activity.session_attendance
  ├─ id (PK, UUID)
  ├─ session_id (FK to coaching_session)
  ├─ child_id (FK to person.child)
  ├─ attendance_status (enum: 'present', 'absent', 'excused', 'late')
  ├─ notes
  └─ timestamps

activity.session_habit_tracking
  ├─ id (PK, UUID)
  ├─ session_id (FK to coaching_session)
  ├─ child_id (FK to person.child)
  ├─ habit_type (FK to activity.habit_definition) [e.g., 'prayer', 'charity', 'quran_recitation', 'parent_help']
  ├─ observed (boolean) [was this habit demonstrated?]
  ├─ notes
  └─ timestamps

activity.session_parent_attendance
  ├─ session_id (FK to coaching_session)
  ├─ child_id (FK to person.child)
  ├─ parent_attended (boolean) [for Parenting sessions]
  ├─ guardian_name (optional)
  └─ timestamps
```

**WHY:**
- **Single Responsibility:** coaching_session = one conceptual session (once per day). session_attendance = one child's attendance (many per session). session_habit_tracking = one tracked habit per child per session.
- **No Redundancy:** Session data stored once; referenced by many attendance rows.
- **Flexibility:** Can add new habit types without schema changes (just insert rows in habit_definition lookup).
- **Cleaner Queries:** "Get all sessions in region X this month" = simple SELECT from coaching_session; "Get attendance for session Y" = JOIN to session_attendance.
- **Historical Correctness:** Child's name in attendance is optional (FK to child); name lookup done at query time, not stored denormalized. If historical snapshot needed, add a `child_snapshot` JSONB column (immutable copy of child data at that moment).

---

#### **Issue 5: Penilaian (Evaluation) — Weak Schema (23 Columns, No PK)**

**Current:** `ajis_penilaian` (id_anak, semesterid, kategori, aspek, ... but NO explicit PRIMARY KEY)

**Problems:**

1. **No Primary Key = Duplicates Allowed:** Same child, same semester, same item can have 5 rows. Violates basic database constraint.

2. **Aspek as Item ID:** Column `aspek` stores free text (e.g., "Hafalan Alquran"), functioning as item identifier. But `id_item_penilaian` (FK to ajis_item_penilaian) also present; semantic duplication. Should FK to item, not store name.

3. **Kategori Semantic Gap:** Examples: "Aspek Cerdas", "Catatan Pembinaan", "Suara Anak Juara". No clear classification; no FK to kategori lookup. Free text invites typos.

4. **Redundant Denormalization:** Stores nama_anak, nama_kantor, nama_wilayah (copied from child, office, region tables). If office renamed, evaluation doesn't auto-update.

5. **Score Column Ambiguity:** Both `nilai_capaian` and `skor` present. Seed data shows skor='0' for all rows (unused?). What scale? 0-100? A-F? No documentation.

6. **Mixed Data Types:** nilai_capaian observed as '0' (numeric), '15 Surah' (text with unit). No type enforcement.

7. **Unstructured Narrative:** perkembangan_capaian is free text (e.g., "Agung sangat aktif mengikuti pembinaan..."). Cannot query "which children showed X improvement" without NLP.

**Architectural Fix: ADD PRIMARY KEY + NORMALIZE ITEMS + SEPARATE NARRATIVE**

*New design:*
```
evaluation.semester_evaluation
  ├─ id (PK, UUID)
  ├─ child_id (FK to person.child)
  ├─ semester_id (FK to organization.semester)
  ├─ evaluation_date
  ├─ evaluator_id (FK to person.coordinator, optional)
  └─ timestamps

evaluation.evaluation_item_score
  ├─ id (PK, UUID)
  ├─ evaluation_id (FK to semester_evaluation)
  ├─ item_id (FK to evaluation.evaluation_item)
  ├─ score (numeric: 0-100, or NULL if not applicable)
  ├─ achievement_level (enum: 'not_started', 'developing', 'proficient', 'advanced')
  ├─ baseline_state (text)
  ├─ final_state (text)
  └─ timestamps

evaluation.evaluation_item
  ├─ id (PK, UUID)
  ├─ category_id (FK to evaluation.evaluation_category)
  ├─ name (e.g., "Hafalan Alquran")
  ├─ description
  ├─ target (e.g., "Level 4 (Juz 30)")
  ├─ scale_type (enum: 'numeric_0_100', 'level_scale', 'text_only')
  ├─ sort_order
  ├─ active (boolean)
  └─ timestamps

evaluation.evaluation_category
  ├─ id (PK, UUID)
  ├─ name (e.g., "Religious Development")
  ├─ code (unique)
  ├─ sort_order
  └─ timestamps

evaluation.evaluation_narrative
  ├─ id (PK, UUID)
  ├─ evaluation_id (FK to semester_evaluation)
  ├─ section (enum: 'overview', 'progress', 'challenges', 'recommendations')
  ├─ narrative_text
  └─ timestamps
```

**WHY:**
- **Explicit PK:** Prevents duplicate rows; (child, semester, item) is unique.
- **Normalized Items:** evaluation_item is reusable lookup; store once, reference many times.
- **Structured Scores:** score column is numeric; aggregation, comparison, and trending become possible.
- **Separated Narrative:** Unstructured observations live in separate table; can be empty if not needed.
- **Audit Trail:** evaluator_id tracks who entered evaluation.

---

#### **Issue 6: Pemasangan (Sponsorship) — Transaction + Snapshot (60 Columns)**

**Current:** `ajis_pemasangan` stores pairing + child snapshot + donor snapshot + financial data

**The Mixing Problem:**

| Concept | Columns | Issue |
|---|---|---|
| **Sponsorship Agreement** | id_pemasangan_baru, tahun, tgl_pemasangan, tgl_pemberhentian, status_pasangan | Core pairing data (good). |
| **Donor Snapshot** | id_donatur, nama_donatur, nia_rfo, nama_rfo | Copies donor name at pairing time. If donor renamed, pairing shows old name. |
| **Child Snapshot** | id_anak, nama_anak, nik, jns_kel, jenjang_pendidikan, asnaf, status_ortu, kelas, no_rekening | Copies child data at pairing time. Updates to child not reflected here. |
| **Program Reference** | program_donasi, id_program, harga_program, harga_penyaluran | Stores program price; if program price changes, pairings not updated (stale cost). |
| **Organizational Denorm** | kantor_id, nama_kantor, id_wilayah_pembinaan, nama_wilayah, id_sdm, nama_mentor | Denormalized from organization/coordinator tables. |
| **RFO Assignment** | nia_rfo, nama_rfo | Links to fundraiser; if assignment changes, pairing not updated. |
| **Financial** | saldo_awal, status_saldo, saldo_akhir, updated_saldo | Balance tracking; should be derived from transaction history, not stored. |

**Why This Is Wrong:**

1. **Snapshot Creep:** Pairing is a point-in-time agreement. Storing current names/data at insertion time is fine **if intentional** (we want to know "what was the child's grade when pairing started"). But no flag indicates this is historical snapshot vs. stale denormalization.

2. **Financial State Inconsistency:** saldo_awal, saldo_akhir present, but updated only sometimes (updated_saldo NULL in some rows). Query "current balance for pairing X" requires logic: use saldo_akhir if updated_saldo recent, else recalculate from transactions.

3. **Program Price Coupling:** Stores harga_program in pairing. If organization changes program price (e.g., inflation adjustment), old pairings show outdated price. For historical correctness ("what did we charge then?"), this is fine, but for financial reporting ("total outstanding balance"), it creates confusion.

4. **Too Many Statuses:** status_pasangan, status_saldo, status_aj (multiple status fields); logic to reconcile them should be in application, not database.

**Architectural Fix: SEPARATE AGREEMENT + TRANSACTION HISTORY + BALANCE CACHE**

*New design:*
```
sponsorship.child_donor_pairing
  ├─ id (PK, UUID)
  ├─ child_id (FK to person.child)
  ├─ donor_id (FK to person.donor)
  ├─ program_id (FK to sponsorship.program)
  ├─ start_date
  ├─ end_date (nullable; NULL = active)
  ├─ termination_reason (nullable, text)
  ├─ status (enum: 'active', 'suspended', 'terminated', 'completed')
  ├─ previous_program_id (nullable, FK) [if switched programs]
  └─ timestamps

sponsorship.pairing_financial_snapshot
  ├─ id (PK, UUID)
  ├─ pairing_id (FK to child_donor_pairing)
  ├─ snapshot_date
  ├─ opening_balance
  ├─ closing_balance
  ├─ total_donated (sum of donations in period)
  ├─ total_disbursed (sum of disbursements in period)
  ├─ semester_id (FK to organization.semester, optional)
  └─ timestamps
  [Note: This is a CACHE/SUMMARY; can be recalculated from transaction history if needed]

sponsorship.program
  ├─ id (PK, UUID)
  ├─ name (e.g., "Beasiswa Anak Juara SD")
  ├─ code (unique)
  ├─ description
  ├─ education_level (enum: 'SD', 'SMP', 'SMA', 'PT')
  ├─ standard_cost (cost per semester)
  ├─ distribution_cost
  ├─ active (boolean)
  ├─ effective_from, effective_to (temporal)
  └─ timestamps

sponsorship.pairing_transaction_history
  ├─ id (PK, UUID)
  ├─ pairing_id (FK to child_donor_pairing)
  ├─ transaction_date
  ├─ transaction_type (enum: 'donation', 'disbursement', 'adjustment')
  ├─ amount
  ├─ notes
  └─ timestamps
  [This replaces ajis_input_donasi + ajis_penyaluran merged into one]
```

**WHY:**
- **Clean Agreement:** Pairing is simple: child + donor + program + dates.
- **Financial Separation:** Balance derived from transaction history (ACID correctness), not stored redundantly. If transaction added/removed, balance auto-updates conceptually (no need to touch pairing row).
- **Program Versioning:** program stores current standard costs. If price changes, old pairings still reference old effective program version (if we keep program_version_id); new pairings use new version.
- **Audit Trail:** transaction_history provides immutable ledger; can answer "what was balance on date X" by summing transactions up to date X.

---

#### **Issue 7: Input Donasi + Penyaluran (Transaction Split)**

**Current:** Two separate tables
- `ajis_input_donasi` — Donation input (42 columns)
- `ajis_penyaluran` — Disbursement/payout (60+ columns)

**Why This Is Wrong:**

1. **Artificial Split:** A donation is received → stored in input_donasi. A disbursement is made → stored in penyaluran. But they're part of one cash flow: donation in → fees/costs deducted → remainder disbursed to child.

2. **Reconciliation Burden:** Matching input_donasi.id_input_donasi to penyaluran.id_input_donasi requires manual join; no FK enforced. Orphaned donations (input but not disbursed) and duplicate disbursements (disbursed twice) possible.

3. **Parallel Denormalization:** Both tables denormalize child/donor/program data; 30+ overlapping columns across both.

4. **Opname (Reconciliation) Separate:** Semester accounting stored in ajis_opname (separate table). To answer "What's the balance for pairing X in semester Y," must query opname, not derive from transactions.

5. **Cash Flow Invisible:** Current schema doesn't clearly show: Donation $500 → Fees $50 → Disbursement $450. Is the $50 captured? Where? No single ledger.

**Architectural Fix: UNIFIED TRANSACTION LEDGER**

*New design:*
```
finance.transaction
  ├─ id (PK, UUID)
  ├─ pairing_id (FK to sponsorship.child_donor_pairing)
  ├─ transaction_date
  ├─ transaction_type (enum: 'inbound_donation', 'outbound_disbursement', 'fee', 'adjustment', 'reconciliation')
  ├─ amount (always positive; sign determined by transaction_type)
  ├─ reference_number (e.g., bank transfer ID)
  ├─ notes
  ├─ recorded_by (FK to person.user)
  ├─ entry_method (enum: 'manual', 'bulk_import', 'bank_integration')
  └─ timestamps

finance.transaction_posting
  ├─ id (PK, UUID)
  ├─ transaction_id (FK to finance.transaction)
  ├─ posting_account (enum: 'pairing_inbound', 'pairing_outbound', 'fee_collection', 'administrative_cost')
  ├─ amount
  └─ timestamps
  [Optional: if double-entry accounting needed; one transaction creates multiple postings]
```

**WHY:**
- **Single Ledger:** All money movements (in, out, fees, adjustments) in one table, sortable by date.
- **Immutable History:** Transactions never updated, only added (or marked reversal). This provides audit trail.
- **Balance Calculation:** Balance at any date = SUM(transactions up to date) filtered by transaction_type. No need to store saldo_awal, saldo_akhir separately (those become derived/cached).
- **Reconciliation:** ajis_opname data (semester accounting) becomes a VIEW or cached table computed from transaction history, not a separate table with reconciliation risk.

---

#### **Issue 8: Hafalan (Memorization) — Weak Item Tracking**

**Current:** `ajis_hafalan` (id_anak, jenis, konten_uji, tgl_pengujian, ...)

**Problems:**

1. **Composite PK Prevents Retesting:** PK is (id_anak, konten_uji). If child tests Al-Fatihah in semester 10, then retests in semester 11, cannot insert (PK violation). Must DELETE + INSERT, losing history.

2. **Item Lookup by String:** conten_uji is varchar(100) name. If typed 'Al-Falaq' vs 'Al-Falak' (typo), creates duplicate item records. Should FK to ajis_item_hafalan.id.

3. **No Score/Level:** Table only records tgl_pengujian (test date); no score, no mastery level. Cannot express "mastered level 3" vs "failed attempt 1 of 2".

4. **Jenis As Numeric String:** jenis is varchar(50), observed as '2', '3', '4' (meaning Quran, prayer, du'a). Should be enum or FK to jenis lookup.

**Architectural Fix: SEPARATE TEST ATTEMPT + MASTERY RECORD**

*New design:*
```
activity.hafalan_item
  ├─ id (PK, UUID)
  ├─ category (enum: 'quran_surah', 'prayer_recitation', 'selected_dua')
  ├─ name (e.g., 'Al-Fatihah')
  ├─ description
  ├─ sort_order
  └─ timestamps

activity.hafalan_test
  ├─ id (PK, UUID)
  ├─ child_id (FK to person.child)
  ├─ item_id (FK to hafalan_item)
  ├─ test_date
  ├─ result (enum: 'pass', 'fail', 'partial')
  ├─ score (numeric, nullable)
  ├─ mastery_level (enum: 'beginner', 'developing', 'proficient', 'mastered', nullable)
  ├─ notes
  ├─ examiner_id (FK to person.coordinator, optional)
  └─ timestamps

activity.child_hafalan_mastery
  ├─ id (PK, UUID)
  ├─ child_id (FK to person.child)
  ├─ item_id (FK to hafalan_item)
  ├─ mastery_level (enum: 'not_started', 'level_1', 'level_2', 'level_3', 'level_4')
  ├─ as_of_date (last test date that achieved this level)
  ├─ updated_at (timestamp)
  └─ [This is a CACHED summary; can be computed from hafalan_test]
```

**WHY:**
- **History Preserved:** Multiple test attempts on same item stored as separate hafalan_test rows (no PK violation).
- **Normalized Items:** hafalan_item is a lookup; FKs reference it, not string names (no typo risk).
- **Scored Mastery:** hafalan_test captures result + score; child_hafalan_mastery (cached) shows current mastery level. Query "which children have mastered Al-Fatihah" becomes simple.
- **Temporal Correctness:** As child's mastery evolves, hafalan_test rows accumulate; child_hafalan_mastery updates periodically (or recalculated on-demand).

---

## PART 3: DUPLICATE INFORMATION ANALYSIS

### Geographic Location Duplication

**Problem:** Geographic data stored in MANY places:

| Table | Geographic Columns | Redundancy |
|---|---|---|
| `ajis_anak` | propid, kabid, camatid, desaid + nama_propinsi, nama_kabupaten, nama_kecamatan, nama_desa | ×3 (child, father, mother address, plus school) |
| `ajis_wilayah_pembinaan` | propid, kabid, camatid, desaid + nama_propinsi, nama_kabupaten, nama_kecamatan, nama_desa | ×1 |
| `ajis_pembinaan_baru` | *(denormalized from ajis_anak)* | ×50 copies |
| `ajis_pemasangan` | *(denormalized from ajis_anak)* | ×many copies |
| `ajis_penyaluran` | propid, kabid, camatid, desaid + nama_propinsi, nama_kabupaten, nama_kecamatan, nama_desa | ×many copies |
| `ajis_sdm_wilayah` | propid, kabid, camatid, desaid + nama_propinsi, nama_kabupaten, nama_kecamatan, nama_desa | ×1 |
| `ref_propinsi` | propid + propinsi + ibukota | Base data |
| `ref_kabupaten` | kabid, propid, kabupaten, ibukota | Base data |
| `ref_kecamatan` | camatid, kabid, nama_kecamatan | Base data |
| `ref_desa` | desaid, camatid, nama_desa | Base data |

**Why This Is Wrong:**

1. **Redundant Text:** Storing both code (propid) and name (nama_propinsi) in every table risks out-of-sync: code '32' → name 'Jawa Barat' in ajis_anak, but 'West Java' in another table (if ever corrected).

2. **Update Burden:** If district name changes (rare but possible, e.g., administrative boundary reform), must update 50+ rows in multiple tables.

3. **No Single Source of Truth:** Is ref_propinsi the source? Then other tables should FK to it. But instead, they copy the name locally.

**Architectural Fix: SINGLE GEOGRAPHIC HIERARCHY + FKS**

*New design:*
```
geography.province
  ├─ id (PK, UUID or propid as UNIQUE)
  ├─ code (varchar: '32')
  ├─ name (varchar: 'Jawa Barat')
  ├─ capital (varchar: 'Bandung')
  └─ timestamps

geography.regency (district)
  ├─ id (PK, UUID)
  ├─ code (varchar: '3207')
  ├─ province_id (FK to province)
  ├─ name (varchar: 'Kabupaten Bandung')
  ├─ is_city (boolean; differentiates Kota vs Kabupaten)
  └─ timestamps

geography.subdistrict
  ├─ id (PK, UUID)
  ├─ code (varchar: '320701')
  ├─ regency_id (FK to regency)
  ├─ name (varchar: 'Margaasih')
  └─ timestamps

geography.village
  ├─ id (PK, UUID)
  ├─ code (varchar: '3207010001')
  ├─ subdistrict_id (FK to subdistrict)
  ├─ name (varchar: 'Citeureup')
  ├─ is_urban (boolean; urban kelurahan vs rural desa)
  └─ timestamps

geography.address
  ├─ id (PK, UUID)
  ├─ street_address (text)
  ├─ village_id (FK to village)
  ├─ postal_code (varchar, optional)
  ├─ coordinates (POINT, optional; lat/lng)
  ├─ address_type (enum: 'residential', 'work', 'school', 'other')
  └─ timestamps

[Then in person.child, use:]
  current_address_id (FK to geography.address)
  [Not: propid, kabid, camatid, desaid, nama_propinsi, etc.]
```

**WHY:**
- **Single Source of Truth:** Geography hierarchy maintained in one place; other tables FK to it.
- **Name Changes:** If 'Margaasih' renamed to 'Margaasih Baru', update one row (geography.subdistrict); all children, coordinators, addresses auto-reference correct name (via FK).
- **Flexibility:** Addresses can be reused (FK); two children living on same street point to same address_id.
- **Queries Simplified:** "How many children live in Subdistrict X?" = JOIN person.child → geography.address → geography.subdistrict WHERE subdistrict_id = X.

---

### Organizational Denormalization

**Problem:** office/region/coordinator data denormalized into transaction tables

| Table | Denormalized Org Data | Why Stored |
|---|---|---|
| `ajis_pembinaan_baru` | kantor_id, nama_kantor, id_wilayah_pembinaan, nama_wilayah | Links session to office/region |
| `ajis_pemasangan` | kantor_id, nama_kantor, id_wilayah_pembinaan, nama_wilayah, id_sdm, nama_mentor | Links pairing to coordinator |
| `ajis_penyaluran` | kantor_id, nama_kantor, id_wilayah_pembinaan, nama_wilayah, nama_sdm | Links disbursement to coordinator |
| `ajis_input_donasi` | kantor_id, id_wilayah_pembinaan, nama_kantor, nama_wilayah | Links donation to office/region |
| `ajis_user` | id_kantor, nama_kantor, nama_wilayah, id_wilayah_pembinaan | Links user to office/region (assignment) |

**Why This Is Wrong:**

1. **Coordinator Reassignment:** If coordinator moved from Region A to Region B, all historical pairings/sessions still show Region A. For reporting "which pairings did coordinator X manage," results ambiguous (past or current region?).

2. **Office Rename:** If 'RZ - Cimahi' renamed to 'RZ - Cimahi Utama', all transaction rows must be updated, or historical names stale.

3. **Storage Waste:** If a coordinator led 500 sessions, the coordinator name stored 500 times.

**Architectural Fix: FK TO ORGANIZATION + OPTIONAL SNAPSHOT FOR HISTORY**

*New design:*
```
[In activity.coaching_session:]
  region_id (FK to geography.coaching_region)
  office_id (FK to organization.office)
  lead_instructor_id (FK to person.coordinator)

[In sponsorship.child_donor_pairing:]
  [No organization fields; organization derived from child's region assignment]

[If historical correctness needed (e.g., "what region was child assigned to when pairing started"):]
  Add JSONB column child_region_snapshot at pairing time
  Add JSONB column coordinator_snapshot at session time
```

**WHY:**
- **No Redundant Updates:** Coordinator rename updates one row (person.coordinator), not 500 session rows.
- **Clean FK Relationships:** Queries like "sessions led by coordinator X" become direct joins, not string-matching.
- **Optional History:** JSONB snapshot column preserves "what was the state then" if needed for auditing/compliance, without full denormalization.

---

### User Account Denormalization

**Problem:** `ajis_user` stores both auth data + profile data + assignment data

```
ajis_user columns:
  ├─ username, password [authentication]
  ├─ id_kantor, nama_kantor, nama_wilayah, id_wilayah_pembinaan [assignment/profile]
  ├─ nik, aktif [metadata]
  └─ id_group_user [role]
```

**Why This Is Wrong:**

1. **Separation of Concerns Violated:** Auth (credentials) mixed with profile (office assignment). If user's office changed, must update auth table (risky).

2. **Flat Structure:** No user profile table; name, contact, etc. not stored (only nik, which is mostly null/0).

3. **Redundant Assignment:** Both id_kantor (FK) and nama_kantor (denormalized). If office renamed, office table updated, but user table not.

**Architectural Fix: SEPARATE AUTH + PROFILE + ASSIGNMENT**

*New design:*
```
access.user_account
  ├─ id (PK, UUID)
  ├─ username (UNIQUE)
  ├─ email (UNIQUE, for password reset)
  ├─ password_hash (bcrypt, never MD5)
  ├─ password_changed_at
  ├─ last_login_at (nullable)
  ├─ failed_login_attempts (counter for brute-force detection)
  ├─ active (boolean)
  └─ timestamps

access.user_profile
  ├─ id (PK, UUID)
  ├─ account_id (FK to user_account, 1:1)
  ├─ first_name, last_name
  ├─ phone, email_personal (optional)
  ├─ coordinator_id (FK to person.coordinator, optional)
  │   [if user is also a coordinator]
  └─ timestamps

access.user_assignment
  ├─ id (PK, UUID)
  ├─ account_id (FK to user_account)
  ├─ office_id (FK to organization.office)
  ├─ region_id (FK to geography.coaching_region, optional)
  ├─ role_id (FK to access.role)
  ├─ assigned_at
  ├─ ends_at (nullable; NULL = current assignment)
  └─ [Temporal: old assignments have ends_at date; new assignment ends_at = NULL]
```

**WHY:**
- **Auth Isolation:** Credentials separate from mutable profile data; credentials never change unless password reset.
- **Role Assignment History:** user_assignment is temporal; can answer "what role did user X have in month Y" by querying with date filter.
- **Office Change:** If user moves from office A to B, insert new row in user_assignment with old ends_at date, new row with ends_at NULL; no updates to auth table.

---

## PART 4: MERGER & CONSOLIDATION RECOMMENDATIONS

### Summary: Tables to Merge/Consolidate

| Current Tables | Consolidated Table | Reason |
|---|---|---|
| `ajis_propinsi` + `ref_propinsi` | `geography.province` | Identical schema; single source of truth |
| `ajis_input_donasi` + `ajis_penyaluran` | `finance.transaction` | Two sides of same cash flow |
| `ajis_opname` | *Delete; compute from finance.transaction* | Redundant; should be derived/cached |
| `ajis_anak` ÷ breakdown | `person.child` + `person.family_member` + `person.education_record` + `person.program_status` | Split 130-column table by entity |
| `ajis_pembinaan_baru` ÷ breakdown | `activity.coaching_session` + `activity.session_attendance` + `activity.session_habit_tracking` | Split mixed levels |
| `ajis_penilaian` + `ajis_item_penilaian` | `evaluation.semester_evaluation` + `evaluation.evaluation_item_score` + `evaluation.evaluation_item` | Normalize + add PK |
| `ajis_hafalan` + `ajis_item_hafalan` | `activity.hafalan_test` + `activity.hafalan_item` + `activity.child_hafalan_mastery` | Support retesting + history |
| `ajis_pemasangan` | `sponsorship.child_donor_pairing` + `sponsorship.pairing_financial_snapshot` | Separate agreement from financial cache |
| `ajis_kantor` + `ajis_wilayah_pembinaan` | `organization.office` + `geography.coaching_region` | Separate organizational hierarchy from geographic areas |
| `ajis_user` | `access.user_account` + `access.user_profile` + `access.user_assignment` | Separate auth, profile, assignment |
| Geographic denorm (40+ columns across tables) | `geography.*` hierarchy | Centralize geographic codes/names |
| Organizational denorm (20+ columns across tables) | `organization.office` + `geography.coaching_region` + FKs | Centralize org structure |

---

## PART 5: PROPOSED NORMALIZED SCHEMA (HIGH LEVEL)

### Schema Breakdown by Domain

#### **1. PERSON (Core Entities)**
```
person.child
person.family_member
person.coordinator
person.donor
person.education_record
person.program_status
```

#### **2. GEOGRAPHY (Location Data)**
```
geography.province
geography.regency
geography.subdistrict
geography.village
geography.address
geography.coaching_region
```

#### **3. ORGANIZATION (Organizational Structure)**
```
organization.office
organization.semester
organization.institution (schools/universities)
```

#### **4. ACTIVITY (Operations)**
```
activity.coaching_session
activity.session_attendance
activity.session_habit_tracking
activity.session_parent_attendance
activity.coaching_material
activity.hafalan_item
activity.hafalan_test
activity.child_hafalan_mastery
```

#### **5. EVALUATION (Assessment)**
```
evaluation.semester_evaluation
evaluation.evaluation_item_score
evaluation.evaluation_item
evaluation.evaluation_category
evaluation.evaluation_narrative
```

#### **6. SPONSORSHIP (Child-Donor Relationship)**
```
sponsorship.child_donor_pairing
sponsorship.pairing_financial_snapshot
sponsorship.program
sponsorship.program_version
```

#### **7. FINANCE (Money Flow)**
```
finance.transaction
finance.transaction_posting (optional; for double-entry accounting)
```

#### **8. ACCESS CONTROL (Security)**
```
access.user_account
access.user_profile
access.user_assignment
access.role
access.permission
access.role_permission
```

#### **9. CONFIGURATION & LOOKUPS**
```
config.status_code_type (enum definitions)
config.habit_definition
config.evaluation_category
config.evaluation_item (master list)
```

**Total Tables:** ~25 normalized tables (vs. current 15 denormalized)

---

## PART 6: WHY THIS DESIGN IS BETTER

### 1. **Data Integrity**
- **Enforced FKs:** No orphaned records possible.
- **Unique Constraints:** PK + UNIQUE constraints on natural keys.
- **Check Constraints:** Enum values validated at database level.
- **Triggers:** Temporal data (valid_from/valid_to) validated automatically.

**Current Risk:** Child deleted, leaving 10,000 session/evaluation records orphaned (no CASCADE delete).

### 2. **Consistency**
- **Single Source of Truth:** Office name stored once in organization.office; all references FK to it. If renamed, rename once.
- **No Duplicate Data:** Child's current region stored only in person.child, not copied to 50 session rows.

**Current Risk:** Office 'RZ - Cimahi' renamed but only 80% of sessions updated; reports disagree.

### 3. **Auditability**
- **Temporal Tracking:** user_assignment has effective dates (who was assigned what when). Past assignments never deleted.
- **Immutable Ledger:** finance.transaction is append-only (never updated); reversal creates new row with opposite sign.
- **Explicit Audit Columns:** Every table has recorded_by, recorded_at, updated_by, updated_at.

**Current Risk:** Cannot answer "who entered this evaluation" or "was child's region changed after pairing started."

### 4. **Query Performance**
- **Appropriate Indexes:** B-tree on FKs, GiST on geography (PostGIS), partial indexes on active rows.
- **No N+1 Queries:** Normalized design enables efficient JOINs without full-table scans.
- **Query Pushdown:** Financial aggregations (sum balance per pairing) calculated in database, not application.

**Current Risk:** "Get all sessions for child X this semester" requires full table scan of 4.5M pembinaan_baru rows.

### 5. **Maintainability**
- **Clear Responsibility:** Each table represents one concept; no confusion about what belongs where.
- **Easy Additions:** Add new habit type = insert row in activity.habit_definition, no schema migration.
- **Versioning:** Program price changes create new program_version row; old pairings still reference old version if needed.

**Current Risk:** Adding new evaluation category = add column to ajis_penilaian, rebuild app, deploy.

### 6. **Flexibility**
- **Optional Fields:** Not every child has guardian info (no columns wasted). family_member table stores what exists.
- **Temporal Flexibility:** child_donor_pairing valid for specific dates; no need to "delete and re-insert" if pairing resumption needed.
- **Narrative + Structured:** evaluation.evaluation_item_score captures structured score; evaluation.evaluation_narrative captures unstructured notes (separate, not competing).

**Current Risk:** Cannot represent child with only one living parent (father/mother columns exist but father might be "unknown"); schema forces 3 parent slots.

### 7. **Migration & Scaling**
- **Sharding Ready:** Clear PK structure enables horizontal sharding by office_id or child_id if dataset grows.
- **Archival:** Old sessions/transactions easily moved to archive tables without breaking FKs.
- **Read Replicas:** Normalized queries distribute read load evenly; no hot tables carrying all denormalized data.

**Current Risk:** ajis_pembinaan_baru (4.5M rows) is bottleneck; all denormalized child data creates high disk I/O.

---

## PART 7: HANDLING SPECIAL CASES

### Requirement: "What was the child's name at the time the session occurred?"

**Current Approach:** Store denormalized nama_lengkap in pembinaan_baru. **Problem:** If name later corrected, historical name lost.

**Better Approach (Option A - Immutable Snapshot):** 
```
activity.coaching_session
  ├─ child_id (FK to person.child) [current name)
  ├─ child_snapshot JSONB {name, age, education, address at that moment}
```
- At session time, capture child's current state as JSONB.
- Queries have access to both: current child data (via FK) and historical state (via JSONB).
- Explicit intent: this is a historical snapshot, not denormalized data.

**Better Approach (Option B - Versioned Child Table):**
```
person.child (current)
person.child_version (history)
  ├─ child_id, valid_from, valid_to
  ├─ name, education, address (state during that period)
```
- Every time child's core data changes, new row added to child_version.
- Queries can ask "what was child's name as of session_date" by joining to child_version with date filter.
- No schema bloat; child_version only has rows for actual changes.

**Why This Is Better:** Explicit intent, efficient queries, clean history trail.

---

### Requirement: "What's the current balance for pairing X?"

**Current Approach:** Query ajis_pemasangan.saldo_akhir + check updated_saldo timestamp; if stale, recalculate from transactions. **Problem:** Logic spread across app; saldo_akhir might be out-of-sync.

**Better Approach (Option A - View):**
```
sponsorship.v_pairing_current_balance AS
SELECT 
  pairing_id,
  SUM(CASE WHEN transaction_type = 'inbound_donation' THEN amount
           WHEN transaction_type = 'outbound_disbursement' THEN -amount
           ELSE 0 END) AS current_balance
FROM finance.transaction
GROUP BY pairing_id
```
- View always computes current balance from transactions (never stale).
- No redundant storage; single source of truth.

**Better Approach (Option B - Materialized View + Refresh)**:
```
sponsorship.mv_pairing_current_balance
```
- Materialized view refreshed every hour (or after every 100 transactions).
- Provides cached balance for fast queries; app knows to refresh if accuracy critical.

**Why This Is Better:** Automatic consistency; no manual cache invalidation.

---

### Requirement: "Show me evaluation results for all children, sorted by achievement level."

**Current Approach:** Query ajis_penilaian with various WHERE conditions to extract score; aggregate in app (messy). **Problem:** Score stored as text ('15 Surah') or number ('0'); no structure.

**Better Approach:**
```
evaluation.evaluation_item_score
  ├─ achievement_level (enum: 'not_started', 'developing', 'proficient', 'advanced')
  ├─ score (numeric)

SELECT child.first_name, item.name, score.achievement_level, score.score
FROM evaluation.evaluation_item_score AS score
JOIN evaluation.semester_evaluation AS eval ON score.evaluation_id = eval.id
JOIN person.child AS child ON eval.child_id = child.id
JOIN evaluation.evaluation_item AS item ON score.item_id = item.id
ORDER BY score.achievement_level DESC
```
- Sorted directly in database; structured data supports filtering/aggregation.

**Why This Is Better:** Queries express intent clearly; DBMS handles aggregation (faster than app).

---

## PART 8: MIGRATION PATH (High Level, No SQL)

### Phase 1: Design & Prototype (Weeks 1-2)
- Build normalized PostgreSQL schema in dev environment.
- Define FK constraints, check constraints, temporal logic.
- Build test data (small subset of current data).

### Phase 2: ETL Mapping (Weeks 3-4)
- Map current denormalized tables to new normalized structure.
- Identify edge cases (orphaned records, malformed data).
- Plan data transformation (e.g., split ajis_anak into 4 tables).

### Phase 3: Build ETL Process (Weeks 5-7)
- Write extraction logic from MySQL → staging tables.
- Transform/normalize in staging.
- Validation: row counts, FK integrity checks.
- Load into PostgreSQL dev database.

### Phase 4: Reconciliation & QA (Weeks 8-9)
- Compare old system output vs. new system output (reports, balances, etc.).
- Fix discrepancies.
- Load test (ensure 500k+ transaction records perform well).

### Phase 5: Pilot Cutover (Weeks 10-12)
- Deploy normalized schema + new API routes to staging.
- Run both systems in parallel for 1-2 weeks.
- Users interact with new system; compare results with old.
- Cutover: stop old system, promote new to production.

### Phase 6: Decommission (Weeks 13+)
- Archive old MySQL database (backup, then delete).
- Decommission old API endpoints.
- Monitor PostgreSQL performance; tune indexes if needed.

---

## PART 9: COMMON OBJECTIONS & RESPONSES

### "Normalizing to 25 tables is too complex. Won't queries be slow?"

**Response:** 
- Normalized queries are actually FASTER. A well-optimized join on indexed FKs is faster than a table scan.
- Current denormalized queries scan 4.5M pembinaan rows to find sessions for one child; normalized query joins small coaching_session + session_attendance (2 table scans, much smaller).
- Indexes on FKs are automatic in PostgreSQL; no manual tuning needed.
- Complexity is in understanding data model, not query performance.

### "We need to keep history (what was the child's name then?). Won't we lose that?"

**Response:**
- No, we handle it better. Add JSONB snapshot column (child_snapshot) to coaching_session; captures child state at that moment without full denormalization.
- Or, use person.child_version (temporal table) with valid_from/valid_to dates; query "child state as of date X" efficiently.
- Current denormalization loses intent: is nama_lengkap current name or historical? Explicit snapshots make intent clear.

### "Our reports are complex; they need to aggregate across denormalized data."

**Response:**
- Normalization makes aggregations EASIER, not harder.
- Current: To sum "total donated by pairing," must query ajis_input_donasi + ajis_pemasangan + filter by date ranges.
- Normalized: finance.transaction has all donations, cleanly filtered, joined to sponsorship.child_donor_pairing. One JOIN, not three.
- Views abstract complexity; reports query views, not raw tables.

### "Migration is too risky; what if we get it wrong?"

**Response:**
- Current system is already wrong (no FK enforcement, orphaned data already exists).
- Normalization REDUCES risk by enforcing constraints at database level.
- ETL phase (Phase 3-4) includes reconciliation; compare old vs. new, fix issues before cutover.
- Run both systems in parallel (Phase 5) to validate correctness before decommissioning old system.

---

## CONCLUSION

**Current Schema:** Denormalized, transaction-scattered, no integrity constraints. Works for small-scale operations but breaks at scale (4.5M session rows, update anomalies, orphaned records).

**Proposed Schema:** Normalized (3NF), integrity-enforced, audit-trail-enabled. Supports scaling, temporal correctness, complex queries, and maintenance.

**Benefit Summary:**
| Metric | Current | Proposed |
|---|---|---|
| **Data Integrity** | Weak (no FK) | Strong (enforced FKs) |
| **Update Anomalies** | High (40+ denorm columns) | Eliminated (single-source updates) |
| **Query Clarity** | Low (complex JOINs across denorm tables) | High (clear FK relationships) |
| **Audit Trail** | Broken (user_update always empty) | Complete (explicit audit columns) |
| **Temporal Correctness** | Poor (snapshots mixed with denorm) | Excellent (versions, snapshots, histories) |
| **Scalability** | Limited (bottleneck tables) | Excellent (shardable, archivable) |
| **Maintenance** | High (every schema change touches 10+ tables) | Low (add lookup row, not schema migration) |

**Recommendation:** Proceed with PostgreSQL migration + normalization. ROI: cleaner codebase, faster queries, fewer bugs, easier onboarding of new engineers.

---

**End of Architectural Redesign Document**
