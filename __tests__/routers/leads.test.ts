/**
 * Leads Router Tests
 *
 * Tests for the leads tRPC router
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Context } from "@/app/server/context";
import { leadsRouter } from "@/app/server/routers/leads";
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
    returning: vi.fn(),
    innerJoin: vi.fn().mockReturnThis(),
    leftJoin: vi.fn().mockReturnThis(),
  },
}));

// Mock auto-convert helper
vi.mock("@/lib/client-portal/auto-convert-lead", () => ({
  autoConvertLeadToClient: vi.fn().mockResolvedValue({
    success: true,
    clientId: "test-client-id",
  }),
}));

describe("app/server/routers/leads.ts", () => {
  let ctx: Context;
  let _caller: ReturnType<typeof createCaller<typeof leadsRouter>>;

  beforeEach(() => {
    ctx = createMockContext();
    _caller = createCaller(leadsRouter, ctx);
    vi.clearAllMocks();
  });

  describe("list", () => {
    it("should accept empty input", () => {
      expect(() => {
        leadsRouter._def.procedures.list._def.inputs[0]?.parse({});
      }).not.toThrow();
    });

    it("should accept search parameter", () => {
      expect(() => {
        leadsRouter._def.procedures.list._def.inputs[0]?.parse({
          search: "test lead",
        });
      }).not.toThrow();
    });

    it("should accept status filter", () => {
      expect(() => {
        leadsRouter._def.procedures.list._def.inputs[0]?.parse({
          status: "new",
        });
      }).not.toThrow();
    });

    it("should accept source filter", () => {
      expect(() => {
        leadsRouter._def.procedures.list._def.inputs[0]?.parse({
          source: "website",
        });
      }).not.toThrow();
    });

    it("should accept multiple filters", () => {
      expect(() => {
        leadsRouter._def.procedures.list._def.inputs[0]?.parse({
          search: "test",
          status: "contacted",
          source: "referral",
        });
      }).not.toThrow();
    });
  });

  describe("getById", () => {
    it("should accept valid UUID", () => {
      const validId = "550e8400-e29b-41d4-a716-446655440000";

      expect(() => {
        leadsRouter._def.procedures.getById._def.inputs[0]?.parse(validId);
      }).not.toThrow();
    });

    it("should validate input is a string", () => {
      expect(() => {
        leadsRouter._def.procedures.getById._def.inputs[0]?.parse(123);
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
        leadsRouter._def.procedures.create._def.inputs[0]?.parse(invalidInput);
      }).toThrow();
    });

    it("should accept valid lead data", () => {
      const validInput = {
        firstName: "John",
        lastName: "Doe",
        email: "john@example.com",
        company: "Acme Corp",
        status: "new" as const,
        source: "website" as const,
      };

      expect(() => {
        leadsRouter._def.procedures.create._def.inputs[0]?.parse(validInput);
      }).not.toThrow();
    });

    it("should accept any string as email", () => {
      // Note: email is z.string().optional() without .email() validation in leads
      const validInput = {
        firstName: "John",
        lastName: "Doe",
        email: "invalid-email", // Any string is valid
        companyName: "Test Corp",
      };

      expect(() => {
        leadsRouter._def.procedures.create._def.inputs[0]?.parse(validInput);
      }).not.toThrow();
    });

    it("should accept optional fields", () => {
      const validInput = {
        firstName: "John",
        lastName: "Doe",
        email: "john@example.com",
        company: "Acme Corp",
        phone: "+1234567890",
        notes: "Interested in accounting services",
      };

      expect(() => {
        leadsRouter._def.procedures.create._def.inputs[0]?.parse(validInput);
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
        leadsRouter._def.procedures.update._def.inputs[0]?.parse(invalidInput);
      }).toThrow();
    });

    it("should accept valid update data", () => {
      const validInput = {
        id: "550e8400-e29b-41d4-a716-446655440000",
        data: {
          status: "contacted" as const,
          notes: "Follow-up scheduled",
        },
      };

      expect(() => {
        leadsRouter._def.procedures.update._def.inputs[0]?.parse(validInput);
      }).not.toThrow();
    });

    it("should validate email format in updates", () => {
      const invalidInput = {
        id: "550e8400-e29b-41d4-a716-446655440000",
        email: "not-valid",
      };

      expect(() => {
        leadsRouter._def.procedures.update._def.inputs[0]?.parse(invalidInput);
      }).toThrow();
    });
  });

  describe("delete", () => {
    it("should accept valid lead ID", () => {
      const validId = "550e8400-e29b-41d4-a716-446655440000";

      expect(() => {
        leadsRouter._def.procedures.delete._def.inputs[0]?.parse(validId);
      }).not.toThrow();
    });

    it("should validate input is a string", () => {
      expect(() => {
        leadsRouter._def.procedures.delete._def.inputs[0]?.parse(null);
      }).toThrow();
    });
  });

  describe("assignLead", () => {
    it("should validate required fields", () => {
      const invalidInput = {
        // Missing assignedToId
        leadId: "550e8400-e29b-41d4-a716-446655440000",
      };

      expect(() => {
        leadsRouter._def.procedures.assignLead._def.inputs[0]?.parse(
          invalidInput,
        );
      }).toThrow();
    });

    it("should accept valid assignment data", () => {
      const validInput = {
        leadId: "550e8400-e29b-41d4-a716-446655440000",
        assignedToId: "660e8400-e29b-41d4-a716-446655440000",
      };

      expect(() => {
        leadsRouter._def.procedures.assignLead._def.inputs[0]?.parse(
          validInput,
        );
      }).not.toThrow();
    });
  });

  describe("scheduleFollowUp", () => {
    it("should validate required fields", () => {
      const invalidInput = {
        // Missing nextFollowUpAt
        leadId: "550e8400-e29b-41d4-a716-446655440000",
      };

      expect(() => {
        leadsRouter._def.procedures.scheduleFollowUp._def.inputs[0]?.parse(
          invalidInput,
        );
      }).toThrow();
    });

    it("should accept valid follow-up data", () => {
      const validInput = {
        leadId: "550e8400-e29b-41d4-a716-446655440000",
        nextFollowUpAt: "2025-12-31T10:00:00Z",
        notes: "Call to discuss pricing",
      };

      expect(() => {
        leadsRouter._def.procedures.scheduleFollowUp._def.inputs[0]?.parse(
          validInput,
        );
      }).not.toThrow();
    });

    it("should validate nextFollowUpAt is a string", () => {
      const validInput = {
        leadId: "550e8400-e29b-41d4-a716-446655440000",
        nextFollowUpAt: "2024-01-01", // String is valid
      };

      expect(() => {
        leadsRouter._def.procedures.scheduleFollowUp._def.inputs[0]?.parse(
          validInput,
        );
      }).not.toThrow();
    });
  });

  describe("convertToClient", () => {
    it("should accept valid conversion data", () => {
      const validInput = {
        leadId: "550e8400-e29b-41d4-a716-446655440000",
        clientData: {
          clientCode: "CL001",
          type: "limited_company",
        },
      };

      expect(() => {
        leadsRouter._def.procedures.convertToClient._def.inputs[0]?.parse(
          validInput,
        );
      }).not.toThrow();
    });

    it("should validate required fields", () => {
      const invalidInput = {
        // Missing clientData
        leadId: "550e8400-e29b-41d4-a716-446655440000",
      };

      expect(() => {
        leadsRouter._def.procedures.convertToClient._def.inputs[0]?.parse(
          invalidInput,
        );
      }).toThrow();
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
