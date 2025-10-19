/**
 * Clients Router Tests
 *
 * Tests for the clients tRPC router
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import { clientsRouter } from "@/app/server/routers/clients";
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
    innerJoin: vi.fn().mockReturnThis(),
    leftJoin: vi.fn().mockReturnThis(),
  },
}));

// Mock client queries
vi.mock("@/lib/db/queries/client-queries", () => ({
  getClientsList: vi.fn().mockResolvedValue([]),
}));

describe("app/server/routers/clients.ts", () => {
  let ctx: Context;
  let caller: ReturnType<typeof createCaller<typeof clientsRouter>>;

  beforeEach(() => {
    ctx = createMockContext();
    caller = createCaller(clientsRouter, ctx);
    vi.clearAllMocks();
  });

  describe("list", () => {
    it("should accept empty input", () => {
      expect(() => {
        clientsRouter._def.procedures.list._def.inputs[0]?.parse({});
      }).not.toThrow();
    });

    it("should accept search parameter", () => {
      expect(() => {
        clientsRouter._def.procedures.list._def.inputs[0]?.parse({
          search: "test client",
        });
      }).not.toThrow();
    });

    it("should accept type filter", () => {
      expect(() => {
        clientsRouter._def.procedures.list._def.inputs[0]?.parse({
          type: "limited",
        });
      }).not.toThrow();
    });

    it("should accept status filter", () => {
      expect(() => {
        clientsRouter._def.procedures.list._def.inputs[0]?.parse({
          status: "active",
        });
      }).not.toThrow();
    });

    it("should accept multiple filters", () => {
      expect(() => {
        clientsRouter._def.procedures.list._def.inputs[0]?.parse({
          search: "test",
          type: "limited",
          status: "active",
        });
      }).not.toThrow();
    });
  });

  describe("getById", () => {
    it("should accept valid UUID", () => {
      const validId = "550e8400-e29b-41d4-a716-446655440000";

      expect(() => {
        clientsRouter._def.procedures.getById._def.inputs[0]?.parse(validId);
      }).not.toThrow();
    });

    it("should validate input is a string", () => {
      expect(() => {
        clientsRouter._def.procedures.getById._def.inputs[0]?.parse(123);
      }).toThrow();
    });

    it("should accept any string including empty", () => {
      // getById accepts z.string() without min length validation
      expect(() => {
        clientsRouter._def.procedures.getById._def.inputs[0]?.parse("");
      }).not.toThrow();
    });
  });

  describe("create", () => {
    it("should validate required fields", () => {
      const invalidInput = {
        // Missing required name field
        email: "test@example.com",
      };

      expect(() => {
        clientsRouter._def.procedures.create._def.inputs[0]?.parse(
          invalidInput,
        );
      }).toThrow();
    });

    it("should accept valid client data", () => {
      const validInput = {
        clientCode: "TC001",
        name: "Test Client Ltd",
        type: "limited_company" as const,
        status: "active" as const,
        email: "test@example.com",
      };

      expect(() => {
        clientsRouter._def.procedures.create._def.inputs[0]?.parse(validInput);
      }).not.toThrow();
    });

    it("should accept client with primary contact", () => {
      const validInput = {
        clientCode: "TC002",
        name: "Test Client Ltd",
        type: "limited_company" as const,
        status: "active" as const,
        email: "test@example.com",
        primaryContact: {
          firstName: "John",
          lastName: "Doe",
          email: "john@example.com",
        },
      };

      expect(() => {
        clientsRouter._def.procedures.create._def.inputs[0]?.parse(validInput);
      }).not.toThrow();
    });

    it("should validate email format", () => {
      const invalidInput = {
        name: "Test Client",
        email: "invalid-email",
      };

      expect(() => {
        clientsRouter._def.procedures.create._def.inputs[0]?.parse(
          invalidInput,
        );
      }).toThrow();
    });

    it("should validate primary contact email format", () => {
      const invalidInput = {
        name: "Test Client",
        email: "test@example.com",
        primaryContact: {
          firstName: "John",
          lastName: "Doe",
          email: "invalid-email",
        },
      };

      expect(() => {
        clientsRouter._def.procedures.create._def.inputs[0]?.parse(
          invalidInput,
        );
      }).toThrow();
    });
  });

  describe("update", () => {
    it("should validate required id field", () => {
      const invalidInput = {
        // Missing id
        data: {
          name: "Updated Name",
        },
      };

      expect(() => {
        clientsRouter._def.procedures.update._def.inputs[0]?.parse(
          invalidInput,
        );
      }).toThrow();
    });

    it("should accept valid update data", () => {
      const validInput = {
        id: "550e8400-e29b-41d4-a716-446655440000",
        data: {
          name: "Updated Client Name",
          email: "updated@example.com",
        },
      };

      expect(() => {
        clientsRouter._def.procedures.update._def.inputs[0]?.parse(validInput);
      }).not.toThrow();
    });

    it("should accept partial data updates", () => {
      const validInput = {
        id: "550e8400-e29b-41d4-a716-446655440000",
        data: {
          notes: "Updated notes for client",
        },
      };

      expect(() => {
        clientsRouter._def.procedures.update._def.inputs[0]?.parse(
          validInput,
        );
      }).not.toThrow();
    });
  });

  describe("delete", () => {
    it("should accept valid client ID", () => {
      const validId = "550e8400-e29b-41d4-a716-446655440000";

      expect(() => {
        clientsRouter._def.procedures.delete._def.inputs[0]?.parse(validId);
      }).not.toThrow();
    });

    it("should validate input is a string", () => {
      expect(() => {
        clientsRouter._def.procedures.delete._def.inputs[0]?.parse(null);
      }).toThrow();
    });
  });

  describe("getClientServices", () => {
    it("should accept valid client ID", () => {
      const validId = "550e8400-e29b-41d4-a716-446655440000";

      expect(() => {
        clientsRouter._def.procedures.getClientServices._def.inputs[0]?.parse(
          validId,
        );
      }).not.toThrow();
    });

    it("should validate input is a string", () => {
      expect(() => {
        clientsRouter._def.procedures.getClientServices._def.inputs[0]?.parse(
          123,
        );
      }).toThrow();
    });
  });

  describe("getClientContacts", () => {
    it("should accept valid client ID", () => {
      const validId = "550e8400-e29b-41d4-a716-446655440000";

      expect(() => {
        clientsRouter._def.procedures.getClientContacts._def.inputs[0]?.parse(
          validId,
        );
      }).not.toThrow();
    });

    it("should validate input is a string", () => {
      expect(() => {
        clientsRouter._def.procedures.getClientContacts._def.inputs[0]?.parse(
          [],
        );
      }).toThrow();
    });
  });

  describe("getClientDirectors", () => {
    it("should accept valid client ID", () => {
      const validId = "550e8400-e29b-41d4-a716-446655440000";

      expect(() => {
        clientsRouter._def.procedures.getClientDirectors._def.inputs[0]?.parse(
          validId,
        );
      }).not.toThrow();
    });
  });

  describe("getClientPSCs", () => {
    it("should accept valid client ID", () => {
      const validId = "550e8400-e29b-41d4-a716-446655440000";

      expect(() => {
        clientsRouter._def.procedures.getClientPSCs._def.inputs[0]?.parse(
          validId,
        );
      }).not.toThrow();
    });
  });

  describe("updateContact", () => {
    it("should validate required fields", () => {
      const invalidInput = {
        // Missing required id
        data: {
          firstName: "Jane",
        },
      };

      expect(() => {
        clientsRouter._def.procedures.updateContact._def.inputs[0]?.parse(
          invalidInput,
        );
      }).toThrow();
    });

    it("should accept valid contact update", () => {
      const validInput = {
        id: "550e8400-e29b-41d4-a716-446655440000",
        data: {
          firstName: "Jane",
          lastName: "Smith",
          email: "jane@example.com",
        },
      };

      expect(() => {
        clientsRouter._def.procedures.updateContact._def.inputs[0]?.parse(
          validInput,
        );
      }).not.toThrow();
    });

    it("should accept partial data updates", () => {
      const validInput = {
        id: "550e8400-e29b-41d4-a716-446655440000",
        data: {
          email: "newemail@example.com",
        },
      };

      expect(() => {
        clientsRouter._def.procedures.updateContact._def.inputs[0]?.parse(
          validInput,
        );
      }).not.toThrow();
    });
  });

  describe("Router Structure", () => {
    it("should export all expected procedures", () => {
      const procedures = Object.keys(clientsRouter._def.procedures);

      expect(procedures).toContain("list");
      expect(procedures).toContain("getById");
      expect(procedures).toContain("create");
      expect(procedures).toContain("update");
      expect(procedures).toContain("delete");
      expect(procedures).toContain("getClientServices");
      expect(procedures).toContain("getClientContacts");
      expect(procedures).toContain("getClientDirectors");
      expect(procedures).toContain("getClientPSCs");
      expect(procedures).toContain("updateContact");
    });

    it("should have 10 procedures total", () => {
      const procedures = Object.keys(clientsRouter._def.procedures);
      expect(procedures).toHaveLength(10);
    });
  });
});
