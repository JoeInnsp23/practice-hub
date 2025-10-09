import { TRPCError } from "@trpc/server";
import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import {
  clients,
  onboardingSessions,
  onboardingTasks,
  onboardingResponses,
  amlChecks,
  kycVerifications,
  activityLogs,
  users,
} from "@/lib/db/schema";
import { protectedProcedure, router } from "../trpc";
import { getPrefilledQuestionnaire, validateQuestionnaireComplete } from "@/lib/ai/questionnaire-prefill";
import { updateExtractedResponse, markResponseAsVerified } from "@/lib/ai/save-extracted-data";
import { lemverifyClient } from "@/lib/kyc/lemverify-client";

// Onboarding task template - 17 standard tasks from CSV
const ONBOARDING_TEMPLATE_TASKS = [
  {
    sequence: 10,
    taskName: "Ensure Client is Setup in Bright Manager",
    description:
      "Check client is in Bright Manager with appropriate client information, services and pricing filled in",
    required: true,
    days: 0,
    progressWeight: 5,
  },
  {
    sequence: 20,
    taskName: "Request client ID documents",
    description: "Request passport/driving license and proof of address",
    required: true,
    days: 0,
    progressWeight: 5,
  },
  {
    sequence: 25,
    taskName: "Receive and Save client ID documents",
    description: "Save client ID documents to client AML folder on OneDrive",
    required: true,
    days: 2,
    progressWeight: 5,
  },
  {
    sequence: 30,
    taskName: "Complete AML ID check",
    description: "Verify identity documents and complete AML compliance check",
    required: true,
    days: 4,
    progressWeight: 6,
  },
  {
    sequence: 40,
    taskName: "Perform client risk assessment and grading",
    description:
      "Assess client risk factors and determine risk level (Low/Medium/High), also a assign client a grade based off current communication quality",
    required: true,
    days: 4,
    progressWeight: 6,
  },
  {
    sequence: 50,
    taskName: "Send Letter of Engagement",
    description:
      "Send LoE detailing scope of work, from Bright Manager and ensure it is signed",
    required: true,
    days: 4,
    progressWeight: 8,
  },
  {
    sequence: 51,
    taskName: "Assign Client Manager",
    description:
      "Discuss internally to decide which person will take on the new client",
    required: true,
    days: 4,
    progressWeight: 5,
  },
  {
    sequence: 55,
    taskName: "Confirm Signing of LoE",
    description:
      "Confirm the signing of Letter of Engagement before proceeding",
    required: true,
    days: 7,
    progressWeight: 5,
  },
  {
    sequence: 60,
    taskName: "Request previous accountant clearance",
    description: "Contact previous accountant for professional clearance",
    required: false,
    days: 7,
    progressWeight: 5,
  },
  {
    sequence: 70,
    taskName: "Request and confirm relevant UTRs",
    description: "Ask client for all applicable UTRs, or register if needed",
    required: true,
    days: 7,
    progressWeight: 5,
  },
  {
    sequence: 80,
    taskName: "Request Agent Authorisation Codes",
    description: "Obtain codes for HMRC agent services",
    required: true,
    days: 7,
    progressWeight: 5,
  },
  {
    sequence: 90,
    taskName: "Setup GoCardless Direct Debit",
    description: "Setup client on GoCardless and send DD mandate",
    required: true,
    days: 7,
    progressWeight: 10,
  },
  {
    sequence: 95,
    taskName: "Confirm information received",
    description:
      "Confirm all outstanding information received before proceeding (Professional Clearance, UTRs, Authorisation codes etc)",
    required: true,
    days: 10,
    progressWeight: 5,
  },
  {
    sequence: 100,
    taskName: "Register for necessary taxes",
    description:
      "Register for applicable taxes (VAT, PAYE, etc.) Check with client manager for which period the taxes should fall under",
    required: false,
    days: 10,
    progressWeight: 5,
  },
  {
    sequence: 110,
    taskName: "Register for additional HMRC services",
    description:
      "Register for additional services such as Income Tax record, MTD for IT, CIS etc",
    required: true,
    days: 10,
    progressWeight: 5,
  },
  {
    sequence: 120,
    taskName: "Set up tasks for recurring services",
    description: "Create recurring tasks for ongoing services",
    required: true,
    days: 10,
    progressWeight: 5,
  },
  {
    sequence: 130,
    taskName: "Change client status to Active",
    description: "Update client status when onboarding is complete",
    required: true,
    days: 10,
    progressWeight: 10,
  },
];

export const onboardingRouter = router({
  // List all onboarding sessions
  list: protectedProcedure
    .input(
      z.object({
        status: z.enum(["not_started", "in_progress", "completed"]).optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const where = [eq(onboardingSessions.tenantId, ctx.authContext.tenantId)];

      if (input.status) {
        where.push(eq(onboardingSessions.status, input.status));
      }

      const sessions = await db
        .select({
          id: onboardingSessions.id,
          clientId: onboardingSessions.clientId,
          clientName: clients.name,
          clientEmail: clients.email,
          clientPhone: clients.phone,
          startDate: onboardingSessions.startDate,
          targetCompletionDate: onboardingSessions.targetCompletionDate,
          actualCompletionDate: onboardingSessions.actualCompletionDate,
          status: onboardingSessions.status,
          priority: onboardingSessions.priority,
          progress: onboardingSessions.progress,
          assignedToId: onboardingSessions.assignedToId,
          assignedToName: users.firstName,
          createdAt: onboardingSessions.createdAt,
        })
        .from(onboardingSessions)
        .innerJoin(clients, eq(onboardingSessions.clientId, clients.id))
        .leftJoin(users, eq(onboardingSessions.assignedToId, users.id))
        .where(and(...where))
        .orderBy(desc(onboardingSessions.createdAt));

      return { sessions };
    }),

  // Get onboarding session by ID with all tasks
  getById: protectedProcedure
    .input(z.string())
    .query(async ({ ctx, input }) => {
      const [session] = await db
        .select({
          id: onboardingSessions.id,
          tenantId: onboardingSessions.tenantId,
          clientId: onboardingSessions.clientId,
          startDate: onboardingSessions.startDate,
          targetCompletionDate: onboardingSessions.targetCompletionDate,
          actualCompletionDate: onboardingSessions.actualCompletionDate,
          status: onboardingSessions.status,
          priority: onboardingSessions.priority,
          progress: onboardingSessions.progress,
          assignedToId: onboardingSessions.assignedToId,
          notes: onboardingSessions.notes,
          createdAt: onboardingSessions.createdAt,
          updatedAt: onboardingSessions.updatedAt,
          // Client info
          clientName: clients.name,
          clientEmail: clients.email,
          clientPhone: clients.phone,
          clientCode: clients.clientCode,
          clientCreatedAt: clients.createdAt,
          // Account Manager info
          accountManagerFirstName: users.firstName,
          accountManagerLastName: users.lastName,
        })
        .from(onboardingSessions)
        .innerJoin(clients, eq(onboardingSessions.clientId, clients.id))
        .leftJoin(users, eq(onboardingSessions.assignedToId, users.id))
        .where(
          and(
            eq(onboardingSessions.id, input),
            eq(onboardingSessions.tenantId, ctx.authContext.tenantId),
          ),
        )
        .limit(1);

      if (!session) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Onboarding session not found",
        });
      }

      // Get all tasks for this session
      const tasks = await db
        .select({
          id: onboardingTasks.id,
          sessionId: onboardingTasks.sessionId,
          taskName: onboardingTasks.taskName,
          description: onboardingTasks.description,
          required: onboardingTasks.required,
          sequence: onboardingTasks.sequence,
          days: onboardingTasks.days,
          dueDate: onboardingTasks.dueDate,
          completionDate: onboardingTasks.completionDate,
          done: onboardingTasks.done,
          notes: onboardingTasks.notes,
          assignedToId: onboardingTasks.assignedToId,
          assignedToName: users.firstName,
          progressWeight: onboardingTasks.progressWeight,
          createdAt: onboardingTasks.createdAt,
          updatedAt: onboardingTasks.updatedAt,
        })
        .from(onboardingTasks)
        .leftJoin(users, eq(onboardingTasks.assignedToId, users.id))
        .where(eq(onboardingTasks.sessionId, session.id))
        .orderBy(onboardingTasks.sequence);

      // Concatenate account manager name
      const accountManagerName =
        session.accountManagerFirstName && session.accountManagerLastName
          ? `${session.accountManagerFirstName} ${session.accountManagerLastName}`
          : null;

      return {
        ...session,
        accountManagerName,
        tasks,
      };
    }),

  // Create onboarding session for a client
  createSession: protectedProcedure
    .input(
      z.object({
        clientId: z.string(),
        startDate: z.date().optional(),
        targetCompletionDate: z.date().optional(),
        assignedToId: z.string().optional(),
        priority: z.enum(["low", "medium", "high"]).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const startDate = input.startDate || new Date();
      const targetCompletion =
        input.targetCompletionDate ||
        new Date(Date.now() + 14 * 24 * 60 * 60 * 1000); // 14 days from now

      // Create session
      const [session] = await db
        .insert(onboardingSessions)
        .values({
          tenantId: ctx.authContext.tenantId,
          clientId: input.clientId,
          startDate,
          targetCompletionDate: targetCompletion,
          assignedToId: input.assignedToId,
          priority: input.priority || "medium",
          status: "not_started",
          progress: 0,
        })
        .returning();

      // Create all template tasks
      const tasksToInsert = ONBOARDING_TEMPLATE_TASKS.map((template) => ({
        tenantId: ctx.authContext.tenantId,
        sessionId: session.id,
        taskName: template.taskName,
        description: template.description,
        required: template.required,
        sequence: template.sequence,
        days: template.days,
        progressWeight: template.progressWeight,
        assignedToId: input.assignedToId,
        dueDate: new Date(
          startDate.getTime() + template.days * 24 * 60 * 60 * 1000,
        ),
        done: false,
      }));

      await db.insert(onboardingTasks).values(tasksToInsert);

      return { session };
    }),

  // Update a specific task
  updateTask: protectedProcedure
    .input(
      z.object({
        taskId: z.string(),
        done: z.boolean().optional(),
        notes: z.string().optional(),
        assignedToId: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const updateData: Record<string, unknown> = {
        updatedAt: new Date(),
      };

      if (input.done !== undefined) {
        updateData.done = input.done;
        if (input.done) {
          updateData.completionDate = new Date();
        } else {
          updateData.completionDate = null;
        }
      }

      if (input.notes !== undefined) {
        updateData.notes = input.notes;
      }

      if (input.assignedToId !== undefined) {
        updateData.assignedToId = input.assignedToId;
      }

      const [task] = await db
        .update(onboardingTasks)
        .set(updateData)
        .where(
          and(
            eq(onboardingTasks.id, input.taskId),
            eq(onboardingTasks.tenantId, ctx.authContext.tenantId),
          ),
        )
        .returning();

      if (!task) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Task not found",
        });
      }

      // Recalculate session progress
      const allTasks = await db
        .select()
        .from(onboardingTasks)
        .where(eq(onboardingTasks.sessionId, task.sessionId));

      const totalWeight = allTasks.reduce(
        (sum, t) => sum + t.progressWeight,
        0,
      );
      const completedWeight = allTasks
        .filter((t) => t.done)
        .reduce((sum, t) => sum + t.progressWeight, 0);

      const progress = Math.round((completedWeight / totalWeight) * 100);

      // Update session progress and status
      let status: "not_started" | "in_progress" | "completed" = "in_progress";
      if (progress === 0) {
        status = "not_started";
      } else if (progress === 100) {
        status = "completed";
      }

      await db
        .update(onboardingSessions)
        .set({
          progress,
          status,
          actualCompletionDate: progress === 100 ? new Date() : null,
          updatedAt: new Date(),
        })
        .where(eq(onboardingSessions.id, task.sessionId));

      return { task, progress };
    }),

  // Update session details
  updateSession: protectedProcedure
    .input(
      z.object({
        sessionId: z.string(),
        status: z.enum(["not_started", "in_progress", "completed"]).optional(),
        priority: z.enum(["low", "medium", "high"]).optional(),
        targetCompletionDate: z.date().optional(),
        assignedToId: z.string().optional(),
        notes: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const updateData: Record<string, unknown> = {
        updatedAt: new Date(),
      };

      if (input.status) {
        updateData.status = input.status;
        if (input.status === "completed") {
          updateData.actualCompletionDate = new Date();

          // Get the session to find the client ID
          const [session] = await db
            .select({ clientId: onboardingSessions.clientId })
            .from(onboardingSessions)
            .where(
              and(
                eq(onboardingSessions.id, input.sessionId),
                eq(onboardingSessions.tenantId, ctx.authContext.tenantId),
              ),
            )
            .limit(1);

          // Update client status to active when onboarding completes
          if (session) {
            await db
              .update(clients)
              .set({ status: "active", updatedAt: new Date() })
              .where(eq(clients.id, session.clientId));
          }
        }
      }

      if (input.priority) {
        updateData.priority = input.priority;
      }

      if (input.targetCompletionDate) {
        updateData.targetCompletionDate = input.targetCompletionDate;
      }

      if (input.assignedToId !== undefined) {
        updateData.assignedToId = input.assignedToId;
      }

      if (input.notes !== undefined) {
        updateData.notes = input.notes;
      }

      const [session] = await db
        .update(onboardingSessions)
        .set(updateData)
        .where(
          and(
            eq(onboardingSessions.id, input.sessionId),
            eq(onboardingSessions.tenantId, ctx.authContext.tenantId),
          ),
        )
        .returning();

      if (!session) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Onboarding session not found",
        });
      }

      return { session };
    }),

  // Get statistics
  getStats: protectedProcedure.query(async ({ ctx }) => {
    const allSessions = await db
      .select({
        status: onboardingSessions.status,
        createdAt: onboardingSessions.createdAt,
      })
      .from(onboardingSessions)
      .where(eq(onboardingSessions.tenantId, ctx.authContext.tenantId));

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentSessions = allSessions.filter(
      (s) => new Date(s.createdAt) >= thirtyDaysAgo,
    );

    return {
      total: allSessions.length,
      recent: recentSessions.length,
      notStarted: allSessions.filter((s) => s.status === "not_started").length,
      inProgress: allSessions.filter((s) => s.status === "in_progress").length,
      completed: allSessions.filter((s) => s.status === "completed").length,
    };
  }),

  // Delete session
  delete: protectedProcedure
    .input(z.string())
    .mutation(async ({ ctx, input }) => {
      const [deleted] = await db
        .delete(onboardingSessions)
        .where(
          and(
            eq(onboardingSessions.id, input),
            eq(onboardingSessions.tenantId, ctx.authContext.tenantId),
          ),
        )
        .returning();

      if (!deleted) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Onboarding session not found",
        });
      }

      return { success: true };
    }),

  /**
   * CLIENT-FACING ONBOARDING QUESTIONNAIRE ENDPOINTS
   */

  /**
   * Get onboarding session with pre-filled questionnaire
   */
  getQuestionnaireSession: protectedProcedure
    .input(
      z.object({
        sessionId: z.string(),
      })
    )
    .query(async ({ input, ctx }) => {
      const { sessionId } = input;

      // Get onboarding session
      const [session] = await db
        .select()
        .from(onboardingSessions)
        .where(
          and(
            eq(onboardingSessions.id, sessionId),
            eq(onboardingSessions.tenantId, ctx.authContext.tenantId)
          )
        )
        .limit(1);

      if (!session) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Onboarding session not found",
        });
      }

      // Get pre-filled questionnaire data
      const prefilledData = await getPrefilledQuestionnaire(sessionId);

      return {
        session,
        questionnaire: prefilledData,
      };
    }),

  /**
   * Update questionnaire response
   */
  updateQuestionnaireResponse: protectedProcedure
    .input(
      z.object({
        sessionId: z.string(),
        questionKey: z.string(),
        value: z.any(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { sessionId, questionKey, value } = input;

      // Verify session belongs to tenant
      const [session] = await db
        .select()
        .from(onboardingSessions)
        .where(
          and(
            eq(onboardingSessions.id, sessionId),
            eq(onboardingSessions.tenantId, ctx.authContext.tenantId)
          )
        )
        .limit(1);

      if (!session) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Onboarding session not found",
        });
      }

      // Update response
      await updateExtractedResponse(sessionId, questionKey, value);

      // Log activity
      await db.insert(activityLogs).values({
        tenantId: ctx.authContext.tenantId,
        entityType: "onboarding_session",
        entityId: sessionId,
        action: "questionnaire_updated",
        description: `Updated field: ${questionKey}`,
        userId: ctx.authContext.userId,
        userName: `${ctx.authContext.firstName} ${ctx.authContext.lastName}`,
        metadata: {
          questionKey,
          valueType: typeof value,
        },
      });

      return { success: true };
    }),

  /**
   * Verify AI-extracted response
   */
  verifyQuestionnaireResponse: protectedProcedure
    .input(
      z.object({
        sessionId: z.string(),
        questionKey: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { sessionId, questionKey } = input;

      // Verify session belongs to tenant
      const [session] = await db
        .select()
        .from(onboardingSessions)
        .where(
          and(
            eq(onboardingSessions.id, sessionId),
            eq(onboardingSessions.tenantId, ctx.authContext.tenantId)
          )
        )
        .limit(1);

      if (!session) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Onboarding session not found",
        });
      }

      // Mark as verified
      await markResponseAsVerified(sessionId, questionKey);

      return { success: true };
    }),

  /**
   * Submit completed questionnaire and trigger AML check
   */
  submitQuestionnaire: protectedProcedure
    .input(
      z.object({
        sessionId: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { sessionId } = input;

      // Get session
      const [session] = await db
        .select()
        .from(onboardingSessions)
        .where(
          and(
            eq(onboardingSessions.id, sessionId),
            eq(onboardingSessions.tenantId, ctx.authContext.tenantId)
          )
        )
        .limit(1);

      if (!session) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Onboarding session not found",
        });
      }

      // Get pre-filled data and validate
      const prefilledData = await getPrefilledQuestionnaire(sessionId);
      const validation = validateQuestionnaireComplete(prefilledData);

      if (!validation.valid) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Questionnaire incomplete: ${validation.errors.join(", ")}`,
        });
      }

      // Get client details
      const [client] = await db
        .select()
        .from(clients)
        .where(eq(clients.id, session.clientId))
        .limit(1);

      if (!client) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Client not found",
        });
      }

      console.log("Submitting questionnaire and initiating KYC verification for client:", client.id);

      // Extract data for LEM Verify
      const firstName = prefilledData.fields.contact_first_name?.value || "";
      const lastName = prefilledData.fields.contact_last_name?.value || "";
      const dateOfBirth = prefilledData.fields.contact_date_of_birth?.value;
      const phoneNumber = prefilledData.fields.contact_phone?.value || client.phone;

      try {
        // Request verification from LEM Verify
        const verificationRequest = await lemverifyClient.requestVerification({
          clientRef: client.id,
          email: client.email || "",
          firstName,
          lastName,
          dateOfBirth,
          phoneNumber: phoneNumber || undefined,
          callbackUrl: `${process.env.NEXT_PUBLIC_APP_URL || "https://app.innspiredaccountancy.com"}/api/webhooks/lemverify`,
          metadata: {
            tenantId: ctx.authContext.tenantId,
            onboardingSessionId: sessionId,
            clientCode: client.clientCode,
          },
        });

        console.log("LEM Verify verification requested:", verificationRequest.id);
        console.log("Verification URL:", verificationRequest.verificationUrl);

        // Create KYC verification record
        await db.insert(kycVerifications).values({
          tenantId: ctx.authContext.tenantId,
          clientId: client.id,
          onboardingSessionId: sessionId,
          lemverifyId: verificationRequest.id,
          clientRef: client.id,
          status: "pending",
          metadata: {
            verificationUrl: verificationRequest.verificationUrl,
            requestedAt: new Date().toISOString(),
          },
        });

        // Update onboarding session status
        await db
          .update(onboardingSessions)
          .set({
            status: "pending_approval", // Awaiting client to complete verification
            progress: 50, // Questionnaire complete, awaiting document upload
            updatedAt: new Date(),
          })
          .where(eq(onboardingSessions.id, sessionId));

        // Log activity
        await db.insert(activityLogs).values({
          tenantId: ctx.authContext.tenantId,
          entityType: "client",
          entityId: client.id,
          action: "kyc_verification_initiated",
          description: "Onboarding questionnaire submitted, KYC verification link sent to client",
          userId: ctx.authContext.userId,
          userName: `${ctx.authContext.firstName} ${ctx.authContext.lastName}`,
          metadata: {
            sessionId,
            lemverifyId: verificationRequest.id,
          },
        });

        // TODO: Send email to client with verification URL
        // This should use your email service (e.g., Resend, SendGrid)
        console.log(`TODO: Send verification email to ${client.email}`);
        console.log(`Verification URL: ${verificationRequest.verificationUrl}`);

        return {
          success: true,
          message: "Questionnaire submitted. Please check your email to complete identity verification.",
          status: "pending_approval",
          verificationUrl: verificationRequest.verificationUrl, // Can be used for immediate redirect
        };
      } catch (error) {
        console.error("Failed to initiate KYC verification:", error);

        // Update session with error status
        await db
          .update(onboardingSessions)
          .set({
            status: "pending_approval", // Still pending, but flag for manual review
            updatedAt: new Date(),
          })
          .where(eq(onboardingSessions.id, sessionId));

        // Log error
        await db.insert(activityLogs).values({
          tenantId: ctx.authContext.tenantId,
          entityType: "onboarding_session",
          entityId: sessionId,
          action: "kyc_verification_failed",
          description: "Failed to initiate KYC verification - requires manual review",
          userId: ctx.authContext.userId,
          userName: "System",
          metadata: {
            error: error instanceof Error ? error.message : "Unknown error",
          },
        });

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to initiate identity verification. Please contact support.",
        });
      }
    }),

  /**
   * Get onboarding status for client portal
   */
  getOnboardingStatus: protectedProcedure
    .input(
      z.object({
        clientId: z.string(),
      })
    )
    .query(async ({ input, ctx }) => {
      const { clientId } = input;

      // Get active onboarding session
      const [session] = await db
        .select()
        .from(onboardingSessions)
        .where(
          and(
            eq(onboardingSessions.clientId, clientId),
            eq(onboardingSessions.tenantId, ctx.authContext.tenantId)
          )
        )
        .orderBy(desc(onboardingSessions.createdAt))
        .limit(1);

      if (!session) {
        return {
          hasOnboarding: false,
        };
      }

      // Get KYC verification if exists
      const [kycVerification] = await db
        .select()
        .from(kycVerifications)
        .where(eq(kycVerifications.onboardingSessionId, session.id))
        .orderBy(desc(kycVerifications.createdAt))
        .limit(1);

      return {
        hasOnboarding: true,
        session,
        kycVerification,
        canAccessPortal: session.status === "approved",
        blockingReason: session.status === "rejected"
          ? "Your application has been declined"
          : session.status === "pending_approval"
          ? "Your identity verification is under review"
          : session.status === "pending_questionnaire"
          ? "Please complete your onboarding questionnaire"
          : null,
      };
    }),
});
