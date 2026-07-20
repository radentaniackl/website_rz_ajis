# PRODUCT REQUIREMENT DOCUMENT (PRD)
## AJIS (Anak Juara Information System) - Admin Panel Dashboard

**Project Version:** 2.0 (Rebuild)  
**Last Updated:** July 2026  
**Tech Stack:** Next.js 15 (App Router) + React Server Components + Drizzle ORM + PostgreSQL + Tailwind CSS + shadcn/ui  

---

## 1. EXECUTIVE SUMMARY

AJIS Admin Panel adalah sistem manajemen pusat untuk operasional Anak Juara di tingkat super admin, branch manager, dan regional coordinator. Sistem ini dirancang ulang dengan teknologi modern untuk mencapai:

- **Performance:** Loading instan < 1 detik, bebas delay pada dataset 7.000+ rows
- **Scalability:** Server-side pagination, database indexing optimal
- **Security:** SSO authentication, role-based access control (RBAC), granular data scoping per role
- **UX/UI:** Responsive design (mobile/tablet/desktop), minimalis modern, transisi instan

**Scope:** Admin Panel Management Dashboard dengan 3 user roles (Super Admin, Branch Admin, Regional Coordinator)

---

## 2. SYSTEM OVERVIEW & ARCHITECTURE

### 2.1 Architecture Stack

```
┌─────────────────────────────────────────────────────────────┐
│                      CLIENT LAYER                           │
│  React 19 (RSC) + Next.js App Router + Tailwind CSS + UI   │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                  NEXT.JS SERVER LAYER                       │
│  • Server Components (async fetch, data transformation)     │
│  • Server Actions (mutations, business logic)               │
│  • Middleware (auth, RBAC validation)                       │
│  • API Routes (legacy integrations, webhooks)               │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│              DATA ACCESS LAYER (Drizzle ORM)                │
│  • Query builder with strict typing (TypeScript)            │
│  • Transaction management                                   │
│  • Raw SQL execution untuk complex queries                  │
│  • Automatic query logging & monitoring                     │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                  POSTGRESQL DATABASE                        │
│  • Full-text search indexing (GIN trigram)                  │
│  • Composite indexes untuk filter kombinasi                 │
│  • BRIN indexes untuk timestamp ranges                      │
│  • Partitioning untuk tabel besar (future-ready)            │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 Request Flow Diagram

```
User Request (Browser/Mobile)
        ↓
   [Auth Middleware]
   - Extract JWT/Session Token
   - Validate token signature & expiry
   - Hydrate user context (id_group_user, id_kantor, id_wilayah_pembinaan)
        ↓
   [Route Handler / Server Component]
        ↓
   [RBAC Middleware Layer]
   - Check user role against endpoint permission
   - Validate if requesting data matches user scope
   - Build WHERE clause filter automatically
        ↓
   [Drizzle ORM Query]
   - WHERE clause auto-injected based on role
   - Pagination applied (offset/limit)
   - Sorting + filtering from URL params
        ↓
   [Database Query Execution]
   - Index utilized for fast lookups
   - Result count returned for pagination metadata
        ↓
   [Data Transformation Layer]
   - Map DB columns to API response schema
   - Redact sensitive fields if needed
        ↓
   [Response to Client]
   - SSR-rendered HTML (Server Components)
   - OR JSON API response (API Routes)
```

---

## 3. SINGLE SIGN-ON (SSO) & AUTHENTICATION FLOW

### 3.1 SSO Architecture

**Auth Method:** NextAuth.js v5 + OAuth2 (configurable providers)

```mermaid
graph TD
    A[User Accesses /dashboard] --> B{Auth Token Valid?}
    B -->|No Token| C[Redirect to /auth/login]
    B -->|Expired| D[Refresh Token Exchange]
    D --> E{Refresh Valid?}
    E -->|No| C
    E -->|Yes| F[Issue New Access Token]
    B -->|Valid| G[Proceed to Dashboard]
    C --> H[Display SSO Login Form]
    H --> I[User Authenticates via SSO Provider]
    I --> J[Provider Returns Authorization Code]
    J --> K[Backend: Exchange Code for Token]
    K --> L[Query ajis_user + ajis_group_user]
    L --> M{User Exists in DB?}
    M -->|No| N[Create User Record]
    M -->|Yes| O[Verify aktif='y']
    O --> P{User Active?}
    P -->|No| Q[Show Access Denied]
    P -->|Yes| R[Set Session + Cookies]
    R --> S[Redirect to Dashboard Home]
```

### 3.2 Token & Session Structure

**Access Token (JWT):**
```json
{
  "sub": "user_id_12345",
  "username": "korwil.medan@ajis.id",
  "id_group_user": 9,
  "id_kantor": 15,
  "id_wilayah_pembinaan": [42, 43],
  "email": "korwil.medan@ajis.id",
  "iat": 1689876543,
  "exp": 1689880143,
  "iss": "ajis-admin"
}
```

**Session Sync Protocol:**
1. Upon login, create session record in database (optional, for audit trail)
2. Store JWT in secure httpOnly cookie + sessionStorage for client-side context
3. On each Server Component render, middleware validates token
4. Token refresh before expiry (background, transparent to user)
5. On logout, revoke token + clear cookies + session record

### 3.3 Database Sync with User/Role Tables

**User Record Structure:**
```sql
ajis_user:
  id (BIGSERIAL PK)
  username (UNIQUE) -- matches SSO provider email
  password_hash (NULL after migrating to SSO)
  id_group_user (FK to ajis_group_user) -- role definition
  id_kantor (FK) -- for Branch Admin scope filtering
  aktif (VARCHAR(1)) -- 'y' or 'n', enforced at login
  must_reset_password (BOOLEAN) -- force password change on first login

ajis_group_user:
  id (PK)
  nama (e.g., 'Super Admin', 'Branch Admin', 'Regional Coordinator')
  keterangan
  aktif

ajis_user_wilayah_pembinaan (junction table):
  user_id (FK)
  wilayah_pembinaan_id (FK) -- for Korwil multi-region assignment
```

**On each request:**
- Decode JWT, extract `id_group_user` and `id_kantor`
- Fetch from cache or DB: user role permissions
- Build WHERE clause based on role type

---

## 4. GRANULAR RBAC & DATA SCOPE ARCHITECTURE

### 4.1 Role Definitions & Scope Matrix

| Role | ID | Scope | Data Filter | Access Permissions |
|------|----|----|---|---|
| **Super Admin** | 1 | All offices, all regions | **No WHERE filter** applied; sees all data | Full R/W to system; user management; config |
| **Branch Admin (SPMD)** | 2 | Single office + all regions under it | `WHERE id_kantor = :id_kantor` | R/W data for own office & regions; user management for office only |
| **Regional Coordinator (Korwil)** | 9 | Single/multiple regions of assignment | `WHERE id_wilayah_pembinaan IN (:wilayah_list)` | R/W sessions, hafalan, evaluations for own region only |

### 4.2 Data Scope Filtering at Database Layer

**Principle:** All queries MUST apply WHERE clause at Drizzle level, never in application logic.

#### Pattern 1: Super Admin (No Filter)
```typescript
// Super Admin: fetch all anak
const allAnak = await db.select().from(ajisAnak).limit(20).offset(0);
```

#### Pattern 2: Branch Admin (Office Scope)
```typescript
// Branch Admin with kantor_id=15: fetch anak only in that office
const officeAnak = await db
  .select()
  .from(ajisAnak)
  .where(eq(ajisAnak.kantor_id, userKantorId)) // injected from token
  .limit(20)
  .offset(0);
```

#### Pattern 3: Regional Coordinator (Wilayah Pembinaan Scope)
```typescript
// Korwil with wilayah_id=[42,43]: fetch only sessions in those regions
const myRegionSessions = await db
  .select()
  .from(ajisSession)
  .where(inArray(ajisSession.wilayah_pembinaan_id, userWilayahList))
  .limit(20)
  .offset(0);
```

### 4.3 RBAC Middleware Implementation

**Server Action / API Route Pattern:**
```typescript
// /app/actions/anak.ts
"use server";

import { requireAuth } from "@/lib/auth";
import { filterByRole } from "@/lib/rbac";

export async function getAnakList(page: number) {
  // Step 1: Validate authentication
  const session = await requireAuth();
  
  // Step 2: Build RBAC-filtered query
  const whereCondition = filterByRole(session.user);
  // Returns: undefined (Super Admin), or eq(kantor_id, X), or inArray(wilayah_id, [...])
  
  // Step 3: Execute query with filter
  const query = db
    .select()
    .from(ajisAnak)
    .limit(20)
    .offset((page - 1) * 20);
  
  if (whereCondition) {
    query.where(whereCondition);
  }
  
  return await query;
}
```

### 4.4 Preventing Data Leakage: Multi-Layer Validation

1. **Token Level:** JWT contains `id_group_user`, `id_kantor`, `id_wilayah_pembinaan`
2. **Middleware Level:** Verify token, populate request context
3. **Query Level:** WHERE clause automatically filtered
4. **Response Level:** Never return full objects; map to safe schema
5. **Audit Level:** Log all data access attempts with user ID, role, timestamp

**Example: User tries to access data outside scope**
```typescript
// User is Korwil (wilayah_id=42), but requests data for wilayah_id=999
const result = await db
  .select()
  .from(ajisSession)
  .where(
    and(
      eq(ajisSession.wilayah_pembinaan_id, 999), // requested
      inArray(ajisSession.wilayah_pembinaan_id, [42]) // allowed
    )
  ); // Result: empty set (0 rows) — no error thrown, but no data leaked
```

---

## 5. CORE FEATURES MAPPING

### 5.1 Feature Module Inventory

Based on old project (/rz_ajis-main) and schema analysis:

| Module | URL Path | User Role | Function | Data Tables |
|--------|----------|-----------|----------|-------------|
| **Dashboard** | `/dashboard` | All | System overview, quick stats | anak, hafalan, evaluasi, session |
| **Master Data: Kantor** | `/dashboard/kantor` | Super Admin | CRUD offices, hierarchy | ajis_kantor |
| **Master Data: Wilayah** | `/dashboard/wilayah` | Super Admin, Branch Admin | CRUD regions/coordinators | ajis_wilayah_pembinaan, ajis_user |
| **User Management** | `/dashboard/users` | Super Admin, Branch Admin | CRUD users, assign roles, reset password | ajis_user, ajis_group_user |
| **Anak (Child) Data** | `/dashboard/anak` | All | List, detail, edit child records | ajis_anak, ajis_wilayah_pembinaan |
| **Session Entry** | `/dashboard/sesi` | Korwil (role 9) | Create/edit coaching sessions | ajis_session |
| **Hafalan (Quran Memorization)** | `/dashboard/hafalan` | Korwil (role 9) | Record & track memorization progress | item_hafalan, hafalan_anak |
| **Evaluasi (Assessment)** | `/dashboard/evaluasi` | Korwil (role 9) | Entry evaluation scores | item_penilaian, penilaian_anak |
| **Laporan (Reports)** | `/dashboard/laporan` | All | View aggregated reports per semester | laporan_semester, laporan_semester_pembinaan |
| **Settings** | `/dashboard/settings` | Super Admin | System configuration (limits, expiry, etc.) | app_config |

### 5.2 Pages & Server Components Structure

```
app/
├── (dashboard)/                          # Main authenticated layout
│   ├── layout.tsx                        # Sidebar, header, navigation
│   ├── page.tsx                          # Dashboard home / stats
│   ├── anak/
│   │   ├── page.tsx                      # Server Component: List with pagination
│   │   ├── [id]/page.tsx                 # Detail page with nested components
│   │   └── [id]/edit/page.tsx            # Edit form (Server Action submission)
│   ├── sesi/
│   │   ├── page.tsx
│   │   ├── [id]/page.tsx
│   │   └── [id]/edit/page.tsx
│   ├── hafalan/
│   │   ├── page.tsx
│   │   └── [id]/edit/page.tsx
│   ├── evaluasi/
│   │   ├── page.tsx
│   │   └── [id]/edit/page.tsx
│   ├── kantor/                           # Super Admin only
│   │   ├── page.tsx
│   │   └── [id]/edit/page.tsx
│   ├── wilayah/
│   │   ├── page.tsx
│   │   └── [id]/edit/page.tsx
│   ├── users/
│   │   ├── page.tsx
│   │   └── [id]/edit/page.tsx
│   ├── laporan/
│   │   └── page.tsx                      # Read-only reports
│   └── settings/
│       └── page.tsx
│
├── api/                                  # API routes for integrations
│   ├── auth/
│   │   ├── login/route.ts
│   │   ├── logout/route.ts
│   │   └── refresh/route.ts
│   ├── anakjuara/                        # Legacy API namespace (if needed)
│   │   ├── anak/route.ts
│   │   ├── sesi/route.ts
│   │   └── ...
│   └── webhooks/
│       └── ...
│
├── actions/                              # Server Actions
│   ├── anak.ts
│   ├── sesi.ts
│   ├── hafalan.ts
│   ├── evaluasi.ts
│   ├── kantor.ts
│   ├── wilayah.ts
│   └── users.ts
│
└── (auth)/                               # Public auth layout
    ├── login/page.tsx
    ├── forgot-password/page.tsx
    └── layout.tsx
```

### 5.3 Server Actions (Mutations) Patterns

**Example: Create Session (Korwil Entry)**
```typescript
// app/actions/sesi.ts
"use server";

import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import { ajisSession, ajisAnak } from "@/lib/db/schema";

export async function createSession(formData: SessionFormInput) {
  // 1. Auth check
  const session = await requireAuth();
  if (session.user.id_group_user !== 9) {
    throw new Error("Only Korwil can create sessions");
  }
  
  // 2. Verify anak exists in user's wilayah
  const anak = await db
    .select()
    .from(ajisAnak)
    .where(
      and(
        eq(ajisAnak.id, formData.anak_id),
        inArray(ajisAnak.wilayah_pembinaan_id, session.user.id_wilayah_pembinaan)
      )
    )
    .limit(1);
  
  if (!anak.length) {
    throw new Error("Anak not found in your scope");
  }
  
  // 3. Insert session
  const newSession = await db.insert(ajisSession).values({
    anak_id: formData.anak_id,
    wilayah_pembinaan_id: session.user.id_wilayah_pembinaan[0],
    tanggal: formData.tanggal,
    materi: formData.materi,
    durasi_menit: formData.durasi_menit,
    catatan: formData.catatan,
    user_insert: session.user.username,
    date_insert: new Date(),
  });
  
  return { success: true, sessionId: newSession[0].id };
}
```

---

## 6. RESPONSIVE UI/UX TRANSLATION GUIDE: Stisla → shadcn/ui

### 6.1 Migration Philosophy

**From:** Stisla (Bootstrap 5 based, desktop-first, heavy component library)  
**To:** shadcn/ui (Tailwind CSS based, component composition, minimal & modern)

**Key Changes:**
- Remove Bootstrap CSS, replace with Tailwind utility classes
- Stisla pre-built components → shadcn/ui + custom composition
- Stisla sidebar → Custom responsive sidebar with mobile hamburger
- Stisla forms → React Hook Form + shadcn/ui form elements
- Stisla tables → Shadcn/ui table + custom pagination & filtering

### 6.2 Component Mapping

| Stisla Component | Purpose | shadcn/ui Replacement | Implementation Notes |
|---|---|---|---|
| `.card` (Bootstrap card) | Container for content | `<Card>` from shadcn/ui | Use `<Card>`, `<CardHeader>`, `<CardContent>`, `<CardFooter>` |
| `.navbar` (navbar-expand-lg) | Top navigation bar | Custom `<Header>` component | Build with Tailwind `fixed` + responsive burger menu |
| `.sidebar` (collapse menu) | Left navigation panel | Custom `<Sidebar>` + Sheet (mobile) | Desktop: fixed sidebar; Mobile: `<Sheet>` drawer with hamburger |
| `.btn` (all colors) | Button element | `<Button>` variant system | Use `variant="default"`, `"outline"`, `"ghost"`, `"destructive"` |
| `.form-control` | Input fields | `<Input>` from shadcn/ui | Wrap with `<FormField>` from shadcn/form |
| `.table` | Data display | `<Table>` from shadcn/ui | Custom header, body, pagination controls |
| `.badge` | Status/tag labels | `<Badge>` from shadcn/ui | Use `variant="secondary"`, `"outline"` for different statuses |
| `.alert` | Notifications | `<Alert>` from shadcn/ui | Toast notifications via Sonner library |
| `.breadcrumb` | Navigation trail | `<Breadcrumb>` from shadcn/ui | Auto-generate from route pathname |
| `.modal/.dialog` | Dialog/popup | `<Dialog>` from shadcn/ui | Use for confirmations, forms, details |
| `.pagination` | Page navigation | Custom `<Pagination>` with prev/next buttons | Manual implementation or shadcn/ui pagination components |

### 6.3 Layout Architecture: Responsive Sidebar

**Desktop (≥1024px):**
```
┌──────────────────────────────────────────┐
│         Fixed Header (60px)              │
├──────────┬──────────────────────────────┤
│          │                              │
│ Sidebar  │      Main Content            │
│ (260px)  │      (Scroll)                │
│          │                              │
│ Fixed    │                              │
└──────────┴──────────────────────────────┘
```

**Tablet (768px - 1023px):**
```
Sidebar collapses to icons only (80px)
Main content expands to fill space
```

**Mobile (< 768px):**
```
┌──────────────────────────────┐
│  ☰ Header (40px)  [Logo]    │
├──────────────────────────────┤
│                              │
│      Main Content            │
│      (Full Width)            │
│                              │
└──────────────────────────────┘

Hamburger icon opens Sheet drawer with full sidebar
```

**Implementation Code:**
```typescript
// components/layout/sidebar.tsx
import { useState } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu } from "lucide-react";

export function Sidebar() {
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const sidebarContent = (
    <nav className="space-y-2 p-4">
      <NavLink href="/dashboard" label="Dashboard" />
      <NavLink href="/dashboard/anak" label="Anak" />
      <NavLink href="/dashboard/sesi" label="Sesi" />
      {/* more links */}
    </nav>
  );

  if (isDesktop) {
    return (
      <aside className="fixed left-0 top-16 w-64 h-[calc(100vh-4rem)] bg-slate-900 text-white overflow-y-auto">
        {sidebarContent}
      </aside>
    );
  }

  return (
    <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
      <SheetTrigger asChild>
        <button className="fixed top-4 left-4">
          <Menu className="w-6 h-6" />
        </button>
      </SheetTrigger>
      <SheetContent side="left" className="w-64">
        {sidebarContent}
      </SheetContent>
    </Sheet>
  );
}
```

### 6.4 Data Table & Pagination Implementation

**shadcn/ui Table with shadcn/data-table:**
```typescript
// components/tables/anak-table.tsx
"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { AnakActions } from "./anak-actions";

interface AnakTableProps {
  data: Anak[];
  total: number;
  currentPage: number;
  onPageChange: (page: number) => void;
}

export function AnakTable({ data, total, currentPage, onPageChange }: AnakTableProps) {
  const pageSize = 20;
  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="space-y-4">
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>No</TableHead>
              <TableHead>Nama Anak</TableHead>
              <TableHead>Wilayah</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((anak, idx) => (
              <TableRow key={anak.id}>
                <TableCell>{(currentPage - 1) * pageSize + idx + 1}</TableCell>
                <TableCell>{anak.nama_anak}</TableCell>
                <TableCell>{anak.wilayah.nama_wilayah}</TableCell>
                <TableCell>
                  <Badge variant={anak.aktif === 'y' ? 'default' : 'secondary'}>
                    {anak.aktif === 'y' ? 'Aktif' : 'Nonaktif'}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <AnakActions anakId={anak.id} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-600">
          Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, total)} of {total} results
        </p>
        <div className="flex gap-2">
          <Button
            variant="outline"
            disabled={currentPage === 1}
            onClick={() => onPageChange(currentPage - 1)}
          >
            Sebelumnya
          </Button>
          <div className="flex items-center gap-1">
            {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => (
              <Button
                key={i}
                variant={currentPage === i + 1 ? 'default' : 'outline'}
                size="sm"
                onClick={() => onPageChange(i + 1)}
              >
                {i + 1}
              </Button>
            ))}
          </div>
          <Button
            variant="outline"
            disabled={currentPage === totalPages}
            onClick={() => onPageChange(currentPage + 1)}
          >
            Berikutnya
          </Button>
        </div>
      </div>
    </div>
  );
}
```

---

## 7. PERFORMANCE STRATEGY FOR BIG DATA (7.000+ Rows)

### 7.1 Server-Side Pagination (Mandatory)

**Pattern:**
```
Every listing page: max 20 rows per page
URL params: ?page=1&sort=created_at&order=desc
```

**Implementation:**
```typescript
// app/(dashboard)/anak/page.tsx
import { Suspense } from "react";

export default async function AnakPage(props: {
  searchParams: Promise<{ page?: string }>;
}) {
  const searchParams = await props.searchParams;
  const currentPage = parseInt(searchParams.page || "1");

  return (
    <Suspense fallback={<AnakTableSkeleton />}>
      <AnakList page={currentPage} />
    </Suspense>
  );
}

async function AnakList({ page }: { page: number }) {
  const pageSize = 20;
  const offset = (page - 1) * pageSize;

  // Server Component: Direct DB access with RBAC filter
  const session = await getServerSession();
  const whereClause = buildRbacFilter(session.user);

  const [anakData, totalCount] = await Promise.all([
    db
      .select()
      .from(ajisAnak)
      .where(whereClause)
      .orderBy(desc(ajisAnak.created_at))
      .limit(pageSize)
      .offset(offset),
    db
      .select({ count: sql`count(*)` })
      .from(ajisAnak)
      .where(whereClause)
      .then(r => Number(r[0].count))
  ]);

  return (
    <AnakTable
      data={anakData}
      total={totalCount}
      currentPage={page}
    />
  );
}
```

### 7.2 Database Indexing Strategy

**Critical indexes for common queries:**

| Table | Column(s) | Index Type | Purpose |
|-------|-----------|-----------|---------|
| `ajis_anak` | `id_kantor` | BTREE | Branch Admin filter |
| `ajis_anak` | `id_wilayah_pembinaan` | BTREE | Korwil filter |
| `ajis_anak` | `created_at` DESC | BTREE | Default sort order |
| `ajis_anak` | `(id_kantor, id_wilayah_pembinaan, created_at)` | Composite BTREE | Combined filter + sort |
| `ajis_anak` | `nama_anak` | GIN (trigram) | Full-text search (ILIKE '%...%') |
| `ajis_session` | `id_wilayah_pembinaan` | BTREE | Korwil session filter |
| `ajis_session` | `created_at` | BRIN | Range queries on dates |
| `hafalan_anak` | `(anak_id, created_at)` | Composite BTREE | Anak's hafalan timeline |
| `penilaian_anak` | `(anak_id, semester_id)` | Composite BTREE | Anak assessment per semester |

**Partial indexes (for active data only):**
```sql
CREATE INDEX idx_ajis_anak_aktif ON ajis_anak(id_kantor, created_at DESC)
WHERE aktif = 'y';

CREATE INDEX idx_ajis_session_aktif ON ajis_session(id_wilayah_pembinaan, created_at)
WHERE aktif = 'y';
```

### 7.3 UI Streaming with React Suspense & Skeleton Loading

**Goal:** Show skeleton immediately, stream actual data within 500ms

```typescript
// app/(dashboard)/anak/page.tsx
import { Suspense } from "react";
import { AnakTableSkeleton } from "./anak-table-skeleton";
import { AnakTable } from "./anak-table";

export default async function AnakPage() {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Data Anak</h1>
        <CreateAnakButton />
      </div>

      <Suspense fallback={<AnakTableSkeleton rowCount={20} />}>
        <AnakListContainer />
      </Suspense>
    </div>
  );
}

async function AnakListContainer() {
  const session = await getServerSession();
  const anakData = await fetchAnakData(session.user, 1);

  return <AnakTable initialData={anakData} />;
}

// Skeleton component
function AnakTableSkeleton({ rowCount = 20 }: { rowCount?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rowCount }).map((_, i) => (
        <Skeleton key={i} className="h-12 w-full" />
      ))}
    </div>
  );
}
```

### 7.4 API Route Caching & Revalidation

```typescript
// app/api/anakjuara/anak/route.ts
export const revalidate = 60; // Revalidate cache every 60 seconds
export const dynamic = "force-dynamic"; // Override for auth-dependent data

export async function GET(request: Request) {
  const session = await getServerSession();
  const url = new URL(request.url);
  const page = url.searchParams.get("page") || "1";

  // Build cache key including role for multi-tenant safety
  const cacheKey = `anak:${session.user.id}:page:${page}`;

  // Check Redis or in-memory cache
  const cached = await cache.get(cacheKey);
  if (cached) return Response.json(cached);

  // Fetch fresh data
  const data = await fetchAnakWithRbac(session.user, parseInt(page));

  // Cache for 60 seconds
  await cache.set(cacheKey, data, 60);

  return Response.json(data);
}
```

### 7.5 Network & Rendering Optimization

**Next.js Configuration:**
```typescript
// next.config.ts
export default {
  // Enable Server Components streaming
  experimental: {
    serverComponentsExternalPackages: ["pg", "mysql2"],
  },

  // Image optimization
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.example.com",
      },
    ],
  },

  // Compression
  compress: true,
};
```

**Font optimization (Tailwind + system fonts):**
```css
/* app/globals.css */
@import url("https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap");

@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  body {
    @apply font-sans antialiased;
  }
}
```

---

## 8. SECURITY & DATA PROTECTION

### 8.1 Authentication & Authorization

- **Method:** NextAuth.js v5 with OAuth2/OIDC SSO provider
- **Token:** JWT in httpOnly cookie + CSRF protection
- **Session:** Optional session table for audit trail
- **Password:** Force reset on migration; minimum 12 chars for SSO-integrated accounts

### 8.2 RBAC Implementation

- **Check on every server action / API route** before DB access
- **WHERE clause auto-injection** at Drizzle query level
- **No secrets in URL params** (use cookies for auth token)
- **Audit logging:** Log user ID, action, timestamp, affected records

### 8.3 Database Security

- **Connection pooling** via pg library with connection limit
- **Prepared statements** via Drizzle ORM (parameterized queries)
- **Row-level encryption** (optional, for sensitive fields like NIK)
- **Secrets management:** Use environment variables (`.env.local`) for DB credentials

---

## 9. DEVELOPMENT ROADMAP & MILESTONES

### Phase 1 (Week 1-2): Foundation
- [x] Database migration: MySQL → PostgreSQL
- [ ] Next.js project setup (App Router, ESLint, TypeScript)
- [ ] Drizzle ORM schema + migration scripts
- [ ] NextAuth.js + SSO provider integration
- [ ] Layout component (Header, Sidebar, responsive)
- [ ] RBAC middleware + utility functions

### Phase 2 (Week 3-4): Core Features
- [ ] Dashboard home page with stats
- [ ] Anak list page with pagination + filtering
- [ ] Anak detail & edit form
- [ ] Kantor & Wilayah master data (Super Admin only)
- [ ] User management (Super Admin, Branch Admin)

### Phase 3 (Week 5-6): Operational Features
- [ ] Session entry (Korwil)
- [ ] Hafalan tracking (Korwil)
- [ ] Evaluasi entry (Korwil)
- [ ] Report generation (all roles)

### Phase 4 (Week 7-8): Polish & Testing
- [ ] Performance optimization (caching, indexing, pagination)
- [ ] E2E testing (Playwright/Cypress for critical flows)
- [ ] Security audit
- [ ] Responsive design QA on mobile/tablet
- [ ] Documentation & deployment

---

## 10. TECHNOLOGY STACK DETAILS

### Dependencies & Versions

```json
{
  "dependencies": {
    "next": "^15.0.0",
    "react": "^19.0.0",
    "drizzle-orm": "^0.30.0",
    "drizzle-kit": "^0.30.0",
    "pg": "^8.11.0",
    "next-auth": "^5.0.0",
    "@hookform/resolvers": "^3.3.0",
    "react-hook-form": "^7.48.0",
    "tailwindcss": "^3.4.0",
    "@radix-ui/react-*": "latest",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.0.0",
    "tailwind-merge": "^2.2.0",
    "lucide-react": "^0.294.0",
    "sonner": "^1.2.0"
  },
  "devDependencies": {
    "typescript": "^5.3.0",
    "@types/node": "^20.0.0",
    "@types/react": "^18.2.0",
    "tailwindcss": "^3.4.0",
    "postcss": "^8.4.0",
    "eslint": "^8.54.0",
    "eslint-config-next": "^15.0.0"
  }
}
```

### Database Migrations with Drizzle

```bash
# Generate schema from SQL file (one-time)
drizzle-kit push:pg

# Create migrations after schema changes
drizzle-kit generate:pg

# Apply migrations
drizzle-kit migrate
```

---

## 11. DEPLOYMENT & INFRASTRUCTURE

### Environment Variables (`.env.local`)
```
DATABASE_URL="postgresql://user:password@localhost:5432/ajis"
NEXTAUTH_SECRET="<generated-secret>"
NEXTAUTH_URL="https://admin.ajis.id"
OAUTH_CLIENT_ID="<your-sso-provider-id>"
OAUTH_CLIENT_SECRET="<your-sso-provider-secret>"
```

### Deployment Targets
- **Production:** Vercel, AWS EC2, DigitalOcean
- **Database:** PostgreSQL 14+ (managed RDS preferred)
- **CDN:** Cloudflare, AWS CloudFront for assets

### Performance Targets
- **Lighthouse:** ≥90 Performance, ≥95 Accessibility
- **FCP (First Contentful Paint):** < 800ms
- **LCP (Largest Contentful Paint):** < 2.5s
- **CLS (Cumulative Layout Shift):** < 0.1
- **Time to First Byte (TTFB):** < 200ms

---

## 12. APPENDIX: FEATURE PERMISSION MATRIX

| Feature | Super Admin | Branch Admin | Korwil | Notes |
|---------|---|---|---|---|
| View Dashboard | ✓ | ✓ | ✓ | Stats scoped by role |
| Manage Kantor | ✓ | ✗ | ✗ | Super Admin only |
| Manage Wilayah | ✓ | ✓ | ✗ | BA: own office regions only |
| Manage Users | ✓ | ✓ | ✗ | BA: own office users only |
| View Anak (all) | ✓ | ✓ | ✓ | Scoped by role |
| Edit Anak | ✓ | ✓ | ✗ | Data entry only for Korwil |
| Create Session | ✗ | ✗ | ✓ | Korwil operational entry |
| Create Hafalan | ✗ | ✗ | ✓ | Korwil operational entry |
| Create Evaluasi | ✗ | ✗ | ✓ | Korwil operational entry |
| View Reports | ✓ | ✓ | ✓ | Aggregated data per role scope |
| System Settings | ✓ | ✗ | ✗ | Super Admin only |

---

**Document Approved By:** Architecture Review Board  
**Next Review Date:** Q4 2026  

---

## REFERENCES

1. PostgreSQL Schema: `ajis_postgres_schema__2_.sql`
2. Old Project: rz_ajis-main (Next.js migration source)
3. UI Template: Stisla Master (design pattern reference)
4. Auth Framework: NextAuth.js v5 Official Docs
5. Component Library: shadcn/ui Documentation
6. ORM: Drizzle ORM TypeScript Documentation

