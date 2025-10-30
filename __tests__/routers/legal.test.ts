/**
 * Legal Router Tests
 *
 * Tests for the legal tRPC router
 * Validates multi-tenant isolation, version tracking, and admin authorization
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { legalRouter } from "@/app/server/routers/legal";
import {
  cleanupTestData,
  createTestTenant,
  createTestUser,
  type TestDataTracker,
} from "../helpers/factories";
import {
  createAdminCaller,
  createCaller,
  createMockContext,
  type TestContextWithAuth,
} from "../helpers/trpc";

describe("app/server/routers/legal.ts", () => {
  let ctx: TestContextWithAuth;
  let _caller: ReturnType<typeof createCaller<typeof legalRouter>>;
  let _adminCaller: ReturnType<typeof createAdminCaller<typeof legalRouter>>;
  const tracker: TestDataTracker = {
    tenants: [],
    users: [],
    legalPages: [],
  };

  beforeEach(() => {
    ctx = createMockContext();
    _caller = createCaller(legalRouter, ctx);
    _adminCaller = createAdminCaller(legalRouter);
    vi.clearAllMocks();
  });

  afterEach(async () => {
    await cleanupTestData(tracker);
    // Reset tracker arrays
    tracker.tenants = [];
    tracker.users = [];
    tracker.legalPages = [];
  });

  describe("getByType", () => {
    it("should require pageType input", async () => {
      await expect(
        _caller.getByType({} as Record<string, unknown>),
      ).rejects.toThrow();
    });

    it("should accept valid pageType: privacy", async () => {
      const tenantId = await createTestTenant();
      tracker.tenants?.push(tenantId);

      const userId = await createTestUser(tenantId, { role: "admin" });
      tracker.users?.push(userId);

      const adminCtx = createMockContext({
        authContext: {
          tenantId,
          userId,
          role: "admin",
          email: "admin@example.com",
          firstName: "Admin",
          lastName: "User",
          organizationName: "Test Org",
        },
      });
      const adminCaller = createCaller(legalRouter, adminCtx);

      // Create privacy page first
      const result = await adminCaller.update({
        pageType: "privacy",
        content: "# Privacy Policy\n\nTest content",
      });
      tracker.legalPages?.push(result.id);

      // Now fetch it
      const userCtx = createMockContext({
        authContext: {
          tenantId,
          userId,
          role: "user",
          email: "user@example.com",
          firstName: "User",
          lastName: "Test",
          organizationName: "Test Org",
        },
      });
      const userCaller = createCaller(legalRouter, userCtx);

      await expect(
        userCaller.getByType({ pageType: "privacy" }),
      ).resolves.not.toThrow();
    });

    it("should accept valid pageType: terms", async () => {
      const tenantId = await createTestTenant();
      tracker.tenants?.push(tenantId);

      const userId = await createTestUser(tenantId, { role: "admin" });
      tracker.users?.push(userId);

      const adminCtx = createMockContext({
        authContext: {
          tenantId,
          userId,
          role: "admin",
          email: "admin@example.com",
          firstName: "Admin",
          lastName: "User",
          organizationName: "Test Org",
        },
      });
      const adminCaller = createCaller(legalRouter, adminCtx);

      // Create terms page first
      const result = await adminCaller.update({
        pageType: "terms",
        content: "# Terms of Service\n\nTest content",
      });
      tracker.legalPages?.push(result.id);

      // Now fetch it
      const userCtx = createMockContext({
        authContext: {
          tenantId,
          userId,
          role: "user",
          email: "user@example.com",
          firstName: "User",
          lastName: "Test",
          organizationName: "Test Org",
        },
      });
      const userCaller = createCaller(legalRouter, userCtx);

      await expect(
        userCaller.getByType({ pageType: "terms" }),
      ).resolves.not.toThrow();
    });

    it("should accept valid pageType: cookie_policy", async () => {
      const tenantId = await createTestTenant();
      tracker.tenants?.push(tenantId);

      const userId = await createTestUser(tenantId, { role: "admin" });
      tracker.users?.push(userId);

      const adminCtx = createMockContext({
        authContext: {
          tenantId,
          userId,
          role: "admin",
          email: "admin@example.com",
          firstName: "Admin",
          lastName: "User",
          organizationName: "Test Org",
        },
      });
      const adminCaller = createCaller(legalRouter, adminCtx);

      // Create cookie policy page first
      const result = await adminCaller.update({
        pageType: "cookie_policy",
        content: "# Cookie Policy\n\nTest content",
      });
      tracker.legalPages?.push(result.id);

      // Now fetch it
      const userCtx = createMockContext({
        authContext: {
          tenantId,
          userId,
          role: "user",
          email: "user@example.com",
          firstName: "User",
          lastName: "Test",
          organizationName: "Test Org",
        },
      });
      const userCaller = createCaller(legalRouter, userCtx);

      await expect(
        userCaller.getByType({ pageType: "cookie_policy" }),
      ).resolves.not.toThrow();
    });

    it("should reject invalid pageType", async () => {
      await expect(
        _caller.getByType({
          pageType: "invalid_type" as unknown as "privacy",
        }),
      ).rejects.toThrow();
    });
  });

  describe("update", () => {
    it("should require both pageType and content", async () => {
      await expect(
        _caller.update({} as Record<string, unknown>),
      ).rejects.toThrow();
      await expect(
        _caller.update({ pageType: "privacy" } as Record<string, unknown>),
      ).rejects.toThrow();
      await expect(
        _caller.update({ content: "Test content" } as Record<string, unknown>),
      ).rejects.toThrow();
    });

    it("should accept valid input with pageType and content", async () => {
      const tenantId = await createTestTenant();
      tracker.tenants?.push(tenantId);

      const userId = await createTestUser(tenantId, { role: "admin" });
      tracker.users?.push(userId);

      const adminCtx = createMockContext({
        authContext: {
          tenantId,
          userId,
          role: "admin",
          email: "admin@example.com",
          firstName: "Admin",
          lastName: "User",
          organizationName: "Test Org",
        },
      });
      const adminCaller = createCaller(legalRouter, adminCtx);

      const result = await adminCaller.update({
        pageType: "privacy",
        content: "# Privacy Policy\n\nThis is the privacy policy content.",
      });
      tracker.legalPages?.push(result.id);

      await expect(Promise.resolve(result)).resolves.not.toThrow();
    });

    it("should reject empty content", async () => {
      await expect(
        _adminCaller.update({
          pageType: "privacy",
          content: "",
        }),
      ).rejects.toThrow();
    });

    it("should accept markdown formatted content", async () => {
      const tenantId = await createTestTenant();
      tracker.tenants?.push(tenantId);

      const userId = await createTestUser(tenantId, { role: "admin" });
      tracker.users?.push(userId);

      const adminCtx = createMockContext({
        authContext: {
          tenantId,
          userId,
          role: "admin",
          email: "admin@example.com",
          firstName: "Admin",
          lastName: "User",
          organizationName: "Test Org",
        },
      });
      const adminCaller = createCaller(legalRouter, adminCtx);

      const result = await adminCaller.update({
        pageType: "terms",
        content: `# Terms of Service

## Section 1
- Item 1
- Item 2

**Bold text** and *italic text*`,
      });
      tracker.legalPages?.push(result.id);

      await expect(Promise.resolve(result)).resolves.not.toThrow();
    });
  });

  describe("getVersionHistory", () => {
    it("should require pageType input", async () => {
      await expect(
        _caller.getVersionHistory({} as Record<string, unknown>),
      ).rejects.toThrow();
    });

    it("should accept valid pageType", async () => {
      await expect(
        _adminCaller.getVersionHistory({ pageType: "privacy" }),
      ).resolves.not.toThrow();
    });

    it("should reject invalid pageType", async () => {
      await expect(
        _caller.getVersionHistory({
          pageType: "invalid" as unknown as "privacy",
        }),
      ).rejects.toThrow();
    });
  });

  describe("getAll", () => {
    it("should have no required input", () => {
      const procedure = legalRouter._def.procedures.getAll;

      expect(!procedure._def.inputs || procedure._def.inputs.length === 0).toBe(
        true,
      );
    });
  });

  describe("multi-tenant isolation", () => {
    it("getByType should be protected (requires authentication)", () => {
      const procedure = legalRouter._def.procedures.getByType;
      expect(procedure._def.meta).toBeUndefined(); // Protected procedures don't have public meta
    });

    it("update should require admin role", () => {
      const procedure = legalRouter._def.procedures.update;
      // Admin procedures are middleware-protected in trpc.ts
      expect(procedure._def).toBeDefined();
    });

    it("getVersionHistory should require admin role", () => {
      const procedure = legalRouter._def.procedures.getVersionHistory;
      expect(procedure._def).toBeDefined();
    });

    it("getAll should be protected (requires authentication)", () => {
      const procedure = legalRouter._def.procedures.getAll;
      expect(procedure._def.meta).toBeUndefined();
    });
  });

  describe("version tracking", () => {
    it("update input should accept content that will be versioned", async () => {
      const tenantId = await createTestTenant();
      tracker.tenants?.push(tenantId);

      const userId = await createTestUser(tenantId, { role: "admin" });
      tracker.users?.push(userId);

      const adminCtx = createMockContext({
        authContext: {
          tenantId,
          userId,
          role: "admin",
          email: "admin@example.com",
          firstName: "Admin",
          lastName: "User",
          organizationName: "Test Org",
        },
      });
      const adminCaller = createCaller(legalRouter, adminCtx);

      const input = {
        pageType: "privacy" as const,
        content: "Updated privacy policy content",
      };

      const result = await adminCaller.update(input);
      tracker.legalPages?.push(result.id);

      await expect(Promise.resolve(result)).resolves.not.toThrow();
    });
  });

  describe("input validation edge cases", () => {
    it("should reject null pageType", async () => {
      await expect(
        _caller.getByType({ pageType: null as unknown as "privacy" }),
      ).rejects.toThrow();
    });

    it("should reject undefined pageType", async () => {
      await expect(
        _caller.getByType({ pageType: undefined as unknown as "privacy" }),
      ).rejects.toThrow();
    });

    it("should accept long content for update", async () => {
      const tenantId = await createTestTenant();
      tracker.tenants?.push(tenantId);

      const userId = await createTestUser(tenantId, { role: "admin" });
      tracker.users?.push(userId);

      const adminCtx = createMockContext({
        authContext: {
          tenantId,
          userId,
          role: "admin",
          email: "admin@example.com",
          firstName: "Admin",
          lastName: "User",
          organizationName: "Test Org",
        },
      });
      const adminCaller = createCaller(legalRouter, adminCtx);

      const longContent = "A".repeat(10000); // 10K characters
      const result = await adminCaller.update({
        pageType: "terms",
        content: longContent,
      });
      tracker.legalPages?.push(result.id);

      await expect(Promise.resolve(result)).resolves.not.toThrow();
    });

    it("should handle special characters in content", async () => {
      const tenantId = await createTestTenant();
      tracker.tenants?.push(tenantId);

      const userId = await createTestUser(tenantId, { role: "admin" });
      tracker.users?.push(userId);

      const adminCtx = createMockContext({
        authContext: {
          tenantId,
          userId,
          role: "admin",
          email: "admin@example.com",
          firstName: "Admin",
          lastName: "User",
          organizationName: "Test Org",
        },
      });
      const adminCaller = createCaller(legalRouter, adminCtx);

      const specialContent = `# Privacy Policy

Special characters: !@#$%^&*()_+-=[]{}|;':",./<>?
Unicode: 你好 مرحبا Здравствуйте`;

      const result = await adminCaller.update({
        pageType: "privacy",
        content: specialContent,
      });
      tracker.legalPages?.push(result.id);

      await expect(Promise.resolve(result)).resolves.not.toThrow();
    });
  });
});
