import * as dokumentasiRepo from '@/lib/repositories/pembinaan-dokumentasi.repository';
import { pembinaanDokumentasi } from '@/lib/db/schema';
import { db } from '@/lib/repositories/base.repository';
import { buildRbacFilter } from '@/lib/rbac/filters';
import { eq, and } from 'drizzle-orm';

export type UserSession = {
  id: number;
  id_group_user: number;
  kantor_id: number | null;
  id_wilayah_pembinaan?: number[];
};

export type ListDokumentasiOptions = {
  page?: number;
  pageSize?: number;
  search?: string;
  semesterId?: number;
  kantorId?: number;
  wilayahPembinaanId?: number;
  field?: string;
  direction?: 'asc' | 'desc';
};

export async function listDokumentasiByUser(
  user: UserSession,
  options: ListDokumentasiOptions = {}
) {
  const {
    page = 1,
    pageSize = 20,
    search,
    semesterId,
    kantorId,
    wilayahPembinaanId,
    field,
    direction,
  } = options;

  const rbacFilter = buildRbacFilter(user, pembinaanDokumentasi);

  return dokumentasiRepo.listPembinaanDokumentasi({
    page,
    pageSize,
    search,
    semesterId,
    kantorId,
    wilayahPembinaanId,
    rbacFilter,
    field,
    direction,
  });
}

export async function getDokumentasiById(id: number) {
  return dokumentasiRepo.findPembinaanDokumentasiById(id);
}

export async function deleteDokumentasiForUser(
  user: UserSession,
  id: number
) {
  const existing = await dokumentasiRepo.findPembinaanDokumentasiById(id);
  if (!existing) return { success: false, error: 'Dokumentasi not found' };

  // RBAC: ensure user can delete this dokumentasi
  const filter = buildRbacFilter(user, pembinaanDokumentasi);
  if (filter) {
    const match = await db
      .select()
      .from(pembinaanDokumentasi)
      .where(and(filter, eq(pembinaanDokumentasi.id, BigInt(id))))
      .limit(1);
    if (!match.length) return { success: false, error: 'Unauthorized to delete this dokumentasi' };
  }

  const deleted = await dokumentasiRepo.deletePembinaanDokumentasi(id);
  if (!deleted) return { success: false, error: 'Failed to delete dokumentasi' };
  return { success: true, data: deleted };
}
