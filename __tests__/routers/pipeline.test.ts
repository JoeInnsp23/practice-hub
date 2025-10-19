/**
 * Pipeline Router Tests
 *
 * Tests for the pipeline tRPC router
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import { pipelineRouter } from "@/app/server/routers/pipeline";
import { createCaller, createMockContext } from "../helpers/trpc";
import type { Context } from "@/app/server/context";

// Mock the database
vi.mock("@/lib/db", () => ({
  db: {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    leftJoin: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
    returning: vi.fn().mockResolvedValue([]),
    insert: vi.fn().mockReturnThis(),
    values: vi.fn().mockReturnThis(),
  },
}));

describe("app/server/routers/pipeline.ts", () => {
  let ctx: Context;
  let caller: ReturnType<typeof createCaller<typeof pipelineRouter>>;

  beforeEach(() => {
    ctx = createMockContext();
    caller = createCaller(pipelineRouter, ctx);
    vi.clearAllMocks();
  });

  describe("getDeals", () => {
    it("should accept empty input", () => {
      expect(() => {
        pipelineRouter._def.procedures.getDeals._def.inputs[0]?.parse({});
      }).not.toThrow();
    });

    it("should accept assignedToId filter", () => {
      expect(() => {
        pipelineRouter._def.procedures.getDeals._def.inputs[0]?.parse({
          assignedToId: "550e8400-e29b-41d4-a716-446655440000",
        });
      }).not.toThrow();
    });

    it("should accept search filter", () => {
      expect(() => {
        pipelineRouter._def.procedures.getDeals._def.inputs[0]?.parse({
          search: "Acme Corp",
        });
      }).not.toThrow();
    });

    it("should accept date range filters", () => {
      expect(() => {
        pipelineRouter._def.procedures.getDeals._def.inputs[0]?.parse({
          dateFrom: "2025-01-01",
          dateTo: "2025-01-31",
        });
      }).not.toThrow();
    });

    it("should accept value range filters", () => {
      expect(() => {
        pipelineRouter._def.procedures.getDeals._def.inputs[0]?.parse({
          minValue: 1000,
          maxValue: 10000,
        });
      }).not.toThrow();
    });

    it("should accept all filters combined", () => {
      expect(() => {
        pipelineRouter._def.procedures.getDeals._def.inputs[0]?.parse({
          assignedToId: "550e8400-e29b-41d4-a716-446655440000",
          search: "Test Company",
          dateFrom: "2025-01-01",
          dateTo: "2025-01-31",
          minValue: 500,
          maxValue: 5000,
        });
      }).not.toThrow();
    });
  });

  describe("updateStage", () => {
    it("should validate required fields", () => {
      const invalidInput = {
        // Missing dealId, dealType, newStage
      };

      expect(() => {
        pipelineRouter._def.procedures.updateStage._def.inputs[0]?.parse(
          invalidInput,
        );
      }).toThrow();
    });

    it("should accept valid lead stage update", () => {
      const validInput = {
        dealId: "550e8400-e29b-41d4-a716-446655440000",
        dealType: "lead" as const,
        newStage: "qualified" as const,
      };

      expect(() => {
        pipelineRouter._def.procedures.updateStage._def.inputs[0]?.parse(
          validInput,
        );
      }).not.toThrow();
    });

    it("should accept valid proposal stage update", () => {
      const validInput = {
        dealId: "550e8400-e29b-41d4-a716-446655440000",
        dealType: "proposal" as const,
        newStage: "converted" as const,
      };

      expect(() => {
        pipelineRouter._def.procedures.updateStage._def.inputs[0]?.parse(
          validInput,
        );
      }).not.toThrow();
    });

    it("should validate dealType enum values", () => {
      const invalidInput = {
        dealId: "550e8400-e29b-41d4-a716-446655440000",
        dealType: "invalid",
        newStage: "qualified",
      };

      expect(() => {
        pipelineRouter._def.procedures.updateStage._def.inputs[0]?.parse(
          invalidInput,
        );
      }).toThrow();
    });

    it("should validate newStage enum values", () => {
      const invalidInput = {
        dealId: "550e8400-e29b-41d4-a716-446655440000",
        dealType: "lead",
        newStage: "invalid_stage",
      };

      expect(() => {
        pipelineRouter._def.procedures.updateStage._def.inputs[0]?.parse(
          invalidInput,
        );
      }).toThrow();
    });

    it("should accept all valid pipeline stages", () => {
      const validStages = [
        "new",
        "contacted",
        "qualified",
        "proposal_sent",
        "negotiating",
        "converted",
        "lost",
      ];

      for (const stage of validStages) {
        expect(() => {
          pipelineRouter._def.procedures.updateStage._def.inputs[0]?.parse({
            dealId: "550e8400-e29b-41d4-a716-446655440000",
            dealType: "lead",
            newStage: stage,
          });
        }).not.toThrow();
      }
    });
  });

  describe("Router Structure", () => {
    it("should export all expected procedures", () => {
      const procedures = Object.keys(pipelineRouter._def.procedures);

      expect(procedures).toContain("getDeals");
      expect(procedures).toContain("updateStage");
    });

    it("should have 2 procedures total", () => {
      const procedures = Object.keys(pipelineRouter._def.procedures);
      expect(procedures).toHaveLength(2);
    });
  });
});
