import { eq, ilike, and, count, desc, asc, sql, type SQL } from 'drizzle-orm';
import { ajisAnak, ajisWilayahPembinaan, ajisKantor, refDesa } from '@/lib/db/schema';
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
  field?: string;
  direction?: 'asc' | 'desc';
  wilayahPembinaanId?: number;
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
  const { page, pageSize, search, rbacFilter, aktif = 'y', field, direction = 'desc', wilayahPembinaanId } = params;

  return safeQuery(`listAnak(page=${page}, search=${search ?? '-'})`, async () => {
    const conditions: SQL[] = [];

    if (aktif) conditions.push(eq(ajisAnak.aktif, aktif));
    if (wilayahPembinaanId) conditions.push(eq(ajisAnak.wilayahPembinaanId, BigInt(wilayahPembinaanId)));

    if (rbacFilter) conditions.push(rbacFilter);
    if (search) {
      // Menggunakan GIN trigram index untuk pencarian cepat
      conditions.push(
        sql`(${ajisAnak.namaLengkap} ILIKE ${'%' + search + '%'} OR ${ajisAnak.kodeAnak} ILIKE ${'%' + search + '%'} OR ${ajisAnak.nik} ILIKE ${'%' + search + '%'})`
      );
    }

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    // Determine sort column and direction
    let orderBy;
    if (field === 'kodeAnak') {
      orderBy = direction === 'asc' ? asc(ajisAnak.kodeAnak) : desc(ajisAnak.kodeAnak);
    } else if (field === 'nik') {
      orderBy = direction === 'asc' ? asc(ajisAnak.nik) : desc(ajisAnak.nik);
    } else if (field === 'namaLengkap') {
      orderBy = direction === 'asc' ? asc(ajisAnak.namaLengkap) : desc(ajisAnak.namaLengkap);
    } else {
      orderBy = direction === 'asc' ? asc(ajisAnak.tglTerdaftar) : desc(ajisAnak.tglTerdaftar);
    }

    const [rows, totalResult] = await Promise.all([
      db
        .select()
        .from(ajisAnak)
        .where(where)
        .orderBy(orderBy)
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

// ─── FOREIGN KEY VALIDATION ──────────────────────────────────────────────────────

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
