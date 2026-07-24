import { eq, ilike, and, count, desc, asc, sql, type SQL } from 'drizzle-orm';
import { hafalanAnak, itemHafalan, ajisAnak, ajisSemester } from '@/db/schema';
import { db, getOffset, safeQuery, type ListParams } from './base.repository';

/**
 * Hafalan Repository
 * Tanggung jawab:
 *   - Query data hafalan dengan RBAC scope (kantor_id / wilayah_pembinaan_id)
 *   - Pagination, filter, search
 *   - Tidak mengandung logika bisnis
 */

export type HafalanRow = typeof hafalanAnak.$inferSelect;
export type NewHafalan = typeof hafalanAnak.$inferInsert;

export type ItemHafalanRow = typeof itemHafalan.$inferSelect;
export type NewItemHafalan = typeof itemHafalan.$inferInsert;

export type ListHafalanParams = ListParams & {
  /** Filter RBAC hasil dari filterByRole() */
  rbacFilter?: SQL;
  anakId?: number;
  semesterId?: number;
  field?: string;
  direction?: 'asc' | 'desc';
};

// ─── READ ────────────────────────────────────────────────────────────────────

export async function findHafalanById(id: number) {
  return safeQuery(`findHafalanById(${id})`, async () => {
    const result = await db
      .select({
        id: hafalanAnak.id,
        kodeLama: hafalanAnak.kodeLama,
        anakId: hafalanAnak.anakId,
        anakNama: ajisAnak.namaLengkap,
        anakKode: ajisAnak.kodeAnak,
        itemHafalanId: hafalanAnak.itemHafalanId,
        itemHafalanKonten: itemHafalan.konten,
        itemHafalanJenis: itemHafalan.jenis,
        jenis: hafalanAnak.jenis,
        kontenUji: hafalanAnak.kontenUji,
        tglPengujian: hafalanAnak.tglPengujian,
        tglInsert: hafalanAnak.tglInsert,
        keterangan: hafalanAnak.keterangan,
        semesterId: hafalanAnak.semesterId,
        semesterNama: ajisSemester.nama,
        externalRef: hafalanAnak.externalRef,
      })
      .from(hafalanAnak)
      .leftJoin(ajisAnak, eq(hafalanAnak.anakId, ajisAnak.id))
      .leftJoin(itemHafalan, eq(hafalanAnak.itemHafalanId, itemHafalan.id))
      .leftJoin(ajisSemester, eq(hafalanAnak.semesterId, ajisSemester.id))
      .where(eq(hafalanAnak.id, BigInt(id)))
      .limit(1);
    return result[0] ?? null;
  });
}

export async function listHafalan(params: ListHafalanParams) {
  const { page, pageSize, search, rbacFilter, anakId, semesterId, field, direction = 'desc' } = params;

  return safeQuery(`listHafalan(page=${page}, search=${search ?? '-'})`, async () => {
    const conditions: SQL[] = [];

    if (rbacFilter) conditions.push(rbacFilter);
    if (anakId) conditions.push(eq(hafalanAnak.anakId, BigInt(anakId)));
    if (semesterId) conditions.push(eq(hafalanAnak.semesterId, BigInt(semesterId)));
    if (search) {
      conditions.push(
        sql`(${hafalanAnak.kontenUji} ILIKE ${'%' + search + '%'} OR ${ajisAnak.namaLengkap} ILIKE ${'%' + search + '%'} OR ${ajisAnak.kodeAnak} ILIKE ${'%' + search + '%'} OR ${itemHafalan.konten} ILIKE ${'%' + search + '%'})`
      );
    }

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    // Determine sort column and direction
    let orderBy;
    if (field === 'tglPengujian') {
      orderBy = direction === 'asc' ? asc(hafalanAnak.tglPengujian) : desc(hafalanAnak.tglPengujian);
    } else if (field === 'kontenUji') {
      orderBy = direction === 'asc' ? asc(hafalanAnak.kontenUji) : desc(hafalanAnak.kontenUji);
    } else {
      orderBy = direction === 'asc' ? asc(hafalanAnak.id) : desc(hafalanAnak.id);
    }

    const [rows, totalResult] = await Promise.all([
      db
        .select({
          id: hafalanAnak.id,
          kodeLama: hafalanAnak.kodeLama,
          anakId: hafalanAnak.anakId,
          anakNama: ajisAnak.namaLengkap,
          anakKode: ajisAnak.kodeAnak,
          itemHafalanId: hafalanAnak.itemHafalanId,
          itemHafalanKonten: itemHafalan.konten,
          itemHafalanJenis: itemHafalan.jenis,
          jenis: hafalanAnak.jenis,
          kontenUji: hafalanAnak.kontenUji,
          tglPengujian: hafalanAnak.tglPengujian,
          tglInsert: hafalanAnak.tglInsert,
          keterangan: hafalanAnak.keterangan,
          semesterId: hafalanAnak.semesterId,
          semesterNama: ajisSemester.nama,
          externalRef: hafalanAnak.externalRef,
        })
        .from(hafalanAnak)
        .leftJoin(ajisAnak, eq(hafalanAnak.anakId, ajisAnak.id))
        .leftJoin(itemHafalan, eq(hafalanAnak.itemHafalanId, itemHafalan.id))
        .leftJoin(ajisSemester, eq(hafalanAnak.semesterId, ajisSemester.id))
        .where(where)
        .orderBy(orderBy)
        .limit(pageSize)
        .offset(getOffset(page, pageSize)),
      db
        .select({ count: count() })
        .from(hafalanAnak)
        .leftJoin(ajisAnak, eq(hafalanAnak.anakId, ajisAnak.id))
        .leftJoin(itemHafalan, eq(hafalanAnak.itemHafalanId, itemHafalan.id))
        .leftJoin(ajisSemester, eq(hafalanAnak.semesterId, ajisSemester.id))
        .where(where)
    ]);

    const total = Number(totalResult[0]?.count ?? 0);

    return {
      data: rows,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  });
}

export async function findItemHafalanById(id: number) {
  return safeQuery(`findItemHafalanById(${id})`, async () => {
    const result = await db
      .select()
      .from(itemHafalan)
      .where(eq(itemHafalan.id, BigInt(id)))
      .limit(1);
    return result[0] ?? null;
  });
}

export async function listItemHafalan(params?: { search?: string }) {
  const { search } = params ?? {};

  return safeQuery(`listItemHafalan(search=${search ?? '-'})`, async () => {
    const where = search
      ? sql`(${itemHafalan.konten} ILIKE ${'%' + search + '%'} OR ${itemHafalan.jenis}::text ILIKE ${'%' + search + '%'})`
      : undefined;

    const result = await db
      .select()
      .from(itemHafalan)
      .where(where)
      .orderBy(asc(itemHafalan.konten));

    return result;
  });
}

// ─── CREATE ──────────────────────────────────────────────────────────────────

export async function createHafalan(data: NewHafalan) {
  return safeQuery('createHafalan', async () => {
    const result = await db.insert(hafalanAnak).values(data).returning();
    return result[0];
  });
}

export async function createItemHafalan(data: NewItemHafalan) {
  return safeQuery('createItemHafalan', async () => {
    const result = await db.insert(itemHafalan).values(data).returning();
    return result[0];
  });
}

// ─── UPDATE ──────────────────────────────────────────────────────────────────

export async function updateHafalan(id: number, data: Partial<NewHafalan>) {
  return safeQuery(`updateHafalan(${id})`, async () => {
    const result = await db
      .update(hafalanAnak)
      .set(data)
      .where(eq(hafalanAnak.id, BigInt(id)))
      .returning();
    return result[0] ?? null;
  });
}

export async function updateItemHafalan(id: number, data: Partial<NewItemHafalan>) {
  return safeQuery(`updateItemHafalan(${id})`, async () => {
    const result = await db
      .update(itemHafalan)
      .set(data)
      .where(eq(itemHafalan.id, BigInt(id)))
      .returning();
    return result[0] ?? null;
  });
}

// ─── DELETE ──────────────────────────────────────────────────────────────────

export async function deleteHafalan(id: number) {
  return safeQuery(`deleteHafalan(${id})`, async () => {
    const result = await db
      .delete(hafalanAnak)
      .where(eq(hafalanAnak.id, BigInt(id)))
      .returning();
    return result[0] ?? null;
  });
}

export async function deleteItemHafalan(id: number) {
  return safeQuery(`deleteItemHafalan(${id})`, async () => {
    const result = await db
      .delete(itemHafalan)
      .where(eq(itemHafalan.id, BigInt(id)))
      .returning();
    return result[0] ?? null;
  });
}
