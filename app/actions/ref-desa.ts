"use server";

import { auth } from '@/auth';
import { refDesaRepository } from '@/lib/repositories/ref-desa.repository';
import { refDesaService } from '@/lib/services/ref-desa.service';
import { refDesaSchema, refDesaUpdateSchema, type RefDesaInput, type RefDesaUpdateInput } from '@/lib/validation/schemas';
import { revalidatePath } from 'next/cache';

export async function getRefDesaList(params: {
  page: number;
  pageSize?: number;
  search?: string;
  aktif?: 'y' | 'n';
  field?: string;
  direction?: 'asc' | 'desc';
}) {
  try {
    // Ensure required pagination fields exist to match repository `ListParams`
    const callParams = {
      ...params,
      pageSize: params.pageSize ?? 20,
    };
    const result = await refDesaRepository.findMany(callParams);
    return { success: true, data: result };
  } catch (error) {
    console.error('Error fetching ref desa list:', error);
    return { success: false, error: 'Gagal mengambil data desa/kelurahan' };
  }
}

export async function getRefDesaById(id: number) {
  try {
    const result = await refDesaRepository.findById(id);
    if (!result) {
      return { success: false, error: 'Data desa/kelurahan tidak ditemukan' };
    }
    return { success: true, data: result };
  } catch (error) {
    console.error('Error fetching ref desa by id:', error);
    return { success: false, error: 'Gagal mengambil data desa/kelurahan' };
  }
}

export async function getActiveRefDesaList() {
  try {
    const result = await refDesaService.getActiveList();
    return { success: true, data: result };
  } catch (error) {
    console.error('Error fetching active ref desa list:', error);
    return { success: false, error: 'Gagal mengambil data desa/kelurahan aktif' };
  }
}

export async function createRefDesa(data: RefDesaInput) {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: 'Unauthorized' };
    }

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

    const validatedData = refDesaSchema.parse(data);
    const result = await refDesaService.create(validatedData);
    revalidatePath('/dashboard/referensi/desa');
    return { success: true, data: result };
  } catch (error) {
    console.error('Error creating ref desa:', error);
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: 'Gagal menambah data desa/kelurahan' };
  }
}

export async function updateRefDesa(id: number, data: RefDesaUpdateInput) {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: 'Unauthorized' };
    }

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

    const validatedData = refDesaUpdateSchema.parse(data);
    const result = await refDesaService.update(id, validatedData);
    revalidatePath('/dashboard/referensi/desa');
    revalidatePath(`/dashboard/referensi/desa/${id}`);
    return { success: true, data: result };
  } catch (error) {
    console.error('Error updating ref desa:', error);
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: 'Gagal mengubah data desa/kelurahan' };
  }
}

export async function softDeleteRefDesa(id: number) {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: 'Unauthorized' };
    }

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

    const result = await refDesaService.softDelete(id);
    revalidatePath('/dashboard/referensi/desa');
    revalidatePath(`/dashboard/referensi/desa/${id}`);
    return { success: true, data: result };
  } catch (error) {
    console.error('Error soft deleting ref desa:', error);
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: 'Gagal menghapus data desa/kelurahan' };
  }
}

export async function deleteRefDesa(id: number) {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: 'Unauthorized' };
    }

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

    const result = await refDesaService.delete(id);
    revalidatePath('/dashboard/referensi/desa');
    return { success: true, data: result };
  } catch (error) {
    console.error('Error deleting ref desa:', error);
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: 'Gagal menghapus data desa/kelurahan' };
  }
}
