import * as donaturRepo from '@/lib/repositories/donatur.repository';
import { donatur } from '@/lib/db/schema';
import { db } from '@/lib/repositories/base.repository';
import { count, sql, and, eq } from 'drizzle-orm';
import {
  pemasukan,
  donasiTransaksi,
  penyaluran,
  pembinaan,
} from '@/lib/db/schema';

/**
 * Donatur Service
 * Tanggung jawab:
 *   - Logika bisnis pengelolaan data donatur
 *   - Donatur adalah data master/global
 *   - Semua role bisa read, hanya Super Admin bisa CUD
 *   - Tidak berinteraksi langsung dengan database
 */

export type UserSession = {
  id: number;
  id_group_user: number;
  kantor_id: number | null;
  id_wilayah_pembinaan?: number[];
};

export type ListDonaturOptions = {
  page?: number;
  pageSize?: number;
  search?: string;
  statusDonatur?: string;
  aktif?: 'y' | 'n' | 'p';
  kantorDonaturId?: number;
  field?: string;
  direction?: 'asc' | 'desc';
};

/**
 * Mendapatkan daftar donatur.
 * Donatur adalah data master — semua role bisa read tanpa filter RBAC.
 */
export async function listDonaturByUser(
  user: UserSession,
  options: ListDonaturOptions = {}
) {
  const {
    page = 1,
    pageSize = 20,
    search,
    statusDonatur,
    aktif,
    kantorDonaturId,
    field,
    direction,
  } = options;

  return donaturRepo.listDonatur({
    page,
    pageSize,
    search,
    statusDonatur,
    aktif,
    kantorDonaturId,
    field,
    direction,
  });
}

/**
 * Mendapatkan detail satu donatur.
 */
export async function getDonaturById(id: number) {
  return donaturRepo.findDonaturById(id);
}

/**
 * Cek dependensi donatur sebelum delete.
 * Memastikan tidak ada data yang bergantung pada donatur ini.
 */
export async function checkDonaturDependencies(id: number) {
  const checks = {
    pemasangan: db
      .select({ total: count() })
      .from(pemasangan)
      .where(sql`${pemasangan.donaturId} = ${BigInt(id)}`),
    donasiTransaksi: db
      .select({ total: count() })
      .from(donasiTransaksi)
      .where(sql`${donasiTransaksi.donaturId} = ${BigInt(id)}`),
    penyaluran: db
      .select({ total: count() })
      .from(penyaluran)
      .where(sql`${penyaluran.donaturId} = ${BigInt(id)}`),
    pembinaan: db
      .select({ total: count() })
      .from(pembinaan)
      .where(sql`${pembinaan.donaturId} = ${BigInt(id)}`),
  } as const;

  const keys = Object.keys(checks) as (keyof typeof checks)[];
  const results = await Promise.all(keys.map((k) => checks[k]));

  const summary: Record<string, number> = {};
  keys.forEach((k, i) => {
    summary[k] = Number(results[i]?.[0]?.total ?? 0);
  });
  return summary;
}

/**
 * Hapus donatur dengan pengecekan dependensi.
 */
export async function deleteDonaturForUser(
  user: UserSession,
  id: number,
  options?: { force?: boolean }
) {
  const existing = await donaturRepo.findDonaturById(id);
  if (!existing) return { success: false, error: 'Donatur not found' };

  const deps = await checkDonaturDependencies(id);
  const hasDeps = Object.values(deps).some((v) => v > 0);
  if (hasDeps && !options?.force) {
    return { success: false, error: 'Has dependents', dependents: deps };
  }

  const deleted = await donaturRepo.deleteDonatur(id);
  if (!deleted) return { success: false, error: 'Failed to delete donatur' };
  return { success: true, data: deleted };
}
