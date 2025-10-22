/**
 * Xero Token Refresh Middleware
 *
 * Provides middleware helpers for API routes that interact with Xero
 * - Ensures tokens are valid and refreshed before API calls
 * - Handles auto-refresh with 5-minute buffer
 * - Provides error handling for expired/invalid credentials
 *
 * Usage in API routes:
 * ```typescript
 * import { withXeroCredentials } from "@/lib/xero/middleware";
 *
 * export async function POST(request: NextRequest) {
 *   return withXeroCredentials(tenantId, async (credentials) => {
 *     // Use credentials to make Xero API calls
 *     const result = await xeroClient.createContact(...);
 *     return NextResponse.json(result);
 *   });
 * }
 * ```
 */

import { XeroApiClient } from "./api-client";
import * as Sentry from "@sentry/nextjs";

const xeroClient = new XeroApiClient();

interface XeroCredentials {
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
  selectedTenantId: string;
  tokenType: string;
  scope: string;
}

/**
 * Middleware wrapper for API routes that need Xero credentials
 *
 * Ensures credentials are valid and refreshed before executing callback
 * Auto-refreshes if token expires within 5 minutes
 *
 * @param tenantId - Tenant ID to get credentials for
 * @param callback - Function to execute with valid credentials
 * @returns Result of callback or error response
 */
export async function withXeroCredentials<T>(
  tenantId: string,
  callback: (credentials: XeroCredentials) => Promise<T>,
): Promise<T> {
  try {
    // Get credentials (auto-refreshes if needed)
    const credentials = await xeroClient.getCredentials(tenantId);

    if (!credentials) {
      throw new Error("Xero credentials not found or disabled for this tenant");
    }

    // Execute callback with valid credentials
    return await callback(credentials);
  } catch (error) {
    Sentry.captureException(error, {
      tags: { operation: "withXeroCredentials", middleware: "xero" },
      extra: { tenantId },
    });

    console.error(`[Xero Middleware] Failed for tenant ${tenantId}:`, error);

    throw error;
  }
}

/**
 * Check if Xero integration is enabled for a tenant
 *
 * @param tenantId - Tenant ID to check
 * @returns true if enabled, false otherwise
 */
export async function isXeroEnabled(tenantId: string): Promise<boolean> {
  try {
    const credentials = await xeroClient.getCredentials(tenantId);
    return credentials !== null;
  } catch (error) {
    console.error(`[Xero Middleware] Failed to check if enabled for tenant ${tenantId}:`, error);
    return false;
  }
}

/**
 * Ensure Xero credentials are valid before proceeding
 *
 * Throws error if credentials are not found or disabled
 * Use this for validation before executing Xero operations
 *
 * @param tenantId - Tenant ID to validate
 */
export async function ensureXeroCredentials(tenantId: string): Promise<XeroCredentials> {
  const credentials = await xeroClient.getCredentials(tenantId);

  if (!credentials) {
    throw new Error("Xero integration not enabled for this tenant");
  }

  return credentials;
}

/**
 * Get Xero tenant ID (organisation ID) for a tenant
 *
 * @param tenantId - Practice Hub tenant ID
 * @returns Xero tenant ID or null if not found
 */
export async function getXeroTenantId(tenantId: string): Promise<string | null> {
  try {
    const credentials = await xeroClient.getCredentials(tenantId);
    return credentials?.selectedTenantId || null;
  } catch (error) {
    console.error(`[Xero Middleware] Failed to get Xero tenant ID for tenant ${tenantId}:`, error);
    return null;
  }
}
