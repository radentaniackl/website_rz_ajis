'use server';

import { auth } from '@/auth';
import { donaturSchema, donaturUpdateSchema, type DonaturInput, type DonaturUpdateInput } from '@/lib/validation/schemas';
import * as donaturRepo from '@/lib/repositories/donatur.repository';
import * as donaturService from '@/lib/services/donatur.service';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { ZodError } from 'zod';

// RBAC: Donatur adalah data global/master, semua role bisa read
// Hanya Super Admin yang bisa create/update/delete

export async function getDonaturList(params: { page?: number; pageSize?: number; search?: string }) {
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

    const result = await donaturService.listDonaturByUser(userSession, params);
    return { success: true, data: result };
  } catch (error) {
    console.error('Error fetching donatur list:', error);
    return { success: false, error: 'Failed to fetch donatur list' };
  }
}

export async function getDonaturDetail(id: number) {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: 'Unauthorized' };
    }

    const donatur = await donaturService.getDonaturById(id);
    if (!donatur) {
      return { success: false, error: 'Donatur not found' };
    }

    return { success: true, data: donatur };
  } catch (error) {
    console.error('Error fetching donatur detail:', error);
    return { success: false, error: 'Failed to fetch donatur detail' };
  }
}

export async function createDonaturAction(data: DonaturInput) {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: 'Unauthorized' };
    }

    // RBAC: Hanya Super Admin yang bisa create donatur
    if (session.user.role !== '1') {
      return { success: false, error: 'Anda tidak memiliki izin untuk menambah donatur' };
    }

    // Validate data
    const validatedData = donaturSchema.parse(data);

    // Add audit fields
    const donaturData = {
      ...validatedData,
      userInsert: session.user.name || 'system',
      dateInsert: new Date(),
    };

    const result = await donaturRepo.createDonatur(donaturData);

    revalidatePath('/dashboard/donatur');
    revalidatePath('/dashboard/sesi');

    return { success: true, data: result };
  } catch (error) {
    if (error instanceof ZodError) {
      return { success: false, error: error.errors[0].message };
    }
    console.error('Error creating donatur:', error);
    return { success: false, error: 'Failed to create donatur' };
  }
}

export async function updateDonaturAction(id: number, data: DonaturUpdateInput) {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: 'Unauthorized' };
    }

    // RBAC: Hanya Super Admin yang bisa update donatur
    if (session.user.role !== '1') {
      return { success: false, error: 'Anda tidak memiliki izin untuk mengubah donatur' };
    }

    // Validate data
    const validatedData = donaturUpdateSchema.parse(data);

    // Add audit fields
    const donaturData = {
      ...validatedData,
      userUpdate: session.user.name || 'system',
      dateUpdate: new Date(),
    };

    const result = await donaturRepo.updateDonatur(id, donaturData);

    revalidatePath('/dashboard/donatur');
    revalidatePath('/dashboard/sesi');
    revalidatePath(`/dashboard/donatur/${id}`);

    return { success: true, data: result };
  } catch (error) {
    if (error instanceof ZodError) {
      return { success: false, error: error.errors[0].message };
    }
    console.error('Error updating donatur:', error);
    return { success: false, error: 'Failed to update donatur' };
  }
}

export async function deleteDonaturAction(id: number) {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: 'Unauthorized' };
    }

    // RBAC: Hanya Super Admin yang bisa delete donatur
    if (session.user.role !== '1') {
      return { success: false, error: 'Anda tidak memiliki izin untuk menghapus donatur' };
    }

    const userSession = {
      id: Number(session.user.id),
      id_group_user: session.user.id_group_user || 1,
      kantor_id: session.user.kantor_id,
      id_wilayah_pembinaan: session.user.id_wilayah_pembinaan,
    };

    const result = await donaturService.deleteDonaturForUser(userSession, id);

    if (!result.success) {
      return result; // Propagate error (e.g. Has dependents)
    }

    revalidatePath('/dashboard/donatur');
    revalidatePath('/dashboard/sesi');

    return { success: true, data: result.data };
  } catch (error) {
    console.error('Error deleting donatur:', error);
    return { success: false, error: 'Failed to delete donatur' };
  }
}
