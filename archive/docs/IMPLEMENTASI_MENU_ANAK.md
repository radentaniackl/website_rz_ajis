# Rencana Implementasi Menu Anak - AJIS

## Ringkasan
Dokumen ini merinci seluruh pekerjaan yang diperlukan untuk mengimplementasikan menu "Anak" (Data Anak Binaan) secara lengkap dan sesuai dengan dokumentasi yang tersedia di folder `docs` dan `db`, serta referensi UI dari file zip.

---

## 1. Pemahaman Database & Schema

### 1.1 Tabel Utama: `ajis_anak`
- **Total kolom:** 118 kolom (tabel terbesar dalam sistem)
- **Primary Key:** `id` (BIGSERIAL)
- **Unique Keys:** `kode_anak`, `nik`
- **Foreign Keys:**
  - `desa_id` → `ref_desa(id)`
  - `wilayah_pembinaan_id` → `ajis_wilayah_pembinaan(id)`
  - `kantor_id` → `ajis_kantor(id)`
  - `sdm_wilayah_id` → `ajis_sdm_wilayah(id)` (mentor)
  - `desa_ayah_id` → `ref_desa(id)`
  - `desa_ibu_id` → `ref_desa(id)`
  - `desa_wali_id` → `ref_desa(id)`

### 1.2 Kelompok Kolom (Untuk Form Sectioning)

#### A. Identitas Dasar Anak
- `id`, `kode_anak`, `nik`, `nama_lengkap`, `nama_panggilan`
- `agama`, `jns_kel`, `tempat_lahir`, `tgl_lahir`
- `anak_ke`, `dari_saudara`
- `alamat`, `desa_id`
- `foto`

#### B. Pendidikan
- `jenjang_pendidikan`, `kelas`, `nama_sekolah`, `alamat_sekolah`
- `jurusan`, `semester`
- `nama_pt`, `alamat_pt`

#### C. Rekening Bank
- `no_rekening`, `pemilik_rekening`, `nama_bank`

#### D. Karakter & Minat
- `nilai`, `pelajaran_favorit`, `jarak_rumah`, `alat_transportasi`
- `hobi`, `prestasi`

#### E. Keluarga
- `no_kartu_keluarga`, `asnaf`, `status_ortu`

#### F. Status Program
- `status_survey`, `status_kelayakan`, `status_anak_juara`
- `status_tersantuni`, `status_pinjam`, `status_mentor`
- `aktif`, `alumni_juara`, `juara`

#### G. Organisasi & Penugasan
- `wilayah_pembinaan_id`, `kantor_id`, `sdm_wilayah_id`
- `nama_mentor_manual` (fallback jika sdm_wilayah_id null)
- `tgl_terdaftar`, `tgl_pengajuan`

#### H. Data Ayah
- `nama_lengkap_ayah`, `alamat_ayah`, `desa_ayah_id`
- `pekerjaan_ayah`, `penghasilan_ayah`
- `tgl_kematian_ayah`, `penyebab_kematian_ayah`

#### I. Data Ibu
- `nama_lengkap_ibu`, `alamat_ibu`, `desa_ibu_id`
- `pekerjaan_ibu`, `penghasilan_ibu`
- `tgl_kematian_ibu`, `penyebab_kematian_ibu`

#### J. Data Wali
- `nama_lengkap_wali`, `alamat_wali`, `desa_wali_id`
- `pekerjaan_wali`, `penghasilan_wali`

#### K. Kontak Darurat
- `telp_dihubungi`, `atas_nama`, `hubungan_kerabat`

#### L. Metadata Input
- `via_input`, `approval_ijf`, `kode_program_rz`

#### M. Program Peminjaman (RFO)
- `nia_rfo_book`, `nama_rfo_book`, `tgl_peminjaman`, `tgl_expired`
- `book_via`, `user_book`

#### N. Tempat Tinggal
- `tinggal_bersama`, `nama_tinggal`, `ket_tinggal`
- `penghasilan_tinggal`, `pekerjaan_tinggal`, `tidak_serumah_ortu`

#### O. Integrasi Sistem Eksternal
- `kode_kantor_legacy`, `kode_ijgs_anak`, `upload_gdrive`

#### P. Audit Trail
- `created_at`, `updated_at`

### 1.3 Index Kritis untuk RBAC & Performance
- `idx_anak_wilayah` - Filter berdasarkan wilayah pembinaan
- `idx_anak_kantor` - Filter berdasarkan kantor
- `idx_anak_filter_combo` - Kombinasi wilayah + kantor + aktif
- `idx_anak_aktif_only` - Partial index untuk baris aktif saja
- `idx_anak_nama_trgm` - Pencarian nama dengan GIN trigram
- `idx_anak_nik_trgm` - Pencarian NIK dengan GIN trigram
- `idx_anak_status` - Filter status (aktif, tersantuni, jenjang)
- `idx_anak_tgl_lahir_brin` - BRIN index untuk tanggal lahir
- `idx_anak_tgl_terdaftar_brin` - BRIN index untuk tanggal terdaftar

---

## 2. RBAC (Role-Based Access Control)

### 2.1 User Roles & Scope Data

#### Role 1: Super Admin
- **Scope:** Semua kantor, semua wilayah pembinaan
- **Akses:** CRUD penuh (Create, Read, Update, Delete)
- **Filter:** Tidak ada filter (lihat semua data)

#### Role 2: Branch Admin / SPMD
- **Scope:** Satu kantor + wilayah pembinaan di bawah kantor tersebut
- **Akses:** CRUD data anak di scope kantor/wilayahnya
- **Filter:** WHERE `kantor_id = user.kantor_id` OR `wilayah_pembinaan_id IN (user wilayah_ids)`

#### Role 9: Regional Coordinator / Korwil
- **Scope:** Wilayah pembinaan yang ditugaskan saja
- **Akses:** Read-only data anak, CRUD operational (sesi, hafalan, evaluasi)
- **Filter:** WHERE `wilayah_pembinaan_id IN (user wilayah_ids)`

### 2.2 Implementasi RBAC di Repository
```typescript
// lib/db/repositories/anak-repository.ts
class AnakRepository extends BaseRepository {
  async findMany(params: FindManyParams, user: User) {
    let query = db.select().from(ajisAnak);

    // RBAC Filter Injection
    if (user.group_user_id === 2) { // Branch Admin
      query = query.where(
        or(
          eq(ajisAnak.kantorId, user.kantor_id),
          inArray(ajisAnak.wilayahPembinaanId, user.wilayah_ids)
        )
      );
    } else if (user.group_user_id === 9) { // Korwil
      query = query.where(
        inArray(ajisAnak.wilayahPembinaanId, user.wilayah_ids)
      );
    }
    // Super Admin: no filter

    // Apply additional filters (search, pagination, etc.)
    return this.applyFilters(query, params);
  }
}
```

---

## 3. Struktur File & Folder

### 3.1 Struktur Berdasarkan Technical Implementation Guide

```
app/
├── (dashboard)/
│   └── anak/
│       ├── page.tsx              # List page dengan table, filter, pagination
│       ├── loading.tsx           # Suspense loading state
│       ├── new/
│       │   └── page.tsx          # Form tambah anak baru
│       └── [id]/
│           ├── page.tsx          # Detail view anak
│           └── edit/
│               └── page.tsx      # Form edit anak
components/
├── anak/
│   ├── anak-table.tsx            # Table component untuk list
│   ├── anak-filters.tsx          # Filter component (search, dropdown)
│   ├── anak-pagination.tsx       # Pagination component
│   ├── anak-form.tsx             # Form component (create/edit)
│   └── anak-detail.tsx           # Detail view component
lib/
├── db/
│   ├── repositories/
│   │   └── anak-repository.ts    # Repository untuk data anak
│   └── services/
│       └── anak-service.ts       # Business logic layer
├── actions/
│   └── anak.ts                  # Server Actions (CRUD)
└── schemas/
    └── anak.ts                  # Zod validation schemas
```

### 3.2 File yang Perlu Dibuat (Total: ~15 files)

#### A. Pages (5 files)
1. `app/(dashboard)/anak/page.tsx`
2. `app/(dashboard)/anak/loading.tsx`
3. `app/(dashboard)/anak/new/page.tsx`
4. `app/(dashboard)/anak/[id]/page.tsx`
5. `app/(dashboard)/anak/[id]/edit/page.tsx`

#### B. Components (5 files)
6. `components/anak/anak-table.tsx`
7. `components/anak/anak-filters.tsx`
8. `components/anak/anak-pagination.tsx`
9. `components/anak/anak-form.tsx`
10. `components/anak/anak-detail.tsx`

#### C. Backend Layer (4 files)
11. `lib/db/repositories/anak-repository.ts`
12. `lib/db/services/anak-service.ts`
13. `lib/actions/anak.ts`
14. `lib/schemas/anak.ts`

#### D. Types (1 file)
15. `lib/types/anak.ts` (opsional, jika perlu type tambahan)

---

## 4. Implementasi UI/UX (Berdasarkan Referensi Zip)

### 4.1 Referensi dari `stistla-builder-buddy-main`

Dari file zip yang diekstrak, pola UI yang digunakan:
- **Framework:** TanStack Router + React (berbeda dengan Next.js project kita)
- **Components:** DataTable, PageHeader, StatusBadge
- **Pattern:** RBAC filtering dengan `scopeFilter()` function
- **Mock Data:** 10 rows per table untuk development

### 4.2 Adaptasi ke Next.js App Router

Kita perlu mengadaptasi pola UI dari referensi ke Next.js App Router:

#### A. DataTable Component
Referensi: `src/components/ajis/data-table.ts` (perlu dibuat)
- Fitur: Search, sort, pagination, row actions
- Kolom yang ditampilkan di list (selective, bukan semua 118 kolom):
  - ID (`kode_anak`)
  - Nama Anak (`nama_lengkap`, `jns_kel`, `tgl_lahir`)
  - Wilayah (`wilayah_pembinaan_id` → join ke `ajis_wilayah_pembinaan`)
  - Kantor (`kantor_id` → join ke `ajis_kantor`)
  - Wali (`nama_lengkap_wali` atau `telp_dihubungi`)
  - Status (`aktif`, `status_tersantuni`)

#### B. PageHeader Component
Referensi: `src/components/ajis/page-header.tsx` (perlu dibuat)
- Breadcrumb navigation
- Title & subtitle
- Action buttons (Tambah, Export)

#### C. StatusBadge Component
Referensi: `src/components/ajis/status-badge.tsx` (perlu dibuat)
- Tone: success (aktif), info (lulus), muted (keluar), warning (pending)

### 4.3 Form Layout (118 Kolom)

Karena jumlah kolom sangat banyak (118), form perlu di-group menjadi sections dengan tabs atau accordion:

#### Suggested Form Structure:
1. **Tab 1: Identitas Dasar** (15 kolom)
2. **Tab 2: Pendidikan** (8 kolom)
3. **Tab 3: Keluarga** (3 kolom)
4. **Tab 4: Data Ayah** (6 kolom)
5. **Tab 5: Data Ibu** (6 kolom)
6. **Tab 6: Data Wali** (5 kolom)
7. **Tab 7: Kontak & Rekening** (6 kolom)
8. **Tab 8: Karakter & Minat** (7 kolom)
9. **Tab 9: Status Program** (8 kolom)
10. **Tab 10: Organisasi** (5 kolom)
11. **Tab 11: Program Peminjaman** (6 kolom)
12. **Tab 12: Tempat Tinggal** (6 kolom)

---

## 5. Data Fetching Patterns

### 5.1 Server-Side Pagination (20 rows/page)
```typescript
// lib/actions/anak.ts
export async function getAnakList(params: {
  page: number;
  pageSize: number;
  search?: string;
  aktif?: string;
  field?: string;
  direction?: 'asc' | 'desc';
}) {
  const session = await auth();
  const user = session?.user;
  
  const result = await anakService.findMany(params, user);
  
  return {
    success: true,
    data: result.data,
    total: result.total,
    totalPages: Math.ceil(result.total / params.pageSize),
  };
}
```

### 5.2 Selective Column Query (Performance)
```typescript
// Jangan SELECT * untuk list - hanya kolom yang ditampilkan
const columns = [
  ajisAnak.id,
  ajisAnak.kodeAnak,
  ajisAnak.namaLengkap,
  ajisAnak.jnsKel,
  ajisAnak.tglLahir,
  ajisAnak.wilayahPembinaanId,
  ajisAnak.kantorId,
  ajisAnak.namaLengkapWali,
  ajisAnak.telpDihubungi,
  ajisAnak.aktif,
  ajisAnak.statusTersantuni,
];

const query = db.select(columns).from(ajisAnak);
```

### 5.3 Join untuk Display Names
```typescript
// Join ke tabel referensi untuk nama wilayah, kantor, desa
const query = db
  .select({
    ...columns,
    namaWilayah: ajisWilayahPembinaan.namaWilayah,
    namaKantor: ajisKantor.nama,
    kodeKantor: ajisKantor.kode,
  })
  .from(ajisAnak)
  .leftJoin(ajisWilayahPembinaan, eq(ajisAnak.wilayahPembinaanId, ajisWilayahPembinaan.id))
  .leftJoin(ajisKantor, eq(ajisAnak.kantorId, ajisKantor.id));
```

---

## 6. Validation Schemas (Zod)

### 6.1 Schema untuk Create
```typescript
// lib/schemas/anak.ts
import { z } from 'zod';

export const anakCreateSchema = z.object({
  // Identitas Dasar
  kodeAnak: z.string().min(1, "Kode anak wajib diisi"),
  nik: z.string().length(16, "NIK harus 16 digit"),
  namaLengkap: z.string().min(3, "Nama lengkap minimal 3 karakter"),
  namaPanggilan: z.string().optional(),
  agama: z.string().optional(),
  jnsKel: z.enum(['l', 'p'], { required_error: "Jenis kelamin wajib dipilih" }),
  tempatLahir: z.string().optional(),
  tglLahir: z.coerce.date({ required_error: "Tanggal lahir wajib diisi" }),
  anakKe: z.number().int().min(1).optional(),
  dariSaudara: z.number().int().min(1).optional(),
  alamat: z.string().optional(),
  desaId: z.number().optional(),
  
  // ... lanjut untuk kolom lain
  
  // Validasi kustom
}).refine((data) => {
  // Validasi NIK unik (cek database)
  return true;
});
```

### 6.2 Schema untuk Update
```typescript
export const anakUpdateSchema = anakCreateSchema.partial().extend({
  id: z.number(), // ID wajib untuk update
});
```

---

## 7. Server Actions (CRUD)

### 7.1 Create Anak
```typescript
export async function createAnak(data: z.infer<typeof anakCreateSchema>) {
  const session = await auth();
  if (!session) return { success: false, error: 'Unauthorized' };
  
  // Validate
  const validated = anakCreateSchema.parse(data);
  
  // Check NIK uniqueness
  const existing = await db.select().from(ajisAnak).where(eq(ajisAnak.nik, validated.nik));
  if (existing.length > 0) {
    return { success: false, error: 'NIK sudah terdaftar' };
  }
  
  // Insert
  const result = await db.insert(ajisAnak).values({
    ...validated,
    createdAt: new Date(),
    updatedAt: new Date(),
  }).returning();
  
  return { success: true, data: result[0] };
}
```

### 7.2 Update Anak
```typescript
export async function updateAnak(id: number, data: z.infer<typeof anakUpdateSchema>) {
  const session = await auth();
  if (!session) return { success: false, error: 'Unauthorized' };
  
  // RBAC check: user boleh edit anak ini?
  const anak = await anakRepository.findById(id);
  if (!anak) return { success: false, error: 'Data tidak ditemukan' };
  
  const hasAccess = await rbacService.canEditAnak(session.user, anak);
  if (!hasAccess) return { success: false, error: 'Forbidden' };
  
  // Update
  const result = await db.update(ajisAnak)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(ajisAnak.id, id))
    .returning();
  
  return { success: true, data: result[0] };
}
```

### 7.3 Delete Anak (Soft Delete)
```typescript
export async function deleteAnak(id: number) {
  const session = await auth();
  if (!session) return { success: false, error: 'Unauthorized' };
  
  // Soft delete: set aktif = 'n'
  const result = await db.update(ajisAnak)
    .set({ aktif: 'n', updatedAt: new Date() })
    .where(eq(ajisAnak.id, id))
    .returning();
  
  return { success: true, data: result[0] };
}
```

---

## 8. Performance Optimization

### 8.1 Query Optimization
- **Selective SELECT:** Hanya kolom yang diperlukan untuk list view
- **Indexed columns:** Gunakan kolom yang sudah di-index untuk filter/sort
- **Server-side pagination:** 20 rows per page
- **RBAC filter di database level:** Bukan di application level

### 8.2 Caching Strategy (Opsional)
- Cache data wilayah/kantor (jarang berubah)
- Cache result pencarian NIK (high read, low write)
- Invalidate cache saat data berubah

### 8.3 Materialized Views (Untuk Laporan)
Jika butuh laporan kompleks dengan banyak joins:
```sql
CREATE MATERIALIZED VIEW mv_anak_laporan AS
SELECT 
  a.id, a.kode_anak, a.nama_lengkap, a.jns_kel, a.tgl_lahir,
  w.nama_wilayah, k.nama_kantor, k.kode as kode_kantor,
  d.nama as nama_desa, kec.nama as nama_kecamatan,
  kab.nama as nama_kabupaten, prop.nama as nama_propinsi
FROM ajis_anak a
LEFT JOIN ajis_wilayah_pembinaan w ON a.wilayah_pembinaan_id = w.id
LEFT JOIN ajis_kantor k ON a.kantor_id = k.id
LEFT JOIN ref_desa d ON a.desa_id = d.id
LEFT JOIN ref_kecamatan kec ON d.kecamatan_id = kec.id
LEFT JOIN ref_kabupaten kab ON kec.kabupaten_id = kab.id
LEFT JOIN ref_propinsi prop ON kab.propinsi_id = prop.id
WHERE a.aktif = 'y';

-- Refresh periodic (misalnya setiap jam)
REFRESH MATERIALIZED VIEW mv_anak_laporan;
```

---

## 9. Testing Strategy

### 9.1 Unit Tests
- Repository: Test RBAC filter logic
- Service: Test business logic (validasi NIK, dll)
- Schema: Test Zod validation

### 9.2 Integration Tests
- Test CRUD end-to-end dengan database test
- Test RBAC: Pastikan user hanya akses data di scope-nya

### 9.3 E2E Tests (Playwright)
- Test flow: Login → List Anak → Filter → View Detail → Edit → Save
- Test RBAC: Login sebagai Korwil → pastikan tidak bisa edit anak di wilayah lain

---

## 10. Dependencies yang Diperlukan

### 10.1 Sudah Ada di Project
- Next.js 15 (App Router)
- React 19
- Drizzle ORM
- PostgreSQL (Neon)
- shadcn/ui components
- Zod (validation)
- React Hook Form

### 10.2 Mungkin Perlu Ditambah
- `date-fns` atau `dayjs` untuk format tanggal
- `lucide-react` untuk icons (sudah ada di shadcn)
- `sonner` untuk toast notifications (sudah ada di referensi)

---

## 11. Task Breakdown (Estimasi)

### Phase 1: Foundation (2-3 hari)
- [ ] Buat struktur folder
- [ ] Setup repository pattern untuk Anak
- [ ] Setup service layer
- [ ] Buat Zod schemas

### Phase 2: List Page (2-3 hari)
- [ ] Buat anak-table component
- [ ] Buat anak-filters component
- [ ] Buat anak-pagination component
- [ ] Implementasi page.tsx dengan data fetching
- [ ] Implementasi RBAC filtering
- [ ] Implementasi search & sort

### Phase 3: Form Pages (4-5 hari)
- [ ] Buat anak-form component dengan tabs/sections
- [ ] Implementasi new/page.tsx
- [ ] Implementasi [id]/page.tsx (detail view)
- [ ] Implementasi [id]/edit/page.tsx
- [ ] Implementasi server actions (create, update)
- [ ] Implementasi form validation

### Phase 4: Integration & Polish (2-3 hari)
- [ ] Integrasi dengan navigation sidebar
- [ ] Add loading states
- [ ] Add error handling
- [ ] Add toast notifications
- [ ] Testing RBAC
- [ ] Performance testing

**Total Estimasi:** 10-14 hari kerja

---

## 12. Catatan Penting

### 12.1 Perbedaan dengan Referensi Zip
- Referensi menggunakan **TanStack Router**, kita menggunakan **Next.js App Router**
- Referensi menggunakan mock data, kita menggunakan **PostgreSQL + Drizzle**
- Pola UI dapat diadopsi, tetapi implementasi data fetching berbeda

### 12.2 Kolom yang Bisa NULL
Banyak kolom di `ajis_anak` bersifat nullable (opsional). Form harus menangani ini dengan baik:
- Field optional tidak required di Zod schema
- UI harus menampilkan placeholder atau dash ("-") untuk nilai null

### 12.3 Integrasi Sistem Eksternal
Kolom seperti `kode_kantor_legacy`, `kode_ijgs_anak`, `upload_gdrive` adalah untuk integrasi dengan sistem lain. Mungkin perlu field khusus atau readonly field di form.

### 12.4 Audit Trail
Pastikan `created_at` dan `updated_at` selalu di-update secara otomatis:
- Di Drizzle schema: `.defaultNow()`
- Di server action: set manual jika perlu

---

## 13. Checklist Implementasi

### Database
- [ ] Verifikasi schema `ajis_anak` di `lib/db/schema.ts`
- [ ] Verifikasi relations di `lib/db/relations.ts`
- [ ] Pastikan index sudah ada di database

### Backend
- [ ] Buat `AnakRepository` dengan RBAC filter
- [ ] Buat `AnakService` dengan business logic
- [ ] Buat Zod schemas untuk create/update
- [ ] Buat server actions: getAnakList, getAnakById, createAnak, updateAnak, deleteAnak

### Frontend - List
- [ ] Buat `anak-table.tsx` dengan kolom selective
- [ ] Buat `anak-filters.tsx` dengan search, filter wilayah, filter kantor, filter status
- [ ] Buat `anak-pagination.tsx`
- [ ] Implementasi `page.tsx` dengan Suspense
- [ ] Implementasi `loading.tsx`

### Frontend - Form
- [ ] Buat `anak-form.tsx` dengan tabs/sections untuk 118 kolom
- [ ] Implementasi `new/page.tsx`
- [ ] Implementasi `[id]/page.tsx` (detail view)
- [ ] Implementasi `[id]/edit/page.tsx`

### RBAC
- [ ] Test sebagai Super Admin (lihat semua data)
- [ ] Test sebagai Branch Admin (hanya data kantornya)
- [ ] Test sebagai Korwil (hanya data wilayahnya, read-only)

### Performance
- [ ] Verify query menggunakan EXPLAIN ANALYZE
- [ ] Pastikan index digunakan untuk filter/sort
- [ ] Test dengan data dummy 1000+ rows

### Testing
- [ ] Unit test untuk repository
- [ ] Unit test untuk service
- [ ] Integration test untuk CRUD
- [ ] E2E test dengan Playwright (opsional)

---

## 14. Referensi

### Dokumentasi Project
- `docs/01_PRODUCT_REQUIREMENT_DOCUMENT.md` - PRD lengkap
- `docs/02_ENTITY_RELATIONSHIP_DIAGRAM.md` - ERD lengkap
- `docs/03_TECHNICAL_IMPLEMENTATION_GUIDE.md` - Guide teknis

### Database
- `db/database_ajis.sql` - Schema PostgreSQL lengkap
- `db/schema.ts` - Drizzle ORM definitions
- `db/relations.ts` - Drizzle relations

### Referensi UI (Zip)
- `docs/rz_ajis_extracted/stistla-builder-buddy-main/src/routes/dashboard.anak.tsx`
- `docs/rz_ajis_extracted/stistla-builder-buddy-main/src/lib/mock-data.ts`
- `docs/rz_ajis_extracted/stistla-builder-buddy-main/src/components/ajis/`

---

## 15. Next Steps

Setelah dokumen ini disetujui:
1. Mulai dengan **Phase 1: Foundation** (setup repository, service, schemas)
2. Lanjut ke **Phase 2: List Page** (implementasi table dengan data fetching)
3. Lanjut ke **Phase 3: Form Pages** (implementasi form dengan tabs)
4. Selesaikan dengan **Phase 4: Integration & Polish** (testing, RBAC, performance)

---

*Dokumen ini dibuat berdasarkan analisis menyeluruh terhadap semua file di folder `docs`, `db`, dan referensi dari file zip `rz_ajis (reference from loveable).zip`.*
