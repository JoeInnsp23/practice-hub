import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { leaveBalances, tenants, users } from "@/lib/db/schema";

const MAX_CARRYOVER_DAYS = 5;

/**
 * Calculate how many days of annual leave can be carried over to the next year
 * Maximum of 5 days can be carried over per AC14
 */
export function calculateCarryover(
  annualEntitlement: number,
  annualUsed: number,
  carriedOver: number,
): number {
  // Calculate unused leave from current year's entitlement only
  // Don't count already carried over days
  const currentYearEntitlement = annualEntitlement - carriedOver;
  const unusedDays = Math.max(0, currentYearEntitlement - annualUsed);

  // Cap at maximum carryover limit
  return Math.min(unusedDays, MAX_CARRYOVER_DAYS);
}

/**
 * Apply carryover for a specific user from one year to the next
 */
export async function applyCarryover(
  userId: string,
  tenantId: string,
  fromYear: number,
): Promise<{
  success: boolean;
  carriedDays?: number;
  error?: string;
}> {
  const toYear = fromYear + 1;

  try {
    // Get current year's balance
    const [currentBalance] = await db
      .select()
      .from(leaveBalances)
      .where(
        and(
          eq(leaveBalances.userId, userId),
          eq(leaveBalances.tenantId, tenantId),
          eq(leaveBalances.year, fromYear),
        ),
      );

    if (!currentBalance) {
      return {
        success: false,
        error: `No leave balance found for user ${userId} in year ${fromYear}`,
      };
    }

    // Calculate carryover days
    const carriedDays = calculateCarryover(
      currentBalance.annualEntitlement,
      currentBalance.annualUsed,
      currentBalance.carriedOver,
    );

    if (carriedDays === 0) {
      return {
        success: true,
        carriedDays: 0,
      };
    }

    // Check if next year's balance already exists
    const [nextYearBalance] = await db
      .select()
      .from(leaveBalances)
      .where(
        and(
          eq(leaveBalances.userId, userId),
          eq(leaveBalances.tenantId, tenantId),
          eq(leaveBalances.year, toYear),
        ),
      );

    if (nextYearBalance) {
      // Update existing balance with carryover
      await db
        .update(leaveBalances)
        .set({
          carriedOver: carriedDays,
          annualEntitlement: nextYearBalance.annualEntitlement + carriedDays,
        })
        .where(
          and(
            eq(leaveBalances.userId, userId),
            eq(leaveBalances.tenantId, tenantId),
            eq(leaveBalances.year, toYear),
          ),
        );
    } else {
      // Create new balance for next year with carryover
      await db.insert(leaveBalances).values({
        id: crypto.randomUUID(),
        userId,
        tenantId,
        year: toYear,
        annualEntitlement: 25 + carriedDays, // Default UK entitlement + carryover
        annualUsed: 0,
        sickUsed: 0,
        toilBalance: 0,
        carriedOver: carriedDays,
      });
    }

    return {
      success: true,
      carriedDays,
    };
  } catch (error) {
    console.error("Error applying carryover:", error);
    return {
      success: false,
      error: String(error),
    };
  }
}

/**
 * Run annual carryover for all users in a tenant
 */
export async function runAnnualCarryover(
  tenantId: string,
  fromYear: number,
): Promise<{
  success: boolean;
  processed: number;
  failed: number;
  results: Array<{ userId: string; carriedDays?: number; error?: string }>;
}> {
  try {
    // Get all users in the tenant
    const tenantUsers = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.tenantId, tenantId));

    const results: Array<{
      userId: string;
      carriedDays?: number;
      error?: string;
    }> = [];
    let processed = 0;
    let failed = 0;

    for (const user of tenantUsers) {
      const result = await applyCarryover(user.id, tenantId, fromYear);

      results.push({
        userId: user.id,
        carriedDays: result.carriedDays,
        error: result.error,
      });

      if (result.success) {
        processed++;
      } else {
        failed++;
      }
    }

    return {
      success: true,
      processed,
      failed,
      results,
    };
  } catch (error) {
    console.error("Error running annual carryover:", error);
    return {
      success: false,
      processed: 0,
      failed: 0,
      results: [],
    };
  }
}

/**
 * Run annual carryover for ALL tenants (use with caution!)
 */
export async function runGlobalCarryover(fromYear: number): Promise<{
  success: boolean;
  tenantsProcessed: number;
  totalUsersProcessed: number;
  totalUsersFailed: number;
}> {
  try {
    const allTenants = await db.select({ id: tenants.id }).from(tenants);

    let tenantsProcessed = 0;
    let totalUsersProcessed = 0;
    let totalUsersFailed = 0;

    for (const tenant of allTenants) {
      const result = await runAnnualCarryover(tenant.id, fromYear);
      if (result.success) {
        tenantsProcessed++;
        totalUsersProcessed += result.processed;
        totalUsersFailed += result.failed;
      }
    }

    return {
      success: true,
      tenantsProcessed,
      totalUsersProcessed,
      totalUsersFailed,
    };
  } catch (error) {
    console.error("Error running global carryover:", error);
    return {
      success: false,
      tenantsProcessed: 0,
      totalUsersProcessed: 0,
      totalUsersFailed: 0,
    };
  }
}
