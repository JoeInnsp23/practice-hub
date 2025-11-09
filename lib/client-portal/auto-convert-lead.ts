import * as Sentry from "@sentry/nextjs";
import { and, desc, eq, like } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  activityLogs,
  clients,
  leads,
  onboardingSessions,
  onboardingTasks,
  proposals,
} from "@/lib/db/schema";
import {
  getOrCreatePortalUser,
  grantClientAccess,
  sendPortalInvitation,
} from "./access-manager";

/**
 * Automatically convert a lead to a client when their proposal is signed
 *
 * This is triggered by the DocuSeal webhook when a proposal signature is completed.
 * It handles the complete workflow of:
 * 1. Converting lead to client
 * 2. Creating/updating client portal user
 * 3. Granting portal access
 * 4. Sending portal invitation
 * 5. Creating onboarding session
 */

interface AutoConvertResult {
  clientId: string;
  portalUserId: string;
  isNewPortalUser: boolean;
  onboardingSessionId: string;
}

export async function autoConvertLeadToClient(
  proposalId: string,
  leadId: string,
  tenantId: string,
): Promise<AutoConvertResult | null> {
  // Get lead details
  const [lead] = await db
    .select()
    .from(leads)
    .where(and(eq(leads.id, leadId), eq(leads.tenantId, tenantId)))
    .limit(1);

  if (!lead) {
    Sentry.captureMessage("Lead not found for auto-conversion", {
      level: "warning",
      tags: { operation: "auto_convert_lead" },
      extra: { leadId },
    });
    return null;
  }

  // Check if already converted
  if (lead.convertedToClientId) {
    return null; // Already converted, silently skip
  }

  // Determine client type based on lead data
  const clientType = determineClientType(lead.companyName);

  // Retry logic for client code collision handling
  const maxRetries = 5;
  let retryCount = 0;
  let result: {
    clientId: string;
    onboardingSessionId: string;
  } | null = null;

  while (retryCount < maxRetries && !result) {
    try {
      // Auto-generate client code from company name or lead name
      const clientCode = await generateClientCode(
        lead.companyName || `${lead.firstName} ${lead.lastName}`,
        tenantId,
      );

      // Start transaction for lead-to-client conversion
      result = await db.transaction(async (tx) => {
        // Create client record
        const [newClient] = await tx
          .insert(clients)
          .values({
            tenantId,
            clientCode,
            name: lead.companyName || `${lead.firstName} ${lead.lastName}`,
            type: clientType,
            status: "onboarding", // Will stay in onboarding until AML approved
            email: lead.email,
            phone: lead.phone,
            website: lead.website,
            accountManagerId: lead.assignedToId,
            createdBy: lead.createdBy,
          })
          .returning();

        // Update lead with conversion info
        await tx
          .update(leads)
          .set({
            status: "converted",
            convertedToClientId: newClient.id,
            convertedAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(leads.id, leadId));

        // Update proposal to link to new client
        await tx
          .update(proposals)
          .set({
            clientId: newClient.id,
            updatedAt: new Date(),
          })
          .where(eq(proposals.id, proposalId));

        // Log activity for lead
        await tx.insert(activityLogs).values({
          tenantId,
          module: "client-portal",
          entityType: "lead",
          entityId: leadId,
          action: "converted",
          description: `Lead automatically converted to client after proposal signature`,
          userId: null,
          userName: "System",
          metadata: {
            clientId: newClient.id,
            proposalId,
            autoConversion: true,
          },
        });

        // Log activity for client
        await tx.insert(activityLogs).values({
          tenantId,
          module: "client-portal",
          entityType: "client",
          entityId: newClient.id,
          action: "created",
          description: `Client created from signed proposal (Lead: ${lead.firstName} ${lead.lastName})`,
          userId: null,
          userName: "System",
          metadata: {
            source: "lead_conversion",
            leadId,
            proposalId,
            autoConversion: true,
          },
        });

        // Create onboarding session (status: pending_questionnaire)
        const startDate = new Date();
        const targetCompletion = new Date(
          Date.now() + 14 * 24 * 60 * 60 * 1000,
        ); // 14 days

        const [onboardingSession] = await tx
          .insert(onboardingSessions)
          .values({
            tenantId,
            clientId: newClient.id,
            startDate,
            targetCompletionDate: targetCompletion,
            assignedToId: newClient.accountManagerId,
            priority: "high", // Higher priority for auto-conversions
            status: "pending_questionnaire", // Waiting for client to complete AML questionnaire
            progress: 0,
          })
          .returning();

        // Create standard onboarding tasks (will be accessible after AML approval)
        const tasks = [
          {
            taskName: "Complete AML Questionnaire",
            description:
              "Complete the client information and compliance questionnaire",
            sequence: 1,
            required: true,
            days: 0,
            progressWeight: 10, // High priority
          },
          {
            taskName: "Upload ID Documents",
            description: "Upload proof of identity and address documents",
            sequence: 2,
            required: true,
            days: 1,
            progressWeight: 10, // High priority
          },
          {
            taskName: "Review & Sign Engagement Letter",
            description: "Review and electronically sign the engagement letter",
            sequence: 3,
            required: true,
            days: 2,
            progressWeight: 8,
          },
          {
            taskName: "Provide Bank Details",
            description: "Securely provide bank account details for payments",
            sequence: 4,
            required: true,
            days: 3,
            progressWeight: 6,
          },
          {
            taskName: "Grant Accounting Software Access",
            description:
              "Provide access to your accounting software (Xero/QuickBooks)",
            sequence: 5,
            required: false,
            days: 5,
            progressWeight: 4,
          },
        ];

        for (const task of tasks) {
          await tx.insert(onboardingTasks).values({
            tenantId,
            sessionId: onboardingSession.id,
            ...task,
            done: false,
          });
        }

        return {
          clientId: newClient.id,
          onboardingSessionId: onboardingSession.id,
        };
      });
    } catch (error: unknown) {
      // Handle unique constraint violation (client code collision)
      const dbError = error as { code?: string; constraint?: string };
      if (
        dbError?.code === "23505" &&
        dbError?.constraint?.includes("client_code")
      ) {
        retryCount++;
        Sentry.captureMessage("Client code collision detected, retrying", {
          level: "info",
          tags: { operation: "client_code_generation" },
          extra: { retryCount, maxRetries, leadId },
        });
        if (retryCount >= maxRetries) {
          throw new Error(
            `Failed to generate unique client code after ${maxRetries} attempts`,
          );
        }
        // Continue to next retry iteration
        continue;
      }
      // Re-throw other errors
      throw error;
    }
  }

  if (!result) {
    Sentry.captureException(new Error("Failed to convert lead to client"), {
      tags: { operation: "auto_convert_lead" },
      extra: { leadId },
    });
    throw new Error("Failed to convert lead to client");
  }

  // Get or create portal user (outside transaction)
  const portalUserResult = await getOrCreatePortalUser(
    lead.email,
    lead.firstName,
    lead.lastName,
    tenantId,
  );

  // Grant client access to portal user
  await grantClientAccess(
    portalUserResult.portalUserId,
    result.clientId,
    "admin", // Primary contact gets admin access
    null, // System-granted
    tenantId,
  );

  // Send portal invitation email
  try {
    await sendPortalInvitation(
      portalUserResult.portalUserId,
      result.clientId,
      portalUserResult.isNewUser,
      { firstName: "Practice", lastName: "Hub" }, // System sender
      "Welcome! Your proposal has been accepted. Please complete your client onboarding to get started.",
    );
  } catch (emailError) {
    Sentry.captureException(emailError, {
      level: "warning",
      tags: { operation: "send_portal_invitation" },
      extra: {
        portalUserId: portalUserResult.portalUserId,
        clientId: result.clientId,
      },
    });
    // Don't throw - email failure shouldn't break the conversion
  }

  return {
    ...result,
    portalUserId: portalUserResult.portalUserId,
    isNewPortalUser: portalUserResult.isNewUser,
  };
}

/**
 * Generate a unique client code from company/person name
 * Uses sequential suffix based on existing client codes in the tenant
 */
async function generateClientCode(
  name: string,
  tenantId: string,
): Promise<string> {
  // Remove special characters and spaces
  const cleaned = name.replace(/[^a-zA-Z0-9]/g, "");

  // Take first 6 characters as prefix
  const prefix = cleaned.substring(0, 6).toUpperCase() || "CLIENT";

  // Query for the maximum existing client code with this prefix
  const maxCode = await db
    .select({ clientCode: clients.clientCode })
    .from(clients)
    .where(
      and(
        eq(clients.tenantId, tenantId),
        like(clients.clientCode, `${prefix}-%`),
      ),
    )
    .orderBy(desc(clients.clientCode))
    .limit(1);

  let suffix = 1;
  if (maxCode.length > 0 && maxCode[0].clientCode) {
    // Parse existing suffix and increment
    const parts = maxCode[0].clientCode.split("-");
    if (parts.length === 2) {
      const existingSuffix = Number.parseInt(parts[1] || "0", 10);
      suffix = existingSuffix + 1;
    }
  }

  return `${prefix}-${suffix.toString().padStart(3, "0")}`;
}

/**
 * Determine client type from company name
 */
function determineClientType(
  companyName: string | null,
):
  | "individual"
  | "company"
  | "limited_company"
  | "sole_trader"
  | "partnership"
  | "other" {
  if (!companyName) {
    return "individual";
  }

  const lowerName = companyName.toLowerCase();

  if (lowerName.includes("limited") || lowerName.includes("ltd")) {
    return "limited_company";
  }
  if (lowerName.includes("partnership") || lowerName.includes("llp")) {
    return "partnership";
  }
  if (lowerName.includes("sole trader")) {
    return "sole_trader";
  }

  return "company";
}
