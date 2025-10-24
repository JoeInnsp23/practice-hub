/**
 * Xero Token Refresh Worker
 *
 * Background job that refreshes Xero OAuth tokens before they expire
 * - Runs periodically (recommended: every 10 days)
 * - Queries all enabled Xero integrations
 * - Refreshes tokens that expire within 10 days
 * - Updates integrationSettings with new credentials
 *
 * Can be triggered via:
 * - Cron job (recommended): Hit /api/cron/xero-token-refresh
 * - Vercel Cron: https://vercel.com/docs/cron-jobs
 * - Manual: Call refreshAllTokens() directly
 */

import * as Sentry from "@sentry/nextjs";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { integrationSettings } from "@/lib/db/schema";
import { decryptObject } from "@/lib/services/encryption";
import { XeroApiClient } from "./api-client";

interface XeroCredentials {
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
  selectedTenantId: string;
  tokenType: string;
  scope: string;
  [key: string]: unknown;
}

const xeroClient = new XeroApiClient();

/**
 * Refresh all Xero tokens that are about to expire
 *
 * @param daysBeforeExpiry - Refresh tokens expiring within this many days (default: 10)
 */
export async function refreshAllTokens(
  daysBeforeExpiry = 10,
): Promise<{ refreshed: number; failed: number; skipped: number }> {
  let refreshed = 0;
  let failed = 0;
  let skipped = 0;

  try {
    console.log(`[Xero Token Refresh] Starting token refresh job...`);

    // Fetch all enabled Xero integrations
    const allIntegrations = await db
      .select()
      .from(integrationSettings)
      .where(eq(integrationSettings.integrationType, "xero"));

    console.log(
      `[Xero Token Refresh] Found ${allIntegrations.length} Xero integrations`,
    );

    if (allIntegrations.length === 0) {
      console.log(`[Xero Token Refresh] No Xero integrations found`);
      return { refreshed, failed, skipped };
    }

    // Calculate expiry threshold
    const expiryThreshold = new Date(
      Date.now() + daysBeforeExpiry * 24 * 60 * 60 * 1000,
    );

    for (const integration of allIntegrations) {
      try {
        // Skip disabled integrations
        if (!integration.enabled) {
          console.log(
            `[Xero Token Refresh] Skipping disabled integration for tenant ${integration.tenantId}`,
          );
          skipped++;
          continue;
        }

        // Skip if no credentials
        if (!integration.credentials) {
          console.log(
            `[Xero Token Refresh] Skipping integration with no credentials for tenant ${integration.tenantId}`,
          );
          skipped++;
          continue;
        }

        // Decrypt credentials
        const credentials = decryptObject<XeroCredentials>(
          integration.credentials,
        );

        // Check if token expires within threshold
        const expiresAt = new Date(credentials.expiresAt);

        if (expiresAt > expiryThreshold) {
          console.log(
            `[Xero Token Refresh] Token for tenant ${integration.tenantId} expires ${expiresAt.toISOString()}, skipping (threshold: ${expiryThreshold.toISOString()})`,
          );
          skipped++;
          continue;
        }

        console.log(
          `[Xero Token Refresh] Refreshing token for tenant ${integration.tenantId} (expires: ${expiresAt.toISOString()})`,
        );

        // Refresh token using XeroApiClient (automatically updates database)
        await xeroClient.getCredentials(integration.tenantId);

        refreshed++;
        console.log(
          `[Xero Token Refresh] Successfully refreshed token for tenant ${integration.tenantId}`,
        );
      } catch (error) {
        failed++;

        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";

        Sentry.captureException(error, {
          tags: {
            operation: "refreshXeroToken",
            worker: "token-refresh-worker",
          },
          extra: {
            tenantId: integration.tenantId,
            integrationId: integration.id,
          },
        });

        console.error(
          `[Xero Token Refresh] Failed to refresh token for tenant ${integration.tenantId}:`,
          errorMessage,
        );
      }
    }

    console.log(
      `[Xero Token Refresh] Job complete: ${refreshed} refreshed, ${failed} failed, ${skipped} skipped`,
    );

    return { refreshed, failed, skipped };
  } catch (error) {
    Sentry.captureException(error, {
      tags: {
        operation: "refreshAllXeroTokens",
        worker: "token-refresh-worker",
      },
    });

    console.error(`[Xero Token Refresh] Worker failed:`, error);

    throw error;
  }
}

/**
 * Refresh a single tenant's Xero token
 *
 * Useful for manual refresh or testing
 */
export async function refreshTenantToken(
  tenantId: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    console.log(`[Xero Token Refresh] Refreshing token for tenant ${tenantId}`);

    // Use XeroApiClient to refresh (automatically updates database)
    const credentials = await xeroClient.getCredentials(tenantId);

    if (!credentials) {
      throw new Error("Xero credentials not found or disabled");
    }

    console.log(
      `[Xero Token Refresh] Successfully refreshed token for tenant ${tenantId}`,
    );

    return { success: true };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    Sentry.captureException(error, {
      tags: { operation: "refreshTenantXeroToken" },
      extra: { tenantId },
    });

    console.error(
      `[Xero Token Refresh] Failed to refresh token for tenant ${tenantId}:`,
      error,
    );

    return { success: false, error: errorMessage };
  }
}
