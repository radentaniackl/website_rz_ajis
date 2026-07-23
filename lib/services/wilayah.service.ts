import * as wilayahRepo from '@/lib/repositories/wilayah.repository';
import { ajisWilayahPembinaan } from '@/lib/db/schema';
import { buildRbacFilter } from '@/lib/rbac/filters';
import { db } from '@/lib/repositories/base.repository';
import { sql, count } from 'drizzle-orm';

/**
 * Wilayah Pembinaan Service
 * Tanggung jawab:
 *   - Logika bisnis pengelolaan data wilayah pembinaan
 *   - Menerapkan RBAC scope filter sebelum memanggil repository
 *   - Tidak berinteraksi langsung dengan database
 */

export type UserSession = {
  id: number;
  id_group_user: number;
  kantor_id: number | null;
  id_wilayah_pembinaan?: number[];
};

export type ListWilayahOptions = {
  page?: number;
  pageSize?: number;
  search?: string;
  aktif?: 'y' | 'n';
  kantorId?: number;
};

/**
 * Mendapatkan daftar wilayah dengan scope RBAC yang sesuai peran user.
 * Super Admin → semua wilayah
 * Branch Admin → wilayah di kantor mereka
 * Korwil → tidak ada akses (wilayah hanya Super Admin dan Branch Admin)
 */
export async function listWilayahByUser(
  user: UserSession,
  options: ListWilayahOptions = {}
) {
  const { page = 1, pageSize = 20, search, aktif = 'y' } = options;

  // RBAC: Super Admin dan Branch Admin dapat mengakses wilayah
  if (user.id_group_user === 9) {
    // Korwil tidak punya akses ke wilayah
    return {
      data: [],
      total: 0,
      page,
      pageSize,
      totalPages: 0,
    };
  }

  // Branch Admin: filter by kantor_id
  let kantorIdFilter = options.kantorId;
  if (user.id_group_user === 2 && user.kantor_id) {
    kantorIdFilter = user.kantor_id;
  }

  return wilayahRepo.listWilayah({
    page,
    pageSize,
    search,
    aktif,
    kantorId: kantorIdFilter,
  });
}

/**
 * Mendapatkan detail satu wilayah. Validasi akses dilakukan di Server Action.
 */
export async function getWilayahById(id: number) {
  return wilayahRepo.findWilayahById(id);
}

export async function checkWilayahDependencies(id: number) {
  // returns map of table -> count of referencing rows
  const { ajisAnak } = await import('@/lib/db/schema');
  const { eq } = await import('drizzle-orm');
  
  const checks = {
    anak: db.select({ total: count() }).from(ajisAnak).where(eq(ajisAnak.wilayahPembinaanId, BigInt(id))),
    sdmWilayah: db.select({ total: count() }).from(sql`ajis_sdm_wilayah`).where(sql`penugasan_wilayah_id = ${BigInt(id)}`),
    users: db.select({ total: count() }).from(sql`ajis_user_wilayah_pembinaan`).where(sql`wilayah_pembinaan_id = ${BigInt(id)}`),
  } as const;

  const keys = Object.keys(checks) as (keyof typeof checks)[];
  const results = await Promise.all(keys.map((k) => checks[k]));

  const summary: Record<string, number> = {};
  keys.forEach((k, i) => {
    summary[k] = Number(results[i]?.[0]?.total ?? 0);
  });
  return summary;
}

export async function deleteWilayahForUser(user: UserSession, id: number, options?: { force?: boolean }) {
  // RBAC: Hanya Super Admin dan Branch Admin yang bisa menghapus wilayah
  if (user.id_group_user === 9) {
    return { success: false, error: 'Unauthorized - Korwil cannot delete wilayah' };
  }

  const existing = await wilayahRepo.findWilayahById(id);
  if (!existing) return { success: false, error: 'Wilayah not found' };

  // Branch Admin: hanya bisa menghapus wilayah di kantor mereka
  if (user.id_group_user === 2 && user.kantor_id) {
    const existingKantorId = existing.kantorId ? Number(existing.kantorId) : null;
    if (existingKantorId !== user.kantor_id) {
      return { success: false, error: 'Forbidden - You can only delete wilayah in your kantor' };
    }
  }

  const deps = await checkWilayahDependencies(id);
  const hasDeps = Object.values(deps).some((v) => v > 0);
  if (hasDeps && !options?.force) {
    return { success: false, error: 'Has dependents', dependents: deps };
  }

  const deleted = await wilayahRepo.deleteWilayah(id);
  if (!deleted) return { success: false, error: 'Failed to delete wilayah' };
  return { success: true, data: deleted };
}
