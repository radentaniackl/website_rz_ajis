import { eq, ilike, and, count, desc, asc, sql, type SQL } from 'drizzle-orm';
import { pembinaan, pembinaanDokumentasi } from '@/lib/db/schema';
import { db, getOffset, safeQuery, type ListParams } from './base.repository';

/**
 * Pembinaan Repository
 * Tanggung jawab:
 *   - Query data pembinaan dengan RBAC scope (kantor_id / wilayah_pembinaan_id)
 *   - Pagination, filter, search
 *   - Tidak mengandung logika bisnis
 */

export type PembinaanRow = typeof pembinaan.$inferSelect;
export type NewPembinaan = typeof pembinaan.$inferInsert;

export type ListPembinaanParams = ListParams & {
  /** Filter RBAC hasil dari filterByRole() */
  rbacFilter?: SQL;
  anakId?: number;
  semesterId?: number;
  field?: string;
  direction?: 'asc' | 'desc';
};

// ─── READ ────────────────────────────────────────────────────────────────────

export async function findPembinaanById(id: number): Promise<PembinaanRow | null> {
  return safeQuery(`findPembinaanById(${id})`, async () => {
    const result = await db
      .select()
      .from(pembinaan)
      .where(eq(pembinaan.id, BigInt(id)))
      .limit(1);
    return result[0] ?? null;
  });
}

export async function listPembinaan(params: ListPembinaanParams) {
  const { page, pageSize, search, rbacFilter, anakId, semesterId, field, direction = 'desc' } = params;

  return safeQuery(`listPembinaan(page=${page}, search=${search ?? '-'})`, async () => {
    const conditions: SQL[] = [];

    if (rbacFilter) conditions.push(rbacFilter);
    if (anakId) conditions.push(eq(pembinaan.anakId, BigInt(anakId)));
    if (semesterId) conditions.push(eq(pembinaan.semesterId, BigInt(semesterId)));
    if (search) {
      conditions.push(
        sql`(${pembinaan.kodePembinaan} ILIKE ${'%' + search + '%'} OR ${pembinaan.judulMateri} ILIKE ${'%' + search + '%'})`
      );
    }

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    // Determine sort column and direction
    let orderBy;
    if (field === 'tglPembinaan') {
      orderBy = direction === 'asc' ? asc(pembinaan.tglPembinaan) : desc(pembinaan.tglPembinaan);
    } else if (field === 'kodePembinaan') {
      orderBy = direction === 'asc' ? asc(pembinaan.kodePembinaan) : desc(pembinaan.kodePembinaan);
    } else {
      orderBy = direction === 'asc' ? asc(pembinaan.dateInsert) : desc(pembinaan.dateInsert);
    }

    const [rows, totalResult] = await Promise.all([
      db
        .select()
        .from(pembinaan)
        .where(where)
        .orderBy(orderBy)
        .limit(pageSize)
        .offset(getOffset(page, pageSize)),
      db
        .select({ total: count() })
        .from(pembinaan)
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

export async function listPembinaanByAnak(anakId: number, params: Omit<ListPembinaanParams, 'anakId'>) {
  return listPembinaan({ ...params, anakId });
}

// ─── WRITE ───────────────────────────────────────────────────────────────────

export async function createPembinaan(data: NewPembinaan): Promise<PembinaanRow> {
  return safeQuery('createPembinaan', async () => {
    const [pembinaan] = await db.insert(pembinaan).values(data).returning();
    return pembinaan;
  });
}

export async function updatePembinaan(
  id: number,
  data: Partial<NewPembinaan>
): Promise<PembinaanRow | null> {
  return safeQuery(`updatePembinaan(${id})`, async () => {
    const [pembinaan] = await db
      .update(pembinaan)
      .set(data)
      .where(eq(pembinaan.id, BigInt(id)))
      .returning();
    return pembinaan ?? null;
  });
}

export async function deletePembinaan(id: number): Promise<PembinaanRow | null> {
  return safeQuery(`deletePembinaan(${id})`, async () => {
    const [deleted] = await db.delete(pembinaan).where(eq(pembinaan.id, BigInt(id))).returning();
    return deleted ?? null;
  });
}

// ─── DOKUMENTASI ─────────────────────────────────────────────────────────────

export type PembinaanDokumentasiRow = typeof pembinaanDokumentasi.$inferSelect;
export type NewPembinaanDokumentasi = typeof pembinaanDokumentasi.$inferInsert;

export async function listPembinaanDokumentasi(params: {
  semesterId?: number;
  kantorId?: number;
  wilayahPembinaanId?: number;
}) {
  const { semesterId, kantorId, wilayahPembinaanId } = params;

  return safeQuery('listPembinaanDokumentasi', async () => {
    const conditions: SQL[] = [];

    if (semesterId) conditions.push(eq(pembinaanDokumentasi.semesterId, BigInt(semesterId)));
    if (kantorId) conditions.push(eq(pembinaanDokumentasi.kantorId, BigInt(kantorId)));
    if (wilayahPembinaanId) conditions.push(eq(pembinaanDokumentasi.wilayahPembinaanId, BigInt(wilayahPembinaanId)));

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const rows = await db
      .select()
      .from(pembinaanDokumentasi)
      .where(where);

    return rows;
  });
}

export async function createPembinaanDokumentasi(data: NewPembinaanDokumentasi): Promise<PembinaanDokumentasiRow> {
  return safeQuery('createPembinaanDokumentasi', async () => {
    const [dokumentasi] = await db.insert(pembinaanDokumentasi).values(data).returning();
    return dokumentasi;
  });
}

export async function deletePembinaanDokumentasi(id: number): Promise<PembinaanDokumentasiRow | null> {
  return safeQuery(`deletePembinaanDokumentasi(${id})`, async () => {
    const [deleted] = await db.delete(pembinaanDokumentasi).where(eq(pembinaanDokumentasi.id, BigInt(id))).returning();
    return deleted ?? null;
  });
}
