# BAB 6 — Master Data Development Plan

**Project:** RZ AJIS Admin Panel  
**Status:** Planning Phase  
**Last Updated:** July 16, 2026

---

## 📋 Executive Summary

Bab 6 focuses on developing all Master Data modules following a **one-module-at-a-time** approach. Each module will be completed end-to-end (analysis → backend → frontend → testing → review) before moving to the next module.

**Philosophy:** Quality over speed. Each module must be production-ready before proceeding.

---

## 🎯 Module Priority Order

Based on dependency complexity and business criticality:

1. **Referensi Propinsi** (Simplest, foundational)
2. **Referensi Kabupaten** (Depends on Propinsi)
3. **Referensi Kecamatan** (Depends on Kabupaten)
4. **Referensi Desa** (Depends on Kecamatan)
5. **Group User** (Authentication foundation)
6. **Kantor** (Organizational hierarchy)
7. **Wilayah Pembinaan** (Depends on Kantor + Desa)
8. **User Management** (Depends on Group User + Kantor + Wilayah)
9. **SDM Wilayah** (HR management)
10. **Jabatan SDM** (HR reference)

---

## 📦 Module 1: Referensi Propinsi

### 1. Module Overview

**Module Name:** Referensi Propinsi (Province Reference Data)  
**Table:** `ref_propinsi`  
 **Purpose:** Master data for Indonesian provinces  
 **Complexity:** Low (simple reference table)  
 **Priority:** High (foundational for geographic hierarchy)

---

### 2. Business Analysis

#### Business Purpose
- Maintain list of Indonesian provinces
- Used as dropdown options in forms (child registration, SDM registration, etc.)
- Foundation for geographic hierarchy (propinsi → kabupaten → kecamatan → desa)
- Rarely changed after initial setup

#### Business Flow
1. **Setup Phase:** Super Admin imports/creates all provinces
2. **Maintenance:** Occasional updates (name changes, new provinces)
3. **Usage:** Selected in forms across the system
4. **Deactivation:** Soft delete (aktif='n') instead of hard delete

#### Access Control (RBAC)
- **Super Admin (Role 1):** Full CRUD access
- **Branch Admin (Role 2):** Read-only access
- **Korwil (Role 9):** Read-only access

#### Business Rules
- `kode` must be unique (4-digit legacy code)
- `nama` is required (max 100 characters)
- `aktif` defaults to 'y'
- Cannot delete if referenced by `ref_kabupaten`

---

### 3. Database Review

#### Table Structure
```sql
ref_propinsi (
  id          BIGSERIAL PK,
  kode        VARCHAR(4) UNIQUE NOT NULL,
  nama        VARCHAR(100) NOT NULL,
  ibukota     VARCHAR(100),
  aktif       VARCHAR(1) DEFAULT 'y' NOT NULL
)
```

#### Constraints
- **Primary Key:** `id` (BIGSERIAL)
- **Unique:** `kode` (legacy province code)
- **Check:** `aktif IN ('y', 'n')`

#### Indexes
- **Primary:** `id` (automatic)
- **Unique:** `kode` (for lookups by legacy code)

#### Relationships
- **One-to-Many:** `ref_propinsi` → `ref_kabupaten` (ON DELETE RESTRICT)

#### Data Volume
- **Expected:** ~34 provinces (Indonesia)
- **Growth:** Minimal (rarely changes)

---

### 4. Backend Plan

#### Repository Layer
**File:** `lib/repositories/ref-propinsi.repository.ts`

**Methods:**
```typescript
class RefPropinsiRepository extends BaseRepository {
  // Inherited from BaseRepository:
  // - findMany(filters, pagination, sorting)
  // - findById(id)
  // - create(data)
  // - update(id, data)
  // - delete(id)
  // - count(filters)

  // Custom methods:
  - findActiveOnly() // WHERE aktif = 'y'
  - findByKode(kode) // Lookup by legacy code
  - searchByName(query) // ILIKE search with GIN trigram
}
```

#### Service Layer
**File:** `lib/services/ref-propinsi.service.ts`

**Methods:**
```typescript
class RefPropinsiService extends BaseService {
  // Business logic:
  - validateKodeUnique(kode, excludeId?)
  - validateNotReferenced(id) // Check before delete
  - getActiveList() // For dropdowns
  - importFromCSV(csvData) // Bulk import
}
```

#### Server Actions
**File:** `app/actions/ref-propinsi.ts`

**Actions:**
```typescript
"use server";

// List with pagination
export async function getRefPropinsiList(params: {
  page: number;
  search?: string;
  aktif?: 'y' | 'n';
})

// Get single record
export async function getRefPropinsiById(id: number)

// Create new
export async function createRefPropinsi(data: CreateRefPropinsiInput)

// Update existing
export async function updateRefPropinsi(id: number, data: UpdateRefPropinsiInput)

// Delete (soft delete)
export async function deleteRefPropinsi(id: number)

// Get active list (for dropdowns)
export async function getActiveRefPropinsiList()
```

---

### 5. Frontend Plan

#### Page Structure
```
app/(dashboard)/referensi/
├── propinsi/
│   ├── page.tsx                    # List page (Server Component)
│   ├── loading.tsx                 # Skeleton loading
│   ├── new/
│   │   └── page.tsx                # Create form
│   └── [id]/
│       ├── page.tsx                # Detail view
│       └── edit/
│           └── page.tsx            # Edit form
```

#### Components
**File:** `components/referensi/propinsi/`

```typescript
// propinsi-table.tsx (Server Component)
- Displays table with pagination
- Columns: No, Kode, Nama, Ibukota, Aktif, Aksi
- Search filter
- Active filter (All/Aktif/Nonaktif)
- Sortable columns

// propinsi-form.tsx (Client Component)
- React Hook Form + Zod validation
- Fields: kode, nama, ibukota, aktif
- Submit button with loading state
- Error display

// propinsi-actions.tsx (Client Component)
- Edit button (navigates to edit page)
- Delete button (opens confirmation dialog)
- Status badge (Aktif/Nonaktif)
```

#### UI/UX Requirements
- **List Page:**
  - Search bar (search by nama/kode)
  - Filter by status (Aktif/Nonaktif)
  - Table with 20 rows per page
  - Sortable columns (kode, nama)
  - "Tambah Baru" button (top right)
  
- **Form Pages:**
  - Clear validation errors
  - Loading state on submit
  - Success toast notification
  - Back button to list
  
- **Detail Page:**
  - Read-only view
  - Edit button
  - Delete button (with confirmation)
  - Show related kabupaten count

---

### 6. CRUD Plan

#### Create (POST)
**Route:** `POST /app/actions/ref-propinsi/createRefPropinsi`

**Input:**
```typescript
{
  kode: string;        // 4 chars, unique
  nama: string;        // max 100 chars, required
  ibukota?: string;   // max 100 chars, optional
  aktif: 'y' | 'n';   // default 'y'
}
```

**Validation:**
- kode: required, unique, max 4 chars
- nama: required, max 100 chars
- ibukota: optional, max 100 chars
- aktif: required, enum ['y', 'n']

**Process:**
1. Validate input with Zod
2. Check kode uniqueness
3. Insert into database
4. Return created record
5. Log audit trail

#### Read (GET)
**Route:** `GET /app/actions/ref-propinsi/getRefPropinsiList`

**Query Params:**
```typescript
{
  page: number;       // default 1
  search?: string;    // search nama/kode
  aktif?: 'y' | 'n'; // filter by status
  sort?: string;      // default 'nama'
  order?: 'asc' | 'desc'; // default 'asc'
}
```

**Response:**
```typescript
{
  data: RefPropinsi[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
```

#### Update (PUT)
**Route:** `PUT /app/actions/ref-propinsi/updateRefPropinsi`

**Input:** Same as Create (excluding id)

**Validation:** Same as Create + check if kode conflicts with other records

**Process:**
1. Validate input
2. Check if record exists
3. Check kode uniqueness (exclude current record)
4. Update record
5. Return updated record
6. Log audit trail

#### Delete (DELETE)
**Route:** `DELETE /app/actions/ref-propinsi/deleteRefPropinsi`

**Input:** `id: number`

**Validation:**
- Check if record exists
- Check if referenced by ref_kabupaten
- If referenced, return error

**Process:**
1. Validate not referenced
2. Soft delete (set aktif='n') or hard delete based on preference
3. Return success
4. Log audit trail

---

### 7. Validation Plan

#### Client Validation (Zod Schema)
**File:** `lib/validation/schemas.ts`

```typescript
export const refPropinsiSchema = z.object({
  kode: z
    .string()
    .min(1, 'Kode wajib diisi')
    .max(4, 'Kode maksimal 4 karakter')
    .regex(/^[0-9]+$/, 'Kode harus berupa angka'),
  nama: z
    .string()
    .min(1, 'Nama wajib diisi')
    .max(100, 'Nama maksimal 100 karakter'),
  ibukota: z
    .string()
    .max(100, 'Ibukota maksimal 100 karakter')
    .optional(),
  aktif: z
    .enum(['y', 'n'], {
      errorMap: () => ({ message: 'Status harus Aktif atau Nonaktif' }),
    })
    .default('y'),
});

export const refPropinsiUpdateSchema = refPropinsiSchema.partial();

export type RefPropinsiInput = z.infer<typeof refPropinsiSchema>;
export type RefPropinsiUpdateInput = z.infer<typeof refPropinsiUpdateSchema>;
```

#### Server Validation
- Re-validate Zod schema in Server Action
- Check business rules (kode uniqueness, references)
- Return user-friendly error messages

#### Error Messages
- **Duplicate kode:** "Kode propinsi sudah digunakan"
- **Referenced by kabupaten:** "Tidak dapat menghapus: propinsi digunakan oleh data kabupaten"
- **Not found:** "Data propinsi tidak ditemukan"
- **Validation error:** Field-specific messages from Zod

---

### 8. Security Review

#### Permission Check
```typescript
// In Server Actions
const session = await requireAuth();

// Only Super Admin can mutate
if (session.user.id_group_user !== 1) {
  throw new Error("Anda tidak memiliki izin untuk mengubah data referensi");
}

// All roles can read (no restriction for reference data)
```

#### SQL Injection Protection
- ✅ Protected by Drizzle ORM (parameterized queries)
- ✅ No raw SQL queries

#### XSS Protection
- ✅ Protected by React (auto-escaping)
- ✅ No dangerouslySetInnerHTML

#### CSRF Protection
- ✅ Protected by NextAuth.js (httpOnly cookies)

#### Audit Logging
- Log all mutations (create, update, delete)
- Include: user_id, action, table, record_id, timestamp, changes

---

### 9. Testing Plan

#### Unit Tests
- **Repository:**
  - findMany with filters
  - findById
  - create with valid data
  - create with duplicate kode (should fail)
  - update
  - delete (soft delete)
  - count

- **Service:**
  - validateKodeUnique
  - validateNotReferenced
  - getActiveList

#### Integration Tests
- **Server Actions:**
  - getRefPropinsiList with pagination
  - getRefPropinsiList with search
  - getRefPropinsiList with filter
  - createRefPropinsi (success)
  - createRefPropinsi (duplicate kode)
  - updateRefPropinsi (success)
  - updateRefPropinsi (not found)
  - deleteRefPropinsi (success)
  - deleteRefPropinsi (referenced)

#### E2E Tests (Playwright)
- Navigate to /dashboard/referensi/propinsi
- Search by nama
- Filter by status
- Create new propinsi
- Edit existing propinsi
- Delete propinsi
- Verify RBAC (Branch Admin cannot see edit/delete buttons)

#### Edge Cases
- Empty list
- Single page (no pagination)
- Large search result
- Concurrent updates
- Delete while being referenced

---

### 10. Code Review Checklist

#### Code Quality
- [ ] TypeScript strict mode compliance
- [ ] No any types
- [ ] Proper error handling
- [ ] Consistent naming conventions
- [ ] Code comments for complex logic

#### Performance
- [ ] Server-side pagination
- [ ] Selective column queries (avoid SELECT *)
- [ ] Index utilization verified
- [ ] No N+1 queries

#### Security
- [ ] RBAC check on all mutations
- [ ] Input validation on client and server
- [ ] No sensitive data in logs
- [ ] Proper error messages (no stack traces to client)

#### Maintainability
- [ ] Reusable components
- [ ] Consistent with existing codebase
- [ ] Follows project structure
- [ ] No code duplication

---

### 11. Definition of Done

**Module is complete when:**
- ✅ All CRUD operations functional
- ✅ Client and server validation working
- ✅ RBAC permissions enforced
- ✅ UI matches design system (shadcn/ui)
- ✅ Pagination, search, filters working
- ✅ Error handling user-friendly
- ✅ Loading states implemented
- ✅ Audit logging functional
- ✅ Unit tests passing
- ✅ E2E tests passing
- ✅ Code review approved
- ✅ Documentation updated

---

### 12. Implementation Checklist

#### Phase 1: Backend
- [ ] Create `lib/repositories/ref-propinsi.repository.ts`
- [ ] Create `lib/services/ref-propinsi.service.ts`
- [ ] Create `app/actions/ref-propinsi.ts`
- [ ] Add Zod schemas to `lib/validation/schemas.ts`
- [ ] Write unit tests for repository
- [ ] Write unit tests for service

#### Phase 2: Frontend
- [ ] Create `app/(dashboard)/referensi/propinsi/page.tsx`
- [ ] Create `app/(dashboard)/referensi/propinsi/loading.tsx`
- [ ] Create `app/(dashboard)/referensi/propinsi/new/page.tsx`
- [ ] Create `app/(dashboard)/referensi/propinsi/[id]/page.tsx`
- [ ] Create `app/(dashboard)/referensi/propinsi/[id]/edit/page.tsx`
- [ ] Create `components/referensi/propinsi/propinsi-table.tsx`
- [ ] Create `components/referensi/propinsi/propinsi-form.tsx`
- [ ] Create `components/referensi/propinsi/propinsi-actions.tsx`

#### Phase 3: Integration
- [ ] Connect frontend to server actions
- [ ] Implement error handling
- [ ] Add loading states
- [ ] Add toast notifications
- [ ] Test RBAC permissions

#### Phase 4: Testing
- [ ] Write integration tests
- [ ] Write E2E tests
- [ ] Manual testing
- [ ] Performance testing
- [ ] Security testing

#### Phase 5: Review
- [ ] Self code review
- [ ] Fix any issues
- [ ] Final verification
- [ ] Update documentation

---

## 📊 Task Breakdown & Estimation

### Module 1: Referensi Propinsi
| Task | Priority | Estimation | Dependency |
|------|----------|------------|-------------|
| Backend Repository | High | 2 hours | None |
| Backend Service | High | 1 hour | Repository |
| Server Actions | High | 2 hours | Service |
| Validation Schemas | High | 0.5 hours | None |
| Frontend List Page | High | 3 hours | Server Actions |
| Frontend Form Pages | High | 3 hours | Server Actions |
| Components | High | 3 hours | None |
| Integration | High | 2 hours | All above |
| Testing | Medium | 3 hours | All above |
| Code Review | Medium | 1 hour | All above |
| **Total** | | **20.5 hours (~3 days)** | |

---

## 🚀 Next Steps

1. **Start Module 1 (Referensi Propinsi)**
   - Begin with backend repository
   - Follow implementation checklist
   - Complete all phases before moving to Module 2

2. **Module 2-10**
   - Follow same pattern as Module 1
   - Reuse components where possible
   - Learn from Module 1 to improve efficiency

3. **Continuous Improvement**
   - Document lessons learned
   - Refactor common patterns into shared utilities
   - Update this plan as needed

---

## 📝 Notes

- **Pattern Establishment:** Module 1 will establish the pattern for all subsequent modules
- **Component Reuse:** Table, form, and action components can be templated for other modules
- **Efficiency:** Later modules should be faster due to pattern reuse
- **Quality:** Never sacrifice quality for speed. Each module must be production-ready.

---

**Document Status:** Ready for Implementation  
**Next Action:** Begin Module 1 - Referensi Propinsi Backend Repository
