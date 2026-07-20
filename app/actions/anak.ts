'use server';

import { auth } from '@/auth';
import { listAnakByUser, getAnakById } from '@/lib/services/anak.service';
import * as anakRepo from '@/lib/repositories/anak.repository';
import { deleteAnakForUser } from '@/lib/services/anak.service';
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

    // RBAC check: ensure user can access this anak
    const user = {
      id: session.user.id,
      id_group_user: session.user.id_group_user,
      kantor_id: session.user.kantor_id,
      wilayah_ids: session.user.id_wilayah_pembinaan,
    };

    // Super Admin can access all anak
    if (user.id_group_user === 1) {
      return { success: true, data: anak };
    }

    // Branch Admin can access anak in their kantor or wilayah
    if (user.id_group_user === 2) {
      const can_ACCESS = 
        (user.kantor_id && anak.kantorId === user.kantor_id) ||
        (user.wilayah_ids && user.wilayah_ids.includes(Number(anak.wilayahPembinaanId)));
      
      if (!can_ACCESS) {
        return { success: false, error: 'Forbidden - You do not have access to this anak' };
      }
    }

    // Korwil can only access anak in their assigned wilayah
    if (user.id_group_user === 9) {
      if (!user.wilayah_ids || !user.wilayah_ids.includes(Number(anak.wilayahPembinaanId))) {
        return { success: false, error: 'Forbidden - You do not have access to this anak' };
      }
    }

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

    // RBAC check: Korwil cannot create anak (read-only access)
    if (session.user.id_group_user === 9) {
      return { success: false, error: 'Forbidden - Korwil has read-only access to anak data' };
    }

    // Validate input
    const validatedData = anakSchema.parse(data);

    // Keep date fields as strings (DB/Drizzle schema expects string date fields)
    const processedData = {
      ...validatedData,
      tglLahir: validatedData.tglLahir,
      tglTerdaftar: validatedData.tglTerdaftar ?? undefined,
      tglPengajuan: validatedData.tglPengajuan ?? undefined,
      tglKematianAyah: validatedData.tglKematianAyah ?? undefined,
      tglKematianIbu: validatedData.tglKematianIbu ?? undefined,
      tglPeminjaman: validatedData.tglPeminjaman ?? undefined,
      tglExpired: validatedData.tglExpired ?? undefined,
      // Set RBAC fields based on user role
      kantorId: session.user.kantor_id,
      wilayahPembinaanId: session.user.id_wilayah_pembinaan?.[0], // TODO: Handle multiple wilayah
    };
    // Convert numeric penghasilan fields to strings to match DB insert types
    if (validatedData.penghasilanAyah !== undefined) {
      // @ts-ignore
      processedData.penghasilanAyah = String(validatedData.penghasilanAyah);
    }
    if (validatedData.penghasilanIbu !== undefined) {
      // @ts-ignore
      processedData.penghasilanIbu = String(validatedData.penghasilanIbu);
    }
    if (validatedData.penghasilanWali !== undefined) {
      // @ts-ignore
      processedData.penghasilanWali = String(validatedData.penghasilanWali);
    }

    const anak = await anakRepo.createAnak(processedData as unknown as anakRepo.NewAnak);
    
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

    // Check if anak exists and user has access
    const existing = await getAnakById(id);
    if (!existing) {
      return { success: false, error: 'Anak not found' };
    }

    // RBAC check: ensure user can edit this anak
    const user = {
      id: session.user.id,
      id_group_user: session.user.id_group_user,
      kantor_id: session.user.kantor_id,
      wilayah_ids: session.user.id_wilayah_pembinaan,
    };

    // Super Admin can edit all anak
    if (user.id_group_user === 1) {
      // Proceed with update
    }
    // Branch Admin can edit anak in their kantor or wilayah
    else if (user.id_group_user === 2) {
      const canEdit = 
        (user.kantor_id && existing.kantorId === user.kantor_id) ||
        (user.wilayah_ids && user.wilayah_ids.includes(Number(existing.wilayahPembinaanId)));
      
      if (!canEdit) {
        return { success: false, error: 'Forbidden - You do not have permission to edit this anak' };
      }
    }
    // Korwil cannot edit anak (read-only access)
    else if (user.id_group_user === 9) {
      return { success: false, error: 'Forbidden - Korwil has read-only access to anak data' };
    }

    // Validate input
    const validatedData = anakUpdateSchema.parse(data);

    // Keep date strings as-is to match repository/DB types
    const processedData: any = { ...validatedData };
    if (validatedData.tglLahir) processedData.tglLahir = validatedData.tglLahir;
    if (validatedData.tglTerdaftar) processedData.tglTerdaftar = validatedData.tglTerdaftar;
    if (validatedData.tglPengajuan) processedData.tglPengajuan = validatedData.tglPengajuan;
    if (validatedData.tglKematianAyah) processedData.tglKematianAyah = validatedData.tglKematianAyah;
    if (validatedData.tglKematianIbu) processedData.tglKematianIbu = validatedData.tglKematianIbu;
    if (validatedData.tglPeminjaman) processedData.tglPeminjaman = validatedData.tglPeminjaman;
    if (validatedData.tglExpired) processedData.tglExpired = validatedData.tglExpired;
    // convert numeric penghasilan fields to strings
    if (validatedData.penghasilanAyah !== undefined) processedData.penghasilanAyah = String(validatedData.penghasilanAyah);
    if (validatedData.penghasilanIbu !== undefined) processedData.penghasilanIbu = String(validatedData.penghasilanIbu);
    if (validatedData.penghasilanWali !== undefined) processedData.penghasilanWali = String(validatedData.penghasilanWali);

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

    // Use service-level delete with dependency check
    const user = {
      id: session.user.id,
      id_group_user: session.user.id_group_user,
      kantor_id: session.user.kantor_id,
      wilayah_ids: session.user.id_wilayah_pembinaan,
    };

    const result = await deleteAnakForUser(user, id, { force: false });
    if (!result.success && result.error === 'Has dependents') {
      return { success: false, error: 'Cannot delete anak: dependent records exist.', details: result.dependents };
    }
    if (!result.success) {
      return { success: false, error: result.error ?? 'Failed to delete anak' };
    }
    revalidatePath('/dashboard/anak');
    return { success: true, data: result.data };
  } catch (error) {
    console.error('Error deleting anak:', error);
    return { success: false, error: 'Failed to delete anak' };
  }
}

export async function forceDeleteAnakAction(id: number) {
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

    const result = await deleteAnakForUser(user, id, { force: true });
    if (!result.success) {
      return { success: false, error: result.error ?? 'Failed to delete anak' };
    }
    revalidatePath('/dashboard/anak');
    return { success: true, data: result.data };
  } catch (error) {
    console.error('Error force deleting anak:', error);
    return { success: false, error: 'Failed to delete anak' };
  }
}
