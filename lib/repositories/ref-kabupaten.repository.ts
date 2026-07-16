import { db, getOffset, safeQuery, type ListParams } from './base.repository';
import { refKabupaten, refPropinsi } from '@/db/schema';
import { eq, ilike, or, and, desc, asc, not } from 'drizzle-orm';

type RefKabupaten = typeof refKabupaten.$inferSelect;
export type RefKabupatenInsert = typeof refKabupaten.$inferInsert;

export class RefKabupatenRepository {
  async findMany(params: ListParams & { propinsiId?: number; aktif?: 'y' | 'n' }) {
    const {
      page = 1,
      pageSize = 20,
      search,
      field = 'nama',
      direction = 'asc',
      propinsiId,
      aktif,
    } = params;
    const offset = getOffset(page, pageSize);
    const conditions = [];

    if (search) {
      conditions.push(
        or(
          ilike(refKabupaten.kode, `%${search}%`),
          ilike(refKabupaten.nama, `%${search}%`),
          ilike(refPropinsi.nama, `%${search}%`)
        )
      );
    }

    if (propinsiId) {
      conditions.push(eq(refKabupaten.propinsiId, propinsiId));
    }

    if (aktif) {
      conditions.push(eq(refKabupaten.aktif, aktif));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
    const orderByColumn =
      field === 'kode'
        ? refKabupaten.kode
        : field === 'propinsi'
        ? refPropinsi.nama
        : refKabupaten.nama;
    const orderBy = direction === 'desc' ? desc(orderByColumn) : asc(orderByColumn);

    return safeQuery('RefKabupaten.findMany', async () => {
      const data = await db
        .select({
          id: refKabupaten.id,
          kode: refKabupaten.kode,
          nama: refKabupaten.nama,
          propinsiId: refKabupaten.propinsiId,
          propinsiNama: refPropinsi.nama,
          ibukota: refKabupaten.ibukota,
          isKota: refKabupaten.isKota,
          aktif: refKabupaten.aktif,
        })
        .from(refKabupaten)
        .leftJoin(refPropinsi, eq(refKabupaten.propinsiId, refPropinsi.id))
        .where(whereClause)
        .orderBy(orderBy)
        .limit(pageSize)
        .offset(offset);

      const totalCountResult = await db
        .select({ count: refKabupaten.id })
        .from(refKabupaten)
        .leftJoin(refPropinsi, eq(refKabupaten.propinsiId, refPropinsi.id))
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
    return safeQuery('RefKabupaten.findById', async () => {
      const result = await db
        .select({
          id: refKabupaten.id,
          kode: refKabupaten.kode,
          nama: refKabupaten.nama,
          propinsiId: refKabupaten.propinsiId,
          propinsiNama: refPropinsi.nama,
          ibukota: refKabupaten.ibukota,
          isKota: refKabupaten.isKota,
          aktif: refKabupaten.aktif,
        })
        .from(refKabupaten)
        .leftJoin(refPropinsi, eq(refKabupaten.propinsiId, refPropinsi.id))
        .where(eq(refKabupaten.id, BigInt(id)))
        .limit(1);

      return result[0] || null;
    });
  }

  async findByKode(kode: string) {
    return safeQuery('RefKabupaten.findByKode', async () => {
      const result = await db
        .select()
        .from(refKabupaten)
        .where(eq(refKabupaten.kode, kode))
        .limit(1);

      return result[0] || null;
    });
  }

  async findActiveOnly(propinsiId?: number) {
    return safeQuery('RefKabupaten.findActiveOnly', async () => {
      const conditions = [eq(refKabupaten.aktif, 'y')];
      if (propinsiId) {
        conditions.push(eq(refKabupaten.propinsiId, propinsiId));
      }

      return await db
        .select()
        .from(refKabupaten)
        .where(and(...conditions))
        .orderBy(asc(refKabupaten.nama));
    });
  }

  async searchByName(query: string, limit = 10) {
    return safeQuery('RefKabupaten.searchByName', async () => {
      return await db
        .select()
        .from(refKabupaten)
        .where(
          and(
            ilike(refKabupaten.nama, `%${query}%`),
            eq(refKabupaten.aktif, 'y')
          )
        )
        .orderBy(asc(refKabupaten.nama))
        .limit(limit);
    });
  }

  async create(data: RefKabupatenInsert) {
    return safeQuery('RefKabupaten.create', async () => {
      const result = await db.insert(refKabupaten).values(data).returning();
      return result[0];
    });
  }

  async update(id: number, data: Partial<RefKabupatenInsert>) {
    return safeQuery('RefKabupaten.update', async () => {
      const result = await db
        .update(refKabupaten)
        .set(data)
        .where(eq(refKabupaten.id, BigInt(id)))
        .returning();
      return result[0];
    });
  }

  async softDelete(id: number) {
    return safeQuery('RefKabupaten.softDelete', async () => {
      const result = await db
        .update(refKabupaten)
        .set({ aktif: 'n' })
        .where(eq(refKabupaten.id, BigInt(id)))
        .returning();
      return result[0];
    });
  }

  async delete(id: number) {
    return safeQuery('RefKabupaten.delete', async () => {
      const result = await db
        .delete(refKabupaten)
        .where(eq(refKabupaten.id, BigInt(id)))
        .returning();
      return result[0];
    });
  }

  async isKodeExists(kode: string, excludeId?: number) {
    return safeQuery('RefKabupaten.isKodeExists', async () => {
      const conditions = [eq(refKabupaten.kode, kode)];
      if (excludeId) {
        conditions.push(not(eq(refKabupaten.id, BigInt(excludeId))));
      }

      const whereClause = conditions.length > 1 ? and(...conditions) : conditions[0];
      const result = await db
        .select({ id: refKabupaten.id })
        .from(refKabupaten)
        .where(whereClause)
        .limit(1);

      return result.length > 0;
    });
  }
}

export const refKabupatenRepository = new RefKabupatenRepository();