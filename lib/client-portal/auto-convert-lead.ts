import { and, eq } from "drizzle-orm";
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
    console.log("Lead not found for auto-conversion:", leadId);
    return null;
  }

  // Check if already converted
  if (lead.convertedToClientId) {
    console.log("Lead already converted, skipping:", leadId);
    return null;
  }

  console.log("Auto-converting lead to client:", lead.email);

  // Auto-generate client code from company name or lead name
  const clientCode = generateClientCode(
    lead.companyName || `${lead.firstName} ${lead.lastName}`,
  );

  // Determine client type based on lead data
  const clientType = determineClientType(lead.companyName);

  // Start transaction for lead-to-client conversion
  const result = await db.transaction(async (tx) => {
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
    const targetCompletion = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000); // 14 days

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
        title: "Complete AML Questionnaire",
        description:
          "Complete the client information and compliance questionnaire",
        category: "compliance",
        sortOrder: 1,
        isRequired: true,
        estimatedDuration: 15,
      },
      {
        title: "Upload ID Documents",
        description: "Upload proof of identity and address documents",
        category: "compliance",
        sortOrder: 2,
        isRequired: true,
        estimatedDuration: 10,
      },
      {
        title: "Review & Sign Engagement Letter",
        description: "Review and electronically sign the engagement letter",
        category: "legal",
        sortOrder: 3,
        isRequired: true,
        estimatedDuration: 10,
      },
      {
        title: "Provide Bank Details",
        description: "Securely provide bank account details for payments",
        category: "finance",
        sortOrder: 4,
        isRequired: true,
        estimatedDuration: 5,
      },
      {
        title: "Grant Accounting Software Access",
        description:
          "Provide access to your accounting software (Xero/QuickBooks)",
        category: "technical",
        sortOrder: 5,
        isRequired: false,
        estimatedDuration: 15,
      },
    ];

    for (const task of tasks) {
      await tx.insert(onboardingTasks).values({
        tenantId,
        sessionId: onboardingSession.id,
        clientId: newClient.id,
        ...task,
        status: "not_started",
      });
    }

    return {
      clientId: newClient.id,
      onboardingSessionId: onboardingSession.id,
    };
  });

  console.log("Lead converted to client successfully:", result.clientId);

  // Get or create portal user (outside transaction)
  const portalUserResult = await getOrCreatePortalUser(
    lead.email,
    lead.firstName,
    lead.lastName,
    tenantId,
  );

  console.log(
    portalUserResult.isNewUser
      ? "New portal user created"
      : "Using existing portal user",
    portalUserResult.portalUserId,
  );

  // Grant client access to portal user
  await grantClientAccess(
    portalUserResult.portalUserId,
    result.clientId,
    "admin", // Primary contact gets admin access
    null, // System-granted
    tenantId,
  );

  console.log("Client access granted to portal user");

  // Send portal invitation email
  try {
    await sendPortalInvitation(
      portalUserResult.portalUserId,
      result.clientId,
      portalUserResult.isNewUser,
      { firstName: "Practice", lastName: "Hub" }, // System sender
      "Welcome! Your proposal has been accepted. Please complete your client onboarding to get started.",
    );
    console.log("Portal invitation email sent");
  } catch (emailError) {
    console.error("Failed to send portal invitation email:", emailError);
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
 */
function generateClientCode(name: string): string {
  // Remove special characters and spaces
  const cleaned = name.replace(/[^a-zA-Z0-9]/g, "");

  // Take first 6 characters and add random suffix
  const prefix = cleaned.substring(0, 6).toUpperCase();
  const suffix = Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, "0");

  return `${prefix}${suffix}`;
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
