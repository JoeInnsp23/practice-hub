import { TRPCError } from "@trpc/server";
import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import {
  clients,
  onboardingSessions,
  onboardingTasks,
  users,
} from "@/lib/db/schema";
import { protectedProcedure, router } from "../trpc";

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
    description:
      "Verify identity documents and complete AML compliance check",
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
        status: z
          .enum(["not_started", "in_progress", "completed"])
          .optional(),
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
        })
        .from(onboardingSessions)
        .innerJoin(clients, eq(onboardingSessions.clientId, clients.id))
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

      return {
        ...session,
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
      const updateData: any = {
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
      const updateData: any = {
        updatedAt: new Date(),
      };

      if (input.status) {
        updateData.status = input.status;
        if (input.status === "completed") {
          updateData.actualCompletionDate = new Date();
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
});
