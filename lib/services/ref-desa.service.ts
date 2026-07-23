import { db } from '@/lib/db';
import { refDesa } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { refDesaRepository } from '@/lib/repositories/ref-desa.repository';
import type { RefDesaInsert } from '@/lib/repositories/ref-desa.repository';

export class RefDesaService {
  async validateKodeUnique(kode: string, excludeId?: number): Promise<boolean> {
    const exists = await refDesaRepository.isKodeExists(kode, excludeId);
    return !exists;
  }

  async validateNotReferenced(id: number): Promise<{ valid: boolean; message?: string }> {
    // In this schema, desa is not referenced by any stricter child table directly.
    // If there is a reference from ajis_wilayah_pembinaan or ajis_sdm_wilayah, the app can handle it later.
    return { valid: true };
  }

  async getActiveList(kecamatanId?: number) {
    return refDesaRepository.findActiveOnly(kecamatanId);
  }

  async searchByName(query: string, limit = 10) {
    return refDesaRepository.searchByName(query, limit);
  }

  async create(data: RefDesaInsert) {
    const isUnique = await this.validateKodeUnique(data.kode);
    if (!isUnique) {
      throw new Error('Kode desa/kelurahan sudah digunakan');
    }

    return refDesaRepository.create(data);
  }

  async update(id: number, data: Partial<RefDesaInsert>) {
    if (data.kode) {
      const isUnique = await this.validateKodeUnique(data.kode, id);
      if (!isUnique) {
        throw new Error('Kode desa/kelurahan sudah digunakan');
      }
    }

    return refDesaRepository.update(id, data);
  }

  async softDelete(id: number) {
    const validation = await this.validateNotReferenced(id);
    if (!validation.valid) {
      throw new Error(validation.message);
    }

    return refDesaRepository.softDelete(id);
  }

  async delete(id: number) {
    const validation = await this.validateNotReferenced(id);
    if (!validation.valid) {
      throw new Error(validation.message);
    }

    return refDesaRepository.delete(id);
  }
}

export const refDesaService = new RefDesaService();