import * as anakRepo from '@/lib/repositories/anak.repository';
import { ajisAnak } from '@/db/schema';
import { buildRbacFilter } from '@/lib/rbac/filters';
import { db } from '@/lib/repositories/base.repository';
import { count, sql } from 'drizzle-orm';
import {
  pemasangan,
  donasiTransaksi,
  penyaluran,
  peminjamanAjisAnak,
  hafalanAnak,
  penilaianAnak,
  laporanSemester,
  laporanSemesterPembinaan,
  laporanPrestasi,
  prestasiAnak,
  pembinaan,
} from '@/db/schema';

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

export async function checkAnakDependencies(id: number) {
  // returns map of table -> count of referencing rows
  const checks = {
    pemasangan: db.select({ total: count() }).from(pemasangan).where(sql`${pemasangan.anakId} = ${BigInt(id)}`),
    donasiTransaksi: db.select({ total: count() }).from(donasiTransaksi).where(sql`${donasiTransaksi.anakId} = ${BigInt(id)}`),
    penyaluran: db.select({ total: count() }).from(penyaluran).where(sql`${penyaluran.anakId} = ${BigInt(id)}`),
    peminjaman: db.select({ total: count() }).from(peminjamanAjisAnak).where(sql`${peminjamanAjisAnak.anakId} = ${BigInt(id)}`),
    hafalan: db.select({ total: count() }).from(hafalanAnak).where(sql`${hafalanAnak.anakId} = ${BigInt(id)}`),
    penilaian: db.select({ total: count() }).from(penilaianAnak).where(sql`${penilaianAnak.anakId} = ${BigInt(id)}`),
    laporanSemester: db.select({ total: count() }).from(laporanSemester).where(sql`${laporanSemester.anakId} = ${BigInt(id)}`),
    laporanSemesterPembinaan: db.select({ total: count() }).from(laporanSemesterPembinaan).where(sql`${laporanSemesterPembinaan.anakId} = ${BigInt(id)}`),
    laporanPrestasi: db.select({ total: count() }).from(laporanPrestasi).where(sql`${laporanPrestasi.anakId} = ${BigInt(id)}`),
    prestasi: db.select({ total: count() }).from(prestasiAnak).where(sql`${prestasiAnak.anakId} = ${BigInt(id)}`),
    pembinaan: db.select({ total: count() }).from(pembinaan).where(sql`${pembinaan.anakId} = ${BigInt(id)}`),
  } as const;

  const keys = Object.keys(checks) as (keyof typeof checks)[];
  const results = await Promise.all(keys.map((k) => checks[k]));

  const summary: Record<string, number> = {};
  keys.forEach((k, i) => {
    summary[k] = Number(results[i]?.[0]?.total ?? 0);
  });
  return summary;
}

export async function deleteAnakForUser(user: UserSession, id: number, options?: { force?: boolean }) {
  const existing = await anakRepo.findAnakById(id);
  if (!existing) return { success: false, error: 'Anak not found' };

  // RBAC: ensure user can delete this anak
  const filter = buildRbacFilter(user, ajisAnak);
  if (filter) {
    // ensure the anak row matches the filter
    const match = await db.select().from(ajisAnak).where(and(filter, eq(ajisAnak.id, BigInt(id)))).limit(1);
    if (!match.length) return { success: false, error: 'Unauthorized to delete this anak' };
  }

  const deps = await checkAnakDependencies(id);
  const hasDeps = Object.values(deps).some((v) => v > 0);
  if (hasDeps && !options?.force) {
    return { success: false, error: 'Has dependents', dependents: deps };
  }

  // perform hard delete
  const deleted = await anakRepo.deleteAnak(id);
  if (!deleted) return { success: false, error: 'Failed to delete anak' };
  return { success: true, data: deleted };
}
