# IMPLEMENTASI MENU WILAYAH PEMBINAAN
## AJIS (Anak Juara Information System) - Wilayah Pembinaan Feature Implementation

**Document Type:** Implementation Guide  
**Feature:** Wilayah Pembinaan (Coaching Regions) Management  
**Last Updated:** July 2026  
**Status:** Analysis Complete - Ready for Implementation

---

## 1. DATA CORRELATION ANALYSIS

### 1.1 Core Entity: `ajis_wilayah_pembinaan`

**Table Structure:**
```typescript
{
  id: BIGSERIAL PK,
  kode_lama: INTEGER UNIQUE (legacy ID),
  nama_wilayah: VARCHAR(150) UNIQUE NOT NULL,
  alamat_wilayah: TEXT,
  kantor_id: BIGINT FK → ajis_kantor(id),
  desa_id: BIGINT FK → ref_desa(id),
  status_approve: VARCHAR(1) (y/t/NULL),
  aktif: VARCHAR(1) DEFAULT 'y',
  user_insert: VARCHAR(50),
  date_insert: DATE,
  user_update: VARCHAR(50),
  date_update: DATE
}
```

**Indexes:**
- `idx_wilayah_aktif` - Partial index for active records
- `idx_wilayah_desa` - Geographic filtering
- `idx_wilayah_kantor` - Office-based filtering  
- `idx_wilayah_nama_trgm` - Full-text search with GIN trigram

---

### 1.2 Primary Relationships (One-to-Many)

**Parent Relationships:**
- **ajis_kantor** → One office can have multiple wilayah pembinaan
- **ref_desa** → Geographic location (desa → kecamatan → kabupaten → propinsi)

**Child Relationships:**
- **ajis_anak** → Children assigned to coaching regions (RBAC critical)
- **ajis_sdm_wilayah** → Staff/facilitators assigned to regions
- **ajis_sdm_wilayah_riwayat** → Staff assignment history
- **ajis_user_wilayah_pembinaan** → Korwil user-region assignments (RBAC junction table)

**Operational Data Relationships:**
- **ajis_session** → Coaching sessions in regions
- **hafalan_anak** → Quran memorization tracking by region
- **penilaian_anak** → Student assessments by region
- **pembinaan** → Coaching programs by region
- **pembinaan_dokumentasi** → Program documentation by region
- **laporan_semester** → Semester reports by region
- **laporan_prestasi** → Achievement reports by region
- **pemasangan** → Sponsorship placements by region
- **donasi_transaksi** → Donation transactions by region
- **penyaluran** → Fund disbursements by region
- **pengajuan_pergantian_anak** → Child replacement requests by region
- **materi_pembinaan** → Coaching materials by region
- **peminjaman_ajis_anak** → Child borrowing records by region
- **ajis_survey** → Survey data by region

---

### 1.3 RBAC Integration Matrix

| User Role | Access Level | Data Scope | WHERE Clause Pattern |
|-----------|-------------|------------|---------------------|
| **Super Admin** (id=1) | Full CRUD | All regions | No filter applied |
| **Branch Admin** (id=2) | Full CRUD | Regions under their office | `WHERE kantor_id = :user_kantor_id` |
| **Regional Coordinator** (id=9) | Read Only | Assigned regions only | `WHERE id IN (SELECT wilayah_pembinaan_id FROM ajis_user_wilayah_pembinaan WHERE user_id = :user_id)` |

**RBAC Implementation Points:**
1. **Repository Layer**: Auto-inject WHERE clause based on user role
2. **Server Actions**: Validate user permissions before mutations
3. **UI Components**: Hide/show controls based on role
4. **Middleware**: Route protection for `/dashboard/wilayah`

---

## 2. IMPLEMENTATION ARCHITECTURE

### 2.1 Folder Structure

```
app/dashboard/wilayah/
├── page.tsx                          # List page with table
├── new/
│   └── page.tsx                      # Create form
├── [id]/
│   ├── page.tsx                      # Detail view
│   └── edit/
│       └── page.tsx                  # Edit form
└── components/
    ├── wilayah-table.tsx             # Server Component table
    ├── wilayah-filters.tsx           # Client Component filters
    ├── wilayah-form.tsx              # Form component
    └── wilayah-detail.tsx            # Detail component
```

---

### 2.2 Data Layer Implementation

#### Repository Pattern (`lib/repositories/wilayah.repository.ts`)

```typescript
import { BaseRepository } from './base.repository';
import { ajisWilayahPembinaan, ajisKantor, refDesa, refKecamatan, refKabupaten, refPropinsi } from '@/db/schema';
import { eq, and, inArray, sql } from 'drizzle-orm';

export class WilayahPembinaanRepository extends BaseRepository {
  constructor() {
    super(ajisWilayahPembinaan);
  }

  // List with RBAC filtering
  async listWithRbac(user: any, params: {
    page?: number;
    limit?: number;
    search?: string;
    kantorId?: number;
    aktif?: string;
  }) {
    const { page = 1, limit = 20, search, kantorId, aktif } = params;
    const offset = (page - 1) * limit;

    // Build WHERE conditions
    const conditions = [];

    // RBAC filter based on user role
    if (user.id_group_user === 2) {
      // Branch Admin: only their office's regions
      conditions.push(eq(ajisWilayahPembinaan.kantorId, user.kantor_id));
    } else if (user.id_group_user === 9) {
      // Korwil: only assigned regions
      conditions.push(
        inArray(
          ajisWilayahPembinaan.id,
          sql`(SELECT wilayah_pembinaan_id FROM ajis_user_wilayah_pembinaan WHERE user_id = ${user.id})`
        )
      );
    }
    // Super Admin: no filter

    // Additional filters
    if (kantorId) {
      conditions.push(eq(ajisWilayahPembinaan.kantorId, kantorId));
    }

    if (aktif) {
      conditions.push(eq(ajisWilayahPembinaan.aktif, aktif));
    }

    if (search) {
      conditions.push(
        sql`nama_wilayah ILIKE ${`%${search}%`}`
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Execute query with joins for related data
    const [data, total] = await Promise.all([
      this.db
        .select({
          id: ajisWilayahPembinaan.id,
          kodeLama: ajisWilayahPembinaan.kodeLama,
          namaWilayah: ajisWilayahPembinaan.namaWilayah,
          alamatWilayah: ajisWilayahPembinaan.alamatWilayah,
          kantorId: ajisWilayahPembinaan.kantorId,
          kantorNama: ajisKantor.nama,
          desaId: ajisWilayahPembinaan.desaId,
          desaNama: refDesa.nama,
          kecamatanNama: refKecamatan.nama,
          kabupatenNama: refKabupaten.nama,
          propinsiNama: refPropinsi.nama,
          statusApprove: ajisWilayahPembinaan.statusApprove,
          aktif: ajisWilayahPembinaan.aktif,
          dateInsert: ajisWilayahPembinaan.dateInsert,
        })
        .from(ajisWilayahPembinaan)
        .leftJoin(ajisKantor, eq(ajisWilayahPembinaan.kantorId, ajisKantor.id))
        .leftJoin(refDesa, eq(ajisWilayahPembinaan.desaId, refDesa.id))
        .leftJoin(refKecamatan, eq(refDesa.kecamatanId, refKecamatan.id))
        .leftJoin(refKabupaten, eq(refKecamatan.kabupatenId, refKabupaten.id))
        .leftJoin(refPropinsi, eq(refKabupaten.propinsiId, refPropinsi.id))
        .where(whereClause)
        .orderBy(ajisWilayahPembinaan.namaWilayah)
        .limit(limit)
        .offset(offset),
      
      this.db
        .select({ count: sql`count(*)` })
        .from(ajisWilayahPembinaan)
        .where(whereClause)
        .then(r => Number(r[0].count))
    ]);

    return { data, total, page, limit };
  }

  // Get by ID with full relations
  async findByIdWithRelations(id: number) {
    return this.db
      .select({
        id: ajisWilayahPembinaan.id,
        kodeLama: ajisWilayahPembinaan.kodeLama,
        namaWilayah: ajisWilayahPembinaan.namaWilayah,
        alamatWilayah: ajisWilayahPembinaan.alamatWilayah,
        kantorId: ajisWilayahPembinaan.kantorId,
        kantorNama: ajisKantor.nama,
        desaId: ajisWilayahPembinaan.desaId,
        desaNama: refDesa.nama,
        kecamatanNama: refKecamatan.nama,
        kabupatenNama: refKabupaten.nama,
        propinsiNama: refPropinsi.nama,
        statusApprove: ajisWilayahPembinaan.statusApprove,
        aktif: ajisWilayahPembinaan.aktif,
        userInsert: ajisWilayahPembinaan.userInsert,
        dateInsert: ajisWilayahPembinaan.dateInsert,
        userUpdate: ajisWilayahPembinaan.userUpdate,
        dateUpdate: ajisWilayahPembinaan.dateUpdate,
      })
      .from(ajisWilayahPembinaan)
      .leftJoin(ajisKantor, eq(ajisWilayahPembinaan.kantorId, ajisKantor.id))
      .leftJoin(refDesa, eq(ajisWilayahPembinaan.desaId, refDesa.id))
      .leftJoin(refKecamatan, eq(refDesa.kecamatanId, refKecamatan.id))
      .leftJoin(refKabupaten, eq(refKecamatan.kabupatenId, refKabupaten.id))
      .leftJoin(refPropinsi, eq(refKabupaten.propinsiId, refPropinsi.id))
      .where(eq(ajisWilayahPembinaan.id, id))
      .limit(1);
  }

  // Get available kantor for dropdown (RBAC filtered)
  async getAvailableKantor(user: any) {
    if (user.id_group_user === 1) {
      // Super Admin: all kantor
      return this.db.select().from(ajisKantor).where(eq(ajisKantor.aktif, 'y'));
    } else if (user.id_group_user === 2) {
      // Branch Admin: only their kantor
      return this.db.select().from(ajisKantor).where(
        and(
          eq(ajisKantor.id, user.kantor_id),
          eq(ajisKantor.aktif, 'y')
        )
      );
    }
    // Korwil: no access to create wilayah
    return [];
  }

  // Get anak count by wilayah (for statistics)
  async getAnakCountByWilayah(wilayahId: number) {
    const result = await this.db
      .select({ count: sql`count(*)` })
      .from(ajisAnak)
      .where(eq(ajisAnak.wilayahPembinaanId, wilayahId));
    return Number(result[0].count);
  }

  // Get SDM count by wilayah
  async getSdmCountByWilayah(wilayahId: number) {
    const result = await this.db
      .select({ count: sql`count(*)` })
      .from(ajisSdmWilayah)
      .where(eq(ajisSdmWilayah.penugasanWilayahId, wilayahId));
    return Number(result[0].count);
  }
}
```

---

#### Server Actions (`app/actions/wilayah.ts`)

```typescript
"use server";

import { auth } from "@/lib/auth";
import { wilayahRepository } from "@/lib/repositories/wilayah.repository";
import { wilayahSchema, wilayahUpdateSchema } from "@/lib/validation/schemas";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

// Get wilayah list with RBAC
export async function getWilayahList(params: {
  page?: number;
  limit?: number;
  search?: string;
  kantorId?: number;
  aktif?: string;
}) {
  const session = await auth();
  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  const repository = new WilayahPembinaanRepository();
  return repository.listWithRbac(session.user, params);
}

// Get wilayah by ID
export async function getWilayahById(id: number) {
  const session = await auth();
  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  const repository = new WilayahPembinaanRepository();
  const wilayah = await repository.findByIdWithRelations(id);

  if (!wilayah.length) {
    throw new Error("Wilayah not found");
  }

  // RBAC check: user can only view wilayah in their scope
  if (session.user.id_group_user === 2) {
    if (wilayah[0].kantorId !== session.user.kantor_id) {
      throw new Error("Access denied");
    }
  } else if (session.user.id_group_user === 9) {
    const userWilayahIds = await repository.getUserWilayahIds(session.user.id);
    if (!userWilayahIds.includes(id)) {
      throw new Error("Access denied");
    }
  }

  return wilayah[0];
}

// Create new wilayah
export async function createWilayah(formData: FormData) {
  const session = await auth();
  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  // RBAC check: only Super Admin and Branch Admin can create
  if (session.user.id_group_user === 9) {
    throw new Error("Korwil cannot create wilayah");
  }

  // Validate form data
  const rawData = {
    namaWilayah: formData.get('namaWilayah') as string,
    alamatWilayah: formData.get('alamatWilayah') as string,
    kantorId: formData.get('kantorId') ? Number(formData.get('kantorId')) : null,
    desaId: formData.get('desaId') ? Number(formData.get('desaId')) : null,
    statusApprove: formData.get('statusApprove') as string,
    aktif: formData.get('aktif') as string || 'y',
  };

  const validatedData = wilayahSchema.parse(rawData);

  // Branch Admin can only create wilayah for their kantor
  if (session.user.id_group_user === 2) {
    if (validatedData.kantorId !== session.user.kantor_id) {
      throw new Error("Can only create wilayah for your office");
    }
  }

  const repository = new WilayahPembinaanRepository();
  const result = await repository.create({
    ...validatedData,
    userInsert: session.user.username,
    dateInsert: new Date(),
  });

  revalidatePath('/dashboard/wilayah');
  return result;
}

// Update wilayah
export async function updateWilayah(id: number, formData: FormData) {
  const session = await auth();
  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  // RBAC check
  const repository = new WilayahPembinaanRepository();
  const existing = await repository.findById(id);
  
  if (!existing) {
    throw new Error("Wilayah not found");
  }

  if (session.user.id_group_user === 2) {
    if (existing.kantorId !== session.user.kantor_id) {
      throw new Error("Can only update wilayah for your office");
    }
  } else if (session.user.id_group_user === 9) {
    throw new Error("Korwil cannot update wilayah");
  }

  // Validate form data
  const rawData = {
    namaWirayah: formData.get('namaWilayah') as string,
    alamatWilayah: formData.get('alamatWilayah') as string,
    kantorId: formData.get('kantorId') ? Number(formData.get('kantorId')) : null,
    desaId: formData.get('desaId') ? Number(formData.get('desaId')) : null,
    statusApprove: formData.get('statusApprove') as string,
    aktif: formData.get('aktif') as string,
  };

  const validatedData = wilayahUpdateSchema.parse(rawData);

  const result = await repository.update(id, {
    ...validatedData,
    userUpdate: session.user.username,
    dateUpdate: new Date(),
  });

  revalidatePath('/dashboard/wilayah');
  revalidatePath(`/dashboard/wilayah/${id}`);
  return result;
}

// Delete wilayah
export async function deleteWilayah(id: number) {
  const session = await auth();
  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  // RBAC check: only Super Admin can delete
  if (session.user.id_group_user !== 1) {
    throw new Error("Only Super Admin can delete wilayah");
  }

  const repository = new WilayahPembinaanRepository();
  
  // Check if wilayah has anak assigned
  const anakCount = await repository.getAnakCountByWilayah(id);
  if (anakCount > 0) {
    throw new Error("Cannot delete wilayah with assigned children");
  }

  await repository.delete(id);
  revalidatePath('/dashboard/wilayah');
}

// Get available kantor for dropdown
export async function getAvailableKantor() {
  const session = await auth();
  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  const repository = new WilayahPembinaanRepository();
  return repository.getAvailableKantor(session.user);
}
```

---

#### Validation Schemas (`lib/validation/schemas.ts`)

```typescript
import { z } from "zod";

// Wilayah Pembinaan validation schema
export const wilayahSchema = z.object({
  namaWilayah: z.string().min(3, "Nama wilayah minimal 3 karakter").max(150),
  alamatWilayah: z.string().optional(),
  kantorId: z.number().nullable().optional(),
  desaId: z.number().nullable().optional(),
  statusApprove: z.enum(['y', 't']).nullable().optional(),
  aktif: z.enum(['y', 'n']).default('y'),
});

export const wilayahUpdateSchema = wilayahSchema.partial();
```

---

### 2.3 UI Components Implementation

#### List Page (`app/dashboard/wilayah/page.tsx`)

```typescript
import { Suspense } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { WilayahTable } from "./components/wilayah-table";
import { WilayahTableSkeleton } from "./components/wilayah-table-skeleton";
import { auth } from "@/lib/auth";

export default async function WilayahPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; search?: string; kantorId?: string; aktif?: string }>;
}) {
  const session = await auth();
  const params = await searchParams;
  const currentPage = parseInt(params.page || "1");
  const search = params.search;
  const kantorId = params.kantorId ? parseInt(params.kantorId) : undefined;
  const aktif = params.aktif;

  // RBAC check: Korwil can only view, not create
  const canCreate = session?.user?.id_group_user !== 9;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Wilayah Pembinaan"
        description="Kelola area pembinaan dan penugasan regional"
      >
        {canCreate && (
          <Button asChild>
            <a href="/dashboard/wilayah/new">
              <Plus className="mr-2 h-4 w-4" />
              Tambah Wilayah
            </a>
          </Button>
        )}
      </PageHeader>

      <Suspense fallback={<WilayahTableSkeleton />}>
        <WilayahTable
          currentPage={currentPage}
          search={search}
          kantorId={kantorId}
          aktif={aktif}
        />
      </Suspense>
    </div>
  );
}
```

---

#### Table Component (`app/dashboard/wilayah/components/wilayah-table.tsx`)

```typescript
"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MoreHorizontal, Edit, Trash2, Eye } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/ropdown-menu";
import { toast } from "sonner";

interface WilayahTableProps {
  currentPage: number;
  search?: string;
  kantorId?: number;
  aktif?: string;
}

export function WilayahTable({
  currentPage,
  search,
  kantorId,
  aktif,
}: WilayahTableProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [data, setData] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  // Fetch data on mount and when params change
  useEffect(() => {
    fetchData();
  }, [currentPage, search, kantorId, aktif]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        ...(search && { search }),
        ...(kantorId && { kantorId: kantorId.toString() }),
        ...(aktif && { aktif }),
      });

      const response = await fetch(`/api/wilayah?${params}`);
      const result = await response.json();
      setData(result.data);
      setTotal(result.total);
    } catch (error) {
      toast.error("Gagal memuat data wilayah");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Apakah Anda yakin ingin menghapus wilayah ini?")) {
      return;
    }

    try {
      const response = await fetch(`/api/wilayah/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Gagal menghapus wilayah");
      }

      toast.success("Wilayah berhasil dihapus");
      fetchData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal menghapus wilayah");
    }
  };

  const updatePage = (page: number) => {
    const params = new URLSearchParams(searchParams);
    params.set("page", page.toString());
    router.push(`/dashboard/wilayah?${params}`);
  };

  if (loading) {
    return <WilayahTableSkeleton />;
  }

  return (
    <div className="space-y-4">
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>No</TableHead>
              <TableHead>Nama Wilayah</TableHead>
              <TableHead>Kantor</TableHead>
              <TableHead>Lokasi</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Aktif</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((wilayah, idx) => (
              <TableRow key={wilayah.id}>
                <TableCell>{(currentPage - 1) * 20 + idx + 1}</TableCell>
                <TableCell className="font-medium">{wilayah.namaWilayah}</TableCell>
                <TableCell>{wilayah.kantorNama || '-'}</TableCell>
                <TableCell>
                  {wilayah.desaNama && (
                    <span className="text-sm">
                      {wilayah.desaNama}, {wilayah.kecamatanNama}, {wilayah.kabupatenNama}
                    </span>
                  )}
                </TableCell>
                <TableCell>
                  <Badge variant={wilayah.statusApprove === 'y' ? 'default' : 'secondary'}>
                    {wilayah.statusApprove === 'y' ? 'Approved' : 'Pending'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={wilayah.aktif === 'y' ? 'default' : 'destructive'}>
                    {wilayah.aktif === 'y' ? 'Aktif' : 'Nonaktif'}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <a href={`/dashboard/wilayah/${wilayah.id}`}>
                          <Eye className="mr-2 h-4 w-4" />
                          Detail
                        </a>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <a href={`/dashboard/wilayah/${wilayah.id}/edit`}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </a>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleDelete(wilayah.id)}
                        className="text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Hapus
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Showing {(currentPage - 1) * 20 + 1} to {Math.min(currentPage * 20, total)} of {total} results
        </p>
        <div className="flex gap-2">
          <Button
            variant="outline"
            disabled={currentPage === 1}
            onClick={() => updatePage(currentPage - 1)}
          >
            Sebelumnya
          </Button>
          <Button
            variant="outline"
            disabled={currentPage * 20 >= total}
            onClick={() => updatePage(currentPage + 1)}
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

#### Form Component (`app/dashboard/wilayah/components/wilayah-form.tsx`)

```typescript
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { wilayahSchema, wilayahUpdateSchema } from "@/lib/validation/schemas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface WilayahFormProps {
  initialData?: any;
  isEdit?: boolean;
}

export function WilayahForm({ initialData, isEdit = false }: WilayahFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [kantorList, setKantorList] = useState<any[]>([]);
  const [desaList, setDesaList] = useState<any[]>([]);

  const form = useForm({
    resolver: zodResolver(isEdit ? wilayahUpdateSchema : wilayahSchema),
    defaultValues: initialData || {
      namaWilayah: "",
      alamatWilayah: "",
      kantorId: null,
      desaId: null,
      statusApprove: null,
      aktif: "y",
    },
  });

  // Fetch kantor list on mount
  useEffect(() => {
    fetchKantorList();
    fetchDesaList();
  }, []);

  const fetchKantorList = async () => {
    try {
      const response = await fetch("/api/wilayah/kantor");
      const data = await response.json();
      setKantorList(data);
    } catch (error) {
      toast.error("Gagal memuat data kantor");
    }
  };

  const fetchDesaList = async () => {
    try {
      const response = await fetch("/api/referensi/desa");
      const data = await response.json();
      setDesaList(data);
    } catch (error) {
      toast.error("Gagal memuat data desa");
    }
  };

  const onSubmit = async (values: any) => {
    try {
      setLoading(true);

      const formData = new FormData();
      Object.entries(values).forEach(([key, value]) => {
        formData.append(key, value as string);
      });

      const url = isEdit
        ? `/api/wilayah/${initialData.id}`
        : "/api/wilayah";
      const method = isEdit ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Gagal menyimpan wilayah");
      }

      toast.success(isEdit ? "Wilayah berhasil diperbarui" : "Wilayah berhasil ditambahkan");
      router.push("/dashboard/wilayah");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal menyimpan wilayah");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isEdit ? "Edit Wilayah" : "Tambah Wilayah Baru"}</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="namaWilayah"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nama Wilayah</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Masukkan nama wilayah" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="alamatWilayah"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Alamat Wilayah</FormLabel>
                  <FormControl>
                    <Textarea {...field} placeholder="Masukkan alamat wilayah" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="kantorId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Kantor</FormLabel>
                  <Select onValueChange={(value) => field.onChange(value ? Number(value) : null)}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih kantor" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {kantorList.map((kantor) => (
                        <SelectItem key={kantor.id} value={kantor.id.toString()}>
                          {kantor.nama}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="desaId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Lokasi (Desa)</FormLabel>
                  <Select onValueChange={(value) => field.onChange(value ? Number(value) : null)}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih desa" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {desaList.map((desa) => (
                        <SelectItem key={desa.id} value={desa.id.toString()}>
                          {desa.nama}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="statusApprove"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status Approve</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="y">Approved</SelectItem>
                      <SelectItem value="t">Pending</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="aktif"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="y">Aktif</SelectItem>
                      <SelectItem value="n">Nonaktif</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-2 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
              >
                Batal
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Menyimpan..." : isEdit ? "Update" : "Simpan"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
```

---

## 3. API ROUTES IMPLEMENTATION

### 3.1 List API (`app/api/wilayah/route.ts`)

```typescript
import { NextRequest, NextResponse } from "next/server";
import { getWilayahList } from "@/app/actions/wilayah";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const search = searchParams.get("search") || undefined;
    const kantorId = searchParams.get("kantorId") ? parseInt(searchParams.get("kantorId")!) : undefined;
    const aktif = searchParams.get("aktif") || undefined;

    const result = await getWilayahList({ page, search, kantorId, aktif });
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const result = await createWilayah(formData);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
```

---

### 3.2 Detail API (`app/api/wilayah/[id]/route.ts`)

```typescript
import { NextRequest, NextResponse } from "next/server";
import { getWilayahById, updateWilayah, deleteWilayah } from "@/app/actions/wilayah";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    const result = await getWilayahById(id);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    const formData = await request.formData();
    const result = await updateWilayah(id, formData);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    await deleteWilayah(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
```

---

## 4. TESTING STRATEGY

### 4.1 Unit Tests

```typescript
// __tests__/repositories/wilayah.repository.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { WilayahPembinaanRepository } from '@/lib/repositories/wilayah.repository';

describe('WilayahPembinaanRepository', () => {
  let repository: WilayahPembinaanRepository;

  beforeEach(() => {
    repository = new WilayahPembinaanRepository();
  });

  it('should list wilayah with RBAC filter for Branch Admin', async () => {
    const user = { id: 1, id_group_user: 2, kantor_id: 15 };
    const result = await repository.listWithRbac(user, { page: 1 });
    
    expect(result.data).toBeDefined();
    expect(result.data.every(w => w.kantorId === 15)).toBe(true);
  });

  it('should list all wilayah for Super Admin', async () => {
    const user = { id: 1, id_group_user: 1 };
    const result = await repository.listWithRbac(user, { page: 1 });
    
    expect(result.data).toBeDefined();
    expect(result.data.length).toBeGreaterThan(0);
  });

  it('should get wilayah by ID with relations', async () => {
    const result = await repository.findByIdWithRelations(1);
    
    expect(result).toBeDefined();
    expect(result[0]).toHaveProperty('kantorNama');
    expect(result[0]).toHaveProperty('desaNama');
  });
});
```

---

### 4.2 Integration Tests

```typescript
// __tests__/api/wilayah.test.ts
import { describe, it, expect } from 'vitest';
import { GET, POST } from '@/app/api/wilayah/route';

describe('Wilayah API', () => {
  it('should GET wilayah list with pagination', async () => {
    const request = new Request('http://localhost:3000/api/wilayah?page=1');
    const response = await GET(request);
    const data = await response.json();
    
    expect(response.status).toBe(200);
    expect(data.data).toBeDefined();
    expect(data.total).toBeDefined();
  });

  it('should POST new wilayah with valid data', async () => {
    const formData = new FormData();
    formData.append('namaWilayah', 'Wilayah Test');
    formData.append('aktif', 'y');
    
    const request = new Request('http://localhost:3000/api/wilayah', {
      method: 'POST',
      body: formData,
    });
    
    const response = await POST(request);
    const data = await response.json();
    
    expect(response.status).toBe(200);
    expect(data.id).toBeDefined();
  });
});
```

---

### 4.3 E2E Tests (Playwright)

```typescript
// e2e/wilayah.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Wilayah Pembinaan Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login as Super Admin
    await page.goto('/login');
    await page.fill('input[name="username"]', 'superadmin');
    await page.fill('input[name="password"]', 'password');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
  });

  test('should display wilayah list', async ({ page }) => {
    await page.goto('/dashboard/wilayah');
    await expect(page.locator('table')).toBeVisible();
    await expect(page.locator('tbody tr')).toHaveCount.greaterThan(0);
  });

  test('should create new wilayah', async ({ page }) => {
    await page.goto('/dashboard/wilayah');
    await page.click('text=Tambah Wilayah');
    
    await page.fill('input[name="namaWilayah"]', 'Wilayah Test E2E');
    await page.selectOption('select[name="kantorId"]', '1');
    await page.click('button[type="submit"]');
    
    await expect(page.locator('text=Wilayah berhasil ditambahkan')).toBeVisible();
  });

  test('should edit existing wilayah', async ({ page }) => {
    await page.goto('/dashboard/wilayah');
    await page.click('tbody tr:first-child button[aria-label="More options"]');
    await page.click('text=Edit');
    
    await page.fill('input[name="namaWilayah"]', 'Wilayah Updated');
    await page.click('button[type="submit"]');
    
    await expect(page.locator('text=Wilayah berhasil diperbarui')).toBeVisible();
  });

  test('should delete wilayah', async ({ page }) => {
    await page.goto('/dashboard/wilayah');
    await page.click('tbody tr:first-child button[aria-label="More options"]');
    await page.click('text=Hapus');
    
    // Handle confirmation dialog
    page.on('dialog', dialog => dialog.accept());
    
    await expect(page.locator('text=Wilayah berhasil dihapus')).toBeVisible();
  });
});
```

---

## 5. PERFORMANCE OPTIMIZATION

### 5.1 Database Query Optimization

**Index Usage:**
- Use `idx_wilayah_aktif` for filtering active records
- Use `idx_wilayah_kantor` for office-based filtering
- Use `idx_wilayah_nama_trgm` for full-text search
- Use composite indexes for combined filters

**Query Patterns:**
```typescript
// Efficient query with proper indexes
const result = await db
  .select()
  .from(ajisWilayahPembinaan)
  .where(
    and(
      eq(ajisWilayahPembinaan.aktif, 'y'),
      eq(ajisWilayahPembinaan.kantorId, kantorId)
    )
  )
  .orderBy(ajisWilayahPembinaan.namaWilayah)
  .limit(20);
```

---

### 5.2 Caching Strategy

**Server-Side Caching:**
```typescript
// Cache wilayah list for 5 minutes
export const revalidate = 300; // 5 minutes

// Or use dynamic caching based on user role
export const dynamic = "force-dynamic";
```

**Client-Side Caching:**
```typescript
// Use SWR or React Query for client-side caching
const { data, error } = useSWR('/api/wilayah', fetcher);
```

---

## 6. SECURITY CONSIDERATIONS

### 6.1 RBAC Enforcement

**Multi-Layer Security:**
1. **Middleware**: Route protection
2. **Server Actions**: Permission validation
3. **Repository**: Data scoping
4. **UI**: Control visibility

**Example:**
```typescript
// Middleware check
if (user.id_group_user === 9 && pathname.startsWith('/dashboard/wilayah/new')) {
  return NextResponse.redirect(new URL('/unauthorized', req.nextUrl));
}

// Server action check
if (session.user.id_group_user === 9) {
  throw new Error("Korwil cannot create wilayah");
}

// Repository filter
if (user.id_group_user === 2) {
  conditions.push(eq(ajisWilayahPembinaan.kantorId, user.kantor_id));
}
```

---

### 6.2 Input Validation

**Zod Schema Validation:**
```typescript
export const wilayahSchema = z.object({
  namaWilayah: z.string().min(3).max(150),
  alamatWilayah: z.string().optional(),
  kantorId: z.number().nullable().optional(),
  desaId: z.number().nullable().optional(),
  statusApprove: z.enum(['y', 't']).nullable().optional(),
  aktif: z.enum(['y', 'n']).default('y'),
});
```

---

### 6.3 SQL Injection Prevention

**Drizzle ORM Protection:**
- All queries use parameterized statements
- No raw SQL concatenation
- Type-safe query building

---

## 7. DEPLOYMENT CHECKLIST

### 7.1 Pre-Deployment

- [ ] All unit tests passing
- [ ] All integration tests passing
- [ ] E2E tests passing
- [ ] Database indexes verified
- [ ] RBAC permissions tested
- [ ] Performance benchmarks met
- [ ] Security audit completed

### 7.2 Post-Deployment

- [ ] Monitor query performance
- [ ] Check RBAC enforcement
- [ ] Verify data integrity
- [ ] Test user permissions
- [ ] Monitor error logs
- [ ] Validate caching behavior

---

## 8. ROLLBACK PLAN

### 8.1 Database Rollback

```sql
-- Revert to previous schema version
DROP TABLE IF EXISTS ajis_wilayah_pembinaan_backup;
CREATE TABLE ajis_wilayah_pembinaan_backup AS SELECT * FROM ajis_wilayah_pembinaan;

-- Restore from backup if needed
TRUNCATE TABLE ajis_wilayah_pembinaan;
INSERT INTO ajis_wilayah_pembinaan SELECT * FROM ajis_wilayah_pembinaan_backup;
```

### 8.2 Code Rollback

```bash
# Revert to previous commit
git revert <commit-hash>

# Or rollback to specific version
git checkout <previous-version-tag>
```

---

## 9. MONITORING & MAINTENANCE

### 9.1 Key Metrics

- **Query Performance**: < 100ms for list queries
- **API Response Time**: < 200ms for CRUD operations
- **Error Rate**: < 1% for all operations
- **Cache Hit Rate**: > 80% for frequently accessed data

### 9.2 Alerting

- **High Error Rate**: Alert if error rate > 5%
- **Slow Queries**: Alert if query time > 500ms
- **RBAC Violations**: Alert on permission denied errors
- **Data Integrity**: Alert on foreign key violations

---

## 10. CONCLUSION

This implementation guide provides a comprehensive approach to building the Wilayah Pembinaan feature with:

- **Strong RBAC Integration**: Multi-layer security with role-based data scoping
- **Performance Optimization**: Proper indexing, caching, and query optimization
- **Type Safety**: TypeScript and Zod for compile-time and runtime validation
- **Testing Coverage**: Unit, integration, and E2E tests
- **Security Best Practices**: Input validation, SQL injection prevention, authentication

The implementation follows the established patterns in the AJIS system and integrates seamlessly with the existing architecture.

---

**Document Status:** Ready for Implementation  
**Next Steps:** Begin implementation following the architecture outlined above  
**Estimated Timeline:** 3-5 days for full implementation and testing
