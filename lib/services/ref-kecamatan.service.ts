import { db } from '@/lib/db';
import { refKecamatan, refDesa } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { refKecamatanRepository } from '@/lib/repositories/ref-kecamatan.repository';
import type { RefKecamatanInsert } from '@/lib/repositories/ref-kecamatan.repository';

export class RefKecamatanService {
  async validateKodeUnique(kode: string, excludeId?: number): Promise<boolean> {
    const exists = await refKecamatanRepository.isKodeExists(kode, excludeId);
    return !exists;
  }

  async validateNotReferenced(id: number): Promise<{ valid: boolean; message?: string }> {
    const result = await db
      .select({ count: refDesa.id })
      .from(refDesa)
      .where(eq(refDesa.kecamatanId, id));

    const count = result[0]?.count ?? 0;

    if (count > 0) {
      return {
        valid: false,
        message: `Tidak dapat menghapus: kecamatan digunakan oleh ${count} data desa`,
      };
    }

    return { valid: true };
  }

  async getActiveList(kabupatenId?: number) {
    return refKecamatanRepository.findActiveOnly(kabupatenId);
  }

  async searchByName(query: string, limit = 10) {
    return refKecamatanRepository.searchByName(query, limit);
  }

  async create(data: RefKecamatanInsert) {
    const isUnique = await this.validateKodeUnique(data.kode);
    if (!isUnique) {
      throw new Error('Kode kecamatan sudah digunakan');
    }

    return refKecamatanRepository.create(data);
  }

  async update(id: number, data: Partial<RefKecamatanInsert>) {
    if (data.kode) {
      const isUnique = await this.validateKodeUnique(data.kode, id);
      if (!isUnique) {
        throw new Error('Kode kecamatan sudah digunakan');
      }
    }

    return refKecamatanRepository.update(id, data);
  }

  async softDelete(id: number) {
    const validation = await this.validateNotReferenced(id);
    if (!validation.valid) {
      throw new Error(validation.message);
    }

    return refKecamatanRepository.softDelete(id);
  }

  async delete(id: number) {
    const validation = await this.validateNotReferenced(id);
    if (!validation.valid) {
      throw new Error(validation.message);
    }

    return refKecamatanRepository.delete(id);
  }
}

export const refKecamatanService = new RefKecamatanService();