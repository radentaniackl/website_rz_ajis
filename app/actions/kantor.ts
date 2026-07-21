'use server';

import { auth } from '@/auth';
import { listKantorByUser, getKantorById } from '@/lib/services/kantor.service';
import * as kantorRepo from '@/lib/repositories/kantor.repository';
import { deleteKantorForUser } from '@/lib/services/kantor.service';
import { kantorSchema, kantorUpdateSchema, type KantorInput, type KantorUpdateInput } from '@/lib/validation/schemas';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';

export async function getKantorList(params: { page?: number; pageSize?: number; search?: string }) {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: 'Unauthorized' };
    }

    const user = {
      id: session.user.id,
      id_group_user: session.user.id_group_user,
      kantor_id: session.user.kantor_id,
      id_wilayah_pembinaan: session.user.id_wilayah_pembinaan,
    };

    const result = await listKantorByUser(user, params);
    return { success: true, data: result };
  } catch (error) {
    console.error('Error fetching kantor list:', error);
    return { success: false, error: 'Failed to fetch kantor list' };
  }
}

export async function getKantorDetail(id: number) {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: 'Unauthorized' };
    }

    // RBAC: Only Super Admin can access kantor
    if (session.user.id_group_user !== 1) {
      return { success: false, error: 'Forbidden - Only Super Admin can access kantor' };
    }

    const kantor = await getKantorById(id);
    if (!kantor) {
      return { success: false, error: 'Kantor not found' };
    }

    return { success: true, data: kantor };
  } catch (error) {
    console.error('Error fetching kantor detail:', error);
    return { success: false, error: 'Failed to fetch kantor detail' };
  }
}

export async function createKantorAction(input: KantorInput) {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: 'Unauthorized' };
    }

    // RBAC: Only Super Admin can create kantor
    if (session.user.id_group_user !== 1) {
      return { success: false, error: 'Forbidden - Only Super Admin can create kantor' };
    }

    // Validate input
    const validated = kantorSchema.parse(input);

    // Check if kode already exists
    const existing = await kantorRepo.findKantorByKode(validated.kode);
    if (existing) {
      return { success: false, error: 'Kode kantor already exists' };
    }

    const kantor = await kantorRepo.createKantor(validated);
    revalidatePath('/dashboard/kantor');
    return { success: true, data: kantor };
  } catch (error) {
    console.error('Error creating kantor:', error);
    return { success: false, error: 'Failed to create kantor' };
  }
}

export async function updateKantorAction(id: number, input: KantorUpdateInput) {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: 'Unauthorized' };
    }

    // RBAC: Only Super Admin can update kantor
    if (session.user.id_group_user !== 1) {
      return { success: false, error: 'Forbidden - Only Super Admin can update kantor' };
    }

    // Validate input
    const validated = kantorUpdateSchema.parse(input);

    // Check if kantor exists
    const existing = await kantorRepo.findKantorById(id);
    if (!existing) {
      return { success: false, error: 'Kantor not found' };
    }

    // If kode is being updated, check if it already exists
    if (validated.kode && validated.kode !== existing.kode) {
      const kodeExists = await kantorRepo.findKantorByKode(validated.kode);
      if (kodeExists) {
        return { success: false, error: 'Kode kantor already exists' };
      }
    }

    const kantor = await kantorRepo.updateKantor(id, validated);
    revalidatePath('/dashboard/kantor');
    revalidatePath(`/dashboard/kantor/${id}/edit`);
    return { success: true, data: kantor };
  } catch (error) {
    console.error('Error updating kantor:', error);
    return { success: false, error: 'Failed to update kantor' };
  }
}

export async function deleteKantorAction(id: number) {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: 'Unauthorized' };
    }

    const user = {
      id: session.user.id,
      id_group_user: session.user.id_group_user,
      kantor_id: session.user.kantor_id,
      id_wilayah_pembinaan: session.user.id_wilayah_pembinaan,
    };

    const result = await deleteKantorForUser(user, id, { force: false });
    if (!result.success && result.error === 'Has dependents') {
      return { success: false, error: 'Cannot delete kantor: dependent records exist.', details: result.dependents };
    }
    if (!result.success) {
      return { success: false, error: result.error ?? 'Failed to delete kantor' };
    }
    revalidatePath('/dashboard/kantor');
    return { success: true, data: result.data };
  } catch (error) {
    console.error('Error deleting kantor:', error);
    return { success: false, error: 'Failed to delete kantor' };
  }
}

export async function forceDeleteKantorAction(id: number) {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: 'Unauthorized' };
    }

    const user = {
      id: session.user.id,
      id_group_user: session.user.id_group_user,
      kantor_id: session.user.kantor_id,
      id_wilayah_pembinaan: session.user.id_wilayah_pembinaan,
    };

    const result = await deleteKantorForUser(user, id, { force: true });
    if (!result.success) {
      return { success: false, error: result.error ?? 'Failed to delete kantor' };
    }
    revalidatePath('/dashboard/kantor');
    return { success: true, data: result.data };
  } catch (error) {
    console.error('Error force deleting kantor:', error);
    return { success: false, error: 'Failed to delete kantor' };
  }
}
