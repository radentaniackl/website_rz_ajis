# 17_TESTING_PLAN.md

## AJIS — Anak Juara Information System
### Comprehensive Testing Plan

**Prepared for:** Rumah Zakat — Anak Juara Program  
**Source documents:** `08_PRD.md`, `15_API_SPECIFICATION.md`, `16_FRONTEND_PLAN.md`  
**Status:** Testing specification — actionable test cases and procedures  
**Document Date:** July 14, 2026

---

## Table of Contents

1. [Testing Strategy Overview](#1-testing-strategy-overview)
2. [Test Environment Setup](#2-test-environment-setup)
3. [Functional Testing](#3-functional-testing)
4. [Authentication Testing](#4-authentication-testing)
5. [CRUD Testing](#5-crud-testing)
6. [Search Testing](#6-search-testing)
7. [Filter Testing](#7-filter-testing)
8. [Performance Testing](#8-performance-testing)
9. [Security Testing](#9-security-testing)
10. [Responsive Testing](#10-responsive-testing)
11. [Accessibility Testing](#11-accessibility-testing)
12. [Test Execution Checklist](#12-test-execution-checklist)

---

## 1. Testing Strategy Overview

### 1.1 Scope

This testing plan covers the AJIS rebuild across three applications:
- **Public Website** — unauthenticated, aggregate data only
- **Super Admin Dashboard** — authenticated, unrestricted data access
- **Regional Dashboard** — authenticated, scoped to user's office/region

### 1.2 Testing Levels

| Level | Scope | Tools |
|-------|-------|-------|
| **Unit Testing** | Business logic, utilities, hooks | Jest, React Testing Library |
| **Integration Testing** | API routes + database, Server Components | Vitest, database test instance |
| **E2E Testing** | Full user workflows across UI and API | Playwright, Cypress |
| **Manual Testing** | Responsive, accessibility, edge cases | Browser DevTools, NVDA/JAWS |
| **Performance Testing** | Response times, database query performance | Lighthouse, Chrome DevTools, pg_stat_statements |
| **Security Testing** | Authentication, authorization, input validation | Burp Suite, manual code review |

### 1.3 Test Data & Environments

**Environments:**
- **Local Development** — SQLite or local PostgreSQL instance
- **Staging** — Neon development branch, matching production schema
- **Production** — Limited exploratory testing post-deployment

**Test Data:**
- Seed database with representative data: 100+ children, 10 offices, 5 regions, 50+ coordinators, 3 roles
- Preserve audit trail integrity during test cleanup
- Use transactions for test isolation (rollback after each test suite)

### 1.4 Test Coverage Goals

| Category | Target Coverage |
|----------|-----------------|
| **API Routes** | 80%+ (critical paths 100%) |
| **Business Logic** | 85%+ |
| **UI Components** | 60%+ (Tier 4 feature components prioritized) |
| **Critical Workflows** | 100% manual E2E |

---

## 2. Test Environment Setup

### 2.1 Prerequisites

```bash
# Dependencies
Node.js 18+ installed
PostgreSQL 15+ (local or Neon dev branch)
npm or yarn package manager

# Repository setup
git clone https://github.com/devcntrz/rz_ajis
cd rz_ajis
npm install

# Environment variables (testing)
cp .env.example .env.test
# Update .env.test with test database credentials
```

### 2.2 Test Database

**Initial Setup:**
1. Create a dedicated test database (e.g., `ajis_test`)
2. Run all migrations from `14_DATABASE_MIGRATION.md`
3. Seed with test data using provided seed script
4. Capture schema snapshot for validation

**Cleanup Strategy:**
- Wrap each test suite in a transaction
- Rollback after suite completes (or use database reset via `npm run db:reset:test`)
- Never persist test data to staging/production

### 2.3 Test Data Seed Script

Create `scripts/seed-test-data.ts`:

```typescript
// Seed test users by role
- Super Admin: username "admin.test", password "TestPass123!"
- Branch Admin: username "spmd.bandung", office_id 4
- Korwil: username "korwil.wilayah1", region_id 9

// Seed test children: 50 children across 2 offices, 5 regions
// Seed test coordinators: 10 coordinators assigned to regions
// Seed test donors: 5 donors for sponsorship testing
// Seed test sessions, hafalan, evaluations for the last 30 days
```

### 2.4 CI/CD Integration

```yaml
# .github/workflows/test.yml (example)
name: Test Suite
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_DB: ajis_test
          POSTGRES_PASSWORD: testpass
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run db:migrate:test
      - run: npm run db:seed:test
      - run: npm run test:unit
      - run: npm run test:integration
      - run: npm run test:e2e
      - run: npm run lint
      - run: npm run type-check
```

---

## 3. Functional Testing

Functional testing validates that each feature works as specified in the PRD and API specification.

### 3.1 Child Management (Core Workflow)

#### **Test Case F-3.1.1: Register New Child**

| Aspect | Details |
|--------|---------|
| **Scenario** | A Korwil registers a new child in the system with family members. |
| **Steps** | 1. Log in as Korwil (username: `korwil.wilayah1`) <br> 2. Navigate to Children → New Child <br> 3. Fill form: full_name="Siti Aisyah", region_id=9, welfare_category_id=2 <br> 4. Add family member: relationship="mother", full_name="Dewi Lestari" <br> 5. Click "Simpan" button <br> 6. Verify success message and redirect to child detail view |
| **Expected Result** | - Child created with child_id in database <br> - family_members table has 1 row linked to child <br> - created_at timestamp is current <br> - API returns 201 Created with child_id <br> - Korwil is automatically assigned child's region scope |
| **API Endpoint** | POST /api/v1/children <br> GET /api/v1/children/:id |
| **Test Data** | Korwil account with region_id=9, welfare_category_id=2 (active) |
| **Notes** | Region_id must match Korwil's scope; server rejects mismatched region (403 FORBIDDEN). |

#### **Test Case F-3.1.2: Edit Child Profile**

| Aspect | Details |
|--------|---------|
| **Scenario** | A Branch Admin edits a child's full name and welfare category. |
| **Steps** | 1. Log in as Branch Admin (SPMD) <br> 2. Search for child "Siti Aisyah" (child_id=5021) <br> 3. Click Edit, change full_name to "Siti Aisyah Nurhaliza" <br> 4. Change welfare_category_id to 3 <br> 5. Click "Perbarui" (update) <br> 6. Verify success toast and updated values displayed |
| **Expected Result** | - PATCH /api/v1/children/5021 returns 200 OK with updated data <br> - updated_at timestamp is current <br> - Audit log entry created with actor=Branch Admin user_id, prior values <br> - Child detail view shows new full_name and welfare_category |
| **API Endpoint** | PATCH /api/v1/children/:id |
| **Authorization** | Branch Admin can only edit children in their office_id scope |
| **Error Case** | If Branch Admin attempts to edit a child from different office, server returns 404 NOT_FOUND (scope violation). |

#### **Test Case F-3.1.3: Deactivate Child**

| Aspect | Details |
|--------|---------|
| **Scenario** | A Super Admin deactivates an inactive child (soft delete). |
| **Steps** | 1. Log in as Super Admin <br> 2. Navigate to Children list <br> 3. Find child and click Actions → Deactivate <br> 4. Confirm dialog <br> 5. Verify child removed from active list |
| **Expected Result** | - DELETE /api/v1/children/5021 sets active=false in database (soft delete) <br> - Child no longer appears in GET /api/v1/children?active=true <br> - Child still appears in GET /api/v1/children?active=all <br> - Audit log records deactivation with timestamp |
| **API Endpoint** | DELETE /api/v1/children/:id |
| **Test Data** | Child with active=true, no open enrollments |

#### **Test Case F-3.1.4: Add Family Members to Child**

| Aspect | Details |
|--------|---------|
| **Scenario** | A Korwil adds multiple family members (mother, father, sibling) to existing child. |
| **Steps** | 1. Log in as Korwil <br> 2. Open child detail view (child_id=5021) <br> 3. Navigate to Family Members tab <br> 4. Click "Add Family Member" <br> 5. Fill: relationship="father", full_name="Ahmad Nurhaliza" <br> 6. Click Add; repeat for sibling <br> 7. Verify all three family members listed |
| **Expected Result** | - POST /api/v1/children/:id/family-members creates 3 rows in family_member table <br> - List endpoint returns all 3 with their relationships <br> - family_member_count on child detail updates to 3 <br> - Audit log records each addition |
| **API Endpoint** | POST /api/v1/children/:id/family-members <br> GET /api/v1/children/:id/family-members |

---

### 3.2 Coaching Session (Pembinaan) Workflow

#### **Test Case F-3.2.1: Create Coaching Session with Attendance**

| Aspect | Details |
|--------|---------|
| **Scenario** | A Korwil records a coaching session with per-child attendance and habit tracking (Mandiri). |
| **Steps** | 1. Log in as Korwil <br> 2. Navigate to Sessions → New Session <br> 3. Fill: session_date="2026-07-14", session_type_id=1, region_id=9 <br> 4. Multi-child attendance matrix: <br>    - Child 5021: status="Hadir" (present), mandiri_prayer=true, mandiri_charity=true <br>    - Child 5022: status="Izin" (excused), mandiri_prayer=false <br>    - Child 5023: status="Alfa" (absent), all mandiri=false <br> 5. Click "Simpan" <br> 6. Verify success and session_id returned |
| **Expected Result** | - POST /api/v1/sessions creates 1 coaching_session row <br> - Creates 3 session_attendance rows (one per child) with correct status <br> - Creates session_habit_tracking rows for each (Hadir/Izin only, not Alfa) <br> - Transaction rolls back if any child is out of Korwil's region scope <br> - Idempotency-Key header prevents duplicates on network retry |
| **API Endpoint** | POST /api/v1/sessions <br> GET /api/v1/sessions/:id |
| **Business Rule** | Only Korwil can create sessions within their assigned region. |

#### **Test Case F-3.2.2: Edit Session Attendance**

| Aspect | Details |
|--------|---------|
| **Scenario** | A Korwil corrects a child's attendance status from "Alfa" to "Hadir" after reviewing records. |
| **Steps** | 1. Log in as Korwil <br> 2. Open existing session (session_id=1) <br> 3. Click child row (child_id=5023, status="Alfa") <br> 4. Change status to "Hadir" <br> 5. Set mandiri_prayer=true, mandiri_charity=true <br> 6. Click "Update" <br> 7. Verify updated value and toast confirmation |
| **Expected Result** | - PATCH /api/v1/sessions/1/attendance/5023 returns 200 <br> - session_attendance.status changed to "Hadir" <br> - session_habit_tracking rows created/updated for the child <br> - Audit log records change with prior value ("Alfa" → "Hadir") |
| **API Endpoint** | PATCH /api/v1/sessions/:id/attendance/:child_id |

---

### 3.3 Hafalan (Memorization) Tracking

#### **Test Case F-3.3.1: Record Hafalan Progress**

| Aspect | Details |
|--------|---------|
| **Scenario** | A Korwil records that a child has memorized Surah Al-Fatihah. |
| **Steps** | 1. Log in as Korwil <br> 2. Open child detail (child_id=5021) <br> 3. Navigate to Hafalan tab <br> 4. Click "Add Hafalan Item" <br> 5. Select type="Surah", item_name="Al-Fatihah" <br> 6. Set completion_date="2026-07-10" <br> 7. Add note: "Sudah lancar" (fluent) <br> 8. Click "Simpan" <br> 9. Verify item appears in list with completion status |
| **Expected Result** | - POST /api/v1/children/:id/hafalan creates hafalan_assessment row <br> - hafalan_item_lookup matched to correct surah <br> - completion_date set correctly <br> - List endpoint returns item with date, status, notes <br> - Audit log records creation |
| **API Endpoint** | POST /api/v1/children/:id/hafalan <br> GET /api/v1/children/:id/hafalan |
| **Validation** | item_name must match a row in hafalan_item_lookup (constrained by FK) |

#### **Test Case F-3.3.2: Update Hafalan Status to Completed**

| Aspect | Details |
|--------|---------|
| **Scenario** | A Korwil marks previously in-progress hafalan as completed. |
| **Steps** | 1. Open hafalan_assessment row for surah (status="in_progress") <br> 2. Click "Mark Complete" <br> 3. Verify completion_date auto-fills with today <br> 4. Add optional note: "Tested & verified" <br> 5. Click "Update" <br> 6. Verify status changes in list |
| **Expected Result** | - PATCH /api/v1/children/:id/hafalan/:assessment_id updates status to "completed" <br> - completion_date is set to request date if not provided <br> - Child's progress bar/dashboard updates hafalan %complete metric |
| **API Endpoint** | PATCH /api/v1/children/:id/hafalan/:assessment_id |

---

### 3.4 Evaluation (Penilaian) & Report Generation

#### **Test Case F-3.4.1: Create Semester Evaluation**

| Aspect | Details |
|--------|---------|
| **Scenario** | A Korwil creates a semester evaluation for a child combining attendance, hafalan, and scored dimensions. |
| **Steps** | 1. Log in as Korwil <br> 2. Navigate to Evaluations → New Evaluation <br> 3. Select child_id=5021, semester_id=1 (current semester) <br> 4. Auto-populate: attendance_rate (calculated from sessions), hafalan_count <br> 5. Fill scored items: <br>    - Aspek Cerdas: math_score=80, language_score=75 <br>    - Aspek Mandiri: prayer_habit_score=85, charity_habit_score=80 <br> 6. Add coach notes: "Siti sangat tertarik dengan Al-Qur'an..." <br> 7. Optionally add "Suara Anak Juara" (child's own voice feedback) <br> 8. Click "Simpan" <br> 9. Verify evaluation_id returned and summary displayed |
| **Expected Result** | - POST /api/v1/evaluations creates semester_evaluation row <br> - Creates evaluation_item_score rows for each scored item <br> - Average scores calculated (Aspek Cerdas avg=77.5, Aspek Mandiri avg=82.5) <br> - Constraints enforced: only one evaluation per child per semester (409 CONFLICT if duplicate) <br> - Audit log records creation with all item scores |
| **API Endpoint** | POST /api/v1/evaluations <br> GET /api/v1/evaluations/:id |
| **Business Rule** | Evaluations should pull session/hafalan data for reference but allow manual override. |

#### **Test Case F-3.4.2: Generate Laporan Semester (Report Card)**

| Aspect | Details |
|--------|---------|
| **Scenario** | A Branch Admin generates a semester report card PDF for a child. |
| **Steps** | 1. Log in as Branch Admin <br> 2. Open child detail (child_id=5021) <br> 3. Navigate to Reports tab <br> 4. Select semester_id=1 <br> 5. Click "Generate Report" <br> 6. Verify report preview (data only; PDF export deferred per PRD §3.2) <br> 7. Confirm all sections populated: attendance, hafalan, scored evaluations, coach notes |
| **Expected Result** | - GET /api/v1/children/:id/report?semester_id=1 returns full report data <br> - Report includes: child profile, semester attendance summary, hafalan progress, all scored items, coach narrative <br> - Data is read-only view (no editing from report view) <br> - Timestamp shows report generation date |
| **API Endpoint** | GET /api/v1/children/:id/report |
| **Notes** | PDF export is Phase 2; Phase 1 delivers data view only. |

#### **Test Case F-3.4.3: Mass-Generate Evaluations for Cohort**

| Aspect | Details |
|--------|---------|
| **Scenario** | A Super Admin bulk-generates evaluations for all children in a region for a semester. |
| **Steps** | 1. Log in as Super Admin <br> 2. Navigate to Evaluations → Bulk Generate <br> 3. Select region_id=9, semester_id=1 <br> 4. Confirm: "Generate evaluations for 15 children?" <br> 5. System processes in background <br> 6. Verify job status and receive success notification |
| **Expected Result** | - POST /api/v1/evaluations/bulk-generate creates evaluation row for each eligible child <br> - Skips children with existing evaluation for that semester (no error) <br> - Auto-populates attendance_rate, hafalan_count from session/hafalan data <br> - Leaves scored items blank (staff must manually enter scores) <br> - Returns job_id and status=pending; UI polls for completion |
| **API Endpoint** | POST /api/v1/evaluations/bulk-generate <br> GET /api/v1/evaluations/bulk-jobs/:job_id |

---

### 3.5 User Management

#### **Test Case F-3.5.1: Create New User Account**

| Aspect | Details |
|--------|---------|
| **Scenario** | A Super Admin creates a new Korwil account linked to an existing coordinator. |
| **Steps** | 1. Log in as Super Admin <br> 2. Navigate to Users → New User <br> 3. Fill form: username="korwil.jabar02", password="SecurePass123!", role_id=3 (Korwil) <br> 4. Link to coordinator: select "Ahmad Faisal" (coordinator_id=112) <br> 5. Click "Buat Account" <br> 6. Verify success toast and user appears in list |
| **Expected Result** | - POST /api/v1/users creates system_user row with hashed password (bcrypt/argon2) <br> - Links coordinator_id=112 with unique constraint check <br> - Returns user_id, username, role, coordinator details (password NOT returned) <br> - New user can immediately log in with provided credentials <br> - Audit log records account creation |
| **API Endpoint** | POST /api/v1/users |
| **Validation** | - username: unique, 3–100 chars <br> - password: min 8 chars <br> - coordinator_id: must not already have linked system_user |

#### **Test Case F-3.5.2: Reset User Password (Admin-Triggered)**

| Aspect | Details |
|--------|---------|
| **Scenario** | A Super Admin resets a forgotten user password. |
| **Steps** | 1. Log in as Super Admin <br> 2. Navigate to Users, find user "korwil.jabar02" <br> 3. Click Actions → Reset Password <br> 4. Choose "Generate temporary password" <br> 5. Copy and display temporary password: "kX9#mQ2p" <br> 6. Provide password to user (out-of-band) <br> 7. User logs in with temporary password <br> 8. System forces immediate password change |
| **Expected Result** | - POST /api/v1/users/:id/reset-password generates cryptographically secure random password <br> - Hashes new password and updates password_hash <br> - Responds with temporary_password (one-time display; never retrievable again) <br> - Next login with temp password triggers change-password flow <br> - Audit log records reset with timestamp |
| **API Endpoint** | POST /api/v1/users/:id/reset-password |
| **Security** | Temporary password not sent via email; Super Admin copies and delivers out-of-band. |

#### **Test Case F-3.5.3: Change Own Password**

| Aspect | Details |
|--------|---------|
| **Scenario** | A Korwil changes their own password after login. |
| **Steps** | 1. Log in as Korwil <br> 2. Navigate to Settings → Change Password <br> 3. Fill: current_password="OldPass123!", new_password="NewPass456!" <br> 4. Click "Perbarui" <br> 5. Verify success and auto-logout/redirect to login <br> 6. Log in again with new password to confirm |
| **Expected Result** | - POST /api/v1/auth/change-password validates current_password against stored hash <br> - Rejects if current_password incorrect (409 INVALID_CURRENT_PASSWORD) <br> - Hashes new_password and updates password_hash <br> - Invalidates all existing sessions (forces re-login) <br> - Returns success message |
| **API Endpoint** | POST /api/v1/auth/change-password |
| **Validation** | - new_password: min 8 chars, must differ from current_password |

---

### 3.6 Reports & Analytics

#### **Test Case F-3.6.1: Generate Rekap Pembinaan (Session Recap Report)**

| Aspect | Details |
|--------|---------|
| **Scenario** | A Branch Admin generates a session recap report filtered by date range and office. |
| **Steps** | 1. Log in as Branch Admin (SPMD, office_id=4) <br> 2. Navigate to Reports → Rekap Pembinaan <br> 3. Fill filters: date_from="2026-06-01", date_to="2026-07-14" <br> 4. office_id auto-set to their own (4); cannot change <br> 5. Click "Generate Report" <br> 6. Verify table: session date, region, attendance counts (Hadir/Izin/Alfa), notes |
| **Expected Result** | - GET /api/v1/reports/rekap-pembinaan?date_from=...&date_to=...&office_id=4 <br> - Returns aggregated session data for office 4 within date range <br> - Columns: session_date, region_name, total_children, hadir_count, izin_count, alfa_count <br> - Branch Admin only sees their own office (scope enforced) <br> - Super Admin can filter by any office_id |
| **API Endpoint** | GET /api/v1/reports/rekap-pembinaan |
| **Export** | Data exportable to CSV (§7 out of scope for Phase 1 PDF) |

#### **Test Case F-3.6.2: Audit Log Retrieval**

| Aspect | Details |
|--------|---------|
| **Scenario** | A Super Admin views audit log for a specific child. |
| **Steps** | 1. Log in as Super Admin <br> 2. Open child detail (child_id=5021) <br> 3. Navigate to Activity → Audit Log <br> 4. View chronological list: Full Name edit (2026-07-14 by Korwil), evaluation created (2026-07-13 by Korwil), etc. <br> 5. Click entry to see prior/current values |
| **Expected Result** | - GET /api/v1/reports/audit-log?entity_type=child&entity_id=5021 <br> - Returns entries ordered by created_at DESC <br> - Fields: action (create/update/delete), actor (system_user), timestamp, prior_value, new_value <br> - Super Admin sees all; Branch Admin/Korwil scoped to their office/region |
| **API Endpoint** | GET /api/v1/reports/audit-log |
| **Scope Rule** | Users cannot view audit logs for resources outside their scope (404 NOT_FOUND). |

---

## 4. Authentication Testing

Authentication testing validates login, logout, session management, and password handling per API Specification §3 and Security §9.1.

### 4.1 Login & Session Management

#### **Test Case A-4.1.1: Successful Login with Valid Credentials**

| Aspect | Details |
|--------|---------|
| **Scenario** | A Korwil logs in with correct username and password. |
| **Steps** | 1. Navigate to /login <br> 2. Fill form: username="korwil.jabar01", password="TestPass123!" <br> 3. Click "Masuk" (login) <br> 4. Verify session cookie set and redirect to /regional (role-specific dashboard) |
| **Expected Result** | - POST /api/v1/auth/login returns 200 OK <br> - Response includes system_user_id, username, role (code="korwil"), coordinator details <br> - Set-Cookie header: ajis_session=<encrypted_value>; Path=/; HttpOnly; Secure; SameSite=Strict <br> - Cookie valid for entire session (no expiry on client; server tracks session) <br> - Frontend calls GET /api/v1/auth/me and determines route (regional, super-admin, or public) <br> - User redirected to /regional/dashboard |
| **API Endpoint** | POST /api/v1/auth/login <br> GET /api/v1/auth/me |
| **Cookie Spec** | httpOnly (not accessible to JavaScript); Secure (HTTPS only); SameSite=Strict (CSRF protection) |

#### **Test Case A-4.1.2: Login Failure — Invalid Username**

| Aspect | Details |
|--------|---------|
| **Scenario** | A user attempts login with non-existent username. |
| **Steps** | 1. Navigate to /login <br> 2. Fill form: username="nonexistent.user", password="SomePass123!" <br> 3. Click "Masuk" <br> 4. Verify error message (generic, no user enumeration) |
| **Expected Result** | - POST /api/v1/auth/login returns 401 UNAUTHENTICATED <br> - Error message: "Username atau password salah" (same for both cases) <br> - No cookie set <br> - No information leaked about whether username exists |
| **API Endpoint** | POST /api/v1/auth/login |
| **Security** | Same error for "user not found" and "password mismatch" prevents username enumeration. |

#### **Test Case A-4.1.3: Login Failure — Incorrect Password**

| Aspect | Details |
|--------|---------|
| **Scenario** | A user attempts login with correct username but wrong password. |
| **Steps** | 1. Navigate to /login <br> 2. Fill form: username="korwil.jabar01", password="WrongPassword!" <br> 3. Click "Masuk" <br> 4. Verify generic error message |
| **Expected Result** | - POST /api/v1/auth/login returns 401 UNAUTHENTICATED <br> - Same error message as A-4.1.2 (no differentiation) <br> - No session cookie set <br> - Login attempt logged (for rate-limiting calculation) |
| **API Endpoint** | POST /api/v1/auth/login |
| **Rate Limiting** | Failed attempts from same IP/username tracked; limit enforced at 5 attempts/10 minutes |

#### **Test Case A-4.1.4: Login Rate Limiting**

| Aspect | Details |
|--------|---------|
| **Scenario** | An attacker attempts multiple failed logins (brute force protection). |
| **Steps** | 1. POST /api/v1/auth/login with wrong password 5 times within 10 minutes <br> 2. On 6th attempt, verify rate limit response |
| **Expected Result** | - After 5 failed attempts from same IP/username in 10-minute window <br> - 6th POST /api/v1/auth/login returns 429 TOO_MANY_REQUESTS <br> - Error message: "Terlalu banyak percobaan login. Coba lagi dalam 10 menit." <br> - Rate limit counter resets after 10 minutes <br> - Limit applied per (IP, username) pair, not global |
| **API Endpoint** | POST /api/v1/auth/login |
| **Security** | Slows brute-force attacks; threshold tuned for accidental lockout tolerance. |

#### **Test Case A-4.1.5: Inactive Account Cannot Login**

| Aspect | Details |
|--------|---------|
| **Scenario** | A user with active=false attempts to log in. |
| **Steps** | 1. (Admin deactivates user account via DELETE /api/v1/users/:id) <br> 2. User attempts login: username="deactivated.user", password="CorrectPass123!" <br> 3. Verify rejection message |
| **Expected Result** | - POST /api/v1/auth/login returns 403 FORBIDDEN <br> - Error code: "ACCOUNT_INACTIVE" <br> - Error message: "Akun ini tidak aktif. Hubungi administrator." <br> - No session cookie set |
| **API Endpoint** | POST /api/v1/auth/login |
| **Business Rule** | Deactivation prevents login without deleting account or history. |

#### **Test Case A-4.1.6: Logout Invalidates Session**

| Aspect | Details |
|--------|---------|
| **Scenario** | A logged-in user logs out and attempts to access protected resources. |
| **Steps** | 1. Log in (session established) <br> 2. Navigate to /regional/dashboard (accessible) <br> 3. Click "Logout" button <br> 4. Verify redirect to / (public home) <br> 5. Navigate back to /regional/dashboard <br> 6. Verify redirect to /login (session invalid) |
| **Expected Result** | - POST /api/v1/auth/logout returns 204 No Content <br> - Session record marked invalid/expired in database <br> - Cookie cleared (or Set-Cookie with Max-Age=0) <br> - Subsequent GET /api/v1/auth/me returns 401 UNAUTHENTICATED <br> - Any GET to /regional/* redirected to /login by middleware |
| **API Endpoint** | POST /api/v1/auth/logout <br> GET /api/v1/auth/me |

---

### 4.2 Authorization & Role-Based Access

#### **Test Case A-4.2.1: Super Admin Unrestricted Access**

| Aspect | Details |
|--------|---------|
| **Scenario** | A Super Admin can access all modules and data across all offices and regions. |
| **Steps** | 1. Log in as Super Admin <br> 2. Navigate to different sections: <br>    - Children (all offices) <br>    - Users (all users, can create/edit/delete) <br>    - Regions (all regions, can manage) <br>    - Reports (all branches) <br> 3. Verify full access without restrictions |
| **Expected Result** | - GET endpoints return data from all offices/regions <br> - No office_id or region_id filters applied (except optional query params) <br> - POST/PATCH/DELETE operations succeed for any scope <br> - auth/me returns role="super_admin" with scope.type="unrestricted" |
| **API Endpoint** | All /api/v1/* endpoints with role=super_admin |

#### **Test Case A-4.2.2: Branch Admin Scoped Access**

| Aspect | Details |
|--------|---------|
| **Scenario** | A Branch Admin can only access data from their assigned office. |
| **Steps** | 1. Log in as Branch Admin, office_id=4 <br> 2. Navigate to Children list <br> 3. Verify only children from office_id=4 shown <br> 4. Attempt to access child from office_id=5 (different office) via direct URL <br> 5. Verify rejection (404 NOT_FOUND) |
| **Expected Result** | - GET /api/v1/children returns only children linked to office_id=4 <br> - office_id filter ignored if provided in query (forced to user's scope) <br> - GET /api/v1/children/5021 (from office 5) returns 404 NOT_FOUND (scope violation) <br> - User cannot create/edit children outside office_id=4 (403 FORBIDDEN) <br> - auth/me returns scope.type="office", scope.office_id=4 |
| **API Endpoint** | GET/PATCH /api/v1/children <br> GET /api/v1/auth/me |
| **Business Rule** | Scope violation reported as 404 (not 403) to avoid confirming resource existence. |

#### **Test Case A-4.2.3: Korwil Scoped Access to Region**

| Aspect | Details |
|--------|---------|
| **Scenario** | A Korwil can only access children and data within their assigned region. |
| **Steps** | 1. Log in as Korwil, assigned to region_id=9 <br> 2. GET /api/v1/children?region_id=9 <br> 3. Verify 200 OK with children from region 9 only <br> 4. Attempt GET /api/v1/children?region_id=10 (different region) <br> 5. Verify rejection (403 FORBIDDEN - user cannot override their scope) |
| **Expected Result** | - GET /api/v1/children filtered to region_id=9 automatically <br> - region_id query parameter ignored (forced to user's assigned region) <br> - POST /api/v1/sessions with region outside scope returns 403 FORBIDDEN <br> - auth/me returns scope.type="region", scope.region_id=9 |
| **API Endpoint** | GET/POST /api/v1/children, /api/v1/sessions <br> GET /api/v1/auth/me |

#### **Test Case A-4.2.4: Unauthenticated User Access Control**

| Aspect | Details |
|--------|---------|
| **Scenario** | A user without valid session attempts to access protected dashboard. |
| **Steps** | 1. Clear browser cookies (simulate no session) <br> 2. Navigate to /super-admin/dashboard <br> 3. Verify redirect to /login <br> 4. Alternatively, call GET /api/v1/children without session cookie <br> 5. Verify API rejects with 401 UNAUTHENTICATED |
| **Expected Result** | - Browser: middleware detects missing session, redirects to /login <br> - API: GET /api/v1/children without ajis_session cookie returns 401 UNAUTHENTICATED <br> - Error message: "Sesi tidak valid atau telah kadaluarsa. Silakan login kembali." <br> - No data leakage in error response |
| **API Endpoint** | Middleware validation; all protected endpoints |

#### **Test Case A-4.2.5: Invalid Session Cookie Rejected**

| Aspect | Details |
|--------|---------|
| **Scenario** | A session cookie is tampered with or corrupted. |
| **Steps** | 1. Log in and capture ajis_session cookie <br> 2. Modify cookie value (e.g., flip a bit) <br> 3. Attempt to call GET /api/v1/auth/me with modified cookie <br> 4. Verify rejection |
| **Expected Result** | - GET /api/v1/auth/me with invalid/tampered cookie returns 401 UNAUTHENTICATED <br> - Server decryption fails safely (no crash) <br> - Error message generic (no "decryption failure" leak) <br> - User redirected to /login by middleware |
| **API Endpoint** | All endpoints validating session.decrypt() |
| **Security** | Prevents session hijacking via cookie tampering. |

---

### 4.3 Password Handling

#### **Test Case A-4.3.1: Legacy MD5 Passwords Auto-Upgraded**

| Aspect | Details |
|--------|---------|
| **Scenario** | A user with legacy MD5 password hash (from old system) logs in; password is transparently re-hashed to bcrypt. |
| **Steps** | 1. Verify test database has user with MD5 hash (e.g., `5f4dcc3b5aa765d61d8327deb882cf99`) <br> 2. POST /api/v1/auth/login with correct plaintext password <br> 3. Verify login succeeds (200 OK) <br> 4. Check database: password_hash now bcrypt format, not MD5 <br> 5. Log in again: verify bcrypt hash used (MD5 not re-checked) |
| **Expected Result** | - POST /api/v1/auth/login detects MD5 format <br> - Verifies password against MD5 hash <br> - If correct, re-hashes with bcrypt and updates password_hash column <br> - Session established (200 OK) <br> - Subsequent login uses bcrypt (no re-upgrade) <br> - Transparent to user (no password change required) |
| **API Endpoint** | POST /api/v1/auth/login <br> Password hash migration logic |
| **Business Rule** | Phase-out legacy hashes without disrupting user experience. |

#### **Test Case A-4.3.2: Bcrypt Hashed Password**

| Aspect | Details |
|--------|---------|
| **Scenario** | A user with bcrypt-hashed password logs in successfully. |
| **Steps** | 1. Create new user with password "NewPass123!" <br> 2. Verify password_hash is bcrypt format (starts with `$2a$` or `$2b$`) <br> 3. POST /api/v1/auth/login with plaintext "NewPass123!" <br> 4. Verify login succeeds |
| **Expected Result** | - POST /api/v1/users creates password_hash via bcrypt.hash() <br> - On login, bcrypt.compare(plaintext, hash) returns true <br> - Hash never stored reversibly or in logs <br> - Repeated login attempts use same hash (no re-hash) |
| **API Endpoint** | POST /api/v1/users <br> POST /api/v1/auth/login |

#### **Test Case A-4.3.3: Password Change Invalidates Old Hash**

| Aspect | Details |
|--------|---------|
| **Scenario** | User changes password; old plaintext no longer works. |
| **Steps** | 1. User logs in with old password: "OldPass123!" (succeeds) <br> 2. User changes password to "NewPass456!" <br> 3. Log out <br> 4. Attempt login with old password: "OldPass123!" <br> 5. Verify rejection (401 UNAUTHENTICATED) <br> 6. Log in with new password: "NewPass456!" <br> 7. Verify success |
| **Expected Result** | - POST /api/v1/auth/change-password updates password_hash to bcrypt of new password <br> - Old plaintext no longer matches new hash (bcrypt.compare returns false) <br> - POST /api/v1/auth/login with old password returns 401 <br> - All previous sessions invalidated (user must re-login) |
| **API Endpoint** | POST /api/v1/auth/change-password <br> POST /api/v1/auth/login |

#### **Test Case A-4.3.4: Minimum Password Length Enforced**

| Aspect | Details |
|--------|---------|
| **Scenario** | A user attempts to create/change password with insufficient length. |
| **Steps** | 1. POST /api/v1/users with password="short" (< 8 chars) <br> 2. Verify validation error <br> 3. POST /api/v1/auth/change-password with new_password="pass" <br> 4. Verify validation error |
| **Expected Result** | - POST /api/v1/users with password < 8 chars returns 422 VALIDATION_ERROR <br> - Detail: {field: "password", issue: "minimum 8 characters"} <br> - POST /api/v1/auth/change-password with new_password < 8 chars returns 422 <br> - Account/password not created |
| **API Endpoint** | POST /api/v1/users <br> POST /api/v1/auth/change-password |

---

## 5. CRUD Testing

CRUD testing validates Create, Read, Update, Delete operations for core entities per API Specification §4–7.

### 5.1 User CRUD

#### **Test Case C-5.1.1: Create User**

| Aspect | Details |
|--------|---------|
| **Scenario** | POST /api/v1/users creates new system user. |
| **Steps** | 1. As Super Admin, POST /api/v1/users <br> Body: {username: "new.user", password: "TempPass123!", role_id: 3, coordinator_id: 118} <br> 2. Verify 201 Created <br> 3. Response includes system_user_id, username, role, coordinator (password omitted) |
| **Expected Result** | - system_user row created with username, password_hash (bcrypt), role_id, coordinator_id <br> - unique constraint on username enforced <br> - unique constraint on coordinator_id enforced (§4.2) <br> - Audit log records creation <br> - User can immediately login with provided credentials |
| **API Endpoint** | POST /api/v1/users |
| **Validation** | username unique, 3–100 chars; password ≥ 8 chars; role_id exists; coordinator_id unique |

#### **Test Case C-5.1.2: Read User (List)**

| Aspect | Details |
|--------|---------|
| **Scenario** | GET /api/v1/users returns paginated list of users. |
| **Steps** | 1. As Super Admin, GET /api/v1/users?limit=10 <br> 2. Verify 200 OK with paginated results <br> 3. Each user includes system_user_id, username, role, coordinator/donor, active, created_at <br> 4. Meta includes next_cursor and has_more |
| **Expected Result** | - 10 users returned (or fewer if less exist) <br> - Keyset pagination: next_cursor opaque string for next page <br> - Sorting by username default (or specified via sort param) <br> - Password never included in response <br> - Search via q param filters by username/coordinator name |
| **API Endpoint** | GET /api/v1/users |
| **Query Params** | limit (default 25, max 100), cursor, q, active, role_id, office_id, sort |

#### **Test Case C-5.1.3: Read User (Single)**

| Aspect | Details |
|--------|---------|
| **Scenario** | GET /api/v1/users/:id returns single user detail. |
| **Steps** | 1. As Super Admin, GET /api/v1/users/481 <br> 2. Verify 200 OK with full user object |
| **Expected Result** | - Returns user matching system_user_id=481 <br> - Includes role, coordinator/donor, is_system_account, active, created_at <br> - Password never included <br> - Non-existent user returns 404 NOT_FOUND |
| **API Endpoint** | GET /api/v1/users/:id |

#### **Test Case C-5.1.4: Update User**

| Aspect | Details |
|--------|---------|
| **Scenario** | PATCH /api/v1/users/:id updates username, role, or active status. |
| **Steps** | 1. As Super Admin, PATCH /api/v1/users/481 <br> Body: {username: "korwil.jabar01.updated", role_id: 2} <br> 2. Verify 200 OK with updated fields |
| **Expected Result** | - username updated (unique constraint checked) <br> - role_id updated <br> - active updated (soft delete mechanism) <br> - immutable fields (coordinator_id, donor_id, is_system_account) rejected with 422 <br> - Audit log records change with prior values <br> - Non-existent user returns 404 |
| **API Endpoint** | PATCH /api/v1/users/:id |
| **Immutable** | coordinator_id, donor_id, is_system_account (prevent re-creation) |

#### **Test Case C-5.1.5: Delete User (Soft)**

| Aspect | Details |
|--------|---------|
| **Scenario** | DELETE /api/v1/users/:id deactivates account (soft delete). |
| **Steps** | 1. As Super Admin, DELETE /api/v1/users/481 <br> 2. Verify 200 OK <br> 3. Verify user.active=false in database <br> 4. Attempt login with that user: verify 403 ACCOUNT_INACTIVE |
| **Expected Result** | - User's active flag set to false (physical row not deleted) <br> - Response confirms deletion: {system_user_id: 481, active: false} <br> - User cannot login (ACCOUNT_INACTIVE error) <br> - Audit log records deactivation <br> - History preserved for audit trail <br> - Super Admin cannot deactivate own account (prevent lockout) |
| **API Endpoint** | DELETE /api/v1/users/:id |
| **Guard** | Caller cannot deactivate self (403 FORBIDDEN). |

---

### 5.2 Child CRUD

#### **Test Case C-5.2.1: Create Child**

| Aspect | Details |
|--------|---------|
| **Scenario** | POST /api/v1/children registers new child. |
| **Steps** | 1. As Korwil, POST /api/v1/children <br> Body: {full_name: "Budi Santoso", region_id: 9, welfare_category_id: 2, family_members: [{relationship: "mother", full_name: "Siti Nurhaliza"}]} <br> 2. Verify 201 Created with child_id |
| **Expected Result** | - Child row created with full_name, region_id, welfare_category_id <br> - family_members linked transactionally <br> - created_at timestamp set <br> - active=true by default <br> - Audit log records creation <br> - Return includes child_id for subsequent operations |
| **API Endpoint** | POST /api/v1/children |
| **Scope** | Korwil must provide region_id matching their assigned region; Super Admin/Branch Admin can specify any region/office within scope |

#### **Test Case C-5.2.2: Read Child (List)**

| Aspect | Details |
|--------|---------|
| **Scenario** | GET /api/v1/children returns paginated child list. |
| **Steps** | 1. As Branch Admin, GET /api/v1/children?limit=25 <br> 2. Verify 200 OK with children from their office <br> 3. Pagination works with cursor |
| **Expected Result** | - Returns children from branch's office_id only <br> - office_id query param ignored (forced to user scope) <br> - Sorting by full_name default <br> - Search via q param matches name (GIN-indexed) <br> - active filter works (default true) <br> - No PII leakage (summary data only) |
| **API Endpoint** | GET /api/v1/children |
| **Scope** | Enforced per user's office/region |

#### **Test Case C-5.2.3: Read Child (Detail)**

| Aspect | Details |
|--------|---------|
| **Scenario** | GET /api/v1/children/:id returns full child profile. |
| **Steps** | 1. As Korwil, GET /api/v1/children/5021 <br> 2. Verify 200 OK with profile <br> 3. Summary of family members, education, enrollment, attendance metrics |
| **Expected Result** | - Returns child object with full_name, region, current_education, family_member_count, created_at, updated_at <br> - Full data accessible from user's scope only (404 if out of scope) <br> - No sensitive data beyond what needed for operations |
| **API Endpoint** | GET /api/v1/children/:id |

#### **Test Case C-5.2.4: Update Child**

| Aspect | Details |
|--------|---------|
| **Scenario** | PATCH /api/v1/children/:id edits child profile. |
| **Steps** | 1. As Korwil, PATCH /api/v1/children/5021 <br> Body: {full_name: "Budi Santoso Wijaya", welfare_category_id: 3} <br> 2. Verify 200 OK with updated fields |
| **Expected Result** | - full_name updated <br> - welfare_category_id updated <br> - updated_at timestamp changed <br> - Audit log records prior values <br> - Child's scope must match caller's scope (403 or 404 if not) |
| **API Endpoint** | PATCH /api/v1/children/:id |

#### **Test Case C-5.2.5: Delete Child (Soft)**

| Aspect | Details |
|--------|---------|
| **Scenario** | DELETE /api/v1/children/:id deactivates child. |
| **Steps** | 1. As Super Admin, DELETE /api/v1/children/5021 <br> 2. Verify 200 OK <br> 3. Verify child.active=false <br> 4. GET /api/v1/children?active=true no longer returns this child <br> 5. GET /api/v1/children?active=all still shows it |
| **Expected Result** | - active flag set to false (soft delete) <br> - Response: {child_id: 5021, active: false} <br> - Audit log records deactivation <br> - Historical data (sessions, evaluations) preserved |
| **API Endpoint** | DELETE /api/v1/children/:id |

---

### 5.3 Coaching Session CRUD

#### **Test Case C-5.3.1: Create Session**

| Aspect | Details |
|--------|---------|
| **Scenario** | POST /api/v1/sessions creates coaching session. |
| **Steps** | 1. As Korwil, POST /api/v1/sessions <br> Body: {session_date: "2026-07-14", session_type_id: 1, region_id: 9, attendance: [{child_id: 5021, status: "Hadir", mandiri_prayer: true}, ...]} <br> 2. Verify 201 Created with session_id |
| **Expected Result** | - coaching_session row created <br> - session_attendance rows created for each child (1 per child) <br> - session_habit_tracking rows created for Hadir/Izin children <br> - Transaction: all-or-nothing (no partial creation) <br> - Idempotency-Key header prevents duplicates on retry |
| **API Endpoint** | POST /api/v1/sessions |
| **Idempotency** | Optional Idempotency-Key header; same key returns original 201 response |

#### **Test Case C-5.3.2: Read Session**

| Aspect | Details |
|--------|---------|
| **Scenario** | GET /api/v1/sessions/:id returns session with attendance details. |
| **Steps** | 1. As Korwil, GET /api/v1/sessions/100 <br> 2. Verify 200 OK with full session object |
| **Expected Result** | - Returns session_date, session_type, attendance list (3+ children) <br> - Each attendance includes child_id, status (Hadir/Izin/Alfa), habits <br> - child_name and other profile fields denormalized for display <br> - Scope enforced: Korwil sees only sessions from their region |
| **API Endpoint** | GET /api/v1/sessions/:id |

#### **Test Case C-5.3.3: Update Session Attendance**

| Aspect | Details |
|--------|---------|
| **Scenario** | PATCH /api/v1/sessions/:id/attendance/:child_id updates child's status. |
| **Steps** | 1. As Korwil, PATCH /api/v1/sessions/100/attendance/5021 <br> Body: {status: "Hadir", mandiri_prayer: true, mandiri_charity: false} <br> 2. Verify 200 OK |
| **Expected Result** | - session_attendance.status updated <br> - session_habit_tracking rows updated (created if absent, deleted if status=Alfa) <br> - Audit log records prior status <br> - Timestamp updated |
| **API Endpoint** | PATCH /api/v1/sessions/:id/attendance/:child_id |

#### **Test Case C-5.3.4: Delete Session (Soft)**

| Aspect | Details |
|--------|---------|
| **Scenario** | DELETE /api/v1/sessions/:id deactivates session. |
| **Steps** | 1. As Korwil, DELETE /api/v1/sessions/100 <br> 2. Verify 200 OK <br> 3. GET /api/v1/sessions/100 still returns it (inactive) or via ?active=all filter |
| **Expected Result** | - active=false set <br> - Session no longer included in list queries (default ?active=true) <br> - Related attendance/habit data retained <br> - Audit log records deletion |
| **API Endpoint** | DELETE /api/v1/sessions/:id |

---

## 6. Search Testing

Search testing validates free-text search functionality backed by GIN indexes per API Specification §2.6 and Database Specification §7.4.

### 6.1 Child Name Search

#### **Test Case S-6.1.1: Search by Full Name**

| Aspect | Details |
|--------|---------|
| **Scenario** | A user searches for child by full name using the `q` parameter. |
| **Steps** | 1. As Branch Admin, GET /api/v1/children?q=Siti <br> 2. Verify results include all children with "Siti" in full_name (case-insensitive) |
| **Expected Result** | - POST /api/v1/children?q=Siti returns [Siti Aisyah, Siti Nurhaliza, ...] <br> - Search is case-insensitive <br> - Partial match works: "Siti" matches "Siti Aisyah" and "Nur Siti Rahman" <br> - GIN index used (backend verifies via EXPLAIN PLAN) <br> - Response time < 50ms for 10,000+ children <br> - Pagination applied (limit 25 default) |
| **API Endpoint** | GET /api/v1/children?q=search_term |
| **Index** | GIN index on child.full_name ensures fast search |

#### **Test Case S-6.1.2: Search with Partial Name**

| Aspect | Details |
|--------|---------|
| **Scenario** | User searches with partial/substring match. |
| **Steps** | 1. GET /api/v1/children?q=isa <br> 2. Verify results include "Siti Aisyah", "Lisa Wijaya", etc. |
| **Expected Result** | - GIN trigram search: "isa" matches "Siti Aisyah" and "Lisa" (via trigram overlap) <br> - Results ranked by relevance (full match first) <br> - Response includes all matches, paginated |
| **API Endpoint** | GET /api/v1/children?q=isa |

#### **Test Case S-6.1.3: Search with Special Characters**

| Aspect | Details |
|--------|---------|
| **Scenario** | User searches for name with diacritic marks (Indonesian names). |
| **Steps** | 1. GET /api/v1/children?q=Siti%20%C3%81isyah (URL-encoded: "Siti Aisyah" with accent) <br> 2. Verify results include exact match |
| **Expected Result** | - Search matches despite accent marks (database collation handles) <br> - "Siti Aisyah" matches "Siti Aisyah" <br> - UTF-8 encoding enforced (no charset issues) |
| **API Endpoint** | GET /api/v1/children?q=Siti%20%C3%81isyah |

#### **Test Case S-6.1.4: Empty Search Query**

| Aspect | Details |
|--------|---------|
| **Scenario** | User leaves search box empty or omits `q` parameter. |
| **Steps** | 1. GET /api/v1/children (no q param) <br> 2. Verify all children returned (unsorted or sorted by default) |
| **Expected Result** | - Returns all children (or scoped by office/region per authorization) <br> - Sorted by full_name default <br> - No error for missing `q` parameter |
| **API Endpoint** | GET /api/v1/children |

---

### 6.2 User Search

#### **Test Case S-6.2.1: Search Users by Username**

| Aspect | Details |
|--------|---------|
| **Scenario** | Super Admin searches users by username. |
| **Steps** | 1. As Super Admin, GET /api/v1/users?q=korwil <br> 2. Verify results include all usernames with "korwil" |
| **Expected Result** | - Results: korwil.jabar01, korwil.jabar02, korwil.wilayah1, etc. <br> - Case-insensitive match <br> - Partial match supported |
| **API Endpoint** | GET /api/v1/users?q=search_term |

#### **Test Case S-6.2.2: Search Users by Coordinator Name**

| Aspect | Details |
|--------|---------|
| **Scenario** | Super Admin searches users linked to coordinator by coordinator's name. |
| **Steps** | 1. GET /api/v1/users?q=Ahmad <br> 2. Verify results include users linked to coordinators named "Ahmad..." |
| **Expected Result** | - Returns system_user rows where linked coordinator.full_name contains "Ahmad" <br> - Combined with username search |
| **API Endpoint** | GET /api/v1/users?q=Ahmad |

---

## 7. Filter Testing

Filter testing validates query parameter filtering (active, office_id, region_id, role_id, sort) per API Specification §2.6.

### 7.1 Active Status Filter

#### **Test Case F-7.1.1: Filter Active Children**

| Aspect | Details |
|--------|---------|
| **Scenario** | User filters children by active status. |
| **Steps** | 1. GET /api/v1/children?active=true <br> 2. Verify only active children returned <br> 3. GET /api/v1/children?active=false <br> 4. Verify only inactive (deleted) children returned <br> 5. GET /api/v1/children?active=all <br> 6. Verify both active and inactive returned |
| **Expected Result** | - active=true (default): returns children where active=true <br> - active=false: returns children where active=false <br> - active=all: returns all children regardless of active status <br> - Default (omitted): behaves as active=true <br> - Soft-deleted children not shown by default (UX expectation) |
| **API Endpoint** | GET /api/v1/children?active=true|false|all |

#### **Test Case F-7.1.2: Filter Active Users**

| Aspect | Details |
|--------|---------|
| **Scenario** | Super Admin filters users by active status. |
| **Steps** | 1. GET /api/v1/users?active=true <br> 2. Verify only active users returned |
| **Expected Result** | - Deactivated accounts excluded by default <br> - Can include inactive via active=all |
| **API Endpoint** | GET /api/v1/users?active=true|false|all |

---

### 7.2 Office & Region Filters

#### **Test Case F-7.2.1: Super Admin Filters by Office**

| Aspect | Details |
|--------|---------|
| **Scenario** | Super Admin filters children by specific office. |
| **Steps** | 1. As Super Admin, GET /api/v1/children?office_id=4 <br> 2. Verify children from office 4 only |
| **Expected Result** | - Returns all children linked to office_id=4 regions <br> - Super Admin can specify any office <br> - Multiple offices not supported in single query (separate calls) |
| **API Endpoint** | GET /api/v1/children?office_id=4 |

#### **Test Case F-7.2.2: Branch Admin Forced to Own Office**

| Aspect | Details |
|--------|---------|
| **Scenario** | Branch Admin attempts to filter by different office; request forced to own scope. |
| **Steps** | 1. As Branch Admin (office_id=4), GET /api/v1/children?office_id=5 <br> 2. Verify office_id=5 query parameter ignored <br> 3. Results show children from office_id=4 only |
| **Expected Result** | - office_id parameter ignored (not an error; silently forced to caller's scope) <br> - Caller never sees data from office_id=5 <br> - No 403 error (scope violation is silent) |
| **API Endpoint** | GET /api/v1/children?office_id=5 |

#### **Test Case F-7.2.3: Super Admin Filters by Region**

| Aspect | Details |
|--------|---------|
| **Scenario** | Super Admin filters children by coaching region. |
| **Steps** | 1. As Super Admin, GET /api/v1/children?region_id=9 <br> 2. Verify children from region 9 only |
| **Expected Result** | - Returns all children in coaching_region.region_id=9 <br> - Super Admin can specify any region |
| **API Endpoint** | GET /api/v1/children?region_id=9 |

#### **Test Case F-7.2.4: Korwil Forced to Own Region**

| Aspect | Details |
|--------|---------|
| **Scenario** | Korwil attempts to filter by different region; forced to own scope. |
| **Steps** | 1. As Korwil (region_id=9), GET /api/v1/children?region_id=10 <br> 2. Verify request rejected or forced to region_id=9 |
| **Expected Result** | - region_id parameter ignored (forced to caller's region) <br> - Results show only region 9 data <br> - No error; scope violation is silent |
| **API Endpoint** | GET /api/v1/children?region_id=10 |

---

### 7.3 Role Filter

#### **Test Case F-7.3.1: Filter Users by Role**

| Aspect | Details |
|--------|---------|
| **Scenario** | Super Admin filters users by role. |
| **Steps** | 1. As Super Admin, GET /api/v1/users?role_id=3 <br> 2. Verify only Korwil users (role_id=3) returned |
| **Expected Result** | - Returns system_user rows where role_id=3 <br> - Multiple role filters not supported (use separate queries) <br> - role_id must reference valid role (404 if invalid) |
| **API Endpoint** | GET /api/v1/users?role_id=3 |

---

### 7.4 Sorting

#### **Test Case F-7.4.1: Default Sort Order**

| Aspect | Details |
|--------|---------|
| **Scenario** | User queries without explicit sort; default order applied. |
| **Steps** | 1. GET /api/v1/children (no sort param) <br> 2. Verify children sorted by full_name ASC <br> 3. GET /api/v1/users (no sort param) <br> 4. Verify users sorted by username ASC |
| **Expected Result** | - Children default sort: full_name ASC <br> - Users default sort: username ASC <br> - Sessions default sort: session_date DESC <br> - Consistent across pages |
| **API Endpoint** | GET /api/v1/* |

#### **Test Case F-7.4.2: Explicit Ascending Sort**

| Aspect | Details |
|--------|---------|
| **Scenario** | User specifies ascending sort. |
| **Steps** | 1. GET /api/v1/children?sort=full_name <br> 2. Verify children sorted A–Z by full_name |
| **Expected Result** | - sort=field_name: ascending sort <br> - Result order: A, B, C, ... <br> - Consistent with default (+full_name) |
| **API Endpoint** | GET /api/v1/children?sort=full_name |

#### **Test Case F-7.4.3: Explicit Descending Sort**

| Aspect | Details |
|--------|---------|
| **Scenario** | User specifies descending sort. |
| **Steps** | 1. GET /api/v1/sessions?sort=-session_date <br> 2. Verify sessions sorted by date DESC (newest first) |
| **Expected Result** | - sort=-field_name: descending sort <br> - Result order: Z, Y, X, ... or newest first <br> - Leading hyphen indicates DESC |
| **API Endpoint** | GET /api/v1/sessions?sort=-session_date |

#### **Test Case F-7.4.4: Invalid Sort Field**

| Aspect | Details |
|--------|---------|
| **Scenario** | User specifies non-existent sort field. |
| **Steps** | 1. GET /api/v1/children?sort=nonexistent_field <br> 2. Verify response behavior |
| **Expected Result** | - Option A: Ignore invalid field and use default sort (graceful) <br> - Option B: Return 400 BAD_REQUEST (strict) <br> - Spec recommends graceful (Option A) <br> - Document chosen behavior in API spec |
| **API Endpoint** | GET /api/v1/children?sort=nonexistent_field |

---

## 8. Performance Testing

Performance testing validates system meets targets per PRD §10: API response < 300ms p95, page load < 1.5s FCP on 4G, field form latency < 150ms perceived.

### 8.1 API Response Time

#### **Test Case P-8.1.1: List Endpoint Response Time — Small Dataset**

| Aspect | Details |
|--------|---------|
| **Scenario** | GET /api/v1/children?limit=25 on 100-child database. |
| **Steps** | 1. Load test with 100 children <br> 2. Execute GET /api/v1/children?limit=25 <br> 3. Measure response time (start of request to end of response body) <br> 4. Repeat 20 times; calculate p50, p95, p99 |
| **Expected Result** | - p95 response time < 300ms (PRD target) <br> - p99 < 500ms <br> - No timeouts <br> - Includes database query, JSON serialization, HTTP overhead |
| **Measurement** | Use Postman / curl with time command or APM tool (e.g., NewRelic, DataDog) <br> Capture: response_time_ms, status_code, result_count |
| **Database** | 100 children, 5 regions, 1000 sessions (1 month history) |

#### **Test Case P-8.1.2: List Endpoint Response Time — Large Dataset**

| Aspect | Details |
|--------|---------|
| **Scenario** | GET /api/v1/children?limit=25 on 10,000-child database. |
| **Steps** | 1. Load test with 10,000 children (representative production scale) <br> 2. Execute GET /api/v1/children?limit=25 <br> 3. Measure p95 response time |
| **Expected Result** | - p95 response time still < 300ms (indexes critical) <br> - Keyset pagination ensures consistent performance across pages <br> - No full-table scans <br> - Database query plan uses INDEX SCAN (not SEQ SCAN) |
| **Index Requirement** | Composite index on (office_id, region_id, active, id) ensures fast keyset pagination |

#### **Test Case P-8.1.3: Search Response Time**

| Aspect | Details |
|--------|---------|
| **Scenario** | GET /api/v1/children?q=Siti on 10,000-child database. |
| **Steps** | 1. Load test with 10,000 children <br> 2. Execute GET /api/v1/children?q=Siti <br> 3. Measure p95 response time |
| **Expected Result** | - p95 response time < 300ms (GIN index on name) <br> - Results include all matches (100+ typically) <br> - No timeout despite large result set (pagination applied) <br> - GIN index used (EXPLAIN ANALYZE verifies) |
| **Index Requirement** | GIN trigram index on child.full_name ensures fast substring search |

#### **Test Case P-8.1.4: Detail Endpoint Response Time**

| Aspect | Details |
|--------|---------|
| **Scenario** | GET /api/v1/children/:id (full profile with relations). |
| **Steps** | 1. GET /api/v1/children/5021 <br> 2. Measure response time <br> 3. Verify includes family members, education, enrollment, attendance summary |
| **Expected Result** | - p95 response time < 200ms (detail endpoint expected faster than list, less aggregation) <br> - Multiple LEFT JOINs with index support <br> - No N+1 query problem (all data fetched in 1–2 queries) |
| **Queries** | Ideally 1 query (main child + all relations via JOIN); max 2 queries (separate hafalan/evaluations if too complex) |

#### **Test Case P-8.1.5: Create Endpoint Response Time (Multi-Row)**

| Aspect | Details |
|--------|---------|
| **Scenario** | POST /api/v1/sessions with 20-child attendance (multi-row insert). |
| **Steps** | 1. POST /api/v1/sessions with 20 children's attendance rows <br> 2. Measure response time <br> 3. Verify transaction integrity (all-or-nothing) |
| **Expected Result** | - p95 response time < 500ms (includes transaction overhead) <br> - 1 coaching_session row + 20 session_attendance rows + up to 20 session_habit_tracking rows created <br> - Transaction rollback if any child out of scope <br> - Idempotency-Key prevents duplicates on retry <br> - No partial data if failure |
| **Transaction** | Uses BEGIN/COMMIT or equivalent; no partial commits |

---

### 8.2 Database Query Performance

#### **Test Case P-8.2.1: Index Usage Verification**

| Aspect | Details |
|--------|---------|
| **Scenario** | Verify critical queries use indexes, not full table scans. |
| **Steps** | 1. Run EXPLAIN ANALYZE on key queries: <br>    - SELECT * FROM child WHERE office_id=4 AND active=true <br>    - SELECT * FROM child WHERE full_name ILIKE '%Siti%' <br>    - SELECT * FROM session WHERE region_id=9 AND session_date >= '2026-07-01' <br> 2. Examine plan: verify INDEX SCAN (not SEQ SCAN) <br> 3. Check index names in plan |
| **Expected Result** | - Composite index used for office_id+active filter <br> - GIN index used for name search <br> - Composite index used for region_id+session_date filter <br> - No SEQ SCAN on large tables (> 1000 rows) <br> - All critical query patterns have indexes |
| **Tool** | psql: EXPLAIN (ANALYZE, BUFFERS) SELECT ...; <br> Check: Index Scan, Index Cond, Rows Removed |

#### **Test Case P-8.2.2: Query Slowdown Detection**

| Aspect | Details |
|--------|---------|
| **Scenario** | Monitor slow queries in production/staging. |
| **Steps** | 1. Enable log_min_duration_statement = 100 (PostgreSQL) <br> 2. Monitor slow query log for queries > 100ms <br> 3. Run EXPLAIN ANALYZE on slow queries <br> 4. Identify missing indexes or optimization opportunities |
| **Expected Result** | - Slow queries < 5% of traffic <br> - Most queries < 50ms <br> - No queries > 1s (except bulk operations) <br> - Missing indexes identified and added before production |
| **Monitoring** | Use pg_stat_statements extension or Vercel Postgres monitoring <br> Set up alerting for queries > 300ms |

---

### 8.3 Frontend Performance

#### **Test Case P-8.3.1: Public Website First Contentful Paint (FCP)**

| Aspect | Details |
|--------|---------|
| **Scenario** | Public Website load performance on 4G network. |
| **Steps** | 1. Open Chrome DevTools, Network tab <br> 2. Set network to "Slow 4G" (throttle) <br> 3. Reload public home page (/) <br> 4. Measure FCP time (when first content paints) <br> 5. Repeat 5 times; calculate average |
| **Expected Result** | - FCP < 1.5s on 4G (PRD target) <br> - Static pages served from CDN with ISR <br> - Minimal client-side JavaScript <br> - Server Components reduce JS bundle |
| **Measurement** | Chrome DevTools: Performance tab, FCP metric <br> Or use Lighthouse: Run Report → Performance score |
| **Optimization** | If exceeds target: <br> - Check bundle size (npm run build) <br> - Enable GZIP compression <br> - Optimize images (WebP format) <br> - Increase ISR cache TTL |

#### **Test Case P-8.3.2: Dashboard Data Load Latency (SWR Cache)**

| Aspect | Details |
|--------|---------|
| **Scenario** | Regional Dashboard children list loads via SWR; second visit uses cache. |
| **Steps** | 1. As Korwil, navigate to /regional/children <br> 2. Measure time to list rendered (API call + React render) <br> 3. Navigate away and back <br> 4. Verify cached data renders instantly (< 50ms) <br> 5. Verify background revalidation (SWR fetches latest) |
| **Expected Result** | - First load: API response + render < 300ms total <br> - Cached load: instant (< 50ms) <br> - Background revalidation: 30–60s default cache, user sees stale data briefly <br> - Stale-while-revalidate: old data shown, new fetched in background <br> - No loader/spinner on cached data (UX improvement) |
| **SWR Config** | revalidateOnFocus: true, dedupingInterval: 60000 |

#### **Test Case P-8.3.3: Form Input Latency (Responsive Input)**

| Aspect | Details |
|--------|---------|
| **Scenario** | Field user fills out coaching session form; form responds to input. |
| **Steps** | 1. On 3G mobile network (throttle), open form <br> 2. Type into text input (child name search) <br> 3. Measure input latency: key press to character visible <br> 4. Test filtering/autocomplete: type "Siti", measure time to suggestions |
| **Expected Result** | - Input latency < 150ms perceived (PRD target) <br> - Characters appear instantly (controlled by form library, not API call) <br> - Search suggestions (if any) fetched in background <br> - Form remains responsive during API wait <br> - No blocking operations |
| **Tool** | Chrome DevTools: Performance tab, Input Event latency <br> Manual: stopwatch, subjective feel |

---

### 8.4 Load Testing

#### **Test Case P-8.4.1: Concurrent User Load**

| Aspect | Details |
|--------|---------|
| **Scenario** | System handles 100 concurrent users. |
| **Steps** | 1. Use load testing tool (e.g., k6, Apache JMeter) <br> 2. Simulate 100 concurrent users accessing /api/v1/children <br> 3. Run for 5 minutes <br> 4. Measure: response time p95, error rate, throughput |
| **Expected Result** | - p95 response time < 300ms even under load <br> - Error rate < 0.5% (no 5xx errors) <br> - Throughput stable (not degrading over time) <br> - No connection pool exhaustion <br> - Database connection pool size adequate |
| **Tool** | k6: https://k6.io/ <br> Script example: <br> ```javascript <br> import http from 'k6/http'; <br> export let options = {vus: 100, duration: '5m'}; <br> export default function() { <br>   http.get('https://staging.ajis.app/api/v1/children'); <br> } <br> ``` |

#### **Test Case P-8.4.2: Spike Test**

| Aspect | Details |
|--------|---------|
| **Scenario** | System handles sudden traffic spike. |
| **Steps** | 1. Start with 10 concurrent users <br> 2. After 1 minute, jump to 500 concurrent users <br> 3. After 2 minutes, drop back to 10 <br> 4. Monitor response time, errors, recovery |
| **Expected Result** | - System remains responsive during spike (p95 < 500ms) <br> - No cascading failures <br> - Auto-scaling (if configured) activates within 30s <br> - Recovery: response time returns to normal within 1 minute <br> - No permanent resource exhaustion |
| **Scaling** | Vercel serverless auto-scales; monitor concurrent function invocations |

---

## 9. Security Testing

Security testing validates authentication, authorization, input validation, and injection prevention per PRD §9 and API Specification §2.3/2.7.

### 9.1 Authentication Security

#### **Test Case SC-9.1.1: Session Cookie Secure Flags**

| Aspect | Details |
|--------|---------|
| **Scenario** | Verify session cookie has correct security attributes. |
| **Steps** | 1. Log in and capture Set-Cookie header <br> 2. Verify cookie attributes: <br>    - HttpOnly: true (not accessible to JavaScript) <br>    - Secure: true (HTTPS only) <br>    - SameSite=Strict (CSRF protection) <br>    - Path=/; Domain={correct domain} |
| **Expected Result** | - Set-Cookie header: ajis_session=<value>; Path=/; HttpOnly; Secure; SameSite=Strict <br> - No Max-Age or Expires (session expires on browser close or server-side timeout) <br> - Cookie not accessible to JavaScript (prevents XSS theft) <br> - Cookie not sent over HTTP (prevents interception) <br> - CSRF protection: cookie not sent on cross-site requests |
| **Tool** | Browser DevTools: Application → Cookies <br> Or curl -v to see headers |

#### **Test Case SC-9.1.2: Session Expiry**

| Aspect | Details |
|--------|---------|
| **Scenario** | User's session expires after inactivity. |
| **Steps** | 1. Log in successfully <br> 2. Note session creation time <br> 3. Wait 24 hours (or configure shorter timeout for testing) <br> 4. Attempt to access protected resource <br> 5. Verify redirect to /login |
| **Expected Result** | - Session timeout: 24 hours default (configurable) <br> - After timeout: GET /api/v1/auth/me returns 401 UNAUTHENTICATED <br> - Session record in database has expiry date in past <br> - User must re-login <br> - No automatic session extension (security: prevent forced infinite sessions) |
| **Configuration** | .env: SESSION_TIMEOUT_MS=86400000 (24 hours) |

#### **Test Case SC-9.1.3: Password Not in Logs or Responses**

| Aspect | Details |
|--------|---------|
| **Scenario** | Verify plaintext password never exposed in logs, responses, or audit trail. |
| **Steps** | 1. POST /api/v1/auth/login with password="SecurePass123!" <br> 2. Check response body: password not included <br> 3. Check server logs: password not logged <br> 4. Check database audit_log table: password_hash included, plaintext not <br> 5. POST /api/v1/users with password: verify response does not echo password |
| **Expected Result** | - POST /api/v1/auth/login response: password field omitted <br> - POST /api/v1/users response: password field omitted <br> - Server logs: no plaintext password (only hashed or "[REDACTED]") <br> - Audit trail: password_hash (hashed) recorded, not plaintext <br> - All password handling via bcrypt.compare (not stored reversibly) |
| **Log Sanitization** | Middleware/logger masks sensitive fields before logging |

#### **Test Case SC-9.1.4: CSRF Token (if applicable)**

| Aspect | Details |
|--------|---------|
| **Scenario** | If using CSRF tokens, verify protection. |
| **Steps** | 1. Check API spec: if POST/PATCH/DELETE require CSRF token <br> 2. Attempt request without token <br> 3. Verify rejection (403 or 422) <br> 4. Attempt request with invalid token <br> 5. Verify rejection |
| **Expected Result** | - Spec uses SameSite=Strict (sufficient CSRF protection for this architecture) <br> - No explicit CSRF token required (cookie-based SameSite does defense) <br> - If tokens used: POST /api/v1/csrf-token returns token <br> - POST /api/v1/resource requires valid token header |
| **Note** | SameSite=Strict on session cookie provides CSRF defense; explicit CSRF tokens not required |

---

### 9.2 Authorization Security

#### **Test Case SC-9.2.1: Row-Level Scope Enforcement**

| Aspect | Details |
|--------|---------|
| **Scenario** | A Branch Admin cannot access children outside their office scope. |
| **Steps** | 1. Log in as Branch Admin, office_id=4 <br> 2. GET /api/v1/children/5021 (child from office 4): succeeds <br> 3. GET /api/v1/children/7000 (child from office 5): verify rejection <br> 4. Attempt PATCH /api/v1/children/7000: verify rejection |
| **Expected Result** | - GET /api/v1/children/5021: 200 OK (in scope) <br> - GET /api/v1/children/7000: 404 NOT_FOUND (scope violation reported as 404, not 403) <br> - PATCH /api/v1/children/7000: 404 NOT_FOUND <br> - Server re-validates scope before write (prevents timing attack) |
| **Security Pattern** | Scope violations reported as 404 (not 403) to avoid confirming resource existence |

#### **Test Case SC-9.2.2: Write Operation Scope Re-Validation**

| Aspect | Details |
|--------|---------|
| **Scenario** | Server re-validates scope on write, not just read. |
| **Steps** | 1. Log in as Branch Admin, office_id=4 <br> 2. Intercept PATCH /api/v1/children/7000 request (child_id from office 5) <br> 3. Submit request with valid session cookie and body <br> 4. Server processes request <br> 5. Verify rejection (404 NOT_FOUND) |
| **Expected Result** | - Server does not trust client's child_id parameter <br> - Looks up child (child_id=7000) and verifies office_id=5 <br> - Compares office_id=5 to caller's scope (office_id=4) <br> - Mismatch detected: returns 404 NOT_FOUND <br> - No data modified <br> - Prevents privilege escalation via guessing IDs |
| **Implementation** | After parsing request, server queries child.office_id; if != caller's office_id, reject |

#### **Test Case SC-9.2.3: Korwil Cannot Create Child in Other Region**

| Aspect | Details |
|--------|---------|
| **Scenario** | A Korwil attempts to register child in region other than their assigned region. |
| **Steps** | 1. Log in as Korwil, assigned region_id=9 <br> 2. POST /api/v1/children with region_id=10 <br> 3. Verify rejection |
| **Expected Result** | - POST /api/v1/children with region_id=10: 403 FORBIDDEN <br> - Error: "Cannot create child outside assigned region" <br> - No child created <br> - Audit log records attempt |
| **API Endpoint** | POST /api/v1/children |

---

### 9.3 Input Validation & Injection Prevention

#### **Test Case SC-9.3.1: SQL Injection Prevention**

| Aspect | Details |
|--------|---------|
| **Scenario** | Attacker attempts SQL injection via name search parameter. |
| **Steps** | 1. GET /api/v1/children?q=Siti' OR '1'='1 <br> 2. Verify no SQL error or unexpected results <br> 3. GET /api/v1/children?q=Siti'; DROP TABLE child; -- <br> 4. Verify table not dropped, no error |
| **Expected Result** | - Search parameter treated as literal string, not SQL code <br> - GIN index query handles special characters safely <br> - Results: children matching the literal string (no matches expected) <br> - No SQL error; no data leak <br> - Parameterized queries / prepared statements used throughout |
| **Implementation** | Node.js client library (pg or Prisma) handles parameterization; no string concatenation |

#### **Test Case SC-9.3.2: NoSQL/Command Injection Prevention**

| Aspect | Details |
|--------|---------|
| **Scenario** | Attacker attempts command injection via API parameter. |
| **Steps** | 1. POST /api/v1/children with full_name="test\n; rm -rf /" <br> 2. Verify full_name stored as literal string <br> 3. Check server logs: no shell execution |
| **Expected Result** | - full_name stored as-is: "test\n; rm -rf /" <br> - No shell execution <br> - Child appears in list with literal name (no danger) <br> - Server not compromised |
| **Implementation** | All inputs treated as strings; no eval() or shell execution |

#### **Test Case SC-9.3.3: XSS Prevention (Stored)**

| Aspect | Details |
|--------|---------|
| **Scenario** | Attacker stores XSS payload in child name; verify rendering is safe. |
| **Steps** | 1. POST /api/v1/children with full_name="<script>alert('XSS')</script>" <br> 2. GET /api/v1/children/:id <br> 3. Verify response: full_name returned as JSON string (escaped) <br> 4. Frontend renders child detail page <br> 5. Verify script does not execute; script tag displayed as text |
| **Expected Result** | - full_name stored literally in database <br> - API response JSON: full_name escaped as "\\u003cscript\\u003e...\\u003c/script\\u003e" <br> - Frontend React/JSX: text content is auto-escaped (not innerHTML) <br> - Script tag visible as text in UI, not executed <br> - No XSS vulnerability |
| **Prevention** | React JSX auto-escapes by default; avoid dangerouslySetInnerHTML |

#### **Test Case SC-9.3.4: Validation: Required Fields**

| Aspect | Details |
|--------|---------|
| **Scenario** | Attacker submits request missing required fields. |
| **Steps** | 1. POST /api/v1/children with no full_name <br> 2. Verify rejection (422) <br> 3. POST /api/v1/auth/login with no password <br> 4. Verify rejection (422) |
| **Expected Result** | - POST /api/v1/children without full_name: 422 UNPROCESSABLE_ENTITY <br> - Error details: {field: "full_name", issue: "required"} <br> - No child created <br> - Database constraint (NOT NULL) never reached (validation at API layer) |
| **Implementation** | Zod/schema validation before database insert |

#### **Test Case SC-9.3.5: Validation: Field Length Limits**

| Aspect | Details |
|--------|---------|
| **Scenario** | Attacker submits oversized field values. |
| **Steps** | 1. POST /api/v1/children with full_name=1000 chars <br> 2. Verify rejection (422) with max-length error <br> 3. POST /api/v1/users with username=50000 chars <br> 4. Verify rejection |
| **Expected Result** | - full_name max 200 chars: oversized rejected <br> - username max 100 chars: oversized rejected <br> - No data truncation <br> - 422 UNPROCESSABLE_ENTITY with field-level error <br> - Database constraint (VARCHAR length) never reached |
| **Implementation** | Schema validation enforces max length before API response |

#### **Test Case SC-9.3.6: Validation: Enum/Allowed Values**

| Aspect | Details |
|--------|---------|
| **Scenario** | Attacker submits invalid enum value. |
| **Steps** | 1. POST /api/v1/sessions with status="Invalid" (must be Hadir/Izin/Alfa) <br> 2. Verify rejection (422) |
| **Expected Result** | - status field validated against allowed values <br> - Invalid value rejected with 422 <br> - Error: {field: "status", issue: "must be one of: Hadir, Izin, Alfa"} <br> - Database constraint check not needed (validation earlier) |
| **Implementation** | Zod .enum() validation |

---

### 9.4 Data Privacy & PII Protection

#### **Test Case SC-9.4.1: No Child PII on Public Website**

| Aspect | Details |
|--------|---------|
| **Scenario** | Verify public website never exposes individual child names, photos, or identifying details. |
| **Steps** | 1. Navigate through public website (/impact, /regions, /news) <br> 2. Search HTML source and network requests <br> 3. Verify no individual child names, photos, or enrollment data <br> 4. Verify only aggregate statistics (e.g., "500 children served") |
| **Expected Result** | - Public website shows: aggregate counts, program description, regional presence, donor info <br> - No individual child names, photos, birth dates, or identifying details <br> - No admin data on public pages <br> - All PII-bearing APIs (/api/v1/children, /api/v1/sessions, etc.) protected (401 without auth) |
| **API Endpoints** | /api/v1/public/* returns only aggregate data; no sensitive fields |

#### **Test Case SC-9.4.2: PII Access Restricted to Authorized Users**

| Aspect | Details |
|--------|---------|
| **Scenario** | Unauthenticated user cannot access /api/v1/children or child detail endpoint. |
| **Steps** | 1. Unauthenticated, call GET /api/v1/children <br> 2. Verify 401 UNAUTHENTICATED <br> 3. Call GET /api/v1/children/5021 <br> 4. Verify 401 <br> 5. Call GET /api/v1/public/aggregate-stats <br> 6. Verify 200 OK (public, no PII) |
| **Expected Result** | - /api/v1/children: 401 (requires auth) <br> - /api/v1/children/:id: 401 (requires auth) <br> - /api/v1/public/aggregate-stats: 200 OK (no auth required; aggregate data only) <br> - No information leakage about individual children to public |
| **Design** | Public endpoint and authenticated endpoints under different URL prefixes |

#### **Test Case SC-9.4.3: Audit Log Access Control**

| Aspect | Details |
|--------|---------|
| **Scenario** | Only Super Admin can view full audit logs; other roles see scoped logs. |
| **Steps** | 1. As Super Admin, GET /api/v1/reports/audit-log: returns all changes <br> 2. As Branch Admin, GET /api/v1/reports/audit-log: returns only changes to their office's data <br> 3. As Korwil, GET /api/v1/reports/audit-log: returns only changes to their region's data |
| **Expected Result** | - Super Admin: sees all audit log entries <br> - Branch Admin: sees entries for children/sessions in their office_id only <br> - Korwil: sees entries for children/sessions in their region_id only <br> - Scope violations return 404 NOT_FOUND |
| **API Endpoint** | GET /api/v1/reports/audit-log |

---

## 10. Responsive Testing

Responsive testing validates UI/UX across viewport sizes, particularly field-usable at 375px (PRD §3 goal).

### 10.1 Mobile Viewport (375px)

#### **Test Case R-10.1.1: Children List on Mobile**

| Aspect | Details |
|--------|---------|
| **Scenario** | Regional Dashboard Children list fully usable on 375px mobile viewport. |
| **Steps** | 1. Open Chrome DevTools, set device to iPhone SE (375x667) <br> 2. Navigate to /regional/children <br> 3. Verify no horizontal scroll (content fits viewport) <br> 4. Verify all controls accessible: search, filter, pagination <br> 5. Verify table/list readable (text size, spacing) <br> 6. Attempt to click child row: verify navigation works |
| **Expected Result** | - No horizontal scrollbar <br> - Text readable (min font 12px, ideally 16px) <br> - Touch targets min 44×44px (tap-friendly) <br> - Search input tappable and usable <br> - Pagination buttons ("Next") usable <br> - Child detail page loads on tap <br> - Scrolling smooth, no jank |
| **Measurement** | Browser DevTools: measure font size, button size, scroll behavior |

#### **Test Case R-10.1.2: Registration Form on Mobile**

| Aspect | Details |
|--------|---------|
| **Scenario** | Child registration form functional on 375px mobile. |
| **Steps** | 1. iPhone SE viewport (375px) <br> 2. Navigate to /regional/children/new <br> 3. Fill form: full_name, region_id (dropdown), welfare_category_id (dropdown), add family members <br> 4. Verify form fields stack vertically <br> 5. Verify inputs responsive (no overflow) <br> 6. Tap dropdowns: verify options visible <br> 7. Add family member button: verify tappable <br> 8. Submit button: verify tappable and visible |
| **Expected Result** | - Form fully visible without scrolling (or short scroll for long forms) <br> - Labels above inputs (not beside) <br> - Dropdown options fill viewport (not cut off) <br> - Keyboard doesn't cover submit button (or form scrolls up) <br> - All buttons >= 44×44px <br> - No horizontal scroll <br> - Submit succeeds and redirects |
| **Responsive** | CSS media queries / Tailwind responsive classes handle layout <br> No fixed widths; flexbox/grid used |

#### **Test Case R-10.1.3: Session Recording (Multi-Child Attendance) on Mobile**

| Aspect | Details |
|--------|---------|
| **Scenario** | Coaching session attendance matrix (15+ children) usable on mobile. |
| **Steps** | 1. iPhone SE viewport <br> 2. Navigate to /regional/sessions/new <br> 3. Multi-child attendance table: verify scrollable, not jumbled <br> 4. For each child: tap row to expand/collapse details <br> 5. Fill attendance status (dropdown) <br> 6. Fill habit checkboxes <br> 7. Verify all rows accessible without horizontal scroll |
| **Expected Result** | - Attendance table collapses to mobile-friendly layout: <br>   - Child name prominent <br>   - Status dropdown below <br>   - Habits as checkboxes below (stacked vertically) <br> - Scroll vertically through children <br> - No horizontal scroll <br> - All checkboxes tappable (min 44×44px) <br> - Submit button visible/accessible <br> - Can add 15+ children without freezing |
| **Alternative** | If table not feasible on mobile, use card-based layout (one child per expandable card) |

---

### 10.2 Tablet Viewport (768px)

#### **Test Case R-10.2.1: Dashboard on Tablet**

| Aspect | Details |
|--------|---------|
| **Scenario** | Regional Dashboard usable on 768px tablet. |
| **Steps** | 1. Chrome DevTools: set to iPad (768x1024) <br> 2. Navigate to /regional/dashboard <br> 3. Verify sidebar visible or toggle accessible <br> 4. Verify main content readable <br> 5. Verify all sections (children list, recent sessions, etc.) accessible |
| **Expected Result** | - Layout adapts to 768px: sidebar may collapse or reduce <br> - Content area uses available width (not fixed small width) <br> - Text readable, no tiny fonts <br> - Sidebar navigation accessible (toggle or always visible) <br> - All features functional |
| **Layout** | Tailwind responsive: hidden md:inline (show at 768px+) |

---

### 10.3 Desktop Viewport (1920px+)

#### **Test Case R-10.3.1: Full Desktop Experience**

| Aspect | Details |
|--------|---------|
| **Scenario** | Dashboard fully featured on 1920px desktop. |
| **Steps** | 1. Chrome DevTools: set to 1920x1080 <br> 2. Navigate to /regional/dashboard <br> 3. Verify sidebar visible, navigation clear <br> 4. Verify main content uses full width (not cramped) <br> 5. Verify no excessive whitespace |
| **Expected Result** | - Sidebar always visible (not collapsed) <br> - Main content width appropriate (readable, not too wide) <br> - Tables show many columns without horizontal scroll <br> - Charts/graphs visible and readable <br> - Efficient use of screen real estate |

---

## 11. Accessibility Testing

Accessibility testing validates compliance with WCAG 2.1 AA standards and shadcn/ui's accessible defaults.

### 11.1 Keyboard Navigation

#### **Test Case A-11.1.1: Tab Order & Focus**

| Aspect | Details |
|--------|---------|
| **Scenario** | User navigates form using Tab key; focus visible and logical. |
| **Steps** | 1. Navigate to /login <br> 2. Press Tab repeatedly from top of page <br> 3. Verify focus moves: username input → password input → login button → ... <br> 4. Verify focus visible (outline or highlight) <br> 5. Verify no focus trap (user can Tab out of any field) |
| **Expected Result** | - Focus order logical (left-to-right, top-to-bottom) <br> - Focus indicator visible (min 2px outline, contrasting color) <br> - All interactive elements (buttons, inputs, links) reachable via Tab <br> - No hidden focus (opacity 0 or similar) <br> - No focus trap (user can always Tab/Shift+Tab to next element) <br> - Skip links present if long nav menus |
| **Implementation** | React/shadcn auto-manages focus; verify no tabIndex="-1" on interactive elements |

#### **Test Case A-11.1.2: Form Submission via Keyboard**

| Aspect | Details |
|--------|---------|
| **Scenario** | User fills and submits form using keyboard only (no mouse). |
| **Steps** | 1. Navigate to /regional/children/new (registration form) <br> 2. Tab to full_name input, type "Budi Santoso" <br> 3. Tab to region_id dropdown, press Space/Enter to open, Arrow Down to select, Enter to confirm <br> 4. Tab to welfare_category_id dropdown, repeat <br> 5. Tab through all fields <br> 6. Tab to Submit button, press Enter <br> 7. Verify form submitted successfully |
| **Expected Result** | - All form fields accessible via Tab <br> - Text inputs: type text directly <br> - Dropdowns: Space/Enter to open, Arrow keys to navigate, Enter to select <br> - Checkboxes: Space to toggle <br> - Submit button: Enter to submit <br> - No mouse required <br> - Form submitted and success shown (no silent failure) |
| **Implementation** | shadcn/ui Select, Input, Button components support keyboard out-of-box |

#### **Test Case A-11.1.3: Dialog/Modal Keyboard Navigation**

| Aspect | Details |
|--------|---------|
| **Scenario** | User interacts with modal dialog (e.g., confirm delete) using keyboard. |
| **Steps** | 1. On children list, press Tab to a delete button <br> 2. Press Enter to trigger dialog <br> 3. Verify focus moves to dialog (usually first button or close button) <br> 4. Tab to "Confirm" button <br> 5. Press Enter to confirm <br> 6. Verify dialog closed and focus returned to original location |
| **Expected Result** | - Focus trapped within dialog (doesn't Tab out to background) <br> - First tabbable element focused when dialog opens <br> - Escape key closes dialog <br> - Focus returned to triggering element after dialog closes <br> - Background content hidden/disabled (aria-inert or similar) |
| **Implementation** | shadcn/ui Dialog manages focus trap and Escape key |

---

### 11.2 Screen Reader Support

#### **Test Case A-11.2.1: Page Landmarks & Structure**

| Aspect | Details |
|--------|---------|
| **Scenario** | Screen reader user navigates page structure (headings, regions, landmarks). |
| **Steps** | 1. Install NVDA (free Windows) or use Safari Voiceover (Mac/iOS) <br> 2. Navigate to /regional/dashboard <br> 3. Press H to jump to headings; verify all major sections announced <br> 4. Press R to jump to landmarks; verify header, main, sidebar announced <br> 5. Navigate by heading level (H1, H2, H3) |
| **Expected Result** | - <header>, <main>, <nav>, <aside> tags used (semantic HTML) <br> - All headings use <h1>–<h6> (not div with CSS) <br> - Heading hierarchy logical (H1 → H2 → H3, no skips) <br> - Page announced: "Dashboard - Anak Juara" <br> - Regions announced: "Header", "Navigation", "Main content", "Sidebar" <br> - NVDA/Voiceover reads all structure |
| **Tool** | NVDA: Ctrl+Home, H (heading navigation), R (landmark navigation) |

#### **Test Case A-11.2.2: Form Labels & Inputs**

| Aspect | Details |
|--------|---------|
| **Scenario** | Screen reader announces form labels and input purposes clearly. |
| **Steps** | 1. Open registration form (/regional/children/new) <br> 2. Tab to each field <br> 3. NVDA/Voiceover announces: label text, input type, current value, required status |
| **Expected Result** | - Each input has <label> with for="input_id" <br> - Input announced: "Full Name, edit text, required" <br> - Dropdown announced: "Region, combobox" <br> - Errors announced: "Full Name: Required field" (aria-describedby linked) <br> - Success announcement: "Child created successfully" (aria-live region) <br> - No placeholder-only labels (placeholder hidden from SR) |
| **Implementation** | React Hook Form + shadcn/ui auto-wire labels <br> aria-describedby on inputs with errors |

#### **Test Case A-11.2.3: Data Tables**

| Aspect | Details |
|--------|---------|
| **Scenario** | Screen reader announces table structure (headers, cells, context). |
| **Steps** | 1. Navigate to children list table (/regional/children) <br> 2. NVDA: arrow down through table cells <br> 3. Verify each cell announced with column header context |
| **Expected Result** | - <table>, <thead>, <tbody>, <th>, <td> used <br> - Column headers: <th scope="col"> <br> - Row headers (if any): <th scope="row"> <br> - NVDA announces: "Table, 25 rows, 4 columns. Row 1: Full Name, Siti Aisyah, Region, Bandung Timur, ..." <br> - Pagination controls announced: "Button, Next page (disabled)" |
| **Implementation** | shadcn/ui Table component includes semantic structure |

#### **Test Case A-11.2.4: Icons & Button Text**

| Aspect | Details |
|--------|---------|
| **Scenario** | Icon buttons have accessible labels; icon-only buttons are marked. |
| **Steps** | 1. Open children list <br> 2. Tab to edit icon (pencil icon) <br> 3. NVDA announces button purpose <br> 4. Tab to menu icon (three dots) <br> 5. NVDA announces "menu button" |
| **Expected Result** | - Icon button: <button aria-label="Edit child"> <br> - Announced: "Edit child, button" <br> - Menu button: <button aria-label="Actions menu"> <br> - Announced: "Actions menu, button" <br> - No unlabeled icon buttons |
| **Implementation** | Tier 2 components (IconButton) include aria-label prop <br> shadcn/ui Icon buttons must have children or aria-label |

---

### 11.3 Color & Contrast

#### **Test Case A-11.3.1: Text Contrast Ratio**

| Aspect | Details |
|--------|---------|
| **Scenario** | All text meets WCAG AA contrast ratio (4.5:1 for normal text, 3:1 for large). |
| **Steps** | 1. Use browser extension (e.g., WAVE, Axe DevTools) <br> 2. Scan /regional/dashboard <br> 3. Run contrast check <br> 4. Verify no contrast errors |
| **Expected Result** | - Normal text: contrast >= 4.5:1 <br> - Large text (18px+): contrast >= 3:1 <br> - Buttons, labels, input text: contrast >= 4.5:1 <br> - No text with < 3:1 contrast <br> - Design system (Tailwind) ensures adequate contrast |
| **Tool** | Chrome: Axe DevTools (axe-core) → Scan <br> Or manual: WebAIM Contrast Checker |
| **Design** | Text colors: primary (dark), secondary (dark), on light background |

#### **Test Case A-11.3.2: Color Not Sole Indicator**

| Aspect | Details |
|--------|---------|
| **Scenario** | Information not conveyed by color alone. |
| **Steps** | 1. Open children list with status badges (Active, Inactive) <br> 2. Verify green/red color used, AND text label also present <br> 3. Open form with required fields marked red <br> 4. Verify red asterisk AND "Required" text/aria-required |
| **Expected Result** | - Status badges: color + text ("Active" in green, "Inactive" in gray) <br> - Required fields: asterisk/red + "Required" text + aria-required="true" <br> - Errors: red border + icon + error text message <br> - Colorblind user can distinguish without color alone |
| **Implementation** | Tier 2 components combine color + text/icon |

---

### 11.4 Dynamic Content & Announcements

#### **Test Case A-11.4.1: Form Error Announcements**

| Aspect | Details |
|--------|---------|
| **Scenario** | Form validation errors announced to screen reader user. |
| **Steps** | 1. Navigate to registration form <br> 2. Leave full_name blank, submit <br> 3. Verify screen reader announces error |
| **Expected Result** | - Error appears on page (aria-live="polite" region) <br> - NVDA announces: "Alert: Full Name is required" (live region update) <br> - Error visually associated with field (aria-describedby) <br> - User can re-navigate to field and correct |
| **Implementation** | React Hook Form integrates with aria-describedby <br> Error region: <div role="alert" aria-live="polite"> |

#### **Test Case A-11.4.2: Success Message Announcement**

| Aspect | Details |
|--------|---------|
| **Scenario** | Form submission success announced to screen reader. |
| **Steps** | 1. Fill registration form correctly <br> 2. Submit <br> 3. Verify screen reader announces success |
| **Expected Result** | - Toast/success message appears <br> - aria-live="polite" region announces: "Child created successfully" <br> - User aware submission succeeded (not silent) <br> - Page redirects after announcement (reasonable delay) |
| **Implementation** | Toast component: <div role="status" aria-live="polite" aria-atomic="true"> |

#### **Test Case A-11.4.3: Loading States**

| Aspect | Details |
|--------|---------|
| **Scenario** | Loading states announced (e.g., "Loading children list..."). |
| **Steps** | 1. Navigate to /regional/children <br> 2. Page initially shows loading state <br> 3. NVDA announces loading state <br> 4. After data loads, NVDA announces list complete |
| **Expected Result** | - Loading spinner: <div aria-busy="true" aria-label="Loading children..."> <br> - NVDA announces: "Loading children list" <br> - Data loads and replace spinner <br> - NVDA announces: "Children list loaded, 25 results" (or similar) |
| **Implementation** | aria-busy="true" during fetch; remove/announce when complete |

---

## 12. Test Execution Checklist

### 12.1 Pre-Test Setup

- [ ] Test environment deployed (staging branch)
- [ ] Test database seeded with 100+ children, 10+ offices, etc.
- [ ] API service running and responding
- [ ] Frontend deployed and accessible
- [ ] Test credentials configured (admin.test, spmd.bandung, korwil.wilayah1)
- [ ] Test tools installed (Postman/curl, browser DevTools, NVDA/Voiceover, load testing tool)
- [ ] VPN/access to staging environment (if applicable)

### 12.2 Functional Testing Execution

- [ ] **F-3.1: Child Management**
  - [ ] F-3.1.1: Register New Child
  - [ ] F-3.1.2: Edit Child Profile
  - [ ] F-3.1.3: Deactivate Child
  - [ ] F-3.1.4: Add Family Members
- [ ] **F-3.2: Coaching Session**
  - [ ] F-3.2.1: Create Session with Attendance
  - [ ] F-3.2.2: Edit Session Attendance
- [ ] **F-3.3: Hafalan Tracking**
  - [ ] F-3.3.1: Record Hafalan Progress
  - [ ] F-3.3.2: Update Hafalan Status
- [ ] **F-3.4: Evaluation & Reports**
  - [ ] F-3.4.1: Create Semester Evaluation
  - [ ] F-3.4.2: Generate Laporan Semester
  - [ ] F-3.4.3: Mass-Generate Evaluations
- [ ] **F-3.5: User Management**
  - [ ] F-3.5.1: Create User Account
  - [ ] F-3.5.2: Reset User Password
  - [ ] F-3.5.3: Change Own Password
- [ ] **F-3.6: Reports**
  - [ ] F-3.6.1: Generate Rekap Pembinaan
  - [ ] F-3.6.2: Audit Log Retrieval

### 12.3 Authentication Testing Execution

- [ ] **A-4.1: Login & Session**
  - [ ] A-4.1.1: Successful Login
  - [ ] A-4.1.2: Login Failure — Invalid Username
  - [ ] A-4.1.3: Login Failure — Incorrect Password
  - [ ] A-4.1.4: Login Rate Limiting
  - [ ] A-4.1.5: Inactive Account Cannot Login
  - [ ] A-4.1.6: Logout Invalidates Session
- [ ] **A-4.2: Authorization**
  - [ ] A-4.2.1: Super Admin Unrestricted Access
  - [ ] A-4.2.2: Branch Admin Scoped Access
  - [ ] A-4.2.3: Korwil Scoped Access
  - [ ] A-4.2.4: Unauthenticated Access Control
  - [ ] A-4.2.5: Invalid Session Cookie Rejected
- [ ] **A-4.3: Password Handling**
  - [ ] A-4.3.1: Legacy MD5 Password Auto-Upgrade
  - [ ] A-4.3.2: Bcrypt Hashed Password
  - [ ] A-4.3.3: Password Change Invalidates Old Hash
  - [ ] A-4.3.4: Minimum Password Length Enforced

### 12.4 CRUD Testing Execution

- [ ] **C-5.1: User CRUD**
  - [ ] C-5.1.1: Create User
  - [ ] C-5.1.2: Read User (List)
  - [ ] C-5.1.3: Read User (Single)
  - [ ] C-5.1.4: Update User
  - [ ] C-5.1.5: Delete User (Soft)
- [ ] **C-5.2: Child CRUD**
  - [ ] C-5.2.1: Create Child
  - [ ] C-5.2.2: Read Child (List)
  - [ ] C-5.2.3: Read Child (Detail)
  - [ ] C-5.2.4: Update Child
  - [ ] C-5.2.5: Delete Child (Soft)
- [ ] **C-5.3: Session CRUD**
  - [ ] C-5.3.1: Create Session
  - [ ] C-5.3.2: Read Session
  - [ ] C-5.3.3: Update Session Attendance
  - [ ] C-5.3.4: Delete Session (Soft)

### 12.5 Search Testing Execution

- [ ] **S-6.1: Child Name Search**
  - [ ] S-6.1.1: Search by Full Name
  - [ ] S-6.1.2: Search with Partial Name
  - [ ] S-6.1.3: Search with Special Characters
  - [ ] S-6.1.4: Empty Search Query
- [ ] **S-6.2: User Search**
  - [ ] S-6.2.1: Search by Username
  - [ ] S-6.2.2: Search by Coordinator Name

### 12.6 Filter Testing Execution

- [ ] **F-7.1: Active Filter**
  - [ ] F-7.1.1: Filter Active Children
  - [ ] F-7.1.2: Filter Active Users
- [ ] **F-7.2: Office & Region Filters**
  - [ ] F-7.2.1: Super Admin Filters by Office
  - [ ] F-7.2.2: Branch Admin Forced to Own Office
  - [ ] F-7.2.3: Super Admin Filters by Region
  - [ ] F-7.2.4: Korwil Forced to Own Region
- [ ] **F-7.3: Role Filter**
  - [ ] F-7.3.1: Filter Users by Role
- [ ] **F-7.4: Sorting**
  - [ ] F-7.4.1: Default Sort Order
  - [ ] F-7.4.2: Explicit Ascending Sort
  - [ ] F-7.4.3: Explicit Descending Sort
  - [ ] F-7.4.4: Invalid Sort Field

### 12.7 Performance Testing Execution

- [ ] **P-8.1: API Response Time**
  - [ ] P-8.1.1: List Endpoint (Small Dataset)
  - [ ] P-8.1.2: List Endpoint (Large Dataset)
  - [ ] P-8.1.3: Search Response Time
  - [ ] P-8.1.4: Detail Endpoint Response Time
  - [ ] P-8.1.5: Create Endpoint Response Time
- [ ] **P-8.2: Database Query Performance**
  - [ ] P-8.2.1: Index Usage Verification
  - [ ] P-8.2.2: Query Slowdown Detection
- [ ] **P-8.3: Frontend Performance**
  - [ ] P-8.3.1: Public Website FCP
  - [ ] P-8.3.2: Dashboard Data Load Latency
  - [ ] P-8.3.3: Form Input Latency
- [ ] **P-8.4: Load Testing**
  - [ ] P-8.4.1: Concurrent User Load (100 users)
  - [ ] P-8.4.2: Spike Test (10 → 500 → 10 users)

### 12.8 Security Testing Execution

- [ ] **SC-9.1: Authentication Security**
  - [ ] SC-9.1.1: Session Cookie Secure Flags
  - [ ] SC-9.1.2: Session Expiry
  - [ ] SC-9.1.3: Password Not in Logs
  - [ ] SC-9.1.4: CSRF Token (if applicable)
- [ ] **SC-9.2: Authorization Security**
  - [ ] SC-9.2.1: Row-Level Scope Enforcement
  - [ ] SC-9.2.2: Write Operation Scope Re-Validation
  - [ ] SC-9.2.3: Korwil Cannot Create Child in Other Region
- [ ] **SC-9.3: Input Validation**
  - [ ] SC-9.3.1: SQL Injection Prevention
  - [ ] SC-9.3.2: Command Injection Prevention
  - [ ] SC-9.3.3: XSS Prevention (Stored)
  - [ ] SC-9.3.4: Validation: Required Fields
  - [ ] SC-9.3.5: Validation: Field Length Limits
  - [ ] SC-9.3.6: Validation: Enum Values
- [ ] **SC-9.4: Data Privacy**
  - [ ] SC-9.4.1: No Child PII on Public Website
  - [ ] SC-9.4.2: PII Access Restricted
  - [ ] SC-9.4.3: Audit Log Access Control

### 12.9 Responsive Testing Execution

- [ ] **R-10.1: Mobile (375px)**
  - [ ] R-10.1.1: Children List on Mobile
  - [ ] R-10.1.2: Registration Form on Mobile
  - [ ] R-10.1.3: Session Recording on Mobile
- [ ] **R-10.2: Tablet (768px)**
  - [ ] R-10.2.1: Dashboard on Tablet
- [ ] **R-10.3: Desktop (1920px)**
  - [ ] R-10.3.1: Full Desktop Experience

### 12.10 Accessibility Testing Execution

- [ ] **A-11.1: Keyboard Navigation**
  - [ ] A-11.1.1: Tab Order & Focus
  - [ ] A-11.1.2: Form Submission via Keyboard
  - [ ] A-11.1.3: Dialog Keyboard Navigation
- [ ] **A-11.2: Screen Reader Support**
  - [ ] A-11.2.1: Page Landmarks & Structure
  - [ ] A-11.2.2: Form Labels & Inputs
  - [ ] A-11.2.3: Data Tables
  - [ ] A-11.2.4: Icons & Button Text
- [ ] **A-11.3: Color & Contrast**
  - [ ] A-11.3.1: Text Contrast Ratio
  - [ ] A-11.3.2: Color Not Sole Indicator
- [ ] **A-11.4: Dynamic Content**
  - [ ] A-11.4.1: Form Error Announcements
  - [ ] A-11.4.2: Success Message Announcement
  - [ ] A-11.4.3: Loading States

### 12.11 Post-Test Activities

- [ ] Collect all test evidence (screenshots, logs, performance metrics)
- [ ] Document bugs found (title, steps, expected vs. actual, priority)
- [ ] Calculate test coverage % (test cases passed / total)
- [ ] Generate test report with summary, bugs, coverage
- [ ] Archive test data; reset test database
- [ ] Prepare sign-off documentation for stakeholders

---

**End of 17_TESTING_PLAN.md**
