/**
 * Pipeline Router Tests
 *
 * Tests for the pipeline tRPC router
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import { pipelineRouter } from "@/app/server/routers/pipeline";
import { createCaller, createMockContext, type TestContextWithAuth } from "../helpers/trpc";

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
  let ctx: TestContextWithAuth;
  let _caller: ReturnType<typeof createCaller<typeof pipelineRouter>>;

  beforeEach(() => {
    ctx = createMockContext();
    _caller = createCaller(pipelineRouter, ctx);
    vi.clearAllMocks();
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
