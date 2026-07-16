import { refPropinsiRepository } from '../repositories/ref-propinsi.repository';
import { refKabupaten } from '@/db/schema';
import { db } from '@/lib/db';
import { eq } from 'drizzle-orm';
import type { RefPropinsiInsert } from '../repositories/ref-propinsi.repository';

/**
 * RefPropinsi Service
 * Menangani business logic untuk referensi propinsi
 */
export class RefPropinsiService {
  /**
   * Validasi apakah kode propinsi unik
   */
  async validateKodeUnique(kode: string, excludeId?: number): Promise<boolean> {
    const exists = await refPropinsiRepository.isKodeExists(kode, excludeId);
    return !exists;
  }

  /**
   * Validasi apakah propinsi dapat dihapus (tidak direferensi oleh kabupaten)
   */
  async validateNotReferenced(id: number): Promise<{ valid: boolean; message?: string }> {
    // Cek apakah ada kabupaten yang mereferensi propinsi ini
    const referencedCount = await db
      .select({ count: refKabupaten.id })
      .from(refKabupaten)
      .where(eq(refKabupaten.propinsiId, id));

    const count = Number(referencedCount[0]?.count ?? 0);

    if (count > 0) {
      return {
        valid: false,
        message: `Tidak dapat menghapus: propinsi digunakan oleh ${count} data kabupaten`,
      };
    }

    return { valid: true };
  }

  /**
   * Mendapatkan daftar propinsi aktif untuk dropdown
   */
  async getActiveList() {
    return refPropinsiRepository.findActiveOnly();
  }

  /**
   * Mencari propinsi berdasarkan nama untuk autocomplete
   */
  async searchByName(query: string, limit = 10) {
    return refPropinsiRepository.searchByName(query, limit);
  }

  /**
   * Membuat propinsi baru dengan validasi
   */
  async create(data: RefPropinsiInsert) {
    // Validasi kode unik
    const isUnique = await this.validateKodeUnique(data.kode);
    if (!isUnique) {
      throw new Error('Kode propinsi sudah digunakan');
    }

    return refPropinsiRepository.create(data);
  }

  /**
   * Update propinsi dengan validasi
   */
  async update(id: number, data: Partial<RefPropinsiInsert>) {
    // Validasi kode unik jika kode diubah
    if (data.kode) {
      const isUnique = await this.validateKodeUnique(data.kode, id);
      if (!isUnique) {
        throw new Error('Kode propinsi sudah digunakan');
      }
    }

    return refPropinsiRepository.update(id, data);
  }

  /**
   * Soft delete propinsi dengan validasi referensi
   */
  async softDelete(id: number) {
    // Validasi referensi
    const validation = await this.validateNotReferenced(id);
    if (!validation.valid) {
      throw new Error(validation.message);
    }

    return refPropinsiRepository.softDelete(id);
  }

  /**
   * Hard delete propinsi dengan validasi referensi
   */
  async delete(id: number) {
    // Validasi referensi
    const validation = await this.validateNotReferenced(id);
    if (!validation.valid) {
      throw new Error(validation.message);
    }

    return refPropinsiRepository.delete(id);
  }
}

// Singleton instance
export const refPropinsiService = new RefPropinsiService();
