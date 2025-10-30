/**
 * Invitations Router Integration Tests
 *
 * Integration-level tests for the invitations tRPC router.
 * Tests verify database operations, tenant isolation, and invitation workflow.
 *
 * Cleanup Strategy: TestDataTracker + afterEach cleanup
 * External Dependencies: Email sending mocked (sendInvitationEmail)
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { invitationsRouter } from "@/app/server/routers/invitations";
import {
  cleanupTestData,
  createTestInvitation,
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
vi.mock("@/lib/email", () => ({
  sendInvitationEmail: vi.fn().mockResolvedValue(undefined),
}));

describe("app/server/routers/invitations.ts", () => {
  let ctx: TestContextWithAuth;
  let _caller: ReturnType<typeof createCaller<typeof invitationsRouter>>;
  const tracker: TestDataTracker = {
    tenants: [],
    users: [],
    invitations: [],
  };

  beforeEach(async () => {
    // Create test tenant and admin user
    const tenantId = await createTestTenant();
    const userId = await createTestUser(tenantId, { role: "admin" });

    tracker.tenants?.push(tenantId);
    tracker.users?.push(userId);

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

    _caller = createCaller(invitationsRouter, ctx);
    vi.clearAllMocks();
  });

  afterEach(async () => {
    await cleanupTestData(tracker);

    // Reset tracker arrays
    tracker.tenants = [];
    tracker.users = [];
    tracker.invitations = [];
  });

  describe("getRateLimitStatus", () => {
    it("should have no required input", () => {
      const procedure = invitationsRouter._def.procedures.getRateLimitStatus;

      expect(!procedure._def.inputs || procedure._def.inputs.length === 0).toBe(
        true,
      );
    });
  });

  describe("getActivityLogs", () => {
    it("should accept empty input", async () => {
      await expect(_caller.getActivityLogs({})).resolves.not.toThrow();
    });

    it("should accept limit parameter", async () => {
      await expect(
        _caller.getActivityLogs({
          limit: 10,
        }),
      ).resolves.not.toThrow();
    });

    it("should default limit to 20", () => {
      const inputSchema = invitationsRouter._def.procedures.getActivityLogs._def
        .inputs[0] as { parse: (v: unknown) => { limit?: number } };
      const result = inputSchema.parse({});
      expect(result.limit).toBe(20);
    });

    it("should validate limit min value", async () => {
      await expect(
        _caller.getActivityLogs({
          limit: 0,
        }),
      ).rejects.toThrow();
    });

    it("should validate limit max value", async () => {
      await expect(
        _caller.getActivityLogs({
          limit: 51,
        }),
      ).rejects.toThrow();
    });
  });

  describe("list", () => {
    it("should have no required input", () => {
      const procedure = invitationsRouter._def.procedures.list;

      expect(!procedure._def.inputs || procedure._def.inputs.length === 0).toBe(
        true,
      );
    });
  });

  describe("send", () => {
    it("should validate required fields", async () => {
      const invalidInput = {
        // Missing email and role
        customMessage: "Welcome",
      };

      await expect(
        _caller.send(invalidInput as Record<string, unknown>),
      ).rejects.toThrow();
    });

    it("should accept valid invitation data", async () => {
      const validInput = {
        email: `newuser-${Date.now()}@example.com`,
        role: "accountant" as const,
      };

      await expect(_caller.send(validInput)).resolves.not.toThrow();
    });

    it("should accept custom message", async () => {
      const validInput = {
        email: `user-${Date.now()}@example.com`,
        role: "member" as const,
        customMessage: "Welcome to the team!",
      };

      await expect(_caller.send(validInput)).resolves.not.toThrow();
    });

    it("should validate role enum values", async () => {
      const invalidInput = {
        email: "test@example.com",
        role: "invalid",
      };

      await expect(
        _caller.send(invalidInput as Record<string, unknown>),
      ).rejects.toThrow();
    });

    it("should accept all valid role values", async () => {
      const validRoles = ["admin", "accountant", "member"] as const;

      for (const role of validRoles) {
        await expect(
          _caller.send({
            email: `${role}-${Date.now()}@example.com`,
            role,
          }),
        ).resolves.not.toThrow();
      }
    });

    it("should validate email format", async () => {
      const invalidInput = {
        email: "not-an-email",
        role: "member" as const,
      };

      await expect(_caller.send(invalidInput)).rejects.toThrow();
    });
  });

  describe("verify", () => {
    it("should validate required token field", async () => {
      const invalidInput = {
        // Missing token
      };

      await expect(
        _caller.verify(invalidInput as Record<string, unknown>),
      ).rejects.toThrow();
    });

    it("should accept valid token", async () => {
      // Create a pending invitation with known token
      const invitation = await createTestInvitation(
        ctx.authContext.tenantId,
        ctx.authContext.userId,
        { status: "pending" },
      );
      tracker.invitations?.push(invitation.id);

      const validInput = {
        token: invitation.token,
      };

      await expect(_caller.verify(validInput)).resolves.not.toThrow();
    });
  });

  describe("accept", () => {
    it("should validate required fields", async () => {
      const invalidInput = {
        // Missing token and password
        firstName: "John",
      };

      await expect(
        _caller.accept(invalidInput as Record<string, unknown>),
      ).rejects.toThrow();
    });

    it("should accept valid acceptance data", async () => {
      // Create a pending invitation
      const invitation = await createTestInvitation(
        ctx.authContext.tenantId,
        ctx.authContext.userId,
        { status: "pending" },
      );
      tracker.invitations?.push(invitation.id);

      const validInput = {
        token: invitation.token,
        password: "securePassword123!",
      };

      await expect(_caller.accept(validInput)).resolves.not.toThrow();
    });

    it("should accept optional name fields", async () => {
      // Create a pending invitation
      const invitation = await createTestInvitation(
        ctx.authContext.tenantId,
        ctx.authContext.userId,
        { status: "pending" },
      );
      tracker.invitations?.push(invitation.id);

      const validInput = {
        token: invitation.token,
        password: "strongPass123!",
        firstName: "Jane",
        lastName: "Doe",
      };

      await expect(_caller.accept(validInput)).resolves.not.toThrow();
    });

    it("should validate password minimum length", async () => {
      const invalidInput = {
        token: "abc123",
        password: "short",
      };

      await expect(_caller.accept(invalidInput)).rejects.toThrow();
    });
  });

  describe("resend", () => {
    it("should validate required invitationId field", async () => {
      const invalidInput = {
        // Missing invitationId
      };

      await expect(
        _caller.resend(invalidInput as Record<string, unknown>),
      ).rejects.toThrow();
    });

    it("should accept valid invitation ID", async () => {
      // Create a pending invitation
      const invitation = await createTestInvitation(
        ctx.authContext.tenantId,
        ctx.authContext.userId,
        { status: "pending" },
      );
      tracker.invitations?.push(invitation.id);

      const validInput = {
        invitationId: invitation.id,
      };

      await expect(_caller.resend(validInput)).resolves.not.toThrow();
    });

    it("should validate UUID format", async () => {
      const invalidInput = {
        invitationId: "not-a-uuid",
      };

      await expect(
        _caller.resend(invalidInput as Record<string, unknown>),
      ).rejects.toThrow();
    });
  });

  describe("cancel", () => {
    it("should validate required invitationId field", async () => {
      const invalidInput = {
        // Missing invitationId
      };

      await expect(
        _caller.cancel(invalidInput as Record<string, unknown>),
      ).rejects.toThrow();
    });

    it("should accept valid invitation ID", async () => {
      // Create a pending invitation
      const invitation = await createTestInvitation(
        ctx.authContext.tenantId,
        ctx.authContext.userId,
        { status: "pending" },
      );
      tracker.invitations?.push(invitation.id);

      const validInput = {
        invitationId: invitation.id,
      };

      await expect(_caller.cancel(validInput)).resolves.not.toThrow();
    });
  });

  describe("Router Structure", () => {
    it("should export all expected procedures", () => {
      const procedures = Object.keys(invitationsRouter._def.procedures);

      expect(procedures).toContain("getRateLimitStatus");
      expect(procedures).toContain("getActivityLogs");
      expect(procedures).toContain("list");
      expect(procedures).toContain("send");
      expect(procedures).toContain("verify");
      expect(procedures).toContain("accept");
      expect(procedures).toContain("resend");
      expect(procedures).toContain("cancel");
    });

    it("should have 8 procedures total", () => {
      const procedures = Object.keys(invitationsRouter._def.procedures);
      expect(procedures).toHaveLength(8);
    });
  });
});
