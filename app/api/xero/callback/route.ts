import { eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { xeroConnections } from "@/lib/db/schema";
import { getAccessToken, getConnections } from "@/lib/xero/client";

/**
 * Xero OAuth Callback Endpoint
 *
 * Handles the OAuth callback from Xero after user authorization
 * Exchanges authorization code for access token and stores credentials
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const error = searchParams.get("error");

    // Handle OAuth errors
    if (error) {
      const errorDescription = searchParams.get("error_description");
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/client-hub/clients?xeroError=${encodeURIComponent(errorDescription || error)}`,
      );
    }

    if (!code || !state) {
      return NextResponse.json(
        { error: "Missing code or state parameter" },
        { status: 400 },
      );
    }

    // Decode state to get clientId and tenantId
    const stateData = JSON.parse(Buffer.from(state, "base64").toString());
    const { clientId, tenantId, userId } = stateData;

    // Exchange code for access token
    const tokenResponse = await getAccessToken(code);

    // Get Xero tenant connections
    const connections = await getConnections(tokenResponse.access_token);

    if (connections.length === 0) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/client-hub/clients/${clientId}?xeroError=no_organizations`,
      );
    }

    // Use the first connected organization
    const xeroOrg = connections[0];

    // Calculate token expiry
    const expiresAt = new Date(Date.now() + tokenResponse.expires_in * 1000);

    // Store or update Xero connection
    const existingConnection = await db
      .select()
      .from(xeroConnections)
      .where(eq(xeroConnections.clientId, clientId))
      .limit(1);

    if (existingConnection.length > 0) {
      // Update existing connection
      await db
        .update(xeroConnections)
        .set({
          accessToken: tokenResponse.access_token,
          refreshToken: tokenResponse.refresh_token,
          expiresAt,
          xeroTenantId: xeroOrg.tenantId,
          xeroTenantName: xeroOrg.tenantName,
          xeroOrganisationId: xeroOrg.organisationId,
          isActive: true,
          syncStatus: "connected",
          syncError: null,
          updatedAt: new Date(),
        })
        .where(eq(xeroConnections.id, existingConnection[0].id));
    } else {
      // Create new connection
      await db.insert(xeroConnections).values({
        tenantId,
        clientId,
        accessToken: tokenResponse.access_token,
        refreshToken: tokenResponse.refresh_token,
        expiresAt,
        xeroTenantId: xeroOrg.tenantId,
        xeroTenantName: xeroOrg.tenantName,
        xeroOrganisationId: xeroOrg.organisationId,
        isActive: true,
        syncStatus: "connected",
        connectedBy: userId,
      });
    }

    // Redirect back to client page with success
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/client-hub/clients/${clientId}?xeroConnected=true`,
    );
  } catch (error) {
    console.error("Xero callback error:", error);

    // Try to redirect back with error if we have state
    const { searchParams } = new URL(request.url);
    const state = searchParams.get("state");

    if (state) {
      try {
        const stateData = JSON.parse(Buffer.from(state, "base64").toString());
        const { clientId } = stateData;
        return NextResponse.redirect(
          `${process.env.NEXT_PUBLIC_APP_URL}/client-hub/clients/${clientId}?xeroError=connection_failed`,
        );
      } catch {
        // If state parsing fails, just redirect to clients list
      }
    }

    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/client-hub/clients?xeroError=connection_failed`,
    );
  }
}
