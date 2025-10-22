/**
 * Integration Settings tRPC Router
 *
 * Handles integration configuration, OAuth flows, and connection testing
 */

import { z } from "zod";
import { router, protectedProcedure } from "../trpc";
import { db } from "@/lib/db";
import { integrationSettings } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { getAuthorizationUrl } from "@/lib/xero/client";
import { XeroApiClient } from "@/lib/xero/api-client";
import * as Sentry from "@sentry/nextjs";

const xeroClient = new XeroApiClient();

export const integrationsRouter = router({
  /**
   * Get all integration settings for the current tenant
   */
  list: protectedProcedure.query(async ({ ctx }) => {
    const settings = await db
      .select()
      .from(integrationSettings)
      .where(eq(integrationSettings.tenantId, ctx.authContext.tenantId));

    // Return settings without exposing encrypted credentials
    return settings.map((setting) => ({
      id: setting.id,
      integrationType: setting.integrationType,
      enabled: setting.enabled,
      syncStatus: setting.syncStatus,
      syncError: setting.syncError,
      lastSyncedAt: setting.lastSyncedAt,
      metadata: setting.metadata,
      createdAt: setting.createdAt,
      updatedAt: setting.updatedAt,
    }));
  }),

  /**
   * Get OAuth authorization URL for Xero
   */
  getXeroAuthUrl: protectedProcedure.query(({ ctx }) => {
    // Create state with tenantId and userId for callback
    const state = Buffer.from(
      JSON.stringify({
        tenantId: ctx.authContext.tenantId,
        userId: ctx.authContext.userId,
      }),
    ).toString("base64");

    return {
      url: getAuthorizationUrl(state),
    };
  }),

  /**
   * Test connection for an integration
   */
  testConnection: protectedProcedure
    .input(
      z.object({
        integrationType: z.enum(["xero"]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      try {
        if (input.integrationType === "xero") {
          // Get credentials and test connection
          const credentials = await xeroClient.getCredentials(ctx.authContext.tenantId);

          if (!credentials) {
            return {
              success: false,
              message: "No credentials found. Please connect Xero first.",
            };
          }

          // Test by making a simple API call
          const response = await fetch("https://api.xero.com/connections", {
            headers: {
              Authorization: `Bearer ${credentials.accessToken}`,
              "Content-Type": "application/json",
            },
          });

          if (response.ok) {
            return {
              success: true,
              message: "Connection successful",
            };
          }

          return {
            success: false,
            message: "Connection failed. Please reconnect.",
          };
        }

        return {
          success: false,
          message: "Integration type not supported",
        };
      } catch (error) {
        Sentry.captureException(error, {
          tags: { operation: "testConnection" },
          extra: { integrationType: input.integrationType },
        });

        return {
          success: false,
          message: error instanceof Error ? error.message : "Connection test failed",
        };
      }
    }),

  /**
   * Disconnect an integration
   */
  disconnect: protectedProcedure
    .input(
      z.object({
        integrationType: z.enum(["xero"]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      try {
        // Find the integration setting
        const [setting] = await db
          .select()
          .from(integrationSettings)
          .where(
            and(
              eq(integrationSettings.tenantId, ctx.authContext.tenantId),
              eq(integrationSettings.integrationType, input.integrationType),
            ),
          )
          .limit(1);

        if (!setting) {
          throw new Error("Integration not found");
        }

        // Update to disabled and clear credentials
        await db
          .update(integrationSettings)
          .set({
            enabled: false,
            credentials: null,
            syncStatus: "disconnected",
            syncError: null,
            updatedAt: new Date(),
          })
          .where(eq(integrationSettings.id, setting.id));

        return {
          success: true,
          message: "Integration disconnected successfully",
        };
      } catch (error) {
        Sentry.captureException(error, {
          tags: { operation: "disconnectIntegration" },
          extra: { integrationType: input.integrationType },
        });

        throw new Error("Failed to disconnect integration");
      }
    }),

  /**
   * Update integration configuration
   */
  updateConfig: protectedProcedure
    .input(
      z.object({
        integrationType: z.enum(["xero"]),
        config: z.record(z.any()),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      try {
        // Find the integration setting
        const [setting] = await db
          .select()
          .from(integrationSettings)
          .where(
            and(
              eq(integrationSettings.tenantId, ctx.authContext.tenantId),
              eq(integrationSettings.integrationType, input.integrationType),
            ),
          )
          .limit(1);

        if (!setting) {
          throw new Error("Integration not found");
        }

        // Update configuration
        await db
          .update(integrationSettings)
          .set({
            config: input.config,
            updatedAt: new Date(),
          })
          .where(eq(integrationSettings.id, setting.id));

        return {
          success: true,
          message: "Configuration updated successfully",
        };
      } catch (error) {
        Sentry.captureException(error, {
          tags: { operation: "updateIntegrationConfig" },
          extra: { integrationType: input.integrationType },
        });

        throw new Error("Failed to update configuration");
      }
    }),
});
