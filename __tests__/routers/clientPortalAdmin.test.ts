/**
 * Client Portal Admin Router Tests
 *
 * Tests for the clientPortalAdmin tRPC router
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Context } from "@/app/server/context";
import { clientPortalAdminRouter } from "@/app/server/routers/clientPortalAdmin";
import { createCaller, createMockContext } from "../helpers/trpc";

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
  let ctx: Context;
  let _caller: ReturnType<typeof createCaller<typeof clientPortalAdminRouter>>;

  beforeEach(() => {
    ctx = createMockContext();
    ctx.authContext.role = "admin"; // Admin router requires admin role
    _caller = createCaller(clientPortalAdminRouter, ctx);
    vi.clearAllMocks();
  });

  describe("sendInvitation", () => {
    it("should validate required fields", () => {
      const invalidInput = {
        // Missing email, firstName, lastName, clientIds, role
        message: "Welcome!",
      };

      expect(() => {
        clientPortalAdminRouter._def.procedures.sendInvitation._def.inputs[0]?.parse(
          invalidInput,
        );
      }).toThrow();
    });

    it("should accept valid invitation data", () => {
      const validInput = {
        email: "client@example.com",
        firstName: "John",
        lastName: "Doe",
        clientIds: ["550e8400-e29b-41d4-a716-446655440000"],
        role: "viewer" as const,
      };

      expect(() => {
        clientPortalAdminRouter._def.procedures.sendInvitation._def.inputs[0]?.parse(
          validInput,
        );
      }).not.toThrow();
    });

    it("should validate email format", () => {
      const invalidInput = {
        email: "invalid-email",
        firstName: "John",
        lastName: "Doe",
        clientIds: ["550e8400-e29b-41d4-a716-446655440000"],
        role: "viewer",
      };

      expect(() => {
        clientPortalAdminRouter._def.procedures.sendInvitation._def.inputs[0]?.parse(
          invalidInput,
        );
      }).toThrow();
    });

    it("should validate firstName minimum length", () => {
      const invalidInput = {
        email: "client@example.com",
        firstName: "", // Empty string
        lastName: "Doe",
        clientIds: ["550e8400-e29b-41d4-a716-446655440000"],
        role: "viewer",
      };

      expect(() => {
        clientPortalAdminRouter._def.procedures.sendInvitation._def.inputs[0]?.parse(
          invalidInput,
        );
      }).toThrow();
    });

    it("should validate lastName minimum length", () => {
      const invalidInput = {
        email: "client@example.com",
        firstName: "John",
        lastName: "", // Empty string
        clientIds: ["550e8400-e29b-41d4-a716-446655440000"],
        role: "viewer",
      };

      expect(() => {
        clientPortalAdminRouter._def.procedures.sendInvitation._def.inputs[0]?.parse(
          invalidInput,
        );
      }).toThrow();
    });

    it("should validate clientIds array minimum length", () => {
      const invalidInput = {
        email: "client@example.com",
        firstName: "John",
        lastName: "Doe",
        clientIds: [], // Empty array
        role: "viewer",
      };

      expect(() => {
        clientPortalAdminRouter._def.procedures.sendInvitation._def.inputs[0]?.parse(
          invalidInput,
        );
      }).toThrow();
    });

    it("should validate role enum values", () => {
      const invalidInput = {
        email: "client@example.com",
        firstName: "John",
        lastName: "Doe",
        clientIds: ["550e8400-e29b-41d4-a716-446655440000"],
        role: "superadmin",
      };

      expect(() => {
        clientPortalAdminRouter._def.procedures.sendInvitation._def.inputs[0]?.parse(
          invalidInput,
        );
      }).toThrow();
    });

    it("should accept all valid role values", () => {
      const validRoles = ["viewer", "editor", "admin"];

      for (const role of validRoles) {
        expect(() => {
          clientPortalAdminRouter._def.procedures.sendInvitation._def.inputs[0]?.parse(
            {
              email: "client@example.com",
              firstName: "John",
              lastName: "Doe",
              clientIds: ["550e8400-e29b-41d4-a716-446655440000"],
              role,
            },
          );
        }).not.toThrow();
      }
    });

    it("should accept optional message", () => {
      const validInput = {
        email: "client@example.com",
        firstName: "John",
        lastName: "Doe",
        clientIds: ["550e8400-e29b-41d4-a716-446655440000"],
        role: "viewer" as const,
        message: "Welcome to the client portal!",
      };

      expect(() => {
        clientPortalAdminRouter._def.procedures.sendInvitation._def.inputs[0]?.parse(
          validInput,
        );
      }).not.toThrow();
    });
  });

  describe("listInvitations", () => {
    it("should accept empty input", () => {
      expect(() => {
        clientPortalAdminRouter._def.procedures.listInvitations._def.inputs[0]?.parse(
          {},
        );
      }).not.toThrow();
    });

    it("should accept status filter", () => {
      const validInput = {
        status: "pending" as const,
      };

      expect(() => {
        clientPortalAdminRouter._def.procedures.listInvitations._def.inputs[0]?.parse(
          validInput,
        );
      }).not.toThrow();
    });

    it("should validate status enum values", () => {
      const invalidInput = {
        status: "invalid_status",
      };

      expect(() => {
        clientPortalAdminRouter._def.procedures.listInvitations._def.inputs[0]?.parse(
          invalidInput,
        );
      }).toThrow();
    });

    it("should accept all valid status values", () => {
      const validStatuses = ["pending", "accepted", "expired", "revoked"];

      for (const status of validStatuses) {
        expect(() => {
          clientPortalAdminRouter._def.procedures.listInvitations._def.inputs[0]?.parse(
            {
              status,
            },
          );
        }).not.toThrow();
      }
    });
  });

  describe("resendInvitation", () => {
    it("should validate required invitationId field", () => {
      const invalidInput = {
        // Missing invitationId
      };

      expect(() => {
        clientPortalAdminRouter._def.procedures.resendInvitation._def.inputs[0]?.parse(
          invalidInput,
        );
      }).toThrow();
    });

    it("should accept valid invitation ID", () => {
      const validInput = {
        invitationId: "550e8400-e29b-41d4-a716-446655440000",
      };

      expect(() => {
        clientPortalAdminRouter._def.procedures.resendInvitation._def.inputs[0]?.parse(
          validInput,
        );
      }).not.toThrow();
    });
  });

  describe("revokeInvitation", () => {
    it("should validate required invitationId field", () => {
      const invalidInput = {
        // Missing invitationId
      };

      expect(() => {
        clientPortalAdminRouter._def.procedures.revokeInvitation._def.inputs[0]?.parse(
          invalidInput,
        );
      }).toThrow();
    });

    it("should accept valid invitation ID", () => {
      const validInput = {
        invitationId: "550e8400-e29b-41d4-a716-446655440000",
      };

      expect(() => {
        clientPortalAdminRouter._def.procedures.revokeInvitation._def.inputs[0]?.parse(
          validInput,
        );
      }).not.toThrow();
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
    it("should validate required fields", () => {
      const invalidInput = {
        // Missing portalUserId, clientId, role
        expiresAt: new Date(),
      };

      expect(() => {
        clientPortalAdminRouter._def.procedures.grantAccess._def.inputs[0]?.parse(
          invalidInput,
        );
      }).toThrow();
    });

    it("should accept valid access grant data", () => {
      const validInput = {
        portalUserId: "portal-user-123",
        clientId: "550e8400-e29b-41d4-a716-446655440000",
        role: "viewer" as const,
      };

      expect(() => {
        clientPortalAdminRouter._def.procedures.grantAccess._def.inputs[0]?.parse(
          validInput,
        );
      }).not.toThrow();
    });

    it("should accept optional expiresAt", () => {
      const validInput = {
        portalUserId: "portal-user-123",
        clientId: "550e8400-e29b-41d4-a716-446655440000",
        role: "editor" as const,
        expiresAt: new Date("2025-12-31"),
      };

      expect(() => {
        clientPortalAdminRouter._def.procedures.grantAccess._def.inputs[0]?.parse(
          validInput,
        );
      }).not.toThrow();
    });

    it("should validate role enum values", () => {
      const invalidInput = {
        portalUserId: "portal-user-123",
        clientId: "550e8400-e29b-41d4-a716-446655440000",
        role: "superuser",
      };

      expect(() => {
        clientPortalAdminRouter._def.procedures.grantAccess._def.inputs[0]?.parse(
          invalidInput,
        );
      }).toThrow();
    });

    it("should accept all valid role values", () => {
      const validRoles = ["viewer", "editor", "admin"];

      for (const role of validRoles) {
        expect(() => {
          clientPortalAdminRouter._def.procedures.grantAccess._def.inputs[0]?.parse(
            {
              portalUserId: "portal-user-123",
              clientId: "550e8400-e29b-41d4-a716-446655440000",
              role,
            },
          );
        }).not.toThrow();
      }
    });
  });

  describe("revokeAccess", () => {
    it("should validate required accessId field", () => {
      const invalidInput = {
        // Missing accessId
      };

      expect(() => {
        clientPortalAdminRouter._def.procedures.revokeAccess._def.inputs[0]?.parse(
          invalidInput,
        );
      }).toThrow();
    });

    it("should accept valid access ID", () => {
      const validInput = {
        accessId: "550e8400-e29b-41d4-a716-446655440000",
      };

      expect(() => {
        clientPortalAdminRouter._def.procedures.revokeAccess._def.inputs[0]?.parse(
          validInput,
        );
      }).not.toThrow();
    });
  });

  describe("updateRole", () => {
    it("should validate required fields", () => {
      const invalidInput = {
        // Missing accessId and role
      };

      expect(() => {
        clientPortalAdminRouter._def.procedures.updateRole._def.inputs[0]?.parse(
          invalidInput,
        );
      }).toThrow();
    });

    it("should accept valid role update data", () => {
      const validInput = {
        accessId: "550e8400-e29b-41d4-a716-446655440000",
        role: "admin" as const,
      };

      expect(() => {
        clientPortalAdminRouter._def.procedures.updateRole._def.inputs[0]?.parse(
          validInput,
        );
      }).not.toThrow();
    });

    it("should validate role enum values", () => {
      const invalidInput = {
        accessId: "550e8400-e29b-41d4-a716-446655440000",
        role: "manager",
      };

      expect(() => {
        clientPortalAdminRouter._def.procedures.updateRole._def.inputs[0]?.parse(
          invalidInput,
        );
      }).toThrow();
    });
  });

  describe("suspendUser", () => {
    it("should validate required portalUserId field", () => {
      const invalidInput = {
        // Missing portalUserId
      };

      expect(() => {
        clientPortalAdminRouter._def.procedures.suspendUser._def.inputs[0]?.parse(
          invalidInput,
        );
      }).toThrow();
    });

    it("should accept valid portal user ID", () => {
      const validInput = {
        portalUserId: "portal-user-123",
      };

      expect(() => {
        clientPortalAdminRouter._def.procedures.suspendUser._def.inputs[0]?.parse(
          validInput,
        );
      }).not.toThrow();
    });
  });

  describe("reactivateUser", () => {
    it("should validate required portalUserId field", () => {
      const invalidInput = {
        // Missing portalUserId
      };

      expect(() => {
        clientPortalAdminRouter._def.procedures.reactivateUser._def.inputs[0]?.parse(
          invalidInput,
        );
      }).toThrow();
    });

    it("should accept valid portal user ID", () => {
      const validInput = {
        portalUserId: "portal-user-123",
      };

      expect(() => {
        clientPortalAdminRouter._def.procedures.reactivateUser._def.inputs[0]?.parse(
          validInput,
        );
      }).not.toThrow();
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
