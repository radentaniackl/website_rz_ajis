import { db } from '@/lib/db';
import { ajisSdmWilayah } from '@/lib/db/schema';
import { eq, or, and, ilike, desc, count } from 'drizzle-orm';
import { SdmWilayahInput, SdmWilayahUpdateInput } from '../validation/schemas';

export async function findAll(params: {
  page?: number;
  pageSize?: number;
  search?: string;
  kantorId?: number | null;
  wilayahPembinaanId?: number | null;
}) {
  const { page = 1, pageSize = 20, search, kantorId, wilayahPembinaanId } = params;
  const offset = (page - 1) * pageSize;

  let query = db.select().from(ajisSdmWilayah);
  let countQuery = db.select({ total: count() }).from(ajisSdmWilayah);

  const conditions = [];

  // Implement RBAC conditions if they are passed
  if (kantorId !== undefined && kantorId !== null) {
    conditions.push(eq(ajisSdmWilayah.penugasanKantorId, kantorId));
  }
  
  if (wilayahPembinaanId !== undefined && wilayahPembinaanId !== null) {
    conditions.push(eq(ajisSdmWilayah.penugasanWilayahId, wilayahPembinaanId));
  }

  // Search condition
  if (search) {
    conditions.push(
      or(
        ilike(ajisSdmWilayah.namaLengkap, `%${search}%`),
        ilike(ajisSdmWilayah.nik, `%${search}%`)
      )
    );
  }

  if (conditions.length > 0) {
    const whereClause = and(...conditions);
    query = query.where(whereClause) as any;
    countQuery = countQuery.where(whereClause) as any;
  }

  const [data, totalResult] = await Promise.all([
    query.limit(pageSize).offset(offset).orderBy(desc(ajisSdmWilayah.id)),
    countQuery
  ]);

  return {
    data,
    total: Number(totalResult[0]?.total ?? 0),
    page,
    pageSize,
  };
}

export async function findById(id: number) {
  const result = await db.select().from(ajisSdmWilayah).where(eq(ajisSdmWilayah.id, id)).limit(1);
  return result[0] || null;
}

export async function create(data: SdmWilayahInput, userId: string) {
  const result = await db
    .insert(ajisSdmWilayah)
    .values({
      ...data,
      userInsert: userId.toString(),
      dateInsert: new Date().toISOString().split('T')[0],
    })
    .returning();
  return result[0];
}

export async function update(id: number, data: SdmWilayahUpdateInput, userId: string) {
  const result = await db
    .update(ajisSdmWilayah)
    .set({
      ...data,
      userUpdate: userId.toString(),
      dateUpdate: new Date().toISOString().split('T')[0],
    })
    .where(eq(ajisSdmWilayah.id, id))
    .returning();
  return result[0];
}

export async function remove(id: number) {
  const result = await db.delete(ajisSdmWilayah).where(eq(ajisSdmWilayah.id, id)).returning();
  return result[0];
}
