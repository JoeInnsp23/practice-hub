/**
 * Integration tests for Xero API Client
 *
 * These tests connect to a real Xero sandbox account and are MANUAL-ONLY.
 * They are skipped by default and only run when XERO_TEST=true is set.
 *
 * Setup Instructions:
 * 1. Create a Xero sandbox account at https://developer.xero.com
 * 2. Create a test app at https://developer.xero.com/app/manage
 * 3. Set redirect URI to: http://localhost:3000/api/xero/callback
 * 4. Add credentials to .env.local:
 *    - XERO_CLIENT_ID=your_sandbox_client_id
 *    - XERO_CLIENT_SECRET=your_sandbox_secret
 *    - XERO_REDIRECT_URI=http://localhost:3000/api/xero/callback
 * 5. Run with: XERO_TEST=true pnpm test lib/xero/client.integration.test.ts
 *
 * NOTE: These tests are NOT run in CI/CD. They are for manual validation only.
 */

import { describe, expect, it } from "vitest";
import {
  fetchBankTransactions,
  getAccessToken,
  getAuthorizationUrl,
  getConnections,
  refreshAccessToken,
} from "./client";

// Skip all integration tests unless XERO_TEST environment variable is set
describe.skipIf(!process.env.XERO_TEST)(
  "Xero Integration Tests (Manual Only)",
  () => {
    // These tests require real Xero sandbox credentials
    // They are primarily documentation of how to manually test the integration

    describe("OAuth Authorization Flow", () => {
      it("should generate valid authorization URL", () => {
        const state = "test-state-manual";
        const url = getAuthorizationUrl(state);

        expect(url).toContain(
          "https://login.xero.com/identity/connect/authorize",
        );
        expect(url).toContain("client_id=");
        expect(url).toContain(`state=${state}`);

        console.log("Authorization URL generated successfully");
        console.log("Manually test by visiting:", url);
      });

      it.skip("should exchange authorization code for token", async () => {
        // This test must be run manually after completing OAuth flow
        // 1. Visit the authorization URL from the test above
        // 2. Complete authorization in Xero sandbox
        // 3. Copy the 'code' parameter from the callback URL
        // 4. Replace 'YOUR_AUTH_CODE_HERE' below with the actual code
        // 5. Remove .skip and run this test

        const authCode = "YOUR_AUTH_CODE_HERE";

        const tokenResponse = await getAccessToken(authCode);

        expect(tokenResponse.access_token).toBeDefined();
        expect(tokenResponse.refresh_token).toBeDefined();
        expect(tokenResponse.expires_in).toBeGreaterThan(0);

        console.log("Token exchange successful");
        console.log(
          "Access token received (first 20 chars):",
          tokenResponse.access_token.substring(0, 20),
        );
        console.log(
          "Refresh token received (first 20 chars):",
          tokenResponse.refresh_token.substring(0, 20),
        );
        console.log("Expires in:", tokenResponse.expires_in, "seconds");
      });
    });

    describe("Token Refresh", () => {
      it.skip("should refresh access token", async () => {
        // This test must be run manually after obtaining a refresh token
        // 1. Complete the 'exchange authorization code' test above
        // 2. Copy the refresh_token from the response
        // 3. Replace 'YOUR_REFRESH_TOKEN_HERE' below with the actual token
        // 4. Remove .skip and run this test

        const refreshToken = "YOUR_REFRESH_TOKEN_HERE";

        const tokenResponse = await refreshAccessToken(refreshToken);

        expect(tokenResponse.access_token).toBeDefined();
        expect(tokenResponse.refresh_token).toBeDefined();
        expect(tokenResponse.expires_in).toBeGreaterThan(0);

        console.log("Token refresh successful");
        console.log(
          "New access token received (first 20 chars):",
          tokenResponse.access_token.substring(0, 20),
        );
      });
    });

    describe("Xero Connections", () => {
      it.skip("should fetch Xero organization connections", async () => {
        // This test must be run manually after obtaining an access token
        // 1. Complete the 'exchange authorization code' test above
        // 2. Copy the access_token from the response
        // 3. Replace 'YOUR_ACCESS_TOKEN_HERE' below with the actual token
        // 4. Remove .skip and run this test

        const accessToken = "YOUR_ACCESS_TOKEN_HERE";

        const connections = await getConnections(accessToken);

        expect(connections).toBeInstanceOf(Array);
        expect(connections.length).toBeGreaterThan(0);
        expect(connections[0].tenantId).toBeDefined();
        expect(connections[0].tenantName).toBeDefined();

        console.log("Connections fetched successfully");
        console.log("Found", connections.length, "connection(s)");
        console.log("First connection:", connections[0].tenantName);
      });
    });

    describe("Bank Transactions", () => {
      it.skip("should fetch bank transactions from Xero sandbox", async () => {
        // This test must be run manually after obtaining access token and tenant ID
        // 1. Complete the tests above to get access_token and xeroTenantId
        // 2. Replace the placeholders below with actual values
        // 3. Remove .skip and run this test

        const accessToken = "YOUR_ACCESS_TOKEN_HERE";
        const xeroTenantId = "YOUR_XERO_TENANT_ID_HERE";

        // Fetch transactions from the last 30 days
        const fromDate = new Date();
        fromDate.setDate(fromDate.getDate() - 30);
        const toDate = new Date();

        const transactions = await fetchBankTransactions(
          accessToken,
          xeroTenantId,
          fromDate,
          toDate,
        );

        expect(transactions).toBeInstanceOf(Array);
        console.log("Bank transactions fetched successfully");
        console.log(
          "Found",
          transactions.length,
          "transaction(s) in last 30 days",
        );

        if (transactions.length > 0) {
          console.log("Sample transaction:", {
            date: transactions[0].date,
            type: transactions[0].type,
            total: transactions[0].total,
            reference: transactions[0].reference,
          });
        }
      });
    });

    describe("End-to-End Integration Test", () => {
      it.skip("should complete full OAuth flow and fetch data", async () => {
        // This is the complete manual integration test
        // Follow these steps:
        //
        // 1. Generate auth URL and visit it
        const state = `integration-test-${Date.now()}`;
        const authUrl = getAuthorizationUrl(state);
        console.log("\n=== STEP 1: Authorization ===");
        console.log("Visit this URL and authorize:", authUrl);
        console.log(
          "After authorization, you will be redirected to the callback URL.",
        );
        console.log('Copy the "code" parameter from the URL.\n');

        // 2. Exchange code for token (replace with actual code from callback)
        const authCode = "PASTE_AUTH_CODE_HERE";
        console.log("=== STEP 2: Token Exchange ===");
        const tokenResponse = await getAccessToken(authCode);
        console.log("✓ Token exchange successful");
        console.log(
          "Access token (first 20):",
          tokenResponse.access_token.substring(0, 20),
        );
        console.log(
          "Refresh token (first 20):",
          tokenResponse.refresh_token.substring(0, 20),
        );
        console.log("Expires in:", tokenResponse.expires_in, "seconds\n");

        // 3. Get connections
        console.log("=== STEP 3: Fetch Connections ===");
        const connections = await getConnections(tokenResponse.access_token);
        console.log("✓ Connections fetched");
        console.log("Organization:", connections[0].tenantName);
        console.log("Tenant ID:", connections[0].tenantId, "\n");

        // 4. Fetch bank transactions
        console.log("=== STEP 4: Fetch Bank Transactions ===");
        const fromDate = new Date();
        fromDate.setDate(fromDate.getDate() - 30);
        const toDate = new Date();

        const transactions = await fetchBankTransactions(
          tokenResponse.access_token,
          connections[0].tenantId,
          fromDate,
          toDate,
        );
        console.log("✓ Bank transactions fetched");
        console.log("Transaction count (last 30 days):", transactions.length);

        if (transactions.length > 0) {
          console.log("Sample transaction:", {
            date: transactions[0].date,
            type: transactions[0].type,
            total: transactions[0].total,
          });
        }

        console.log("\n=== ALL STEPS COMPLETED SUCCESSFULLY ===\n");

        // Assertions
        expect(tokenResponse.access_token).toBeDefined();
        expect(connections.length).toBeGreaterThan(0);
        expect(transactions).toBeInstanceOf(Array);
      });
    });
  },
);

// If XERO_TEST is not set, show a helpful message
describe("Xero Integration Tests - Setup Instructions", () => {
  it("should show setup instructions when XERO_TEST is not set", () => {
    if (!process.env.XERO_TEST) {
      console.log("\n========================================");
      console.log("Xero Integration Tests are SKIPPED");
      console.log("========================================");
      console.log("To run these tests:");
      console.log(
        "1. Set up Xero sandbox account (https://developer.xero.com)",
      );
      console.log("2. Add credentials to .env.local");
      console.log(
        "3. Run: XERO_TEST=true pnpm test lib/xero/client.integration.test.ts",
      );
      console.log("========================================\n");
    }

    expect(true).toBe(true);
  });
});
