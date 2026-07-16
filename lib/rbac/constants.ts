export const ROLES = {
  SUPER_ADMIN: 1,
  BRANCH_ADMIN: 2,
  KORWIL: 9,
} as const;

export const ROLE_NAMES = {
  [ROLES.SUPER_ADMIN]: 'Super Admin',
  [ROLES.BRANCH_ADMIN]: 'Branch Admin',
  [ROLES.KORWIL]: 'Regional Coordinator',
} as const;

export const PERMISSIONS = {
  // Referensi Data
  REFERENSI_CREATE: 'referensi:create',
  REFERENSI_READ: 'referensi:read',
  REFERENSI_UPDATE: 'referensi:update',
  REFERENSI_DELETE: 'referensi:delete',
  
  // Anak Data
  ANAK_CREATE: 'anak:create',
  ANAK_READ: 'anak:read',
  ANAK_UPDATE: 'anak:update',
  ANAK_DELETE: 'anak:delete',
  
  // Operational Data
  SESI_CREATE: 'sesi:create',
  SESI_READ: 'sesi:read',
  SESI_UPDATE: 'sesi:update',
  SESI_DELETE: 'sesi:delete',
  
  HAFALAN_CREATE: 'hafalan:create',
  HAFALAN_READ: 'hafalan:read',
  HAFALAN_UPDATE: 'hafalan:update',
  
  EVALUASI_CREATE: 'evaluasi:create',
  EVALUASI_READ: 'evaluasi:read',
  EVALUASI_UPDATE: 'evaluasi:update',
  
  // User Management
  USER_CREATE: 'user:create',
  USER_READ: 'user:read',
  USER_UPDATE: 'user:update',
  USER_DELETE: 'user:delete',
  
  // Settings
  SETTINGS_MANAGE: 'settings:manage',
} as const;

export const ROLE_PERMISSIONS = {
  [ROLES.SUPER_ADMIN]: Object.values(PERMISSIONS),
  [ROLES.BRANCH_ADMIN]: [
    PERMISSIONS.REFERENSI_READ,
    PERMISSIONS.ANAK_CREATE,
    PERMISSIONS.ANAK_READ,
    PERMISSIONS.ANAK_UPDATE,
    PERMISSIONS.SESI_CREATE,
    PERMISSIONS.SESI_READ,
    PERMISSIONS.SESI_UPDATE,
    PERMISSIONS.HAFALAN_CREATE,
    PERMISSIONS.HAFALAN_READ,
    PERMISSIONS.HAFALAN_UPDATE,
    PERMISSIONS.EVALUASI_CREATE,
    PERMISSIONS.EVALUASI_READ,
    PERMISSIONS.EVALUASI_UPDATE,
    PERMISSIONS.USER_CREATE,
    PERMISSIONS.USER_READ,
    PERMISSIONS.USER_UPDATE,
  ],
  [ROLES.KORWIL]: [
    PERMISSIONS.REFERENSI_READ,
    PERMISSIONS.ANAK_READ,
    PERMISSIONS.SESI_CREATE,
    PERMISSIONS.SESI_READ,
    PERMISSIONS.SESI_UPDATE,
    PERMISSIONS.HAFALAN_CREATE,
    PERMISSIONS.HAFALAN_READ,
    PERMISSIONS.HAFALAN_UPDATE,
    PERMISSIONS.EVALUASI_CREATE,
    PERMISSIONS.EVALUASI_READ,
    PERMISSIONS.EVALUASI_UPDATE,
  ],
} as const;
