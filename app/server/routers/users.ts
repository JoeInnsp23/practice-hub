import * as Sentry from "@sentry/nextjs";
import { TRPCError } from "@trpc/server";
import { and, eq, ilike, or } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { activityLogs, users } from "@/lib/db/schema";
import { adminProcedure, protectedProcedure, router } from "../trpc";

// Role enum for filtering
const _userRoleEnum = z.enum(["admin", "accountant", "member"]);

// Generate schema from Drizzle table definition
const insertUserSchema = createInsertSchema(users);

// Schema for create/update operations (omit auto-generated fields)
const userSchema = insertUserSchema.omit({
  id: true,
  tenantId: true,
  createdAt: true,
  updatedAt: true,
});

export const usersRouter = router({
  list: protectedProcedure
    .input(
      z.object({
        search: z.string().optional(),
        role: z
          .union([z.enum(["member", "admin", "accountant"]), z.literal("all")])
          .optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { tenantId } = ctx.authContext;
      const { search, role } = input;

      // Build conditions
      const conditions = [eq(users.tenantId, tenantId)];

      if (search) {
        const searchCondition = or(
          ilike(users.firstName, `%${search}%`),
          ilike(users.lastName, `%${search}%`),
          ilike(users.email, `%${search}%`),
        );
        if (searchCondition) conditions.push(searchCondition);
      }

      if (role && role !== "all") {
        conditions.push(eq(users.role, role));
      }

      const usersList = await db
        .select({
          id: users.id,
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
          role: users.role,
          status: users.status,
          isActive: users.isActive,
          hourlyRate: users.hourlyRate,
          createdAt: users.createdAt,
          updatedAt: users.updatedAt,
        })
        .from(users)
        .where(and(...conditions))
        .orderBy(users.firstName, users.lastName);

      return { users: usersList };
    }),

  getById: protectedProcedure
    .input(z.string())
    .query(async ({ ctx, input: id }) => {
      const { tenantId } = ctx.authContext;

      const user = await db
        .select()
        .from(users)
        .where(and(eq(users.id, id), eq(users.tenantId, tenantId)))
        .limit(1);

      if (!user[0]) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found",
        });
      }

      return user[0];
    }),

  create: adminProcedure.input(userSchema).mutation(async ({ ctx, input }) => {
    const { tenantId, userId, firstName, lastName } = ctx.authContext;

    // Check if user already exists
    const existing = await db
      .select()
      .from(users)
      .where(and(eq(users.email, input.email), eq(users.tenantId, tenantId)))
      .limit(1);

    if (existing[0]) {
      throw new TRPCError({
        code: "CONFLICT",
        message: "User already exists in this organization",
      });
    }

    // Create the user
    const [newUser] = await db
      .insert(users)
      .values({
        id: crypto.randomUUID(),
        tenantId,
        email: input.email,
        firstName: input.firstName,
        lastName: input.lastName,
        role: input.role,
        status: input.status,
        isActive: input.isActive,
        hourlyRate: input.hourlyRate,
      })
      .returning();

    // Log the activity
    await db.insert(activityLogs).values({
      tenantId,
      entityType: "user",
      entityId: newUser.id,
      action: "created",
      description: `Added user ${input.firstName} ${input.lastName}`,
      userId,
      userName: `${firstName} ${lastName}`,
      newValues: { email: input.email, role: input.role },
    });

    return { success: true, user: newUser };
  }),

  update: adminProcedure
    .input(
      z.object({
        id: z.string(),
        data: userSchema.partial(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { tenantId, userId, firstName, lastName } = ctx.authContext;

      // Check user exists and belongs to tenant
      const existingUser = await db
        .select()
        .from(users)
        .where(and(eq(users.id, input.id), eq(users.tenantId, tenantId)))
        .limit(1);

      if (!existingUser[0]) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found",
        });
      }

      // Update user
      const [updatedUser] = await db
        .update(users)
        .set({
          ...input.data,
          updatedAt: new Date(),
        })
        .where(eq(users.id, input.id))
        .returning();

      // Log the activity
      await db.insert(activityLogs).values({
        tenantId,
        entityType: "user",
        entityId: input.id,
        action: "updated",
        description: `Updated user ${updatedUser.firstName} ${updatedUser.lastName}`,
        userId,
        userName: `${firstName} ${lastName}`,
        oldValues: existingUser[0],
        newValues: input.data,
      });

      return { success: true, user: updatedUser };
    }),

  delete: adminProcedure
    .input(z.string())
    .mutation(async ({ ctx, input: id }) => {
      const { tenantId, userId, firstName, lastName } = ctx.authContext;

      // Prevent self-deletion
      if (id === userId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Cannot delete your own account",
        });
      }

      // Check user exists and belongs to tenant
      const existingUser = await db
        .select()
        .from(users)
        .where(and(eq(users.id, id), eq(users.tenantId, tenantId)))
        .limit(1);

      if (!existingUser[0]) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found",
        });
      }

      // Delete the user
      await db.delete(users).where(eq(users.id, id));

      // Log the activity
      await db.insert(activityLogs).values({
        tenantId,
        entityType: "user",
        entityId: id,
        action: "deleted",
        description: `Removed user ${existingUser[0].firstName} ${existingUser[0].lastName}`,
        userId,
        userName: `${firstName} ${lastName}`,
      });

      return { success: true };
    }),

  updateRole: adminProcedure
    .input(
      z.object({
        id: z.string(),
        role: z.enum(["admin", "accountant", "member"]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { tenantId, userId, firstName, lastName } = ctx.authContext;

      // Check user exists and belongs to tenant
      const existingUser = await db
        .select()
        .from(users)
        .where(and(eq(users.id, input.id), eq(users.tenantId, tenantId)))
        .limit(1);

      if (!existingUser[0]) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found",
        });
      }

      // Update user role
      const [updatedUser] = await db
        .update(users)
        .set({
          role: input.role,
          updatedAt: new Date(),
        })
        .where(eq(users.id, input.id))
        .returning();

      // Log the activity
      await db.insert(activityLogs).values({
        tenantId,
        entityType: "user",
        entityId: input.id,
        action: "updated",
        description: `Updated user role to ${input.role}`,
        userId,
        userName: `${firstName} ${lastName}`,
        oldValues: existingUser[0],
        newValues: { role: input.role },
      });

      return { success: true, user: updatedUser };
    }),

  sendPasswordReset: adminProcedure
    .input(
      z.object({
        userId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const {
        tenantId,
        userId: adminUserId,
        firstName,
        lastName,
      } = ctx.authContext;

      // Check user exists and belongs to tenant
      const targetUser = await db
        .select()
        .from(users)
        .where(and(eq(users.id, input.userId), eq(users.tenantId, tenantId)))
        .limit(1);

      if (!targetUser[0]) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found",
        });
      }

      // Send password reset email using Better Auth
      try {
        await auth.api.forgetPassword({
          body: {
            email: targetUser[0].email,
            redirectTo: "/reset-password",
          },
        });

        // Log the activity
        await db.insert(activityLogs).values({
          tenantId,
          entityType: "user",
          entityId: input.userId,
          action: "password_reset_sent",
          description: `Sent password reset email to ${targetUser[0].firstName} ${targetUser[0].lastName}`,
          userId: adminUserId,
          userName: `${firstName} ${lastName}`,
        });

        return { success: true };
      } catch (error) {
        Sentry.captureException(error, {
          tags: { operation: "sendPasswordResetEmail" },
          extra: {
            userId: input.userId,
            email: targetUser[0].email,
          },
        });
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to send password reset email",
        });
      }
    }),
});
