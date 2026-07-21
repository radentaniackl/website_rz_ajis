import * as userRepo from '@/lib/repositories/user.repository';
import { buildRbacFilter } from '@/lib/rbac/filters';

/**
 * User Service
 * Tanggung jawab:
 *   - Logika bisnis pengelolaan data user
 *   - Menerapkan RBAC scope filter sebelum memanggil repository
 *   - Tidak berinteraksi langsung dengan database
 */

export type UserSession = {
  id: number;
  id_group_user: number;
  kantor_id: number | null;
  id_wilayah_pembinaan?: number[];
};

export type ListUsersOptions = {
  page?: number;
  pageSize?: number;
  search?: string;
  aktif?: 'y' | 'n';
};

/**
 * Mendapatkan daftar user dengan scope RBAC yang sesuai peran user.
 * Super Admin → semua user
 * Branch Admin → user di kantor mereka
 * Korwil → tidak ada akses (user hanya Super Admin dan Branch Admin)
 */
export async function listUsersByUser(
  user: UserSession,
  options: ListUsersOptions = {}
) {
  const { page = 1, pageSize = 20, search, aktif = 'y' } = options;

  // RBAC: Super Admin dan Branch Admin dapat mengakses user
  if (user.id_group_user === 9) {
    // Korwil tidak punya akses ke user
    return {
      data: [],
      total: 0,
      page,
      pageSize,
      totalPages: 0,
    };
  }

  // Build RBAC filter
  const rbacFilter = buildRbacFilter({
    id_group_user: user.id_group_user,
    kantor_id: user.kantor_id,
    id_wilayah_pembinaan: user.id_wilayah_pembinaan,
  }, 'ajis_user');

  return userRepo.listUsers({
    page,
    pageSize,
    search,
    rbacFilter,
    kantorId: user.id_group_user === 2 ? user.kantor_id : undefined,
  });
}

/**
 * Mendapatkan detail satu user. Validasi akses dilakukan di Server Action.
 */
export async function getUserById(id: number) {
  return userRepo.findUserById(id);
}

export async function checkUserDependencies(id: number) {
  // returns map of table -> count of referencing rows
  const { db, sql } = await import('@/lib/repositories/base.repository');
  const { count } = await import('drizzle-orm');
  const { eq } = await import('drizzle-orm');
  
  const checks = {
    anak: db.select({ total: count() }).from(sql`ajis_anak`).where(sql`user_insert = ${BigInt(id)}`),
    sdmWilayah: db.select({ total: count() }).from(sql`ajis_sdm_wilayah`).where(sql`user_insert = ${BigInt(id)}`),
    userWilayah: db.select({ total: count() }).from(sql`ajis_user_wilayah_pembinaan`).where(sql`user_id = ${BigInt(id)}`),
  } as const;

  const keys = Object.keys(checks) as (keyof typeof checks)[];
  const results = await Promise.all(keys.map((k) => checks[k]));

  const summary: Record<string, number> = {};
  keys.forEach((k, i) => {
    summary[k] = Number(results[i]?.[0]?.total ?? 0);
  });
  return summary;
}

export async function deleteUserForUser(user: UserSession, id: number, options?: { force?: boolean }) {
  // RBAC: Hanya Super Admin dan Branch Admin yang bisa menghapus user
  if (user.id_group_user === 9) {
    return { success: false, error: 'Unauthorized - Korwil cannot delete user' };
  }

  const existing = await userRepo.findUserById(id);
  if (!existing) return { success: false, error: 'User not found' };

  // Branch Admin: hanya bisa menghapus user di kantor mereka
  if (user.id_group_user === 2 && user.kantor_id) {
    const existingKantorId = existing.kantorId ? Number(existing.kantorId) : null;
    if (existingKantorId !== user.kantor_id) {
      return { success: false, error: 'Forbidden - You can only delete users in your kantor' };
    }
  }

  const deps = await checkUserDependencies(id);
  const hasDeps = Object.values(deps).some((v) => v > 0);
  if (hasDeps && !options?.force) {
    return { success: false, error: 'Has dependents', dependents: deps };
  }

  const deleted = await userRepo.deactivateUser(id);
  if (!deleted) return { success: false, error: 'Failed to delete user' };
  return { success: true, data: deleted };
}
