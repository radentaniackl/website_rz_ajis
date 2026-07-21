import { ajisWilayahPembinaan, ajisKantor, refDesa } from '@/db/schema';
import { db, getOffset, safeQuery, type ListParams } from './base.repository';
import { eq, ilike, and, desc, or, sql } from 'drizzle-orm';
import type { SQL } from 'drizzle-orm';

export type WilayahListParams = ListParams & {
  aktif?: 'y' | 'n';
  kantorId?: number;
};

export type WilayahInput = {
  kodeLama?: number;
  namaWilayah: string;
  alamatWilayah?: string;
  kantorId?: number | null;
  desaId?: number | null;
  statusApprove?: string;
  aktif?: 'y' | 'n';
  userInsert?: string;
};

export type WilayahUpdate = Partial<WilayahInput>;

/**
 * Wilayah Pembinaan Repository
 * Tanggung jawab:
 *   - Query database untuk operasi CRUD wilayah pembinaan
 *   - Pagination, search, dan filtering
 */

export async function listWilayah(params: WilayahListParams = {}) {
  const { page = 1, pageSize = 20, search, aktif, kantorId } = params;
  const offset = getOffset(page, pageSize);

  return safeQuery('listWilayah', async () => {
    // Build conditions
    const conditions: SQL[] = [];

    if (aktif) {
      conditions.push(eq(ajisWilayahPembinaan.aktif, aktif));
    }

    if (kantorId) {
      conditions.push(eq(ajisWilayahPembinaan.kantorId, BigInt(kantorId)));
    }

    if (search) {
      conditions.push(
        or(
          ilike(ajisWilayahPembinaan.namaWilayah, `%${search}%`),
          ilike(ajisWilayahPembinaan.kodeLama, sql<string>`CAST(${ajisWilayahPembinaan.kodeLama} AS VARCHAR)`)
        )!
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Get data
    const data = await db
      .select()
      .from(ajisWilayahPembinaan)
      .where(whereClause)
      .orderBy(desc(ajisWilayahPembinaan.id))
      .limit(pageSize)
      .offset(offset);

    // Get total count
    const totalCountResult = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(ajisWilayahPembinaan)
      .where(whereClause);

    const totalCount = totalCountResult[0]?.count ?? 0;

    return {
      data,
      total: totalCount,
      page,
      pageSize,
      totalPages: Math.ceil(totalCount / pageSize),
    };
  });
}

export async function findWilayahById(id: number) {
  return safeQuery('findWilayahById', async () => {
    const [wilayah] = await db
      .select()
      .from(ajisWilayahPembinaan)
      .where(eq(ajisWilayahPembinaan.id, BigInt(id)))
      .limit(1);

    return wilayah || null;
  });
}

export async function findWilayahByKodeLama(kodeLama: number) {
  return safeQuery('findWilayahByKodeLama', async () => {
    const [wilayah] = await db
      .select()
      .from(ajisWilayahPembinaan)
      .where(eq(ajisWilayahPembinaan.kodeLama, kodeLama))
      .limit(1);

    return wilayah || null;
  });
}

export async function findWilayahByNama(namaWilayah: string) {
  return safeQuery('findWilayahByNama', async () => {
    const [wilayah] = await db
      .select()
      .from(ajisWilayahPembinaan)
      .where(eq(ajisWilayahPembinaan.namaWilayah, namaWilayah))
      .limit(1);

    return wilayah || null;
  });
}

export async function findKantorById(id: number) {
  return safeQuery('findKantorById', async () => {
    const [kantor] = await db
      .select()
      .from(ajisKantor)
      .where(eq(ajisKantor.id, BigInt(id)))
      .limit(1);

    return kantor || null;
  });
}

export async function findDesaById(id: number) {
  return safeQuery('findDesaById', async () => {
    const [desa] = await db
      .select()
      .from(refDesa)
      .where(eq(refDesa.id, BigInt(id)))
      .limit(1);

    return desa || null;
  });
}

export async function createWilayah(input: WilayahInput) {
  return safeQuery('createWilayah', async () => {
    const [wilayah] = await db
      .insert(ajisWilayahPembinaan)
      .values({
        kodeLama: input.kodeLama,
        namaWilayah: input.namaWilayah,
        alamatWilayah: input.alamatWilayah,
        kantorId: input.kantorId ? BigInt(input.kantorId) : null,
        desaId: input.desaId ? BigInt(input.desaId) : null,
        statusApprove: input.statusApprove,
        aktif: input.aktif || 'y',
        userInsert: input.userInsert,
        dateInsert: new Date(),
      })
      .returning();

    return wilayah;
  });
}

export async function updateWilayah(id: number, input: WilayahUpdate) {
  return safeQuery('updateWilayah', async () => {
    const [wilayah] = await db
      .update(ajisWilayahPembinaan)
      .set({
        ...(input.kodeLama !== undefined && { kodeLama: input.kodeLama }),
        ...(input.namaWilayah && { namaWilayah: input.namaWilayah }),
        ...(input.alamatWilayah !== undefined && { alamatWilayah: input.alamatWilayah }),
        ...(input.kantorId !== undefined && { kantorId: input.kantorId ? BigInt(input.kantorId) : null }),
        ...(input.desaId !== undefined && { desaId: input.desaId ? BigInt(input.desaId) : null }),
        ...(input.statusApprove !== undefined && { statusApprove: input.statusApprove }),
        ...(input.aktif && { aktif: input.aktif }),
        ...(input.userUpdate && { userUpdate: input.userUpdate }),
        dateUpdate: new Date(),
      })
      .where(eq(ajisWilayahPembinaan.id, BigInt(id)))
      .returning();

    return wilayah || null;
  });
}

export async function deleteWilayah(id: number) {
  return safeQuery('deleteWilayah', async () => {
    const [wilayah] = await db
      .delete(ajisWilayahPembinaan)
      .where(eq(ajisWilayahPembinaan.id, BigInt(id)))
      .returning();

    return wilayah || null;
  });
}
