import { db, getOffset, safeQuery, type ListParams } from './base.repository';
import { refPropinsi } from '@/lib/db/schema';
import { eq, ilike, or, and, desc, asc, not } from 'drizzle-orm';

// Infer the type from the table schema
type RefPropinsi = typeof refPropinsi.$inferSelect;
export type RefPropinsiInsert = typeof refPropinsi.$inferInsert;

/**
 * RefPropinsi Repository
 * Menangani operasi database untuk tabel ref_propinsi
 */
export class RefPropinsiRepository {
  /**
   * Mendapatkan daftar propinsi dengan pagination, filter, dan sorting
   */
  async findMany(params: ListParams & { aktif?: 'y' | 'n' }) {
    const { page = 1, pageSize = 20, search, aktif, field = 'nama', direction = 'asc' } = params;
    const offset = getOffset(page, pageSize);

    console.log('RefPropinsiRepository.findMany called with:', { page, pageSize, search, aktif, field, direction });

    // Build WHERE conditions
    const conditions = [];

    if (search) {
      conditions.push(
        or(
          ilike(refPropinsi.kode, `%${search}%`),
          ilike(refPropinsi.nama, `%${search}%`)
        )
      );
    }

    if (aktif) {
      conditions.push(eq(refPropinsi.aktif, aktif));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Build ORDER BY
    const orderByColumn = field === 'kode' ? refPropinsi.kode : 
                         field === 'ibukota' ? refPropinsi.ibukota : 
                         refPropinsi.nama;
    
    const orderBy = direction === 'desc' ? desc(orderByColumn) : asc(orderByColumn);

    return safeQuery('RefPropinsi.findMany', async () => {
      const data = await db
        .select()
        .from(refPropinsi)
        .where(whereClause)
        .orderBy(orderBy)
        .limit(pageSize)
        .offset(offset);

      console.log('RefPropinsiRepository data query result:', data);

      const totalCountResult = await db
        .select({ count: refPropinsi.id })
        .from(refPropinsi)
        .where(whereClause);

      const totalCount = Number(totalCountResult[0]?.count ?? 0);

      console.log('RefPropinsiRepository total count:', totalCount);

      return {
        data,
        total: totalCount,
        page,
        pageSize,
        totalPages: Math.ceil(totalCount / pageSize),
      };
    });
  }

  /**
   * Mendapatkan propinsi berdasarkan ID
   */
  async findById(id: number): Promise<RefPropinsi | null> {
    return safeQuery('RefPropinsi.findById', async () => {
      const result = await db
        .select()
        .from(refPropinsi)
        .where(eq(refPropinsi.id, BigInt(id)))
        .limit(1);

      return result[0] || null;
    });
  }

  /**
   * Mendapatkan propinsi berdasarkan kode
   */
  async findByKode(kode: string): Promise<RefPropinsi | null> {
    return safeQuery('RefPropinsi.findByKode', async () => {
      const result = await db
        .select()
        .from(refPropinsi)
        .where(eq(refPropinsi.kode, kode))
        .limit(1);

      return result[0] || null;
    });
  }

  /**
   * Mencari propinsi aktif saja (untuk dropdown)
   */
  async findActiveOnly() {
    return safeQuery('RefPropinsi.findActiveOnly', async () => {
      return await db
        .select()
        .from(refPropinsi)
        .where(eq(refPropinsi.aktif, 'y'))
        .orderBy(asc(refPropinsi.nama));
    });
  }

  /**
   * Pencarian berdasarkan nama (untuk autocomplete)
   */
  async searchByName(query: string, limit = 10) {
    return safeQuery('RefPropinsi.searchByName', async () => {
      return await db
        .select()
        .from(refPropinsi)
        .where(
          and(
            ilike(refPropinsi.nama, `%${query}%`),
            eq(refPropinsi.aktif, 'y')
          )
        )
        .orderBy(asc(refPropinsi.nama))
        .limit(limit);
    });
  }

  /**
   * Membuat propinsi baru
   */
  async create(data: RefPropinsiInsert) {
    return safeQuery('RefPropinsi.create', async () => {
      const result = await db
        .insert(refPropinsi)
        .values(data)
        .returning();

      return result[0];
    });
  }

  /**
   * Update propinsi yang ada
   */
  async update(id: number, data: Partial<RefPropinsiInsert>) {
    return safeQuery('RefPropinsi.update', async () => {
      const result = await db
        .update(refPropinsi)
        .set(data)
        .where(eq(refPropinsi.id, BigInt(id)))
        .returning();

      return result[0];
    });
  }

  /**
   * Soft delete propinsi (set aktif = 'n')
   */
  async softDelete(id: number) {
    return safeQuery('RefPropinsi.softDelete', async () => {
      const result = await db
        .update(refPropinsi)
        .set({ aktif: 'n' })
        .where(eq(refPropinsi.id, BigInt(id)))
        .returning();

      return result[0];
    });
  }

  /**
   * Hard delete propinsi (berhati-hati: cek referensi dulu)
   */
  async delete(id: number) {
    return safeQuery('RefPropinsi.delete', async () => {
      const result = await db
        .delete(refPropinsi)
        .where(eq(refPropinsi.id, BigInt(id)))
        .returning();

      return result[0];
    });
  }

  /**
   * Menghitung jumlah propinsi berdasarkan filter
   */
  async count(params: { aktif?: 'y' | 'n' } = {}) {
    return safeQuery('RefPropinsi.count', async () => {
      const conditions = [];

      if (params.aktif) {
        conditions.push(eq(refPropinsi.aktif, params.aktif));
      }

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      const result = await db
        .select({ count: refPropinsi.id })
        .from(refPropinsi)
        .where(whereClause);

      return result.length;
    });
  }

  /**
   * Cek apakah kode sudah digunakan (untuk validasi)
   */
  async isKodeExists(kode: string, excludeId?: number): Promise<boolean> {
    return safeQuery('RefPropinsi.isKodeExists', async () => {
      const conditions = [eq(refPropinsi.kode, kode)];

      if (excludeId) {
        conditions.push(not(eq(refPropinsi.id, BigInt(excludeId))));
      }

      const whereClause = conditions.length > 1 ? and(...conditions) : conditions[0];

      const result = await db
        .select({ id: refPropinsi.id })
        .from(refPropinsi)
        .where(whereClause)
        .limit(1);

      return result.length > 0;
    });
  }
}

// Singleton instance
export const refPropinsiRepository = new RefPropinsiRepository();
