# DASHBOARD IMPLEMENTATION PLAN
## RZ AJIS - Dashboard & Navigation System

**Created:** July 16, 2026  
**Status:** Ready for Implementation  
**Priority:** HIGH - Required for system navigation

---

## 1. CURRENT STATUS ANALYSIS

### 1.1 Existing Components
✅ Dashboard home page at `app/(dashboard)/page.tsx` (basic stats with placeholder data)  
✅ Dashboard layout with sidebar and header  
✅ Referensi Propinsi module fully implemented  
✅ RBAC middleware for route protection  
✅ Session management and authentication  

### 1.2 Issues Identified
❌ **404 Error on `/dashboard`** - Route structure mismatch with sidebar  
❌ **Missing dashboard pages** - Sidebar routes don't match actual file structure  
❌ **No real statistics** - Dashboard shows hardcoded zeros  
❌ **Missing modules** - Anak, Sesi, Hafalan, Evaluasi, Laporan not implemented  
❌ **Route structure inconsistency** - Sidebar expects `/dashboard/anak` but actual structure is different  

### 1.3 Route Structure Analysis

**Sidebar Routes (Expected):**
- `/dashboard` - Dashboard home
- `/dashboard/anak` - Anak management
- `/dashboard/kantor` - Kantor management (Super Admin only)
- `/dashboard/wilayah` - Wilayah management (Super Admin, Branch Admin)
- `/dashboard/users` - User management (Super Admin, Branch Admin)
- `/dashboard/sesi` - Sesi pembinaan
- `/dashboard/hafalan` - Hafalan management
- `/dashboard/evaluasi` - Evaluasi management
- `/dashboard/laporan` - Laporan semester
- `/dashboard/prestasi` - Laporan prestasi
- `/dashboard/settings` - Settings (Super Admin only)

**Actual File Structure:**
- `/dashboard` - Dashboard home ✓
- `/dashboard/referensi/propinsi` - Referensi Propinsi ✓
- **Missing:** anak, kantor, wilayah, users, sesi, hafalan, evaluasi, laporan, prestasi, settings

---

## 2. IMPLEMENTATION PLAN

### Phase 1: Dashboard Statistics (CRITICAL)

#### Task 1.1: Create Dashboard Statistics Service
**File:** `lib/services/dashboard.service.ts`
```typescript
export class DashboardService {
  async getStatistics(userContext: UserContext) {
    // Get counts based on RBAC filters
    const totalAnak = await anakRepository.count(userContext);
    const totalSesi = await sesiRepository.countThisMonth(userContext);
    const totalHafalan = await hafalanRepository.countThisMonth(userContext);
    const totalEvaluasi = await evaluasiRepository.countThisSemester(userContext);
    
    return { totalAnak, totalSesi, totalHafalan, totalEvaluasi };
  }
  
  async getRecentActivity(userContext: UserContext) {
    const recentSesi = await sesiRepository.findRecent(userContext, 5);
    const recentHafalan = await hafalanRepository.findRecent(userContext, 5);
    
    return { recentSesi, recentHafalan };
  }
}
```

#### Task 1.2: Update Dashboard Page with Real Data
**File:** `app/(dashboard)/page.tsx`
- Replace hardcoded zeros with real statistics
- Add loading states
- Add error handling
- Show recent activity data

### Phase 2: Route Structure Fix (CRITICAL)

#### Task 2.1: Create Missing Dashboard Pages
Create placeholder pages for all sidebar routes:

1. **Anak Management**
   - `app/(dashboard)/anak/page.tsx` - List page
   - `app/(dashboard)/anak/new/page.tsx` - Create form
   - `app/(dashboard)/anak/[id]/page.tsx` - Detail view
   - `app/(dashboard)/anak/[id]/edit/page.tsx` - Edit form

2. **Kantor Management** (Super Admin only)
   - `app/(dashboard)/kantor/page.tsx` - List page
   - `app/(dashboard)/kantor/new/page.tsx` - Create form
   - `app/(dashboard)/kantor/[id]/page.tsx` - Detail view
   - `app/(dashboard)/kantor/[id]/edit/page.tsx` - Edit form

3. **Wilayah Management** (Super Admin, Branch Admin)
   - `app/(dashboard)/wilayah/page.tsx` - List page
   - `app/(dashboard)/wilayah/new/page.tsx` - Create form
   - `app/(dashboard)/wilayah/[id]/page.tsx` - Detail view
   - `app/(dashboard)/wilayah/[id]/edit/page.tsx` - Edit form

4. **User Management** (Super Admin, Branch Admin)
   - `app/(dashboard)/users/page.tsx` - List page
   - `app/(dashboard)/users/new/page.tsx` - Create form
   - `app/(dashboard)/users/[id]/page.tsx` - Detail view
   - `app/(dashboard)/users/[id]/edit/page.tsx` - Edit form

5. **Sesi Pembinaan**
   - `app/(dashboard)/sesi/page.tsx` - List page
   - `app/(dashboard)/sesi/new/page.tsx` - Create form
   - `app/(dashboard)/sesi/[id]/page.tsx` - Detail view
   - `app/(dashboard)/sesi/[id]/edit/page.tsx` - Edit form

6. **Hafalan Management**
   - `app/(dashboard)/hafalan/page.tsx` - List page
   - `app/(dashboard)/hafalan/new/page.tsx` - Create form
   - `app/(dashboard)/hafalan/[id]/page.tsx` - Detail view
   - `app/(dashboard)/hafalan/[id]/edit/page.tsx` - Edit form

7. **Evaluasi Management**
   - `app/(dashboard)/evaluasi/page.tsx` - List page
   - `app/(dashboard)/evaluasi/new/page.tsx` - Create form
   - `app/(dashboard)/evaluasi/[id]/page.tsx` - Detail view
   - `app/(dashboard)/evaluasi/[id]/edit/page.tsx` - Edit form

8. **Laporan Semester**
   - `app/(dashboard)/laporan/page.tsx` - Report page

9. **Laporan Prestasi**
   - `app/(dashboard)/prestasi/page.tsx` - Report page

10. **Settings** (Super Admin only)
    - `app/(dashboard)/settings/page.tsx` - Settings page

#### Task 2.2: Update Sidebar to Include Referensi
**File:** `components/layout/app-sidebar.tsx`
Add Referensi section:
```typescript
{
  label: 'Referensi',
  icon: Database,
  href: '/dashboard/referensi',
  roles: [1, 2, 9],
},
{
  label: 'Propinsi',
  icon: Map,
  href: '/dashboard/referensi/propinsi',
  roles: [1, 2, 9],
},
```

### Phase 3: Module Implementation (HIGH PRIORITY)

#### Task 3.1: Implement Referensi Module Completion
- Add Kabupaten management
- Add Kecamatan management
- Add Desa management

#### Task 3.2: Implement Anak Module
- Create AnakRepository
- Create AnakService
- Create validation schemas
- Create server actions
- Create UI components

#### Task 3.3: Implement Sesi Module
- Create SesiRepository
- Create SesiService
- Create validation schemas
- Create server actions
- Create UI components

#### Task 3.4: Implement Hafalan Module
- Create HafalanRepository
- Create HafalanService
- Create validation schemas
- Create server actions
- Create UI components

#### Task 3.5: Implement Evaluasi Module
- Create EvaluasiRepository
- Create EvaluasiService
- Create validation schemas
- Create server actions
- Create UI components

### Phase 4: Dashboard Enhancements (MEDIUM PRIORITY)

#### Task 4.1: Add Charts and Visualizations
- Anak growth chart
- Sesi activity chart
- Hafalan progress chart
- Evaluasi results chart

#### Task 4.2: Add Quick Actions
- Quick add anak button
- Quick add sesi button
- Quick add hafalan button

#### Task 4.3: Add Notifications
- System notifications
- Activity feed
- Reminders

---

## 3. DASHBOARD PAGE STRUCTURE

### 3.1 Dashboard Home Page
**File:** `app/(dashboard)/page.tsx`

**Components:**
1. **Header** - Welcome message with user name and role
2. **Statistics Cards** - 4 cards showing:
   - Total Anak (based on RBAC)
   - Total Sesi (this month)
   - Total Hafalan (this month)
   - Total Evaluasi (this semester)
3. **Recent Activity** - 2 sections:
   - Recent Sesi (last 5)
   - Recent Hafalan (last 5)
4. **Quick Actions** - Buttons for common tasks
5. **Charts** - Visual data representation

### 3.2 Navigation Structure
```
/dashboard
├── / (home)
├── /referensi
│   ├── /propinsi ✓
│   ├── /kabupaten
│   ├── /kecamatan
│   └── /desa
├── /anak
│   ├── / (list)
│   ├── /new
│   └── /[id]
│       ├── / (detail)
│       └── /edit
├── /kantor (Super Admin only)
│   ├── / (list)
│   ├── /new
│   └── /[id]
│       ├── / (detail)
│       └── /edit
├── /wilayah (Super Admin, Branch Admin)
│   ├── / (list)
│   ├── /new
│   └── /[id]
│       ├── / (detail)
│       └── /edit
├── /users (Super Admin, Branch Admin)
│   ├── / (list)
│   ├── /new
│   └── /[id]
│       ├── / (detail)
│       └── /edit
├── /sesi
│   ├── / (list)
│   ├── /new
│   └── /[id]
│       ├── / (detail)
│       └── /edit
├── /hafalan
│   ├── / (list)
│   ├── /new
│   └── /[id]
│       ├── / (detail)
│       └── /edit
├── /evaluasi
│   ├── / (list)
│   ├── /new
│   └── /[id]
│       ├── / (detail)
│       └── /edit
├── /laporan
│   └── / (semester reports)
├── /prestasi
│   └── / (achievement reports)
└── /settings (Super Admin only)
    └── / (system settings)
```

---

## 4. RBAC MATRIX FOR DASHBOARD

| Module | Super Admin | Branch Admin | Korwil |
|--------|-------------|--------------|--------|
| Dashboard | ✓ | ✓ | ✓ |
| Referensi Data | ✓ | ✓ | ✓ |
| Anak Management | ✓ | ✓ | Read Only |
| Kantor Management | ✓ | ✗ | ✗ |
| Wilayah Management | ✓ | ✓ | ✗ |
| User Management | ✓ | ✓ | ✗ |
| Sesi Pembinaan | ✓ | ✓ | ✓ |
| Hafalan | ✓ | ✓ | ✓ |
| Evaluasi | ✓ | ✓ | ✓ |
| Laporan | ✓ | ✓ | ✓ |
| Settings | ✓ | ✗ | ✗ |

---

## 5. IMMEDIATE ACTIONS

### Priority 1: Fix 404 Error
1. Create placeholder pages for all sidebar routes
2. Update sidebar to include Referensi section
3. Test navigation

### Priority 2: Dashboard Statistics
1. Create DashboardService
2. Update dashboard page with real data
3. Add loading and error states

### Priority 3: Module Implementation
1. Implement Anak module (most critical)
2. Implement Sesi module
3. Implement Hafalan module
4. Implement Evaluasi module

### Priority 4: Enhancements
1. Add charts and visualizations
2. Add quick actions
3. Add notifications

---

## 6. REFERENCES

- **PRD:** `docs/01_PRODUCT_REQUIREMENT_DOCUMENT.md`
- **ERD:** `docs/02_ENTITY_RELATIONSHIP_DIAGRAM.md`
- **Technical Guide:** `docs/03_TECHNICAL_IMPLEMENTATION_GUIDE.md`
- **Database Schema:** `db/database_ajis.sql`
- **Drizzle Schema:** `lib/db/schema.ts`

---

**Document Version:** 1.0  
**Last Updated:** July 16, 2026  
**Author:** Cascade AI Assistant  
**Status:** Ready for Implementation
