/**
 * Users Router Tests
 *
 * Tests for the users tRPC router
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import { usersRouter } from "@/app/server/routers/users";
import {
  createAdminCaller,
  createCaller,
  createMockContext,
  type TestContextWithAuth,
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
  let ctx: TestContextWithAuth;
  let _caller: ReturnType<typeof createCaller<typeof usersRouter>>;
  let _adminCaller: ReturnType<typeof createAdminCaller<typeof usersRouter>>;

  beforeEach(() => {
    ctx = createMockContext();
    _caller = createCaller(usersRouter, ctx);
    _adminCaller = createAdminCaller(usersRouter);
    vi.clearAllMocks();
  });

  describe("list", () => {
    it("should accept empty input", async () => {
      await expect(_caller.list({})).resolves.not.toThrow();
    });

    it("should accept search parameter", async () => {
      await expect(
        _caller.list({
          search: "john doe",
        }),
      ).resolves.not.toThrow();
    });

    it("should accept role filter", async () => {
      await expect(
        _caller.list({
          role: "admin",
        }),
      ).resolves.not.toThrow();
    });

    it("should accept multiple filters", async () => {
      await expect(
        _caller.list({
          search: "test",
          role: "member", // Valid: member, admin, accountant, or "all"
        }),
      ).resolves.not.toThrow();
    });
  });

  describe("getById", () => {
    it("should accept valid UUID", async () => {
      const validId = "550e8400-e29b-41d4-a716-446655440000";

      await expect(_caller.getById(validId)).resolves.not.toThrow();
    });

    it("should validate input is a string", async () => {
      await expect(_caller.getById(123 as unknown)).rejects.toThrow();
    });
  });

  describe("create", () => {
    it("should validate required fields", async () => {
      const invalidInput = {
        // Missing required fields
        firstName: "John",
      };

      await expect(
        _adminCaller.create(invalidInput as unknown),
      ).rejects.toThrow();
    });

    it("should accept valid user data", async () => {
      const validInput = {
        email: "john@example.com",
        firstName: "John",
        lastName: "Doe",
        role: "user" as const,
        password: "SecurePass123!",
      };

      await expect(_adminCaller.create(validInput)).resolves.not.toThrow();
    });

    it("should accept any string as email", async () => {
      // Note: email is auto-generated from schema without .email() validation
      const validInput = {
        email: "invalid-email", // Any string is valid
        firstName: "John",
        lastName: "Doe",
        role: "member" as const,
      };

      await expect(_adminCaller.create(validInput)).resolves.not.toThrow();
    });

    it("should accept optional phone field", async () => {
      const validInput = {
        email: "john@example.com",
        firstName: "John",
        lastName: "Doe",
        role: "user" as const,
        password: "SecurePass123!",
        phone: "+1234567890",
      };

      await expect(_adminCaller.create(validInput)).resolves.not.toThrow();
    });
  });

  describe("update", () => {
    it("should validate required id field", async () => {
      const invalidInput = {
        // Missing id
        firstName: "Jane",
      };

      await expect(_caller.update(invalidInput as unknown)).rejects.toThrow();
    });

    it("should accept valid update data", async () => {
      const validInput = {
        id: "550e8400-e29b-41d4-a716-446655440000",
        data: {
          firstName: "Jane",
          lastName: "Smith",
        },
      };

      await expect(_caller.update(validInput)).resolves.not.toThrow();
    });

    it("should accept any string as email in updates", async () => {
      // Email validation not enforced in schema
      const validInput = {
        id: "550e8400-e29b-41d4-a716-446655440000",
        data: {
          email: "not-valid", // Any string is valid
        },
      };

      await expect(_caller.update(validInput)).resolves.not.toThrow();
    });

    it("should accept partial updates", async () => {
      const validInput = {
        id: "550e8400-e29b-41d4-a716-446655440000",
        data: {
          phone: "+9876543210",
        },
      };

      await expect(_caller.update(validInput)).resolves.not.toThrow();
    });
  });

  describe("delete", () => {
    it("should accept valid user ID", async () => {
      const validId = "550e8400-e29b-41d4-a716-446655440000";

      await expect(_adminCaller.delete(validId)).resolves.not.toThrow();
    });

    it("should validate input is a string", async () => {
      await expect(_adminCaller.delete({} as unknown)).rejects.toThrow();
    });
  });

  describe("updateRole", () => {
    it("should validate required fields", async () => {
      const invalidInput = {
        // Missing role
        id: "550e8400-e29b-41d4-a716-446655440000",
      };

      await expect(
        _adminCaller.updateRole(invalidInput as unknown),
      ).rejects.toThrow();
    });

    it("should accept valid role update", async () => {
      const validInput = {
        id: "550e8400-e29b-41d4-a716-446655440000",
        role: "admin" as const,
      };

      await expect(_adminCaller.updateRole(validInput)).resolves.not.toThrow();
    });

    it("should validate id is a string", async () => {
      const invalidInput = {
        id: 123,
        role: "admin",
      };

      await expect(
        _adminCaller.updateRole(invalidInput as unknown),
      ).rejects.toThrow();
    });
  });

  describe("sendPasswordReset", () => {
    it("should validate required userId field", async () => {
      const invalidInput = {};

      await expect(
        _adminCaller.sendPasswordReset(invalidInput as unknown),
      ).rejects.toThrow();
    });

    it("should accept valid userId", async () => {
      const validInput = {
        userId: "550e8400-e29b-41d4-a716-446655440000",
      };

      await expect(
        _adminCaller.sendPasswordReset(validInput),
      ).resolves.not.toThrow();
    });

    it("should validate userId is a string", async () => {
      const invalidInput = {
        userId: 123, // Should be string
      };

      await expect(
        _adminCaller.sendPasswordReset(invalidInput as unknown),
      ).rejects.toThrow();
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
      expect(procedures).toContain("bulkUpdateStatus");
      expect(procedures).toContain("bulkChangeRole");
      expect(procedures).toContain("bulkAssignDepartment");
    });

    it("should have 10 procedures total", () => {
      const procedures = Object.keys(usersRouter._def.procedures);
      expect(procedures).toHaveLength(10);
    });
  });
});
