import * as Sentry from "@sentry/nextjs";
import { type NextRequest, NextResponse } from "next/server";
import { getAuthContext } from "@/lib/auth";
import { getAuthorizationUrl } from "@/lib/xero/client";

/**
 * Xero OAuth Authorization Endpoint
 *
 * Initiates OAuth flow by redirecting to Xero login
 * - Tenant-level integration (one Xero connection per accountancy firm)
 * - Stores credentials in integrationSettings table (encrypted)
 *
 * Example: /api/xero/authorize
 */
export async function GET(_request: NextRequest) {
  try {
    const authContext = await getAuthContext();

    if (!authContext) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Encode state with tenantId and userId for callback
    const state = Buffer.from(
      JSON.stringify({
        tenantId: authContext.tenantId,
        userId: authContext.userId,
      }),
    ).toString("base64");

    const authUrl = getAuthorizationUrl(state);

    console.log(
      `[Xero OAuth] Initiating authorization for tenant ${authContext.tenantId}, user ${authContext.userId}`,
    );

    // Redirect to Xero authorization page
    return NextResponse.redirect(authUrl);
  } catch (error) {
    Sentry.captureException(error, {
      tags: { operation: "xeroAuthorize" },
    });

    console.error("[Xero OAuth] Authorization error:", error);

    return NextResponse.json(
      { error: "Failed to initiate Xero authorization" },
      { status: 500 },
    );
  }
}
