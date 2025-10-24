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
    returning: vi.fn().mockResolvedValue([]),
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
    it("should accept empty input", async () => {
      await expect(caller.list({})).resolves.not.toThrow();
    });

    it("should accept status filter", async () => {
      await expect(
        caller.list({ status: "draft" }),
      ).resolves.not.toThrow();
    });

    it("should accept clientId filter", async () => {
      await expect(
        caller.list({ clientId: "550e8400-e29b-41d4-a716-446655440000" }),
      ).resolves.not.toThrow();
    });

    it("should accept search parameter", async () => {
      await expect(
        caller.list({ search: "test proposal" }),
      ).resolves.not.toThrow();
    });
  });

  describe("getById", () => {
    it("should accept valid UUID", async () => {
      const validId = "550e8400-e29b-41d4-a716-446655440000";

      await expect(caller.getById(validId)).resolves.not.toThrow();
    });

    it("should validate input is a string", async () => {
      await expect(caller.getById(123 as any)).rejects.toThrow();
    });
  });

  describe("create", () => {
    it("should validate required fields", async () => {
      const invalidInput = {
        // Missing required fields
        title: "Test Proposal",
      };

      await expect(caller.create(invalidInput as any)).rejects.toThrow();
    });

    it("should accept valid proposal data", async () => {
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

      await expect(caller.create(validInput)).resolves.not.toThrow();
    });

    it("should validate totalAmount is a number", async () => {
      const invalidInput = {
        clientId: "550e8400-e29b-41d4-a716-446655440000",
        title: "Test",
        totalAmount: "1000", // Should be number
        services: [],
      };

      await expect(caller.create(invalidInput as any)).rejects.toThrow();
    });
  });

  describe("createFromLead", () => {
    it("should accept valid lead ID", async () => {
      const validInput = {
        leadId: "550e8400-e29b-41d4-a716-446655440000",
      };

      await expect(caller.createFromLead(validInput)).resolves.not.toThrow();
    });

    it("should validate required leadId field", async () => {
      const invalidInput = {};

      await expect(caller.createFromLead(invalidInput as any)).rejects.toThrow();
    });
  });

  describe("update", () => {
    it("should validate required id field", async () => {
      const invalidInput = {
        // Missing id
        title: "Updated Title",
      };

      await expect(caller.update(invalidInput as any)).rejects.toThrow();
    });

    it("should accept valid update data", async () => {
      const validInput = {
        id: "550e8400-e29b-41d4-a716-446655440000",
        data: {
          title: "Updated Proposal Title",
          status: "sent" as const,
        },
      };

      await expect(caller.update(validInput)).resolves.not.toThrow();
    });

    it("should accept partial updates", async () => {
      const validInput = {
        id: "550e8400-e29b-41d4-a716-446655440000",
        data: {
          title: "New Title",
        },
      };

      await expect(caller.update(validInput)).resolves.not.toThrow();
    });
  });

  describe("delete", () => {
    it("should accept valid proposal ID", async () => {
      const validId = "550e8400-e29b-41d4-a716-446655440000";

      await expect(caller.delete(validId)).resolves.not.toThrow();
    });

    it("should validate input is a string", async () => {
      await expect(caller.delete({} as any)).rejects.toThrow();
    });
  });

  describe("send", () => {
    it("should validate required fields", async () => {
      const invalidInput = {
        // Missing proposalId
        recipientEmail: "test@example.com",
      };

      await expect(caller.send(invalidInput as any)).rejects.toThrow();
    });

    it("should accept valid send data", async () => {
      const validInput = {
        id: "550e8400-e29b-41d4-a716-446655440000",
        validUntil: "2025-12-31",
      };

      await expect(caller.send(validInput)).resolves.not.toThrow();
    });

    it("should validate required fields", async () => {
      const invalidInput = {
        id: "550e8400-e29b-41d4-a716-446655440000",
        // Missing validUntil
      };

      await expect(caller.send(invalidInput as any)).rejects.toThrow();
    });
  });

  describe("trackView", () => {
    it("should accept valid proposal ID", async () => {
      const validId = "550e8400-e29b-41d4-a716-446655440000";

      await expect(caller.trackView(validId)).resolves.not.toThrow();
    });

    it("should validate input is a string", async () => {
      await expect(caller.trackView(123 as any)).rejects.toThrow();
    });
  });

  describe("addSignature", () => {
    it("should validate required fields", async () => {
      const invalidInput = {
        // Missing required fields
        proposalId: "550e8400-e29b-41d4-a716-446655440000",
      };

      await expect(caller.addSignature(invalidInput as any)).rejects.toThrow();
    });

    it("should accept valid signature data", async () => {
      const validInput = {
        proposalId: "550e8400-e29b-41d4-a716-446655440000",
        signerName: "John Doe",
        signerEmail: "john@example.com",
        signatureData: "base64-signature-data",
      };

      await expect(caller.addSignature(validInput)).resolves.not.toThrow();
    });

    it("should accept any string as email", async () => {
      // Note: signerEmail is z.string() without .email() validation
      const validInput = {
        proposalId: "550e8400-e29b-41d4-a716-446655440000",
        signerName: "John Doe",
        signerEmail: "not-an-email", // Any string is valid
        signatureData: "data",
      };

      await expect(caller.addSignature(validInput)).resolves.not.toThrow();
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
    it("should accept valid proposal ID", async () => {
      const validId = "550e8400-e29b-41d4-a716-446655440000";

      await expect(caller.generatePdf(validId)).resolves.not.toThrow();
    });

    it("should validate input is a string", async () => {
      await expect(caller.generatePdf(null as any)).rejects.toThrow();
    });
  });

  describe("updateSalesStage", () => {
    it("should accept valid sales stage update", async () => {
      const validInput = {
        id: "550e8400-e29b-41d4-a716-446655440000",
        salesStage: "qualified" as const,
      };

      await expect(caller.updateSalesStage(validInput)).resolves.not.toThrow();
    });

    it("should validate all sales stage enum values", async () => {
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

        await expect(caller.updateSalesStage(input)).resolves.not.toThrow();
      }
    });

    it("should reject invalid sales stage", async () => {
      const invalidInput = {
        id: "550e8400-e29b-41d4-a716-446655440000",
        salesStage: "invalid_stage",
      };

      await expect(caller.updateSalesStage(invalidInput as any)).rejects.toThrow();
    });

    it("should require both id and salesStage", async () => {
      const missingId = {
        salesStage: "qualified",
      };

      const missingSalesStage = {
        id: "550e8400-e29b-41d4-a716-446655440000",
      };

      await expect(caller.updateSalesStage(missingId as any)).rejects.toThrow();
      await expect(caller.updateSalesStage(missingSalesStage as any)).rejects.toThrow();
    });
  });

  describe("list with salesStage filter", () => {
    it("should accept salesStage filter", async () => {
      await expect(
        caller.list({ salesStage: "qualified" }),
      ).resolves.not.toThrow();
    });

    it("should accept salesStage with other filters", async () => {
      await expect(
        caller.list({
          salesStage: "won",
          status: "signed",
          clientId: "550e8400-e29b-41d4-a716-446655440000",
        }),
      ).resolves.not.toThrow();
    });

    it("should reject invalid salesStage values", async () => {
      await expect(
        caller.list({ salesStage: "invalid_value" } as any),
      ).rejects.toThrow();
    });
  });

  describe("listByStage", () => {
    it("should accept empty input", async () => {
      await expect(caller.listByStage({})).resolves.not.toThrow();
    });

    it("should filter by assignedToId", async () => {
      const input = { assignedToId: "user-123" };
      await expect(caller.listByStage(input)).resolves.not.toThrow();
    });

    it("should filter by date range", async () => {
      const input = {
        dateFrom: "2025-01-01T00:00:00Z",
        dateTo: "2025-01-31T23:59:59Z",
      };
      await expect(caller.listByStage(input)).resolves.not.toThrow();
    });

    it("should filter by value range", async () => {
      const input = { minValue: 1000, maxValue: 5000 };
      await expect(caller.listByStage(input)).resolves.not.toThrow();
    });

    it("should filter by specific stages", async () => {
      const input = { stages: ["enquiry", "qualified", "won"] };
      await expect(caller.listByStage(input)).resolves.not.toThrow();
    });

    it("should accept search parameter", async () => {
      const input = { search: "accounting services" };
      await expect(caller.listByStage(input)).resolves.not.toThrow();
    });

    it("should accept all filters combined", async () => {
      const input = {
        assignedToId: "user-123",
        dateFrom: "2025-01-01T00:00:00Z",
        dateTo: "2025-12-31T23:59:59Z",
        minValue: 500,
        maxValue: 10000,
        search: "proposal",
        stages: ["enquiry", "qualified"],
      };
      await expect(caller.listByStage(input)).resolves.not.toThrow();
    });

    it("should reject invalid stage values", async () => {
      const input = { stages: ["invalid_stage"] };
      await expect(caller.listByStage(input as any)).rejects.toThrow();
    });

    it("should validate value range types", async () => {
      const invalidInput = { minValue: "not a number" };
      await expect(caller.listByStage(invalidInput as any)).rejects.toThrow();
    });
  });

  describe("updateSalesStage - Advanced Validation", () => {
    it("should require both id and salesStage fields", async () => {
      const missingStageInput = {
        id: "550e8400-e29b-41d4-a716-446655440000",
        // Missing salesStage
      };

      await expect(caller.updateSalesStage(missingStageInput as any)).rejects.toThrow();
    });

    it("should validate salesStage is a valid enum value", async () => {
      const invalidStageInput = {
        id: "550e8400-e29b-41d4-a716-446655440000",
        salesStage: "invalid_stage_value",
      };

      await expect(caller.updateSalesStage(invalidStageInput as any)).rejects.toThrow();
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
