
# AJIS Admin Panel — Stisla Design (Frontend Prototype)

## Scope & assumptions
- PRD spec is Next.js 15 + Drizzle + Postgres. This project is **TanStack Start (React 19)** — I'll build the full admin **UI/UX prototype** matching the PRD modules, RBAC scope simulation, and ERD entities, using **mock data (10 rows per table)** kept in memory. No real DB/SSO — if you want live Postgres + NextAuth + Drizzle, that requires a Next.js project (different stack) or Lovable Cloud (Supabase) with schema porting; say the word and I'll enable it.
- Design: **Stisla** admin template look — light theme, blue primary (#6777ef), sidebar with sectioned nav, card-based content, DataTables-style tables, badges, breadcrumbs, top navbar with search + user dropdown. I'll rebuild it in Tailwind + shadcn (no Bootstrap) but match the visual language precisely from the uploaded `stisla-master.zip` references.

## Modules (per PRD §5.1)
Sidebar sections:
- **Dashboard** — stat cards (Anak, Sesi, Hafalan, Evaluasi), recent activity, chart
- **Master Data** — Kantor, Wilayah Pembinaan, SDM, Jabatan SDM
- **Referensi Geografis** — Propinsi, Kabupaten, Kecamatan, Desa
- **Data Anak** — list + detail + edit
- **Aktivitas** — Sesi, Hafalan, Evaluasi, Survey
- **User Management** — Users, Group User
- **Laporan** — Laporan Semester
- **Settings**

Each list page: breadcrumb, card, search input, filter chips, paginated table (10 rows shown), row actions (view/edit/delete — non-persistent toast), "Tambah" button opening a modal form.

## RBAC simulation
- Top-right role switcher: Super Admin / Branch Admin / Korwil
- Client-side scope filter applied to mock data (matches PRD §4.1)
- Sidebar items hide/show per role

## Mock data
- 10 rows per entity in `src/lib/mock-data.ts` following ERD field names (kode_lama, kantor_id, wilayah_pembinaan_id, aktif, etc.)
- IDs cross-referenced so joins render real names

## Technical
- TanStack Start file-based routing under `src/routes/dashboard.*`
- `src/routes/index.tsx` → redirect to `/dashboard`
- `_authenticated`-style layout at `src/routes/dashboard.tsx` with Stisla sidebar + navbar + Outlet
- Design tokens in `src/styles.css` (Stisla palette: primary #6777ef, success #47c363, warning #ffa426, danger #fc544b, info #3abaf4; body bg #f4f6f9; sidebar #fff)
- Fonts: Nunito (Stisla default) via Google Fonts `<link>` in `__root.tsx`
- Icons: lucide-react
- All components use semantic tokens — no hardcoded colors in JSX

## Deliverables in this build
1. Design system (Stisla tokens, typography, sidebar/navbar shell)
2. All ~15 module list pages with mock data tables
3. Dashboard home with stat cards + recharts line chart
4. Role switcher (localStorage) with scope filtering
5. Login page (visual only, submit → /dashboard)
6. 404 + error boundaries per template rules

Out of scope for this pass: real auth, real DB writes, form validation deep-dive, detail/edit pages for every module (I'll do detail/edit for Anak + Users as reference patterns; others get list + view modal).

Confirm and I'll build.
