import { eq, ilike, and, count, desc, sql, type SQL } from 'drizzle-orm';
import { ajisAnak } from '@/db/schema';
import { db, getOffset, safeQuery, type ListParams } from './base.repository';

/**
 * Anak Repository
 * Tanggung jawab:
 *   - Query data ajis_anak dengan RBAC scope (kantor_id / wilayah_pembinaan_id)
 *   - Pagination, filter, search
 *   - Tidak mengandung logika bisnis
 */

export type AnakRow = typeof ajisAnak.$inferSelect;
export type NewAnak = typeof ajisAnak.$inferInsert;

export type ListAnakParams = ListParams & {
  /** Filter RBAC hasil dari filterByRole() */
  rbacFilter?: SQL;
  aktif?: 'y' | 'n';
};

// ─── READ ────────────────────────────────────────────────────────────────────

export async function findAnakById(id: number): Promise<AnakRow | null> {
  return safeQuery(`findAnakById(${id})`, async () => {
    const result = await db
      .select()
      .from(ajisAnak)
      .where(eq(ajisAnak.id, BigInt(id)))
      .limit(1);
    return result[0] ?? null;
  });
}

export async function findAnakByKode(kodeAnak: string): Promise<AnakRow | null> {
  return safeQuery(`findAnakByKode(${kodeAnak})`, async () => {
    const result = await db
      .select()
      .from(ajisAnak)
      .where(eq(ajisAnak.kodeAnak, kodeAnak))
      .limit(1);
    return result[0] ?? null;
  });
}

export async function listAnak(params: ListAnakParams) {
  const { page, pageSize, search, rbacFilter, aktif = 'y' } = params;

  return safeQuery(`listAnak(page=${page}, search=${search ?? '-'})`, async () => {
    const conditions: SQL[] = [eq(ajisAnak.aktif, aktif)];

    if (rbacFilter) conditions.push(rbacFilter);
    if (search) {
      // Menggunakan GIN trigram index untuk pencarian cepat
      conditions.push(
        sql`(${ajisAnak.namaLengkap} ILIKE ${'%' + search + '%'} OR ${ajisAnak.kodeAnak} ILIKE ${'%' + search + '%'} OR ${ajisAnak.nik} ILIKE ${'%' + search + '%'})`
      );
    }

    const where = and(...conditions);

    const [rows, totalResult] = await Promise.all([
      db
        .select()
        .from(ajisAnak)
        .where(where)
        .orderBy(desc(ajisAnak.tglTerdaftar))
        .limit(pageSize)
        .offset(getOffset(page, pageSize)),
      db
        .select({ total: count() })
        .from(ajisAnak)
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

// ─── WRITE ───────────────────────────────────────────────────────────────────

export async function createAnak(data: NewAnak): Promise<AnakRow> {
  return safeQuery('createAnak', async () => {
    const [anak] = await db.insert(ajisAnak).values(data).returning();
    return anak;
  });
}

export async function updateAnak(
  id: number,
  data: Partial<NewAnak>
): Promise<AnakRow | null> {
  return safeQuery(`updateAnak(${id})`, async () => {
    const [anak] = await db
      .update(ajisAnak)
      .set(data)
      .where(eq(ajisAnak.id, BigInt(id)))
      .returning();
    return anak ?? null;
  });
}

export async function deactivateAnak(id: number): Promise<AnakRow | null> {
  return updateAnak(id, { aktif: 'n' });
}

export async function deleteAnak(id: number): Promise<AnakRow | null> {
  return safeQuery(`deleteAnak(${id})`, async () => {
    const [deleted] = await db.delete(ajisAnak).where(eq(ajisAnak.id, BigInt(id))).returning();
    return deleted ?? null;
  });
}
