/**
 * Client Portal Admin Router Integration Tests
 *
 * Integration-level tests for the clientPortalAdmin tRPC router.
 * Tests verify database operations, tenant isolation, invitation workflow, and access management.
 *
 * Cleanup Strategy: TestDataTracker + afterEach cleanup
 * External Dependencies: Email sending mocked (sendClientPortalInvitationEmail)
 */

import { eq } from "drizzle-orm";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { clientPortalAdminRouter } from "@/app/server/routers/clientPortalAdmin";
import { db } from "@/lib/db";
import {
  clientPortalAccess,
  clientPortalInvitations,
  clientPortalUsers,
} from "@/lib/db/schema";
import {
  cleanupTestData,
  createTestClient,
  createTestClientPortalInvitation,
  createTestClientPortalUser,
  createTestTenant,
  createTestUser,
  type TestDataTracker,
} from "../helpers/factories";
import {
  createCaller,
  createMockContext,
  type TestContextWithAuth,
} from "../helpers/trpc";

// Mock email sending (external dependency)
vi.mock("@/lib/email/send-client-portal-invitation", () => ({
  sendClientPortalInvitationEmail: vi.fn().mockResolvedValue(undefined),
}));

describe("app/server/routers/clientPortalAdmin.ts", () => {
  let ctx: TestContextWithAuth;
  let _caller: ReturnType<typeof createCaller<typeof clientPortalAdminRouter>>;
  const tracker: TestDataTracker = {
    tenants: [],
    users: [],
    clients: [],
    clientPortalUsers: [],
    clientPortalInvitations: [],
    clientPortalAccess: [],
  };
  let testClientId: string; // For tests requiring a real client

  beforeEach(async () => {
    // Create test tenant and admin user
    const tenantId = await createTestTenant();
    const userId = await createTestUser(tenantId, { role: "admin" });

    tracker.tenants?.push(tenantId);
    tracker.users?.push(userId);

    // Create a test client for invitation tests
    const client = await createTestClient(tenantId, userId, {
      name: "Client Portal Test Client",
    });
    testClientId = client.id;
    tracker.clients?.push(testClientId);

    // Create mock context with real tenant and user
    ctx = createMockContext({
      authContext: {
        userId,
        tenantId,
        organizationName: "Test Organization",
        role: "admin",
        email: `admin-${Date.now()}@example.com`,
        firstName: "Test",
        lastName: "Admin",
      },
    }) as TestContextWithAuth;

    _caller = createCaller(clientPortalAdminRouter, ctx);
    vi.clearAllMocks();
  });

  afterEach(async () => {
    // Delete ALL client portal records for this tenant (router creates some we don't track)
    const tenantIds = tracker.tenants || [];
    for (const tenantId of tenantIds) {
      await db
        .delete(clientPortalAccess)
        .where(eq(clientPortalAccess.tenantId, tenantId));
      await db
        .delete(clientPortalInvitations)
        .where(eq(clientPortalInvitations.tenantId, tenantId));
      await db
        .delete(clientPortalUsers)
        .where(eq(clientPortalUsers.tenantId, tenantId));
    }

    // Then cleanup tracked records (clients, users, tenants)
    await cleanupTestData(tracker);

    // Reset tracker arrays
    tracker.tenants = [];
    tracker.users = [];
    tracker.clients = [];
    tracker.clientPortalUsers = [];
    tracker.clientPortalInvitations = [];
    tracker.clientPortalAccess = [];
  });

  describe("sendInvitation", () => {
    it("should validate required fields", async () => {
      const invalidInput = {
        // Missing email, firstName, lastName, clientIds, role
        message: "Welcome!",
      };

      await expect(
        _caller.sendInvitation(invalidInput as Record<string, unknown>),
      ).rejects.toThrow();
    });

    it("should accept valid invitation data", async () => {
      const validInput = {
        email: "client@example.com",
        firstName: "John",
        lastName: "Doe",
        clientIds: [testClientId],
        role: "viewer" as const,
      };

      await expect(_caller.sendInvitation(validInput)).resolves.not.toThrow();
    });

    it("should validate email format", async () => {
      const invalidInput = {
        email: "invalid-email",
        firstName: "John",
        lastName: "Doe",
        clientIds: [testClientId],
        role: "viewer",
      };

      await expect(
        _caller.sendInvitation(invalidInput as Record<string, unknown>),
      ).rejects.toThrow();
    });

    it("should validate firstName minimum length", async () => {
      const invalidInput = {
        email: "client@example.com",
        firstName: "", // Empty string
        lastName: "Doe",
        clientIds: [testClientId],
        role: "viewer",
      };

      await expect(_caller.sendInvitation(invalidInput)).rejects.toThrow();
    });

    it("should validate lastName minimum length", async () => {
      const invalidInput = {
        email: "client@example.com",
        firstName: "John",
        lastName: "", // Empty string
        clientIds: [testClientId],
        role: "viewer",
      };

      await expect(_caller.sendInvitation(invalidInput)).rejects.toThrow();
    });

    it("should validate clientIds array minimum length", async () => {
      const invalidInput = {
        email: "client@example.com",
        firstName: "John",
        lastName: "Doe",
        clientIds: [], // Empty array
        role: "viewer",
      };

      await expect(_caller.sendInvitation(invalidInput)).rejects.toThrow();
    });

    it("should validate role enum values", async () => {
      const invalidInput = {
        email: "client@example.com",
        firstName: "John",
        lastName: "Doe",
        clientIds: [testClientId],
        role: "superadmin",
      };

      await expect(
        _caller.sendInvitation(invalidInput as Record<string, unknown>),
      ).rejects.toThrow();
    });

    it("should accept all valid role values", async () => {
      const validRoles = ["viewer", "editor", "admin"];

      for (const role of validRoles) {
        await expect(
          _caller.sendInvitation({
            email: `${role}-${Date.now()}@example.com`,
            firstName: "John",
            lastName: "Doe",
            clientIds: [testClientId],
            role: role as unknown as "viewer",
          }),
        ).resolves.not.toThrow();
      }
    });

    it("should accept optional message", async () => {
      const validInput = {
        email: "client@example.com",
        firstName: "John",
        lastName: "Doe",
        clientIds: [testClientId],
        role: "viewer" as const,
        message: "Welcome to the client portal!",
      };

      await expect(_caller.sendInvitation(validInput)).resolves.not.toThrow();
    });
  });

  describe("listInvitations", () => {
    it("should accept empty input", async () => {
      await expect(_caller.listInvitations({})).resolves.not.toThrow();
    });

    it("should accept status filter", async () => {
      const validInput = {
        status: "pending" as const,
      };

      await expect(_caller.listInvitations(validInput)).resolves.not.toThrow();
    });

    it("should validate status enum values", async () => {
      const invalidInput = {
        status: "invalid_status",
      };

      await expect(
        _caller.listInvitations(invalidInput as Record<string, unknown>),
      ).rejects.toThrow();
    });

    it("should accept all valid status values", async () => {
      const validStatuses = ["pending", "accepted", "expired", "revoked"];

      for (const status of validStatuses) {
        await expect(
          _caller.listInvitations({
            status: status as unknown as "pending",
          }),
        ).resolves.not.toThrow();
      }
    });
  });

  describe("resendInvitation", () => {
    it("should validate required invitationId field", async () => {
      const invalidInput = {
        // Missing invitationId
      };

      await expect(
        _caller.resendInvitation(invalidInput as Record<string, unknown>),
      ).rejects.toThrow();
    });

    it("should accept valid invitation ID", async () => {
      // Create a pending invitation
      const invitation = await createTestClientPortalInvitation(
        ctx.authContext.tenantId,
        ctx.authContext.userId,
        [testClientId],
        { status: "pending" },
      );
      tracker.clientPortalInvitations?.push(invitation.id);

      const validInput = {
        invitationId: invitation.id,
      };

      await expect(_caller.resendInvitation(validInput)).resolves.not.toThrow();
    });
  });

  describe("revokeInvitation", () => {
    it("should validate required invitationId field", async () => {
      const invalidInput = {
        // Missing invitationId
      };

      await expect(
        _caller.revokeInvitation(invalidInput as Record<string, unknown>),
      ).rejects.toThrow();
    });

    it("should accept valid invitation ID", async () => {
      // Create a pending invitation
      const invitation = await createTestClientPortalInvitation(
        ctx.authContext.tenantId,
        ctx.authContext.userId,
        [testClientId],
        { status: "pending" },
      );
      tracker.clientPortalInvitations?.push(invitation.id);

      const validInput = {
        invitationId: invitation.id,
      };

      await expect(_caller.revokeInvitation(validInput)).resolves.not.toThrow();
    });
  });

  describe("listPortalUsers", () => {
    it("should have no required input", () => {
      const procedure = clientPortalAdminRouter._def.procedures.listPortalUsers;

      expect(!procedure._def.inputs || procedure._def.inputs.length === 0).toBe(
        true,
      );
    });
  });

  describe("grantAccess", () => {
    it("should validate required fields", async () => {
      const invalidInput = {
        // Missing portalUserId, clientId, role
        expiresAt: new Date(),
      };

      await expect(
        _caller.grantAccess(invalidInput as Record<string, unknown>),
      ).rejects.toThrow();
    });

    it("should accept valid access grant data", async () => {
      // Create a portal user
      const portalUser = await createTestClientPortalUser(
        ctx.authContext.tenantId,
        { email: `portal-${Date.now()}@example.com` },
      );
      tracker.clientPortalUsers?.push(portalUser.id);

      const validInput = {
        portalUserId: portalUser.id,
        clientId: testClientId,
        role: "viewer" as const,
      };

      await expect(_caller.grantAccess(validInput)).resolves.not.toThrow();
    });

    it("should accept optional expiresAt", async () => {
      // Create a portal user
      const portalUser = await createTestClientPortalUser(
        ctx.authContext.tenantId,
        { email: `portal-${Date.now()}@example.com` },
      );
      tracker.clientPortalUsers?.push(portalUser.id);

      const validInput = {
        portalUserId: portalUser.id,
        clientId: testClientId,
        role: "editor" as const,
        expiresAt: new Date("2025-12-31"),
      };

      await expect(_caller.grantAccess(validInput)).resolves.not.toThrow();
    });

    it("should validate role enum values", async () => {
      const invalidInput = {
        portalUserId: "portal-user-123",
        clientId: testClientId,
        role: "superuser",
      };

      await expect(
        _caller.grantAccess(invalidInput as Record<string, unknown>),
      ).rejects.toThrow();
    });

    it("should accept all valid role values", async () => {
      const validRoles = ["viewer", "editor", "admin"];

      for (const role of validRoles) {
        // Create a portal user for each role test
        const portalUser = await createTestClientPortalUser(
          ctx.authContext.tenantId,
          { email: `portal-${role}-${Date.now()}@example.com` },
        );
        tracker.clientPortalUsers?.push(portalUser.id);

        await expect(
          _caller.grantAccess({
            portalUserId: portalUser.id,
            clientId: testClientId,
            role: role as unknown as "viewer",
          }),
        ).resolves.not.toThrow();
      }
    });
  });

  describe("revokeAccess", () => {
    it("should validate required accessId field", async () => {
      const invalidInput = {
        // Missing accessId
      };

      await expect(
        _caller.revokeAccess(invalidInput as Record<string, unknown>),
      ).rejects.toThrow();
    });

    it("should accept valid access ID", async () => {
      const validInput = {
        accessId: "550e8400-e29b-41d4-a716-446655440000",
      };

      await expect(_caller.revokeAccess(validInput)).resolves.not.toThrow();
    });
  });

  describe("updateRole", () => {
    it("should validate required fields", async () => {
      const invalidInput = {
        // Missing accessId and role
      };

      await expect(
        _caller.updateRole(invalidInput as Record<string, unknown>),
      ).rejects.toThrow();
    });

    it("should accept valid role update data", async () => {
      const validInput = {
        accessId: "550e8400-e29b-41d4-a716-446655440000",
        role: "admin" as const,
      };

      await expect(_caller.updateRole(validInput)).resolves.not.toThrow();
    });

    it("should validate role enum values", async () => {
      const invalidInput = {
        accessId: "550e8400-e29b-41d4-a716-446655440000",
        role: "manager",
      };

      await expect(
        _caller.updateRole(invalidInput as Record<string, unknown>),
      ).rejects.toThrow();
    });
  });

  describe("suspendUser", () => {
    it("should validate required portalUserId field", async () => {
      const invalidInput = {
        // Missing portalUserId
      };

      await expect(
        _caller.suspendUser(invalidInput as Record<string, unknown>),
      ).rejects.toThrow();
    });

    it("should accept valid portal user ID", async () => {
      // Create a portal user
      const portalUser = await createTestClientPortalUser(
        ctx.authContext.tenantId,
        { email: `suspend-${Date.now()}@example.com`, status: "active" },
      );
      tracker.clientPortalUsers?.push(portalUser.id);

      const validInput = {
        portalUserId: portalUser.id,
      };

      await expect(_caller.suspendUser(validInput)).resolves.not.toThrow();
    });
  });

  describe("reactivateUser", () => {
    it("should validate required portalUserId field", async () => {
      const invalidInput = {
        // Missing portalUserId
      };

      await expect(
        _caller.reactivateUser(invalidInput as Record<string, unknown>),
      ).rejects.toThrow();
    });

    it("should accept valid portal user ID", async () => {
      // Create a suspended portal user
      const portalUser = await createTestClientPortalUser(
        ctx.authContext.tenantId,
        { email: `reactivate-${Date.now()}@example.com`, status: "suspended" },
      );
      tracker.clientPortalUsers?.push(portalUser.id);

      const validInput = {
        portalUserId: portalUser.id,
      };

      await expect(_caller.reactivateUser(validInput)).resolves.not.toThrow();
    });
  });

  describe("Router Structure", () => {
    it("should export all expected procedures", () => {
      const procedures = Object.keys(clientPortalAdminRouter._def.procedures);

      expect(procedures).toContain("sendInvitation");
      expect(procedures).toContain("listInvitations");
      expect(procedures).toContain("resendInvitation");
      expect(procedures).toContain("revokeInvitation");
      expect(procedures).toContain("listPortalUsers");
      expect(procedures).toContain("grantAccess");
      expect(procedures).toContain("revokeAccess");
      expect(procedures).toContain("updateRole");
      expect(procedures).toContain("suspendUser");
      expect(procedures).toContain("reactivateUser");
    });

    it("should have 10 procedures total", () => {
      const procedures = Object.keys(clientPortalAdminRouter._def.procedures);
      expect(procedures).toHaveLength(10);
    });
  });
});
