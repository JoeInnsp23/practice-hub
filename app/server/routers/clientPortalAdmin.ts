import crypto from "node:crypto";
import * as Sentry from "@sentry/nextjs";
import { TRPCError } from "@trpc/server";
import { and, eq, inArray, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import {
  activityLogs,
  clientPortalAccess,
  clientPortalInvitations,
  clientPortalUsers,
  clients,
} from "@/lib/db/schema";
import { sendClientPortalInvitationEmail } from "@/lib/email/send-client-portal-invitation";
import { adminProcedure, router } from "../trpc";

// Type definition for client access JSON structure
interface ClientAccessJson {
  id: string;
  clientId: string;
  clientName: string;
  role: string;
  isActive: boolean;
  expiresAt: Date | null;
  grantedAt: Date;
  grantedBy: string | null;
}

export const clientPortalAdminRouter = router({
  // ==================== INVITATIONS ====================

  // Send invitation to new client portal user
  sendInvitation: adminProcedure
    .input(
      z.object({
        email: z.string().email(),
        firstName: z.string().min(1),
        lastName: z.string().min(1),
        clientIds: z.array(z.string().uuid()).min(1),
        role: z.enum(["viewer", "editor", "admin"]),
        message: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { tenantId, userId, firstName, lastName } = ctx.authContext;

      // Check if email already exists
      const existingUser = await db
        .select()
        .from(clientPortalUsers)
        .where(
          and(
            eq(clientPortalUsers.email, input.email),
            eq(clientPortalUsers.tenantId, tenantId),
          ),
        )
        .limit(1);

      if (existingUser.length > 0) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "A portal user with this email already exists",
        });
      }

      // Check if invitation already exists and is pending
      const existingInvitation = await db
        .select()
        .from(clientPortalInvitations)
        .where(
          and(
            eq(clientPortalInvitations.email, input.email),
            eq(clientPortalInvitations.tenantId, tenantId),
            eq(clientPortalInvitations.status, "pending"),
          ),
        )
        .limit(1);

      if (existingInvitation.length > 0) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "A pending invitation for this email already exists",
        });
      }

      // Generate secure token
      const token = crypto.randomBytes(32).toString("hex");

      // Create invitation
      const [invitation] = await db
        .insert(clientPortalInvitations)
        .values({
          tenantId,
          email: input.email,
          firstName: input.firstName,
          lastName: input.lastName,
          clientIds: input.clientIds,
          role: input.role,
          token,
          invitedBy: userId,
          status: "pending",
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
          metadata: input.message ? { message: input.message } : null,
        })
        .returning();

      // Get client names for email
      const clientsList = await db
        .select({ name: clients.name })
        .from(clients)
        .where(inArray(clients.id, input.clientIds));

      // Send invitation email
      try {
        await sendClientPortalInvitationEmail({
          email: input.email,
          firstName: input.firstName,
          lastName: input.lastName,
          invitedBy: `${firstName} ${lastName}`,
          clientNames: clientsList.map((c) => c.name),
          invitationLink: `${process.env.NEXT_PUBLIC_BETTER_AUTH_URL}/portal/accept/${token}`,
          expiresAt: invitation.expiresAt,
          customMessage: input.message,
        });
      } catch (error) {
        Sentry.captureException(error, {
          tags: { operation: "sendClientPortalInvitation" },
          extra: {
            email: input.email,
            clientIds: input.clientIds,
            role: input.role,
          },
        });
        // Don't throw - invitation is still created
      }

      // Log activity
      await db.insert(activityLogs).values({
        tenantId,
        entityType: "client_portal_invitation",
        entityId: invitation.id,
        action: "invitation.sent",
        description: `Sent client portal invitation to ${input.email}`,
        userId,
        userName: `${firstName} ${lastName}`,
        metadata: {
          email: input.email,
          clientIds: input.clientIds,
        },
      });

      return { invitation };
    }),

  // List all invitations
  listInvitations: adminProcedure
    .input(
      z
        .object({
          status: z
            .enum(["pending", "accepted", "expired", "revoked"])
            .optional(),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      const { tenantId } = ctx.authContext;

      // Build filter conditions
      const conditions = [eq(clientPortalInvitations.tenantId, tenantId)];

      if (input?.status) {
        conditions.push(eq(clientPortalInvitations.status, input.status));
      }

      const results = await db
        .select({
          id: clientPortalInvitations.id,
          email: clientPortalInvitations.email,
          firstName: clientPortalInvitations.firstName,
          lastName: clientPortalInvitations.lastName,
          clientIds: clientPortalInvitations.clientIds,
          role: clientPortalInvitations.role,
          status: clientPortalInvitations.status,
          sentAt: clientPortalInvitations.sentAt,
          expiresAt: clientPortalInvitations.expiresAt,
          acceptedAt: clientPortalInvitations.acceptedAt,
          revokedAt: clientPortalInvitations.revokedAt,
        })
        .from(clientPortalInvitations)
        .where(and(...conditions))
        .orderBy(sql`${clientPortalInvitations.sentAt} DESC`);

      return results;
    }),

  // Resend invitation
  resendInvitation: adminProcedure
    .input(z.object({ invitationId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const { tenantId, userId, firstName, lastName } = ctx.authContext;

      const [invitation] = await db
        .select()
        .from(clientPortalInvitations)
        .where(
          and(
            eq(clientPortalInvitations.id, input.invitationId),
            eq(clientPortalInvitations.tenantId, tenantId),
          ),
        )
        .limit(1);

      if (!invitation) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Invitation not found",
        });
      }

      if (invitation.status !== "pending") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Can only resend pending invitations",
        });
      }

      // Generate new token and extend expiration
      const newToken = crypto.randomBytes(32).toString("hex");
      const newExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      await db
        .update(clientPortalInvitations)
        .set({
          token: newToken,
          expiresAt: newExpiresAt,
          sentAt: new Date(),
        })
        .where(eq(clientPortalInvitations.id, input.invitationId));

      // Get client names
      const clientIds = invitation.clientIds as string[];
      const clientsList = await db
        .select({ name: clients.name })
        .from(clients)
        .where(inArray(clients.id, clientIds));

      // Resend email
      try {
        await sendClientPortalInvitationEmail({
          email: invitation.email,
          firstName: invitation.firstName || "",
          lastName: invitation.lastName || "",
          invitedBy: `${firstName} ${lastName}`,
          clientNames: clientsList.map((c) => c.name),
          invitationLink: `${process.env.NEXT_PUBLIC_BETTER_AUTH_URL}/portal/accept/${newToken}`,
          expiresAt: newExpiresAt,
        });
      } catch (error) {
        Sentry.captureException(error, {
          tags: { operation: "resendClientPortalInvitation" },
          extra: {
            invitationId: input.invitationId,
            email: invitation.email,
          },
        });
      }

      // Log activity
      await db.insert(activityLogs).values({
        tenantId,
        entityType: "client_portal_invitation",
        entityId: invitation.id,
        action: "invitation.resent",
        description: `Resent client portal invitation to ${invitation.email}`,
        userId,
        userName: `${firstName} ${lastName}`,
      });

      return { success: true };
    }),

  // Revoke invitation
  revokeInvitation: adminProcedure
    .input(z.object({ invitationId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const { tenantId, userId, firstName, lastName } = ctx.authContext;

      const [invitation] = await db
        .select()
        .from(clientPortalInvitations)
        .where(
          and(
            eq(clientPortalInvitations.id, input.invitationId),
            eq(clientPortalInvitations.tenantId, tenantId),
          ),
        )
        .limit(1);

      if (!invitation) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Invitation not found",
        });
      }

      if (invitation.status !== "pending") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Can only revoke pending invitations",
        });
      }

      // Update status
      await db
        .update(clientPortalInvitations)
        .set({
          status: "revoked",
          revokedAt: new Date(),
          revokedBy: userId,
        })
        .where(eq(clientPortalInvitations.id, input.invitationId));

      // Log activity
      await db.insert(activityLogs).values({
        tenantId,
        entityType: "client_portal_invitation",
        entityId: invitation.id,
        action: "invitation.revoked",
        description: `Revoked client portal invitation for ${invitation.email}`,
        userId,
        userName: `${firstName} ${lastName}`,
      });

      return { success: true };
    }),

  // ==================== USER MANAGEMENT ====================

  // List all portal users
  listPortalUsers: adminProcedure.query(async ({ ctx }) => {
    const { tenantId } = ctx.authContext;

    // FIXED: Single query with aggregation instead of N+1 pattern
    // Was: 100 users = 101 queries (1 + 100)
    // Now: 100 users = 1 query (99% reduction)
    const usersWithAccess = await db
      .select({
        id: clientPortalUsers.id,
        email: clientPortalUsers.email,
        firstName: clientPortalUsers.firstName,
        lastName: clientPortalUsers.lastName,
        phone: clientPortalUsers.phone,
        status: clientPortalUsers.status,
        lastLoginAt: clientPortalUsers.lastLoginAt,
        invitedAt: clientPortalUsers.invitedAt,
        acceptedAt: clientPortalUsers.acceptedAt,
        createdAt: clientPortalUsers.createdAt,
        // Aggregate all client access into JSON array
        clientAccess: sql<ClientAccessJson[]>`
          COALESCE(
            json_agg(
              json_build_object(
                'id', ${clientPortalAccess.id},
                'clientId', ${clientPortalAccess.clientId},
                'clientName', ${clients.name},
                'role', ${clientPortalAccess.role},
                'isActive', ${clientPortalAccess.isActive},
                'expiresAt', ${clientPortalAccess.expiresAt},
                'grantedAt', ${clientPortalAccess.grantedAt},
                'grantedBy', ${clientPortalAccess.grantedBy}
              ) ORDER BY ${clients.name}
            ) FILTER (WHERE ${clientPortalAccess.id} IS NOT NULL),
            '[]'::json
          )
        `.as("client_access"),
      })
      .from(clientPortalUsers)
      .leftJoin(
        clientPortalAccess,
        eq(clientPortalAccess.portalUserId, clientPortalUsers.id),
      )
      .leftJoin(clients, eq(clientPortalAccess.clientId, clients.id))
      .where(eq(clientPortalUsers.tenantId, tenantId))
      .groupBy(clientPortalUsers.id)
      .orderBy(sql`${clientPortalUsers.createdAt} DESC`);

    return usersWithAccess;
  }),

  // Grant client access to portal user
  grantAccess: adminProcedure
    .input(
      z.object({
        portalUserId: z.string(),
        clientId: z.string().uuid(),
        role: z.enum(["viewer", "editor", "admin"]),
        expiresAt: z.date().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { tenantId, userId, firstName, lastName } = ctx.authContext;

      // Check if access already exists
      const existingAccess = await db
        .select()
        .from(clientPortalAccess)
        .where(
          and(
            eq(clientPortalAccess.portalUserId, input.portalUserId),
            eq(clientPortalAccess.clientId, input.clientId),
          ),
        )
        .limit(1);

      if (existingAccess.length > 0) {
        // Update existing access
        await db
          .update(clientPortalAccess)
          .set({
            role: input.role,
            isActive: true,
            expiresAt: input.expiresAt || null,
          })
          .where(eq(clientPortalAccess.id, existingAccess[0].id));

        return { accessId: existingAccess[0].id };
      }

      // Create new access
      const [newAccess] = await db
        .insert(clientPortalAccess)
        .values({
          tenantId,
          portalUserId: input.portalUserId,
          clientId: input.clientId,
          role: input.role,
          grantedBy: userId,
          isActive: true,
          expiresAt: input.expiresAt || null,
        })
        .returning();

      // Log activity
      await db.insert(activityLogs).values({
        tenantId,
        entityType: "client_portal_access",
        entityId: newAccess.id,
        action: "access.granted",
        description: `Granted ${input.role} access to client`,
        userId,
        userName: `${firstName} ${lastName}`,
      });

      return { accessId: newAccess.id };
    }),

  // Revoke client access
  revokeAccess: adminProcedure
    .input(z.object({ accessId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const { tenantId, userId, firstName, lastName } = ctx.authContext;

      await db
        .update(clientPortalAccess)
        .set({ isActive: false })
        .where(
          and(
            eq(clientPortalAccess.id, input.accessId),
            eq(clientPortalAccess.tenantId, tenantId),
          ),
        );

      // Log activity
      await db.insert(activityLogs).values({
        tenantId,
        entityType: "client_portal_access",
        entityId: input.accessId,
        action: "access.revoked",
        description: "Revoked client access",
        userId,
        userName: `${firstName} ${lastName}`,
      });

      return { success: true };
    }),

  // Update role
  updateRole: adminProcedure
    .input(
      z.object({
        accessId: z.string().uuid(),
        role: z.enum(["viewer", "editor", "admin"]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { tenantId, userId, firstName, lastName } = ctx.authContext;

      await db
        .update(clientPortalAccess)
        .set({ role: input.role })
        .where(
          and(
            eq(clientPortalAccess.id, input.accessId),
            eq(clientPortalAccess.tenantId, tenantId),
          ),
        );

      // Log activity
      await db.insert(activityLogs).values({
        tenantId,
        entityType: "client_portal_access",
        entityId: input.accessId,
        action: "role.updated",
        description: `Updated role to ${input.role}`,
        userId,
        userName: `${firstName} ${lastName}`,
      });

      return { success: true };
    }),

  // Suspend portal user
  suspendUser: adminProcedure
    .input(z.object({ portalUserId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { tenantId, userId, firstName, lastName } = ctx.authContext;

      await db
        .update(clientPortalUsers)
        .set({ status: "suspended" })
        .where(
          and(
            eq(clientPortalUsers.id, input.portalUserId),
            eq(clientPortalUsers.tenantId, tenantId),
          ),
        );

      // Log activity
      await db.insert(activityLogs).values({
        tenantId,
        entityType: "client_portal_user",
        entityId: input.portalUserId,
        action: "user.suspended",
        description: "Suspended portal user",
        userId,
        userName: `${firstName} ${lastName}`,
      });

      return { success: true };
    }),

  // Reactivate portal user
  reactivateUser: adminProcedure
    .input(z.object({ portalUserId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { tenantId, userId, firstName, lastName } = ctx.authContext;

      await db
        .update(clientPortalUsers)
        .set({ status: "active" })
        .where(
          and(
            eq(clientPortalUsers.id, input.portalUserId),
            eq(clientPortalUsers.tenantId, tenantId),
          ),
        );

      // Log activity
      await db.insert(activityLogs).values({
        tenantId,
        entityType: "client_portal_user",
        entityId: input.portalUserId,
        action: "user.reactivated",
        description: "Reactivated portal user",
        userId,
        userName: `${firstName} ${lastName}`,
      });

      return { success: true };
    }),
});
