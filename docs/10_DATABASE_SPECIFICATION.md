# 10_DATABASE_SPECIFICATION.md

## AJIS — Anak Juara Information System
### PostgreSQL Database Specification

**Prepared for:** Rumah Zakat — Anak Juara Program
**Target Database:** PostgreSQL 14+
**Author role:** Senior PostgreSQL Database Architect
**Source documents:** Product Requirements Document (PRD), PostgreSQL Entity-Relationship Diagram (ERD), PostgreSQL Architecture Design, Database Normalization Guide, Foreign Key Relationship Design, PostgreSQL Indexing Strategy
**Status:** Specification only — **no SQL migration is included in this document**
**Document Date:** July 14, 2026

---

## Table of Contents

1. [Introduction & Scope](#1-introduction--scope)
2. [Global Design Conventions](#2-global-design-conventions)
3. [Schema (Namespace) Architecture](#3-schema-namespace-architecture)
4. [Geography Schema](#4-geography-schema)
5. [Organization Schema](#5-organization-schema)
6. [Person Schema](#6-person-schema)
7. [Reference Schema](#7-reference-schema)
8. [Access Control Schema](#8-access-control-schema)
9. [Program Schema](#9-program-schema)
10. [Sponsorship Schema](#10-sponsorship-schema)
11. [Activity Schema](#11-activity-schema)
12. [Evaluation Schema](#12-evaluation-schema)
13. [Finance Schema](#13-finance-schema)
14. [Cross-Schema Foreign Key Matrix](#14-cross-schema-foreign-key-matrix)
15. [Indexing Strategy](#15-indexing-strategy)
16. [Scalability Considerations for Millions of Records](#16-scalability-considerations-for-millions-of-records)
17. [Future Extensibility](#17-future-extensibility)
18. [Open Items to Confirm Before Migration](#18-open-items-to-confirm-before-migration)

---

## 1. Introduction & Scope

This document is the complete physical database specification for the AJIS rebuild described in the Product Requirements Document. AJIS manages the end-to-end lifecycle of the Anak Juara child-sponsorship program: child registration, weekly coaching sessions (Pembinaan), Qur'an memorization tracking (Hafalan), semester evaluations (Penilaian), sponsorship/donor linkage, and donation/disbursement records.

The legacy MySQL system is a small number of very wide, denormalized tables with **no foreign key constraints**, duplicate lookup tables, ENUM-typed columns, and broken audit trails. This specification replaces that structure with a fully normalized (3NF), explicitly constrained PostgreSQL schema, organized into **ten schemas (namespaces)** that mirror the application's business domains: `geography`, `organization`, `person`, `reference`, `access_control`, `program`, `sponsorship`, `activity`, `evaluation`, and `finance`.

This document explains **every table, every column, every constraint, every index, every foreign key, every default value, every nullable column, and every business rule** in the schema, and why each exists. No `CREATE TABLE` migration script is generated here — this is a specification, not a migration artifact.

---

## 2. Global Design Conventions

The following rules are applied uniformly across all 34 tables. Each is a deliberate architectural decision, not a default left unexamined.

### 2.1 Primary Keys: `BIGSERIAL`, never `UUID`

Every primary key in this schema is `BIGSERIAL PRIMARY KEY` (an auto-incrementing 8-byte integer), and every foreign key referencing it is `BIGINT`.

**Why:**
- **Index density and cache locality.** `BIGINT` is 8 bytes with sequential, monotonically increasing values, so B-tree indexes stay well-packed and cache-friendly. `UUID` (16 bytes, random by default) causes index page splits and bloat and defeats index-only scans more often.
- **Join performance.** This schema is deeply hierarchical (province → district → subdistrict → village → location; office → office; child → enrollment → pairing → transaction), so cheap integer joins compound across many levels.
- **Storage at scale.** `BIGINT` FK columns are half the size of `UUID`, which matters across 30+ tables with heavy FK fan-out (`session_attendance`, `transaction`).
- **Operational readability.** Sequential IDs are easier to reason about in support/debugging queries.

**Trade-off acknowledged:** sequential IDs are guessable and reveal approximate row counts. Where a donor- or child-facing identifier is ever exposed externally (a receipt number, a public URL), the recommendation is to expose a separate non-sequential *display* code (e.g., `donor_public_code VARCHAR`) rather than abandoning `BIGSERIAL` for the internal primary key — this keeps joins fast while hiding cardinality externally. This is a forward-looking note, not a column added in Phase 1.

### 2.2 No Native `ENUM` — `VARCHAR` + `CHECK` Instead

The legacy system's ENUM-like columns (`transaction_type`, `education_level`, and every status/relationship/type field) are modeled as `VARCHAR` with an explicit `CHECK` constraint, **not** PostgreSQL's native `ENUM` type.

**Why:**
- **Schema evolution.** Adding a value to a native `ENUM` requires `ALTER TYPE ... ADD VALUE`, which historically could not run inside a transaction with other DDL and still cannot be rolled back within the same transaction. A `CHECK` constraint is dropped and re-added in one transactional `ALTER TABLE`.
- **Removing a value.** Native `ENUM` has no supported way to remove a value without rebuilding the type and every column using it. A `CHECK` constraint is simply redefined.
- **Tooling compatibility.** BI tools, ORMs, and reporting layers handle `VARCHAR` natively; native enum types often require `::text` casts in every query — friction this reporting-heavy system (attendance, evaluation, finance) doesn't need.
- **Consistency with the reference-table philosophy.** Most enum-like concepts here (session type, attendance status, welfare category, role) are already modeled as proper `RESTRICT`-protected lookup tables, not native enums. Making `transaction_type` and `education_level` `VARCHAR` + `CHECK` keeps one consistent enumeration strategy across the whole schema instead of mixing two.

### 2.3 Naming: `snake_case` Throughout

All schema names, table names, column names, constraint names, and index names use `snake_case` (e.g., `child_donor_pairing`, `ix_session_attendance_child_id`, `chk_transaction_amount_positive`). This matches PostgreSQL's own unquoted-identifier folding behavior (avoiding the need for double-quoted mixed-case identifiers in every query) and keeps naming uniform between application code, migrations, and ad hoc SQL.

Index names follow `ix_<table>_<column(s)>`; unique constraints follow `uq_<table>_<column(s)>`; check constraints follow `chk_<table>_<rule>`.

### 2.4 `TIMESTAMP` for `created_at` / `updated_at`

Per the stated requirement, every table's audit columns use `TIMESTAMP` (no time zone):

```
created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
```

**Why `DEFAULT CURRENT_TIMESTAMP`:** every row is stamped at insert time without relying on the application layer to remember to set it. An `updated_at`-refresh trigger (`BEFORE UPDATE ... EXECUTE FUNCTION set_updated_at()`) is assumed at build time so `updated_at` stays accurate on every row modification without application-layer discipline.

**Caveat worth flagging:** AJIS is a single-country (Indonesia, WIB/UTC+7) operation, so naive `TIMESTAMP` is workable as long as the application layer is consistent about which zone it writes in. If AJIS ever spans multiple time zones, `TIMESTAMPTZ` would remove an entire class of bugs — this is noted for future revisit, not overridden, since `TIMESTAMP` is an explicit requirement for this specification.

**Exception:** `finance.transaction` intentionally has **no `updated_at`** — see §13.

### 2.5 `deleted_at` — Only Where Soft Delete Is Actually Needed

Per the requirement, `deleted_at` is **not** added to every table by default. Instead, this schema follows the pattern already implied by the source documents: an `active BOOLEAN NOT NULL DEFAULT TRUE` flag on tables where the business needs to deactivate a record without losing history (offices, coaching regions, facilities, reference/lookup tables, children, coordinators, donors, sponsorship pairings, hafalan items). `active` is a simpler, indexable, query-friendly soft-delete signal for these "is this record currently in use" cases, and it is what the normalization and FK-design source documents recommend throughout ("use `active = false` instead of a hard delete").

A dedicated `deleted_at TIMESTAMP` column (recording *when* a soft delete happened, as opposed to *whether* one happened) is **not** introduced in Phase 1 because no table in the source documents has a stated requirement to know the exact deletion timestamp separately from `updated_at` — `updated_at` already captures "when this row was last changed," and the `active` flag captures "is it live." If a future requirement needs a queryable deletion timestamp distinct from `updated_at` (e.g., "restore anything soft-deleted in the last 30 days"), `deleted_at` can be added to the specific table(s) that need it without a schema-wide migration.

Tables that are pure dependent/detail data (e.g., `family_member`, `session_attendance`, `evaluation_item_score`) do **not** get `active` or `deleted_at` — they are deleted (via `CASCADE`) only when their parent is deleted, so an independent soft-delete flag would be meaningless.

**Non-negotiable exception:** `finance.transaction` has no `active` and no `deleted_at`. Financial rows are application-level immutable; see §13.

### 2.6 Delete-Rule Mapping

| Business rule | PostgreSQL clause | Applied when |
|---|---|---|
| CASCADE | `ON DELETE CASCADE` | Child row has no meaning without its parent (e.g., `family_member` without `child`) |
| RESTRICT | `ON DELETE RESTRICT` | Parent is reference/historical data that must never silently disappear out from under dependent rows (e.g., any financial, audit-trail, or lookup relationship) |
| SET NULL | `ON DELETE SET NULL` | Relationship is genuinely optional and the dependent row remains meaningful without it (e.g., a login account whose linked coordinator record is removed) |

`NO ACTION` is not used as a distinct choice — where the source design considered it equivalent to `RESTRICT` in practice, `RESTRICT` is used explicitly for immediate, statement-time error reporting rather than deferred constraint checking.

### 2.7 Money Columns

Every monetary column (`amount`, `closing_balance`) is `NUMERIC(14,2)` — **never** `FLOAT`/`REAL`. Floating-point binary types introduce rounding error that is unacceptable for financial balances; `NUMERIC` is exact decimal arithmetic. This is applied consistently in `sponsorship.pairing_balance_snapshot` and `finance.transaction`.

### 2.8 Indexing Convention

PostgreSQL automatically indexes primary keys (and columns with a `UNIQUE` constraint) but **does not** automatically index foreign key columns. Every FK column in this schema receives an explicit index. This matters for two reasons:

1. `RESTRICT`/`CASCADE` delete checks must scan the *child* table for matching rows — without an index, that is a full table scan on every parent delete or update attempt.
2. Nearly every real query pattern in AJIS is a lookup by foreign key (sessions by region, attendance by child, transactions by pairing) — the FK index is also the query index.

Full rationale is in §15.

---

## 3. Schema (Namespace) Architecture

PostgreSQL schemas (namespaces) are used to mirror the application's logical domain grouping directly onto the physical database, matching how the source documents already refer to tables (`person.child`, `finance.transaction`). This keeps the layout self-documenting and lets `search_path` and per-schema `GRANT`s map cleanly onto application modules — for example, a reporting role can be granted read-only access to `finance` alone, without touching `person` or `activity`.

| Schema | Responsibility | Table Count |
|---|---|---|
| `geography` | Province → district → subdistrict → village hierarchy and physical location data | 5 |
| `organization` | Rumah Zakat's own structure: offices, office hierarchy, coaching regions, facilities | 3 |
| `person` | Every human entity and how they log in: children, family, coordinators, donors, accounts | 6 |
| `reference` | Small, stable lookup tables — the "enum replacements" | 5 |
| `access_control` | Role-based permissions, separate from row-level data scoping | 2 |
| `program` | What program a child is in and eligibility status | 2 |
| `sponsorship` | Donor-to-child sponsorship relationships and program funding linkage | 2 |
| `activity` | Coaching sessions, attendance/habit tracking, hafalan assessments | 5 |
| `evaluation` | Semester evaluation items, scores, and report data | 3 |
| `finance` | Donation input and disbursement records tied to sponsorships | 1 |
| **Total** | | **34** |

`reference.role` must exist before `person.system_user` (which references it); `organization.office` must exist before `person.coordinator`; creation order will matter once a migration script is produced, though that ordering is outside the scope of this document.

---

## 4. Geography Schema

**Why this schema exists:** the legacy system stored the province/district/subdistrict/village hierarchy redundantly inside `ajis_anak` (repeated separately for the child, father, mother, and guardian addresses) and again inside `ajis_kantor` and `ajis_wilayah_pembinaan` — the same "Jawa Barat" string duplicated 150+ times. This schema is the single normalized source of truth for Indonesian administrative geography, referenced by FK from anywhere an address is needed. It is treated as **immutable reference data**: every relationship is `RESTRICT`, since geographic hierarchy should never change and must never silently cascade away underneath historical address references.

### 4.1 `geography.province`

**Purpose:** top of the geographic hierarchy (an Indonesian province). The consolidation target for the legacy system's two duplicate province tables (`ajis_propinsi` and `ref_propinsi`), which were confirmed identical.

| Column | Type | Nullable | Default | Description |
|---|---|---|---|---|
| `province_id` | `BIGSERIAL` | NO (PK) | auto | Surrogate primary key. |
| `name` | `VARCHAR(150)` | NO | — | Province name (e.g., "Jawa Barat"). |
| `active` | `BOOLEAN` | NO | `TRUE` | Soft-delete flag; a province is deactivated, never hard-deleted, since historical addresses reference it. |
| `created_at` | `TIMESTAMP` | NO | `CURRENT_TIMESTAMP` | Row creation time. |
| `updated_at` | `TIMESTAMP` | NO | `CURRENT_TIMESTAMP` | Last modification time. |

**Constraints:**
- `uq_province_name UNIQUE (name)` — a province name must be unique across the whole table; prevents two "Jawa Barat" rows re-creating the legacy duplicate-table problem inside a single table.

**Indexes:** the `UNIQUE` constraint above automatically creates a B-tree index usable for name lookups; no additional index is needed at this table's size (34 Indonesian provinces).

**Business rules:** provinces are essentially static reference data; the application should never expose a raw `DELETE`, only `active = false`.

### 4.2 `geography.district` (kabupaten/kota)

| Column | Type | Nullable | Default | Description |
|---|---|---|---|---|
| `district_id` | `BIGSERIAL` | NO (PK) | auto | Surrogate primary key. |
| `province_id` | `BIGINT` | NO (FK) | — | Parent province. |
| `name` | `VARCHAR(150)` | NO | — | District/regency name. |
| `created_at` | `TIMESTAMP` | NO | `CURRENT_TIMESTAMP` | Row creation time. |
| `updated_at` | `TIMESTAMP` | NO | `CURRENT_TIMESTAMP` | Last modification time. |

**Constraints:**
- `uq_district_name_per_province UNIQUE (province_id, name)` — two districts can share a name across different provinces, but not within the same province.

**Foreign key:** `province_id → geography.province(province_id) ON DELETE RESTRICT`, `NOT NULL`. Every district must belong to exactly one province; a province cannot be deleted while any district still references it — this protects the geographic hierarchy from being silently truncated.

**Index:** `ix_district_province_id (province_id)` — required for the `RESTRICT` delete check on `province`, and for the everyday "list districts in this province" query.

**Business rules:** no district exists without a province (`NOT NULL`); district names are only guaranteed unique within their own province.

### 4.3 `geography.subdistrict` (kecamatan)

| Column | Type | Nullable | Default | Description |
|---|---|---|---|---|
| `subdistrict_id` | `BIGSERIAL` | NO (PK) | auto | Surrogate primary key. |
| `district_id` | `BIGINT` | NO (FK) | — | Parent district. |
| `name` | `VARCHAR(150)` | NO | — | Subdistrict name. |
| `created_at` | `TIMESTAMP` | NO | `CURRENT_TIMESTAMP` | Row creation time. |
| `updated_at` | `TIMESTAMP` | NO | `CURRENT_TIMESTAMP` | Last modification time. |

**Constraints:** `uq_subdistrict_name_per_district UNIQUE (district_id, name)` — same per-parent uniqueness pattern as district.

**Foreign key:** `district_id → geography.district(district_id) ON DELETE RESTRICT`, `NOT NULL` — identical rationale to §4.2, one level down.

**Index:** `ix_subdistrict_district_id (district_id)`.

### 4.4 `geography.village` (desa/kelurahan)

| Column | Type | Nullable | Default | Description |
|---|---|---|---|---|
| `village_id` | `BIGSERIAL` | NO (PK) | auto | Surrogate primary key. |
| `subdistrict_id` | `BIGINT` | NO (FK) | — | Parent subdistrict. |
| `name` | `VARCHAR(150)` | NO | — | Village name. |
| `created_at` | `TIMESTAMP` | NO | `CURRENT_TIMESTAMP` | Row creation time. |
| `updated_at` | `TIMESTAMP` | NO | `CURRENT_TIMESTAMP` | Last modification time. |

**Constraints:** `uq_village_name_per_subdistrict UNIQUE (subdistrict_id, name)`.

**Foreign key:** `subdistrict_id → geography.subdistrict(subdistrict_id) ON DELETE RESTRICT`, `NOT NULL` — bottom of the formal four-level administrative hierarchy.

**Index:** `ix_village_subdistrict_id (subdistrict_id)`.

### 4.5 `geography.location`

**Purpose:** a physical address/point that other schemas (family members, coordinators, donors, coaching sessions) attach to. This is the leaf node of the geography hierarchy and the one table in this schema that tolerates incompleteness.

| Column | Type | Nullable | Default | Description |
|---|---|---|---|---|
| `location_id` | `BIGSERIAL` | NO (PK) | auto | Surrogate primary key. |
| `village_id` | `BIGINT` | **YES** (FK) | — | Parent village, if known. |
| `address_text` | `VARCHAR(500)` | NO | — | Free-text address fallback, used whether or not `village_id` is set. |
| `created_at` | `TIMESTAMP` | NO | `CURRENT_TIMESTAMP` | Row creation time. |
| `updated_at` | `TIMESTAMP` | NO | `CURRENT_TIMESTAMP` | Last modification time. |

**Foreign key:** `village_id → geography.village(village_id) ON DELETE RESTRICT`, **nullable**. This is the only nullable FK in the geography schema, and deliberately so: real-world addresses are sometimes only known down to street level, not resolved to a specific village. `RESTRICT` is still the delete rule even though the column is nullable — a village cannot be removed while any location references it, and `RESTRICT` (rather than `SET NULL`) is chosen as the safer default that forces an explicit administrative decision rather than silently orphaning an address's geographic context.

**Index:** `ix_location_village_id (village_id)`.

**Business rules:** `address_text` always carries the human-readable address regardless of whether the formal hierarchy link is populated, so no downstream query ever has to treat a location as "empty" just because `village_id IS NULL`.

---

## 5. Organization Schema

**Why this schema exists:** models Rumah Zakat's own operating structure — offices (Kantor), the coaching regions (Wilayah Pembinaan) each office runs, and the physical facilities (schools) each office is associated with. Separating this from `geography` keeps "where in Indonesia" distinct from "how Rumah Zakat is organized," which the legacy schema conflated.

### 5.1 `organization.office` (Kantor)

**Purpose:** a branch or head office. Self-referencing to model the office hierarchy (e.g., a regional office overseeing several branch offices).

| Column | Type | Nullable | Default | Description |
|---|---|---|---|---|
| `office_id` | `BIGSERIAL` | NO (PK) | auto | Surrogate primary key. |
| `parent_office_id` | `BIGINT` | **YES** (FK, self-ref) | — | Parent office in the hierarchy; `NULL` for a root/head office. |
| `name` | `VARCHAR(150)` | NO | — | Office name. |
| `active` | `BOOLEAN` | NO | `TRUE` | Soft-delete flag; branches are deactivated, never hard-deleted. |
| `created_at` | `TIMESTAMP` | NO | `CURRENT_TIMESTAMP` | Row creation time. |
| `updated_at` | `TIMESTAMP` | NO | `CURRENT_TIMESTAMP` | Last modification time. |

**Constraints:**
- `chk_office_not_own_parent CHECK (office_id <> parent_office_id)` — a defensive check preventing an office from being data-entered as its own parent, which a plain self-referencing FK would not catch by itself.

**Foreign key:** `parent_office_id → organization.office(office_id) ON DELETE RESTRICT`, nullable. `RESTRICT` (not `CASCADE`) is deliberate: cascading a delete up an office hierarchy could silently remove an entire branch network in one statement. Deactivating an office tree is done via `active = false`, never via `DELETE`.

**Index:** `ix_office_parent_office_id (parent_office_id)` — required for the `RESTRICT` check, and for recursive hierarchy traversal (a `WITH RECURSIVE` query walking the office tree up or down uses this index at every level).

**Business rules:** the office hierarchy is walked with a recursive CTE at query time, not a separate materialized path column; root offices have `parent_office_id IS NULL`.

### 5.2 `organization.coaching_region` (Wilayah Pembinaan)

**Purpose:** a coaching territory assigned to a Korwil (regional coordinator), operating under one office.

| Column | Type | Nullable | Default | Description |
|---|---|---|---|---|
| `region_id` | `BIGSERIAL` | NO (PK) | auto | Surrogate primary key. |
| `office_id` | `BIGINT` | NO (FK) | — | Owning office. |
| `name` | `VARCHAR(150)` | NO | — | Region name. |
| `active` | `BOOLEAN` | NO | `TRUE` | Soft-delete flag. |
| `created_at` | `TIMESTAMP` | NO | `CURRENT_TIMESTAMP` | Row creation time. |
| `updated_at` | `TIMESTAMP` | NO | `CURRENT_TIMESTAMP` | Last modification time. |

**Foreign key:** `office_id → organization.office(office_id) ON DELETE RESTRICT`, `NOT NULL` — closing an office must not silently delete the coaching regions under it; the office must be explicitly deactivated and its regions reassigned or deactivated in their own right.

**Index:** `ix_coaching_region_office_id (office_id)`.

**Business rules:** `coaching_region` is the direct FK target of `activity.coaching_session.location_id`, so every session is traceable back to a region and, transitively, an office.

### 5.3 `organization.facility`

**Purpose:** a physical facility (e.g., a school) managed by an office; later referenced by `person.child_education.school_id`.

| Column | Type | Nullable | Default | Description |
|---|---|---|---|---|
| `facility_id` | `BIGSERIAL` | NO (PK) | auto | Surrogate primary key. |
| `office_id` | `BIGINT` | NO (FK) | — | Managing office. |
| `name` | `VARCHAR(200)` | NO | — | Facility name. |
| `active` | `BOOLEAN` | NO | `TRUE` | Soft-delete flag. |
| `created_at` | `TIMESTAMP` | NO | `CURRENT_TIMESTAMP` | Row creation time. |
| `updated_at` | `TIMESTAMP` | NO | `CURRENT_TIMESTAMP` | Last modification time. |

**Foreign key:** `office_id → organization.office(office_id) ON DELETE RESTRICT`, `NOT NULL`.

**Index:** `ix_facility_office_id (office_id)`.

**Business rules:** a facility must never disappear out from under a child's historical education record — this is why `child_education.school_id` (§6.6) is `RESTRICT`, not `CASCADE` or `SET NULL`.

---

## 6. Person Schema

**Why this schema exists:** every human entity in AJIS and how each one authenticates. This directly replaces the legacy `ajis_anak` table's worst violation — 40+ fixed columns for father/mother/guardian/household-member data that made it structurally impossible to represent a child with two guardians, zero guardians, or a guardian change over time.

### 6.1 `person.child`

**Purpose:** the sponsored program participant — the identity anchor that every other schema (enrollment, sessions, evaluations, sponsorship) hangs off via `child_id`. Kept deliberately minimal at the FK/identity level here since the source relationship documents specify this table's foreign-key role precisely but do not enumerate a full demographic column list (see §18, item 1) — additional demographic fields (birth date, gender, NIK, school, etc.) are expected to be added once the actual field list is confirmed, without changing this table's role as the identity anchor.

| Column | Type | Nullable | Default | Description |
|---|---|---|---|---|
| `child_id` | `BIGSERIAL` | NO (PK) | auto | Surrogate primary key; referenced by nearly every other schema. |
| `full_name` | `VARCHAR(200)` | NO | — | Child's full name. |
| `active` | `BOOLEAN` | NO | `TRUE` | Soft-delete flag; a child record is deactivated (e.g., graduated, withdrawn), never hard-deleted, since historical sessions/evaluations/sponsorships reference it. |
| `created_at` | `TIMESTAMP` | NO | `CURRENT_TIMESTAMP` | Row creation time. |
| `updated_at` | `TIMESTAMP` | NO | `CURRENT_TIMESTAMP` | Last modification time. |

**Business rules:** `child_id` is the join key for essentially every operational and reporting query in the system (attendance history, hafalan progress, evaluations, sponsorship). Deleting a child row is never done in practice — every dependent schema either `CASCADE`s (data meaningless without the child) or `RESTRICT`s (financial/audit data that must outlive a deactivated child record).

### 6.2 `person.family_member`

**Purpose:** replaces the legacy fixed father/mother/guardian columns with one row per family relationship, so a child can have any number of guardians (including zero, one, or several) without a schema change.

| Column | Type | Nullable | Default | Description |
|---|---|---|---|---|
| `family_member_id` | `BIGSERIAL` | NO (PK) | auto | Surrogate primary key. |
| `child_id` | `BIGINT` | NO (FK) | — | The child this family member belongs to. |
| `relationship` | `VARCHAR(50)` | NO | — | Relationship to the child. |
| `full_name` | `VARCHAR(200)` | NO | — | Family member's name. |
| `created_at` | `TIMESTAMP` | NO | `CURRENT_TIMESTAMP` | Row creation time. |
| `updated_at` | `TIMESTAMP` | NO | `CURRENT_TIMESTAMP` | Last modification time. |

**Constraints:**
- `chk_family_member_relationship CHECK (relationship IN ('father','mother','guardian','sibling','other'))` — the `VARCHAR`+`CHECK` enum replacement (see §2.2) for what the legacy schema encoded as separate column blocks.

**Foreign key:** `child_id → person.child(child_id) ON DELETE CASCADE`, `NOT NULL`. A family-member row has no independent meaning without its child; deleting a child row (rare, but possible for data-correction purposes) should remove its family records along with it rather than leaving orphans.

**Index:** `ix_family_member_child_id (child_id)` — required for the `CASCADE` delete check, and for the primary query pattern ("all family members of a child"). A composite `ix_family_member_child_relationship (child_id, relationship)` may be added if reports commonly sort/filter by relationship type, enabling an index-only sort instead of an in-memory one.

**Business rules:** this table is what allows AJIS to represent an orphan (yatim: father deceased, mother alive), a child under guardianship, or a guardian change — none of which the legacy fixed-column design could express without inconsistent NULL/placeholder conventions.

### 6.3 `person.household_member`

**Purpose:** distinct from `family_member` — tracks who lived in the child's household at a given point in time, versioned so household composition changes are auditable rather than overwritten.

| Column | Type | Nullable | Default | Description |
|---|---|---|---|---|
| `household_member_id` | `BIGSERIAL` | NO (PK) | auto | Surrogate primary key. |
| `child_id` | `BIGINT` | NO (FK) | — | The child whose household this describes. |
| `relationship` | `VARCHAR(50)` | NO | — | Relationship of this member to the child. |
| `full_name` | `VARCHAR(200)` | NO | — | Household member's name. |
| `effective_from` | `TIMESTAMP` | NO | `CURRENT_TIMESTAMP` | When this household membership became current. |
| `effective_to` | `TIMESTAMP` | **YES** | — | When this household membership ended; `NULL` means still current. |
| `created_at` | `TIMESTAMP` | NO | `CURRENT_TIMESTAMP` | Row creation time. |
| `updated_at` | `TIMESTAMP` | NO | `CURRENT_TIMESTAMP` | Last modification time. |

**Constraints:**
- `chk_household_member_dates CHECK (effective_to IS NULL OR effective_to >= effective_from)` — guards against a data-entry error where an end date precedes the start date.

**Foreign key:** `child_id → person.child(child_id) ON DELETE CASCADE`, `NOT NULL` — same dependent-data rationale as `family_member`.

**Index:** `ix_household_member_child_id (child_id)`. A partial index `ix_household_member_child_current (child_id) WHERE effective_to IS NULL` is recommended for the common "current household members of this child" query — since only ~10% of rows are typically "current" at any time, the partial index is a fraction of the size of a full index and gives O(log N) lookups for that filtered query specifically (see §15 on partial indexes).

**Business rules:** `effective_to IS NULL` is the sentinel for "still valid today" — the application never deletes a household_member row to represent someone moving out; it closes the row by setting `effective_to` and, if needed, opens a new row for the replacement member.

### 6.4 `person.coordinator`

**Purpose:** a volunteer/staff coordinator (Korwil), the "who did this" actor referenced downstream as session presenter, evaluator, and hafalan assessor.

| Column | Type | Nullable | Default | Description |
|---|---|---|---|---|
| `coordinator_id` | `BIGSERIAL` | NO (PK) | auto | Surrogate primary key. |
| `office_id` | `BIGINT` | **YES** (FK) | — | Office the coordinator is attached to, if any. |
| `full_name` | `VARCHAR(200)` | NO | — | Coordinator's name. |
| `phone` | `VARCHAR(30)` | YES | — | Contact number. |
| `active` | `BOOLEAN` | NO | `TRUE` | Soft-delete flag. |
| `created_at` | `TIMESTAMP` | NO | `CURRENT_TIMESTAMP` | Row creation time. |
| `updated_at` | `TIMESTAMP` | NO | `CURRENT_TIMESTAMP` | Last modification time. |

**Foreign key:** `office_id → organization.office(office_id) ON DELETE RESTRICT`, nullable. Nullable because a coordinator's office assignment is not always fixed at creation; `RESTRICT` protects against an office being deleted while coordinators are still attached to it.

**Index:** `ix_coordinator_office_id (office_id)`. A partial composite index `ix_coordinator_office_active_name (office_id, full_name) WHERE active = TRUE` supports "list active coordinators in this office by name" reports without scanning deactivated rows.

**Business rules:** `coordinator_id` is the actor reference for `coaching_session.presenter_id`, `hafalan_assessment.assessor_id`, and `semester_evaluation.evaluator_id`/`approver_id` — every one of those relationships is `RESTRICT`, meaning a coordinator record can never be hard-deleted once they have acted in the system; only deactivation (`active = false`) is available.

### 6.5 `person.donor`

**Purpose:** a sponsor/donor identity. Kept intentionally separate from `system_user` because not every donor has (or wants) a login account.

| Column | Type | Nullable | Default | Description |
|---|---|---|---|---|
| `donor_id` | `BIGSERIAL` | NO (PK) | auto | Surrogate primary key. |
| `full_name` | `VARCHAR(200)` | NO | — | Donor's name. |
| `active` | `BOOLEAN` | NO | `TRUE` | Soft-delete flag. |
| `created_at` | `TIMESTAMP` | NO | `CURRENT_TIMESTAMP` | Row creation time. |
| `updated_at` | `TIMESTAMP` | NO | `CURRENT_TIMESTAMP` | Last modification time. |

**Business rules:** a donor is referenced by `system_user` (optional portal login, `SET NULL` on delete) and by `sponsorship.child_donor_pairing` (financial linkage, `RESTRICT` on delete — a donor record backing an active or historical sponsorship can never be hard-deleted, only deactivated).

### 6.6 `person.child_education`

**Purpose:** the schema's worked example of the **temporal/effective-dating pattern**: one row per schooling period, so a child's education history is preserved rather than overwritten every time they advance a grade.

| Column | Type | Nullable | Default | Description |
|---|---|---|---|---|
| `education_id` | `BIGSERIAL` | NO (PK) | auto | Surrogate primary key. |
| `child_id` | `BIGINT` | NO (FK) | — | The child this record describes. |
| `education_level` | `VARCHAR(30)` | NO | — | Schooling level. |
| `grade` | `VARCHAR(20)` | YES | — | Grade/class label (e.g., "10"). |
| `school_id` | `BIGINT` | NO (FK) | — | The facility (school) the child is enrolled at. |
| `effective_from` | `DATE` | NO | — | When this education period began. |
| `effective_to` | `DATE` | YES | — | When this period ended; `NULL` means current. |
| `created_at` | `TIMESTAMP` | NO | `CURRENT_TIMESTAMP` | Row creation time. |
| `updated_at` | `TIMESTAMP` | NO | `CURRENT_TIMESTAMP` | Last modification time. |

**Constraints:**
- `chk_child_education_level CHECK (education_level IN ('sd','smp','sma','other'))` — the second field explicitly converted from legacy `ENUM` to `VARCHAR` + `CHECK` per the stated requirement.
- `chk_child_education_dates CHECK (effective_to IS NULL OR effective_to >= effective_from)`.

**Foreign keys:**
- `child_id → person.child(child_id) ON DELETE CASCADE`, `NOT NULL` — an education record is meaningless without the child.
- `school_id → organization.facility(facility_id) ON DELETE RESTRICT`, `NOT NULL` — a school must not vanish out from under a historical enrollment record; it must be deactivated (`active = false` on `facility`), not deleted.

**Indexes:**
- `ix_child_education_child_id (child_id)` and `ix_child_education_school_id (school_id)` — standard FK indexes.
- `ix_child_education_effective_range (child_id, effective_from, effective_to)` — a composite index directly supporting the point-in-time query "what grade was this child in on date X" (`WHERE child_id = ? AND ? BETWEEN effective_from AND effective_to`), which is a range lookup, not a simple equality lookup, and benefits from the leading `child_id` column narrowing the search before the date range is evaluated.

**Business rules:** the education vocabulary (`sd`/`smp`/`sma`/`other`) is inferred from the source documents' own examples ("Grade 8 SMP," "Grade 10 SMA") — the exact Indonesian education-level vocabulary (which may also need `smk`, for example) should be confirmed before the `CHECK` list is finalized; see §18.

### 6.7 `person.system_user`

**Purpose:** the login/account record — the one table that ties an authenticated identity to a coordinator, a donor, or a pure system/admin account.

| Column | Type | Nullable | Default | Description |
|---|---|---|---|---|
| `system_user_id` | `BIGSERIAL` | NO (PK) | auto | Surrogate primary key. |
| `coordinator_id` | `BIGINT` | **YES**, `UNIQUE` (FK) | — | Linked coordinator, if this account belongs to one. |
| `donor_id` | `BIGINT` | **YES**, `UNIQUE` (FK) | — | Linked donor, if this account belongs to one. |
| `role_id` | `BIGINT` | NO (FK) | — | The role this account holds (Super Admin / Branch Admin / Korwil). |
| `is_system_account` | `BOOLEAN` | NO | `FALSE` | Marks a pure admin/system account not tied to a coordinator or donor. |
| `username` | `VARCHAR(100)` | NO, `UNIQUE` | — | Login identifier. |
| `password_hash` | `VARCHAR(255)` | NO | — | Hashed credential; never stores plaintext. |
| `active` | `BOOLEAN` | NO | `TRUE` | Soft-delete flag; disables login without losing account history. |
| `created_at` | `TIMESTAMP` | NO | `CURRENT_TIMESTAMP` | Row creation time. |
| `updated_at` | `TIMESTAMP` | NO | `CURRENT_TIMESTAMP` | Last modification time. |

**Constraints:**
- `uq_system_user_username UNIQUE (username)` — no two accounts can share a login name.
- `uq_system_user_coordinator_id UNIQUE (coordinator_id)` — this is what turns the `coordinator → system_user` foreign key into a true one-to-(zero-or-one) relationship rather than one-to-many; a coordinator can have at most one login account.
- `uq_system_user_donor_id UNIQUE (donor_id)` — same pattern for donors.
- `chk_system_user_owner CHECK (coordinator_id IS NOT NULL OR donor_id IS NOT NULL OR is_system_account = TRUE)` — every account must belong to a coordinator, a donor, or be explicitly flagged as a system account. **Design note:** an earlier version of this rule was proposed as `CHECK (... OR role_id IN ('admin','system'))`, but PostgreSQL `CHECK` constraints can only evaluate the row's own columns — they cannot look up values in another table (`role_id` would need to join to `reference.role`). `is_system_account` is a same-row boolean substitute that captures the identical business intent without requiring a cross-table lookup.

**Foreign keys:**
- `coordinator_id → person.coordinator(coordinator_id) ON DELETE SET NULL`, nullable. If the linked coordinator record is deleted, the login account survives (orphaned from a coordinator) rather than disappearing — losing login history/audit trail would be worse than an orphaned link.
- `donor_id → person.donor(donor_id) ON DELETE SET NULL`, nullable — same reasoning for optional donor portal accounts.
- `role_id → reference.role(role_id) ON DELETE RESTRICT`, `NOT NULL` — a role cannot be deleted while any account holds it.

**Indexes:**
- `ix_system_user_role_id (role_id)` — FK index, required for the `RESTRICT` check and for "list all accounts with this role."
- `ix_system_user_coordinator_id (coordinator_id) WHERE coordinator_id IS NOT NULL` and `ix_system_user_donor_id (donor_id) WHERE donor_id IS NOT NULL` — partial indexes, since these columns are `NULL` for a large share of rows (system accounts and non-portal donors); a partial index avoids indexing rows where the lookup is meaningless.
- `uq_system_user_username` is itself a unique B-tree index, used directly for login lookup (`WHERE username = ?`) at O(log N).

**Business rules:** row-level access scoping (which offices/regions a user can see) is enforced at the application layer using `role_id` plus the linked `coordinator_id`'s `office_id`/region — this table only establishes *who* someone is and *what role* they hold, not the row-level scope itself (see PRD §4.1 for the Super Admin / Branch Admin / Korwil scoping model).

---

## 7. Reference Schema

**Why this schema exists:** small, stable lookup tables that are the schema-wide replacement for legacy free-text and native `ENUM` fields. Every table here shares the same shape — a stable `code` (for application logic to branch on) plus a human-readable `name` (for display/localization) — and is `RESTRICT`-protected so a lookup value in active use can never be silently deleted.

**Why `code` and `name` are separate columns:** if only `name` existed, renaming or translating a display label (e.g., localizing "Hadir" for a future multi-language UI) would risk breaking application logic that branches on the literal text. A stable `code` column, distinct from the localized/renamable `name`, is a small addition beyond the bare minimum but directly serves the fixed-vocabulary nature these lookup tables imply.

### 7.1 `reference.session_type`

Coaching session categories (Reguler, Edukasi Pekanan, P3A, Parenting).

| Column | Type | Nullable | Default | Description |
|---|---|---|---|---|
| `session_type_id` | `BIGSERIAL` | NO (PK) | auto | Surrogate primary key. |
| `code` | `VARCHAR(50)` | NO, `UNIQUE` | — | Stable code the application logic keys on. |
| `name` | `VARCHAR(100)` | NO | — | Display label. |
| `active` | `BOOLEAN` | NO | `TRUE` | Soft-delete flag. |
| `created_at` | `TIMESTAMP` | NO | `CURRENT_TIMESTAMP` | Row creation time. |
| `updated_at` | `TIMESTAMP` | NO | `CURRENT_TIMESTAMP` | Last modification time. |

**Constraint:** `uq_session_type_code UNIQUE (code)`. **Referenced by:** `activity.coaching_session.session_type_id` (`RESTRICT`) — see §11.

### 7.2 `reference.attendance_status`

Attendance states (Hadir/Izin/Alfa).

| Column | Type | Nullable | Default | Description |
|---|---|---|---|---|
| `attendance_status_id` | `BIGSERIAL` | NO (PK) | auto | Surrogate primary key. |
| `code` | `VARCHAR(50)` | NO, `UNIQUE` | — | Stable code. |
| `name` | `VARCHAR(100)` | NO | — | Display label (Hadir/Izin/Alfa). |
| `active` | `BOOLEAN` | NO | `TRUE` | Soft-delete flag. |
| `created_at` | `TIMESTAMP` | NO | `CURRENT_TIMESTAMP` | Row creation time. |
| `updated_at` | `TIMESTAMP` | NO | `CURRENT_TIMESTAMP` | Last modification time. |

**Constraint:** `uq_attendance_status_code UNIQUE (code)`. **Referenced by:** `activity.session_attendance.attendance_status_id` (`RESTRICT`) — preserves exactly what status was recorded historically, even if the lookup value is later deactivated.

### 7.3 `reference.welfare_category`

Zakat-eligibility classification (Yatim/Piatu/Dhuafa — Asnaf).

| Column | Type | Nullable | Default | Description |
|---|---|---|---|---|
| `welfare_category_id` | `BIGSERIAL` | NO (PK) | auto | Surrogate primary key. |
| `code` | `VARCHAR(50)` | NO, `UNIQUE` | — | Stable code. |
| `name` | `VARCHAR(100)` | NO | — | Display label. |
| `active` | `BOOLEAN` | NO | `TRUE` | Soft-delete flag. |
| `created_at` | `TIMESTAMP` | NO | `CURRENT_TIMESTAMP` | Row creation time. |
| `updated_at` | `TIMESTAMP` | NO | `CURRENT_TIMESTAMP` | Last modification time. |

**Constraint:** `uq_welfare_category_code UNIQUE (code)`. **Referenced by:** `program.child_enrollment.welfare_category_id` (`RESTRICT`).

### 7.4 `reference.semester`

A school-term period with real date bounds — replaces the legacy free-text semester labels.

| Column | Type | Nullable | Default | Description |
|---|---|---|---|---|
| `semester_id` | `BIGSERIAL` | NO (PK) | auto | Surrogate primary key. |
| `name` | `VARCHAR(50)` | NO | — | Display label (e.g., "Ganjil 2024"). |
| `year` | `INTEGER` | NO | — | Calendar year of the term. |
| `term` | `VARCHAR(20)` | NO | — | "Ganjil" (odd) or "Genap" (even). |
| `start_date` | `DATE` | NO | — | Term start date. |
| `end_date` | `DATE` | NO | — | Term end date. |
| `created_at` | `TIMESTAMP` | NO | `CURRENT_TIMESTAMP` | Row creation time. |
| `updated_at` | `TIMESTAMP` | NO | `CURRENT_TIMESTAMP` | Last modification time. |

**Constraints:**
- `uq_semester_year_term UNIQUE (year, term)` — only one "Ganjil 2024," ever.
- `chk_semester_dates CHECK (end_date > start_date)` — prevents an inverted or zero-length term, a direct fix for the legacy free-text semester field's total lack of validation.

**Referenced by:** `evaluation.semester_evaluation.semester_id` (`RESTRICT`), `sponsorship.pairing_balance_snapshot.semester_id` (`RESTRICT`) — a semester with historical evaluations or balance snapshots attached can never be deleted.

### 7.5 `reference.role`

System roles: Super Admin, Branch Admin, Korwil (Coordinator).

| Column | Type | Nullable | Default | Description |
|---|---|---|---|---|
| `role_id` | `BIGSERIAL` | NO (PK) | auto | Surrogate primary key. |
| `code` | `VARCHAR(50)` | NO, `UNIQUE` | — | Stable role code. |
| `name` | `VARCHAR(100)` | NO | — | Display label. |
| `active` | `BOOLEAN` | NO | `TRUE` | Soft-delete flag. |
| `created_at` | `TIMESTAMP` | NO | `CURRENT_TIMESTAMP` | Row creation time. |
| `updated_at` | `TIMESTAMP` | NO | `CURRENT_TIMESTAMP` | Last modification time. |

**Constraint:** `uq_role_code UNIQUE (code)`. **Referenced by:** `person.system_user.role_id` (`RESTRICT`) and `access_control.role_permission.role_id` (`CASCADE` — see §8).

---

## 8. Access Control Schema

**Why this schema exists:** role-based *feature* permissions, deliberately kept separate from the coarser row-level *data-scoping* rules enforced elsewhere in the application (Super Admin sees all offices; Branch Admin is scoped to their office; Korwil is scoped to their region). This schema answers "can this role perform this action at all," not "which rows can this user see."

### 8.1 `access_control.permission`

A named capability (e.g., `read_child`, `edit_child`).

| Column | Type | Nullable | Default | Description |
|---|---|---|---|---|
| `permission_id` | `BIGSERIAL` | NO (PK) | auto | Surrogate primary key. |
| `code` | `VARCHAR(100)` | NO, `UNIQUE` | — | Stable permission code. |
| `name` | `VARCHAR(150)` | NO | — | Display label. |
| `created_at` | `TIMESTAMP` | NO | `CURRENT_TIMESTAMP` | Row creation time. |
| `updated_at` | `TIMESTAMP` | NO | `CURRENT_TIMESTAMP` | Last modification time. |

**Constraint:** `uq_permission_code UNIQUE (code)`. No `active` flag — permissions are a fixed application-level vocabulary managed by deployment, not day-to-day CRUD.

### 8.2 `access_control.role_permission`

**Purpose:** the junction table linking roles to the permissions they grant.

| Column | Type | Nullable | Default | Description |
|---|---|---|---|---|
| `role_id` | `BIGINT` | NO (PK part, FK) | — | The role. |
| `permission_id` | `BIGINT` | NO (PK part, FK) | — | The permission granted to that role. |
| `created_at` | `TIMESTAMP` | NO | `CURRENT_TIMESTAMP` | When this grant was made. |

**Primary key:** `PRIMARY KEY (role_id, permission_id)` — a **composite** primary key, not a surrogate `BIGSERIAL`. This is a genuine pure junction table with no attributes of its own beyond the pairing itself, unlike, say, `child_donor_pairing` (which has dates/status and rightly gets its own surrogate key). The composite key both enforces "no duplicate role+permission grant" for free and matches the general principle that attribute-less junction tables use a composite key.

**Foreign keys:**
- `role_id → reference.role(role_id) ON DELETE CASCADE`, `NOT NULL` — a permission grant is an attribute of the role; if the role itself is removed, its grants are meaningless and should go with it.
- `permission_id → access_control.permission(permission_id) ON DELETE RESTRICT`, `NOT NULL` — a permission cannot be deleted while any role still holds it.

**Index:** the composite primary key already indexes `role_id` as its leading column (fast for "what can this role do"), so only `permission_id` needs a separate index: `ix_role_permission_permission_id (permission_id)` — supports the reverse lookup ("which roles have this permission") and the `RESTRICT` delete check on `permission`.

**Business rules:** row-level data scoping (office/region) is *not* modeled here — this table only governs feature-level yes/no permissions; see PRD §3.2, which explicitly defers finer-grained "Korwil can view but not edit" feature permissions to a future phase.

---

## 9. Program Schema

**Why this schema exists:** separates *what program a child is in and their eligibility status* from the child's core identity. In the legacy schema these were mixed into `ajis_anak` alongside name/address/school — meaning a status change (survey completed → approved → sponsorship matched) required updating the same wide row as identity data, with no audit trail for who changed what. This schema also supports the system eventually running more than one program (the PRD explicitly names this as a design goal), which the legacy single-program-assumed schema could not.

### 9.1 `program.program`

A named program (e.g., Anak Juara).

| Column | Type | Nullable | Default | Description |
|---|---|---|---|---|
| `program_id` | `BIGSERIAL` | NO (PK) | auto | Surrogate primary key. |
| `name` | `VARCHAR(150)` | NO | — | Program name. |
| `active` | `BOOLEAN` | NO | `TRUE` | Soft-delete flag. |
| `created_at` | `TIMESTAMP` | NO | `CURRENT_TIMESTAMP` | Row creation time. |
| `updated_at` | `TIMESTAMP` | NO | `CURRENT_TIMESTAMP` | Last modification time. |

**Business rules:** even though AJIS currently runs a single program, this table exists from day one so `child_enrollment` and `child_donor_pairing` can carry a `program_id` FK — adding a second program later is an `INSERT`, not a schema migration.

### 9.2 `program.child_enrollment`

**Purpose:** links a child to a program under a welfare category, with an enrollment date.

| Column | Type | Nullable | Default | Description |
|---|---|---|---|---|
| `enrollment_id` | `BIGSERIAL` | NO (PK) | auto | Surrogate primary key. |
| `child_id` | `BIGINT` | NO (FK) | — | The enrolled child. |
| `program_id` | `BIGINT` | NO (FK) | — | The program enrolled in. |
| `welfare_category_id` | `BIGINT` | NO (FK) | — | Zakat-eligibility classification at enrollment. |
| `enrollment_date` | `DATE` | NO | `CURRENT_DATE` | Date the enrollment took effect. |
| `active` | `BOOLEAN` | NO | `TRUE` | Soft-delete flag. |
| `created_at` | `TIMESTAMP` | NO | `CURRENT_TIMESTAMP` | Row creation time. |
| `updated_at` | `TIMESTAMP` | NO | `CURRENT_TIMESTAMP` | Last modification time. |

**Foreign keys:**
- `child_id → person.child(child_id) ON DELETE CASCADE`, `NOT NULL` — an enrollment record only exists because of the child.
- `program_id → program.program(program_id) ON DELETE RESTRICT`, `NOT NULL` — a program in active use cannot be deleted.
- `welfare_category_id → reference.welfare_category(welfare_category_id) ON DELETE RESTRICT`, `NOT NULL` — same reference-data protection as every other lookup FK.

**Indexes:** `ix_child_enrollment_child_id`, `ix_child_enrollment_program_id`, `ix_child_enrollment_welfare_category_id` — all three FK columns are individually indexed since each is queried independently in real reporting patterns ("children in program X," "children in welfare category Y," "enrollments for this child").

**Business rules:** `enrollment_date DEFAULT CURRENT_DATE` means the application does not have to explicitly pass today's date on a normal enrollment action, only on backdated/corrected entries.

---

## 10. Sponsorship Schema

**Why this schema exists:** the donor-to-child relationship — treated with the most caution in this design after finance itself, since it is the direct upstream link to financial records. Every foreign key in this schema is `RESTRICT`, never `CASCADE`, specifically so that deleting a child or a donor record can never silently ripple into and erase financial history.

### 10.1 `sponsorship.child_donor_pairing`

**Purpose:** links a child, a donor, and a program together for a sponsorship period.

| Column | Type | Nullable | Default | Description |
|---|---|---|---|---|
| `pairing_id` | `BIGSERIAL` | NO (PK) | auto | Surrogate primary key. |
| `child_id` | `BIGINT` | NO (FK) | — | The sponsored child. |
| `donor_id` | `BIGINT` | NO (FK) | — | The sponsoring donor. |
| `program_id` | `BIGINT` | NO (FK) | — | The program the sponsorship funds. |
| `pairing_date` | `DATE` | NO | `CURRENT_DATE` | Date the sponsorship began. |
| `end_date` | `DATE` | **YES** | — | Date the sponsorship ended; `NULL` means still active. |
| `active` | `BOOLEAN` | NO | `TRUE` | Soft-delete flag. |
| `created_at` | `TIMESTAMP` | NO | `CURRENT_TIMESTAMP` | Row creation time. |
| `updated_at` | `TIMESTAMP` | NO | `CURRENT_TIMESTAMP` | Last modification time. |

**Constraints:**
- `chk_pairing_dates CHECK (end_date IS NULL OR end_date >= pairing_date)` — an end date can never precede the start date.

**Foreign keys:** `child_id`, `donor_id`, and `program_id` are **all `NOT NULL` and `ON DELETE RESTRICT`**. This is the schema's central design decision: cascading a child or donor deletion into this table would ripple further into `finance.transaction` and erase financial audit history — an accounting-standards violation the source design treats as non-negotiable. A child or donor can only be *deactivated* (`active = false`); a hard delete is blocked by the database itself as long as any pairing (and, transitively, any transaction) exists.

**Indexes:** `ix_child_donor_pairing_child_id`, `ix_child_donor_pairing_donor_id`, `ix_child_donor_pairing_program_id` — all required both for the `RESTRICT` checks and for the direct query patterns ("this child's sponsorships," "this donor's sponsorships," "sponsorships funding this program").

**Business rules:** this table is the required upstream link for every row in `finance.transaction` — no donation or disbursement can be recorded without an existing pairing.

### 10.2 `sponsorship.pairing_balance_snapshot`

**Purpose:** a point-in-time closing balance for a pairing, taken once per semester — replaces the legacy pattern of storing a derived balance as a mutable column (which the normalization guide flags: "Balance is derived (should be view), not stored").

| Column | Type | Nullable | Default | Description |
|---|---|---|---|---|
| `snapshot_id` | `BIGSERIAL` | NO (PK) | auto | Surrogate primary key. |
| `pairing_id` | `BIGINT` | NO (FK) | — | The sponsorship this snapshot belongs to. |
| `semester_id` | `BIGINT` | NO (FK) | — | The semester this snapshot covers. |
| `closing_balance` | `NUMERIC(14,2)` | NO | — | Closing balance as of the snapshot date. |
| `snapshot_date` | `DATE` | NO | `CURRENT_DATE` | Date the snapshot was taken. |
| `created_at` | `TIMESTAMP` | NO | `CURRENT_TIMESTAMP` | Row creation time. |

**Constraints:** `uq_pairing_snapshot_per_semester UNIQUE (pairing_id, semester_id)` — exactly one snapshot per pairing per semester; the underlying business semantics ("snapshot tied to a specific semester") imply this uniqueness even where not spelled out as a named rule in the source documents.

**Foreign keys:** `pairing_id → sponsorship.child_donor_pairing(pairing_id) ON DELETE RESTRICT`, `NOT NULL`, and `semester_id → reference.semester(semester_id) ON DELETE RESTRICT`, `NOT NULL` — both protect reconciliation history from disappearing.

**Indexes:** `ix_pairing_balance_snapshot_pairing_id`, `ix_pairing_balance_snapshot_semester_id`.

**Business rules:** `closing_balance` is `NUMERIC(14,2)`, never floating point (§2.7) — a snapshot is a financial reconciliation artifact.

---

## 11. Activity Schema

**Why this schema exists:** the operational heart of AJIS. This is where the legacy system's worst 2NF violation lived: `ajis_pembinaan_baru` mixed one session's header data (date, type, material) with per-child attendance in the same denormalized row, repeating the session-level fields once per child in that session. This schema splits that into a session header (`coaching_session`) and a per-child detail table (`session_attendance`), plus the related habit-tracking and hafalan-assessment tables.

### 11.1 `activity.coaching_session`

**Purpose:** the session header — one row per coaching session, independent of how many children attended.

| Column | Type | Nullable | Default | Description |
|---|---|---|---|---|
| `session_id` | `BIGSERIAL` | NO (PK) | auto | Surrogate primary key. |
| `location_id` | `BIGINT` | NO (FK) | — | The coaching region hosting the session. |
| `presenter_id` | `BIGINT` | NO (FK) | — | The coordinator who presented the session. |
| `session_type_id` | `BIGINT` | NO (FK) | — | The session category (Reguler, Edukasi Pekanan, P3A, Parenting). |
| `session_date` | `DATE` | NO | — | Date the session occurred. |
| `created_at` | `TIMESTAMP` | NO | `CURRENT_TIMESTAMP` | Row creation time. |
| `updated_at` | `TIMESTAMP` | NO | `CURRENT_TIMESTAMP` | Last modification time. |

**Foreign keys:** `location_id → organization.coaching_region(region_id)`, `presenter_id → person.coordinator(coordinator_id)`, and `session_type_id → reference.session_type(session_type_id)` — **all three `NOT NULL` and `RESTRICT`**. Every one is a "preserve the historical record" case: who presented, where, and what type of session it was must remain queryable even if the region is later reorganized, the coordinator deactivated, or the session type retired.

**Indexes:** `ix_coaching_session_location_id`, `ix_coaching_session_presenter_id`, `ix_coaching_session_session_type_id` — all three FK indexes double as the primary reporting dimensions ("sessions by region," "sessions by presenter," "sessions by type"), matching the PRD's stated composite-index need ("region + office on children; child + session + date on coaching-session detail").

**Business rules:** this table alone answers "how many sessions has this region run this month," without touching attendance data — a query the legacy denormalized table could only answer by scanning and de-duplicating thousands of per-child rows.

### 11.2 `activity.session_attendance`

**Purpose:** the per-child detail half of the session split — one row per child per session.

| Column | Type | Nullable | Default | Description |
|---|---|---|---|---|
| `attendance_id` | `BIGSERIAL` | NO (PK) | auto | Surrogate primary key. |
| `session_id` | `BIGINT` | NO (FK) | — | The session this attendance belongs to. |
| `child_id` | `BIGINT` | NO (FK) | — | The child whose attendance this records. |
| `attendance_status_id` | `BIGINT` | NO (FK) | — | Hadir/Izin/Alfa. |
| `child_snapshot` | `JSONB` | YES | — | Point-in-time copy of relevant child attributes at the moment of attendance. |
| `created_at` | `TIMESTAMP` | NO | `CURRENT_TIMESTAMP` | Row creation time. |

**Constraints:** `uq_attendance_per_child_per_session UNIQUE (session_id, child_id)` — prevents a duplicate attendance submission from double-counting a child's presence at the same session; this is a direct anti-corruption guard the legacy schema had no mechanism to enforce.

**Foreign keys:**
- `session_id → activity.coaching_session(session_id) ON DELETE CASCADE`, `NOT NULL` — an attendance row only exists because of its session.
- `child_id → person.child(child_id) ON DELETE CASCADE`, `NOT NULL` — same reasoning, from the child side.
- `attendance_status_id → reference.attendance_status(attendance_status_id) ON DELETE RESTRICT`, `NOT NULL` — preserve exactly what status was recorded, even if the lookup value is later deactivated.

**Why `child_snapshot JSONB`:** historical attendance reports should not change retroactively just because a child's profile was edited later. `child_snapshot` stores a point-in-time copy of relevant attributes (e.g., name, region) as they were at the moment of attendance, so a report generated for a past date reflects what was true *then*. `JSONB` (binary-stored, indexable) is used rather than plain `JSON` because the read-heavy "what did this child's record look like on this date" query pattern benefits from indexed key lookups, not just whole-document retrieval.

**Indexes:**
- `ix_session_attendance_session_id`, `ix_session_attendance_child_id`, `ix_session_attendance_attendance_status_id` — standard FK indexes; `child_id` in particular is the leading dimension for "this child's attendance history," one of the most common queries in the Regional Dashboard child profile view.
- `ix_session_attendance_child_snapshot_gin USING GIN (child_snapshot)` — a `GIN` index supports querying inside the JSONB document (e.g., `child_snapshot->>'name' = ?`) without a full table scan. `GIN` is chosen over `B-tree` specifically because the access pattern is "does this row's JSON contain X," which is what an inverted index is built for (see §15.1).

**Business rules:** this table is a very large, high-write table at scale (potentially millions of rows across children × sessions) — its indexing is deliberately minimal (three FK B-trees plus one GIN) to keep write amplification manageable; see §16.

### 11.3 `activity.session_habit_tracking`

**Purpose:** per-attendance "Mandiri" (independence habit) rows — prayer, recitation, charity, and similar habit indicators tracked per child per session.

| Column | Type | Nullable | Default | Description |
|---|---|---|---|---|
| `habit_id` | `BIGSERIAL` | NO (PK) | auto | Surrogate primary key. |
| `attendance_id` | `BIGINT` | NO (FK) | — | The attendance record this habit entry belongs to. |
| `habit_type` | `VARCHAR(100)` | NO | — | The habit being tracked (e.g., prayer, recitation, charity). |
| `status` | `VARCHAR(30)` | NO | — | Completion state. |
| `created_at` | `TIMESTAMP` | NO | `CURRENT_TIMESTAMP` | Row creation time. |

**Constraints:** `chk_habit_status CHECK (status IN ('completed','partial','not_completed'))` — a `VARCHAR`+`CHECK` enum, mirroring the three-state shape used for `hafalan_assessment.status` (§11.5) for consistency across similarly-structured tracking fields.

**Foreign key:** `attendance_id → activity.session_attendance(attendance_id) ON DELETE CASCADE`, `NOT NULL` — a habit-tracking row is detail data of an attendance record and has no independent meaning.

**Index:** `ix_session_habit_tracking_attendance_id (attendance_id)`.

**Business rules:** a child can have multiple habit rows per attendance (one per habit type tracked), unlike attendance itself, which is exactly one row per child per session.

### 11.4 `activity.hafalan_item_lookup`

**Purpose:** master list of memorization items (Qur'an surah, prayer, du'a).

| Column | Type | Nullable | Default | Description |
|---|---|---|---|---|
| `item_id` | `BIGSERIAL` | NO (PK) | auto | Surrogate primary key. |
| `name` | `VARCHAR(150)` | NO | — | Item name (surah/prayer/du'a). |
| `category` | `VARCHAR(50)` | NO | — | Item category. |
| `active` | `BOOLEAN` | NO | `TRUE` | Soft-delete flag. |
| `created_at` | `TIMESTAMP` | NO | `CURRENT_TIMESTAMP` | Row creation time. |
| `updated_at` | `TIMESTAMP` | NO | `CURRENT_TIMESTAMP` | Last modification time. |

**Business rules:** a hafalan item is never hard-deleted once assessed — see §11.5.

### 11.5 `activity.hafalan_assessment`

**Purpose:** one assessment row per child per memorization item, tracking Qur'an memorization and religious-practice progress.

| Column | Type | Nullable | Default | Description |
|---|---|---|---|---|
| `assessment_id` | `BIGSERIAL` | NO (PK) | auto | Surrogate primary key. |
| `item_id` | `BIGINT` | NO (FK) | — | The memorization item being assessed. |
| `child_id` | `BIGINT` | NO (FK) | — | The child being assessed. |
| `assessor_id` | `BIGINT` | NO (FK) | — | The coordinator who performed the assessment. |
| `status` | `VARCHAR(30)` | NO | — | Assessment result. |
| `assessed_date` | `DATE` | YES | — | Date of assessment. |
| `created_at` | `TIMESTAMP` | NO | `CURRENT_TIMESTAMP` | Row creation time. |
| `updated_at` | `TIMESTAMP` | NO | `CURRENT_TIMESTAMP` | Last modification time. |

**Constraints:**
- `chk_hafalan_status CHECK (status IN ('completed','partial','not_started'))`.
- `uq_hafalan_assessment_per_child_item UNIQUE (child_id, item_id)` — one assessment row per child per item, updated in place as progress changes, rather than one row per attempt. **This is an explicit modeling choice, flagged for confirmation** (see §18): if AJIS actually needs a full history of re-assessments over time rather than the latest status only, this constraint should be dropped in favor of an `assessed_at TIMESTAMP` versioning column instead.

**Foreign keys:**
- `item_id → activity.hafalan_item_lookup(item_id) ON DELETE RESTRICT`, `NOT NULL` — preserves historical item definitions even if a memorization item is later retired from the active curriculum.
- `child_id → person.child(child_id) ON DELETE CASCADE`, `NOT NULL` — assessments only exist because of the child.
- `assessor_id → person.coordinator(coordinator_id) ON DELETE RESTRICT`, `NOT NULL` — preserves who performed the assessment (audit trail).

**Indexes:** `ix_hafalan_assessment_item_id`, `ix_hafalan_assessment_child_id`, `ix_hafalan_assessment_assessor_id` — `child_id` is the leading dimension for the child-profile "Hafalan" tab described in the PRD (per-category progress indicators).

---

## 12. Evaluation Schema

**Why this schema exists:** semester report cards (Penilaian / Laporan Semester), generated from activity and hafalan data and refined by coordinators. Replaces the legacy `ajis_penilaian` table's free-text item names with a proper lookup table plus a clean separation of the evaluation header from its per-item scores.

### 12.1 `evaluation.evaluation_item`

**Purpose:** master list of evaluation aspects (e.g., Akhlak, Prestasi Akademik).

| Column | Type | Nullable | Default | Description |
|---|---|---|---|---|
| `item_id` | `BIGSERIAL` | NO (PK) | auto | Surrogate primary key. |
| `name` | `VARCHAR(150)` | NO | — | Evaluation aspect name. |
| `category` | `VARCHAR(50)` | YES | — | Optional grouping category. |
| `active` | `BOOLEAN` | NO | `TRUE` | Soft-delete flag. |
| `created_at` | `TIMESTAMP` | NO | `CURRENT_TIMESTAMP` | Row creation time. |
| `updated_at` | `TIMESTAMP` | NO | `CURRENT_TIMESTAMP` | Last modification time. |

### 12.2 `evaluation.semester_evaluation`

**Purpose:** one evaluation header per child per semester.

| Column | Type | Nullable | Default | Description |
|---|---|---|---|---|
| `evaluation_id` | `BIGSERIAL` | NO (PK) | auto | Surrogate primary key. |
| `child_id` | `BIGINT` | NO (FK) | — | The child being evaluated. |
| `semester_id` | `BIGINT` | NO (FK) | — | The semester this evaluation covers. |
| `evaluator_id` | `BIGINT` | NO (FK) | — | The coordinator who performed the evaluation. |
| `approver_id` | `BIGINT` | **YES** (FK) | — | The coordinator who approved the evaluation, if approved. |
| `created_at` | `TIMESTAMP` | NO | `CURRENT_TIMESTAMP` | Row creation time. |
| `updated_at` | `TIMESTAMP` | NO | `CURRENT_TIMESTAMP` | Last modification time. |

**Constraints:** `uq_evaluation_per_child_per_semester UNIQUE (child_id, semester_id)` — exactly one evaluation per child per semester; regenerating/syncing an evaluation updates the existing row rather than creating a duplicate.

**Foreign keys:**
- `child_id → person.child(child_id) ON DELETE CASCADE`, `NOT NULL` — the evaluation only exists because of the child.
- `semester_id → reference.semester(semester_id) ON DELETE RESTRICT`, `NOT NULL` — historical semesters cannot be deleted while evaluations reference them.
- `evaluator_id → person.coordinator(coordinator_id) ON DELETE RESTRICT`, `NOT NULL` — preserves who evaluated (audit trail).
- `approver_id → person.coordinator(coordinator_id) ON DELETE RESTRICT`, **nullable**. Nullable because approval is optional/pending until it happens; `RESTRICT` (deliberately **not** `SET NULL`) once set, because setting it to `NULL` on coordinator deletion would erase the record of who approved a report — an unacceptable loss of audit history even though the column itself is optional before approval occurs.

**Indexes:** `ix_semester_evaluation_semester_id`, `ix_semester_evaluation_evaluator_id`, `ix_semester_evaluation_approver_id` (plus the child-facing lookup covered by the leading column of `uq_evaluation_per_child_per_semester`).

**Business rules:** this table is the header for the Laporan Semester (semester report), combining "Aspek Cerdas" and "Aspek Mandiri" data with coach notes and "Suara Anak Juara" (child's voice) content described in the PRD — those free-text fields belong on this header row once the full column list is confirmed (see §18).

### 12.3 `evaluation.evaluation_item_score`

**Purpose:** per-item scores within an evaluation.

| Column | Type | Nullable | Default | Description |
|---|---|---|---|---|
| `score_id` | `BIGSERIAL` | NO (PK) | auto | Surrogate primary key. |
| `evaluation_id` | `BIGINT` | NO (FK) | — | The evaluation this score belongs to. |
| `item_id` | `BIGINT` | NO (FK) | — | The evaluation item being scored. |
| `score` | `NUMERIC(5,2)` | NO | — | The numeric score. |
| `created_at` | `TIMESTAMP` | NO | `CURRENT_TIMESTAMP` | Row creation time. |

**Constraints:**
- `uq_score_per_evaluation_per_item UNIQUE (evaluation_id, item_id)` — one score per item per evaluation.
- `chk_score_range CHECK (score >= 0 AND score <= 100)` — a 0–100 bound. This is an inferred, reasonable addition rather than an explicitly stated requirement; the actual grading scale should be confirmed before this bound is finalized (see §18).

**Foreign keys:**
- `evaluation_id → evaluation.semester_evaluation(evaluation_id) ON DELETE CASCADE`, `NOT NULL` — a score is detail data of its evaluation.
- `item_id → evaluation.evaluation_item(item_id) ON DELETE RESTRICT`, `NOT NULL` — preserves historical item definitions.

**Index:** `ix_evaluation_item_score_item_id (item_id)`.

---

## 13. Finance Schema

**Why this schema exists, and why it is the most tightly guarded schema in the whole design:** no cascades, no physical deletes, ever. This directly resolves the legacy system's most serious integrity risk — `ajis_input_donasi` and `ajis_penyaluran` stored denormalized child/donor/pairing snapshots with no enforced foreign key back to a canonical sponsorship record, meaning financial rows could reference a relationship that no longer existed (or never existed correctly).

### 13.1 `finance.transaction`

**Purpose:** a single donation, disbursement, or adjustment tied to a sponsorship pairing.

| Column | Type | Nullable | Default | Description |
|---|---|---|---|---|
| `transaction_id` | `BIGSERIAL` | NO (PK) | auto | Surrogate primary key. |
| `pairing_id` | `BIGINT` | NO (FK) | — | The sponsorship this transaction belongs to. |
| `transaction_type` | `VARCHAR(20)` | NO | — | donation / disbursement / adjustment. |
| `amount` | `NUMERIC(14,2)` | NO | — | Transaction amount. |
| `transaction_date` | `DATE` | NO | `CURRENT_DATE` | Date the transaction occurred. |
| `created_at` | `TIMESTAMP` | NO | `CURRENT_TIMESTAMP` | Row creation time. |

**No `updated_at` column — deliberately.** Financial transaction rows are meant to be application-level immutable: a transaction is corrected by inserting an offsetting `adjustment` row, never by mutating an existing row in place. Adding `updated_at` would imply the row is expected to change after creation, which contradicts the immutability the finance schema is built around. (Enforcing this immutability at the database level — e.g., `REVOKE UPDATE, DELETE ... FROM app_role`, or a `BEFORE UPDATE OR DELETE` trigger that raises an exception — is a permissions/trigger decision one layer below this schema specification, and is called out here as the recommended next step when migrations are built.)

**Constraints:**
- `chk_transaction_type CHECK (transaction_type IN ('donation','disbursement','adjustment'))` — this is the other field explicitly required to be converted from `ENUM` to `VARCHAR` + `CHECK` (§2.2). Values are kept identical to the source design.
- `chk_transaction_amount_positive CHECK (amount > 0)` — a transaction of zero or negative amount is treated as a data error; the three transaction types are modeled as distinct categories (not signed debits/credits), so a "reversal" is represented by an `adjustment`-type row with a positive amount, not a negative `donation`. **This assumption is flagged for confirmation** (see §18) — if `adjustment` rows are meant to allow negative amounts, this `CHECK` should be scoped per-type or dropped.

**Foreign key:** `pairing_id → sponsorship.child_donor_pairing(pairing_id) ON DELETE RESTRICT`, `NOT NULL` — the single most emphatic rule in this entire design. Cascading here would be an accounting-standards violation; no alternative delete rule was considered acceptable at any point in the source analysis.

**Index:**
- `ix_transaction_pairing_id (pairing_id)` — required for the `RESTRICT` check and for "all transactions for this sponsorship."
- `ix_transaction_type (transaction_type)` — supports filtering/reporting by transaction type (e.g., "all disbursements this month").

**Business rules:** every transaction must trace back through a `pairing_id` to a `child_id` and `donor_id` — there is no path in this schema for a "free-floating" financial row disconnected from a sponsorship relationship, which is the exact gap the legacy system had.

---

## 14. Cross-Schema Foreign Key Matrix

A consolidated view of every foreign key in the schema, its nullability, delete rule, and the reasoning category it falls into. This complements the per-table explanations above with a single at-a-glance reference.

| Child Table.Column | Parent Table | Nullable | Delete Rule | Reasoning Category |
|---|---|---|---|---|
| `district.province_id` | `province` | NO | RESTRICT | Immutable geography |
| `subdistrict.district_id` | `district` | NO | RESTRICT | Immutable geography |
| `village.subdistrict_id` | `subdistrict` | NO | RESTRICT | Immutable geography |
| `location.village_id` | `village` | YES | RESTRICT | Immutable geography, incomplete address allowed |
| `office.parent_office_id` | `office` (self) | YES | RESTRICT | Org hierarchy, prevent branch-wide cascade |
| `coaching_region.office_id` | `office` | NO | RESTRICT | Org structure |
| `facility.office_id` | `office` | NO | RESTRICT | Org structure |
| `family_member.child_id` | `child` | NO | CASCADE | Dependent data |
| `household_member.child_id` | `child` | NO | CASCADE | Dependent data |
| `child_education.child_id` | `child` | NO | CASCADE | Dependent data |
| `child_education.school_id` | `facility` | NO | RESTRICT | Preserve historical enrollment reference |
| `coordinator.office_id` | `office` | YES | RESTRICT | Optional org attachment |
| `system_user.coordinator_id` | `coordinator` | YES, UNIQUE | SET NULL | Optional 1:1, preserve login history |
| `system_user.donor_id` | `donor` | YES, UNIQUE | SET NULL | Optional 1:1, preserve login history |
| `system_user.role_id` | `role` | NO | RESTRICT | Reference protection |
| `role_permission.role_id` | `role` | NO | CASCADE | Grant is an attribute of the role |
| `role_permission.permission_id` | `permission` | NO | RESTRICT | Reference protection |
| `child_enrollment.child_id` | `child` | NO | CASCADE | Dependent data |
| `child_enrollment.program_id` | `program` | NO | RESTRICT | Reference protection |
| `child_enrollment.welfare_category_id` | `welfare_category` | NO | RESTRICT | Reference protection |
| `child_donor_pairing.child_id` | `child` | NO | RESTRICT | **Financial audit protection** |
| `child_donor_pairing.donor_id` | `donor` | NO | RESTRICT | **Financial audit protection** |
| `child_donor_pairing.program_id` | `program` | NO | RESTRICT | Reference protection |
| `pairing_balance_snapshot.pairing_id` | `child_donor_pairing` | NO | RESTRICT | Reconciliation audit protection |
| `pairing_balance_snapshot.semester_id` | `semester` | NO | RESTRICT | Reference protection |
| `coaching_session.location_id` | `coaching_region` | NO | RESTRICT | Historical record protection |
| `coaching_session.presenter_id` | `coordinator` | NO | RESTRICT | Audit trail |
| `coaching_session.session_type_id` | `session_type` | NO | RESTRICT | Reference protection |
| `session_attendance.session_id` | `coaching_session` | NO | CASCADE | Dependent data |
| `session_attendance.child_id` | `child` | NO | CASCADE | Dependent data |
| `session_attendance.attendance_status_id` | `attendance_status` | NO | RESTRICT | Historical record protection |
| `session_habit_tracking.attendance_id` | `session_attendance` | NO | CASCADE | Dependent data |
| `hafalan_assessment.item_id` | `hafalan_item_lookup` | NO | RESTRICT | Historical item definition protection |
| `hafalan_assessment.child_id` | `child` | NO | CASCADE | Dependent data |
| `hafalan_assessment.assessor_id` | `coordinator` | NO | RESTRICT | Audit trail |
| `semester_evaluation.child_id` | `child` | NO | CASCADE | Dependent data |
| `semester_evaluation.semester_id` | `semester` | NO | RESTRICT | Reference protection |
| `semester_evaluation.evaluator_id` | `coordinator` | NO | RESTRICT | Audit trail |
| `semester_evaluation.approver_id` | `coordinator` | YES | RESTRICT | Audit trail, approval optional but never erased |
| `evaluation_item_score.evaluation_id` | `semester_evaluation` | NO | CASCADE | Dependent data |
| `evaluation_item_score.item_id` | `evaluation_item` | NO | RESTRICT | Historical item definition protection |
| `transaction.pairing_id` | `child_donor_pairing` | NO | RESTRICT | **Financial audit protection — non-negotiable** |

**Key principles reflected throughout this matrix:**
1. **Preserve audit trails** — financial transactions, user actions, and historical records are `RESTRICT`.
2. **Prefer soft delete operationally** — `active = false` is the everyday path; the FK constraint is the safety net if a hard delete is attempted anyway.
3. **Cascade only for genuinely dependent data** — rows that cannot exist meaningfully without their parent (`family_member`, `session_attendance`, `evaluation_item_score`).
4. **Protect reference data** — geography, lookup tables, and item definitions are `RESTRICT` everywhere.
5. **Nullable + `SET NULL` only where the child row remains meaningful without the parent** — `system_user.coordinator_id`/`donor_id` are the only `SET NULL` relationships in the entire schema.
6. **Self-referencing hierarchies stay `RESTRICT`** — `office.parent_office_id`, to prevent an entire branch network disappearing in one cascade.

---

## 15. Indexing Strategy

### 15.1 Index Types Used, and Why Each Was Chosen

| Type | Used for | Why |
|---|---|---|
| **B-Tree** (default) | Every FK column, every `PRIMARY KEY`, every `UNIQUE` constraint | Supports equality, range (`BETWEEN`, prefix `LIKE`), and `ORDER BY`/`GROUP BY` at O(log N); this is the workhorse index type across the entire schema, since almost every real AJIS query is an FK lookup or an equality filter |
| **Composite B-Tree** | `(child_id, effective_from, effective_to)` on `child_education`; `(office_id, full_name) WHERE active = TRUE` on `coordinator`; similar multi-column filter+sort patterns | A single index on multiple columns, evaluated left-to-right (leftmost-prefix rule), is more efficient than several single-column indexes when the same column combination is filtered/sorted together repeatedly, and can enable index-only scans |
| **Unique** | Every `UNIQUE` constraint (`uq_*`) | Enforces a business uniqueness rule (one evaluation per child per semester, one attendance row per child per session, one code per lookup table) at the database level, not just in application code, and doubles as a fast equality-lookup index |
| **Partial** | `ix_child_name_active`, `ix_household_member_child_current`, `ix_system_user_coordinator_id`/`donor_id` | Indexes only the rows matching a `WHERE` condition — dramatically smaller and faster than a full index when the filtered condition (e.g., `active = TRUE`, `effective_to IS NULL`, `coordinator_id IS NOT NULL`) excludes a large, predictable share of rows |
| **GIN** | `ix_session_attendance_child_snapshot_gin` on the `JSONB` `child_snapshot` column | An inverted index mapping values *to* the rows containing them — the right structure for "does this JSON document contain X," which a B-tree cannot answer efficiently |

### 15.2 Why Every Foreign Key Is Explicitly Indexed

PostgreSQL automatically indexes primary keys and `UNIQUE`-constrained columns, but **does not** automatically index plain foreign key columns. This schema explicitly indexes every FK for two compounding reasons:

1. **Delete-integrity checks require it.** Every `ON DELETE RESTRICT` or `ON DELETE CASCADE` requires PostgreSQL to scan the *child* table for rows matching the parent key being deleted. Without an index, this is a full table scan — on a table with millions of rows (`session_attendance`, `transaction`), this turns a routine delete-integrity check into a multi-second (or worse) operation.
2. **It's also the query index.** Nearly every real query pattern implied by the PRD's modules is a lookup by foreign key: sessions by region, attendance by child, transactions by pairing, evaluations by semester. The FK index and the reporting index are almost always the same index — there is very little "pure FK-integrity-only" indexing overhead in this schema, because the same index earns its keep on the read side too.

### 15.3 Composite, Unique, and Partial Indexes — Called Out Per-Table

Beyond the baseline FK index, additional indexes are added exactly where the schema implies a business uniqueness rule or a common filtered query pattern — not speculatively:

- **Business uniqueness:** `(session_id, child_id)` on `session_attendance`, `(child_id, item_id)` on `hafalan_assessment`, `(child_id, semester_id)` on `semester_evaluation`, `(evaluation_id, item_id)` on `evaluation_item_score`, `(pairing_id, semester_id)` on `pairing_balance_snapshot`, `(year, term)` on `semester`. Each of these enforces a "one of X per Y" rule the business logic depends on.
- **Soft-delete filtering:** `active = TRUE` is the single most common `WHERE` clause across this schema (nearly every dashboard list view filters out deactivated records). Partial indexes on `active`-filtered lookups (child name search, coordinator search, donor search, office hierarchy traversal) keep those indexes a fraction of the size of a full-table index once a meaningful share of rows are soft-deleted.
- **Temporal "current" filtering:** `effective_to IS NULL` on `household_member` (and the same pattern would apply to any future temporal table modeled after `child_education`) — a partial index scoped to "still current" rows serves the dominant query pattern without indexing closed historical rows.

### 15.4 Search Optimization

Name-based search (`full_name ILIKE 'Arif%'` prefix search on `child`, `coordinator`, `donor`) is served by a B-tree partial index (`WHERE active = TRUE`) on `full_name`. This supports **prefix** matches efficiently (`ILIKE 'Arif%'`) but does **not** accelerate **substring** matches (`ILIKE '%Arif%'`) — a substring search still requires scanning the whole index. If free-text/substring child-name search becomes a first-class product requirement at scale, a `pg_trgm` trigram GIN index is the recommended addition at that time; it is not included by default here since it carries meaningfully higher write and storage cost than a B-tree and should be added only if the query pattern actually demands it.

### 15.5 Pagination Strategy

List views (children, sessions, transactions) use **keyset (seek-based) pagination** — `WHERE child_id > :last_seen_id ORDER BY child_id LIMIT :page_size` — rather than `OFFSET`-based pagination. This is a direct consequence of the `BIGSERIAL` primary key strategy (§2.1): a monotonically increasing integer key makes seek-based pagination a simple, indexed range query, with no performance cliff at deep page numbers the way `OFFSET 100000` has on a large table. No dedicated index is required beyond the primary key itself.

### 15.6 Index Footprint Summary

| Schema | Tables | Approx. Index Count | Primary Optimization Target |
|---|---|---|---|
| geography | 5 | 4 | FK checks, hierarchical traversal |
| organization | 3 | 5 | Self-referencing hierarchy, active-partial filtering |
| person | 6 | 15 | FK checks, name search, uniqueness (username, 1:1 links) |
| reference | 5 | 8 | Unique codes, semester date range |
| access_control | 2 | 2 | Composite PK, reverse permission lookup |
| program | 2 | 5 | Enrollment reporting dimensions |
| sponsorship | 2 | 8 | FK checks, RESTRICT protection, reconciliation uniqueness |
| activity | 5 | 14 | High-volume FK checks, JSONB GIN, uniqueness guards |
| evaluation | 3 | 8 | High-volume scoring, per-child-per-semester uniqueness |
| finance | 1 | 5 | RESTRICT checks, type filtering |
| **Total** | **34** | **~74** | Mixed B-tree/GIN/partial strategy |

This index count is deliberately front-loaded toward the tables the PRD identifies as highest-volume (`session_attendance`, `evaluation_item_score`, `transaction` — potentially millions of rows each at scale) while keeping small, stable reference tables (geography, reference, access_control) minimally indexed, since their read/write ratio and row counts don't justify more.

---

## 16. Scalability Considerations for Millions of Records

The PRD's stated performance targets — API list responses under 300ms at p95, and an indexing/query design scaled for millions of rows across children, sessions, and evaluation tables — shape several decisions throughout this schema, summarized here:

1. **Sequential `BIGSERIAL` keys keep indexes compact at scale.** Because insert order and key order match, B-tree indexes on primary keys stay well-packed rather than fragmenting the way random `UUID` keys would; this directly benefits the largest tables (`session_attendance`, `transaction`) where index bloat would otherwise compound fastest.

2. **The session-header/attendance-detail split bounds row growth predictably.** Splitting `coaching_session` (one row per session) from `session_attendance` (one row per child per session) means the header table grows with the *number of sessions*, while only the detail table grows with *sessions × average attendance* — this is the same normalization principle that eliminated the legacy system's repeated per-child session-level data, and it also means indexes on session-level attributes (region, presenter, type) stay on a much smaller table than the full attendance volume.

3. **Partial indexes shrink the working index set for the dominant filter.** Since `active = TRUE` (or `effective_to IS NULL`) is the overwhelming majority of real query traffic, and soft-deleted/historical rows accumulate over time, partial indexes keep the *actively queried* index footprint from growing at the same rate as total row count — at scale, this is the difference between an index sized to "all rows ever created" versus "rows anyone actually looks up."

4. **Keyset pagination avoids the `OFFSET` performance cliff.** List views paginate by `WHERE id > :cursor LIMIT :n` rather than `OFFSET :n`, so page 1 and page 10,000 cost the same — a `BIGSERIAL`-keyed table makes this the natural pagination strategy rather than a workaround.

5. **`RESTRICT` on high-fan-out reference tables keeps delete-check scans bounded and index-served.** Every FK that could otherwise trigger a full-table scan on delete (geography hierarchy, lookup tables, coordinator/donor references) is backed by an explicit B-tree index, so a `RESTRICT` check is an indexed lookup, not a sequential scan, regardless of how large the child table grows.

6. **`JSONB` + `GIN` on `child_snapshot` avoids re-joining historical data at report time.** Storing a point-in-time snapshot rather than re-deriving "what did this child's profile look like on this date" via joins at query time avoids repeated expensive joins across a large historical table; the `GIN` index keeps the snapshot itself queryable without a full scan.

7. **Composite indexes matched to real query shape, not speculative coverage.** Every composite index in this design (temporal range lookups, uniqueness-per-parent, filtered name search) traces to a concrete query pattern named in the source PRD/indexing analysis, rather than being added preemptively — at millions-of-rows scale, an unused index is pure write-amplification cost with no offsetting read benefit, so this schema deliberately avoids over-indexing tables like `finance.transaction` beyond what the RESTRICT checks and reporting dimensions actually require.

8. **Routine maintenance is assumed, not optional, at this scale.** `VACUUM`/`ANALYZE`/periodic `REINDEX` and query-plan monitoring are operational requirements once tables reach millions of rows — this schema is designed to be maintenance-friendly (sequential keys, partial indexes that shrink with soft-deletes) but does not eliminate the need for a maintenance runbook.

9. **Money columns are fixed-precision `NUMERIC`, which does not degrade at scale but does carry a per-row storage cost.** This is an intentional trade: `NUMERIC(14,2)` is slightly larger and slower to compute on than `FLOAT`, but the correctness guarantee is non-negotiable for financial data regardless of table size.

---

## 17. Future Extensibility

This schema is designed so that the capabilities explicitly deferred in the PRD (§12, Future Development) can be added without breaking the existing structure:

- **Parent/guardian self-service portal.** `person.family_member` already models guardians as distinct rows; a future portal account would extend `person.system_user` with a `family_member_id` FK following the exact same nullable+`UNIQUE`+`SET NULL` pattern already used for `coordinator_id` and `donor_id` — no change to the existing three columns is required.
- **Push notifications for overdue evaluations.** A future `notification` table can key off `evaluation.semester_evaluation` (missing/overdue = no row exists for an enrolled child in the current semester) without any change to the evaluation schema itself.
- **PDF export of semester reports.** Purely a rendering-layer concern; `evaluation.semester_evaluation` and `evaluation.evaluation_item_score` already hold all the structured data a PDF template would need.
- **Full CAJ (candidate-child intake) and PM (beneficiary program status) workflows.** These extend `program.child_enrollment`'s status model — additional enrollment-status lookup values are `INSERT`s into `reference`-style tables, not schema migrations, consistent with the `VARCHAR`+`CHECK`/lookup-table philosophy applied everywhere else.
- **Materi, Prestasi, and Dokumentasi modules.** Each maps naturally to a new table in an existing schema (`activity.materi`, a new `achievement` concept in `evaluation` or a new schema, `activity.documentation` with object-storage URLs) — the ten-schema namespace structure has room for each without renaming or restructuring existing tables.
- **Online donation payment processing.** `finance.transaction` already models `donation` as a transaction type tied to a `child_donor_pairing`; a payment gateway integration would populate this existing table (plus a new `payment_gateway_reference` column or side table) rather than requiring a new financial model.
- **Feature-level (not just row-level) permissions.** `access_control.permission` and `role_permission` already exist as the extension point — finer-grained permissions (e.g., "Korwil can view but not edit") are additional `permission` rows and `role_permission` grants, not a schema change.
- **Donor self-service portal.** Symmetric to the parent/guardian portal — `person.donor` already has the optional `system_user.donor_id` link in place; a donor-facing "track my sponsored children" view is a read-scoped query against `sponsorship.child_donor_pairing`, which already exists.
- **Multi-program support.** Already built in from Phase 1 — `program.program`, `child_enrollment.program_id`, and `child_donor_pairing.program_id` mean a second program is a data row, not a migration.
- **Public-facing non-sequential identifiers**, if donor or child IDs are ever exposed externally (a receipt number, a public URL) — add a `*_public_code VARCHAR UNIQUE` display column per table as needed (§2.1), without changing the internal `BIGSERIAL` primary key strategy.

---

## 18. Open Items to Confirm Before Migration

These are not gaps in this specification's conversion logic — they are gaps in the underlying source analysis (a relationship/architecture design, not an exhaustive column catalog) that should be resolved before a physical migration script is written:

1. **Full column lists** for `child`, `coordinator`, `donor`, `program`, `office`, `facility`, `evaluation_item`, and `hafalan_item_lookup`. The source documents name these tables and their foreign keys precisely, but do not enumerate every business attribute column (address, contact info, date of birth, NIK, etc. for `child`, for example). Only FK/PK/soft-delete/audit columns are populated in this specification; the real field list needs to be confirmed against the actual application requirements.
2. **The `is_system_account` substitution** on `system_user` (§6.7) — confirm this correctly captures the intended "admin/system" carve-out, since it replaces a cross-table `CHECK` that PostgreSQL cannot enforce declaratively.
3. **Value vocabularies for every `CHECK`-constrained `VARCHAR`** (`transaction_type`, `education_level`, `session_habit_tracking.status`, `hafalan_assessment.status`, `family_member.relationship`) — several were inferred from narrative examples in the source documents rather than stated as an exhaustive list; in particular, the Indonesian education-level vocabulary may need `smk` in addition to `sd`/`smp`/`sma`/`other`.
4. **One-row-per-child-per-item on `hafalan_assessment`** (§11.5) — confirm whether re-assessment history should overwrite the existing row (current design) or version every attempt (would require dropping `uq_hafalan_assessment_per_child_item` in favor of a timestamp-based history model).
5. **The 0–100 bound on `evaluation_item_score.score`** (§12.3) — confirm this matches the actual grading scale used in Laporan Semester reporting.
6. **Whether `finance.transaction.amount` needs signed values for `adjustment`-type rows** (§13.1), or whether all adjustments are represented as positive-amount rows with the sign/direction implied by business logic elsewhere.
7. **Whether a queryable `deleted_at` timestamp is needed on any specific table** beyond the `active` flag pattern (§2.5) — no such requirement was identified in the source documents, but this should be explicitly confirmed rather than assumed absent.

None of these block the architecture presented in this specification — they are the specific points where "explain every decision" means naming an assumption rather than treating it as settled fact.

---

**End of Database Specification — no SQL migration included, per instructions.**
