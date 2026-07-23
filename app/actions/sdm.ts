'use server';

import { auth } from '@/auth';
import { listSdmByUser, getSdmById, createSdm, updateSdm, deleteSdm } from '@/lib/services/sdm-wilayah.service';
import { sdmWilayahSchema, sdmWilayahUpdateSchema } from '@/lib/validation/schemas';
import { revalidatePath } from 'next/cache';

export async function getSdmList(params: { page?: number; pageSize?: number; search?: string }) {
  try {
    const session = await auth();
    if (!session?.user) return { success: false, error: 'Unauthorized' };

    const result = await listSdmByUser(session.user as any, params);
    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: 'Failed to fetch SDM list' };
  }
}

export async function getSdmDetail(id: number) {
  try {
    const session = await auth();
    if (!session?.user) return { success: false, error: 'Unauthorized' };

    const data = await getSdmById(id);
    if (!data) return { success: false, error: 'SDM not found' };
    return { success: true, data };
  } catch (error) {
    return { success: false, error: 'Failed to fetch SDM detail' };
  }
}

export async function createSdmAction(formData: FormData) {
  try {
    const session = await auth();
    if (!session?.user) return { success: false, error: 'Unauthorized' };

    const rawData = Object.fromEntries(formData.entries());
    
    // Parse numeric fields
    const parsedData = {
      ...rawData,
      desaId: rawData.desaId ? Number(rawData.desaId) : undefined,
      penugasanWilayahId: rawData.penugasanWilayahId ? Number(rawData.penugasanWilayahId) : undefined,
      penugasanKantorId: rawData.penugasanKantorId ? Number(rawData.penugasanKantorId) : undefined,
    };

    const validatedData = sdmWilayahSchema.parse(parsedData);
    const result = await createSdm(session.user as any, validatedData);
    
    revalidatePath('/dashboard/sdm');
    return { success: true, data: result };
  } catch (error: any) {
    console.error("Create SDM Error:", error);
    return { success: false, error: error.message || 'Failed to create SDM' };
  }
}

export async function updateSdmAction(id: number, formData: FormData) {
  try {
    const session = await auth();
    if (!session?.user) return { success: false, error: 'Unauthorized' };

    const rawData = Object.fromEntries(formData.entries());
    
    const parsedData = {
      ...rawData,
      desaId: rawData.desaId ? Number(rawData.desaId) : undefined,
      penugasanWilayahId: rawData.penugasanWilayahId ? Number(rawData.penugasanWilayahId) : undefined,
      penugasanKantorId: rawData.penugasanKantorId ? Number(rawData.penugasanKantorId) : undefined,
    };

    const validatedData = sdmWilayahUpdateSchema.parse(parsedData);
    const result = await updateSdm(session.user as any, id, validatedData);
    
    revalidatePath('/dashboard/sdm');
    revalidatePath(`/dashboard/sdm/${id}`);
    return { success: true, data: result };
  } catch (error: any) {
    console.error("Update SDM Error:", error);
    return { success: false, error: error.message || 'Failed to update SDM' };
  }
}

export async function deleteSdmAction(id: number) {
  try {
    const session = await auth();
    if (!session?.user) return { success: false, error: 'Unauthorized' };

    await deleteSdm(session.user as any, id);
    revalidatePath('/dashboard/sdm');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to delete SDM' };
  }
}
