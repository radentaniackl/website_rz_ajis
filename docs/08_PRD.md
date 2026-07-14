**PRODUCT REQUIREMENTS DOCUMENT**

**AJIS — Anak Juara Information System**

Rebuild: Public Website · Super Admin Dashboard · Regional Dashboard

Prepared for: Rumah Zakat — Anak Juara Program

Version 1.0

Document Date: July 14, 2026

*Status: Draft for Stakeholder Review*

Technology Stack: Next.js (App Router) · PostgreSQL · Tailwind CSS ·
shadcn/ui · Vercel

Table of Contents

1. Introduction & Document Purpose

This Product Requirements Document (PRD) defines the target product for
the rebuild of AJIS (Anak Juara Information System), Rumah Zakat's
information system for managing the Anak Juara child-sponsorship
program. It consolidates prior technical analysis of the legacy MySQL
system, the in-progress Next.js rebuild, and a full PostgreSQL
re-architecture (normalization, foreign-key design, and indexing
strategy) into a single, actionable product specification for
engineering, design, and stakeholder sign-off.

AJIS supports the end-to-end lifecycle of the program: registering
sponsored children, recording weekly coaching sessions (Pembinaan),
tracking Qur'an memorization and religious-practice progress (Hafalan),
and producing semester evaluations and report cards (Penilaian / Laporan
Semester). The rebuild reorganizes this functionality into three
distinct applications sharing one PostgreSQL database and one design
system.

  ————————————————————————
  **Application**     **Primary Audience**    **Purpose**
  ——————- ———————-- —————————-
  Public Website      General public,         Program information,
                      prospective donors,     transparency reporting, and
                      families                donor engagement — no
                                              operational or sensitive
                                              child data exposed.

  Super Admin         Head-office Super Admin Organization-wide oversight:
  Dashboard                                   master data, users,
                                              cross-branch reporting,
                                              sponsorship/finance
                                              oversight, configuration.

  Regional Dashboard  Branch Admin (SPMD) and Day-to-day field operations:
                      Regional Coordinators   child records, coaching
                      (Korwil)                sessions, hafalan tracking,
                                              and evaluations, scoped to
                                              the user's branch or
                                              region.
  ————————————————————————

2. Business Goals

The rebuild is driven by operational pain points identified in the
legacy system and by the opportunity to modernize the data architecture
at the same time as the application layer.

  ———————————————————————--
  **Goal**            **Problem Being Solved**   **Target Metric**
  ——————- ————————-- ————————
  Eliminate double    Coordinators currently     100% of session,
  data entry          juggle spreadsheets,       hafalan, and evaluation
                      mobile forms, and the      data captured in one
                      legacy AJIS system         system

  Fast, reliable data Legacy system is slow,     API list responses \<
  access              particularly in the field  300ms at p95

  Mobile-first field  Coordinators work from     All key workflows fully
  usability           phones in the field;       usable at 375px viewport
                      legacy UI is not optimized width
                      for this                   

  Accurate,           Reports are currently      Reports generated
  consistent semester delayed and inconsistent   directly from
  reporting           across branches            normalized, validated
                                                 data with no manual
                                                 reconciliation

  Coordinator and     Coordinators depend on     No IT/engineering
  branch              IT/head office for routine involvement required for
  self-sufficiency    tasks                      day-to-day operation

  Organization-wide   Head office lacks a        Single Super Admin
  visibility          consolidated, real-time    Dashboard aggregating
                      view across branches       all branches and regions

  Public transparency No public-facing presence  A public website
  & donor trust       for the program today      communicating program
                                                 impact without exposing
                                                 child PII

  Sound, auditable    Legacy schema has no       Fully normalized (3NF)
  data foundation     foreign keys, inconsistent PostgreSQL schema with
                      normalization, and broken  enforced referential
                      audit trails               integrity and history
                                                 tracking
  ———————————————————————--

3. Scope

3.1 In Scope

-   **Three applications:** Public Website, Super Admin Dashboard, and
    Regional Dashboard, built on a single shared Next.js codebase (route
    groups) and PostgreSQL database.

-   **Core program operations:** child registration and profile
    management, coaching session (Pembinaan) tracking with attendance
    and independence-habit (Mandiri) recording, hafalan (memorization)
    tracking, and semester evaluation (Penilaian) generation and
    editing.

-   **Master data administration:** offices (Kantor), coaching regions
    (Wilayah Pembinaan), coordinators (SDM Wilayah), semesters,
    session-type and evaluation lookup data.

-   **User & access management:** account creation, role assignment, and
    password reset for all three roles (Super Admin, Branch Admin,
    Korwil).

-   **Reporting & export:** the previously legacy-only \"Rekap
    Pembinaan\" recap report (date range + office filter,
    export/export-detail) rebuilt as a native module, plus per-child
    semester report views.

-   **Sponsorship & donor linkage:** surfacing the existing
    donor/program linkage fields (currently captured but unused) so
    sponsorships and program funding are visible to Super Admin and, in
    de-identified form, on the public website.

-   **New, fully normalized PostgreSQL schema:** ten schema domains —
    Geography, Organization, Person, Reference, Access Control, Program,
    Sponsorship, Activity, Evaluation, and Finance — replacing the
    legacy flat, denormalized MySQL tables.

-   **Authentication & authorization:** session-based auth with
    role-based, row-level data scoping, hardened against the gaps
    identified in the legacy/rebuild analysis (see §7).

3.2 Out of Scope (Phase 1)

The following are explicitly deferred; they are captured in detail in
§10 (Future Development) rather than designed now:

-   Parent/guardian self-service portal (view-only access to their
    child's progress)

-   Push notifications for missing/overdue evaluations

-   PDF export/print layout of semester reports (data views are in
    scope; formatted PDF output is future)

-   Full CAJ (candidate-child intake) and PM (beneficiary program
    status) workflows from the legacy back office

-   Materi (session-material library), Prestasi (achievements), and
    Dokumentasi (photo documentation) modules

-   Online donation payment processing (donor visibility and linkage are
    in scope; a payment gateway is not)

-   Feature-level (as opposed to row-level/data-scope) permission
    granularity — e.g., \"Korwil can view but not edit\"

4. System Architecture Overview

The system is a single Next.js 15+ App Router project deployed to
Vercel, using route groups to separate the three applications while
sharing components, data-access helpers, and the design system.

  ————————————————————————
  **Layer**     **Choice**                 **Rationale**
  ————- ————————-- ——————————-
  Framework     Next.js (App Router),      Server-first rendering reduces
                Server Components by       client JS for
                default                    field/low-bandwidth usage; API
                                           routes and Server Actions
                                           colocated with pages

  Database      PostgreSQL (managed, e.g.  Native constraints,
                Neon or Vercel Postgres)   transactions, and rich indexing
                                           not available in the legacy
                                           MyISAM/MySQL setup

  Styling       Tailwind CSS               Utility-first styling mapped
                                           onto the existing Anak Juara
                                           brand tokens (orange-family
                                           palette), replacing
                                           inline-style-heavy legacy
                                           components

  Components    shadcn/ui                  Accessible, composable
                                           primitives (tables, dialogs,
                                           forms, tabs) that are copied
                                           into the repo and fully
                                           themeable via Tailwind, rather
                                           than a closed component library

  Hosting       Vercel                     Serverless functions for API
                                           routes, Edge/ISR caching for
                                           the Public Website, preview
                                           deployments per pull request

  Data access   Raw parameterized SQL via  Preserves the existing project
                a typed query helper (no   convention and keeps query
                full ORM)                  plans transparent and
                                           index-tunable
  ————————————————————————

4.1 Application Boundaries

-   **Public Website —** statically generated / ISR-cached marketing
    and transparency pages. No authentication. Reads only de-identified,
    aggregate data (e.g., total children supported, regions active,
    program milestones).

-   **Super Admin Dashboard —** authenticated route group scoped to
    id_group_user = Super Admin. Unrestricted read access across all
    offices and regions; the only role permitted to manage master data,
    users, and cross-branch configuration.

-   **Regional Dashboard —** authenticated route group shared by
    Branch Admin and Korwil roles. Identical UI; visible rows are scoped
    server-side by kantor_id (Branch Admin) or wilayah_pembinaan_id
    (Korwil).

4.2 Data Architecture Summary

The legacy schema — a handful of very wide, denormalized MySQL tables
with no foreign keys — is replaced with a normalized (3NF) PostgreSQL
schema organized into ten domains. This directly resolves the
data-integrity, auditability, and query-performance weaknesses
identified in the legacy-system analysis.

  ———————————————————————--
  **Schema Domain** **Responsibility**
  —————-- —————————————————--
  geography         Province → district → subdistrict → village hierarchy
                    and physical location data

  organization      Offices (Kantor), office hierarchy, coaching regions
                    (Wilayah Pembinaan), facilities

  person            Children, family/household members, coordinators,
                    donors, and system-user identity records

  reference         Lookup tables: session types, attendance status,
                    welfare/asnaf categories, evaluation items, hafalan
                    items

  access_control    System users, roles/groups, and
                    session/authentication records

  program           Program and enrollment status for each child
                    (eligibility, sponsorship state)

  sponsorship       Donor-to-child sponsorship relationships and program
                    funding linkage

  activity          Coaching sessions (header + per-child
                    attendance/mandiri detail), hafalan test records

  evaluation        Semester evaluation items, scores, and generated
                    report data

  finance           Donation input and disbursement records tied to
                    sponsorships and programs
  ———————————————————————--

**Key architectural decisions carried through from the normalization,
foreign-key, and indexing analysis:**

-   Surrogate BIGSERIAL primary keys with explicit foreign-key
    constraints and CASCADE/RESTRICT/SET NULL rules chosen per
    relationship (replacing convention-only integrity in the legacy
    schema).

-   CHECK constraints in place of legacy MySQL ENUM columns; native
    DATE/TIMESTAMP types (eliminating the '0000-00-00' placeholder
    pattern).

-   Coaching sessions split into a session-header table plus a per-child
    attendance/mandiri detail table (previously one denormalized row per
    child per session).

-   Soft-delete columns and a temporal/history pattern on core tables to
    restore the audit trail that is broken in the legacy system.

-   Composite indexes aligned to real query patterns (e.g., region +
    office on children; child + session + date on coaching records),
    plus targeted GIN and partial indexes for search and reporting
    workloads at scale.

5. Modules

5.1 Public Website

-   **Program Overview —** what the Anak Juara program is, eligibility
    criteria, and how sponsorship works.

-   **Impact & Transparency Reporting —** aggregate, de-identified
    statistics (children supported, regions active, sessions completed,
    hafalan milestones) sourced from the same normalized database.

-   **Regional Presence —** list of active branch offices and coaching
    regions, sourced from the organization schema.

-   **News & Updates —** program news, editorially managed content.

-   **Donor & Contact Inquiry —** contact/inquiry forms routed to the
    appropriate branch or head office; no payment processing in Phase 1.

5.2 Super Admin Dashboard

-   **Global Dashboard —** cross-branch aggregate statistics, trend
    and distribution charts, drill-down by region/office.

-   **Office & Region Management —** create/edit/deactivate Kantor and
    Wilayah Pembinaan master records (a gap in the current rebuild,
    where these exist only as read-only filter data).

-   **User & Role Management —** create/edit/deactivate ajis_user
    accounts, assign roles (Super Admin / Branch Admin / Korwil) and
    their scoping office or region.

-   **Coordinator (SDM Wilayah) Management —** full CRUD for
    volunteer/coordinator records, currently data-model-only with no UI.

-   **Children Oversight —** organization-wide child
    list/search/filter and profile view; registration, edit, and
    deactivation of child records (a required but currently
    unimplemented capability).

-   **Coaching Session Oversight & Rekap Export —** cross-branch
    session visibility plus the rebuilt \"Rekap Pembinaan\" recap report
    with date-range and office filtering and export.

-   **Evaluation Oversight —** cross-branch evaluation status,
    mass-sync/generate, and pivot views.

-   **Sponsorship & Donor Management —** view and manage
    donor-to-child sponsorship linkages and associated program funding.

-   **Finance Overview —** read-oriented view of donation input and
    disbursement records tied to the Anak Juara program (full
    donation/disbursement operations remain in the legacy back office;
    see §3.2).

-   **Configuration & Reference Data —** manage semesters, session
    types, evaluation item lists, and hafalan item lists.

-   **Audit Log —** view of who changed what and when, backed by the
    schema's history pattern.

5.3 Regional Dashboard (Branch Admin & Korwil)

-   **Regional Dashboard (Beranda) —** aggregate stats and trend/pie
    charts scoped to the logged-in user's branch or region.

-   **Children (Anak) —** list (filterable, paginated, mobile card
    view) and profile detail with tabs: Data, Hafalan, Kehadiran
    (attendance history), Penilaian. Register, edit, and deactivate
    within the user's scope.

-   **Coaching Sessions (Pembinaan) —** create, view, edit, and delete
    sessions; per-child attendance (hadir/izin/alfa) and Mandiri habit
    toggles; parent/guardian attendance capture for Parenting-type
    sessions.

-   **Hafalan —** checklist-style tracking by category (Qur'an surah,
    prayer recitation, du'a), embedded in the child profile, with
    per-category progress indicators.

-   **Evaluation (Penilaian) —** list, detail, edit,
    auto-sync/generate from session and hafalan data, mass-generate, and
    pivot view; semester report (Laporan Semester) generation combining
    Aspek Cerdas and Aspek Mandiri with free-text coach notes and
    \"Suara Anak Juara\" (child's voice).

6. User Roles

  ————————————————————————————--
  **Role**         **Applications**   **Scope of Data Access**        **Description**
  —————- —————— ——————————- ——————
  Super Admin      Super Admin        All offices, all regions,       Head-office role;
                   Dashboard          unrestricted                    the only role that
                                                                      manages master
                                                                      data, users, and
                                                                      system
                                                                      configuration.

  Branch Admin     Regional Dashboard All                             Oversees multiple
  (SPMD)                              children/sessions/evaluations   Korwil within one
                                      under the assigned office       branch office.
                                      (Kantor)                        

  Regional         Regional Dashboard Only the assigned coaching      Field volunteer
  Coordinator                         region (Wilayah Pembinaan)      performing the
  (Korwil)                                                            actual weekly data
                                                                      entry.

  Public Visitor   Public Website     Public, aggregate,              Anonymous,
                                      de-identified data only         unauthenticated
                                                                      visitor — no
                                                                      PII, no
                                                                      operational data.
  ————————————————————————————--

Access control is implemented as row-level data scoping (per the
access_control schema and the existing getScopeCondition pattern), not
as separate page/feature builds per role — the Regional Dashboard
renders one codebase for both Branch Admin and Korwil, with visible rows
filtered server-side by the caller's scope.

7. Features

7.1 Feature Summary by Application

  ———————————————————————--
  **Application**     **Key Features**
  ——————- —————————————————
  Public Website      Program overview · impact statistics · regional
                      presence directory · news/updates · contact & donor
                      inquiry forms

  Super Admin         Global analytics · office/region CRUD · user & role
  Dashboard           management · coordinator management · child
                      oversight & lifecycle · session oversight & Rekap
                      export · evaluation oversight & mass sync ·
                      sponsorship & donor management · finance overview ·
                      reference-data configuration · audit log

  Regional Dashboard  Scoped dashboard/analytics · child registration,
                      edit, deactivation, profile (4 tabs) · coaching
                      session CRUD with attendance/Mandiri matrix ·
                      hafalan checklist · evaluation edit, auto-sync,
                      pivot view, semester report
  ———————————————————————--

7.2 Notable New Capabilities vs. the Current Rebuild

The following close gaps explicitly identified in the prior technical
analysis of the in-progress rebuild:

-   Child (Anak) create, edit, and deactivate — previously only
    list/detail existed.

-   Office (Kantor) and coaching-region (Wilayah Pembinaan) management
    screens — previously read-only lookup data.

-   Coordinator (SDM Wilayah) management screens — previously
    data-model-only.

-   User & Group User management — previously required direct database
    provisioning.

-   Rekap Pembinaan export report — present in the legacy admin portal
    but not yet in the rebuild.

-   Sponsorship and donor/program linkage surfaced in the UI —
    previously captured in the data model but never displayed.

-   A reliable audit/history trail — previously broken due to
    unpopulated update-tracking columns.

8. Requirements

8.1 Functional Requirements

Representative user stories, organized by role:

-   **As a Super Admin,** I can create, edit, and deactivate offices,
    coaching regions, coordinators, and user accounts across the
    organization.

-   **As a Super Admin,** I can view a consolidated dashboard and
    generate the Rekap Pembinaan report across any date range and any
    office.

-   **As a Super Admin,** I can view sponsorship and donation linkage
    for any child or program.

-   **As a Branch Admin,** I can view and manage all children, sessions,
    and evaluations within my office.

-   **As a Korwil,** I can register, edit, and deactivate children
    within my assigned coaching region.

-   **As a Korwil,** I can record a coaching session, marking attendance
    and Mandiri habits for every child in the session in a single
    mobile-friendly form.

-   **As a Korwil,** I can update a child's hafalan checklist and see
    per-category progress.

-   **As a Korwil,** I can auto-generate a semester evaluation from
    session and hafalan data, then manually refine
    target/baseline/progress text and letter grade before finalizing.

-   **As a public visitor,** I can view program information and
    aggregate impact statistics without any authentication.

8.2 Non-Functional Requirements

  —————————————————————————--
  **Category**           **Requirement**
  ———————- ——————————————————
  Responsiveness         All Regional Dashboard workflows must be fully usable
                         at a 375px viewport width; the Public Website must be
                         responsive across mobile, tablet, and desktop.

  API performance        List and dashboard API responses must complete in
                         under 300ms at the 95th percentile under normal load.

  Data integrity         All cross-entity relationships enforced via PostgreSQL
                         foreign-key constraints; no orphaned records
                         permitted.

  Auditability           Every create/update/delete on core operational tables
                         must produce a retrievable history record (actor,
                         timestamp, prior value).

  Availability           Target 99.5% monthly uptime for authenticated
                         applications, consistent with Vercel's serverless
                         hosting model.

  Accessibility          Public Website and dashboards should meet WCAG 2.1 AA
                         color-contrast and keyboard-navigation basics,
                         leveraging shadcn/ui's accessible primitives.

  Internationalization   UI copy remains in Bahasa Indonesia (matching existing
                         field-user expectations); code, schema, and
                         documentation remain in English.
  —————————————————————————--

9. Security

9.1 Authentication & Session Management

-   Session-based authentication (encrypted, httpOnly, secure cookie)
    validated on every request — not merely checked for presence —
    closing the gap where middleware previously only confirmed a cookie
    existed rather than decrypting/validating it.

-   Cookie sameSite policy set to Strict and enforced consistently in
    code (previously a documented Strict policy shipped as Lax).

-   A one-time, in-place password migration path: legacy MD5-hashed
    passwords are verified once at login, then transparently re-hashed
    with a modern algorithm (bcrypt or argon2).

-   Rate limiting on the login endpoint to mitigate brute-force attempts
    against existing/migrating credentials.

9.2 Authorization

-   Role-based, row-level data scoping enforced centrally (per the
    access_control schema) and applied to every list, detail, and
    dashboard query — Super Admin unrestricted; Branch Admin scoped to
    office; Korwil scoped to coaching region.

-   Server-side re-validation that any submitted child, session, or
    evaluation ID actually falls within the caller's authorized scope
    before any write.

-   Foundation laid for future feature-level permissions (e.g.,
    view-only Korwil access) without redesigning the scoping model.

9.3 Data Protection

-   Children are a protected population: the Public Website exposes only
    aggregate, de-identified statistics — no names, photos, or
    identifying details of individual children are published.

-   All data in transit is encrypted via HTTPS; database connections use
    TLS to the managed PostgreSQL provider.

-   Secrets (database credentials, session encryption keys) are stored
    in Vercel environment variables, never committed to source control.

-   Input validation (e.g., via a schema-validation library) applied on
    every write endpoint to prevent malformed or malicious payloads.

-   File/photo upload (e.g., child or coordinator photos) routed through
    managed object storage with access-controlled URLs, rather than the
    current codebase's unhandled upload gap.

9.4 Known Risks Carried Forward from Legacy Analysis

Documented explicitly so they are tracked rather than silently
reintroduced during migration:

-   Historical charset mismatch (legacy latin1 tables vs. utf8mb4
    application connections) — resolved by migrating to native UTF-8
    in PostgreSQL, but historical data should be validated for
    corruption during migration.

-   Legacy zero-date placeholders ('0000-00-00') must be converted to
    real NULLs during data migration, not carried forward.

-   No automated tests or CI currently exist for the legacy/in-progress
    codebase; see §10 and the Deployment section for remediation.

10. Performance

10.1 Targets

  ———————————————————————--
  **Metric**                                 **Target**
  —————————————— —————————-
  List/dashboard API response time (p95)     \< 300ms

  Public Website page load (First Contentful \< 1.5s on 4G
  Paint)                                     

  Mobile field form interaction latency      \< 150ms perceived input
                                             response

  Scale target for indexing/query design     Millions of rows across
                                             children, sessions, and
                                             evaluation tables
  ———————————————————————--

10.2 Database Performance Strategy

-   Composite B-Tree indexes matched to actual query patterns (e.g.,
    region + office on children; child + session + date on
    coaching-session detail).

-   GIN indexes for free-text search fields (e.g., child name search)
    and partial indexes for common filtered queries (e.g., active-only
    records).

-   Keyset (seek-based) pagination for large list views in place of
    offset pagination, avoiding the performance cliff of deep OFFSET
    queries at scale.

-   Transactions wrapped around multi-row writes (e.g., creating a
    coaching session's per-child attendance rows), eliminating the
    partial-write risk present in the legacy MyISAM tables.

-   Routine index maintenance (VACUUM, ANALYZE, periodic REINDEX) and
    query-plan monitoring built into operational runbooks rather than
    left ad hoc.

10.3 Application Performance Strategy

-   Server Components by default to minimize client-side JavaScript,
    particularly important for field usage on constrained mobile
    connections.

-   Client-side data caching/revalidation (e.g., SWR) for dashboard and
    list views to avoid redundant refetches.

-   Static generation with Incremental Static Regeneration (ISR) for the
    Public Website, since its content changes infrequently relative to
    the operational dashboards.

-   A serverless-friendly PostgreSQL driver (e.g., a pooled/HTTP-based
    driver) matched to Vercel's function model, replacing the legacy
    fixed-size MySQL connection-pool configuration.

11. Deployment

  ———————————————————————--
  **Concern**      **Approach**
  —————- ——————————————————
  Hosting          Vercel — serverless functions for authenticated app
                   routes/API, Edge caching and ISR for the Public
                   Website

  Database         Managed PostgreSQL (e.g., Neon or Vercel Postgres)
                   with a pooled, serverless-compatible connection driver

  Environments     Separate development, staging, and production
                   environments with isolated database instances/branches

  CI/CD            Automated lint, type-check, build, and test pipeline
                   on every push; preview deployments for every pull
                   request via Vercel's Git integration

  Configuration    A committed vercel.json for build/runtime
                   configuration (absent in the current repository) and
                   documented environment variables

  Migrations       Version-controlled, incremental SQL migrations
                   replacing the legacy one-time schema+data snapshot
                   approach

  Monitoring       Vercel Analytics/observability for application
                   performance; database query-plan and index-usage
                   monitoring for the PostgreSQL layer

  Testing          Unit tests for pure business logic (score calculation,
                   age calculation, etc.) and integration tests for API
                   routes against a disposable database branch —
                   addressing the current absence of automated testing
  ———————————————————————--

12. Future Development

Capabilities identified during analysis but deliberately deferred beyond
Phase 1:

-   **Parent/guardian self-service portal —** view-only access for a
    child's parent/guardian to see coaching and evaluation progress.

-   **Push notifications —** automated alerts to coordinators for
    missing or overdue evaluations.

-   **PDF export of semester reports —** formatted,
    printable/downloadable Laporan Semester output.

-   **Full CAJ and PM workflows —** candidate-child intake pipeline
    and beneficiary program status management, migrated from the broader
    legacy back office.

-   **Materi, Prestasi, and Dokumentasi modules —** session-material
    library, achievement tracking, and photo documentation, all present
    in the legacy admin menu but outside this rebuild's scope.

-   **Online donation processing —** a payment gateway integration
    building on the sponsorship/finance linkage delivered in Phase 1.

-   **Feature-level permissions —** finer-grained, per-action
    permissions layered on top of the existing row-level scoping model
    (e.g., read-only roles).

-   **Donor self-service portal —** authenticated access for donors to
    track the children/programs they sponsor.

13. Appendix — Glossary of Domain Terms

  ———————————————————————--
  **Term**            **Meaning**
  ——————- —————————————————
  Anak Juara          The child-sponsorship program this system supports

  Anak                Child — a sponsored program participant

  Pembinaan           Coaching session — a scheduled group activity
                      with attendance and habit tracking

  Hafalan             Qur'an memorization / religious-practice
                      recitation tracking

  Penilaian           Evaluation / semester report card

  Korwil              Regional Coordinator — the field volunteer role

  SPMD                Branch office administrative role (Branch Admin)

  Kantor              Office — a branch or organizational unit

  Wilayah Pembinaan   Coaching region assigned to a Korwil

  Mandiri             Independence — a set of habit indicators tracked
                      per child per session

  Asnaf               Zakat-eligibility category classification

  Rekap Pembinaan     A recap/summary report of coaching sessions,
                      filterable by date range and office
  ———————————————————————--
