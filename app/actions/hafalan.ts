'use server';

import { auth } from '@/auth';
import * as hafalanRepo from '@/lib/repositories/hafalan.repository';
import { hafalanSchema, hafalanUpdateSchema, itemHafalanSchema, itemHafalanUpdateSchema, type HafalanInput, type HafalanUpdateInput, type ItemHafalanInput, type ItemHafalanUpdateInput } from '@/lib/validation/schemas';
import { ZodError } from 'zod';
import { revalidatePath } from 'next/cache';

// ─── READ ────────────────────────────────────────────────────────────────────

export async function getHafalanList(params: {
  page?: number;
  pageSize?: number;
  search?: string;
  anakId?: number;
  semesterId?: number;
  field?: string;
  direction?: 'asc' | 'desc';
}) {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: 'Unauthorized' };
    }

    const { buildRbacFilter } = await import('@/lib/rbac/filters');
    const { hafalanAnak } = await import('@/db/schema');
    
    const rbacFilter = buildRbacFilter(
      {
        id: session.user.id,
        id_group_user: session.user.id_group_user,
        kantor_id: session.user.kantor_id,
        id_wilayah_pembinaan: session.user.id_wilayah_pembinaan,
      },
      hafalanAnak
    );

    const result = await hafalanRepo.listHafalan({
      page: params.page ?? 1,
      pageSize: params.pageSize ?? 20,
      search: params.search,
      anakId: params.anakId,
      semesterId: params.semesterId,
      field: params.field,
      direction: params.direction,
      rbacFilter,
    });

    return { success: true, ...result };
  } catch (error) {
    console.error('Error fetching hafalan list:', error);
    return { success: false, error: 'Failed to fetch hafalan list' };
  }
}

export async function getHafalanById(id: number) {
  try {
    if (isNaN(id)) {
      return { success: false, error: 'Invalid ID' };
    }

    const session = await auth();
    if (!session?.user) {
      return { success: false, error: 'Unauthorized' };
    }

    const hafalan = await hafalanRepo.findHafalanById(id);
    
    if (!hafalan) {
      return { success: false, error: 'Hafalan not found' };
    }

    // RBAC check: ensure user has access to this hafalan
    const { buildRbacFilter } = await import('@/lib/rbac/filters');
    const { hafalanAnak } = await import('@/db/schema');
    const { eq, and } = await import('drizzle-orm');
    const { db } = await import('@/lib/repositories/base.repository');

    const user = {
      id: session.user.id,
      id_group_user: session.user.id_group_user,
      kantor_id: session.user.kantor_id,
      id_wilayah_pembinaan: session.user.id_wilayah_pembinaan,
    };

    const rbacFilter = buildRbacFilter(user, hafalanAnak);

    if (user.id_group_user !== 1) {
      if (rbacFilter) {
        const match = await db.select().from(hafalanAnak).where(and(rbacFilter, eq(hafalanAnak.id, BigInt(id)))).limit(1);
        if (!match.length) {
          return { success: false, error: 'Forbidden - You do not have access to this hafalan' };
        }
      }
    }

    return { success: true, data: hafalan };
  } catch (error) {
    console.error('Error fetching hafalan detail:', error);
    return { success: false, error: 'Failed to fetch hafalan detail' };
  }
}

export async function getItemHafalanList(params?: { search?: string }) {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: 'Unauthorized' };
    }

    const result = await hafalanRepo.listItemHafalan(params);
    return { success: true, data: result };
  } catch (error) {
    console.error('Error fetching item hafalan list:', error);
    return { success: false, error: 'Failed to fetch item hafalan list' };
  }
}

export async function getItemHafalanById(id: number) {
  try {
    if (isNaN(id)) {
      return { success: false, error: 'Invalid ID' };
    }

    const session = await auth();
    if (!session?.user) {
      return { success: false, error: 'Unauthorized' };
    }

    const itemHafalan = await hafalanRepo.findItemHafalanById(id);
    
    if (!itemHafalan) {
      return { success: false, error: 'Item hafalan not found' };
    }

    return { success: true, data: itemHafalan };
  } catch (error) {
    console.error('Error fetching item hafalan detail:', error);
    return { success: false, error: 'Failed to fetch item hafalan detail' };
  }
}

// ─── CREATE ──────────────────────────────────────────────────────────────────

export async function createHafalanAction(data: HafalanInput) {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: 'Unauthorized' };
    }

    // Validate input
    const validatedData = hafalanSchema.parse(data);

    // RBAC Check: Pastikan anak dalam wilayah user
    const { ajisAnak } = await import('@/db/schema');
    const { eq, and, inArray } = await import('drizzle-orm');
    const { db } = await import('@/lib/repositories/base.repository');

    const user = {
      id_group_user: session.user.id_group_user,
      kantor_id: session.user.kantor_id,
      id_wilayah_pembinaan: session.user.id_wilayah_pembinaan,
    };

    if (user.id_group_user === 9) {
      // Korwil: cek anak dalam wilayah
      const [anak] = await db
        .select()
        .from(ajisAnak)
        .where(
          and(
            eq(ajisAnak.id, BigInt(validatedData.anakId)),
            inArray(ajisAnak.wilayahPembinaanId, user.id_wilayah_pembinaan.map(BigInt))
          )
        )
        .limit(1);

      if (!anak) {
        return { success: false, error: 'Anak tidak ditemukan di wilayah Anda' };
      }
    } else if (user.id_group_user === 2) {
      // Branch Admin: cek anak dalam kantor
      const [anak] = await db
        .select()
        .from(ajisAnak)
        .where(
          and(
            eq(ajisAnak.id, BigInt(validatedData.anakId)),
            eq(ajisAnak.kantorId, BigInt(user.kantor_id))
          )
        )
        .limit(1);

      if (!anak) {
        return { success: false, error: 'Anak tidak ditemukan di kantor Anda' };
      }
    }

    // Insert hafalan
    const newHafalan = await hafalanRepo.createHafalan({
      anakId: BigInt(validatedData.anakId),
      itemHafalanId: validatedData.itemHafalanId ? BigInt(validatedData.itemHafalanId) : null,
      jenis: validatedData.jenis,
      kontenUji: validatedData.kontenUji,
      tglPengujian: validatedData.tglPengujian ? new Date(validatedData.tglPengujian) : null,
      tglInsert: new Date(),
      keterangan: validatedData.keterangan,
      semesterId: validatedData.semesterId ? BigInt(validatedData.semesterId) : null,
    });

    revalidatePath('/dashboard/hafalan');
    revalidatePath(`/dashboard/anak/${validatedData.anakId}`);

    return { success: true, data: newHafalan };
  } catch (error) {
    if (error instanceof ZodError) {
      console.error('Validation error creating hafalan:', error.errors);
      return { success: false, error: 'Data tidak valid', details: error.errors };
    }
    console.error('Error creating hafalan:', error);
    return { success: false, error: 'Terjadi kesalahan saat menyimpan hafalan' };
  }
}

export async function createItemHafalanAction(data: ItemHafalanInput) {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: 'Unauthorized' };
    }

    // Check permissions: Only Super Admin and Branch Admin can create item hafalan
    if (session.user.id_group_user === 9) {
      return { success: false, error: 'Forbidden - Korwil tidak dapat membuat item hafalan' };
    }

    // Validate input
    const validatedData = itemHafalanSchema.parse(data);

    // Insert item hafalan
    const newItemHafalan = await hafalanRepo.createItemHafalan({
      kodeLama: validatedData.kodeLama,
      jenis: validatedData.jenis,
      konten: validatedData.konten,
    });

    revalidatePath('/dashboard/hafalan');

    return { success: true, data: newItemHafalan };
  } catch (error) {
    if (error instanceof ZodError) {
      console.error('Validation error creating item hafalan:', error.errors);
      return { success: false, error: 'Data tidak valid', details: error.errors };
    }
    console.error('Error creating item hafalan:', error);
    return { success: false, error: 'Terjadi kesalahan saat menyimpan item hafalan' };
  }
}

// ─── UPDATE ──────────────────────────────────────────────────────────────────

export async function updateHafalanAction(id: number, data: HafalanUpdateInput) {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: 'Unauthorized' };
    }

    // Validate input
    const validatedData = hafalanUpdateSchema.parse(data);

    // Check if hafalan exists
    const existing = await hafalanRepo.findHafalanById(id);
    if (!existing) {
      return { success: false, error: 'Hafalan not found' };
    }

    // RBAC Check: Pastikan user memiliki akses ke hafalan ini
    const { buildRbacFilter } = await import('@/lib/rbac/filters');
    const { hafalanAnak } = await import('@/db/schema');
    const { eq, and } = await import('drizzle-orm');
    const { db } = await import('@/lib/repositories/base.repository');

    const user = {
      id: session.user.id,
      id_group_user: session.user.id_group_user,
      kantor_id: session.user.kantor_id,
      id_wilayah_pembinaan: session.user.id_wilayah_pembinaan,
    };

    const rbacFilter = buildRbacFilter(user, hafalanAnak);

    if (user.id_group_user !== 1) {
      if (rbacFilter) {
        const match = await db.select().from(hafalanAnak).where(and(rbacFilter, eq(hafalanAnak.id, BigInt(id)))).limit(1);
        if (!match.length) {
          return { success: false, error: 'Forbidden - You do not have access to this hafalan' };
        }
      }
    }

    // Update hafalan
    const updateData: any = {};
    if (validatedData.anakId !== undefined) updateData.anakId = BigInt(validatedData.anakId);
    if (validatedData.itemHafalanId !== undefined) updateData.itemHafalanId = validatedData.itemHafalanId ? BigInt(validatedData.itemHafalanId) : null;
    if (validatedData.jenis !== undefined) updateData.jenis = validatedData.jenis;
    if (validatedData.kontenUji !== undefined) updateData.kontenUji = validatedData.kontenUji;
    if (validatedData.tglPengujian !== undefined) updateData.tglPengujian = validatedData.tglPengujian ? new Date(validatedData.tglPengujian) : null;
    if (validatedData.keterangan !== undefined) updateData.keterangan = validatedData.keterangan;
    if (validatedData.semesterId !== undefined) updateData.semesterId = validatedData.semesterId ? BigInt(validatedData.semesterId) : null;

    const updatedHafalan = await hafalanRepo.updateHafalan(id, updateData);

    if (!updatedHafalan) {
      return { success: false, error: 'Hafalan not found' };
    }

    revalidatePath('/dashboard/hafalan');
    revalidatePath(`/dashboard/hafalan/${id}`);
    if (existing.anakId) {
      revalidatePath(`/dashboard/anak/${existing.anakId}`);
    }
    if (validatedData.anakId) {
      revalidatePath(`/dashboard/anak/${validatedData.anakId}`);
    }

    return { success: true, data: updatedHafalan };
  } catch (error) {
    if (error instanceof ZodError) {
      console.error('Validation error updating hafalan:', error.errors);
      return { success: false, error: 'Data tidak valid', details: error.errors };
    }
    console.error('Error updating hafalan:', error);
    return { success: false, error: 'Terjadi kesalahan saat mengupdate hafalan' };
  }
}

export async function updateItemHafalanAction(id: number, data: ItemHafalanUpdateInput) {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: 'Unauthorized' };
    }

    // Check permissions: Only Super Admin and Branch Admin can update item hafalan
    if (session.user.id_group_user === 9) {
      return { success: false, error: 'Forbidden - Korwil tidak dapat mengupdate item hafalan' };
    }

    // Validate input
    const validatedData = itemHafalanUpdateSchema.parse(data);

    // Check if item hafalan exists
    const existing = await hafalanRepo.findItemHafalanById(id);
    if (!existing) {
      return { success: false, error: 'Item hafalan not found' };
    }

    // Update item hafalan
    const updateData: any = {};
    if (validatedData.kodeLama !== undefined) updateData.kodeLama = validatedData.kodeLama;
    if (validatedData.jenis !== undefined) updateData.jenis = validatedData.jenis;
    if (validatedData.konten !== undefined) updateData.konten = validatedData.konten;

    const updatedItemHafalan = await hafalanRepo.updateItemHafalan(id, updateData);

    if (!updatedItemHafalan) {
      return { success: false, error: 'Item hafalan not found' };
    }

    revalidatePath('/dashboard/hafalan');

    return { success: true, data: updatedItemHafalan };
  } catch (error) {
    if (error instanceof ZodError) {
      console.error('Validation error updating item hafalan:', error.errors);
      return { success: false, error: 'Data tidak valid', details: error.errors };
    }
    console.error('Error updating item hafalan:', error);
    return { success: false, error: 'Terjadi kesalahan saat mengupdate item hafalan' };
  }
}

// ─── DELETE ──────────────────────────────────────────────────────────────────

export async function deleteHafalanAction(id: number) {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: 'Unauthorized' };
    }

    // Check if hafalan exists
    const existing = await hafalanRepo.findHafalanById(id);
    if (!existing) {
      return { success: false, error: 'Hafalan not found' };
    }

    // RBAC Check: Pastikan user memiliki akses ke hafalan ini
    const { buildRbacFilter } = await import('@/lib/rbac/filters');
    const { hafalanAnak } = await import('@/db/schema');
    const { eq, and } = await import('drizzle-orm');
    const { db } = await import('@/lib/repositories/base.repository');

    const user = {
      id: session.user.id,
      id_group_user: session.user.id_group_user,
      kantor_id: session.user.kantor_id,
      id_wilayah_pembinaan: session.user.id_wilayah_pembinaan,
    };

    const rbacFilter = buildRbacFilter(user, hafalanAnak);

    if (user.id_group_user !== 1) {
      if (rbacFilter) {
        const match = await db.select().from(hafalanAnak).where(and(rbacFilter, eq(hafalanAnak.id, BigInt(id)))).limit(1);
        if (!match.length) {
          return { success: false, error: 'Forbidden - You do not have access to this hafalan' };
        }
      }
    }

    // Delete hafalan
    const deletedHafalan = await hafalanRepo.deleteHafalan(id);

    if (!deletedHafalan) {
      return { success: false, error: 'Hafalan not found' };
    }

    revalidatePath('/dashboard/hafalan');
    if (existing.anakId) {
      revalidatePath(`/dashboard/anak/${existing.anakId}`);
    }

    return { success: true, data: deletedHafalan };
  } catch (error) {
    console.error('Error deleting hafalan:', error);
    return { success: false, error: 'Terjadi kesalahan saat menghapus hafalan' };
  }
}

export async function deleteItemHafalanAction(id: number) {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: 'Unauthorized' };
    }

    // Check permissions: Only Super Admin and Branch Admin can delete item hafalan
    if (session.user.id_group_user === 9) {
      return { success: false, error: 'Forbidden - Korwil tidak dapat menghapus item hafalan' };
    }

    // Check if item hafalan exists
    const existing = await hafalanRepo.findItemHafalanById(id);
    if (!existing) {
      return { success: false, error: 'Item hafalan not found' };
    }

    // Delete item hafalan
    const deletedItemHafalan = await hafalanRepo.deleteItemHafalan(id);

    if (!deletedItemHafalan) {
      return { success: false, error: 'Item hafalan not found' };
    }

    revalidatePath('/dashboard/hafalan');

    return { success: true, data: deletedItemHafalan };
  } catch (error) {
    console.error('Error deleting item hafalan:', error);
    return { success: false, error: 'Terjadi kesalahan saat menghapus item hafalan' };
  }
}
