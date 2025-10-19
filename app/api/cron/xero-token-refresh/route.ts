import { sql } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { xeroConnections } from "@/lib/db/schema";
import { refreshAccessToken } from "@/lib/xero/client";

/**
 * Xero Token Refresh Cron Job
 *
 * Xero OAuth 2.0 Token Expiration:
 * - Access tokens: 30 minutes (short-lived, need frequent refresh)
 * - Refresh tokens: 60 days if unused (long-lived, renewed with each refresh)
 *
 * Strategy:
 * This job refreshes access tokens proactively (every 15-20 minutes) to ensure
 * they're always valid when needed. Each refresh also provides a new refresh token
 * that extends the 60-day window, keeping connections alive indefinitely.
 *
 * Security:
 * - Verify CRON_SECRET to prevent unauthorized access
 * - Only callable by authorized cron services
 *
 * Setup:
 * 1. Add CRON_SECRET to environment variables (random UUID or secret key)
 * 2. Set up cron service to call: POST /api/cron/xero-token-refresh
 * 3. Add Authorization: Bearer {CRON_SECRET} header
 *
 * Cron Setup Options:
 *
 * Option A: System Cron (Recommended for Coolify)
 * Add to server crontab:
 * @example
 * ```bash
 * # Refresh Xero access tokens every 20 minutes
 * # Run: crontab -e and add this line:
 *
 * (star)/20 * * * * curl -X POST https://yourdomain.com/api/cron/xero-token-refresh -H "Authorization: Bearer your-cron-secret" >> /var/log/xero-cron.log 2>&1
 *
 * # Replace (star) with the actual asterisk character: *
 * ```
 *
 * Option B: External Cron Services
 * - cron-job.org: https://cron-job.org (Free tier: every 15 minutes)
 * - EasyCron: https://www.easycron.com
 * - Cronly: https://cronly.app
 *
 * Recommended Schedule: Every 15-20 minutes (keeps access tokens fresh)
 * Minimum Required: At least once every 60 days (to prevent refresh token expiration)
 */
export async function POST(request: NextRequest) {
  try {
    // Verify cron secret for security
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Find all active connections that need refresh
    // (expires within next 25 minutes = 25 * 60 * 1000 milliseconds)
    const bufferTime = 25 * 60 * 1000;
    const thresholdTime = new Date(Date.now() + bufferTime);

    const connectionsToRefresh = await db
      .select()
      .from(xeroConnections)
      .where(
        sql`${xeroConnections.isActive} = true AND ${xeroConnections.expiresAt} <= ${thresholdTime}`,
      );

    if (connectionsToRefresh.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No tokens need refreshing",
        refreshed: 0,
      });
    }

    const results = {
      total: connectionsToRefresh.length,
      refreshed: 0,
      failed: 0,
      errors: [] as string[],
    };

    // Refresh each connection
    for (const connection of connectionsToRefresh) {
      try {
        const tokenResponse = await refreshAccessToken(connection.refreshToken);

        const newExpiresAt = new Date(
          Date.now() + tokenResponse.expires_in * 1000,
        );

        await db
          .update(xeroConnections)
          .set({
            accessToken: tokenResponse.access_token,
            refreshToken: tokenResponse.refresh_token,
            expiresAt: newExpiresAt,
            syncStatus: "connected",
            syncError: null,
            lastSyncAt: new Date(),
            updatedAt: new Date(),
          })
          .where(sql`${xeroConnections.id} = ${connection.id}`);

        results.refreshed++;
      } catch (error) {
        results.failed++;

        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";

        results.errors.push(`Client ${connection.clientId}: ${errorMessage}`);

        // Mark connection as errored
        await db
          .update(xeroConnections)
          .set({
            syncStatus: "error",
            syncError: errorMessage,
            updatedAt: new Date(),
          })
          .where(sql`${xeroConnections.id} = ${connection.id}`);

        console.error(
          `Failed to refresh Xero token for client ${connection.clientId}:`,
          error,
        );
      }
    }

    // Log results
    console.log(
      `Xero token refresh completed: ${results.refreshed}/${results.total} succeeded, ${results.failed} failed`,
    );

    return NextResponse.json({
      success: true,
      ...results,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Xero token refresh cron job error:", error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

/**
 * GET endpoint for manual testing (remove in production)
 */
export async function GET(request: NextRequest) {
  // Only allow in development
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json(
      { error: "GET method not allowed in production" },
      { status: 405 },
    );
  }

  // Call the POST handler for testing
  return POST(request);
}
