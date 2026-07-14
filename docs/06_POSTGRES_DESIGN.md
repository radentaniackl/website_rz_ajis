# AJIS PostgreSQL Architecture Design
## Converted from Foreign Key Relationship Design (Conceptual → Physical Schema)

**Status:** Architecture / schema specification only — **no migration scripts generated**, per request.
**Source:** `AJIS_Foreign_Key_Relationship_Design_(05).md`
**Date:** July 14, 2026

---

## 0. GLOBAL DESIGN DECISIONS

Before the table-by-table design, here are the conversion rules applied everywhere, and why.

### 0.1 `BIGSERIAL` instead of `UUID`

Every primary key becomes `BIGSERIAL PRIMARY KEY` (a `BIGINT` backed by an auto-incrementing sequence), and every FK becomes `BIGINT`.

**Why this is a reasonable optimization for PostgreSQL:**
- **Index size & speed:** `BIGINT` is 8 bytes with sequential, monotonically increasing values. B-tree indexes on sequential integers stay well-packed and cache-friendly. `UUID` (16 bytes, random by default) causes index page splits and bloat, and defeats index-only scans more often.
- **Join performance:** FK joins on `BIGINT` are cheaper (integer comparison vs. 16-byte comparison) — this matters here because the schema is deeply hierarchical (province → district → subdistrict → village → location; office → office) with many multi-level joins.
- **Storage:** `BIGINT` FK columns are half the size of `UUID`, which adds up across 30+ tables with heavy FK fan-out (e.g., `session_attendance`, `transaction`).
- **Readability/ops:** Sequential IDs are easier to reason about in support/debugging queries (`WHERE child_id BETWEEN 1000 AND 2000`), though they do leak row-count/sequence information — see the tradeoff note below.

**Tradeoff to flag:** `BIGSERIAL` PKs are guessable/enumerable and reveal approximate row counts (a concern for public-facing donor IDs, for example). If donor-facing IDs are ever exposed in a URL or receipt, expose a separate non-sequential public token (e.g., `donor_public_code VARCHAR` or a `UUID` *display* column) rather than reverting the PK strategy — this keeps internal joins fast while hiding cardinality externally. This is called out per-table where donor/child-facing exposure is likely.

### 0.2 `VARCHAR` instead of `ENUM`

The source doc mentions two enum-like fields: `transaction_type` (donation/disbursement/adjustment) and `education_level`. Native PostgreSQL `ENUM` types are avoided; `VARCHAR` + `CHECK` constraint is used instead.

**Why VARCHAR + CHECK beats native ENUM here:**
- **Schema evolution:** Adding a value to a native `ENUM` requires `ALTER TYPE ... ADD VALUE`, which (pre-PG12) couldn't run inside a transaction with other DDL, and even on modern PostgreSQL can't be rolled back within the same transaction. A `CHECK` constraint is dropped/re-added in one `ALTER TABLE`, transactionally, with zero risk to already-stored rows.
- **Removing a value:** Native `ENUM` has **no supported way to remove a value** without rebuilding the type and every column using it. A `CHECK` constraint is just redefined.
- **Cross-database/reporting tooling:** Many BI/reporting/ORM tools handle `VARCHAR` natively; native enum types often need extra casting (`::text`) in every query, which is easy to forget and causes friction in reports (this system clearly has heavy reporting needs — attendance, evaluation, finance).
- **Consistency with reference tables:** Most "enum-like" concepts in this schema (session type, attendance status, welfare category, role) are *already* modeled as proper reference lookup tables with RESTRICT FKs — not native enums. Making `transaction_type` and `education_level` VARCHAR+CHECK keeps the same philosophy consistent rather than mixing two different enumeration strategies.
- **Cost:** `VARCHAR` with `CHECK` costs slightly more storage than a native enum's 4-byte OID reference, but at this scale (transaction/education rows, not billions) that's immaterial next to the operational flexibility gained.

### 0.3 `TIMESTAMP` (not `TIMESTAMPTZ`)

Per the requirement, audit/event columns use `TIMESTAMP` (no time zone). Every table gets:
```sql
created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
```
**Caveat worth flagging (not overridden, since it's an explicit rule):** AJIS appears to be a single-country (Indonesia, WIB/UTC+7) operation, so naive `TIMESTAMP` is workable as long as the application layer is consistent about which zone it writes in. If AJIS ever spans multiple time zones, `TIMESTAMPTZ` would remove an entire class of bugs — flagging this so the decision is revisited if scope changes, but following the stated rule for this design.

An `updated_at` trigger (`BEFORE UPDATE ... EXECUTE FUNCTION set_updated_at()`) is assumed at build time to keep `updated_at` accurate without relying on the application to remember to set it.

### 0.4 Soft delete columns

The source document repeatedly recommends soft delete (`active = false`) as the operational alternative to hard deletes, especially for reference data, offices, and sponsorship data. This is carried into the physical design as:
```sql
active BOOLEAN NOT NULL DEFAULT TRUE
```
on every table where the source doc mentions it (offices, coaching_region, facility, reference tables, child, child_donor_pairing, hafalan_item_lookup, session_type, etc.). This doesn't replace the FK delete rules below — it's the *operational* path the doc says application code should prefer, while the FK constraint remains the *safety net* if a hard delete is attempted anyway.

### 0.5 Delete-rule mapping

| Source doc rule | PostgreSQL clause |
|---|---|
| CASCADE | `ON DELETE CASCADE` |
| RESTRICT | `ON DELETE RESTRICT` |
| SET NULL | `ON DELETE SET NULL` (column must be nullable) |
| NO ACTION (treated same as RESTRICT per source doc) | `ON DELETE RESTRICT` — chosen explicitly over `NO ACTION` for immediate, at-statement-time error reporting rather than deferred checking, matching the source doc's own conclusion that PostgreSQL treats them equivalently in practice, so the clearer one is preferable. |

### 0.6 Indexing strategy

**PostgreSQL does not automatically index foreign key columns** (unlike the primary key side, which is indexed via the PK constraint). Every FK column below gets an explicit `CREATE INDEX` — this is critical here because:
- `ON DELETE RESTRICT`/`CASCADE` checks require scanning the child table for matching rows; without an index this is a full table scan on every parent delete/update attempt.
- Almost every query pattern implied by the source doc (attendance by child, transactions by pairing, sessions by region) is a lookup by FK.

Composite/partial indexes called out per-table where the source doc implies a uniqueness rule (e.g., one evaluation per child per semester) or a common filtered query (`WHERE active = true`).

### 0.7 Schema (namespace) layout

PostgreSQL schemas are used to mirror the document's logical grouping directly — `geography`, `organization`, `person`, `reference`, `access_control`, `program`, `sponsorship`, `activity`, `evaluation`, `finance`. This keeps the physical layout self-documenting and matches how the source doc already talks about tables (`person.child`, `finance.transaction`, etc.), and lets `search_path` and per-schema permissions map cleanly onto the modules of the application (e.g., a reporting role could get read-only grants on `finance` alone).

---

## 1. GEOGRAPHY SCHEMA

Fully immutable hierarchy per the source doc ("should rarely change," "should rarely be deleted") — every FK is `NOT NULL` + `RESTRICT` except the leaf table, which is nullable per the doc's own reasoning about incomplete addresses.

```sql
CREATE SCHEMA geography;

CREATE TABLE geography.province (
    province_id  BIGSERIAL PRIMARY KEY,
    name         VARCHAR(150) NOT NULL,
    active       BOOLEAN NOT NULL DEFAULT TRUE,
    created_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_province_name UNIQUE (name)
);

CREATE TABLE geography.district (
    district_id  BIGSERIAL PRIMARY KEY,
    province_id  BIGINT NOT NULL
                 REFERENCES geography.province (province_id)
                 ON DELETE RESTRICT,
    name         VARCHAR(150) NOT NULL,
    created_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_district_name_per_province UNIQUE (province_id, name)
);
CREATE INDEX ix_district_province_id ON geography.district (province_id);

CREATE TABLE geography.subdistrict (
    subdistrict_id BIGSERIAL PRIMARY KEY,
    district_id    BIGINT NOT NULL
                   REFERENCES geography.district (district_id)
                   ON DELETE RESTRICT,
    name           VARCHAR(150) NOT NULL,
    created_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_subdistrict_name_per_district UNIQUE (district_id, name)
);
CREATE INDEX ix_subdistrict_district_id ON geography.subdistrict (district_id);

CREATE TABLE geography.village (
    village_id     BIGSERIAL PRIMARY KEY,
    subdistrict_id BIGINT NOT NULL
                   REFERENCES geography.subdistrict (subdistrict_id)
                   ON DELETE RESTRICT,
    name           VARCHAR(150) NOT NULL,
    created_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_village_name_per_subdistrict UNIQUE (subdistrict_id, name)
);
CREATE INDEX ix_village_subdistrict_id ON geography.village (subdistrict_id);

CREATE TABLE geography.location (
    location_id  BIGSERIAL PRIMARY KEY,
    village_id   BIGINT
                 REFERENCES geography.village (village_id)
                 ON DELETE RESTRICT,          -- nullable FK; RESTRICT still applies when set
    address_text VARCHAR(500) NOT NULL,       -- free-text fallback when village is unknown
    created_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX ix_location_village_id ON geography.location (village_id);
```

**Decisions:**
- `RESTRICT` everywhere, matching the doc's explicit stance that geographic reference data must never silently cascade away.
- `village_id` on `location` is nullable exactly as the doc specifies (street-only addresses); `RESTRICT` (rather than `SET NULL`) is kept as the *delete* rule even though the column is nullable, because the doc's own text only says "RESTRICT (or SET NULL if nullable)" as an option, not a firm decision — RESTRICT is the safer default that forces an explicit choice rather than silently orphaning addresses. If bulk village re-mapping becomes a common operation, this is the one place to reconsider `SET NULL`.
- Added `UNIQUE (parent_id, name)` composite constraints — the source doc explicitly calls these out under "Related Constraints (Additional)" for province→district and it's the same underlying need at every level (no duplicate names under the same parent).

---

## 2. ORGANIZATION SCHEMA

```sql
CREATE SCHEMA organization;

CREATE TABLE organization.office (
    office_id        BIGSERIAL PRIMARY KEY,
    parent_office_id BIGINT
                     REFERENCES organization.office (office_id)
                     ON DELETE RESTRICT,
    name             VARCHAR(150) NOT NULL,
    active           BOOLEAN NOT NULL DEFAULT TRUE,
    created_at       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_office_not_own_parent CHECK (office_id <> parent_office_id)
);
CREATE INDEX ix_office_parent_office_id ON organization.office (parent_office_id);

CREATE TABLE organization.coaching_region (
    region_id  BIGSERIAL PRIMARY KEY,
    office_id  BIGINT NOT NULL
               REFERENCES organization.office (office_id)
               ON DELETE RESTRICT,
    name       VARCHAR(150) NOT NULL,
    active     BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX ix_coaching_region_office_id ON organization.coaching_region (office_id);

CREATE TABLE organization.facility (
    facility_id BIGSERIAL PRIMARY KEY,
    office_id   BIGINT NOT NULL
                REFERENCES organization.office (office_id)
                ON DELETE RESTRICT,
    name        VARCHAR(200) NOT NULL,
    active      BOOLEAN NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX ix_facility_office_id ON organization.facility (office_id);
```

**Decisions:**
- `office.parent_office_id` is self-referencing, nullable (root office), `RESTRICT` — exactly as the doc concludes ("too dangerous" to CASCADE an entire branch away). Added `chk_office_not_own_parent` as a defensive `CHECK` — cheap to add, prevents a trivial data-entry error (an office pointing at itself) that a plain FK wouldn't catch.
- Recursive queries over `office` (walking the hierarchy up/down) will want a **recursive CTE** (`WITH RECURSIVE`) at query time; no extra schema object is needed for that in PostgreSQL, but it's worth noting `ix_office_parent_office_id` is what makes each level of that recursion cheap.
- `active` added to all three tables per the doc's explicit "Alternative Design" / "Why Not Use Soft Delete Instead" notes for this schema.

---

## 3. PERSON SCHEMA

```sql
CREATE SCHEMA person;

CREATE TABLE person.child (
    child_id     BIGSERIAL PRIMARY KEY,
    full_name    VARCHAR(200) NOT NULL,
    active       BOOLEAN NOT NULL DEFAULT TRUE,
    created_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE person.family_member (
    family_member_id BIGSERIAL PRIMARY KEY,
    child_id         BIGINT NOT NULL
                     REFERENCES person.child (child_id)
                     ON DELETE CASCADE,
    relationship     VARCHAR(50) NOT NULL,   -- e.g. 'father','mother','guardian'
    full_name        VARCHAR(200) NOT NULL,
    created_at       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_family_member_relationship
        CHECK (relationship IN ('father','mother','guardian','sibling','other'))
);
CREATE INDEX ix_family_member_child_id ON person.family_member (child_id);

CREATE TABLE person.household_member (
    household_member_id BIGSERIAL PRIMARY KEY,
    child_id             BIGINT NOT NULL
                         REFERENCES person.child (child_id)
                         ON DELETE CASCADE,
    relationship         VARCHAR(50) NOT NULL,
    full_name            VARCHAR(200) NOT NULL,
    effective_from       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    effective_to         TIMESTAMP,           -- NULL = still current
    created_at           TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at           TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_household_member_dates
        CHECK (effective_to IS NULL OR effective_to >= effective_from)
);
CREATE INDEX ix_household_member_child_id ON person.household_member (child_id);

CREATE TABLE person.coordinator (
    coordinator_id BIGSERIAL PRIMARY KEY,
    office_id      BIGINT
                   REFERENCES organization.office (office_id)
                   ON DELETE RESTRICT,
    full_name      VARCHAR(200) NOT NULL,
    phone          VARCHAR(30),
    active         BOOLEAN NOT NULL DEFAULT TRUE,
    created_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX ix_coordinator_office_id ON person.coordinator (office_id);

CREATE TABLE person.donor (
    donor_id   BIGSERIAL PRIMARY KEY,
    full_name  VARCHAR(200) NOT NULL,
    active     BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE person.system_user (
    system_user_id    BIGSERIAL PRIMARY KEY,
    coordinator_id    BIGINT
                      REFERENCES person.coordinator (coordinator_id)
                      ON DELETE SET NULL,
    donor_id          BIGINT
                      REFERENCES person.donor (donor_id)
                      ON DELETE SET NULL,
    role_id           BIGINT NOT NULL
                      REFERENCES reference.role (role_id)
                      ON DELETE RESTRICT,
    is_system_account BOOLEAN NOT NULL DEFAULT FALSE,
    username          VARCHAR(100) NOT NULL,
    password_hash     VARCHAR(255) NOT NULL,
    active            BOOLEAN NOT NULL DEFAULT TRUE,
    created_at        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_system_user_username UNIQUE (username),
    CONSTRAINT uq_system_user_coordinator_id UNIQUE (coordinator_id),
    CONSTRAINT uq_system_user_donor_id UNIQUE (donor_id),
    CONSTRAINT chk_system_user_owner
        CHECK (
            coordinator_id IS NOT NULL
            OR donor_id IS NOT NULL
            OR is_system_account = TRUE
        )
);
CREATE INDEX ix_system_user_role_id ON person.system_user (role_id);
```

**Decisions:**
- `family_member` / `household_member`: `NOT NULL` + `CASCADE`, exactly per the doc — "no point keeping a family record with no child." `household_member` additionally carries the doc's own `effective_to` nullable-current-record pattern, with a `CHECK` guarding date ordering.
- `coordinator.office_id` and `family_member.relationship` are inferred additions (the source doc doesn't spell out every column of `child`/`coordinator`/`donor` — it's a relationship document, not a full column catalog). They're included because they're needed to make the tables usable, but are the parts of this design most worth reviewing against the *actual* application requirements before building. Everything else in this file traces directly to a stated FK/rule in the source document.
- `system_user.coordinator_id` and `.donor_id`: both nullable, both `UNIQUE`, both `SET NULL` — a direct translation of the doc's 1:1 pattern (`UNIQUE` is what turns a 1:M FK into a true 1:1/1:0..1).
- **The doc's own suggested CHECK constraint could not be implemented as written.** It proposed:
  ```
  CHECK (coordinator_id IS NOT NULL OR donor_id IS NOT NULL OR role_id IN ('admin','system'))
  ```
  PostgreSQL `CHECK` constraints must be evaluable from the row's own columns only — they cannot look up values in another table (`role_id IN (...)` would require joining to `reference.role`, which a `CHECK` can't do; that's what triggers or foreign-key-backed lookups are for). This design substitutes a same-row boolean flag, `is_system_account`, which captures the identical business rule ("every account belongs to a coordinator, a donor, or is a system account") without needing a cross-table lookup. This is the single largest semantic adjustment made to the source document, so it's flagged explicitly rather than silently substituted.

---

## 4. REFERENCE SCHEMA

All five lookup tables share the same shape: small, `RESTRICT`-protected, soft-deletable. `semester` is the one exception with date-range columns instead of a plain code/name.

```sql
CREATE SCHEMA reference;

CREATE TABLE reference.session_type (
    session_type_id BIGSERIAL PRIMARY KEY,
    code            VARCHAR(50) NOT NULL,
    name            VARCHAR(100) NOT NULL,
    active          BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_session_type_code UNIQUE (code)
);

CREATE TABLE reference.attendance_status (
    attendance_status_id BIGSERIAL PRIMARY KEY,
    code                 VARCHAR(50) NOT NULL,
    name                 VARCHAR(100) NOT NULL,   -- e.g. Hadir/Izin/Alfa
    active               BOOLEAN NOT NULL DEFAULT TRUE,
    created_at           TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at           TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_attendance_status_code UNIQUE (code)
);

CREATE TABLE reference.welfare_category (
    welfare_category_id BIGSERIAL PRIMARY KEY,
    code                VARCHAR(50) NOT NULL,
    name                VARCHAR(100) NOT NULL,   -- e.g. Yatim/Piatu/Dhuafa
    active              BOOLEAN NOT NULL DEFAULT TRUE,
    created_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_welfare_category_code UNIQUE (code)
);

CREATE TABLE reference.semester (
    semester_id BIGSERIAL PRIMARY KEY,
    name        VARCHAR(50) NOT NULL,            -- e.g. 'Ganjil 2024'
    year        INTEGER NOT NULL,
    term        VARCHAR(20) NOT NULL,             -- 'Ganjil' / 'Genap'
    start_date  DATE NOT NULL,
    end_date    DATE NOT NULL,
    created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_semester_year_term UNIQUE (year, term),
    CONSTRAINT chk_semester_dates CHECK (end_date > start_date)
);

CREATE TABLE reference.role (
    role_id    BIGSERIAL PRIMARY KEY,
    code       VARCHAR(50) NOT NULL,
    name       VARCHAR(100) NOT NULL,             -- Super Admin / Branch Admin / Coordinator
    active     BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_role_code UNIQUE (code)
);
```

**Decisions:**
- `reference.role` must be created **before** `person.system_user` (which references it) — noted here since these two schemas are cross-referenced; actual object creation order will matter once a migration is produced.
- `code` columns use `VARCHAR(50)` with a `UNIQUE` constraint rather than the raw `name`, so display text (`name`) can be renamed/translated without breaking anything that stored the code. This is a step beyond what the source doc specifies, added because these are exactly the kind of "enum-like lookup" tables where a stable code matters — the doc's own attendance-status example ("Hadir"/"Izin"/"Alfa") implies a fixed vocabulary the application logic will branch on, so it deserves a stable key distinct from the localized label.
- `session_date`-range validation on `semester` (`chk_semester_dates`) is a straightforward, low-risk `CHECK` add given `start_date`/`end_date` both exist conceptually in the doc's own "Ganjil 2024" / "Genap 2024" framing.

---

## 5. ACCESS CONTROL SCHEMA

```sql
CREATE SCHEMA access_control;

CREATE TABLE access_control.permission (
    permission_id BIGSERIAL PRIMARY KEY,
    code          VARCHAR(100) NOT NULL,   -- e.g. 'read_child','edit_child'
    name          VARCHAR(150) NOT NULL,
    created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_permission_code UNIQUE (code)
);

CREATE TABLE access_control.role_permission (
    role_id       BIGINT NOT NULL
                  REFERENCES reference.role (role_id)
                  ON DELETE CASCADE,
    permission_id BIGINT NOT NULL
                  REFERENCES access_control.permission (permission_id)
                  ON DELETE RESTRICT,
    created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (role_id, permission_id)
);
CREATE INDEX ix_role_permission_permission_id ON access_control.role_permission (permission_id);
```

**Decisions:**
- `role_permission` uses a **composite primary key** `(role_id, permission_id)` rather than a surrogate `BIGSERIAL` — this is a genuine junction table with *no attributes of its own* beyond the two FKs (unlike, say, `child_donor_pairing`, which has dates/status and rightly gets its own surrogate key). A composite PK here both enforces "no duplicate role+permission pairs" for free and matches the doc's own general note that junction tables typically use a composite key.
- `role_id → CASCADE`: matches the doc exactly ("permission assignments are attributes of the role").
- `permission_id → RESTRICT`: matches the doc exactly ("cannot delete a permission if roles have it").
- The PK `(role_id, permission_id)` already indexes `role_id` as its leading column, so only `permission_id` needs a separate index for the reverse lookup ("which roles have this permission") and for the `RESTRICT` check on permission deletion.

---

## 6. PROGRAM SCHEMA

```sql
CREATE SCHEMA program;

CREATE TABLE program.program (
    program_id BIGSERIAL PRIMARY KEY,
    name       VARCHAR(150) NOT NULL,    -- Anak Juara / IJGS / etc.
    active     BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE program.child_enrollment (
    enrollment_id       BIGSERIAL PRIMARY KEY,
    child_id            BIGINT NOT NULL
                        REFERENCES person.child (child_id)
                        ON DELETE CASCADE,
    program_id          BIGINT NOT NULL
                        REFERENCES program.program (program_id)
                        ON DELETE RESTRICT,
    welfare_category_id BIGINT NOT NULL
                        REFERENCES reference.welfare_category (welfare_category_id)
                        ON DELETE RESTRICT,
    enrollment_date     DATE NOT NULL DEFAULT CURRENT_DATE,
    active              BOOLEAN NOT NULL DEFAULT TRUE,
    created_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX ix_child_enrollment_child_id ON program.child_enrollment (child_id);
CREATE INDEX ix_child_enrollment_program_id ON program.child_enrollment (program_id);
CREATE INDEX ix_child_enrollment_welfare_category_id ON program.child_enrollment (welfare_category_id);
```

**Decisions:**
- Three FKs, three delete rules, all taken directly from the matrix: `child_id → CASCADE` (enrollment is dependent data), `program_id → RESTRICT`, `welfare_category_id → RESTRICT` (both are reference-style parents that must not be silently orphaned).
- All three FK columns get individual indexes since each is queried independently in the doc's examples ("children in program X," "children in welfare category Y").

---

## 7. SPONSORSHIP SCHEMA

This is the schema the source doc calls out most heavily for financial-integrity caution.

```sql
CREATE SCHEMA sponsorship;

CREATE TABLE sponsorship.child_donor_pairing (
    pairing_id  BIGSERIAL PRIMARY KEY,
    child_id    BIGINT NOT NULL
                REFERENCES person.child (child_id)
                ON DELETE RESTRICT,
    donor_id    BIGINT NOT NULL
                REFERENCES person.donor (donor_id)
                ON DELETE RESTRICT,
    program_id  BIGINT NOT NULL
                REFERENCES program.program (program_id)
                ON DELETE RESTRICT,
    pairing_date DATE NOT NULL DEFAULT CURRENT_DATE,
    end_date     DATE,
    active       BOOLEAN NOT NULL DEFAULT TRUE,
    created_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_pairing_dates CHECK (end_date IS NULL OR end_date >= pairing_date)
);
CREATE INDEX ix_child_donor_pairing_child_id ON sponsorship.child_donor_pairing (child_id);
CREATE INDEX ix_child_donor_pairing_donor_id ON sponsorship.child_donor_pairing (donor_id);
CREATE INDEX ix_child_donor_pairing_program_id ON sponsorship.child_donor_pairing (program_id);

CREATE TABLE sponsorship.pairing_balance_snapshot (
    snapshot_id     BIGSERIAL PRIMARY KEY,
    pairing_id      BIGINT NOT NULL
                    REFERENCES sponsorship.child_donor_pairing (pairing_id)
                    ON DELETE RESTRICT,
    semester_id     BIGINT NOT NULL
                    REFERENCES reference.semester (semester_id)
                    ON DELETE RESTRICT,
    closing_balance NUMERIC(14,2) NOT NULL,
    snapshot_date   DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_pairing_snapshot_per_semester UNIQUE (pairing_id, semester_id)
);
CREATE INDEX ix_pairing_balance_snapshot_pairing_id ON sponsorship.pairing_balance_snapshot (pairing_id);
CREATE INDEX ix_pairing_balance_snapshot_semester_id ON sponsorship.pairing_balance_snapshot (semester_id);
```

**Decisions:**
- `child_id` and `donor_id` on `child_donor_pairing` are `RESTRICT`, **not CASCADE** — the source doc walks through this exact fork (Option A/B/C) and lands firmly on RESTRICT specifically because CASCADE here would ripple into `finance.transaction` and erase financial audit trail. This design follows that conclusion rather than the doc's initial "(or RESTRICT, see discussion below)" hedge in the earlier FK-detail block.
- `NUMERIC(14,2)` for money, never `FLOAT`/`REAL` — floating-point types introduce rounding error that's unacceptable for balances; `NUMERIC` is exact. (Not an explicit source-doc rule, but a non-negotiable default for any finance-adjacent column, so it's applied consistently here and in `finance.transaction` below.)
- Added `uq_pairing_snapshot_per_semester` — the doc's semantics ("one snapshot per semester per pairing," "Snapshot tied to specific semester") imply this uniqueness even though it isn't spelled out as a named constraint the way `semester_evaluation`'s is.
- `chk_pairing_dates` guards `end_date >= pairing_date`, mirroring the `household_member` date-order check.

---

## 8. ACTIVITY SCHEMA

```sql
CREATE SCHEMA activity;

CREATE TABLE activity.coaching_session (
    session_id      BIGSERIAL PRIMARY KEY,
    location_id     BIGINT NOT NULL
                    REFERENCES organization.coaching_region (region_id)
                    ON DELETE RESTRICT,
    presenter_id    BIGINT NOT NULL
                    REFERENCES person.coordinator (coordinator_id)
                    ON DELETE RESTRICT,
    session_type_id BIGINT NOT NULL
                    REFERENCES reference.session_type (session_type_id)
                    ON DELETE RESTRICT,
    session_date    DATE NOT NULL,
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX ix_coaching_session_location_id ON activity.coaching_session (location_id);
CREATE INDEX ix_coaching_session_presenter_id ON activity.coaching_session (presenter_id);
CREATE INDEX ix_coaching_session_session_type_id ON activity.coaching_session (session_type_id);

CREATE TABLE activity.session_attendance (
    attendance_id         BIGSERIAL PRIMARY KEY,
    session_id            BIGINT NOT NULL
                          REFERENCES activity.coaching_session (session_id)
                          ON DELETE CASCADE,
    child_id              BIGINT NOT NULL
                          REFERENCES person.child (child_id)
                          ON DELETE CASCADE,
    attendance_status_id  BIGINT NOT NULL
                          REFERENCES reference.attendance_status (attendance_status_id)
                          ON DELETE RESTRICT,
    child_snapshot        JSONB,        -- point-in-time copy of child attributes; see §10
    created_at            TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_attendance_per_child_per_session UNIQUE (session_id, child_id)
);
CREATE INDEX ix_session_attendance_session_id ON activity.session_attendance (session_id);
CREATE INDEX ix_session_attendance_child_id ON activity.session_attendance (child_id);
CREATE INDEX ix_session_attendance_attendance_status_id ON activity.session_attendance (attendance_status_id);
CREATE INDEX ix_session_attendance_child_snapshot_gin ON activity.session_attendance USING GIN (child_snapshot);

CREATE TABLE activity.session_habit_tracking (
    habit_id      BIGSERIAL PRIMARY KEY,
    attendance_id BIGINT NOT NULL
                  REFERENCES activity.session_attendance (attendance_id)
                  ON DELETE CASCADE,
    habit_type    VARCHAR(100) NOT NULL,   -- e.g. 'prayer','recitation','charity'
    status        VARCHAR(30) NOT NULL,
    created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_habit_status CHECK (status IN ('completed','partial','not_completed'))
);
CREATE INDEX ix_session_habit_tracking_attendance_id ON activity.session_habit_tracking (attendance_id);

CREATE TABLE activity.hafalan_item_lookup (
    item_id    BIGSERIAL PRIMARY KEY,
    name       VARCHAR(150) NOT NULL,   -- surah / prayer / du'a name
    category   VARCHAR(50) NOT NULL,
    active     BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE activity.hafalan_assessment (
    assessment_id BIGSERIAL PRIMARY KEY,
    item_id       BIGINT NOT NULL
                  REFERENCES activity.hafalan_item_lookup (item_id)
                  ON DELETE RESTRICT,
    child_id      BIGINT NOT NULL
                  REFERENCES person.child (child_id)
                  ON DELETE CASCADE,
    assessor_id   BIGINT NOT NULL
                  REFERENCES person.coordinator (coordinator_id)
                  ON DELETE RESTRICT,
    status        VARCHAR(30) NOT NULL,
    assessed_date DATE,
    created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_hafalan_status CHECK (status IN ('completed','partial','not_started')),
    CONSTRAINT uq_hafalan_assessment_per_child_item UNIQUE (child_id, item_id)
);
CREATE INDEX ix_hafalan_assessment_item_id ON activity.hafalan_assessment (item_id);
CREATE INDEX ix_hafalan_assessment_child_id ON activity.hafalan_assessment (child_id);
CREATE INDEX ix_hafalan_assessment_assessor_id ON activity.hafalan_assessment (assessor_id);
```

**Decisions:**
- `coaching_session`: all three FKs `RESTRICT`, matching the doc exactly — region, presenter, and session type are all "preserve historical record" cases.
- `session_attendance`: both `session_id` and `child_id` are `CASCADE` per the doc ("attendance records only exist because of a session/child"); `attendance_status_id` is `RESTRICT` (preserve what status was actually recorded historically). Added `uq_attendance_per_child_per_session` — the doc's own example ("Session X: Arif (Hadir), Budi (Izin)...") implies one attendance row per child per session; without this constraint a duplicate-submission bug could double-count a child's attendance.
- `child_snapshot JSONB`: implements the doc's §"Temporal Pattern: Historical Snapshots" verbatim. `JSONB` (not `JSON`) is used because it's binary-stored, supports indexing, and is faster for the read-heavy "what did Arif's record look like on this date" queries the doc describes; a `GIN` index is added since the doc's own use case ("look up child_snapshot from that attendance record") implies querying inside the JSON, not just retrieving it whole.
- `session_habit_tracking`: `CASCADE` on `attendance_id`, matching the doc ("habit records are detail of attendance record"). `status` uses `VARCHAR` + `CHECK` rather than a boolean, since the doc's `hafalan_assessment` example shows a 3-state model (Completed/Partial/Not started) for a conceptually similar field, so the same 3-state shape is used here for consistency rather than guessing a boolean.
- `hafalan_assessment`: `item_id → RESTRICT` and `child_id → CASCADE`, matching the doc's resolved decision (it walks through Option A vs. B and lands on RESTRICT for the item to preserve 120 children's progress tracking). Added `uq_hafalan_assessment_per_child_item` since the doc's example ("Arif: Al-Fatihah (Completed)") implies one assessment row per child per item, updated over time, not one row per attempt — if AJIS actually wants a full history of re-assessments instead, drop this constraint and add an `assessed_at TIMESTAMP` versioning column instead.

---

## 9. EVALUATION SCHEMA

```sql
CREATE SCHEMA evaluation;

CREATE TABLE evaluation.evaluation_item (
    item_id    BIGSERIAL PRIMARY KEY,
    name       VARCHAR(150) NOT NULL,   -- e.g. 'Akhlak', 'Prestasi Akademik'
    category   VARCHAR(50),
    active     BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE evaluation.semester_evaluation (
    evaluation_id BIGSERIAL PRIMARY KEY,
    child_id      BIGINT NOT NULL
                  REFERENCES person.child (child_id)
                  ON DELETE CASCADE,
    semester_id   BIGINT NOT NULL
                  REFERENCES reference.semester (semester_id)
                  ON DELETE RESTRICT,
    evaluator_id  BIGINT NOT NULL
                  REFERENCES person.coordinator (coordinator_id)
                  ON DELETE RESTRICT,
    approver_id   BIGINT
                  REFERENCES person.coordinator (coordinator_id)
                  ON DELETE RESTRICT,
    created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_evaluation_per_child_per_semester UNIQUE (child_id, semester_id)
);
CREATE INDEX ix_semester_evaluation_semester_id ON evaluation.semester_evaluation (semester_id);
CREATE INDEX ix_semester_evaluation_evaluator_id ON evaluation.semester_evaluation (evaluator_id);
CREATE INDEX ix_semester_evaluation_approver_id ON evaluation.semester_evaluation (approver_id);

CREATE TABLE evaluation.evaluation_item_score (
    score_id      BIGSERIAL PRIMARY KEY,
    evaluation_id BIGINT NOT NULL
                  REFERENCES evaluation.semester_evaluation (evaluation_id)
                  ON DELETE CASCADE,
    item_id       BIGINT NOT NULL
                  REFERENCES evaluation.evaluation_item (item_id)
                  ON DELETE RESTRICT,
    score         NUMERIC(5,2) NOT NULL,
    created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_score_per_evaluation_per_item UNIQUE (evaluation_id, item_id),
    CONSTRAINT chk_score_range CHECK (score >= 0 AND score <= 100)
);
CREATE INDEX ix_evaluation_item_score_item_id ON evaluation.evaluation_item_score (item_id);
```

**Decisions:**
- `semester_evaluation.child_id → CASCADE`, `semester_id → RESTRICT`, `evaluator_id → RESTRICT`, `approver_id → RESTRICT` (nullable) — all four taken directly and unambiguously from the matrix, including the doc's explicit resolution on `approver_id` (it considers `SET NULL` and rejects it — "loses who approved it; unclear history" — landing on RESTRICT).
- `uq_evaluation_per_child_per_semester` is copied straight from the doc's own stated note: *"Should also have UNIQUE constraint: (child_id, semester_id)."*
- `evaluation_item_score`: `evaluation_id → CASCADE` ("scores are detail of an evaluation"), `item_id → RESTRICT` ("preserve historical item definitions"). `uq_score_per_evaluation_per_item` follows the doc's own examples (one score per item per evaluation). `chk_score_range` (0–100) is an inferred addition — reasonable for a scored evaluation item but not explicitly stated in the doc, so treat the bound (100) as a placeholder to confirm against the actual grading scale.

---

## 10. FINANCE SCHEMA

The doc is most emphatic here: **never CASCADE, never physically delete.**

```sql
CREATE SCHEMA finance;

CREATE TABLE finance.transaction (
    transaction_id   BIGSERIAL PRIMARY KEY,
    pairing_id       BIGINT NOT NULL
                     REFERENCES sponsorship.child_donor_pairing (pairing_id)
                     ON DELETE RESTRICT,
    transaction_type VARCHAR(20) NOT NULL,
    amount           NUMERIC(14,2) NOT NULL,
    transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_transaction_type
        CHECK (transaction_type IN ('donation','disbursement','adjustment')),
    CONSTRAINT chk_transaction_amount_positive CHECK (amount > 0)
);
CREATE INDEX ix_transaction_pairing_id ON finance.transaction (pairing_id);
CREATE INDEX ix_transaction_type ON finance.transaction (transaction_type);
```

**Decisions:**
- `pairing_id → RESTRICT` — this is the one relationship the source doc treats as non-negotiable, dedicating an entire section to why CASCADE here would be an accounting-standards violation. No alternative was considered acceptable.
- `transaction_type` is exactly the field the requirements called out to convert from `ENUM` to `VARCHAR` + `CHECK`; see §0.2 for the full rationale. Values kept identical to the source doc (`donation`, `disbursement`, `adjustment`).
- **No `updated_at` and no `UPDATE`/`DELETE` grants recommended in practice** — financial transactions should be application-level immutable. This design doesn't add a physical trigger to block updates/deletes (that's a policy/permissions decision, not a schema-conversion one), but it's worth flagging: if "immutable audit trail" needs to be *enforced* rather than just conventional, that's typically done with a `REVOKE UPDATE, DELETE ... ON finance.transaction FROM app_role` at the permissions layer, or a `BEFORE UPDATE OR DELETE` trigger that raises an exception — both are one step beyond schema DDL and can be added when migrations are built.
- `chk_transaction_amount_positive`: inferred addition — a transaction of ₹0 or negative amount is presumably always a data error here (adjustments would still be represented as a signed `transaction_type`, not a negative `amount`, based on how the doc frames the three types as distinct categories rather than debits/credits). Flagging this assumption in case "adjustment" is meant to allow negative amounts — if so, drop this CHECK or scope it per-type.

---

## 11. TEMPORAL / HISTORY PATTERN

The doc's temporal-effective-dates pattern, applied to `child_education` (the only fully worked example given):

```sql
CREATE TABLE person.child_education (
    education_id     BIGSERIAL PRIMARY KEY,
    child_id         BIGINT NOT NULL
                     REFERENCES person.child (child_id)
                     ON DELETE CASCADE,
    education_level  VARCHAR(30) NOT NULL,
    grade            VARCHAR(20),
    school_id        BIGINT NOT NULL
                     REFERENCES organization.facility (facility_id)
                     ON DELETE RESTRICT,
    effective_from   DATE NOT NULL,
    effective_to     DATE,     -- NULL = current
    created_at       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_child_education_level
        CHECK (education_level IN ('sd','smp','sma','other')),
    CONSTRAINT chk_child_education_dates
        CHECK (effective_to IS NULL OR effective_to >= effective_from)
);
CREATE INDEX ix_child_education_child_id ON person.child_education (child_id);
CREATE INDEX ix_child_education_school_id ON person.child_education (school_id);
-- Supports "what grade was this child in on date X" range lookups efficiently:
CREATE INDEX ix_child_education_effective_range
    ON person.child_education (child_id, effective_from, effective_to);
```

**Decisions:**
- `education_level` is the second field the requirements explicitly called out for `ENUM → VARCHAR` conversion; see §0.2. Values (`sd`/`smp`/`sma`/`other`) are inferred from the doc's own worked example ("Grade 8 SMP," "Grade 10 SMA") — confirm the exact vocabulary (Indonesian education levels: SD/SMP/SMA/SMK, etc.) before finalizing the `CHECK` list.
- `child_id → CASCADE`: not explicitly stated for this specific table in the matrix, but follows directly from the doc's own stated pattern for `child (1) ── (M) child_education_version` plus the general principle applied everywhere else to child-dependent detail tables (family_member, household_member, child_enrollment, semester_evaluation, session_attendance, hafalan_assessment all get CASCADE for the same reason — the record is meaningless without the child).
- `school_id → RESTRICT`: mirrors the doc's stated `school (1) ── (M) child_education_version` relationship and the general rule that operational records shouldn't silently orphan by having a facility disappear underneath them.
- The composite index on `(child_id, effective_from, effective_to)` isn't in the source doc but directly supports the exact query the doc itself describes: *"Find child_education WHERE child_id = Arif AND session_date BETWEEN effective_from AND effective_to."*
- This table is presented as the representative example of the temporal pattern, per the source doc (which itself only fully specifies this one case, describing the pattern generically otherwise). If other entities in AJIS need the same effective-dated versioning, they'd follow this identical shape.

---

## 12. OPEN ITEMS TO CONFIRM BEFORE BUILDING A MIGRATION

These aren't gaps in the conversion — they're gaps in the *source document itself* (a relationship design, not a full column catalog), surfaced here rather than silently guessed away:

1. **Full column lists** for `child`, `coordinator`, `donor`, `program`, `office`, `facility`, `evaluation_item`, and `hafalan_item_lookup` — the source doc names these tables and their FKs precisely, but doesn't enumerate every attribute column. Only FK/PK/soft-delete columns are populated here; business columns (address, contact info, DOB, etc.) need the actual field list.
2. **`is_system_account` substitution** on `system_user` (§3) — confirm this captures the intended "admin/system" carve-out correctly, since it replaces a cross-table `CHECK` the source doc proposed but PostgreSQL can't enforce declaratively.
3. **Value vocabularies** for every `CHECK`-constrained `VARCHAR` (`transaction_type`, `education_level`, `chk_habit_status`, `chk_hafalan_status`, `chk_family_member_relationship`) — several were inferred from the doc's narrative examples rather than stated as an exhaustive list.
4. **One-row-per-child-per-item on `hafalan_assessment`** (§8) — confirm whether re-assessment history should overwrite or version.

None of these block the architecture above; they're the specific spots where "explain every decision" means admitting an assumption was made rather than treating it as fact.

---

**End of PostgreSQL Architecture Design — no migration generated, per instructions.**
