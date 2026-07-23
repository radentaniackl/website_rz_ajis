import { db } from '@/lib/db';
import { refKabupaten, refKecamatan } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { refKabupatenRepository } from '@/lib/repositories/ref-kabupaten.repository';
import type { RefKabupatenInsert } from '@/lib/repositories/ref-kabupaten.repository';

export class RefKabupatenService {
  async validateKodeUnique(kode: string, excludeId?: number): Promise<boolean> {
    const exists = await refKabupatenRepository.isKodeExists(kode, excludeId);
    return !exists;
  }

  async validateNotReferenced(id: number): Promise<{ valid: boolean; message?: string }> {
    const result = await db
      .select({ count: refKecamatan.id })
      .from(refKecamatan)
      .where(eq(refKecamatan.kabupatenId, id));

    const count = result[0]?.count ?? 0;

    if (count > 0) {
      return {
        valid: false,
        message: `Tidak dapat menghapus: kabupaten/kota digunakan oleh ${count} data kecamatan`,
      };
    }

    return { valid: true };
  }

  async getActiveList(propinsiId?: number) {
    return refKabupatenRepository.findActiveOnly(propinsiId);
  }

  async searchByName(query: string, limit = 10) {
    return refKabupatenRepository.searchByName(query, limit);
  }

  async create(data: RefKabupatenInsert) {
    const isUnique = await this.validateKodeUnique(data.kode);
    if (!isUnique) {
      throw new Error('Kode kabupaten/kota sudah digunakan');
    }

    return refKabupatenRepository.create(data);
  }

  async update(id: number, data: Partial<RefKabupatenInsert>) {
    if (data.kode) {
      const isUnique = await this.validateKodeUnique(data.kode, id);
      if (!isUnique) {
        throw new Error('Kode kabupaten/kota sudah digunakan');
      }
    }

    return refKabupatenRepository.update(id, data);
  }

  async softDelete(id: number) {
    const validation = await this.validateNotReferenced(id);
    if (!validation.valid) {
      throw new Error(validation.message);
    }

    return refKabupatenRepository.softDelete(id);
  }

  async delete(id: number) {
    const validation = await this.validateNotReferenced(id);
    if (!validation.valid) {
      throw new Error(validation.message);
    }

    return refKabupatenRepository.delete(id);
  }
}

export const refKabupatenService = new RefKabupatenService();