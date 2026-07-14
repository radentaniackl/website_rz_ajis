# 11_UI_PLANNING.md

## AJIS — Anak Juara Information System
### Complete UI Planning Document

**Prepared for:** Rumah Zakat — Anak Juara Program  
**Technology Stack:** Next.js 15+ (App Router) · Tailwind CSS · shadcn/ui · PostgreSQL  
**Design Reference:** Stisla Meridian (admin dashboards) + Custom Marketing Design (public website)  
**Status:** UI Architecture & Component Planning  
**Document Date:** July 14, 2026

---

## Table of Contents

1. [Design System Overview](#1-design-system-overview)
2. [Folder Structure & Route Organization](#2-folder-structure--route-organization)
3. [Public Website](#3-public-website)
4. [Super Admin Dashboard](#4-super-admin-dashboard)
5. [Regional Dashboard (Korwil/Branch Admin)](#5-regional-dashboard-korwilbranch-admin)
6. [Shared Components & Patterns](#6-shared-components--patterns)
7. [Navigation Patterns](#7-navigation-patterns)
8. [Responsive Behavior & Mobile-First Strategy](#8-responsive-behavior--mobile-first-strategy)
9. [Data Table & List Patterns](#9-data-table--list-patterns)
10. [Form Patterns & Validation](#10-form-patterns--validation)
11. [Dialog & Modal Patterns](#11-dialog--modal-patterns)
12. [Chart & Visualization Patterns](#12-chart--visualization-patterns)
13. [Accessibility & Performance](#13-accessibility--performance)
14. [Implementation Notes](#14-implementation-notes)

---

## 1. Design System Overview

### 1.1 Design Principles

- **Stisla Meridian Inspired:** Leverages Stisla's clean admin layout, navigation patterns, and spacing conventions for Super Admin and Regional dashboards
- **Mobile-First Field Usability:** All field-facing workflows (Regional Dashboard) must be fully functional at 375px viewport width
- **No Child PII on Public Sites:** Strict content security — no identifying details ever appear on public-facing pages
- **Accessibility First:** shadcn/ui's accessible-by-default primitives used throughout
- **Performance Optimized:** Server Components by default, SWR for dashboard lists, ISR for public content
- **Clear Separation:** Three distinct applications with separate visual hierarchies but unified component library

### 1.2 Color Palette

Based on Anak Juara brand (orange-family) mapped to Tailwind tokens:

```
Primary (Orange): #F59E0B / amber-500
Secondary (Teal): #14B8A6 / teal-500
Accent (Red): #EF4444 / red-500
Success: #10B981 / emerald-500
Warning: #F97316 / orange-600
Error: #DC2626 / red-600
Neutral: gray-50 to gray-900
Background: white (public), gray-50 (admin dashboards)
```

### 1.3 Typography

- **Headings:** Tailwind's `inter` font stack, weights 600–700 for h1–h3, 500–600 for smaller headings
- **Body:** Inter, 400 weight, 1rem (16px) base
- **Monospace (data/codes):** `font-mono` for child IDs, transaction IDs, timestamps
- **Line height:** `leading-relaxed` (1.625) for body; `leading-tight` (1.25) for headings

### 1.4 Spacing & Layout

Follows Stisla/Tailwind conventions:
- **Gutter:** 1rem (4 Tailwind units) between columns in grid layouts
- **Card padding:** `p-6` (1.5rem) standard, `p-4` (1rem) compact
- **Section spacing:** `mb-8` (2rem) between major sections, `mb-6` (1.5rem) between subsections
- **Mobile adjustment:** 0.5rem margins collapse to single gutter on mobile; section stacking replaces columns

---

## 2. Folder Structure & Route Organization

### 2.1 App Router Structure

```
app/
├── (public)/                    # Route group: Public Website
│   ├── layout.tsx              # Public website layout wrapper
│   ├── page.tsx                # Home / Landing
│   ├── program/
│   │   └── page.tsx            # Program Overview
│   ├── impact/
│   │   └── page.tsx            # Impact & Transparency Reporting
│   ├── regions/
│   │   └── page.tsx            # Regional Presence
│   ├── news/
│   │   └── page.tsx            # News & Updates
│   ├── contact/
│   │   └── page.tsx            # Donor & Contact Inquiry
│   └── api/
│       └── public/
│           └── (public API endpoints: aggregate stats, news feed)
│
├── (super-admin)/              # Route group: Super Admin Dashboard
│   ├── layout.tsx              # Super Admin wrapper (sidebar, top nav)
│   ├── page.tsx                # Super Admin Dashboard home
│   ├── dashboard/
│   │   └── page.tsx            # Dashboard overview (KPIs, charts)
│   ├── master-data/
│   │   ├── offices/
│   │   │   ├── page.tsx        # Office list
│   │   │   └── [id]/
│   │   │       ├── page.tsx    # Office detail/edit
│   │   │       └── layout.tsx
│   │   ├── regions/
│   │   │   ├── page.tsx        # Coaching regions
│   │   │   └── [id]/page.tsx
│   │   ├── coordinators/
│   │   │   ├── page.tsx        # Coordinators (SDM)
│   │   │   └── [id]/page.tsx
│   │   └── semesters/
│   │       └── page.tsx        # Semester management
│   ├── users/
│   │   ├── page.tsx            # User management
│   │   └── [id]/page.tsx       # User detail/edit
│   ├── children/
│   │   ├── page.tsx            # Children oversight (all branches)
│   │   └── [id]/page.tsx       # Child profile
│   ├── evaluations/
│   │   ├── page.tsx            # Evaluation review & approval
│   │   └── [id]/page.tsx       # Evaluation detail
│   ├── sponsorships/
│   │   ├── page.tsx            # Sponsorships overview
│   │   └── [id]/page.tsx       # Pairing detail
│   ├── finance/
│   │   ├── overview/
│   │   │   └── page.tsx        # Finance overview (read-only)
│   │   └── transactions/
│   │       └── page.tsx        # Transaction list (read-only)
│   ├── reporting/
│   │   ├── recap-pembinaan/
│   │   │   └── page.tsx        # Rekap Pembinaan report
│   │   └── audit-log/
│   │       └── page.tsx        # Audit log viewer
│   └── api/
│       └── super-admin/        # Super Admin API routes
│
├── (regional)/                 # Route group: Regional Dashboard
│   ├── layout.tsx              # Regional wrapper
│   ├── page.tsx                # Regional Dashboard home
│   ├── dashboard/
│   │   └── page.tsx            # Regional KPI dashboard
│   ├── children/
│   │   ├── page.tsx            # Children list (scoped to region)
│   │   ├── [id]/
│   │   │   ├── page.tsx        # Child detail/profile
│   │   │   ├── layout.tsx
│   │   │   └── components/
│   │   │       ├── FamilyTab.tsx
│   │   │       ├── EducationTab.tsx
│   │   │       ├── HafalanTab.tsx
│   │   │       └── EvaluationTab.tsx
│   │   └── new/
│   │       └── page.tsx        # New child registration
│   ├── coaching-sessions/
│   │   ├── page.tsx            # Sessions list
│   │   ├── [id]/
│   │   │   ├── page.tsx        # Session detail (attendance entry)
│   │   │   └── layout.tsx
│   │   └── new/
│   │       └── page.tsx        # New session creation
│   ├── hafalan/
│   │   ├── page.tsx            # Hafalan overview
│   │   └── [childId]/
│   │       └── page.tsx        # Hafalan tracking for child
│   ├── evaluations/
│   │   ├── page.tsx            # Evaluations list
│   │   ├── [id]/
│   │   │   ├── page.tsx        # Evaluation editor
│   │   │   └── layout.tsx
│   │   └── generate-bulk/
│   │       └── page.tsx        # Bulk evaluation generation
│   ├── reporting/
│   │   ├── recap-pembinaan/
│   │   │   └── page.tsx        # Regional Rekap Pembinaan
│   │   └── children-recap/
│   │       └── page.tsx        # Regional children overview
│   └── api/
│       └── regional/           # Regional API routes
│
├── api/                        # Shared API (auth, config, exports)
│   ├── auth/
│   │   ├── login/route.ts
│   │   ├── logout/route.ts
│   │   ├── session/route.ts
│   │   └── refresh/route.ts
│   └── config/
│       └── system/route.ts
│
├── components/                 # Shared components library
│   ├── layout/
│   │   ├── AdminSidebar.tsx    # Super Admin & Regional sidebar
│   │   ├── AdminHeader.tsx     # Admin header/top nav
│   │   ├── PublicHeader.tsx    # Public site header
│   │   ├── PublicFooter.tsx    # Public site footer
│   │   └── Breadcrumbs.tsx     # Breadcrumb navigation
│   ├── dashboard/
│   │   ├── StatCard.tsx        # KPI stat card
│   │   ├── Chart.tsx           # Wrapper for chart libraries
│   │   ├── TimelineCard.tsx    # Timeline view
│   │   └── ProgressRing.tsx    # Circular progress
│   ├── forms/
│   │   ├── ChildRegistrationForm.tsx
│   │   ├── CoachingSessionForm.tsx
│   │   ├── EvaluationForm.tsx
│   │   ├── HafalanForm.tsx
│   │   └── FormSection.tsx     # Reusable form section
│   ├── tables/
│   │   ├── DataTable.tsx       # Generic data table (shadcn)
│   │   ├── ChildrenTable.tsx
│   │   ├── SessionTable.tsx
│   │   ├── TransactionTable.tsx
│   │   └── TableFilters.tsx    # Filter component
│   ├── dialogs/
│   │   ├── ConfirmDialog.tsx
│   │   ├── BulkActionDialog.tsx
│   │   ├── UploadPhotoDialog.tsx
│   │   └── ExportDialog.tsx
│   ├── badges/
│   │   ├── StatusBadge.tsx     # Attendance/evaluation status
│   │   ├── ProgramBadge.tsx
│   │   ├── WelfareBadge.tsx
│   │   └── RoleBadge.tsx
│   └── ui/
│       └── [shadcn/ui primitives]
│
├── hooks/                      # Shared React hooks
│   ├── useAuth.ts
│   ├── useRole.ts
│   ├── useDataTable.ts         # Data table pagination/sort logic
│   ├── useForm.ts              # Form state management
│   └── useSWR.ts               # Data fetching wrapper
│
├── lib/                        # Utilities & helpers
│   ├── auth.ts                 # Auth logic (session validation)
│   ├── db.ts                   # Database query helpers
│   ├── format.ts               # Date, number, text formatting
│   ├── validation.ts           # Input validation schemas
│   ├── export.ts               # Export to CSV/Excel helpers
│   ├── calculate.ts            # Score calculations, age calc, etc.
│   └── constants.ts            # Domain constants (asnaf types, etc.)
│
├── types/                      # TypeScript types
│   ├── models.ts               # Database models/interfaces
│   ├── api.ts                  # API request/response shapes
│   └── ui.ts                   # UI prop types
│
├── styles/                     # Global Tailwind CSS config
│   └── globals.css             # Theme tokens, custom utility classes
│
└── middleware.ts               # Auth & routing middleware

components.json                 # shadcn/ui config
tailwind.config.ts             # Tailwind theme tokens (Anak Juara branding)
tsconfig.json
next.config.js
vercel.json
```

---

## 3. Public Website

### Purpose

A public-facing site communicating program impact, transparency reporting, and donor engagement. **Zero child PII** — no identifying details ever exposed. Serves prospective donors, families, and the general public.

### 3.1 Home / Landing Page

**Route:** `(public)/page.tsx`

**Purpose:** Program introduction, call-to-action, impact summary

**Layout:**
- Hero section: Large headline, background image (non-identifying program photo), CTA button ("Learn More" / "Donate")
- Program snapshot: 4 stat cards (# children served, # regions, # donors, total funding) — aggregate, no breakdown by child
- Featured program modules: Cards with icons/descriptions for Pembinaan, Hafalan, Penilaian, Sponsorship
- Recent news: 3 latest news items (title, excerpt, date)
- Call-to-action section: "Join as Donor" button linking to contact form
- Footer: Contact, social media, newsletter signup

**Components:**
- `HeroSection` — custom component with image + headline + CTA
- `StatCard` — for 4 aggregate stats
- `FeatureCard` — for program modules
- `NewsCard` — minimal news preview (no child detail)
- shadcn/ui Button for CTAs

**Forms:** Newsletter signup (email only)

**Charts:** None (static layout)

**Responsive Behavior:**
- Desktop (1024px+): 2-column feature grid, horizontal stat cards
- Tablet (768px–1023px): 2-column feature grid, 2-column stat card layout
- Mobile (< 768px): 1-column everything, hero text scaled down, buttons full-width

### 3.2 Program Overview

**Route:** `(public)/program/page.tsx`

**Purpose:** Detailed explanation of program structure (Anak Juara) and how it operates

**Layout:**
- Hero / header section: Program title, tagline
- Sections (vertically stacked):
  - What is Anak Juara? (text + icons)
  - Pembinaan (Coaching) — description, frequency, topics (no child names)
  - Hafalan (Memorization) — items tracked, progress model
  - Penilaian (Evaluation) — evaluation aspects, semester report structure
  - Sponsorship Model — how donor-child pairing works (aggregate flow chart, no PII)
- Call-to-action: "Become a Donor" or "Volunteer"

**Components:**
- `ProgramSection` — reusable section component with heading, description, optional icon/graphic
- `FlowDiagram` — simple SVG flowchart of sponsorship/program structure (aggregate)
- shadcn/ui Accordion for expandable sections

**Forms:** None

**Charts:** Simple SVG flowchart (non-interactive)

**Responsive Behavior:**
- Desktop: Sections side-by-side with callout boxes
- Mobile: All stacked, flowchart simplified or removed

### 3.3 Impact & Transparency Reporting

**Route:** `(public)/impact/page.tsx`

**Purpose:** Data-driven transparency—aggregate program statistics, no individual child identification

**Layout:**
- Header: "Our Impact" title, date range selector (Last Month / Last Year / All Time)
- Key metrics grid: # sessions conducted, # children participating, # hafalan items completed, # evaluations done — all aggregate
- Charts:
  - Line chart: Monthly sessions trend
  - Bar chart: Sessions by region (aggregate, no office names if preferred)
  - Pie chart: Welfare category distribution (Yatim/Piatu/Dhuafa %, no child names)
  - Progress bar: Average evaluation scores by aspect (Cerdas/Mandiri)
- Data table: Semester-level overview (semester name, # participants, # completed evaluations, avg score)

**Components:**
- `StatCard` — for key metrics with icons
- `Chart` wrapper (Recharts or Chart.js) for line/bar/pie
- `DataTable` (shadcn/ui table) for semester summary
- `DateRangeFilter` — date picker for trend filtering

**Forms:** Date range filter (month/year selection)

**Tables:**
- Semester Summary Table: Columns = Semester, # Children, # Sessions, # Evaluations, Avg Score
  - Sortable by semester, avg score
  - No drill-down to individual child (links disabled)

**Charts:**
- Monthly Sessions Trend (line chart, 12-month view)
- Sessions by Region (bar chart, aggregate)
- Welfare Category Distribution (pie chart, 3 slices)
- Evaluation Aspect Scores (horizontal bar, Cerdas vs Mandiri)

**Filters:**
- Date range: Last Month / Last Year / All Time
- Region: Optional, if displaying regional breakdown

**Buttons:**
- "Download Report (CSV)" — exports aggregated data
- "Share Impact" — social sharing
- "Learn More" (on chart hover) — context dialog

**Dialogs:**
- Chart detail dialog: Larger chart view + underlying data table when clicking a chart

**Responsive Behavior:**
- Desktop: 2×2 chart grid, table below
- Tablet: 2-column chart layout, table full-width
- Mobile: 1-column, charts stacked, table horizontal scroll, date filter as dropdown

### 3.4 Regional Presence

**Route:** `(public)/regions/page.tsx`

**Purpose:** Show geographic reach of the program—office/region locations without PII

**Layout:**
- Header: "Where We Operate" title
- Interactive map: Pinned regions/offices (no child data on pins)
- Region list (alternative to/below map):
  - Each region: name, office, # children served (aggregate only), contact info for coordinators (if public)
- Optional: Regional spotlight cards with aggregate stats per region

**Components:**
- Map library (e.g., Leaflet or Mapbox) for region/office locations
- `RegionCard` — aggregate info per region (name, address, contact)
- shadcn/ui Tabs for Map / List view toggle

**Forms:** None (read-only view)

**Charts:** Embedded map

**Responsive Behavior:**
- Desktop: Split view (map left, list right)
- Tablet: Stacked map + list
- Mobile: Map collapsed, list full-width, map toggle button

### 3.5 News & Updates

**Route:** `(public)/news/page.tsx`

**Purpose:** Blog/news feed about program updates, impact stories (no child PII), donor stories

**Layout:**
- Header: "News & Updates"
- News list: Grid or list of news cards (title, featured image, excerpt, date, "Read More" link)
- Pagination: 10 per page, prev/next buttons
- Optional: Category filter (Program Updates / Donor Stories / Events)

**Components:**
- `NewsCard` — thumbnail, title, excerpt, date, read-more link
- `NewsDetail` — individual news post (separate route `(public)/news/[slug]/page.tsx`)
- shadcn/ui Pagination for list

**Forms:** Newsletter signup (email + name) at bottom

**Tables:** None

**Filters:**
- Category: All / Program Updates / Donor Stories / Events
- Date range: optional

**Buttons:**
- "Read More" (on each card)
- "Subscribe to Newsletter" (form submit)

**Responsive Behavior:**
- Desktop: 2-column card grid
- Tablet: 2-column grid
- Mobile: 1-column stacked

### 3.6 Contact & Inquiry

**Route:** `(public)/contact/page.tsx`

**Purpose:** Donor inquiry form, volunteering inquiry, general contact

**Layout:**
- Header: "Get in Touch" / "Contact Us"
- Contact form:
  - Name (text input)
  - Email (email input)
  - Phone (optional, tel input)
  - Inquiry type (select: Become a Donor / Volunteer / Question / Other)
  - Message (textarea)
  - reCAPTCHA (if deployed)
  - Submit button
- Post-submission: success message + redirect to homepage or thank-you page
- Aside (desktop only): Contact info (office address, phone, email)

**Components:**
- `ContactForm` — form component with validation
- shadcn/ui Form, Input, Textarea, Select, Button
- reCAPTCHA widget (optional)

**Forms:**
- Contact form (see above)

**Responsive Behavior:**
- Desktop: Form left, contact info right (2-column)
- Mobile: Form full-width, contact info stacked below

---

## 4. Super Admin Dashboard

### Purpose

Head-office oversight dashboard. Central management of master data, users, cross-branch reporting, sponsorship/finance, and system configuration.

### 4.1 Dashboard Home

**Route:** `(super-admin)/page.tsx` or `(super-admin)/dashboard/page.tsx`

**Purpose:** KPI overview for Super Admin — snapshot of organization-wide program health

**Layout (Stisla-inspired):**
- Top header: "Super Admin Dashboard" + user menu (profile, logout)
- Sidebar: Navigation menu (collapsible on mobile, hamburger icon)
- Main content area:
  - Stat row: 4 cards (# Active Children, # Completed Sessions, # Pending Evaluations, # Donors)
  - Charts row: 2-column layout
    - Left: Line chart (sessions trend, last 12 months)
    - Right: Bar chart (children by welfare category)
  - Below: Recent activities table (last 10 actions, timestamp, user, action type)
  - Aside (right sidebar on desktop, collapsed on mobile): Quick links to key modules

**Components:**
- `AdminHeader` — top bar with logo, title, user menu
- `AdminSidebar` — collapsible navigation
- `StatCard` — KPI card (number + label + icon + trend indicator)
- `Chart` wrapper — line/bar chart
- `RecentActivityTable` — activity log (minimal)
- shadcn/ui Drawer (for mobile sidebar)

**Forms:** Date range filter (Last 30 days / Last 90 days / Last Year)

**Tables:**
- Recent Activity Table:
  - Columns: Timestamp, User, Action, Target (Child name / Office / etc.)
  - Sortable by timestamp
  - 10-row pagination

**Charts:**
- Sessions Trend (line chart, 12 months)
- Children by Welfare Category (bar chart)

**Filters:**
- Date range: Last 30 / 90 days, Last Year

**Buttons:**
- "View All Activities" → navigate to audit log
- "View All Children" → navigate to children oversight
- Quick action buttons in sidebar

**Responsive Behavior:**
- Desktop (1024px+): Sidebar left (240px fixed), main content fluid; 2-column chart layout
- Tablet (768px–1023px): Collapsible sidebar (hamburger toggle), 2-column charts
- Mobile (< 768px): Sidebar hidden by default (hamburger menu), 1-column layout, charts stacked, stat cards in 2×2 grid

### 4.2 Master Data Management

#### 4.2.1 Offices

**Route:** `(super-admin)/master-data/offices/page.tsx` (list) and `/[id]/page.tsx` (detail)

**Purpose:** Manage organizational branch offices, hierarchies

**List Page Layout:**
- Header: "Offices" title + "Add New Office" button
- Search/filter bar:
  - Search by name (text input)
  - Filter by active/inactive (toggle)
  - Filter by parent office (dropdown, tree picker if hierarchy is deep)
- Data table:
  - Columns: Office Name, Parent Office, # Regions, # Coordinators, Active, Actions
  - Sortable: name, # coordinators
  - Paginated: 25 per page, keyset pagination
  - Row click: Navigate to detail page
  - Actions column: Edit, View, Deactivate/Activate

**Components:**
- `DataTable` (shadcn/ui) with server-side sorting/pagination
- `TableFilters` component
- `ActionMenu` (shadcn/ui DropdownMenu) for row actions

**Forms:** Search & filter (see above)

**Buttons:**
- "Add New Office" (top right)
- Edit, View, Deactivate (row actions)

**Detail Page Layout:**
- Header: Office name + breadcrumbs
- Form:
  - Name (text input)
  - Parent Office (dropdown, optional)
  - Address (location picker or text)
  - Active toggle
  - Submit button
- Below form: Related data cards
  - # Regions assigned
  - # Coordinators
  - # Children enrolled
  - Recent activity

**Components:**
- `FormSection` wrapper
- shadcn/ui Form, Input, Select, Toggle, Button
- Location picker (custom or library)

**Responsive Behavior:**
- Desktop: Form in main area, related data cards below
- Mobile: Form stacked, cards stacked below

#### 4.2.2 Coaching Regions (Wilayah Pembinaan)

**Route:** `(super-admin)/master-data/regions/page.tsx`

**Purpose:** Define and manage coaching regions assigned to offices

**List Page Layout:**
- Header: "Coaching Regions" + "Add New Region" button
- Search/filter bar:
  - Search by region name
  - Filter by office (dropdown)
  - Filter by active status
- Data table:
  - Columns: Region Name, Office, # Children, # Sessions (this month), Active, Actions
  - Sortable: name, office, # children
  - 25 per page, keyset pagination
  - Row click: Detail page

**Components:**
- `DataTable`, `TableFilters`, `ActionMenu`
- shadcn/ui primitives

**Detail Page:**
- Form:
  - Region name (text)
  - Office (dropdown, required)
  - Description (textarea, optional)
  - Active toggle
- Related data:
  - Assigned coordinators (list with links)
  - Children in region (card summary: active count, inactive count)
  - Recent sessions (last 5)

**Responsive Behavior:**
- Desktop: Form + sidecards
- Mobile: Form stacked, sidecards below

#### 4.2.3 Coordinators (SDM Wilayah)

**Route:** `(super-admin)/master-data/coordinators/page.tsx`

**Purpose:** Manage field coordinators

**List Page Layout:**
- Header: "Coordinators" + "Add New Coordinator" button
- Search/filter bar:
  - Search by name
  - Filter by office (dropdown)
  - Filter by active status
- Data table:
  - Columns: Name, Phone, Office, Region, # Sessions Led, Active, Actions
  - Sortable: name, office, # sessions
  - 25 per page
  - Row click: Detail page

**Detail Page:**
- Form:
  - Full name (text)
  - Phone (tel)
  - Office (dropdown)
  - Region (dropdown, filtered by office)
  - Bio (textarea, optional)
  - Active toggle
  - Save button
- Account section:
  - Username (readonly display or editable)
  - Password reset button (triggers dialog)
  - Last login timestamp
- Related data:
  - # Sessions led
  - # Children evaluated
  - Recent activity

**Components:**
- Form components (shadcn/ui)
- PasswordResetDialog (custom)
- ActivitySummary card

**Responsive Behavior:**
- Desktop: Form + related data cards
- Mobile: Stacked layout

#### 4.2.4 Semesters

**Route:** `(super-admin)/master-data/semesters/page.tsx`

**Purpose:** Define academic semesters for evaluation periods

**List Page Layout:**
- Header: "Academic Semesters" + "Add New Semester" button
- Table:
  - Columns: Semester Name, Year, Term, Start Date, End Date, # Evaluations, Actions
  - Sortable: year, term, start date
- Can edit/deactivate (but evaluations under a semester should be protected from deletion of the semester)

**Detail Page:**
- Form:
  - Semester name (text, e.g., "Semester 1 2024")
  - Year (number input)
  - Term (dropdown: 1, 2)
  - Start date (date picker)
  - End date (date picker, must be > start date)
  - Active toggle
  - Save button

**Components:**
- shadcn/ui Form, Input, Select, DatePicker, Button

---

### 4.3 User & Role Management

**Route:** `(super-admin)/users/page.tsx`

**Purpose:** Create/manage system accounts for Super Admin, Branch Admin, Korwil

**List Page Layout:**
- Header: "System Users" + "Create New User" button
- Search/filter bar:
  - Search by username/name
  - Filter by role (Super Admin / Branch Admin / Korwil)
  - Filter by office (for Branch Admin/Korwil)
  - Filter by active status
- Data table:
  - Columns: Username, Full Name, Role, Office, Last Login, Active, Actions
  - Sortable: username, role, last login
  - 25 per page, keyset pagination
  - Row click: Detail page
  - Actions: Edit, Deactivate, Reset Password

**Components:**
- `DataTable` (shadcn/ui)
- `TableFilters`
- `ActionMenu`

**Detail / Edit Page:**
- Form:
  - Username (text, readonly after creation)
  - Full Name (text)
  - Email (email input)
  - Role (dropdown: Super Admin / Branch Admin / Korwil, locked after creation)
  - Office (dropdown, required for Branch Admin/Korwil)
  - Coordinator link (if role is Korwil, auto-populate from coordinators table)
  - Active toggle
  - Save button
- Account security section:
  - "Force password reset on next login" checkbox
  - "Reset password" button (sends reset email)
  - Last login timestamp

**Create New User Page:**
- Similar to edit, but includes "Generate temporary password" option (display once, then ask to change on first login)

**Components:**
- shadcn/ui Form, Input, Select, Button
- Alert for "password reset email sent"

**Responsive Behavior:**
- Desktop: Form in main area, account section below
- Mobile: Stacked

---

### 4.4 Children Oversight

**Route:** `(super-admin)/children/page.tsx`

**Purpose:** Organization-wide view of all children, cross-branch visibility

**List Page Layout:**
- Header: "All Children" + "Register New Child" button
- Search/filter bar:
  - Search by child name
  - Filter by office (dropdown, multi-select)
  - Filter by welfare category (Yatim/Piatu/Dhuafa, dropdown)
  - Filter by active/inactive
  - Filter by program (dropdown)
- Data table:
  - Columns: Child Name, Age, Office, Welfare Category, Enrollment Date, Sponsor Status, Active, Actions
  - Sortable: name, age, enrollment date
  - 25 per page, keyset pagination
  - Row click: Child profile page
  - Actions: View, Edit, Deactivate

**Components:**
- `DataTable` (shadcn/ui)
- `TableFilters` (checkboxes, dropdowns)
- `StatusBadge` for welfare category, sponsor status

**Child Profile Page:**
- Route: `(super-admin)/children/[id]/page.tsx`
- Sidebar navigation (shadcn/ui Tabs or custom): Profile / Family / Education / Hafalan / Evaluations
- Profile tab:
  - Photo (profile picture)
  - Full name, date of birth, age (auto-calculated)
  - Gender, welfare category
  - Enrollment date, program
  - Sponsorship status (Active / Pending / Inactive)
  - Edit button
- Family tab:
  - Family members list (father, mother, guardians, siblings)
  - Can add/edit/delete members
- Education tab:
  - Current school, education level
  - Historical enrollments (timeline)
  - Add new enrollment button
- Hafalan tab:
  - Hafalan items tracked
  - Status per item (Not Started / Partial / Completed)
  - Last assessed date
  - (No edit here in Super Admin view; data is view-only)
- Evaluations tab:
  - List of semester evaluations for this child
  - Table: Semester, Evaluator, Status, Last Modified, Actions
  - Can view/approve/export

**Components:**
- shadcn/ui Tabs, Card, Button
- Photo uploader (dialog or inline)
- FamilyMemberList (custom)
- EducationTimeline (custom)
- EvaluationTable (custom)

**Responsive Behavior:**
- Desktop: Tabs as horizontal list, content area full-width
- Mobile: Tabs as dropdown or vertical stacked, content stacked below

---

### 4.5 Evaluation Review & Approval

**Route:** `(super-admin)/evaluations/page.tsx`

**Purpose:** Super Admin reviews, approves, or rejects semester evaluations

**List Page Layout:**
- Header: "Evaluations" + filter bar
- Search/filter bar:
  - Search by child name
  - Filter by semester (dropdown)
  - Filter by office (dropdown)
  - Filter by status (Pending Review / Approved / Rejected / Draft, checkboxes)
- Data table:
  - Columns: Child Name, Semester, Evaluator (Coordinator), Status, Last Modified, Actions
  - Sortable: child name, semester, status, date
  - 25 per page
  - Row click: Evaluation detail page
  - Actions: View, Approve, Reject, Request Changes

**Evaluation Detail Page:**
- Route: `(super-admin)/evaluations/[id]/page.tsx`
- Header: Child name + semester
- Tabs: Overview / Scores / Notes / Approval
- Overview tab:
  - Child name, DOB, age
  - Evaluator (coordinator) name
  - Evaluation date
  - Approval status
- Scores tab:
  - Table of evaluation items + scores
  - Columns: Item, Category, Score (0-100), Feedback (if any)
  - Read-only in Super Admin (no editing)
- Notes tab:
  - Coach notes (textarea, read-only)
  - Suara Anak Juara (child's voice, read-only)
- Approval tab:
  - Approval status (Pending / Approved / Rejected)
  - Approve button (if pending)
  - Reject button with reason (dialog)
  - Request Changes button with comment (dialog)
  - Approver signature/note (if approved, show who and when)

**Components:**
- shadcn/ui Tabs, Card, Button, Textarea
- ApprovalDialog (custom, for approval/rejection/request changes)

**Dialogs:**
- RejectDialog: Reason (textarea) + Submit
- RequestChangesDialog: Comments (textarea) + Submit

**Responsive Behavior:**
- Desktop: Tabs horizontal, content full-width
- Mobile: Tabs stacked, content below

---

### 4.6 Sponsorships & Donor Management

**Route:** `(super-admin)/sponsorships/page.tsx`

**Purpose:** Manage donor-child pairings, view sponsorship status and financial linkage

**List Page Layout:**
- Header: "Child-Donor Pairings" + "New Pairing" button
- Search/filter bar:
  - Search by child name or donor name
  - Filter by program (dropdown)
  - Filter by status (Active / Pending / Ended, checkboxes)
  - Filter by office
- Data table:
  - Columns: Child Name, Donor Name, Program, Pairing Date, Status, Balance, Actions
  - Sortable: child, donor, pairing date, balance
  - 25 per page
  - Row click: Pairing detail page
  - Actions: View, Edit, End Pairing

**Pairing Detail Page:**
- Route: `(super-admin)/sponsorships/[id]/page.tsx`
- Header: Child name + Donor name
- Tabs: Pairing / Transactions / Balance / Communication
- Pairing tab:
  - Child name, photo, DOB
  - Donor name, email, phone (if available)
  - Program
  - Pairing date, end date (nullable)
  - Status (active/inactive)
  - Edit button
- Transactions tab:
  - Table of transactions related to this pairing
  - Columns: Date, Type (Donation / Disbursement / Adjustment), Amount, Description, Actions
  - Sortable: date, type, amount
  - Can add/edit transactions (but typically read-only for Super Admin)
  - Export button (CSV)
- Balance tab:
  - Balance history over semesters (chart or table)
  - Current balance
  - Semester snapshots table
- Communication tab:
  - Notes or correspondence log (optional future)

**Components:**
- shadcn/ui Tabs, Card, Button
- TransactionTable (custom)
- BalanceChart (custom, line chart showing semester-by-semester balance)

**Responsive Behavior:**
- Desktop: Tabs + content
- Mobile: Stacked

---

### 4.7 Finance Overview (Read-Only)

**Route:** `(super-admin)/finance/overview/page.tsx`

**Purpose:** Read-only financial summary for Super Admin visibility

**Layout:**
- Header: "Finance Overview"
- Stat cards:
  - Total donations received
  - Total disbursements
  - Current balance
  - # Active pairings
- Charts:
  - Donation trend (line chart, last 12 months)
  - Disbursement by program (bar chart)
  - Balance by program (pie chart)
- Data table: Top 10 donations (date, donor, pairing, amount)
- Filters: Date range (Last 30/90 days, Last Year), Program

**Components:**
- `StatCard`
- Chart wrappers (Recharts)
- `DataTable`
- `DateRangeFilter`

**Responsive Behavior:**
- Desktop: 2×2 stat grid, 2-column chart layout, table below
- Mobile: 1-column stacked layout

**Transaction List:**

**Route:** `(super-admin)/finance/transactions/page.tsx`

**Layout:**
- Header: "All Transactions"
- Filter bar:
  - Date range
  - Filter by type (Donation / Disbursement / Adjustment, checkboxes)
  - Filter by program
  - Filter by office (for linked child)
- Data table:
  - Columns: Date, Type, Pairing (Child - Donor), Program, Amount, Description, Actions
  - Sortable: date, type, amount
  - 25 per page
  - Row actions: View detail, Export

**Components:**
- `DataTable`, `TableFilters`
- `ExportDialog` (export to CSV)

---

### 4.8 Reporting & Audit Log

#### 4.8.1 Rekap Pembinaan (Coaching Recap)

**Route:** `(super-admin)/reporting/recap-pembinaan/page.tsx`

**Purpose:** Aggregate report of coaching sessions across all branches/offices

**Layout:**
- Header: "Rekap Pembinaan (Coaching Session Summary)"
- Filter bar:
  - Date range (start date / end date pickers)
  - Filter by office (dropdown, multi-select)
  - Filter by region (dropdown, filtered by office)
  - Filter by session type (Reguler / Edukasi / P3A / Parenting)
- Summary stats:
  - # Sessions held
  - # Unique children participated
  - # Total attendance records
  - Attendance rate (%)
- Data table:
  - Columns: Session Date, Office, Region, Coordinator, Session Type, # Children Attended, # Absent, # Excused, Attendance Rate, Actions
  - Sortable: date, office, session type, attendance rate
  - 25 per page
  - Row actions: View detail, View attendance roster
- Buttons:
  - "Export Report (CSV)"
  - "Export Detailed (with attendance per child)"

**Components:**
- `DateRangeFilter`, `TableFilters`, `DataTable`
- `StatCard` for summary stats
- `ExportDialog`

**Detail View (modal or new page):**
- Full session info: date, time, location, coordinator, session type
- Attendance roster: Table with child name, attendance status, habit tracking (if any)

**Responsive Behavior:**
- Desktop: Filter bar + stat cards + table
- Mobile: Stacked, table with horizontal scroll if needed

#### 4.8.2 Audit Log Viewer

**Route:** `(super-admin)/reporting/audit-log/page.tsx`

**Purpose:** View all system changes (create/update/delete) with user, timestamp, and change details

**Layout:**
- Header: "Audit Log"
- Filter bar:
  - Date range
  - Filter by user (dropdown)
  - Filter by entity type (Children / Sessions / Evaluations / Users, checkboxes)
  - Filter by action type (Create / Update / Delete, checkboxes)
  - Search by entity (child name, user, etc.)
- Data table:
  - Columns: Timestamp, User, Entity Type, Entity ID, Action, Old Value (summary), New Value (summary), Actions
  - Sortable: timestamp, user, entity type, action
  - 50 per page (audit logs can be high volume)
  - Row actions: View full detail

**Components:**
- `DateRangeFilter`, `TableFilters`, `DataTable`

**Detail View (modal):**
- Full change detail:
  - Timestamp, user, entity type, entity ID/name
  - Columns changed: old value (before) → new value (after)
  - In JSON or tabular format

**Responsive Behavior:**
- Desktop: Filter + table with horizontal scroll
- Mobile: Stacked, table with horizontal scroll

---

## 5. Regional Dashboard (Korwil/Branch Admin)

### Purpose

Day-to-day field operations. Regional Coordinators (Korwil) and Branch Admins manage children, coaching sessions, hafalan tracking, and evaluations scoped to their region/branch.

**Key Constraint:** All views must be fully functional at 375px mobile viewport — this is a **measurable requirement**, not a nice-to-have.

### 5.1 Dashboard Home

**Route:** `(regional)/page.tsx` or `(regional)/dashboard/page.tsx`

**Purpose:** KPI summary for the coordinator's region/branch

**Layout (Mobile-First):**
- Header: "Dashboard" + user profile icon
- Stat cards (2-column grid on desktop, 1-column on mobile):
  - # Active children
  - # Pending evaluations
  - # Sessions this month
  - # Completed hafalan items (this month)
- Below: Recent activities (vertical list, not a table—mobile-friendly)
  - "Session held by [coordinator] on [date]"
  - "Evaluation submitted by [coordinator] on [date]"
  - Can swipe/scroll through recent items
- Buttons:
  - "View All Children"
  - "New Coaching Session"
  - "View Evaluations"

**Components:**
- `StatCard` (compact on mobile)
- `RecentActivityCard` (vertical, not table format)
- shadcn/ui Button (full-width on mobile)

**Forms:** None

**Charts:** None (dashboard is lightweight for field usage)

**Responsive Behavior:**
- **Mobile-first design at 375px:**
  - Stat cards in 1-column stack (2-column at 500px+)
  - Activity cards as vertical list, full-width
  - Buttons full-width
  - No sidebars; everything vertically scrollable
- Desktop (1024px+): 2×2 stat grid, activity list, quick-action sidebar

### 5.2 Children Management

#### 5.2.1 Children List

**Route:** `(regional)/children/page.tsx`

**Purpose:** View and manage children in coordinator's region

**List Page Layout:**
- Header: "Children" + "Register New Child" button
- Search/filter bar (mobile-optimized):
  - Search by name (text input with icon)
  - Filter by active/inactive (toggle button, not dropdown)
  - Filter by welfare category (chips/tags for quick selection, not dropdown)
- Data table (mobile-responsive):
  - Columns (desktop): Child Name, Age, Welfare Category, Enrollment Date, Active, Actions
  - Columns (mobile): Child Name, Age, Actions (simplified)
  - 25 per page, keyset pagination
  - Row click: Child profile page
  - Actions: View, Edit, Deactivate/Activate
  - On mobile: Actions in a swipe menu or dropdown icon

**Components:**
- Search input (with focus state)
- Filter toggle buttons (not dropdowns, for mobile accessibility)
- `DataTable` with responsive column hiding (hide non-essential columns on mobile)
- `StatusBadge` for welfare category
- SwipeableRow (custom, for mobile actions) OR DropdownMenu for row actions

**Forms:** Search & filters (see above)

**Buttons:**
- "Register New Child" (top right, full-width on mobile)
- Row actions: View, Edit, Deactivate

**Responsive Behavior:**
- **375px mobile:** 1 column, search + filter chips at top, child list with name + age + actions (icon menu)
- **Desktop:** Multi-column table, traditional row actions

**Pagination:**
- Keyset-based (not offset), reduces query cost at scale
- On mobile: "Load more" button (not numbered pages)

#### 5.2.2 New Child Registration

**Route:** `(regional)/children/new/page.tsx`

**Purpose:** Register a new child into the program

**Form Layout (Mobile-First):**
- Single-column form (no multi-column layouts on mobile)
- Progress indicator: "Step 1 of 3" (if multi-step) or single step
- Sections:
  1. Personal Info
     - Full name (text input)
     - Date of birth (date picker)
     - Gender (radio buttons or segmented control)
     - Photo upload (optional, click to upload or camera icon)
  2. Address & Family
     - Address (location picker or address form: province → district → subdistrict → village + address text)
     - Welfare category (Yatim / Piatu / Dhuafa, radio buttons)
     - Father name (text input, optional)
     - Mother name (text input, optional)
     - Guardian name (text input, if applicable)
  3. Education
     - School (facility picker, searchable dropdown)
     - Education level (SD / SMP / SMA, radio buttons)
     - Grade (text input, optional)
  4. Program Enrollment
     - Program (dropdown, usually pre-filled as "Anak Juara")
     - Enrollment date (date picker, default today)
     - Save button

- Validation feedback: Inline errors under fields, not a summary
- Submit button: Full-width on mobile, normal width on desktop

**Components:**
- shadcn/ui Form, Input, Textarea, RadioGroup, Select, DatePicker, Button
- PhotoUploadDialog (custom)
- LocationPicker (custom or library) — **cascading selects** for province/district/subdistrict/village
- FacilitySearch (searchable dropdown)

**Forms:**
- Child registration form (see above)

**Responsive Behavior:**
- Mobile: Single-column form, full-width inputs, large touch targets
- Desktop: Same form, but can support multi-column if desired

**Post-Submission:**
- Success message
- Redirect to child profile page
- OR show "Register another child?" button

#### 5.2.3 Child Profile

**Route:** `(regional)/children/[id]/page.tsx`

**Purpose:** View and edit a child's full profile—personal info, family, education, hafalan, evaluations

**Layout (Mobile-First):**
- Header: Child name, photo, age, welfare category
- Horizontal scroll tabs (or vertical on mobile):
  - Profile
  - Family
  - Education
  - Hafalan
  - Evaluations
- Tab content area

**Profile Tab:**
- Photo (large, clickable to change)
- Name, DOB, age (auto-calc)
- Gender, welfare category
- Enrollment date, status (active/inactive)
- Edit button → Edit form (same as registration form, but all fields editable)

**Family Tab:**
- List of family members (father, mother, guardian, siblings)
- Each member card: name, relationship, contact (if any)
- Add member button → dialog/form to add family member
  - Fields: name, relationship, phone (optional)
- Edit/Delete buttons per member

**Components:**
- Card for each family member
- AddFamilyMemberForm (dialog)
- EditFamilyMemberForm (inline or dialog)

**Education Tab:**
- Timeline of education records:
  - Current enrollment (highlighted): school, education level, grade
  - Previous enrollments (collapsed timeline)
- Add new enrollment button → form dialog
  - School (facility picker), education level, grade, effective date

**Components:**
- EducationTimeline (custom)
- AddEducationForm (dialog)

**Hafalan Tab:**
- Table/list of hafalan items:
  - Columns: Item Name, Category, Status, Last Assessed Date, Actions
  - Status: Not Started / Partial / Completed (badges)
  - Row click or "View" button: See assessment detail (readonly)
  - Can add assessment (coordinator action): dialog with item selection + status + date
- Add assessment button → AddHafalanForm (dialog)

**Components:**
- HafalanList (custom table/list)
- AddHafalanAssessmentForm (dialog)
- StatusBadge

**Evaluations Tab:**
- Table of evaluations for this child:
  - Columns: Semester, Evaluator, Status, Last Modified, Actions
  - Status: Draft / Submitted / Approved / Rejected (badges)
  - Row click: View evaluation detail
  - Can edit (if owner) or create new

**Components:**
- EvaluationTable (custom)
- StatusBadge

**Responsive Behavior:**
- **Mobile (375px):**
  - Header photo + name stacked
  - Tabs as vertical list or dropdown selector (not horizontal)
  - Content full-width
  - All buttons full-width or icon-based
- **Desktop:**
  - Tabs horizontal
  - Sidecards for related info
  - Normal button sizing

**Dialogs:**
- EditProfileForm
- AddFamilyMemberForm
- AddEducationForm
- AddHafalanAssessmentForm

---

### 5.3 Coaching Sessions

#### 5.3.1 Sessions List

**Route:** `(regional)/coaching-sessions/page.tsx`

**Purpose:** View coaching sessions held by the coordinator

**List Page Layout:**
- Header: "Coaching Sessions" + "New Session" button
- Filter bar (mobile-optimized):
  - Search by date range (start/end date pickers)
  - Filter by session type (chips: Reguler / Edukasi / etc.)
  - Sort by date (newest first)
- List of session cards (not a table—more mobile-friendly):
  - Card per session: date, session type, # children attended, coordinator name
  - Click card → session detail
  - Swipe or menu for actions: View, Edit (if draft), View Attendance

**Components:**
- SessionCard (custom, vertical card layout)
- DateRangeFilter
- SessionTypeFilter (chips, not dropdown)
- ActionMenu (row actions)

**Forms:** Filter & search (see above)

**Buttons:**
- "New Session" (top right, full-width on mobile)
- Card actions: View, Edit, View Attendance

**Responsive Behavior:**
- Mobile: Card layout (full-width per card), vertical stacking
- Desktop: Can switch to table view if preferred, but card view still works

#### 5.3.2 New Coaching Session

**Route:** `(regional)/coaching-sessions/new/page.tsx`

**Purpose:** Create a new coaching session and record attendance

**Form Layout (Multi-Step):**
- Step 1: Session Info
  - Date (date picker)
  - Session type (dropdown or radio buttons)
  - Location (region picker, pre-filled as coordinator's region)
  - Description (textarea, optional)
  - Next button → Step 2
- Step 2: Attendance & Mandiri Tracking
  - List of children in the region (checkboxes or toggles to select attendees)
  - For each selected child:
    - Attendance status (Hadir / Izin / Alfa, radio buttons or dropdown)
    - Mandiri habit checkboxes (Prayer, Recitation, Charity, etc.)
  - Finish/Save button

**Components:**
- `FormSection` for multi-step
- shadcn/ui Form, Input, Select, Checkbox, RadioGroup, Button
- ChildrenListWithCheckboxes (custom)
- MandiriHabitCheckboxes (custom)

**Responsive Behavior:**
- Mobile: Single-column, full-width inputs, step indicator at top
- Desktop: Same form layout

**Post-Submission:**
- Success message
- Redirect to session detail
- OR show "Create another session?" button

#### 5.3.3 Session Detail

**Route:** `(regional)/coaching-sessions/[id]/page.tsx`

**Purpose:** View session info and attendance roster

**Layout:**
- Header: Session date, type, location, coordinator
- Tabs: Overview / Attendance Roster / Mandiri Tracking
- Overview tab:
  - Session date, type, location, description
  - Coordinator name
  - Edit button (if draft or owned by coordinator)
- Attendance Roster tab:
  - Table: Child Name, Attendance Status, Mandiri Habits
  - Can edit status/habits inline (if not locked/submitted)
  - Sortable by name or status
- Mandiri Tracking tab:
  - Summary: # children with prayer, # with recitation, etc.
  - Can edit individual child mandiri tracking inline

**Components:**
- SessionDetailCard (header info)
- AttendanceRosterTable (editable inline)
- MandiriSummary (counts per habit type)

**Responsive Behavior:**
- Mobile: Stacked tabs, table with horizontal scroll if needed
- Desktop: Tabs + content

---

### 5.4 Hafalan Tracking

#### 5.4.1 Hafalan Overview

**Route:** `(regional)/hafalan/page.tsx`

**Purpose:** Regional/branch-level hafalan progress summary

**Layout:**
- Header: "Hafalan Progress" + filter bar
- Filter:
  - Filter by child (dropdown, searchable)
  - Filter by item category (Qur'an Surah / Prayer / Du'a, chips)
  - Sort by item or completion rate
- Summary stats:
  - # Total items tracked
  - # Completed items (%)
  - # Partial items (%)
  - # Not started (%)
- Items table:
  - Columns: Item Name, Category, # Completed, # Partial, # Not Started, Actions
  - Sortable: name, completion rate
  - Row click or "View" button: See children breakdown for this item

**Components:**
- StatCard for summary
- ItemsTable (custom)
- Filter chips

**Buttons:**
- "View Details" per item → shows child-level breakdown

**Responsive Behavior:**
- Mobile: Table with horizontal scroll, summary cards stacked
- Desktop: 2-column layout (summary cards left, table right)

#### 5.4.2 Child Hafalan Tracking

**Route:** `(regional)/hafalan/[childId]/page.tsx`

**Purpose:** Track hafalan progress for a specific child

**Layout:**
- Header: Child name, age
- List of hafalan items (cards or rows):
  - Item name, category
  - Status: Not Started / Partial / Completed (badge)
  - Last assessed date
  - Assessment progress bar (if partial)
  - Action button: Add/Edit Assessment
- Add item button (if new items available)

**Components:**
- HafalanItemCard (custom, status badge)
- AssessmentDialog (form to add/edit assessment)
- ProgressBar (for partial status)

**Dialogs:**
- AddAssessmentDialog:
  - Item (dropdown, pre-selected if linked from specific item)
  - Status (radio: Not Started / Partial / Completed)
  - Notes (textarea, optional)
  - Date assessed (date picker)
  - Submit button

**Responsive Behavior:**
- Mobile: Full-width items, buttons stacked
- Desktop: Grid or list layout

---

### 5.5 Evaluations

#### 5.5.1 Evaluations List

**Route:** `(regional)/evaluations/page.tsx`

**Purpose:** View and manage semester evaluations for region's children

**List Page Layout:**
- Header: "Evaluations" + "New Evaluation" button
- Filter bar:
  - Filter by semester (dropdown)
  - Filter by status (Draft / Submitted / Approved / Rejected, chips/checkboxes)
  - Search by child name
- List of evaluation cards (or table):
  - Child name, semester, status, last modified date
  - Row click → Evaluation detail
  - Actions: View, Edit (if draft), Submit, Approve (if approver), Delete Draft

**Components:**
- EvaluationCard or EvaluationTable (custom)
- Filter chips/checkboxes
- ActionMenu

**Forms:** Filter & search

**Buttons:**
- "New Evaluation"
- Card actions

**Responsive Behavior:**
- Mobile: Card layout, full-width
- Desktop: Table or card grid

#### 5.5.2 Evaluation Editor

**Route:** `(regional)/evaluations/[id]/page.tsx` or as a form dialog

**Purpose:** Create/edit a semester evaluation for a child

**Form Layout (Multi-Section):**
- Header: Child name, semester
- Section 1: Evaluation Items & Scores
  - Table of evaluation items (Akhlak, Prestasi Akademik, Mandiri, etc.)
  - Each row: Item name, category, score input (0-100), feedback (textarea)
  - Score input with validation (0-100 range)
  - Real-time score display (numeric)
- Section 2: Coach Notes
  - Textarea for coach observations/notes
- Section 3: Suara Anak Juara (Child's Voice)
  - Textarea for child's own reflection/feedback
- Buttons:
  - Save as Draft
  - Submit for Approval (transitions to submitted state)
  - Cancel

**Components:**
- shadcn/ui Form, Input, Textarea, Button
- EvaluationScoreTable (custom, with numeric inputs)
- SubmitDialog (confirmation before submit)

**Forms:**
- Evaluation form (see above)

**Responsive Behavior:**
- Mobile: Single-column form, full-width inputs
- Desktop: Same form, can support multi-column if desired

**Validation:**
- Score must be 0-100
- At least one item must be scored
- Inline validation messages

**Post-Submission:**
- If draft: success message, stay on page or redirect
- If submit: success message, redirect to evaluation list with "Pending Approval" status

#### 5.5.3 Bulk Evaluation Generation

**Route:** `(regional)/evaluations/generate-bulk/page.tsx`

**Purpose:** Generate evaluations for multiple children at once (semi-automatic, based on session/hafalan data)

**Form Layout:**
- Section 1: Parameters
  - Semester (dropdown)
  - Scope: All children / Select specific children (multi-select)
  - Auto-populate from data (toggle): If enabled, system calculates scores from session/hafalan data; if disabled, all scores start at 0
- Section 2: Preview & Confirmation
  - Table: Children to be evaluated, with preview of auto-calculated scores (if enabled)
  - Confirmation: "Generate X evaluations?"
- Buttons:
  - Generate (creates draft evaluations)
  - Cancel

**Components:**
- SemesterSelect
- ChildrenMultiSelect (dropdown or searchable list)
- PreviewTable (shows children + preview scores)
- ConfirmDialog

**Forms:**
- Bulk generation form (see above)

**Responsive Behavior:**
- Mobile: Single-column, preview table with horizontal scroll
- Desktop: Form + preview table side-by-side or stacked

**Post-Generation:**
- Success message: "Generated X evaluations as draft"
- Redirect to evaluations list (filtered to this semester, status=draft)

---

### 5.6 Regional Reporting

#### 5.6.1 Rekap Pembinaan (Regional)

**Route:** `(regional)/reporting/recap-pembinaan/page.tsx`

**Purpose:** Coaching session recap report for the coordinator's region

**Layout:**
- Header: "Coaching Session Summary"
- Filter bar:
  - Date range (start/end date pickers)
  - Session type (chips: Reguler, Edukasi, etc.)
- Summary stats:
  - # Sessions held (this period)
  - # Total attendance records
  - Average attendance rate (%)
  - # Unique children participated
- List of sessions (or table):
  - Date, session type, # attended, # absent, # excused, attendance rate
  - Sortable: date, attendance rate
  - Row click: See full attendance roster (separate view)
- Button: "Export Report (CSV)"

**Components:**
- DateRangeFilter, SessionTypeFilter (chips)
- StatCard
- SessionList or SessionTable
- ExportButton

**Responsive Behavior:**
- Mobile: Stats stacked, list with horizontal scroll if needed
- Desktop: Stats in row, full table

#### 5.6.2 Children Recap

**Route:** `(regional)/reporting/children-recap/page.tsx`

**Purpose:** Overview of all children in the region—enrollment, activity, status

**Layout:**
- Header: "Children Overview"
- Stats row:
  - # Active children
  - # Inactive children
  - # Newly enrolled (this semester)
  - Average age
- Children table:
  - Columns: Name, Age, Enrollment Date, Status, Last Session Date, # Evaluations
  - Sortable: name, enrollment date, last session date
  - 25 per page
  - Row actions: View profile, Contact info (if applicable)
- Filter bar:
  - Filter by active/inactive
  - Sort by column
- Button: "Export List (CSV)"

**Components:**
- StatCard
- DataTable with server-side pagination/sort
- ExportButton

**Responsive Behavior:**
- Mobile: Stats stacked, table with horizontal scroll
- Desktop: Stats in row, full table

---

## 6. Shared Components & Patterns

### 6.1 Layout Components

#### AdminSidebar
- Collapsible navigation sidebar (Stisla-inspired)
- Logo at top
- Menu items (links to modules):
  - Dashboard
  - Master Data
  - Users / Children
  - Coaching Sessions
  - Evaluations
  - Reporting
  - Settings (admin only)
- User profile / logout at bottom
- Mobile: Hamburger toggle, overlay drawer

**Technology:**
- `shadcn/ui` Sidebar or custom using flexbox
- Animated toggle for collapse/expand

#### AdminHeader
- Top navigation bar
- Logo/branding left
- Page title center
- User profile menu (avatar + dropdown) right
- Responsive: Logo hidden on mobile (hamburger menu instead)

**Technology:**
- shadcn/ui DropdownMenu for user menu
- Flex layout

#### PublicHeader
- Clean public website header
- Logo left
- Navigation links center (Home, Program, Impact, Regions, News, Contact)
- "Donate" CTA button right
- Mobile: Hamburger menu for navigation

#### PublicFooter
- Contact info, social links, newsletter signup
- Copyright notice
- Links to key pages

#### Breadcrumbs
- Shows navigation path (e.g., "Dashboard > Children > Child Name")
- Links are clickable (back navigation)
- Mobile: Truncated, show only last 2 levels

**Technology:**
- shadcn/ui Breadcrumb component or custom

### 6.2 Form Components

#### FormSection
- Wrapper for logical form groups
- Heading + description (optional)
- Form fields contained within
- Visual grouping (border, background color, or spacing)

**Technology:**
- Custom component wrapping shadcn/ui Form group

#### CustomInput
- Text, email, tel, number, date, time inputs
- Label + hint text (optional)
- Error message display
- Focus states, accessible

**Technology:**
- shadcn/ui Input with label

#### CustomSelect / Dropdown
- Searchable dropdown for lists (children, regions, etc.)
- Label, placeholder
- Error message
- Large touch target for mobile

**Technology:**
- shadcn/ui Select or `cmdk` library for searchable dropdowns

#### DatePicker
- Click to open calendar
- Show selected date
- Support date range (start/end)
- Mobile: Native date input (type="date") on mobile, custom picker on desktop

**Technology:**
- `react-day-picker` + `shadcn/ui Popover` or native input

#### LocationPicker
- Cascading selects: Province → District → Subdistrict → Village
- Address text input below
- Search by name at each level

**Technology:**
- Custom component with dependent dropdowns

#### PhotoUpload
- Click to upload or drag-drop
- Display preview
- Crop/resize option (optional)
- Remove button

**Technology:**
- Custom component with `<input type="file">`, preview canvas, form submission

### 6.3 Table Components

#### DataTable
- Generic table component using shadcn/ui Table primitive
- Supports:
  - Sortable columns (click column header)
  - Pagination (keyset-based, not offset)
  - Row selection (checkboxes, optional)
  - Responsive column hiding (hide columns on mobile)
- Loading state: Skeleton rows
- Empty state: Message + illustration

**Technology:**
- shadcn/ui Table + custom hooks for sort/pagination
- SWR for data fetching

#### ChildrenTable
- Rows: Child Name, Age, Welfare Category, Last Activity, Status
- Specialized `DataTable`

#### SessionTable
- Rows: Date, Session Type, Region, Coordinator, # Attended, Attendance Rate
- Sortable, paginated

#### TransactionTable
- Rows: Date, Type, Pairing, Amount, Description
- Sortable, paginated

#### TableFilters
- Reusable filter UI (search box, dropdowns, checkboxes, chips)
- Integrates with `DataTable`

**Technology:**
- shadcn/ui Input, Select, Checkbox
- Custom filter state hook

### 6.4 Card Components

#### StatCard
- Icon + label + numeric value + optional trend indicator (↑/↓%)
- Used on dashboards
- Click-through (optional, to drill-down)

**Technology:**
- Custom component, flexbox layout

#### InfoCard
- Title, content, optional image
- Used for grouping related info (e.g., child profile summary)

#### ActivityCard
- Timestamp, actor, action, entity
- Used in activity feeds

### 6.5 Badge & Status Components

#### StatusBadge
- Displays status as colored badge (Hadir/Izin/Alfa, Draft/Submitted/Approved, etc.)
- Color-coded by status (green=good, orange=warning, red=error)

**Technology:**
- shadcn/ui Badge with custom variants

#### ProgramBadge
- Displays program name (Anak Juara, etc.)

#### WelfareBadge
- Displays welfare category (Yatim/Piatu/Dhuafa)

#### RoleBadge
- Displays user role (Super Admin/Branch Admin/Korwil)

### 6.6 Dialog & Modal Components

#### ConfirmDialog
- Title + message + Cancel / Confirm buttons
- Used before destructive actions (delete, deactivate)

**Technology:**
- shadcn/ui AlertDialog

#### EditDialog / FormDialog
- Form inside a modal
- Title + form fields + Cancel / Save buttons
- Close button (X) at top right

**Technology:**
- shadcn/ui Dialog + Form

#### ExportDialog
- Format selection (CSV / Excel / PDF — if supported)
- Date range (optional)
- Submit button

---

## 7. Navigation Patterns

### 7.1 Super Admin Navigation

**Route groups:** `(super-admin)` route prefix

**Sidebar menu structure:**
```
Dashboard
Master Data
  ├── Offices
  ├── Regions
  ├── Coordinators
  └── Semesters
Users & Access
  ├── System Users
  └── Roles (view-only)
Children
Evaluations
Sponsorships
Finance
  ├── Overview
  └── Transactions
Reporting
  ├── Rekap Pembinaan
  └── Audit Log
Settings (optional)
```

**Breadcrumb example:** Dashboard > Master Data > Offices > [Office Name]

**Mobile:** Hamburger menu, same structure as sidebar (vertical stack)

### 7.2 Regional Dashboard Navigation

**Route groups:** `(regional)` route prefix

**Sidebar menu structure:**
```
Dashboard
Children
Coaching Sessions
Hafalan
Evaluations
Reporting
  ├── Recap Pembinaan
  └── Children Recap
```

**Mobile-first:** Hamburger menu, can collapse to icons-only on narrow screens

### 7.3 Public Website Navigation

**Top navigation:** Home | Program | Impact | Regions | News | Contact | [Donate Button]

**Mobile:** Hamburger menu (vertical stack)

### 7.4 Authentication & Session

**Login page** `(auth)/login/page.tsx`:
- Form: Username + Password + reCAPTCHA + Login button
- "Forgot password?" link → password reset flow

**Session handling:**
- After login, redirect to dashboard home for the user's role
- Session stored in httpOnly cookie + optional server-side session store
- Logout clears session

---

## 8. Responsive Behavior & Mobile-First Strategy

### 8.1 Breakpoints (Tailwind CSS)

```
sm:  640px  (phones, larger)
md:  768px  (tablets)
lg:  1024px (desktops)
xl:  1280px (large desktops)
2xl: 1536px (extra large)
```

### 8.2 Mobile-First Viewport: 375px

**Key Constraint:** All Regional Dashboard workflows must be fully usable at 375px.

**Design patterns:**
- Single-column layout (cards/sections stack vertically)
- Full-width buttons (100% of container)
- Large touch targets: 44px minimum height
- Simplified tables: Hide non-essential columns, use card layout or horizontal scroll
- Modals/dialogs: Full-screen on mobile, centered box on desktop
- Navigation: Hamburger menu (drawer) on mobile, sidebar on desktop
- Filtering: Chips/toggles preferred over dropdowns (better for touch)

### 8.3 Responsive Components

**DataTable:**
```css
/* Desktop: Full table */
table { display: table; }

/* Tablet: Collapse some columns */
@media (max-width: 768px) {
  th:nth-child(n+4) { display: none; }  /* Hide low-priority columns */
}

/* Mobile: Card layout or horizontal scroll */
@media (max-width: 640px) {
  table { display: block; overflow-x: auto; }
}
```

**Forms:**
```css
/* Desktop: Multi-column */
.form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }

/* Mobile: Single column */
@media (max-width: 768px) {
  .form-grid { grid-template-columns: 1fr; }
}
```

**Charts:**
- Desktop: Full-width chart
- Mobile: Reduced height, simplified legend, simplified labels

**Navigation:**
- Desktop: Sidebar visible, top header with user menu
- Mobile: Hamburger menu (drawer), top header simplified

### 8.4 Touch-Friendly Design

- Minimum button size: 44px (height) × 44px (width)
- Spacing between interactive elements: 8px minimum
- Avoid hover-only interactions (use tap/click instead)
- Swipe gestures (optional, for advanced interactions like swiping row actions)

---

## 9. Data Table & List Patterns

### 9.1 Pagination Strategy

**Use keyset-based (seek) pagination, not offset pagination:**

- **Offset (❌ avoid):** `OFFSET 1000 LIMIT 25` scans 1025 rows, slow at scale
- **Keyset (✅ use):** `WHERE id > :lastId ORDER BY id LIMIT 25` scans only 25 rows

**Implementation:**
- Include "last ID" in pagination state
- Buttons: "← Previous" / "Next →" instead of numbered pages
- On mobile: "Load more" button (rather than explicit pagination)

### 9.2 Sorting

- Click column header to sort
- Arrow indicator (↑ / ↓) shows sort direction
- Can only sort by one column at a time (simplicity for mobile)
- Sortable columns: name, date, status, amount, count

### 9.3 Search & Filter

**Search:**
- Text input with debouncing (300–500ms delay before API call)
- Placeholder: "Search by name…"
- Clear button (X) inside input

**Filters:**
- Dropdowns for single-select (office, role, etc.)
- Checkboxes for multi-select (status, category, etc.)
- Chips/tags for quick selection (session type, welfare category)
- Date pickers for date range
- Toggle for binary filters (active/inactive)

**Mobile optimization:**
- Filters as collapsible panel (tap to expand)
- Chips instead of dropdowns where possible
- "Clear all filters" button

### 9.4 Empty State

- Icon + heading + description + CTA button
- Example: "No children registered yet. [Register New Child]"

---

## 10. Form Patterns & Validation

### 10.1 Input Validation

**Real-time validation:**
- On blur (not on every keystroke, to avoid noise)
- Show error message below field
- Error text color: red (error-500)
- Border highlights error (red outline)

**Validation rules:**
- Required fields: Marked with * (red asterisk)
- Email: RFC 5322 format check
- Phone: Numeric, 10–12 digits
- Date: Not in future (unless future dates allowed)
- Number: Range check (e.g., score 0-100)
- Text: Length constraints (min/max)

**Submit validation:**
- Validate all fields on form submit
- If any errors, show summary at top of form + highlight fields
- Don't submit if validation fails

**Technology:**
- Zod or Yup for schema-based validation
- React Hook Form for form state management

### 10.2 Form Sections

Use `FormSection` component to group related fields:
```
FormSection(title="Personal Info")
  - Name
  - Date of Birth
  - Gender
FormSection(title="Address")
  - Province / District / etc.
  - Address text
```

### 10.3 Multi-Step Forms

- Visible step indicator at top: "Step 1 of 3"
- Only validate current step on "Next"
- Previous button to go back (no data loss)
- Finish button on last step

---

## 11. Dialog & Modal Patterns

### 11.1 Dialog Sizing

**Desktop:**
- Default: 600px wide
- Narrow: 400px (confirmation dialogs)
- Wide: 900px (complex forms)

**Mobile:**
- Full screen (100vh height, full width)
- Padding: 1rem top/bottom (avoid iOS keyboard overlap)

### 11.2 Dialog Interactions

- Close button (X) at top right
- Close on backdrop click (except for destructive actions)
- Keyboard escape to close (unless critical action)
- Focus trap (tab stays within dialog)

**Technology:**
- shadcn/ui Dialog component

### 11.3 Common Dialogs

**Confirm Delete:**
- Title: "Delete [entity]?"
- Message: "This action cannot be undone."
- Buttons: Cancel / Delete (red)

**Form Dialog:**
- Title + form fields + Cancel / Save buttons

**View Detail (read-only):**
- Title + content + Close button
- No save/cancel

**Export:**
- Format selection (CSV / Excel)
- Date range (optional)
- Filename input (optional, pre-filled)
- Buttons: Cancel / Export

---

## 12. Chart & Visualization Patterns

### 12.1 Chart Library

**Use:** Recharts (React-based, works well with Next.js Server Components)

**Supported chart types:**
- Line chart (trends, time-series)
- Bar chart (comparisons, categories)
- Pie/Donut chart (proportions)
- Area chart (cumulative trends)
- Progress bar (single metrics)

### 12.2 Chart Responsiveness

- Desktop: Full width, standard height
- Tablet: Reduce height, scale labels
- Mobile: Smaller height, simplified legend, rotate labels if needed

```jsx
<ResponsiveContainer width="100%" height={isMobile ? 300 : 400}>
  <LineChart data={data}>
    {/* Chart config */}
  </LineChart>
</ResponsiveContainer>
```

### 12.3 Chart Interactivity

- Hover tooltip (show exact values)
- Click drill-down (optional, e.g., click a bar to see detail)
- Legend is clickable (toggle series visibility)

### 12.4 Color Scheme

- Use theme colors (primary orange, secondary teal, success green, error red)
- Accessible color contrasts (WCAG AA minimum)
- Avoid red+green for colorblind accessibility

---

## 13. Accessibility & Performance

### 13.1 Accessibility (WCAG 2.1 Level AA)

- **Semantic HTML:** Use `<button>`, `<input>`, `<select>` properly (not divs)
- **ARIA labels:** `aria-label` for icon-only buttons, `aria-describedby` for help text
- **Focus management:** Visible focus state (outline or highlight), focus trap in modals
- **Color contrast:** All text ≥ 4.5:1 for normal text, ≥ 3:1 for large text
- **Keyboard navigation:** Tab through all interactive elements, no keyboard traps
- **Form labels:** Every input has associated `<label>` or `aria-label`
- **Alt text:** All images have descriptive alt text (except decorative)
- **Skip links:** "Skip to content" link at top of page (optional, but recommended)

**Technology:**
- shadcn/ui components are accessible by default (leverage them)
- Avoid custom unstyled markup where shadcn primitives exist
- Test with screen readers (NVDA, JAWS, VoiceOver)

### 13.2 Performance Targets (from PRD)

| Metric | Target |
|--------|--------|
| API response time (list endpoints, p95) | < 300ms |
| Public Website FCP | < 1.5s on 4G |
| Mobile form interaction latency | < 150ms perceived |

**Implementation:**
- **Server Components by default:** Minimize client-side JavaScript
- **Data caching:** SWR for dashboard lists (avoid redundant refetches)
- **Static generation:** ISR for public website (rebuild periodically)
- **Image optimization:** Next.js Image component with lazy loading
- **Code splitting:** Route-based code splitting (Next.js automatic)
- **Database queries:** Use indexes, keyset pagination (avoid deep OFFSET)

### 13.3 Bundle Size Optimization

- Avoid heavyweight dependencies (check bundle size before adding)
- Use dynamic imports for large components (`next/dynamic`)
- Tree-shake unused code (TypeScript + ESM helps)
- Monitor bundle size in CI

---

## 14. Implementation Notes

### 14.1 Component Library Architecture

**File structure:**
```
components/
├── ui/
│   └── [shadcn/ui components: button, card, input, etc.]
├── layout/
│   ├── AdminSidebar.tsx
│   ├── AdminHeader.tsx
│   └── ...
├── dashboard/
│   ├── StatCard.tsx
│   ├── Chart.tsx
│   └── ...
├── forms/
│   ├── ChildRegistrationForm.tsx
│   └── ...
├── tables/
│   ├── DataTable.tsx
│   └── ...
├── dialogs/
│   ├── ConfirmDialog.tsx
│   └── ...
└── badges/
    └── StatusBadge.tsx
```

**Component composition pattern:**
- Prefer composition (passing children) over prop-based customization
- Use `cn()` (from `clsx` or `tailwind-merge`) for conditional classNames
- Prop types: Use TypeScript for all props (no `any`)
- Default variants: Use shadcn/ui's `cva` (Class Variance Authority) for consistent styling

### 14.2 Theming Strategy

**Tailwind config:**
```javascript
// tailwind.config.ts
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#fffbf0',
          500: '#F59E0B',  // Anak Juara orange
          600: '#D97706',
          700: '#B45309',
        },
        secondary: {
          500: '#14B8A6',  // Teal accent
        },
        // ... other color tokens
      },
      fontFamily: {
        sans: ['Inter', ...defaultFontFamily.sans],
        mono: ['Menlo', 'Monaco', ...],
      },
    },
  },
}
```

**CSS variable approach (for dynamic theming):**
```css
:root {
  --color-primary: #F59E0B;
  --color-secondary: #14B8A6;
  --color-success: #10B981;
}
```

### 14.3 State Management

- **For forms:** React Hook Form + Zod (lightweight, performant)
- **For global auth/user:** Next.js middleware + context API (minimal overhead)
- **For data fetching:** SWR (built-in caching, revalidation)
- **Avoid:** Redux, MobX (overkill for this app's complexity)

### 14.4 Data Fetching Strategy

**Public Website:**
- Static generation with ISR for public pages (rebuilds every 1 hour or on-demand)
- Fetch functions at build time
- Revalidate: 3600 seconds (1 hour)

**Admin Dashboards:**
- Server Components + API routes
- SWR for real-time data (coordinators list, session data, child data)
- Cache policy: 30–60 second TTL for list views, longer for master data (offices, regions)

**Example (SWR usage):**
```javascript
// In a Client Component
import useSWR from 'swr'

export function ChildrenList() {
  const { data, isLoading, error } = useSWR(
    '/api/regional/children?limit=25',
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 30000 }
  )
  // ...
}
```

### 14.5 Error Handling & User Feedback

**API errors:**
- Display toast notification (brief message, auto-dismiss in 5s)
- Log full error to console (dev environment)
- Don't expose internal error details to user

**Form errors:**
- Inline field-level validation messages
- Summary error banner at top of form
- Submit button disabled if validation fails (optional UX)

**Network errors:**
- "Network error, please try again" message
- Retry button
- Fallback to cached data (if available)

**Technology:**
- `sonner` or `react-toastify` for toast notifications
- Custom ErrorBoundary component for unhandled errors

### 14.6 Testing Strategy

**Unit tests (business logic):**
- Score calculation functions
- Age calculation
- Date validation
- Data formatting

**Integration tests (API routes):**
- Test against disposable database branch (Neon branching)
- Auth flow (login, logout, session validation)
- CRUD operations (create/read/update/delete child, session, etc.)

**E2E tests (critical user flows):**
- Register child (end-to-end)
- Create coaching session + attendance
- Submit evaluation

**Tools:**
- Jest + React Testing Library (unit/integration)
- Playwright or Cypress (E2E)

---

## 15. Future Enhancements (Post-Phase 1)

Not in scope for Phase 1, but UI prepared for future extension:

1. **Parent/Guardian Portal:** Read-only view of child's progress
2. **Push Notifications:** Mobile alerts for missing/overdue evaluations
3. **PDF Export:** Print-friendly semester reports
4. **Advanced Permissions:** Feature-level (read/write/delete) per role
5. **Donor Portal:** Tracked sponsorship/child progress
6. **Photo Documentation (Dokumentasi):** Upload/gallery module
7. **Achievements (Prestasi):** Track child's milestones

---

## Summary

This UI Planning document provides a complete blueprint for building three distinct applications (Public Website, Super Admin Dashboard, Regional Dashboard) sharing one codebase and design system. All pages, forms, tables, charts, dialogs, and navigation patterns are specified with mobile-first design, responsive behavior, and field-usability as core requirements. Use shadcn/ui and Tailwind CSS for implementation, server components as the default, and follow accessibility (WCAG 2.1 AA) and performance targets (< 300ms API, < 1.5s FCP) throughout.

---

**End of 11_UI_PLANNING.md**
