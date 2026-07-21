import { eq, ilike, and, count, desc, asc, sql, type SQL } from 'drizzle-orm';
import { pembinaanDokumentasi } from '@/db/schema';
import { db, getOffset, safeQuery, type ListParams } from './base.repository';

/**
 * Pembinaan Dokumentasi Repository
 * Tanggung jawab:
 *   - Query data pembinaan_dokumentasi
 *   - Pagination, filter, search
 *   - Tidak mengandung logika bisnis
 */

export type PembinaanDokumentasiRow = typeof pembinaanDokumentasi.$inferSelect;
export type NewPembinaanDokumentasi = typeof pembinaanDokumentasi.$inferInsert;

export type ListPembinaanDokumentasiParams = ListParams & {
  /** Filter RBAC hasil dari filterByRole() */
  rbacFilter?: SQL;
  semesterId?: number;
  kantorId?: number;
  wilayahPembinaanId?: number;
  field?: string;
  direction?: 'asc' | 'desc';
};

// ─── READ ────────────────────────────────────────────────────────────────────

export async function findPembinaanDokumentasiById(id: number): Promise<PembinaanDokumentasiRow | null> {
  return safeQuery(`findPembinaanDokumentasiById(${id})`, async () => {
    const result = await db
      .select()
      .from(pembinaanDokumentasi)
      .where(eq(pembinaanDokumentasi.id, BigInt(id)))
      .limit(1);
    return result[0] ?? null;
  });
}

export async function listPembinaanDokumentasi(params: ListPembinaanDokumentasiParams) {
  const { page, pageSize, search, rbacFilter, semesterId, kantorId, wilayahPembinaanId, field, direction = 'desc' } = params;

  return safeQuery(`listPembinaanDokumentasi(page=${page}, search=${search ?? '-'})`, async () => {
    const conditions: SQL[] = [];

    if (rbacFilter) conditions.push(rbacFilter);
    if (semesterId) conditions.push(eq(pembinaanDokumentasi.semesterId, semesterId));
    if (kantorId) conditions.push(eq(pembinaanDokumentasi.kantorId, kantorId));
    if (wilayahPembinaanId) conditions.push(eq(pembinaanDokumentasi.wilayahPembinaanId, wilayahPembinaanId));
    if (search) {
      conditions.push(
        sql`(${pembinaanDokumentasi.nama} ILIKE ${'%' + search + '%'} OR ${pembinaanDokumentasi.uploadGdrive} ILIKE ${'%' + search + '%'})`
      );
    }

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    // Determine sort column and direction
    let orderBy;
    if (field === 'nama') {
      orderBy = direction === 'asc' ? asc(pembinaanDokumentasi.nama) : desc(pembinaanDokumentasi.nama);
    } else if (field === 'semesterId') {
      orderBy = direction === 'asc' ? asc(pembinaanDokumentasi.semesterId) : desc(pembinaanDokumentasi.semesterId);
    } else {
      orderBy = direction === 'asc' ? asc(pembinaanDokumentasi.nama) : desc(pembinaanDokumentasi.nama);
    }

    const [rows, totalResult] = await Promise.all([
      db
        .select()
        .from(pembinaanDokumentasi)
        .where(where)
        .orderBy(orderBy)
        .limit(pageSize)
        .offset(getOffset(page, pageSize)),
      db
        .select({ total: count() })
        .from(pembinaanDokumentasi)
        .where(where),
    ]);

    return {
      data: rows,
      total: Number(totalResult[0]?.total ?? 0),
      page,
      pageSize,
    };
  });
}

export async function listPembinaanDokumentasiBySemester(semesterId: number) {
  return safeQuery(`listPembinaanDokumentasiBySemester(${semesterId})`, async () => {
    const result = await db
      .select()
      .from(pembinaanDokumentasi)
      .where(eq(pembinaanDokumentasi.semesterId, semesterId))
      .orderBy(desc(pembinaanDokumentasi.id));
    return result;
  });
}

// ─── CREATE ──────────────────────────────────────────────────────────────────

export async function createPembinaanDokumentasi(data: NewPembinaanDokumentasi): Promise<PembinaanDokumentasiRow> {
  return safeQuery('createPembinaanDokumentasi()', async () => {
    const result = await db.insert(pembinaanDokumentasi).values(data).returning();
    return result[0];
  });
}

// ─── UPDATE ──────────────────────────────────────────────────────────────────

export async function updatePembinaanDokumentasi(id: number, data: Partial<NewPembinaanDokumentasi>): Promise<PembinaanDokumentasiRow> {
  return safeQuery(`updatePembinaanDokumentasi(${id})`, async () => {
    const result = await db
      .update(pembinaanDokumentasi)
      .set(data)
      .where(eq(pembinaanDokumentasi.id, BigInt(id)))
      .returning();
    return result[0];
  });
}

// ─── DELETE ──────────────────────────────────────────────────────────────────

export async function deletePembinaanDokumentasi(id: number): Promise<PembinaanDokumentasiRow> {
  return safeQuery(`deletePembinaanDokumentasi(${id})`, async () => {
    const result = await db
      .delete(pembinaanDokumentasi)
      .where(eq(pembinaanDokumentasi.id, BigInt(id)))
      .returning();
    return result[0];
  });
}
