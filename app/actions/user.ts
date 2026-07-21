'use server';

import { auth } from '@/auth';
import { listUsersByUser, getUserById } from '@/lib/services/user.service';
import * as userRepo from '@/lib/repositories/user.repository';
import { deleteUserForUser } from '@/lib/services/user.service';
import { userSchema, userUpdateSchema, type UserInput, type UserUpdateInput } from '@/lib/validation/schemas';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import bcrypt from 'bcryptjs';

export async function getUserList(params: { page?: number; pageSize?: number; search?: string }) {
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

    const result = await listUsersByUser(user, params);
    return { success: true, data: result };
  } catch (error) {
    console.error('Error fetching user list:', error);
    return { success: false, error: 'Failed to fetch user list' };
  }
}

export async function getUserDetail(id: number) {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: 'Unauthorized' };
    }

    // RBAC: Only Super Admin and Branch Admin can access user
    if (session.user.id_group_user === 9) {
      return { success: false, error: 'Forbidden - Korwil cannot access user' };
    }

    const user = await getUserById(id);
    if (!user) {
      return { success: false, error: 'User not found' };
    }

    // Branch Admin: only can access users in their kantor
    if (session.user.id_group_user === 2 && session.user.kantor_id) {
      const userKantorId = user.kantorId ? Number(user.kantorId) : null;
      if (userKantorId !== session.user.kantor_id) {
        return { success: false, error: 'Forbidden - You can only access users in your kantor' };
      }
    }

    return { success: true, data: user };
  } catch (error) {
    console.error('Error fetching user detail:', error);
    return { success: false, error: 'Failed to fetch user detail' };
  }
}

export async function createUserAction(input: UserInput) {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: 'Unauthorized' };
    }

    // RBAC: Only Super Admin and Branch Admin can create user
    if (session.user.id_group_user === 9) {
      return { success: false, error: 'Forbidden - Korwil cannot create user' };
    }

    // Validate input
    const validated = userSchema.parse(input);

    // Check if username already exists
    const existing = await userRepo.findUserByUsername(validated.username);
    if (existing) {
      return { success: false, error: 'Username already exists' };
    }

    // Branch Admin: only can create users in their kantor
    if (session.user.id_group_user === 2 && session.user.kantor_id) {
      if (validated.kantorId && validated.kantorId !== session.user.kantor_id) {
        return { success: false, error: 'Forbidden - You can only create users in your kantor' };
      }
      if (!validated.kantorId) {
        validated.kantorId = session.user.kantor_id;
      }
    }

    const user = await userRepo.createUser({
      ...validated,
      kantorId: validated.kantorId ? BigInt(validated.kantorId) : null,
      groupUserId: validated.groupUserId ? BigInt(validated.groupUserId) : null,
      dateInsert: new Date().toISOString(),
    });
    revalidatePath('/dashboard/users');
    return { success: true, data: user };
  } catch (error) {
    console.error('Error creating user:', error);
    return { success: false, error: 'Failed to create user' };
  }
}

export async function updateUserAction(id: number, input: UserUpdateInput) {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: 'Unauthorized' };
    }

    // RBAC: Only Super Admin and Branch Admin can update user
    if (session.user.id_group_user === 9) {
      return { success: false, error: 'Forbidden - Korwil cannot update user' };
    }

    // Validate input
    const validated = userUpdateSchema.parse(input);

    // Check if user exists
    const existing = await userRepo.findUserById(id);
    if (!existing) {
      return { success: false, error: 'User not found' };
    }

    // Branch Admin: only can update users in their kantor
    if (session.user.id_group_user === 2 && session.user.kantor_id) {
      const existingKantorId = existing.kantorId ? Number(existing.kantorId) : null;
      if (existingKantorId !== session.user.kantor_id) {
        return { success: false, error: 'Forbidden - You can only update users in your kantor' };
      }
      if (validated.kantorId && validated.kantorId !== session.user.kantor_id) {
        return { success: false, error: 'Forbidden - You can only assign users to your kantor' };
      }
    }

    // If username is being updated, check if it already exists
    if (validated.username && validated.username !== existing.username) {
      const usernameExists = await userRepo.findUserByUsername(validated.username);
      if (usernameExists) {
        return { success: false, error: 'Username already exists' };
      }
    }

    const user = await userRepo.updateUser(id, {
      ...validated,
      kantorId: validated.kantorId ? BigInt(validated.kantorId) : undefined,
      groupUserId: validated.groupUserId ? BigInt(validated.groupUserId) : undefined,
    });
    revalidatePath('/dashboard/users');
    revalidatePath(`/dashboard/users/${id}/edit`);
    return { success: true, data: user };
  } catch (error) {
    console.error('Error updating user:', error);
    return { success: false, error: 'Failed to update user' };
  }
}

export async function deleteUserAction(id: number) {
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

    const result = await deleteUserForUser(user, id, { force: false });
    if (!result.success && result.error === 'Has dependents') {
      return { success: false, error: 'Cannot delete user: dependent records exist.', details: result.dependents };
    }
    if (!result.success) {
      return { success: false, error: result.error ?? 'Failed to delete user' };
    }
    revalidatePath('/dashboard/users');
    return { success: true, data: result.data };
  } catch (error) {
    console.error('Error deleting user:', error);
    return { success: false, error: 'Failed to delete user' };
  }
}

export async function forceDeleteUserAction(id: number) {
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

    const result = await deleteUserForUser(user, id, { force: true });
    if (!result.success) {
      return { success: false, error: result.error ?? 'Failed to delete user' };
    }
    revalidatePath('/dashboard/users');
    return { success: true, data: result.data };
  } catch (error) {
    console.error('Error force deleting user:', error);
    return { success: false, error: 'Failed to delete user' };
  }
}

export async function resetUserPasswordAction(id: number, newPassword: string) {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: 'Unauthorized' };
    }

    // RBAC: Only Super Admin and Branch Admin can reset password
    if (session.user.id_group_user === 9) {
      return { success: false, error: 'Forbidden - Korwil cannot reset password' };
    }

    // Check if user exists
    const existing = await userRepo.findUserById(id);
    if (!existing) {
      return { success: false, error: 'User not found' };
    }

    // Branch Admin: only can reset password for users in their kantor
    if (session.user.id_group_user === 2 && session.user.kantor_id) {
      const existingKantorId = existing.kantorId ? Number(existing.kantorId) : null;
      if (existingKantorId !== session.user.kantor_id) {
        return { success: false, error: 'Forbidden - You can only reset password for users in your kantor' };
      }
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(newPassword, 12);

    const user = await userRepo.updateUser(id, {
      passwordHash,
      mustResetPassword: true,
    });
    revalidatePath('/dashboard/users');
    return { success: true, data: user };
  } catch (error) {
    console.error('Error resetting user password:', error);
    return { success: false, error: 'Failed to reset user password' };
  }
}
