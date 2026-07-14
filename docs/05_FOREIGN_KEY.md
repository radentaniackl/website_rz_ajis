# AJIS Foreign Key Relationship Design
## Complete Foreign Key Architecture with Cascade, Restrict, and Null Rules

**Database:** AJIS (Normalized PostgreSQL)  
**Scope:** All 30+ core tables and their relationships  
**Purpose:** Define referential integrity constraints, cascade behaviors, and null handling  
**Date:** July 14, 2026

---

## TABLE OF CONTENTS

1. [Relationship Type Fundamentals](#fundamentals)
2. [Cascade, Restrict, and Null Rules](#rules-explained)
3. [Geography Schema Relationships](#geography)
4. [Organization Schema Relationships](#organization)
5. [Person Schema Relationships](#person)
6. [Reference Schema Relationships](#reference)
7. [Access Control Relationships](#access-control)
8. [Program Schema Relationships](#program)
9. [Sponsorship Schema Relationships](#sponsorship)
10. [Activity Schema Relationships](#activity)
11. [Evaluation Schema Relationships](#evaluation)
12. [Finance Schema Relationships](#finance)
13. [Temporal Relationships](#temporal)
14. [Relationship Matrix](#matrix)

---

## RELATIONSHIP TYPE FUNDAMENTALS {#fundamentals}

### What is a Foreign Key (FK)?

A **Foreign Key** is a column (or set of columns) in one table that references the primary key of another table. It enforces **referential integrity** — ensures that every value in the FK column exists as a primary key in the referenced table (or is NULL if allowed).

---

### Three Fundamental Relationship Types

#### **1. ONE-TO-ONE (1:1) Relationship**

**Definition:** Each row in Table A corresponds to exactly one row in Table B, and vice versa.

**Characteristics:**
- Child table has a unique constraint on the FK (ensures one-to-one)
- Can be implemented as:
  - **Option A (Preferred):** FK in child table with UNIQUE constraint
  - **Option B (Less Common):** Separate junction table with FKs to both tables (overcomplicates 1:1)

**Visual:**
```
Employee (1) ────── (1) EmployeePhoto

Each employee has exactly one photo.
Each photo belongs to exactly one employee.
```

**AJIS Example:**
```
person.coordinator (1) ────── (0:1) person.system_user

One coordinator has zero or one login account.
One account belongs to one coordinator.
```

**When to Use 1:1:**
- Splitting a wide table (too many columns) into two tables for readability
- Separating frequently-accessed data from rarely-accessed data (performance optimization)
- Representing optional relationships (employee may or may not have office)

**When to Avoid 1:1:**
- If the relationship is truly optional, consider keeping entities in one table
- If one table doesn't exist without the other, they should probably be one table

---

#### **2. ONE-TO-MANY (1:M) Relationship**

**Definition:** Each row in the parent table can correspond to zero, one, or many rows in the child table. But each row in the child table corresponds to exactly one row in the parent table.

**Characteristics:**
- FK in child table (many side)
- FK is NOT required to be unique (same FK value can appear multiple times)
- FK is typically NOT NULL (hard constraint: every child belongs to exactly one parent)

**Visual:**
```
Office (1) ────────── (M) Child

One office has zero, one, or many children.
Each child belongs to exactly one office.
```

**AJIS Examples:**
```
person.child (1) ────────── (M) activity.session_attendance
"One child attends many sessions."

organization.coaching_region (1) ────────── (M) activity.coaching_session
"One region hosts many coaching sessions."

geography.province (1) ────────── (M) geography.district
"One province contains many districts."
```

**Cardinality Notation:**
- `(0..1)` — zero or one (optional)
- `(1..1)` — exactly one (required)
- `(0..M)` — zero or many
- `(1..M)` — one or many

**When to Use 1:M:**
- Master-detail relationships (office has many employees)
- Hierarchical data (parent category has many subcategories)
- Any repeating attribute that should be a separate table

---

#### **3. MANY-TO-MANY (N:M) Relationship**

**Definition:** Each row in Table A can correspond to many rows in Table B, and vice versa.

**Characteristics:**
- Cannot be implemented directly with FKs in either table
- Requires a **junction table** (associative table) with FKs to both tables
- Junction table's primary key is typically composite (both FKs together)
- Each FK in junction table is usually NOT NULL (both sides required)

**Visual:**
```
Student (M) ────────── (M) Course
                         │
                    (implemented via)
                         │
                  Enrollment (junction)
                         │
          (FK: student_id, course_id)
```

**AJIS Example:**
```
person.child (M) ────────────────── (M) person.donor
                        │
                   (implemented via)
                        │
        sponsorship.child_donor_pairing (junction)

One child can have multiple donors (different time periods, programs).
One donor can sponsor multiple children.
```

**Another AJIS Example:**
```
evaluation.evaluation_item (M) ────────────────── (M) evaluation.semester_evaluation
                                       │
                                  (implemented via)
                                       │
           evaluation.evaluation_item_score (junction)

One evaluation item can appear in many evaluations (across multiple semesters).
One evaluation can have many items scored.
```

**When to Use N:M:**
- Student enrollment in multiple courses
- Donors sponsoring multiple children
- Products in multiple orders
- Skills associated with multiple employees

**When to Avoid N:M:**
- If the relationship is really 1:M (e.g., order items should be OrderDetail, not a N:M relationship)
- If the junction table has only the two FKs and no other attributes (consider if 1:M instead)
- If the relationship changes rarely and would be better served by a simpler structure

---

## CASCADE, RESTRICT, AND NULL RULES {#rules-explained}

When a row in a parent table is deleted or modified, **what happens to child rows that reference it?** This is controlled by referential action rules.

### Referential Action Rules (Delete Actions)

There are **five main options** for what happens when a referenced row is deleted:

---

#### **RULE 1: CASCADE**

**Behavior:** When a parent row is deleted, **automatically delete all child rows** that reference it.

**Use Case:** Data where children are meaningless without parent.

**Example 1 — Delete Child:**
```
Table: person.child
Table: person.family_member (FK: child_id)

If child is deleted:
  - Cascade: Delete all family_member rows for that child
  
Rationale: Family member records only exist because of a child; 
           no point keeping "Father: Budi" with no associated child.
```

**Example 2 — Delete Session:**
```
Table: activity.coaching_session
Table: activity.session_attendance (FK: session_id)

If session is deleted:
  - Cascade: Delete all session_attendance rows for that session
  
Rationale: Attendance records only meaningful with session; 
           deleting session means we no longer track who attended.
```

**Example 3 — Delete Sponsorship Pairing:**
```
Table: sponsorship.child_donor_pairing
Table: finance.transaction (FK: pairing_id)

If pairing is deleted:
  - Cascade: Delete all transaction rows for that pairing
  
BUT: This might be dangerous! You're destroying financial audit trail.
     Better choice: RESTRICT (see below).
```

**Risks:**
- ⚠️ **Irreversible:** Cascade deletes cannot be undone (data is gone)
- ⚠️ **Silent deletion:** User deletes parent; child data vanishes without warning
- ⚠️ **Surprising side effects:** One delete ripples through many tables

**Safety Considerations:**
- Use CASCADE only for dependent data (children couldn't exist without parent)
- Use CASCADE carefully for transactional data (financial records should rarely cascade)
- Always ensure database backups before operations with cascade
- Consider soft deletes (mark as deleted, don't physically delete) for important data

---

#### **RULE 2: RESTRICT (Stricter Variant: NO ACTION)**

**Behavior:** When a parent row is deleted, **prevent the deletion if any child rows reference it**. Error is raised; transaction is rejected.

**Difference from NO ACTION:** 
- RESTRICT checks immediately when DELETE is issued
- NO ACTION checks at end of transaction (allows deferred checking)
- In practice, PostgreSQL treats them identically for most use cases

**Use Case:** Data where parent-child relationship must be preserved; parent cannot be deleted if children exist.

**Example 1 — Delete Province:**
```
Table: geography.province
Table: geography.district (FK: province_id)

If user tries to delete province "Jawa Barat":
  - RESTRICT: Error raised if any districts reference this province
  - Message: "Cannot delete province; 27 districts depend on it"
  
Rationale: Geographic reference data should never be deleted; 
           RESTRICT prevents accidental deletion.
```

**Example 2 — Delete Coordinator:**
```
Table: person.coordinator
Table: activity.coaching_session (FK: presenter_id)

If user tries to delete a coordinator:
  - RESTRICT: Error raised if coordinator presented any sessions
  - Message: "Cannot delete coordinator; 45 sessions reference them"
  
Rationale: Coordinator is part of audit trail; sessions should keep reference
           to who conducted them (for historical accuracy).
```

**Example 3 — Delete Evaluation Item:**
```
Table: evaluation.evaluation_item
Table: evaluation.evaluation_item_score (FK: item_id)

If user tries to delete an evaluation item:
  - RESTRICT: Error raised if any scores reference this item
  
Rationale: Historical evaluations should preserve what they were graded on;
           changing item definitions would corrupt historical data.
```

**Advantages:**
- ✅ **Safe:** Prevents data loss; requires explicit cleanup before deletion
- ✅ **Intentional:** User must acknowledge children exist and handle them
- ✅ **Audit trail:** Nothing disappears unexpectedly

**Disadvantages:**
- ❌ User cannot delete parent without first handling children (manual work)
- ❌ Requires app logic to delete/reassign children before deleting parent

---

#### **RULE 3: SET NULL**

**Behavior:** When a parent row is deleted, **set the FK column to NULL** in all child rows (orphaning them).

**Prerequisite:** FK column must be **nullable** (allow NULL values).

**Use Case:** Optional relationships where child can exist without parent.

**Example 1 — Delete Coordinator (from their account):**
```
Table: person.coordinator
Table: person.system_user (FK: coordinator_id, NULLABLE)

If coordinator is deleted:
  - SET NULL: Set system_user.coordinator_id = NULL for their account
  - Result: User account exists but is no longer linked to that coordinator
  
Rationale: Coordinator may leave, but user account might be repurposed or archived.
           No need to delete the account; just orphan it.
```

**Example 2 — Delete Evaluator/Approver:**
```
Table: person.coordinator
Table: evaluation.semester_evaluation (FK: approver_id, NULLABLE)

If coordinator who approved an evaluation is deleted:
  - SET NULL: Set approver_id = NULL
  - Result: Evaluation still exists; just marked "approved by (nobody)"
  
Rationale: Historical evaluation should remain; approver reference becomes empty.
```

**Example 3 — Delete Donor (but keep pairing history):**
```
Table: person.donor
Table: sponsorship.child_donor_pairing (FK: donor_id, NULLABLE)

If donor is deleted:
  - SET NULL: Set child_donor_pairing.donor_id = NULL
  - Result: Pairing exists but shows "Child X was matched to (deleted donor)"
  
Rationale: Audit trail preserved; donor identity optional if we just need to know
           "a pairing existed."
```

**BUT: Is this the right choice?**

Let's reconsider. If donor is deleted:
- **Option A (SET NULL):** Pairing becomes "(Child) was matched to (?)"  — unclear, poor UX
- **Option B (RESTRICT):** Must reassign pairing or close it explicitly  — better audit trail
- **Option C (CASCADE):** Delete pairing (better for clean data)  — depends on business rules

**Advantages:**
- ✅ Prevents data loss (child row not deleted)
- ✅ Allows flexible deletion (parent can be deleted without touching children)
- ✅ Good for audit trails (keeps record, just orphans it)

**Disadvantages:**
- ❌ Creates "orphaned" rows (children without valid parent)
- ❌ Queries must handle NULL: `WHERE coordinator_id IS NOT NULL`
- ❌ Can lead to data integrity issues (queries forget to check for NULL)

---

#### **RULE 4: SET DEFAULT**

**Behavior:** When a parent row is deleted, **set the FK column to a default value** in all child rows.

**Use Case:** Rare; useful for replacing a row with a system default.

**Example:**
```
Table: organization.office
Table: person.child (FK: office_id, DEFAULT = 1)

If an office is deleted:
  - SET DEFAULT: Set child.office_id = 1 (assuming office_id=1 is "Unknown" or "Unassigned")
  - Result: All children become unassigned to specific office
  
Rationale: Keeps data structure intact; reassigns to default value.
```

**Rarely Used in AJIS:**
- Most data doesn't have meaningful defaults
- Risk: All orphaned rows assigned to default, losing info about which office they were in
- Prefer RESTRICT or SET NULL for clarity

---

#### **RULE 5: NO ACTION** (Already Covered Above)

**Behavior:** Similar to RESTRICT; prevents deletion if children exist.

**Difference:** Checked at transaction end (deferred); RESTRICT checked immediately.

**In Practice:** PostgreSQL treats these the same; use RESTRICT for clarity.

---

### NULL Rules (Nullable vs. NOT NULL on FKs)

An FK column can be:

#### **NOT NULL (Hard Constraint)**

**Behavior:** FK column must always have a value; NULL is not allowed.

**Consequence on Delete:** Parent deletion must use CASCADE or RESTRICT (cannot SET NULL).

**Use Case:** Relationships where child cannot exist without parent.

**AJIS Examples:**
```
person.family_member.child_id (NOT NULL)
  → Every family member must belong to a child
  → If child deleted, must CASCADE (delete family) or RESTRICT

activity.session_attendance.session_id (NOT NULL)
  → Every attendance record must belong to a session
  → If session deleted, must CASCADE (delete attendance) or RESTRICT

finance.transaction.pairing_id (NOT NULL)
  → Every transaction must belong to a pairing
  → If pairing deleted, must CASCADE (delete transaction) or RESTRICT
```

**Advantages:**
- ✅ Enforces data integrity: no orphaned rows
- ✅ Queries don't need to check for NULL
- ✅ Clearer data model (child always has parent)

**Disadvantages:**
- ❌ Parent cannot be deleted without handling children

---

#### **NULLABLE (Soft Constraint)**

**Behavior:** FK column can be NULL; means "not linked to any parent."

**Consequence on Delete:** Parent deletion can use CASCADE, RESTRICT, SET NULL, or SET DEFAULT.

**Use Case:** Optional relationships where child can exist without parent.

**AJIS Examples:**
```
person.system_user.coordinator_id (NULLABLE)
  → A system account may or may not belong to a coordinator
  → Donor, admin, or other role accounts don't need coordinator reference
  → If coordinator deleted, can SET NULL (account still exists, just orphaned)

evaluation.semester_evaluation.approver_id (NULLABLE)
  → An evaluation may or may not have been approved yet
  → If approver (coordinator) deleted, can SET NULL

person.household_member.effective_to (NULLABLE)
  → Household member may still be current (no end date)
  → NULL means "still current as of today"
  → If person deleted, can set to current date or delete the row
```

**Advantages:**
- ✅ Flexible: relationships can be optional
- ✅ Parent can be deleted with SET NULL (no cascade needed)
- ✅ Supports temporal/nullable semantics

**Disadvantages:**
- ❌ Orphaned rows possible (confusing data)
- ❌ Queries must check `WHERE col IS NOT NULL` (verbose)
- ❌ Easier to miss data (NULL vs. foreign key)

---

## GEOGRAPHY SCHEMA RELATIONSHIPS {#geography}

All relationships in the geography schema are **hierarchical** (parent-child geographic divisions). These relationships should **rarely change** and data should **rarely be deleted**.

---

### Relationship 1: Province → District

**Relationship Type:** ONE-TO-MANY (1:M)

**Tables:**
- Parent: `geography.province` (e.g., "Jawa Barat")
- Child: `geography.district` (e.g., "Bandung", "Cimahi", "Depok")

**Cardinality:**
- One province contains ONE or MANY districts
- Each district belongs to exactly ONE province
- Notation: `province (1) ────── (M) district`

**FK Details:**
```
district.province_id (FK)
  → References: province.province_id (PK)
  → Nullable: NO (every district must have a province)
  → Unique: NO (multiple districts can have same province)
  → Delete Rule: RESTRICT
```

**Why NOT NULL:**
- A district cannot exist geographically without being part of a province
- Data integrity: Prevents orphaned districts

**Why RESTRICT (not CASCADE):**
- Geographic reference data is immutable and should never be deleted
- Deleting a province would orphan districts (bad practice)
- RESTRICT prevents accidental deletion; requires explicit administrative action
- If deletion needed, should be done through archival process, not cascade

**When Would This Be Deleted?**
- Rarely, if ever
- Administrative cleanup of test data
- Should trigger warning in UI: "Deleting province will orphan 27 districts"

**Related Constraints (Additional):**
- `province.province_id` has UNIQUE constraint (no duplicate provinces)
- `district.name` should be UNIQUE within `province_id` (no two districts with same name in one province)

---

### Relationship 2: District → Subdistrict (Kecamatan)

**Relationship Type:** ONE-TO-MANY (1:M)

**Tables:**
- Parent: `geography.district` (e.g., "Bandung")
- Child: `geography.subdistrict` (e.g., "Bandung Tengah", "Bandung Utara")

**Cardinality:**
```
district (1) ────── (M) subdistrict
```

**FK Details:**
```
subdistrict.district_id (FK)
  → References: district.district_id (PK)
  → Nullable: NO (every subdistrict must have a district)
  → Unique: NO
  → Delete Rule: RESTRICT
```

**Why RESTRICT:**
- Same reasoning as province → district
- Geographic hierarchy should not be deleted
- If administrative boundary changes, should be handled through versioning, not deletion

---

### Relationship 3: Subdistrict → Village (Desa)

**Relationship Type:** ONE-TO-MANY (1:M)

**Tables:**
- Parent: `geography.subdistrict` (e.g., "Bandung Tengah")
- Child: `geography.village` (e.g., "Padasuka", "Cibeureum")

**Cardinality:**
```
subdistrict (1) ────── (M) village
```

**FK Details:**
```
village.subdistrict_id (FK)
  → References: subdistrict.subdistrict_id (PK)
  → Nullable: NO
  → Unique: NO
  → Delete Rule: RESTRICT
```

---

### Relationship 4: Village → Location

**Relationship Type:** ONE-TO-MANY (1:M)

**Tables:**
- Parent: `geography.village` (e.g., "Padasuka")
- Child: `geography.location` (e.g., specific street addresses within village)

**Cardinality:**
```
village (1) ────── (M) location

One village can have multiple specific locations (many street addresses).
Each location (typically) belongs to one village.
```

**FK Details:**
```
location.village_id (FK)
  → References: village.village_id (PK)
  → Nullable: YES (location might only have street address, not village-level specificity)
  → Unique: NO
  → Delete Rule: RESTRICT (or SET NULL if nullable)
```

**Why NULLABLE?**
- A location might be known only at street level without specific village
- Or addresses stored only as full text (e.g., "Jl. Sudirman No. 123, Bandung")
- Geographic precision might be incomplete in data

**What if Village is Deleted?**
- RESTRICT: Prevents deletion if any locations reference village
- Alternative: SET NULL (if nullable) — orphans location, marking village_id as unknown

---

### Summary: Geography Cascade Diagram

```
Province
  └─ RESTRICT ─→ District
               └─ RESTRICT ─→ Subdistrict
                           └─ RESTRICT ─→ Village
                                       └─ RESTRICT (or SET NULL) ─→ Location

All rules are RESTRICT because geographic data should not be deleted.
Nullable only at leaf level (Location) to handle incomplete data.
```

---

## ORGANIZATION SCHEMA RELATIONSHIPS {#organization}

Organization schema represents the institutional structure: offices, regions, and facilities.

---

### Relationship 1: Office → Office (Hierarchy)

**Relationship Type:** ONE-TO-MANY with SELF-REFERENCE (1:M)

**Tables:**
- Parent: `organization.office` (e.g., "RZ Pusat" / Head Office)
- Child: `organization.office` (e.g., "RZ Jawa Barat" / Regional Office)

**Cardinality:**
```
Office (1) ────── (M) Office (child offices)

One office can have many child offices (organizational hierarchy).
Each office has at most one parent office (unless it's the root).
```

**Visual Hierarchy:**
```
RZ Pusat (root, parent_office_id = NULL)
├── RZ Jawa Barat (parent_office_id = RZ Pusat)
│   ├── RZ Cimahi (parent_office_id = RZ Jawa Barat)
│   ├── RZ Bandung (parent_office_id = RZ Jawa Barat)
│   └── RZ Subang (parent_office_id = RZ Jawa Barat)
├── RZ Jawa Tengah (parent_office_id = RZ Pusat)
│   └── RZ Solo (parent_office_id = RZ Jawa Tengah)
└── etc.
```

**FK Details:**
```
office.parent_office_id (FK to office.office_id)
  → References: office.office_id (PK, self-reference)
  → Nullable: YES (root office has no parent)
  → Unique: NO (siblings can have same parent)
  → Delete Rule: RESTRICT
```

**Why NULLABLE:**
- Root office (head office) has no parent
- Some offices might be independent (not part of hierarchy)

**Why RESTRICT (not CASCADE):**
- Deleting a parent office would cascade-delete all child offices (entire branch disappears!)
- Too dangerous; would hide reorganization
- Better: RESTRICT requires explicit handling:
  - Reassign children to different parent
  - Mark office as inactive (soft delete)
  - Then delete when safe

**Example Deletion Scenario:**
```
User wants to delete "RZ Cimahi" office.

Constraint Check: RESTRICT
  → Does any office reference this as parent_office_id? 
  → If YES: Error "Cannot delete RZ Cimahi; it has 3 child branches"
  → User must: Reassign children, mark inactive, or archive

Result: Explicit decision required; no accidental deletion of entire branches.
```

**Alternative Design:**
- Instead of deleting, mark office as `active = false` (soft delete)
- This preserves hierarchy while removing from active use
- Queries filter WHERE office.active = true

---

### Relationship 2: Office → Coaching Region

**Relationship Type:** ONE-TO-MANY (1:M)

**Tables:**
- Parent: `organization.office` (e.g., "RZ Cimahi")
- Child: `organization.coaching_region` (e.g., "Cimahi Tengah_Padasuka")

**Cardinality:**
```
office (1) ────── (M) coaching_region

One office operates many coaching regions.
Each coaching region belongs to exactly one office.
```

**FK Details:**
```
coaching_region.office_id (FK)
  → References: office.office_id (PK)
  → Nullable: NO (every region must have an office)
  → Unique: NO
  → Delete Rule: RESTRICT (or CASCADE with caution)
```

**Why NOT NULL:**
- A coaching region must be operated by some office
- No orphaned regions

**Why RESTRICT (not CASCADE):**
- Deleting an office shouldn't silently delete all regions
- Better: RESTRICT requires:
  - Reassign regions to another office
  - Archive regions
  - Mark regions as inactive

**Alternative: CASCADE**
- Could cascade if policy is "office deletion = retire all its regions"
- Less safe; recommend RESTRICT instead

**Why Not Use Soft Delete Instead?**
- Office.active = false
- Coaching_region.active = false
- Query with WHERE active = true
- Preserves historical data; no need for cascade logic

---

### Relationship 3: Office → Facility

**Relationship Type:** ONE-TO-MANY (1:M)

**Tables:**
- Parent: `organization.office`
- Child: `organization.facility` (e.g., "SD Juara Cimahi", "SMK Peternakan Subang")

**Cardinality:**
```
office (1) ────── (M) facility

One office manages many facilities (schools, centers).
Each facility belongs to one office.
```

**FK Details:**
```
facility.office_id (FK)
  → References: office.office_id (PK)
  → Nullable: NO
  → Unique: NO
  → Delete Rule: RESTRICT (or CASCADE with caution)
```

**Why RESTRICT:**
- Facilities may have educational value; shouldn't be silently deleted
- Should be explicitly archived or closed

---

## PERSON SCHEMA RELATIONSHIPS {#person}

Person schema represents individuals: children, family members, coordinators, donors, and system users.

---

### Relationship 1: Child → Family Member

**Relationship Type:** ONE-TO-MANY (1:M)

**Tables:**
- Parent: `person.child` (e.g., "Arif")
- Child: `person.family_member` (Father: "Budi", Mother: "Siti", Guardian: "Ummu Salma")

**Cardinality:**
```
child (1) ────── (M) family_member

One child has one or many family members (father, mother, guardian, siblings).
Each family member record belongs to exactly one child.
```

**FK Details:**
```
family_member.child_id (FK)
  → References: child.child_id (PK)
  → Nullable: NO (every family member record must reference a child)
  → Unique: NO (one child can have multiple family members)
  → Delete Rule: CASCADE
```

**Why CASCADE:**
- Family member records only exist because of a child
- If child is deleted, their family member data should be deleted
- No point keeping "Father: Budi" with child_id = NULL

**Rationale for Cascade (Not Restrict):**
```
Scenario 1: Delete child record
  - Option A (RESTRICT):
    User cannot delete child until all family member records are manually deleted
    Requires: DELETE family_member WHERE child_id = X; then DELETE child WHERE child_id = X;
    Tedious; two operations
  
  - Option B (CASCADE):
    User deletes child; all family member records automatically deleted
    Result: One operation; data stays clean (no orphaned family records)
    
Conclusion: CASCADE is appropriate here. Family member records are dependent data.
```

**Soft Delete Alternative:**
- Instead of physical delete, mark child as inactive: `child.active = false`
- Mark family_member records as inactive: `family_member.active = false`
- Queries filter WHERE active = true
- Historical data preserved; no cascade needed

---

### Relationship 2: Child → Household Member

**Relationship Type:** ONE-TO-MANY (1:M)

**Tables:**
- Parent: `person.child`
- Child: `person.household_member` (e.g., "Grandmother", "Aunt Siti")

**Cardinality:**
```
child (1) ────── (M) household_member
```

**FK Details:**
```
household_member.child_id (FK)
  → References: child.child_id (PK)
  → Nullable: NO
  → Unique: NO
  → Delete Rule: CASCADE
```

**Same Reasoning as Family Member:**
- Household member records only meaningful with a child
- Cascade on delete is appropriate

---

### Relationship 3: Coordinator → System User

**Relationship Type:** ONE-TO-ONE (1:1)

**Tables:**
- Parent: `person.coordinator` (the actual person: name, phone, office)
- Child: `person.system_user` (the login account: username, password)

**Cardinality:**
```
coordinator (1) ────── (0:1) system_user

One coordinator has zero or one login account.
One account belongs to at most one coordinator.
(Some coordinators might not have system access; some accounts might be admin/system accounts)
```

**FK Details:**
```
system_user.coordinator_id (FK)
  → References: coordinator.coordinator_id (PK)
  → Nullable: YES (account may not be linked to a coordinator; e.g., admin account)
  → Unique: YES (each coordinator has at most one account; each account belongs to at most one coordinator)
  → Delete Rule: SET NULL
```

**Why UNIQUE Constraint:**
- Enforces one-to-one: no two accounts per coordinator, no two coordinators per account
- Without UNIQUE, would become one-to-many (one coordinator could have multiple accounts)

**Why NULLABLE:**
- Not every account is for a coordinator
- Accounts might exist for:
  - System admin (super user)
  - Donors (self-service portal)
  - Future users not yet assigned
- Coordinators might exist without accounts (offline volunteers)

**Why SET NULL (not CASCADE or RESTRICT):**
- If coordinator is deleted, their account should remain (for audit trail, audit logs)
- Set coordinator_id = NULL (orphan the account)
- Account can be archived or reassigned

**Alternative Rules Considered:**
```
Option A (CASCADE):
  - Delete coordinator → delete their system_user account
  - Problem: Loses login history; audit trail incomplete
  - Not recommended for auth data

Option B (RESTRICT):
  - Delete coordinator → error if account exists
  - Problem: Cannot delete coordinator without deleting account first
  - Extra manual step
  - Reasonable but less flexible

Option C (SET NULL) ✅ CHOSEN
  - Delete coordinator → set coordinator_id = NULL
  - Account remains orphaned; can be kept for audit
  - Clean separation: coordinator deletion doesn't affect auth system
  - Recommended
```

---

### Relationship 4: Donor → System User (Optional Portal Access)

**Relationship Type:** ONE-TO-ZERO-OR-ONE (1:0..1)

**Tables:**
- Parent: `person.donor`
- Child: `person.system_user`

**Cardinality:**
```
donor (0:1) ←──→ (0:1) system_user

A donor may or may not have a portal account.
A system_user account may or may not be for a donor.
```

**FK Details:**
```
system_user.donor_id (FK)
  → References: donor.donor_id (PK)
  → Nullable: YES (not all accounts are for donors)
  → Unique: YES (at most one account per donor; at most one donor per account)
  → Delete Rule: SET NULL
```

**Why SET NULL:**
- If donor is deleted, their account can be orphaned (keeps audit trail)
- Or can be marked as inactive separately
- Separation of concerns: donor deletion doesn't cascade to auth system

---

### System User Relationships (Both FK Constraints)

**Summary:**
```
system_user table has TWO optional FKs:
  - coordinator_id (NULLABLE, UNIQUE, SET NULL)
  - donor_id (NULLABLE, UNIQUE, SET NULL)

Constraint: At least one must be NOT NULL
(Every account must belong to either a coordinator or donor; or be a system account)

This could be enforced with a CHECK constraint in database:
  CHECK (coordinator_id IS NOT NULL OR donor_id IS NOT NULL OR role_id IN ('admin', 'system'))
```

---

## REFERENCE SCHEMA RELATIONSHIPS {#reference}

Reference schema contains lookup tables and enumerations. All relationships here are ONE-TO-MANY (parent provides valid values; children reference those values).

---

### Pattern: Lookup Table → Child Tables

**General Structure for All Reference Lookups:**

```
Reference Lookup Table (1) ────── (M) Tables Using That Reference

Example:
  session_type (1) ────── (M) coaching_session
  attendance_status (1) ────── (M) session_attendance
  welfare_category (1) ────── (M) child_enrollment
  semester (1) ────── (M) semester_evaluation
  role (1) ────── (M) system_user
```

---

### Relationship 1: Session Type → Coaching Session

**Relationship Type:** ONE-TO-MANY (1:M)

**Tables:**
- Parent: `reference.session_type` (e.g., "Reguler", "Edukasi Pekanan", "P3A", "Parenting")
- Child: `activity.coaching_session`

**Cardinality:**
```
session_type (1) ────── (M) coaching_session

One session type can apply to many sessions (many "Reguler" sessions).
Each session has exactly one type.
```

**FK Details:**
```
coaching_session.session_type_id (FK)
  → References: session_type.session_type_id (PK)
  → Nullable: NO (every session must have a type)
  → Unique: NO
  → Delete Rule: RESTRICT
```

**Why RESTRICT (not CASCADE):**
- Cannot delete a session type if sessions of that type exist
- Example: "Cannot delete 'Reguler' session type; 500 sessions are type 'Reguler'"
- Must be handled explicitly:
  - Migrate sessions to different type
  - Mark session type as inactive (soft delete)
  - Then delete

**Soft Delete Alternative:**
```
session_type.active = false

Queries filter: WHERE session_type.active = true
No need to delete; just retire the type.
```

---

### Relationship 2: Attendance Status → Session Attendance

**Relationship Type:** ONE-TO-MANY (1:M)

**Tables:**
- Parent: `reference.attendance_status` ("Hadir" / Present, "Izin" / Excused, "Alfa" / Absent)
- Child: `activity.session_attendance`

**Cardinality:**
```
attendance_status (1) ────── (M) session_attendance
```

**FK Details:**
```
session_attendance.attendance_status_id (FK)
  → References: attendance_status.attendance_status_id (PK)
  → Nullable: NO (every attendance must have a status)
  → Unique: NO
  → Delete Rule: RESTRICT
```

**Why RESTRICT:**
- Historical attendance data should preserve what status was recorded
- Cannot delete a status type if any attendance records use it

---

### Relationship 3: Welfare Category → Child Enrollment

**Relationship Type:** ONE-TO-MANY (1:M)

**Tables:**
- Parent: `reference.welfare_category` (e.g., "Yatim", "Piatu", "Dhuafa")
- Child: `program.child_enrollment`

**Cardinality:**
```
welfare_category (1) ────── (M) child_enrollment
```

**FK Details:**
```
child_enrollment.welfare_category_id (FK)
  → References: welfare_category.welfare_category_id (PK)
  → Nullable: NO (every child has a welfare category)
  → Unique: NO
  → Delete Rule: RESTRICT
```

---

### Relationship 4: Semester → Semester Evaluation

**Relationship Type:** ONE-TO-MANY (1:M)

**Tables:**
- Parent: `reference.semester` (e.g., "Ganjil 2024", "Genap 2024")
- Child: `evaluation.semester_evaluation`

**Cardinality:**
```
semester (1) ────── (M) semester_evaluation

One semester can have many evaluations (one per child per semester).
Each evaluation belongs to one semester.
```

**FK Details:**
```
semester_evaluation.semester_id (FK)
  → References: semester.semester_id (PK)
  → Nullable: NO (every evaluation must reference a semester)
  → Unique: NO
  → Delete Rule: RESTRICT
```

**Why RESTRICT:**
- Semesters are historical reference points; should not be deleted if evaluations reference them
- Deleting "Ganjil 2024" would orphan all evaluations from that semester

---

### Relationship 5: Role → System User

**Relationship Type:** ONE-TO-MANY (1:M)

**Tables:**
- Parent: `reference.role` (e.g., "Super Admin", "Branch Admin", "Coordinator")
- Child: `person.system_user`

**Cardinality:**
```
role (1) ────── (M) system_user

One role can be assigned to many users.
Each user has exactly one role.
```

**FK Details:**
```
system_user.role_id (FK)
  → References: role.role_id (PK)
  → Nullable: NO (every user must have a role)
  → Unique: NO
  → Delete Rule: RESTRICT
```

**Why RESTRICT:**
- Cannot delete a role if users are assigned to it
- Must reassign users to different role first

---

### Summary: Reference Schema Cascade Rules

```
All reference lookup tables use RESTRICT on FK delete.

Rationale:
  - Reference data should not be deleted if used by operational data
  - Should use soft delete (active = false) instead
  - Or explicitly handle the dependency before deleting

Benefits:
  - Prevents orphaned child rows
  - Forces explicit decision-making
  - Supports audit trail
```

---

## ACCESS CONTROL RELATIONSHIPS {#access-control}

---

### Relationship: Role → Role Permission

**Relationship Type:** ONE-TO-MANY (1:M)

**Tables:**
- Parent: `access_control.role`
- Child: `access_control.role_permission` (junction table linking role to permission)

**Cardinality:**
```
role (1) ────── (M) role_permission

One role can have many permissions.
Each role-permission assignment belongs to one role.
```

**FK Details:**
```
role_permission.role_id (FK)
  → References: role.role_id (PK)
  → Nullable: NO
  → Unique: NO (role can have multiple permissions)
  → Delete Rule: CASCADE
```

**Why CASCADE:**
- Permission assignments are attributes of the role
- If role is deleted, its permissions should be deleted
- No point keeping "role_permission: Super Admin → Read Child" when Super Admin role is deleted

---

### Relationship: Permission → Role Permission

**Relationship Type:** ONE-TO-MANY (1:M)

**Tables:**
- Parent: `access_control.permission` (e.g., "read_child", "edit_child", "delete_child")
- Child: `access_control.role_permission`

**Cardinality:**
```
permission (1) ────── (M) role_permission

One permission can be assigned to many roles.
Each role-permission assignment references one permission.
```

**FK Details:**
```
role_permission.permission_id (FK)
  → References: permission.permission_id (PK)
  → Nullable: NO
  → Unique: NO
  → Delete Rule: RESTRICT
```

**Why RESTRICT (not CASCADE):**
- Cannot delete a permission if roles have it
- Must remove permission from all roles first
- Example: "Cannot delete 'read_child' permission; 5 roles have it"
- Explicit removal required; prevents accidental permission loss

---

## PROGRAM SCHEMA RELATIONSHIPS {#program}

---

### Relationship: Program → Child Enrollment

**Relationship Type:** ONE-TO-MANY (1:M)

**Tables:**
- Parent: `program.program` (e.g., "Anak Juara", "IJGS", "Other Programs")
- Child: `program.child_enrollment`

**Cardinality:**
```
program (1) ────── (M) child_enrollment

One program can enroll many children.
Each enrollment belongs to one program.
```

**FK Details:**
```
child_enrollment.program_id (FK)
  → References: program.program_id (PK)
  → Nullable: NO (every enrollment must be in a program)
  → Unique: NO
  → Delete Rule: RESTRICT
```

**Why RESTRICT:**
- Cannot delete a program if children are enrolled
- Must close/archive the program or reassign children to different program

---

### Relationship: Child → Child Enrollment

**Relationship Type:** ONE-TO-MANY (1:M)

**Tables:**
- Parent: `person.child`
- Child: `program.child_enrollment`

**Cardinality:**
```
child (1) ────── (M) child_enrollment

One child can be enrolled in multiple programs (sequentially or simultaneously).
Example: "Arif was in Anak Juara program (2023-2024), then IJGS program (2024)"

Each enrollment belongs to one child.
```

**FK Details:**
```
child_enrollment.child_id (FK)
  → References: child.child_id (PK)
  → Nullable: NO (every enrollment must reference a child)
  → Unique: NO (child can have multiple enrollments)
  → Delete Rule: CASCADE
```

**Why CASCADE:**
- Enrollment records only exist because of a child
- If child is deleted, their enrollment records should be deleted
- No point keeping "Child: Arif was enrolled in Anak Juara" when child is deleted

**Soft Delete Alternative:**
```
child_enrollment.active = false (mark as inactive, don't delete)
child.active = false (mark child as deleted, preserve record)

Queries: WHERE child.active = true AND child_enrollment.active = true
```

---

## SPONSORSHIP SCHEMA RELATIONSHIPS {#sponsorship}

This schema contains the most critical business logic: matching children to donors.

---

### Relationship 1: Child ← → Donor (N:M Through Junction Table)

**Relationship Type:** MANY-TO-MANY (N:M)

**Entities:**
- `person.child` (many children)
- `person.donor` (many donors)
- `sponsorship.child_donor_pairing` (junction table)

**Cardinality:**
```
                child (M)
                   │
                   │ (via child_id FK)
                   ↓
        child_donor_pairing (junction)
                   ↑
                   │ (via donor_id FK)
                   │
                donor (M)

One child can be paired with multiple donors (over time, different programs).
One donor can sponsor multiple children.
```

**Real-World Example:**
```
Child: Arif
  - Paired with Donor: Bapak Joko (2023-2024) — individual sponsorship
  - Paired with Donor: PT ABC Corp (2024) — corporate sponsorship
  
Donor: Bapak Joko
  - Sponsoring Child: Arif (2023-2024)
  - Sponsoring Child: Budi (2024)
  - Sponsoring Child: Citra (2024)
```

**FK Details:**

```
child_donor_pairing.child_id (FK)
  → References: child.child_id (PK)
  → Nullable: NO (every pairing must reference a child)
  → Unique: NO (child can have multiple pairings)
  → Delete Rule: CASCADE (or RESTRICT, see discussion below)

child_donor_pairing.donor_id (FK)
  → References: donor.donor_id (PK)
  → Nullable: NO (every pairing must reference a donor)
  → Unique: NO (donor can have multiple pairings)
  → Delete Rule: CASCADE (or RESTRICT, see discussion below)

child_donor_pairing.program_id (FK)
  → References: program.program_id (PK)
  → Nullable: NO (every pairing is in a program)
  → Unique: NO
  → Delete Rule: RESTRICT
```

---

### Delete Rule Decision: CASCADE vs. RESTRICT for Child Deletion

**Scenario: Child is Deleted**

**Option A (CASCADE):**
```
User deletes child "Arif"
  → child_donor_pairing rows are CASCADE deleted
  → finance.transaction rows are CASCADE deleted (via pairing FK)
  
Result: All sponsorship history, financial records are erased
  
Problem: You've lost the audit trail
  "Who did Arif sponsor with? How much did they donate?"
  Answer is gone forever.
```

**Option B (RESTRICT):**
```
User deletes child "Arif"
  → Error: "Cannot delete child; 2 active sponsorships reference this child"
  
User must:
  - Mark child as inactive: child.active = false
  - Or close pairings: child_donor_pairing.active = false
  - Then data preserved; audit trail intact
```

**Option C (Soft Delete + Inactive Status):**
```
Instead of physical delete, use logical delete:
  - child.active = false
  - child_donor_pairing.active = false (or set end_date)
  - finance.transaction is never deleted (immutable)

Queries: WHERE child.active = true
Result: Data preserved; no cascade complications
```

**Recommendation: RESTRICT (or use soft delete)**

**Why Not CASCADE:**
- Sponsorship is a financial relationship
- Deleting child shouldn't erase financial audit trail
- Violates accounting best practices (never delete transactions)

---

### Delete Rule Decision: CASCADE vs. RESTRICT for Donor Deletion

**Scenario: Donor is Deleted (e.g., donor account closed)**

**Option A (CASCADE):**
```
User deletes donor "Bapak Joko"
  → All child_donor_pairing rows deleted
  → All finance.transaction rows deleted
  
Result: Financial records erased; audit trail lost
  
Problem: Regulatory/accounting violation
```

**Option B (RESTRICT):**
```
User deletes donor
  → Error: "Cannot delete donor; 5 active sponsorships reference this donor"
  
User must:
  - Mark donor inactive: donor.active = false
  - Or close pairings explicitly: pairing.active = false
  - Data preserved
```

**Recommendation: RESTRICT (or use soft delete)**

---

### Final Sponsorship Relationships Design

```
child_donor_pairing:
  - child_id (FK to child, NOT NULL, DELETE → RESTRICT)
  - donor_id (FK to donor, NOT NULL, DELETE → RESTRICT)
  - program_id (FK to program, NOT NULL, DELETE → RESTRICT)
  - pairing_date (date)
  - active (boolean)
  - end_date (date, nullable, when pairing was closed)

finance.transaction:
  - pairing_id (FK to child_donor_pairing, NOT NULL, DELETE → CASCADE)
  - transaction_type (enum: donation, disbursement, adjustment)
  - amount (decimal)
  - transaction_date (date)

pairing_balance_snapshot:
  - pairing_id (FK to child_donor_pairing, NOT NULL, DELETE → RESTRICT)
  - semester_id (FK to semester, NOT NULL, DELETE → RESTRICT)
  - closing_balance (decimal)
  - snapshot_date (date)
```

**Cascade Rules Summary:**
- Delete child → RESTRICT (don't orphan pairings; use soft delete)
- Delete donor → RESTRICT (don't orphan pairings; use soft delete)
- Delete pairing → CASCADE delete transactions (transactional detail)
- Delete transaction → N/A (should never delete; immutable audit trail)

---

### Relationship 2: Program → Child Donor Pairing

**Relationship Type:** ONE-TO-MANY (1:M)

**Tables:**
- Parent: `program.program`
- Child: `sponsorship.child_donor_pairing`

**Cardinality:**
```
program (1) ────── (M) child_donor_pairing

One program can have many child-donor pairings.
Each pairing belongs to one program.
```

**FK Details:**
```
child_donor_pairing.program_id (FK)
  → References: program.program_id (PK)
  → Nullable: NO
  → Unique: NO
  → Delete Rule: RESTRICT
```

**Why RESTRICT:**
- Cannot delete a program if pairings reference it
- Pairings are historical; should be preserved

---

### Relationship 3: Child Donor Pairing → Pairing Balance Snapshot

**Relationship Type:** ONE-TO-MANY (1:M)

**Tables:**
- Parent: `sponsorship.child_donor_pairing`
- Child: `sponsorship.pairing_balance_snapshot`

**Cardinality:**
```
child_donor_pairing (1) ────── (M) pairing_balance_snapshot

One pairing can have many snapshots (one per semester).
Each snapshot belongs to one pairing.
```

**FK Details:**
```
pairing_balance_snapshot.pairing_id (FK)
  → References: child_donor_pairing.pairing_id (PK)
  → Nullable: NO
  → Unique: NO (pairing can have multiple snapshots, one per semester)
  → Delete Rule: RESTRICT
```

**Why RESTRICT:**
- Snapshots are audit trail (official reconciliations)
- Should not be deleted; should remain for compliance

---

## ACTIVITY SCHEMA RELATIONSHIPS {#activity}

Activity schema contains coaching sessions, attendance records, habit tracking, and memorization assessments.

---

### Relationship 1: Coaching Region → Coaching Session

**Relationship Type:** ONE-TO-MANY (1:M)

**Tables:**
- Parent: `organization.coaching_region` (e.g., "Cimahi Tengah_Padasuka")
- Child: `activity.coaching_session`

**Cardinality:**
```
coaching_region (1) ────── (M) coaching_session

One region hosts many coaching sessions.
Each session is held in one region.
```

**FK Details:**
```
coaching_session.location_id (FK to coaching_region)
  → References: coaching_region.region_id (PK)
  → Nullable: NO (every session must be held in a region)
  → Unique: NO
  → Delete Rule: RESTRICT
```

**Why RESTRICT:**
- Cannot delete a region if sessions were held there
- Sessions are historical records; should not be deleted

---

### Relationship 2: Coordinator → Coaching Session (Presenter)

**Relationship Type:** ONE-TO-MANY (1:M)

**Tables:**
- Parent: `person.coordinator`
- Child: `activity.coaching_session`

**Cardinality:**
```
coordinator (1) ────── (M) coaching_session

One coordinator can present many sessions.
Each session has one coordinator presenting.
```

**FK Details:**
```
coaching_session.presenter_id (FK)
  → References: coordinator.coordinator_id (PK)
  → Nullable: NO (every session must have a presenter)
  → Unique: NO
  → Delete Rule: RESTRICT
```

**Why RESTRICT:**
- Sessions record who presented; should preserve that history
- Cannot delete a coordinator if they presented sessions
- Mark coordinator as inactive instead

---

### Relationship 3: Coaching Session ← → Child (N:M Through Attendance)

**Relationship Type:** MANY-TO-MANY (N:M)

**Entities:**
- `activity.coaching_session`
- `person.child`
- `activity.session_attendance` (junction)

**Cardinality:**
```
                session (M)
                   │
                   │ (via session_id FK)
                   ↓
           session_attendance (junction)
                   ↑
                   │ (via child_id FK)
                   │
                 child (M)

One session has many children attending.
One child attends many sessions.
```

**Real Example:**
```
Session: "Reguler Session 2024-01-15, Region Cimahi"
  Attendees:
    - Child: Arif (Hadir)
    - Child: Budi (Izin)
    - Child: Citra (Alfa)

Child: Arif
  Sessions attended:
    - 2024-01-15 (Hadir)
    - 2024-01-22 (Hadir)
    - 2024-01-29 (Izin)
    - [20+ more sessions]
```

**FK Details:**

```
session_attendance.session_id (FK)
  → References: coaching_session.session_id (PK)
  → Nullable: NO (every attendance record belongs to a session)
  → Unique: NO (session can have many children)
  → Delete Rule: CASCADE

session_attendance.child_id (FK)
  → References: child.child_id (PK)
  → Nullable: NO (every attendance record belongs to a child)
  → Unique: NO (child can attend many sessions)
  → Delete Rule: CASCADE
```

**Why CASCADE for session_id:**
- Attendance records only exist because of a session
- If session is deleted, attendance records should be deleted
- No point keeping "Child Arif attended session (deleted session)" 

**Why CASCADE for child_id:**
- Attendance records only exist because of a child
- If child is deleted, their attendance should be deleted

**Soft Delete Alternative:**
```
session_attendance.active = false
child.active = false

Queries: WHERE session_attendance.active = true AND child.active = true
```

---

### Relationship 4: Session Attendance → Session Habit Tracking

**Relationship Type:** ONE-TO-MANY (1:M)

**Tables:**
- Parent: `activity.session_attendance`
- Child: `activity.session_habit_tracking`

**Cardinality:**
```
session_attendance (1) ────── (M) session_habit_tracking

One attendance record can have many habit items tracked.
(E.g., same attendance, tracked habits: prayed, recited, gave charity)
Each habit record belongs to one attendance.
```

**FK Details:**
```
session_habit_tracking.attendance_id (FK)
  → References: session_attendance.attendance_id (PK)
  → Nullable: NO
  → Unique: NO (one attendance can have multiple habit records)
  → Delete Rule: CASCADE
```

**Why CASCADE:**
- Habit records are detail of attendance record
- If attendance is deleted, habits should be deleted

---

### Relationship 5: Hafalan Item ← → Child (N:M Through Assessment)

**Relationship Type:** MANY-TO-MANY (N:M)

**Entities:**
- `activity.hafalan_item_lookup` (114 Quran surahs + prayers + du'a)
- `person.child`
- `activity.hafalan_assessment` (junction)

**Cardinality:**
```
                item (M)
                   │
                   │ (via item_id FK)
                   ↓
          hafalan_assessment (junction)
                   ↑
                   │ (via child_id FK)
                   │
                 child (M)

One item can be assessed for many children.
One child can be assessed on many items.
```

**Real Example:**
```
Item: "Al-Fatihah" (Surah 1)
  Assessments:
    - Child: Arif (Completed, 2024-01-15)
    - Child: Budi (Partial, 2024-01-20)
    - Child: Citra (Not started, null)

Child: Arif
  Items assessed:
    - Al-Fatihah (Completed)
    - Al-Baqarah (Partial)
    - Adzan (Completed)
    - [+ more items]
```

**FK Details:**

```
hafalan_assessment.item_id (FK)
  → References: hafalan_item_lookup.item_id (PK)
  → Nullable: NO (every assessment must reference an item)
  → Unique: NO
  → Delete Rule: RESTRICT (or CASCADE, see discussion)

hafalan_assessment.child_id (FK)
  → References: child.child_id (PK)
  → Nullable: NO (every assessment must reference a child)
  → Unique: NO
  → Delete Rule: CASCADE
```

---

### Delete Rule Decision: Item Deletion

**Scenario: Hafalan item is deleted (e.g., item was added by mistake)**

**Option A (RESTRICT):**
```
User tries to delete item "Surah 99"
  → Error: "Cannot delete; 120 children have been assessed on this item"
  
User must:
  - Mark item as inactive: hafalan_item_lookup.active = false
  - Queries filter WHERE active = true
  
Result: Historical data preserved
```

**Option B (CASCADE):**
```
User deletes item "Surah 99"
  → All hafalan_assessment records deleted
  
Result: Loses assessment history
Problem: Erases progress tracking for 120 children
```

**Recommendation: RESTRICT (don't delete)**

**Rationale:**
- Hafalan items are reference data (fixed list)
- Should not be deleted if assessments exist
- Use soft delete (active = false) instead
- Preserves historical assessment records

---

### Delete Rule Decision: Child Deletion (Hafalan)

**Why CASCADE:**
- If child is deleted, their hafalan assessments should be deleted
- No point keeping "Child Arif was assessed on Surah 1" when child is deleted

---

### Relationship 6: Coordinator → Hafalan Assessment (Assessor)

**Relationship Type:** ONE-TO-MANY (1:M)

**Tables:**
- Parent: `person.coordinator`
- Child: `activity.hafalan_assessment`

**Cardinality:**
```
coordinator (1) ────── (M) hafalan_assessment

One coordinator can assess many children's hafalan.
Each assessment is done by one coordinator.
```

**FK Details:**
```
hafalan_assessment.assessor_id (FK)
  → References: coordinator.coordinator_id (PK)
  → Nullable: NO (every assessment must have an assessor)
  → Unique: NO
  → Delete Rule: RESTRICT
```

**Why RESTRICT:**
- Assessments are historical records; should preserve who assessed
- Cannot delete a coordinator if they assessed children

---

## EVALUATION SCHEMA RELATIONSHIPS {#evaluation}

Evaluation schema contains semester evaluations and their item-by-item scores.

---

### Relationship 1: Evaluation Item → Evaluation Item Score

**Relationship Type:** ONE-TO-MANY (1:M)

**Tables:**
- Parent: `evaluation.evaluation_item` (e.g., "Hafalan Quran", "Akhlak", "Prestasi Akademik")
- Child: `evaluation.evaluation_item_score`

**Cardinality:**
```
evaluation_item (1) ────── (M) evaluation_item_score

One item can appear in many evaluations.
Each score record references one item.
```

**FK Details:**
```
evaluation_item_score.item_id (FK)
  → References: evaluation_item.item_id (PK)
  → Nullable: NO (every score must reference an item)
  → Unique: NO
  → Delete Rule: RESTRICT
```

**Why RESTRICT:**
- Evaluation items are reference data; should not be deleted
- Historical evaluations must preserve which items were scored
- Use soft delete (active = false) instead

---

### Relationship 2: Semester Evaluation ← → Evaluation Item (N:M Through Scores)

**Relationship Type:** MANY-TO-MANY (N:M)

**Entities:**
- `evaluation.semester_evaluation`
- `evaluation.evaluation_item`
- `evaluation.evaluation_item_score` (junction)

**Cardinality:**
```
          evaluation (M)
                │
                │ (via evaluation_id FK)
                ↓
       evaluation_item_score (junction)
                ↑
                │ (via item_id FK)
                │
               item (M)

One evaluation scores multiple items.
One item type is scored in multiple evaluations (across different semesters/children).
```

**Real Example:**
```
Evaluation: "Arif's Semester 1 Evaluation"
  Scores:
    - Item: Hafalan Quran → Score: 80
    - Item: Akhlak → Score: 75
    - Item: Prestasi Akademik → Score: 85

Item: "Akhlak"
  Scored in evaluations:
    - Arif, Ganjil 2024 → 75
    - Budi, Ganjil 2024 → 80
    - Citra, Ganjil 2024 → 70
    - Arif, Genap 2024 → 78
    - [+ many more]
```

---

### Relationship 3: Child → Semester Evaluation

**Relationship Type:** ONE-TO-MANY (1:M)

**Tables:**
- Parent: `person.child`
- Child: `evaluation.semester_evaluation`

**Cardinality:**
```
child (1) ────── (M) semester_evaluation

One child has one evaluation per semester.
Each evaluation belongs to one child.
```

**FK Details:**
```
semester_evaluation.child_id (FK)
  → References: child.child_id (PK)
  → Nullable: NO (every evaluation must reference a child)
  → Unique: NO (combined with semester_id, should be unique: one evaluation per child per semester)
  → Delete Rule: CASCADE
  → NOTE: Should also have UNIQUE constraint: (child_id, semester_id) to enforce one evaluation per semester per child
```

**Why CASCADE:**
- Evaluations only exist because of a child
- If child is deleted, evaluations should be deleted

**Additional Constraint:**
```
UNIQUE (child_id, semester_id)

Ensures: One child can only have one evaluation per semester
Prevents: Multiple "Ganjil 2024" evaluations for same child
```

---

### Relationship 4: Semester → Semester Evaluation

**Relationship Type:** ONE-TO-MANY (1:M)

**Tables:**
- Parent: `reference.semester` (e.g., "Ganjil 2024", "Genap 2024")
- Child: `evaluation.semester_evaluation`

**Cardinality:**
```
semester (1) ────── (M) semester_evaluation

One semester can have many evaluations (one per child).
Each evaluation belongs to one semester.
```

**FK Details:**
```
semester_evaluation.semester_id (FK)
  → References: semester.semester_id (PK)
  → Nullable: NO
  → Unique: NO
  → Delete Rule: RESTRICT
```

**Why RESTRICT:**
- Cannot delete a semester if evaluations reference it
- Semesters are historical reference points
- Evaluations are tied to specific semesters; should preserve that relationship

---

### Relationship 5: Coordinator → Semester Evaluation (Evaluator & Approver)

**Relationship Type:** ONE-TO-MANY (1:M) for both roles

**Tables:**
- Parent: `person.coordinator`
- Child: `evaluation.semester_evaluation`

**Cardinality:**
```
coordinator (1) ────── (M) semester_evaluation (as evaluator)
coordinator (1) ────── (M) semester_evaluation (as approver, optional)

One coordinator can evaluate many children.
One coordinator can approve many evaluations.
Each evaluation has one evaluator; may or may not be approved.
```

**FK Details:**

```
semester_evaluation.evaluator_id (FK)
  → References: coordinator.coordinator_id (PK)
  → Nullable: NO (every evaluation must have an evaluator)
  → Unique: NO
  → Delete Rule: RESTRICT

semester_evaluation.approver_id (FK)
  → References: coordinator.coordinator_id (PK)
  → Nullable: YES (evaluation may not be approved yet)
  → Unique: NO
  → Delete Rule: RESTRICT (or SET NULL, see discussion)
```

---

### Delete Rule Decision: Approver Coordinator Deletion

**Scenario: Coordinator who approved an evaluation is deleted**

**Option A (RESTRICT):**
```
User tries to delete coordinator who approved evaluations
  → Error: "Cannot delete; coordinator has approved 50 evaluations"
  
User must:
  - Leave approver_id intact (historical record)
  - Mark coordinator as inactive
  
Result: Data preserved; cannot delete
```

**Option B (SET NULL):**
```
User deletes coordinator
  → Set approver_id = NULL for their approvals
  
Result: Evaluation still exists; approval reference is lost
  Problem: Loses who approved it; unclear history
```

**Recommendation: RESTRICT (don't delete)**

**Rationale:**
- Approvals are audit trail
- Should preserve who approved what
- Mark coordinator as inactive instead (soft delete)

---

### Relationship 6: Semester Evaluation → Evaluation Item Score

**Relationship Type:** ONE-TO-MANY (1:M)

**Tables:**
- Parent: `evaluation.semester_evaluation`
- Child: `evaluation.evaluation_item_score`

**Cardinality:**
```
semester_evaluation (1) ────── (M) evaluation_item_score

One evaluation has many item scores.
Each score belongs to one evaluation.
```

**FK Details:**
```
evaluation_item_score.evaluation_id (FK)
  → References: semester_evaluation.evaluation_id (PK)
  → Nullable: NO
  → Unique: NO (one evaluation can have many item scores)
  → Delete Rule: CASCADE
```

**Why CASCADE:**
- Scores are detail of an evaluation
- If evaluation is deleted, scores should be deleted

---

## FINANCE SCHEMA RELATIONSHIPS {#finance}

Finance schema contains all financial transactions tied to sponsorships.

---

### Relationship: Child Donor Pairing → Transaction

**Relationship Type:** ONE-TO-MANY (1:M)

**Tables:**
- Parent: `sponsorship.child_donor_pairing`
- Child: `finance.transaction`

**Cardinality:**
```
child_donor_pairing (1) ────── (M) finance.transaction

One pairing can have many transactions (donations, disbursements, adjustments).
Each transaction belongs to one pairing.
```

**FK Details:**
```
transaction.pairing_id (FK)
  → References: child_donor_pairing.pairing_id (PK)
  → Nullable: NO (every transaction must belong to a pairing)
  → Unique: NO (pairing can have many transactions)
  → Delete Rule: RESTRICT (NOT CASCADE)
```

**Why RESTRICT (Never CASCADE):**
```
Accounting Principle: Never delete financial transactions (immutable audit trail)

Example of why CASCADE is WRONG:
  User deletes sponsorship pairing "Arif-Bapak Joko"
    → Cascade deletes all transactions for that pairing
    → Deletes donation record: "Bapak Joko donated Rp 1,000,000 on 2024-01-01"
    
Result: Financial audit trail is erased
  - Where did the money go?
  - How much was donated?
  - When?
  All gone. Violates accounting standards.

With RESTRICT:
  User tries to delete pairing
    → Error: "Cannot delete pairing; 15 transactions reference it"
    → User must mark pairing as inactive (logical delete)
    → Transactions remain (immutable record)
```

**Best Practice:**
- Transactions are immutable; never delete them
- Use logical deletion: `pairing.active = false` (soft delete)
- Queries filter: WHERE pairing.active = true
- Transaction history always preserved

---

## TEMPORAL RELATIONSHIPS {#temporal}

Some entities need to track history as they change over time.

---

### Temporal Pattern: Effective Dates

**Implementation:**
```
TABLE: entity_version
  - entity_id (PK)
  - version_id (PK)
  - [attribute columns]
  - effective_from (date)
  - effective_to (date, NULLABLE if current)
  - created_at
  - created_by
```

**Example: Child Education History**
```
TABLE: person.child_education (temporal)
  - child_id (FK to person.child)
  - education_level (enum)
  - grade
  - school_id (FK to organization.facility)
  - effective_from (date when entered this grade)
  - effective_to (date when exited, NULL if current)

Rows:
  - Arif: Grade 8 SMP (effective_from: 2022-07-01, effective_to: 2023-07-01)
  - Arif: Grade 9 SMP (effective_from: 2023-07-01, effective_to: 2024-07-01)
  - Arif: Grade 10 SMA (effective_from: 2024-07-01, effective_to: NULL)
```

**Why This Matters:**
- Session "Arif's Attendance 2023-01-15" needs to know: what grade was Arif in on that date?
- Query: Find child_education WHERE child_id = Arif AND session_date BETWEEN effective_from AND effective_to
- Answer: Arif was in Grade 8 on that date

**FK Relationships:**
```
child (1) ────── (M) child_education_version
  - one child, many versions

school (1) ────── (M) child_education_version
  - one school, many children studying there over time
```

---

### Temporal Pattern: Historical Snapshots (JSONB)

**Implementation:**
```
TABLE: session_attendance
  - attendance_id (PK)
  - session_id (FK)
  - child_id (FK)
  - child_snapshot (JSONB) — Stores child state at time of session
  - [other columns]

Example JSONB:
  {
    "name": "Arif Ahmad",
    "grade": "9 SMP",
    "school": "SMP Juara Cimahi",
    "father": "Budi",
    "mother": "Siti",
    "address": "Jl. Sudirman No. 123, Cimahi"
  }
```

**Why This Matters:**
- Historical accuracy: "What was Arif's school when he attended on 2023-01-15?"
- Answer: Look up child_snapshot from that attendance record
- No need for complex temporal table joins

**Tradeoff:**
- Pro: Simple; one query; no joins
- Con: Data not normalized in JSONB; harder to aggregate

---

## RELATIONSHIP MATRIX {#matrix}

Comprehensive table of all relationships, their types, cascade rules, and null settings.

### Legend

**Relationship Type:**
- `1:1` = One-to-One
- `1:M` = One-to-Many
- `N:M` = Many-to-Many (through junction)

**Delete Rule:**
- `CASCADE` = Delete child rows when parent deleted
- `RESTRICT` = Prevent parent deletion if children exist
- `SET NULL` = Set FK to NULL when parent deleted

**Nullable:**
- `NO` = Foreign key required (NOT NULL)
- `YES` = Foreign key optional (nullable)

---

### Geography Schema

| Parent Table | Child Table | Relationship | FK Column | Nullable | Delete Rule | Unique | Reason |
|---|---|---|---|---|---|---|---|
| province | district | 1:M | district.province_id | NO | RESTRICT | NO | Geographic hierarchy; immutable data |
| district | subdistrict | 1:M | subdistrict.district_id | NO | RESTRICT | NO | Geographic hierarchy |
| subdistrict | village | 1:M | village.subdistrict_id | NO | RESTRICT | NO | Geographic hierarchy |
| village | location | 1:M | location.village_id | YES | RESTRICT | NO | Location may be incomplete (street-only) |

---

### Organization Schema

| Parent Table | Child Table | Relationship | FK Column | Nullable | Delete Rule | Unique | Reason |
|---|---|---|---|---|---|---|---|
| office | office | 1:M (self) | office.parent_office_id | YES | RESTRICT | NO | Org hierarchy; root office has no parent; prevent branch cascade deletion |
| office | coaching_region | 1:M | coaching_region.office_id | NO | RESTRICT | NO | Region must belong to office; prevent accidental region deletion |
| office | facility | 1:M | facility.office_id | NO | RESTRICT | NO | Facility managed by office |

---

### Person Schema

| Parent Table | Child Table | Relationship | FK Column | Nullable | Delete Rule | Unique | Reason |
|---|---|---|---|---|---|---|---|
| child | family_member | 1:M | family_member.child_id | NO | CASCADE | NO | Dependent data; no use without child |
| child | household_member | 1:M | household_member.child_id | NO | CASCADE | NO | Dependent data |
| child | system_user | 1:1 | system_user.coordinator_id | NO | RESTRICT | YES | Coordinator must have account; preserve account if coordinator deleted (use soft delete) |
| coordinator | system_user | 1:1 | system_user.coordinator_id | NO | SET NULL | YES | Account can exist without coordinator (orphaned) |
| donor | system_user | 0:1 | system_user.donor_id | YES | SET NULL | YES | Optional portal account; account orphaned if donor deleted |

---

### Reference Schema

| Parent Table | Child Table | Relationship | FK Column | Nullable | Delete Rule | Unique | Reason |
|---|---|---|---|---|---|---|---|
| session_type | coaching_session | 1:M | coaching_session.session_type_id | NO | RESTRICT | NO | Prevent deletion of session type in use; use soft delete |
| attendance_status | session_attendance | 1:M | session_attendance.attendance_status_id | NO | RESTRICT | NO | Preserve historical status references |
| welfare_category | child_enrollment | 1:M | child_enrollment.welfare_category_id | NO | RESTRICT | NO | Reference data |
| semester | semester_evaluation | 1:M | semester_evaluation.semester_id | NO | RESTRICT | NO | Prevent deletion of historical semester |
| role | system_user | 1:M | system_user.role_id | NO | RESTRICT | NO | Prevent deletion of role in use |

---

### Access Control Schema

| Parent Table | Child Table | Relationship | FK Column | Nullable | Delete Rule | Unique | Reason |
|---|---|---|---|---|---|---|---|
| role | role_permission | 1:M | role_permission.role_id | NO | CASCADE | NO | Permission assignment is attribute of role |
| permission | role_permission | 1:M | role_permission.permission_id | NO | RESTRICT | NO | Prevent deletion of permission in use |

---

### Program Schema

| Parent Table | Child Table | Relationship | FK Column | Nullable | Delete Rule | Unique | Reason |
|---|---|---|---|---|---|---|---|
| program | child_enrollment | 1:M | child_enrollment.program_id | NO | RESTRICT | NO | Prevent program deletion if enrollments exist |
| child | child_enrollment | 1:M | child_enrollment.child_id | NO | CASCADE | NO | Enrollment only exists because of child |

---

### Sponsorship Schema

| Parent Table | Child Table | Relationship | FK Column | Nullable | Delete Rule | Unique | Reason |
|---|---|---|---|---|---|---|---|
| child | child_donor_pairing (N:M) | 1:M | child_donor_pairing.child_id | NO | RESTRICT | NO | Use soft delete; prevent cascade to financial data |
| donor | child_donor_pairing (N:M) | 1:M | child_donor_pairing.donor_id | NO | RESTRICT | NO | Use soft delete; preserve pairing history |
| program | child_donor_pairing | 1:M | child_donor_pairing.program_id | NO | RESTRICT | NO | Prevent program deletion if pairings exist |
| child_donor_pairing | pairing_balance_snapshot | 1:M | pairing_balance_snapshot.pairing_id | NO | RESTRICT | NO | Preserve reconciliation records |
| semester | pairing_balance_snapshot | 1:M | pairing_balance_snapshot.semester_id | NO | RESTRICT | NO | Snapshot tied to specific semester |

---

### Activity Schema

| Parent Table | Child Table | Relationship | FK Column | Nullable | Delete Rule | Unique | Reason |
|---|---|---|---|---|---|---|---|
| coaching_region | coaching_session | 1:M | coaching_session.location_id | NO | RESTRICT | NO | Preserve historical session records |
| coordinator | coaching_session | 1:M | coaching_session.presenter_id | NO | RESTRICT | NO | Preserve who presented (audit trail) |
| coaching_session | session_attendance (N:M) | 1:M | session_attendance.session_id | NO | CASCADE | NO | Attendance only exists because of session |
| child | session_attendance (N:M) | 1:M | session_attendance.child_id | NO | CASCADE | NO | Attendance record only exists because of child |
| session_attendance | session_habit_tracking | 1:M | session_habit_tracking.attendance_id | NO | CASCADE | NO | Habit tracking detail of attendance |
| hafalan_item_lookup | hafalan_assessment (N:M) | 1:M | hafalan_assessment.item_id | NO | RESTRICT | NO | Prevent deletion of item with assessments; use soft delete |
| child | hafalan_assessment (N:M) | 1:M | hafalan_assessment.child_id | NO | CASCADE | NO | Assessments only exist because of child |
| coordinator | hafalan_assessment | 1:M | hafalan_assessment.assessor_id | NO | RESTRICT | NO | Preserve assessor (audit trail) |

---

### Evaluation Schema

| Parent Table | Child Table | Relationship | FK Column | Nullable | Delete Rule | Unique | Reason |
|---|---|---|---|---|---|---|---|
| evaluation_item | evaluation_item_score (N:M) | 1:M | evaluation_item_score.item_id | NO | RESTRICT | NO | Preserve historical item definitions |
| child | semester_evaluation | 1:M | semester_evaluation.child_id | NO | CASCADE | NO | Evaluation only exists because of child |
| semester | semester_evaluation | 1:M | semester_evaluation.semester_id | NO | RESTRICT | NO | Prevent deletion of historical semester |
| coordinator | semester_evaluation | 1:M | semester_evaluation.evaluator_id | NO | RESTRICT | NO | Preserve evaluator (audit trail) |
| coordinator | semester_evaluation | 1:M | semester_evaluation.approver_id | YES | RESTRICT | NO | Approval optional; preserve who approved (use soft delete for coordinator) |
| semester_evaluation | evaluation_item_score (N:M) | 1:M | evaluation_item_score.evaluation_id | NO | CASCADE | NO | Score detail of evaluation |

---

### Finance Schema

| Parent Table | Child Table | Relationship | FK Column | Nullable | Delete Rule | Unique | Reason |
|---|---|---|---|---|---|---|---|
| child_donor_pairing | transaction | 1:M | transaction.pairing_id | NO | RESTRICT | NO | **CRITICAL**: Never cascade delete financial records. Use soft delete on pairing. |

---

## SUMMARY: Key Principles

### 1. **Preserve Audit Trails**
- Financial transactions: RESTRICT (never cascade delete)
- User actions: RESTRICT (preserve who did what)
- Historical records: RESTRICT (preserve timestamps)

### 2. **Use Soft Deletes**
- Instead of DELETE, use: `active = false` or `deleted_at = timestamp`
- Preserves historical data
- Enables "undelete" if needed
- Simplifies cascade logic

### 3. **Cascade Only for Dependent Data**
- Child rows that cannot exist without parent: CASCADE (e.g., family_member, session_attendance)
- Child rows that are independent references: RESTRICT (e.g., donor, coordinator)

### 4. **Protect Reference Data**
- Geographic hierarchy: RESTRICT (never changes)
- Reference lookups (status, type): RESTRICT (use soft delete)
- Evaluation items: RESTRICT (preserve historical definitions)

### 5. **Handle Null Appropriately**
- Mandatory relationships: NOT NULL + RESTRICT
- Optional relationships: NULLABLE + SET NULL
- Avoid orphaned data: Use RESTRICT + soft delete

### 6. **Self-Referencing Hierarchies**
- Office → Office: RESTRICT (prevent cascade-deleting entire branch)
- Keep parent_id nullable for root node
- Use soft delete (active = false) for deactivating branches

---

**End of Foreign Key Relationship Design Document**

