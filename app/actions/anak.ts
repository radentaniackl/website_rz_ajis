'use server';

import { auth } from '@/auth';
import { listAnakByUser, getAnakById } from '@/lib/services/anak.service';
import * as anakRepo from '@/lib/repositories/anak.repository';
import { deleteAnakForUser } from '@/lib/services/anak.service';
import { anakSchema, anakUpdateSchema, type AnakInput, type AnakUpdateInput } from '@/lib/validation/schemas';
import { prepareAnakForDb } from '@/lib/validation/anak-helpers';
import { ZodError } from 'zod';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';

export async function getAnakList(params: { page?: number; pageSize?: number; search?: string; wilayahPembinaanId?: number }) {
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

    const user = {
      id: session.user.id,
      id_group_user: session.user.id_group_user,
      kantor_id: session.user.kantor_id,
      id_wilayah_pembinaan: session.user.id_wilayah_pembinaan,
    };

    // Use service with RBAC filter applied at database layer
    const anak = await getAnakById(id);
    if (!anak) {
      return { success: false, error: 'Anak not found' };
    }

    // RBAC check: ensure user can access this anak (database layer filter)
    const { buildRbacFilter } = await import('@/lib/rbac/filters');
    const { ajisAnak } = await import('@/lib/db/schema');
    const { eq, and } = await import('drizzle-orm');
    const { db } = await import('@/lib/repositories/base.repository');

    const rbacFilter = buildRbacFilter(user, ajisAnak);
    
    // Super Admin has no filter, can access all
    if (user.id_group_user === 1) {
      return { success: true, data: anak };
    }

    // For other roles, verify the anak matches their filter
    if (rbacFilter) {
      const match = await db.select().from(ajisAnak).where(and(rbacFilter, eq(ajisAnak.id, BigInt(id)))).limit(1);
      if (!match.length) {
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

    const validatedData = anakSchema.parse(data);

    // Foreign key validation
    if (validatedData.wilayahPembinaanId) {
      const wilayah = await anakRepo.findWilayahById(validatedData.wilayahPembinaanId);
      if (!wilayah) {
        return { success: false, error: 'Wilayah pembinaan tidak ditemukan' };
      }
    }
    if (validatedData.kantorId) {
      const kantor = await anakRepo.findKantorById(validatedData.kantorId);
      if (!kantor) {
        return { success: false, error: 'Kantor tidak ditemukan' };
      }
    }
    if (validatedData.desaId) {
      const desa = await anakRepo.findDesaById(validatedData.desaId);
      if (!desa) {
        return { success: false, error: 'Desa tidak ditemukan' };
      }
    }
    if (validatedData.desaAyahId) {
      const desa = await anakRepo.findDesaById(validatedData.desaAyahId);
      if (!desa) {
        return { success: false, error: 'Desa ayah tidak ditemukan' };
      }
    }
    if (validatedData.desaIbuId) {
      const desa = await anakRepo.findDesaById(validatedData.desaIbuId);
      if (!desa) {
        return { success: false, error: 'Desa ibu tidak ditemukan' };
      }
    }
    if (validatedData.desaWaliId) {
      const desa = await anakRepo.findDesaById(validatedData.desaWaliId);
      if (!desa) {
        return { success: false, error: 'Desa wali tidak ditemukan' };
      }
    }

    const processedData = prepareAnakForDb({
      ...validatedData,
      kantorId: validatedData.kantorId || session.user.kantor_id || undefined,
      wilayahPembinaanId:
        validatedData.wilayahPembinaanId || session.user.id_wilayah_pembinaan?.[0] || undefined,
    });

    const anak = await anakRepo.createAnak(processedData as anakRepo.NewAnak);

    revalidatePath('/dashboard/anak');
    return { success: true, data: anak };
  } catch (error: unknown) {
    console.error('Error creating anak:', error);
    if (error instanceof ZodError) {
      return { success: false, error: 'Validation error', details: error.errors };
    }
    if (error instanceof Error && error.message) {
      return { success: false, error: error.message };
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

    const user = {
      id: session.user.id,
      id_group_user: session.user.id_group_user,
      kantor_id: session.user.kantor_id,
      id_wilayah_pembinaan: session.user.id_wilayah_pembinaan,
    };

    // RBAC check: Korwil cannot edit anak (read-only access per PRD)
    if (user.id_group_user === 9) {
      return { success: false, error: 'Forbidden - Korwil has read-only access to anak data' };
    }

    const existing = await getAnakById(id);
    if (!existing) {
      return { success: false, error: 'Anak not found' };
    }

    const { buildRbacFilter } = await import('@/lib/rbac/filters');
    const { ajisAnak } = await import('@/lib/db/schema');
    const { eq, and } = await import('drizzle-orm');
    const { db } = await import('@/lib/repositories/base.repository');

    const rbacFilter = buildRbacFilter(user, ajisAnak);

    if (user.id_group_user !== 1) {
      if (rbacFilter) {
        const match = await db.select().from(ajisAnak).where(and(rbacFilter, eq(ajisAnak.id, BigInt(id)))).limit(1);
        if (!match.length) {
          return { success: false, error: 'Forbidden - You do not have permission to edit this anak' };
        }
      }
    }

    const validatedData = anakUpdateSchema.parse(data);

    if (validatedData.wilayahPembinaanId) {
      const wilayah = await anakRepo.findWilayahById(validatedData.wilayahPembinaanId);
      if (!wilayah) {
        return { success: false, error: 'Wilayah pembinaan tidak ditemukan' };
      }
    }
    if (validatedData.kantorId) {
      const kantor = await anakRepo.findKantorById(validatedData.kantorId);
      if (!kantor) {
        return { success: false, error: 'Kantor tidak ditemukan' };
      }
    }
    if (validatedData.desaId) {
      const desa = await anakRepo.findDesaById(validatedData.desaId);
      if (!desa) {
        return { success: false, error: 'Desa tidak ditemukan' };
      }
    }
    if (validatedData.desaAyahId) {
      const desa = await anakRepo.findDesaById(validatedData.desaAyahId);
      if (!desa) {
        return { success: false, error: 'Desa ayah tidak ditemukan' };
      }
    }
    if (validatedData.desaIbuId) {
      const desa = await anakRepo.findDesaById(validatedData.desaIbuId);
      if (!desa) {
        return { success: false, error: 'Desa ibu tidak ditemukan' };
      }
    }
    if (validatedData.desaWaliId) {
      const desa = await anakRepo.findDesaById(validatedData.desaWaliId);
      if (!desa) {
        return { success: false, error: 'Desa wali tidak ditemukan' };
      }
    }

    const processedData = prepareAnakForDb(validatedData);
    const anak = await anakRepo.updateAnak(id, processedData);

    if (!anak) {
      return { success: false, error: 'Anak not found' };
    }

    revalidatePath('/dashboard/anak');
    revalidatePath(`/dashboard/anak/${id}`);
    return { success: true, data: anak };
  } catch (error: unknown) {
    console.error('Error updating anak:', error);
    if (error instanceof ZodError) {
      return { success: false, error: 'Validation error', details: error.errors };
    }
    if (error instanceof Error && error.message) {
      return { success: false, error: error.message };
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
      id_wilayah_pembinaan: session.user.id_wilayah_pembinaan,
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
      id_wilayah_pembinaan: session.user.id_wilayah_pembinaan,
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
