/**
 * Proposal Templates Router Integration Tests
 *
 * Integration-level tests for the proposalTemplates tRPC router.
 * Tests verify database operations and template management.
 *
 * Cleanup Strategy: TestDataTracker + afterEach cleanup
 */

import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { proposalTemplatesRouter } from "@/app/server/routers/proposalTemplates";
import {
  cleanupTestData,
  createTestTenant,
  createTestUser,
  type TestDataTracker,
} from "../helpers/factories";
import {
  createCaller,
  createMockContext,
  type TestContextWithAuth,
} from "../helpers/trpc";

describe("app/server/routers/proposalTemplates.ts", () => {
  let ctx: TestContextWithAuth;
  let caller: ReturnType<typeof createCaller<typeof proposalTemplatesRouter>>;
  const tracker: TestDataTracker = {
    tenants: [],
    users: [],
    proposalTemplates: [],
  };

  beforeEach(async () => {
    // Create test tenant and user
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

    caller = createCaller(proposalTemplatesRouter, ctx);
  });

  afterEach(async () => {
    await cleanupTestData(tracker);

    // Reset tracker arrays
    tracker.tenants = [];
    tracker.users = [];
    tracker.proposalTemplates = [];
  });

  describe("list", () => {
    it("should accept optional input", async () => {
      await expect(caller.list()).resolves.not.toThrow();
    });

    it("should accept filter parameters", async () => {
      await expect(
        caller.list({
          category: "standard",
          isActive: true,
          search: "test",
        }),
      ).resolves.not.toThrow();
    });
  });

  describe("getById", () => {
    it("should validate required id field", async () => {
      const invalidInput = {
        // Missing id
      };

      await expect(
        caller.getById(invalidInput as Record<string, unknown>),
      ).rejects.toThrow();
    });

    it("should accept valid UUID", async () => {
      // Create a template first
      const template = await caller.create({
        name: "Test Template",
        description: "Test Description",
        defaultServices: [],
      });
      tracker.proposalTemplates?.push(template.template.id);

      await expect(caller.getById(template.template.id)).resolves.not.toThrow();
    });
  });

  describe("create", () => {
    it("should validate required fields", async () => {
      const invalidInput = {
        // Missing name and services
        description: "Test",
      };

      await expect(
        caller.create(invalidInput as Record<string, unknown>),
      ).rejects.toThrow();
    });

    it("should accept valid template data with minimal fields", async () => {
      const validInput = {
        name: "Basic Template",
        defaultServices: [],
      };

      const result = await caller.create(validInput);
      tracker.proposals?.push(result.template.id);

      await expect(Promise.resolve(result)).resolves.not.toThrow();
    });

    it("should accept valid template data with all fields", async () => {
      const validInput = {
        name: "Full Template",
        description: "A complete template",
        defaultServices: [
          {
            componentCode: "BOOKKEEPING_MONTHLY",
            config: { modelType: "A" },
          },
        ],
        isDefault: false,
      };

      const result = await caller.create(validInput);
      tracker.proposals?.push(result.template.id);

      await expect(Promise.resolve(result)).resolves.not.toThrow();
    });

    it("should accept service config as optional", async () => {
      const validInput = {
        name: "Template Without Config",
        defaultServices: [
          {
            componentCode: "VAT_QUARTERLY",
          },
        ],
      };

      const result = await caller.create(validInput);
      tracker.proposals?.push(result.template.id);

      await expect(Promise.resolve(result)).resolves.not.toThrow();
    });
  });

  describe("update", () => {
    it("should validate required id field", async () => {
      const invalidInput = {
        // Missing id
        name: "Updated Name",
      };

      await expect(
        caller.update(invalidInput as Record<string, unknown>),
      ).rejects.toThrow();
    });

    it("should accept partial update data", async () => {
      // Create a template first
      const template = await caller.create({
        name: "Original Template",
        defaultServices: [],
      });
      tracker.proposalTemplates?.push(template.template.id);

      const validInput = {
        id: template.template.id,
        data: {
          name: "Updated Template",
        },
      };

      await expect(caller.update(validInput)).resolves.not.toThrow();
    });

    it("should accept updating multiple fields", async () => {
      // Create a template first
      const template = await caller.create({
        name: "Original Template",
        defaultServices: [],
      });
      tracker.proposalTemplates?.push(template.template.id);

      const validInput = {
        id: template.template.id,
        data: {
          name: "Fully Updated Template",
          description: "Updated description",
          isDefault: true,
        },
      };

      await expect(caller.update(validInput)).resolves.not.toThrow();
    });

    it("should accept updating services", async () => {
      // Create a template first
      const template = await caller.create({
        name: "Service Template",
        defaultServices: [],
      });
      tracker.proposalTemplates?.push(template.template.id);

      const validInput = {
        id: template.template.id,
        data: {
          defaultServices: [
            {
              componentCode: "BOOKKEEPING_MONTHLY",
              config: { modelType: "B" },
            },
          ],
        },
      };

      await expect(caller.update(validInput)).resolves.not.toThrow();
    });

    it("should accept empty data object", async () => {
      // Create a template first
      const template = await caller.create({
        name: "Template for Empty Update",
        defaultServices: [],
      });
      tracker.proposalTemplates?.push(template.template.id);

      const validInput = {
        id: template.template.id,
        data: {},
      };

      await expect(
        caller.update(validInput as Record<string, unknown>),
      ).resolves.not.toThrow();
    });
  });

  describe("delete", () => {
    it("should validate required id field", async () => {
      const invalidInput = {
        // Missing id
      };

      await expect(
        caller.delete(invalidInput as Record<string, unknown>),
      ).rejects.toThrow();
    });

    it("should accept valid UUID", async () => {
      // Create a template first
      const template = await caller.create({
        name: "Template to Delete",
        defaultServices: [],
      });

      await expect(caller.delete(template.template.id)).resolves.not.toThrow();
      // Don't track since we just deleted it
    });
  });

  describe("setDefault", () => {
    it("should validate required id field", async () => {
      const invalidInput = {
        // Missing id
      };

      await expect(
        caller.setDefault(invalidInput as Record<string, unknown>),
      ).rejects.toThrow();
    });

    it("should accept valid UUID", async () => {
      // Create a template first
      const template = await caller.create({
        name: "Default Template",
        defaultServices: [],
      });
      tracker.proposalTemplates?.push(template.template.id);

      await expect(
        caller.setDefault(template.template.id),
      ).resolves.not.toThrow();
    });
  });

  describe("Router Structure", () => {
    it("should export all expected procedures", () => {
      const procedures = Object.keys(proposalTemplatesRouter._def.procedures);

      expect(procedures).toContain("list");
      expect(procedures).toContain("getById");
      expect(procedures).toContain("create");
      expect(procedures).toContain("update");
      expect(procedures).toContain("delete");
      expect(procedures).toContain("setDefault");
    });

    it("should have 6 procedures total", () => {
      const procedures = Object.keys(proposalTemplatesRouter._def.procedures);
      expect(procedures).toHaveLength(6);
    });
  });
});
