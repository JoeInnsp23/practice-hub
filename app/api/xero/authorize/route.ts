import { type NextRequest, NextResponse } from "next/server";
import { getAuthContext } from "@/lib/auth";
import { getAuthorizationUrl } from "@/lib/xero/client";

/**
 * Xero OAuth Authorization Endpoint
 *
 * Initiates OAuth flow by redirecting to Xero login
 *
 * Query params:
 * - clientId: The client ID to connect to Xero
 *
 * Example: /api/xero/authorize?clientId=abc-123
 */
export async function GET(request: NextRequest) {
  try {
    const authContext = await getAuthContext();

    if (!authContext) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get("clientId");

    if (!clientId) {
      return NextResponse.json(
        { error: "clientId parameter required" },
        { status: 400 },
      );
    }

    // Encode state with clientId and tenantId for callback
    const state = Buffer.from(
      JSON.stringify({
        clientId,
        tenantId: authContext.tenantId,
        userId: authContext.userId,
      }),
    ).toString("base64");

    const authUrl = getAuthorizationUrl(state);

    // Redirect to Xero authorization page
    return NextResponse.redirect(authUrl);
  } catch (error) {
    console.error("Xero authorization error:", error);
    return NextResponse.json(
      { error: "Failed to initiate Xero authorization" },
      { status: 500 },
    );
  }
}
