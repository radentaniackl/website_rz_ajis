"use server";

import { refKabupatenRepository } from '@/lib/repositories/ref-kabupaten.repository';
import { refKabupatenService } from '@/lib/services/ref-kabupaten.service';
import { refKabupatenSchema, refKabupatenUpdateSchema, type RefKabupatenInput, type RefKabupatenUpdateInput } from '@/lib/validation/schemas';
import { requireAuth } from '@/lib/auth/utils';
import { revalidatePath } from 'next/cache';

export async function getRefKabupatenList(params: {
  page: number;
  pageSize?: number;
  search?: string;
  aktif?: 'y' | 'n';
  field?: string;
  direction?: 'asc' | 'desc';
}) {
  try {
    const result = await refKabupatenRepository.findMany(params);
    return { success: true, data: result };
  } catch (error) {
    console.error('Error fetching ref kabupaten list:', error);
    return { success: false, error: 'Gagal mengambil data kabupaten/kota' };
  }
}

export async function getRefKabupatenById(id: number) {
  try {
    const result = await refKabupatenRepository.findById(id);
    if (!result) {
      return { success: false, error: 'Data kabupaten/kota tidak ditemukan' };
    }
    return { success: true, data: result };
  } catch (error) {
    console.error('Error fetching ref kabupaten by id:', error);
    return { success: false, error: 'Gagal mengambil data kabupaten/kota' };
  }
}

export async function getActiveRefKabupatenList() {
  try {
    const result = await refKabupatenService.getActiveList();
    return { success: true, data: result };
  } catch (error) {
    console.error('Error fetching active ref kabupaten list:', error);
    return { success: false, error: 'Gagal mengambil data kabupaten/kota aktif' };
  }
}

export async function createRefKabupaten(data: RefKabupatenInput) {
  try {
    const session = await requireAuth();
    if (session.user.id_group_user !== 1) {
      return { success: false, error: 'Anda tidak memiliki izin untuk menambah data referensi' };
    }

    const validatedData = refKabupatenSchema.parse(data);
    const result = await refKabupatenService.create(validatedData);
    revalidatePath('/dashboard/referensi/kabupaten');
    return { success: true, data: result };
  } catch (error) {
    console.error('Error creating ref kabupaten:', error);
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: 'Gagal menambah data kabupaten/kota' };
  }
}

export async function updateRefKabupaten(id: number, data: RefKabupatenUpdateInput) {
  try {
    const session = await requireAuth();
    if (session.user.id_group_user !== 1) {
      return { success: false, error: 'Anda tidak memiliki izin untuk mengubah data referensi' };
    }

    const validatedData = refKabupatenUpdateSchema.parse(data);
    const result = await refKabupatenService.update(id, validatedData);
    revalidatePath('/dashboard/referensi/kabupaten');
    revalidatePath(`/dashboard/referensi/kabupaten/${id}`);
    return { success: true, data: result };
  } catch (error) {
    console.error('Error updating ref kabupaten:', error);
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: 'Gagal mengubah data kabupaten/kota' };
  }
}

export async function softDeleteRefKabupaten(id: number) {
  try {
    const session = await requireAuth();
    if (session.user.id_group_user !== 1) {
      return { success: false, error: 'Anda tidak memiliki izin untuk menghapus data referensi' };
    }

    const result = await refKabupatenService.softDelete(id);
    revalidatePath('/dashboard/referensi/kabupaten');
    revalidatePath(`/dashboard/referensi/kabupaten/${id}`);
    return { success: true, data: result };
  } catch (error) {
    console.error('Error soft deleting ref kabupaten:', error);
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: 'Gagal menghapus data kabupaten/kota' };
  }
}

export async function deleteRefKabupaten(id: number) {
  try {
    const session = await requireAuth();
    if (session.user.id_group_user !== 1) {
      return { success: false, error: 'Anda tidak memiliki izin untuk menghapus data referensi' };
    }

    const result = await refKabupatenService.delete(id);
    revalidatePath('/dashboard/referensi/kabupaten');
    return { success: true, data: result };
  } catch (error) {
    console.error('Error deleting ref kabupaten:', error);
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: 'Gagal menghapus data kabupaten/kota' };
  }
}
