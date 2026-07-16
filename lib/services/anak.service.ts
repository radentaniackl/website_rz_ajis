import * as anakRepo from '@/lib/repositories/anak.repository';
import { ajisAnak } from '@/db/schema';
import { buildRbacFilter } from '@/lib/rbac/filters';

/**
 * Anak Service
 * Tanggung jawab:
 *   - Logika bisnis pengelolaan data anak
 *   - Menerapkan RBAC scope filter sebelum memanggil repository
 *   - Tidak berinteraksi langsung dengan database
 */

export type UserSession = {
  id: number;
  id_group_user: number;
  kantor_id: number | null;
  wilayah_ids?: number[];
};

export type ListAnakOptions = {
  page?: number;
  pageSize?: number;
  search?: string;
  aktif?: 'y' | 'n';
};

/**
 * Mendapatkan daftar anak dengan scope RBAC yang sesuai peran user.
 * Super Admin → semua anak
 * Branch Admin → anak di kantornya
 * Korwil → anak di wilayah pembinaannya
 */
export async function listAnakByUser(
  user: UserSession,
  options: ListAnakOptions = {}
) {
  const { page = 1, pageSize = 20, search, aktif = 'y' } = options;

  const rbacFilter = buildRbacFilter(user, ajisAnak);

  return anakRepo.listAnak({
    page,
    pageSize,
    search,
    aktif,
    rbacFilter,
  });
}

/**
 * Mendapatkan detail satu anak. Validasi akses dilakukan di Server Action.
 */
export async function getAnakById(id: number) {
  return anakRepo.findAnakById(id);
}
