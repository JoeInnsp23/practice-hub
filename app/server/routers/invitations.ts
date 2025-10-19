import crypto from "node:crypto";
import { TRPCError } from "@trpc/server";
import bcrypt from "bcryptjs";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { accounts, activityLogs, invitations, users } from "@/lib/db/schema";
import { sendInvitationEmail } from "@/lib/email";
import { adminProcedure, publicProcedure, router } from "../trpc";

// Helper function to log invitation activities
async function logInvitationActivity(params: {
  action:
    | "invitation.sent"
    | "invitation.resent"
    | "invitation.accepted"
    | "invitation.cancelled"
    | "invitation.expired";
  invitationId: string;
  tenantId: string;
  userId?: string;
  userName?: string;
  description: string;
  metadata?: Record<string, unknown>;
}) {
  await db.insert(activityLogs).values({
    tenantId: params.tenantId,
    entityType: "invitation",
    entityId: params.invitationId,
    action: params.action,
    description: params.description,
    userId: params.userId || null,
    userName: params.userName || null,
    metadata: params.metadata || null,
  });
}

// Rate limiting constants
const RATE_LIMIT_PER_HOUR_PER_USER = 10;
const RATE_LIMIT_PER_DAY_PER_TENANT = 50;

// Helper function to check rate limits
async function checkRateLimits(params: {
  userId: string;
  tenantId: string;
}): Promise<
  { allowed: true } | { allowed: false; reason: string; resetTime: Date }
> {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  // Check user hourly limit
  const userHourlyCount = await db
    .select()
    .from(invitations)
    .where(
      and(
        eq(invitations.invitedBy, params.userId),
        eq(invitations.tenantId, params.tenantId),
      ),
    )
    .then((results) =>
      results.filter((inv) => new Date(inv.createdAt) > oneHourAgo),
    );

  if (userHourlyCount.length >= RATE_LIMIT_PER_HOUR_PER_USER) {
    const oldestInvitation = userHourlyCount.sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    )[0];
    const resetTime = new Date(
      new Date(oldestInvitation.createdAt).getTime() + 60 * 60 * 1000,
    );

    return {
      allowed: false,
      reason: `You've reached the limit of ${RATE_LIMIT_PER_HOUR_PER_USER} invitations per hour. Try again in a few minutes.`,
      resetTime,
    };
  }

  // Check tenant daily limit
  const tenantDailyCount = await db
    .select()
    .from(invitations)
    .where(eq(invitations.tenantId, params.tenantId))
    .then((results) =>
      results.filter((inv) => new Date(inv.createdAt) > oneDayAgo),
    );

  if (tenantDailyCount.length >= RATE_LIMIT_PER_DAY_PER_TENANT) {
    const oldestInvitation = tenantDailyCount.sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    )[0];
    const resetTime = new Date(
      new Date(oldestInvitation.createdAt).getTime() + 24 * 60 * 60 * 1000,
    );

    return {
      allowed: false,
      reason: `Your organization has reached the limit of ${RATE_LIMIT_PER_DAY_PER_TENANT} invitations per day. Try again tomorrow.`,
      resetTime,
    };
  }

  return { allowed: true };
}

export const invitationsRouter = router({
  // Get rate limit status (admin only)
  getRateLimitStatus: adminProcedure.query(async ({ ctx }) => {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    // Get user hourly count
    const userHourlyInvitations = await db
      .select()
      .from(invitations)
      .where(
        and(
          eq(invitations.invitedBy, ctx.authContext.userId),
          eq(invitations.tenantId, ctx.authContext.tenantId),
        ),
      )
      .then((results) =>
        results.filter((inv) => new Date(inv.createdAt) > oneHourAgo),
      );

    // Get tenant daily count
    const tenantDailyInvitations = await db
      .select()
      .from(invitations)
      .where(eq(invitations.tenantId, ctx.authContext.tenantId))
      .then((results) =>
        results.filter((inv) => new Date(inv.createdAt) > oneDayAgo),
      );

    return {
      hourly: {
        count: userHourlyInvitations.length,
        limit: RATE_LIMIT_PER_HOUR_PER_USER,
        remaining: RATE_LIMIT_PER_HOUR_PER_USER - userHourlyInvitations.length,
      },
      daily: {
        count: tenantDailyInvitations.length,
        limit: RATE_LIMIT_PER_DAY_PER_TENANT,
        remaining:
          RATE_LIMIT_PER_DAY_PER_TENANT - tenantDailyInvitations.length,
      },
    };
  }),

  // Get recent invitation activity logs (admin only)
  getActivityLogs: adminProcedure
    .input(
      z
        .object({
          limit: z.number().min(1).max(50).default(20),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      const logs = await db
        .select({
          id: activityLogs.id,
          action: activityLogs.action,
          description: activityLogs.description,
          userName: activityLogs.userName,
          createdAt: activityLogs.createdAt,
          metadata: activityLogs.metadata,
        })
        .from(activityLogs)
        .where(
          and(
            eq(activityLogs.tenantId, ctx.authContext.tenantId),
            eq(activityLogs.entityType, "invitation"),
          ),
        )
        .orderBy(activityLogs.createdAt)
        .limit(input?.limit || 20);

      return logs.reverse(); // Show newest first
    }),

  // List all invitations (admin only)
  list: adminProcedure.query(async ({ ctx }) => {
    const allInvitations = await db
      .select({
        id: invitations.id,
        email: invitations.email,
        role: invitations.role,
        status: invitations.status,
        expiresAt: invitations.expiresAt,
        acceptedAt: invitations.acceptedAt,
        createdAt: invitations.createdAt,
        invitedBy: {
          id: users.id,
          name: users.name,
          email: users.email,
        },
      })
      .from(invitations)
      .leftJoin(users, eq(invitations.invitedBy, users.id))
      .where(eq(invitations.tenantId, ctx.authContext.tenantId))
      .orderBy(invitations.createdAt);

    return allInvitations;
  }),

  // Send invitation (admin only)
  send: adminProcedure
    .input(
      z.object({
        email: z.string().email(),
        role: z.enum(["admin", "accountant", "member"]),
        customMessage: z.string().optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      // Check rate limits
      const rateLimitCheck = await checkRateLimits({
        userId: ctx.authContext.userId,
        tenantId: ctx.authContext.tenantId,
      });

      if (!rateLimitCheck.allowed) {
        throw new TRPCError({
          code: "TOO_MANY_REQUESTS",
          message: rateLimitCheck.reason,
        });
      }

      // Check if user already exists
      const existingUser = await db
        .select()
        .from(users)
        .where(
          and(
            eq(users.email, input.email),
            eq(users.tenantId, ctx.authContext.tenantId),
          ),
        )
        .limit(1);

      if (existingUser.length > 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "A user with this email already exists",
        });
      }

      // Check if pending invitation already exists
      const existingInvitation = await db
        .select()
        .from(invitations)
        .where(
          and(
            eq(invitations.email, input.email),
            eq(invitations.tenantId, ctx.authContext.tenantId),
            eq(invitations.status, "pending"),
          ),
        )
        .limit(1);

      if (existingInvitation.length > 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "An invitation has already been sent to this email",
        });
      }

      // Generate secure token
      const token = crypto.randomBytes(32).toString("hex");

      // Create invitation
      const [invitation] = await db
        .insert(invitations)
        .values({
          tenantId: ctx.authContext.tenantId,
          email: input.email,
          role: input.role,
          token,
          invitedBy: ctx.authContext.userId,
          customMessage: input.customMessage || null,
          status: "pending",
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        })
        .returning();

      // Send invitation email
      const inviteLink = `${process.env.BETTER_AUTH_URL}/accept-invitation/${token}`;

      await sendInvitationEmail({
        email: input.email,
        invitedByName:
          ctx.authContext.firstName && ctx.authContext.lastName
            ? `${ctx.authContext.firstName} ${ctx.authContext.lastName}`
            : ctx.authContext.email,
        organizationName: ctx.authContext.organizationName || "Practice Hub",
        inviteLink,
        customMessage: input.customMessage,
      });

      // Log invitation sent
      await logInvitationActivity({
        action: "invitation.sent",
        invitationId: invitation.id,
        tenantId: ctx.authContext.tenantId,
        userId: ctx.authContext.userId,
        userName:
          ctx.authContext.firstName && ctx.authContext.lastName
            ? `${ctx.authContext.firstName} ${ctx.authContext.lastName}`
            : ctx.authContext.email,
        description: `Invitation sent to ${input.email} as ${input.role}`,
        metadata: {
          email: input.email,
          role: input.role,
          hasCustomMessage: !!input.customMessage,
        },
      });

      return invitation;
    }),

  // Verify invitation token (public - no auth required)
  verify: publicProcedure
    .input(
      z.object({
        token: z.string(),
      }),
    )
    .query(async ({ input }) => {
      const [invitation] = await db
        .select()
        .from(invitations)
        .where(eq(invitations.token, input.token))
        .limit(1);

      if (!invitation) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Invalid invitation token",
        });
      }

      if (invitation.status !== "pending") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "This invitation has already been used",
        });
      }

      if (new Date() > invitation.expiresAt) {
        // Update status to expired
        await db
          .update(invitations)
          .set({ status: "expired" })
          .where(eq(invitations.id, invitation.id));

        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "This invitation has expired",
        });
      }

      return {
        email: invitation.email,
        role: invitation.role,
      };
    }),

  // Accept invitation and create user account (public - no auth required)
  accept: publicProcedure
    .input(
      z.object({
        token: z.string(),
        password: z.string().min(8),
        firstName: z.string().optional(),
        lastName: z.string().optional(),
      }),
    )
    .mutation(async ({ input }) => {
      // Verify invitation
      const [invitation] = await db
        .select()
        .from(invitations)
        .where(eq(invitations.token, input.token))
        .limit(1);

      if (!invitation) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Invalid invitation token",
        });
      }

      if (invitation.status !== "pending") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "This invitation has already been used",
        });
      }

      if (new Date() > invitation.expiresAt) {
        await db
          .update(invitations)
          .set({ status: "expired" })
          .where(eq(invitations.id, invitation.id));

        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "This invitation has expired",
        });
      }

      // Check if user already exists
      const existingUser = await db
        .select()
        .from(users)
        .where(eq(users.email, invitation.email))
        .limit(1);

      if (existingUser.length > 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "A user with this email already exists",
        });
      }

      // Create user with verified email
      const hashedPassword = await bcrypt.hash(input.password, 10);
      const userId = crypto.randomUUID();

      const [newUser] = await db
        .insert(users)
        .values({
          id: userId,
          tenantId: invitation.tenantId,
          email: invitation.email,
          emailVerified: true, // Auto-verify email for invited users
          firstName: input.firstName || null,
          lastName: input.lastName || null,
          name:
            input.firstName && input.lastName
              ? `${input.firstName} ${input.lastName}`
              : invitation.email,
          role: invitation.role,
          status: "active",
          isActive: true,
        })
        .returning();

      // Create Better Auth account with password
      await db.insert(accounts).values({
        id: crypto.randomUUID(),
        accountId: invitation.email,
        providerId: "credential",
        userId: userId,
        password: hashedPassword,
      });

      // Mark invitation as accepted
      await db
        .update(invitations)
        .set({
          status: "accepted",
          acceptedAt: new Date(),
        })
        .where(eq(invitations.id, invitation.id));

      // Log invitation accepted
      await logInvitationActivity({
        action: "invitation.accepted",
        invitationId: invitation.id,
        tenantId: invitation.tenantId,
        userId: newUser.id,
        userName: newUser.name || undefined,
        description: `Invitation accepted by ${newUser.email}`,
        metadata: {
          email: newUser.email,
          role: newUser.role,
        },
      });

      return {
        success: true,
        userId: newUser.id,
        email: newUser.email,
      };
    }),

  // Resend invitation (admin only)
  resend: adminProcedure
    .input(
      z.object({
        invitationId: z.string().uuid(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const [invitation] = await db
        .select()
        .from(invitations)
        .where(
          and(
            eq(invitations.id, input.invitationId),
            eq(invitations.tenantId, ctx.authContext.tenantId),
          ),
        )
        .limit(1);

      if (!invitation) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Invitation not found",
        });
      }

      if (invitation.status === "accepted") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "This invitation has already been accepted",
        });
      }

      // Generate new token and extend expiry
      const newToken = crypto.randomBytes(32).toString("hex");
      const newExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

      await db
        .update(invitations)
        .set({
          token: newToken,
          expiresAt: newExpiresAt,
          status: "pending",
        })
        .where(eq(invitations.id, invitation.id));

      // Send invitation email
      const inviteLink = `${process.env.BETTER_AUTH_URL}/accept-invitation/${newToken}`;

      await sendInvitationEmail({
        email: invitation.email,
        invitedByName:
          ctx.authContext.firstName && ctx.authContext.lastName
            ? `${ctx.authContext.firstName} ${ctx.authContext.lastName}`
            : ctx.authContext.email,
        organizationName: ctx.authContext.organizationName || "Practice Hub",
        inviteLink,
        customMessage: invitation.customMessage || undefined,
      });

      // Log invitation resent
      await logInvitationActivity({
        action: "invitation.resent",
        invitationId: invitation.id,
        tenantId: ctx.authContext.tenantId,
        userId: ctx.authContext.userId,
        userName:
          ctx.authContext.firstName && ctx.authContext.lastName
            ? `${ctx.authContext.firstName} ${ctx.authContext.lastName}`
            : ctx.authContext.email,
        description: `Invitation resent to ${invitation.email}`,
        metadata: {
          email: invitation.email,
          role: invitation.role,
        },
      });

      return { success: true };
    }),

  // Cancel invitation (admin only)
  cancel: adminProcedure
    .input(
      z.object({
        invitationId: z.string().uuid(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const [invitation] = await db
        .select()
        .from(invitations)
        .where(
          and(
            eq(invitations.id, input.invitationId),
            eq(invitations.tenantId, ctx.authContext.tenantId),
          ),
        )
        .limit(1);

      if (!invitation) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Invitation not found",
        });
      }

      if (invitation.status === "accepted") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Cannot cancel an accepted invitation",
        });
      }

      await db
        .update(invitations)
        .set({ status: "cancelled" })
        .where(eq(invitations.id, invitation.id));

      // Log invitation cancelled
      await logInvitationActivity({
        action: "invitation.cancelled",
        invitationId: invitation.id,
        tenantId: ctx.authContext.tenantId,
        userId: ctx.authContext.userId,
        userName:
          ctx.authContext.firstName && ctx.authContext.lastName
            ? `${ctx.authContext.firstName} ${ctx.authContext.lastName}`
            : ctx.authContext.email,
        description: `Invitation to ${invitation.email} cancelled`,
        metadata: {
          email: invitation.email,
          role: invitation.role,
        },
      });

      return { success: true };
    }),
});
