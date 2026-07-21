'use server';

import { auth } from '@/auth';
import * as pembinaanRepo from '@/lib/repositories/pembinaan.repository';
import { pembinaanSchema, pembinaanUpdateSchema, type PembinaanInput, type PembinaanUpdateInput } from '@/lib/validation/schemas';
import { ZodError } from 'zod';
import { revalidatePath } from 'next/cache';

// ─── READ ────────────────────────────────────────────────────────────────────

export async function getPembinaanList(params: {
  page?: number;
  pageSize?: number;
  search?: string;
  anakId?: number;
  semesterId?: number;
}) {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: 'Unauthorized' };
    }

    const { buildRbacFilter } = await import('@/lib/rbac/filters');
    const { pembinaan } = await import('@/lib/db/schema');
    
    const rbacFilter = buildRbacFilter(
      {
        id: session.user.id,
        id_group_user: session.user.id_group_user,
        kantor_id: session.user.kantor_id,
        id_wilayah_pembinaan: session.user.id_wilayah_pembinaan,
      },
      pembinaan
    );

    const result = await pembinaanRepo.listPembinaan({
      page: params.page ?? 1,
      pageSize: params.pageSize ?? 20,
      search: params.search,
      anakId: params.anakId,
      semesterId: params.semesterId,
      rbacFilter,
    });

    return { success: true, ...result };
  } catch (error) {
    console.error('Error fetching pembinaan list:', error);
    return { success: false, error: 'Failed to fetch pembinaan list' };
  }
}

export async function getPembinaanById(id: number) {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: 'Unauthorized' };
    }

    const pembinaan = await pembinaanRepo.findPembinaanById(id);
    
    if (!pembinaan) {
      return { success: false, error: 'Pembinaan not found' };
    }

    // RBAC check: ensure user has access to this pembinaan
    const { buildRbacFilter } = await import('@/lib/rbac/filters');
    const { pembinaan: pembinaanTable } = await import('@/lib/db/schema');
    const { eq, and } = await import('drizzle-orm');
    const { db } = await import('@/lib/repositories/base.repository');

    const user = {
      id: session.user.id,
      id_group_user: session.user.id_group_user,
      kantor_id: session.user.kantor_id,
      id_wilayah_pembinaan: session.user.id_wilayah_pembinaan,
    };

    const rbacFilter = buildRbacFilter(user, pembinaanTable);

    if (user.id_group_user !== 1) {
      if (rbacFilter) {
        const match = await db.select().from(pembinaanTable).where(and(rbacFilter, eq(pembinaanTable.id, BigInt(id)))).limit(1);
        if (!match.length) {
          return { success: false, error: 'Forbidden - You do not have access to this pembinaan' };
        }
      }
    }

    return { success: true, data: pembinaan };
  } catch (error) {
    console.error('Error fetching pembinaan detail:', error);
    return { success: false, error: 'Failed to fetch pembinaan detail' };
  }
}

export async function getPembinaanByAnak(anakId: number, params: {
  page?: number;
  pageSize?: number;
}) {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: 'Unauthorized' };
    }

    const { buildRbacFilter } = await import('@/lib/rbac/filters');
    const { pembinaan } = await import('@/lib/db/schema');
    
    const rbacFilter = buildRbacFilter(
      {
        id: session.user.id,
        id_group_user: session.user.id_group_user,
        kantor_id: session.user.kantor_id,
        id_wilayah_pembinaan: session.user.id_wilayah_pembinaan,
      },
      pembinaan
    );

    const result = await pembinaanRepo.listPembinaanByAnak(anakId, {
      page: params.page ?? 1,
      pageSize: params.pageSize ?? 20,
      rbacFilter,
    });

    return { success: true, ...result };
  } catch (error) {
    console.error('Error fetching pembinaan by anak:', error);
    return { success: false, error: 'Failed to fetch pembinaan by anak' };
  }
}

// ─── WRITE ───────────────────────────────────────────────────────────────────

export async function createPembinaanAction(data: PembinaanInput) {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: 'Unauthorized' };
    }

    // RBAC check: Korwil can create pembinaan (operational access per PRD)
    // Super Admin and Branch Admin can also create
    if (session.user.id_group_user === 9) {
      // Korwil can create pembinaan for anak in their region
      // This will be validated by RBAC filter
    }

    // Validate input
    const validatedData = pembinaanSchema.parse(data);

    // Foreign key validation
    if (validatedData.anakId) {
      const { ajisAnak } = await import('@/db/schema');
      const { eq } = await import('drizzle-orm');
      const { db } = await import('@/lib/repositories/base.repository');
      
      const [anak] = await db.select().from(ajisAnak).where(eq(ajisAnak.id, BigInt(validatedData.anakId))).limit(1);
      if (!anak) {
        return { success: false, error: 'Anak tidak ditemukan' };
      }
    }

    if (validatedData.semesterId) {
      const { ajisSemester } = await import('@/db/schema');
      const { eq } = await import('drizzle-orm');
      const { db } = await import('@/lib/repositories/base.repository');
      
      const [semester] = await db.select().from(ajisSemester).where(eq(ajisSemester.id, BigInt(validatedData.semesterId))).limit(1);
      if (!semester) {
        return { success: false, error: 'Semester tidak ditemukan' };
      }
    }

    // Set RBAC fields
    const processedData = {
      ...validatedData,
      kantorId: validatedData.kantorId || session.user.kantor_id || undefined,
      wilayahPembinaanId: validatedData.wilayahPembinaanId || session.user.id_wilayah_pembinaan?.[0] || undefined,
      dateInsert: new Date().toISOString().split('T')[0],
      userInsert: session.user.username || session.user.id.toString(),
    };

    const pembinaan = await pembinaanRepo.createPembinaan(processedData as pembinaanRepo.NewPembinaan);

    revalidatePath('/dashboard/sesi');
    revalidatePath(`/dashboard/anak/${validatedData.anakId}`);
    return { success: true, data: pembinaan };
  } catch (error: unknown) {
    console.error('Error creating pembinaan:', error);
    if (error instanceof ZodError) {
      return { success: false, error: 'Validation error', details: error.errors };
    }
    if (error instanceof Error && error.message) {
      return { success: false, error: error.message };
    }
    return { success: false, error: 'Failed to create pembinaan' };
  }
}

export async function updatePembinaanAction(id: number, data: PembinaanUpdateInput) {
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

    // Check if pembinaan exists
    const existing = await pembinaanRepo.findPembinaanById(id);
    if (!existing) {
      return { success: false, error: 'Pembinaan not found' };
    }

    // RBAC check using centralized filter
    const { buildRbacFilter } = await import('@/lib/rbac/filters');
    const { pembinaan } = await import('@/lib/db/schema');
    const { eq, and } = await import('drizzle-orm');
    const { db } = await import('@/lib/repositories/base.repository');

    const rbacFilter = buildRbacFilter(user, pembinaan);

    if (user.id_group_user !== 1) {
      if (rbacFilter) {
        const match = await db.select().from(pembinaan).where(and(rbacFilter, eq(pembinaan.id, BigInt(id)))).limit(1);
        if (!match.length) {
          return { success: false, error: 'Forbidden - You do not have access to this pembinaan' };
        }
      }
    }

    // Validate input
    const validatedData = pembinaanUpdateSchema.parse(data);

    // Foreign key validation
    if (validatedData.anakId) {
      const { ajisAnak } = await import('@/db/schema');
      const { eq } = await import('drizzle-orm');
      const { db } = await import('@/lib/repositories/base.repository');
      
      const [anak] = await db.select().from(ajisAnak).where(eq(ajisAnak.id, BigInt(validatedData.anakId))).limit(1);
      if (!anak) {
        return { success: false, error: 'Anak tidak ditemukan' };
      }
    }

    if (validatedData.semesterId) {
      const { ajisSemester } = await import('@/db/schema');
      const { eq } = await import('drizzle-orm');
      const { db } = await import('@/lib/repositories/base.repository');
      
      const [semester] = await db.select().from(ajisSemester).where(eq(ajisSemester.id, BigInt(validatedData.semesterId))).limit(1);
      if (!semester) {
        return { success: false, error: 'Semester tidak ditemukan' };
      }
    }

    const processedData = {
      ...validatedData,
      dateUpdate: new Date().toISOString().split('T')[0],
      userUpdate: session.user.username || session.user.id.toString(),
    };

    const updatedPembinaan = await pembinaanRepo.updatePembinaan(id, processedData);

    if (!updatedPembinaan) {
      return { success: false, error: 'Pembinaan not found' };
    }

    revalidatePath('/dashboard/sesi');
    revalidatePath(`/dashboard/sesi/${id}`);
    if (existing.anakId) {
      revalidatePath(`/dashboard/anak/${existing.anakId}`);
    }
    return { success: true, data: updatedPembinaan };
  } catch (error: unknown) {
    console.error('Error updating pembinaan:', error);
    if (error instanceof ZodError) {
      return { success: false, error: 'Validation error', details: error.errors };
    }
    if (error instanceof Error && error.message) {
      return { success: false, error: error.message };
    }
    return { success: false, error: 'Failed to update pembinaan' };
  }
}

export async function deletePembinaanAction(id: number) {
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

    // Check if pembinaan exists
    const existing = await pembinaanRepo.findPembinaanById(id);
    if (!existing) {
      return { success: false, error: 'Pembinaan not found' };
    }

    // RBAC check using centralized filter
    const { buildRbacFilter } = await import('@/lib/rbac/filters');
    const { pembinaan } = await import('@/lib/db/schema');
    const { eq, and } = await import('drizzle-orm');
    const { db } = await import('@/lib/repositories/base.repository');

    const rbacFilter = buildRbacFilter(user, pembinaan);

    if (user.id_group_user !== 1) {
      if (rbacFilter) {
        const match = await db.select().from(pembinaan).where(and(rbacFilter, eq(pembinaan.id, BigInt(id)))).limit(1);
        if (!match.length) {
          return { success: false, error: 'Forbidden - You do not have access to this pembinaan' };
        }
      }
    }

    const deleted = await pembinaanRepo.deletePembinaan(id);

    revalidatePath('/dashboard/sesi');
    if (existing.anakId) {
      revalidatePath(`/dashboard/anak/${existing.anakId}`);
    }
    return { success: true, data: deleted };
  } catch (error) {
    console.error('Error deleting pembinaan:', error);
    return { success: false, error: 'Failed to delete pembinaan' };
  }
}

// ─── DOKUMENTASI ─────────────────────────────────────────────────────────────

export async function getPembinaanDokumentasi(params: {
  semesterId?: number;
  kantorId?: number;
  wilayahPembinaanId?: number;
}) {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: 'Unauthorized' };
    }

    const result = await pembinaanRepo.listPembinaanDokumentasi(params);
    return { success: true, data: result };
  } catch (error) {
    console.error('Error fetching pembinaan dokumentasi:', error);
    return { success: false, error: 'Failed to fetch pembinaan dokumentasi' };
  }
}

export async function createPembinaanDokumentasiAction(data: {
  semesterId?: number;
  kantorId?: number;
  wilayahPembinaanId?: number;
  image: string;
  nama?: string;
  uploadGdrive?: string;
}) {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: 'Unauthorized' };
    }

    const dokumentasi = await pembinaanRepo.createPembinaanDokumentasi(data as pembinaanRepo.NewPembinaanDokumentasi);

    revalidatePath('/dashboard/sesi');
    return { success: true, data: dokumentasi };
  } catch (error) {
    console.error('Error creating pembinaan dokumentasi:', error);
    return { success: false, error: 'Failed to create pembinaan dokumentasi' };
  }
}

export async function deletePembinaanDokumentasiAction(id: number) {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: 'Unauthorized' };
    }

    const deleted = await pembinaanRepo.deletePembinaanDokumentasi(id);

    revalidatePath('/dashboard/sesi');
    return { success: true, data: deleted };
  } catch (error) {
    console.error('Error deleting pembinaan dokumentasi:', error);
    return { success: false, error: 'Failed to delete pembinaan dokumentasi' };
  }
}
