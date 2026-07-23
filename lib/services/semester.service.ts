import * as semesterRepo from '@/lib/repositories/semester.repository';
import { ajisSemester } from '@/lib/db/schema';
import { db } from '@/lib/repositories/base.repository';
import { count, sql } from 'drizzle-orm';
import { pembinaan, laporanSemester, laporanSemesterPembinaan } from '@/lib/db/schema';

export type UserSession = {
  id: number;
  id_group_user: number;
  kantor_id: number | null;
  id_wilayah_pembinaan?: number[];
};

export type ListSemesterOptions = {
  page?: number;
  pageSize?: number;
  search?: string;
  field?: string;
  direction?: 'asc' | 'desc';
};

export async function listSemesterByUser(
  user: UserSession,
  options: ListSemesterOptions = {}
) {
  // Semester is global master data, no RBAC filter needed for read
  return semesterRepo.listSemester(options);
}

export async function getSemesterById(id: number) {
  return semesterRepo.findSemesterById(id);
}

export async function checkSemesterDependencies(id: number) {
  const checks = {
    pembinaan: db
      .select({ total: count() })
      .from(pembinaan)
      .where(sql`${pembinaan.semesterId} = ${BigInt(id)}`),
    laporanSemester: db
      .select({ total: count() })
      .from(laporanSemester)
      .where(sql`${laporanSemester.semesterId} = ${BigInt(id)}`),
    laporanSemesterPembinaan: db
      .select({ total: count() })
      .from(laporanSemesterPembinaan)
      .where(sql`${laporanSemesterPembinaan.semesterId} = ${BigInt(id)}`),
  } as const;

  const keys = Object.keys(checks) as (keyof typeof checks)[];
  const results = await Promise.all(keys.map((k) => checks[k]));

  const summary: Record<string, number> = {};
  keys.forEach((k, i) => {
    summary[k] = Number(results[i]?.[0]?.total ?? 0);
  });
  return summary;
}

export async function deleteSemesterForUser(
  user: UserSession,
  id: number,
  options?: { force?: boolean }
) {
  const existing = await semesterRepo.findSemesterById(id);
  if (!existing) return { success: false, error: 'Semester not found' };

  const deps = await checkSemesterDependencies(id);
  const hasDeps = Object.values(deps).some((v) => v > 0);
  if (hasDeps && !options?.force) {
    return { success: false, error: 'Has dependents', dependents: deps };
  }

  const deleted = await semesterRepo.deleteSemester(id);
  if (!deleted) return { success: false, error: 'Failed to delete semester' };
  return { success: true, data: deleted };
}
