"use server";

import { refKecamatanRepository } from '@/lib/repositories/ref-kecamatan.repository';
import { refKecamatanService } from '@/lib/services/ref-kecamatan.service';
import { refKecamatanSchema, refKecamatanUpdateSchema, type RefKecamatanInput, type RefKecamatanUpdateInput } from '@/lib/validation/schemas';
import { requireAuth } from '@/lib/auth/utils';
import { revalidatePath } from 'next/cache';

export async function getRefKecamatanList(params: {
  page: number;
  pageSize: number;
  search?: string;
  aktif?: 'y' | 'n';
  field?: string;
  direction?: 'asc' | 'desc';
}) {
  try {
    const result = await refKecamatanRepository.findMany(params);
    return { success: true, data: result };
  } catch (error) {
    console.error('Error fetching ref kecamatan list:', error);
    return { success: false, error: 'Gagal mengambil data kecamatan' };
  }
}

export async function getRefKecamatanById(id: number) {
  try {
    const result = await refKecamatanRepository.findById(id);
    if (!result) {
      return { success: false, error: 'Data kecamatan tidak ditemukan' };
    }
    return { success: true, data: result };
  } catch (error) {
    console.error('Error fetching ref kecamatan by id:', error);
    return { success: false, error: 'Gagal mengambil data kecamatan' };
  }
}

export async function getActiveRefKecamatanList() {
  try {
    const result = await refKecamatanService.getActiveList();
    return { success: true, data: result };
  } catch (error) {
    console.error('Error fetching active ref kecamatan list:', error);
    return { success: false, error: 'Gagal mengambil data kecamatan aktif' };
  }
}

export async function createRefKecamatan(data: RefKecamatanInput) {
  try {
    const session = await requireAuth();
    if (session.user.id_group_user !== 1) {
      return { success: false, error: 'Anda tidak memiliki izin untuk menambah data referensi' };
    }

    const validatedData = refKecamatanSchema.parse(data);
    const result = await refKecamatanService.create(validatedData);
    revalidatePath('/dashboard/referensi/kecamatan');
    return { success: true, data: result };
  } catch (error) {
    console.error('Error creating ref kecamatan:', error);
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: 'Gagal menambah data kecamatan' };
  }
}

export async function updateRefKecamatan(id: number, data: RefKecamatanUpdateInput) {
  try {
    const session = await requireAuth();
    if (session.user.id_group_user !== 1) {
      return { success: false, error: 'Anda tidak memiliki izin untuk mengubah data referensi' };
    }

    const validatedData = refKecamatanUpdateSchema.parse(data);
    const result = await refKecamatanService.update(id, validatedData);
    revalidatePath('/dashboard/referensi/kecamatan');
    revalidatePath(`/dashboard/referensi/kecamatan/${id}`);
    return { success: true, data: result };
  } catch (error) {
    console.error('Error updating ref kecamatan:', error);
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: 'Gagal mengubah data kecamatan' };
  }
}

export async function softDeleteRefKecamatan(id: number) {
  try {
    const session = await requireAuth();
    if (session.user.id_group_user !== 1) {
      return { success: false, error: 'Anda tidak memiliki izin untuk menghapus data referensi' };
    }

    const result = await refKecamatanService.softDelete(id);
    revalidatePath('/dashboard/referensi/kecamatan');
    revalidatePath(`/dashboard/referensi/kecamatan/${id}`);
    return { success: true, data: result };
  } catch (error) {
    console.error('Error soft deleting ref kecamatan:', error);
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: 'Gagal menghapus data kecamatan' };
  }
}

export async function deleteRefKecamatan(id: number) {
  try {
    const session = await requireAuth();
    if (session.user.id_group_user !== 1) {
      return { success: false, error: 'Anda tidak memiliki izin untuk menghapus data referensi' };
    }

    const result = await refKecamatanService.delete(id);
    revalidatePath('/dashboard/referensi/kecamatan');
    return { success: true, data: result };
  } catch (error) {
    console.error('Error deleting ref kecamatan:', error);
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: 'Gagal menghapus data kecamatan' };
  }
}
