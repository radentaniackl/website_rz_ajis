import * as kantorRepo from '@/lib/repositories/kantor.repository';
import { ajisKantor } from '@/db/schema';
import { buildRbacFilter } from '@/lib/rbac/filters';
import { db } from '@/lib/repositories/base.repository';
import { count, sql, and, eq } from 'drizzle-orm';

/**
 * Kantor Service
 * Tanggung jawab:
 *   - Logika bisnis pengelolaan data kantor
 *   - Menerapkan RBAC scope filter sebelum memanggil repository
 *   - Tidak berinteraksi langsung dengan database
 */

export type UserSession = {
  id: number;
  id_group_user: number;
  kantor_id: number | null;
  id_wilayah_pembinaan?: number[];
};

export type ListKantorOptions = {
  page?: number;
  pageSize?: number;
  search?: string;
  aktif?: 'y' | 'n';
};

/**
 * Mendapatkan daftar kantor dengan scope RBAC yang sesuai peran user.
 * Super Admin → semua kantor
 * Branch Admin → tidak ada akses (kantor hanya Super Admin)
 * Korwil → tidak ada akses (kantor hanya Super Admin)
 */
export async function listKantorByUser(
  user: UserSession,
  options: ListKantorOptions = {}
) {
  const { page = 1, pageSize = 20, search, aktif = 'y' } = options;

  // RBAC: Hanya Super Admin yang bisa melihat semua kantor
  const rbacFilter = buildRbacFilter(user, ajisKantor);

  // Branch Admin dan Korwil tidak punya akses ke kantor
  if (user.id_group_user !== 1) {
    return {
      data: [],
      total: 0,
      page,
      pageSize,
      totalPages: 0,
    };
  }

  return kantorRepo.listKantor({
    page,
    pageSize,
    search,
    aktif,
  });
}

/**
 * Mendapatkan detail satu kantor. Validasi akses dilakukan di Server Action.
 */
export async function getKantorById(id: number) {
  return kantorRepo.findKantorById(id);
}

export async function checkKantorDependencies(id: number) {
  // returns map of table -> count of referencing rows
  const checks = {
    wilayahPembinaan: db.select({ total: count() }).from(sql`ajis_wilayah_pembinaan`).where(sql`kantor_id = ${BigInt(id)}`),
    users: db.select({ total: count() }).from(sql`ajis_user`).where(sql`kantor_id = ${BigInt(id)}`),
    sdmWilayah: db.select({ total: count() }).from(sql`ajis_sdm_wilayah`).where(sql`penugasan_kantor_id = ${BigInt(id)}`),
    anak: db.select({ total: count() }).from(sql`ajis_anak`).where(sql`kantor_id = ${BigInt(id)}`),
  } as const;

  const keys = Object.keys(checks) as (keyof typeof checks)[];
  const results = await Promise.all(keys.map((k) => checks[k]));

  const summary: Record<string, number> = {};
  keys.forEach((k, i) => {
    summary[k] = Number(results[i]?.[0]?.total ?? 0);
  });
  return summary;
}

export async function deleteKantorForUser(user: UserSession, id: number, options?: { force?: boolean }) {
  // RBAC: Hanya Super Admin yang bisa menghapus kantor
  if (user.id_group_user !== 1) {
    return { success: false, error: 'Unauthorized - Only Super Admin can delete kantor' };
  }

  const existing = await kantorRepo.findKantorById(id);
  if (!existing) return { success: false, error: 'Kantor not found' };

  const deps = await checkKantorDependencies(id);
  const hasDeps = Object.values(deps).some((v) => v > 0);
  if (hasDeps && !options?.force) {
    return { success: false, error: 'Has dependents', dependents: deps };
  }

  // perform hard delete
  const deleted = await kantorRepo.deleteKantor(id);
  if (!deleted) return { success: false, error: 'Failed to delete kantor' };
  return { success: true, data: deleted };
}
