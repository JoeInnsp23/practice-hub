import { and, count, eq, gte } from "drizzle-orm";
import { db } from "@/lib/db";
import { clients, proposals } from "@/lib/db/schema";
import { publicProcedure, router } from "../trpc";

/**
 * Landing Page Router
 *
 * Provides live statistics for landing page hero section:
 * - Proposals sent this week
 * - New clients added this week
 *
 * Note: Returns zeros for unauthenticated users (landing page is public)
 */
export const landingRouter = router({
  /**
   * Get this week's statistics for the landing page
   * Returns proposals sent and new clients added in the last 7 days
   * For unauthenticated users, returns zeros
   */
  getWeeklyStats: publicProcedure.query(async ({ ctx }) => {
    // If no tenant context (unauthenticated), return zeros
    if (!ctx.authContext?.tenantId) {
      return {
        proposalsSentThisWeek: 0,
        newClientsThisWeek: 0,
      };
    }

    const { tenantId } = ctx.authContext;

    // Calculate start of week (Monday)
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(
      today.getDate() - today.getDay() + (today.getDay() === 0 ? -6 : 1),
    );
    startOfWeek.setHours(0, 0, 0, 0);

    try {
      // Get proposals created this week
      const proposalsThisWeek = await db
        .select({ count: count() })
        .from(proposals)
        .where(
          and(
            eq(proposals.tenantId, tenantId),
            gte(proposals.createdAt, startOfWeek),
          ),
        );

      // Get new clients added this week
      const newClientsThisWeek = await db
        .select({ count: count() })
        .from(clients)
        .where(
          and(
            eq(clients.tenantId, tenantId),
            gte(clients.createdAt, startOfWeek),
          ),
        );

      return {
        proposalsSentThisWeek: proposalsThisWeek[0]?.count || 0,
        newClientsThisWeek: newClientsThisWeek[0]?.count || 0,
      };
    } catch (error) {
      console.error("Error fetching landing stats:", error);
      return {
        proposalsSentThisWeek: 0,
        newClientsThisWeek: 0,
      };
    }
  }),
});
