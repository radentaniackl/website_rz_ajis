import { ajisKantor } from '@/db/schema';
import { db, getOffset, safeQuery, type ListParams } from './base.repository';
import { eq, ilike, and, desc, or, sql } from 'drizzle-orm';
import type { SQL } from 'drizzle-orm';

export type KantorListParams = ListParams & {
  aktif?: 'y' | 'n';
};

export type KantorInput = {
  kode: string;
  nama: string;
  alamat?: string;
  noTelp?: string;
  parentId?: number | null;
  parentSecondId?: number | null;
  kodeProgramRz?: string;
  jenis?: string;
  kodeKantorLegacy?: string;
  aktif?: 'y' | 'n';
};

export type KantorUpdate = Partial<KantorInput>;

/**
 * Kantor Repository
 * Tanggung jawab:
 *   - Query database untuk operasi CRUD kantor
 *   - Pagination, search, dan filtering
 */

export async function listKantor(params: KantorListParams = {}) {
  const { page = 1, pageSize = 20, search, aktif } = params;
  const offset = getOffset(page, pageSize);

  return safeQuery('listKantor', async () => {
    // Build conditions
    const conditions: SQL[] = [];

    if (aktif) {
      conditions.push(eq(ajisKantor.aktif, aktif));
    }

    if (search) {
      conditions.push(
        or(
          ilike(ajisKantor.nama, `%${search}%`),
          ilike(ajisKantor.kode, `%${search}%`)
        )!
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Get data
    const data = await db
      .select()
      .from(ajisKantor)
      .where(whereClause)
      .orderBy(desc(ajisKantor.createdAt))
      .limit(pageSize)
      .offset(offset);

    // Get total count
    const totalCountResult = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(ajisKantor)
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

export async function findKantorByKode(kode: string) {
  return safeQuery('findKantorByKode', async () => {
    const [kantor] = await db
      .select()
      .from(ajisKantor)
      .where(eq(ajisKantor.kode, kode))
      .limit(1);

    return kantor || null;
  });
}

export async function createKantor(input: KantorInput) {
  return safeQuery('createKantor', async () => {
    const [kantor] = await db
      .insert(ajisKantor)
      .values({
        kode: input.kode,
        nama: input.nama,
        alamat: input.alamat,
        noTelp: input.noTelp,
        parentId: input.parentId ? BigInt(input.parentId) : null,
        parentSecondId: input.parentSecondId ? BigInt(input.parentSecondId) : null,
        kodeProgramRz: input.kodeProgramRz,
        jenis: input.jenis,
        kodeKantorLegacy: input.kodeKantorLegacy,
        aktif: input.aktif || 'y',
      })
      .returning();

    return kantor;
  });
}

export async function updateKantor(id: number, input: KantorUpdate) {
  return safeQuery('updateKantor', async () => {
    const [kantor] = await db
      .update(ajisKantor)
      .set({
        ...(input.kode && { kode: input.kode }),
        ...(input.nama && { nama: input.nama }),
        ...(input.alamat !== undefined && { alamat: input.alamat }),
        ...(input.noTelp !== undefined && { noTelp: input.noTelp }),
        ...(input.parentId !== undefined && { parentId: input.parentId ? BigInt(input.parentId) : null }),
        ...(input.parentSecondId !== undefined && { parentSecondId: input.parentSecondId ? BigInt(input.parentSecondId) : null }),
        ...(input.kodeProgramRz !== undefined && { kodeProgramRz: input.kodeProgramRz }),
        ...(input.jenis !== undefined && { jenis: input.jenis }),
        ...(input.kodeKantorLegacy !== undefined && { kodeKantorLegacy: input.kodeKantorLegacy }),
        ...(input.aktif && { aktif: input.aktif }),
        updatedAt: new Date().toISOString(),
      })
      .where(eq(ajisKantor.id, BigInt(id)))
      .returning();

    return kantor || null;
  });
}

export async function deleteKantor(id: number) {
  return safeQuery('deleteKantor', async () => {
    const [kantor] = await db
      .delete(ajisKantor)
      .where(eq(ajisKantor.id, BigInt(id)))
      .returning();

    return kantor || null;
  });
}
