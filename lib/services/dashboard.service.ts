import { db } from '@/lib/db';
import { ajisAnak } from '@/lib/db/schema';
import { count, and, gte, sql } from 'drizzle-orm';
import { UserContext } from '@/lib/rbac/filters';
import { buildRbacFilter } from '@/lib/rbac/filters';

export class DashboardService {
  async getStatistics(userContext: UserContext) {
    try {
      // Get current date for filtering
      const now = new Date();
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const firstDayOfSemester = new Date(now.getFullYear(), now.getMonth() - 5, 1); // Approx 6 months back

      // Build RBAC filter for Anak
      const anakFilter = buildRbacFilter(userContext, ajisAnak);

      // Total Anak (based on RBAC)
      const totalAnakResult = await db
        .select({ count: count() })
        .from(ajisAnak)
        .where(anakFilter ? and(anakFilter, sql`${ajisAnak.aktif} = 'y'`) : sql`${ajisAnak.aktif} = 'y'`);

      // Other modules (Sesi, Hafalan, Evaluasi) not implemented yet - return 0
      return {
        totalAnak: totalAnakResult[0]?.count || 0,
        totalSesi: 0, // TODO: Implement when ajisSesi table is added to schema
        totalHafalan: 0, // TODO: Implement when ajisHafalan table is added to schema
        totalEvaluasi: 0, // TODO: Implement when ajisEvaluasi table is added to schema
      };
    } catch (error) {
      console.error('Error fetching dashboard statistics:', error);
      // Return zeros on error to prevent UI breakage
      return {
        totalAnak: 0,
        totalSesi: 0,
        totalHafalan: 0,
        totalEvaluasi: 0,
      };
    }
  }

  async getRecentActivity(userContext: UserContext) {
    try {
      // Recent activity modules not implemented yet - return empty arrays
      return {
        recentSesi: [], // TODO: Implement when ajisSesi table is added to schema
        recentHafalan: [], // TODO: Implement when ajisHafalan table is added to schema
      };
    } catch (error) {
      console.error('Error fetching recent activity:', error);
      return {
        recentSesi: [],
        recentHafalan: [],
      };
    }
  }
}

export const dashboardService = new DashboardService();
