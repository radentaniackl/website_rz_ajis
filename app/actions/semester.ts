'use server';

import { auth } from '@/auth';
import { semesterSchema, semesterUpdateSchema, type SemesterInput, type SemesterUpdateInput } from '@/lib/validation/schemas';
import * as semesterRepo from '@/lib/repositories/semester.repository';
import * as semesterService from '@/lib/services/semester.service';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { ZodError } from 'zod';

// RBAC: Semester adalah data global/master, semua role bisa read
// Hanya Super Admin yang bisa create/update/delete

export async function getSemesterList(params: { page?: number; pageSize?: number; search?: string }) {
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

    const result = await semesterService.listSemesterByUser(userSession, params);
    return { success: true, data: result };
  } catch (error) {
    console.error('Error fetching semester list:', error);
    return { success: false, error: 'Failed to fetch semester list' };
  }
}

export async function getSemesterDetail(id: number) {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: 'Unauthorized' };
    }

    const semester = await semesterService.getSemesterById(id);
    if (!semester) {
      return { success: false, error: 'Semester not found' };
    }

    return { success: true, data: semester };
  } catch (error) {
    console.error('Error fetching semester detail:', error);
    return { success: false, error: 'Failed to fetch semester detail' };
  }
}

export async function getActiveSemester() {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: 'Unauthorized' };
    }

    const semester = await semesterRepo.getActiveSemester();
    return { success: true, data: semester };
  } catch (error) {
    console.error('Error fetching active semester:', error);
    return { success: false, error: 'Failed to fetch active semester' };
  }
}

export async function createSemesterAction(data: SemesterInput) {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: 'Unauthorized' };
    }

    // RBAC: Hanya Super Admin yang bisa create semester
    if (session.user.id_group_user !== 1) {
      return { success: false, error: 'Anda tidak memiliki izin untuk menambah semester' };
    }

    // Validate data
    const validatedData = semesterSchema.parse(data);

    // Add audit fields
    const semesterData = {
      ...validatedData,
      userInsert: session.user.name || 'system',
      dateInsert: new Date(),
    };

    const result = await semesterRepo.createSemester(semesterData);

    revalidatePath('/dashboard/semester');
    revalidatePath('/dashboard/sesi');

    return { success: true, data: result };
  } catch (error) {
    if (error instanceof ZodError) {
      return { success: false, error: error.errors[0].message };
    }
    console.error('Error creating semester:', error);
    return { success: false, error: 'Failed to create semester' };
  }
}

export async function updateSemesterAction(id: number, data: SemesterUpdateInput) {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: 'Unauthorized' };
    }

    // RBAC: Hanya Super Admin yang bisa update semester
    if (session.user.id_group_user !== 1) {
      return { success: false, error: 'Anda tidak memiliki izin untuk mengubah semester' };
    }

    // Validate data
    const validatedData = semesterUpdateSchema.parse(data);

    // Add audit fields
    const semesterData = {
      ...validatedData,
      userUpdate: session.user.name || 'system',
      dateUpdate: new Date(),
    };

    const result = await semesterRepo.updateSemester(id, semesterData);

    revalidatePath('/dashboard/semester');
    revalidatePath('/dashboard/sesi');
    revalidatePath(`/dashboard/semester/${id}`);

    return { success: true, data: result };
  } catch (error) {
    if (error instanceof ZodError) {
      return { success: false, error: error.errors[0].message };
    }
    console.error('Error updating semester:', error);
    return { success: false, error: 'Failed to update semester' };
  }
}

export async function deleteSemesterAction(id: number) {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: 'Unauthorized' };
    }

    // RBAC: Hanya Super Admin yang bisa delete semester
    if (session.user.id_group_user !== 1) {
      return { success: false, error: 'Anda tidak memiliki izin untuk menghapus semester' };
    }

    const userSession = {
      id: Number(session.user.id),
      id_group_user: session.user.id_group_user || 1,
      kantor_id: session.user.kantor_id,
      id_wilayah_pembinaan: session.user.id_wilayah_pembinaan,
    };

    const result = await semesterService.deleteSemesterForUser(userSession, id);
    if (!result.success) {
      return result; // Propagate error (e.g. Has dependents)
    }

    revalidatePath('/dashboard/semester');

    return { success: true, data: result.data };
  } catch (error) {
    console.error('Error deleting semester:', error);
    return { success: false, error: 'Failed to delete semester' };
  }
}

export async function setActiveSemesterAction(id: number) {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: 'Unauthorized' };
    }

    // RBAC: Hanya Super Admin yang bisa set active semester
    if (session.user.id_group_user !== 1) {
      return { success: false, error: 'Anda tidak memiliki izin untuk mengubah semester aktif' };
    }

    const result = await semesterRepo.setActiveSemester(id);

    revalidatePath('/dashboard/semester');
    revalidatePath('/dashboard/sesi');

    return { success: true, data: result };
  } catch (error) {
    console.error('Error setting active semester:', error);
    return { success: false, error: 'Failed to set active semester' };
  }
}
