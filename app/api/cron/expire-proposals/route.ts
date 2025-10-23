import * as Sentry from "@sentry/nextjs";
import { type NextRequest, NextResponse } from "next/server";
import { expireProposals } from "@/lib/cron/expire-proposals";

export const runtime = "nodejs";

/**
 * Proposal Expiration Cron Job API Endpoint
 *
 * Purpose:
 * Automatically expire proposals when their validUntil date has passed.
 * This endpoint is designed to be called by external cron services (Upstash, Vercel Cron, etc.)
 *
 * Security:
 * - Protected by CRON_SECRET environment variable
 * - Only accepts requests with valid Authorization: Bearer {CRON_SECRET} header
 *
 * Schedule Recommendation:
 * Daily at 2:00 AM UTC (adjustable based on business needs)
 *
 * Setup Options:
 *
 * Option A: Upstash Cron (Recommended)
 * @example
 * ```
 * URL: https://yourdomain.com/api/cron/expire-proposals
 * Method: POST
 * Schedule: 0 2 * * * (Daily at 2 AM UTC)
 * Headers:
 *   Authorization: Bearer ${CRON_SECRET}
 * ```
 *
 * Option B: Vercel Cron
 * @example
 * ```json
 * // vercel.json
 * {
 *   "crons": [{
 *     "path": "/api/cron/expire-proposals",
 *     "schedule": "0 2 * * *"
 *   }]
 * }
 * ```
 *
 * Option C: System Cron
 * @example
 * ```bash
 * # Add to crontab: crontab -e
 * 0 2 * * * curl -X POST https://yourdomain.com/api/cron/expire-proposals \
 *   -H "Authorization: Bearer your-cron-secret" \
 *   >> /var/log/expire-proposals-cron.log 2>&1
 * ```
 *
 * Response Format:
 * @example
 * ```json
 * {
 *   "success": true,
 *   "expiredCount": 5,
 *   "processedCount": 5,
 *   "errors": [],
 *   "timestamp": "2025-01-20T02:00:00.000Z"
 * }
 * ```
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Verify authorization
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      Sentry.captureMessage("Unauthorized cron job access attempt", {
        level: "warning",
        tags: {
          operation: "cron_expire_proposals_api",
          error_type: "unauthorized",
        },
        extra: {
          authHeader: authHeader ? "present" : "missing",
          endpoint: "/api/cron/expire-proposals",
        },
      });

      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Execute proposal expiration
    const result = await expireProposals();

    // 3. Return success response
    return NextResponse.json({
      success: true,
      ...result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    // 4. Handle fatal errors
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    Sentry.captureException(error, {
      tags: {
        operation: "cron_expire_proposals_api",
        error_type: "job_fatal_error",
      },
      extra: {
        endpoint: "/api/cron/expire-proposals",
        timestamp: new Date().toISOString(),
      },
    });

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    );
  }
}

/**
 * GET endpoint for manual testing in development
 *
 * Only available in development mode for testing purposes.
 * In production, this returns 405 Method Not Allowed.
 *
 * Usage (development):
 * @example
 * ```bash
 * curl http://localhost:3000/api/cron/expire-proposals
 * ```
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
