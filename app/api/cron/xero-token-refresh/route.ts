/**
 * Xero Token Refresh Cron Route
 *
 * Endpoint to trigger Xero OAuth token refresh worker
 * - Can be called by cron job (Vercel Cron, external cron service)
 * - Refreshes tokens expiring within 10 days
 * - Protected by CRON_SECRET for security
 *
 * Xero OAuth 2.0 Token Expiration:
 * - Access tokens: 30 minutes (auto-refreshed on demand by XeroApiClient)
 * - Refresh tokens: 60 days if unused (this cron keeps them alive)
 *
 * Setup:
 * 1. Set CRON_SECRET environment variable
 * 2. Configure cron job to POST to this endpoint every 7-10 days
 * 3. Pass CRON_SECRET in Authorization header: Bearer YOUR_SECRET
 *
 * Recommended Schedule: Every 7-10 days (keeps refresh tokens alive)
 * Minimum Required: At least once every 60 days
 */

import { NextRequest, NextResponse } from "next/server";
import { refreshAllTokens, refreshTenantToken } from "@/lib/xero/token-refresh-worker";
import * as Sentry from "@sentry/nextjs";

export const runtime = "nodejs";

/**
 * POST endpoint for cron job trigger
 */
export async function POST(request: NextRequest) {
  try {
    // Verify cron secret for security
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      console.error("[Xero Token Refresh Cron] Unauthorized access attempt");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("[Xero Token Refresh Cron] Starting token refresh job...");

    // Parse request body for custom parameters (optional)
    let daysBeforeExpiry = 10;
    let tenantId: string | undefined;

    try {
      const body = await request.json();
      daysBeforeExpiry = body.daysBeforeExpiry || 10;
      tenantId = body.tenantId;
    } catch {
      // Body is optional, use defaults
    }

    // If tenantId provided, refresh only that tenant
    if (tenantId) {
      console.log(`[Xero Token Refresh Cron] Refreshing specific tenant: ${tenantId}`);
      const result = await refreshTenantToken(tenantId);

      return NextResponse.json({
        success: result.success,
        result,
        timestamp: new Date().toISOString(),
      });
    }

    // Otherwise refresh all tokens expiring within threshold
    const result = await refreshAllTokens(daysBeforeExpiry);

    console.log(
      `[Xero Token Refresh Cron] Job complete: ${result.refreshed} refreshed, ${result.failed} failed, ${result.skipped} skipped`,
    );

    return NextResponse.json({
      success: true,
      result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    Sentry.captureException(error, {
      tags: { operation: "xeroTokenRefreshCron" },
    });

    console.error("[Xero Token Refresh Cron] Job failed:", error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    );
  }
}

/**
 * GET endpoint for manual testing
 */
export async function GET(request: NextRequest) {
  try {
    // Allow in development without auth for testing
    if (process.env.NODE_ENV === "development") {
      console.log("[Xero Token Refresh Cron] Manual trigger (dev mode)");
      const result = await refreshAllTokens(10);

      return NextResponse.json({
        success: true,
        result,
        timestamp: new Date().toISOString(),
      });
    }

    // In production, require auth header
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      console.error("[Xero Token Refresh Cron] Unauthorized access attempt");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("[Xero Token Refresh Cron] Manual trigger");
    const result = await refreshAllTokens(10);

    return NextResponse.json({
      success: true,
      result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    Sentry.captureException(error, {
      tags: { operation: "xeroTokenRefreshManual" },
    });

    console.error("[Xero Token Refresh Cron] Manual trigger failed:", error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    );
  }
}
