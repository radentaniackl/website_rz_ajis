'use server';

import { auth } from '@/auth';
import { pembinaanDokumentasiSchema, pembinaanDokumentasiUpdateSchema, type PembinaanDokumentasiInput, type PembinaanDokumentasiUpdateInput } from '@/lib/validation/schemas';
import * as dokumentasiRepo from '@/lib/repositories/pembinaan-dokumentasi.repository';
import * as dokumentasiService from '@/lib/services/pembinaan-dokumentasi.service';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { ZodError } from 'zod';

// RBAC: Pembinaan Dokumentasi adalah data operasional, semua role bisa read
// Hanya Super Admin dan Branch Admin yang bisa create/update/delete

export async function getPembinaanDokumentasiList(params: { 
  page?: number; 
  pageSize?: number; 
  search?: string;
  semesterId?: number;
  kantorId?: number;
  wilayahPembinaanId?: number;
}) {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: 'Unauthorized' };
    }

    const userSession = {
      id: Number(session.user.id),
      id_group_user: session.user.id_group_user || 1,
      kantor_id: session.user.kantor_id,
      id_wilayah_pembinaan: session.user.id_wilayah_pembinaan,
    };

    const result = await dokumentasiService.listDokumentasiByUser(userSession, params);
    return { success: true, data: result };
  } catch (error) {
    console.error('Error fetching dokumentasi list:', error);
    return { success: false, error: 'Failed to fetch dokumentasi list' };
  }
}

export async function getPembinaanDokumentasiDetail(id: number) {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: 'Unauthorized' };
    }

    const dokumentasi = await dokumentasiService.getDokumentasiById(id);
    if (!dokumentasi) {
      return { success: false, error: 'Dokumentasi not found' };
    }

    return { success: true, data: dokumentasi };
  } catch (error) {
    console.error('Error fetching dokumentasi detail:', error);
    return { success: false, error: 'Failed to fetch dokumentasi detail' };
  }
}

export async function getPembinaanDokumentasiBySemester(semesterId: number) {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: 'Unauthorized' };
    }

    const result = await dokumentasiRepo.listPembinaanDokumentasiBySemester(semesterId);
    return { success: true, data: result };
  } catch (error) {
    console.error('Error fetching pembinaan dokumentasi by semester:', error);
    return { success: false, error: 'Failed to fetch pembinaan dokumentasi by semester' };
  }
}

export async function createPembinaanDokumentasiAction(data: PembinaanDokumentasiInput) {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: 'Unauthorized' };
    }

    // RBAC: Hanya Super Admin dan Branch Admin yang bisa create dokumentasi
    if (session.user.id_group_user !== 1 && session.user.id_group_user !== 2) {
      return { success: false, error: 'Anda tidak memiliki izin untuk menambah dokumentasi' };
    }

    // Validate data
    const validatedData = pembinaanDokumentasiSchema.parse(data);

    const result = await dokumentasiRepo.createPembinaanDokumentasi(validatedData);

    revalidatePath('/dashboard/pembinaan-dokumentasi');
    revalidatePath('/dashboard/sesi');

    return { success: true, data: result };
  } catch (error) {
    if (error instanceof ZodError) {
      return { success: false, error: error.errors[0].message };
    }
    console.error('Error creating pembinaan dokumentasi:', error);
    return { success: false, error: 'Failed to create pembinaan dokumentasi' };
  }
}

export async function updatePembinaanDokumentasiAction(id: number, data: PembinaanDokumentasiUpdateInput) {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: 'Unauthorized' };
    }

    // RBAC: Hanya Super Admin dan Branch Admin yang bisa update dokumentasi
    if (session.user.id_group_user !== 1 && session.user.id_group_user !== 2) {
      return { success: false, error: 'Anda tidak memiliki izin untuk mengubah dokumentasi' };
    }

    // Validate data
    const validatedData = pembinaanDokumentasiUpdateSchema.parse(data);

    const result = await dokumentasiRepo.updatePembinaanDokumentasi(id, validatedData);

    revalidatePath('/dashboard/pembinaan-dokumentasi');
    revalidatePath('/dashboard/sesi');
    revalidatePath(`/dashboard/pembinaan-dokumentasi/${id}`);

    return { success: true, data: result };
  } catch (error) {
    if (error instanceof ZodError) {
      return { success: false, error: error.errors[0].message };
    }
    console.error('Error updating pembinaan dokumentasi:', error);
    return { success: false, error: 'Failed to update pembinaan dokumentasi' };
  }
}

export async function deletePembinaanDokumentasiAction(id: number) {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: 'Unauthorized' };
    }

    if (session.user.id_group_user !== 1 && session.user.id_group_user !== 2) {
      return { success: false, error: 'Anda tidak memiliki izin untuk menghapus pembinaan dokumentasi' };
    }

    const userSession = {
      id: Number(session.user.id),
      id_group_user: session.user.id_group_user || 1,
      kantor_id: session.user.kantor_id,
      id_wilayah_pembinaan: session.user.id_wilayah_pembinaan,
    };

    const result = await dokumentasiService.deleteDokumentasiForUser(userSession, id);

    if (!result.success) {
      return result;
    }

    revalidatePath('/dashboard/pembinaan-dokumentasi');
    revalidatePath('/dashboard/sesi');

    return { success: true, data: result.data };
  } catch (error) {
    console.error('Error deleting pembinaan dokumentasi:', error);
    return { success: false, error: 'Failed to delete pembinaan dokumentasi' };
  }
}
