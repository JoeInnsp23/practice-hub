/**
 * Admin KYC Review Router
 *
 * Handles manual review and approval of KYC verifications
 * that are flagged for manual review (AML alerts, failed checks, etc.)
 */

import { TRPCError } from "@trpc/server";
import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import {
  activityLogs,
  clients,
  kycVerifications,
  onboardingSessions,
  users,
} from "@/lib/db/schema";
import { adminProcedure, router } from "../trpc";

export const adminKycRouter = router({
  /**
   * List all KYC verifications pending manual review
   */
  listPendingReviews: adminProcedure
    .input(
      z.object({
        status: z.enum(["pending", "completed"]).optional(),
        limit: z.number().min(1).max(100).default(50),
        offset: z.number().min(0).default(0),
      }),
    )
    .query(async ({ ctx, input }) => {
      const whereConditions = [
        eq(kycVerifications.tenantId, ctx.authContext.tenantId),
      ];

      // Filter by status if provided
      if (input.status) {
        whereConditions.push(eq(kycVerifications.status, input.status));
      }

      // Get verifications with client and session info
      const verifications = await db
        .select({
          // KYC Verification
          id: kycVerifications.id,
          lemverifyId: kycVerifications.lemverifyId,
          status: kycVerifications.status,
          outcome: kycVerifications.outcome,
          documentType: kycVerifications.documentType,
          documentVerified: kycVerifications.documentVerified,
          facematchResult: kycVerifications.facematchResult,
          facematchScore: kycVerifications.facematchScore,
          livenessResult: kycVerifications.livenessResult,
          livenessScore: kycVerifications.livenessScore,
          amlStatus: kycVerifications.amlStatus,
          pepMatch: kycVerifications.pepMatch,
          sanctionsMatch: kycVerifications.sanctionsMatch,
          watchlistMatch: kycVerifications.watchlistMatch,
          adverseMediaMatch: kycVerifications.adverseMediaMatch,
          approvedBy: kycVerifications.approvedBy,
          approvedAt: kycVerifications.approvedAt,
          rejectionReason: kycVerifications.rejectionReason,
          createdAt: kycVerifications.createdAt,
          completedAt: kycVerifications.completedAt,

          // Client Info
          clientId: clients.id,
          clientName: clients.name,
          clientEmail: clients.email,
          clientCode: clients.clientCode,
          clientStatus: clients.status,

          // Onboarding Session
          sessionId: onboardingSessions.id,
          sessionStatus: onboardingSessions.status,

          // Approver Info (if approved)
          approverName: users.firstName,
        })
        .from(kycVerifications)
        .innerJoin(clients, eq(kycVerifications.clientId, clients.id))
        .leftJoin(
          onboardingSessions,
          eq(kycVerifications.onboardingSessionId, onboardingSessions.id),
        )
        .leftJoin(users, eq(kycVerifications.approvedBy, users.id))
        .where(and(...whereConditions))
        .orderBy(desc(kycVerifications.createdAt))
        .limit(input.limit)
        .offset(input.offset);

      // Get total count for pagination
      const [{ count }] = await db
        .select({ count: kycVerifications.id })
        .from(kycVerifications)
        .where(and(...whereConditions));

      return {
        verifications,
        total: count,
        hasMore: input.offset + input.limit < Number(count),
      };
    }),

  /**
   * Get detailed KYC verification information
   */
  getVerificationDetail: adminProcedure
    .input(z.object({ verificationId: z.string() }))
    .query(async ({ ctx, input }) => {
      const [verification] = await db
        .select({
          // All KYC data
          id: kycVerifications.id,
          tenantId: kycVerifications.tenantId,
          clientId: kycVerifications.clientId,
          onboardingSessionId: kycVerifications.onboardingSessionId,
          lemverifyId: kycVerifications.lemverifyId,
          clientRef: kycVerifications.clientRef,
          status: kycVerifications.status,
          outcome: kycVerifications.outcome,

          // Document verification
          documentType: kycVerifications.documentType,
          documentVerified: kycVerifications.documentVerified,
          documentData: kycVerifications.documentData,

          // Biometrics
          facematchResult: kycVerifications.facematchResult,
          facematchScore: kycVerifications.facematchScore,
          livenessResult: kycVerifications.livenessResult,
          livenessScore: kycVerifications.livenessScore,

          // AML
          amlResult: kycVerifications.amlResult,
          amlStatus: kycVerifications.amlStatus,
          pepMatch: kycVerifications.pepMatch,
          sanctionsMatch: kycVerifications.sanctionsMatch,
          watchlistMatch: kycVerifications.watchlistMatch,
          adverseMediaMatch: kycVerifications.adverseMediaMatch,

          // Documents
          reportUrl: kycVerifications.reportUrl,
          documentsUrl: kycVerifications.documentsUrl,

          // Approval
          approvedBy: kycVerifications.approvedBy,
          approvedAt: kycVerifications.approvedAt,
          rejectionReason: kycVerifications.rejectionReason,

          // Metadata
          metadata: kycVerifications.metadata,
          createdAt: kycVerifications.createdAt,
          completedAt: kycVerifications.completedAt,
          updatedAt: kycVerifications.updatedAt,

          // Client Info
          clientName: clients.name,
          clientEmail: clients.email,
          clientPhone: clients.phone,
          clientCode: clients.clientCode,
          clientStatus: clients.status,

          // Session Info
          sessionStatus: onboardingSessions.status,
          sessionProgress: onboardingSessions.progress,

          // Approver
          approverFirstName: users.firstName,
          approverLastName: users.lastName,
        })
        .from(kycVerifications)
        .innerJoin(clients, eq(kycVerifications.clientId, clients.id))
        .leftJoin(
          onboardingSessions,
          eq(kycVerifications.onboardingSessionId, onboardingSessions.id),
        )
        .leftJoin(users, eq(kycVerifications.approvedBy, users.id))
        .where(
          and(
            eq(kycVerifications.id, input.verificationId),
            eq(kycVerifications.tenantId, ctx.authContext.tenantId),
          ),
        )
        .limit(1);

      if (!verification) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "KYC verification not found",
        });
      }

      return verification;
    }),

  /**
   * Approve a KYC verification
   */
  approveVerification: adminProcedure
    .input(
      z.object({
        verificationId: z.string(),
        notes: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Get verification
      const [verification] = await db
        .select()
        .from(kycVerifications)
        .where(
          and(
            eq(kycVerifications.id, input.verificationId),
            eq(kycVerifications.tenantId, ctx.authContext.tenantId),
          ),
        )
        .limit(1);

      if (!verification) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "KYC verification not found",
        });
      }

      // Update verification as approved
      await db
        .update(kycVerifications)
        .set({
          approvedBy: ctx.authContext.userId,
          approvedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(kycVerifications.id, input.verificationId));

      // Update onboarding session to approved
      if (verification.onboardingSessionId) {
        await db
          .update(onboardingSessions)
          .set({
            status: "approved",
            progress: 100,
            actualCompletionDate: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(onboardingSessions.id, verification.onboardingSessionId));
      }

      // Update client status to active
      await db
        .update(clients)
        .set({
          status: "active",
          updatedAt: new Date(),
        })
        .where(eq(clients.id, verification.clientId));

      // Log activity
      await db.insert(activityLogs).values({
        tenantId: ctx.authContext.tenantId,
        entityType: "client",
        entityId: verification.clientId,
        action: "kyc_verification_approved",
        description: `KYC verification manually approved by ${ctx.authContext.firstName} ${ctx.authContext.lastName}`,
        userId: ctx.authContext.userId,
        userName: `${ctx.authContext.firstName} ${ctx.authContext.lastName}`,
        metadata: {
          verificationId: input.verificationId,
          lemverifyId: verification.lemverifyId,
          notes: input.notes,
        },
      });

      return { success: true };
    }),

  /**
   * Reject a KYC verification
   */
  rejectVerification: adminProcedure
    .input(
      z.object({
        verificationId: z.string(),
        reason: z
          .string()
          .min(10, "Rejection reason must be at least 10 characters"),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Get verification
      const [verification] = await db
        .select()
        .from(kycVerifications)
        .where(
          and(
            eq(kycVerifications.id, input.verificationId),
            eq(kycVerifications.tenantId, ctx.authContext.tenantId),
          ),
        )
        .limit(1);

      if (!verification) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "KYC verification not found",
        });
      }

      // Update verification as rejected
      await db
        .update(kycVerifications)
        .set({
          approvedBy: ctx.authContext.userId,
          approvedAt: new Date(),
          rejectionReason: input.reason,
          updatedAt: new Date(),
        })
        .where(eq(kycVerifications.id, input.verificationId));

      // Update onboarding session to rejected
      if (verification.onboardingSessionId) {
        await db
          .update(onboardingSessions)
          .set({
            status: "rejected",
            updatedAt: new Date(),
          })
          .where(eq(onboardingSessions.id, verification.onboardingSessionId));
      }

      // Log activity
      await db.insert(activityLogs).values({
        tenantId: ctx.authContext.tenantId,
        entityType: "client",
        entityId: verification.clientId,
        action: "kyc_verification_rejected",
        description: `KYC verification rejected by ${ctx.authContext.firstName} ${ctx.authContext.lastName}: ${input.reason}`,
        userId: ctx.authContext.userId,
        userName: `${ctx.authContext.firstName} ${ctx.authContext.lastName}`,
        metadata: {
          verificationId: input.verificationId,
          lemverifyId: verification.lemverifyId,
          reason: input.reason,
        },
      });

      return { success: true };
    }),

  /**
   * Get KYC review statistics
   */
  getReviewStats: adminProcedure.query(async ({ ctx }) => {
    const allVerifications = await db
      .select({
        status: kycVerifications.status,
        outcome: kycVerifications.outcome,
        approvedBy: kycVerifications.approvedBy,
        pepMatch: kycVerifications.pepMatch,
        sanctionsMatch: kycVerifications.sanctionsMatch,
      })
      .from(kycVerifications)
      .where(eq(kycVerifications.tenantId, ctx.authContext.tenantId));

    return {
      total: allVerifications.length,
      pending: allVerifications.filter((v) => v.status === "pending").length,
      completed: allVerifications.filter((v) => v.status === "completed")
        .length,
      autoApproved: allVerifications.filter(
        (v) => v.approvedBy === null && v.outcome === "pass",
      ).length,
      manuallyApproved: allVerifications.filter(
        (v) => v.approvedBy !== null && v.outcome === "pass",
      ).length,
      rejected: allVerifications.filter((v) => v.outcome === "fail").length,
      pepMatches: allVerifications.filter((v) => v.pepMatch === true).length,
      sanctionMatches: allVerifications.filter((v) => v.sanctionsMatch === true)
        .length,
    };
  }),
});
