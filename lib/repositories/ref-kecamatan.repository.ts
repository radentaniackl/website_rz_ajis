import { db, getOffset, safeQuery, type ListParams } from './base.repository';
import { refKecamatan, refKabupaten } from '@/db/schema';
import { eq, ilike, or, and, desc, asc, not } from 'drizzle-orm';

type RefKecamatan = typeof refKecamatan.$inferSelect;
export type RefKecamatanInsert = typeof refKecamatan.$inferInsert;

export class RefKecamatanRepository {
  async findMany(params: ListParams & { kabupatenId?: number; aktif?: 'y' | 'n' }) {
    const {
      page = 1,
      pageSize = 20,
      search,
      field = 'nama',
      direction = 'asc',
      kabupatenId,
      aktif,
    } = params;
    const offset = getOffset(page, pageSize);
    const conditions = [];

    if (search) {
      conditions.push(
        or(
          ilike(refKecamatan.kode, `%${search}%`),
          ilike(refKecamatan.nama, `%${search}%`),
          ilike(refKabupaten.nama, `%${search}%`)
        )
      );
    }

    if (kabupatenId) {
      conditions.push(eq(refKecamatan.kabupatenId, kabupatenId));
    }

    if (aktif) {
      conditions.push(eq(refKecamatan.aktif, aktif));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
    const orderByColumn =
      field === 'kode'
        ? refKecamatan.kode
        : field === 'kabupaten'
        ? refKabupaten.nama
        : refKecamatan.nama;
    const orderBy = direction === 'desc' ? desc(orderByColumn) : asc(orderByColumn);

    return safeQuery('RefKecamatan.findMany', async () => {
      const data = await db
        .select({
          id: refKecamatan.id,
          kode: refKecamatan.kode,
          nama: refKecamatan.nama,
          kabupatenId: refKecamatan.kabupatenId,
          kabupatenNama: refKabupaten.nama,
          kodepos: refKecamatan.kodepos,
          aktif: refKecamatan.aktif,
        })
        .from(refKecamatan)
        .leftJoin(refKabupaten, eq(refKecamatan.kabupatenId, refKabupaten.id))
        .where(whereClause)
        .orderBy(orderBy)
        .limit(pageSize)
        .offset(offset);

      const totalCountResult = await db
        .select({ count: refKecamatan.id })
        .from(refKecamatan)
        .leftJoin(refKabupaten, eq(refKecamatan.kabupatenId, refKabupaten.id))
        .where(whereClause);

      const totalCount = Number(totalCountResult[0]?.count ?? 0);

      return {
        data,
        total: totalCount,
        page,
        pageSize,
        totalPages: Math.ceil(totalCount / pageSize),
      };
    });
  }

  async findById(id: number) {
    return safeQuery('RefKecamatan.findById', async () => {
      const result = await db
        .select({
          id: refKecamatan.id,
          kode: refKecamatan.kode,
          nama: refKecamatan.nama,
          kabupatenId: refKecamatan.kabupatenId,
          kabupatenNama: refKabupaten.nama,
          kodepos: refKecamatan.kodepos,
          aktif: refKecamatan.aktif,
        })
        .from(refKecamatan)
        .leftJoin(refKabupaten, eq(refKecamatan.kabupatenId, refKabupaten.id))
        .where(eq(refKecamatan.id, BigInt(id)))
        .limit(1);

      return result[0] || null;
    });
  }

  async findByKode(kode: string) {
    return safeQuery('RefKecamatan.findByKode', async () => {
      const result = await db
        .select()
        .from(refKecamatan)
        .where(eq(refKecamatan.kode, kode))
        .limit(1);
      return result[0] || null;
    });
  }

  async findActiveOnly(kabupatenId?: number) {
    return safeQuery('RefKecamatan.findActiveOnly', async () => {
      const conditions = [eq(refKecamatan.aktif, 'y')];
      if (kabupatenId) {
        conditions.push(eq(refKecamatan.kabupatenId, kabupatenId));
      }

      return await db
        .select()
        .from(refKecamatan)
        .where(and(...conditions))
        .orderBy(asc(refKecamatan.nama));
    });
  }

  async searchByName(query: string, limit = 10) {
    return safeQuery('RefKecamatan.searchByName', async () => {
      return await db
        .select()
        .from(refKecamatan)
        .where(
          and(
            ilike(refKecamatan.nama, `%${query}%`),
            eq(refKecamatan.aktif, 'y')
          )
        )
        .orderBy(asc(refKecamatan.nama))
        .limit(limit);
    });
  }

  async create(data: RefKecamatanInsert) {
    return safeQuery('RefKecamatan.create', async () => {
      const result = await db.insert(refKecamatan).values(data).returning();
      return result[0];
    });
  }

  async update(id: number, data: Partial<RefKecamatanInsert>) {
    return safeQuery('RefKecamatan.update', async () => {
      const result = await db
        .update(refKecamatan)
        .set(data)
        .where(eq(refKecamatan.id, BigInt(id)))
        .returning();
      return result[0];
    });
  }

  async softDelete(id: number) {
    return safeQuery('RefKecamatan.softDelete', async () => {
      const result = await db
        .update(refKecamatan)
        .set({ aktif: 'n' })
        .where(eq(refKecamatan.id, BigInt(id)))
        .returning();
      return result[0];
    });
  }

  async delete(id: number) {
    return safeQuery('RefKecamatan.delete', async () => {
      const result = await db
        .delete(refKecamatan)
        .where(eq(refKecamatan.id, BigInt(id)))
        .returning();
      return result[0];
    });
  }

  async isKodeExists(kode: string, excludeId?: number) {
    return safeQuery('RefKecamatan.isKodeExists', async () => {
      const conditions = [eq(refKecamatan.kode, kode)];
      if (excludeId) {
        conditions.push(not(eq(refKecamatan.id, BigInt(excludeId))));
      }

      const whereClause = conditions.length > 1 ? and(...conditions) : conditions[0];
      const result = await db
        .select({ id: refKecamatan.id })
        .from(refKecamatan)
        .where(whereClause)
        .limit(1);
      return result.length > 0;
    });
  }
}

export const refKecamatanRepository = new RefKecamatanRepository();