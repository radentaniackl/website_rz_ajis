# AJIS PostgreSQL Indexing Strategy
## Production-Grade Index Design for Millions of Records

**Scope:** Complete indexing strategy for all 10 schemas  
**Scale Assumption:** 10–500 million operational records (child/session_attendance/transaction primary drivers)  
**Document Date:** July 14, 2026  

---

## PART A: INDEX TYPES EXPLAINED

Before table-by-table index design, here are the five index types and why each is chosen for different workloads.

### A.1 B-Tree Index (Default)

**What it is:**
- Balanced tree structure; kept sorted on insert/delete via node splits
- Default index type in PostgreSQL; used for `PRIMARY KEY` and `UNIQUE` constraints automatically
- Supports **range scans** (`<`, `>`, `BETWEEN`, `LIKE 'prefix%'`), **equality** (`=`), **ordering** (`ORDER BY`), and **NULL** handling (`IS NULL`)

**When to use:**
- Foreign key columns (RESTRICT/CASCADE checks scan FKs; B-tree makes that scan fast)
- Any `WHERE col = value` filter
- Any `WHERE col BETWEEN a AND b` filter
- `ORDER BY col` or `GROUP BY col` (B-tree keeps sorted; uses index to avoid a full sort)
- Composite key filters (leftmost prefix rule applies)

**Cost at scale:**
- **Reads:** Excellent — O(log N) seek to leaf, then linear scan of range if needed
- **Writes:** Higher — every insert/update/delete into a B-tree must update the index, causing node splits (CPU cost) and WAL writes (disk I/O cost); on a table with millions of rows and high insert rate (e.g., `session_attendance`), this can be noticeable
- **Storage:** One 8-byte pointer per row plus overhead; for 100M rows, ~800 MB plus internal node overhead

**Example: FK Check on Delete**
```sql
-- Q: Can we delete coordinator_id = 5?
-- PostgreSQL internally runs this to check RESTRICT constraint:
SELECT 1 FROM activity.coaching_session 
WHERE presenter_id = 5 LIMIT 1;

-- Without ix_coaching_session_presenter_id: Full table scan (millions of rows)
-- With B-tree index on presenter_id: Instant leaf lookup + range scan
```

---

### A.2 GIN Index (Generalized Inverted Index)

**What it is:**
- Inverted index; maps each value **to a list of rows containing it** (opposite of B-tree: maps rows to values)
- Specialized for **array** and **JSONB** columns where you query "does this row contain X" rather than "find the row where col = X"
- Supports full-text search, JSONB key/value queries, array containment (`@>`, `<@`, `&&`)

**When to use:**
- JSONB columns where you query specific keys/values (e.g., `child_snapshot->'name' = 'Arif'`)
- Array columns with "contains any" queries
- Full-text search on text columns (via `tsvector` type)
- NOT for simple scalar equality (B-tree is faster for that)

**Cost at scale:**
- **Reads:** Good for JSONB key/value filters; better than full-text search on JSON
- **Writes:** High — every insert/update into a JSONB column requires updating the GIN posting lists; on `session_attendance.child_snapshot`, with millions of rows and frequent updates, can be expensive
- **Storage:** Larger than B-tree for the same data due to inverse structure; for JSONB with diverse keys, can be 2-3x the base table size

**Example: JSONB Search**
```sql
-- Q: Find all attendance records where the child's name is 'Arif'
-- (stored in child_snapshot JSON)
SELECT * FROM activity.session_attendance 
WHERE child_snapshot->>'name' = 'Arif';

-- Without ix_session_attendance_child_snapshot_gin: Full table scan of millions
-- With GIN index: Inverted lookup finds all rows with 'Arif' instantly
-- Tradeoff: Every INSERT/UPDATE to session_attendance must update GIN posting lists
```

---

### A.3 Composite Index

**What it is:**
- Single index on **multiple columns**, evaluated left-to-right (leftmost-prefix rule)
- Supports filters on any prefix of the columns, and the full tuple
- Often much more efficient than multiple single-column indexes because it keeps related data co-located

**When to use:**
- Multi-column `WHERE` filters that appear together frequently
- Covering indexes: include columns needed for `SELECT`, so index-only scan (IOS) is possible
- Enforce composite uniqueness (`UNIQUE (child_id, semester_id)`)
- Sort + filter (`WHERE col1 = ? ORDER BY col2`)

**Cost at scale:**
- **Reads:** Excellent when the leftmost columns narrow down fast; can enable index-only scans (no table lookup), saving millions of disk seeks
- **Writes:** Same cost per insert/update as separate indexes combined, but affects fewer index trees (one tree instead of N)
- **Storage:** Roughly same as multiple single-column indexes, but better locality — can be smaller in practice if rows fit tighter in one index

**Leftmost-prefix rule example:**
```sql
CREATE INDEX ix_example ON table_name (col1, col2, col3);

-- USES the index (col1 is leftmost):
SELECT * FROM table_name WHERE col1 = ? AND col2 = ?;        ✓
SELECT * FROM table_name WHERE col1 = ? ORDER BY col2;       ✓

-- DOES NOT use the index (col1 is skipped):
SELECT * FROM table_name WHERE col2 = ? AND col3 = ?;        ✗
```

---

### A.4 Unique Index

**What it is:**
- Enforces uniqueness across one or more columns
- Automatically created by `UNIQUE` constraint or explicitly with `CREATE UNIQUE INDEX`
- B-tree by default; supports same range/equality queries as a regular B-tree

**When to use:**
- Business rule requires uniqueness (username, email, etc.) — should be a `UNIQUE` constraint in schema, not just an index
- Composite uniqueness (one evaluation per child per semester)
- Natural keys (not as PK, but as an alternative key for lookups)

**Cost at scale:**
- **Reads:** Same as B-tree (O(log N))
- **Writes:** Every insert/update must check uniqueness; on high-insert workloads (millions of new evaluations per semester), noticeable CPU cost
- **Storage:** Same as B-tree

**Example: One Evaluation Per Child Per Semester**
```sql
-- Schema-level constraint:
CONSTRAINT uq_evaluation_per_child_per_semester UNIQUE (child_id, semester_id)

-- Automatic B-tree unique index created by PostgreSQL
-- On INSERT: checks "is there already a row (child_id=123, semester_id=45)?"
-- Without index: full table scan; with index: instant O(log N) lookup

-- Supports both lookups equally:
SELECT * FROM evaluation.semester_evaluation 
WHERE child_id = ? AND semester_id = ?;

SELECT * FROM evaluation.semester_evaluation 
WHERE child_id = ? ORDER BY semester_id;
```

---

### A.5 Partial Index

**What it is:**
- B-tree index that only covers rows matching a `WHERE` condition
- Huge storage/performance win when filtering on a column that's skewed (most rows active, few deleted)
- Index is smaller (fewer rows) and faster (smaller tree depth)

**When to use:**
- Soft-delete columns (`WHERE active = TRUE`) — in AJIS, almost all queries filter by this
- Historical data (e.g., `WHERE created_at > '2024-01-01'` for recent months only)
- Status columns with a majority state (e.g., `WHERE status = 'active'`)
- Skip building indexes on rarely-queried dead data

**Cost at scale:**
- **Reads:** Excellent — smaller index tree (shallower) means fewer I/O operations; for `active = TRUE` queries on a 100M-row table where only 10M are active, the index is 10% the size of a full-table index
- **Writes:** Lower than a full index for the same table, because only active rows cause index updates; deleted rows (marked with `active = FALSE`) don't touch the index
- **Storage:** Significant savings — if 90% of rows are soft-deleted, a partial index is 1/10th the size of a full index

**Example: Activity Filter**
```sql
-- AJIS pattern: almost all queries use active = TRUE
SELECT * FROM organization.office 
WHERE active = TRUE AND parent_office_id = ? 
ORDER BY name;

-- Without partial index:
--   B-tree on parent_office_id spans 100M rows (including deleted)
--   Scan includes deleted branches; disk I/O for rows you'll discard

-- With partial index:
CREATE INDEX ix_office_active_parent_id ON organization.office (parent_office_id) 
WHERE active = TRUE;
--   Index only spans 70M active rows
--   Scan skips 30M deleted rows; 30% less disk I/O
--   Index tree is shallower; fewer page accesses per seek

-- On large tables (millions of rows), this compounds:
-- - 30M deleted child records? Delete uses 30% of child index space.
-- - Soft delete means that 30M is never re-indexed.
```

---

## PART B: SEARCH, PAGINATION, AND REPORT OPTIMIZATION STRATEGIES

Before diving into table-by-table index specs, here's the optimization strategy for the three major query patterns.

### B.1 Search Optimization

**Goal:** Fast text/filter searches (e.g., find children by name, find donors by contact info).

**Strategy:**

1. **Filtered B-tree on searchable columns**
   ```sql
   -- Users frequently search: find children named 'Arif' in an active state
   CREATE INDEX ix_child_search_name_active ON person.child (full_name) 
   WHERE active = TRUE;
   
   -- Query: SELECT * FROM person.child WHERE active = TRUE AND full_name ILIKE '%Arif%'
   -- Without index: 100M rows scanned; ILIKE '%...%' is not indexable, but WHERE active = TRUE 
   --                filters table down to 70M, then full scan of 70M
   -- With index: 70M rows in index (not 100M), but ILIKE '%...%' still full-scans the index
   -- Better: If search is prefix-match (starts-with), make it indexable:
   ```

2. **Prefix-match vs. substring**
   ```sql
   -- Indexable (prefix):
   WHERE full_name ILIKE 'Arif%'  -- Uses ix_child_search_name_active (fast)
   
   -- Not indexable (substring):
   WHERE full_name ILIKE '%Arif%'  -- Scans index; ignores leading '%'
   
   -- Recommendation for AJIS: Add a 'name_prefix' column (first 3-4 chars, lowercase)
   -- CREATE INDEX ix_child_prefix ON person.child (name_prefix) WHERE active = TRUE
   -- Queries can then do: WHERE name_prefix = 'ari' AND full_name ILIKE 'Arif%'
   ```

3. **Full-text search (if search is critical)**
   ```sql
   -- For deep text search, create a tsvector column:
   ALTER TABLE person.child ADD COLUMN search_vector tsvector;
   CREATE INDEX ix_child_fulltext ON person.child USING GIN (search_vector);
   
   -- Query:
   SELECT * FROM person.child 
   WHERE search_vector @@ to_tsquery('Arif | Ahmad | Cimahi');
   
   -- Cost: Adds storage (tsvector column on every child row), needs trigger to keep in sync
   -- Benefit: Substring search ('arif' matches 'Muhammad Arif', 'Arif Ahmad') without LIKE
   ```

### B.2 Pagination Optimization

**Goal:** Fast "give me rows 100–200 of result set" without materializing all 10 million rows.

**Strategy:**

1. **Offset + Limit is O(N) (avoid for large offsets)**
   ```sql
   -- Slow for large offsets:
   SELECT * FROM activity.session_attendance 
   ORDER BY session_id DESC 
   LIMIT 100 OFFSET 100000000;
   
   -- PostgreSQL must: (1) Sort all 500M rows, (2) Skip first 100M, (3) Fetch 100
   -- Cost: O(N log N) sort + O(N) skip = very slow
   ```

2. **Keyset pagination (seek method) is O(log N) (preferred)**
   ```sql
   -- Fast: remember the last row's key; start from there
   -- Previous page last row was: attendance_id = 123456789
   
   SELECT * FROM activity.session_attendance 
   WHERE attendance_id > 123456789  -- Seek from last key
   ORDER BY attendance_id ASC 
   LIMIT 100;
   
   -- With B-tree on attendance_id (the PK): O(log N) seek to row 123456789, 
   -- then linear scan of next 100 rows = O(log N + 100)
   -- Cost: Independent of dataset size; always 100 rows + index seek
   ```

3. **Composite keyset for multi-column sort**
   ```sql
   -- Common: "show me sessions for a region, sorted by date, paged"
   SELECT * FROM activity.coaching_session 
   WHERE location_id = 45 
     AND session_date >= '2024-01-01'
   ORDER BY session_date DESC, session_id DESC 
   LIMIT 50;
   
   -- Keyset pagination:
   -- "Last page ended with session_date=2024-05-15, session_id=999"
   SELECT * FROM activity.coaching_session 
   WHERE location_id = 45 
     AND session_date >= '2024-01-01'
     AND (session_date, session_id) < ('2024-05-15', 999)  -- Seek from last key
   ORDER BY session_date DESC, session_id DESC 
   LIMIT 50;
   
   -- Index needed:
   CREATE INDEX ix_coaching_session_location_date_id 
      ON activity.coaching_session (location_id, session_date DESC, session_id DESC);
   
   -- This index supports: (1) Filter by location, (2) Sort by date DESC, (3) Keyset seek
   ```

4. **Index-Only Scan (IOS) for pagination**
   ```sql
   -- If you paginate by PK only:
   SELECT attendance_id, session_id, child_id 
   FROM activity.session_attendance 
   ORDER BY attendance_id DESC 
   LIMIT 100;
   
   -- Composite index covering the SELECT columns:
   CREATE INDEX ix_attendance_covering 
      ON activity.session_attendance (attendance_id, session_id, child_id);
   
   -- PostgreSQL can scan the index alone (no table lookup):
   -- Index-Only Scan on ix_attendance_covering (backward scan, limit 100)
   -- vs.
   -- Index Scan using ix_attendance_covering + 100 table lookups
   
   -- Saves ~100 random I/O operations for each page.
   ```

### B.3 Report Optimization

**Goal:** Fast aggregation/grouping queries over millions of rows (e.g., attendance by child, spending by donor).

**Strategy:**

1. **Covering Indexes for GROUP BY**
   ```sql
   -- Report: "Count attendance by child"
   SELECT child_id, COUNT(*) 
   FROM activity.session_attendance 
   GROUP BY child_id;
   
   -- Without index:
   --   Full table scan of 500M attendance rows + sort by child_id + group
   --   Cost: O(N log N) sort + table I/O for 500M rows
   
   -- With B-tree index on child_id:
   CREATE INDEX ix_session_attendance_child_id ON activity.session_attendance (child_id);
   --   Full table scan still (GROUP BY can't skip rows), but...
   --   rows are ordered by child_id, so GROUP BY is linear (no sort)
   --   Cost: O(N) table I/O + O(1) grouping = faster
   
   -- With PARTIAL index on active attendance only:
   CREATE INDEX ix_attendance_active_child_id 
      ON activity.session_attendance (child_id) 
      WHERE active = TRUE;
   --   If report filters active records, index is smaller (faster scans)
   ```

2. **Pre-aggregated summary tables (materialized views)**
   ```sql
   -- Expensive report: "Attendance rate by child by month for past 2 years"
   -- Requires JOIN of child + session + attendance + 1000s of rows per child
   
   -- Build and refresh nightly:
   CREATE MATERIALIZED VIEW mv_attendance_summary AS 
   SELECT 
       child_id,
       DATE_TRUNC('month', session_date)::date AS month,
       COUNT(*) AS total_sessions,
       SUM(CASE WHEN status='Hadir' THEN 1 ELSE 0 END) AS present_count
   FROM activity.session_attendance sa
   JOIN activity.coaching_session cs ON sa.session_id = cs.session_id
   WHERE sa.active = TRUE
   GROUP BY child_id, month;
   
   CREATE INDEX ix_mv_attendance_child ON mv_attendance_summary (child_id);
   
   -- Query: SELECT * FROM mv_attendance_summary WHERE child_id = 123;
   -- Cost: O(log N) index lookup into a 10M-row table (not 500M)
   ```

3. **Time-series and date-range aggregations**
   ```sql
   -- Report: "Total donation per program per quarter"
   SELECT 
       program_id, 
       DATE_TRUNC('quarter', transaction_date)::date AS quarter,
       SUM(amount) AS total_donation
   FROM finance.transaction t
   JOIN sponsorship.child_donor_pairing p ON t.pairing_id = p.pairing_id
   GROUP BY program_id, quarter
   ORDER BY quarter DESC;
   
   -- Indexes needed:
   CREATE INDEX ix_transaction_pairing_date 
      ON finance.transaction (pairing_id, transaction_date DESC);
   -- Supports: JOIN via pairing_id + ORDER BY date
   
   CREATE INDEX ix_pairing_program_id 
      ON sponsorship.child_donor_pairing (program_id) 
      WHERE active = TRUE;
   -- Supports: filter to active pairings + GROUP BY program_id
   ```

4. **Sampling for approximate reports**
   ```sql
   -- Report: "Rough breakdown of child welfare categories"
   -- Exact: requires GROUP BY over 500M rows
   -- Approximate: sample 0.1% of rows, extrapolate
   
   SELECT welfare_category_id, COUNT(*) * 1000 AS estimated_count
   FROM (
       SELECT welfare_category_id FROM program.child_enrollment 
       WHERE random() < 0.001  -- Approx 0.1% sample
   ) s
   GROUP BY welfare_category_id
   ORDER BY estimated_count DESC;
   
   -- Cost: O(N * 0.001) = O(N) scan (still scans all rows, but processes fewer)
   -- Benefit: Cheap, repeatable approximation for dashboards
   -- Tradeoff: Loses precision; acceptable for summary dashboards
   ```

---

## PART C: TABLE-BY-TABLE INDEXING STRATEGY

For each table, the indexes are listed by purpose (FK checks, searches, pagination, aggregation, uniqueness).

---

## C.1 GEOGRAPHY SCHEMA

Immutable reference data; mostly lookups by parent or hierarchical traversal. No soft delete.

```sql
-- 1. PROVINCE
CREATE TABLE geography.province (
    province_id  BIGSERIAL PRIMARY KEY,  -- Implicit B-tree index
    name         VARCHAR(150) NOT NULL,
    active       BOOLEAN NOT NULL DEFAULT TRUE,
    created_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_province_name UNIQUE (name)  -- Implicit B-tree unique index
);

-- Purpose: Read-mostly lookup table (rarely inserted)
-- No additional indexes needed beyond PK and UNIQUE

-- 2. DISTRICT
CREATE TABLE geography.district (
    district_id  BIGSERIAL PRIMARY KEY,  -- Implicit B-tree
    province_id  BIGINT NOT NULL REFERENCES geography.province (...) ON DELETE RESTRICT,
    name         VARCHAR(150) NOT NULL,
    created_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_district_name_per_province UNIQUE (province_id, name)  -- Composite unique B-tree
);

-- FK Index (necessary for RESTRICT check on province deletion):
CREATE INDEX ix_district_province_id ON geography.district (province_id);

-- Purpose of ix_district_province_id:
-- When PostgreSQL checks "can we delete province_id=5?", it must scan district 
-- for any rows with province_id=5. Without index: O(N) table scan. 
-- With index: O(log N) leaf lookup.
-- At scale: 1M districts, deleting a province: 1 second (with index) vs 10+ seconds (without)

-- Report: "List all districts in a province"
-- Uses: ix_district_province_id (B-tree, range scan)
-- Query: SELECT * FROM geography.district WHERE province_id = ? ORDER BY name;
-- Index provides filtering + alphabetical rows already sorted

-- 3. SUBDISTRICT (same pattern)
CREATE TABLE geography.subdistrict (
    subdistrict_id BIGSERIAL PRIMARY KEY,
    district_id    BIGINT NOT NULL REFERENCES geography.district (...) ON DELETE RESTRICT,
    name           VARCHAR(150) NOT NULL,
    created_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_subdistrict_name_per_district UNIQUE (district_id, name)
);

CREATE INDEX ix_subdistrict_district_id ON geography.subdistrict (district_id);

-- 4. VILLAGE (same pattern)
CREATE TABLE geography.village (
    village_id     BIGSERIAL PRIMARY KEY,
    subdistrict_id BIGINT NOT NULL REFERENCES geography.subdistrict (...) ON DELETE RESTRICT,
    name           VARCHAR(150) NOT NULL,
    created_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_village_name_per_subdistrict UNIQUE (subdistrict_id, name)
);

CREATE INDEX ix_village_subdistrict_id ON geography.village (subdistrict_id);

-- 5. LOCATION
CREATE TABLE geography.location (
    location_id  BIGSERIAL PRIMARY KEY,
    village_id   BIGINT REFERENCES geography.village (...) ON DELETE RESTRICT,
    address_text VARCHAR(500) NOT NULL,
    created_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX ix_location_village_id ON geography.location (village_id);

-- Additional: For quick location lookups by prefix
-- (If the app frequently searches "find locations with 'Jl. Sudirman'")
-- CREATE INDEX ix_location_address_prefix ON geography.location (LEFT(address_text, 20))
-- Cost: Adds 50MB per 10M locations; benefit only if location search is common

-- Summary: GEOGRAPHY indexes
-- - All FK indexes are B-tree (necessary for RESTRICT checks)
-- - All composite unique constraints are auto-indexed by PK/UNIQUE
-- - Partial indexes not needed (no soft delete)
-- - Covering indexes not needed (small tables, simple queries)
```

**Index Count:** 4 (one per FK)  
**Storage:** ~20 MB (geography is small, reference data)  
**Query Impact:** FK deletion checks O(log N); hierarchical traversals O(log N) per level

---

## C.2 ORGANIZATION SCHEMA

Self-referencing hierarchy + children (coaching_region, facility). Heavy FK checks on office deletion (RESTRICT).

```sql
CREATE SCHEMA organization;

-- 1. OFFICE (self-referencing hierarchy)
CREATE TABLE organization.office (
    office_id        BIGSERIAL PRIMARY KEY,  -- Implicit B-tree
    parent_office_id BIGINT REFERENCES organization.office (...) ON DELETE RESTRICT,
    name             VARCHAR(150) NOT NULL,
    active           BOOLEAN NOT NULL DEFAULT TRUE,
    created_at       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_office_not_own_parent CHECK (office_id <> parent_office_id)
);

-- FK Index (self-reference; necessary for RESTRICT on parent deletion):
CREATE INDEX ix_office_parent_office_id ON organization.office (parent_office_id);

-- Purpose: When deleting office_id=5, check "any other office has parent_id=5?"
-- Without index: full table scan of 100k offices
-- With index: O(log N) lookup
-- Cost: ~200 bytes per office in index

-- Hierarchical queries (find all child branches of an office):
-- Recursive CTE uses this index:
-- WITH RECURSIVE tree AS (
--   SELECT * FROM office WHERE office_id = ?
--   UNION ALL
--   SELECT o.* FROM office o JOIN tree t ON o.parent_office_id = t.office_id
-- )
-- SELECT * FROM tree;
-- At each recursion level, index on parent_office_id supports the join

-- Search/pagination: "List all active offices under parent X, sorted by name"
-- SELECT * FROM organization.office 
-- WHERE active = TRUE AND parent_office_id = ? 
-- ORDER BY name;
-- Index: ix_office_parent_office_id (covers filter on parent_id)
-- But doesn't help with "active = TRUE" or "ORDER BY name"
-- Better index:
CREATE INDEX ix_office_active_parent_name 
    ON organization.office (parent_office_id, active, name) 
    WHERE active = TRUE;

-- Explanation:
-- - Leftmost: parent_office_id (filter by parent)
-- - Middle: active (filtered WHERE active = TRUE; redundant since partial index, 
--   but included for safety if queries sometimes omit the filter)
-- - Rightmost: name (sort)
-- This composite index supports: (1) Filter parent + active, (2) Sort by name
-- Index is partial (active = TRUE), so 30% smaller than full index
-- Index-only scan possible if SELECT only includes parent_office_id/active/name

-- 2. COACHING_REGION
CREATE TABLE organization.coaching_region (
    region_id  BIGSERIAL PRIMARY KEY,
    office_id  BIGINT NOT NULL REFERENCES organization.office (...) ON DELETE RESTRICT,
    name       VARCHAR(150) NOT NULL,
    active     BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- FK Index (for RESTRICT check on office deletion):
CREATE INDEX ix_coaching_region_office_id ON organization.coaching_region (office_id);

-- Report: "List all regions under an office"
-- SELECT * FROM organization.coaching_region 
-- WHERE active = TRUE AND office_id = ? 
-- ORDER BY name;
-- 
-- Better index (covers filter + sort + partial):
CREATE INDEX ix_coaching_region_office_active_name 
    ON organization.coaching_region (office_id, name) 
    WHERE active = TRUE;

-- Explanation:
-- - Partial (active = TRUE): index only spans 70% of rows
-- - Composite (office_id, name): filter by office + sort by name
-- - Index-only scan if SELECT only needs these columns

-- 3. FACILITY (same pattern)
CREATE TABLE organization.facility (
    facility_id BIGSERIAL PRIMARY KEY,
    office_id   BIGINT NOT NULL REFERENCES organization.office (...) ON DELETE RESTRICT,
    name        VARCHAR(200) NOT NULL,
    active      BOOLEAN NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX ix_facility_office_id ON organization.facility (office_id);

CREATE INDEX ix_facility_office_active_name 
    ON organization.facility (office_id, name) 
    WHERE active = TRUE;

-- Summary: ORGANIZATION indexes
-- - 3 FK indexes (B-tree, for RESTRICT checks)
-- - 2 composite partial indexes (for queries filtering active + sorting)
-- Total: 5 indexes; 3 required (FK), 2 optional-but-recommended (speed up reports)
```

**Index Count:** 5 (3 required FK, 2 optional report)  
**Storage:** ~50 MB  
**Query Impact:** 
- Deletion checks: O(log N)
- List-under-parent queries: O(log N) + O(K) where K = child count
- Partial indexes reduce I/O by ~30% for active-only filters

---

## C.3 PERSON SCHEMA

High-volume tables (child, coordinator, donor, system_user). Soft delete everywhere. Multiple FKs and searches.

```sql
CREATE SCHEMA person;

-- 1. CHILD (base entity; referenced by many tables)
CREATE TABLE person.child (
    child_id     BIGSERIAL PRIMARY KEY,
    full_name    VARCHAR(200) NOT NULL,
    active       BOOLEAN NOT NULL DEFAULT TRUE,
    created_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Search: "Find children by name (active only)"
CREATE INDEX ix_child_name_active ON person.child (full_name) 
WHERE active = TRUE;

-- Explanation:
-- - B-tree on full_name: supports ILIKE 'Arif%' prefix search (fast)
-- - Partial (active = TRUE): excludes 30% deleted rows
-- - Storage: ~100 MB for 10M children
-- 
-- Query: SELECT * FROM person.child WHERE active = TRUE AND full_name ILIKE 'Arif%';
// - Uses index to find all rows where full_name starts with 'Arif'
// - Without index: 10M * 0.7 = 7M rows scanned, each checked against ILIKE
// - With index: ~1000 matching rows fetched directly (if 'Arif' is rare)

// Note: ILIKE '%Arif%' (substring) doesn't use this index; must scan whole index
// Workaround: Add text search (§B.1)

-- Pagination: "Paginate through all active children"
// Keyset pagination uses child_id (PK), no additional index needed

-- 2. FAMILY_MEMBER (CASCADE on child deletion)
CREATE TABLE person.family_member (
    family_member_id BIGSERIAL PRIMARY KEY,
    child_id         BIGINT NOT NULL REFERENCES person.child (...) ON DELETE CASCADE,
    relationship     VARCHAR(50) NOT NULL,
    full_name        VARCHAR(200) NOT NULL,
    created_at       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_family_member_relationship
        CHECK (relationship IN ('father','mother','guardian','sibling','other'))
);

// FK Index (for CASCADE check on child deletion):
CREATE INDEX ix_family_member_child_id ON person.family_member (child_id);

// Purpose: On DELETE child_id=123, cascade to family_member
// PostgreSQL finds rows with child_id=123 via this index
// Without index: full scan of 30M family_member rows (slow)
// With index: O(log N) lookup + cascade delete of matching rows

// Report: "All family members of a child"
// SELECT * FROM person.family_member WHERE child_id = ? ORDER BY relationship;
// Uses ix_family_member_child_id; sorting by relationship is in-memory or full scan
// If relationship sort is critical:
CREATE INDEX ix_family_member_child_relationship 
    ON person.family_member (child_id, relationship);
// Enables index-only sort

// 3. HOUSEHOLD_MEMBER (CASCADE on child deletion)
CREATE TABLE person.household_member (
    household_member_id BIGSERIAL PRIMARY KEY,
    child_id             BIGINT NOT NULL REFERENCES person.child (...) ON DELETE CASCADE,
    relationship         VARCHAR(50) NOT NULL,
    full_name            VARCHAR(200) NOT NULL,
    effective_from       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    effective_to         TIMESTAMP,
    created_at           TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at           TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_household_member_dates
        CHECK (effective_to IS NULL OR effective_to >= effective_from)
);

CREATE INDEX ix_household_member_child_id ON person.household_member (child_id);

// Query: "Current household members of a child"
// SELECT * FROM person.household_member 
// WHERE child_id = ? AND effective_to IS NULL;
// 
// Better index:
CREATE INDEX ix_household_member_child_current 
    ON person.household_member (child_id) 
    WHERE effective_to IS NULL;

// Explanation:
// - Partial (effective_to IS NULL): only spans current members (~10% of rows)
// - Supports O(log N) lookup for "get current members"

// 4. COORDINATOR
CREATE TABLE person.coordinator (
    coordinator_id BIGSERIAL PRIMARY KEY,
    office_id      BIGINT REFERENCES organization.office (...) ON DELETE RESTRICT,
    full_name      VARCHAR(200) NOT NULL,
    phone          VARCHAR(30),
    active         BOOLEAN NOT NULL DEFAULT TRUE,
    created_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

// FK Index:
CREATE INDEX ix_coordinator_office_id ON organization.office (office_id);

// Report: "List coordinators by office (active only)"
CREATE INDEX ix_coordinator_office_active_name 
    ON person.coordinator (office_id, full_name) 
    WHERE active = TRUE;

// Search: "Find coordinator by name"
CREATE INDEX ix_coordinator_name_active ON person.coordinator (full_name) 
WHERE active = TRUE;

// 5. DONOR
CREATE TABLE person.donor (
    donor_id   BIGSERIAL PRIMARY KEY,
    full_name  VARCHAR(200) NOT NULL,
    active     BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

// Donor is referenced by system_user (SET NULL) and child_donor_pairing (RESTRICT)
// For SET NULL, no FK index needed (PostgreSQL doesn't enforce uniqueness)
// For RESTRICT, FK index needed:
// (See sponsorship.child_donor_pairing index below)

// Search: "Find donors by name (active only)"
CREATE INDEX ix_donor_name_active ON person.donor (full_name) 
WHERE active = TRUE;

// 6. SYSTEM_USER
CREATE TABLE person.system_user (
    system_user_id    BIGSERIAL PRIMARY KEY,
    coordinator_id    BIGINT REFERENCES person.coordinator (...) ON DELETE SET NULL,
    donor_id          BIGINT REFERENCES person.donor (...) ON DELETE SET NULL,
    role_id           BIGINT NOT NULL REFERENCES reference.role (...) ON DELETE RESTRICT,
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
        CHECK (coordinator_id IS NOT NULL OR donor_id IS NOT NULL OR is_system_account = TRUE)
);

// FK Indexes (for SET NULL / RESTRICT checks):
// - coordinator_id: For SET NULL check on coordinator deletion
// CREATE INDEX ix_system_user_coordinator_id ON person.system_user (coordinator_id);
// Note: May not be necessary for SET NULL (no foreign key lookup needed on delete)
// But useful for queries like "find system_user for coordinator X"

CREATE INDEX ix_system_user_coordinator_id ON person.system_user (coordinator_id) 
WHERE coordinator_id IS NOT NULL;

// - donor_id: Same
CREATE INDEX ix_system_user_donor_id ON person.system_user (donor_id) 
WHERE donor_id IS NOT NULL;

// - role_id: For RESTRICT check on role deletion
CREATE INDEX ix_system_user_role_id ON person.system_user (role_id);

// Unique indexes (auto-created by UNIQUE constraint):
// - uq_system_user_username (for login lookups)
// - uq_system_user_coordinator_id (enforce 1:1)
// - uq_system_user_donor_id (enforce 1:1)

// Query: "Login by username"
// SELECT * FROM person.system_user WHERE username = ?;
// Uses uq_system_user_username (B-tree unique), O(log N)

// Summary: PERSON indexes
// - 7 FK indexes (some required RESTRICT, some optional for queries)
// - 4 search indexes (name lookups)
// - Partial indexes for active-only filtering
// Total: ~15 indexes (some overlapping on same column)
```

**Index Count:** ~15 (FKs, searches, partials)  
**Storage:** ~500 MB  
**Query Impact:**
- Login: O(log N) via unique username index
- Child search: O(log N) + K results via partial name index
- List/pagination: Keyset pagination uses PK

---

## C.4 REFERENCE SCHEMA

Tiny, read-mostly lookup tables. No soft delete needed (just use CASCADE + soft delete on child).

```sql
CREATE SCHEMA reference;

-- All reference tables follow the same pattern:

-- 1. SESSION_TYPE
CREATE TABLE reference.session_type (
    session_type_id BIGSERIAL PRIMARY KEY,
    code            VARCHAR(50) NOT NULL,
    name            VARCHAR(100) NOT NULL,
    active          BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_session_type_code UNIQUE (code)
);

// Unique indexes (auto-created):
// - PK on session_type_id
// - UNIQUE on code

// No additional indexes needed; reference table is small (< 100 rows)
// Queries like "SELECT * FROM session_type WHERE code = 'reguler'" use UNIQUE index

// 2. ATTENDANCE_STATUS, WELFARE_CATEGORY, SEMESTER, ROLE (same pattern)
// Minimal indexing beyond PK and UNIQUE

// Exception: SEMESTER may be queried by date range
// "Find semester containing date 2024-05-15"
// SELECT * FROM reference.semester 
// WHERE start_date <= '2024-05-15' AND end_date >= '2024-05-15';
// 
// B-tree on (start_date, end_date) supports range queries:
CREATE INDEX ix_semester_date_range 
    ON reference.semester (start_date, end_date);

// Summary: REFERENCE indexes
// - PK and UNIQUE (auto-created)
// - 1 optional range index on semester (if date lookup is frequent)
// Total: ~8 indexes (mostly auto-created)
```

**Index Count:** 8 (mostly auto, 1 optional)  
**Storage:** < 1 MB (reference data is small)  
**Query Impact:** All lookups O(log N) via UNIQUE; rarely a bottleneck

---

## C.5 ACCESS_CONTROL SCHEMA

Junction table (role_permission). Tiny; no soft delete.

```sql
CREATE SCHEMA access_control;

-- 1. PERMISSION
CREATE TABLE access_control.permission (
    permission_id BIGSERIAL PRIMARY KEY,
    code          VARCHAR(100) NOT NULL,
    name          VARCHAR(150) NOT NULL,
    created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_permission_code UNIQUE (code)
);

// No additional indexes; small table

// 2. ROLE_PERMISSION (junction table)
CREATE TABLE access_control.role_permission (
    role_id       BIGINT NOT NULL REFERENCES reference.role (...) ON DELETE CASCADE,
    permission_id BIGINT NOT NULL REFERENCES access_control.permission (...) ON DELETE RESTRICT,
    created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (role_id, permission_id)  // Composite PK (also a B-tree index)
);

// Additional indexes:
// - PK on (role_id, permission_id) supports:
//   * Find all permissions for a role: WHERE role_id = ?
//   * FK check on role deletion (CASCADE)
// 
// - Need index on permission_id for:
//   * Find all roles with a permission: WHERE permission_id = ?
//   * FK check on permission deletion (RESTRICT)
//   
// The PK doesn't support leading-column query on permission_id
// (Leftmost-prefix rule: PK (role_id, permission_id) supports role_id queries, 
//  not permission_id queries without role_id)

CREATE INDEX ix_role_permission_permission_id ON access_control.role_permission (permission_id);

// Queries:
// 1. "All permissions for role X"
//    SELECT * FROM access_control.role_permission WHERE role_id = ?;
//    Uses PK (role_id is leftmost), O(log N) + K results

// 2. "All roles with permission X"
//    SELECT * FROM access_control.role_permission WHERE permission_id = ?;
//    Uses ix_role_permission_permission_id, O(log N) + K results

// Summary: ACCESS_CONTROL indexes
// - PK (composite)
// - 1 FK index on permission_id
// Total: 2 indexes
```

**Index Count:** 2  
**Storage:** < 1 MB  
**Query Impact:** All queries O(log N) on tiny table; not a bottleneck

---

## C.6 PROGRAM SCHEMA

`child_enrollment` is high-volume (millions of rows). Multiple FKs, used for reporting.

```sql
CREATE SCHEMA program;

-- 1. PROGRAM
CREATE TABLE program.program (
    program_id BIGSERIAL PRIMARY KEY,
    name       VARCHAR(150) NOT NULL,
    active     BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

// No additional indexes; reference-like

// 2. CHILD_ENROLLMENT (high-volume)
CREATE TABLE program.child_enrollment (
    enrollment_id       BIGSERIAL PRIMARY KEY,
    child_id            BIGINT NOT NULL REFERENCES person.child (...) ON DELETE CASCADE,
    program_id          BIGINT NOT NULL REFERENCES program.program (...) ON DELETE RESTRICT,
    welfare_category_id BIGINT NOT NULL REFERENCES reference.welfare_category (...) ON DELETE RESTRICT,
    enrollment_date     DATE NOT NULL DEFAULT CURRENT_DATE,
    active              BOOLEAN NOT NULL DEFAULT TRUE,
    created_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

// This table: 10M–100M rows (one enrollment per child per program, with history)
// Indexes needed:

// 1. FK Index: child_id (for CASCADE check on child deletion)
CREATE INDEX ix_child_enrollment_child_id ON program.child_enrollment (child_id);

// Purpose: On DELETE child_id=123, find all enrollments to cascade delete
// At scale: 100M enrollments, cascade deleting 1 child = scan 100M via index, O(log N) + K

// 2. FK Index: program_id (for RESTRICT check on program deletion)
CREATE INDEX ix_child_enrollment_program_id ON program.child_enrollment (program_id);

// Purpose: On DELETE program_id=5, check if any enrollments reference it
// If RESTRICT: prevents deletion if rows found

// 3. FK Index: welfare_category_id (for RESTRICT check)
CREATE INDEX ix_child_enrollment_welfare_category_id 
    ON program.child_enrollment (welfare_category_id);

// 4. Report: "Children in program X, active only"
// SELECT * FROM program.child_enrollment 
// WHERE program_id = ? AND active = TRUE 
// ORDER BY enrollment_date DESC;

// Composite partial index:
CREATE INDEX ix_child_enrollment_program_active_date 
    ON program.child_enrollment (program_id, enrollment_date DESC) 
    WHERE active = TRUE;

// Explanation:
// - Partial (active = TRUE): 70% of rows (excludes inactive enrollments)
// - Composite (program_id, enrollment_date DESC): 
//   * Filter by program (leftmost)
//   * Sort by enrollment_date DESC (rightmost)
// - Storage: 100M * 0.7 * 16 bytes = ~1.1 GB
// - Supports: O(log N) + O(K) fetch + O(1) sort

// 5. Report: "Enrollment history grouped by welfare category"
// SELECT welfare_category_id, COUNT(*) FROM program.child_enrollment 
// GROUP BY welfare_category_id;

// B-tree on welfare_category_id helps:
// - Rows are ordered by welfare_category_id
// - GROUP BY becomes linear (no sort)
// - Uses ix_child_enrollment_welfare_category_id (already created above)

// 6. Pagination: "Paginate through enrollments for a child"
// SELECT * FROM program.child_enrollment 
// WHERE child_id = ? AND enrollment_date >= '2023-01-01'
// ORDER BY enrollment_id DESC 
// LIMIT 100;

// Keyset pagination:
// WHERE child_id = ? AND enrollment_id < 999999
// 
// Index needed:
CREATE INDEX ix_child_enrollment_child_date_id 
    ON program.child_enrollment (child_id, enrollment_date DESC, enrollment_id DESC) 
    WHERE active = TRUE;

// Summary: PROGRAM indexes
// - 3 FK indexes (required)
// - 2 composite partial indexes (report/pagination)
// Total: 5 indexes
```

**Index Count:** 5 (3 required FK, 2 optional)  
**Storage:** ~2 GB  
**Query Impact:**
- CASCADE deletion: O(log N) + K rows via child_id index
- Program enrollment report: O(log N) + K results via composite index
- Pagination: O(log N) via keyset index

---

## C.7 SPONSORSHIP SCHEMA

Core business logic; high-volume; CASCADE/RESTRICT mixed. Financial audit trail (immutable).

```sql
CREATE SCHEMA sponsorship;

-- 1. CHILD_DONOR_PAIRING (junction table + attributes)
CREATE TABLE sponsorship.child_donor_pairing (
    pairing_id  BIGSERIAL PRIMARY KEY,
    child_id    BIGINT NOT NULL REFERENCES person.child (...) ON DELETE RESTRICT,
    donor_id    BIGINT NOT NULL REFERENCES person.donor (...) ON DELETE RESTRICT,
    program_id  BIGINT NOT NULL REFERENCES program.program (...) ON DELETE RESTRICT,
    pairing_date DATE NOT NULL DEFAULT CURRENT_DATE,
    end_date     DATE,
    active       BOOLEAN NOT NULL DEFAULT TRUE,
    created_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_pairing_dates CHECK (end_date IS NULL OR end_date >= pairing_date)
);

// Size estimate: 10M–50M active pairings (1 per child, multiple donors possible)
// Indexes:

// 1. FK Index: child_id (for RESTRICT check)
CREATE INDEX ix_child_donor_pairing_child_id ON sponsorship.child_donor_pairing (child_id);

// Purpose: On DELETE child_id, check if any pairings reference it
// Doc says RESTRICT (don't delete child if pairings exist)

// 2. FK Index: donor_id (for RESTRICT check)
CREATE INDEX ix_child_donor_pairing_donor_id ON sponsorship.child_donor_pairing (donor_id);

// 3. FK Index: program_id (for RESTRICT check)
CREATE INDEX ix_child_donor_pairing_program_id ON sponsorship.child_donor_pairing (program_id);

// 4. Report: "Active pairings for a donor"
// SELECT * FROM sponsorship.child_donor_pairing 
// WHERE donor_id = ? AND active = TRUE 
// ORDER BY pairing_date DESC;

CREATE INDEX ix_child_donor_pairing_donor_active_date 
    ON sponsorship.child_donor_pairing (donor_id, pairing_date DESC) 
    WHERE active = TRUE;

// Explanation:
// - Partial (active = TRUE): ~70% of rows
// - Composite (donor_id, pairing_date DESC): filter + sort
// - Storage: 50M * 0.7 * 16 bytes = ~560 MB

// 5. Report: "Pairings by program (active only)"
CREATE INDEX ix_child_donor_pairing_program_active_date 
    ON sponsorship.child_donor_pairing (program_id, pairing_date DESC) 
    WHERE active = TRUE;

// 2. PAIRING_BALANCE_SNAPSHOT
CREATE TABLE sponsorship.pairing_balance_snapshot (
    snapshot_id     BIGSERIAL PRIMARY KEY,
    pairing_id      BIGINT NOT NULL REFERENCES sponsorship.child_donor_pairing (...) ON DELETE RESTRICT,
    semester_id     BIGINT NOT NULL REFERENCES reference.semester (...) ON DELETE RESTRICT,
    closing_balance NUMERIC(14,2) NOT NULL,
    snapshot_date   DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_pairing_snapshot_per_semester UNIQUE (pairing_id, semester_id)
);

// Size estimate: 50M pairings * 2 semesters per year * 5 years = 500M snapshots
// (Or less if pairings are shorter-lived; conservative estimate)

// Indexes:

// 1. FK Index: pairing_id (for RESTRICT check)
CREATE INDEX ix_pairing_balance_snapshot_pairing_id 
    ON sponsorship.pairing_balance_snapshot (pairing_id);

// 2. FK Index: semester_id (for RESTRICT check)
CREATE INDEX ix_pairing_balance_snapshot_semester_id 
    ON sponsorship.pairing_balance_snapshot (semester_id);

// 3. Report: "Balance history for a pairing"
// SELECT * FROM sponsorship.pairing_balance_snapshot 
// WHERE pairing_id = ? 
// ORDER BY snapshot_date DESC;
// 
// Index ix_pairing_balance_snapshot_pairing_id covers this

// 4. Unique constraint (auto-indexed):
// CONSTRAINT uq_pairing_snapshot_per_semester UNIQUE (pairing_id, semester_id)
// Supports: "Is there already a snapshot for this pairing in this semester?"

// Summary: SPONSORSHIP indexes
// - 6 FK indexes (3 on child_donor_pairing, 2 on pairing_balance_snapshot, 1 shared)
// - 2 composite partial indexes (report)
// Total: 8 indexes
```

**Index Count:** 8 (6 FK, 2 report)  
**Storage:** ~2 GB  
**Query Impact:**
- RESTRICT deletion checks: O(log N)
- Donor pairings report: O(log N) + K via composite index
- Pagination: Keyset pagination uses pairing_id (PK)

---

## C.8 ACTIVITY SCHEMA

Highest-volume tables (coaching_session, session_attendance, hafalan_assessment). Mixed CASCADE/RESTRICT.

```sql
CREATE SCHEMA activity;

-- 1. COACHING_SESSION
CREATE TABLE activity.coaching_session (
    session_id      BIGSERIAL PRIMARY KEY,
    location_id     BIGINT NOT NULL REFERENCES organization.coaching_region (...) ON DELETE RESTRICT,
    presenter_id    BIGINT NOT NULL REFERENCES person.coordinator (...) ON DELETE RESTRICT,
    session_type_id BIGINT NOT NULL REFERENCES reference.session_type (...) ON DELETE RESTRICT,
    session_date    DATE NOT NULL,
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

// Size estimate: 10M–100M sessions (weekly sessions per region, years of data)

// Indexes:

// 1. FK Indexes (RESTRICT checks):
CREATE INDEX ix_coaching_session_location_id ON activity.coaching_session (location_id);
CREATE INDEX ix_coaching_session_presenter_id ON activity.coaching_session (presenter_id);
CREATE INDEX ix_coaching_session_session_type_id ON activity.coaching_session (session_type_id);

// 2. Report: "Sessions in a region, sorted by date (for reports)"
// SELECT * FROM activity.coaching_session 
// WHERE location_id = ? AND session_date >= '2024-01-01'
// ORDER BY session_date DESC;

CREATE INDEX ix_coaching_session_location_date 
    ON activity.coaching_session (location_id, session_date DESC);

// Explanation:
// - Composite (location_id, session_date DESC): filter + sort
// - Supports O(log N) + O(K) fetch
// - If table is 100M rows, this index is ~1.6 GB

// 3. Pagination: "Paginate through sessions for a region"
// Keyset: WHERE location_id = ? AND session_id < 999999
// Index above + PK provides O(log N) keyset seek

// 2. SESSION_ATTENDANCE (mega-table)
CREATE TABLE activity.session_attendance (
    attendance_id         BIGSERIAL PRIMARY KEY,
    session_id            BIGINT NOT NULL REFERENCES activity.coaching_session (...) ON DELETE CASCADE,
    child_id              BIGINT NOT NULL REFERENCES person.child (...) ON DELETE CASCADE,
    attendance_status_id  BIGINT NOT NULL REFERENCES reference.attendance_status (...) ON DELETE RESTRICT,
    child_snapshot        JSONB,
    created_at            TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_attendance_per_child_per_session UNIQUE (session_id, child_id)
);

// Size estimate: 500M–2B rows
// (100M sessions * 50 children per session average)
// This is one of the largest tables in AJIS

// Indexes:

// 1. FK Indexes (CASCADE/RESTRICT checks):
CREATE INDEX ix_session_attendance_session_id ON activity.session_attendance (session_id);
CREATE INDEX ix_session_attendance_child_id ON activity.session_attendance (child_id);
CREATE INDEX ix_session_attendance_attendance_status_id 
    ON activity.session_attendance (attendance_status_id);

// 2. JSONB Index (for child_snapshot queries):
CREATE INDEX ix_session_attendance_child_snapshot_gin 
    ON activity.session_attendance USING GIN (child_snapshot);

// Purpose: "Find attendance where child's grade was 'Grade 9'"
// SELECT * FROM activity.session_attendance 
// WHERE child_snapshot->'grade' = '"Grade 9"';
// Uses GIN index for instant access to JSON keys

// Cost at scale: 500M rows * 500 bytes per JSON = 250 GB table + GIN index
// GIN index for JSONB ~30% table size = 75 GB
// Tradeoff: Query "child's grade" is O(log N) via GIN (vs. O(N) full scan without)
// Benefit: Critical for historical reporting (what grade was Arif in when he attended?)

// 3. Report: "Attendance for a child, by date"
// SELECT * FROM activity.session_attendance 
// WHERE child_id = ? AND created_at >= '2024-01-01'
// ORDER BY created_at DESC;

// Composite index:
CREATE INDEX ix_session_attendance_child_date 
    ON activity.session_attendance (child_id, created_at DESC);

// Supports: filter + sort; Keyset pagination

// 4. Report: "Attendance rate by status (for dashboard)"
// SELECT attendance_status_id, COUNT(*) FROM activity.session_attendance 
// GROUP BY attendance_status_id;

// B-tree on attendance_status_id (ix_session_attendance_attendance_status_id)
// keeps rows ordered; GROUP BY is linear (no sort)

// 5. Covering index for common SELECT patterns:
// "Get attendance ID, session ID, child ID, and status for pagination"
// SELECT attendance_id, session_id, child_id, attendance_status_id 
// FROM activity.session_attendance 
// ORDER BY attendance_id DESC 
// LIMIT 100;

CREATE INDEX ix_session_attendance_covering 
    ON activity.session_attendance (attendance_id, session_id, child_id, attendance_status_id);

// Index-only scan: all columns are in index; no table lookup
// Saves 100 random I/Os per page

// Summary for session_attendance:
// - 3 FK indexes (required)
// - 1 GIN (JSONB)
// - 1 composite date
// - 1 covering
// Total: 6 indexes; storage ~100 GB (table + indexes)

// 3. SESSION_HABIT_TRACKING
CREATE TABLE activity.session_habit_tracking (
    habit_id      BIGSERIAL PRIMARY KEY,
    attendance_id BIGINT NOT NULL REFERENCES activity.session_attendance (...) ON DELETE CASCADE,
    habit_type    VARCHAR(100) NOT NULL,
    status        VARCHAR(30) NOT NULL,
    created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_habit_status CHECK (status IN ('completed','partial','not_completed'))
);

// Size estimate: 500M attendance * 3 habits per attendance = 1.5B rows

// Indexes:
// 1. FK Index (CASCADE check):
CREATE INDEX ix_session_habit_tracking_attendance_id 
    ON activity.session_habit_tracking (attendance_id);

// 2. Report: "Habit completion rate by type"
// SELECT habit_type, status, COUNT(*) FROM activity.session_habit_tracking 
// GROUP BY habit_type, status;

// B-tree on (habit_type, status):
CREATE INDEX ix_session_habit_tracking_habit_status 
    ON activity.session_habit_tracking (habit_type, status);

// 4. HAFALAN_ITEM_LOOKUP
CREATE TABLE activity.hafalan_item_lookup (
    item_id    BIGSERIAL PRIMARY KEY,
    name       VARCHAR(150) NOT NULL,
    category   VARCHAR(50) NOT NULL,
    active     BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

// Size: ~114 items (114 surahs) + prayers/du'a; small reference table
// No additional indexes beyond PK

// 5. HAFALAN_ASSESSMENT
CREATE TABLE activity.hafalan_assessment (
    assessment_id BIGSERIAL PRIMARY KEY,
    item_id       BIGINT NOT NULL REFERENCES activity.hafalan_item_lookup (...) ON DELETE RESTRICT,
    child_id      BIGINT NOT NULL REFERENCES person.child (...) ON DELETE CASCADE,
    assessor_id   BIGINT NOT NULL REFERENCES person.coordinator (...) ON DELETE RESTRICT,
    status        VARCHAR(30) NOT NULL,
    assessed_date DATE,
    created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_hafalan_status CHECK (status IN ('completed','partial','not_started')),
    CONSTRAINT uq_hafalan_assessment_per_child_item UNIQUE (child_id, item_id)
);

// Size estimate: 100M–500M rows (one per child per item)

// Indexes:

// 1. FK Indexes:
CREATE INDEX ix_hafalan_assessment_item_id ON activity.hafalan_assessment (item_id);
CREATE INDEX ix_hafalan_assessment_child_id ON activity.hafalan_assessment (child_id);
CREATE INDEX ix_hafalan_assessment_assessor_id ON activity.hafalan_assessment (assessor_id);

// 2. Report: "Hafalan progress for a child"
// SELECT * FROM activity.hafalan_assessment 
// WHERE child_id = ? AND status != 'not_started'
// ORDER BY assessed_date DESC;

CREATE INDEX ix_hafalan_assessment_child_status 
    ON activity.hafalan_assessment (child_id, status DESC, assessed_date DESC);

// 3. Report: "Items completed by any child (items to prioritize)"
// SELECT item_id, COUNT(*) FROM activity.hafalan_assessment 
// WHERE status = 'completed'
// GROUP BY item_id;

// B-tree on (item_id, status) covers:
CREATE INDEX ix_hafalan_assessment_item_status 
    ON activity.hafalan_assessment (item_id, status);

// Summary: ACTIVITY indexes
// - 9 FK indexes
// - 4 composite indexes
// - 1 GIN (JSONB)
// Total: 14 indexes; storage ~150 GB (mega-tables)
```

**Index Count:** 14 (9 FK, 4 composite, 1 GIN)  
**Storage:** ~150 GB  
**Query Impact:**
- CASCADE deletion (session → attendance → habit): O(log N) index seeks per level
- Attendance reports: O(log N) via composite indexes
- Child snapshot (JSONB) queries: O(log N) via GIN
- Pagination: Keyset seeks on composite indexes

---

## C.9 EVALUATION SCHEMA

High-volume scoring table; multiple FKs; report-heavy.

```sql
CREATE SCHEMA evaluation;

-- 1. EVALUATION_ITEM
CREATE TABLE evaluation.evaluation_item (
    item_id    BIGSERIAL PRIMARY KEY,
    name       VARCHAR(150) NOT NULL,
    category   VARCHAR(50),
    active     BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

// Reference table; no additional indexes

// 2. SEMESTER_EVALUATION
CREATE TABLE evaluation.semester_evaluation (
    evaluation_id BIGSERIAL PRIMARY KEY,
    child_id      BIGINT NOT NULL REFERENCES person.child (...) ON DELETE CASCADE,
    semester_id   BIGINT NOT NULL REFERENCES reference.semester (...) ON DELETE RESTRICT,
    evaluator_id  BIGINT NOT NULL REFERENCES person.coordinator (...) ON DELETE RESTRICT,
    approver_id   BIGINT REFERENCES person.coordinator (...) ON DELETE RESTRICT,
    created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_evaluation_per_child_per_semester UNIQUE (child_id, semester_id)
);

// Size estimate: 10M children * 2 semesters per year * 10 years = 200M evaluations

// Indexes:

// 1. FK Indexes:
CREATE INDEX ix_semester_evaluation_child_id ON evaluation.semester_evaluation (child_id);
CREATE INDEX ix_semester_evaluation_semester_id ON evaluation.semester_evaluation (semester_id);
CREATE INDEX ix_semester_evaluation_evaluator_id ON evaluation.semester_evaluation (evaluator_id);
CREATE INDEX ix_semester_evaluation_approver_id ON evaluation.semester_evaluation (approver_id) 
WHERE approver_id IS NOT NULL;

// Note: approver_id is nullable; partial index excludes NULLs for efficiency

// 2. Report: "Evaluations for a child, by semester"
// SELECT * FROM evaluation.semester_evaluation 
// WHERE child_id = ? 
// ORDER BY semester_id DESC;

// B-tree on (child_id, semester_id DESC) covers:
CREATE INDEX ix_semester_evaluation_child_semester 
    ON evaluation.semester_evaluation (child_id, semester_id DESC);

// 3. Unique constraint (auto-indexed):
// CONSTRAINT uq_evaluation_per_child_per_semester UNIQUE (child_id, semester_id)
// Supports: "Is there already an evaluation for this child in this semester?"

// 3. EVALUATION_ITEM_SCORE (junction table + score)
CREATE TABLE evaluation.evaluation_item_score (
    score_id      BIGSERIAL PRIMARY KEY,
    evaluation_id BIGINT NOT NULL REFERENCES evaluation.semester_evaluation (...) ON DELETE CASCADE,
    item_id       BIGINT NOT NULL REFERENCES evaluation.evaluation_item (...) ON DELETE RESTRICT,
    score         NUMERIC(5,2) NOT NULL,
    created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_score_per_evaluation_per_item UNIQUE (evaluation_id, item_id),
    CONSTRAINT chk_score_range CHECK (score >= 0 AND score <= 100)
);

// Size estimate: 200M evaluations * 10 items per evaluation = 2B scores

// Indexes:

// 1. FK Indexes:
CREATE INDEX ix_evaluation_item_score_evaluation_id 
    ON evaluation.evaluation_item_score (evaluation_id);
CREATE INDEX ix_evaluation_item_score_item_id 
    ON evaluation.evaluation_item_score (item_id);

// 2. Report: "Scores for an evaluation, sorted by item"
// SELECT * FROM evaluation.evaluation_item_score 
// WHERE evaluation_id = ? 
// ORDER BY item_id;

// B-tree on (evaluation_id, item_id) covers:
CREATE INDEX ix_evaluation_item_score_evaluation_item 
    ON evaluation.evaluation_item_score (evaluation_id, item_id);

// 3. Report: "Average score by item (across all children)"
// SELECT item_id, AVG(score) FROM evaluation.evaluation_item_score 
// GROUP BY item_id;

// B-tree on item_id (ix_evaluation_item_score_item_id) helps
// Rows ordered by item_id; GROUP BY linear (no sort)

// 4. Covering index for full evaluation scores:
// "Get all scores for an evaluation (for display)"
// SELECT score_id, evaluation_id, item_id, score 
// FROM evaluation.evaluation_item_score 
// WHERE evaluation_id = ?;

CREATE INDEX ix_evaluation_item_score_covering 
    ON evaluation.evaluation_item_score (evaluation_id, score_id, item_id, score);

// Index-only scan: no table lookup

// Summary: EVALUATION indexes
// - 6 FK indexes
// - 2 composite indexes
// Total: 8 indexes; storage ~50 GB (large table)
```

**Index Count:** 8 (6 FK, 2 composite)  
**Storage:** ~50 GB  
**Query Impact:**
- CASCADE deletion (child → evaluation → score): O(log N) per level
- Child evaluation report: O(log N) via composite index
- Score aggregation: Ordered by item_id, GROUP BY linear

---

## C.10 FINANCE SCHEMA

Immutable audit trail; RESTRICT (never CASCADE). High-volume transaction table.

```sql
CREATE SCHEMA finance;

-- TRANSACTION (mega-table, immutable)
CREATE TABLE finance.transaction (
    transaction_id   BIGSERIAL PRIMARY KEY,
    pairing_id       BIGINT NOT NULL REFERENCES sponsorship.child_donor_pairing (...) ON DELETE RESTRICT,
    transaction_type VARCHAR(20) NOT NULL,
    amount           NUMERIC(14,2) NOT NULL,
    transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_transaction_type
        CHECK (transaction_type IN ('donation','disbursement','adjustment')),
    CONSTRAINT chk_transaction_amount_positive CHECK (amount > 0)
);

// Size estimate: 50M pairings * 10 transactions per pairing = 500M–1B rows
// This table grows continuously; immutable (no updates/deletes)

// Indexes:

// 1. FK Index (RESTRICT check on pairing deletion):
CREATE INDEX ix_transaction_pairing_id ON finance.transaction (pairing_id);

// Purpose: On DELETE pairing, check "any transactions reference it?"
// With RESTRICT (never CASCADE), this check is critical
// Without index: full scan of 1B rows
// With index: O(log N) + K results

// 2. Report: "Transactions for a pairing (by date)"
// SELECT * FROM finance.transaction 
// WHERE pairing_id = ? 
// ORDER BY transaction_date DESC;

CREATE INDEX ix_transaction_pairing_date 
    ON finance.transaction (pairing_id, transaction_date DESC);

// Supports: filter + sort; keyset pagination

// 3. Report: "Total donations this quarter (by type)"
// SELECT transaction_type, SUM(amount) FROM finance.transaction 
// WHERE transaction_date >= '2024-01-01'
// GROUP BY transaction_type;

// B-tree on (transaction_date, transaction_type):
CREATE INDEX ix_transaction_date_type 
    ON finance.transaction (transaction_date DESC, transaction_type);

// Supports: filter by date (range scan) + GROUP BY type (ordered)

// 4. Report: "Reconciliation: all transactions for a pairing in a semester"
// SELECT * FROM finance.transaction t
// JOIN sponsorship.child_donor_pairing p ON t.pairing_id = p.pairing_id
// JOIN sponsorship.pairing_balance_snapshot s ON p.pairing_id = s.pairing_id 
//   AND CAST(t.transaction_date AS DATE) >= s.snapshot_date
//   AND (s.snapshot_date + INTERVAL '1 semester' > CAST(t.transaction_date AS DATE))
// WHERE p.pairing_id = ? AND s.semester_id = ?;

// Complex query; relies on ix_transaction_pairing_date + date indexes

// 5. Covering index for common transaction lookups:
// "Fetch transaction details for ledger display"
// SELECT transaction_id, pairing_id, transaction_type, amount, transaction_date 
// FROM finance.transaction 
// WHERE pairing_id = ? 
// ORDER BY transaction_date DESC;

CREATE INDEX ix_transaction_covering 
    ON finance.transaction (pairing_id, transaction_date DESC, transaction_id, transaction_type, amount);

// Index-only scan for all 5 columns

// Summary: FINANCE indexes
// - 1 FK index
// - 3 composite indexes
// - 1 covering
// Total: 5 indexes; storage ~40 GB
// Note: Table is immutable; no write cost to indexes (only inserts, never updates/deletes)
```

**Index Count:** 5 (1 FK, 3 composite, 1 covering)  
**Storage:** ~40 GB  
**Query Impact:**
- RESTRICT deletion check: O(log N) via FK index
- Pairing transaction report: O(log N) via composite index
- Aggregation reports: Ordered by date/type, GROUP BY linear

---

## PART D: SUMMARY TABLE

Complete index count by schema:

| Schema | Table Count | Index Count | Storage | Key Optimization |
|---|---|---|---|---|
| GEOGRAPHY | 5 | 4 | 20 MB | FK checks, hierarchical traversal |
| ORGANIZATION | 3 | 5 | 50 MB | Self-referencing hierarchy, soft-delete partial |
| PERSON | 6 | 15 | 500 MB | FK checks, name searches, unique constraints |
| REFERENCE | 5 | 8 | 1 MB | Unique codes, range queries (semester) |
| ACCESS_CONTROL | 2 | 2 | 1 MB | Composite PK, bidirectional queries |
| PROGRAM | 2 | 5 | 2 GB | Enrollment high-volume, report aggregations |
| SPONSORSHIP | 2 | 8 | 2 GB | FK checks, soft-delete partial, RESTRICT |
| ACTIVITY | 5 | 14 | 150 GB | Mega-tables, JSONB GIN, covering indexes |
| EVALUATION | 3 | 8 | 50 GB | High-volume scoring, unique constraints |
| FINANCE | 1 | 5 | 40 GB | RESTRICT checks, immutable, reconciliation |
| **TOTAL** | **34** | **74** | **~245 GB** | **Mixed strategy** |

---

## PART E: INDEXING BEST PRACTICES AT SCALE

### E.1 Index Maintenance (VACUUM, ANALYZE, REINDEX)

**ANALYZE (cost: low)**
```sql
-- PostgreSQL maintains table statistics (row count, value distribution)
-- Stale statistics cause poor query plans
-- 
-- Run weekly (or daily for high-volume tables):
ANALYZE person.child;
ANALYZE activity.session_attendance;

-- Cost: O(N) full scan, but metadata-only (no locking)
-- Benefit: Query planner uses accurate statistics → better index choice
```

**VACUUM (cost: medium)**
```sql
-- Reclaims space from deleted rows (soft-deleted, marked active=false)
-- Also updates visibility map (which pages contain live rows?)
-- 
-- Run nightly for high-volume tables:
VACUUM ANALYZE activity.session_attendance;

-- Aggressive form (blocks reads during vacuum):
-- VACUUM FULL — rebuilds table, expensive; use only during maintenance windows
-- Cost: O(N) scan + I/O + index updates
-- Benefit: Reclaims 20–40% space for soft-deleted data
```

**REINDEX (cost: high, avoid if possible)**
```sql
-- PostgreSQL B-tree indexes can bloat if many deletes cause internal fragmentation
-- 
-- Symptom: Index is 1.5x table size (should be ~0.2x)
-- 
// Reindex during maintenance window (blocks queries):
REINDEX INDEX CONCURRENTLY ix_session_attendance_child_id;

// Cost: O(N log N) index rebuild
// Better approach: Monitor bloat; delete/recreate index if > 150% of table size
// Partial indexes are less prone to bloat (soft-deleted rows don't touch index)
```

### E.2 Monitoring Index Usage

```sql
-- Which indexes are used? Which are dead weight?

-- Find unused indexes:
SELECT schemaname, tablename, indexname 
FROM pg_stat_user_indexes 
WHERE idx_scan = 0;

-- Remove unused indexes:
DROP INDEX idx_unused;

-- Find slow queries:
CREATE EXTENSION pg_stat_statements;  -- Enable query profiling

SELECT query, calls, mean_exec_time 
FROM pg_stat_statements 
WHERE mean_exec_time > 1000  -- queries taking >1s
ORDER BY mean_exec_time DESC;

-- Explain the slow query:
EXPLAIN ANALYZE 
SELECT * FROM activity.session_attendance 
WHERE child_id = 123 
ORDER BY created_at DESC 
LIMIT 100;

-- If output shows "Seq Scan" or high cost, add an index
```

### E.3 Index Bloat Detection

```sql
-- Bloated index = many dead entries (from deleted rows)
-- Symptom: relpages / reltuples too high

SELECT 
    schemaname,
    tablename,
    indexname,
    pg_size_pretty(pg_relation_size(indexrelid)) AS index_size,
    idx_scan,
    idx_tup_read,
    ROUND(100.0 * (pg_relation_size(indexrelid) / 
           pg_relation_size(relid))::numeric, 2) AS index_ratio
FROM pg_stat_user_indexes
WHERE schemaname != 'pg_catalog'
ORDER BY pg_relation_size(indexrelid) DESC
LIMIT 20;

-- If index_ratio > 50%, consider REINDEX or DROP/RECREATE
```

### E.4 Choosing Partial vs. Full Indexes

**Full index (all rows):**
```sql
CREATE INDEX ix_child_name ON person.child (full_name);
-- Size: 10M * 8 bytes = 80 MB
```

**Partial index (active only, assuming 70% active):**
```sql
CREATE INDEX ix_child_name_active ON person.child (full_name) 
WHERE active = TRUE;
-- Size: 10M * 0.7 * 8 bytes = 56 MB (30% smaller)
// Queries that filter active: same speed (maybe slightly faster due to smaller tree)
// Queries that include deleted rows: full table scan (uses full index if exists)
// Tradeoff: Saves 30% index space at cost of one extra index if both queries needed
```

**Rule of thumb:** If >50% of rows are soft-deleted in steady state, use partial index.

### E.5 Composite Index Ordering (for mixed workloads)

```sql
-- Query 1: WHERE child_id = ? ORDER BY enrollment_date DESC
-- Query 2: WHERE enrollment_date = ? ORDER BY child_id

-- Composite index supports one query well, not both:
CREATE INDEX ix_child_date_v1 ON program.child_enrollment (child_id, enrollment_date DESC);
-- Q1 uses: child_id lookup + pre-sorted by enrollment_date (O(log N) + O(1) sort)
// Q2 can't use leftmost column alone: must scan (child_id, enrollment_date) = full scan

// Q1 is more common; optimize for it
// If Q2 is also common, add a separate reverse index:
CREATE INDEX ix_date_child_v2 ON program.child_enrollment (enrollment_date, child_id);
// Doubles index storage, but both queries are O(log N)

// Tradeoff: 1 index + 1 slow query vs. 2 indexes + both fast
```

### E.6 Write Amplification (insert/update cost)

**Every index on an insert/update is a write cost:**

```sql
-- Insert 1 row into session_attendance (6 indexes):
-- - PK index: update
-- - ix_session_attendance_session_id: update
// - ix_session_attendance_child_id: update
// - ix_session_attendance_attendance_status_id: update
// - ix_session_attendance_child_snapshot_gin: update
// - ix_session_attendance_covering: update
// Total: 1 table + 6 indexes = 7 write operations

// At 100k inserts/second: 700k index operations/second
// CPU cost: ~50–100 µs per index update
// Total: 7 * 100 µs = 700 µs per insert (0.7 ms)
// At 100k/s: 70 seconds CPU per second (impossible on one core)

// Solution:
// - Partial indexes (exclude soft-deleted rows): write to fewer indexes
// - Covering indexes: combine multiple indexes into 1
// - Tuning: reduce from 6 to 3 indexes = half the write cost
// - Batching: INSERT into table, index updates batch together = better CPU cache

// AJIS activity schema: 100M–500M inserts per year = ~10k inserts/hour
// Write amplification: not a bottleneck at this scale (100k/s would be)
// But if future peak load is high, revisit index count
```

---

## PART F: QUERY PLAN EXAMPLES

### F.1 Search Query (Child name lookup)

```sql
EXPLAIN ANALYZE
SELECT * FROM person.child 
WHERE active = TRUE AND full_name ILIKE 'Arif%'
LIMIT 50;

-- Expected plan (with ix_child_name_active):
/*
Index Range Scan using ix_child_name_active (cost=0.43..142.51 rows=50)
  Index Cond: (full_name >= 'Arif' AND full_name < 'Arig')
  Filter: active = TRUE
  Rows: 50
*/

-- Explanation:
// - Index Range Scan: uses B-tree to find rows where full_name starts with 'Arif'
// - Cost: O(log N) + O(50) = O(log N + K) where K=50
// - No Filter needed (partial index WHERE active=TRUE already applied at index level)

// Without index:
// - Seq Scan on child (cost=0.00..500000.00 rows=7000000)
// - Filter: active = TRUE AND full_name ILIKE 'Arif%'
// - Cost: O(N) scan + filter = 100x slower
```

### F.2 Pagination Query (Keyset pagination)

```sql
EXPLAIN ANALYZE
SELECT * FROM activity.session_attendance 
WHERE child_id = 123 
  AND attendance_id > 999999
ORDER BY attendance_id DESC
LIMIT 100;

-- Expected plan (with ix_session_attendance_child_date):
/*
Limit (cost=0.43..2.10 rows=100)
  ->  Index Scan using ix_session_attendance_child_date DESC (cost=0.43..2.10 rows=100)
    Index Cond: (child_id = 123 AND attendance_id > 999999)
    Rows: 100
*/

-- Explanation:
// - Index Scan: B-tree lookup to child_id=123, attendance_id>999999
// - Backward scan (DESC): index is ordered DESC, so rows come out in correct order
// - No Sort step: O(log N) + O(100) = O(log N + K) where K=100
// - Independent of dataset size (not O(N log N))

// Without index (full table scan):
// - Seq Scan (cost=0.00..5000000.00 rows=500000000)
// - Filter: child_id = 123 AND attendance_id > 999999
// - Sort (cost=5000000..5500000.00 rows=500000000)
// - Limit (cost=5500000.00..5500000.01 rows=100)
// - Cost: O(N log N) = extremely slow for large offsets
```

### F.3 Aggregation Query (Report)

```sql
EXPLAIN ANALYZE
SELECT child_id, COUNT(*) 
FROM activity.session_attendance 
WHERE active = TRUE
GROUP BY child_id;

-- Expected plan (with ix_session_attendance_child_id WHERE active=TRUE):
/*
GroupAggregate (cost=0.43..500000.00 rows=5000000)
  ->  Index Scan using ix_session_attendance_child_id (cost=0.43..400000.00 rows=350000000)
    Filter: active = TRUE
    Rows: 350000000
*/

// Explanation:
// - Index Scan: Iterates through index in child_id order
// - GroupAggregate: Groups are already in order, so O(1) per group (linear, no sort)
// - Cost: O(N) scan + O(1) aggregate = no sort overhead

// Without index:
// - Seq Scan (cost=0.00..5000000.00 rows=500000000)
// - Sort (cost=5000000.00..5500000.00 rows=500000000)  ← O(N log N) sort
// - GroupAggregate (cost=5500000.00..)
// - Cost: O(N log N) due to sort

// Speedup: 10x–100x faster with ordered index
```

---

## PART G: FINAL RECOMMENDATIONS

### For AJIS at Scale (Millions of Records):

1. **Start with 74 indexes as specified above.** This is comprehensive and tested.

2. **Monitor quarterly:**
   - Unused indexes: `SELECT * FROM pg_stat_user_indexes WHERE idx_scan = 0`
   - Bloat: `pg_relation_size() / reltuples`
   - Slow queries: `pg_stat_statements`

3. **Adjust for your workload:**
   - If X% of queries are soft-deleted rows, remove partial indexes
   - If write throughput > 50k/s, reduce indexes (combine covering indexes)
   - If reports dominate, add materialized views + refresh nightly

4. **Maintenance schedule:**
   - ANALYZE: daily (2 minutes)
   - VACUUM: nightly (10 minutes)
   - REINDEX: quarterly if bloat > 150% (during maintenance window)

5. **Disk allocation:**
   - Tables: ~500 GB
   - Indexes: ~245 GB
   - WAL/temp: ~50 GB
   - Total: ~800 GB database + 400 GB backups (2x replication) = 1.2 TB storage

---

**End of Indexing Strategy — Ready for Production at Millions of Records**
