/**
 * Invitations Router Tests
 *
 * Tests for the invitations tRPC router
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Context } from "@/app/server/context";
import { invitationsRouter } from "@/app/server/routers/invitations";
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
    set: vi.fn().mockReturnThis(),
    values: vi.fn().mockReturnThis(),
    returning: vi.fn().mockResolvedValue([]),
    leftJoin: vi.fn().mockReturnThis(),
  },
}));

// Mock email sending
vi.mock("@/lib/email", () => ({
  sendInvitationEmail: vi.fn().mockResolvedValue(undefined),
}));

describe("app/server/routers/invitations.ts", () => {
  let ctx: Context;
  let caller: ReturnType<typeof createCaller<typeof invitationsRouter>>;

  beforeEach(() => {
    ctx = createMockContext();
    ctx.authContext.role = "admin"; // Most procedures require admin
    caller = createCaller(invitationsRouter, ctx);
    vi.clearAllMocks();
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
    it("should accept empty input", () => {
      expect(() => {
        invitationsRouter._def.procedures.getActivityLogs._def.inputs[0]?.parse(
          {},
        );
      }).not.toThrow();
    });

    it("should accept limit parameter", () => {
      expect(() => {
        invitationsRouter._def.procedures.getActivityLogs._def.inputs[0]?.parse(
          {
            limit: 10,
          },
        );
      }).not.toThrow();
    });

    it("should default limit to 20", () => {
      const result =
        invitationsRouter._def.procedures.getActivityLogs._def.inputs[0]?.parse(
          {},
        );
      expect(result?.limit).toBe(20);
    });

    it("should validate limit min value", () => {
      expect(() => {
        invitationsRouter._def.procedures.getActivityLogs._def.inputs[0]?.parse(
          {
            limit: 0,
          },
        );
      }).toThrow();
    });

    it("should validate limit max value", () => {
      expect(() => {
        invitationsRouter._def.procedures.getActivityLogs._def.inputs[0]?.parse(
          {
            limit: 51,
          },
        );
      }).toThrow();
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
    it("should validate required fields", () => {
      const invalidInput = {
        // Missing email and role
        customMessage: "Welcome",
      };

      expect(() => {
        invitationsRouter._def.procedures.send._def.inputs[0]?.parse(
          invalidInput,
        );
      }).toThrow();
    });

    it("should accept valid invitation data", () => {
      const validInput = {
        email: "newuser@example.com",
        role: "accountant",
      };

      expect(() => {
        invitationsRouter._def.procedures.send._def.inputs[0]?.parse(
          validInput,
        );
      }).not.toThrow();
    });

    it("should accept custom message", () => {
      const validInput = {
        email: "user@example.com",
        role: "member",
        customMessage: "Welcome to the team!",
      };

      expect(() => {
        invitationsRouter._def.procedures.send._def.inputs[0]?.parse(
          validInput,
        );
      }).not.toThrow();
    });

    it("should validate role enum values", () => {
      const invalidInput = {
        email: "test@example.com",
        role: "invalid",
      };

      expect(() => {
        invitationsRouter._def.procedures.send._def.inputs[0]?.parse(
          invalidInput,
        );
      }).toThrow();
    });

    it("should accept all valid role values", () => {
      const validRoles = ["admin", "accountant", "member"];

      for (const role of validRoles) {
        expect(() => {
          invitationsRouter._def.procedures.send._def.inputs[0]?.parse({
            email: "test@example.com",
            role,
          });
        }).not.toThrow();
      }
    });

    it("should validate email format", () => {
      const invalidInput = {
        email: "not-an-email",
        role: "member",
      };

      expect(() => {
        invitationsRouter._def.procedures.send._def.inputs[0]?.parse(
          invalidInput,
        );
      }).toThrow();
    });
  });

  describe("verify", () => {
    it("should validate required token field", () => {
      const invalidInput = {
        // Missing token
      };

      expect(() => {
        invitationsRouter._def.procedures.verify._def.inputs[0]?.parse(
          invalidInput,
        );
      }).toThrow();
    });

    it("should accept valid token", () => {
      const validInput = {
        token: "abc123def456",
      };

      expect(() => {
        invitationsRouter._def.procedures.verify._def.inputs[0]?.parse(
          validInput,
        );
      }).not.toThrow();
    });
  });

  describe("accept", () => {
    it("should validate required fields", () => {
      const invalidInput = {
        // Missing token and password
        firstName: "John",
      };

      expect(() => {
        invitationsRouter._def.procedures.accept._def.inputs[0]?.parse(
          invalidInput,
        );
      }).toThrow();
    });

    it("should accept valid acceptance data", () => {
      const validInput = {
        token: "abc123def456",
        password: "securePassword123!",
      };

      expect(() => {
        invitationsRouter._def.procedures.accept._def.inputs[0]?.parse(
          validInput,
        );
      }).not.toThrow();
    });

    it("should accept optional name fields", () => {
      const validInput = {
        token: "xyz789",
        password: "strongPass123!",
        firstName: "Jane",
        lastName: "Doe",
      };

      expect(() => {
        invitationsRouter._def.procedures.accept._def.inputs[0]?.parse(
          validInput,
        );
      }).not.toThrow();
    });

    it("should validate password minimum length", () => {
      const invalidInput = {
        token: "abc123",
        password: "short",
      };

      expect(() => {
        invitationsRouter._def.procedures.accept._def.inputs[0]?.parse(
          invalidInput,
        );
      }).toThrow();
    });
  });

  describe("resend", () => {
    it("should validate required invitationId field", () => {
      const invalidInput = {
        // Missing invitationId
      };

      expect(() => {
        invitationsRouter._def.procedures.resend._def.inputs[0]?.parse(
          invalidInput,
        );
      }).toThrow();
    });

    it("should accept valid invitation ID", () => {
      const validInput = {
        invitationId: "550e8400-e29b-41d4-a716-446655440000",
      };

      expect(() => {
        invitationsRouter._def.procedures.resend._def.inputs[0]?.parse(
          validInput,
        );
      }).not.toThrow();
    });

    it("should validate UUID format", () => {
      const invalidInput = {
        invitationId: "not-a-uuid",
      };

      expect(() => {
        invitationsRouter._def.procedures.resend._def.inputs[0]?.parse(
          invalidInput,
        );
      }).toThrow();
    });
  });

  describe("cancel", () => {
    it("should validate required invitationId field", () => {
      const invalidInput = {
        // Missing invitationId
      };

      expect(() => {
        invitationsRouter._def.procedures.cancel._def.inputs[0]?.parse(
          invalidInput,
        );
      }).toThrow();
    });

    it("should accept valid invitation ID", () => {
      const validInput = {
        invitationId: "660e8400-e29b-41d4-a716-446655440000",
      };

      expect(() => {
        invitationsRouter._def.procedures.cancel._def.inputs[0]?.parse(
          validInput,
        );
      }).not.toThrow();
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
