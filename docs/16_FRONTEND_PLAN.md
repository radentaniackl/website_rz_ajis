# 16_FRONTEND_PLAN.md

## AJIS — Anak Juara Information System
### Frontend Implementation Plan

**Prepared for:** Rumah Zakat — Anak Juara Program
**Source documents:** `11_UI_PLANNING.md`, `15_API_SPECIFICATION.md`
**Technology Stack:** Next.js 15+ (App Router) · React · TypeScript · TailwindCSS · shadcn/ui · SWR · React Hook Form · Zod
**Status:** Implementation planning — no code generation
**Document Date:** July 14, 2026

---

## Table of Contents

1. Architecture Overview
2. Component Architecture
3. Pages & Route Structure
4. Data Flow & Integration Patterns
5. State Management Strategy
6. Form Validation Architecture
7. API Integration Layer
8. Error Handling & User Feedback
9. Authentication & Authorization Flow
10. Performance Optimization Strategy
11. Testing Strategy
12. Implementation Roadmap

---

## 1. Architecture Overview

### 1.1 Multi-Application Single Codebase

The AJIS frontend is organized as **three distinct applications** deployed from a single Next.js codebase using **route groups** (App Router feature):

```
(public)/          → Public Website (unauthenticated, ISR-cached)
(super-admin)/     → Super Admin Dashboard (authenticated, role-gated)
(regional)/        → Regional Dashboard (authenticated, role-gated)
```

Each route group has:
- Its own layout wrapper (header, sidebar, footer)
- Its own navigation hierarchy
- Shared component library (shadcn/ui, forms, tables, dialogs)
- Shared authentication middleware
- Shared API integration layer

### 1.2 Technology Choices Rationale

| Layer | Choice | Why |
|-------|--------|-----|
| Framework | Next.js 15+ (App Router) | Server Components reduce client JS; co-locate API routes with pages |
| Styling | Tailwind + shadcn/ui | Utility-first reduces CSS bundle; shadcn primitives are accessible by default |
| Forms | React Hook Form + Zod | Lightweight validation, type-safe form schema, uncontrolled-by-default (performance) |
| Data fetch | SWR | Built-in caching/revalidation for dashboard lists; no Redux boilerplate |
| Auth | Session-based (middleware) | Aligns with API spec §2.2; httpOnly cookie security; middleware validates on every request |
| State | Context API + hooks | Minimal overhead for auth/user context; form state isolated per form |

### 1.3 Application Modes

**Public Website:**
- No authentication
- Static generation with ISR (rebuild every 60 min or on-demand)
- Aggregate, de-identified data only (no child PII)
- CDN-cacheable, lightweight client JS

**Super Admin Dashboard:**
- Session-based auth (redirect to login if not authenticated or not Super Admin)
- Server Components as default (minimize client JS for field-user scenarios, though not applicable here)
- Row-level authorization: all data unrestricted
- Real-time data via SWR (30–60s cache TTL)

**Regional Dashboard (Branch Admin / Korwil):**
- Session-based auth
- Server Components default
- Row-level authorization: enforced per user's office/region
- Same real-time SWR pattern as Super Admin, but filtered by scope

### 1.4 Authentication Model in Frontend

The API spec (§2.2, §3.1–3.4) uses **session-based auth** with an encrypted `ajis_session` cookie (httpOnly, Secure, SameSite=Strict). Frontend responsibilities:

1. **Login page** (`/login` — not under any route group, shared) — POST credentials to `/api/v1/auth/login`
2. **Middleware** validates session on every request — if invalid, redirect to `/login`
3. **Me endpoint** (`GET /api/v1/auth/me`) called on page load to determine user role → redirect to appropriate dashboard
4. **Logout** button → `POST /api/v1/auth/logout`, clear cookie, redirect to `/`
5. **Session check** on app load — re-validate to catch session expiry / role change

---

## 2. Component Architecture

### 2.1 Component Taxonomy

Components are organized into five tiers by responsibility and reusability:

#### **Tier 1: Primitive UI Components (shadcn/ui)**

Imported directly from shadcn/ui, used as-is or minimally wrapped:

- `Button`, `Input`, `Textarea`, `Select`, `Checkbox`, `Radio`
- `Card`, `Dialog`, `Tabs`, `Accordion`, `Tooltip`
- `Table`, `Pagination`, `Badge`, `Alert`
- `Dropdown`, `Popover`, `Breadcrumb`

**Responsibility:** Present unstyled, accessible markup. No business logic.

**Usage:** Pass into higher-tier components; rarely used directly in pages except for isolated UI (e.g., a single button).

#### **Tier 2: Domain-Specific UI Components**

Built on top of Tier 1, add minor domain knowledge (e.g., color logic for status badges):

- `StatusBadge` — wraps shadcn Badge + conditional colors (e.g., "Hadir" = green, "Alfa" = red)
- `ProgramBadge` — wraps Badge + program name + color
- `WelfareBadge` — wraps Badge + welfare category + color
- `RoleBadge` — wraps Badge + role display (Super Admin, Branch Admin, Korwil)
- `AttendanceStatusSelect` — wraps shadcn Select + pre-loads attendance statuses from API
- `CascadingRegionSelect` — wraps Select + depends on office selection (child component)
- `DateRangeFilter` — wraps two date inputs + calendar picker (Tier 1) + validation

**Responsibility:** Apply business rules to primitive UI. No data fetching. Accept data as props, emit changes as callbacks.

**Usage:** Imported into forms, tables, and higher-tier components.

#### **Tier 3: Layout & Structure Components**

Responsible for page layout scaffolding (header, sidebar, main content):

- `AdminSidebar` — collapsible sidebar with role-aware navigation menu
- `AdminHeader` — top navigation bar with user menu, logout, breadcrumbs
- `PublicHeader` — marketing site header with logo, nav links
- `PublicFooter` — footer with links, copyright, social
- `DashboardLayout` — wraps Sidebar + Header + main area
- `FormSection` — reusable form section with heading, description, field grid
- `PageHeader` — title + breadcrumbs + action buttons (new, export, etc.)

**Responsibility:** Structure; pass children through. No business logic or data fetching.

**Usage:** Wrapped around page content; composed together in page layouts.

#### **Tier 4: Feature Components**

Complex, stateful components that handle a single feature or workflow:

- `ChildRegistrationForm` — renders the "new child" form, calls POST `/api/v1/children`, handles validation/errors
- `CoachingSessionForm` — renders the multi-child attendance matrix, POST to `/api/v1/sessions`, handles habits/attendance detail
- `EvaluationEditor` — renders per-item score inputs, calls PATCH `/api/v1/evaluations/:id`
- `HafalanForm` — renders hafalan checklist per child, UPDATEs assessments
- `FamilyMemberForm` — renders family member add/edit, calls POST/PATCH `/api/v1/family-members`
- `ChildrenTable` — renders the children list with filters, pagination, calls GET `/api/v1/children`
- `SessionTable` — sessions list, calls GET `/api/v1/sessions`
- `UserManagementTable` — users list (Super Admin only), calls GET `/api/v1/users`
- `SponsorshipMatrix` — donor/child pairing view with balance snapshots
- `EvaluationPivot` — cross-child evaluation scores in a pivot table view

**Responsibility:** Combine UI components + data fetching + form handling. Encapsulate a self-contained feature or domain area.

**Usage:** Imported into page components; largely independent, though may reference shared auth context for scope validation.

#### **Tier 5: Page Components**

One per route, orchestrates layout + feature components + page-level logic:

- `(regional)/children/page.tsx` — imports `ChildrenTable` + `PageHeader` in Regional Dashboard layout
- `(regional)/children/[id]/page.tsx` — imports child detail tabs (Family, Education, Hafalan, Evaluation) + child profile header
- `(super-admin)/users/page.tsx` — imports `UserManagementTable` + create user dialog
- `(public)/impact/page.tsx` — imports impact stats cards + charts, static ISR data
- etc.

**Responsibility:** Route handler; compose layout + features. Typically thin — mostly composition, minimal logic.

**Usage:** Imported automatically by Next.js router; never imported elsewhere.

---

### 2.2 Component Communication Patterns

#### **Prop-Drilling for Data & Callbacks**

Most components receive data as props and emit changes via callbacks:

```
ChildRegistrationForm (Tier 4)
├── accepts: onSuccess() callback, onError() callback
├── owns: form state (useForm), API call logic
├── renders: FormSection (Tier 3)
│   ├── renders: Input, Select, etc. (Tier 1)
│   ├── handlers: onChange → triggers validation
│   ├── emit: onSubmit → POST /api/v1/children
├── on success: calls onSuccess(), clears form
├── on error: displays error toast, calls onError()
```

**Why prop-drilling:** Explicit data flow; components remain decoupled and testable; no global reducer boilerplate.

#### **Context API for Global State**

Auth and user info are shared via React Context:

```
AuthContext (provides user, role, scope)
├── hydrated on app load via GET /api/v1/auth/me
├── consumed by: middleware (redirect logic), pages (role-gated rendering), components (scope filters)
├── updated on: login, logout, role change (reload page)
```

**Why Context:** Auth state is app-wide and rarely changes; Context is sufficient. No Redux.

#### **SWR for Data Fetching & Caching**

Lists and dashboards use SWR for real-time data with automatic revalidation:

```
ChildrenList (Tier 4, client component)
├── calls useSWR('/api/v1/children?limit=25', fetcher)
├── receives: data, isLoading, error, mutate (for refresh)
├── renders: ChildrenTable + Skeleton (loading state) or Error (error state)
├── on user add: calls mutate() to refresh cache
├── auto-revalidates: every 30s (dedupingInterval)
```

**Why SWR:** Built-in caching, focus revalidation (user returns to tab → fresh data), simple API, small bundle.

---

### 2.3 Component Interdependencies

**Form Components depend on:**
- shadcn/ui primitives (Button, Input, Select, etc.)
- Domain UI components (StatusBadge, CascadingRegionSelect, etc.)
- React Hook Form (form state) + Zod (validation schema)
- API integration layer (lib/api.ts)

**Table Components depend on:**
- shadcn/ui Table, Pagination, Badge
- Domain UI components (StatusBadge, etc.)
- SWR (data fetching)
- API integration layer

**Page Components depend on:**
- Layout components (AdminSidebar, AdminHeader, etc.)
- Feature components (ChildRegistrationForm, ChildrenTable, etc.)
- Auth context (for middleware checks)

**No circular dependencies** — strictly one-way flow.

---

## 3. Pages & Route Structure

### 3.1 Route Hierarchy Mapped to API Endpoints

Every page corresponds to one or more API endpoints. The mapping is deterministic and traceable:

#### **Public Website Routes**

| Route | Page Component | Primary API Endpoint(s) | Purpose |
|-------|---|---|---|
| `/` | `(public)/page.tsx` | `GET /api/v1/public/impact-stats` | Home + aggregate stats |
| `/program` | `(public)/program/page.tsx` | (none — static ISR content) | Program info |
| `/impact` | `(public)/impact/page.tsx` | `GET /api/v1/public/impact-stats`, `/api/v1/reports/dashboard` | Transparency reporting |
| `/regions` | `(public)/regions/page.tsx` | `GET /api/v1/regions` (read-only) | Office/region locations |
| `/news` | `(public)/news/page.tsx` | CMS or hardcoded (not in API spec) | News list |
| `/news/[slug]` | `(public)/news/[slug]/page.tsx` | CMS (not in API spec) | News detail |
| `/contact` | `(public)/contact/page.tsx` | POST inquiry (form only, not in API spec yet) | Contact form |

#### **Super Admin Routes**

| Route | Page | Primary Endpoint(s) | Feature |
|---|---|---|---|
| `/dashboard` | `(super-admin)/dashboard/page.tsx` | `GET /api/v1/reports/dashboard` (Super Admin scope) | Global KPI overview |
| `/master-data/offices` | `(super-admin)/master-data/offices/page.tsx` | `GET /api/v1/offices` | Office list |
| `/master-data/offices/:id` | `(super-admin)/master-data/offices/[id]/page.tsx` | `GET /api/v1/offices/:id`, PATCH, DELETE | Office detail/edit |
| `/master-data/regions` | `(super-admin)/master-data/regions/page.tsx` | `GET /api/v1/regions` | Region list |
| `/master-data/coordinators` | `(super-admin)/master-data/coordinators/page.tsx` | `GET /api/v1/coordinators` | Coordinator management |
| `/master-data/semesters` | `(super-admin)/master-data/semesters/page.tsx` | `GET /api/v1/reference/semesters` (not in spec, assume exists) | Semester config |
| `/users` | `(super-admin)/users/page.tsx` | `GET /api/v1/users` | User list (create/edit inline or modal) |
| `/users/:id` | `(super-admin)/users/[id]/page.tsx` | `GET /api/v1/users/:id`, PATCH | User edit |
| `/children` | `(super-admin)/children/page.tsx` | `GET /api/v1/children` (unrestricted) | Children oversight |
| `/children/:id` | `(super-admin)/children/[id]/page.tsx` | `GET /api/v1/children/:id` + sub-resources (family, education, hafalan, evaluations) | Child profile (tabs) |
| `/evaluations` | `(super-admin)/evaluations/page.tsx` | `GET /api/v1/evaluations` (all children, all offices) | Eval review/approval |
| `/evaluations/:id` | `(super-admin)/evaluations/[id]/page.tsx` | `GET /api/v1/evaluations/:id`, PATCH (approve) | Evaluation detail/approval |
| `/sponsorships` | `(super-admin)/sponsorships/page.tsx` | `GET /api/v1/donors`, `GET /api/v1/sponsorships/:id/balance-snapshots` | Donor/pairing overview |
| `/sponsorships/:id` | `(super-admin)/sponsorships/[id]/page.tsx` | `GET /api/v1/sponsorships/:id` | Pairing detail + balance |
| `/finance/overview` | `(super-admin)/finance/overview/page.tsx` | `GET /api/v1/reports/dashboard` (finance section) | Finance overview (read-only) |
| `/finance/transactions` | `(super-admin)/finance/transactions/page.tsx` | Transaction list endpoint (not in spec, assume read-only) | Transaction list |
| `/reporting/recap-pembinaan` | `(super-admin)/reporting/recap-pembinaan/page.tsx` | `GET /api/v1/reports/rekap-pembinaan` | Recap report + export |
| `/reporting/audit-log` | `(super-admin)/reporting/audit-log/page.tsx` | `GET /api/v1/reports/audit-log` | Audit log viewer |

#### **Regional Dashboard Routes**

| Route | Page | Primary Endpoint(s) | Feature |
|---|---|---|---|
| `/dashboard` | `(regional)/dashboard/page.tsx` | `GET /api/v1/reports/dashboard` (scoped to user's office/region) | Scoped KPI overview |
| `/children` | `(regional)/children/page.tsx` | `GET /api/v1/children` (scoped filter applied client-side + server-side validation) | Children list (scoped) |
| `/children/new` | `(regional)/children/new/page.tsx` | `POST /api/v1/children` | New child registration |
| `/children/:id` | `(regional)/children/[id]/page.tsx` | `GET /api/v1/children/:id` + sub-resources | Child profile (4 tabs: Data, Hafalan, Kehadiran, Penilaian) |
| `/coaching-sessions` | `(regional)/coaching-sessions/page.tsx` | `GET /api/v1/sessions` (region-scoped) | Session list |
| `/coaching-sessions/new` | `(regional)/coaching-sessions/new/page.tsx` | `POST /api/v1/sessions` (with full attendance matrix) | New session creation + multi-child attendance form |
| `/coaching-sessions/:id` | `(regional)/coaching-sessions/[id]/page.tsx` | `GET /api/v1/sessions/:id`, PATCH (edit attendance) | Session detail/edit attendance |
| `/hafalan` | `(regional)/hafalan/page.tsx` | `GET /api/v1/hafalan-items` (lookup), `GET /api/v1/children?limit=100` (list to select from) | Hafalan overview (select child) |
| `/hafalan/:childId` | `(regional)/hafalan/[childId]/page.tsx` | `GET /api/v1/children/:childId/hafalan`, PATCH per item | Child hafalan tracking |
| `/evaluations` | `(regional)/evaluations/page.tsx` | `GET /api/v1/children/:id/evaluations` (scoped) | Evaluation list |
| `/evaluations/:id` | `(regional)/evaluations/[id]/page.tsx` | `GET /api/v1/evaluations/:id`, PATCH (edit scores/notes) | Evaluation editor |
| `/evaluations/:id/approve` | (modal or inline) | `POST /api/v1/evaluations/:id/approve` | Approve evaluation |
| `/evaluations/generate-bulk` | `(regional)/evaluations/generate-bulk/page.tsx` | `POST /api/v1/evaluations/mass-generate`, `GET /api/v1/evaluations/mass-generate/:job_id` | Bulk generate evaluations |
| `/reporting/recap-pembinaan` | `(regional)/reporting/recap-pembinaan/page.tsx` | `GET /api/v1/reports/rekap-pembinaan` (region-scoped), export endpoint | Regional recap + export |

### 3.2 Shared Routes (Not Route-Group-Specific)

```
/login                    Login page (shared, no route group)
/logout                   Logout action (redirect after POST /api/v1/auth/logout)
/error                    Error boundary page
```

---

## 4. Data Flow & Integration Patterns

### 4.1 End-to-End Data Flow Example: Register New Child

**User Action:** Korwil fills out child registration form and clicks Submit

**Flow:**

1. **Page Load** (`(regional)/children/new/page.tsx`):
   - Renders `ChildRegistrationForm` (Tier 4 feature component)
   - Form initializes with React Hook Form + Zod validation schema
   - On mount, fetches pre-populated lookup data (welfare categories, regions) via SWR or direct API call

2. **Form Interaction**:
   - User types "Siti Aisyah" into full_name input
   - React Hook Form tracks input change (uncontrolled)
   - Zod validates on blur: `required, max 200 chars`
   - Error message appears if validation fails

3. **Form Submission**:
   - User clicks Submit button
   - `onSubmit` handler triggered
   - Form data collected: `{ full_name, region_id, welfare_category_id, family_members: [...] }`
   - Validation runs (Zod) — if fails, display error summary, disable submit button

4. **API Call** (via API integration layer):
   - Calls `api.children.create({ full_name, ... })`
   - API integration layer:
     - Constructs POST request to `/api/v1/children`
     - Includes session cookie (automatic, httpOnly)
     - Sets Content-Type: application/json
     - Handles `Idempotency-Key` header (optional, for retry safety)
   - Request sent with `fetch` (or similar)

5. **Response Handling**:
   - Success (201 Created):
     - Parse response body → new child object
     - Show success toast: "Child registered successfully"
     - Clear form
     - Redirect to child detail page: `/children/:id`
     - Invalidate children list cache (call SWR mutate) so next list page shows new child
   - Error (422 Validation, 403 Forbidden, 404 Not Found, etc.):
     - Parse error response → extract error code + details
     - If 422: display inline field-level errors (full_name: "required", etc.)
     - If 403: display "You don't have permission to add children to this region"
     - If 404: display "Region not found"
     - Show error toast (auto-dismiss in 5s)
     - Do not redirect; user can correct and retry

6. **Cache Invalidation**:
   - Upon success, call `mutate()` on the children list SWR hook
   - Next time children list is fetched, it will hit the API and get fresh data including the new child

---

### 4.2 Server Components vs. Client Components Strategy

**Default: Server Component** (unless interactivity requires otherwise)

#### Server Component Usage (Tier 5 Pages, Some Tier 4 Feature Components):

```typescript
// (regional)/children/page.tsx (Server Component)
export default async function ChildrenPage() {
  // Fetch data server-side (no client JS)
  const children = await fetch('/api/v1/children', {
    headers: { Cookie: req.headers.cookie } // session cookie
  })
  
  return (
    <DashboardLayout>
      <PageHeader title="Children" action={<Link href="./new">New Child</Link>} />
      <ChildrenTable data={children} />
      {/* ChildrenTable is a Client Component internally (sorting, filtering) */}
    </DashboardLayout>
  )
}
```

**Why:** Reduces client-side JS bundle; suitable for dashboard lists viewed on low-bandwidth field connections.

#### Client Component Usage (Tier 4 Feature Components with Forms or Real-Time Updates):

```typescript
// components/forms/ChildRegistrationForm.tsx (Client Component)
'use client'

export function ChildRegistrationForm({ onSuccess }) {
  const form = useForm<ChildRegistrationSchema>({ resolver: zodResolver(...) })
  const { data: welfareCategories } = useSWR('/api/v1/reference/welfare-categories', fetcher)
  
  const onSubmit = async (data) => {
    try {
      const response = await fetch('/api/v1/children', { method: 'POST', body: JSON.stringify(data) })
      // handle success/error
    } catch (err) {
      // handle network error
    }
  }
  
  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      {/* form fields */}
    </form>
  )
}
```

**Why:** Interactivity (form state, real-time validation, data fetching).

---

### 4.3 Data Flow Architecture Diagram

```
Page (Server Component)
  ├── fetches data server-side (auth context injected)
  ├── renders Layout (Server Component)
  │   ├── Header (Server Component, static)
  │   ├── Sidebar (Client Component, interactive nav)
  │   └── MainContent (Server Component)
  │       ├── PageHeader (Server Component)
  │       └── FeatureComponent (Client Component, interactive)
  │           ├── uses SWR for real-time data fetch
  │           ├── uses React Hook Form for local form state
  │           ├── calls API integration layer (api/*)
  │           ├── renders Tier 2/1 UI components
  │           └── shows Toast notifications on success/error
  │
  └── Edge case: Pre-rendered static content (ISR)
      ├── (public) pages built at build time
      ├── revalidated every 3600s
      ├── on-demand revalidation via admin trigger

API Responses
  ├── parsed by API integration layer
  ├── cached by SWR (30-60s TTL for lists, longer for master data)
  ├── errors bubbled up to UI layer
  └── retry logic handled transparently
```

---

## 5. State Management Strategy

### 5.1 State Boundaries

State is managed at the **smallest possible scope**:

| State Type | Scope | Tool | Lifetime |
|---|---|---|---|
| **Auth (user, role, scope)** | App-wide | Context API | Session lifetime (survives page reload via cookie) |
| **Form (inputs, errors)** | Single form | React Hook Form | Form lifetime (cleared on unmount or reset) |
| **List filters & pagination** | Single page/component | URL searchParams or local state | Page visit (cleared on nav away) |
| **Data cache** | Multiple components | SWR | 30–60s (auto-revalidate) or manual invalidate |
| **UI state (modal open/close, sidebar collapse)** | Single component | useState | Component lifetime |
| **Toast notifications** | App-wide | Toast library (sonner/react-toastify) | 3–5s auto-dismiss |

### 5.2 Auth Context

**Initialized on App Load:**

```typescript
// lib/auth.ts or hooks/useAuth.ts

export type AuthContext = {
  user: { system_user_id: number; username: string } | null
  role: { role_id: number; code: 'super_admin' | 'branch_admin' | 'korwil' } | null
  scope: { type: 'global' | 'office' | 'region'; office_id?: number; region_id?: number } | null
  isLoading: boolean
  isAuthenticated: boolean
}

// Middleware calls GET /api/v1/auth/me on every navigation
// Updates AuthContext with response
// If 401 → redirect to /login
// If 403 → redirect to /error (account deactivated, etc.)
```

**Usage in Components:**

```typescript
import { useAuthContext } from '@/hooks/useAuth'

export function MyComponent() {
  const { user, role, scope } = useAuthContext()
  
  // Conditional rendering based on role
  if (role.code === 'super_admin') {
    return <SuperAdminUI />
  } else if (role.code === 'branch_admin') {
    return <BranchAdminUI />
  } else {
    return <KorwilUI />
  }
}
```

### 5.3 Form State

**React Hook Form** manages form state (uncontrolled by default, performant):

```typescript
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

const ChildRegistrationSchema = z.object({
  full_name: z.string().min(1).max(200),
  region_id: z.number().int().positive(),
  welfare_category_id: z.number().int().positive().optional(),
  family_members: z.array(z.object({
    relationship: z.enum(['father', 'mother', 'guardian', 'sibling', 'other']),
    full_name: z.string().min(1).max(200)
  })).optional()
})

export function ChildRegistrationForm() {
  const form = useForm<z.infer<typeof ChildRegistrationSchema>>({
    resolver: zodResolver(ChildRegistrationSchema),
    defaultValues: { family_members: [] }
  })
  
  const onSubmit = async (data) => {
    // API call
  }
  
  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <input {...form.register('full_name')} />
      {form.formState.errors.full_name && <span>{form.formState.errors.full_name.message}</span>}
      {/* more fields */}
    </form>
  )
}
```

### 5.4 Avoiding State Management Overcomplication

**Don't Use:** Redux, Zustand, MobX for this app. They introduce boilerplate for minimal benefit.

**Do Use:**
- Context API for auth (app-wide, rarely changes)
- React Hook Form for forms (self-contained)
- SWR for data caching (replaces Redux + thunks)
- URL searchParams for filter/pagination state (shareable, browser back/forward work)

---

## 6. Form Validation Architecture

### 6.1 Validation Schema Definition

All form validation is defined using **Zod** schemas, co-located with the form component or in a shared `lib/validation.ts`:

```typescript
// lib/validation.ts (shared schemas)

export const ChildRegistrationSchema = z.object({
  full_name: z.string()
    .min(1, 'Full name is required')
    .max(200, 'Full name must be 200 characters or less')
    .describe('Child\'s full name'),
  
  region_id: z.number()
    .int('Must be a number')
    .positive('Region is required'),
  
  welfare_category_id: z.number()
    .int()
    .positive()
    .optional()
    .describe('Asnaf category: Yatim, Piatu, or Dhuafa'),
  
  family_members: z.array(
    z.object({
      relationship: z.enum(['father', 'mother', 'guardian', 'sibling', 'other'], { message: 'Invalid relationship' }),
      full_name: z.string().min(1).max(200)
    })
  ).optional().default([])
})

export type ChildRegistration = z.infer<typeof ChildRegistrationSchema>

export const CoachingSessionSchema = z.object({
  region_id: z.number().int().positive('Region is required'),
  presenter_id: z.number().int().positive('Presenter is required'),
  session_type_id: z.number().int().positive('Session type is required'),
  session_date: z.date()
    .refine(d => d <= new Date(), 'Session date cannot be in the future'),
  
  attendance: z.array(z.object({
    child_id: z.number().int().positive(),
    attendance_status_id: z.number().int().positive(),
    habits: z.array(z.object({
      habit_type: z.string(),
      status: z.enum(['completed', 'partial', 'not_completed'])
    })).optional().default([])
  })).min(1, 'At least one child must have attendance recorded')
})
```

### 6.2 Multi-Level Validation

**Level 1: Frontend (Zod Schema)**
- Runs immediately on blur/change (form.formState.errors)
- Shows inline error messages
- Prevents submission if validation fails

**Level 2: Server (API Spec Validation)**
- API endpoint validates request body (API spec §2.4, §3.x)
- Returns 422 with detailed field errors if validation fails
- Frontend displays these field-level errors in the form

**Level 3: Database (SQL Constraints)**
- CHECK constraints (e.g., `attendance_status IN ('hadir', 'izin', 'alfa')`)
- Foreign key constraints
- Unique constraints (e.g., one evaluation per child per semester)
- If these fire, API returns 409 CONFLICT → frontend displays business error

### 6.3 Async Validation

Some validation requires a server roundtrip (e.g., "username not taken"):

```typescript
const form = useForm({
  resolver: zodResolver(
    ChildRegistrationSchema.superRefine(async (data, ctx) => {
      // Optional: add server-side validation here
      // e.g., check if region_id is in user's scope (should already be enforced server-side)
    })
  )
})
```

**Simpler approach:** Let the server handle it. If username is taken, API returns 409 CONFLICT, frontend shows error banner.

---

## 7. API Integration Layer

### 7.1 API Client Architecture

All API calls go through a centralized **API integration layer** (`lib/api.ts` or similar) to:
- Centralize error handling
- Add request/response interceptors
- Handle retry logic & idempotency keys
- Manage authentication headers
- Format responses consistently

#### Example Structure:

```typescript
// lib/api.ts

type ApiResponse<T> = {
  data: T
  meta?: { [key: string]: any }
}

type ApiError = {
  error: {
    code: string
    message: string
    details?: Array<{ field: string; issue: string }>
  }
}

class ApiClient {
  private async fetch<T>(
    endpoint: string,
    options?: RequestInit & { idempotencyKey?: string }
  ): Promise<ApiResponse<T> | ApiError> {
    const headers = {
      'Content-Type': 'application/json',
      ...(options?.idempotencyKey && { 'Idempotency-Key': options.idempotencyKey })
    }
    
    const response = await fetch(`/api/v1${endpoint}`, {
      ...options,
      headers,
      credentials: 'include' // include session cookie
    })
    
    const data = await response.json()
    
    if (!response.ok) {
      // Error response
      if (response.status === 401) {
        // Session expired → redirect to /login (handled by middleware)
      }
      return data as ApiError
    }
    
    return data as ApiResponse<T>
  }
  
  // Domain-specific methods
  
  children = {
    list: (params?: { q?: string; limit?: number; cursor?: string; office_id?: number }) =>
      this.fetch<Child[]>('/children', { params }),
    
    create: (data: ChildRegistration) =>
      this.fetch<Child>('/children', { method: 'POST', body: JSON.stringify(data) }),
    
    get: (id: number) =>
      this.fetch<ChildDetail>(`/children/${id}`),
    
    update: (id: number, data: Partial<ChildRegistration>) =>
      this.fetch<Child>(`/children/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    
    delete: (id: number) =>
      this.fetch<{ active: boolean }>(`/children/${id}`, { method: 'DELETE' })
  }
  
  sessions = {
    list: (params?: { region_id?: number; limit?: number; cursor?: string }) =>
      this.fetch<Session[]>('/sessions', { params }),
    
    create: (data: CoachingSessionData, idempotencyKey?: string) =>
      this.fetch<Session>('/sessions', { 
        method: 'POST', 
        body: JSON.stringify(data),
        idempotencyKey 
      }),
    
    // ... more methods
  }
  
  reports = {
    dashboard: (scope: 'global' | 'office' | 'region', scopeId?: number) =>
      this.fetch<Dashboard>('/reports/dashboard', { params: { scope, scope_id: scopeId } }),
    
    rekap: (params?: { date_from: string; date_to: string; office_id?: number }) =>
      this.fetch<RekapPembinaan[]>('/reports/rekap-pembinaan', { params }),
    
    // ... more methods
  }
}

export const api = new ApiClient()
```

### 7.2 Error Handling

All API errors go through a unified error handler:

```typescript
// lib/api-errors.ts

export type ApiErrorCode =
  | 'VALIDATION_ERROR'
  | 'UNAUTHENTICATED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'INVALID_CREDENTIALS'
  | 'RATE_LIMITED'
  | 'USERNAME_TAKEN'
  | ... // all codes from API spec §9

export function isApiError(obj: any): obj is ApiError {
  return obj?.error?.code !== undefined
}

export function handleApiError(error: ApiError | unknown) {
  if (!isApiError(error)) {
    // Network error or unexpected
    return { message: 'Network error, please try again', code: 'NETWORK_ERROR' }
  }
  
  const { code, message, details } = error.error
  
  switch (code) {
    case 'VALIDATION_ERROR':
      // details contain field-level errors → return to form component
      return { message, code, details }
    
    case 'UNAUTHENTICATED':
      // Redirect to /login (middleware handles)
      return { message: 'Your session has expired', code }
    
    case 'FORBIDDEN':
      return { message: 'You do not have permission to perform this action', code }
    
    case 'USERNAME_TAKEN':
      return { message: 'Username is already in use', code }
    
    default:
      return { message, code }
  }
}
```

### 7.3 Request/Response Patterns

#### Form Submission with Validation Feedback:

```typescript
// In ChildRegistrationForm
const onSubmit = async (data) => {
  try {
    const response = await api.children.create(data)
    
    if (isApiError(response)) {
      const { code, details, message } = handleApiError(response)
      
      if (code === 'VALIDATION_ERROR' && details) {
        // Apply field-level errors to form
        details.forEach(({ field, issue }) => {
          form.setError(field as any, { message: issue })
        })
        // Show summary error toast
        toast.error(message)
      } else {
        // Generic error
        toast.error(message || 'Failed to create child')
      }
    } else {
      // Success
      toast.success('Child registered successfully')
      mutate() // invalidate children list cache
      router.push(`/children/${response.data.child_id}`)
    }
  } catch (err) {
    // Network error
    toast.error('Network error, please check your connection and try again')
  }
}
```

#### List Fetch with SWR:

```typescript
// In ChildrenList component
const { data: response, error, isLoading, mutate } = useSWR(
  `/api/v1/children?limit=25&region_id=${scope.region_id}`,
  fetcher,
  { revalidateOnFocus: false, dedupingInterval: 30000 }
)

if (isLoading) return <ChildrenTableSkeleton />
if (error) return <ErrorAlert message="Failed to load children" onRetry={() => mutate()} />

const children = response?.data || []

return (
  <>
    <ChildrenTable data={children} />
    <Pagination ... />
    {/* Refresh button */}
    <Button onClick={() => mutate()}>Refresh</Button>
  </>
)
```

---

## 8. Error Handling & User Feedback

### 8.1 Error Boundaries

Wrap page content in an Error Boundary to catch unhandled exceptions:

```typescript
// app/(regional)/children/layout.tsx

import { ErrorBoundary } from '@/components/ErrorBoundary'

export default function ChildrenLayout({ children }) {
  return (
    <ErrorBoundary>
      {children}
    </ErrorBoundary>
  )
}

// components/ErrorBoundary.tsx
'use client'

export class ErrorBoundary extends React.Component {
  state = { hasError: false, error: null }
  
  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }
  
  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo)
    // Log to monitoring service (Sentry, etc.)
  }
  
  render() {
    if (this.state.hasError) {
      return (
        <Alert variant="destructive">
          <AlertTitle>Something went wrong</AlertTitle>
          <AlertDescription>
            {process.env.NODE_ENV === 'development' ? this.state.error.message : 'An error occurred. Please refresh the page.'}
          </AlertDescription>
          <Button onClick={() => this.setState({ hasError: false })}>Try again</Button>
        </Alert>
      )
    }
    
    return this.props.children
  }
}
```

### 8.2 User Feedback Strategy

**Toast Notifications** (sonner or react-toastify):

| Scenario | Notification | Duration |
|---|---|---|
| Form submitted successfully | Success toast: "Changes saved" | 3s auto-dismiss |
| API error (generic) | Error toast: "Failed to save changes" | 5s auto-dismiss |
| Field validation error (inline) | Red error text below field | Persistent until corrected |
| Network timeout | Error toast: "Network error" + Retry button | Persistent |
| Permission denied (403) | Warning toast: "You don't have permission" | 5s auto-dismiss |
| Resource not found (404) | Error banner: "This item doesn't exist" | Persistent |

**Inline Errors (Forms):**

Every form field has:
- Visual error state (red border, red text)
- Inline error message (text below field)
- Triggered by Zod validation on blur + submit

**Error Summary (Forms):**

Forms with multiple errors show a summary banner at the top:

```typescript
{form.formState.errors && Object.keys(form.formState.errors).length > 0 && (
  <Alert variant="destructive">
    <AlertTitle>Please fix the errors below</AlertTitle>
    <AlertDescription>
      <ul>
        {Object.entries(form.formState.errors).map(([field, error]) => (
          <li key={field}>{field}: {error?.message}</li>
        ))}
      </ul>
    </AlertDescription>
  </Alert>
)}
```

---

## 9. Authentication & Authorization Flow

### 9.1 Authentication Flow

#### Login:

1. User navigates to `/login` (not in any route group)
2. Page renders `LoginForm` component
3. User enters username + password
4. Form submits POST to `/api/v1/auth/login`
5. Response includes `ajis_session` cookie (httpOnly, Secure, SameSite=Strict)
6. On success, determine redirect target via `GET /api/v1/auth/me`
7. Redirect to role-appropriate dashboard (`/dashboard` for Super Admin, etc.)

#### Middleware (on every navigation):

1. Extract `ajis_session` cookie
2. Call `GET /api/v1/auth/me` to validate session
3. If 401 (invalid/expired) → redirect to `/login`
4. If 403 (account inactive) → redirect to `/error`
5. If 200 → extract `role` + `scope`
6. Check if current route matches role:
   - Super Admin accessing `(super-admin)/*` → allow
   - Branch Admin accessing `(regional)/*` + office-scoped → allow
   - Public routes → always allow
   - Korwil accessing Super Admin routes → redirect to `/error`
7. Set AuthContext with user/role/scope data
8. Proceed

#### Logout:

1. User clicks "Logout" button
2. POST to `/api/v1/auth/logout`
3. Server invalidates session, clears cookie
4. Frontend redirects to `/`

### 9.2 Authorization Strategy

**Role-Based Access Control (RBAC):**

Routes are gated by role via middleware + client-side checks:

```typescript
// middleware.ts
export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  
  // Public routes (no auth required)
  if (pathname.startsWith('/(public)')) return NextResponse.next()
  if (pathname === '/login') return NextResponse.next()
  
  // Auth-required routes
  const session = request.cookies.get('ajis_session')
  if (!session) return NextResponse.redirect(new URL('/login', request.url))
  
  // Validate session
  const me = await fetch('http://localhost:3000/api/v1/auth/me', {
    headers: { Cookie: `ajis_session=${session.value}` }
  }).then(r => r.json())
  
  if (!me.data) return NextResponse.redirect(new URL('/login', request.url))
  
  // Role-based gating
  if (pathname.startsWith('/(super-admin)') && me.data.role.code !== 'super_admin') {
    return NextResponse.redirect(new URL('/error', request.url))
  }
  
  if (pathname.startsWith('/(regional)') && !['branch_admin', 'korwil'].includes(me.data.role.code)) {
    return NextResponse.redirect(new URL('/error', request.url))
  }
  
  // Set auth context (inject into request for server components)
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-user-context', JSON.stringify(me.data))
  
  return NextResponse.next({ request: { headers: requestHeaders } })
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
```

**Row-Level Access Control (RLAC):**

In addition to role checks, queries are filtered by user scope:

```typescript
// (regional)/children/page.tsx (Server Component)

import { getAuthContext } from '@/lib/auth-server'

export default async function ChildrenPage() {
  const auth = await getAuthContext() // from middleware-injected headers
  
  // Construct query with scope filter
  const params = new URLSearchParams()
  params.set('limit', '25')
  
  if (auth.role.code === 'korwil') {
    params.set('region_id', auth.scope.region_id.toString())
  } else if (auth.role.code === 'branch_admin') {
    params.set('office_id', auth.scope.office_id.toString())
  }
  // Super Admin: no filter (all children)
  
  const response = await fetch(`/api/v1/children?${params}`, {
    headers: { Cookie: `ajis_session=${auth.sessionCookie}` }
  }).then(r => r.json())
  
  return <ChildrenTable data={response.data} />
}
```

**Server-side re-validation:** The API itself also re-validates scope on every write (API spec §9.2) — frontend scope filtering is a UX optimization; server-side validation is the security boundary.

---

## 10. Performance Optimization Strategy

### 10.1 Build-Time Optimization (Public Website)

**Incremental Static Regeneration (ISR):**

```typescript
// (public)/impact/page.tsx

import { Metadata } from 'next'

export const revalidate = 3600 // ISR: regenerate every 1 hour

export async function generateStaticParams() {
  // Called at build time
  return [] // No dynamic params for this page
}

export default async function ImpactPage() {
  const stats = await fetch('http://localhost:3000/api/v1/public/impact-stats', {
    next: { revalidate: 3600 }
  }).then(r => r.json())
  
  return (
    <div>
      {/* Render stats */}
    </div>
  )
}

export const metadata: Metadata = {
  title: 'Impact & Transparency',
  description: 'See our program impact data...'
}
```

**Image Optimization:**

```typescript
import Image from 'next/image'

export function HeroSection() {
  return (
    <Image
      src="/images/hero.jpg"
      alt="Anak Juara program in action"
      width={1920}
      height={1080}
      priority // LCP optimization
      quality={75}
    />
  )
}
```

### 10.2 Runtime Optimization (Dashboards)

**Code Splitting (Dynamic Imports):**

```typescript
import dynamic from 'next/dynamic'

const HeavyChart = dynamic(() => import('@/components/HeavyChart'), {
  loading: () => <ChartSkeleton />,
  ssr: false // Don't render on server if it's client-heavy
})

export function DashboardPage() {
  return (
    <div>
      <StatCards /> {/* Lightweight, always loaded */}
      <HeavyChart /> {/* Lazy-loaded on demand */}
    </div>
  )
}
```

**SWR Configuration for Optimal Caching:**

```typescript
// List views: shorter cache, frequent revalidation
const { data: children } = useSWR('/api/v1/children', fetcher, {
  dedupingInterval: 30000, // 30s within same component tree
  focusThrottleInterval: 60000, // revalidate on focus max once per 60s
  revalidateOnFocus: true
})

// Master data (offices, regions): longer cache
const { data: offices } = useSWR('/api/v1/offices', fetcher, {
  dedupingInterval: 300000, // 5 min
  focusThrottleInterval: 600000, // 10 min
  revalidateOnFocus: false
})
```

**Pagination (Keyset-Based):**

```typescript
// Don't use offset pagination (slow at deep pages)
// Use keyset pagination (constant-time regardless of page number)

const [cursor, setCursor] = useState<string | null>(null)
const { data: response } = useSWR(`/api/v1/children?limit=25&cursor=${cursor}`, fetcher)

return (
  <>
    <ChildrenTable data={response?.data} />
    {response?.meta.has_more && (
      <Button onClick={() => setCursor(response.meta.next_cursor)}>
        Next Page
      </Button>
    )}
  </>
)
```

### 10.3 Bundle Size Targets

- **Initial page load:** < 200KB gzipped (scripts + styles)
- **Chart library:** lazy-load (recharts ~50KB gzipped)
- **Form library:** React Hook Form (8KB) + Zod (16KB) — acceptable
- **shadcn/ui:** treeshake aggressively; only import components used

---

## 11. Testing Strategy

### 11.1 Test Layers

#### Unit Tests (Business Logic)

```typescript
// lib/__tests__/format.test.ts

import { formatDate, calculateAge } from '@/lib/format'

describe('formatDate', () => {
  it('formats date in ID locale', () => {
    const date = new Date('2026-07-14')
    expect(formatDate(date)).toBe('14 Juli 2026')
  })
})

describe('calculateAge', () => {
  it('calculates age from birthdate', () => {
    const birthDate = new Date('2015-07-14')
    const today = new Date('2026-07-14')
    expect(calculateAge(birthDate, today)).toBe(11)
  })
})
```

**Tools:** Jest + ts-jest

**Coverage target:** > 80% for critical logic (scoring, date calculations, etc.)

#### Integration Tests (API Routes + Database)

```typescript
// __tests__/api/children.test.ts

import { POST } from '@/app/api/v1/children/route'
import { createTestUser, createTestDb } from '@/tests/fixtures'

describe('POST /api/v1/children', () => {
  let db, user
  
  beforeAll(async () => {
    db = await createTestDb() // use Neon branching
    user = await createTestUser(db, { role: 'korwil', region_id: 1 })
  })
  
  afterAll(async () => {
    await db.close()
  })
  
  it('creates a child and returns 201', async () => {
    const res = await POST(new Request(...), { params: { region_id: 1 } }, {
      user, db
    })
    
    expect(res.status).toBe(201)
    const json = await res.json()
    expect(json.data.child_id).toBeDefined()
  })
  
  it('returns 403 for out-of-scope region', async () => {
    const res = await POST(new Request(...), { params: { region_id: 999 } }, {
      user, db
    })
    
    expect(res.status).toBe(403)
  })
})
```

**Tools:** Jest + Supertest or node-fetch + Neon DB branching

**Coverage:** All API routes + critical business rules

#### E2E Tests (User Flows)

```typescript
// e2e/register-child.spec.ts

import { test, expect } from '@playwright/test'

test('Korwil registers a new child', async ({ page }) => {
  // Login
  await page.goto('http://localhost:3000/login')
  await page.fill('input[name="username"]', 'korwil.bandung01')
  await page.fill('input[name="password"]', 'password123')
  await page.click('button:has-text("Login")')
  
  // Navigate to children > new
  await expect(page).toHaveURL('http://localhost:3000/dashboard')
  await page.click('a:has-text("Children")')
  await page.click('button:has-text("Register Child")')
  
  // Fill form
  await page.fill('input[name="full_name"]', 'Siti Aisyah')
  await page.selectOption('select[name="welfare_category_id"]', '2')
  
  // Add family member
  await page.click('button:has-text("Add Family Member")')
  await page.selectOption('select[name="family_members.0.relationship"]', 'mother')
  await page.fill('input[name="family_members.0.full_name"]', 'Dewi Lestari')
  
  // Submit
  await page.click('button:has-text("Save")')
  
  // Verify success
  await expect(page).toHaveURL(/\/children\/\d+/)
  await expect(page.locator('text=Siti Aisyah')).toBeVisible()
})
```

**Tools:** Playwright or Cypress

**Coverage:** Critical user journeys (register child, create session, submit evaluation, etc.)

---

## 12. Implementation Roadmap

### Phase 1: Foundation (Weeks 1–2)

- [ ] Set up Next.js 15+ project with App Router
- [ ] Configure Tailwind + shadcn/ui + TypeScript
- [ ] Build auth middleware (session validation, role gating)
- [ ] Create login/logout flow
- [ ] Implement auth context + useAuth hook
- [ ] Build layout components (AdminSidebar, Header, etc.)
- [ ] Set up API integration layer (`lib/api.ts`)
- [ ] Set up error handling + toast notifications

### Phase 2: Shared Components (Weeks 2–3)

- [ ] Build Tier 1 + Tier 2 UI components (buttons, forms, badges, etc.)
- [ ] Build form infrastructure (React Hook Form + Zod schemas)
- [ ] Build table scaffolding (shadcn DataTable, filters, pagination)
- [ ] Build chart/visualization wrappers
- [ ] Build modal/dialog patterns
- [ ] Set up SWR configuration + fetcher

### Phase 3: Public Website (Week 3–4)

- [ ] Home / landing page
- [ ] Program overview page
- [ ] Impact & transparency pages (charts, aggregate stats)
- [ ] Regional presence page (map + list)
- [ ] News list + detail pages
- [ ] Contact inquiry form
- [ ] Configure ISR + build
- [ ] Test SEO (metadata, og:tags)

### Phase 4: Super Admin Dashboard (Weeks 4–6)

- [ ] Dashboard overview (KPIs, charts, recent activities)
- [ ] Office management (list, create, edit, delete)
- [ ] Region management
- [ ] Coordinator management
- [ ] User management (create, edit, delete, password reset)
- [ ] Children oversight (list, detail, edit, delete)
- [ ] Evaluation review + approval flow
- [ ] Sponsorship / donor management
- [ ] Finance overview (read-only)
- [ ] Rekap Pembinaan report + export
- [ ] Audit log viewer

### Phase 5: Regional Dashboard (Weeks 6–8)

- [ ] Dashboard overview (scoped KPIs)
- [ ] Children list (scoped) + new child registration
- [ ] Child profile (4 tabs: Data, Hafalan, Kehadiran, Penilaian)
- [ ] Family member management (add/edit/delete)
- [ ] Education history
- [ ] Coaching session list + create (multi-child attendance matrix)
- [ ] Session detail + edit attendance
- [ ] Hafalan tracking (per-child checklist)
- [ ] Evaluation generation + editing
- [ ] Evaluation approval (if role permits)
- [ ] Regional recap + export
- [ ] Bulk evaluation generation

### Phase 6: Polish & Testing (Weeks 8–9)

- [ ] Unit tests (business logic)
- [ ] Integration tests (API routes)
- [ ] E2E tests (critical user flows)
- [ ] Accessibility audit (WCAG 2.1 AA)
- [ ] Performance audit (Lighthouse, bundle size)
- [ ] Cross-browser testing (Chrome, Safari, Firefox)
- [ ] Mobile testing (iOS Safari, Android Chrome)
- [ ] Error handling + edge cases
- [ ] Documentation (component library, API integration guide)

### Phase 7: Deployment Prep (Week 9)

- [ ] Environment configuration (staging vs. production)
- [ ] CI/CD pipeline (lint, build, test on every push)
- [ ] Monitoring setup (error logging, performance monitoring)
- [ ] Security audit (Auth flow, data sanitization, CORS)
- [ ] Load testing (dashboard under 300ms API response time)
- [ ] Backup & disaster recovery plan

---

## Appendix A: Component Library Quick Reference

### Forms
- `ChildRegistrationForm` → new child registration (Tier 4)
- `CoachingSessionForm` → attendance matrix + habits (Tier 4)
- `EvaluationForm` → per-item scores + coach notes (Tier 4)
- `HafalanForm` → hafalan item checkboxes (Tier 4)
- `ContactForm` → public contact inquiry (Tier 4)
- `LoginForm` → username + password (Tier 4)

### Tables
- `ChildrenTable` → children list w/ filters (Tier 4)
- `SessionTable` → sessions list (Tier 4)
- `UserManagementTable` → users list (Super Admin) (Tier 4)
- `TransactionTable` → financial transactions (read-only) (Tier 4)
- `AuditLogTable` → audit trail (Tier 4)

### Dashboards/Cards
- `StatCard` → KPI stat box (Tier 2)
- `Chart` wrapper → chart library abstraction (Tier 3)
- `TimelineCard` → activity timeline (Tier 2)
- `ProgressRing` → circular progress (Tier 2)

### Dialogs
- `ConfirmDialog` → confirm delete/action (Tier 2)
- `ExportDialog` → export format selector (Tier 2)
- `BulkActionDialog` → mass-generate evaluations (Tier 2)

### Layout
- `AdminSidebar` → collapsible nav (Tier 3)
- `AdminHeader` → top bar w/ user menu (Tier 3)
- `PublicHeader` / `PublicFooter` → marketing site (Tier 3)
- `DashboardLayout` → combined sidebar + header + main (Tier 3)

---

**End of Frontend Implementation Plan.**
