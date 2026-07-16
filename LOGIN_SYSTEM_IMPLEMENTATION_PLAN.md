# LOGIN SYSTEM IMPLEMENTATION PLAN
## RZ AJIS - Authentication & Authorization System

**Created:** July 16, 2026  
**Status:** Ready for Implementation  
**Priority:** CRITICAL - Required for all other features

---

## 1. SYSTEM OVERVIEW

### 1.1 Authentication Architecture
- **Framework:** NextAuth.js v5 (Next.js 15 App Router)
- **Strategy:** JWT with httpOnly cookies + optional database session
- **Providers:** 
  - Credentials (Username/Password) - Primary for development
  - Google OAuth (Optional - requires AUTH_GOOGLE_ID & AUTH_GOOGLE_SECRET)
  - Microsoft Azure AD (Optional - requires AUTH_MICROSOFT_ID & AUTH_MICROSOFT_SECRET)
- **Session Duration:** 30 days max, refresh every 24 hours
- **Password Hashing:** bcrypt/argon2 (cost factor 12)

### 1.2 User Roles (RBAC)
| Role ID | Role Name | Scope | Access Level |
|---------|-----------|-------|--------------|
| 1 | Super Admin | All offices, all regions | Full system access, user management, config |
| 2 | Branch Admin (SPMD) | Single office + regions | Office data CRUD, office users CRUD |
| 9 | Regional Coordinator (Korwil) | Assigned regions only | Read anak, CRUD operational (sesi, hafalan, evaluasi) |

### 1.3 JWT Token Structure
```json
{
  "sub": "user_id",
  "username": "username",
  "id_group_user": 1,
  "kantor_id": 15,
  "id_wilayah_pembinaan": [42, 43],
  "email": "user@example.com",
  "iat": 1689876543,
  "exp": 1689880143
}
```

---

## 2. CURRENT STATUS ANALYSIS

### 2.1 Completed Components
✅ NextAuth.js configuration in `lib/auth/config.ts`  
✅ Database schema for user tables (ajis_user, ajis_group_user, ajis_user_wilayah_pembinaan)  
✅ SessionProvider wrapper in root layout  
✅ Middleware for route protection  
✅ Login page UI at `/login`  
✅ Password reset flow (basic implementation)

### 2.2 Critical Issues
❌ **NEXTAUTH_SECRET missing** - Required for JWT signing  
❌ **No user data in database** - Need seed data for initial users  
❌ **Password hashing not implemented** - Need bcrypt integration  
❌ **RBAC middleware incomplete** - WHERE clause builders not implemented  
❌ **Database connection not verified** - DATABASE_URL may not be configured

### 2.3 Missing Components
❌ User seed data script  
❌ Password hashing utility  
❌ RBAC filter builders  
❌ Auth utility functions  
❌ User creation server actions  
❌ Session validation helpers

---

## 3. IMPLEMENTATION PLAN

### Phase 1: Environment Setup (CRITICAL - BLOCKING)

#### Task 1.1: Configure Environment Variables
**File:** `.env.local`
```env
# Database (Neon PostgreSQL)
DATABASE_URL=postgresql://username:password@host/database?sslmode=require

# NextAuth.js
NEXTAUTH_SECRET=generate-with-openssl-rand-base64-32
NEXTAUTH_URL=http://localhost:3000

# Optional: OAuth Providers
# AUTH_GOOGLE_ID=your-google-client-id
# AUTH_GOOGLE_SECRET=your-google-client-secret
```

**Action Required:** User must generate NEXTAUTH_SECRET and configure DATABASE_URL

#### Task 1.2: Verify Database Connection
**Script:** Test database connection with Drizzle ORM
```typescript
// lib/db/test-connection.ts
import { db } from './index';

export async function testConnection() {
  try {
    await db.execute(sql`SELECT 1`);
    console.log('✅ Database connection successful');
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    return false;
  }
}
```

---

### Phase 2: Password Hashing & User Seeding

#### Task 2.1: Create Password Hashing Utility
**File:** `lib/auth/password.ts`
```typescript
import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 12;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function generateRandomPassword(length: number = 16): Promise<string> {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let password = '';
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}
```

#### Task 2.2: Create User Seed Data
**File:** `lib/db/seed/users.ts`
```typescript
import { db } from '../index';
import { ajisGroupUser, ajisUser, ajisUserWilayahPembinaan } from '../../db/schema';
import { hashPassword } from '../../lib/auth/password';

export async function seedUsers() {
  console.log('🌱 Seeding user data...');

  // 1. Create user groups if not exist
  const groups = await db.insert(ajisGroupUser).values([
    { id: 1, nama: 'Super Admin', keterangan: 'Full system access', aktif: 'y' },
    { id: 2, nama: 'Branch Admin', keterangan: 'Office level access', aktif: 'y' },
    { id: 9, nama: 'Regional Coordinator', keterangan: 'Regional operational access', aktif: 'y' },
  ]).onConflictDoNothing();

  // 2. Create default Super Admin user
  const adminPassword = await hashPassword('Admin@123'); // CHANGE IN PRODUCTION
  const adminUser = await db.insert(ajisUser).values({
    username: 'admin',
    passwordHash: adminPassword,
    mustResetPassword: true,
    groupUserId: 1,
    aktif: 'y',
    userInsert: 'system',
    dateInsert: new Date(),
  }).onConflictDoNothing().returning();

  // 3. Create test Branch Admin user
  const branchPassword = await hashPassword('Branch@123');
  const branchUser = await db.insert(ajisUser).values({
    username: 'branch_admin',
    passwordHash: branchPassword,
    mustResetPassword: true,
    groupUserId: 2,
    kantorId: 1, // Assuming kantor with id=1 exists
    aktif: 'y',
    userInsert: 'system',
    dateInsert: new Date(),
  }).onConflictDoNothing().returning();

  // 4. Create test Korwil user
  const korwilPassword = await hashPassword('Korwil@123');
  const korwilUser = await db.insert(ajisUser).values({
    username: 'korwil',
    passwordHash: korwilPassword,
    mustResetPassword: true,
    groupUserId: 9,
    aktif: 'y',
    userInsert: 'system',
    dateInsert: new Date(),
  }).onConflictDoNothing().returning();

  // 5. Assign regions to Korwil (if wilayah data exists)
  if (korwilUser.length > 0) {
    await db.insert(ajisUserWilayahPembinaan).values({
      userId: korwilUser[0].id,
      wilayahPembinaanId: 1, // Assuming wilayah with id=1 exists
    }).onConflictDoNothing();
  }

  console.log('✅ User seeding completed');
  console.log('📝 Default credentials (CHANGE IN PRODUCTION):');
  console.log('   Super Admin: admin / Admin@123');
  console.log('   Branch Admin: branch_admin / Branch@123');
  console.log('   Korwil: korwil / Korwil@123');
}
```

#### Task 2.3: Create Seed Script Runner
**File:** `lib/db/seed/index.ts`
```typescript
import { seedUsers } from './users';

export async function seedDatabase() {
  try {
    await seedUsers();
    console.log('🎉 Database seeding completed successfully');
  } catch (error) {
    console.error('❌ Database seeding failed:', error);
    throw error;
  }
}

// Run if executed directly
if (require.main === module) {
  seedDatabase()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
```

---

### Phase 3: RBAC Implementation

#### Task 3.1: Create RBAC Constants
**File:** `lib/rbac/constants.ts`
```typescript
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
```

#### Task 3.2: Create RBAC Filter Builders
**File:** `lib/rbac/filters.ts`
```typescript
import { eq, and, or, inArray } from 'drizzle-orm';
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
```

#### Task 3.3: Create Auth Utility Functions
**File:** `lib/auth/utils.ts`
```typescript
import { getServerSession } from 'next-auth';
import { authConfig } from './config';

export async function requireAuth() {
  const session = await getServerSession(authConfig);
  
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
```

---

### Phase 4: Server Actions for User Management

#### Task 4.1: Create User Server Actions
**File:** `app/actions/users.ts`
```typescript
"use server";

import { db } from '@/lib/db';
import { ajisUser, ajisGroupUser, ajisUserWilayahPembinaan } from '@/db/schema';
import { hashPassword } from '@/lib/auth/password';
import { requireAuth, requireRole } from '@/lib/auth/utils';
import { ROLES } from '@/lib/rbac/constants';
import { revalidatePath } from 'next/cache';
import { eq } from 'drizzle-orm';

export async function createUser(data: {
  username: string;
  password: string;
  groupUserId: number;
  kantorId?: number;
  wilayahIds?: number[];
}) {
  const session = await requireAuth();
  await requireRole(ROLES.SUPER_ADMIN);

  // Check if username exists
  const existing = await db
    .select()
    .from(ajisUser)
    .where(eq(ajisUser.username, data.username))
    .limit(1);

  if (existing.length > 0) {
    return { success: false, error: 'Username already exists' };
  }

  // Hash password
  const passwordHash = await hashPassword(data.password);

  // Create user
  const newUser = await db.insert(ajisUser).values({
    username: data.username,
    passwordHash,
    groupUserId: data.groupUserId,
    kantorId: data.kantorId,
    mustResetPassword: true,
    aktif: 'y',
    userInsert: session.user.username,
    dateInsert: new Date(),
  }).returning();

  // Assign wilayah if provided
  if (data.wilayahIds && data.wilayahIds.length > 0) {
    await db.insert(ajisUserWilayahPembinaan).values(
      data.wilayahIds.map(wilayahId => ({
        userId: newUser[0].id,
        wilayahPembinaanId: wilayahId,
      }))
    );
  }

  revalidatePath('/dashboard/users');
  return { success: true, data: newUser[0] };
}

export async function resetPassword(userId: number, newPassword: string) {
  const session = await requireAuth();
  await requireRole(ROLES.SUPER_ADMIN);

  const passwordHash = await hashPassword(newPassword);

  await db.update(ajisUser)
    .set({
      passwordHash,
      mustResetPassword: true,
    })
    .where(eq(ajisUser.id, userId));

  revalidatePath('/dashboard/users');
  return { success: true };
}
```

---

### Phase 5: Testing & Validation

#### Task 5.1: Manual Testing Checklist
- [ ] Test login with Super Admin credentials
- [ ] Test login with Branch Admin credentials  
- [ ] Test login with Korwil credentials
- [ ] Test invalid credentials (wrong password)
- [ ] Test inactive user login (should fail)
- [ ] Test session persistence after page refresh
- [ ] Test session expiry after 30 days
- [ ] Test logout functionality
- [ ] Test RBAC - Super Admin access to all routes
- [ ] Test RBAC - Branch Admin restricted to office data
- [ ] Test RBAC - Korwil restricted to regional data
- [ ] Test password reset flow
- [ ] Test middleware route protection

#### Task 5.2: Automated Testing
**File:** `__tests__/auth.test.ts`
```typescript
import { describe, it, expect } from 'vitest';
import { hashPassword, verifyPassword } from '@/lib/auth/password';

describe('Password Hashing', () => {
  it('should hash password correctly', async () => {
    const password = 'Test@123';
    const hash = await hashPassword(password);
    expect(hash).not.toBe(password);
    expect(hash.length).toBeGreaterThan(50);
  });

  it('should verify correct password', async () => {
    const password = 'Test@123';
    const hash = await hashPassword(password);
    const isValid = await verifyPassword(password, hash);
    expect(isValid).toBe(true);
  });

  it('should reject incorrect password', async () => {
    const password = 'Test@123';
    const hash = await hashPassword(password);
    const isValid = await verifyPassword('Wrong@123', hash);
    expect(isValid).toBe(false);
  });
});
```

---

## 4. DEPLOYMENT CHECKLIST

### Pre-Deployment
- [ ] Change default passwords in seed data
- [ ] Generate secure NEXTAUTH_SECRET for production
- [ ] Configure production DATABASE_URL
- [ ] Set up OAuth providers (if using SSO)
- [ ] Enable SSL/TLS for database connection
- [ ] Configure rate limiting for login attempts
- [ ] Set up monitoring for authentication failures

### Post-Deployment
- [ ] Run database migrations
- [ ] Execute seed script to create initial users
- [ ] Test login with production credentials
- [ ] Verify RBAC permissions
- [ ] Monitor authentication logs
- [ ] Set up alerts for failed login attempts

---

## 5. SECURITY CONSIDERATIONS

### 5.1 Password Security
- Minimum 8 characters
- Must include uppercase, lowercase, number, special character
- Force password reset on first login
- Password expiry (optional - 90 days)
- Prevent password reuse (last 5 passwords)

### 5.2 Session Security
- httpOnly cookies to prevent XSS
- Secure cookies in production (HTTPS only)
- SameSite cookies to prevent CSRF
- Session timeout after 30 days
- Refresh token every 24 hours

### 5.3 Account Security
- Account lockout after 5 failed attempts (15 minutes)
- Email verification for password reset
- Two-factor authentication (optional - future enhancement)
- Audit logging for all authentication events

### 5.4 RBAC Security
- Server-side permission checks on every action
- WHERE clause injection at database level
- No client-side permission enforcement
- Audit logging for permission violations

---

## 6. NEXT STEPS

### Immediate After Login Implementation
1. **Create Dashboard Home Page** - Statistics and quick actions
2. **Implement User Management UI** - CRUD for users
3. **Implement Role Assignment UI** - Assign users to roles and regions
4. **Create Audit Log Viewer** - View authentication and permission events
5. **Implement Password Reset Flow** - Email-based password reset

### Future Enhancements
1. **Two-Factor Authentication** - TOTP or SMS-based 2FA
2. **Single Sign-On (SSO)** - Google/Microsoft OAuth integration
3. **Social Login** - Facebook, GitHub providers
4. **Session Management** - View active sessions, revoke sessions
5. **Advanced RBAC** - Fine-grained permissions per module

---

## 7. TROUBLESHOOTING

### Common Issues

#### Issue: "MissingSecret" Error
**Solution:** Add NEXTAUTH_SECRET to .env.local
```bash
openssl rand -base64 32
```

#### Issue: Database Connection Failed
**Solution:** Verify DATABASE_URL is correct and database is accessible
```bash
# Test connection
psql $DATABASE_URL
```

#### Issue: Login Redirects to Login Page
**Solution:** Check middleware configuration and session cookie settings

#### Issue: RBAC Not Working
**Solution:** Verify user has correct role_id and wilayah assignments in database

#### Issue: Password Hash Mismatch
**Solution:** Ensure bcrypt is installed and password hashing is consistent
```bash
npm install bcryptjs
npm install -D @types/bcryptjs
```

---

## 8. REFERENCES

- [NextAuth.js Documentation](https://next-auth.js.org/)
- [Drizzle ORM Documentation](https://orm.drizzle.team/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [RBAC Best Practices](https://owasp.org/www-community/Access_Control)

---

**Document Version:** 1.0  
**Last Updated:** July 16, 2026  
**Author:** Cascade AI Assistant  
**Status:** Ready for Implementation
