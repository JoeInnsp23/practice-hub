import { eq, and } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { integrationSettings } from "@/lib/db/schema";
import { getAccessToken, getConnections } from "@/lib/xero/client";
import { encryptObject } from "@/lib/services/encryption";
import * as Sentry from "@sentry/nextjs";

/**
 * Xero OAuth Callback Endpoint
 *
 * Handles the OAuth callback from Xero after user authorization
 * - Exchanges authorization code for access token
 * - Stores encrypted credentials in integrationSettings table
 * - Tenant-level integration (one connection per accountancy firm)
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
      console.error(`[Xero OAuth] Authorization error: ${error} - ${errorDescription}`);

      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/admin/settings/integrations?xeroError=${encodeURIComponent(errorDescription || error)}`,
      );
    }

    if (!code || !state) {
      return NextResponse.json({ error: "Missing code or state parameter" }, { status: 400 });
    }

    // Decode state to get tenantId and userId
    const stateData = JSON.parse(Buffer.from(state, "base64").toString());
    const { tenantId, userId } = stateData;

    console.log(`[Xero OAuth] Processing callback for tenant ${tenantId}, user ${userId}`);

    // Exchange code for access token
    const tokenResponse = await getAccessToken(code);

    // Get Xero tenant connections
    const connections = await getConnections(tokenResponse.access_token);

    if (connections.length === 0) {
      console.error("[Xero OAuth] No Xero organizations found");

      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/admin/settings/integrations?xeroError=no_organizations`,
      );
    }

    // Use the first connected organization
    const xeroOrg = connections[0];

    console.log(
      `[Xero OAuth] Connected to Xero org: ${xeroOrg.tenantName} (${xeroOrg.tenantId})`,
    );

    // Calculate token expiry
    const expiresAt = new Date(Date.now() + tokenResponse.expires_in * 1000);

    // Prepare credentials object for encryption
    const credentials = {
      accessToken: tokenResponse.access_token,
      refreshToken: tokenResponse.refresh_token,
      expiresAt: expiresAt.toISOString(),
      selectedTenantId: xeroOrg.tenantId,
      tokenType: tokenResponse.token_type,
      scope: tokenResponse.scope,
    };

    // Encrypt credentials
    const encryptedCredentials = encryptObject(credentials);

    // Prepare metadata
    const metadata = {
      xeroTenantName: xeroOrg.tenantName,
      xeroOrganisationId: xeroOrg.id,
      connectedBy: userId,
      connectedAt: new Date().toISOString(),
    };

    // Check if integration already exists for this tenant
    const existingIntegration = await db
      .select()
      .from(integrationSettings)
      .where(
        and(
          eq(integrationSettings.tenantId, tenantId),
          eq(integrationSettings.integrationType, "xero"),
        ),
      )
      .limit(1);

    if (existingIntegration.length > 0) {
      // Update existing integration
      await db
        .update(integrationSettings)
        .set({
          credentials: encryptedCredentials,
          enabled: true,
          syncStatus: "connected",
          syncError: null,
          lastSyncedAt: new Date(),
          metadata,
          updatedAt: new Date(),
        })
        .where(eq(integrationSettings.id, existingIntegration[0].id));

      console.log(`[Xero OAuth] Updated existing integration for tenant ${tenantId}`);
    } else {
      // Create new integration
      await db.insert(integrationSettings).values({
        tenantId,
        integrationType: "xero",
        credentials: encryptedCredentials,
        enabled: true,
        syncStatus: "connected",
        lastSyncedAt: new Date(),
        metadata,
      });

      console.log(`[Xero OAuth] Created new integration for tenant ${tenantId}`);
    }

    // Redirect to integrations settings page with success
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/admin/settings/integrations?xeroConnected=true`,
    );
  } catch (error) {
    Sentry.captureException(error, {
      tags: { operation: "xeroCallback" },
    });

    console.error("[Xero OAuth] Callback error:", error);

    // Try to redirect back with error if we have state
    const { searchParams } = new URL(request.url);
    const state = searchParams.get("state");

    if (state) {
      try {
        const stateData = JSON.parse(Buffer.from(state, "base64").toString());
        const { tenantId } = stateData;

        // Store error in database if we have tenantId
        if (tenantId) {
          const existingIntegration = await db
            .select()
            .from(integrationSettings)
            .where(
              and(
                eq(integrationSettings.tenantId, tenantId),
                eq(integrationSettings.integrationType, "xero"),
              ),
            )
            .limit(1);

          if (existingIntegration.length > 0) {
            await db
              .update(integrationSettings)
              .set({
                syncStatus: "error",
                syncError: error instanceof Error ? error.message : "Connection failed",
                updatedAt: new Date(),
              })
              .where(eq(integrationSettings.id, existingIntegration[0].id));
          }
        }

        return NextResponse.redirect(
          `${process.env.NEXT_PUBLIC_APP_URL}/admin/settings/integrations?xeroError=connection_failed`,
        );
      } catch {
        // If state parsing fails, just redirect to integrations page
      }
    }

    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/admin/settings/integrations?xeroError=connection_failed`,
    );
  }
}
