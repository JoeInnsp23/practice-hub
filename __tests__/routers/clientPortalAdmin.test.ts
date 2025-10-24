/**
 * Client Portal Admin Router Tests
 *
 * Tests for the clientPortalAdmin tRPC router
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TestContextWithAuth } from "@/app/server/context";
import { clientPortalAdminRouter } from "@/app/server/routers/clientPortalAdmin";
import {
  createCaller,
  createMockContext,
} from "../helpers/trpc";

// Mock the database
vi.mock("@/lib/db", () => ({
  db: {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
    values: vi.fn().mockReturnThis(),
    returning: vi.fn().mockResolvedValue([]),
    innerJoin: vi.fn().mockReturnThis(),
    $dynamic: vi.fn().mockReturnThis(),
  },
}));

// Mock email sending
vi.mock("@/lib/email/send-client-portal-invitation", () => ({
  sendClientPortalInvitationEmail: vi.fn().mockResolvedValue(undefined),
}));

describe("app/server/routers/clientPortalAdmin.ts", () => {
  let ctx: TestContextWithAuth;
  let _caller: ReturnType<typeof createCaller<typeof clientPortalAdminRouter>>;

  beforeEach(() => {
    ctx = createMockContext();
    ctx.authContext.role = "admin"; // Admin router requires admin role
    _caller = createCaller(clientPortalAdminRouter, ctx);
    vi.clearAllMocks();
  });

  describe("sendInvitation", () => {
    it("should validate required fields", async () => {
      const invalidInput = {
        // Missing email, firstName, lastName, clientIds, role
        message: "Welcome!",
      };

      await expect(
        _caller.sendInvitation(invalidInput as any),
      ).rejects.toThrow();
    });

    it("should accept valid invitation data", async () => {
      const validInput = {
        email: "client@example.com",
        firstName: "John",
        lastName: "Doe",
        clientIds: ["550e8400-e29b-41d4-a716-446655440000"],
        role: "viewer" as const,
      };

      await expect(_caller.sendInvitation(validInput)).resolves.not.toThrow();
    });

    it("should validate email format", async () => {
      const invalidInput = {
        email: "invalid-email",
        firstName: "John",
        lastName: "Doe",
        clientIds: ["550e8400-e29b-41d4-a716-446655440000"],
        role: "viewer",
      };

      await expect(
        _caller.sendInvitation(invalidInput as any),
      ).rejects.toThrow();
    });

    it("should validate firstName minimum length", async () => {
      const invalidInput = {
        email: "client@example.com",
        firstName: "", // Empty string
        lastName: "Doe",
        clientIds: ["550e8400-e29b-41d4-a716-446655440000"],
        role: "viewer",
      };

      await expect(_caller.sendInvitation(invalidInput)).rejects.toThrow();
    });

    it("should validate lastName minimum length", async () => {
      const invalidInput = {
        email: "client@example.com",
        firstName: "John",
        lastName: "", // Empty string
        clientIds: ["550e8400-e29b-41d4-a716-446655440000"],
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
        clientIds: ["550e8400-e29b-41d4-a716-446655440000"],
        role: "superadmin",
      };

      await expect(
        _caller.sendInvitation(invalidInput as any),
      ).rejects.toThrow();
    });

    it("should accept all valid role values", async () => {
      const validRoles = ["viewer", "editor", "admin"];

      for (const role of validRoles) {
        await expect(
          _caller.sendInvitation({
            email: "client@example.com",
            firstName: "John",
            lastName: "Doe",
            clientIds: ["550e8400-e29b-41d4-a716-446655440000"],
            role: role as any,
          }),
        ).resolves.not.toThrow();
      }
    });

    it("should accept optional message", async () => {
      const validInput = {
        email: "client@example.com",
        firstName: "John",
        lastName: "Doe",
        clientIds: ["550e8400-e29b-41d4-a716-446655440000"],
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
        _caller.listInvitations(invalidInput as any),
      ).rejects.toThrow();
    });

    it("should accept all valid status values", async () => {
      const validStatuses = ["pending", "accepted", "expired", "revoked"];

      for (const status of validStatuses) {
        await expect(
          _caller.listInvitations({
            status: status as any,
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
        _caller.resendInvitation(invalidInput as any),
      ).rejects.toThrow();
    });

    it("should accept valid invitation ID", async () => {
      const validInput = {
        invitationId: "550e8400-e29b-41d4-a716-446655440000",
      };

      await expect(
        _caller.resendInvitation(validInput),
      ).resolves.not.toThrow();
    });
  });

  describe("revokeInvitation", () => {
    it("should validate required invitationId field", async () => {
      const invalidInput = {
        // Missing invitationId
      };

      await expect(
        _caller.revokeInvitation(invalidInput as any),
      ).rejects.toThrow();
    });

    it("should accept valid invitation ID", async () => {
      const validInput = {
        invitationId: "550e8400-e29b-41d4-a716-446655440000",
      };

      await expect(
        _caller.revokeInvitation(validInput),
      ).resolves.not.toThrow();
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

      await expect(_caller.grantAccess(invalidInput as any)).rejects.toThrow();
    });

    it("should accept valid access grant data", async () => {
      const validInput = {
        portalUserId: "portal-user-123",
        clientId: "550e8400-e29b-41d4-a716-446655440000",
        role: "viewer" as const,
      };

      await expect(_caller.grantAccess(validInput)).resolves.not.toThrow();
    });

    it("should accept optional expiresAt", async () => {
      const validInput = {
        portalUserId: "portal-user-123",
        clientId: "550e8400-e29b-41d4-a716-446655440000",
        role: "editor" as const,
        expiresAt: new Date("2025-12-31"),
      };

      await expect(_caller.grantAccess(validInput)).resolves.not.toThrow();
    });

    it("should validate role enum values", async () => {
      const invalidInput = {
        portalUserId: "portal-user-123",
        clientId: "550e8400-e29b-41d4-a716-446655440000",
        role: "superuser",
      };

      await expect(_caller.grantAccess(invalidInput as any)).rejects.toThrow();
    });

    it("should accept all valid role values", async () => {
      const validRoles = ["viewer", "editor", "admin"];

      for (const role of validRoles) {
        await expect(
          _caller.grantAccess({
            portalUserId: "portal-user-123",
            clientId: "550e8400-e29b-41d4-a716-446655440000",
            role: role as any,
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

      await expect(_caller.revokeAccess(invalidInput as any)).rejects.toThrow();
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

      await expect(_caller.updateRole(invalidInput as any)).rejects.toThrow();
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

      await expect(_caller.updateRole(invalidInput as any)).rejects.toThrow();
    });
  });

  describe("suspendUser", () => {
    it("should validate required portalUserId field", async () => {
      const invalidInput = {
        // Missing portalUserId
      };

      await expect(_caller.suspendUser(invalidInput as any)).rejects.toThrow();
    });

    it("should accept valid portal user ID", async () => {
      const validInput = {
        portalUserId: "portal-user-123",
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
        _caller.reactivateUser(invalidInput as any),
      ).rejects.toThrow();
    });

    it("should accept valid portal user ID", async () => {
      const validInput = {
        portalUserId: "portal-user-123",
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
