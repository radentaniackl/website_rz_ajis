import { eq, inArray } from 'drizzle-orm';
import { ROLES } from './constants';

export interface UserContext {
  id_group_user: number;
  kantor_id?: number | null;
  id_wilayah_pembinaan?: number[];
}

export function buildRbacFilter(user: UserContext, table: any) {
  switch (user.id_group_user) {
    case ROLES.SUPER_ADMIN:
      // Super Admin: No filter - sees all data
      return undefined;
    
    case ROLES.BRANCH_ADMIN:
      // Branch Admin: Filter by kantor_id
      if (!user.kantor_id) {
        throw new Error('Branch Admin must have kantor_id assigned');
      }
      return eq(table.kantorId, user.kantor_id);
    
    case ROLES.KORWIL:
      // Korwil: Filter by wilayah_pembinaan_id
      if (!user.id_wilayah_pembinaan || user.id_wilayah_pembinaan.length === 0) {
        throw new Error('Korwil must have at least one wilayah assigned');
      }
      return inArray(table.wilayahPembinaanId, user.id_wilayah_pembinaan);
    
    default:
      throw new Error(`Unknown role: ${user.id_group_user}`);
  }
}

export function hasPermission(user: UserContext, permission: string): boolean {
  const { ROLE_PERMISSIONS } = require('./constants');
  const userPermissions = ROLE_PERMISSIONS[user.id_group_user] || [];
  return userPermissions.includes(permission);
}

export function requirePermission(user: UserContext, permission: string): void {
  if (!hasPermission(user, permission)) {
    throw new Error(`Permission denied: ${permission}`);
  }
}
