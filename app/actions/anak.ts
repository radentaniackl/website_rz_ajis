'use server';

import { auth } from '@/auth';
import { listAnakByUser, getAnakById } from '@/lib/services/anak.service';
import * as anakRepo from '@/lib/repositories/anak.repository';
import { anakSchema, anakUpdateSchema, type AnakInput, type AnakUpdateInput } from '@/lib/validation/schemas';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';

export async function getAnakList(params: { page?: number; pageSize?: number; search?: string }) {
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

    const result = await listAnakByUser(user, params);
    return { success: true, data: result };
  } catch (error) {
    console.error('Error fetching anak list:', error);
    return { success: false, error: 'Failed to fetch anak list' };
  }
}

export async function getAnakDetail(id: number) {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: 'Unauthorized' };
    }

    const anak = await getAnakById(id);
    if (!anak) {
      return { success: false, error: 'Anak not found' };
    }

    // TODO: Add RBAC check to ensure user can access this anak
    // For now, return the data
    return { success: true, data: anak };
  } catch (error) {
    console.error('Error fetching anak detail:', error);
    return { success: false, error: 'Failed to fetch anak detail' };
  }
}

export async function createAnakAction(data: AnakInput) {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: 'Unauthorized' };
    }

    // Validate input
    const validatedData = anakSchema.parse(data);

    // Convert date strings to Date objects
    const processedData = {
      ...validatedData,
      tglLahir: new Date(validatedData.tglLahir),
      tglTerdaftar: validatedData.tglTerdaftar ? new Date(validatedData.tglTerdaftar) : undefined,
      tglPengajuan: validatedData.tglPengajuan ? new Date(validatedData.tglPengajuan) : undefined,
      tglKematianAyah: validatedData.tglKematianAyah ? new Date(validatedData.tglKematianAyah) : undefined,
      tglKematianIbu: validatedData.tglKematianIbu ? new Date(validatedData.tglKematianIbu) : undefined,
      tglPeminjaman: validatedData.tglPeminjaman ? new Date(validatedData.tglPeminjaman) : undefined,
      tglExpired: validatedData.tglExpired ? new Date(validatedData.tglExpired) : undefined,
      // Set RBAC fields based on user role
      kantorId: session.user.kantor_id,
      wilayahPembinaanId: session.user.id_wilayah_pembinaan?.[0], // TODO: Handle multiple wilayah
    };

    const anak = await anakRepo.createAnak(processedData);
    
    revalidatePath('/dashboard/anak');
    return { success: true, data: anak };
  } catch (error: any) {
    console.error('Error creating anak:', error);
    if (error.name === 'ZodError') {
      return { success: false, error: 'Validation error', details: error.errors };
    }
    return { success: false, error: 'Failed to create anak' };
  }
}

export async function updateAnakAction(id: number, data: AnakUpdateInput) {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: 'Unauthorized' };
    }

    // Validate input
    const validatedData = anakUpdateSchema.parse(data);

    // Convert date strings to Date objects
    const processedData: any = { ...validatedData };
    if (validatedData.tglLahir) processedData.tglLahir = new Date(validatedData.tglLahir);
    if (validatedData.tglTerdaftar) processedData.tglTerdaftar = new Date(validatedData.tglTerdaftar);
    if (validatedData.tglPengajuan) processedData.tglPengajuan = new Date(validatedData.tglPengajuan);
    if (validatedData.tglKematianAyah) processedData.tglKematianAyah = new Date(validatedData.tglKematianAyah);
    if (validatedData.tglKematianIbu) processedData.tglKematianIbu = new Date(validatedData.tglKematianIbu);
    if (validatedData.tglPeminjaman) processedData.tglPeminjaman = new Date(validatedData.tglPeminjaman);
    if (validatedData.tglExpired) processedData.tglExpired = new Date(validatedData.tglExpired);

    const anak = await anakRepo.updateAnak(id, processedData);
    
    if (!anak) {
      return { success: false, error: 'Anak not found' };
    }
    
    revalidatePath('/dashboard/anak');
    revalidatePath(`/dashboard/anak/${id}`);
    return { success: true, data: anak };
  } catch (error: any) {
    console.error('Error updating anak:', error);
    if (error.name === 'ZodError') {
      return { success: false, error: 'Validation error', details: error.errors };
    }
    return { success: false, error: 'Failed to update anak' };
  }
}

export async function deleteAnakAction(id: number) {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: 'Unauthorized' };
    }

    // Soft delete by setting aktif to 'n'
    const anak = await anakRepo.deactivateAnak(id);
    
    if (!anak) {
      return { success: false, error: 'Anak not found' };
    }
    
    revalidatePath('/dashboard/anak');
    return { success: true, data: anak };
  } catch (error) {
    console.error('Error deleting anak:', error);
    return { success: false, error: 'Failed to delete anak' };
  }
}
