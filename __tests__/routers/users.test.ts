/**
 * Users Router Tests
 *
 * Tests for the users tRPC router
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Context } from "@/app/server/context";
import { usersRouter } from "@/app/server/routers/users";
import {
  createAdminCaller,
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
    returning: vi.fn(),
    innerJoin: vi.fn().mockReturnThis(),
    leftJoin: vi.fn().mockReturnThis(),
  },
}));

// Mock Better Auth
vi.mock("@/lib/auth", () => ({
  auth: {
    api: {
      createUser: vi.fn().mockResolvedValue({
        user: { id: "test-user-id" },
      }),
    },
  },
}));

// Mock password reset
vi.mock("@/lib/email/password-reset", () => ({
  sendPasswordResetEmail: vi.fn().mockResolvedValue(undefined),
}));

describe("app/server/routers/users.ts", () => {
  let ctx: Context;
  let caller: ReturnType<typeof createCaller<typeof usersRouter>>;
  let adminCaller: ReturnType<typeof createAdminCaller<typeof usersRouter>>;

  beforeEach(() => {
    ctx = createMockContext();
    caller = createCaller(usersRouter, ctx);
    adminCaller = createAdminCaller(usersRouter);
    vi.clearAllMocks();
  });

  describe("list", () => {
    it("should accept empty input", () => {
      expect(() => {
        usersRouter._def.procedures.list._def.inputs[0]?.parse({});
      }).not.toThrow();
    });

    it("should accept search parameter", () => {
      expect(() => {
        usersRouter._def.procedures.list._def.inputs[0]?.parse({
          search: "john doe",
        });
      }).not.toThrow();
    });

    it("should accept role filter", () => {
      expect(() => {
        usersRouter._def.procedures.list._def.inputs[0]?.parse({
          role: "admin",
        });
      }).not.toThrow();
    });

    it("should accept multiple filters", () => {
      expect(() => {
        usersRouter._def.procedures.list._def.inputs[0]?.parse({
          search: "test",
          role: "member", // Valid: member, admin, accountant, or "all"
        });
      }).not.toThrow();
    });
  });

  describe("getById", () => {
    it("should accept valid UUID", () => {
      const validId = "550e8400-e29b-41d4-a716-446655440000";

      expect(() => {
        usersRouter._def.procedures.getById._def.inputs[0]?.parse(validId);
      }).not.toThrow();
    });

    it("should validate input is a string", () => {
      expect(() => {
        usersRouter._def.procedures.getById._def.inputs[0]?.parse(123);
      }).toThrow();
    });
  });

  describe("create", () => {
    it("should validate required fields", () => {
      const invalidInput = {
        // Missing required fields
        firstName: "John",
      };

      expect(() => {
        usersRouter._def.procedures.create._def.inputs[0]?.parse(invalidInput);
      }).toThrow();
    });

    it("should accept valid user data", () => {
      const validInput = {
        email: "john@example.com",
        firstName: "John",
        lastName: "Doe",
        role: "user" as const,
        password: "SecurePass123!",
      };

      expect(() => {
        usersRouter._def.procedures.create._def.inputs[0]?.parse(validInput);
      }).not.toThrow();
    });

    it("should accept any string as email", () => {
      // Note: email is auto-generated from schema without .email() validation
      const validInput = {
        email: "invalid-email", // Any string is valid
        firstName: "John",
        lastName: "Doe",
        role: "member" as const,
      };

      expect(() => {
        usersRouter._def.procedures.create._def.inputs[0]?.parse(validInput);
      }).not.toThrow();
    });

    it("should accept optional phone field", () => {
      const validInput = {
        email: "john@example.com",
        firstName: "John",
        lastName: "Doe",
        role: "user" as const,
        password: "SecurePass123!",
        phone: "+1234567890",
      };

      expect(() => {
        usersRouter._def.procedures.create._def.inputs[0]?.parse(validInput);
      }).not.toThrow();
    });
  });

  describe("update", () => {
    it("should validate required id field", () => {
      const invalidInput = {
        // Missing id
        firstName: "Jane",
      };

      expect(() => {
        usersRouter._def.procedures.update._def.inputs[0]?.parse(invalidInput);
      }).toThrow();
    });

    it("should accept valid update data", () => {
      const validInput = {
        id: "550e8400-e29b-41d4-a716-446655440000",
        data: {
          firstName: "Jane",
          lastName: "Smith",
        },
      };

      expect(() => {
        usersRouter._def.procedures.update._def.inputs[0]?.parse(validInput);
      }).not.toThrow();
    });

    it("should accept any string as email in updates", () => {
      // Email validation not enforced in schema
      const validInput = {
        id: "550e8400-e29b-41d4-a716-446655440000",
        data: {
          email: "not-valid", // Any string is valid
        },
      };

      expect(() => {
        usersRouter._def.procedures.update._def.inputs[0]?.parse(validInput);
      }).not.toThrow();
    });

    it("should accept partial updates", () => {
      const validInput = {
        id: "550e8400-e29b-41d4-a716-446655440000",
        data: {
          phone: "+9876543210",
        },
      };

      expect(() => {
        usersRouter._def.procedures.update._def.inputs[0]?.parse(validInput);
      }).not.toThrow();
    });
  });

  describe("delete", () => {
    it("should accept valid user ID", () => {
      const validId = "550e8400-e29b-41d4-a716-446655440000";

      expect(() => {
        usersRouter._def.procedures.delete._def.inputs[0]?.parse(validId);
      }).not.toThrow();
    });

    it("should validate input is a string", () => {
      expect(() => {
        usersRouter._def.procedures.delete._def.inputs[0]?.parse({});
      }).toThrow();
    });
  });

  describe("updateRole", () => {
    it("should validate required fields", () => {
      const invalidInput = {
        // Missing role
        id: "550e8400-e29b-41d4-a716-446655440000",
      };

      expect(() => {
        usersRouter._def.procedures.updateRole._def.inputs[0]?.parse(
          invalidInput,
        );
      }).toThrow();
    });

    it("should accept valid role update", () => {
      const validInput = {
        id: "550e8400-e29b-41d4-a716-446655440000",
        role: "admin" as const,
      };

      expect(() => {
        usersRouter._def.procedures.updateRole._def.inputs[0]?.parse(
          validInput,
        );
      }).not.toThrow();
    });

    it("should validate id is a string", () => {
      const invalidInput = {
        id: 123,
        role: "admin",
      };

      expect(() => {
        usersRouter._def.procedures.updateRole._def.inputs[0]?.parse(
          invalidInput,
        );
      }).toThrow();
    });
  });

  describe("sendPasswordReset", () => {
    it("should validate required userId field", () => {
      const invalidInput = {};

      expect(() => {
        usersRouter._def.procedures.sendPasswordReset._def.inputs[0]?.parse(
          invalidInput,
        );
      }).toThrow();
    });

    it("should accept valid userId", () => {
      const validInput = {
        userId: "550e8400-e29b-41d4-a716-446655440000",
      };

      expect(() => {
        usersRouter._def.procedures.sendPasswordReset._def.inputs[0]?.parse(
          validInput,
        );
      }).not.toThrow();
    });

    it("should validate userId is a string", () => {
      const invalidInput = {
        userId: 123, // Should be string
      };

      expect(() => {
        usersRouter._def.procedures.sendPasswordReset._def.inputs[0]?.parse(
          invalidInput,
        );
      }).toThrow();
    });
  });

  describe("Router Structure", () => {
    it("should export all expected procedures", () => {
      const procedures = Object.keys(usersRouter._def.procedures);

      expect(procedures).toContain("list");
      expect(procedures).toContain("getById");
      expect(procedures).toContain("create");
      expect(procedures).toContain("update");
      expect(procedures).toContain("delete");
      expect(procedures).toContain("updateRole");
      expect(procedures).toContain("sendPasswordReset");
    });

    it("should have 7 procedures total", () => {
      const procedures = Object.keys(usersRouter._def.procedures);
      expect(procedures).toHaveLength(7);
    });
  });
});
