import * as Sentry from "@sentry/nextjs";
import { and, eq, lte, sql } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { leaveBalances, tenants, toilAccrualHistory } from "@/lib/db/schema";

/**
 * TOIL Expiry Cron Job
 *
 * This endpoint should be called daily to expire TOIL records that are older than their expiry date.
 * Configure in your cron service (e.g., Vercel Cron, GitHub Actions, or similar) to run daily at midnight.
 *
 * Example cron configuration (vercel.json):
 * {
 *   "crons": [{
 *     "path": "/api/cron/expire-toil",
 *     "schedule": "0 0 * * *"
 *   }]
 * }
 *
 * Security: Protect this endpoint with CRON_SECRET environment variable
 */
export async function GET(request: NextRequest) {
  try {
    // Verify cron secret (recommended for production)
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      Sentry.captureMessage("Unauthorized TOIL expiry cron attempt", {
        level: "warning",
        extra: { ip: request.headers.get("x-forwarded-for") },
      });
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const today = new Date().toISOString().split("T")[0];
    const currentYear = new Date().getFullYear();

    // Get all tenants
    const allTenants = await db.select().from(tenants);

    let totalExpired = 0;
    let totalUsersAffected = 0;
    const tenantResults: Array<{
      tenantId: string;
      tenantName: string;
      expiredCount: number;
      usersAffected: number;
    }> = [];

    // Process each tenant separately
    for (const tenant of allTenants) {
      const tenantId = tenant.id;

      // Find all expired TOIL records for this tenant
      const expiredRecords = await db
        .update(toilAccrualHistory)
        .set({ expired: true })
        .where(
          and(
            eq(toilAccrualHistory.tenantId, tenantId),
            eq(toilAccrualHistory.expired, false),
            lte(toilAccrualHistory.expiryDate, today),
          ),
        )
        .returning();

      if (expiredRecords.length === 0) {
        continue;
      }

      // Aggregate expired hours by user
      const userHoursMap = new Map<string, number>();
      for (const record of expiredRecords) {
        const currentHours = userHoursMap.get(record.userId) || 0;
        userHoursMap.set(record.userId, currentHours + record.hoursAccrued);
      }

      // Update balances for each affected user
      for (const [userId, hoursToDeduct] of userHoursMap.entries()) {
        await db
          .update(leaveBalances)
          .set({
            toilBalance: sql`GREATEST(0, ${leaveBalances.toilBalance} - ${hoursToDeduct})`,
          })
          .where(
            and(
              eq(leaveBalances.tenantId, tenantId),
              eq(leaveBalances.userId, userId),
              eq(leaveBalances.year, currentYear),
            ),
          );
      }

      totalExpired += expiredRecords.length;
      totalUsersAffected += userHoursMap.size;

      tenantResults.push({
        tenantId,
        tenantName: tenant.name,
        expiredCount: expiredRecords.length,
        usersAffected: userHoursMap.size,
      });

      // Log to Sentry for monitoring
      if (expiredRecords.length > 0) {
        Sentry.captureMessage("TOIL expired for tenant", {
          level: "info",
          tags: {
            operation: "toil_expiry",
            tenantId,
          },
          extra: {
            tenantName: tenant.name,
            expiredCount: expiredRecords.length,
            usersAffected: userHoursMap.size,
            totalHoursExpired: Array.from(userHoursMap.values()).reduce(
              (sum, hours) => sum + hours,
              0,
            ),
          },
        });
      }
    }

    // Return summary
    return NextResponse.json({
      success: true,
      summary: {
        date: today,
        totalTenantsProcessed: allTenants.length,
        totalExpired,
        totalUsersAffected,
      },
      tenantResults,
    });
  } catch (error) {
    Sentry.captureException(error, {
      tags: { operation: "toil_expiry_cron" },
    });

    return NextResponse.json(
      {
        error: "Failed to expire TOIL",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

// Disable static optimization for cron routes
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
