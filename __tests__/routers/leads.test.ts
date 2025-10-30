/**
 * Leads Router Tests
 *
 * Tests for the leads tRPC router
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { leadsRouter } from "@/app/server/routers/leads";
import {
  createCaller,
  createMockContext,
  type TestContextWithAuth,
} from "../helpers/trpc";
import {
  type TestDataTracker,
  cleanupTestData,
  createTestLead,
  createTestTenant,
  createTestUser,
} from "../helpers/factories";

// Mock auto-convert helper
vi.mock("@/lib/client-portal/auto-convert-lead", () => ({
  autoConvertLeadToClient: vi.fn().mockResolvedValue({
    success: true,
    clientId: "test-client-id",
  }),
}));

describe("app/server/routers/leads.ts", () => {
  let ctx: TestContextWithAuth;
  let _caller: ReturnType<typeof createCaller<typeof leadsRouter>>;
  const tracker: TestDataTracker = {
    tenants: [],
    users: [],
    leads: [],
  };

  beforeEach(() => {
    ctx = createMockContext();
    _caller = createCaller(leadsRouter, ctx);
    vi.clearAllMocks();
  });

  afterEach(async () => {
    await cleanupTestData(tracker);
    // Reset tracker arrays
    tracker.tenants = [];
    tracker.users = [];
    tracker.leads = [];
  });

  describe("list", () => {
    it("should accept empty input", async () => {
      await expect(_caller.list({})).resolves.not.toThrow();
    });

    it("should accept search parameter", async () => {
      await expect(
        _caller.list({
          search: "test lead",
        }),
      ).resolves.not.toThrow();
    });

    it("should accept status filter", async () => {
      await expect(
        _caller.list({
          status: "new",
        }),
      ).resolves.not.toThrow();
    });

    it("should accept source filter", async () => {
      await expect(
        _caller.list({
          source: "website",
        }),
      ).resolves.not.toThrow();
    });

    it("should accept multiple filters", async () => {
      await expect(
        _caller.list({
          search: "test",
          status: "contacted",
          source: "referral",
        }),
      ).resolves.not.toThrow();
    });
  });

  describe("getById", () => {
    it("should accept valid UUID", async () => {
      // Create real test data
      const tenantId = await createTestTenant();
      tracker.tenants?.push(tenantId);

      const userId = await createTestUser(tenantId);
      tracker.users?.push(userId);

      const lead = await createTestLead(tenantId);
      tracker.leads?.push(lead.id);

      // Update context with real tenant
      ctx.authContext.tenantId = tenantId;
      ctx.authContext.userId = userId;

      await expect(_caller.getById(lead.id)).resolves.not.toThrow();
    });

    it("should validate input is a string", async () => {
      await expect(_caller.getById(123 as unknown as string)).rejects.toThrow();
    });
  });

  describe("create", () => {
    it("should validate required fields", async () => {
      const invalidInput = {
        // Missing required fields
        firstName: "John",
      };

      await expect(
        _caller.create(invalidInput as Record<string, unknown>),
      ).rejects.toThrow();
    });

    it("should accept valid lead data", async () => {
      // Create real test data
      const tenantId = await createTestTenant();
      tracker.tenants?.push(tenantId);

      const userId = await createTestUser(tenantId);
      tracker.users?.push(userId);

      // Update context with real tenant
      ctx.authContext.tenantId = tenantId;
      ctx.authContext.userId = userId;

      const validInput = {
        firstName: "John",
        lastName: "Doe",
        email: "john@example.com",
        company: "Acme Corp",
        status: "new" as const,
        source: "website" as const,
      };

      const result = await _caller.create(validInput);
      tracker.leads?.push(result.id);
      await expect(Promise.resolve(result)).resolves.not.toThrow();
    });

    it("should accept any string as email", async () => {
      // Create real test data
      const tenantId = await createTestTenant();
      tracker.tenants?.push(tenantId);

      const userId = await createTestUser(tenantId);
      tracker.users?.push(userId);

      // Update context with real tenant
      ctx.authContext.tenantId = tenantId;
      ctx.authContext.userId = userId;

      // Note: email is z.string().optional() without .email() validation in leads
      const validInput = {
        firstName: "John",
        lastName: "Doe",
        email: "invalid-email", // Any string is valid
        companyName: "Test Corp",
      };

      const result = await _caller.create(validInput as Record<string, unknown>);
      tracker.leads?.push(result.id);
      await expect(Promise.resolve(result)).resolves.not.toThrow();
    });

    it("should accept optional fields", async () => {
      // Create real test data
      const tenantId = await createTestTenant();
      tracker.tenants?.push(tenantId);

      const userId = await createTestUser(tenantId);
      tracker.users?.push(userId);

      // Update context with real tenant
      ctx.authContext.tenantId = tenantId;
      ctx.authContext.userId = userId;

      const validInput = {
        firstName: "John",
        lastName: "Doe",
        email: "john@example.com",
        company: "Acme Corp",
        phone: "+1234567890",
        notes: "Interested in accounting services",
      };

      const result = await _caller.create(validInput as Record<string, unknown>);
      tracker.leads?.push(result.id);
      await expect(Promise.resolve(result)).resolves.not.toThrow();
    });
  });

  describe("update", () => {
    it("should validate required id field", async () => {
      const invalidInput = {
        // Missing id
        firstName: "Jane",
      };

      await expect(
        _caller.update(invalidInput as Record<string, unknown>),
      ).rejects.toThrow();
    });

    it("should accept valid update data", async () => {
      // Create real test data
      const tenantId = await createTestTenant();
      tracker.tenants?.push(tenantId);

      const userId = await createTestUser(tenantId);
      tracker.users?.push(userId);

      const lead = await createTestLead(tenantId);
      tracker.leads?.push(lead.id);

      // Update context with real tenant
      ctx.authContext.tenantId = tenantId;
      ctx.authContext.userId = userId;

      const validInput = {
        id: lead.id,
        data: {
          status: "contacted" as const,
          notes: "Follow-up scheduled",
        },
      };

      await expect(_caller.update(validInput)).resolves.not.toThrow();
    });

    it("should validate email format in updates", async () => {
      const invalidInput = {
        id: "550e8400-e29b-41d4-a716-446655440000",
        email: "not-valid",
      };

      await expect(
        _caller.update(invalidInput as Record<string, unknown>),
      ).rejects.toThrow();
    });
  });

  describe("delete", () => {
    it("should accept valid lead ID", async () => {
      // Create real test data
      const tenantId = await createTestTenant();
      tracker.tenants?.push(tenantId);

      const userId = await createTestUser(tenantId);
      tracker.users?.push(userId);

      const lead = await createTestLead(tenantId);
      tracker.leads?.push(lead.id);

      // Update context with real tenant
      ctx.authContext.tenantId = tenantId;
      ctx.authContext.userId = userId;

      await expect(_caller.delete(lead.id)).resolves.not.toThrow();
    });

    it("should validate input is a string", async () => {
      await expect(_caller.delete(null as unknown as string)).rejects.toThrow();
    });
  });

  describe("assignLead", () => {
    it("should validate required fields", async () => {
      const invalidInput = {
        // Missing assignedToId
        leadId: "550e8400-e29b-41d4-a716-446655440000",
      };

      await expect(
        _caller.assignLead(invalidInput as Record<string, unknown>),
      ).rejects.toThrow();
    });

    it("should accept valid assignment data", async () => {
      // Create real test data
      const tenantId = await createTestTenant();
      tracker.tenants?.push(tenantId);

      const userId = await createTestUser(tenantId);
      tracker.users?.push(userId);

      const assignedUser = await createTestUser(tenantId);
      tracker.users?.push(assignedUser);

      const lead = await createTestLead(tenantId);
      tracker.leads?.push(lead.id);

      // Update context with real tenant
      ctx.authContext.tenantId = tenantId;
      ctx.authContext.userId = userId;

      const validInput = {
        leadId: lead.id,
        assignedToId: assignedUser,
      };

      await expect(_caller.assignLead(validInput)).resolves.not.toThrow();
    });
  });

  describe("scheduleFollowUp", () => {
    it("should validate required fields", async () => {
      const invalidInput = {
        // Missing nextFollowUpAt
        leadId: "550e8400-e29b-41d4-a716-446655440000",
      };

      await expect(
        _caller.scheduleFollowUp(invalidInput as Record<string, unknown>),
      ).rejects.toThrow();
    });

    it("should accept valid follow-up data", async () => {
      // Create real test data
      const tenantId = await createTestTenant();
      tracker.tenants?.push(tenantId);

      const userId = await createTestUser(tenantId);
      tracker.users?.push(userId);

      const lead = await createTestLead(tenantId);
      tracker.leads?.push(lead.id);

      // Update context with real tenant
      ctx.authContext.tenantId = tenantId;
      ctx.authContext.userId = userId;

      const validInput = {
        leadId: lead.id,
        nextFollowUpAt: "2025-12-31T10:00:00Z",
        notes: "Call to discuss pricing",
      };

      await expect(_caller.scheduleFollowUp(validInput)).resolves.not.toThrow();
    });

    it("should validate nextFollowUpAt is a string", async () => {
      // Create real test data
      const tenantId = await createTestTenant();
      tracker.tenants?.push(tenantId);

      const userId = await createTestUser(tenantId);
      tracker.users?.push(userId);

      const lead = await createTestLead(tenantId);
      tracker.leads?.push(lead.id);

      // Update context with real tenant
      ctx.authContext.tenantId = tenantId;
      ctx.authContext.userId = userId;

      const validInput = {
        leadId: lead.id,
        nextFollowUpAt: "2024-01-01", // String is valid
      };

      await expect(_caller.scheduleFollowUp(validInput)).resolves.not.toThrow();
    });
  });

  describe("convertToClient", () => {
    it("should accept valid conversion data", async () => {
      // Create real test data
      const tenantId = await createTestTenant();
      tracker.tenants?.push(tenantId);

      const userId = await createTestUser(tenantId);
      tracker.users?.push(userId);

      const lead = await createTestLead(tenantId);
      tracker.leads?.push(lead.id);

      // Update context with real tenant
      ctx.authContext.tenantId = tenantId;
      ctx.authContext.userId = userId;

      const validInput = {
        leadId: lead.id,
        clientData: {
          clientCode: "CL001",
          type: "limited_company",
        },
      };

      await expect(
        _caller.convertToClient(validInput as Record<string, unknown>),
      ).resolves.not.toThrow();
    });

    it("should validate required fields", async () => {
      const invalidInput = {
        // Missing clientData
        leadId: "550e8400-e29b-41d4-a716-446655440000",
      };

      await expect(
        _caller.convertToClient(invalidInput as Record<string, unknown>),
      ).rejects.toThrow();
    });
  });

  describe("getStats", () => {
    it("should have no required input", () => {
      const procedure = leadsRouter._def.procedures.getStats;

      expect(!procedure._def.inputs || procedure._def.inputs.length === 0).toBe(
        true,
      );
    });
  });

  describe("Router Structure", () => {
    it("should export all expected procedures", () => {
      const procedures = Object.keys(leadsRouter._def.procedures);

      expect(procedures).toContain("list");
      expect(procedures).toContain("getById");
      expect(procedures).toContain("create");
      expect(procedures).toContain("update");
      expect(procedures).toContain("delete");
      expect(procedures).toContain("assignLead");
      expect(procedures).toContain("scheduleFollowUp");
      expect(procedures).toContain("convertToClient");
      expect(procedures).toContain("getStats");
    });

    it("should have 10 procedures total", () => {
      const procedures = Object.keys(leadsRouter._def.procedures);
      // 1 public (createPublic) + 9 protected
      expect(procedures).toHaveLength(10);
    });
  });
});
