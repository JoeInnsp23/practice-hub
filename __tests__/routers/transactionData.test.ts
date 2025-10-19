/**
 * TransactionData Router Tests
 *
 * Tests for the transactionData tRPC router
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import { TRPCError } from "@trpc/server";
import { transactionDataRouter } from "@/app/server/routers/transactionData";
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
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
    values: vi.fn().mockReturnThis(),
    returning: vi.fn(),
    onConflictDoUpdate: vi.fn().mockReturnThis(),
  },
}));

// Mock Xero client
vi.mock("@/lib/xero/client", () => ({
  getValidAccessToken: vi.fn(),
  fetchBankTransactions: vi.fn(),
  calculateMonthlyTransactions: vi.fn(),
}));

describe("app/server/routers/transactionData.ts", () => {
  let ctx: Context;
  let caller: ReturnType<typeof createCaller<typeof transactionDataRouter>>;

  beforeEach(() => {
    ctx = createMockContext();
    caller = createCaller(transactionDataRouter, ctx);
    vi.clearAllMocks();
  });

  describe("getByClient", () => {
    it("should accept valid client ID", () => {
      const clientId = "550e8400-e29b-41d4-a716-446655440000";

      // Should not throw on valid UUID
      expect(() => {
        transactionDataRouter._def.procedures.getByClient._def.inputs[0]?.parse(
          clientId,
        );
      }).not.toThrow();
    });

    it("should validate input is a string", () => {
      expect(() => {
        transactionDataRouter._def.procedures.getByClient._def.inputs[0]?.parse(
          123,
        );
      }).toThrow();
    });
  });

  describe("estimate", () => {
    it("should validate required fields", () => {
      const invalidInput = {
        clientId: "test-id",
        // Missing required fields
      };

      expect(() => {
        transactionDataRouter._def.procedures.estimate._def.inputs[0]?.parse(
          invalidInput,
        );
      }).toThrow();
    });

    it("should accept valid estimate input", () => {
      const validInput = {
        clientId: "550e8400-e29b-41d4-a716-446655440000",
        turnover: "150k-249k",
        industry: "standard",
        vatRegistered: true,
        saveEstimate: false,
      };

      expect(() => {
        transactionDataRouter._def.procedures.estimate._def.inputs[0]?.parse(
          validInput,
        );
      }).not.toThrow();
    });

    it("should validate turnover is a string", () => {
      const invalidInput = {
        clientId: "test-id",
        turnover: 150000, // Should be string
        industry: "standard",
        vatRegistered: true,
      };

      expect(() => {
        transactionDataRouter._def.procedures.estimate._def.inputs[0]?.parse(
          invalidInput,
        );
      }).toThrow();
    });

    it("should validate industry is a string", () => {
      const invalidInput = {
        clientId: "test-id",
        turnover: "150k-249k",
        industry: 123, // Should be string
        vatRegistered: true,
      };

      expect(() => {
        transactionDataRouter._def.procedures.estimate._def.inputs[0]?.parse(
          invalidInput,
        );
      }).toThrow();
    });

    it("should validate vatRegistered is a boolean", () => {
      const invalidInput = {
        clientId: "test-id",
        turnover: "150k-249k",
        industry: "standard",
        vatRegistered: "yes", // Should be boolean
      };

      expect(() => {
        transactionDataRouter._def.procedures.estimate._def.inputs[0]?.parse(
          invalidInput,
        );
      }).toThrow();
    });
  });

  describe("fetchFromXero", () => {
    it("should accept valid client ID", () => {
      const clientId = "550e8400-e29b-41d4-a716-446655440000";

      expect(() => {
        transactionDataRouter._def.procedures.fetchFromXero._def.inputs[0]?.parse(
          clientId,
        );
      }).not.toThrow();
    });

    it("should validate input is a string", () => {
      expect(() => {
        transactionDataRouter._def.procedures.fetchFromXero._def.inputs[0]?.parse(
          { invalid: "object" },
        );
      }).toThrow();
    });
  });

  describe("upsert", () => {
    it("should validate required fields", () => {
      const invalidInput = {
        // Missing clientId and monthlyTransactions
        dataSource: "manual",
      };

      expect(() => {
        transactionDataRouter._def.procedures.upsert._def.inputs[0]?.parse(
          invalidInput,
        );
      }).toThrow();
    });

    it("should accept valid upsert input", () => {
      const validInput = {
        clientId: "550e8400-e29b-41d4-a716-446655440000",
        monthlyTransactions: 150,
        dataSource: "manual" as const,
      };

      expect(() => {
        transactionDataRouter._def.procedures.upsert._def.inputs[0]?.parse(
          validInput,
        );
      }).not.toThrow();
    });

    it("should validate monthlyTransactions is a number", () => {
      const invalidInput = {
        clientId: "test-id",
        monthlyTransactions: "150", // Should be number
        dataSource: "manual",
      };

      expect(() => {
        transactionDataRouter._def.procedures.upsert._def.inputs[0]?.parse(
          invalidInput,
        );
      }).toThrow();
    });
  });

  describe("delete", () => {
    it("should accept valid transaction data ID", () => {
      const id = "550e8400-e29b-41d4-a716-446655440000";

      expect(() => {
        transactionDataRouter._def.procedures.delete._def.inputs[0]?.parse(id);
      }).not.toThrow();
    });

    it("should validate input is a string", () => {
      expect(() => {
        transactionDataRouter._def.procedures.delete._def.inputs[0]?.parse(123);
      }).toThrow();
    });
  });

  describe("getAllWithData", () => {
    it("should have no required input", () => {
      // getAllWithData should accept no input
      const procedure = transactionDataRouter._def.procedures.getAllWithData;

      // Check that inputs array is empty or undefined
      expect(
        !procedure._def.inputs || procedure._def.inputs.length === 0,
      ).toBe(true);
    });
  });

  describe("getHistory", () => {
    it("should accept valid client ID", () => {
      const clientId = "550e8400-e29b-41d4-a716-446655440000";

      expect(() => {
        transactionDataRouter._def.procedures.getHistory._def.inputs[0]?.parse(
          clientId,
        );
      }).not.toThrow();
    });

    it("should validate input is a string", () => {
      expect(() => {
        transactionDataRouter._def.procedures.getHistory._def.inputs[0]?.parse(
          null,
        );
      }).toThrow();
    });
  });

  describe("Router Structure", () => {
    it("should export all expected procedures", () => {
      const procedures = Object.keys(transactionDataRouter._def.procedures);

      expect(procedures).toContain("getByClient");
      expect(procedures).toContain("getHistory");
      expect(procedures).toContain("upsert");
      expect(procedures).toContain("fetchFromXero");
      expect(procedures).toContain("estimate");
      expect(procedures).toContain("delete");
      expect(procedures).toContain("getAllWithData");
    });

    it("should have 7 procedures total", () => {
      const procedures = Object.keys(transactionDataRouter._def.procedures);
      expect(procedures).toHaveLength(7);
    });
  });
});
