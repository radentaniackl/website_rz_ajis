import { eq, ilike, and, count, desc, asc, sql, type SQL } from 'drizzle-orm';
import { donatur } from '@/lib/db/schema';
import { db, getOffset, safeQuery, type ListParams } from './base.repository';

/**
 * Donatur Repository
 * Tanggung jawab:
 *   - Query data donatur
 *   - Pagination, filter, search
 *   - Tidak mengandung logika bisnis
 */

export type DonaturRow = typeof donatur.$inferSelect;
export type NewDonatur = typeof donatur.$inferInsert;

export type ListDonaturParams = ListParams & {
  /** Filter RBAC hasil dari filterByRole() */
  rbacFilter?: SQL;
  statusDonatur?: string;
  aktif?: 'y' | 'n' | 'p';
  kantorDonaturId?: number;
  field?: string;
  direction?: 'asc' | 'desc';
};

// ─── READ ────────────────────────────────────────────────────────────────────

export async function findDonaturById(id: number): Promise<DonaturRow | null> {
  return safeQuery(`findDonaturById(${id})`, async () => {
    const result = await db
      .select()
      .from(donatur)
      .where(eq(donatur.id, BigInt(id)))
      .limit(1);
    return result[0] ?? null;
  });
}

export async function listDonatur(params: ListDonaturParams) {
  const { page, pageSize, search, rbacFilter, statusDonatur: statusFilter, aktif, kantorDonaturId, field, direction = 'asc' } = params;

  return safeQuery(`listDonatur(page=${page}, search=${search ?? '-'})`, async () => {
    const conditions: SQL[] = [];

    if (rbacFilter) conditions.push(rbacFilter);
    if (statusFilter) conditions.push(eq(donatur.statusDonatur, statusFilter));
    if (aktif) conditions.push(eq(donatur.aktif, aktif));
    if (kantorDonaturId) conditions.push(eq(donatur.kantorDonaturId, kantorDonaturId));
    if (search) {
      conditions.push(
        sql`(${donatur.namaLengkap} ILIKE ${'%' + search + '%'} OR ${donatur.kodeLama} ILIKE ${'%' + search + '%'} OR ${donatur.namaPublikasi} ILIKE ${'%' + search + '%'})`
      );
    }

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    // Determine sort column and direction
    let orderBy;
    if (field === 'namaLengkap') {
      orderBy = direction === 'asc' ? asc(donatur.namaLengkap) : desc(donatur.namaLengkap);
    } else if (field === 'statusDonatur') {
      orderBy = direction === 'asc' ? asc(donatur.statusDonatur) : desc(donatur.statusDonatur);
    } else if (field === 'tglRegistrasi') {
      orderBy = direction === 'asc' ? asc(donatur.tglRegistrasi) : desc(donatur.tglRegistrasi);
    } else {
      orderBy = direction === 'asc' ? asc(donatur.namaLengkap) : desc(donatur.namaLengkap);
    }

    const [rows, totalResult] = await Promise.all([
      db
        .select()
        .from(donatur)
        .where(where)
        .orderBy(orderBy)
        .limit(pageSize)
        .offset(getOffset(page, pageSize)),
      db
        .select({ total: count() })
        .from(donatur)
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

// ─── CREATE ──────────────────────────────────────────────────────────────────

export async function createDonatur(data: NewDonatur): Promise<DonaturRow> {
  return safeQuery('createDonatur()', async () => {
    const result = await db.insert(donatur).values(data).returning();
    return result[0];
  });
}

// ─── UPDATE ──────────────────────────────────────────────────────────────────

export async function updateDonatur(id: number, data: Partial<NewDonatur>): Promise<DonaturRow> {
  return safeQuery(`updateDonatur(${id})`, async () => {
    const result = await db
      .update(donatur)
      .set({ ...data, updatedAt: new Date().toISOString() })
      .where(eq(donatur.id, BigInt(id)))
      .returning();
    return result[0];
  });
}

// ─── DELETE ──────────────────────────────────────────────────────────────────

export async function deleteDonatur(id: number): Promise<DonaturRow> {
  return safeQuery(`deleteDonatur(${id})`, async () => {
    const result = await db
      .delete(donatur)
      .where(eq(donatur.id, BigInt(id)))
      .returning();
    return result[0];
  });
}
