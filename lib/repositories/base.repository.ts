import { db } from '@/lib/db';
import type { SQL } from 'drizzle-orm';

/**
 * Base Repository
 * Menyediakan utilitas dasar untuk semua domain repository.
 * Tanggung jawab:
 *   - Eksekusi query Drizzle dengan error handling
 *   - Logging query di development mode
 */

export type PaginationParams = {
  page: number;
  pageSize: number;
};

export type SortParams = {
  field: string;
  direction: 'asc' | 'desc';
};

export type FilterParams = {
  search?: string;
};

export type ListParams = PaginationParams & Partial<SortParams> & FilterParams;

/**
 * Menghitung total offset untuk query pagination.
 */
export function getOffset(page: number, pageSize: number): number {
  return (page - 1) * pageSize;
}

/**
 * Membungkus query DB dengan error logging.
 */
export async function safeQuery<T>(
  label: string,
  queryFn: () => Promise<T>
): Promise<T> {
  const isDev = process.env.NEXT_PUBLIC_APP_ENV === 'development';
  if (isDev) {
    console.debug(`[DB] ${label}`);
  }
  try {
    return await queryFn();
  } catch (error) {
    console.error(`[DB ERROR] ${label}:`, error);
    throw error;
  }
}

/** Mengekspos instance db untuk digunakan oleh repository */
export { db };
