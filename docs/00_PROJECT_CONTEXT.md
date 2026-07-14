# PROJECT_CONTEXT.md

## AJIS Scholarship Management System

**Document purpose:** This is the single source of truth for the AJIS rebuild. Every future AI session (Claude Code, Claude Cowork, or any other assistant working on this repository) should read this document first, before writing or modifying any code. It captures what the system is, why it exists, what already exists, what is being built, and the standing rules that apply to every change.

**Status:** Living document — update it as decisions are made, not just at project kickoff.
**Last updated:** July 14, 2026

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Business Domain](#2-business-domain)
3. [Main Objectives](#3-main-objectives)
4. [Existing System](#4-existing-system)
5. [Target System](#5-target-system)
6. [User Roles](#6-user-roles)
7. [Technology Stack](#7-technology-stack)
8. [Database Standards](#8-database-standards)
9. [Coding Standards](#9-coding-standards)
10. [Folder Structure Standards](#10-folder-structure-standards)
11. [UI Standards](#11-ui-standards)
12. [Deployment Standards](#12-deployment-standards)
13. [Documentation Standards](#13-documentation-standards)
14. [Current Progress](#14-current-progress)
15. [Future Tasks](#15-future-tasks)

---

## 1. Project Overview

**Project name:** AJIS — Anak Juara Information System (product-facing name), tracked internally as the **AJIS Scholarship Management System**.

**Owner/beneficiary organization:** Rumah Zakat, under the **Anak Juara** child-sponsorship program.

**What it is:** AJIS is the operational system Rumah Zakat uses to run its child-sponsorship program end to end — registering sponsored children, recording weekly coaching sessions (Pembinaan), tracking Qur'an memorization and religious-practice progress (Hafalan), producing semester evaluations and report cards (Penilaian / Laporan Semester), and managing the donor-to-child sponsorship relationship that funds the program.

**Why this project exists:** the current production system (see §4) is a legacy PHP/MySQL application with a severely denormalized database, no foreign key constraints, duplicate tables, and broken audit trails. A partial Next.js rebuild is already in progress (this repository) but is at an early, mostly-scaffolded stage. This project is a **full rebuild**: a new normalized PostgreSQL schema plus three Next.js applications (public website, Super Admin dashboard, Regional dashboard) sharing one codebase and one database.

**Repository:** `github.com/devcntrz/rz_ajis`
**Legacy production site (reference only, not to be modified):** `scholarship.erzet.org`
**Current deployment target:** `rzajis.vercel.app` (Vercel preview/production)

---

## 2. Business Domain

AJIS supports the **Anak Juara** child-sponsorship program lifecycle:

- **Child registration & profile management** — enrolling a sponsored child, tracking family/household composition, education history.
- **Coaching sessions (Pembinaan)** — weekly/recurring group sessions run by a Korwil (regional coordinator), with per-child attendance (Hadir/Izin/Alfa) and independence-habit (Mandiri) tracking (prayer, recitation, charity, etc.).
- **Hafalan (memorization) tracking** — Qur'an surah, prayer, and du'a memorization progress, tracked per child per item.
- **Semester evaluation (Penilaian)** — periodic scored evaluations combining "Aspek Cerdas" (cognitive/academic) and "Aspek Mandiri" (independence) aspects, free-text coach notes, and "Suara Anak Juara" (the child's own voice), compiled into a Laporan Semester (semester report card).
- **Sponsorship & donor linkage** — pairing a donor to a sponsored child under a specific program, and recording the resulting donation/disbursement financial transactions.
- **Organizational structure** — Rumah Zakat's own office (Kantor) hierarchy, the coaching regions (Wilayah Pembinaan) each office runs, and the coordinators (SDM Wilayah / Korwil) assigned to them.
- **Public transparency & donor trust** — a public-facing website communicating program impact (aggregate, de-identified statistics) without exposing any child PII.

**Domain glossary** (Indonesian terms used throughout the codebase, database, and this document):

| Term | Meaning |
|---|---|
| Anak Juara | The child-sponsorship program this system supports |
| Anak | Child — a sponsored program participant |
| Pembinaan | Coaching session — a scheduled group activity with attendance and habit tracking |
| Hafalan | Qur'an memorization / religious-practice recitation tracking |
| Penilaian | Evaluation / semester report card |
| Korwil | Regional Coordinator — the field volunteer role |
| SPMD | Branch office administrative role (Branch Admin) |
| Kantor | Office — a branch or organizational unit |
| Wilayah Pembinaan | Coaching region assigned to a Korwil |
| Mandiri | Independence — a set of habit indicators tracked per child per session |
| Asnaf | Zakat-eligibility category classification |
| Rekap Pembinaan | A recap/summary report of coaching sessions, filterable by date range and office |

---

## 3. Main Objectives

Directly derived from the operational pain points of the legacy system:

| Objective | Problem being solved | Target metric |
|---|---|---|
| Eliminate double data entry | Coordinators juggle spreadsheets, mobile forms, and the legacy AJIS system | 100% of session, hafalan, and evaluation data captured in one system |
| Fast, reliable data access | Legacy system is slow, particularly in the field | API list responses < 300ms at p95 |
| Mobile-first field usability | Coordinators work from phones in the field; legacy UI is not optimized for this | All key workflows fully usable at 375px viewport width |
| Accurate, consistent semester reporting | Reports are currently delayed and inconsistent across branches | Reports generated directly from normalized, validated data with no manual reconciliation |
| Coordinator and branch self-sufficiency | Coordinators depend on IT/head office for routine tasks | No IT/engineering involvement required for day-to-day operation |
| Organization-wide visibility | Head office lacks a consolidated, real-time view across branches | A single Super Admin Dashboard aggregating all branches and regions |
| Public transparency & donor trust | No public-facing presence for the program today | A public website communicating program impact without exposing child PII |
| Sound, auditable data foundation | Legacy schema has no foreign keys, inconsistent normalization, broken audit trails | Fully normalized (3NF) PostgreSQL schema with enforced referential integrity and history tracking |

---

## 4. Existing System

### 4.1 Legacy production system — `scholarship.erzet.org`

- The current live AJIS system used by Rumah Zakat staff. Session-based login (username/password) gating a PHP/MySQL back office.
- **Do not modify.** This is the system of record until cutover; it is referenced only as the source of legacy data (for eventual migration) and legacy business logic (for feature parity).
- **Known legacy database problems** (from prior technical analysis, carried into the rebuild's database design — see §8):
  - Severely denormalized tables — e.g., a single ~130-column `ajis_anak` table storing father/mother/guardian/household-member data as fixed column blocks instead of separate rows.
  - No foreign key constraints anywhere — referential integrity is convention-only, leading to orphaned records and silent data corruption.
  - Duplicate tables (`ajis_propinsi` + `ref_propinsi` are identical).
  - Session data denormalized: one row per child per session, repeating session-level fields (date, type, material) for every attendee.
  - Free-text/inconsistent enum-like fields with no lookup-table validation.
  - Legacy charset mismatch (latin1 tables vs. utf8mb4 application connections) and zero-date placeholders (`'0000-00-00'`) instead of real NULLs.
  - No automated tests or CI.
  - Denormalized financial snapshots (child/donor/office names stored redundantly in donation and disbursement tables instead of via FK).

### 4.2 In-progress Next.js rebuild — this repository (`devcntrz/rz_ajis`)

- Bootstrapped with `create-next-app` (Next.js App Router, TypeScript). Deployed at `rzajis.vercel.app`.
- **Current top-level structure** (as of last inspection): `app/`, `components/`, `hooks/`, `lib/`, `public/`, `refs/`, `types/`, plus `middleware.ts`, `eslint.config.mjs`, `next.config.ts`, `tsconfig.json`, `AGENTS.md`, `CLAUDE.md`, `README.md`.
- This is an **early-stage scaffold**, not a completed rebuild — the bulk of the schema, business logic, and UI described in this document is not yet built. Treat existing code in this repo as the current foundation to extend, not as a reference implementation to copy patterns from uncritically — verify it against the standards in this document before extending it.
- `AGENTS.md` and `CLAUDE.md` already exist in the repo root — check them for any repo-local agent instructions in addition to this document; this document is the authoritative project-level context, but repo-local files may carry supplementary, more granular conventions.

---

## 5. Target System

A single Next.js 15+ App Router project, deployed to Vercel, using **route groups** to separate three applications while sharing components, data-access helpers, and one PostgreSQL database.

| Application | Primary Audience | Purpose |
|---|---|---|
| **Public Website** | General public, prospective donors, families | Program information, transparency reporting, donor engagement — no operational or sensitive child data exposed |
| **Super Admin Dashboard** | Head-office Super Admin | Organization-wide oversight: master data, users, cross-branch reporting, sponsorship/finance oversight, configuration |
| **Regional Dashboard** | Branch Admin (SPMD) and Regional Coordinators (Korwil) | Day-to-day field operations: child records, coaching sessions, hafalan tracking, evaluations, scoped to the user's branch or region |

### 5.1 Application boundaries

- **Public Website** — statically generated / ISR-cached. No authentication. Reads only de-identified, aggregate data (total children supported, active regions, program milestones).
- **Super Admin Dashboard** — authenticated route group scoped to the Super Admin role. Unrestricted read access across all offices and regions; the only role that manages master data, users, and cross-branch configuration.
- **Regional Dashboard** — authenticated route group shared by Branch Admin and Korwil roles. Identical UI; visible rows are scoped server-side by `kantor_id` (Branch Admin) or `wilayah_pembinaan_id` (Korwil).

### 5.2 Core modules

**Public Website:** Program Overview · Impact & Transparency Reporting · Regional Presence · News & Updates · Donor & Contact Inquiry.

**Super Admin Dashboard:** Global Dashboard (cross-branch stats/drill-down) · Office & Region Management · User & Role Management · Coordinator (SDM Wilayah) Management · Children Oversight · Coaching Session Oversight & Rekap Pembinaan Export · Evaluation Oversight · Sponsorship & Donor Management · Finance Overview (read-oriented) · Configuration & Reference Data · Audit Log.

**Regional Dashboard (Branch Admin & Korwil):** Regional Dashboard (Beranda) · Children (Anak) — list/profile with Data/Hafalan/Kehadiran/Penilaian tabs · Coaching Sessions (Pembinaan) — create/edit/delete, per-child attendance and Mandiri toggles · Hafalan — checklist tracking by category · Evaluation (Penilaian) — list/detail/edit, auto-sync/generate, mass-generate, Laporan Semester generation.

### 5.3 Explicitly out of scope for this rebuild phase

Deferred to future development (see §15) rather than designed now:
- Parent/guardian self-service portal
- Push notifications for missing/overdue evaluations
- PDF export/print layout of semester reports (data views are in scope; formatted PDF output is future)
- Full CAJ (candidate-child intake) and PM (beneficiary program status) workflows from the legacy back office
- Materi (session-material library), Prestasi (achievements), and Dokumentasi (photo documentation) modules
- Online donation payment processing (donor visibility/linkage is in scope; a payment gateway is not)
- Feature-level (as opposed to row-level/data-scope) permission granularity (e.g., "Korwil can view but not edit")

---

## 6. User Roles

| Role | Application(s) | Scope of Data Access | Description |
|---|---|---|---|
| **Super Admin** | Super Admin Dashboard | All offices, all regions, unrestricted | Head-office role; the only role that manages master data, users, and system-wide configuration |
| **Branch Admin (SPMD)** | Regional Dashboard | Scoped to their `kantor_id` (office) | Branch-level administrative operations: children, sessions, evaluations within their branch |
| **Korwil (Regional Coordinator)** | Regional Dashboard | Scoped to their `wilayah_pembinaan_id` (coaching region) | Field coordinator: runs coaching sessions, records attendance/hafalan/evaluations within their assigned region |

**Access model:** authentication is session-based. Authorization combines two layers that must not be conflated:
1. **Role-based feature permissions** — what actions a role is allowed to perform at all (`access_control.role_permission`).
2. **Row-level data scoping** — which rows (which office's or region's data) a given user can see, enforced server-side based on the user's linked `kantor_id`/`wilayah_pembinaan_id`. This is coarser-grained than feature permissions and is the primary access-control mechanism for Branch Admin and Korwil.

A donor may optionally hold a portal login (`system_user.donor_id`) for future donor self-service features; a coordinator's login (`system_user.coordinator_id`) is how Branch Admin/Korwil access is granted today. A pure system/admin account (`is_system_account = true`) is not tied to either.

---

## 7. Technology Stack

| Layer | Choice | Notes |
|---|---|---|
| **Framework** | Next.js (App Router), Server Components by default | Server-first rendering minimizes client JS for field/low-bandwidth mobile usage; API routes and Server Actions colocated with pages |
| **Language** | TypeScript | Matches existing repo scaffold |
| **Database** | PostgreSQL, hosted on **Neon** | Serverless-friendly managed Postgres; see §8 for schema rules |
| **Data access** | Raw parameterized SQL via a typed query helper (no full ORM), or an ORM if adopted later — **to be confirmed against current repo state before assuming either** | Keeps query plans transparent and index-tunable; if this decision changes, update this section |
| **Styling** | Tailwind CSS | Utility-first, mapped onto the existing Anak Juara brand tokens (orange-family palette) |
| **UI components** | **Stisla** (admin dashboard design reference) + **shadcn/ui** (component primitives) | shadcn/ui components (copied into the repo, Tailwind-themeable) are used as the implementation layer; Stisla is the visual/layout reference for the admin dashboard aesthetic. Reconcile the two consistently — see §11 |
| **Hosting** | Vercel | Serverless functions for authenticated app routes/API; Edge/ISR caching for the Public Website; preview deployments per pull request |
| **Auth** | Session-based | Role-based, row-level data scoping (see §6) |

**Deviation policy:** if any of the above changes (e.g., an ORM is adopted, or the UI approach changes), update this section in the same change, so this document never drifts from what the repo actually does.

---

## 8. Database Standards

**Target:** PostgreSQL 14+, hosted on Neon.

These rules are **non-negotiable** for every table, current and future, unless this document is explicitly updated to change them:

1. **Primary keys are `BIGSERIAL`. Never `UUID`.** Every FK referencing a primary key is `BIGINT`. Rationale: sequential integer keys keep B-tree indexes compact and cache-friendly, keep FK joins cheap across this schema's deep hierarchies (province → district → subdistrict → village; office → office), and cost half the storage of a `UUID` FK column at scale. If a non-enumerable public-facing identifier is ever needed (e.g., a donor receipt number), add a separate `*_public_code VARCHAR UNIQUE` display column — do not switch the primary key strategy.
2. **No native `ENUM` type. Use `VARCHAR` + `CHECK` instead.** Applies to every enum-like field (`transaction_type`, `education_level`, `attendance status`, etc.). Rationale: `CHECK` constraints are added/altered transactionally with zero migration risk; native `ENUM` cannot have values removed without rebuilding the type. Most enum-like concepts in this domain are modeled as proper `RESTRICT`-protected lookup tables (session type, attendance status, welfare category, role) rather than either approach — prefer a lookup table over a `CHECK` list whenever the vocabulary is likely to grow or needs a display name distinct from its code.
3. **`snake_case` naming throughout** — schemas, tables, columns, constraints, indexes. Index names: `ix_<table>_<column(s)>`. Unique constraints: `uq_<table>_<column(s)>`. Check constraints: `chk_<table>_<rule>`.
4. **`TIMESTAMP` (no time zone) for `created_at`/`updated_at`**, both `NOT NULL DEFAULT CURRENT_TIMESTAMP`. AJIS is a single-timezone (WIB/UTC+7) operation; revisit `TIMESTAMPTZ` only if the system ever spans multiple time zones. An `updated_at`-refresh trigger is assumed so the application layer doesn't have to remember to set it.
5. **`deleted_at` only where a table genuinely needs a queryable deletion timestamp.** The default soft-delete mechanism is `active BOOLEAN NOT NULL DEFAULT TRUE` on tables where deactivation-without-data-loss matters (offices, regions, facilities, reference/lookup tables, children, coordinators, donors, sponsorship pairings, hafalan items). Pure dependent/detail tables (attendance rows, evaluation scores) get neither — they only disappear via `CASCADE` from their parent. `finance.transaction` gets neither `active` nor `deleted_at` — financial rows are application-level immutable (see rule 8).
6. **Every table is normalized to 3NF.** No repeating groups as columns (use child tables), no data that depends only on part of a composite key, no column that depends on another non-key column rather than the primary key. Lookup/reference values live in dedicated tables, not free text.
7. **Every foreign key relationship has an explicit, deliberately chosen delete rule** — `CASCADE`, `RESTRICT`, or `SET NULL` — never left at the database default. Guidance:
   - `CASCADE` — only for rows that have no meaning without their parent (e.g., an attendance row without its session).
   - `RESTRICT` — for reference/lookup data and anything financial or audit-relevant; a parent in active use can never be silently deleted out from under dependent rows.
   - `SET NULL` — only where the dependent row remains meaningful without the parent (e.g., a login account whose linked coordinator record is removed).
   - **Financial data is the one non-negotiable case:** any FK pointing toward `finance.transaction`, directly or transitively, must be `RESTRICT`. Never `CASCADE` through a financial table.
8. **Every foreign key column is explicitly indexed.** PostgreSQL does not auto-index FK columns (only PKs and `UNIQUE` columns). Every FK gets a B-tree index — required for `RESTRICT`/`CASCADE` delete-check performance and because most real query patterns in this system are FK lookups.
9. **Optimize indexing deliberately, not speculatively.** Add composite indexes where a query filters/sorts on a fixed multi-column combination; add partial indexes (`WHERE active = TRUE`, `WHERE effective_to IS NULL`) where a filter excludes a large, predictable share of rows; add `GIN` indexes only for `JSONB`/array columns queried by contents, not scalar equality. Add `UNIQUE` constraints wherever the business implies a uniqueness rule (one evaluation per child per semester, one attendance row per child per session), not just where convenient.
10. **Money columns are `NUMERIC(14,2)`, never `FLOAT`/`REAL`.** No exceptions for financial data.
11. **Schemas (namespaces) mirror business domains**, following the ten-schema layout already established for this project: `geography`, `organization`, `person`, `reference`, `access_control`, `program`, `sponsorship`, `activity`, `evaluation`, `finance`. New tables belong in the schema matching their business domain; a genuinely new domain gets a new schema rather than being forced into an existing one.
12. **No SQL migration files should be treated as this document's authority.** The full table-by-table specification (every table, column, constraint, index, and FK with rationale) lives in `10_DATABASE_SPECIFICATION.md` — treat that document as the schema's source of truth, and this section as the standing rules that govern any *change* to that schema.

**Known open items requiring confirmation before further schema work** (carried from the database specification — do not assume answers to these):
- Full column lists for `child`, `coordinator`, `donor`, `program`, `office`, `facility`, `evaluation_item`, and `hafalan_item_lookup` — only FK/PK/audit/soft-delete columns are currently specified; business attribute columns (address, DOB, NIK, contact info, etc.) need confirmation against actual application requirements.
- Exact `CHECK`-constrained vocabularies (`transaction_type`, `education_level`, habit/hafalan status values, `family_member.relationship`) — several are inferred from narrative examples, not confirmed exhaustive lists.
- Whether `hafalan_assessment` should overwrite the latest status per child/item (current design) or version every re-assessment.
- Whether the evaluation score scale is genuinely 0–100.
- Whether `finance.transaction.amount` needs signed values for `adjustment`-type rows, or all adjustments are positive with direction implied elsewhere.

---

## 9. Coding Standards

*(General principles — repo-local `AGENTS.md`/`CLAUDE.md` may add framework- or tool-specific detail; this section should not conflict with those, and either document should be updated if a conflict is found.)*

- **TypeScript throughout**, matching the existing scaffold. Avoid `any`; prefer explicit types generated from or matched to the database schema.
- **Server Components by default**; reach for Client Components only where interactivity genuinely requires it (forms, toggles, real-time UI) — this is a stated performance requirement (§3), not just a style preference, since field usage is on constrained mobile connections.
- **Data access is parameterized and typed** — no string-concatenated SQL, ever, regardless of whether a query builder, raw SQL helper, or ORM is in use.
- **Row-level data scoping is enforced server-side**, never trusted from client input — every query that returns Branch Admin or Korwil data must filter by the authenticated user's `kantor_id`/`wilayah_pembinaan_id` at the query layer, not just hide UI elements.
- **Business logic that has clear pure-function shape (score calculation, age calculation, etc.) is unit-testable** and should be written as such, in anticipation of the CI/testing standard in §12.
- **Naming conventions in application code should mirror the database's `snake_case` at the data-access boundary** and may convert to `camelCase` above that boundary — be consistent about *where* that conversion happens (e.g., at the query-mapping layer) rather than mixing conventions ad hoc.
- **No secrets committed to source control.** Database credentials, session encryption keys, and any third-party API keys live in Vercel environment variables only.
- Input validation applied on every write endpoint (schema-validation library) to prevent malformed or malicious payloads — this is a stated security requirement, not optional.
- File/photo uploads route through managed object storage with access-controlled URLs; do not implement ad hoc unhandled upload handling (a known gap in the legacy codebase, explicitly called out for remediation).

---

## 10. Folder Structure Standards

Based on the existing repository scaffold, extended for the target three-application structure:

```
rz_ajis/
├── app/                      # Next.js App Router — route groups per application
│   ├── (public)/              # Public Website route group — no auth
│   ├── (super-admin)/         # Super Admin Dashboard route group — authenticated
│   ├── (regional)/            # Regional Dashboard route group — Branch Admin & Korwil, authenticated
│   └── api/                   # API routes / Server Actions shared across apps where applicable
├── components/                # Shared UI components (shadcn/ui-based; see §11)
├── hooks/                     # Shared React hooks
├── lib/                       # Data-access helpers, query utilities, auth/session logic, shared business logic
├── public/                    # Static assets
├── refs/                      # Reference material (design docs, legacy-system notes, etc. — confirm current contents before assuming purpose)
├── types/                     # Shared TypeScript types, ideally generated from or matched to the database schema
├── middleware.ts              # Auth/session middleware, route-group protection
├── AGENTS.md                  # Repo-local agent instructions (supplementary to this document)
├── CLAUDE.md                  # Repo-local Claude-specific instructions (supplementary to this document)
└── PROJECT_CONTEXT.md         # This document
```

**Route group rule:** the three applications (`public`, `super-admin`, `regional`) are separated using Next.js route groups so they can share `components/`, `lib/`, and `types/` without duplicating layout or data-access code, while keeping each application's auth boundary and route tree distinct.

**Before adding a new top-level folder**, check whether an existing one already fits — this structure is intentionally shallow. If a new domain concern doesn't fit `app/`, `components/`, `hooks/`, `lib/`, or `types/`, that's a signal to discuss the addition rather than assume it, and to update this document once agreed.

---

## 11. UI Standards

- **Component layer:** shadcn/ui — accessible, composable primitives (tables, dialogs, forms, tabs) copied into the repo and themed via Tailwind, rather than a closed component library. This is the implementation layer for every interactive UI element.
- **Design reference:** Stisla — used as the visual/layout reference for the admin dashboard aesthetic (Super Admin and Regional dashboards specifically; the Public Website has its own marketing-site design language, not a Stisla-derived one). Where Stisla's conventions and shadcn/ui's default styling diverge, shadcn/ui's Tailwind-based theming is the implementation mechanism — Stisla informs layout/spacing/navigation patterns, not literal markup or CSS to copy in.
- **Brand tokens:** the existing Anak Juara brand palette (orange-family) is mapped onto Tailwind theme tokens, replacing the legacy system's inline-style-heavy components.
- **Mobile-first, field-usable:** every Regional Dashboard workflow must be fully usable at a 375px viewport width — this is a stated, measurable requirement (§3), not a nice-to-have. Design and test admin/regional screens mobile-first, not as a desktop-first layout with a responsive afterthought.
- **Performance budget informs UI choices:** Server Components by default, client-side data caching/revalidation (e.g., SWR) for dashboard/list views to avoid redundant refetches, and static generation with ISR for the Public Website (content changes infrequently relative to the operational dashboards).
- **Accessibility:** shadcn/ui's accessible-by-default primitives should not be bypassed with custom unstyled markup where an equivalent primitive exists.
- **No child PII on the Public Website**, ever, in any UI state — this is a hard content-security rule, not just a data-access rule; a UI bug that reveals a name, photo, or identifying detail on a public page is treated as a security defect, not a cosmetic one.

---

## 12. Deployment Standards

| Concern | Approach |
|---|---|
| **Hosting** | Vercel — serverless functions for authenticated app routes/API, Edge caching and ISR for the Public Website |
| **Database** | Neon (managed PostgreSQL) with a pooled, serverless-compatible connection driver — a fixed-size connection pool (the legacy MySQL pattern) is not compatible with Vercel's function model |
| **Environments** | Separate development, staging, and production environments with isolated database instances/branches (Neon branching is the expected mechanism) |
| **CI/CD** | Automated lint, type-check, build, and test pipeline on every push; preview deployments for every pull request via Vercel's Git integration |
| **Configuration** | A committed `vercel.json` for build/runtime configuration, and documented environment variables (do not assume undocumented env vars — confirm and document any new one added) |
| **Migrations** | Version-controlled, incremental SQL migrations — never a one-time schema+data snapshot (the legacy approach). Migration files are the *execution* of changes; `10_DATABASE_SPECIFICATION.md` remains the *specification* they should conform to |
| **Monitoring** | Vercel Analytics/observability for application performance; database query-plan and index-usage monitoring for the PostgreSQL layer |
| **Testing** | Unit tests for pure business logic (score calculation, age calculation, etc.); integration tests for API routes against a disposable database branch — this directly addresses the legacy system's complete absence of automated testing |
| **Secrets** | Vercel environment variables only; never committed to source control; database credentials use TLS in transit |

---

## 13. Documentation Standards

- **This document (`PROJECT_CONTEXT.md`) is updated whenever a standing decision changes** — technology stack, database rules, folder structure, or scope. It is not a one-time kickoff artifact; treat a stale section here as a bug.
- **`10_DATABASE_SPECIFICATION.md`** is the authoritative, table-by-table database specification (every table, column, constraint, index, and foreign key, with rationale). Schema changes should be reflected there, not only in migration files.
- **Repo-local `AGENTS.md` / `CLAUDE.md`** carry supplementary, more granular or tool-specific instructions. They should not contradict this document; if a conflict is found, resolve it explicitly (update whichever is wrong) rather than letting both stand.
- **Numbered document convention:** project-level reference documents follow a `NN_DOCUMENT_NAME.md` naming pattern (e.g., `10_DATABASE_SPECIFICATION.md`) to make reading order and document lineage clear as the document set grows.
- **No SQL migrations are ever treated as documentation** — a migration file records *what changed and when*; it is not a substitute for updating the specification document that explains *why* the schema looks the way it does.
- **Decisions with an explicit rationale trade-off** (e.g., `BIGSERIAL` vs. `UUID`, `VARCHAR`+`CHECK` vs. native `ENUM`) should be documented with the *reasoning*, not just the conclusion, so a future session can evaluate whether the trade-off still holds rather than only knowing the rule.
- **Open items / unconfirmed assumptions are recorded explicitly** (see the open-items list in §8) rather than silently resolved by guessing — this document should always distinguish between "decided" and "assumed, pending confirmation."

---

## 14. Current Progress

*(Update this section as work lands — it should reflect the actual repository state, not the target state.)*

- **Repository:** bootstrapped via `create-next-app` (Next.js App Router, TypeScript). Top-level structure exists (`app/`, `components/`, `hooks/`, `lib/`, `public/`, `refs/`, `types/`) but is largely scaffold-level, not feature-complete.
- **Deployment:** connected to Vercel, deployed at `rzajis.vercel.app`.
- **Repo-local agent docs:** `AGENTS.md` and `CLAUDE.md` already exist in the repo root — their current content should be reviewed alongside this document, and reconciled if they predate it.
- **Database design:** the target PostgreSQL schema has been fully specified at the design-document level (ten schemas, 34 tables, all constraints/indexes/FKs explained) in `10_DATABASE_SPECIFICATION.md`. **No migration has been generated or applied yet** — this is a design artifact, not a deployed schema.
- **Product requirements:** a full PRD covering scope, modules, user roles, architecture, security, and performance targets exists and underlies §§2–7 of this document.
- **Legacy system analysis:** normalization, foreign-key design, and indexing-strategy analysis of the legacy MySQL schema is complete and has directly informed the target schema.
- **Not yet started:** actual schema migration/deployment to Neon; authentication implementation; any of the three applications' UI or business logic; CI/CD pipeline configuration; data migration tooling from the legacy MySQL database.

---

## 15. Future Tasks

### 15.1 Immediate next steps (foundation)
1. Confirm the open schema items listed in §8 (full column lists, CHECK vocabularies, scoring scale, etc.) against actual stakeholder/business requirements.
2. Produce the first versioned SQL migration from `10_DATABASE_SPECIFICATION.md`, targeting a Neon development branch.
3. Set up CI (lint, type-check, build, test) and preview deployments per the standards in §12.
4. Implement session-based authentication and the role/row-level scoping model described in §6.
5. Establish the route-group structure (`(public)`, `(super-admin)`, `(regional)`) described in §10.

### 15.2 Phase 1 build (in scope per PRD)
- Office & region master-data management (currently read-only filter data in the in-progress rebuild — needs full CRUD).
- User & role management.
- Coordinator (SDM Wilayah) management — currently data-model-only with no UI.
- Children Oversight / Children (Anak) module across both admin dashboards, including registration, edit, deactivation.
- Coaching Session module with per-child attendance and Mandiri habit tracking.
- Hafalan checklist tracking embedded in the child profile.
- Evaluation (Penilaian) module, including auto-sync/generate from session and hafalan data, mass-generate, and Laporan Semester generation.
- Rekap Pembinaan recap report (date-range + office filter, export/export-detail) as a native module.
- Sponsorship & donor management, and read-oriented Finance Overview.
- Public Website: Program Overview, Impact & Transparency Reporting, Regional Presence, News & Updates, Donor & Contact Inquiry.
- Audit log view backed by the schema's history/audit columns.
- Legacy data migration: MySQL → PostgreSQL, including the family-member/household-member extraction from the legacy flat `ajis_anak` table, and validation of historical data affected by the legacy charset mismatch and zero-date placeholders.

### 15.3 Explicitly deferred (post-Phase-1)
- Parent/guardian self-service portal (view-only access to a child's progress).
- Push notifications for missing/overdue evaluations.
- PDF export/print layout of semester reports.
- Full CAJ (candidate-child intake) and PM (beneficiary program status) workflows from the legacy back office.
- Materi (session-material library), Prestasi (achievements), and Dokumentasi (photo documentation) modules.
- Online donation payment gateway integration (building on the sponsorship/finance linkage already in Phase 1).
- Feature-level (as opposed to row-level) permission granularity.
- Donor self-service portal.

**When picking up any future task, re-read this document first** — in particular §8 (Database Standards) and its open-items list, and §5.3/§15.3 (explicitly out of scope) — before assuming a feature is either unstarted or intentionally excluded.

---

**End of PROJECT_CONTEXT.md**
