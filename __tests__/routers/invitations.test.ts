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
  let _caller: ReturnType<typeof createCaller<typeof invitationsRouter>>;

  beforeEach(() => {
    ctx = createMockContext();
    ctx.authContext.role = "admin"; // Most procedures require admin
    _caller = createCaller(invitationsRouter, ctx);
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
    it("should accept empty input", async () => {
      await expect(_caller.getActivityLogs({})).resolves.not.toThrow();
    });

    it("should accept limit parameter", async () => {
      await expect(_caller.getActivityLogs({
        limit: 10,
      })).resolves.not.toThrow();
    });

    it("should default limit to 20", () => {
      const result =
        invitationsRouter._def.procedures.getActivityLogs._def.inputs[0]?.parse(
          {},
        );
      expect(result?.limit).toBe(20);
    });

    it("should validate limit min value", async () => {
      await expect(_caller.getActivityLogs({
        limit: 0,
      })).rejects.toThrow();
    });

    it("should validate limit max value", async () => {
      await expect(_caller.getActivityLogs({
        limit: 51,
      })).rejects.toThrow();
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

      await expect(_caller.send(invalidInput as any)).rejects.toThrow();
    });

    it("should accept valid invitation data", async () => {
      const validInput = {
        email: "newuser@example.com",
        role: "accountant" as const,
      };

      await expect(_caller.send(validInput)).resolves.not.toThrow();
    });

    it("should accept custom message", async () => {
      const validInput = {
        email: "user@example.com",
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

      await expect(_caller.send(invalidInput as any)).rejects.toThrow();
    });

    it("should accept all valid role values", async () => {
      const validRoles = ["admin", "accountant", "member"] as const;

      for (const role of validRoles) {
        await expect(_caller.send({
          email: "test@example.com",
          role,
        })).resolves.not.toThrow();
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

      await expect(_caller.verify(invalidInput as any)).rejects.toThrow();
    });

    it("should accept valid token", async () => {
      const validInput = {
        token: "abc123def456",
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

      await expect(_caller.accept(invalidInput as any)).rejects.toThrow();
    });

    it("should accept valid acceptance data", async () => {
      const validInput = {
        token: "abc123def456",
        password: "securePassword123!",
      };

      await expect(_caller.accept(validInput)).resolves.not.toThrow();
    });

    it("should accept optional name fields", async () => {
      const validInput = {
        token: "xyz789",
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

      await expect(_caller.resend(invalidInput as any)).rejects.toThrow();
    });

    it("should accept valid invitation ID", async () => {
      const validInput = {
        invitationId: "550e8400-e29b-41d4-a716-446655440000",
      };

      await expect(_caller.resend(validInput)).resolves.not.toThrow();
    });

    it("should validate UUID format", async () => {
      const invalidInput = {
        invitationId: "not-a-uuid",
      };

      await expect(_caller.resend(invalidInput as any)).rejects.toThrow();
    });
  });

  describe("cancel", () => {
    it("should validate required invitationId field", async () => {
      const invalidInput = {
        // Missing invitationId
      };

      await expect(_caller.cancel(invalidInput as any)).rejects.toThrow();
    });

    it("should accept valid invitation ID", async () => {
      const validInput = {
        invitationId: "660e8400-e29b-41d4-a716-446655440000",
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
