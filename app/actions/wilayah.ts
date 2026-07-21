'use server';

import { auth } from '@/auth';
import { listWilayahByUser, getWilayahById } from '@/lib/services/wilayah.service';
import * as wilayahRepo from '@/lib/repositories/wilayah.repository';
import { deleteWilayahForUser } from '@/lib/services/wilayah.service';
import { wilayahSchema, wilayahUpdateSchema, type WilayahInput, type WilayahUpdateInput } from '@/lib/validation/schemas';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';

export async function getWilayahList(params: { page?: number; pageSize?: number; search?: string }) {
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

    const result = await listWilayahByUser(user, params);
    return { success: true, data: result };
  } catch (error) {
    console.error('Error fetching wilayah list:', error);
    return { success: false, error: 'Failed to fetch wilayah list' };
  }
}

export async function getWilayahDetail(id: number) {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: 'Unauthorized' };
    }

    // RBAC: Only Super Admin and Branch Admin can access wilayah
    if (session.user.id_group_user === 9) {
      return { success: false, error: 'Forbidden - Korwil cannot access wilayah' };
    }

    const wilayah = await getWilayahById(id);
    if (!wilayah) {
      return { success: false, error: 'Wilayah not found' };
    }

    // Branch Admin: only can access wilayah in their kantor
    if (session.user.id_group_user === 2 && session.user.kantor_id) {
      const wilayahKantorId = wilayah.kantorId ? Number(wilayah.kantorId) : null;
      if (wilayahKantorId !== session.user.kantor_id) {
        return { success: false, error: 'Forbidden - You can only access wilayah in your kantor' };
      }
    }

    return { success: true, data: wilayah };
  } catch (error) {
    console.error('Error fetching wilayah detail:', error);
    return { success: false, error: 'Failed to fetch wilayah detail' };
  }
}

export async function createWilayahAction(input: WilayahInput) {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: 'Unauthorized' };
    }

    // RBAC: Only Super Admin and Branch Admin can create wilayah
    if (session.user.id_group_user === 9) {
      return { success: false, error: 'Forbidden - Korwil cannot create wilayah' };
    }

    // Validate input
    const validated = wilayahSchema.parse(input);

    // Check if namaWilayah already exists
    const existing = await wilayahRepo.findWilayahByNama(validated.namaWilayah);
    if (existing) {
      return { success: false, error: 'Nama wilayah already exists' };
    }

    // Check if kodeLama already exists
    if (validated.kodeLama) {
      const kodeExists = await wilayahRepo.findWilayahByKodeLama(validated.kodeLama);
      if (kodeExists) {
        return { success: false, error: 'Kode lama already exists' };
      }
    }

    // Branch Admin: only can create wilayah in their kantor
    if (session.user.id_group_user === 2 && session.user.kantor_id) {
      if (validated.kantorId && validated.kantorId !== session.user.kantor_id) {
        return { success: false, error: 'Forbidden - You can only create wilayah in your kantor' };
      }
      if (!validated.kantorId) {
        validated.kantorId = session.user.kantor_id;
      }
    }

    // Validate kantorId exists if provided
    if (validated.kantorId) {
      const kantorExists = await wilayahRepo.findKantorById(validated.kantorId);
      if (!kantorExists) {
        return { success: false, error: 'Kantor ID tidak valid' };
      }
    }

    // Validate desaId exists if provided
    if (validated.desaId) {
      const desaExists = await wilayahRepo.findDesaById(validated.desaId);
      if (!desaExists) {
        return { success: false, error: 'Desa ID tidak valid' };
      }
    }

    const wilayah = await wilayahRepo.createWilayah(validated);
    revalidatePath('/dashboard/wilayah');
    return { success: true, data: wilayah };
  } catch (error) {
    console.error('Error creating wilayah:', error);
    return { success: false, error: 'Failed to create wilayah' };
  }
}

export async function updateWilayahAction(id: number, input: WilayahUpdateInput) {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: 'Unauthorized' };
    }

    // RBAC: Only Super Admin and Branch Admin can update wilayah
    if (session.user.id_group_user === 9) {
      return { success: false, error: 'Forbidden - Korwil cannot update wilayah' };
    }

    // Validate input
    const validated = wilayahUpdateSchema.parse(input);

    // Check if wilayah exists
    const existing = await wilayahRepo.findWilayahById(id);
    if (!existing) {
      return { success: false, error: 'Wilayah not found' };
    }

    // Branch Admin: only can update wilayah in their kantor
    if (session.user.id_group_user === 2 && session.user.kantor_id) {
      const existingKantorId = existing.kantorId ? Number(existing.kantorId) : null;
      if (existingKantorId !== session.user.kantor_id) {
        return { success: false, error: 'Forbidden - You can only update wilayah in your kantor' };
      }
      if (validated.kantorId && validated.kantorId !== session.user.kantor_id) {
        return { success: false, error: 'Forbidden - You can only assign wilayah to your kantor' };
      }
    }

    // If namaWilayah is being updated, check if it already exists
    if (validated.namaWilayah && validated.namaWilayah !== existing.namaWilayah) {
      const namaExists = await wilayahRepo.findWilayahByNama(validated.namaWilayah);
      if (namaExists) {
        return { success: false, error: 'Nama wilayah already exists' };
      }
    }

    // If kodeLama is being updated, check if it already exists
    if (validated.kodeLama && validated.kodeLama !== existing.kodeLama) {
      const kodeExists = await wilayahRepo.findWilayahByKodeLama(validated.kodeLama);
      if (kodeExists) {
        return { success: false, error: 'Kode lama already exists' };
      }
    }

    const wilayah = await wilayahRepo.updateWilayah(id, validated);
    revalidatePath('/dashboard/wilayah');
    revalidatePath(`/dashboard/wilayah/${id}/edit`);
    return { success: true, data: wilayah };
  } catch (error) {
    console.error('Error updating wilayah:', error);
    return { success: false, error: 'Failed to update wilayah' };
  }
}

export async function deleteWilayahAction(id: number) {
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

    const result = await deleteWilayahForUser(user, id, { force: false });
    if (!result.success && result.error === 'Has dependents') {
      return { success: false, error: 'Cannot delete wilayah: dependent records exist.', details: result.dependents };
    }
    if (!result.success) {
      return { success: false, error: result.error ?? 'Failed to delete wilayah' };
    }
    revalidatePath('/dashboard/wilayah');
    return { success: true, data: result.data };
  } catch (error) {
    console.error('Error deleting wilayah:', error);
    return { success: false, error: 'Failed to delete wilayah' };
  }
}

export async function forceDeleteWilayahAction(id: number) {
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

    const result = await deleteWilayahForUser(user, id, { force: true });
    if (!result.success) {
      return { success: false, error: result.error ?? 'Failed to delete wilayah' };
    }
    revalidatePath('/dashboard/wilayah');
    return { success: true, data: result.data };
  } catch (error) {
    console.error('Error force deleting wilayah:', error);
    return { success: false, error: 'Failed to delete wilayah' };
  }
}
