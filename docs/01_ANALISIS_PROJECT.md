# RZ-AJIS — Comprehensive Project Analysis
**Prepared for:** RZ-AJIS Rebuild Planning
**Analysis basis:** Full source code (`rz_ajis-main`), legacy MySQL schema/data dump (`refs/newajis.sql`), legacy mobile-app UI screenshots (`website-anakjuara-tampilankorwil.zip`, 76 images), and a legacy SPMD web-portal text extraction (`website-anakjuara-korwil2.txt`)

---

## 0. Scope & Sources Note

Two systems are represented in the uploaded material, and this analysis treats them as one continuous system with an "as-is" (legacy) layer and a "rebuild-in-progress" (current) layer:

| Source | What it represents |
|---|---|
| `rz_ajis-main` (Next.js source code, incl. `refs/prd.md`, `refs/trd.md`, `refs/AnakJuara.jsx`, `refs/newajis.sql`) | The **in-progress rebuild**: a Next.js 16 App Router application already partially implemented against the real legacy MySQL schema. This is the primary subject of the analysis. |
| `website-anakjuara-tampilankorwil.zip` (76 phone screenshots) | The **legacy production mobile web app** used today by Korwil (regional coordinators) — Bahasa Indonesia UI, orange (#BF4E02-family) branding. |
| `website-anakjuara-korwil2.txt` | A raw text scrape of a **legacy desktop/admin web portal** page ("Rekap Pembinaan" report) plus its full sidebar navigation menu — reveals that AJIS is one module inside a much larger Rumah Zakat operations system (donation/disbursement, user management, CAJ/PM workflows, etc.). |

Where the rebuild's own planning documents (PRD/TRD) diverge from what the actual code implements, or from what the legacy screenshots/schema show, this is called out explicitly — these gaps are themselves useful signals for the rebuild.

---

## 1. Project Purpose

**AJIS (Anak Juara Information System)** is Rumah Zakat's information system for managing the **Anak Juara** program — a child sponsorship program for orphaned and underprivileged children ("yatim", "piatu", "dhuafa"). It supports the full operational cycle of a foster-child program:

- Registering and maintaining child (**Anak**) profiles
- Running and recording weekly/periodic **coaching sessions** (**Pembinaan**) with attendance and habit tracking
- Tracking **Quran memorization and religious-practice progress** (**Hafalan**)
- Producing **semester evaluations/report cards** (**Penilaian** / Laporan Semester)

The system is used in the field by volunteer **regional coordinators (Korwil)**, and administratively by **branch offices (SPMD)** and a **head-office super admin**.

---

## 2. Business Goals

Per the rebuild's own PRD, the current legacy system creates friction that the rebuild is meant to resolve:

| Goal | Problem being solved | Target Metric |
|---|---|---|
| Eliminate double data entry | Coordinators currently juggle spreadsheets, mobile forms, and the legacy AJIS system | 100% of session/hafalan/evaluation data in one place |
| Fast data access | Legacy system is slow, especially in the field | API list responses < 300ms (p95) |
| Mobile-first field usability | Coordinators work from phones in the field, current UI is not optimized for this | All key workflows usable at 375px width |
| Accurate, consistent semester reports | Reports currently delayed/inconsistent | Reports match existing `ajis_penilaian` schema exactly |
| Coordinator self-sufficiency | Coordinators currently depend on IT/head office for routine tasks | No IT involvement needed for daily operation |

---

## 3. User Roles

Roles are defined by `ajis_user.id_group_user` and enforced purely through **data scoping** (see §13), not through page/feature-level permission gates:

| Role | `id_group_user` | Scope of data access | Description |
|---|---|---|---|
| **Super Admin** | `1` | All offices, all regions | Head-office, unrestricted |
| **Branch Admin (SPMD)** | `2` | All children/sessions under their `id_kantor` (branch office) | Oversees multiple Korwil within one branch |
| **Regional Coordinator (Korwil)** | `9` | Only their own `id_wilayah_pembinaan` (assigned region) | Field volunteer; does the actual weekly data entry |

The legacy `ajis_kantor` table also carries an office-`jenis` (type) field, and the sample data shows multiple office archetypes beyond a plain branch (e.g. `RZ - <city>` regional offices, `SD Juara <city>` schools, `SMK Peternakan Juara Subang`) — the office hierarchy is broader than "branch office" alone, though the current rebuild treats them uniformly via `kantor_id`.

---

## 4. Business Process

The core operational cycle, as implemented/planned:

1. **Registration** — A child is registered into `ajis_anak` with full personal, family, and program-eligibility data (survey status, eligibility status, asnaf/zakat category, sponsorship status).
2. **Ongoing coaching (Pembinaan)** — A Korwil runs a session (type: Reguler, Edukasi Pekanan, P3A, Parenting), and for every child in their region records:
   - Attendance (`hadir` / `izin` / `alfa`)
   - "Mandiri" (independence) habit toggles: helped parents, gave charity, performed obligatory prayers, did Quran recitation
   - For "Parenting" sessions specifically, which parent/guardian attended (`ortu_hadir`)
3. **Hafalan tracking** — Separately, memorization/recitation testing is logged per child per item (114 Quran surahs, 10 prayer-recitation items, 14 selected du'a) into `ajis_hafalan`.
4. **Semester evaluation (Penilaian)** — At semester close, evaluation rows are either:
   - **Auto-synced**: system computes attendance %, habit %, and hafalan item counts from Pembinaan/Hafalan data and writes scored rows into `ajis_penilaian`
   - **Manually edited**: a Korwil refines target/baseline/progress text and the letter grade
5. **Reporting** — A semester report ("Laporan Semester") is generated per child, combining "Aspek Cerdas" (cognitive/religious knowledge) and "Aspek Mandiri" (independence habits) tables, plus free-text "Catatan Pembinaan" and "Suara Anak Juara" (child's voice) fields.
6. Separately, at the SPMD/admin level, a **"Rekap Pembinaan"** recap report exists (seen in the legacy portal) allowing date-range filtering, office selection, and Export/Export Detail — used for oversight/reporting up the chain, not yet present in the rebuild.

---

## 5. Main Modules

### In the current rebuild (`rz_ajis-main`)
- **Auth** — login/logout, session
- **Dashboard (Beranda)** — aggregate stats + trend/pie charts, scoped to the logged-in user
- **Anak (Children)** — list (filterable, paginated) + profile detail (tabs: Data, Hafalan, Kehadiran, Penilaian)
- **Pembinaan (Coaching Sessions)** — list, create, detail, edit, delete, attendance+mandiri matrix
- **Hafalan** — checklist by category, embedded in child profile
- **Penilaian (Evaluation)** — list, detail, edit, sync (auto-generate), mass-generate, pivot view
- Supporting master-data endpoints: `wilayah`, `semester`, `pemateri` (speakers), `hafalan/items`

### Visible in the legacy system but **outside current rebuild scope**
From the legacy admin portal's navigation menu (captured in the text dump), AJIS/Pembinaan is one module inside a much larger Rumah Zakat back-office system that also includes:
- **Penyaluran & Input Donasi** (disbursement & donation input), Donatur (donors), Transaksi, Rekap Trans, Saldo Awal, Distribusi
- **CAJ** workflows (Yang Siap / On Proses / Closing) — likely "Calon Anak Juara" (candidate child) intake pipeline
- **PM** workflows (baru/Aktif/Stop/Asnaf) — likely "Program Mustahik" beneficiary program states
- **Report Semester**, **Materi** (session materials library), **Raport Pembinaan**, **Prestasi** (achievements), **Dokumentasi**
- **User & Group User**, **Kantor** (office management), and **Application/Menu/Level/Program** configuration screens (marked "(Develop)" in the legacy menu, i.e. under active development there too)

The rebuild's own PRD explicitly scopes these out (see §15), so this is a known, intentional scope reduction rather than an oversight — but it is worth flagging clearly since the legacy system's real footprint is significantly larger than the module being rebuilt.

---

## 6. Folder Structure

```
rz_ajis-main/
├── app/
│   ├── (auth)/login/page.tsx           # Login page
│   ├── (dashboard)/
│   │   ├── layout.tsx                  # Sidebar + topbar shell
│   │   ├── page.tsx                    # Beranda / Dashboard
│   │   ├── anak/
│   │   │   ├── page.tsx                # Child list
│   │   │   └── [id]/page.tsx           # Child profile (4 tabs)
│   │   ├── pembinaan/
│   │   │   ├── page.tsx                # Session list
│   │   │   ├── new/page.tsx            # New session form
│   │   │   └── [id]/page.tsx, [id]/edit/page.tsx
│   │   └── penilaian/
│   │       ├── page.tsx                # Evaluation list + pivot
│   │       └── [anakId]/[semester]/page.tsx, .../edit/page.tsx
│   ├── api/anakjuara/                  # All API routes (see §7)
│   ├── layout.tsx, globals.css
├── components/
│   ├── ui/            # Design-system primitives (Card, Btn, Badge, DataTable, Modal, Toggle, NilaiBadge, BarLine, TabBar, MultiSearchSelect, SearchSelect, ...)
│   ├── layout/         # Sidebar, Topbar, MobileNav
│   ├── anak/            # AnakTable, AnakCard, AnakFilter, HafalanChecklist, KehadiranTable
│   ├── pembinaan/       # PembinaanTable/Card/Filter/Form, AttendanceMatrix
│   ├── penilaian/       # PenilaianTable/Card/Filter, PivotTable, LaporanCard, PenilaianEditForm
│   └── dashboard/       # TrendChart, PieChart, HafalanBarChart
├── lib/                 # db.ts, auth.ts, cache.ts, utils.ts, pagination.ts, searchSelect.ts, pembinaanConstants.ts, swrConfig.ts
├── types/               # anak, pembinaan, penilaian, hafalan, semester, pemateri, user
├── hooks/               # useAnakList, usePembinaan, usePenilaian, useHafalan, useCurrentSemester, useMobileInfiniteList, useDebouncedValue, useMediaQuery
├── refs/                # prd.md, trd.md, AnakJuara.jsx (single-file UI prototype), newajis.sql (legacy schema+data dump)
├── middleware.ts        # Route auth guard
├── CLAUDE.md, AGENTS.md # AI-assistant build instructions & conventions
└── package.json
```

This is a clean, conventional Next.js App Router layout with a clear feature-based component organization.

---

## 7. Existing APIs

All routes live under `app/api/anakjuara/`, use raw SQL via `mysql2/promise`, and require an active session (checked at the top of every handler via `getSession()`).

| Method & Path | Purpose |
|---|---|
| `POST /auth/login` | Authenticate via `username` + MD5-matched `password` against `ajis_user`; sets `ajis_session` cookie |
| `POST /auth/logout` | Destroys session |
| `GET /anak` | Paginated, filterable child list (filters: `q`, `status_ortu`, `jenjang`, `asnaf`, `wilayah`, `id_sdm`; supports a `source=pemasangan` mode joining `ajis_pemasangan`); scoped by role |
| `GET /anak/[id]` | Full child detail (personal + parent/guardian data) |
| `GET /anak/[id]/hafalan` | Hafalan checklist status for a child |
| `PUT /anak/[id]/hafalan` *(implied by hooks/TRD; file present)* | Toggle hafalan completion |
| `GET /anak/[id]/kehadiran` | Attendance history for a child |
| `GET /pembinaan` | List sessions, grouped by `id_pembinaan` (filters: `jenis`, `semester`, `q`, `tgl_dari`, `tgl_sampai`), with computed `jumlah_hadir` |
| `POST /pembinaan` | Create a session: validates required fields, generates a session ID, inserts **one row per child** with attendance + mandiri flags |
| `GET /pembinaan/[id]` | Session detail — header + full per-child attendance/mandiri rows |
| `PUT /pembinaan/[id]` | Update session header fields + rewrite attendance/mandiri per child |
| `DELETE /pembinaan/[id]` | Hard-deletes **all** rows for a session |
| `GET /penilaian` | List children with evaluation summary per semester (filters: `semester`, `wilayah`, `q`, `status`) |
| `GET /penilaian/[anakId]/[semester]` | Full evaluation detail grouped by aspek |
| `PUT /penilaian/[anakId]/[semester]` *(implied by file presence)* | Upsert evaluation rows |
| `POST /penilaian/sync` | Auto-generate/recompute evaluation rows for one child or mass-sync all children missing a record, from Pembinaan + Hafalan data |
| `GET /hafalan/items` | Master list of hafalan items (Quran/Shalat/Doa) |
| `GET /semester` | Semester master data |
| `GET /wilayah` | Region list (for filters) |
| `GET /pemateri` | Speaker/presenter list (for pembinaan forms) |
| `GET /dashboard` | Aggregated stats (total anak, total yatim, total sesi, % kehadiran, attendance trend, status distribution) scoped by role |

All responses follow `{ data, total?, page?, limit? }` or `{ error }` shapes; errors are logged via `console.error` and return appropriate HTTP status codes.

---

## 8. Existing Database Structure

**Engine/charset note:** the legacy schema mixes `MyISAM` (no transactions/FKs, table locking) and `InnoDB`, mostly on `latin1` charset, while the app connects with `utf8mb4` — a latent encoding-mismatch risk (see §14).

| Table | Engine | Primary Key | Purpose |
|---|---|---|---|
| `ajis_anak` | MyISAM | `id_anak` (varchar 25) | Full child record: identity, family (father/mother/guardian), address (province→village), education, program eligibility/status, banking info. ~125 columns; heavily denormalized (redundant `nama_wilayah`, `nama_kantor` text copies). |
| `ajis_pembinaan_baru` | MyISAM | `id_row` (auto-increment) | **One row per child per session** — not a header+detail model. Carries session-level fields (`tgl_pembinaan`, `jenis_pembinaan`, `judul_materi`, `pemateri`) duplicated on every child row, plus per-child `kehadiran`, `keterangan`, and 4 "pembiasaan" (habit) integer flags. Also carries donor linkage fields (`id_donatur`, `nama_donatur`, `program_donasi`) unused by the current rebuild. |
| `ajis_penilaian` | InnoDB | Composite (`id_anak`,`semesterid`,`aspek`) | One row **per evaluation item** (not per category) — `aspek` is actually used as an item-level label (e.g. "Hafalan Alquran", "Kehadiran Pembinaan"), despite the column name suggesting category. Carries `target`, `kondisi_awal`, `nilai_capaian`, `perkembangan_capaian`, `skor`, `hasil_akhir` (letter grade). |
| `ajis_hafalan` | InnoDB | (`id_anak`,`konten_uji`) | Individual hafalan test records — separate from, and only indirectly reconciled with, the rollup counts written into `ajis_penilaian`. |
| `ajis_item_hafalan` | InnoDB | `id` | Master list of 138 hafalan items (`jenis`: 2=Quran/114 surah, 3=Shalat readings/10 items, 4=selected du'a/14 items). |
| `ajis_user` | MyISAM | `id_user` | Login accounts: `username`, MD5 `password`, `id_group_user` (role), `id_kantor`, `id_wilayah_pembinaan`, `aktif` flag. |
| `ajis_sdm_wilayah` | MyISAM | `id_sdm` | Coordinator/volunteer HR-style profiles (contact info, join/leave dates, active-education flag). |
| `ajis_wilayah_pembinaan` | — | `id_wilayah_pembinaan` | Regional mapping (region name, linked office, geography codes). |
| `ajis_kantor` | — | `id` | Branch office master (name, parent-office chain, RZ program-office codes, office `jenis`). |
| `ajis_semester` | — | `id` | Semester master (date range, cover images, various report-related fields — most unused/blank in the sample). |

Indexes present on the largest tables (`ajis_anak`, `ajis_pembinaan_baru`) are composite and already align with the app's actual query patterns (`id_wilayah_pembinaan` + `kantor_id`; `id_anak` + `id_pembinaan` + `tgl_pembinaan`), which is a positive — the rebuild's list/dashboard queries filter and sort on exactly these columns.

---

## 9. Existing UI Pages

### Current rebuild (Next.js, code-confirmed)
- `/login` — login form
- `/` (Beranda/Dashboard) — KPI stat cards, attendance trend chart, hafalan bar chart, status pie chart
- `/anak` — child list (desktop Excel-style sticky table / mobile card list), advanced filter panel
- `/anak/[id]` — child profile with 4 tabs: Data, Hafalan, Kehadiran (attendance history), Penilaian (evaluation/report)
- `/pembinaan` — session list with filters
- `/pembinaan/new` — new session form
- `/pembinaan/[id]` — session detail (full attendance/mandiri matrix)
- `/pembinaan/[id]/edit` — edit session
- `/penilaian` — evaluation list + pivot tab
- `/penilaian/[anakId]/[semester]` — evaluation/report detail
- `/penilaian/[anakId]/[semester]/edit` — evaluation edit form

### Legacy mobile app (from screenshots)
- Splash/login screen (orange branding, Bahasa Indonesia)
- Beranda (dashboard) with a menu-tile layout linking to program modules
- Data Anak (child) list and profile views
- Pembinaan session list and data-entry form (attendance + mandiri toggles per child)
- Hafalan checklist screens (by category)
- Penilaian / Laporan Semester (report) views

### Legacy desktop/admin portal (from the text-dump)
- **"Rekap Pembinaan"** report page: date-range filter (`Tgl Awal` / `Tgl Akhir`), Kantor dropdown (~47+ offices listed, mixing RZ branch offices, SD Juara schools, and an SMK), Search / Export / Export Detail actions
- Cascading province → regency (kabupaten/kota) selector data (used somewhere in the address/wilayah forms)
- A much larger sidebar menu (see §5) covering donation/disbursement, CAJ/PM candidate-and-program workflows, report/semester/materi/prestasi/dokumentasi pages, and user/application administration — **none of this admin-portal UI is present in the current rebuild**, consistent with the PRD's stated scope.

---

## 10. Existing Forms

| Form | Location | Key fields |
|---|---|---|
| **Login** | `(auth)/login` | `username`, `password` |
| **Pembinaan create/edit** | `pembinaan/new`, `pembinaan/[id]/edit`, `PembinaanForm.tsx` | `tgl_pembinaan`, `semesterid`, `jenis_pembinaan` (Reguler/Edukasi Pekanan/P3A/Parenting), conditional `p3a` field, `judul_materi`, `pemateri`; per-child: `kehadiran` (hadir/izin/alfa + keterangan), 4 mandiri toggles, conditional `ortu_hadir` (ayah/ibu/wali) when `jenis_pembinaan = Parenting` and child is present |
| **Hafalan checklist** | `HafalanChecklist.tsx` (in child profile) | Per-item completion toggle across 3 categories, with per-category progress bars |
| **Penilaian edit** | `PenilaianEditForm.tsx` | Per-aspek: `target`, `kondisi_awal`/baseline, `perkembangan`, `nilai_huruf` (letter grade); plus `catatan` (coach notes) and `suara_anak` (child's voice) free text |
| **Anak filter** | `AnakFilter.tsx` | Status ortu, jenjang pendidikan, wilayah, asnaf, search text |
| **Pembinaan filter** | `PembinaanFilter.tsx` | Jenis, semester, pemateri, tanggal range, search text |
| **Penilaian filter / Pivot filter** | `PenilaianFilter.tsx`, `PivotTable.tsx` | Nilai (per category), wilayah, jenjang, plus per-column filters in the pivot view |
| **Rekap Pembinaan (legacy only)** | Legacy admin portal | Date range, Kantor selector, Export / Export Detail |

---

## 11. Navigation Flow

```
/login
   └─(on success)─> / (Beranda/Dashboard)
                        ├─ Sidebar (desktop) / Bottom nav (mobile)
                        ├─→ /anak ──────────→ /anak/[id]  (tabs: Data | Hafalan | Kehadiran | Penilaian)
                        ├─→ /pembinaan ─────→ /pembinaan/[id] ──→ /pembinaan/[id]/edit
                        │                  └─→ /pembinaan/new
                        └─→ /penilaian (list | pivot tab) ─→ /penilaian/[anakId]/[semester] ─→ .../edit
```

- Layout split: `(auth)` layout (unauthenticated shell) vs `(dashboard)` layout (Sidebar + Topbar + authenticated content), matching Next.js route groups.
- Mutations (create/update/delete Pembinaan, sync/edit Penilaian, toggle Hafalan) trigger SWR cache invalidation/refetch on the relevant list rather than a full page reload.
- No route exists yet for a standalone "Rekap"/export report, despite this being a page in the legacy admin portal.

---

## 12. Authentication Flow

1. User submits `username`/`password` to `POST /api/anakjuara/auth/login`.
2. Server queries `ajis_user` with `password = MD5(?)` (MySQL-side hashing) and `aktif = 'y'`.
3. On success, an `iron-session`-encrypted cookie named `ajis_session` is set: `httpOnly`, `secure` in production, `sameSite: 'lax'`, 7-day `maxAge`. Session payload: `userId`, `username`, `namaKantor`, `namaWilayah`, `idKantor`, `idGroupUser`, `idWilayahPembinaan`, `isLoggedIn`.
4. `middleware.ts` guards all non-API, non-static routes: if no `ajis_session` cookie is present and the route isn't `/login`, redirect to `/login`; if a cookie is present and the route is `/login`, redirect to `/`.
5. **Important nuance:** `middleware.ts` only checks that the cookie **exists**, not that it decrypts/validates via `getIronSession`. Real session validation only happens inside each API route handler when it calls `getSession()`/`requireSession()`. This means an invalid/forged cookie value would still pass the page-routing gate (the page shell would render) but any data-fetching call to the API would then fail with `401` — a defense-in-depth gap rather than a full bypass, but worth hardening (see §14, §17).
6. `POST /api/anakjuara/auth/logout` clears the session.

---

## 13. Authorization Flow

Authorization is implemented purely as **row-level data scoping**, computed in `lib/auth.ts` → `getScopeCondition(session, tableAlias)`:

```
id_group_user = 1 (Super Admin)  → no filter ("1=1")
id_group_user = 2 (Branch Admin) → WHERE {alias.}kantor_id = session.idKantor
id_group_user = 9 (Korwil)       → WHERE {alias.}id_wilayah_pembinaan = session.idWilayahPembinaan
```

This SQL fragment + its params are injected into essentially every list, detail-adjacent, and dashboard query. There is **no separate feature/page-level permission model** — any authenticated user of any role can reach any route in the UI; what differs is only which rows their queries are allowed to see (and, in `pembinaan` POST, an explicit re-check that submitted child IDs actually fall within the caller's scope before insert). This is a reasonable, simple model for the current 3-role system but does not generalize automatically if more roles or feature-level restrictions (e.g., "Korwil can view but not edit Penilaian") are introduced later.

---

## 14. Weaknesses

1. **Legacy schema fragility.** Several core tables (`ajis_anak`, `ajis_pembinaan_baru`, `ajis_user`, `ajis_sdm_wilayah`) are `MyISAM` — no foreign keys, no transactions, table-level locking. Multi-row writes (e.g., inserting one Pembinaan row per child in a loop) have no atomicity: a failure partway through leaves an inconsistent session.
2. **Charset mismatch risk.** Legacy tables default to `latin1`; the app's MySQL pool connects with `charset: 'utf8mb4'`. This combination can silently corrupt non-ASCII text (e.g., names, addresses) depending on how MySQL interprets the mismatch.
3. **Denormalized, one-row-per-child session model.** `ajis_pembinaan_baru` repeats session-level data (date, theme, speaker) on every child's row instead of a header+detail split. Editing a session's header fields means updating N rows; `DELETE` removes **all** rows for a session with no soft-delete or audit trail.
4. **Confusing `ajis_penilaian` semantics.** The `aspek` column is used as an item-level label (not a category, despite its name and despite an unused `kategori` column existing alongside it) — a source of confusion for anyone reading the schema without the code's inline comments explaining "real" usage.
5. **MD5 password hashing.** Inherited from the legacy system; cryptographically broken by modern standards, and cannot be swapped outright without a login-time migration path (existing accounts would break).
6. **Middleware only checks cookie presence, not validity** (§12) — a defense-in-depth gap versus the TRD's own stated intent.
7. **Cookie `sameSite` is `'lax'` in the actual code**, while the TRD's security section implies `SameSite=Strict` — a minor doc/code mismatch with real CSRF-surface implications.
8. **No rate limiting** on the login endpoint — brute-force risk against MD5-hashed passwords.
9. **No automated tests** anywhere in the repository, and no CI/CD configuration (no `vercel.json`, despite the TRD specifying one; no `.github/workflows`).
10. **No file/photo upload handling** despite `foto` columns existing on `ajis_anak`/`ajis_sdm_wilayah` — no evident storage/CDN strategy in the current codebase.
11. **Stale-copy risk from denormalization.** `nama_wilayah`, `nama_kantor`, and similar descriptive fields are copied onto transactional rows (children, sessions, evaluations); if master data changes, historical rows retain the old text with no update path.
12. **Two overlapping hafalan data models.** `ajis_hafalan` (individual test records) and the hafalan rollup counts written into `ajis_penilaian` by the sync process are only loosely reconciled — they can drift out of sync.
13. **Env var naming drift between TRD and code.** The TRD documents `DB_HOST`/`DB_PORT`/`DB_USER`/`DB_PASSWORD`; the actual `lib/db.ts` uses `HOST_DB`/`PORT_DB`/`USER_DB`/`PASS_DB` — a documentation/code mismatch that could mislead a new engineer during environment setup.
14. **Unguarded numeric query params.** Pagination params are parsed with `parseInt()` without an explicit `NaN` fallback before the `Math.max`/`Math.min` clamp, which could pass `NaN` through to a SQL `LIMIT`/`OFFSET` in an edge case.
15. **Donor/program linkage fields go unused.** `ajis_pembinaan_baru` carries `id_donatur`, `nama_donatur`, `program_donasi` — meaning sessions/children may be tied to specific donor-funded programs at the data layer, but none of this is surfaced anywhere in the rebuilt UI or API, which could be an oversight if this linkage matters operationally.
16. **The much larger legacy admin system** (donations/disbursement, CAJ/PM candidate workflows, user/application management) is entirely outside the rebuild's scope — an intentional PRD decision, but one that means the rebuilt app cannot yet replace the legacy portal wholesale for admin/SPMD users who rely on those adjacent modules.

---

## 15. Missing Features

Relative to what the legacy data model, the legacy screenshots/portal, and the rebuild's **own** PRD/TRD describe, but which are **not yet implemented** in the current `rz_ajis-main` codebase:

- **Anak (child) create / edit / deactivate.** The PRD explicitly calls for "As an admin, I can register, edit, or deactivate a child record," but only `GET /anak` (list) and `GET /anak/[id]` (detail) routes exist — no `POST`/`PUT`/`DELETE` for children.
- **Rekap/Laporan Pembinaan export report.** Seen live in the legacy admin portal (date-range filter, Kantor selector, Search/Export/Export Detail) — no equivalent route exists in the rebuild yet.
- **PDF export of semester reports** — explicitly marked "Out of Scope (Future)" in the PRD itself, so this is a known, deliberate gap rather than an oversight.
- **SDM Wilayah (coordinator/volunteer) management.** Table exists (`ajis_sdm_wilayah`) and is referenced in the TRD's schema notes, but no CRUD route/page exists.
- **Kantor / Wilayah Pembinaan master-data management** — only a read-only `GET /wilayah` list for filter dropdowns exists; no admin screens to manage offices or regions.
- **Donor/program linkage display** — data columns exist (`id_donatur`, `nama_donatur`, `program_donasi`) but are never read or shown by the current app.
- **Materi (session material library), Prestasi (achievements), Dokumentasi (documentation/photos), Raport Pembinaan** — all present as legacy admin-menu items, none represented in the rebuild.
- **User & Group User management** — no screens exist to create/manage `ajis_user` accounts or roles; provisioning must happen directly against the database today.
- **Push notifications for missing evaluations** and **Parent/guardian self-service portal** — both explicitly listed as "Out of Scope (Future)" in the PRD.
- **Audit/history trail for edits.** `user_update`/`date_update` columns exist but are not consistently populated by the current code (e.g., the Pembinaan `POST` handler writes literal empty-string/`'0000-00-00'` placeholders rather than real values), so there is effectively no reliable change history today.

---

## 16. Technical Debt

- **Repeated boilerplate across route handlers.** Every API route re-implements the same `getSession()` + `isLoggedIn` check and try/catch error-shape pattern inline, rather than through a shared wrapper/middleware — increases the risk that a future endpoint is added without the check.
- **Misleading column semantics carried forward from the legacy schema** (`aspek` as item-label, `kategori` present but unused) — not fixable without a schema change, but worth documenting prominently so it isn't "fixed" incorrectly later.
- **Legacy zero-date literals** (`'0000-00-00'`) used as an "empty date" placeholder — invalid under stricter SQL modes and has no equivalent concept in PostgreSQL, so any straight schema port must actively convert these to real `NULL`s.
- **No DB transactions around multi-row writes** — the Pembinaan create/update loops (one query per child) are not wrapped in `BEGIN`/`COMMIT`, so partial failures are possible today given `MyISAM`'s lack of transaction support.
- **`REPLACE INTO` used for evaluation upserts.** This is MySQL-specific: it deletes and re-inserts the row, silently clearing any column not explicitly supplied, rather than merging — a behavior that will not translate directly if the storage layer changes, and is a subtly risky pattern even on MySQL today.
- **Mixed naming conventions.** camelCase session/JS fields alongside snake_case DB columns throughout — workable, but not written down anywhere as an explicit convention.
- **Minimal project documentation** (`README.md` is 36 lines) — onboarding relies almost entirely on `CLAUDE.md`/`AGENTS.md` (AI-assistant instructions) rather than a human-oriented README/architecture doc.
- **No source-controlled migration history.** `refs/newajis.sql` is a one-time schema+data snapshot, not a versioned migration set — there is no record of how the schema has evolved or will evolve.
- **No automated tests, no CI pipeline** — every change today is verified manually.

---

## 17. Suggested Improvements if Rebuilt Using Next.js App Router + Neon PostgreSQL + Vercel + Tailwind CSS + Raw SQL

These are architectural/technical migration recommendations only — no new product features are proposed, per the existing scope.

**Schema & data layer**
- Port each MySQL table to PostgreSQL with correct native types: real `DATE`/`TIMESTAMP` columns (eliminating the `'0000-00-00'` placeholder pattern), `CHECK` constraints in place of MySQL `ENUM` (e.g., `jns_kel`, `aktif`, `status_tersantuni`), and native `UTF8` (removing the `latin1`/`utf8mb4` mismatch risk entirely.
- Add real foreign-key constraints (`ajis_anak.id_wilayah_pembinaan → ajis_wilayah_pembinaan`, `ajis_pembinaan_baru.id_anak → ajis_anak`, etc.) — currently enforced only by convention in application code.
- Split `ajis_pembinaan_baru` into a normalized **session header** table plus a **session-attendance/mandiri detail** table — this preserves the exact same conceptual `GROUP BY id_pembinaan` query pattern the app already uses, while making session-header edits a single-row update and enabling atomic, cheaper writes.
- Introduce a proper **penilaian item lookup table** (`id`, `kategori`, `aspek`, `urutan`) referenced by foreign key from evaluation rows, replacing today's repeated free-text `aspek` strings that are actually functioning as item identifiers — removes the naming ambiguity flagged in §14/§16 without changing what data is captured.
- Recreate the existing composite indexes (already well-aligned to the app's real query patterns — `id_wilayah_pembinaan`+`kantor_id` on children, `id_anak`+`id_pembinaan`+`tgl_pembinaan` on sessions) as native PostgreSQL composite indexes.

**Query layer (raw SQL preserved, per project constraint)**
- Replace `mysql2/promise` with Neon's serverless/HTTP-friendly Postgres driver (e.g. `@neondatabase/serverless` or `postgres.js`), which fits Vercel's serverless function model better than a fixed-size connection pool (directly resolving the connection-limit/cold-start tuning the TRD had to reason about).
- Port `?` placeholders to PostgreSQL's `$1, $2, …` positional syntax — a mechanical, low-risk change given how uniformly parameterized the existing queries already are.
- Wrap multi-row write sequences (e.g., the Pembinaan create/update loops) in explicit `BEGIN`/`COMMIT` transactions, which PostgreSQL supports cleanly — this directly fixes the MyISAM partial-write risk noted in §14/§16.
- Replace MySQL `REPLACE INTO` with PostgreSQL `INSERT ... ON CONFLICT (...) DO UPDATE SET ...` — an upsert that only touches the columns actually supplied, fixing the "silently clears other columns" issue in the current sync logic.
- Keep the project's existing "no ORM" convention and the `query<T>()`/`queryOne<T>()` helper pattern already established in `lib/db.ts` — this has worked well and translates directly; optionally add compile-time column-name safety via a lightweight typed query layer (e.g., Kysely used purely as a typed SQL builder, or tagged-template SQL via `postgres.js`) without introducing a full ORM.

**Auth & security**
- Keep `iron-session` (framework-agnostic, works on Vercel) but close the gap noted in §12/§14 by validating the session (`getIronSession`) inside `middleware.ts` itself, not just checking cookie presence.
- Align the cookie's actual `sameSite` setting with whatever the security posture is intended to be (the TRD says `Strict`; the code currently ships `lax`) — pick one deliberately and document it.
- Plan a **one-time, in-place password migration**: verify against the legacy MD5 hash on next successful login, then transparently re-hash into a modern algorithm (bcrypt/argon2) — this improves what already exists (login) without adding a new feature.
- Add basic rate limiting on the login endpoint (a Vercel-Edge-compatible option, e.g. a small in-memory/KV-backed limiter) to close the brute-force gap noted in §14.

**Frontend**
- Introduce Tailwind CSS utility classes mapped 1:1 onto the existing design tokens already documented in `CLAUDE.md` (`T.primary`, `T.primaryDk`, etc.), replacing the current inline-style-heavy component pattern — preserves the existing visual identity while reducing style duplication already visible across `components/ui/`.
- Keep the existing Server-Component-by-default / Client-Component-only-where-needed split, and the existing `dynamic(..., { ssr:false })` pattern for chart libraries — both are sound and translate unchanged.

**Deployment & ops**
- Deploy `app/api/anakjuara/**` as Vercel serverless functions against Neon's pooled connection string, replacing the manual `connectionLimit: 10` MySQL pool tuning.
- Add a `vercel.json` (specified in the TRD but not present in the current repo) and basic CI (lint/build/test on push) — closes a concrete gap versus the project's own stated intentions.
- Add unit tests for the pure business-logic functions already isolated in `lib/utils.ts` (`scoreToNilai`, `calcAge`, etc.) and integration tests for API routes against a disposable Neon branch database — addresses the complete absence of automated testing noted in §14/§16 without inventing new functionality.
