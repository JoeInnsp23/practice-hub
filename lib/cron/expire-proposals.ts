import * as Sentry from "@sentry/nextjs";
import { and, eq, lt, ne } from "drizzle-orm";
import { db } from "@/lib/db";
import { activityLogs, clients, proposals } from "@/lib/db/schema";
import { sendProposalExpiredTeamEmail } from "@/lib/email/send-proposal-email";

/**
 * Proposal Expiration Cron Job - Core Logic
 *
 * Purpose:
 * Automatically expire proposals when their validUntil date has passed.
 *
 * What It Does:
 * 1. Finds proposals where validUntil < now() AND status != 'expired'
 * 2. Updates each proposal status to 'expired'
 * 3. Creates activity log entry for audit trail
 * 4. Sends team notification email
 *
 * Idempotency:
 * - Safe to run multiple times
 * - Only processes proposals not already expired
 * - Activity logs won't duplicate (new entry per run)
 *
 * Error Handling:
 * - Failures for individual proposals don't stop the batch
 * - All errors captured in Sentry with context
 * - Returns summary of successes and failures
 */

export interface ExpireProposalsResult {
  success: boolean;
  expiredCount: number;
  processedCount: number;
  errors: string[];
}

/**
 * Find and expire proposals past their validity date
 */
export async function expireProposals(): Promise<ExpireProposalsResult> {
  try {
    // 1. Query proposals that need to be expired
    // WHERE: validUntil < NOW() AND status != 'expired'
    const now = new Date();

    const expiredProposals = await db
      .select({
        id: proposals.id,
        tenantId: proposals.tenantId,
        proposalNumber: proposals.proposalNumber,
        title: proposals.title,
        status: proposals.status,
        validUntil: proposals.validUntil,
        monthlyTotal: proposals.monthlyTotal,
        annualTotal: proposals.annualTotal,
        clientName: clients.name,
        clientEmail: clients.email,
      })
      .from(proposals)
      .leftJoin(clients, eq(proposals.clientId, clients.id))
      .where(
        and(lt(proposals.validUntil, now), ne(proposals.status, "expired")),
      );

    if (expiredProposals.length === 0) {
      return {
        success: true,
        expiredCount: 0,
        processedCount: 0,
        errors: [],
      };
    }

    // 2. Process each expired proposal
    const errors: string[] = [];
    let expiredCount = 0;

    for (const proposal of expiredProposals) {
      try {
        // 2a. Update proposal status to 'expired'
        await db
          .update(proposals)
          .set({
            status: "expired",
            updatedAt: new Date(),
          })
          .where(eq(proposals.id, proposal.id));

        // 2b. Create activity log entry
        await db.insert(activityLogs).values({
          tenantId: proposal.tenantId,
          module: "proposal-hub",
          entityType: "proposal",
          entityId: proposal.id,
          action: "status_changed",
          description:
            "Proposal automatically expired - signature link validity period ended",
          userId: null, // System action
          userName: "System",
          oldValues: { status: proposal.status },
          newValues: { status: "expired" },
          metadata: {
            automatedAction: true,
            cronJob: "expire-proposals",
            validUntil: proposal.validUntil,
            expiredAt: new Date().toISOString(),
          },
        });

        // 2c. Send team notification email
        try {
          await sendProposalExpiredTeamEmail({
            proposalId: proposal.id,
            expiredAt: new Date(),
          });
        } catch (emailError) {
          // Log email failure but don't fail the expiration
          Sentry.captureException(emailError, {
            tags: {
              operation: "cron_expire_proposals",
              error_type: "email_send_failed",
            },
            extra: {
              proposalId: proposal.id,
              proposalNumber: proposal.proposalNumber,
              clientEmail: proposal.clientEmail,
            },
          });

          errors.push(
            `Email failed for proposal ${proposal.proposalNumber}: ${emailError instanceof Error ? emailError.message : "Unknown error"}`,
          );
        }

        expiredCount++;
      } catch (error) {
        // Log individual proposal failure
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";

        errors.push(
          `Failed to expire proposal ${proposal.proposalNumber}: ${errorMessage}`,
        );

        Sentry.captureException(error, {
          tags: {
            operation: "cron_expire_proposals",
            error_type: "proposal_expiration_failed",
          },
          extra: {
            proposalId: proposal.id,
            proposalNumber: proposal.proposalNumber,
            validUntil: proposal.validUntil,
          },
        });
      }
    }

    return {
      success: true,
      expiredCount,
      processedCount: expiredProposals.length,
      errors,
    };
  } catch (error) {
    // Fatal error - entire job failed
    Sentry.captureException(error, {
      tags: {
        operation: "cron_expire_proposals",
        error_type: "job_fatal_error",
      },
      extra: {
        timestamp: new Date().toISOString(),
      },
    });

    throw error;
  }
}
