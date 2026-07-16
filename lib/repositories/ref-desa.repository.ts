import { db, getOffset, safeQuery, type ListParams } from './base.repository';
import { refDesa, refKecamatan } from '@/db/schema';
import { eq, ilike, or, and, desc, asc, not } from 'drizzle-orm';

type RefDesa = typeof refDesa.$inferSelect;
export type RefDesaInsert = typeof refDesa.$inferInsert;

export class RefDesaRepository {
  async findMany(params: ListParams & { kecamatanId?: number; aktif?: 'y' | 'n' }) {
    const {
      page = 1,
      pageSize = 20,
      search,
      field = 'nama',
      direction = 'asc',
      kecamatanId,
      aktif,
    } = params;
    const offset = getOffset(page, pageSize);
    const conditions = [];

    if (search) {
      conditions.push(
        or(
          ilike(refDesa.kode, `%${search}%`),
          ilike(refDesa.nama, `%${search}%`),
          ilike(refKecamatan.nama, `%${search}%`)
        )
      );
    }

    if (kecamatanId) {
      conditions.push(eq(refDesa.kecamatanId, kecamatanId));
    }

    if (aktif) {
      conditions.push(eq(refDesa.aktif, aktif));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
    const orderByColumn =
      field === 'kode'
        ? refDesa.kode
        : field === 'kecamatan'
        ? refKecamatan.nama
        : refDesa.nama;
    const orderBy = direction === 'desc' ? desc(orderByColumn) : asc(orderByColumn);

    return safeQuery('RefDesa.findMany', async () => {
      const data = await db
        .select({
          id: refDesa.id,
          kode: refDesa.kode,
          nama: refDesa.nama,
          kecamatanId: refDesa.kecamatanId,
          kecamatanNama: refKecamatan.nama,
          isKelurahan: refDesa.isKelurahan,
          nomorIndukDesa: refDesa.nomorIndukDesa,
          aktif: refDesa.aktif,
        })
        .from(refDesa)
        .leftJoin(refKecamatan, eq(refDesa.kecamatanId, refKecamatan.id))
        .where(whereClause)
        .orderBy(orderBy)
        .limit(pageSize)
        .offset(offset);

      const totalCountResult = await db
        .select({ count: refDesa.id })
        .from(refDesa)
        .leftJoin(refKecamatan, eq(refDesa.kecamatanId, refKecamatan.id))
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
    return safeQuery('RefDesa.findById', async () => {
      const result = await db
        .select({
          id: refDesa.id,
          kode: refDesa.kode,
          nama: refDesa.nama,
          kecamatanId: refDesa.kecamatanId,
          kecamatanNama: refKecamatan.nama,
          isKelurahan: refDesa.isKelurahan,
          nomorIndukDesa: refDesa.nomorIndukDesa,
          aktif: refDesa.aktif,
        })
        .from(refDesa)
        .leftJoin(refKecamatan, eq(refDesa.kecamatanId, refKecamatan.id))
        .where(eq(refDesa.id, BigInt(id)))
        .limit(1);

      return result[0] || null;
    });
  }

  async findByKode(kode: string) {
    return safeQuery('RefDesa.findByKode', async () => {
      const result = await db
        .select()
        .from(refDesa)
        .where(eq(refDesa.kode, kode))
        .limit(1);
      return result[0] || null;
    });
  }

  async findActiveOnly(kecamatanId?: number) {
    return safeQuery('RefDesa.findActiveOnly', async () => {
      const conditions = [eq(refDesa.aktif, 'y')];
      if (kecamatanId) {
        conditions.push(eq(refDesa.kecamatanId, kecamatanId));
      }

      return await db
        .select()
        .from(refDesa)
        .where(and(...conditions))
        .orderBy(asc(refDesa.nama));
    });
  }

  async searchByName(query: string, limit = 10) {
    return safeQuery('RefDesa.searchByName', async () => {
      return await db
        .select()
        .from(refDesa)
        .where(
          and(
            ilike(refDesa.nama, `%${query}%`),
            eq(refDesa.aktif, 'y')
          )
        )
        .orderBy(asc(refDesa.nama))
        .limit(limit);
    });
  }

  async create(data: RefDesaInsert) {
    return safeQuery('RefDesa.create', async () => {
      const result = await db.insert(refDesa).values(data).returning();
      return result[0];
    });
  }

  async update(id: number, data: Partial<RefDesaInsert>) {
    return safeQuery('RefDesa.update', async () => {
      const result = await db
        .update(refDesa)
        .set(data)
        .where(eq(refDesa.id, BigInt(id)))
        .returning();
      return result[0];
    });
  }

  async softDelete(id: number) {
    return safeQuery('RefDesa.softDelete', async () => {
      const result = await db
        .update(refDesa)
        .set({ aktif: 'n' })
        .where(eq(refDesa.id, BigInt(id)))
        .returning();
      return result[0];
    });
  }

  async delete(id: number) {
    return safeQuery('RefDesa.delete', async () => {
      const result = await db
        .delete(refDesa)
        .where(eq(refDesa.id, BigInt(id)))
        .returning();
      return result[0];
    });
  }

  async isKodeExists(kode: string, excludeId?: number) {
    return safeQuery('RefDesa.isKodeExists', async () => {
      const conditions = [eq(refDesa.kode, kode)];
      if (excludeId) {
        conditions.push(not(eq(refDesa.id, BigInt(excludeId))));
      }

      const whereClause = conditions.length > 1 ? and(...conditions) : conditions[0];
      const result = await db
        .select({ id: refDesa.id })
        .from(refDesa)
        .where(whereClause)
        .limit(1);
      return result.length > 0;
    });
  }
}

export const refDesaRepository = new RefDesaRepository();