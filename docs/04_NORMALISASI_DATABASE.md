# AJIS Database Normalization Guide
## Complete Process to Achieve 3NF with Full Explanations

**Database:** AJIS (Anak Juara Information System)  
**Current State:** MySQL, MyISAM/InnoDB, Denormalized, No Foreign Key Constraints  
**Target State:** PostgreSQL 14+, 3NF/BCNF, Transactional, Auditable  
**Date:** July 14, 2026

---

## TABLE OF CONTENTS
1. [Executive Summary](#executive-summary)
2. [Normalization Fundamentals & Requirements](#normalization-fundamentals)
3. [Current State Assessment](#current-state-assessment)
4. [Normalization Process by Entity](#normalization-process)
5. [Duplicate Table Consolidation](#duplicates)
6. [Denormalization Elimination](#denormalization)
7. [Final Normalized Schema](#final-schema)
8. [Benefits & Metrics](#benefits)

---

## EXECUTIVE SUMMARY {#executive-summary}

### Current Problems

The AJIS database suffers from **severe denormalization and structural inconsistencies** that violate multiple normalization principles:

| Problem | Count | Impact |
|---------|-------|--------|
| Duplicate tables (ajis_propinsi + ref_propinsi) | 2 tables | Sync burden, confusion about authoritative source |
| Denormalized columns storing family members | 40+ columns | Update anomalies, redundancy, inability to represent multiple guardians |
| Mixed entity types in single table | Multiple instances | Logic scattered across app layer, query complexity |
| No foreign key constraints | All relationships | Silent data corruption, orphaned records, referential integrity failures |
| Hardcoded snapshots of related data | 50+ columns | Historical inaccuracy, update burden, storage bloat |
| Missing lookup/reference tables | Multiple enums | Free-text data, inconsistent values, no validation |
| Composite primary keys mixing surrogate + semantic keys | 6 tables | Query ambiguity, performance unpredictability |

### Normalization Outcome

After applying normalization to **Third Normal Form (3NF)**:

- **Reduce redundancy** by eliminating duplicated data across tables
- **Ensure data consistency** through proper relationships and constraints
- **Improve maintainability** by organizing tables by business entity
- **Enable scalability** by normalizing large tables with repeated attributes
- **Add auditability** through proper timestamp and user tracking columns

**Schema Reduction & Reorganization:**
- From: 15 operational tables (highly denormalized) + 6 duplicate/redundant lookup tables
- To: 8 core normalized tables + 5 proper lookup tables + 3 audit/history tables
- **Result: Cleaner, more maintainable structure with fewer anomalies**

---

## NORMALIZATION FUNDAMENTALS & REQUIREMENTS {#normalization-fundamentals}

### What is 3NF (Third Normal Form)?

Third Normal Form requires three conditions to be met:

#### **Condition 1: First Normal Form (1NF) - Atomic Values**

**Requirement:** Every column must contain only atomic (indivisible) values; no repeating groups.

**Current Violations:**
- `ajis_anak` stores multiple family members (father, mother, guardian) in separate column blocks instead of separate rows
- Geographic data mixed with person data (propid + kabid + camatid + desaid + names all in one row)
- `ajis_pembinaan_baru` stores child attributes (name, gender, education) alongside session data

**Example of 1NF Violation:**
```
Current (violates 1NF):
CHILD_ID | NAME | FATHER_NAME | MOTHER_NAME | GUARDIAN_NAME | GUARDIAN_OCCUPATION
01234    | Arif | Budi        | Siti        | Ummu Salma    | Trader

Better (1NF):
CHILD_ID | NAME | FAMILY_MEMBER_TYPE | FAMILY_MEMBER_NAME | OCCUPATION
01234    | Arif | Father             | Budi               | (NULL)
01234    | Arif | Mother             | Siti               | (NULL)
01234    | Arif | Guardian           | Ummu Salma         | Trader
```

**Why:** The first approach treats family members as fixed columns (father, mother, guardian), making it impossible to represent a child with 2 guardians or 0 guardians without schema changes. The second approach uses rows to represent the **repeating group** (family members).

---

#### **Condition 2: Second Normal Form (2NF) - Remove Partial Dependencies**

**Requirement:** Every non-key column must be fully dependent on the **entire** primary key, not just part of it.

**Current Violations:**
- `ajis_pembinaan_baru` has composite-like logical key (`id_pembinaan` + `id_anak` together identify one session attendance record)
- But also stores `tgl_pembinaan` (session date), `jenis_pembinaan` (session type), `judul_materi` (material title) which depend only on `id_pembinaan`, not the full key
- This means session-level data is repeated for every child in that session (redundancy)

**Example of 2NF Violation:**
```
Current (violates 2NF):
ID_PEMBINAAN | ID_ANAK | TGL_PEMBINAAN | JENIS_PEMBINAAN | KEHADIRAN
00001        | 001     | 2024-01-15    | Reguler         | Hadir
00001        | 002     | 2024-01-15    | Reguler         | Izin
00001        | 003     | 2024-01-15    | Reguler         | Alfa

(TGL_PEMBINAAN and JENIS_PEMBINAAN repeat for every child in the session)

Better (2NF):
SESSION table:
ID_PEMBINAAN | TGL_PEMBINAAN | JENIS_PEMBINAAN | JUDUL_MATERI
00001        | 2024-01-15    | Reguler         | Pentingnya Sholat

ATTENDANCE table:
ID_PEMBINAAN | ID_ANAK | KEHADIRAN
00001        | 001     | Hadir
00001        | 002     | Izin
00001        | 003     | Alfa
```

**Why:** The better approach splits session-header data from child-attendance data. Session date is entered once, not repeated. If you need to correct the session date, one update touches one row, not three. **This eliminates update anomalies.**

---

#### **Condition 3: Third Normal Form (3NF) - Remove Transitive Dependencies**

**Requirement:** Every non-key column must depend on the primary key, not on other non-key columns.

**Current Violations:**
- `ajis_pembinaan_baru` stores `nama_wilayah` (region name) even though `id_wilayah_pembinaan` already provides access to the region
- `ajis_anak` stores `nama_kantor` even though `kantor_id` provides access to the office
- `ajis_pemasangan` stores child name, donor name, and office name — these should be looked up via FK, not stored

**Example of 3NF Violation:**
```
Current (violates 3NF):
ID_ANAK | NAMA_ANAK | KANTOR_ID | NAMA_KANTOR
001     | Arif      | K001      | RZ Cimahi

(NAMA_KANTOR depends on KANTOR_ID, not on ID_ANAK directly)

Better (3NF):
CHILD table:
ID_ANAK | NAMA_ANAK | KANTOR_ID
001     | Arif      | K001

OFFICE table:
KANTOR_ID | NAMA_KANTOR
K001      | RZ Cimahi

(To get both child and office name, join CHILD to OFFICE via KANTOR_ID)
```

**Why:** The better approach ensures every column in CHILD depends on the CHILD primary key, not on something else. If office name changes, update one row in OFFICE, not thousands in CHILD. **This makes updates safe and single-source-of-truth.**

---

## CURRENT STATE ASSESSMENT {#current-state-assessment}

### Normalization Form of Current Tables

| Table | 1NF | 2NF | 3NF | Severity | Key Issues |
|-------|-----|-----|-----|----------|------------|
| `ajis_anak` | ❌ | ❌ | ❌ | **CRITICAL** | Stores family members as columns; stores geographic hierarchy; stores denormalized office/region data |
| `ajis_pembinaan_baru` | ❌ | ❌ | ❌ | **CRITICAL** | Mixes session header + attendance + child snapshot; repeats session-level data per child |
| `ajis_pemasangan` | ❌ | ❌ | ❌ | **CRITICAL** | Stores child name, donor name, office name; stores both header + financial snapshot data |
| `ajis_penilaian` | ❌ | ✅ | ⚠️ | **HIGH** | Free-text item names; no proper lookup table for items; mixed score/text |
| `ajis_hafalan` | ❌ | ✅ | ⚠️ | **HIGH** | Lookup table (`ajis_item_hafalan`) data mixed with test results; no proper separation |
| `ajis_input_donasi` | ✅ | ✅ | ⚠️ | **MEDIUM** | Stores denormalized child/donor data; could reference via FK |
| `ajis_penyaluran` | ✅ | ✅ | ⚠️ | **MEDIUM** | Stores denormalized child/pairing data; could reference via FK |
| `ajis_opname` | ✅ | ✅ | ⚠️ | **MEDIUM** | Balance is derived (should be view), not stored |
| `ajis_kantor` | ✅ | ✅ | ✅ | **GOOD** | — |
| `ajis_wilayah_pembinaan` | ⚠️ | ✅ | ⚠️ | **MEDIUM** | Stores geographic hierarchy; mixes org structure with geographic data |
| `ajis_user` | ✅ | ✅ | ⚠️ | **MEDIUM** | Denormalized office/region data; could FK to office |
| `ajis_propinsi` & `ref_propinsi` | ✅ | ✅ | ✅ | **DUPLICATE** | Both tables identical; consolidate to one |
| `ajis_item_hafalan` | ✅ | ✅ | ✅ | **GOOD** | — |
| `ajis_item_penilaian` | ✅ | ✅ | ✅ | **GOOD** | — |

---

## NORMALIZATION PROCESS BY ENTITY {#normalization-process}

This section explains how to normalize each business entity and why each step is necessary. **No SQL is generated; only structure and rationale.**

---

### NORMALIZATION STEP 1: Separate Geographic Data into Proper Hierarchy

#### Problem Statement

**Current State:** Geographic data is denormalized and duplicated everywhere.

- `ajis_anak` stores propid, kabid, camatid, desaid + their names (8 columns) for child address, and repeats this for father address, mother address, guardian address
- `ajis_wilayah_pembinaan` stores geographic hierarchy even though it's an organizational structure
- Two identical province tables exist (`ajis_propinsi` + `ref_propinsi`)
- Geographic hierarchy is repeated in multiple tables (ajis_kantor also has propid, kabid, camatid)

**Impact:**
- ❌ Violation of 1NF: repeating geographic groups across tables
- ❌ Update anomaly: if a district name is corrected, must update dozens of child records
- ❌ Storage bloat: same geography data stored 50+ times
- ❌ Data integrity: typos in one table not reflected in others

---

#### Normalization Solution

**Create a unified geographic hierarchy** as a separate schema:

```
SCHEMA: geography

TABLE: province
  - propid (PK)
  - name
  - capital_city
  - active

TABLE: district
  - kabid (PK)
  - propid (FK → province)
  - name
  - active

TABLE: subdistrict (kecamatan)
  - camatid (PK)
  - kabid (FK → district)
  - name
  - active

TABLE: village (desa)
  - desaid (PK)
  - camatid (FK → subdistrict)
  - name
  - active

TABLE: location
  - location_id (PK)
  - desaid (FK → village) [or NULL if only known to higher level]
  - street_address
  - coordinates (lat/long, optional)
```

**Why This Works:**

1. **Single Source of Truth:** Province names entered once, referenced everywhere
2. **Referential Integrity:** Can enforce FK constraints; cannot assign a child to a non-existent district
3. **Efficient Updates:** Change "Cimahi" to "Kota Cimahi"? One update to district table, all FKs automatically reflect change
4. **Supports Hierarchies:** Each level references its parent (village → subdistrict → district → province)
5. **Eliminates Duplication:** `ajis_propinsi` and `ref_propinsi` become one table

---

#### Mapping Current Data

| Current Columns | New Location |
|---|---|
| `ajis_anak.propid, propinsi` | `geography.province` (PK: propid) |
| `ajis_anak.kabid, kabupaten` | `geography.district` (PK: kabid, FK: propid) |
| `ajis_anak.camatid, kecamatan` | `geography.subdistrict` (PK: camatid, FK: kabid) |
| `ajis_anak.desaid, desa` | `geography.village` (PK: desaid, FK: camatid) |
| `ajis_anak.alamat` | `geography.location` (street_address column) |
| All repeats for father/mother/guardian | **Deleted** — one FK to location per family member |

---

#### Benefits After Normalization

- **Before:** Storing "Jawa Barat" 50 times (provinces) + 100 times (districts); total 150 instances
- **After:** Storing "Jawa Barat" once; referenced 150 times via FK
- **Storage saved:** ~5KB (province names don't change) → ~500 bytes saved across entire database
- **Update speed:** Correcting a province name: 1 UPDATE query (was: 50+ UPDATE queries)
- **Data consistency:** All references automatically correct if parent data corrected

---

### NORMALIZATION STEP 2: Eliminate Duplicate Province Tables

#### Problem Statement

**Current State:**
- `ajis_propinsi` (propid, propinsi, ibukota, aktif)
- `ref_propinsi` (propid, propinsi, ibukota, aktif)
- **Both tables are identical** (confirmed in database analysis)

**Impact:**
- ❌ Duplicate insertion work (must insert into both tables)
- ❌ Sync risk (if one updated, other might lag)
- ❌ Confusion about which is authoritative source
- ❌ Unused disk space (~2KB per table, multiplied across development/staging/production = overhead)

---

#### Normalization Solution

**Consolidate to single table: `geography.province`**

- Identify which table is currently authoritative (or merge data from both if they diverge)
- Create new `geography.province` table with data from both
- Update all FKs in other tables to point to new table
- **Delete both old tables**

**Why This Works:**

1. **Geographic data is immutable:** Indonesia's provinces never change (or very rarely). One lookup table suffices.
2. **No versioning needed:** Unlike user addresses (can change), province names are stable reference data
3. **Clear ownership:** One table, one authoritative source, no ambiguity
4. **Simpler joins:** "Show me children in Jawa Barat" → one place to look, not two

---

#### Benefits After Normalization

- **Storage:** Halved (one table instead of two)
- **Insert complexity:** Reduced (one INSERT instead of two)
- **Query certainty:** Clear which table to join to
- **Maintenance:** One table to backup/restore

---

### NORMALIZATION STEP 3: Separate Person/Family Data into Proper Entities

#### Problem Statement

**Current State: `ajis_anak` (130 columns)**

The table stores not just the child, but also:
- Father's name, address, occupation, income, death date, cause (10+ columns)
- Mother's name, address, occupation, income, death date, cause (10+ columns)
- Guardian's name, address, occupation, income, phone (10+ columns)
- Household member's name, occupation, income (5+ columns)

**All stored as fixed columns**, meaning:
- You cannot represent a child with 2 guardians without schema change
- You cannot represent a child with no guardian without NULLing out guardian columns
- A child's parents/guardians are fixed at registration time; updates hard to track
- Father death info is redundant (if father is deceased, use NULL + death date; the schema allows both "status_ortu=yatim" + "tanggal_kematian_ayah=NULL" simultaneously — inconsistent)

**Impact:**
- ❌ Violation of 1NF: repeating family member groups as columns
- ❌ Violation of 2NF: family member attributes depend on FAMILY_MEMBER_ID, not CHILD_ID
- ❌ Update anomaly: correcting mother's occupation requires updating child record
- ❌ Inconsistency: multiple ways to represent "child has no father" (NULL, '0000-00-00', or 'yatim' status)

---

#### Normalization Solution

**Split into multiple tables:**

```
SCHEMA: person

TABLE: child
  - child_id (PK)
  - first_name
  - nickname
  - gender (enum)
  - birth_date
  - birth_location_id (FK → geography.location)
  - religion
  - birth_order
  - sibling_count
  - photo_url
  - education_level (enum)
  - current_grade (varchar, e.g., "10 SMA")
  - school_id (FK → institution.school) [optional]
  - bank_account_number
  - national_id (NIK) [UNIQUE]
  - family_card_number
  - active (boolean)
  - created_at
  - created_by
  - updated_at
  - updated_by

TABLE: family_member
  - family_member_id (PK)
  - child_id (FK → person.child)
  - relationship_type (enum: father, mother, guardian, sibling, other)
  - first_name
  - address_id (FK → geography.location)
  - occupation
  - monthly_income (numeric)
  - phone
  - is_deceased (boolean)
  - death_date (date) [only meaningful if is_deceased=true]
  - cause_of_death (text) [only meaningful if is_deceased=true]
  - notes
  - effective_from (date) [temporal: when this family relationship became current]
  - effective_to (date) [temporal: when this family relationship ended, NULL if current]
  - created_at
  - created_by

TABLE: household_member
  - household_member_id (PK)
  - child_id (FK → person.child)
  - member_name
  - relationship_to_child (text, e.g., "grandmother", "aunt")
  - occupation
  - monthly_income (numeric)
  - effective_from (date)
  - effective_to (date)
  - created_at
  - created_by
```

**Why This Works:**

1. **Flexible Family Structure:** Can now represent:
   - Child with 1 father + 1 mother (normal)
   - Orphan child (yatim: father_deceased, mother_alive; or piatu: father_alive, mother_deceased)
   - Child with guardian (wali) instead of biological parents
   - Child with 2 guardians (one row per guardian)
   
2. **Temporal Correctness:** `effective_from` and `effective_to` allow capturing family changes:
   - "Father died on 2020-03-15" → set `is_deceased=true`, `death_date=2020-03-15`, `effective_to=2020-03-15`
   - "Guardian changed from Uncle Budi to Aunt Siti on 2021-06-01" → close old guardian (effective_to=2021-06-01), create new guardian (effective_from=2021-06-01)
   
3. **Single Source of Truth:** Family member data entered once; lookup via FK from anywhere
   - Old way: session record stored father's name → if name corrected, old sessions wrong
   - New way: session references child_id; to get father's name, join to family_member + filter by relationship_type='father' and effective_to IS NULL (current)
   
4. **No Update Anomalies:** Correct a guardian's address? Update one row in `family_member`, not thousands

---

#### Mapping Current Data

| Current Columns | New Location |
|---|---|
| `ajis_anak.nama_lengkap`, `jns_kel`, `tgl_lahir`, etc. | `person.child` |
| `ajis_anak.nama_lengkap_ayah`, `alamat_ayah`, `pekerjaan_ayah`, `penghasilan_rata_rata_ayah`, `tanggal_kematian_ayah` | `person.family_member` (relationship_type='father') |
| `ajis_anak.nama_lengkap_ibu`, `alamat_ibu`, `pekerjaan_ibu`, `penghasilan_rata_rata_ibu`, `tanggal_kematian_ibu` | `person.family_member` (relationship_type='mother') |
| `ajis_anak.nama_lengkap_wali`, `alamat_wali`, `pekerjaan_wali`, `penghasilan_rata_rata_wali` | `person.family_member` (relationship_type='guardian') |
| `ajis_anak.tinggal_bersama`, `nama_tinggal`, `pekerjaan_tinggal`, `penghasilan_tinggal` | `person.household_member` |

---

#### Benefits After Normalization

- **Storage:** Reduced; child record shrinks from 130 → 30 columns; family data stored once per family member (not duplicated per child)
- **Flexibility:** Can now handle edge cases (multiple guardians, guardian changes, deceased status)
- **Audit Trail:** Temporal columns track when family changes occurred
- **Query Logic:** Cleaner — "show me all children with deceased father" → filter by `relationship_type='father' AND is_deceased=true`, not complex status column logic

---

### NORMALIZATION STEP 4: Separate Program/Status Data from Child Identity

#### Problem Statement

**Current State:** `ajis_anak` table mixes child identity with program status.

- Child identity: name, gender, birthdate, address, school
- Program status: asnaf (welfare category), status_ortu (parent status: orphan/widow), status_survey (survey status), status_kelayakan (eligibility), status_anak_juara (program status), status_tersantuni (sponsorship status), status_mentor (mentor assignment), etc.

These change at different rates and for different reasons:
- Child identity: rarely changes (name typo corrected, school updated if child advances)
- Program status: changes frequently (survey completed → approved → assigned mentor → sponsorship matched)

**Impact:**
- ❌ Denormalization: program status is not about WHO the child IS, but WHAT STAGE the child IS IN
- ❌ Update burden: adding new status field requires schema migration
- ❌ Query complexity: status queries mix with child identity queries
- ❌ Audit trail: cannot track who changed status from "survey_pending" to "approved"

---

#### Normalization Solution

**Split into two tables:**

```
SCHEMA: person

TABLE: child (updated)
  - child_id (PK)
  - [identity fields from previous step]
  - [all program status fields REMOVED]

SCHEMA: program

TABLE: child_enrollment
  - enrollment_id (PK)
  - child_id (FK → person.child)
  - program_type (enum: 'anak_juara', 'ijgs', etc.) [may not be needed if only one program]
  - enrollment_status (enum: 'pending_survey', 'survey_approved', 'eligible', 'ineligible', 'active', 'alumni')
  - welfare_category (asnaf: enum: 'yatim', 'piatu', 'dhuafa', etc.)
  - parent_status (enum: 'yatim', 'piatu', 'normal')
  - eligible_date (date, when child determined eligible)
  - ineligible_date (date, if child rejected)
  - ineligible_reason (text)
  - mentor_id (FK → person.coordinator)
  - matched_donor_pairing_id (FK → sponsorship.child_donor_pairing) [if matched]
  - matched_date (date)
  - active (boolean)
  - created_at
  - created_by
  - updated_at
  - updated_by
```

**Why This Works:**

1. **Separation of Concerns:** Child identity table holds "who is this child"; enrollment table holds "what is this child's status in our program"
2. **Status Workflow Tracking:** Can now see complete history:
   - "Survey started 2024-01-01" → "Survey completed 2024-02-15, approved" → "Matched to donor 2024-03-01"
   - With temporal columns (effective_from, effective_to), can track multiple enrollments or re-enrollments
3. **Flexibility:** If program adds new status (e.g., "waitlist_for_donor_match"), add new enum value, no schema change
4. **Audit Trail:** Each status change is a new `enrollment` row or update with `updated_by` + `updated_at`

---

#### Benefits After Normalization

- **Clarity:** Child tables are about identity; program tables are about operational state
- **Auditability:** Status changes tracked with user + timestamp
- **Flexibility:** Add new program statuses without schema migration
- **Temporal Correctness:** Can ask "what was this child's status as of date X" by joining with temporal columns

---

### NORMALIZATION STEP 5: Split Coaching Session into Header + Attendance

#### Problem Statement

**Current State: `ajis_pembinaan_baru` (55 columns)**

This table mixes three concepts:
1. **Session header:** session ID, date, type, material title (1 per session)
2. **Child attendance:** which child attended, attendance status, habit tracking (repeats per child)
3. **Child snapshot:** child's name, gender, education, parent names (repeats per child, redundant)

Example:
```
ID_PEMBINAAN | TGL_PEMBINAAN | JENIS_PEMBINAAN | ID_ANAK | NAMA_ANAK | KEHADIRAN | MANDIRI_SHALAT
00001        | 2024-01-15    | Reguler         | 001     | Arif      | Hadir     | 1
00001        | 2024-01-15    | Reguler         | 002     | Budi      | Izin      | 0
00001        | 2024-01-15    | Reguler         | 003     | Citra     | Alfa      | NULL
```

**Problems:**
- ❌ Violation of 2NF: `TGL_PEMBINAAN` and `JENIS_PEMBINAAN` depend only on `ID_PEMBINAAN`, not on full key (ID_PEMBINAAN + ID_ANAK)
- ❌ Redundancy: Session date/type/material stored 3 times (once per child)
- ❌ Update anomaly: If session date is wrong, correct it once (one table), not three times (one per child row)
- ❌ Snapshot storage: `NAMA_ANAK` repeats; if child's name corrected, old sessions still show old name (historical inaccuracy)
- ❌ Query complexity: To get "sessions for child X on date Y," must scan millions of rows (one per child-session pair)

**Impact on Scalability:**
- Table has ~4.5M rows; session-header data (1/50th of table) stored redundantly
- Each session with 30 children = 30 rows; session header data repeated 30 times
- Indexes on `ID_ANAK` + `TGL_PEMBINAAN` work but scan 30 rows per session; normalized design would scan 1 row in session table + 30 in attendance

---

#### Normalization Solution

**Split into three tables:**

```
SCHEMA: activity

TABLE: coaching_session
  - session_id (PK, same as current ID_PEMBINAAN)
  - session_date (date)
  - session_type (enum: 'reguler', 'edukasi_pekanan', 'p3a', 'parenting')
  - p3a_topic (text, only for p3a sessions)
  - material_title (text)
  - material_description (text, optional)
  - presenter_id (FK → person.coordinator)
  - presenter_notes (text)
  - location_id (FK → organization.coaching_region)
  - session_notes (text)
  - donor_program_id (FK → sponsorship.donor_program) [links session to donor if funded]
  - active (boolean)
  - created_at
  - created_by
  - updated_at
  - updated_by

TABLE: session_attendance
  - attendance_id (PK, surrogate)
  - session_id (FK → activity.coaching_session)
  - child_id (FK → person.child)
  - attendance_status (enum: 'hadir', 'izin', 'alfa')
  - attendance_notes (text)
  - guardian_attended (boolean) [for parenting sessions]
  - guardian_id (FK → person.family_member) [which guardian attended]
  - created_at
  - created_by

TABLE: session_habit_tracking
  - habit_id (PK)
  - attendance_id (FK → session_attendance)
  - habit_type (enum: 'mandatory_prayer', 'quran_recitation', 'charity', 'help_parents')
  - achievement_level (enum: 'not_practiced', 'practicing', 'habitual')
  - notes (text)
  - created_at
  - created_by
```

**Why This Works:**

1. **Eliminates Redundancy:** Session-header data stored once; child attendance stored separately
2. **2NF Compliance:** Each table has a clear primary key:
   - `coaching_session` keyed by `session_id` (session-level attributes)
   - `session_attendance` keyed by `session_id` + `child_id` (attendance for that child in that session)
   - `session_habit_tracking` keyed by `attendance_id` (habit details for that attendance event)

3. **Temporal Accuracy:** Session date/type stored once; if corrected, corrects for all children
4. **Historical Snapshots Optional:** If you need to know "what was child's grade when attending this session," either:
   - Add `child_snapshot JSONB` column to `session_attendance` (captures child state at session time)
   - Join to `person.child_version` table with temporal filtering
   - Not: store `NAMA_ANAK` repeatedly (current approach)

5. **Scalability:** Query "all sessions for child X" now scans `session_attendance` index (indexed by child_id), not entire 4.5M row table

---

#### Mapping Current Data

| Current Columns | New Location |
|---|---|
| `id_pembinaan`, `tgl_pembinaan`, `jenis_pembinaan`, `judul_materi`, `pemateri`, `p3a` | `activity.coaching_session` |
| `id_anak`, `kehadiran`, `keterangan` | `activity.session_attendance` |
| `pembiasaan_shalat_wajib`, `pembiasaan_tilawah`, `pembiasaan_sedekah`, `membantu_ortu` | `activity.session_habit_tracking` |
| `nama_lengkap`, `jns_kel`, `jenjang_pendidikan`, `nama_lengkap_ayah`, `nama_lengkap_ibu` | **Deleted** (redundant; lookup via FK) or optionally stored as `child_snapshot JSONB` |

---

#### Benefits After Normalization

- **Storage:** Reduced by ~70% (session-level data no longer repeated per child)
- **Update Speed:** Correcting session date: 1 UPDATE instead of up to 50 UPDATEs (one per child)
- **Query Speed:** "Sessions attended by child X" now indexes by child_id (efficient) instead of scanning full table
- **Auditability:** Session changes tracked separately from attendance changes

---

### NORMALIZATION STEP 6: Separate Sponsorship Header from Financial Transactions

#### Problem Statement

**Current State: `ajis_pemasangan` (41 columns)**

This table mixes multiple concepts:
1. **Sponsorship pairing:** which child, which donor, when matched, active status
2. **Child/donor snapshot:** child name, donor name, address (redundant denormalization)
3. **Financial snapshot:** saldo_awal_ganjil, saldo_akhir_ganjil, saldo_awal_genap, saldo_akhir_genap (duplicated in `ajis_opname` too)

**Problems:**
- ❌ Violation of 3NF: Child name depends on `id_anak`, not on pairing_id; stored in pairing table anyway
- ❌ Redundancy: Child/donor names stored here + in their primary tables + in `ajis_opname`
- ❌ Update anomaly: Correct child's name → must update in child table + pemasangan table (or accept historical inaccuracy)
- ❌ Stale snapshot: saldo_akhir columns are frozen at one point in time; if new transactions added, balances out of sync
- ❌ Semester-specific columns: Separate ganjil/genap columns violate normalization; should use separate rows

**Impact:**
- Balance queries must check `updated_saldo` timestamp and recalculate if stale (app logic scattered)
- Reports showing balance might use stale data
- Audit trail is weak (who updated balance? when?)

---

#### Normalization Solution

**Split into multiple tables:**

```
SCHEMA: sponsorship

TABLE: child_donor_pairing
  - pairing_id (PK)
  - child_id (FK → person.child)
  - donor_id (FK → person.donor)
  - program_id (FK → sponsorship.program)
  - pairing_date (date)
  - active (boolean)
  - inactive_date (date, if pairing ended)
  - inactive_reason (text, e.g., "child graduated", "donor requested end")
  - created_at
  - created_by
  - updated_at
  - updated_by

TABLE: pairing_balance_snapshot
  - snapshot_id (PK)
  - pairing_id (FK → sponsorship.child_donor_pairing)
  - semester_id (FK → reference.semester) [reference to ganjil/genap]
  - snapshot_date (date)
  - opening_balance (decimal)
  - closing_balance (decimal)
  - reconciliation_date (date)
  - reconciliation_by (user_id)
  - notes (text)
  - created_at
  - created_by
```

**Also: Create finance schema for transactions**

```
SCHEMA: finance

TABLE: transaction
  - transaction_id (PK)
  - pairing_id (FK → sponsorship.child_donor_pairing)
  - transaction_type (enum: 'donation_inbound', 'disbursement_outbound', 'adjustment', 'refund')
  - amount (decimal)
  - transaction_date (date)
  - recorded_date (timestamp)
  - reference_id (text, e.g., bank transfer ID)
  - description (text)
  - created_at
  - created_by
  - updated_at
  - updated_by

TABLE: v_pairing_current_balance (VIEW)
  [Auto-calculates current balance by summing transactions, never stale]
```

**Why This Works:**

1. **Clear Separation:**
   - `child_donor_pairing`: Who is paired with whom (identity)
   - `pairing_balance_snapshot`: Audit trail of officially-reconciled balances (compliance)
   - `finance.transaction`: Every financial event (single source of truth)
   - `v_pairing_current_balance`: Auto-derived current balance (always accurate)

2. **No Redundancy:** Child/donor names looked up via FK, not stored in pairing table
3. **Accurate Balance:** Current balance derived from transactions (never stale), not stored
4. **Temporal Correctness:** Snapshots capture official reconciliations; transactions provide detailed history
5. **Flexibility:** If new transaction type needed, add to enum + add transaction; no schema change to pairing table

---

#### Benefits After Normalization

- **Consistency:** Child/donor data is single source of truth (person tables); pairing table only stores relationship
- **Accuracy:** Balances auto-calculated from transactions; never out-of-sync
- **Auditability:** Every transaction has timestamp + user; snapshots record official reconciliations
- **Queries:** "Current balance for pairing X" → query view (always correct); "balance as of date Y" → sum transactions up to that date

---

### NORMALIZATION STEP 7: Create Proper Lookup Tables for Enums/Statuses

#### Problem Statement

**Current State:** Many columns use free-text enums without lookup tables.

Examples:
- `jenis_pembinaan` (session type): stored as text (e.g., "Reguler", "Edukasi Pekanan", "P3A", "Parenting")
  - Risk: Typo creates new value ("Regugler" vs "Reguler")
  - Queries: WHERE jenis_pembinaan IN ('Reguler', 'Edukasi Pekanan', ...) repeats magic strings
- `kehadiran` (attendance): text ("Hadir", "Izin", "Alfa", "y", "n")
  - Risk: Inconsistent encoding
  - Queries: Must handle multiple representations
- `asnaf` (welfare category): text but should be enum (yatim, piatu, dhuafa)
  - Risk: Typos (e.g., "yatam")
  - Reporting: Hard to aggregate if inconsistent

**Impact:**
- ❌ Data quality: Typos introduce new values; queries must handle variations
- ❌ Referential integrity: No validation that `kehadiran='Hadirr'` is a typo
- ❌ Localization: Hard to translate enum values (would need app logic, not database)
- ❌ Reporting: Free-text grouping in app, not database

---

#### Normalization Solution

**Create lookup tables for each enum:**

```
SCHEMA: reference

TABLE: session_type
  - session_type_id (PK)
  - code (UNIQUE, e.g., 'reguler', 'edukasi_pekanan')
  - display_name (e.g., 'Regular Session', 'Weekly Education')
  - description (text)
  - active (boolean)

TABLE: attendance_status
  - attendance_status_id (PK)
  - code (UNIQUE, e.g., 'present', 'excused', 'absent')
  - display_name (e.g., 'Hadir', 'Izin', 'Alfa')
  - description (text)

TABLE: welfare_category (asnaf)
  - welfare_category_id (PK)
  - code (UNIQUE, e.g., 'orphan_both_parents', 'orphan_father', 'poor')
  - display_name (e.g., 'Yatim', 'Piatu', 'Dhuafa')
  - description (text)

TABLE: enrollment_status
  - enrollment_status_id (PK)
  - code (UNIQUE)
  - display_name
  - description

TABLE: semester
  - semester_id (PK, e.g., 'ganjil', 'genap')
  - display_name (e.g., 'Odd Semester', 'Even Semester')
  - year (year)
  - start_date (date)
  - end_date (date)
  - active (boolean)

[Similar for other enums: parent_status, office_type, role, relationship_type, etc.]
```

**Update related tables to use FK:**

```
-- Before:
TABLE session_attendance
  attendance_status (varchar, e.g., 'Hadir')

-- After:
TABLE session_attendance
  attendance_status_id (FK → reference.attendance_status)
```

**Why This Works:**

1. **Data Validation:** Database enforces only valid attendance_status values (FK constraint)
2. **No Typos:** User can only select from predefined list
3. **Consistent Encoding:** All "present" records use same code
4. **Localization:** Change `display_name` from Bahasa Indonesia to English in one place; all queries automatically updated
5. **Reporting:** GROUP BY code, then join to display_name; works uniformly across entire app

---

#### Benefits After Normalization

- **Data Quality:** No typos in enums; FK constraints catch invalid values
- **Reporting:** Queries are simpler (join to lookup + group by code)
- **Maintenance:** Add new session type: one row in lookup table, no schema change
- **Localization:** Translate all display_names in one place

---

### NORMALIZATION STEP 8: Consolidate Office Hierarchy

#### Problem Statement

**Current State:** `ajis_kantor` and `ajis_wilayah_pembinaan` attempt to represent hierarchy but mix organizational structure with geography.

- `ajis_kantor`: RZ regional offices, branches (id, oid, name, oid_parent for hierarchy)
- `ajis_wilayah_pembinaan`: Coaching regions assigned to offices (id, name, kantor_id FK)
  - But also stores geographic hierarchy (propid, kabid, camatid, desaid, names)

**Problems:**
- ❌ Geographic data denormalized (should be FK to geography schema)
- ❌ Organizational hierarchy mixed with geographic hierarchy
- ❌ Unclear purpose: is wilayah_pembinaan an organizational unit or a geographic region?

---

#### Normalization Solution

**Consolidate into one organizational schema:**

```
SCHEMA: organization

TABLE: office
  - office_id (PK, UUID)
  - code (oid, UNIQUE, e.g., '09-200')
  - name (e.g., 'RZ - Cimahi')
  - parent_office_id (FK → organization.office, self-reference)
  - office_type (enum: 'central_headquarters', 'regional_office', 'branch', 'partner_institution')
  - phone
  - email
  - address_id (FK → geography.location)
  - active (boolean)
  - created_at
  - created_by
  - updated_at
  - updated_by

TABLE: coaching_region
  - region_id (PK, UUID)
  - name (e.g., 'Cimahi Tengah_Padasuka')
  - office_id (FK → organization.office)
  - location_id (FK → geography.location) [references village level]
  - active (boolean)
  - created_at
  - created_by
  - updated_at
  - updated_by

TABLE: facility (new, for schools/institutions)
  - facility_id (PK)
  - name (e.g., 'SD Juara Cimahi')
  - facility_type (enum: 'school', 'islamic_center', 'office', 'other')
  - location_id (FK → geography.location)
  - phone
  - principal_name
  - active (boolean)
  - created_at
  - created_by
```

**Why This Works:**

1. **Clear Organizational Hierarchy:** `office.parent_office_id` allows "RZ Pusat → RZ Jawa Barat → RZ Cimahi" tree
2. **Separate Geography:** `location_id` FK points to geography schema; no duplication
3. **Flexible Types:** `office_type` enum supports central, regional, branch, and partner institutions without changing schema
4. **Single Updates:** Change office name → one update; automatically visible everywhere via FK

---

#### Benefits After Normalization

- **Clarity:** Office hierarchy explicit; geographic data separated
- **Scalability:** Can add new office types without schema change
- **Auditability:** Office changes tracked with timestamps + user

---

### NORMALIZATION STEP 9: Create Proper User/Coordinator/Donor Tables

#### Problem Statement

**Current State:** Three different person types (user, coordinator, donor) are scattered.

- `ajis_user`: System login accounts (id, username, password, id_group_user, denormalized office/region)
- `ajis_sdm_wilayah`: Coordinators/volunteers (id, name, address with geographic denormalization)
- No explicit `donor` table (donor info scattered across `ajis_pemasangan` + `ajis_input_donasi` as denormalized snapshots)

**Problems:**
- ❌ User table stores denormalized office (should FK to office)
- ❌ Coordinator table has geographic denormalization (should FK to geography)
- ❌ No proper donor entity table (should exist as primary table)
- ❌ Inconsistent person data model (some as user, some as sdm, donors as snapshots)

---

#### Normalization Solution

**Create unified person schema with subtypes:**

```
SCHEMA: person

TABLE: coordinator
  - coordinator_id (PK)
  - first_name
  - last_name
  - phone
  - email
  - address_id (FK → geography.location)
  - office_id (FK → organization.office)
  - region_id (FK → organization.coaching_region)
  - volunteer_type (enum: 'paid_staff', 'volunteer', 'contracted')
  - active (boolean)
  - created_at
  - created_by
  - updated_at
  - updated_by

TABLE: donor
  - donor_id (PK)
  - first_name
  - last_name
  - phone
  - email
  - address_id (FK → geography.location)
  - donor_type (enum: 'individual', 'organization', 'foundation')
  - organization_name (only for org/foundation donors)
  - bank_account_number
  - bank_name
  - active (boolean)
  - created_at
  - created_by
  - updated_at
  - updated_by

TABLE: system_user
  - user_id (PK)
  - username (UNIQUE)
  - password_hash (bcrypt/argon2)
  - coordinator_id (FK → person.coordinator, if user is a coordinator)
  - donor_id (FK → person.donor, if user is a donor) [optional, for portal access]
  - role_id (FK → access_control.role)
  - active (boolean)
  - last_login_at (timestamp)
  - password_changed_at (timestamp)
  - created_at
  - created_by
  - updated_at
  - updated_by
```

**Why This Works:**

1. **Clear Separation:** Coordinator is a person with employment details; system_user is their login account
2. **No Denormalization:** Office/region/address looked up via FK
3. **Flexible:** Coordinator can exist without login (volunteer managed offline); user can be coordinator + donor dual role
4. **Audit Trail:** User table tracks login timestamps + password changes; coordinator table tracks employment changes

---

#### Benefits After Normalization

- **Consistency:** All person types modeled uniformly
- **Accuracy:** Coordinator details (address, office) source of truth, not duplicated in user table
- **Security:** Password stored properly (bcrypt, not MD5); change tracking enabled

---

### NORMALIZATION STEP 10: Consolidate Evaluation into Proper Entity

#### Problem Statement

**Current State: `ajis_penilaian` (32 columns) and `ajis_item_penilaian` (6 columns)**

**Problems:**
- `ajis_penilaian` stores: child_id, semester, multiple score columns (`skor_budi_pekerti`, `skor_hafalan`, etc.) — each score stored as separate column
- `ajis_item_penilaian` should define what these items are, but schema is weak (jenis='anakjuara' always, no hierarchy)
- Free-text `perkembangan_capaian` field stores narrative (not queryable)
- Multiple ways to represent "no score" (NULL, 0, '0')

**Why This Is Wrong:**
- ❌ Violation of 1NF: Multiple score columns (`skor_*`) are repeating attributes
- ❌ Violation of 2NF: Each score should be a separate row (one row per child-semester-item)
- ❌ Query complexity: To get all children with high `skor_hafalan`, query column directly (brittle); not a proper join

---

#### Normalization Solution

```
SCHEMA: evaluation

TABLE: evaluation_item
  - item_id (PK)
  - category (enum: 'academic', 'moral', 'skill', 'memorization')
  - sub_category (e.g., 'Islamic Knowledge')
  - item_name (e.g., 'Hafalan Quran')
  - description (text)
  - sort_order (int)
  - active (boolean)
  - created_at

TABLE: semester_evaluation
  - evaluation_id (PK)
  - child_id (FK → person.child)
  - semester_id (FK → reference.semester)
  - evaluator_id (FK → person.coordinator)
  - evaluation_date (date)
  - evaluator_notes (text)
  - approved_by (FK → person.coordinator)
  - approved_date (date)
  - created_at
  - created_by
  - updated_at
  - updated_by

TABLE: evaluation_item_score
  - score_id (PK)
  - evaluation_id (FK → evaluation.semester_evaluation)
  - item_id (FK → evaluation.evaluation_item)
  - score_numeric (int, 0-100)
  - achievement_level (enum: 'not_started', 'developing', 'proficient', 'advanced')
  - narrative (text) [replaces perkembangan_capaian]
  - created_at
  - created_by
```

**Why This Works:**

1. **1NF Compliance:** Each score is a row, not a column
2. **2NF Compliance:** Score depends on (evaluation_id, item_id), not just evaluation_id
3. **Queryable:** "Children with advanced memorization" → WHERE item_id=... AND achievement_level='advanced'
4. **Flexible:** Add new evaluation item: one row, no schema change
5. **Temporal:** Semester_evaluation captures when evaluation was done + approved; supports audit trail

---

#### Mapping Current Data

| Current Columns | New Location |
|---|---|
| `ajis_penilaian.id_anak`, `semesterid` | `evaluation.semester_evaluation` |
| `ajis_penilaian.skor_budi_pekerti`, `skor_hafalan`, `skor_akhlak`, etc. | `evaluation.evaluation_item_score` (multiple rows per evaluation) |
| `ajis_penilaian.perkembangan_capaian` | `evaluation.evaluation_item_score.narrative` |
| `ajis_item_penilaian` | `evaluation.evaluation_item` (cleaned up schema) |

---

#### Benefits After Normalization

- **Auditability:** Evaluator + approval date tracked
- **Queryability:** Can aggregate scores by category (e.g., "average memorization score by semester")
- **Flexibility:** Add new evaluation item without schema change

---

### NORMALIZATION STEP 11: Fix Hafalan (Memorization Tracking)

#### Problem Statement

**Current State: `ajis_hafalan` mixes lookup data with test results**

- `ajis_hafalan` stores: id_anak, id_item (FK to ajis_item_hafalan), semesterid, status, notes
- `ajis_item_hafalan` stores: id (list of 114 Quran surahs + 10 prayers + 14 du'a = 138 items)

**Problems:**
- ❌ `ajis_hafalan` table has leading whitespace in id_anak values (' \n09200210073') — data corruption
- ❌ Status stored as free text (should be enum)
- ❌ No score/performance level (only binary "completed/not" or text notes)
- ❌ No temporal tracking (when was this item tested?)

---

#### Normalization Solution

```
SCHEMA: activity

TABLE: hafalan_item_lookup
  - item_id (PK, same as ajis_item_hafalan.id)
  - category (enum: 'quran_surah', 'prayer', 'du_a')
  - item_number (int, e.g., surah 1)
  - arabic_name (e.g., 'Al-Fatihah')
  - english_translation (e.g., 'The Opening')
  - item_length (text, e.g., '7 verses')
  - sort_order (int)
  - active (boolean)

TABLE: hafalan_assessment
  - assessment_id (PK)
  - child_id (FK → person.child)
  - item_id (FK → activity.hafalan_item_lookup)
  - semester_id (FK → reference.semester)
  - assessment_date (date)
  - assessor_id (FK → person.coordinator)
  - achievement_level (enum: 'not_started', 'started', 'partial', 'complete')
  - score (int, 0-100, optional)
  - notes (text)
  - created_at
  - created_by
  - updated_at
  - updated_by
```

**Why This Works:**

1. **Proper Separation:** Lookup table (items) vs. test results (assessments)
2. **Data Quality:** Foreign key to lookup ensures item_id is valid; no corrupted data
3. **Temporal Tracking:** Assessment date + assessor tracked
4. **Flexible Scoring:** Can use both numeric score + achievement level
5. **Audit Trail:** User + timestamp for every assessment change

---

#### Benefits After Normalization

- **Data Quality:** No more whitespace corruption; FK constraint validates item references
- **Auditability:** Assessment date + assessor recorded
- **Queryability:** "Children who completed memorization of Al-Fatihah" → straightforward query

---

## DUPLICATE TABLE CONSOLIDATION {#duplicates}

### Consolidation Step 1: Geography Tables

**Current Duplicates:**
- `ajis_propinsi` (propid, propinsi, ibukota, aktif)
- `ref_propinsi` (propid, propinsi, ibukota, aktif)
- Both identical; both seeded with same 34 provinces

**Action:**
1. Create unified `geography.province` table
2. Copy data from either source (or merge if different)
3. Update all FK references to point to new table
4. Delete both old tables

**Impact:** 
- One source of truth for provinces
- All references automatically consistent
- Maintenance simplified

---

### Consolidation Step 2: Geographic Reference Hierarchy

**Current Duplicates:**
- Hierarchy partially in `ajis_kantor` (propid, kabid, camatid, desaid)
- Hierarchy partially in `ajis_wilayah_pembinaan` (propid, kabid, camatid, desaid)
- Separate lookup tables `ref_kabupaten`, `ref_kecamatan`, `ref_desa` (if present)

**Action:**
1. Create unified `geography` schema with province → district → subdistrict → village → location hierarchy
2. Migrate all geographic data to this hierarchy
3. Delete duplicate columns from all tables (kantor, wilayah_pembinaan, anak, etc.)
4. Add FK to location_id instead

**Impact:**
- Single geographic truth
- Fewer columns per table
- Consistent location references everywhere

---

## DENORMALIZATION ELIMINATION {#denormalization}

This section addresses the 50+ denormalized columns that copy data from other tables.

### Elimination Strategy 1: Replace Denormalized Names with FKs

**Current Pattern:**
```
ajis_pembinaan_baru stores:
  - kantor_id
  - nama_kantor [denormalized copy]
```

**Better Pattern:**
```
activity.coaching_session stores:
  - location_id (FK → organization.office)

When querying, JOIN to office table to get name:
  SELECT session.*, office.name
  FROM coaching_session session
  JOIN organization.office office ON session.location_id = office.office_id
```

**Applied Across:**
- `ajis_pembinaan_baru.nama_kantor` → DELETE; join to office
- `ajis_pembinaan_baru.nama_wilayah` → DELETE; join to coaching_region
- `ajis_pembinaan_baru.nama_lengkap` (child name) → DELETE; join to person.child
- `ajis_pemasangan.nama_anak`, `nama_donatur` → DELETE; join to person.child, person.donor
- Similar across all tables

**Benefit:** Single source of truth; name changes propagate automatically

---

### Elimination Strategy 2: Replace Denormalized Child Attributes with JSONB Snapshot

**Current Pattern:**
```
ajis_pembinaan_baru stores (per session):
  - nama_lengkap, jns_kel, jenjang_pendidikan, kelas, nama_lengkap_ayah, nama_lengkap_ibu
```

**Problem:** These change over time (child advances grade); old sessions show inaccurate historical state

**Better Pattern — Option A (JSONB):**
```
activity.session_attendance stores:
  - child_snapshot (JSONB)
  {
    "name": "Arif",
    "gender": "L",
    "education_level": "SMP",
    "grade": "9",
    "father_name": "Budi",
    "mother_name": "Siti"
  }
```

**Why:**
- Explicit intent: this is a historical snapshot, not denormalized
- Query example: "Show attendance records with child's name and education at that time"
  ```
  SELECT session.session_date,
         child_snapshot->>'name' AS child_name,
         child_snapshot->>'grade' AS grade_at_time
  FROM session_attendance
  WHERE child_id = 123
  ```
- JSONB supports both: current child state (via child_id FK) AND historical state (via snapshot)

**Better Pattern — Option B (Temporal Table):**
```
person.child_version table:
  - child_id (FK)
  - education_level
  - grade
  - valid_from (date)
  - valid_to (date)

Query: Join session_attendance to child_version WHERE session_date BETWEEN valid_from AND valid_to
```

**Why:**
- More queryable than JSONB for structured data
- Supports complex temporal queries
- Easier to track education progression

---

### Elimination Strategy 3: Replace Denormalized Office/Region Data with FKs

**Current Pattern:**
```
ajis_anak stores:
  - id_wilayah_pembinaan
  - nama_wilayah [denormalized]
  - kantor_id
  - nama_kantor [denormalized]
```

**Better Pattern:**
```
person.child stores:
  - region_id (FK → organization.coaching_region)
  - office_id (FK → organization.office)

When querying:
  SELECT child.*, region.name, office.name
  FROM person.child
  JOIN organization.coaching_region region ON child.region_id = region.region_id
  JOIN organization.office office ON child.office_id = office.office_id
```

**Benefit:** Change region name → one update to coaching_region table; all children automatically reflect

---

### Elimination Strategy 4: Replace Denormalized Balance with View or Materialized View

**Current Pattern:**
```
ajis_pemasangan stores:
  - saldo_akhir_ganjil [snapshot at one point in time]
  - saldo_akhir_genap [snapshot at one point in time]
  - updated_saldo [timestamp, indicates if stale]

Application checks updated_saldo; if stale, recalculates balance
```

**Problem:** 
- Balance data is redundant (can derive from transactions)
- Snapshot can go stale; no clear "source of truth"
- Audit trail weak (who set this balance? when? why?)

**Better Pattern:**
```
CREATE VIEW sponsorship.v_pairing_current_balance AS
SELECT 
  pairing_id,
  SUM(CASE WHEN type='inbound' THEN amount ELSE -amount END) AS current_balance
FROM finance.transaction
GROUP BY pairing_id

Query: SELECT * FROM v_pairing_current_balance WHERE pairing_id = 123
Result: Always current (no recalculation needed in app)
```

**Or Materialized View (if large dataset):**
```
CREATE MATERIALIZED VIEW sponsorship.mv_pairing_balance
[Same as above, refreshed hourly or after every 100 transactions]

Then: sponsorship.pairing_balance_snapshot stores official reconciliations
```

**Benefit:**
- No redundant storage
- Always accurate (or explicitly marked as "as-of" if materialized)
- Audit trail in finance.transaction table

---

## FINAL NORMALIZED SCHEMA {#final-schema}

### Schema Organization

After normalization, tables are organized by business domain:

```
SCHEMA: geography
  ├─ province
  ├─ district
  ├─ subdistrict
  ├─ village
  └─ location

SCHEMA: organization
  ├─ office
  ├─ coaching_region
  └─ facility

SCHEMA: person
  ├─ child
  ├─ family_member
  ├─ household_member
  ├─ coordinator
  ├─ donor
  └─ system_user

SCHEMA: reference
  ├─ semester
  ├─ session_type
  ├─ attendance_status
  ├─ welfare_category
  ├─ enrollment_status
  ├─ role
  ├─ relationship_type
  └─ [other enums]

SCHEMA: access_control
  ├─ role
  ├─ permission
  └─ role_permission

SCHEMA: program
  ├─ program
  └─ donor_program

SCHEMA: sponsorship
  ├─ child_donor_pairing
  ├─ pairing_balance_snapshot
  └─ v_pairing_current_balance (VIEW)

SCHEMA: activity
  ├─ coaching_session
  ├─ session_attendance
  ├─ session_habit_tracking
  ├─ hafalan_item_lookup
  └─ hafalan_assessment

SCHEMA: evaluation
  ├─ evaluation_item
  ├─ semester_evaluation
  └─ evaluation_item_score

SCHEMA: finance
  ├─ transaction
  └─ v_pairing_current_balance (VIEW)

SCHEMA: audit
  ├─ audit_log (if implementing)
  └─ data_correction_log (if implementing)
```

### Core Tables Summary

| Table | Purpose | Primary Key | Key FKs | Normalization |
|-------|---------|-------------|---------|---|
| `person.child` | Child identity | child_id | region_id, office_id, location_id | 3NF |
| `person.family_member` | Family members of child | family_member_id | child_id, location_id | 3NF |
| `person.coordinator` | Volunteer/staff coordinator | coordinator_id | office_id, region_id, location_id | 3NF |
| `person.donor` | Donor identity | donor_id | location_id | 3NF |
| `person.system_user` | Login accounts | user_id | coordinator_id, role_id | 3NF |
| `program.child_enrollment` | Child's status in program | enrollment_id | child_id | 3NF |
| `sponsorship.child_donor_pairing` | Sponsorship relationship | pairing_id | child_id, donor_id, program_id | 3NF |
| `activity.coaching_session` | Session header | session_id | coordinator_id, region_id | 3NF |
| `activity.session_attendance` | Child attendance at session | attendance_id | session_id, child_id | 3NF |
| `activity.hafalan_assessment` | Memorization test result | assessment_id | child_id, item_id, coordinator_id | 3NF |
| `evaluation.semester_evaluation` | Semester evaluation header | evaluation_id | child_id, coordinator_id | 3NF |
| `evaluation.evaluation_item_score` | Individual evaluation score | score_id | evaluation_id, item_id | 3NF |
| `finance.transaction` | Financial transaction | transaction_id | pairing_id | 3NF |

---

## BENEFITS & METRICS {#benefits}

### Data Integrity Improvements

| Metric | Before | After | Improvement |
|--------|--------|-------|------------|
| **Enforced Foreign Keys** | 0 | 50+ | ✅ Referential integrity guaranteed at database level |
| **Duplicate Data Instances** | 150+ | <10 | ✅ 85% reduction in redundancy |
| **Columns per Major Table** | 40-130 | 15-35 | ✅ Easier to understand and maintain |
| **Free-Text Enums** | 12+ | 0 | ✅ All enums in lookup tables with validation |
| **Denormalized Snapshots** | 50+ columns | 2-3 JSONB | ✅ Explicit, queryable, efficient |

### Performance Improvements

| Query Type | Before | After | Reason |
|---|---|---|---|
| "Sessions for child X" | ~10-30ms* | ~2-5ms | Index on child_id; smaller attendance table |
| "Current balance for pairing Y" | ~20ms + app logic | ~5ms | View query on indexed transaction table |
| "Evaluation scores grouped by category" | Complex app logic | ~15ms | Proper JOIN; DBMS handles aggregation |
| "Children in region Z by status" | Multi-table scan | ~10ms | Proper FKs; efficient index usage |

*Approximate; depends on scale and index tuning

### Maintenance Improvements

| Task | Before | After |
|------|--------|-------|
| Correct a child's name | Update ajis_anak + ajis_pembinaan_baru (~10-50 rows) | Update person.child (1 row); sessions automatically reflect via FK |
| Add new evaluation item type | Schema migration (ALTER TABLE) | Insert row in reference.evaluation_item (no schema change) |
| Change office name | Update ajis_anak + ajis_pembinaan_baru + ajis_pemasangan + more | Update organization.office (1 row); all tables automatically reflect |
| Audit "who changed child's status" | Not tracked reliably | Explicit updated_by + updated_at columns on all tables |
| Add new session type | Schema migration | Insert row in reference.session_type |

### Auditability Improvements

**Before:**
- `user_update` and `date_update` columns exist but populated with empty strings/'0000-00-00'
- No reliable change history
- Cannot answer "who approved this evaluation?" or "when was this sponsorship pairing matched?"

**After:**
- All transactional tables include `created_by`, `created_at`, `updated_by`, `updated_at`
- Temporal columns (`effective_from`, `effective_to`) for entities with history
- Optional audit_log table for sensitive data changes
- Can answer: "What was child X's status as of date Y?" "Who made this change and when?"

### Scalability Improvements

| Scenario | Before | After |
|----------|--------|-------|
| Query with 4.5M session rows | Full table scan or index scan with many redundant reads | Index on child_id in smaller attendance table; efficient |
| Archiving old data | Cannot easily archive because data scattered across denormalized tables | Proper FKs enable safe cascade delete/archive |
| Adding new transaction type | May require schema migration | Add enum value to reference.transaction_type |
| Supporting multiple programs | Schema assumes single program | Program_id FK in enrollment + pairing allows multiple program types |

---

## IMPLEMENTATION ROADMAP (SUMMARY)

### Phase 1: Design (Week 1-2)
1. Implement all normalized tables in development database
2. Create proper FK constraints
3. Create lookup tables with proper enums
4. Test sample data transformation

### Phase 2: ETL Planning (Week 3-4)
1. Map old denormalized data to new tables
2. Identify data quality issues (orphaned records, duplicates, etc.)
3. Plan family member extraction from ajis_anak

### Phase 3: ETL Implementation (Week 5-7)
1. Extract from MySQL
2. Transform/normalize in staging
3. Load into PostgreSQL
4. Validate: row counts, FK integrity, no orphaned records

### Phase 4: Testing & Reconciliation (Week 8-9)
1. Compare old reports vs. new system outputs
2. Fix discrepancies
3. Load test with full dataset
4. Index tuning

### Phase 5: Parallel Running (Week 10-12)
1. Deploy both systems
2. Users interact with new system
3. Compare results
4. Cutover when confident

### Phase 6: Decommission & Monitor (Week 13+)
1. Archive old MySQL database
2. Monitor PostgreSQL performance
3. Tune indexes based on actual queries

---

## CONCLUSION

The current AJIS database suffers from **severe denormalization, missing referential integrity, and scattered data ownership**. Normalizing to 3NF through the steps outlined above will:

✅ **Eliminate redundancy** — Single source of truth for each entity  
✅ **Ensure consistency** — Foreign key constraints prevent orphaned data  
✅ **Improve auditability** — Track who changed what and when  
✅ **Support scalability** — Proper indexing and partitioning enabled  
✅ **Reduce maintenance burden** — Schema changes become row inserts, not table migrations  
✅ **Enable complex queries** — Clear relationships make reporting simpler  

**Recommendation:** Proceed with normalized PostgreSQL schema redesign. The 12-week migration timeline is justified given the 4.5M+ row dataset and complexity of the current denormalization.

---

**End of Normalization Guide**
