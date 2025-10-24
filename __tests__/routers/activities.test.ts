/**
 * Activities Router Tests
 *
 * Tests for the activities tRPC router
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Context } from "@/app/server/context";
import { activitiesRouter } from "@/app/server/routers/activities";
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
    values: vi.fn().mockReturnThis(),
    returning: vi.fn().mockResolvedValue([]),
  },
}));

describe("app/server/routers/activities.ts", () => {
  let ctx: Context;
  let _caller: ReturnType<typeof createCaller<typeof activitiesRouter>>;

  beforeEach(() => {
    ctx = createMockContext();
    _caller = createCaller(activitiesRouter, ctx);
    vi.clearAllMocks();
  });

  describe("getRecent", () => {
    it("should accept empty input", async () => {
      await expect(_caller.getRecent({})).resolves.not.toThrow();
    });

    it("should accept limit parameter", async () => {
      await expect(_caller.getRecent({ limit: 10 })).resolves.not.toThrow();
    });

    it("should validate limit min value", async () => {
      await expect(
        _caller.getRecent({ limit: 0 }), // Below minimum of 1
      ).rejects.toThrow();
    });

    it("should validate limit max value", async () => {
      await expect(
        _caller.getRecent({ limit: 101 }), // Exceeds max of 100
      ).rejects.toThrow();
    });
  });

  describe("list", () => {
    it("should validate required fields", async () => {
      await expect(
        _caller.list({
          limit: 50,
        }),
      ).rejects.toThrow();
    });

    it("should accept valid input", async () => {
      await expect(
        _caller.list({
          entityType: "client",
          entityId: "550e8400-e29b-41d4-a716-446655440000",
        }),
      ).resolves.not.toThrow();
    });

    it("should accept limit parameter", async () => {
      await expect(
        _caller.list({
          entityType: "lead",
          entityId: "660e8400-e29b-41d4-a716-446655440000",
          limit: 25,
        }),
      ).resolves.not.toThrow();
    });
  });

  describe("create", () => {
    it("should validate required fields", async () => {
      await expect(
        _caller.create({
          metadata: { test: "value" },
        }),
      ).rejects.toThrow();
    });

    it("should accept valid activity data", async () => {
      await expect(
        _caller.create({
          entityType: "task",
          entityId: "550e8400-e29b-41d4-a716-446655440000",
          action: "completed",
          description: "Task marked as complete",
        }),
      ).resolves.not.toThrow();
    });

    it("should accept optional metadata", async () => {
      await expect(
        _caller.create({
          entityType: "invoice",
          entityId: "660e8400-e29b-41d4-a716-446655440000",
          action: "sent",
          description: "Invoice sent to client",
          metadata: {
            invoiceNumber: "INV-001",
            amount: 1000,
          },
        }),
      ).resolves.not.toThrow();
    });
  });

  describe("getActivityCounts", () => {
    it("should validate required fields", async () => {
      await expect(
        _caller.getActivityCounts({
          entityType: "client",
        }),
      ).rejects.toThrow();
    });

    it("should accept valid input", async () => {
      await expect(
        _caller.getActivityCounts({
          entityType: "client",
          entityId: "550e8400-e29b-41d4-a716-446655440000",
        }),
      ).resolves.not.toThrow();
    });
  });

  describe("Router Structure", () => {
    it("should export all expected procedures", () => {
      const procedures = Object.keys(activitiesRouter._def.procedures);

      expect(procedures).toContain("getRecent");
      expect(procedures).toContain("list");
      expect(procedures).toContain("create");
      expect(procedures).toContain("getActivityCounts");
    });

    it("should have 4 procedures total", () => {
      const procedures = Object.keys(activitiesRouter._def.procedures);
      expect(procedures).toHaveLength(4);
    });
  });
});
