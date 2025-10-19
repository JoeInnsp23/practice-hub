/**
 * Xero API Client
 *
 * Handles OAuth 2.0 authentication and API calls to Xero
 *
 * Setup Instructions:
 * 1. Create a Xero app at https://developer.xero.com/app/manage
 * 2. Add redirect URI: {APP_URL}/api/xero/callback
 * 3. Add environment variables:
 *    - XERO_CLIENT_ID=your_client_id
 *    - XERO_CLIENT_SECRET=your_client_secret
 *    - XERO_REDIRECT_URI=http://localhost:3000/api/xero/callback (or your domain)
 */

import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { xeroConnections } from "@/lib/db/schema";

// Xero OAuth configuration
const XERO_AUTH_URL = "https://login.xero.com/identity/connect/authorize";
const XERO_TOKEN_URL = "https://identity.xero.com/connect/token";
const XERO_API_URL = "https://api.xero.com/api.xro/2.0";

const CLIENT_ID = process.env.XERO_CLIENT_ID || "";
const CLIENT_SECRET = process.env.XERO_CLIENT_SECRET || "";
const REDIRECT_URI =
  process.env.XERO_REDIRECT_URI ||
  `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/xero/callback`;

// Scopes required for transaction data
const SCOPES = [
  "accounting.transactions.read",
  "accounting.contacts.read",
  "accounting.settings.read",
  "offline_access", // For refresh tokens
].join(" ");

export interface XeroTokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
}

export interface XeroConnection {
  tenantId: string;
  tenantName: string;
  organisationId: string;
}

export interface BankTransaction {
  date: string;
  description: string;
  reference: string;
  total: number;
  type: "SPEND" | "RECEIVE";
}

interface XeroBankTransactionRaw {
  Date: string;
  Reference?: string;
  Total?: number;
  Type: "SPEND" | "RECEIVE";
}

/**
 * Generate OAuth authorization URL
 */
export function getAuthorizationUrl(state: string): string {
  if (!CLIENT_ID) {
    throw new Error("XERO_CLIENT_ID environment variable not set");
  }

  const params = new URLSearchParams({
    response_type: "code",
    client_id: CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    scope: SCOPES,
    state, // Use this to store clientId + tenantId
  });

  return `${XERO_AUTH_URL}?${params.toString()}`;
}

/**
 * Exchange authorization code for access token
 */
export async function getAccessToken(code: string): Promise<XeroTokenResponse> {
  if (!CLIENT_ID || !CLIENT_SECRET) {
    throw new Error("Xero credentials not configured");
  }

  const auth = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString("base64");

  const response = await fetch(XERO_TOKEN_URL, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: REDIRECT_URI,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Xero token exchange failed: ${error}`);
  }

  return response.json();
}

/**
 * Refresh access token using refresh token
 */
export async function refreshAccessToken(
  refreshToken: string,
): Promise<XeroTokenResponse> {
  if (!CLIENT_ID || !CLIENT_SECRET) {
    throw new Error("Xero credentials not configured");
  }

  const auth = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString("base64");

  const response = await fetch(XERO_TOKEN_URL, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Xero token refresh failed: ${error}`);
  }

  return response.json();
}

/**
 * Get connected Xero organizations (tenants)
 */
export async function getConnections(
  accessToken: string,
): Promise<XeroConnection[]> {
  const response = await fetch("https://api.xero.com/connections", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch Xero connections");
  }

  return response.json();
}

/**
 * Get or refresh access token for a client
 */
export async function getValidAccessToken(
  clientId: string,
): Promise<{ accessToken: string; xeroTenantId: string }> {
  const [connection] = await db
    .select()
    .from(xeroConnections)
    .where(eq(xeroConnections.clientId, clientId))
    .limit(1);

  if (!connection) {
    throw new Error("No Xero connection found for this client");
  }

  // Check if token is expired (with 5-minute buffer)
  const now = new Date();
  const expiresAt = new Date(connection.expiresAt);
  const bufferTime = 5 * 60 * 1000; // 5 minutes

  if (now.getTime() >= expiresAt.getTime() - bufferTime) {
    // Token expired or about to expire - refresh it
    const tokenResponse = await refreshAccessToken(connection.refreshToken);

    const newExpiresAt = new Date(Date.now() + tokenResponse.expires_in * 1000);

    await db
      .update(xeroConnections)
      .set({
        accessToken: tokenResponse.access_token,
        refreshToken: tokenResponse.refresh_token,
        expiresAt: newExpiresAt,
        updatedAt: new Date(),
      })
      .where(eq(xeroConnections.id, connection.id));

    return {
      accessToken: tokenResponse.access_token,
      xeroTenantId: connection.xeroTenantId,
    };
  }

  return {
    accessToken: connection.accessToken,
    xeroTenantId: connection.xeroTenantId,
  };
}

/**
 * Fetch bank transactions from Xero
 */
export async function fetchBankTransactions(
  accessToken: string,
  xeroTenantId: string,
  fromDate: Date,
  toDate: Date,
): Promise<BankTransaction[]> {
  const params = new URLSearchParams({
    where: `Date >= DateTime(${fromDate.getFullYear()}, ${fromDate.getMonth() + 1}, ${fromDate.getDate()}) AND Date <= DateTime(${toDate.getFullYear()}, ${toDate.getMonth() + 1}, ${toDate.getDate()})`,
  });

  const response = await fetch(
    `${XERO_API_URL}/BankTransactions?${params.toString()}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "xero-tenant-id": xeroTenantId,
        Accept: "application/json",
      },
    },
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to fetch Xero bank transactions: ${error}`);
  }

  const data = await response.json();

  return (data.BankTransactions || []).map((tx: XeroBankTransactionRaw) => ({
    date: tx.Date,
    description: tx.Reference || "",
    reference: tx.Reference || "",
    total: tx.Total || 0,
    type: tx.Type,
  }));
}

/**
 * Calculate average monthly transactions from bank data
 */
export function calculateMonthlyTransactions(
  transactions: BankTransaction[],
): number {
  if (transactions.length === 0) return 0;

  // Group by month
  const monthlyData: Record<string, number> = {};

  for (const tx of transactions) {
    const date = new Date(tx.date);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

    if (!monthlyData[monthKey]) {
      monthlyData[monthKey] = 0;
    }
    monthlyData[monthKey]++;
  }

  // Calculate average
  const months = Object.keys(monthlyData).length;
  const totalTransactions = Object.values(monthlyData).reduce(
    (sum, count) => sum + count,
    0,
  );

  return Math.round(totalTransactions / months);
}
