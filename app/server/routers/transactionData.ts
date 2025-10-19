import { TRPCError } from "@trpc/server";
import { and, desc, eq } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { db } from "@/lib/db";
import { activityLogs, clients, clientTransactionData } from "@/lib/db/schema";
import { protectedProcedure, router } from "../trpc";

// Generate schema from Drizzle table definition
const insertTransactionDataSchema = createInsertSchema(clientTransactionData);

// Schema for create/update operations
const transactionDataSchema = insertTransactionDataSchema.omit({
  id: true,
  tenantId: true,
  createdAt: true,
  lastUpdated: true,
});

// Helper function to estimate transactions
function estimateMonthlyTransactions(
  turnover: string,
  industry: string,
  vatRegistered: boolean,
): number {
  const baseEstimates: Record<string, number> = {
    "0-89k": 35,
    "90k-149k": 55,
    "150k-249k": 80,
    "250k-499k": 120,
    "500k-749k": 180,
    "750k-999k": 250,
    "1m+": 350,
  };

  let estimate = baseEstimates[turnover] || 100;

  // Industry adjustments
  const industryMultipliers: Record<string, number> = {
    simple: 0.7,
    standard: 1.0,
    complex: 1.4,
    regulated: 1.2,
  };

  estimate *= industryMultipliers[industry] || 1.0;

  // VAT registration typically means more transactions
  if (vatRegistered) {
    estimate *= 1.2;
  }

  return Math.round(estimate);
}

export const transactionDataRouter = router({
  // Get transaction data for a client
  getByClient: protectedProcedure
    .input(z.string())
    .query(async ({ ctx, input: clientId }) => {
      const { tenantId } = ctx.authContext;

      // Get latest transaction data
      const transactionData = await db
        .select()
        .from(clientTransactionData)
        .where(
          and(
            eq(clientTransactionData.clientId, clientId),
            eq(clientTransactionData.tenantId, tenantId),
          ),
        )
        .orderBy(desc(clientTransactionData.lastUpdated))
        .limit(1);

      return { transactionData: transactionData[0] || null };
    }),

  // Get transaction data history for a client
  getHistory: protectedProcedure
    .input(z.string())
    .query(async ({ ctx, input: clientId }) => {
      const { tenantId } = ctx.authContext;

      const history = await db
        .select()
        .from(clientTransactionData)
        .where(
          and(
            eq(clientTransactionData.clientId, clientId),
            eq(clientTransactionData.tenantId, tenantId),
          ),
        )
        .orderBy(desc(clientTransactionData.lastUpdated));

      return { history };
    }),

  // Create or update transaction data
  upsert: protectedProcedure
    .input(transactionDataSchema)
    .mutation(async ({ ctx, input }) => {
      const { tenantId, userId, firstName, lastName } = ctx.authContext;

      // Check if client exists
      if (!input.clientId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Client ID is required",
        });
      }

      const [client] = await db
        .select()
        .from(clients)
        .where(
          and(eq(clients.id, input.clientId), eq(clients.tenantId, tenantId)),
        )
        .limit(1);

      if (!client) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Client not found",
        });
      }

      // Check if transaction data exists for this client and date
      const [existing] = await db
        .select()
        .from(clientTransactionData)
        .where(
          and(
            eq(clientTransactionData.clientId, input.clientId),
            eq(clientTransactionData.tenantId, tenantId),
          ),
        )
        .limit(1);

      let result: typeof clientTransactionData.$inferSelect;

      if (existing) {
        // Update existing record
        [result] = await db
          .update(clientTransactionData)
          .set({
            ...input,
            lastUpdated: new Date(),
          })
          .where(eq(clientTransactionData.id, existing.id))
          .returning();

        // Log activity
        await db.insert(activityLogs).values({
          tenantId,
          entityType: "transaction_data",
          entityId: result.id,
          action: "updated",
          description: `Updated transaction data for ${client.name}`,
          userId,
          userName: `${firstName} ${lastName}`,
          oldValues: existing,
          newValues: input,
        });
      } else {
        // Create new record
        [result] = await db
          .insert(clientTransactionData)
          .values({
            tenantId,
            ...input,
          })
          .returning();

        // Log activity
        await db.insert(activityLogs).values({
          tenantId,
          entityType: "transaction_data",
          entityId: result.id,
          action: "created",
          description: `Added transaction data for ${client.name}`,
          userId,
          userName: `${firstName} ${lastName}`,
          newValues: input,
        });
      }

      return { success: true, transactionData: result };
    }),

  // Fetch from Xero (placeholder for future Xero integration)
  fetchFromXero: protectedProcedure
    .input(z.string())
    .mutation(async ({ ctx, input: clientId }) => {
      const { tenantId } = ctx.authContext;

      // Check if client exists
      const [client] = await db
        .select()
        .from(clients)
        .where(and(eq(clients.id, clientId), eq(clients.tenantId, tenantId)))
        .limit(1);

      if (!client) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Client not found",
        });
      }

      // Import Xero client functions
      const {
        getValidAccessToken,
        fetchBankTransactions,
        calculateMonthlyTransactions,
      } = await import("@/lib/xero/client");

      try {
        // Get valid access token (will refresh if needed)
        const { accessToken, xeroTenantId } =
          await getValidAccessToken(clientId);

        // Fetch transactions from last 6 months
        const toDate = new Date();
        const fromDate = new Date();
        fromDate.setMonth(fromDate.getMonth() - 6);

        const transactions = await fetchBankTransactions(
          accessToken,
          xeroTenantId,
          fromDate,
          toDate,
        );

        // Calculate average monthly transactions
        const monthlyTransactions = calculateMonthlyTransactions(transactions);

        // Store in database
        const [result] = await db
          .insert(clientTransactionData)
          .values({
            tenantId,
            clientId,
            monthlyTransactions,
            dataSource: "xero",
            xeroDataJson: {
              transactionCount: transactions.length,
              dateRange: {
                from: fromDate.toISOString().split("T")[0],
                to: toDate.toISOString().split("T")[0],
              },
              fetchedAt: new Date().toISOString(),
            },
          })
          .onConflictDoUpdate({
            target: [clientTransactionData.clientId],
            set: {
              monthlyTransactions,
              dataSource: "xero",
              xeroDataJson: {
                transactionCount: transactions.length,
                dateRange: {
                  from: fromDate.toISOString().split("T")[0],
                  to: toDate.toISOString().split("T")[0],
                },
                fetchedAt: new Date().toISOString(),
              },
              lastUpdated: new Date(),
            },
          })
          .returning();

        // Log activity
        if (ctx.authContext) {
          const { userId, firstName, lastName } = ctx.authContext;
          await db.insert(activityLogs).values({
            tenantId,
            entityType: "client",
            entityId: clientId,
            action: "xero_sync",
            description: `Synced transaction data from Xero for ${client.name}`,
            userId,
            userName: `${firstName} ${lastName}`,
            newValues: { monthlyTransactions, dataSource: "xero" },
          });
        }

        return {
          success: true,
          transactionData: result,
          transactionCount: transactions.length,
          dateRange: {
            from: fromDate.toISOString().split("T")[0],
            to: toDate.toISOString().split("T")[0],
          },
        };
      } catch (error) {
        if (error instanceof Error) {
          if (error.message.includes("No Xero connection")) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message:
                "No Xero connection found. Please connect this client to Xero first.",
            });
          }

          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: `Failed to fetch from Xero: ${error.message}`,
          });
        }

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch data from Xero",
        });
      }
    }),

  // Estimate transactions based on business characteristics
  estimate: protectedProcedure
    .input(
      z.object({
        clientId: z.string(),
        turnover: z.string(),
        industry: z.string(),
        vatRegistered: z.boolean(),
        saveEstimate: z.boolean().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { tenantId, userId, firstName, lastName } = ctx.authContext;

      // Check if client exists
      const [client] = await db
        .select()
        .from(clients)
        .where(
          and(eq(clients.id, input.clientId), eq(clients.tenantId, tenantId)),
        )
        .limit(1);

      if (!client) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Client not found",
        });
      }

      // Calculate estimate
      const estimated = estimateMonthlyTransactions(
        input.turnover,
        input.industry,
        input.vatRegistered,
      );

      // Save estimate if requested
      if (input.saveEstimate) {
        const [savedData] = await db
          .insert(clientTransactionData)
          .values({
            tenantId,
            clientId: input.clientId,
            dataSource: "estimated",
            monthlyTransactions: estimated,
            xeroDataJson: {
              turnover: input.turnover,
              industry: input.industry,
              vatRegistered: input.vatRegistered,
            },
          })
          .returning();

        // Log activity
        await db.insert(activityLogs).values({
          tenantId,
          entityType: "transaction_data",
          entityId: savedData.id,
          action: "created",
          description: `Estimated transaction data for ${client.name}`,
          userId,
          userName: `${firstName} ${lastName}`,
          newValues: {
            monthlyTransactions: estimated,
            dataSource: "estimated",
          },
        });

        return {
          success: true,
          estimated,
          saved: true,
          transactionData: savedData,
        };
      }

      return {
        success: true,
        estimated,
        saved: false,
      };
    }),

  // Delete transaction data
  delete: protectedProcedure
    .input(z.string())
    .mutation(async ({ ctx, input: id }) => {
      const { tenantId, userId, firstName, lastName } = ctx.authContext;

      // Check if transaction data exists
      const [existing] = await db
        .select()
        .from(clientTransactionData)
        .where(
          and(
            eq(clientTransactionData.id, id),
            eq(clientTransactionData.tenantId, tenantId),
          ),
        )
        .limit(1);

      if (!existing) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Transaction data not found",
        });
      }

      // Delete transaction data
      await db
        .delete(clientTransactionData)
        .where(eq(clientTransactionData.id, id));

      // Log activity
      await db.insert(activityLogs).values({
        tenantId,
        entityType: "transaction_data",
        entityId: id,
        action: "deleted",
        description: "Deleted transaction data",
        userId,
        userName: `${firstName} ${lastName}`,
      });

      return { success: true };
    }),

  // Get all clients with their latest transaction data
  getAllWithData: protectedProcedure.query(async ({ ctx }) => {
    const { tenantId } = ctx.authContext;

    // Get all clients
    const clientsList = await db
      .select({
        id: clients.id,
        name: clients.name,
        clientCode: clients.clientCode,
        type: clients.type,
        status: clients.status,
      })
      .from(clients)
      .where(eq(clients.tenantId, tenantId));

    // Get latest transaction data for each client
    const clientsWithData = await Promise.all(
      clientsList.map(async (client) => {
        const [latestData] = await db
          .select()
          .from(clientTransactionData)
          .where(
            and(
              eq(clientTransactionData.clientId, client.id),
              eq(clientTransactionData.tenantId, tenantId),
            ),
          )
          .orderBy(desc(clientTransactionData.lastUpdated))
          .limit(1);

        return {
          ...client,
          transactionData: latestData || null,
        };
      }),
    );

    return { clients: clientsWithData };
  }),
});
