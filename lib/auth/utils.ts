import { auth } from '@/auth';
import { ROLES } from '@/lib/rbac/constants';

export async function requireAuth() {
  const session = await auth();
  
  if (!session?.user) {
    throw new Error('Unauthorized: No active session');
  }
  
  if (session.user.aktif !== 'y') {
    throw new Error('Forbidden: User account is inactive');
  }
  
  return session;
}

export async function requireRole(roleId: number) {
  const session = await requireAuth();
  
  if (session.user.id_group_user !== roleId) {
    throw new Error(`Forbidden: Required role ${roleId}`);
  }
  
  return session;
}

export async function requireAnyRole(roleIds: number[]) {
  const session = await requireAuth();
  
  if (!roleIds.includes(session.user.id_group_user)) {
    throw new Error(`Forbidden: Required one of roles ${roleIds.join(', ')}`);
  }
  
  return session;
}

export function getUserContext(session: any) {
  return {
    id: session.user.id,
    username: session.user.username,
    id_group_user: session.user.id_group_user,
    kantor_id: session.user.kantor_id,
    id_wilayah_pembinaan: session.user.id_wilayah_pembinaan,
  };
}
