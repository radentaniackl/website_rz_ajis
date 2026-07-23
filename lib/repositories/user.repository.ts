import { eq, ilike, and, count, desc, asc, type SQL } from 'drizzle-orm';
import { ajisUser } from '@/lib/db/schema';
import { db, getOffset, safeQuery, type ListParams } from './base.repository';

/**
 * User Repository
 * Tanggung jawab:
 *   - Satu-satunya tempat yang berinteraksi langsung dengan tabel ajis_user
 *   - Menerapkan RBAC scope filter sebelum query dieksekusi
 *   - Tidak mengandung logika bisnis
 */

export type UserRow = typeof ajisUser.$inferSelect;
export type NewUser = typeof ajisUser.$inferInsert;

// ─── READ ────────────────────────────────────────────────────────────────────

export async function findUserByUsername(username: string): Promise<UserRow | null> {
  return safeQuery(`findUserByUsername(${username})`, async () => {
    const result = await db
      .select()
      .from(ajisUser)
      .where(eq(ajisUser.username, username))
      .limit(1);
    return result[0] ?? null;
  });
}

export async function findUserById(id: number): Promise<UserRow | null> {
  return safeQuery(`findUserById(${id})`, async () => {
    const result = await db
      .select()
      .from(ajisUser)
      .where(eq(ajisUser.id, BigInt(id)))
      .limit(1);
    return result[0] ?? null;
  });
}

export type ListUsersParams = ListParams & {
  rbacFilter?: SQL;
  kantorId?: number;
};

export async function listUsers(params: ListUsersParams) {
  const { page, pageSize, search, rbacFilter, kantorId } = params;

  return safeQuery(`listUsers(page=${page})`, async () => {
    const conditions: SQL[] = [];

    if (rbacFilter) conditions.push(rbacFilter);
    if (kantorId) conditions.push(eq(ajisUser.kantorId, kantorId));
    if (search) conditions.push(ilike(ajisUser.username, `%${search}%`));

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const [rows, totalResult] = await Promise.all([
      db
        .select()
        .from(ajisUser)
        .where(where)
        .orderBy(desc(ajisUser.dateInsert))
        .limit(pageSize)
        .offset(getOffset(page, pageSize)),
      db
        .select({ total: count() })
        .from(ajisUser)
        .where(where),
    ]);

    return {
      data: rows,
      total: Number(totalResult[0]?.total ?? 0),
      page,
      pageSize,
    };
  });
}

// ─── WRITE ───────────────────────────────────────────────────────────────────

export async function createUser(data: NewUser): Promise<UserRow> {
  return safeQuery('createUser', async () => {
    const [user] = await db.insert(ajisUser).values(data).returning();
    return user;
  });
}

export async function updateUser(
  id: number,
  data: Partial<Pick<NewUser, 'aktif' | 'mustResetPassword' | 'kantorId' | 'groupUserId' | 'passwordHash'>>
): Promise<UserRow | null> {
  return safeQuery(`updateUser(${id})`, async () => {
    const [user] = await db
      .update(ajisUser)
      .set(data)
      .where(eq(ajisUser.id, BigInt(id)))
      .returning();
    return user ?? null;
  });
}

export async function deactivateUser(id: number): Promise<UserRow | null> {
  return updateUser(id, { aktif: 'n' });
}
