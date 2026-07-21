import { eq, ilike, and, count, desc, asc, sql, type SQL } from 'drizzle-orm';
import { ajisSemester } from '@/db/schema';
import { db, getOffset, safeQuery, type ListParams } from './base.repository';

/**
 * Semester Repository
 * Tanggung jawab:
 *   - Query data ajis_semester
 *   - Pagination, filter, search
 *   - Tidak mengandung logika bisnis
 */

export type SemesterRow = typeof ajisSemester.$inferSelect;
export type NewSemester = typeof ajisSemester.$inferInsert;

export type ListSemesterParams = ListParams & {
  /** Filter RBAC hasil dari filterByRole() */
  rbacFilter?: SQL;
  onprogress?: 'y' | 'n';
  jenis?: string;
  tahun?: number;
  field?: string;
  direction?: 'asc' | 'desc';
};

// ─── READ ────────────────────────────────────────────────────────────────────

export async function findSemesterById(id: number): Promise<SemesterRow | null> {
  return safeQuery(`findSemesterById(${id})`, async () => {
    const result = await db
      .select()
      .from(ajisSemester)
      .where(eq(ajisSemester.id, BigInt(id)))
      .limit(1);
    return result[0] ?? null;
  });
}

export async function listSemester(params: ListSemesterParams) {
  const { page, pageSize, search, rbacFilter, onprogress, jenis, tahun, field, direction = 'desc' } = params;

  return safeQuery(`listSemester(page=${page}, search=${search ?? '-'})`, async () => {
    const conditions: SQL[] = [];

    if (rbacFilter) conditions.push(rbacFilter);
    if (onprogress) conditions.push(eq(ajisSemester.onprogress, onprogress));
    if (jenis) conditions.push(eq(ajisSemester.jenis, jenis));
    if (tahun) conditions.push(eq(ajisSemester.tahun, tahun));
    if (search) {
      conditions.push(
        sql`(${ajisSemester.nama} ILIKE ${'%' + search + '%'} OR ${ajisSemester.kodeLama} ILIKE ${'%' + search + '%'})`
      );
    }

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    // Determine sort column and direction
    let orderBy;
    if (field === 'nama') {
      orderBy = direction === 'asc' ? asc(ajisSemester.nama) : desc(ajisSemester.nama);
    } else if (field === 'tahun') {
      orderBy = direction === 'asc' ? asc(ajisSemester.tahun) : desc(ajisSemester.tahun);
    } else if (field === 'jenis') {
      orderBy = direction === 'asc' ? asc(ajisSemester.jenis) : desc(ajisSemester.jenis);
    } else {
      orderBy = direction === 'asc' ? asc(ajisSemester.tglAwal) : desc(ajisSemester.tglAwal);
    }

    const [rows, totalResult] = await Promise.all([
      db
        .select()
        .from(ajisSemester)
        .where(where)
        .orderBy(orderBy)
        .limit(pageSize)
        .offset(getOffset(page, pageSize)),
      db
        .select({ total: count() })
        .from(ajisSemester)
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

export async function getActiveSemester(): Promise<SemesterRow | null> {
  return safeQuery('getActiveSemester()', async () => {
    const result = await db
      .select()
      .from(ajisSemester)
      .where(eq(ajisSemester.onprogress, 'y'))
      .orderBy(desc(ajisSemester.tglAwal))
      .limit(1);
    return result[0] ?? null;
  });
}

// ─── CREATE ──────────────────────────────────────────────────────────────────

export async function createSemester(data: NewSemester): Promise<SemesterRow> {
  return safeQuery('createSemester()', async () => {
    const result = await db.insert(ajisSemester).values(data).returning();
    return result[0];
  });
}

// ─── UPDATE ──────────────────────────────────────────────────────────────────

export async function updateSemester(id: number, data: Partial<NewSemester>): Promise<SemesterRow> {
  return safeQuery(`updateSemester(${id})`, async () => {
    const result = await db
      .update(ajisSemester)
      .set({ ...data, dateUpdate: new Date() })
      .where(eq(ajisSemester.id, BigInt(id)))
      .returning();
    return result[0];
  });
}

export async function setActiveSemester(id: number): Promise<SemesterRow> {
  return safeQuery(`setActiveSemester(${id})`, async () => {
    // First, set all semesters to inactive
    await db.update(ajisSemester).set({ onprogress: 'n' });
    // Then set the specified semester to active
    const result = await db
      .update(ajisSemester)
      .set({ onprogress: 'y' })
      .where(eq(ajisSemester.id, BigInt(id)))
      .returning();
    return result[0];
  });
}

// ─── DELETE ──────────────────────────────────────────────────────────────────

export async function deleteSemester(id: number): Promise<SemesterRow> {
  return safeQuery(`deleteSemester(${id})`, async () => {
    const result = await db
      .delete(ajisSemester)
      .where(eq(ajisSemester.id, BigInt(id)))
      .returning();
    return result[0];
  });
}
