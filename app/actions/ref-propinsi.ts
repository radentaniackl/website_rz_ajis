"use server";

import { refPropinsiRepository } from '@/lib/repositories/ref-propinsi.repository';
import { refPropinsiService } from '@/lib/services/ref-propinsi.service';
import { refPropinsiSchema, refPropinsiUpdateSchema, type RefPropinsiInput, type RefPropinsiUpdateInput } from '@/lib/validation/schemas';
import { requireAuth } from '@/lib/auth/utils';
import { revalidatePath } from 'next/cache';

/**
 * Mendapatkan daftar propinsi dengan pagination, filter, dan sorting
 */
export async function getRefPropinsiList(params: {
  page: number;
  pageSize: number;
  search?: string;
  aktif?: 'y' | 'n';
  field?: string;
  direction?: 'asc' | 'desc';
}) {
  try {
    const result = await refPropinsiRepository.findMany(params);
    return { success: true, data: result };
  } catch (error) {
    console.error('Error fetching ref propinsi list:', error);
    return { success: false, error: 'Gagal mengambil data propinsi' };
  }
}

/**
 * Mendapatkan propinsi berdasarkan ID
 */
export async function getRefPropinsiById(id: number) {
  try {
    const result = await refPropinsiRepository.findById(id);
    if (!result) {
      return { success: false, error: 'Data propinsi tidak ditemukan' };
    }
    return { success: true, data: result };
  } catch (error) {
    console.error('Error fetching ref propinsi by id:', error);
    return { success: false, error: 'Gagal mengambil data propinsi' };
  }
}

/**
 * Mendapatkan daftar propinsi aktif untuk dropdown
 */
export async function getActiveRefPropinsiList() {
  try {
    const result = await refPropinsiService.getActiveList();
    return { success: true, data: result };
  } catch (error) {
    console.error('Error fetching active ref propinsi list:', error);
    return { success: false, error: 'Gagal mengambil data propinsi aktif' };
  }
}

/**
 * Mencari propinsi berdasarkan nama untuk autocomplete
 */
export async function searchRefPropinsiByName(query: string, limit = 10) {
  try {
    const result = await refPropinsiService.searchByName(query, limit);
    return { success: true, data: result };
  } catch (error) {
    console.error('Error searching ref propinsi:', error);
    return { success: false, error: 'Gagal mencari propinsi' };
  }
}

/**
 * Membuat propinsi baru
 */
export async function createRefPropinsi(data: RefPropinsiInput) {
  try {
    // Validasi RBAC
    const session = await requireAuth();
    const user = {
      id: session.user.id,
      id_group_user: session.user.id_group_user,
      kantor_id: session.user.kantor_id,
      wilayah_ids: session.user.id_wilayah_pembinaan,
    };

    // RBAC check: Korwil cannot create reference data (read-only access)
    if (user.id_group_user === 9) {
      return { success: false, error: 'Anda tidak memiliki izin untuk menambah data referensi' };
    }

    // Validasi input dengan Zod
    const validatedData = refPropinsiSchema.parse(data);

    // Buat propinsi baru
    const result = await refPropinsiService.create(validatedData);

    // Revalidate cache
    revalidatePath('/dashboard/referensi/propinsi');

    return { success: true, data: result };
  } catch (error) {
    console.error('Error creating ref propinsi:', error);
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: 'Gagal menambah data propinsi' };
  }
}

/**
 * Update propinsi yang ada
 */
export async function updateRefPropinsi(id: number, data: RefPropinsiUpdateInput) {
  try {
    // Validasi RBAC
    const session = await requireAuth();
    const user = {
      id: session.user.id,
      id_group_user: session.user.id_group_user,
      kantor_id: session.user.kantor_id,
      wilayah_ids: session.user.id_wilayah_pembinaan,
    };

    // RBAC check: Korwil cannot update reference data (read-only access)
    if (user.id_group_user === 9) {
      return { success: false, error: 'Anda tidak memiliki izin untuk mengubah data referensi' };
    }

    // Validasi input dengan Zod
    const validatedData = refPropinsiUpdateSchema.parse(data);

    // Update propinsi
    const result = await refPropinsiService.update(id, validatedData);

    // Revalidate cache
    revalidatePath('/dashboard/referensi/propinsi');
    revalidatePath(`/dashboard/referensi/propinsi/${id}`);

    return { success: true, data: result };
  } catch (error) {
    console.error('Error updating ref propinsi:', error);
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: 'Gagal mengubah data propinsi' };
  }
}

/**
 * Soft delete propinsi (set aktif = 'n')
 */
export async function softDeleteRefPropinsi(id: number) {
  try {
    // Validasi RBAC
    const session = await requireAuth();
    const user = {
      id: session.user.id,
      id_group_user: session.user.id_group_user,
      kantor_id: session.user.kantor_id,
      wilayah_ids: session.user.id_wilayah_pembinaan,
    };

    // RBAC check: Korwil cannot delete reference data (read-only access)
    if (user.id_group_user === 9) {
      return { success: false, error: 'Anda tidak memiliki izin untuk menghapus data referensi' };
    }

    // Soft delete propinsi
    const result = await refPropinsiService.softDelete(id);

    // Revalidate cache
    revalidatePath('/dashboard/referensi/propinsi');
    revalidatePath(`/dashboard/referensi/propinsi/${id}`);

    return { success: true, data: result };
  } catch (error) {
    console.error('Error soft deleting ref propinsi:', error);
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: 'Gagal menghapus data propinsi' };
  }
}

/**
 * Hard delete propinsi (berhati-hati: cek referensi dulu)
 */
export async function deleteRefPropinsi(id: number) {
  try {
    // Validasi RBAC
    const session = await requireAuth();
    const user = {
      id: session.user.id,
      id_group_user: session.user.id_group_user,
      kantor_id: session.user.kantor_id,
      wilayah_ids: session.user.id_wilayah_pembinaan,
    };

    // RBAC check: Korwil cannot delete reference data (read-only access)
    if (user.id_group_user === 9) {
      return { success: false, error: 'Anda tidak memiliki izin untuk menghapus data referensi' };
    }

    // Hard delete propinsi
    const result = await refPropinsiService.delete(id);

    // Revalidate cache
    revalidatePath('/dashboard/referensi/propinsi');

    return { success: true, data: result };
  } catch (error) {
    console.error('Error deleting ref propinsi:', error);
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: 'Gagal menghapus data propinsi' };
  }
}
