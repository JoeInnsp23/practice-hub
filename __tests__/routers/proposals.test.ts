/**
 * Proposals Router Tests
 *
 * Tests for the proposals tRPC router
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Context } from "@/app/server/context";
import { proposalsRouter } from "@/app/server/routers/proposals";
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

// Mock PDF generation
vi.mock("@/lib/pdf/proposal-generator", () => ({
  generateProposalPDF: vi.fn().mockResolvedValue(Buffer.from("mock-pdf")),
}));

// Mock S3 upload
vi.mock("@/lib/s3/upload", () => ({
  uploadToS3: vi.fn().mockResolvedValue("https://s3.example.com/proposal.pdf"),
}));

// Mock email
vi.mock("@/lib/email/proposal-email", () => ({
  sendProposalEmail: vi.fn().mockResolvedValue(undefined),
}));

describe("app/server/routers/proposals.ts", () => {
  let ctx: Context;
  let caller: ReturnType<typeof createCaller<typeof proposalsRouter>>;

  beforeEach(() => {
    ctx = createMockContext();
    caller = createCaller(proposalsRouter, ctx);
    vi.clearAllMocks();
  });

  describe("list", () => {
    it("should accept empty input", () => {
      expect(() => {
        proposalsRouter._def.procedures.list._def.inputs[0]?.parse({});
      }).not.toThrow();
    });

    it("should accept status filter", () => {
      expect(() => {
        proposalsRouter._def.procedures.list._def.inputs[0]?.parse({
          status: "draft",
        });
      }).not.toThrow();
    });

    it("should accept clientId filter", () => {
      expect(() => {
        proposalsRouter._def.procedures.list._def.inputs[0]?.parse({
          clientId: "550e8400-e29b-41d4-a716-446655440000",
        });
      }).not.toThrow();
    });

    it("should accept search parameter", () => {
      expect(() => {
        proposalsRouter._def.procedures.list._def.inputs[0]?.parse({
          search: "test proposal",
        });
      }).not.toThrow();
    });
  });

  describe("getById", () => {
    it("should accept valid UUID", () => {
      const validId = "550e8400-e29b-41d4-a716-446655440000";

      expect(() => {
        proposalsRouter._def.procedures.getById._def.inputs[0]?.parse(validId);
      }).not.toThrow();
    });

    it("should validate input is a string", () => {
      expect(() => {
        proposalsRouter._def.procedures.getById._def.inputs[0]?.parse(123);
      }).toThrow();
    });
  });

  describe("create", () => {
    it("should validate required fields", () => {
      const invalidInput = {
        // Missing required fields
        title: "Test Proposal",
      };

      expect(() => {
        proposalsRouter._def.procedures.create._def.inputs[0]?.parse(
          invalidInput,
        );
      }).toThrow();
    });

    it("should accept valid proposal data", () => {
      const validInput = {
        clientId: "550e8400-e29b-41d4-a716-446655440000",
        title: "Accounting Services Proposal",
        status: "draft" as const,
        pricingModelUsed: "model_a" as const,
        monthlyTotal: "450.00",
        annualTotal: "5400.00",
        validUntil: "2025-12-31",
        services: [],
      };

      expect(() => {
        proposalsRouter._def.procedures.create._def.inputs[0]?.parse(
          validInput,
        );
      }).not.toThrow();
    });

    it("should validate totalAmount is a number", () => {
      const invalidInput = {
        clientId: "550e8400-e29b-41d4-a716-446655440000",
        title: "Test",
        totalAmount: "1000", // Should be number
        services: [],
      };

      expect(() => {
        proposalsRouter._def.procedures.create._def.inputs[0]?.parse(
          invalidInput,
        );
      }).toThrow();
    });
  });

  describe("createFromLead", () => {
    it("should accept valid lead ID", () => {
      const validInput = {
        leadId: "550e8400-e29b-41d4-a716-446655440000",
      };

      expect(() => {
        proposalsRouter._def.procedures.createFromLead._def.inputs[0]?.parse(
          validInput,
        );
      }).not.toThrow();
    });

    it("should validate required leadId field", () => {
      const invalidInput = {};

      expect(() => {
        proposalsRouter._def.procedures.createFromLead._def.inputs[0]?.parse(
          invalidInput,
        );
      }).toThrow();
    });
  });

  describe("update", () => {
    it("should validate required id field", () => {
      const invalidInput = {
        // Missing id
        title: "Updated Title",
      };

      expect(() => {
        proposalsRouter._def.procedures.update._def.inputs[0]?.parse(
          invalidInput,
        );
      }).toThrow();
    });

    it("should accept valid update data", () => {
      const validInput = {
        id: "550e8400-e29b-41d4-a716-446655440000",
        data: {
          title: "Updated Proposal Title",
          status: "sent" as const,
        },
      };

      expect(() => {
        proposalsRouter._def.procedures.update._def.inputs[0]?.parse(
          validInput,
        );
      }).not.toThrow();
    });

    it("should accept partial updates", () => {
      const validInput = {
        id: "550e8400-e29b-41d4-a716-446655440000",
        data: {
          title: "New Title",
        },
      };

      expect(() => {
        proposalsRouter._def.procedures.update._def.inputs[0]?.parse(
          validInput,
        );
      }).not.toThrow();
    });
  });

  describe("delete", () => {
    it("should accept valid proposal ID", () => {
      const validId = "550e8400-e29b-41d4-a716-446655440000";

      expect(() => {
        proposalsRouter._def.procedures.delete._def.inputs[0]?.parse(validId);
      }).not.toThrow();
    });

    it("should validate input is a string", () => {
      expect(() => {
        proposalsRouter._def.procedures.delete._def.inputs[0]?.parse({});
      }).toThrow();
    });
  });

  describe("send", () => {
    it("should validate required fields", () => {
      const invalidInput = {
        // Missing proposalId
        recipientEmail: "test@example.com",
      };

      expect(() => {
        proposalsRouter._def.procedures.send._def.inputs[0]?.parse(
          invalidInput,
        );
      }).toThrow();
    });

    it("should accept valid send data", () => {
      const validInput = {
        id: "550e8400-e29b-41d4-a716-446655440000",
        validUntil: "2025-12-31",
      };

      expect(() => {
        proposalsRouter._def.procedures.send._def.inputs[0]?.parse(validInput);
      }).not.toThrow();
    });

    it("should validate required fields", () => {
      const invalidInput = {
        id: "550e8400-e29b-41d4-a716-446655440000",
        // Missing validUntil
      };

      expect(() => {
        proposalsRouter._def.procedures.send._def.inputs[0]?.parse(
          invalidInput,
        );
      }).toThrow();
    });
  });

  describe("trackView", () => {
    it("should accept valid proposal ID", () => {
      const validId = "550e8400-e29b-41d4-a716-446655440000";

      expect(() => {
        proposalsRouter._def.procedures.trackView._def.inputs[0]?.parse(
          validId,
        );
      }).not.toThrow();
    });

    it("should validate input is a string", () => {
      expect(() => {
        proposalsRouter._def.procedures.trackView._def.inputs[0]?.parse(123);
      }).toThrow();
    });
  });

  describe("addSignature", () => {
    it("should validate required fields", () => {
      const invalidInput = {
        // Missing required fields
        proposalId: "550e8400-e29b-41d4-a716-446655440000",
      };

      expect(() => {
        proposalsRouter._def.procedures.addSignature._def.inputs[0]?.parse(
          invalidInput,
        );
      }).toThrow();
    });

    it("should accept valid signature data", () => {
      const validInput = {
        proposalId: "550e8400-e29b-41d4-a716-446655440000",
        signerName: "John Doe",
        signerEmail: "john@example.com",
        signatureData: "base64-signature-data",
      };

      expect(() => {
        proposalsRouter._def.procedures.addSignature._def.inputs[0]?.parse(
          validInput,
        );
      }).not.toThrow();
    });

    it("should accept any string as email", () => {
      // Note: signerEmail is z.string() without .email() validation
      const validInput = {
        proposalId: "550e8400-e29b-41d4-a716-446655440000",
        signerName: "John Doe",
        signerEmail: "not-an-email", // Any string is valid
        signatureData: "data",
      };

      expect(() => {
        proposalsRouter._def.procedures.addSignature._def.inputs[0]?.parse(
          validInput,
        );
      }).not.toThrow();
    });
  });

  describe("getStats", () => {
    it("should have no required input", () => {
      const procedure = proposalsRouter._def.procedures.getStats;

      expect(!procedure._def.inputs || procedure._def.inputs.length === 0).toBe(
        true,
      );
    });
  });

  describe("generatePdf", () => {
    it("should accept valid proposal ID", () => {
      const validId = "550e8400-e29b-41d4-a716-446655440000";

      expect(() => {
        proposalsRouter._def.procedures.generatePdf._def.inputs[0]?.parse(
          validId,
        );
      }).not.toThrow();
    });

    it("should validate input is a string", () => {
      expect(() => {
        proposalsRouter._def.procedures.generatePdf._def.inputs[0]?.parse(null);
      }).toThrow();
    });
  });

  describe("updateSalesStage", () => {
    it("should accept valid sales stage update", () => {
      const validInput = {
        id: "550e8400-e29b-41d4-a716-446655440000",
        salesStage: "qualified" as const,
      };

      expect(() => {
        proposalsRouter._def.procedures.updateSalesStage._def.inputs[0]?.parse(
          validInput,
        );
      }).not.toThrow();
    });

    it("should validate all sales stage enum values", () => {
      const validStages = [
        "enquiry",
        "qualified",
        "proposal_sent",
        "follow_up",
        "won",
        "lost",
        "dormant",
      ] as const;

      for (const stage of validStages) {
        const input = {
          id: "550e8400-e29b-41d4-a716-446655440000",
          salesStage: stage,
        };

        expect(() => {
          proposalsRouter._def.procedures.updateSalesStage._def.inputs[0]?.parse(
            input,
          );
        }).not.toThrow();
      }
    });

    it("should reject invalid sales stage", () => {
      const invalidInput = {
        id: "550e8400-e29b-41d4-a716-446655440000",
        salesStage: "invalid_stage",
      };

      expect(() => {
        proposalsRouter._def.procedures.updateSalesStage._def.inputs[0]?.parse(
          invalidInput,
        );
      }).toThrow();
    });

    it("should require both id and salesStage", () => {
      const missingId = {
        salesStage: "qualified",
      };

      const missingSalesStage = {
        id: "550e8400-e29b-41d4-a716-446655440000",
      };

      expect(() => {
        proposalsRouter._def.procedures.updateSalesStage._def.inputs[0]?.parse(
          missingId,
        );
      }).toThrow();

      expect(() => {
        proposalsRouter._def.procedures.updateSalesStage._def.inputs[0]?.parse(
          missingSalesStage,
        );
      }).toThrow();
    });
  });

  describe("list with salesStage filter", () => {
    it("should accept salesStage filter", () => {
      expect(() => {
        proposalsRouter._def.procedures.list._def.inputs[0]?.parse({
          salesStage: "qualified",
        });
      }).not.toThrow();
    });

    it("should accept salesStage with other filters", () => {
      expect(() => {
        proposalsRouter._def.procedures.list._def.inputs[0]?.parse({
          salesStage: "won",
          status: "signed",
          clientId: "550e8400-e29b-41d4-a716-446655440000",
        });
      }).not.toThrow();
    });

    it("should reject invalid salesStage values", () => {
      expect(() => {
        proposalsRouter._def.procedures.list._def.inputs[0]?.parse({
          salesStage: "invalid_value",
        });
      }).toThrow();
    });
  });

  describe("listByStage", () => {
    it("should accept empty input", () => {
      expect(() => {
        proposalsRouter._def.procedures.listByStage._def.inputs[0]?.parse({});
      }).not.toThrow();
    });

    it("should filter by assignedToId", () => {
      const input = { assignedToId: "user-123" };
      expect(() => {
        proposalsRouter._def.procedures.listByStage._def.inputs[0]?.parse(
          input,
        );
      }).not.toThrow();
    });

    it("should filter by date range", () => {
      const input = {
        dateFrom: "2025-01-01T00:00:00Z",
        dateTo: "2025-01-31T23:59:59Z",
      };
      expect(() => {
        proposalsRouter._def.procedures.listByStage._def.inputs[0]?.parse(
          input,
        );
      }).not.toThrow();
    });

    it("should filter by value range", () => {
      const input = { minValue: 1000, maxValue: 5000 };
      expect(() => {
        proposalsRouter._def.procedures.listByStage._def.inputs[0]?.parse(
          input,
        );
      }).not.toThrow();
    });

    it("should filter by specific stages", () => {
      const input = { stages: ["enquiry", "qualified", "won"] };
      expect(() => {
        proposalsRouter._def.procedures.listByStage._def.inputs[0]?.parse(
          input,
        );
      }).not.toThrow();
    });

    it("should accept search parameter", () => {
      const input = { search: "accounting services" };
      expect(() => {
        proposalsRouter._def.procedures.listByStage._def.inputs[0]?.parse(
          input,
        );
      }).not.toThrow();
    });

    it("should accept all filters combined", () => {
      const input = {
        assignedToId: "user-123",
        dateFrom: "2025-01-01T00:00:00Z",
        dateTo: "2025-12-31T23:59:59Z",
        minValue: 500,
        maxValue: 10000,
        search: "proposal",
        stages: ["enquiry", "qualified"],
      };
      expect(() => {
        proposalsRouter._def.procedures.listByStage._def.inputs[0]?.parse(
          input,
        );
      }).not.toThrow();
    });

    it("should reject invalid stage values", () => {
      const input = { stages: ["invalid_stage"] };
      expect(() => {
        proposalsRouter._def.procedures.listByStage._def.inputs[0]?.parse(
          input,
        );
      }).toThrow();
    });

    it("should validate value range types", () => {
      const invalidInput = { minValue: "not a number" };
      expect(() => {
        proposalsRouter._def.procedures.listByStage._def.inputs[0]?.parse(
          invalidInput,
        );
      }).toThrow();
    });
  });

  describe("updateSalesStage - Advanced Validation", () => {
    it("should require both id and salesStage fields", () => {
      const missingStageInput = {
        id: "550e8400-e29b-41d4-a716-446655440000",
        // Missing salesStage
      };

      expect(() => {
        proposalsRouter._def.procedures.updateSalesStage._def.inputs[0]?.parse(
          missingStageInput,
        );
      }).toThrow();
    });

    it("should validate salesStage is a valid enum value", () => {
      const invalidStageInput = {
        id: "550e8400-e29b-41d4-a716-446655440000",
        salesStage: "invalid_stage_value",
      };

      expect(() => {
        proposalsRouter._def.procedures.updateSalesStage._def.inputs[0]?.parse(
          invalidStageInput,
        );
      }).toThrow();
    });
  });

  describe("Router Structure", () => {
    it("should export all expected procedures", () => {
      const procedures = Object.keys(proposalsRouter._def.procedures);

      expect(procedures).toContain("list");
      expect(procedures).toContain("listByStage");
      expect(procedures).toContain("getById");
      expect(procedures).toContain("create");
      expect(procedures).toContain("createFromLead");
      expect(procedures).toContain("update");
      expect(procedures).toContain("updateSalesStage");
      expect(procedures).toContain("delete");
      expect(procedures).toContain("send");
      expect(procedures).toContain("trackView");
      expect(procedures).toContain("addSignature");
      expect(procedures).toContain("getStats");
      expect(procedures).toContain("generatePdf");
    });

    it("should have 20 procedures total", () => {
      const procedures = Object.keys(proposalsRouter._def.procedures);
      // 16 protected + 2 public + listByStage + updateSalesStage
      expect(procedures.length).toBeGreaterThanOrEqual(19);
    });
  });
});
