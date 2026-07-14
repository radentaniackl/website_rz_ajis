# 12_TASK_BREAKDOWN.md

## AJIS — Anak Juara Information System
### Implementation Task Breakdown

**Prepared for:** Rumah Zakat — Anak Juara Program  
**Project:** AJIS Rebuild (Public Website · Super Admin Dashboard · Regional Dashboard)  
**Estimated Total Duration:** 42–56 working days (210–280 hours)  
**Task Format:** 2–4 hour tasks, one Git commit per task  
**Document Date:** July 14, 2026

---

## Table of Contents

1. [Project Overview & Task Structure](#project-overview--task-structure)
2. [Setup & Infrastructure (6 tasks)](#setup--infrastructure)
3. [Database & Schema (8 tasks)](#database--schema)
4. [Authentication & Authorization (6 tasks)](#authentication--authorization)
5. [Backend API — Master Data (8 tasks)](#backend-api--master-data)
6. [Backend API — Core Operations (10 tasks)](#backend-api--core-operations)
7. [Backend API — Reporting & Finance (6 tasks)](#backend-api--reporting--finance)
8. [Frontend Shared Components (8 tasks)](#frontend-shared-components)
9. [Public Website (6 tasks)](#public-website)
10. [Super Admin Dashboard (12 tasks)](#super-admin-dashboard)
11. [Regional Dashboard (14 tasks)](#regional-dashboard)
12. [Reports & Exports (4 tasks)](#reports--exports)
13. [Testing (8 tasks)](#testing)
14. [Deployment & Operations (4 tasks)](#deployment--operations)

---

## Project Overview & Task Structure

### Task Dependency Map

```
Setup (1-6)
  ↓
Database (7-14)
  ↓
Authentication (15-20)
  ├→ Backend API: Master Data (21-28)
  │   ├→ Backend API: Core Operations (29-38)
  │   └→ Backend API: Reporting (39-44)
  │
  ├→ Frontend Shared Components (45-52)
  │   ├→ Public Website (53-58)
  │   ├→ Super Admin Dashboard (59-70)
  │   └→ Regional Dashboard (71-84)
  │
  └→ Reports & Exports (85-88)
      ↓
      Testing (89-96)
        ↓
        Deployment (97-100)
```

### Task Acceptance Criteria Template

Every task must meet these criteria:

- **Code Quality:** All code follows TypeScript strict mode, ESLint passes, Prettier formatting
- **Testing:** Unit tests for business logic, integration tests for API routes (where applicable)
- **Documentation:** Inline comments for non-obvious logic, updated README/AGENTS.md if setup changes
- **Git Commit:** Atomic commit with descriptive message following conventional commits
- **No Breaking Changes:** Doesn't break existing tests or functionality
- **Performance:** API responses < 300ms for list endpoints (p95)

---

## Setup & Infrastructure

### Task 1: Project Initialization & Dependency Setup
**Duration:** 2–3 hours  
**Depends on:** Nothing

**Description:**
Initialize the Next.js repository with all required dependencies and configuration files.

**Acceptance Criteria:**
- [ ] Next.js 15+ with App Router configured
- [ ] TypeScript with strict mode enabled
- [ ] ESLint configured (airbnb config + Next.js plugin)
- [ ] Prettier configured with 2-space indent
- [ ] Tailwind CSS 3+ integrated with shadcn/ui setup
- [ ] `.env.local` template created (with example values)
- [ ] `.gitignore` updated for build artifacts
- [ ] `tsconfig.json` with path aliases (`@/components`, `@/lib`, etc.)
- [ ] `package.json` scripts: dev, build, start, lint, format, test
- [ ] README.md created with local development setup instructions

**Git Commit:**
```
feat: initialize Next.js project with TypeScript, Tailwind, shadcn/ui
```

**Notes:**
- Use `create-next-app@latest` as baseline, then customize
- Lock Node version (`.nvmrc`) to 20.x or later

---

### Task 2: Tailwind Theme Configuration & Brand Colors
**Duration:** 1.5–2 hours  
**Depends on:** Task 1

**Description:**
Configure Tailwind theme tokens with Anak Juara brand colors (orange-family) and design system constants.

**Acceptance Criteria:**
- [ ] Tailwind config extended with custom color palette:
  - Primary orange: #F59E0B (amb-500)
  - Secondary teal: #14B8A6
  - Success, warning, error colors mapped
  - Neutral grays (50–900)
- [ ] Typography config (Inter font stack, heading/body weights)
- [ ] Spacing/padding scale follows Stisla conventions
- [ ] Custom utility classes for dashboard backgrounds, card styles
- [ ] `@/styles/globals.css` includes theme documentation
- [ ] All colors tested for WCAG AA contrast ratios

**Git Commit:**
```
design: configure Tailwind theme with brand colors and typography
```

**Notes:**
- Document color usage in `@/lib/constants.ts`

---

### Task 3: Environment Variables & Configuration Management
**Duration:** 1.5–2 hours  
**Depends on:** Task 1

**Description:**
Set up environment variable schema, validation, and configuration management.

**Acceptance Criteria:**
- [ ] `.env.example` created with all required variables (database, auth, API)
- [ ] `@/lib/config.ts` created to parse and validate environment variables on startup
- [ ] Zod schema defined for environment validation
- [ ] Error thrown on missing/invalid environment variables (fail-fast)
- [ ] Development, staging, production environment docs created
- [ ] Vercel environment variables documented (no secrets in comments)
- [ ] Configuration accessible via typed `getConfig()` function

**Git Commit:**
```
chore: add environment variable schema and configuration management
```

**Notes:**
- Never log or expose secrets
- Use process.env only via config module

---

### Task 4: Database Connection Pool Setup (Neon/PostgreSQL)
**Duration:** 2–3 hours  
**Depends on:** Task 3

**Description:**
Configure serverless-compatible PostgreSQL connection pooling for Vercel deployment.

**Acceptance Criteria:**
- [ ] Neon PostgreSQL connection configured (or Vercel Postgres)
- [ ] Connection pool/HTTP driver integrated (e.g., `postgres` library with serverless support)
- [ ] `@/lib/db.ts` exports typed query functions
- [ ] Connection pooling validated (no connection leaks on Vercel functions)
- [ ] Development database branch created (Neon branching)
- [ ] Database URL safely stored in environment variables
- [ ] Connection health check implemented (test on app startup)

**Git Commit:**
```
chore: configure serverless PostgreSQL connection pool
```

**Notes:**
- Use native `postgres` package or Vercel's `@vercel/postgres`
- Test with disposable database branch

---

### Task 5: TypeScript Types & API Contract Definitions
**Duration:** 2–2.5 hours  
**Depends on:** Task 1

**Description:**
Define TypeScript types for database models, API requests/responses, and domain entities.

**Acceptance Criteria:**
- [ ] `@/types/models.ts` — Database entity types (Child, Coordinator, Session, etc.)
- [ ] `@/types/api.ts` — API request/response envelopes (pagination, errors)
- [ ] `@/types/ui.ts` — Component prop types
- [ ] Types match PostgreSQL schema (10 schemas × 34 tables)
- [ ] Zod schemas for request validation (mirrors types)
- [ ] Discriminated unions for status fields (Attendance, Evaluation, etc.)
- [ ] Exported from single entry point (`@/types/index.ts`)

**Git Commit:**
```
types: define TypeScript types for domain models and API contracts
```

**Notes:**
- Use Zod for runtime validation of API payloads
- Keep types tightly coupled to database schema

---

### Task 6: GitHub Actions CI/CD Pipeline Configuration
**Duration:** 2–3 hours  
**Depends on:** Tasks 1, 3

**Description:**
Set up automated CI/CD pipeline for linting, type-checking, testing, and preview deployments.

**Acceptance Criteria:**
- [ ] `.github/workflows/ci.yml` created with:
  - Node.js setup (20.x)
  - Install dependencies (npm ci)
  - Lint check (ESLint)
  - Type check (TypeScript)
  - Run tests (Jest)
  - Build check (next build)
- [ ] `.github/workflows/deploy.yml` for Vercel preview deployments on PR
- [ ] Branch protection rules configured (require CI pass before merge)
- [ ] Test coverage tracking configured
- [ ] Vercel integration token stored in GitHub Secrets
- [ ] Pull request comments with build status

**Git Commit:**
```
ci: add GitHub Actions CI/CD pipeline for linting, testing, deployment
```

**Notes:**
- CI runs on every push and PR
- Must pass before PR can be merged

---

## Database & Schema

### Task 7: Create PostgreSQL Schema: Geography
**Duration:** 2–2.5 hours  
**Depends on:** Task 4

**Description:**
Create geography schema (province, district, subdistrict, village, location) with indexes and constraints.

**Acceptance Criteria:**
- [ ] Geography schema namespace created
- [ ] Tables created: province, district, subdistrict, village, location
- [ ] Primary keys (BIGSERIAL) and foreign keys with correct delete rules (RESTRICT)
- [ ] Unique constraints on name fields per parent
- [ ] Indexes on all foreign keys
- [ ] `active` flag for soft-delete (province)
- [ ] created_at/updated_at audit columns
- [ ] Initial seed data (Indonesia provinces, major districts)
- [ ] Migration file generated and tested

**Git Commit:**
```
database: create geography schema with provinces, districts, villages
```

**Notes:**
- Reference ERD for exact schema
- Use SET SEARCH_PATH for schema isolation
- Seed with real Indonesia geographic data

---

### Task 8: Create PostgreSQL Schema: Organization & Person
**Duration:** 2.5–3 hours  
**Depends on:** Task 7

**Description:**
Create organization (office, coaching_region, facility) and person (child, family_member, household_member, child_education, coordinator, donor) schemas.

**Acceptance Criteria:**
- [ ] Organization schema: office, coaching_region, facility tables
  - Office self-reference (parent_office_id, RESTRICT, no circular refs)
  - coaching_region belongs to office (RESTRICT)
  - facility belongs to office (RESTRICT)
- [ ] Person schema: child, family_member, household_member, child_education, coordinator, donor
  - child (minimal: full_name, active)
  - family_member (CASCADE on child delete)
  - household_member (versioned with effective_from/to)
  - child_education (temporal: effective_from/to, CASCADE on child, RESTRICT on school)
  - coordinator (phone, office_id nullable)
  - donor (full_name, active)
- [ ] All primary keys, foreign keys, indexes
- [ ] Audit columns (created_at, updated_at)
- [ ] Migration file generated and tested

**Git Commit:**
```
database: create organization and person schemas
```

**Notes:**
- Office hierarchy must prevent circular references (CHECK constraint)
- Temporal tables (child_education, household_member) have business logic in app layer

---

### Task 9: Create PostgreSQL Schema: Reference & Access Control
**Duration:** 2–2.5 hours  
**Depends on:** Task 8

**Description:**
Create reference lookup tables (session_type, attendance_status, etc.) and access control (role, permission, role_permission).

**Acceptance Criteria:**
- [ ] Reference schema tables:
  - session_type (code, name, active)
  - attendance_status (Hadir/Izin/Alfa)
  - welfare_category (Yatim/Piatu/Dhuafa)
  - semester (year, term, start_date, end_date, CHECK date validation)
  - role (Super Admin / Branch Admin / Korwil)
- [ ] Access control schema:
  - permission (name, description)
  - role_permission (composite PK: role_id, permission_id)
- [ ] All RESTRICT delete rules (references must not be deleted)
- [ ] Initial seed data for all reference values
- [ ] Indexes on all FK columns
- [ ] Migration file generated and tested

**Git Commit:**
```
database: create reference and access control schemas
```

**Notes:**
- Use VARCHAR + CHECK for enums (not native ENUM)
- Seed with program-specific reference values

---

### Task 10: Create PostgreSQL Schema: Program & Sponsorship
**Duration:** 2–2.5 hours  
**Depends on:** Task 9

**Description:**
Create program (program, child_enrollment) and sponsorship (child_donor_pairing, pairing_balance_snapshot) schemas.

**Acceptance Criteria:**
- [ ] Program schema:
  - program (name, active)
  - child_enrollment (child_id CASCADE, program_id RESTRICT, welfare_category_id RESTRICT, enrollment_date)
  - UNIQUE (child_id, program_id)
- [ ] Sponsorship schema:
  - child_donor_pairing (child_id RESTRICT, donor_id RESTRICT, program_id RESTRICT, pairing_date, end_date nullable, CHECK end_date >= pairing_date)
  - pairing_balance_snapshot (pairing_id RESTRICT, semester_id RESTRICT, closing_balance NUMERIC(14,2), UNIQUE (pairing_id, semester_id))
- [ ] All RESTRICT delete rules (preserve audit trail)
- [ ] NUMERIC type for monetary amounts (exact, not float)
- [ ] Indexes on all FKs
- [ ] Migration file generated and tested

**Git Commit:**
```
database: create program and sponsorship schemas
```

**Notes:**
- RESTRICT is critical here; financial records must never cascade-delete
- NUMERIC(14,2) for all monetary columns

---

### Task 11: Create PostgreSQL Schema: Activity (Coaching & Hafalan)
**Duration:** 2.5–3 hours  
**Depends on:** Task 8, Task 10

**Description:**
Create activity schema for coaching sessions and hafalan tracking (coaching_session, session_attendance, session_habit_tracking, hafalan_item_lookup, hafalan_assessment).

**Acceptance Criteria:**
- [ ] Activity schema tables:
  - coaching_session (region_id RESTRICT, presenter_id → coordinator RESTRICT, session_type_id RESTRICT, session_date, location_id RESTRICT)
  - session_attendance (session_id CASCADE, child_id CASCADE, attendance_status_id RESTRICT, child_snapshot JSONB, UNIQUE (session_id, child_id))
  - session_habit_tracking (attendance_id CASCADE, habit_type VARCHAR, status VARCHAR + CHECK)
  - hafalan_item_lookup (name, category, active)
  - hafalan_assessment (item_id RESTRICT, child_id CASCADE, assessor_id RESTRICT, status VARCHAR + CHECK, assessed_date, UNIQUE (child_id, item_id))
- [ ] GIN index on child_snapshot JSONB column
- [ ] All audit columns, FKs, indexes
- [ ] Migration file generated and tested

**Git Commit:**
```
database: create activity schema for coaching sessions and hafalan
```

**Notes:**
- child_snapshot captures point-in-time child data (name, age, etc.) so reports aren't affected by later edits
- GIN index on JSONB for search capability

---

### Task 12: Create PostgreSQL Schema: Evaluation & Finance
**Duration:** 2–2.5 hours  
**Depends on:** Task 9, Task 11

**Description:**
Create evaluation (evaluation_item, semester_evaluation, evaluation_item_score) and finance (transaction) schemas.

**Acceptance Criteria:**
- [ ] Evaluation schema:
  - evaluation_item (name, category, active)
  - semester_evaluation (child_id CASCADE, semester_id RESTRICT, evaluator_id RESTRICT, approver_id nullable RESTRICT, UNIQUE (child_id, semester_id))
  - evaluation_item_score (evaluation_id CASCADE, item_id RESTRICT, score NUMERIC, CHECK score BETWEEN 0 AND 100, UNIQUE (evaluation_id, item_id))
- [ ] Finance schema:
  - transaction (pairing_id RESTRICT, transaction_type VARCHAR + CHECK, amount NUMERIC(14,2) CHECK > 0, transaction_date, no updated_at)
- [ ] All RESTRICT on financial/evaluation records (no cascading deletes)
- [ ] No soft-delete on financial records (immutable)
- [ ] Indexes on all FKs
- [ ] Migration file generated and tested

**Git Commit:**
```
database: create evaluation and finance schemas
```

**Notes:**
- Finance schema is most tightly guarded; no CASCADE, no updated_at, RESTRICT everywhere
- Evaluations preserve approver history (nullable but RESTRICT)

---

### Task 13: Create Database Seed Data & Initial Migrations
**Duration:** 2–3 hours  
**Depends on:** Tasks 7–12

**Description:**
Create seed data for reference tables and initial office/region/coordinator data. Generate migration file from schema specifications.

**Acceptance Criteria:**
- [ ] Migration file `001_create_all_schemas.sql` covers all 10 schemas and 34 tables
- [ ] Seed script `seed.sql` or `seed/` directory with:
  - Reference data (session types, attendance statuses, welfare categories, semesters, roles)
  - Sample office hierarchy (1 root office, 3 regional offices, 5 branches)
  - Sample coordinators linked to offices/regions
  - Initial permissions/role assignments
- [ ] Migration tested on fresh Neon development branch (all tables created successfully)
- [ ] Seed data tested (foreign key constraints work, no orphaned rows)
- [ ] Documentation in `@/lib/db.ts` for running migrations

**Git Commit:**
```
database: add migration and seed data for all schemas
```

**Notes:**
- Use Neon branching for safe testing
- Seed must preserve referential integrity

---

### Task 14: Add Update Triggers & Audit Columns
**Duration:** 1.5–2 hours  
**Depends on:** Task 13

**Description:**
Create database-level triggers for automatically updating `updated_at` timestamps and add audit trail function.

**Acceptance Criteria:**
- [ ] `set_updated_at()` trigger function created
- [ ] Trigger applied to all tables (except finance.transaction)
- [ ] Tested: verify `updated_at` updates on any row modification
- [ ] Optional: `audit_log` table for capturing row-level changes (INSERT/UPDATE/DELETE)
- [ ] Audit log trigger function created (if implementing audit trail)
- [ ] Documentation in migration comments

**Git Commit:**
```
database: add updated_at triggers and audit trail infrastructure
```

**Notes:**
- `updated_at` must never require app-layer discipline to maintain
- Audit trail is optional in Phase 1 but infrastructure laid out

---

## Authentication & Authorization

### Task 15: Create Session-Based Auth Middleware
**Duration:** 2.5–3 hours  
**Depends on:** Tasks 4, 5

**Description:**
Implement session-based authentication middleware using httpOnly cookies and server-side session store.

**Acceptance Criteria:**
- [ ] `@/lib/auth.ts` exports:
  - `createSession(userId, role)` — creates encrypted session
  - `getSession(req)` — retrieves session from httpOnly cookie
  - `destroySession(res)` — clears session cookie
- [ ] Session data stored in Redis or database (disposable, temporary)
- [ ] Session cookie:
  - httpOnly (inaccessible to JavaScript)
  - Secure (HTTPS only in production)
  - SameSite=Strict
  - 24-hour expiration (configurable)
- [ ] `@/middleware.ts` validates session on all authenticated routes
- [ ] Middleware redirects unauthenticated users to `/login`
- [ ] Role information stored in session, accessible in pages/API

**Git Commit:**
```
feat: implement session-based authentication with httpOnly cookies
```

**Notes:**
- Use `iron-session` or similar for cookie encryption
- Session must be validated on every request
- Test with `curl` to verify httpOnly flag

---

### Task 16: Create Login Page & Authentication API Route
**Duration:** 2–2.5 hours  
**Depends on:** Task 15

**Description:**
Implement login page with form validation and API endpoint for credential verification.

**Acceptance Criteria:**
- [ ] Login page route: `(auth)/login/page.tsx`
  - Form: username, password, reCAPTCHA (if deployed)
  - Validation: username/password required, min 6 chars
  - Feedback: error messages inline, loading state on submit
  - Accessibility: semantic form, focus management, ARIA labels
- [ ] API route: `api/auth/login` (POST)
  - Accepts { username, password }
  - Queries `person.system_user` with bcrypt comparison
  - Returns error if credentials invalid (rate-limit after 3 failures)
  - Creates session on success
  - Returns JSON: { success: true, redirect: "/dashboard" }
- [ ] Password hashing: bcrypt with salt rounds 12
- [ ] Testing: basic happy path test (mock database)

**Git Commit:**
```
feat: add login page and authentication API endpoint
```

**Notes:**
- Don't reveal whether username or password is wrong (for security)
- Use rate limiting to prevent brute force
- Return 401 Unauthorized on invalid credentials

---

### Task 17: Create Logout & Session Refresh Routes
**Duration:** 1.5–2 hours  
**Depends on:** Task 15

**Description:**
Implement logout and session refresh API endpoints.

**Acceptance Criteria:**
- [ ] API route: `api/auth/logout` (POST)
  - Clears session cookie
  - Returns { success: true }
- [ ] API route: `api/auth/session` (GET)
  - Returns current session data (userId, role, username)
  - Returns null if not authenticated
  - Used by client to check auth state
- [ ] API route: `api/auth/refresh` (POST)
  - Extends session expiration by 24 hours
  - Called automatically on page focus (via client hook)
- [ ] All routes tested with authenticated/unauthenticated requests

**Git Commit:**
```
feat: add logout and session refresh endpoints
```

**Notes:**
- Session refresh prevents timeout during active use
- `/api/auth/session` used by `useAuth` hook on client

---

### Task 18: Implement Role-Based Access Control (RBAC)
**Duration:** 2–2.5 hours  
**Depends on:** Task 16

**Description:**
Implement middleware and utility functions for role-based route protection and feature access.

**Acceptance Criteria:**
- [ ] `@/lib/auth.ts` extended with:
  - `requireRole(allowedRoles: string[])` — middleware factory for route protection
  - `hasRole(session, role: string)` — boolean check
  - `hasPermission(session, permission: string)` — future feature-level granularity
- [ ] Route group protection:
  - `(super-admin)/*` requires role="Super Admin"
  - `(regional)/*` requires role="Branch Admin" OR "Korwil"
  - `(public)/*` no auth required
- [ ] Middleware redirects unauthorized users to `/login`
- [ ] Test: verify unauthorized access is blocked, authorized access allowed

**Git Commit:**
```
feat: implement role-based access control middleware
```

**Notes:**
- Row-level scoping (which children/offices a user sees) is application layer, not middleware
- This is role-based, not feature-based (Phase 1)

---

### Task 19: Create Password Reset Flow (Email Sending)
**Duration:** 2–3 hours  
**Depends on:** Task 15

**Description:**
Implement password reset request, token generation, and reset page.

**Acceptance Criteria:**
- [ ] Page: `(auth)/forgot-password/page.tsx`
  - Form: email input
  - Submits to `api/auth/forgot-password` (POST)
  - Shows confirmation message
- [ ] API route: `api/auth/forgot-password` (POST)
  - Accepts { email }
  - Finds user by email (or username+email)
  - Generates secure token (JWT with 1-hour expiration)
  - Sends email with reset link (uses Resend, SendGrid, or similar)
  - Returns { success: true } (don't leak user existence)
- [ ] Page: `(auth)/reset-password/[token]/page.tsx`
  - Validates token (JWT decode, check expiration)
  - Form: new password, confirm password
  - Submits to `api/auth/reset-password` (POST)
  - Updates password and clears session
- [ ] Email template: plain text + branded HTML (if applicable)

**Git Commit:**
```
feat: implement password reset flow with email confirmation
```

**Notes:**
- Token should be short-lived (1 hour)
- Email service configured via environment variable
- Test with mock email service in dev

---

### Task 20: Create User Account & Permission Seeding
**Duration:** 1.5–2 hours  
**Depends on:** Task 9, Task 16

**Description:**
Create initial Super Admin account and populate role/permission data.

**Acceptance Criteria:**
- [ ] Seed script creates default roles: Super Admin, Branch Admin, Korwil
- [ ] Seed script creates permissions:
  - read_child, create_child, edit_child, delete_child
  - read_session, create_session, edit_session
  - read_evaluation, create_evaluation, approve_evaluation
  - read_finance (Super Admin only)
- [ ] Permissions linked to roles (role_permission junction table)
- [ ] Initial Super Admin user created:
  - Username: `admin` (changeable later)
  - Temporary password: generated and displayed once
  - Email: configured via env var
  - Must change password on first login
- [ ] Script: `scripts/create-admin.ts` for adding new Super Admin users
- [ ] Documentation: how to run seed, where to find temporary password

**Git Commit:**
```
chore: seed initial roles, permissions, and Super Admin user
```

**Notes:**
- Super Admin temporary password logged to console (never stored)
- Script should be idempotent (can run multiple times safely)

---

## Backend API — Master Data

### Task 21: Implement Offices API (GET List, GET Detail, POST Create, PUT Update, DELETE Soft-Delete)
**Duration:** 2.5–3 hours  
**Depends on:** Tasks 4, 15, 18

**Description:**
Implement full CRUD API for office management (Kantor).

**Acceptance Criteria:**
- [ ] Route: `api/super-admin/offices`
  - GET: List offices with pagination (keyset-based), sort by name
    - Query params: `limit`, `lastId`, `sort`
    - Returns: { data: Office[], pageInfo: { nextCursor } }
  - POST: Create new office
    - Body: { name, parentOfficeId (nullable), active }
    - Validates: name not empty, no circular office hierarchy
    - Returns: { id, name, ... }
- [ ] Route: `api/super-admin/offices/[id]`
  - GET: Retrieve office detail with child count, region count
  - PUT: Update office (name, parent, active)
  - DELETE: Soft-delete (set active=false), but only if no dependent regions (RESTRICT check)
- [ ] Validation: Zod schema for request/response
- [ ] Error handling: 400 Bad Request, 404 Not Found, 409 Conflict (hierarchy violation)
- [ ] Tests: unit test for circular reference check, integration test for API

**Git Commit:**
```
feat: implement offices API with CRUD operations
```

**Notes:**
- Office can't be its own parent (CHECK in migration already, app-layer validation redundant)
- Soft-delete via active flag, not hard delete

---

### Task 22: Implement Coaching Regions API
**Duration:** 2–2.5 hours  
**Depends on:** Task 21

**Description:**
Implement full CRUD API for coaching regions (Wilayah Pembinaan).

**Acceptance Criteria:**
- [ ] Route: `api/super-admin/regions`
  - GET: List regions with pagination, filter by office_id
  - POST: Create region (name, office_id, active)
  - Validates: office_id exists
- [ ] Route: `api/super-admin/regions/[id]`
  - GET: Detail with office name, # of children, # of recent sessions
  - PUT: Update (name, office_id, active)
  - DELETE: Soft-delete (RESTRICT if any child enrolled in region)
- [ ] Validation: Zod schema
- [ ] Tests: basic CRUD + constraint enforcement

**Git Commit:**
```
feat: implement coaching regions API
```

**Notes:**
- Regions belong to exactly one office (RESTRICT on delete)

---

### Task 23: Implement Coordinators API
**Duration:** 2–2.5 hours  
**Depends on:** Task 21

**Description:**
Implement full CRUD API for coordinators (SDM Wilayah).

**Acceptance Criteria:**
- [ ] Route: `api/super-admin/coordinators`
  - GET: List coordinators with pagination, filter by office_id, sort by name
  - POST: Create coordinator (full_name, phone, office_id nullable, active)
- [ ] Route: `api/super-admin/coordinators/[id]`
  - GET: Detail with office, region(s), # sessions led, # evaluations
  - PUT: Update (name, phone, office, active)
  - DELETE: Soft-delete (RESTRICT if linked to system_user)
- [ ] Validation: phone format (10–12 digits)
- [ ] Tests: CRUD operations

**Git Commit:**
```
feat: implement coordinators API
```

**Notes:**
- Coordinator account (system_user) is linked separately in user management task

---

### Task 24: Implement Semesters API
**Duration:** 1.5–2 hours  
**Depends on:** Task 9

**Description:**
Implement CRUD API for academic semesters.

**Acceptance Criteria:**
- [ ] Route: `api/super-admin/semesters`
  - GET: List all semesters, sort by year/term
  - POST: Create semester (name, year, term, start_date, end_date)
- [ ] Route: `api/super-admin/semesters/[id]`
  - GET: Detail with # evaluations, date range validation
  - PUT: Update (name, dates, active)
  - DELETE: Soft-delete (don't hard-delete; evaluations reference this)
- [ ] Validation: end_date > start_date, date format (ISO 8601)
- [ ] Tests: date validation

**Git Commit:**
```
feat: implement semesters API
```

**Notes:**
- Semesters are immutable once evaluations created (should enforce in UI, optional in API)

---

### Task 25: Implement Evaluation Items API
**Duration:** 1.5–2 hours  
**Depends on:** Task 9

**Description:**
Implement CRUD API for evaluation items/aspects (Aspek Cerdas, Aspek Mandiri, etc.).

**Acceptance Criteria:**
- [ ] Route: `api/super-admin/evaluation-items`
  - GET: List all evaluation items, group by category
  - POST: Create item (name, category, active)
- [ ] Route: `api/super-admin/evaluation-items/[id]`
  - GET: Detail with # evaluations using this item
  - PUT: Update (name, category, active)
  - DELETE: Soft-delete (RESTRICT if evaluations reference)
- [ ] Validation: name not empty
- [ ] Tests: CRUD

**Git Commit:**
```
feat: implement evaluation items API
```

**Notes:**
- Evaluation items are stable reference data; rarely change

---

### Task 26: Implement Hafalan Items API
**Duration:** 1.5–2 hours  
**Depends on:** Task 9

**Description:**
Implement CRUD API for hafalan items (Qur'an surahs, prayers, du'as).

**Acceptance Criteria:**
- [ ] Route: `api/super-admin/hafalan-items`
  - GET: List items, group by category (Qur'an Surah / Prayer / Du'a)
  - POST: Create item (name, category, active)
- [ ] Route: `api/super-admin/hafalan-items/[id]`
  - GET: Detail with # children assessed
  - PUT: Update (name, category, active)
  - DELETE: Soft-delete (RESTRICT if assessments reference)
- [ ] Validation: name, category
- [ ] Tests: CRUD

**Git Commit:**
```
feat: implement hafalan items API
```

**Notes:**
- Hafalan items are master data; support bulk import from CSV (future)

---

### Task 27: Implement System Users & Role Management API
**Duration:** 2.5–3 hours  
**Depends on:** Task 20

**Description:**
Implement API for creating, listing, and managing system users and their roles.

**Acceptance Criteria:**
- [ ] Route: `api/super-admin/users`
  - GET: List users with pagination, filter by role/office, search by username
  - POST: Create user
    - Body: { username, email, role, office_id (if Branch Admin/Korwil), coordinatorId (if Korwil) }
    - Generate temporary password (display once, send via email)
    - Set password_hash via bcrypt
- [ ] Route: `api/super-admin/users/[id]`
  - GET: User detail (don't return password_hash)
  - PUT: Update role, office, active status
  - DELETE: Soft-delete or hard-delete (discuss with PM)
- [ ] Route: `api/super-admin/users/[id]/reset-password` (POST)
  - Generates temporary password, sends email
- [ ] Validation: username unique, email format, role exists
- [ ] Tests: create user, role assignment, password reset

**Git Commit:**
```
feat: implement system users and role management API
```

**Notes:**
- Coordinator must exist before linking to user account
- Role determines available routes and features

---

### Task 28: Implement Donors API
**Duration:** 1.5–2 hours  
**Depends on:** Task 4

**Description:**
Implement CRUD API for donor management.

**Acceptance Criteria:**
- [ ] Route: `api/super-admin/donors`
  - GET: List donors, filter by active, search by name
  - POST: Create donor (full_name, email optional, phone optional)
- [ ] Route: `api/super-admin/donors/[id]`
  - GET: Detail with # children sponsored, total donations
  - PUT: Update (name, contact, active)
  - DELETE: Soft-delete (RESTRICT if active sponsorships)
- [ ] Validation: name not empty
- [ ] Tests: CRUD

**Git Commit:**
```
feat: implement donors API
```

**Notes:**
- Donor account (system_user) is separate; created only if donor logs in (future)

---

## Backend API — Core Operations

### Task 29: Implement Children API (List, Get, Create, Update, Deactivate)
**Duration:** 3–4 hours  
**Depends on:** Task 21, 27

**Description:**
Implement comprehensive children management API with registration, profile updates, and related entity management (family, education, enrollment).

**Acceptance Criteria:**
- [ ] Route: `api/regional/children`
  - GET: List children (scoped by coordinator's region/office)
    - Pagination (keyset), filter by welfare category, search by name
    - Returns: { childId, name, age, welfareCategory, enrollmentDate, active }
  - POST: Register new child
    - Body: { fullName, dob, gender, welfareCategory, programId, enrollmentDate }
    - Creates child + child_enrollment record
- [ ] Route: `api/regional/children/[id]`
  - GET: Full child profile with family, education, enrollment, hafalan, evaluations
  - PUT: Update child profile (name, DOB, gender, active)
  - DELETE: Soft-delete (set active=false, RESTRICT child_enrollment deletion)
- [ ] Route: `api/regional/children/[id]/family`
  - GET: List family members
  - POST: Add family member (full_name, relationship)
  - PUT: Update family member
  - DELETE: Delete family member (CASCADE)
- [ ] Route: `api/regional/children/[id]/education`
  - GET: List education records (current + historical)
  - POST: Add education record (school_id, education_level, grade, effective_date)
  - PUT: Update education record (end_date to close enrollment)
- [ ] Validation: DOB not in future, family relationships valid
- [ ] Scoping: Coordinator sees only children in their region
- [ ] Tests: child creation, family/education management, access control

**Git Commit:**
```
feat: implement comprehensive children management API
```

**Notes:**
- Child profile is the central entity; nearly everything hangs off it
- Scoping by region/office is critical for Korwil isolation
- Photo upload handled separately (Task TBD)

---

### Task 30: Implement Coaching Sessions API (Create, List, Get, Update)
**Duration:** 3–4 hours  
**Depends on:** Task 21, 29

**Description:**
Implement API for creating coaching sessions and recording attendance per child.

**Acceptance Criteria:**
- [ ] Route: `api/regional/coaching-sessions`
  - GET: List sessions (scoped by coordinator's region)
    - Pagination, filter by date range, filter by session type
    - Returns: { sessionId, date, type, region, # attended, attendance rate }
  - POST: Create session
    - Body: { sessionDate, sessionTypeId, regionId, presenterId (coordinator), locationId }
    - Creates coaching_session record
    - Returns session ID
- [ ] Route: `api/regional/coaching-sessions/[id]`
  - GET: Session detail with attendance roster (per child)
  - PUT: Update session (date, type, location)
  - DELETE: Delete session (CASCADE deletes attendance records)
- [ ] Route: `api/regional/coaching-sessions/[id]/attendance`
  - GET: List attendance records for session
  - POST: Add/update attendance for a child
    - Body: { childId, attendanceStatusId (Hadir/Izin/Alfa), mandiriHabits (prayer, recitation, etc.) }
    - Creates session_attendance + session_habit_tracking records
  - PUT: Update attendance (status, mandiri habits)
- [ ] Validation: session date not in future (or discuss with PM)
- [ ] Scoping: Coordinator can only access their own sessions
- [ ] Tests: session creation, attendance recording, mandiri habit tracking

**Git Commit:**
```
feat: implement coaching sessions API with attendance tracking
```

**Notes:**
- Session presenter (coordinator) must exist and belong to requested region
- Mandiri habits are per attendance, multiple habit statuses per child per session
- child_snapshot is captured on attendance insert (point-in-time data)

---

### Task 31: Implement Hafalan Assessment API
**Duration:** 2.5–3 hours  
**Depends on:** Task 26, 29

**Description:**
Implement API for recording hafalan (memorization) progress per child.

**Acceptance Criteria:**
- [ ] Route: `api/regional/hafalan/[childId]`
  - GET: List hafalan items with assessment status for this child
    - Returns: { itemId, name, category, status (Not Started/Partial/Completed), assessedDate }
  - POST: Add/update hafalan assessment
    - Body: { itemId, status, assessorId (coordinator), assessedDate }
    - Creates/updates hafalan_assessment record
- [ ] Validation: itemId exists, childId exists, status valid, assessor is a coordinator
- [ ] Scoping: Coordinator can only assess children in their region
- [ ] Tests: assessment recording, status transitions

**Git Commit:**
```
feat: implement hafalan assessment API
```

**Notes:**
- One assessment per child per item (UNIQUE constraint in DB)
- Status can regress (Completed → Partial) if needed
- Assessor (coordinator) tracks who verified the hafalan

---

### Task 32: Implement Evaluations API (Create, List, Get, Edit, Submit, Approve)
**Duration:** 3.5–4 hours  
**Depends on:** Task 25, 29, 31

**Description:**
Implement comprehensive evaluations API for semester report cards (Penilaian/Laporan Semester).

**Acceptance Criteria:**
- [ ] Route: `api/regional/evaluations`
  - GET: List evaluations (scoped by coordinator)
    - Filter by semester, filter by status (Draft/Submitted/Approved/Rejected)
    - Returns: { evaluationId, childId, childName, semester, status, lastModified }
  - POST: Create evaluation (Draft)
    - Body: { childId, semesterId, evaluatorId (coordinator) }
    - Creates semester_evaluation record
- [ ] Route: `api/regional/evaluations/[id]`
  - GET: Full evaluation detail (scores, notes, approval status)
  - PUT: Update evaluation (scores, coach notes, suara anak juara)
    - Body: { itemScores: [{ itemId, score }], coachNotes, suaraAnakJuara }
    - Validates: scores 0-100, at least one item scored
  - DELETE: Delete if status=Draft (RESTRICT if Submitted or approved)
- [ ] Route: `api/regional/evaluations/[id]/submit`
  - POST: Submit evaluation for approval (transitions Draft → Submitted)
  - Returns: { status: "submitted" }
- [ ] Route: `api/super-admin/evaluations/[id]/approve`
  - POST: Approve evaluation (transitions Submitted → Approved, sets approverId)
  - Body: { approverComment (optional) }
  - Returns: { status: "approved", approvedBy, approvedAt }
- [ ] Route: `api/super-admin/evaluations/[id]/reject`
  - POST: Reject evaluation (returns to Draft, sets reason)
  - Body: { reason }
- [ ] Validation: all scores present, child exists, semester exists, evaluator exists
- [ ] Scoping: Coordinator can only edit own evaluations; Super Admin can approve/reject
- [ ] Tests: create, edit, submit, approve workflow

**Git Commit:**
```
feat: implement evaluations API with multi-step approval workflow
```

**Notes:**
- Evaluation is Draft until submitted; only coordinators can edit Draft
- Submitted evaluations can't be edited by coordinators; Super Admin only
- Approval state machine: Draft → Submitted → Approved OR Rejected → Draft (on rejection)

---

### Task 33: Implement Bulk Evaluation Generation API
**Duration:** 2–2.5 hours  
**Depends on:** Task 32, 25

**Description:**
Implement API for bulk-generating evaluations from session/hafalan data (semi-automatic).

**Acceptance Criteria:**
- [ ] Route: `api/regional/evaluations/generate-bulk`
  - POST: Generate evaluations for multiple children in a semester
  - Body: { semesterId, childIds (array), autoPopulateFromData (boolean) }
  - If autoPopulateFromData=true:
    - Calculate avg session attendance rate for each child
    - Calculate hafalan completion % for each child
    - Map to evaluation scores (pre-fill scores, coordinator refines)
  - Creates one Draft evaluation per child (if not already exists)
  - Returns: { created: 5, skipped: 2 (already exist) }
- [ ] Validation: semesterId exists, childIds valid, no duplicate evaluations
- [ ] Tests: bulk generation with/without auto-population

**Git Commit:**
```
feat: implement bulk evaluation generation API
```

**Notes:**
- Auto-population is optional; if disabled, scores default to null (coordinator fills in)
- Evaluations created as Draft; can be edited or deleted before submit

---

### Task 34: Implement Child-Donor Pairing API
**Duration:** 2.5–3 hours  
**Depends on:** Task 28, 29

**Description:**
Implement API for managing sponsorship pairings (linking children to donors).

**Acceptance Criteria:**
- [ ] Route: `api/super-admin/pairings`
  - GET: List pairings, filter by status (Active/Pending/Ended)
    - Returns: { pairingId, childId, childName, donorId, donorName, program, pairingDate, status, balance }
  - POST: Create pairing
    - Body: { childId, donorId, programId, pairingDate, endDate (nullable) }
    - Validates: child/donor/program exist
- [ ] Route: `api/super-admin/pairings/[id]`
  - GET: Detail with transaction history, balance snapshot per semester
  - PUT: Update (endDate, status)
  - DELETE: Soft-delete (set endDate, don't hard-delete for audit trail)
- [ ] Route: `api/super-admin/pairings/[id]/balance-snapshot`
  - GET: List balance snapshots per semester
  - POST: Create balance snapshot (usually auto-generated at semester end)
    - Body: { semesterId, closingBalance }
- [ ] Validation: endDate >= pairingDate
- [ ] Scoping: Super Admin only
- [ ] Tests: pairing creation, balance tracking

**Git Commit:**
```
feat: implement child-donor pairing API with balance tracking
```

**Notes:**
- RESTRICT on all FKs (child, donor, program can't be deleted if active pairings)
- Balance snapshots are immutable once created

---

### Task 35: Implement Transaction API (Donations, Disbursements)
**Duration:** 2–2.5 hours  
**Depends on:** Task 34

**Description:**
Implement API for recording financial transactions (donations, disbursements, adjustments).

**Acceptance Criteria:**
- [ ] Route: `api/super-admin/transactions`
  - GET: List transactions, filter by type (Donation/Disbursement/Adjustment)
    - Filter by pairing, filter by date range
    - Returns: { transactionId, pairingId, type, amount, date, description }
  - POST: Create transaction
    - Body: { pairingId, type, amount, transactionDate, description }
- [ ] Route: `api/super-admin/transactions/[id]`
  - GET: Detail (read-only)
  - DELETE: Hard delete (admin-only, audit trail logs it)
- [ ] Validation: amount > 0, type valid, pairing exists
- [ ] Immutability: No updates to transactions (immutable financial record)
- [ ] Scoping: Super Admin only
- [ ] Tests: create transactions, prevent unauthorized updates

**Git Commit:**
```
feat: implement transaction API with immutable financial records
```

**Notes:**
- Transactions are financial records; never update or soft-delete
- If correction needed, create adjustment transaction with opposite amount + explanation

---

### Task 36: Implement Child Enrollment API
**Duration:** 1.5–2 hours  
**Depends on:** Task 29

**Description:**
Implement API for managing child program enrollments.

**Acceptance Criteria:**
- [ ] Route: `api/regional/children/[id]/enrollment`
  - GET: List enrollments for child
  - POST: Enroll child in program
    - Body: { childId, programId, welfareCategory, enrollmentDate }
    - Creates child_enrollment record
  - PUT: Update enrollment (welfareCategory, status)
- [ ] Validation: child/program exist, enrollment date not in future
- [ ] Scoping: Coordinator scoped to region
- [ ] Tests: enrollment creation

**Git Commit:**
```
feat: implement child enrollment API
```

**Notes:**
- Usually created at same time as child registration; API for later updates/corrections

---

### Task 37: Implement Location & Geography API
**Duration:** 1.5–2 hours  
**Depends on:** Task 7

**Description:**
Implement API for location/geographic hierarchy (provinces, districts, etc.).

**Acceptance Criteria:**
- [ ] Route: `api/public/geography/provinces`
  - GET: List provinces, filter by active
- [ ] Route: `api/public/geography/provinces/[id]/districts`
  - GET: List districts in province
- [ ] Route: `api/public/geography/districts/[id]/subdistricts`
  - GET: List subdistricts
- [ ] Route: `api/public/geography/subdistricts/[id]/villages`
  - GET: List villages
- [ ] Validation: IDs exist
- [ ] Caching: Use ISR or client-side caching (geography rarely changes)
- [ ] Tests: cascading dropdown behavior

**Git Commit:**
```
feat: implement geography API for location hierarchy
```

**Notes:**
- Read-only API; used for location picker dropdowns
- Cache aggressively (immutable data)

---

### Task 38: Implement Session Types & Reference Data API
**Duration:** 1.5–2 hours  
**Depends on:** Task 9

**Description:**
Implement API for all reference/lookup data (session types, attendance statuses, welfare categories, etc.).

**Acceptance Criteria:**
- [ ] Route: `api/public/reference/session-types`
  - GET: List session types (Reguler, Edukasi, P3A, Parenting)
- [ ] Route: `api/public/reference/attendance-statuses`
  - GET: List attendance statuses (Hadir, Izin, Alfa)
- [ ] Route: `api/public/reference/welfare-categories`
  - GET: List welfare categories (Yatim, Piatu, Dhuafa)
- [ ] Route: `api/public/reference/roles`
  - GET: List system roles (Super Admin, Branch Admin, Korwil)
- [ ] All routes support filter by active, return with code + name
- [ ] Caching: Aggressive ISR caching (immutable reference data)
- [ ] Tests: basic list operations

**Git Commit:**
```
feat: implement reference data API for dropdowns and filters
```

**Notes:**
- Read-only API
- Super Admin can CRUD reference data (separate admin API)

---

## Backend API — Reporting & Finance

### Task 39: Implement Finance Overview API (Aggregate Stats, Charts)
**Duration:** 2–2.5 hours  
**Depends on:** Task 35

**Description:**
Implement API for finance dashboard overview (totals, trends, breakdowns).

**Acceptance Criteria:**
- [ ] Route: `api/super-admin/finance/overview`
  - GET: Finance summary with date range filter
    - Query: `startDate`, `endDate`, `programId` (filter)
    - Returns: {
        totalDonations: number,
        totalDisbursements: number,
        currentBalance: number,
        activePairings: number,
        donationTrend: [{ date, amount }, ...],  // Monthly aggregates
        disbursementByProgram: [{ programName, amount }, ...]
      }
- [ ] Validation: date format, date range <= 365 days
- [ ] Performance: Use aggregate queries (SUM, COUNT) with indexes
- [ ] Caching: Cache for 1 hour (financial data updates infrequently)
- [ ] Tests: aggregate calculation accuracy

**Git Commit:**
```
feat: implement finance overview API with trend aggregates
```

**Notes:**
- Use database aggregates (SUM, COUNT, GROUP BY), not app-layer calculations
- Chart data returns monthly/weekly buckets for visualization

---

### Task 40: Implement Rekap Pembinaan (Coaching Session Report) API
**Duration:** 2.5–3 hours  
**Depends on:** Task 30

**Description:**
Implement API for coaching session recap report with filtering and export capability.

**Acceptance Criteria:**
- [ ] Route: `api/super-admin/reporting/recap-pembinaan`
  - GET: Coaching session recap with filters
    - Query: `startDate`, `endDate`, `officeId` (filter), `regionId` (filter), `format` (json/csv)
    - Returns: {
        summary: { totalSessions, totalAttendance, attendanceRate },
        sessions: [{ date, office, region, coordinator, sessionType, attended, absent, excused, rate }, ...]
      }
- [ ] Route: `api/regional/reporting/recap-pembinaan`
  - GET: Regional coordinator's recap (scoped to their region)
  - Same structure as above
- [ ] Query optimization: Use database aggregates, not app-layer calculations
- [ ] CSV export: Return CSV if format=csv
- [ ] Performance: < 300ms for < 1000 sessions
- [ ] Tests: aggregate accuracy, export format

**Git Commit:**
```
feat: implement Rekap Pembinaan report API with export
```

**Notes:**
- Attendance rate = attended / (attended + absent + excused) × 100
- CSV export includes headers and all rows

---

### Task 41: Implement Evaluation Report API
**Duration:** 2–2.5 hours  
**Depends on:** Task 32

**Description:**
Implement API for viewing/exporting evaluation reports.

**Acceptance Criteria:**
- [ ] Route: `api/super-admin/reporting/evaluations`
  - GET: Evaluation report with filters
    - Query: `semesterId`, `officeId`, `format` (json/csv)
    - Returns: {
        summary: { totalEvaluations, approved, pending, rejected },
        evaluations: [{ childId, childName, office, evaluator, status, avgScore }, ...]
      }
- [ ] Route: `api/regional/reporting/evaluations`
  - GET: Regional evaluations (scoped to region)
- [ ] CSV export: Include all columns and scores
- [ ] Performance: < 300ms for < 500 evaluations
- [ ] Tests: filtering, export

**Git Commit:**
```
feat: implement evaluation report API
```

**Notes:**
- Evaluation report is read-only (approval happens via separate endpoint)
- avgScore is average of all evaluation item scores per evaluation

---

### Task 42: Implement Audit Log API
**Duration:** 2–2.5 hours  
**Depends on:** Task 14, 18

**Description:**
Implement API for viewing audit trail (if audit_log table implemented in Task 14).

**Acceptance Criteria:**
- [ ] Route: `api/super-admin/audit-log`
  - GET: Audit trail with filters
    - Query: `startDate`, `endDate`, `userId`, `entityType`, `actionType`
    - Returns: [{ timestamp, user, entityType, entityId, entityName, action, oldValue, newValue }, ...]
  - Pagination: keyset-based
  - Sortable: by timestamp, user, action
- [ ] Validation: date range <= 90 days (prevent huge queries)
- [ ] Scoping: Super Admin only
- [ ] Performance: < 300ms for typical queries
- [ ] Tests: filtering, pagination

**Git Commit:**
```
feat: implement audit log API for compliance/debugging
```

**Notes:**
- If audit_log table not implemented in Task 14, use updated_at + note columns as fallback
- Audit log is immutable; can't be edited/deleted

---

### Task 43: Implement Children Overview / Recap API
**Duration:** 1.5–2 hours  
**Depends on:** Task 29

**Description:**
Implement API for children overview report (cross-regional view).

**Acceptance Criteria:**
- [ ] Route: `api/super-admin/reporting/children-overview`
  - GET: Children summary with filters
    - Query: `officeId`, `format` (json/csv)
    - Returns: {
        summary: { totalActive, totalInactive, newThisSemester, avgAge },
        children: [{ name, age, enrollmentDate, office, status, lastSessionDate, evaluationsCompleted }, ...]
      }
- [ ] Route: `api/regional/reporting/children-overview`
  - GET: Regional children overview (scoped)
- [ ] CSV export: Include all columns
- [ ] Tests: aggregates, export

**Git Commit:**
```
feat: implement children overview report API
```

**Notes:**
- Last session date is the most recent session_attendance record
- Evaluations completed is count per child per semester

---

### Task 44: Implement Public Impact Statistics API
**Duration:** 2–2.5 hours  
**Depends on:** Task 29, 35

**Description:**
Implement API for public website transparency reporting (aggregate, de-identified statistics).

**Acceptance Criteria:**
- [ ] Route: `api/public/impact/statistics`
  - GET: Impact stats with date range filter (no child PII)
    - Query: `timeframe` (lastMonth/lastYear/allTime)
    - Returns: {
        metrics: {
          childrenServed: number,
          regionsActive: number,
          sessionsHeld: number,
          welfareDistribution: { yatim, piatu, dhuafa },
          evalAvgScore: { cerdas, mandiri },
          donationsReceived: number,
        },
        trends: {
          sessionsTrend: [{ month, count }, ...],  // 12 months
          welfareDistribution: [{ category, count }, ...],
        }
      }
- [ ] Validation: timeframe valid, no child/donor/coordinator PII in response
- [ ] Caching: Cache for 1 day (public data, update infrequently)
- [ ] Performance: < 500ms (public site)
- [ ] Tests: PII audit (verify no PII in response), accuracy

**Git Commit:**
```
feat: implement public impact statistics API (de-identified)
```

**Notes:**
- CRITICAL: No child names, photos, ages, IDs, or identifying details
- Welfare distribution shows counts only
- Average evaluation scores are aggregate across all children

---

## Frontend Shared Components

### Task 45: Create Base Layout Components (Header, Sidebar, Breadcrumbs)
**Duration:** 2.5–3 hours  
**Depends on:** Tasks 1, 2

**Description:**
Implement shared layout components used across admin dashboards (header, sidebar, breadcrumbs).

**Acceptance Criteria:**
- [ ] Component: `AdminHeader`
  - Top navigation bar with logo, page title, user menu (avatar + dropdown)
  - Responsive: Logo hidden on mobile, hamburger toggle for sidebar
  - Dropdown menu: Profile, Settings (if applicable), Logout
- [ ] Component: `AdminSidebar`
  - Collapsible navigation sidebar (Stisla-inspired)
  - Menu structure varies by role (Super Admin vs Regional)
  - Logo at top, user profile at bottom
  - Mobile: Hamburger toggle, overlay drawer
  - Active route indicator (highlight current page)
- [ ] Component: `Breadcrumbs`
  - Shows navigation path (Dashboard > Children > [Child Name])
  - Links clickable (back navigation)
  - Mobile: Truncated (show last 2 levels only)
- [ ] Styling: Tailwind, responsive, accessible
- [ ] Tests: rendering, responsive behavior, link navigation

**Git Commit:**
```
feat: create AdminHeader, AdminSidebar, and Breadcrumbs components
```

**Notes:**
- Sidebar icons from `lucide-react`
- Responsive breakpoint: hamburger at 768px and below

---

### Task 46: Create Generic Data Table Component with Sorting & Pagination
**Duration:** 2.5–3 hours  
**Depends on:** Task 45

**Description:**
Implement generic, reusable data table component with sorting, keyset pagination, and filters.

**Acceptance Criteria:**
- [ ] Component: `DataTable`
  - Props: columns, data, isLoading, pagination (pageInfo), onSort, onPageChange
  - Features:
    - Sortable columns (click header, arrow indicator)
    - Keyset pagination (Previous / Next buttons, not numbered pages)
    - Responsive: Hide low-priority columns on mobile, horizontal scroll
    - Row click navigation (onClick handler)
    - Row selection (optional checkboxes)
    - Empty state & loading state (skeleton rows)
  - Accessibility: Semantic table, ARIA labels
- [ ] Component: `TableFilters`
  - Reusable filter UI (search box, dropdowns, checkboxes, chips)
  - Integrates with DataTable
  - "Clear all" button
- [ ] Styling: Tailwind, zebra striping, hover effects
- [ ] Tests: sorting, pagination, filtering, responsive columns

**Git Commit:**
```
feat: create generic DataTable and TableFilters components
```

**Notes:**
- Use shadcn/ui Table primitive as base
- Keyset pagination: store `lastId` in state, pass to API
- Loading state: Show skeleton rows while fetching

---

### Task 47: Create Form Components (Input, Select, DatePicker, etc.)
**Duration:** 2.5–3 hours  
**Depends on:** Task 2

**Description:**
Implement reusable form components wrapped around shadcn/ui primitives.

**Acceptance Criteria:**
- [ ] Component: `FormInput`
  - Props: label, name, placeholder, error, hint, required, type (text/email/tel/number/etc.)
  - Features: Focus state, error message display, ARIA labels
  - Styling: Tailwind, error state (red border/text)
- [ ] Component: `FormSelect`
  - Props: label, name, options, value, onChange, error
  - Features: Searchable (via cmdk or shadcn Select)
  - Cascading select support (parent → child filters)
- [ ] Component: `FormDatePicker`
  - Props: label, name, value, onChange, minDate, maxDate
  - Mobile: Native `input type="date"`, desktop: custom picker
- [ ] Component: `FormCheckbox` & `FormRadio`
  - Props: label, name, value, checked, onChange
- [ ] Component: `FormTextarea`
  - Props: label, name, value, onChange, rows, error
- [ ] Component: `FormSection`
  - Wrapper for grouping related form fields
  - Props: title, description, children
- [ ] Styling: Consistent with Tailwind theme
- [ ] Tests: value changes, validation states, accessibility

**Git Commit:**
```
feat: create reusable form components (Input, Select, DatePicker, etc.)
```

**Notes:**
- All components use React Hook Form integration
- Zod schema validation integrated

---

### Task 48: Create Card & Stat Components
**Duration:** 1.5–2 hours  
**Depends on:** Task 2

**Description:**
Implement card and stat display components.

**Acceptance Criteria:**
- [ ] Component: `Card`
  - Props: children, className (optional), title (optional), footer (optional)
  - Styling: Border, shadow, padding, background color
- [ ] Component: `StatCard`
  - Props: label, value, icon (optional), trend (% ↑/↓), onClick
  - Features: Large number display, optional trend indicator
  - Styling: Orange/teal colors, hover effect
- [ ] Component: `InfoCard`
  - Props: title, children, icon (optional)
  - Styling: Compact card for grouped info
- [ ] Styling: Tailwind, consistent spacing
- [ ] Tests: rendering with various props

**Git Commit:**
```
feat: create Card, StatCard, and InfoCard components
```

**Notes:**
- StatCard used on dashboards (KPI displays)
- All components accept className for customization

---

### Task 49: Create Badge & Status Components
**Duration:** 1.5–2 hours  
**Depends on:** Task 2

**Description:**
Implement badge components for displaying status, role, category.

**Acceptance Criteria:**
- [ ] Component: `StatusBadge`
  - Props: status (string), variant (color variant)
  - Variants: 
    - Attendance: Hadir (green), Izin (yellow), Alfa (red)
    - Evaluation: Draft (gray), Submitted (blue), Approved (green), Rejected (red)
  - Styling: Colored background, appropriate text color
- [ ] Component: `WelfareBadge`
  - Props: category (Yatim/Piatu/Dhuafa)
  - Styling: Distinct colors per category
- [ ] Component: `RoleBadge`
  - Props: role (Super Admin/Branch Admin/Korwil)
- [ ] Component: `ProgramBadge`
  - Props: program (name)
- [ ] All badges use shadcn/ui Badge as base
- [ ] Tests: rendering, variant colors

**Git Commit:**
```
feat: create badge components for status, role, welfare category
```

**Notes:**
- Badges are read-only displays (no interaction)
- Colors must meet WCAG AA contrast requirements

---

### Task 50: Create Dialog & Modal Components
**Duration:** 2–2.5 hours  
**Depends on:** Task 48

**Description:**
Implement reusable dialog components for forms, confirmations, and info modals.

**Acceptance Criteria:**
- [ ] Component: `ConfirmDialog`
  - Props: title, message, confirmText, cancelText, onConfirm, onCancel, isDangerous (boolean)
  - Features: Close button, ESC to close, backdrop click to close (optional)
  - Dangerous action variant: Red confirm button
  - Styling: Tailwind, centered, responsive size
- [ ] Component: `FormDialog`
  - Props: title, children (form), onClose, isOpen
  - Features: Scrollable body, footer with Cancel/Save buttons
  - Styling: Modal sizing (responsive)
- [ ] Component: `InfoDialog`
  - Props: title, children, onClose, isOpen
  - Read-only modal for displaying information
- [ ] All use shadcn/ui Dialog as base
- [ ] Accessibility: Focus trap, ESC key, ARIA labels
- [ ] Tests: opening/closing, confirm action, keyboard navigation

**Git Commit:**
```
feat: create dialog components for confirmations, forms, info
```

**Notes:**
- Modal sizing: 400px (narrow), 600px (default), 900px (wide)
- Mobile: Full-screen dialogs

---

### Task 51: Create Chart Wrapper Component
**Duration:** 2–2.5 hours  
**Depends on:** Task 2

**Description:**
Implement chart wrapper component using Recharts library.

**Acceptance Criteria:**
- [ ] Component: `Chart`
  - Props: type (line/bar/pie/area), data, xKey, yKey, colors (optional), height (optional)
  - Features: Responsive width, mobile-friendly height
  - Tooltip on hover, legend
  - Theme-consistent colors (orange, teal, etc.)
- [ ] Supported chart types:
  - LineChart: Time-series trends
  - BarChart: Category comparisons
  - PieChart: Proportions
  - AreaChart: Cumulative trends
- [ ] Mobile responsiveness: Reduce height on mobile, simplify labels
- [ ] Styling: Theme colors, no hardcoded colors
- [ ] Tests: data rendering, responsive sizing

**Git Commit:**
```
feat: create Chart wrapper component with Recharts
```

**Notes:**
- Recharts is React-based, works well with SSR
- Chart colors map to Tailwind theme (amber, teal, green, red)

---

### Task 52: Create Navigation & Auth Hooks
**Duration:** 2–2.5 hours  
**Depends on:** Task 15

**Description:**
Implement React hooks for authentication state, role checking, and navigation.

**Acceptance Criteria:**
- [ ] Hook: `useAuth()`
  - Returns: { session, isLoading, isAuthenticated, role }
  - Fetches `/api/auth/session` on mount, caches in memory
  - Auto-refreshes session on page focus (using separate endpoint)
- [ ] Hook: `useRole(requiredRole)`
  - Returns: { hasRole: boolean, role: string }
  - Used for conditional rendering (show/hide admin-only UI)
- [ ] Hook: `useLogout()`
  - Returns: { logout: () => Promise<void>, isLoading }
  - Calls `/api/auth/logout`, redirects to home
- [ ] Hook: `useDataTable(apiUrl)`
  - Returns: { data, isLoading, error, sort, setSort, pageInfo, nextPage, prevPage }
  - Manages pagination state, fetches data via SWR
- [ ] All hooks use SWR for data fetching (caching, revalidation)
- [ ] Tests: hook behavior, caching, authentication check

**Git Commit:**
```
feat: create authentication and data-fetching hooks (useAuth, useRole, useDataTable)
```

**Notes:**
- `useAuth` calls `/api/auth/session` on mount
- `useDataTable` uses SWR with 30-second deduping interval
- Hooks are Client Components (use 'use client')

---

## Public Website

### Task 53: Create Public Website Layout & Navigation
**Duration:** 2–2.5 hours  
**Depends on:** Task 45

**Description:**
Implement public website layout with header, footer, navigation.

**Acceptance Criteria:**
- [ ] Component: `PublicHeader`
  - Logo (left), navigation links (center: Home, Program, Impact, Regions, News, Contact), Donate button (right)
  - Mobile: Hamburger menu, navigation in drawer
  - Sticky/not sticky (decide with design)
- [ ] Component: `PublicFooter`
  - Contact info, social media links, newsletter signup, copyright
  - 3-column footer on desktop, stacked on mobile
- [ ] Layout: `(public)/layout.tsx`
  - Wraps all public pages with header + footer
  - No sidebar (unlike admin pages)
- [ ] Styling: Clean, marketing-focused design (not admin)
- [ ] Responsive: 375px mobile-first
- [ ] Tests: navigation links work, responsive layout

**Git Commit:**
```
feat: create public website layout with header and footer
```

**Notes:**
- Public pages use custom design (not Stisla admin style)
- Header is consistent across public pages

---

### Task 54: Create Public Home & Program Overview Pages
**Duration:** 2–2.5 hours  
**Depends on:** Task 53

**Description:**
Implement home landing page and program overview page.

**Acceptance Criteria:**
- [ ] Page: `(public)/page.tsx` (Home/Landing)
  - Hero section: headline, background image (non-identifying), CTA button
  - Program snapshot: 4 stat cards (aggregate stats, no child PII)
  - Featured modules: Cards for Pembinaan, Hafalan, Penilaian, Sponsorship
  - Recent news: 3 latest news items
  - CTA section: "Join as Donor" button
  - Styling: Tailwind, brand colors, responsive
- [ ] Page: `(public)/program/page.tsx` (Program Overview)
  - Sections: What is Anak Juara, Pembinaan, Hafalan, Penilaian, Sponsorship Model
  - Content: Text + icons + optional SVG diagrams (no PII)
  - Styling: Consistent with home page
- [ ] Components: `HeroSection`, `FeatureCard`, `NewsCard` (reusable)
- [ ] Tests: page rendering, responsive layout, no PII

**Git Commit:**
```
feat: create home and program overview pages
```

**Notes:**
- Home page is landing page; emphasizes impact and donor engagement
- Program page explains how Anak Juara works (educational)

---

### Task 55: Create Impact & Transparency Reporting Page
**Duration:** 2.5–3 hours  
**Depends on:** Task 44, 51

**Description:**
Implement impact statistics page with charts and aggregate data (no PII).

**Acceptance Criteria:**
- [ ] Page: `(public)/impact/page.tsx`
  - Header: "Our Impact" title, date range selector
  - Key metrics: 4 stat cards (# sessions, # children, # hafalan items, # evaluations)
  - Charts:
    - Line chart: Monthly sessions trend
    - Bar chart: Sessions by region (aggregate)
    - Pie chart: Welfare category distribution (counts, no names)
    - Progress bar: Avg evaluation scores (Cerdas vs Mandiri)
  - Data table: Semester overview (semester, # participants, # evaluations, avg score)
  - Buttons: Download Report (CSV), Share Impact, Learn More
  - Dialogs: Chart detail view on click
- [ ] Styling: Professional, data-driven design
- [ ] Performance: Charts lazy-loaded (Recharts)
- [ ] Tests: chart rendering, export functionality, no PII

**Git Commit:**
```
feat: create impact and transparency reporting page with charts
```

**Notes:**
- CRITICAL: Verify no child names, IDs, or identifying details in any data shown
- Charts aggregate data across all regions/children
- CSV export is de-identified (counts, no personal info)

---

### Task 56: Create Regional Presence & News Pages
**Duration:** 2–2.5 hours  
**Depends on:** Task 53

**Description:**
Implement regional presence map/list and news/updates feed.

**Acceptance Criteria:**
- [ ] Page: `(public)/regions/page.tsx`
  - Header: "Where We Operate" title
  - Interactive map: Pinned office/region locations (no child data)
  - List view: Offices with aggregate # children, contact info
  - Mobile: Map collapsed, list full-width with toggle
  - Styling: Leaflet or Mapbox map component
- [ ] Page: `(public)/news/page.tsx`
  - Header: "News & Updates"
  - News grid: 10 items per page, cards with title/excerpt/date
  - Pagination: Next/Previous buttons (not numbered pages)
  - Filters: Category (Program Updates / Donor Stories / Events)
  - Newsletter signup form at bottom
- [ ] Each news item links to detail page (future)
- [ ] Tests: map rendering, news list pagination, forms

**Git Commit:**
```
feat: create regional presence map and news updates pages
```

**Notes:**
- Regional Presence shows only office/region info; no child details on map pins
- News feed is blog-like; supports future CMS integration

---

### Task 57: Create Contact & Inquiry Form Page
**Duration:** 2–2.5 hours  
**Depends on:** Task 47

**Description:**
Implement contact form and inquiry management.

**Acceptance Criteria:**
- [ ] Page: `(public)/contact/page.tsx`
  - Header: "Get in Touch" title
  - Contact form:
    - Fields: name, email, phone (optional), inquiry type (dropdown), message (textarea)
    - Validation: email required/valid, message not empty
    - reCAPTCHA (if deployed)
    - Submit button
  - Post-submission: success message + redirect to home or thank-you
  - Aside: Contact info (office address, phone, email)
  - Mobile: Form full-width, contact info stacked below
- [ ] API: `api/public/contact` (POST)
  - Accepts form data
  - Sends email to admin inbox (or Airtable/similar)
  - Returns { success: true }
- [ ] Styling: Clean, accessible form
- [ ] Tests: form submission, email sending, validation

**Git Commit:**
```
feat: create contact form and inquiry handling
```

**Notes:**
- Contact form is publicly accessible (no auth required)
- Email service configured (Resend, SendGrid, etc.)
- Optional: Store inquiries in database for CRM integration (future)

---

### Task 58: Implement Public Website Static Content & SEO
**Duration:** 2–3 hours  
**Depends on:** Task 53

**Description:**
Configure static content, meta tags, and SEO optimization for public website.

**Acceptance Criteria:**
- [ ] All public pages have:
  - Meta title (SEO-friendly, 50–60 chars)
  - Meta description (120–160 chars)
  - OG tags (og:title, og:description, og:image)
  - Canonical URLs
- [ ] Site map: `public/sitemap.xml`
- [ ] Robots.txt: Allow search engines, disallow admin routes
- [ ] Mobile viewport meta tag
- [ ] JSON-LD structured data (Organization schema, aggregate statistics)
- [ ] ISR configuration: Rebuild every 1 hour (content changes infrequently)
- [ ] Performance: Images optimized via Next.js Image component
- [ ] Tests: meta tags present, ISR working, no 404s

**Git Commit:**
```
feat: add SEO, meta tags, and static content optimization
```

**Notes:**
- Use Next.js `generateMetadata()` for dynamic page titles
- Robots.txt disallows `/api/*` and `/admin/*` routes
- ISR prevents stale content while keeping build times fast

---

## Super Admin Dashboard

### Task 59: Create Super Admin Dashboard Home & KPI Layout
**Duration:** 2.5–3 hours  
**Depends on:** Task 45, 51

**Description:**
Implement Super Admin dashboard home page with KPI overview.

**Acceptance Criteria:**
- [ ] Page: `(super-admin)/page.tsx` or `(super-admin)/dashboard/page.tsx`
  - Header: "Super Admin Dashboard" + user menu
  - Stat cards (4): # Active Children, # Completed Sessions, # Pending Evaluations, # Donors
  - Charts (2-column):
    - Line chart: Sessions trend (12 months)
    - Bar chart: Children by welfare category
  - Recent activities table: Last 10 actions (timestamp, user, action, target)
  - Sidebar: Quick links to key modules
- [ ] Data fetching: Server Component + SWR for real-time updates
- [ ] Responsive: 2-column charts on desktop, 1-column on mobile
- [ ] Tests: KPI card rendering, chart data accuracy

**Git Commit:**
```
feat: create Super Admin dashboard home with KPI overview
```

**Notes:**
- Dashboard is the entry point after login for Super Admin
- Stat cards refresh every 30 seconds (SWR)

---

### Task 60: Create Master Data: Offices Management Module
**Duration:** 2.5–3 hours  
**Depends on:** Task 21, 46

**Description:**
Implement office management pages (list and detail) for Super Admin.

**Acceptance Criteria:**
- [ ] Page: `(super-admin)/master-data/offices/page.tsx` (List)
  - Header: "Offices" + "Add New Office" button
  - Search: Search by name
  - Filters: Active/Inactive toggle, Parent office dropdown
  - Table: Name, Parent Office, # Regions, # Coordinators, Active, Actions
  - Pagination: 25 per page, keyset-based
  - Row click: Navigate to detail page
- [ ] Page: `(super-admin)/master-data/offices/[id]/page.tsx` (Detail)
  - Form: Name, Parent office (dropdown), Address, Active toggle, Save button
  - Related data cards: # Regions, # Coordinators, # Children, Recent activity
- [ ] Components: `DataTable`, `TableFilters`, `FormInput`
- [ ] API integration: Calls `api/super-admin/offices` (GET/POST/PUT)
- [ ] Tests: office list, create, edit, hierarchy validation

**Git Commit:**
```
feat: implement offices management module for Super Admin
```

**Notes:**
- Office hierarchy is displayed as dropdown tree (parent selection)
- Soft-delete via active flag

---

### Task 61: Create Master Data: Coaching Regions Module
**Duration:** 2–2.5 hours  
**Depends on:** Task 22, 46

**Description:**
Implement coaching regions management (list and detail).

**Acceptance Criteria:**
- [ ] Page: `(super-admin)/master-data/regions/page.tsx` (List)
  - Header: "Coaching Regions" + "Add New Region" button
  - Search: Search by region name
  - Filters: Office dropdown, Active toggle
  - Table: Region Name, Office, # Children, # Sessions (this month), Active, Actions
- [ ] Page: `(super-admin)/master-data/regions/[id]/page.tsx` (Detail)
  - Form: Region name, Office (dropdown), Description (textarea), Active toggle
  - Related data: Assigned coordinators, Children in region, Recent sessions
- [ ] API integration: Calls `api/super-admin/regions`
- [ ] Tests: region creation, office filtering

**Git Commit:**
```
feat: implement coaching regions management module
```

**Notes:**
- Regions belong to offices (RESTRICT on delete)
- Display coordinator list (links to edit coordinators)

---

### Task 62: Create Master Data: Coordinators & Users Module
**Duration:** 3–3.5 hours  
**Depends on:** Task 23, 27, 46

**Description:**
Implement coordinators and system users management.

**Acceptance Criteria:**
- [ ] Page: `(super-admin)/master-data/coordinators/page.tsx` (List)
  - Header: "Coordinators" + "Add New Coordinator" button
  - Search: Search by name
  - Filters: Office dropdown, Active toggle
  - Table: Name, Phone, Office, Region, # Sessions Led, Active, Actions
- [ ] Page: `(super-admin)/master-data/coordinators/[id]/page.tsx` (Detail)
  - Form: Full name, Phone, Office, Region, Bio (textarea), Active toggle
  - Account section: Username, Password reset button, Last login timestamp
  - Related data: # Sessions led, # Children evaluated, Recent activity
- [ ] Page: `(super-admin)/users/page.tsx` (Users List)
  - Header: "System Users" + "Create New User" button
  - Search: Search by username/name
  - Filters: Role (dropdown), Office (dropdown), Active toggle
  - Table: Username, Full Name, Role, Office, Last Login, Active, Actions
- [ ] Page: `(super-admin)/users/[id]/page.tsx` (User Detail/Edit)
  - Form: Username (readonly), Full Name, Email, Role (dropdown), Office, Coordinator link
  - Active toggle, Save button
  - Account section: Force password reset checkbox, Reset password button
- [ ] Dialogs: PasswordResetDialog, ConfirmDeleteDialog
- [ ] API integration: Calls `api/super-admin/coordinators` and `api/super-admin/users`
- [ ] Tests: coordinator creation, user role assignment, password reset

**Git Commit:**
```
feat: implement coordinators and system users management modules
```

**Notes:**
- Coordinator must exist before creating linked user account
- Role determines available features (routing/data access)
- Password reset sends email with temporary password

---

### Task 63: Create Master Data: Reference Data Management (Semesters, Evaluation Items, Hafalan Items)
**Duration:** 2.5–3 hours  
**Depends on:** Task 24, 25, 26, 46

**Description:**
Implement management pages for reference/lookup data.

**Acceptance Criteria:**
- [ ] Page: `(super-admin)/master-data/semesters/page.tsx`
  - List: Semester Name, Year, Term, Start Date, End Date, # Evaluations, Actions
  - Form dialog: Create/edit semester (name, year, term, dates)
  - Validation: end_date > start_date
- [ ] Page: `(super-admin)/master-data/evaluation-items/page.tsx`
  - List: Item Name, Category, # Evaluations Using, Active, Actions
  - Form dialog: Create/edit item (name, category)
- [ ] Page: `(super-admin)/master-data/hafalan-items/page.tsx`
  - List: Item Name, Category, # Children Assessed, Active, Actions
  - Form dialog: Create/edit item (name, category)
- [ ] All pages: Inline edit capability (edit in place or dialog)
- [ ] API integration: Calls respective APIs
- [ ] Tests: CRUD operations, validation

**Git Commit:**
```
feat: implement reference data management (semesters, evaluation items, hafalan items)
```

**Notes:**
- Reference data is relatively stable; rarely changes after initial setup
- Soft-delete via active flag for all reference tables

---

### Task 64: Create Children Oversight Module (List, Detail, Register)
**Duration:** 3–3.5 hours  
**Depends on:** Task 29, 46

**Description:**
Implement comprehensive children oversight for Super Admin (cross-branch visibility).

**Acceptance Criteria:**
- [ ] Page: `(super-admin)/children/page.tsx` (List)
  - Header: "All Children" + "Register New Child" button
  - Search: Search by child name
  - Filters: Office (multi-select), Welfare category, Active toggle, Program
  - Table: Child Name, Age, Office, Welfare Category, Enrollment Date, Sponsor Status, Active, Actions
  - Pagination: 25 per page, keyset-based
  - Row click: Navigate to child profile
- [ ] Page: `(super-admin)/children/[id]/page.tsx` (Detail)
  - Tabs: Profile, Family, Education, Hafalan, Evaluations
  - Profile tab: Photo, name, DOB, age, gender, welfare category, enrollment, sponsorship status, Edit button
  - Family tab: List of family members, Add/Edit/Delete
  - Education tab: Timeline of education records, Add new
  - Hafalan tab: Items tracked with status (read-only)
  - Evaluations tab: List of semester evaluations, View/Approve/Export
- [ ] API integration: Calls `api/regional/children` and related endpoints
- [ ] Tests: child list filtering, profile display, tab navigation

**Git Commit:**
```
feat: implement children oversight module for Super Admin
```

**Notes:**
- Super Admin sees all children (cross-office visibility)
- Photo upload handled separately (Task TBD)
- Child profile is read-only in Super Admin view (edit in Regional Dashboard)

---

### Task 65: Create Evaluations Review & Approval Module
**Duration:** 3–3.5 hours  
**Depends on:** Task 32, 46

**Description:**
Implement evaluation review and approval workflow for Super Admin.

**Acceptance Criteria:**
- [ ] Page: `(super-admin)/evaluations/page.tsx` (List)
  - Header: "Evaluations"
  - Search: Search by child name
  - Filters: Semester, Office, Status (Pending/Approved/Rejected/Draft)
  - Table: Child Name, Semester, Evaluator, Status, Last Modified, Actions
  - Pagination: 25 per page
  - Row click: Navigate to detail/review page
- [ ] Page: `(super-admin)/evaluations/[id]/page.tsx` (Detail/Review)
  - Tabs: Overview, Scores, Notes, Approval
  - Overview tab: Child name, DOB, age, evaluator, evaluation date, approval status
  - Scores tab: Table of evaluation items + scores (read-only)
  - Notes tab: Coach notes and Suara Anak Juara (read-only)
  - Approval tab: Approval status, Approve button, Reject button (with reason)
  - Request Changes button with comment dialog
- [ ] Dialogs: RejectDialog (reason textarea), RequestChangesDialog (comment)
- [ ] API integration: Calls `api/super-admin/evaluations` for GET, PUT for approval/rejection
- [ ] Tests: evaluation list filtering, approval workflow

**Git Commit:**
```
feat: implement evaluations review and approval module
```

**Notes:**
- Super Admin only role can approve/reject
- Rejection sends evaluation back to Draft (coordinator can edit)
- Approval is final; can't be reversed (discuss with PM if reversal needed)

---

### Task 66: Create Sponsorships & Donor Management Module
**Duration:** 2.5–3 hours  
**Depends on:** Task 34, 46

**Description:**
Implement sponsorship pairing and donor management.

**Acceptance Criteria:**
- [ ] Page: `(super-admin)/sponsorships/page.tsx` (List)
  - Header: "Child-Donor Pairings" + "New Pairing" button
  - Search: Search by child name or donor name
  - Filters: Program, Status (Active/Pending/Ended), Office
  - Table: Child Name, Donor Name, Program, Pairing Date, Status, Balance, Actions
  - Pagination: 25 per page
- [ ] Page: `(super-admin)/sponsorships/[id]/page.tsx` (Detail)
  - Tabs: Pairing, Transactions, Balance, Communication (future)
  - Pairing tab: Child/donor/program info, pairing/end dates, status, Edit button
  - Transactions tab: List of donations/disbursements (table with date, type, amount)
  - Balance tab: Balance history over semesters (chart + table)
  - Buttons: Edit pairing, End pairing
- [ ] Dialogs: EditPairingDialog, EndPairingDialog
- [ ] Charts: Line chart for balance trend
- [ ] API integration: Calls `api/super-admin/pairings`, `api/super-admin/transactions`
- [ ] Tests: pairing creation, transaction display, balance chart

**Git Commit:**
```
feat: implement sponsorships and donor management module
```

**Notes:**
- Child-donor pairing is the financial anchor
- All transactions linked to a specific pairing
- Balance snapshots are semester-end closing balances

---

### Task 67: Create Finance Overview Module (Read-Only)
**Duration:** 2–2.5 hours  
**Depends on:** Task 39, 46

**Description:**
Implement finance overview dashboard (read-only for Super Admin).

**Acceptance Criteria:**
- [ ] Page: `(super-admin)/finance/overview/page.tsx`
  - Stat cards: Total donations, Total disbursements, Current balance, # Active pairings
  - Charts:
    - Line chart: Donation trend (last 12 months)
    - Bar chart: Disbursement by program
    - Pie chart: Balance by program
  - Filters: Date range (Last 30/90 days, Last Year), Program
  - Data table: Top 10 donations (date, donor, pairing, amount)
- [ ] Page: `(super-admin)/finance/transactions/page.tsx`
  - Header: "All Transactions"
  - Filters: Date range, Type (Donation/Disbursement/Adjustment), Program, Office
  - Table: Date, Type, Pairing, Program, Amount, Description, Actions
  - Pagination: 25 per page
  - Row actions: View detail, Export
- [ ] Charts: Recharts (line, bar, pie)
- [ ] API integration: Calls `api/super-admin/finance/overview`, `api/super-admin/transactions`
- [ ] Tests: chart rendering, data accuracy

**Git Commit:**
```
feat: implement finance overview module (read-only)
```

**Notes:**
- Finance views are read-only; no editing (creates immutable financial trail)
- Transaction creation/editing handled separately (if needed)

---

### Task 68: Create Reporting & Audit Log Module
**Duration:** 2.5–3 hours  
**Depends on:** Task 40, 42, 46

**Description:**
Implement reporting pages (Rekap Pembinaan, Audit Log).

**Acceptance Criteria:**
- [ ] Page: `(super-admin)/reporting/recap-pembinaan/page.tsx`
  - Header: "Rekap Pembinaan (Coaching Session Summary)"
  - Filters: Date range, Office (multi-select), Region, Session type
  - Summary stats: # Sessions, # Unique children, # Attendance records, Attendance rate %
  - Table: Session Date, Office, Region, Coordinator, Session Type, # Attended, # Absent, # Excused, Attendance Rate
  - Buttons: "Export Report (CSV)", "Export Detailed (with attendance per child)"
- [ ] Page: `(super-admin)/reporting/audit-log/page.tsx`
  - Header: "Audit Log"
  - Filters: Date range, User, Entity type (Children/Sessions/Evaluations/Users), Action (Create/Update/Delete)
  - Table: Timestamp, User, Entity Type, Entity ID, Action, Old Value (summary), New Value (summary)
  - Pagination: 50 per page
  - Row actions: View full detail (modal)
- [ ] Dialogs: AuditDetailDialog (full before/after comparison)
- [ ] Exports: CSV format for Rekap Pembinaan
- [ ] API integration: Calls `api/super-admin/reporting/recap-pembinaan`, `api/super-admin/audit-log`
- [ ] Tests: report filtering, data accuracy, export formatting

**Git Commit:**
```
feat: implement reporting modules (Rekap Pembinaan, Audit Log)
```

**Notes:**
- Rekap Pembinaan is critical for operations review
- Audit log is compliance/debugging tool (Super Admin only)

---

### Task 69: Create Super Admin Settings & Configuration (Future)
**Duration:** 1.5–2 hours  
**Depends on:** Task 62

**Description:**
Implement basic settings page for Super Admin (password change, preferences).

**Acceptance Criteria:**
- [ ] Page: `(super-admin)/settings/page.tsx`
  - Sections: Account, Preferences, (future: System Configuration)
  - Account section: Email, Phone, Password change
  - Password change form: Current password, New password, Confirm password
  - Preferences section: Language, Theme (light/dark, future), Email notifications
  - Save button, success/error feedback
- [ ] API: `api/auth/change-password` (POST)
  - Accepts: { currentPassword, newPassword }
  - Validates: current password correct, new password != current
- [ ] Tests: password change validation, form submission

**Git Commit:**
```
feat: implement Super Admin settings page (account, preferences)
```

**Notes:**
- Settings page is personal to logged-in user
- Password change uses separate, secure endpoint
- Future: System configuration (email settings, etc.)

---

### Task 70: Implement Super Admin Route Protection & Role-Based Access
**Duration:** 1.5–2 hours  
**Depends on:** Task 18, 59

**Description:**
Ensure all Super Admin routes are protected and accessible only to Super Admin role.

**Acceptance Criteria:**
- [ ] Middleware: `@/middleware.ts` enforces Super Admin role on `(super-admin)/*` routes
- [ ] Unauthorized access: Redirects to login, or shows 403 Forbidden
- [ ] Route groups: All Super Admin pages wrapped by `(super-admin)` route group
- [ ] Tests: unauthorized access blocked, authorized access allowed

**Git Commit:**
```
chore: enforce Super Admin role-based access control
```

**Notes:**
- Middleware checks session role before allowing route access
- 403 Forbidden for users with wrong role
- Login page doesn't require auth (redirect loop prevention)

---

## Regional Dashboard

### Task 71: Create Regional Dashboard Home & KPI Layout
**Duration:** 2.5–3 hours  
**Depends on:** Task 45, 51

**Description:**
Implement regional dashboard home page optimized for mobile field use.

**Acceptance Criteria:**
- [ ] Page: `(regional)/page.tsx` or `(regional)/dashboard/page.tsx`
  - Mobile-first layout (fully usable at 375px)
  - Header: "Dashboard" + user profile icon
  - Stat cards (1-column on mobile, 2-column at 500px+): # Active children, # Pending evaluations, # Sessions this month, # Completed hafalan items (this month)
  - Recent activities: Vertical list (not table), cards showing last 10 activities
  - Buttons (full-width on mobile): "View All Children", "New Coaching Session", "View Evaluations"
  - No charts (lightweight for field usage)
- [ ] Data fetching: SWR for real-time updates
- [ ] Tests: mobile responsive layout, stat card rendering

**Git Commit:**
```
feat: create regional dashboard home (mobile-first, field-optimized)
```

**Notes:**
- Dashboard is lightweight (minimal JS, fast load)
- Coordinator data scoped to their region/office
- No charts; dashboard prioritizes quick access to core operations

---

### Task 72: Create Regional Children Management (List, Create, Detail)
**Duration:** 3–3.5 hours  
**Depends on:** Task 29, 46

**Description:**
Implement children management for regional coordinators (mobile-optimized).

**Acceptance Criteria:**
- [ ] Page: `(regional)/children/page.tsx` (List)
  - Mobile-first: 1-column layout at 375px
  - Header: "Children" + "Register New Child" button (full-width on mobile)
  - Search: Search by name (text input with icon)
  - Filters: Active/inactive toggle, Welfare category (chips, not dropdown)
  - List: Child cards (name, age, welfare category, actions icon menu)
  - Mobile: Actions in dropdown menu or swipe (if supported)
  - Pagination: "Load more" button on mobile, not numbered pages
- [ ] Page: `(regional)/children/new/page.tsx` (Register)
  - Single-column form (mobile-friendly)
  - Sections: Personal Info, Address & Family, Education, Program Enrollment
  - Fields: full name, DOB, gender, address, welfare category, family members, school, education level, program, enrollment date
  - Submit button (full-width on mobile)
  - Success: Redirect to child profile
- [ ] Page: `(regional)/children/[id]/page.tsx` (Profile)
  - Mobile-first tabs: Profile, Family, Education, Hafalan, Evaluations
  - Tabs as dropdown on mobile (<768px), horizontal on desktop
  - Profile tab: Photo, name, DOB, age, gender, welfare category, enrollment, status, Edit button
  - Family tab: List of family members, Add button, Edit/Delete per member
  - Education tab: Current education + historical, Add new
  - Hafalan tab: Items with status, Add assessment
  - Evaluations tab: List of evaluations, View/Edit
- [ ] API integration: Calls `api/regional/children`
- [ ] Scoping: Coordinator sees only children in their region
- [ ] Tests: child list, registration form, profile tabs, mobile responsiveness

**Git Commit:**
```
feat: implement regional children management (mobile-first)
```

**Notes:**
- Registration form is multi-section but single-column
- Child detail is tabbed interface; responsive on mobile
- All buttons full-width on mobile for large touch targets

---

### Task 73: Create Regional Coaching Sessions Module (Create, List, Detail)
**Duration:** 3–3.5 hours  
**Depends on:** Task 30, 46

**Description:**
Implement coaching session management for field coordinators.

**Acceptance Criteria:**
- [ ] Page: `(regional)/coaching-sessions/page.tsx` (List)
  - Mobile-first: Card layout (1-column)
  - Header: "Coaching Sessions" + "New Session" button
  - Filters: Date range (start/end date pickers), Session type (chips)
  - List: Session cards (date, type, # children attended, coordinator, actions)
  - Row actions: View, Edit (if draft), View Attendance
  - Pagination: "Load more" button
- [ ] Page: `(regional)/coaching-sessions/new/page.tsx` (Create)
  - Multi-step form:
    - Step 1: Session info (date, type, location, description)
    - Step 2: Attendance (select children, attendance status per child, mandiri habits per child)
    - Step indicator: "Step 1 of 2"
  - Next/Back buttons, Finish/Save on last step
  - Single-column form (mobile-friendly)
- [ ] Page: `(regional)/coaching-sessions/[id]/page.tsx` (Detail)
  - Tabs: Overview, Attendance Roster, Mandiri Tracking
  - Overview tab: Date, type, location, coordinator, description
  - Attendance Roster tab: Table (child name, attendance status, mandiri habits)
  - Mandiri Tracking tab: Summary of habits per child
  - Edit button (if draft/owned by coordinator)
- [ ] API integration: Calls `api/regional/coaching-sessions`
- [ ] Scoping: Coordinator sees only own sessions (linked to their coordinator ID)
- [ ] Tests: session creation, attendance recording, multi-step form

**Git Commit:**
```
feat: implement regional coaching sessions module
```

**Notes:**
- Session creation is multi-step to organize data entry
- Attendance is recorded per child per session
- Mandiri habits are checkboxes (prayer, recitation, charity, etc.)

---

### Task 74: Create Regional Hafalan Tracking Module
**Duration:** 2.5–3 hours  
**Depends on:** Task 31, 46

**Description:**
Implement hafalan (memorization) tracking for coordinators.

**Acceptance Criteria:**
- [ ] Page: `(regional)/hafalan/page.tsx` (Overview)
  - Header: "Hafalan Progress"
  - Filters: Child (searchable dropdown), Item category (chips: Qur'an, Prayer, Du'a)
  - Summary stats: # Total items, # Completed %, # Partial %, # Not started %
  - Items table: Item Name, Category, # Completed, # Partial, # Not Started
  - Row click or "View" button: Child breakdown for this item
- [ ] Page: `(regional)/hafalan/[childId]/page.tsx` (Child Hafalan)
  - Header: Child name
  - List of hafalan items with status (Not Started/Partial/Completed)
  - Add assessment button → AddHafalanForm (dialog)
  - Each item shows: name, status badge, last assessed date
- [ ] Dialogs: AddHafalanAssessmentForm (item select, status select, date, submit)
- [ ] API integration: Calls `api/regional/hafalan`
- [ ] Scoping: Coordinator sees only children in their region
- [ ] Tests: hafalan list, assessment recording, status tracking

**Git Commit:**
```
feat: implement regional hafalan tracking module
```

**Notes:**
- Hafalan items are curated list (Qur'an surahs, prayers, du'as)
- Status can change (progress or regress)

---

### Task 75: Create Regional Evaluations Module (Create, Edit, Submit, List)
**Duration:** 3.5–4 hours  
**Depends on:** Task 32, 46

**Description:**
Implement comprehensive evaluations module for coordinators.

**Acceptance Criteria:**
- [ ] Page: `(regional)/evaluations/page.tsx` (List)
  - Header: "Evaluations" + "New Evaluation" button
  - Filters: Semester, Status (Draft/Submitted/Approved/Rejected, chips)
  - Search: Search by child name
  - List: Evaluation cards (child name, semester, status, last modified)
  - Row actions: View, Edit (if draft), Submit (if draft), Delete (if draft)
  - Pagination: "Load more" button
- [ ] Page: `(regional)/evaluations/new/page.tsx` (Create)
  - Form: Child (dropdown), Semester (dropdown), create as Draft
  - Auto-populates if desired (optional)
  - Redirects to edit page on create
- [ ] Page: `(regional)/evaluations/[id]/page.tsx` (Edit/Detail)
  - Tabs: Overview, Scores, Notes, Submission Status
  - Overview tab: Child, semester, evaluator, evaluation date
  - Scores tab: Table of evaluation items
    - Columns: Item Name, Category, Score input (0-100)
    - Inline editing (if Draft status)
  - Notes tab: Coach notes textarea, Suara Anak Juara textarea
  - Submission Status tab: Status display, Submit button (if Draft)
  - Edit/Save/Submit/Cancel buttons (conditional on status)
- [ ] Dialogs: SubmitConfirmDialog (confirmation before submit)
- [ ] Validation: Scores 0-100, at least one item scored
- [ ] API integration: Calls `api/regional/evaluations`
- [ ] Scoping: Coordinator can only edit own evaluations (created by them)
- [ ] Tests: evaluation creation, editing, submission workflow, validation

**Git Commit:**
```
feat: implement regional evaluations module with multi-step workflow
```

**Notes:**
- Evaluation is Draft until submitted
- Once submitted, only Super Admin can approve/reject
- Coordinator can't edit after submission (unless rejected)

---

### Task 76: Create Regional Bulk Evaluation Generation
**Duration:** 2–2.5 hours  
**Depends on:** Task 33, 75

**Description:**
Implement bulk evaluation generation for regional coordinators.

**Acceptance Criteria:**
- [ ] Page: `(regional)/evaluations/generate-bulk/page.tsx`
  - Form:
    - Semester (dropdown)
    - Scope: All children / Select specific children (multi-select)
    - Auto-populate from data (toggle)
  - Preview: Table of children to be evaluated, preview scores if auto-populate enabled
  - Submit: Confirmation dialog → "Generate X evaluations?"
- [ ] API: Calls `api/regional/evaluations/generate-bulk`
  - Creates Draft evaluations for selected children
  - Optionally auto-populates scores from session/hafalan data
- [ ] Success: Message + redirect to evaluations list (filtered to new drafts)
- [ ] Tests: bulk generation, auto-population accuracy

**Git Commit:**
```
feat: implement regional bulk evaluation generation
```

**Notes:**
- Auto-population calculates scores from session attendance + hafalan completion
- Evaluations created as Draft; coordinator can edit before submit

---

### Task 77: Create Regional Reporting Module (Recap Pembinaan, Children Overview)
**Duration:** 2.5–3 hours  
**Depends on:** Task 40, 43, 46

**Description:**
Implement reporting pages for regional coordinators.

**Acceptance Criteria:**
- [ ] Page: `(regional)/reporting/recap-pembinaan/page.tsx`
  - Header: "Coaching Session Summary"
  - Filters: Date range, Session type (chips)
  - Summary stats: # Sessions, # Total attendance, Average attendance rate, # Unique children
  - List: Session cards (date, type, # attended, # absent, # excused, attendance rate)
  - Button: "Export Report (CSV)"
- [ ] Page: `(regional)/reporting/children-recap/page.tsx`
  - Header: "Children Overview"
  - Summary stats: # Active, # Inactive, # Newly enrolled, Average age
  - Table: Child Name, Age, Enrollment Date, Status, Last Session Date, # Evaluations
  - Button: "Export List (CSV)"
- [ ] Responsive: Table with horizontal scroll on mobile if needed
- [ ] API integration: Calls `api/regional/reporting/recap-pembinaan`, `api/regional/reporting/children-overview`
- [ ] Scoping: Coordinator sees only their region's data
- [ ] Tests: report generation, export formatting

**Git Commit:**
```
feat: implement regional reporting modules (Recap, Children Overview)
```

**Notes:**
- Recap Pembinaan is operational report (for review/planning)
- Children overview is status snapshot

---

### Task 78: Create Regional Data Export & CSV Generation
**Duration:** 2–2.5 hours  
**Depends on:** Task 77

**Description:**
Implement CSV export functionality for reports.

**Acceptance Criteria:**
- [ ] Utility: `@/lib/export.ts`
  - `exportToCSV(data: any[], filename: string)` — generic CSV export
  - `exportSessionRecap(sessions: SessionRecap[])` — formatted Rekap Pembinaan CSV
  - `exportChildrenList(children: Child[])` — formatted children CSV
  - `exportEvaluations(evaluations: Evaluation[])` — formatted evaluation CSV
- [ ] CSV format:
  - Headers: descriptive column names (English or Indonesian, decide with PM)
  - Date format: ISO 8601 (YYYY-MM-DD)
  - Numbers: comma-decimal for amounts, percentage for rates
  - Encoding: UTF-8 with BOM (for Excel compatibility)
- [ ] Client-side generation: No server-side export endpoint needed (next: optional server-side for large datasets)
- [ ] Tests: CSV format validation, file download trigger

**Git Commit:**
```
feat: implement CSV export utilities for reports
```

**Notes:**
- Client-side CSV generation using `papaparse` library
- Large datasets (>10k rows) should use server-side endpoint (future)

---

### Task 79: Implement Regional Route Protection & Scoping
**Duration:** 2–2.5 hours  
**Depends on:** Task 18, 71

**Description:**
Ensure all regional routes are protected and data scoped to coordinator's region/office.

**Acceptance Criteria:**
- [ ] Middleware: `@/middleware.ts` enforces "Branch Admin" or "Korwil" role on `(regional)/*` routes
- [ ] Data scoping: All API calls include coordinator's region/office in query
  - GET `/api/regional/children` → only children in coordinator's region
  - GET `/api/regional/coaching-sessions` → only sessions led by coordinator
  - GET `/api/regional/evaluations` → only evaluations created by coordinator
- [ ] Backend: API routes validate coordinator's region before returning data (authorization check)
- [ ] Tests: unauthorized access blocked, data properly scoped

**Git Commit:**
```
chore: enforce regional role-based access control and data scoping
```

**Notes:**
- Data scoping is critical for Korwil isolation
- Backend must validate; frontend isolation is not secure

---

### Task 80: Create Regional Children Photo Upload & Profile Picture
**Duration:** 2–2.5 hours  
**Depends on:** Task 72

**Description:**
Implement photo upload for child profiles.

**Acceptance Criteria:**
- [ ] Component: `PhotoUploadDialog`
  - Click to upload or drag-drop area
  - Preview before confirmation
  - Crop/rotate tools (optional; basic crop via canvas)
  - Submit button → uploads to storage
- [ ] Backend: `api/regional/children/[id]/photo` (POST)
  - Accepts multipart form-data (file)
  - Validates: image file, max 5MB, dimensions
  - Stores in managed object storage (e.g., Vercel Blob, AWS S3)
  - Returns: { url: "https://..." }
- [ ] Child profile: Display photo in header (placeholder if not set)
- [ ] Scoping: Coordinator can only upload for children in their region
- [ ] Tests: file upload validation, storage URL generation

**Git Commit:**
```
feat: implement child photo upload with storage integration
```

**Notes:**
- Photo upload is optional (nice-to-have)
- Use Vercel Blob for easy integration with Vercel deployment
- Placeholder image if no photo uploaded

---

### Task 81: Create Mobile Navigation & Hamburger Menu
**Duration:** 2–2.5 hours  
**Depends on:** Task 45, 71

**Description:**
Implement mobile-optimized navigation for regional dashboard.

**Acceptance Criteria:**
- [ ] Mobile hamburger menu:
  - Toggle button on mobile header
  - Overlay drawer with navigation items
  - Same menu structure as desktop sidebar
  - Close on route change
- [ ] Navigation items:
  - Dashboard
  - Children
  - Coaching Sessions
  - Hafalan
  - Evaluations
  - Reporting
  - (Settings, future)
- [ ] Active route indicator (highlight current page)
- [ ] Responsive: Hamburger visible on mobile (<768px), hidden on desktop
- [ ] Accessibility: ARIA labels, keyboard navigation (Tab through menu items)
- [ ] Tests: menu open/close, link navigation

**Git Commit:**
```
feat: implement mobile hamburger navigation for regional dashboard
```

**Notes:**
- Use shadcn/ui Drawer or custom implementation
- Drawer should be overlay (on top of page content)

---

### Task 82: Create Responsive Form Layouts for Mobile
**Duration:** 2–2.5 hours  
**Depends on:** Task 47, 72

**Description:**
Ensure all forms are fully mobile-responsive (single-column, full-width inputs).

**Acceptance Criteria:**
- [ ] Form layout guidelines:
  - Desktop (1024px+): Can use multi-column if beneficial
  - Tablet (768px–1023px): 1–2 columns
  - Mobile (<768px): 1 column, full-width inputs
- [ ] Input sizing:
  - Min height 44px (touch target)
  - Full width on mobile
  - Padding: 12px (button), 8px vertical (input)
- [ ] Buttons:
  - Mobile: Full-width primary buttons
  - Grouped secondary buttons (2 per row if needed)
- [ ] Test all regional dashboard forms:
  - Child registration
  - Coaching session creation
  - Hafalan assessment
  - Evaluation editing
- [ ] Tests: responsive layout, touch target sizes, input usability

**Git Commit:**
```
chore: ensure all forms are fully mobile-responsive (375px+)
```

**Notes:**
- Mobile-first design; test at 375px viewport
- Touch-friendly spacing and sizing

---

### Task 83: Create Field-Optimized Performance & Offline Capability (Future)
**Duration:** 2–3 hours  
**Depends on:** Task 71

**Description:**
Optimize regional dashboard for field usage (slow/offline conditions).

**Acceptance Criteria:**
- [ ] Performance optimizations:
  - Server Components by default (minimize JS)
  - Lazy-load modals/dialogs
  - Image optimization (Next.js Image)
  - Code splitting by route (automatic Next.js)
- [ ] Caching strategy:
  - SWR with aggressive caching (30-second dedup)
  - Stale-while-revalidate pattern
- [ ] Network resilience:
  - Error states for failed API calls
  - Retry button for failed requests
  - Timeout handling (display friendly error)
- [ ] Optional: Service Worker for offline-first (Phase 2)
  - Cache critical routes/data
  - Queue writes when offline, sync when online
- [ ] Tests: performance metrics, offline scenarios

**Git Commit:**
```
chore: optimize regional dashboard for field usage (performance, resilience)
```

**Notes:**
- Field coordinators often have slow/unreliable connections
- Critical flows (session creation, attendance) must work on 3G
- Service Worker is optional; core functionality works online

---

### Task 84: Create Regional Dashboard Settings & Profile Page
**Duration:** 1.5–2 hours  
**Depends on:** Task 71

**Description:**
Implement settings page for regional coordinators.

**Acceptance Criteria:**
- [ ] Page: `(regional)/settings/page.tsx`
  - Sections: Profile, Account, Preferences
  - Profile section: Name, phone, office, region (read-only, edit in Super Admin)
  - Account section: Email, password change form
  - Preferences section: Language, timezone, (future: notifications)
  - Save button, success/error feedback
- [ ] Password change: Current password, new password, confirm
- [ ] Mobile-friendly form layout
- [ ] Tests: password change, form submission

**Git Commit:**
```
feat: implement regional dashboard settings and profile page
```

**Notes:**
- Coordinator profile/role can't be changed (Super Admin only)
- Password change is self-service

---

## Reports & Exports

### Task 85: Implement Rekap Pembinaan Detailed Export (with Attendance Per Child)
**Duration:** 2–2.5 hours  
**Depends on:** Task 40, 78

**Description:**
Implement detailed export of Rekap Pembinaan with per-child attendance data.

**Acceptance Criteria:**
- [ ] API: `api/super-admin/reporting/recap-pembinaan-detailed?startDate&endDate&officeId`
  - Returns nested JSON: { sessions: [{ session, children: [{ child, status }, ...] }, ...] }
- [ ] CSV export: Utility function to flatten nested data
  - Columns: Session Date, Office, Region, Coordinator, Session Type, Child Name, Attendance Status, Mandiri Habits
  - One row per child per session
  - Totals/subtotals per session (optional)
- [ ] Large file handling: Stream response if > 10k rows
- [ ] Tests: export accuracy, file size handling

**Git Commit:**
```
feat: implement detailed Rekap Pembinaan export with per-child attendance
```

**Notes:**
- Detailed export can be large; use streaming for performance
- Useful for regional/branch-level analysis

---

### Task 86: Implement Semester Evaluation Report Export
**Duration:** 2–2.5 hours  
**Depends on:** Task 41, 78

**Description:**
Implement evaluation report export (CSV with all scores and notes).

**Acceptance Criteria:**
- [ ] API: `api/super-admin/reporting/evaluations-export?semesterId&officeId`
  - Returns JSON: evaluations with nested item scores
- [ ] CSV export: Flatten to one row per evaluation
  - Columns: Child Name, Office, Evaluator, Evaluation Date, Status, Item Name 1 Score, Item Name 2 Score, ..., Coach Notes
  - Summary row per evaluation (avg score)
- [ ] Ordering: Sort by child name, then evaluation date
- [ ] Tests: export accuracy, sorting

**Git Commit:**
```
feat: implement evaluation report export (CSV with scores and notes)
```

**Notes:**
- Evaluation export is useful for Super Admin review/analysis
- Can be integrated into compliance/audit reporting

---

### Task 87: Implement Semester Balance Report (Finance)
**Duration:** 1.5–2 hours  
**Depends on:** Task 34

**Description:**
Implement report of pairing balances by semester.

**Acceptance Criteria:**
- [ ] API: `api/super-admin/reporting/balance-report?startSemesterId&endSemesterId`
  - Returns: { pairings: [{ pairing: {...}, balances: [{ semester, closingBalance }, ...] }, ...] }
- [ ] CSV export:
  - Columns: Child Name, Donor Name, Program, Pairing Date, Semester 1, Semester 2, ..., Current Balance
  - One row per pairing
- [ ] Tests: balance calculation accuracy

**Git Commit:**
```
feat: implement balance report export (finance)
```

**Notes:**
- Finance reports are quarterly/semester-based for Super Admin review
- Balance report shows funding trail over time

---

### Task 88: Implement Generic Report Framework (Future: Template-Based Reports)
**Duration:** 1.5–2 hours  
**Depends on:** Task 85

**Description:**
Create framework for custom report generation (optional Phase 1, more relevant Phase 2).

**Acceptance Criteria:**
- [ ] Infrastructure:
  - `@/lib/reporting.ts` — generic report builder
  - Report templates (folder: `@/lib/report-templates/`)
- [ ] Template structure:
  - Query specification (which tables, filters, joins)
  - Column mappings (database field → export field)
  - Formatting rules (date format, number precision)
  - Aggregation (sum, count, avg)
- [ ] Builder: Allows combining templates or creating custom reports
- [ ] Tests: template rendering, custom report generation

**Git Commit:**
```
chore: implement generic report framework for future extensibility
```

**Notes:**
- Phase 1: Hard-coded reports (Tasks 85–87)
- Phase 2: Template-based custom reports (Task 88)
- Framework laid out now for future extensibility

---

## Testing

### Task 89: Set Up Jest & React Testing Library Configuration
**Duration:** 2–2.5 hours  
**Depends on:** Task 1

**Description:**
Configure unit testing framework and testing utilities.

**Acceptance Criteria:**
- [ ] Jest configured:
  - `jest.config.js` with Next.js preset
  - Transform files (TypeScript, JSX)
  - Module aliases matching `tsconfig.json`
  - Coverage settings (target: 70% lines)
- [ ] React Testing Library configured:
  - Custom render function with providers (if needed)
  - Common utilities exported from `@/testing/utils.tsx`
- [ ] Test scripts:
  - `npm run test` — run all tests
  - `npm run test:watch` — watch mode
  - `npm run test:coverage` — coverage report
- [ ] GitHub Actions: CI pipeline runs tests on every PR
- [ ] Tests: sample test to verify setup (e.g., test utils work)

**Git Commit:**
```
chore: configure Jest and React Testing Library
```

**Notes:**
- Use React Testing Library (not Enzyme) for component tests
- Test user interactions, not implementation details

---

### Task 90: Write Unit Tests for Business Logic (Calculations, Validation)
**Duration:** 2.5–3 hours  
**Depends on:** Task 5, 89

**Description:**
Write unit tests for utility functions and business logic.

**Acceptance Criteria:**
- [ ] Test files in `@/lib/__tests__/`:
  - `calculate.test.ts` — score calculations, age calc
  - `validation.test.ts` — input validation (email, phone, date ranges)
  - `format.test.ts` — date/number/text formatting
- [ ] Test coverage:
  - `calculate.ts`: age calculation, score averaging, percentages, edge cases (DOB in future, negative scores)
  - `validation.ts`: email format, phone format, date range validation, boundary conditions
  - `format.ts`: date formatting (locale-aware), currency formatting, truncation
- [ ] Each function has at least 3 tests (happy path, edge case, error case)
- [ ] Tests pass with > 80% line coverage for tested files

**Git Commit:**
```
test: add unit tests for business logic (calculations, validation)
```

**Notes:**
- Focus on edge cases and error handling
- Use descriptive test names (describe what is tested)

---

### Task 91: Write Integration Tests for API Routes
**Duration:** 3–4 hours  
**Depends on:** Task 21, 89

**Description:**
Write integration tests for critical API routes.

**Acceptance Criteria:**
- [ ] Test files in `@/app/api/__tests__/`:
  - `auth.test.ts` — login, logout, session refresh
  - `offices.test.ts` — GET list, POST create, PUT update, DELETE soft-delete
  - `children.test.ts` — GET list, POST create, GET detail
- [ ] Setup: Disposable test database (Neon branching or SQLite for tests)
- [ ] Test scenarios:
  - Happy path (valid input, expected response)
  - Error cases (invalid input, 400/404/409)
  - Authorization (authenticated/unauthenticated, role-based)
  - Data validation (Zod schemas work)
- [ ] Each endpoint tested with 2–3 scenarios
- [ ] Tests clean up data after execution (no test pollution)

**Git Commit:**
```
test: add integration tests for API routes (auth, offices, children)
```

**Notes:**
- Use disposable test database (don't test against production)
- Mock external services (email, storage)
- Clean up test data after each test

---

### Task 92: Write Component Tests for Shared Components
**Duration:** 2.5–3 hours  
**Depends on:** Task 45, 89

**Description:**
Write component tests for shared UI components.

**Acceptance Criteria:**
- [ ] Test files in `@/components/__tests__/`:
  - `DataTable.test.tsx` — rendering columns, sorting, pagination, row click
  - `FormInput.test.tsx` — value changes, validation display, focus states
  - `StatusBadge.test.tsx` — variant colors, status display
  - `Dialog.test.tsx` — open/close, form submission, keyboard ESC to close
- [ ] Test libraries: React Testing Library (not Snapshot tests)
- [ ] Each component tested:
  - User interactions (click, type, keyboard)
  - Props variations (different statuses, disabled, loading)
  - Accessibility (ARIA labels, focus management)
- [ ] Tests assert on visible text/elements (not implementation)

**Git Commit:**
```
test: add component tests for shared UI components
```

**Notes:**
- Use `screen.getByRole()` to query by accessibility role
- Avoid snapshot tests (fragile, not maintainable)

---

### Task 93: Write End-to-End Tests (Critical User Flows)
**Duration:** 3–4 hours  
**Depends on:** Task 72, 89

**Description:**
Write E2E tests for critical user workflows using Playwright or Cypress.

**Acceptance Criteria:**
- [ ] E2E test framework: Playwright (or Cypress, decide with team)
  - `e2e/child-registration.spec.ts` — Register child, verify in list
  - `e2e/session-creation.spec.ts` — Create session, record attendance
  - `e2e/evaluation-workflow.spec.ts` — Create, edit, submit evaluation
- [ ] Setup: Test against staging or local dev server
- [ ] Tests:
  - Login flow (happy path)
  - Register child (fill form, submit, verify in list)
  - Create coaching session (fill form, select children, submit)
  - Create and submit evaluation (fill scores, submit, verify approval workflow)
- [ ] Tests include waits/retries for async operations
- [ ] Screenshots on failure (for debugging CI failures)

**Git Commit:**
```
test: add end-to-end tests for critical user workflows
```

**Notes:**
- E2E tests are slower; focus on high-value workflows only
- Run E2E tests against staging, not on every commit (optional CI)
- Include visual regression checks (if time permits)

---

### Task 94: Set Up Accessibility Testing (axe, WAVE)
**Duration:** 1.5–2 hours  
**Depends on:** Task 45, 89

**Description:**
Configure automated accessibility testing.

**Acceptance Criteria:**
- [ ] Library: `@axe-core/react` for automated a11y checks
- [ ] Test setup: `@/testing/accessibility.test.ts`
  - Run axe scan on key pages (home, children list, evaluations)
  - Assert no critical/serious violations
- [ ] CI integration: Accessibility tests run on every PR
- [ ] Manual checks:
  - Keyboard navigation (Tab through UI)
  - Screen reader testing (with NVDA or JAWS on Windows, VoiceOver on Mac)
  - Color contrast validation (WCAG AA minimum)
- [ ] Documentation: Accessibility checklist for reviewers

**Git Commit:**
```
test: add automated accessibility testing with axe
```

**Notes:**
- Automated tests catch common issues; manual testing still needed
- Focus on WCAG 2.1 Level AA compliance

---

### Task 95: Set Up Code Coverage Reporting & Enforcement
**Duration:** 1.5–2 hours  
**Depends on:** Task 89

**Description:**
Configure code coverage reporting and enforcement in CI.

**Acceptance Criteria:**
- [ ] Jest configured for coverage:
  - Coverage threshold: 70% lines, 60% branches (adjustable)
  - Coverage reports generated in `coverage/` directory
- [ ] GitHub Actions: Enforce coverage threshold on PR
  - Fail if coverage drops below threshold
  - Post coverage report comment on PR
- [ ] Coverage reporting: Upload to Codecov (optional, for tracking over time)
- [ ] Documentation: Coverage expectations per module type (lib > components > pages)

**Git Commit:**
```
ci: add code coverage reporting and enforcement
```

**Notes:**
- Coverage is a proxy for testing quality; aim for high coverage but don't obsess over 100%
- Focus coverage on critical business logic, not UI rendering tests

---

### Task 96: Write Documentation Tests & Readme Examples
**Duration:** 1.5–2 hours  
**Depends on:** Task 89

**Description:**
Document testing practices and create example tests for future contributors.

**Acceptance Criteria:**
- [ ] Testing documentation: `docs/TESTING.md`
  - How to run tests (`npm run test`, watch mode, coverage)
  - Writing unit tests (examples, patterns)
  - Writing component tests (examples, accessibility testing)
  - Writing E2E tests (examples, CI integration)
  - Debugging tests (tips, common issues)
- [ ] Example tests in code (comments in test files)
  - Unit test example
  - Component test example
  - API route test example
  - E2E test example
- [ ] CI documentation: How tests run, how to debug CI failures

**Git Commit:**
```
docs: add testing documentation and example tests
```

**Notes:**
- Documentation helps future contributors understand testing patterns
- Examples in test files serve as templates

---

## Deployment & Operations

### Task 97: Configure Vercel Deployment & Environment Variables
**Duration:** 2–2.5 hours  
**Depends on:** Task 3, 4

**Description:**
Set up Vercel deployment with correct environment configuration.

**Acceptance Criteria:**
- [ ] Vercel project created (`rzajis.vercel.app`)
- [ ] GitHub integration: Auto-deploy on push to main, preview on PRs
- [ ] Environment variables configured:
  - Development: `.env.local` (local testing)
  - Staging: Vercel staging environment with staging database
  - Production: Vercel production environment with prod database
- [ ] `vercel.json` configured:
  - Build command (next build)
  - Output directory (.next)
  - Environment overrides per environment
  - Headers (CORS, security)
- [ ] Database connections:
  - Staging: Neon development branch
  - Production: Neon main branch (or separate production database)
- [ ] Secrets management: Use Vercel environment variables (never commit secrets)
- [ ] Testing: Deploy preview works, production build succeeds

**Git Commit:**
```
chore: configure Vercel deployment and environment setup
```

**Notes:**
- Vercel Git integration is automatic after GitHub connection
- Environment variables can be updated in Vercel dashboard (no redeploy needed for some)

---

### Task 98: Set Up Database Migrations & Seeding in CI
**Duration:** 2–2.5 hours  
**Depends on:** Task 13, 6

**Description:**
Automate database migration and seeding in CI/CD pipeline.

**Acceptance Criteria:**
- [ ] Migration script: `scripts/migrate.ts`
  - Runs pending migrations from `migrations/` folder
  - Logs migration status (up to date, applied new migrations)
  - Fails loudly if migration fails (don't ignore errors)
  - Idempotent (safe to run multiple times)
- [ ] Seed script: `scripts/seed.ts`
  - Populates reference data (session types, welfare categories, roles)
  - Creates sample office hierarchy
  - Idempotent (skip if data already exists)
  - Optional flag to reset (clear and re-seed)
- [ ] CI integration:
  - Preview deployments: Run migrations on preview database branch
  - Production: Manual trigger for production migrations (with approval/gating)
- [ ] Documentation: How to run migrations locally, how to write new migrations
- [ ] Tests: Verify migrations run successfully, seed data integrity

**Git Commit:**
```
chore: add database migration and seeding automation
```

**Notes:**
- Migrations should be version-controlled, not generated automatically
- Seed data should be idempotent (safe to re-run)
- Production migrations should have approval gate (discuss with PM)

---

### Task 99: Set Up Monitoring & Logging (Vercel Analytics, Error Tracking)
**Duration:** 2–2.5 hours  
**Depends on:** Task 97

**Description:**
Configure application monitoring, logging, and error tracking.

**Acceptance Criteria:**
- [ ] Vercel Analytics:
  - Enable Web Vitals tracking (CLS, FID, LCP)
  - Track custom metrics (API response time, form submission time)
  - Set up alerts for performance regression
- [ ] Error tracking: Sentry or similar
  - Capture unhandled errors
  - Capture API errors (5xx responses)
  - Errors tagged by environment (dev, staging, production)
  - Alerts for production errors
- [ ] Logging:
  - Structured logs (JSON format) for debugging
  - Log levels: error, warn, info, debug
  - Logs include context (user ID, request ID, timestamp)
  - Database query logging (optional, for performance debugging)
- [ ] Documentation: How to view monitoring dashboards, how to debug errors

**Git Commit:**
```
chore: set up monitoring, logging, and error tracking
```

**Notes:**
- Monitor performance metrics to meet targets (< 300ms API, < 1.5s FCP)
- Errors should be actionable (context, stack trace)

---

### Task 100: Create Deployment Runbook & Operations Documentation
**Duration:** 2–2.5 hours  
**Depends on:** Task 97, 98

**Description:**
Document deployment procedures, troubleshooting, and operations tasks.

**Acceptance Criteria:**
- [ ] Runbook: `docs/OPERATIONS.md`
  - Deployment checklist (how to deploy to staging/production)
  - Rollback procedure (if deployment fails)
  - Database backup/restore procedures
  - Secrets rotation (if applicable)
  - Common troubleshooting (app won't start, database connection fails, etc.)
- [ ] Emergency procedures:
  - How to disable a feature (feature flags, env var toggle)
  - How to contact on-call engineer (if applicable)
  - Escalation path for critical issues
- [ ] Regular maintenance tasks:
  - Database VACUUM/ANALYZE schedule
  - Index monitoring
  - Log retention/cleanup
  - Backup verification
- [ ] Status page: How to report status (if applicable)
- [ ] Documentation review: Ensure all operational knowledge is documented

**Git Commit:**
```
docs: add deployment runbook and operations procedures
```

**Notes:**
- Runbook is critical for new team members and emergency response
- Update runbook as operational procedures evolve

---

## Summary & Timeline

### Task Grouping by Phase

**Phase 1: Foundation (Tasks 1–20)**
- Setup & infrastructure
- Database schema & configuration
- Authentication framework
- Estimated: 10–15 working days

**Phase 2: Backend APIs (Tasks 21–44)**
- Master data APIs
- Core operation APIs (children, sessions, evaluations, hafalan)
- Reporting & finance APIs
- Estimated: 12–16 working days

**Phase 3: Frontend (Tasks 45–84)**
- Shared components
- Public website
- Super Admin dashboard
- Regional dashboard
- Estimated: 14–20 working days

**Phase 4: Reports, Testing, Deployment (Tasks 85–100)**
- Report exports
- Testing (unit, integration, E2E, accessibility)
- Deployment & monitoring
- Estimated: 8–10 working days

### Total Estimated Duration

- **100 tasks** × 2.5 hours average = 250 hours
- 8-hour working days: 31–32 days (6–8 weeks)
- With 20% buffer (unexpected issues, code review cycles): **8–10 weeks (40–50 working days)**

### Dependencies & Parallelization

- Tasks 21–44 (Backend APIs) depend on Task 20 (can start after auth is ready)
- Tasks 45–84 (Frontend) depend on Tasks 21–44 (can start after first batch of APIs complete)
- Tests (Tasks 89–96) can start early (test setup in Task 89)
- Deployment (Tasks 97–100) can run in parallel with final frontend tasks

---

**End of 12_TASK_BREAKDOWN.md**
