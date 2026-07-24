import { ajisWilayahPembinaan, ajisKantor, refDesa, refKecamatan, refKabupaten, refPropinsi, ajisAnak, ajisSdmWilayah, ajisUserWilayahPembinaan } from '@/lib/db/schema';
import { db, getOffset, safeQuery, type ListParams } from './base.repository';
import { eq, ilike, and, desc, or, sql, inArray } from 'drizzle-orm';
import type { SQL } from 'drizzle-orm';

export type WilayahListParams = ListParams & {
  aktif?: 'y' | 'n';
  kantorId?: number;
  rbacFilter?: SQL;
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
  const { page = 1, pageSize = 20, search, aktif, kantorId, rbacFilter } = params;
  const offset = getOffset(page, pageSize);

  return safeQuery('listWilayah', async () => {
    // Build conditions
    const conditions: SQL[] = [];

    if (rbacFilter) conditions.push(rbacFilter);
    if (aktif) conditions.push(eq(ajisWilayahPembinaan.aktif, aktif));
    if (kantorId) conditions.push(eq(ajisWilayahPembinaan.kantorId, BigInt(kantorId)));

    if (search) {
      conditions.push(
        or(
          ilike(ajisWilayahPembinaan.namaWilayah, `%${search}%`),
          ilike(ajisWilayahPembinaan.kodeLama, sql<string>`CAST(${ajisWilayahPembinaan.kodeLama} AS VARCHAR)`)
        )!
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Get data with related information
    const data = await db
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

// ─── RELATED DATA METHODS ─────────────────────────────────────────────────────

export async function findWilayahByIdWithRelations(id: number) {
  return safeQuery('findWilayahByIdWithRelations', async () => {
    const [wilayah] = await db
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
      .where(eq(ajisWilayahPembinaan.id, BigInt(id)))
      .limit(1);

    return wilayah || null;
  });
}

export async function getAnakCountByWilayah(wilayahId: number) {
  return safeQuery('getAnakCountByWilayah', async () => {
    const result = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(ajisAnak)
      .where(eq(ajisAnak.wilayahPembinaanId, BigInt(wilayahId)));
    
    return result[0]?.count ?? 0;
  });
}

export async function getSdmCountByWilayah(wilayahId: number) {
  return safeQuery('getSdmCountByWilayah', async () => {
    const result = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(ajisSdmWilayah)
      .where(eq(ajisSdmWilayah.penugasanWilayahId, BigInt(wilayahId)));
    
    return result[0]?.count ?? 0;
  });
}

export async function getAvailableKantor(user: { id_group_user: number; kantor_id?: number | null }) {
  return safeQuery('getAvailableKantor', async () => {
    if (user.id_group_user === 1) {
      // Super Admin: all kantor
      return await db.select().from(ajisKantor).where(eq(ajisKantor.aktif, 'y'));
    } else if (user.id_group_user === 2 && user.kantor_id) {
      // Branch Admin: only their kantor
      return await db
        .select()
        .from(ajisKantor)
        .where(and(eq(ajisKantor.id, BigInt(user.kantor_id)), eq(ajisKantor.aktif, 'y')));
    }
    // Korwil: no access to create wilayah
    return [];
  });
}

export async function getUserWilayahIds(userId: number) {
  return safeQuery('getUserWilayahIds', async () => {
    const result = await db
      .select({ wilayahPembinaanId: ajisUserWilayahPembinaan.wilayahPembinaanId })
      .from(ajisUserWilayahPembinaan)
      .where(eq(ajisUserWilayahPembinaan.userId, BigInt(userId)));
    
    return result.map(r => Number(r.wilayahPembinaanId));
  });
}

// ─── RBAC FILTER BUILDER ───────────────────────────────────────────────────────

export function buildRbacFilter(user: { id_group_user: number; kantor_id?: number | null; id: number }): SQL | undefined {
  if (user.id_group_user === 1) {
    // Super Admin: no filter
    return undefined;
  } else if (user.id_group_user === 2 && user.kantor_id) {
    // Branch Admin: only their office's regions
    return eq(ajisWilayahPembinaan.kantorId, BigInt(user.kantor_id));
  } else if (user.id_group_user === 9) {
    // Korwil: only assigned regions
    return inArray(
      ajisWilayahPembinaan.id,
      sql`(SELECT wilayah_pembinaan_id FROM ajis_user_wilayah_pembinaan WHERE user_id = ${BigInt(user.id)})`
    );
  }
  return undefined;
}
