# 14_DATABASE_MIGRATION.md

## AJIS — Anak Juara Information System
### PostgreSQL Migration SQL

**Prepared for:** Rumah Zakat — Anak Juara Program
**Target Database:** PostgreSQL 14+, hosted on Neon
**Source documents:** `09_AJIS_PostgreSQL_ERD.md` (entity relationships), `10_DATABASE_SPECIFICATION.md` (authoritative table-by-table specification — **this document implements that specification; the specification remains the source of truth if the two ever disagree**)
**Document date:** July 14, 2026

> Per `00_PROJECT_CONTEXT.md` §12 and §13: migration files are the *execution* of schema changes; `10_DATABASE_SPECIFICATION.md` remains the *specification* they conform to. This document is not a substitute for that specification — it is the SQL that implements it, one incremental, version-controlled file at a time. **No migration has been applied to any environment yet** — these are new files, to be run against a Neon development branch first (see `13_SETUP_GUIDE.md` §6.3).

---

## Table of Contents

1. [How These Migrations Are Structured](#1-how-these-migrations-are-structured)
2. [Execution Order & Dependency Graph](#2-execution-order--dependency-graph)
3. [Migration 0001 — Create Schemas](#migration-0001--create-schemas)
4. [Migration 0002 — Geography Schema](#migration-0002--geography-schema)
5. [Migration 0003 — Reference Schema](#migration-0003--reference-schema)
6. [Migration 0004 — Organization Schema](#migration-0004--organization-schema)
7. [Migration 0005 — Person Schema](#migration-0005--person-schema)
8. [Migration 0006 — Access Control Schema](#migration-0006--access-control-schema)
9. [Migration 0007 — Program Schema](#migration-0007--program-schema)
10. [Migration 0008 — Sponsorship Schema](#migration-0008--sponsorship-schema)
11. [Migration 0009 — Activity Schema](#migration-0009--activity-schema)
12. [Migration 0010 — Evaluation Schema](#migration-0010--evaluation-schema)
13. [Migration 0011 — Finance Schema](#migration-0011--finance-schema)
14. [Migration 0012 — `updated_at` Trigger Function & Triggers](#migration-0012--updated_at-trigger-function--triggers)
15. [Migration 0013 — Finance Immutability Trigger](#migration-0013--finance-immutability-trigger)
16. [Verification Queries](#16-verification-queries)
17. [Known Deviations From the Specification & Why](#17-known-deviations-from-the-specification--why)
18. [Open Items Carried Forward (Not Resolved by This Migration)](#18-open-items-carried-forward-not-resolved-by-this-migration)

---

## 1. How These Migrations Are Structured

- **One file per schema (namespace)**, in dependency order, plus two cross-cutting files at the end (audit triggers, finance immutability). This mirrors `00_PROJECT_CONTEXT.md` §12 ("version-controlled, incremental SQL migrations — never a one-time schema+data snapshot").
- **Every migration is idempotent-safe to review but not idempotent-safe to re-run** — each uses plain `CREATE TABLE`/`CREATE INDEX` (no `IF NOT EXISTS`) so that running it twice against the same database fails loudly rather than silently no-op'ing, consistent with the "fails loudly if migration fails" rule in `12_TASK_BREAKDOWN.md` Task 98. Your migration runner (`scripts/migrate.ts`) is responsible for tracking which files have already been applied.
- **Every migration includes a Rollback (`.down.sql`) block.** Rollbacks drop in strict reverse dependency order. Rolling back `0005_person_schema.sql` after later migrations have been applied will fail on FK dependency — roll back in reverse numeric order, always.
- **File naming convention:** `NNNN_description.sql` with a matching `NNNN_description.down.sql`, placed under `migrations/` per `13_SETUP_GUIDE.md` §3.
- **Table/column set matches `10_DATABASE_SPECIFICATION.md` exactly** — every column, `CHECK`, FK, delete rule, and index named in that document is implemented here. Nothing here introduces a new business column beyond what's specified (see §18 for the fields that specification explicitly left open).

---

## 2. Execution Order & Dependency Graph

```
0001 create_schemas
  ↓
0002 geography            (standalone — no FKs into other schemas)
  ↓
0003 reference             (standalone — no FKs into other schemas)
  ↓
0004 organization           (standalone — self-referencing only)
  ↓
0005 person                (needs: organization.office, reference.role)
  ↓
0006 access_control          (needs: reference.role)
  ↓
0007 program                (needs: person.child, reference.welfare_category)
  ↓
0008 sponsorship             (needs: person.child, person.donor, program.program)
  ↓
0009 activity                (needs: organization.coaching_region, person.coordinator,
  ↓                            reference.session_type, person.child, reference.attendance_status,
  ↓                            activity.hafalan_item_lookup)
0010 evaluation              (needs: person.child, reference.semester, person.coordinator)
  ↓
0011 finance                 (needs: sponsorship.child_donor_pairing)
  ↓
0012 updated_at_triggers     (needs: every table created above with an updated_at column)
  ↓
0013 finance_immutability    (needs: finance.transaction)
```

Geography and reference have no incoming FKs from any other schema in this phase (per the open items in `10_DATABASE_SPECIFICATION.md` §18 — `child`, `coordinator`, and `donor` do not yet carry a `location_id` column, since the full column list for those tables is still to be confirmed). They are still sequenced early because they are natural reference data and other tables will very likely gain a `location_id` FK once that confirmation happens — see §17.

---

## Migration 0001 — Create Schemas

**Purpose:** create the ten namespaces every subsequent migration builds into. Nothing else happens in this file — no tables, no data — so it can be applied once, safely, at the very start of any environment's lifecycle.

```sql
-- migrations/0001_create_schemas.sql

CREATE SCHEMA geography;
CREATE SCHEMA organization;
CREATE SCHEMA person;
CREATE SCHEMA reference;
CREATE SCHEMA access_control;
CREATE SCHEMA program;
CREATE SCHEMA sponsorship;
CREATE SCHEMA activity;
CREATE SCHEMA evaluation;
CREATE SCHEMA finance;

COMMENT ON SCHEMA geography IS 'Province -> district -> subdistrict -> village hierarchy and physical location data.';
COMMENT ON SCHEMA organization IS 'Rumah Zakat''s own structure: offices, office hierarchy, coaching regions, facilities.';
COMMENT ON SCHEMA person IS 'Every human entity in AJIS and how each one authenticates.';
COMMENT ON SCHEMA reference IS 'Small, stable lookup tables - the enum-replacement pattern used throughout AJIS.';
COMMENT ON SCHEMA access_control IS 'Role-based feature permissions, separate from row-level data scoping.';
COMMENT ON SCHEMA program IS 'What program a child is in and their eligibility status within it.';
COMMENT ON SCHEMA sponsorship IS 'Donor-to-child sponsorship relationships and program funding linkage.';
COMMENT ON SCHEMA activity IS 'Coaching sessions, attendance/habit tracking, hafalan assessments.';
COMMENT ON SCHEMA evaluation IS 'Semester evaluation items, scores, and report data.';
COMMENT ON SCHEMA finance IS 'Donation and disbursement records tied to sponsorships. No cascades, no physical deletes.';
```

**Rollback:**

```sql
-- migrations/0001_create_schemas.down.sql

DROP SCHEMA IF EXISTS finance CASCADE;
DROP SCHEMA IF EXISTS evaluation CASCADE;
DROP SCHEMA IF EXISTS activity CASCADE;
DROP SCHEMA IF EXISTS sponsorship CASCADE;
DROP SCHEMA IF EXISTS program CASCADE;
DROP SCHEMA IF EXISTS access_control CASCADE;
DROP SCHEMA IF EXISTS person CASCADE;
DROP SCHEMA IF EXISTS organization CASCADE;
DROP SCHEMA IF EXISTS reference CASCADE;
DROP SCHEMA IF EXISTS geography CASCADE;
```

**Explanation:** schemas mirror the application's business domains 1:1 (`10_DATABASE_SPECIFICATION.md` §3), which lets a future reporting role be granted `GRANT USAGE, SELECT ON SCHEMA finance` without touching `person` or `activity`, and keeps every table's fully-qualified name (`person.child`, `finance.transaction`) self-documenting in every query, migration, and ORM/query-builder mapping. `CASCADE` on the rollback drops every table created inside each schema in later migrations — safe only when rolling every migration back together, in reverse order.

---

## Migration 0002 — Geography Schema

**Purpose:** the province → district → subdistrict → village → location hierarchy. Treated as immutable reference data — every relationship is `RESTRICT`, since geography must never silently cascade away underneath a historical address reference.

```sql
-- migrations/0002_geography_schema.sql

-- ── province ─────────────────────────────────────────────
CREATE TABLE geography.province (
    province_id BIGSERIAL PRIMARY KEY,
    name        VARCHAR(150) NOT NULL,
    active      BOOLEAN NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_province_name UNIQUE (name)
);
COMMENT ON TABLE geography.province IS 'Top of the Indonesian administrative geography hierarchy. Consolidates the legacy ajis_propinsi/ref_propinsi duplicate tables.';

-- ── district (kabupaten/kota) ────────────────────────────
CREATE TABLE geography.district (
    district_id BIGSERIAL PRIMARY KEY,
    province_id BIGINT NOT NULL,
    name        VARCHAR(150) NOT NULL,
    created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_district_name_per_province UNIQUE (province_id, name),
    CONSTRAINT fk_district_province FOREIGN KEY (province_id)
        REFERENCES geography.province (province_id) ON DELETE RESTRICT
);
CREATE INDEX ix_district_province_id ON geography.district (province_id);
COMMENT ON TABLE geography.district IS 'Kabupaten/kota. Belongs to exactly one province; name unique within that province.';

-- ── subdistrict (kecamatan) ──────────────────────────────
CREATE TABLE geography.subdistrict (
    subdistrict_id BIGSERIAL PRIMARY KEY,
    district_id    BIGINT NOT NULL,
    name           VARCHAR(150) NOT NULL,
    created_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_subdistrict_name_per_district UNIQUE (district_id, name),
    CONSTRAINT fk_subdistrict_district FOREIGN KEY (district_id)
        REFERENCES geography.district (district_id) ON DELETE RESTRICT
);
CREATE INDEX ix_subdistrict_district_id ON geography.subdistrict (district_id);
COMMENT ON TABLE geography.subdistrict IS 'Kecamatan. Belongs to exactly one district.';

-- ── village (desa/kelurahan) ─────────────────────────────
CREATE TABLE geography.village (
    village_id     BIGSERIAL PRIMARY KEY,
    subdistrict_id BIGINT NOT NULL,
    name           VARCHAR(150) NOT NULL,
    created_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_village_name_per_subdistrict UNIQUE (subdistrict_id, name),
    CONSTRAINT fk_village_subdistrict FOREIGN KEY (subdistrict_id)
        REFERENCES geography.subdistrict (subdistrict_id) ON DELETE RESTRICT
);
CREATE INDEX ix_village_subdistrict_id ON geography.village (subdistrict_id);
COMMENT ON TABLE geography.village IS 'Desa/kelurahan. Bottom of the formal four-level administrative hierarchy.';

-- ── location ──────────────────────────────────────────────
CREATE TABLE geography.location (
    location_id   BIGSERIAL PRIMARY KEY,
    village_id    BIGINT,
    address_text  VARCHAR(500) NOT NULL,
    created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_location_village FOREIGN KEY (village_id)
        REFERENCES geography.village (village_id) ON DELETE RESTRICT
);
CREATE INDEX ix_location_village_id ON geography.location (village_id);
COMMENT ON TABLE geography.location IS 'Physical address/point. village_id is nullable to allow street-only addresses, but still RESTRICT on delete.';
COMMENT ON COLUMN geography.location.village_id IS 'Nullable by design: not every real-world address resolves to a formal village. address_text always carries the human-readable address regardless.';
```

**Rollback:**

```sql
-- migrations/0002_geography_schema.down.sql

DROP TABLE IF EXISTS geography.location;
DROP TABLE IF EXISTS geography.village;
DROP TABLE IF EXISTS geography.subdistrict;
DROP TABLE IF EXISTS geography.district;
DROP TABLE IF EXISTS geography.province;
```

**Explanation:**
- `BIGSERIAL` primary keys throughout, `BIGINT` FKs, per the non-negotiable rule in `10_DATABASE_SPECIFICATION.md` §2.1.
- Every FK is `ON DELETE RESTRICT` — this is the one schema where **no exception exists**: a province, district, subdistrict, or village can never be removed while any child row (down to `location`) still references it, protecting historical address data from silently disappearing.
- `location.village_id` is the only **nullable** FK in this schema — real addresses are sometimes only known to street level. It is still `RESTRICT`, not `SET NULL`, so a village removal is always an explicit administrative decision, never a silent side effect.
- `uq_*_name_per_*` constraints replace the legacy duplicate-table problem (`ajis_propinsi` + `ref_propinsi`, confirmed identical) with a single normalized hierarchy and per-parent uniqueness instead of a single global name index, since "Jawa Barat" as a district name is only meaningless without its province context, not globally unique.
- Every FK column is explicitly indexed (`ix_district_province_id`, etc.) — required both for the `RESTRICT` delete-check scan and because "list districts in this province" is the everyday query shape.
- Only `province` carries `active` — per `10_DATABASE_SPECIFICATION.md` §4, deeper hierarchy levels (district/subdistrict/village/location) are not in the soft-delete list; they're immutable reference data protected entirely by `RESTRICT`, not by a deactivation flag.

---

## Migration 0003 — Reference Schema

**Purpose:** the small, stable lookup tables that replace every native-`ENUM`-shaped concept in the legacy system with a `RESTRICT`-protected table carrying a stable `code` plus a display `name`.

```sql
-- migrations/0003_reference_schema.sql

-- ── session_type ──────────────────────────────────────────
CREATE TABLE reference.session_type (
    session_type_id BIGSERIAL PRIMARY KEY,
    code            VARCHAR(50) NOT NULL,
    name            VARCHAR(100) NOT NULL,
    active          BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_session_type_code UNIQUE (code)
);
COMMENT ON TABLE reference.session_type IS 'Coaching session categories: Reguler, Edukasi Pekanan, P3A, Parenting.';

-- ── attendance_status ─────────────────────────────────────
CREATE TABLE reference.attendance_status (
    attendance_status_id BIGSERIAL PRIMARY KEY,
    code                  VARCHAR(50) NOT NULL,
    name                  VARCHAR(100) NOT NULL,
    active                BOOLEAN NOT NULL DEFAULT TRUE,
    created_at            TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at            TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_attendance_status_code UNIQUE (code)
);
COMMENT ON TABLE reference.attendance_status IS 'Attendance states: Hadir / Izin / Alfa.';

-- ── welfare_category ──────────────────────────────────────
CREATE TABLE reference.welfare_category (
    welfare_category_id BIGSERIAL PRIMARY KEY,
    code                 VARCHAR(50) NOT NULL,
    name                 VARCHAR(100) NOT NULL,
    active               BOOLEAN NOT NULL DEFAULT TRUE,
    created_at           TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at           TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_welfare_category_code UNIQUE (code)
);
COMMENT ON TABLE reference.welfare_category IS 'Zakat-eligibility classification (Asnaf): Yatim / Piatu / Dhuafa.';

-- ── semester ───────────────────────────────────────────────
CREATE TABLE reference.semester (
    semester_id BIGSERIAL PRIMARY KEY,
    name        VARCHAR(50) NOT NULL,
    year        INTEGER NOT NULL,
    term        VARCHAR(20) NOT NULL,
    start_date  DATE NOT NULL,
    end_date    DATE NOT NULL,
    created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_semester_year_term UNIQUE (year, term),
    CONSTRAINT chk_semester_dates CHECK (end_date > start_date)
);
COMMENT ON TABLE reference.semester IS 'A school-term period with real date bounds. Replaces legacy free-text semester labels.';

-- ── role ───────────────────────────────────────────────────
CREATE TABLE reference.role (
    role_id     BIGSERIAL PRIMARY KEY,
    code        VARCHAR(50) NOT NULL,
    name        VARCHAR(100) NOT NULL,
    active      BOOLEAN NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_role_code UNIQUE (code)
);
COMMENT ON TABLE reference.role IS 'System roles: Super Admin, Branch Admin (SPMD), Korwil (Coordinator).';
```

**Rollback:**

```sql
-- migrations/0003_reference_schema.down.sql

DROP TABLE IF EXISTS reference.role;
DROP TABLE IF EXISTS reference.semester;
DROP TABLE IF EXISTS reference.welfare_category;
DROP TABLE IF EXISTS reference.attendance_status;
DROP TABLE IF EXISTS reference.session_type;
```

**Explanation:**
- Each table follows the exact same shape for a reason: a stable `code` (for application logic to branch on) separate from a renamable/localizable `name` (for display) — so relabeling "Hadir" for a future multilingual UI never risks breaking logic that branches on the literal string.
- `code` gets the `UNIQUE` constraint (and its automatic index), not `name` — application code keys on `code`, so that's the lookup path that needs to be fast and enforced.
- `semester` is the one table in this schema with real business logic beyond code/name: `chk_semester_dates` prevents an inverted or zero-length term (a direct fix for the legacy system's unvalidated free-text semester field), and `uq_semester_year_term` guarantees only one "Ganjil 2024" can ever exist.
- No FKs originate *from* this schema — every relationship points *into* it from `person`, `program`, `sponsorship`, `activity`, and `evaluation`, always `RESTRICT`, defined in the migrations that follow.
- `reference.role` must exist before `person.system_user` and `access_control.role_permission` — this is why the reference schema is sequenced ahead of both.

---

## Migration 0004 — Organization Schema

**Purpose:** Rumah Zakat's own operating structure — offices, the coaching regions each office runs, and the facilities each office manages.

```sql
-- migrations/0004_organization_schema.sql

-- ── office (Kantor) ───────────────────────────────────────
CREATE TABLE organization.office (
    office_id         BIGSERIAL PRIMARY KEY,
    parent_office_id  BIGINT,
    name              VARCHAR(150) NOT NULL,
    active            BOOLEAN NOT NULL DEFAULT TRUE,
    created_at        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_office_not_own_parent CHECK (office_id <> parent_office_id),
    CONSTRAINT fk_office_parent_office FOREIGN KEY (parent_office_id)
        REFERENCES organization.office (office_id) ON DELETE RESTRICT
);
CREATE INDEX ix_office_parent_office_id ON organization.office (parent_office_id);
COMMENT ON TABLE organization.office IS 'A branch or head office. Self-referencing parent_office_id models the office hierarchy.';
COMMENT ON COLUMN organization.office.parent_office_id IS 'NULL for a root/head office. RESTRICT, not CASCADE, so closing a branch network can never happen via a single cascading delete.';

-- ── coaching_region (Wilayah Pembinaan) ───────────────────
CREATE TABLE organization.coaching_region (
    region_id   BIGSERIAL PRIMARY KEY,
    office_id   BIGINT NOT NULL,
    name        VARCHAR(150) NOT NULL,
    active      BOOLEAN NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_coaching_region_office FOREIGN KEY (office_id)
        REFERENCES organization.office (office_id) ON DELETE RESTRICT
);
CREATE INDEX ix_coaching_region_office_id ON organization.coaching_region (office_id);
COMMENT ON TABLE organization.coaching_region IS 'A coaching territory (Wilayah Pembinaan) assigned to a Korwil, operating under one office.';

-- ── facility ───────────────────────────────────────────────
CREATE TABLE organization.facility (
    facility_id  BIGSERIAL PRIMARY KEY,
    office_id    BIGINT NOT NULL,
    name         VARCHAR(200) NOT NULL,
    active       BOOLEAN NOT NULL DEFAULT TRUE,
    created_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_facility_office FOREIGN KEY (office_id)
        REFERENCES organization.office (office_id) ON DELETE RESTRICT
);
CREATE INDEX ix_facility_office_id ON organization.facility (office_id);
COMMENT ON TABLE organization.facility IS 'A physical facility (e.g., a school) managed by an office. Referenced by person.child_education.school_id.';
```

**Rollback:**

```sql
-- migrations/0004_organization_schema.down.sql

DROP TABLE IF EXISTS organization.facility;
DROP TABLE IF EXISTS organization.coaching_region;
DROP TABLE IF EXISTS organization.office;
```

**Explanation:**
- `chk_office_not_own_parent` is a defensive check a plain self-referencing FK cannot provide by itself — it blocks a data-entry error where an office is set as its own parent, which would otherwise create an unwalkable one-node cycle.
- `parent_office_id → office(office_id)` is `RESTRICT`, deliberately not `CASCADE`: cascading up an office hierarchy could silently delete an entire branch network in a single statement. Deactivating a branch tree is done via `active = false`, application-side, walked with a recursive CTE — never via `DELETE`.
- `coaching_region.office_id` and `facility.office_id` are both `NOT NULL, RESTRICT` — closing an office must not silently delete the regions or facilities under it; those must be explicitly reassigned or deactivated first.
- `ix_office_parent_office_id` does double duty: required for the `RESTRICT` delete check, and for `WITH RECURSIVE` hierarchy-traversal queries walking the office tree at every level.

---

## Migration 0005 — Person Schema

**Purpose:** every human entity in AJIS and how each one authenticates — the direct fix for the legacy `ajis_anak` table's worst violation (40+ fixed father/mother/guardian columns).

```sql
-- migrations/0005_person_schema.sql

-- ── child ─────────────────────────────────────────────────
CREATE TABLE person.child (
    child_id    BIGSERIAL PRIMARY KEY,
    full_name   VARCHAR(200) NOT NULL,
    active      BOOLEAN NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX ix_child_full_name_active ON person.child (full_name) WHERE active = TRUE;
COMMENT ON TABLE person.child IS 'The sponsored program participant - the identity anchor every other schema hangs off via child_id. Deliberately minimal pending full column-list confirmation (see spec §18).';

-- ── family_member ─────────────────────────────────────────
CREATE TABLE person.family_member (
    family_member_id BIGSERIAL PRIMARY KEY,
    child_id         BIGINT NOT NULL,
    relationship     VARCHAR(50) NOT NULL,
    full_name        VARCHAR(200) NOT NULL,
    created_at       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_family_member_relationship
        CHECK (relationship IN ('father', 'mother', 'guardian', 'sibling', 'other')),
    CONSTRAINT fk_family_member_child FOREIGN KEY (child_id)
        REFERENCES person.child (child_id) ON DELETE CASCADE
);
CREATE INDEX ix_family_member_child_id ON person.family_member (child_id);
-- Optional: uncomment if reports commonly filter/sort by relationship type within a child
-- CREATE INDEX ix_family_member_child_relationship ON person.family_member (child_id, relationship);
COMMENT ON TABLE person.family_member IS 'One row per family relationship. Replaces the legacy fixed father/mother/guardian columns - a child can have zero, one, or several.';

-- ── household_member ──────────────────────────────────────
CREATE TABLE person.household_member (
    household_member_id BIGSERIAL PRIMARY KEY,
    child_id             BIGINT NOT NULL,
    relationship         VARCHAR(50) NOT NULL,
    full_name            VARCHAR(200) NOT NULL,
    effective_from       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    effective_to         TIMESTAMP,
    created_at           TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at           TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_household_member_dates
        CHECK (effective_to IS NULL OR effective_to >= effective_from),
    CONSTRAINT fk_household_member_child FOREIGN KEY (child_id)
        REFERENCES person.child (child_id) ON DELETE CASCADE
);
CREATE INDEX ix_household_member_child_id ON person.household_member (child_id);
CREATE INDEX ix_household_member_child_current ON person.household_member (child_id) WHERE effective_to IS NULL;
COMMENT ON TABLE person.household_member IS 'Versioned household composition over time. effective_to IS NULL means still current - never delete a row to represent someone moving out; close it instead.';

-- ── coordinator ───────────────────────────────────────────
CREATE TABLE person.coordinator (
    coordinator_id BIGSERIAL PRIMARY KEY,
    office_id      BIGINT,
    full_name      VARCHAR(200) NOT NULL,
    phone          VARCHAR(30),
    active         BOOLEAN NOT NULL DEFAULT TRUE,
    created_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_coordinator_office FOREIGN KEY (office_id)
        REFERENCES organization.office (office_id) ON DELETE RESTRICT
);
CREATE INDEX ix_coordinator_office_id ON person.coordinator (office_id);
CREATE INDEX ix_coordinator_office_active_name ON person.coordinator (office_id, full_name) WHERE active = TRUE;
COMMENT ON TABLE person.coordinator IS 'A volunteer/staff coordinator (Korwil) - the "who did this" actor referenced downstream as session presenter, evaluator, and hafalan assessor.';

-- ── donor ─────────────────────────────────────────────────
CREATE TABLE person.donor (
    donor_id    BIGSERIAL PRIMARY KEY,
    full_name   VARCHAR(200) NOT NULL,
    active      BOOLEAN NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX ix_donor_full_name_active ON person.donor (full_name) WHERE active = TRUE;
COMMENT ON TABLE person.donor IS 'A sponsor/donor identity. Kept separate from system_user because not every donor logs in.';

-- ── child_education ───────────────────────────────────────
CREATE TABLE person.child_education (
    education_id     BIGSERIAL PRIMARY KEY,
    child_id         BIGINT NOT NULL,
    education_level  VARCHAR(30) NOT NULL,
    grade            VARCHAR(20),
    school_id        BIGINT NOT NULL,
    effective_from   DATE NOT NULL,
    effective_to     DATE,
    created_at       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_child_education_level
        CHECK (education_level IN ('sd', 'smp', 'sma', 'other')),
    CONSTRAINT chk_child_education_dates
        CHECK (effective_to IS NULL OR effective_to >= effective_from),
    CONSTRAINT fk_child_education_child FOREIGN KEY (child_id)
        REFERENCES person.child (child_id) ON DELETE CASCADE,
    CONSTRAINT fk_child_education_school FOREIGN KEY (school_id)
        REFERENCES organization.facility (facility_id) ON DELETE RESTRICT
);
CREATE INDEX ix_child_education_child_id ON person.child_education (child_id);
CREATE INDEX ix_child_education_school_id ON person.child_education (school_id);
CREATE INDEX ix_child_education_effective_range ON person.child_education (child_id, effective_from, effective_to);
COMMENT ON TABLE person.child_education IS 'One row per schooling period - the schema''s worked example of the temporal/effective-dating pattern. education_level vocabulary pending confirmation (may need smk) - see spec §18.';

-- ── system_user ───────────────────────────────────────────
CREATE TABLE person.system_user (
    system_user_id     BIGSERIAL PRIMARY KEY,
    coordinator_id     BIGINT,
    donor_id           BIGINT,
    role_id            BIGINT NOT NULL,
    is_system_account  BOOLEAN NOT NULL DEFAULT FALSE,
    username           VARCHAR(100) NOT NULL,
    password_hash      VARCHAR(255) NOT NULL,
    active             BOOLEAN NOT NULL DEFAULT TRUE,
    created_at         TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at         TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_system_user_username UNIQUE (username),
    CONSTRAINT chk_system_user_owner
        CHECK (coordinator_id IS NOT NULL OR donor_id IS NOT NULL OR is_system_account = TRUE),
    CONSTRAINT fk_system_user_coordinator FOREIGN KEY (coordinator_id)
        REFERENCES person.coordinator (coordinator_id) ON DELETE SET NULL,
    CONSTRAINT fk_system_user_donor FOREIGN KEY (donor_id)
        REFERENCES person.donor (donor_id) ON DELETE SET NULL,
    CONSTRAINT fk_system_user_role FOREIGN KEY (role_id)
        REFERENCES reference.role (role_id) ON DELETE RESTRICT
);

-- coordinator_id / donor_id uniqueness is implemented as PARTIAL unique indexes
-- rather than table-level UNIQUE constraints (see "Known Deviations" §17): this
-- gives the 1-to-(zero-or-one) guarantee the spec calls for while excluding NULL
-- rows from the index, which the spec's own "partial index, since NULL for a
-- large share of rows" rationale calls for.
CREATE UNIQUE INDEX uq_system_user_coordinator_id ON person.system_user (coordinator_id) WHERE coordinator_id IS NOT NULL;
CREATE UNIQUE INDEX uq_system_user_donor_id ON person.system_user (donor_id) WHERE donor_id IS NOT NULL;
CREATE INDEX ix_system_user_role_id ON person.system_user (role_id);

COMMENT ON TABLE person.system_user IS 'The login/account record - ties an authenticated identity to a coordinator, a donor, or a pure system/admin account.';
COMMENT ON CONSTRAINT chk_system_user_owner ON person.system_user IS 'Every account must belong to a coordinator, a donor, or be flagged is_system_account. is_system_account substitutes for a cross-table role-code CHECK, which PostgreSQL cannot evaluate declaratively.';
```

**Rollback:**

```sql
-- migrations/0005_person_schema.down.sql

DROP TABLE IF EXISTS person.system_user;
DROP TABLE IF EXISTS person.child_education;
DROP TABLE IF EXISTS person.donor;
DROP TABLE IF EXISTS person.coordinator;
DROP TABLE IF EXISTS person.household_member;
DROP TABLE IF EXISTS person.family_member;
DROP TABLE IF EXISTS person.child;
```

**Explanation:**
- `child`, `coordinator`, and `donor` are deliberately minimal — the specification's §18 open item #1 flags that the source documents name these tables' FK role precisely but not their full demographic column list. This migration implements exactly the FK/PK/audit/soft-delete columns the specification defines; adding business columns (birth date, NIK, address, etc.) is a **future, additive** migration, not a rework of this one.
- `family_member` and `household_member` both `CASCADE` from `child` — dependent data with no independent meaning — while `relationship` on both is `VARCHAR` + `CHECK` rather than a native `ENUM` (§2.2 of the specification).
- `household_member.effective_to IS NULL` is the "still current" sentinel; the partial index `ix_household_member_child_current` keeps that dominant query fast without indexing closed historical rows.
- `child_education` is the schema's temporal-pattern example: `child_id` is `CASCADE` (dependent), but `school_id → facility` is `RESTRICT` — a school must never vanish out from under a historical enrollment record.
- `system_user` is the most constraint-dense table in this migration:
  - `chk_system_user_owner` enforces "belongs to a coordinator, a donor, or is a system account" at the database level using a same-row boolean (`is_system_account`), since a `CHECK` constraint cannot join to `reference.role` to test the role code directly.
  - `coordinator_id`/`donor_id` uniqueness is implemented via **partial unique indexes**, not plain `UNIQUE` constraints — see §17 for why this is a deliberate improvement on a literal reading of the specification, not a deviation from its intent.
  - `coordinator_id`/`donor_id` are `SET NULL` on delete — the **only** `SET NULL` relationships in the entire schema — because losing login/audit history would be worse than an orphaned link.
  - `role_id` is `RESTRICT` — a role can never be deleted while any account holds it.

---

## Migration 0006 — Access Control Schema

**Purpose:** role-based *feature* permissions — deliberately separate from row-level *data-scoping* rules enforced in the application layer.

```sql
-- migrations/0006_access_control_schema.sql

-- ── permission ────────────────────────────────────────────
CREATE TABLE access_control.permission (
    permission_id  BIGSERIAL PRIMARY KEY,
    code            VARCHAR(100) NOT NULL,
    name            VARCHAR(150) NOT NULL,
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_permission_code UNIQUE (code)
);
COMMENT ON TABLE access_control.permission IS 'A named capability (e.g., read_child, edit_child). No active flag - a fixed, deployment-managed vocabulary, not day-to-day CRUD.';

-- ── role_permission ───────────────────────────────────────
CREATE TABLE access_control.role_permission (
    role_id        BIGINT NOT NULL,
    permission_id  BIGINT NOT NULL,
    created_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT pk_role_permission PRIMARY KEY (role_id, permission_id),
    CONSTRAINT fk_role_permission_role FOREIGN KEY (role_id)
        REFERENCES reference.role (role_id) ON DELETE CASCADE,
    CONSTRAINT fk_role_permission_permission FOREIGN KEY (permission_id)
        REFERENCES access_control.permission (permission_id) ON DELETE RESTRICT
);
CREATE INDEX ix_role_permission_permission_id ON access_control.role_permission (permission_id);
COMMENT ON TABLE access_control.role_permission IS 'Junction table linking roles to granted permissions. Composite PK - no attributes beyond the pairing itself.';
```

**Rollback:**

```sql
-- migrations/0006_access_control_schema.down.sql

DROP TABLE IF EXISTS access_control.role_permission;
DROP TABLE IF EXISTS access_control.permission;
```

**Explanation:**
- `role_permission` uses a **composite primary key** `(role_id, permission_id)` rather than a surrogate `BIGSERIAL` — a deliberate choice, since this is a pure junction table with no attributes of its own beyond the pairing (unlike `child_donor_pairing`, which has dates/status and rightly gets its own surrogate key). The composite key enforces "no duplicate grant" for free.
- The composite PK already indexes `role_id` as its leading column, so only `permission_id` needs an explicit secondary index (`ix_role_permission_permission_id`) — required for the reverse lookup ("which roles have this permission") and the `permission_id` `RESTRICT` check.
- `role_id → CASCADE`: a grant is an attribute of the role, so removing a role removes its grants. `permission_id → RESTRICT`: a permission cannot be deleted while any role still holds it.
- This table intentionally does **not** model row-level office/region data scoping — that remains an application-layer concern per `10_DATABASE_SPECIFICATION.md` §8.

---

## Migration 0007 — Program Schema

**Purpose:** what program a child is enrolled in and their eligibility status, kept separate from the child's core identity — the direct fix for the legacy schema mixing status changes into the same wide `ajis_anak` row as identity data with no audit trail.

```sql
-- migrations/0007_program_schema.sql

-- ── program ───────────────────────────────────────────────
CREATE TABLE program.program (
    program_id  BIGSERIAL PRIMARY KEY,
    name        VARCHAR(150) NOT NULL,
    active      BOOLEAN NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
COMMENT ON TABLE program.program IS 'A named program (e.g., Anak Juara). Exists from day one so a second program is an INSERT, not a migration.';

-- ── child_enrollment ──────────────────────────────────────
CREATE TABLE program.child_enrollment (
    enrollment_id        BIGSERIAL PRIMARY KEY,
    child_id             BIGINT NOT NULL,
    program_id           BIGINT NOT NULL,
    welfare_category_id  BIGINT NOT NULL,
    enrollment_date      DATE NOT NULL DEFAULT CURRENT_DATE,
    active               BOOLEAN NOT NULL DEFAULT TRUE,
    created_at           TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at           TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_child_enrollment_child FOREIGN KEY (child_id)
        REFERENCES person.child (child_id) ON DELETE CASCADE,
    CONSTRAINT fk_child_enrollment_program FOREIGN KEY (program_id)
        REFERENCES program.program (program_id) ON DELETE RESTRICT,
    CONSTRAINT fk_child_enrollment_welfare_category FOREIGN KEY (welfare_category_id)
        REFERENCES reference.welfare_category (welfare_category_id) ON DELETE RESTRICT
);
CREATE INDEX ix_child_enrollment_child_id ON program.child_enrollment (child_id);
CREATE INDEX ix_child_enrollment_program_id ON program.child_enrollment (program_id);
CREATE INDEX ix_child_enrollment_welfare_category_id ON program.child_enrollment (welfare_category_id);
COMMENT ON TABLE program.child_enrollment IS 'Links a child to a program under a welfare category, with an enrollment date.';
```

**Rollback:**

```sql
-- migrations/0007_program_schema.down.sql

DROP TABLE IF EXISTS program.child_enrollment;
DROP TABLE IF EXISTS program.program;
```

**Explanation:**
- `child_enrollment.child_id` is `CASCADE` (dependent on the child); `program_id` and `welfare_category_id` are both `RESTRICT` — reference-style parents that must never be silently orphaned.
- All three FK columns get individual indexes because each is queried independently in real reporting patterns: "children in program X," "children in welfare category Y," "enrollments for this child."
- `enrollment_date DEFAULT CURRENT_DATE` means the application only needs to pass an explicit date for backdated/corrected entries, not on a normal enrollment action.

---

## Migration 0008 — Sponsorship Schema

**Purpose:** the donor-to-child relationship — the direct upstream link to financial records, and the schema treated with the second-most caution in the whole design (after finance itself). Every FK here is `RESTRICT`, never `CASCADE`.

```sql
-- migrations/0008_sponsorship_schema.sql

-- ── child_donor_pairing ───────────────────────────────────
CREATE TABLE sponsorship.child_donor_pairing (
    pairing_id     BIGSERIAL PRIMARY KEY,
    child_id       BIGINT NOT NULL,
    donor_id       BIGINT NOT NULL,
    program_id     BIGINT NOT NULL,
    pairing_date   DATE NOT NULL DEFAULT CURRENT_DATE,
    end_date       DATE,
    active         BOOLEAN NOT NULL DEFAULT TRUE,
    created_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_pairing_dates CHECK (end_date IS NULL OR end_date >= pairing_date),
    CONSTRAINT fk_child_donor_pairing_child FOREIGN KEY (child_id)
        REFERENCES person.child (child_id) ON DELETE RESTRICT,
    CONSTRAINT fk_child_donor_pairing_donor FOREIGN KEY (donor_id)
        REFERENCES person.donor (donor_id) ON DELETE RESTRICT,
    CONSTRAINT fk_child_donor_pairing_program FOREIGN KEY (program_id)
        REFERENCES program.program (program_id) ON DELETE RESTRICT
);
CREATE INDEX ix_child_donor_pairing_child_id ON sponsorship.child_donor_pairing (child_id);
CREATE INDEX ix_child_donor_pairing_donor_id ON sponsorship.child_donor_pairing (donor_id);
CREATE INDEX ix_child_donor_pairing_program_id ON sponsorship.child_donor_pairing (program_id);
COMMENT ON TABLE sponsorship.child_donor_pairing IS 'Links a child, donor, and program for a sponsorship period. child_id/donor_id are RESTRICT, never CASCADE, so a hard delete can never ripple into finance.transaction.';

-- ── pairing_balance_snapshot ──────────────────────────────
CREATE TABLE sponsorship.pairing_balance_snapshot (
    snapshot_id      BIGSERIAL PRIMARY KEY,
    pairing_id       BIGINT NOT NULL,
    semester_id      BIGINT NOT NULL,
    closing_balance  NUMERIC(14,2) NOT NULL,
    snapshot_date    DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_pairing_snapshot_per_semester UNIQUE (pairing_id, semester_id),
    CONSTRAINT fk_pairing_balance_snapshot_pairing FOREIGN KEY (pairing_id)
        REFERENCES sponsorship.child_donor_pairing (pairing_id) ON DELETE RESTRICT,
    CONSTRAINT fk_pairing_balance_snapshot_semester FOREIGN KEY (semester_id)
        REFERENCES reference.semester (semester_id) ON DELETE RESTRICT
);
CREATE INDEX ix_pairing_balance_snapshot_pairing_id ON sponsorship.pairing_balance_snapshot (pairing_id);
CREATE INDEX ix_pairing_balance_snapshot_semester_id ON sponsorship.pairing_balance_snapshot (semester_id);
COMMENT ON TABLE sponsorship.pairing_balance_snapshot IS 'A point-in-time closing balance per pairing per semester. Replaces the legacy pattern of storing a derived, mutable balance column.';
```

**Rollback:**

```sql
-- migrations/0008_sponsorship_schema.down.sql

DROP TABLE IF EXISTS sponsorship.pairing_balance_snapshot;
DROP TABLE IF EXISTS sponsorship.child_donor_pairing;
```

**Explanation:**
- `child_donor_pairing.child_id`, `.donor_id`, and `.program_id` are **all `RESTRICT`**, no exceptions — this is the schema's central design decision. Cascading a child or donor deletion here would ripple into `finance.transaction` and erase financial audit history, which the source design treats as non-negotiable. A child or donor can only be *deactivated*; a hard delete is blocked by the database as long as any pairing (and transitively, any transaction) still exists.
- `chk_pairing_dates` guards against an end date preceding the start date — the same defensive pattern used for every effective-dated table in this schema.
- `pairing_balance_snapshot` is a reconciliation artifact, not a mutable running balance — `uq_pairing_snapshot_per_semester` guarantees exactly one snapshot per pairing per semester, and `closing_balance` is `NUMERIC(14,2)`, never `FLOAT`, per the schema-wide money-column rule (§2.7 of the specification).
- Note there is deliberately **no `updated_at`** on `pairing_balance_snapshot` — a snapshot is written once and never revised in place, matching its role as a point-in-time reconciliation record.

---

## Migration 0009 — Activity Schema

**Purpose:** the operational heart of AJIS — coaching sessions, per-child attendance and habit tracking, and hafalan assessments. This is where the legacy system's worst 2NF violation lived (`ajis_pembinaan_baru` repeated session-level fields once per attending child); this migration splits that into a session header and a per-child detail table.

```sql
-- migrations/0009_activity_schema.sql

-- ── coaching_session ──────────────────────────────────────
CREATE TABLE activity.coaching_session (
    session_id       BIGSERIAL PRIMARY KEY,
    location_id      BIGINT NOT NULL,
    presenter_id     BIGINT NOT NULL,
    session_type_id  BIGINT NOT NULL,
    session_date     DATE NOT NULL,
    created_at       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_coaching_session_location FOREIGN KEY (location_id)
        REFERENCES organization.coaching_region (region_id) ON DELETE RESTRICT,
    CONSTRAINT fk_coaching_session_presenter FOREIGN KEY (presenter_id)
        REFERENCES person.coordinator (coordinator_id) ON DELETE RESTRICT,
    CONSTRAINT fk_coaching_session_session_type FOREIGN KEY (session_type_id)
        REFERENCES reference.session_type (session_type_id) ON DELETE RESTRICT
);
CREATE INDEX ix_coaching_session_location_id ON activity.coaching_session (location_id);
CREATE INDEX ix_coaching_session_presenter_id ON activity.coaching_session (presenter_id);
CREATE INDEX ix_coaching_session_session_type_id ON activity.coaching_session (session_type_id);
COMMENT ON TABLE activity.coaching_session IS 'Session header - one row per coaching session, independent of attendee count. The header half of the legacy denormalized session table.';

-- ── session_attendance ────────────────────────────────────
CREATE TABLE activity.session_attendance (
    attendance_id          BIGSERIAL PRIMARY KEY,
    session_id             BIGINT NOT NULL,
    child_id                BIGINT NOT NULL,
    attendance_status_id    BIGINT NOT NULL,
    child_snapshot           JSONB,
    created_at               TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_attendance_per_child_per_session UNIQUE (session_id, child_id),
    CONSTRAINT fk_session_attendance_session FOREIGN KEY (session_id)
        REFERENCES activity.coaching_session (session_id) ON DELETE CASCADE,
    CONSTRAINT fk_session_attendance_child FOREIGN KEY (child_id)
        REFERENCES person.child (child_id) ON DELETE CASCADE,
    CONSTRAINT fk_session_attendance_attendance_status FOREIGN KEY (attendance_status_id)
        REFERENCES reference.attendance_status (attendance_status_id) ON DELETE RESTRICT
);
CREATE INDEX ix_session_attendance_session_id ON activity.session_attendance (session_id);
CREATE INDEX ix_session_attendance_child_id ON activity.session_attendance (child_id);
CREATE INDEX ix_session_attendance_attendance_status_id ON activity.session_attendance (attendance_status_id);
CREATE INDEX ix_session_attendance_child_snapshot_gin ON activity.session_attendance USING GIN (child_snapshot);
COMMENT ON TABLE activity.session_attendance IS 'Per-child detail half of the session split - one row per child per session. The detail half of the legacy denormalized session table.';
COMMENT ON COLUMN activity.session_attendance.child_snapshot IS 'Point-in-time copy of relevant child attributes at the moment of attendance, so historical reports are unaffected by later profile edits. GIN-indexed for in-document lookups.';

-- ── session_habit_tracking ────────────────────────────────
CREATE TABLE activity.session_habit_tracking (
    habit_id       BIGSERIAL PRIMARY KEY,
    attendance_id  BIGINT NOT NULL,
    habit_type     VARCHAR(100) NOT NULL,
    status         VARCHAR(30) NOT NULL,
    created_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_habit_status CHECK (status IN ('completed', 'partial', 'not_completed')),
    CONSTRAINT fk_session_habit_tracking_attendance FOREIGN KEY (attendance_id)
        REFERENCES activity.session_attendance (attendance_id) ON DELETE CASCADE
);
CREATE INDEX ix_session_habit_tracking_attendance_id ON activity.session_habit_tracking (attendance_id);
COMMENT ON TABLE activity.session_habit_tracking IS 'Per-attendance Mandiri (independence habit) rows - prayer, recitation, charity, etc. A child can have multiple rows per attendance, one per habit type.';

-- ── hafalan_item_lookup ───────────────────────────────────
CREATE TABLE activity.hafalan_item_lookup (
    item_id     BIGSERIAL PRIMARY KEY,
    name        VARCHAR(150) NOT NULL,
    category    VARCHAR(50) NOT NULL,
    active      BOOLEAN NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
COMMENT ON TABLE activity.hafalan_item_lookup IS 'Master list of memorization items - Qur''an surah, prayer, du''a.';

-- ── hafalan_assessment ────────────────────────────────────
CREATE TABLE activity.hafalan_assessment (
    assessment_id  BIGSERIAL PRIMARY KEY,
    item_id        BIGINT NOT NULL,
    child_id       BIGINT NOT NULL,
    assessor_id    BIGINT NOT NULL,
    status         VARCHAR(30) NOT NULL,
    assessed_date  DATE,
    created_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_hafalan_status CHECK (status IN ('completed', 'partial', 'not_started')),
    CONSTRAINT uq_hafalan_assessment_per_child_item UNIQUE (child_id, item_id),
    CONSTRAINT fk_hafalan_assessment_item FOREIGN KEY (item_id)
        REFERENCES activity.hafalan_item_lookup (item_id) ON DELETE RESTRICT,
    CONSTRAINT fk_hafalan_assessment_child FOREIGN KEY (child_id)
        REFERENCES person.child (child_id) ON DELETE CASCADE,
    CONSTRAINT fk_hafalan_assessment_assessor FOREIGN KEY (assessor_id)
        REFERENCES person.coordinator (coordinator_id) ON DELETE RESTRICT
);
CREATE INDEX ix_hafalan_assessment_item_id ON activity.hafalan_assessment (item_id);
CREATE INDEX ix_hafalan_assessment_child_id ON activity.hafalan_assessment (child_id);
CREATE INDEX ix_hafalan_assessment_assessor_id ON activity.hafalan_assessment (assessor_id);
COMMENT ON TABLE activity.hafalan_assessment IS 'One assessment row per child per item - overwritten in place as progress changes (not versioned per attempt; see spec §18 item 4 if full re-assessment history is later required).';
```

**Rollback:**

```sql
-- migrations/0009_activity_schema.down.sql

DROP TABLE IF EXISTS activity.hafalan_assessment;
DROP TABLE IF EXISTS activity.hafalan_item_lookup;
DROP TABLE IF EXISTS activity.session_habit_tracking;
DROP TABLE IF EXISTS activity.session_attendance;
DROP TABLE IF EXISTS activity.coaching_session;
```

**Explanation:**
- The **session-header / attendance-detail split** is the single most important structural decision in this migration: `coaching_session` grows with the *number of sessions*; `session_attendance` grows with *sessions × average attendance*. This bounds the header table's size (and its indexes on region/presenter/type) independently of the much larger attendance volume — directly addressing the legacy `ajis_pembinaan_baru` denormalization.
- All three `coaching_session` FKs are `NOT NULL, RESTRICT` — who presented, where, and what type of session it was must remain queryable even if the region is reorganized, the coordinator deactivated, or the session type retired later.
- `session_attendance.session_id` and `.child_id` are `CASCADE` (meaningless without their session or child); `attendance_status_id` is `RESTRICT` (preserve exactly what status was recorded, even if the lookup value is later deactivated). `uq_attendance_per_child_per_session` is a direct anti-corruption guard against duplicate attendance submissions the legacy schema had no mechanism to prevent.
- `child_snapshot JSONB` + its `GIN` index exist so historical attendance reports never change retroactively just because a child's profile was edited afterward — this table is expected to reach millions of rows at scale, so its indexing is deliberately minimal (three FK B-trees plus one GIN), keeping write amplification manageable (per specification §16.2).
- `session_habit_tracking` cascades from `session_attendance` (pure detail data) and uses the same three-state `VARCHAR` + `CHECK` shape as `hafalan_assessment.status`, for consistency across similarly-structured tracking fields.
- `hafalan_assessment` overwrites the latest status per child/item (`uq_hafalan_assessment_per_child_item`) rather than versioning every re-assessment — an explicit modeling choice flagged in the specification (§18 item 4) as worth confirming before this constraint is treated as final.

---

## Migration 0010 — Evaluation Schema

**Purpose:** semester report cards (Penilaian / Laporan Semester), generated from activity and hafalan data and refined by coordinators. Replaces the legacy `ajis_penilaian` table's free-text item names with a proper lookup table and a clean header/detail split.

```sql
-- migrations/0010_evaluation_schema.sql

-- ── evaluation_item ───────────────────────────────────────
CREATE TABLE evaluation.evaluation_item (
    item_id     BIGSERIAL PRIMARY KEY,
    name        VARCHAR(150) NOT NULL,
    category    VARCHAR(50),
    active      BOOLEAN NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
COMMENT ON TABLE evaluation.evaluation_item IS 'Master list of evaluation aspects (e.g., Akhlak, Prestasi Akademik).';

-- ── semester_evaluation ───────────────────────────────────
CREATE TABLE evaluation.semester_evaluation (
    evaluation_id  BIGSERIAL PRIMARY KEY,
    child_id       BIGINT NOT NULL,
    semester_id    BIGINT NOT NULL,
    evaluator_id   BIGINT NOT NULL,
    approver_id    BIGINT,
    created_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_evaluation_per_child_per_semester UNIQUE (child_id, semester_id),
    CONSTRAINT fk_semester_evaluation_child FOREIGN KEY (child_id)
        REFERENCES person.child (child_id) ON DELETE CASCADE,
    CONSTRAINT fk_semester_evaluation_semester FOREIGN KEY (semester_id)
        REFERENCES reference.semester (semester_id) ON DELETE RESTRICT,
    CONSTRAINT fk_semester_evaluation_evaluator FOREIGN KEY (evaluator_id)
        REFERENCES person.coordinator (coordinator_id) ON DELETE RESTRICT,
    CONSTRAINT fk_semester_evaluation_approver FOREIGN KEY (approver_id)
        REFERENCES person.coordinator (coordinator_id) ON DELETE RESTRICT
);
CREATE INDEX ix_semester_evaluation_semester_id ON evaluation.semester_evaluation (semester_id);
CREATE INDEX ix_semester_evaluation_evaluator_id ON evaluation.semester_evaluation (evaluator_id);
CREATE INDEX ix_semester_evaluation_approver_id ON evaluation.semester_evaluation (approver_id);
COMMENT ON TABLE evaluation.semester_evaluation IS 'One evaluation header per child per semester. approver_id is nullable (approval optional/pending) but RESTRICT, not SET NULL, once set - erasing who approved a report is never acceptable.';

-- ── evaluation_item_score ─────────────────────────────────
CREATE TABLE evaluation.evaluation_item_score (
    score_id       BIGSERIAL PRIMARY KEY,
    evaluation_id  BIGINT NOT NULL,
    item_id        BIGINT NOT NULL,
    score          NUMERIC(5,2) NOT NULL,
    created_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_score_per_evaluation_per_item UNIQUE (evaluation_id, item_id),
    CONSTRAINT chk_score_range CHECK (score >= 0 AND score <= 100),
    CONSTRAINT fk_evaluation_item_score_evaluation FOREIGN KEY (evaluation_id)
        REFERENCES evaluation.semester_evaluation (evaluation_id) ON DELETE CASCADE,
    CONSTRAINT fk_evaluation_item_score_item FOREIGN KEY (item_id)
        REFERENCES evaluation.evaluation_item (item_id) ON DELETE RESTRICT
);
CREATE INDEX ix_evaluation_item_score_item_id ON evaluation.evaluation_item_score (item_id);
COMMENT ON TABLE evaluation.evaluation_item_score IS 'Per-item scores within an evaluation. 0-100 bound is an inferred, reasonable default pending confirmation of the actual grading scale (spec §18 item 5).';
```

**Rollback:**

```sql
-- migrations/0010_evaluation_schema.down.sql

DROP TABLE IF EXISTS evaluation.evaluation_item_score;
DROP TABLE IF EXISTS evaluation.semester_evaluation;
DROP TABLE IF EXISTS evaluation.evaluation_item;
```

**Explanation:**
- `semester_evaluation.child_id` is `CASCADE` (dependent), while `semester_id`, `evaluator_id`, and `approver_id` are all `RESTRICT` — historical semesters and the coordinators who evaluated/approved a report must remain queryable indefinitely.
- `approver_id` is the one subtle delete-rule decision worth restating: it is **nullable** (approval is optional until it happens) but deliberately **not `SET NULL`** once populated — `RESTRICT` was chosen specifically so a coordinator deletion can never silently erase the record of who approved a report, even though the column itself started out empty.
- `uq_evaluation_per_child_per_semester` means regenerating or syncing an evaluation (per the PRD's auto-sync/mass-generate requirement) updates the existing row rather than creating a duplicate.
- `evaluation_item_score.evaluation_id` is `CASCADE` (scores are detail data of their evaluation); `item_id` is `RESTRICT` (preserve historical item definitions). `chk_score_range` bounds scores to 0–100 — flagged in the specification as an inferred default, not a confirmed grading-scale requirement (see §18 in this document).

---

## Migration 0011 — Finance Schema

**Purpose:** the most tightly guarded schema in the entire design. No cascades, no physical deletes, ever. Directly resolves the legacy system's most serious integrity risk: `ajis_input_donasi`/`ajis_penyaluran` had no enforced foreign key back to a canonical sponsorship record.

```sql
-- migrations/0011_finance_schema.sql

-- ── transaction ───────────────────────────────────────────
CREATE TABLE finance.transaction (
    transaction_id    BIGSERIAL PRIMARY KEY,
    pairing_id        BIGINT NOT NULL,
    transaction_type  VARCHAR(20) NOT NULL,
    amount            NUMERIC(14,2) NOT NULL,
    transaction_date  DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_transaction_type
        CHECK (transaction_type IN ('donation', 'disbursement', 'adjustment')),
    CONSTRAINT chk_transaction_amount_positive CHECK (amount > 0),
    CONSTRAINT fk_transaction_pairing FOREIGN KEY (pairing_id)
        REFERENCES sponsorship.child_donor_pairing (pairing_id) ON DELETE RESTRICT
);
CREATE INDEX ix_transaction_pairing_id ON finance.transaction (pairing_id);
CREATE INDEX ix_transaction_type ON finance.transaction (transaction_type);
COMMENT ON TABLE finance.transaction IS 'A single donation, disbursement, or adjustment tied to a sponsorship pairing. No updated_at - rows are application-level immutable; corrections are offsetting adjustment rows, never in-place edits.';
COMMENT ON COLUMN finance.transaction.amount IS 'Always positive (chk_transaction_amount_positive). A reversal is a positive-amount adjustment-type row, not a negative donation - see spec §18 item 6 if signed adjustments are later required.';
```

**Rollback:**

```sql
-- migrations/0011_finance_schema.down.sql

DROP TABLE IF EXISTS finance.transaction;
```

**Explanation:**
- `pairing_id → sponsorship.child_donor_pairing` is `RESTRICT` — the single most emphatic rule in the entire schema. No alternative delete rule was ever acceptable in the source design: cascading here would be an accounting-standards violation.
- **No `updated_at` column, deliberately.** Financial rows are meant to be application-level immutable — a transaction is corrected by inserting an offsetting `adjustment` row, never by mutating an existing row. Adding `updated_at` would imply the row is expected to change after creation, contradicting that immutability. Database-level enforcement of this immutability is handled separately in **Migration 0013**.
- `chk_transaction_amount_positive` treats `donation`/`disbursement`/`adjustment` as distinct categories, not signed debits/credits — a reversal is a positive-amount `adjustment` row, not a negative `donation`. This is flagged in the specification (§18 item 6) as an assumption worth confirming, not a settled fact.
- `amount NUMERIC(14,2)`, never `FLOAT`/`REAL` — no exceptions for financial data, per the schema-wide money-column rule.
- Two indexes only: `pairing_id` (required for the `RESTRICT` check and "all transactions for this sponsorship") and `transaction_type` (supports "all disbursements this month"-style filtering). This table is expected to reach millions of rows, so indexing here is deliberately minimal — an unused index on a table this size is pure write-amplification cost with no offsetting benefit.

---

## Migration 0012 — `updated_at` Trigger Function & Triggers

**Purpose:** every table with an `updated_at` column (§2.4 of the specification) needs it refreshed automatically on every row modification, without relying on application-layer discipline to remember to set it. This migration creates one shared trigger function and attaches it to every qualifying table.

```sql
-- migrations/0012_updated_at_triggers.sql

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION public.set_updated_at() IS 'Shared BEFORE UPDATE trigger function: stamps updated_at with the current timestamp on every row modification. Attached to every table that has an updated_at column.';

-- geography
CREATE TRIGGER trg_set_updated_at BEFORE UPDATE ON geography.province    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_set_updated_at BEFORE UPDATE ON geography.district   FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_set_updated_at BEFORE UPDATE ON geography.subdistrict FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_set_updated_at BEFORE UPDATE ON geography.village    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_set_updated_at BEFORE UPDATE ON geography.location   FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- organization
CREATE TRIGGER trg_set_updated_at BEFORE UPDATE ON organization.office           FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_set_updated_at BEFORE UPDATE ON organization.coaching_region  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_set_updated_at BEFORE UPDATE ON organization.facility         FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- reference
CREATE TRIGGER trg_set_updated_at BEFORE UPDATE ON reference.session_type       FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_set_updated_at BEFORE UPDATE ON reference.attendance_status  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_set_updated_at BEFORE UPDATE ON reference.welfare_category   FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_set_updated_at BEFORE UPDATE ON reference.semester           FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_set_updated_at BEFORE UPDATE ON reference.role               FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- person
CREATE TRIGGER trg_set_updated_at BEFORE UPDATE ON person.child             FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_set_updated_at BEFORE UPDATE ON person.family_member     FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_set_updated_at BEFORE UPDATE ON person.household_member  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_set_updated_at BEFORE UPDATE ON person.coordinator       FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_set_updated_at BEFORE UPDATE ON person.donor             FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_set_updated_at BEFORE UPDATE ON person.child_education   FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_set_updated_at BEFORE UPDATE ON person.system_user       FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- access_control (permission only - role_permission has no updated_at)
CREATE TRIGGER trg_set_updated_at BEFORE UPDATE ON access_control.permission FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- program
CREATE TRIGGER trg_set_updated_at BEFORE UPDATE ON program.program           FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_set_updated_at BEFORE UPDATE ON program.child_enrollment  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- sponsorship (child_donor_pairing only - pairing_balance_snapshot has no updated_at)
CREATE TRIGGER trg_set_updated_at BEFORE UPDATE ON sponsorship.child_donor_pairing FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- activity (coaching_session, hafalan_item_lookup, hafalan_assessment only -
-- session_attendance and session_habit_tracking have no updated_at)
CREATE TRIGGER trg_set_updated_at BEFORE UPDATE ON activity.coaching_session     FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_set_updated_at BEFORE UPDATE ON activity.hafalan_item_lookup  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_set_updated_at BEFORE UPDATE ON activity.hafalan_assessment   FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- evaluation (evaluation_item, semester_evaluation only - evaluation_item_score has no updated_at)
CREATE TRIGGER trg_set_updated_at BEFORE UPDATE ON evaluation.evaluation_item      FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_set_updated_at BEFORE UPDATE ON evaluation.semester_evaluation  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- finance.transaction is intentionally excluded - no updated_at column exists on that table.
```

**Rollback:**

```sql
-- migrations/0012_updated_at_triggers.down.sql

DROP TRIGGER IF EXISTS trg_set_updated_at ON evaluation.semester_evaluation;
DROP TRIGGER IF EXISTS trg_set_updated_at ON evaluation.evaluation_item;
DROP TRIGGER IF EXISTS trg_set_updated_at ON activity.hafalan_assessment;
DROP TRIGGER IF EXISTS trg_set_updated_at ON activity.hafalan_item_lookup;
DROP TRIGGER IF EXISTS trg_set_updated_at ON activity.coaching_session;
DROP TRIGGER IF EXISTS trg_set_updated_at ON sponsorship.child_donor_pairing;
DROP TRIGGER IF EXISTS trg_set_updated_at ON program.child_enrollment;
DROP TRIGGER IF EXISTS trg_set_updated_at ON program.program;
DROP TRIGGER IF EXISTS trg_set_updated_at ON access_control.permission;
DROP TRIGGER IF EXISTS trg_set_updated_at ON person.system_user;
DROP TRIGGER IF EXISTS trg_set_updated_at ON person.child_education;
DROP TRIGGER IF EXISTS trg_set_updated_at ON person.donor;
DROP TRIGGER IF EXISTS trg_set_updated_at ON person.coordinator;
DROP TRIGGER IF EXISTS trg_set_updated_at ON person.household_member;
DROP TRIGGER IF EXISTS trg_set_updated_at ON person.family_member;
DROP TRIGGER IF EXISTS trg_set_updated_at ON person.child;
DROP TRIGGER IF EXISTS trg_set_updated_at ON reference.role;
DROP TRIGGER IF EXISTS trg_set_updated_at ON reference.semester;
DROP TRIGGER IF EXISTS trg_set_updated_at ON reference.welfare_category;
DROP TRIGGER IF EXISTS trg_set_updated_at ON reference.attendance_status;
DROP TRIGGER IF EXISTS trg_set_updated_at ON reference.session_type;
DROP TRIGGER IF EXISTS trg_set_updated_at ON organization.facility;
DROP TRIGGER IF EXISTS trg_set_updated_at ON organization.coaching_region;
DROP TRIGGER IF EXISTS trg_set_updated_at ON organization.office;
DROP TRIGGER IF EXISTS trg_set_updated_at ON geography.location;
DROP TRIGGER IF EXISTS trg_set_updated_at ON geography.village;
DROP TRIGGER IF EXISTS trg_set_updated_at ON geography.subdistrict;
DROP TRIGGER IF EXISTS trg_set_updated_at ON geography.district;
DROP TRIGGER IF EXISTS trg_set_updated_at ON geography.province;

DROP FUNCTION IF EXISTS public.set_updated_at();
```

**Explanation:**
- One shared `plpgsql` function, `public.set_updated_at()`, attached via `BEFORE UPDATE` triggers rather than duplicated per table — 27 triggers, one function, so the timestamp-refresh logic exists in exactly one place.
- **Deliberately excludes** every table without an `updated_at` column — `access_control.role_permission`, `sponsorship.pairing_balance_snapshot`, `activity.session_attendance`, `activity.session_habit_tracking`, `evaluation.evaluation_item_score`, and `finance.transaction` — each of those is either a pure junction/detail table or, in `transaction`'s case, intentionally immutable (see Migration 0011 and 0013).
- Living in the `public` schema (rather than one of the ten business schemas) because it's shared infrastructure, not domain data — this keeps it discoverable without needing to guess which business schema "owns" a cross-cutting utility function.
- This migration must run **after** every table it attaches to has been created (i.e., last among the schema-creation migrations, before 0013) — attaching a trigger to a table that doesn't exist yet will fail the whole migration.

---

## Migration 0013 — Finance Immutability Trigger

**Purpose:** enforce the "financial rows are application-level immutable" rule described in `10_DATABASE_SPECIFICATION.md` §13.1 at the database level, not just by convention. This is the specification's own recommended next step, implemented here as its own migration so it can be reviewed, tested, and rolled back independently of the table definition itself.

```sql
-- migrations/0013_finance_immutability_trigger.sql

CREATE OR REPLACE FUNCTION finance.reject_transaction_mutation()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION
        'finance.transaction rows are immutable: % is not permitted. Insert an offsetting adjustment-type row instead of modifying transaction_id %.',
        TG_OP,
        COALESCE(OLD.transaction_id, NEW.transaction_id);
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION finance.reject_transaction_mutation() IS 'Blocks UPDATE and DELETE on finance.transaction. Corrections must be an offsetting adjustment-type INSERT, per spec §13.1.';

CREATE TRIGGER trg_reject_transaction_update
    BEFORE UPDATE ON finance.transaction
    FOR EACH ROW EXECUTE FUNCTION finance.reject_transaction_mutation();

CREATE TRIGGER trg_reject_transaction_delete
    BEFORE DELETE ON finance.transaction
    FOR EACH ROW EXECUTE FUNCTION finance.reject_transaction_mutation();
```

**Rollback:**

```sql
-- migrations/0013_finance_immutability_trigger.down.sql

DROP TRIGGER IF EXISTS trg_reject_transaction_delete ON finance.transaction;
DROP TRIGGER IF EXISTS trg_reject_transaction_update ON finance.transaction;
DROP FUNCTION IF EXISTS finance.reject_transaction_mutation();
```

**Explanation:**
- The specification explicitly names this as the recommended follow-up (§13.1: "Enforcing this immutability at the database level ... is the recommended next step when migrations are built") rather than something to leave to application discipline alone.
- Implemented as a trigger (not a `REVOKE UPDATE, DELETE`) so the error message is specific and actionable — it names the operation attempted and the `transaction_id` involved, guiding the caller toward inserting an offsetting `adjustment` row instead of leaving them with a bare permission-denied error.
- Kept as its own migration, separate from `0011_finance_schema.sql`, so a team that wants the table structure without the hard immutability trigger (e.g., during an early data-migration/backfill phase from the legacy MySQL system, where correcting bad historical rows in place may be unavoidable) can apply through `0012` and defer `0013` until backfill is complete — then apply it before go-live.
- Note: superuser/`BYPASSRLS`-equivalent roles and direct `TRUNCATE` are not blocked by this trigger (`TRUNCATE` does not fire row-level `BEFORE` triggers in PostgreSQL) — if `TRUNCATE` protection on `finance.transaction` is required, add a statement-level `BEFORE TRUNCATE` trigger using the same rejection function as a follow-up migration, and revoke `TRUNCATE`/superuser access from the application's runtime database role as a defense-in-depth measure at the Neon role-configuration level (outside the scope of a SQL migration file).

---

## 16. Verification Queries

Run these against a Neon development branch immediately after applying all 13 migrations, before promoting to staging.

```sql
-- Confirm all 34 tables exist across the 10 schemas
SELECT table_schema, COUNT(*) AS table_count
FROM information_schema.tables
WHERE table_schema IN (
    'geography','organization','person','reference','access_control',
    'program','sponsorship','activity','evaluation','finance'
)
GROUP BY table_schema
ORDER BY table_schema;

-- Confirm every foreign key has a supporting index (should return zero rows)
-- (Requires the FK columns to be leading columns of an index; a simplified check:)
SELECT conname, conrelid::regclass AS table_name
FROM pg_constraint
WHERE contype = 'f'
  AND NOT EXISTS (
      SELECT 1 FROM pg_index i
      WHERE i.indrelid = conrelid
        AND (conkey <@ i.indkey::smallint[])
  );

-- Confirm the finance immutability trigger blocks an UPDATE (expect an exception)
-- Run inside a transaction and roll back:
BEGIN;
  INSERT INTO finance.transaction (pairing_id, transaction_type, amount)
  VALUES (1, 'donation', 100000.00);
  UPDATE finance.transaction SET amount = 200000.00 WHERE transaction_id = currval('finance.transaction_transaction_id_seq');
ROLLBACK;

-- Confirm updated_at refreshes on UPDATE for a representative table
BEGIN;
  INSERT INTO reference.role (code, name) VALUES ('test_role', 'Test Role');
  UPDATE reference.role SET name = 'Test Role Updated' WHERE code = 'test_role';
  SELECT code, created_at, updated_at, (updated_at > created_at) AS refreshed
  FROM reference.role WHERE code = 'test_role';
ROLLBACK;
```

---

## 17. Known Deviations From the Specification & Why

Per `00_PROJECT_CONTEXT.md` §13, decisions with a rationale trade-off are documented with the reasoning, not just the conclusion. This migration makes exactly one implementation choice that isn't a literal line-for-line transcription of the specification's prose — flagged here so it can be evaluated, not silently discovered later:

**`person.system_user.coordinator_id` / `.donor_id` uniqueness.** `10_DATABASE_SPECIFICATION.md` §6.7 names both a table-level `UNIQUE` constraint (`uq_system_user_coordinator_id UNIQUE (coordinator_id)`) **and**, separately in §15.3, a partial index "since these columns are NULL for a large share of rows." A literal reading would create two overlapping objects enforcing the same uniqueness with different storage characteristics. This migration implements the uniqueness as a single **partial unique index** (`CREATE UNIQUE INDEX ... WHERE coordinator_id IS NOT NULL`), which:
- Still enforces "a coordinator can have at most one login account" exactly as required.
- Excludes `NULL` rows from the index, matching the specification's own partial-index rationale (§15.3) without a redundant second index covering the same column.
- Is the standard production pattern for a nullable one-to-(zero-or-one) FK in PostgreSQL.

No other table, column, constraint, or delete rule in this migration deviates from `10_DATABASE_SPECIFICATION.md`. Everything else is a direct SQL implementation of that document.

---

## 18. Open Items Carried Forward (Not Resolved by This Migration)

These are unchanged from `10_DATABASE_SPECIFICATION.md` §18 — this migration implements the specification as written, including its explicitly-flagged open items, rather than guessing at answers on its own authority:

1. **Full column lists** for `child`, `coordinator`, `donor`, `program`, `office`, `facility`, `evaluation_item`, and `hafalan_item_lookup` remain FK/PK/audit/soft-delete-only. Adding business columns (address, DOB, NIK, etc.) is a **future additive migration** (`ALTER TABLE ... ADD COLUMN`), not a rework of this one.
2. **`is_system_account`** as the `chk_system_user_owner` substitute — confirm this correctly captures the "admin/system" carve-out before relying on it in production auth logic.
3. **`CHECK`-constrained vocabularies** (`transaction_type`, `education_level`, `session_habit_tracking.status`, `hafalan_assessment.status`, `family_member.relationship`) are implemented exactly as specified, including the note that `education_level` may need `smk` added. Adding a value later is `ALTER TABLE ... DROP CONSTRAINT ...; ALTER TABLE ... ADD CONSTRAINT ...` — a small, transactional, additive migration, per the whole rationale for choosing `CHECK` over native `ENUM` (§2.2).
4. **`hafalan_assessment` one-row-per-child-per-item** — confirm whether overwrite-in-place (current) or full re-assessment history (would require dropping `uq_hafalan_assessment_per_child_item` and adding an `assessed_at` versioning column) is correct.
5. **0–100 bound on `evaluation_item_score.score`** — confirm against the actual Laporan Semester grading scale.
6. **Signed vs. always-positive `finance.transaction.amount`** for `adjustment` rows — confirm before this becomes a production financial-reporting assumption baked into every downstream report query.
7. **Whether a queryable `deleted_at`** is needed on any specific table beyond the `active` flag pattern — no such requirement has been identified; this migration does not add one anywhere.

**None of these block applying this migration to a development branch.** They should be resolved — via a short, additive follow-up migration each — before this schema is promoted to production, per the same "explicit assumption, not silent guess" principle `10_DATABASE_SPECIFICATION.md` was written under.

---

**End of 14_DATABASE_MIGRATION.md**
