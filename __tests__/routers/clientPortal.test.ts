/**
 * Client Portal Router Tests
 *
 * Tests for the clientPortal tRPC router
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import { clientPortalRouter } from "@/app/server/routers/clientPortal";
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
    offset: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
    values: vi.fn().mockReturnThis(),
    returning: vi.fn().mockResolvedValue([]),
    innerJoin: vi.fn().mockReturnThis(),
    leftJoin: vi.fn().mockReturnThis(),
    groupBy: vi.fn().mockReturnThis(),
    $dynamic: vi.fn().mockReturnThis(),
  },
}));

// Mock DocuSeal client
vi.mock("@/lib/docuseal/client", () => ({
  docusealClient: {
    getEmbedUrl: vi.fn((submissionId: string, email: string) => 
      `https://docuseal.com/embed/${submissionId}?email=${email}`
    ),
  },
}));

describe("app/server/routers/clientPortal.ts", () => {
  let ctx: Context;
  let caller: ReturnType<typeof createCaller<typeof clientPortalRouter>>;

  beforeEach(() => {
    ctx = createMockContext();
    caller = createCaller(clientPortalRouter, ctx);
    vi.clearAllMocks();
  });

  describe("getMyClients", () => {
    it("should have no required input", () => {
      const procedure = clientPortalRouter._def.procedures.getMyClients;

      expect(
        !procedure._def.inputs || procedure._def.inputs.length === 0,
      ).toBe(true);
    });
  });

  describe("getProposals", () => {
    it("should validate required clientId field", () => {
      const invalidInput = {
        // Missing clientId
        status: "sent",
      };

      expect(() => {
        clientPortalRouter._def.procedures.getProposals._def.inputs[0]?.parse(
          invalidInput,
        );
      }).toThrow();
    });

    it("should accept valid input without status", () => {
      const validInput = {
        clientId: "550e8400-e29b-41d4-a716-446655440000",
      };

      expect(() => {
        clientPortalRouter._def.procedures.getProposals._def.inputs[0]?.parse(
          validInput,
        );
      }).not.toThrow();
    });

    it("should accept valid input with status", () => {
      const validInput = {
        clientId: "550e8400-e29b-41d4-a716-446655440000",
        status: "sent" as const,
      };

      expect(() => {
        clientPortalRouter._def.procedures.getProposals._def.inputs[0]?.parse(
          validInput,
        );
      }).not.toThrow();
    });

    it("should validate status enum values", () => {
      const invalidInput = {
        clientId: "550e8400-e29b-41d4-a716-446655440000",
        status: "invalid_status",
      };

      expect(() => {
        clientPortalRouter._def.procedures.getProposals._def.inputs[0]?.parse(
          invalidInput,
        );
      }).toThrow();
    });

    it("should accept all valid status values", () => {
      const validStatuses = ["sent", "viewed", "signed", "expired"];

      for (const status of validStatuses) {
        expect(() => {
          clientPortalRouter._def.procedures.getProposals._def.inputs[0]?.parse(
            {
              clientId: "550e8400-e29b-41d4-a716-446655440000",
              status,
            },
          );
        }).not.toThrow();
      }
    });
  });

  describe("getProposalById", () => {
    it("should validate required id field", () => {
      const invalidInput = {
        // Missing id
      };

      expect(() => {
        clientPortalRouter._def.procedures.getProposalById._def.inputs[0]?.parse(
          invalidInput,
        );
      }).toThrow();
    });

    it("should accept valid proposal ID", () => {
      const validInput = {
        id: "550e8400-e29b-41d4-a716-446655440000",
      };

      expect(() => {
        clientPortalRouter._def.procedures.getProposalById._def.inputs[0]?.parse(
          validInput,
        );
      }).not.toThrow();
    });
  });

  describe("getInvoices", () => {
    it("should validate required clientId field", () => {
      const invalidInput = {
        // Missing clientId
        status: "sent",
      };

      expect(() => {
        clientPortalRouter._def.procedures.getInvoices._def.inputs[0]?.parse(
          invalidInput,
        );
      }).toThrow();
    });

    it("should accept valid input without status", () => {
      const validInput = {
        clientId: "550e8400-e29b-41d4-a716-446655440000",
      };

      expect(() => {
        clientPortalRouter._def.procedures.getInvoices._def.inputs[0]?.parse(
          validInput,
        );
      }).not.toThrow();
    });

    it("should accept valid input with status", () => {
      const validInput = {
        clientId: "550e8400-e29b-41d4-a716-446655440000",
        status: "paid" as const,
      };

      expect(() => {
        clientPortalRouter._def.procedures.getInvoices._def.inputs[0]?.parse(
          validInput,
        );
      }).not.toThrow();
    });

    it("should validate status enum values", () => {
      const invalidInput = {
        clientId: "550e8400-e29b-41d4-a716-446655440000",
        status: "draft",
      };

      expect(() => {
        clientPortalRouter._def.procedures.getInvoices._def.inputs[0]?.parse(
          invalidInput,
        );
      }).toThrow();
    });

    it("should accept all valid status values", () => {
      const validStatuses = ["sent", "paid", "overdue", "cancelled"];

      for (const status of validStatuses) {
        expect(() => {
          clientPortalRouter._def.procedures.getInvoices._def.inputs[0]?.parse(
            {
              clientId: "550e8400-e29b-41d4-a716-446655440000",
              status,
            },
          );
        }).not.toThrow();
      }
    });
  });

  describe("getInvoiceById", () => {
    it("should validate required id field", () => {
      const invalidInput = {
        // Missing id
      };

      expect(() => {
        clientPortalRouter._def.procedures.getInvoiceById._def.inputs[0]?.parse(
          invalidInput,
        );
      }).toThrow();
    });

    it("should accept valid invoice ID", () => {
      const validInput = {
        id: "550e8400-e29b-41d4-a716-446655440000",
      };

      expect(() => {
        clientPortalRouter._def.procedures.getInvoiceById._def.inputs[0]?.parse(
          validInput,
        );
      }).not.toThrow();
    });
  });

  describe("getDocuments", () => {
    it("should validate required clientId field", () => {
      const invalidInput = {
        // Missing clientId
      };

      expect(() => {
        clientPortalRouter._def.procedures.getDocuments._def.inputs[0]?.parse(
          invalidInput,
        );
      }).toThrow();
    });

    it("should accept valid client ID", () => {
      const validInput = {
        clientId: "550e8400-e29b-41d4-a716-446655440000",
      };

      expect(() => {
        clientPortalRouter._def.procedures.getDocuments._def.inputs[0]?.parse(
          validInput,
        );
      }).not.toThrow();
    });
  });

  describe("getDocumentsToSign", () => {
    it("should validate required clientId field", () => {
      const invalidInput = {
        // Missing clientId
      };

      expect(() => {
        clientPortalRouter._def.procedures.getDocumentsToSign._def.inputs[0]?.parse(
          invalidInput,
        );
      }).toThrow();
    });

    it("should accept valid client ID", () => {
      const validInput = {
        clientId: "550e8400-e29b-41d4-a716-446655440000",
      };

      expect(() => {
        clientPortalRouter._def.procedures.getDocumentsToSign._def.inputs[0]?.parse(
          validInput,
        );
      }).not.toThrow();
    });
  });

  describe("getSignedDocuments", () => {
    it("should validate required clientId field", () => {
      const invalidInput = {
        // Missing clientId
      };

      expect(() => {
        clientPortalRouter._def.procedures.getSignedDocuments._def.inputs[0]?.parse(
          invalidInput,
        );
      }).toThrow();
    });

    it("should accept valid client ID", () => {
      const validInput = {
        clientId: "550e8400-e29b-41d4-a716-446655440000",
      };

      expect(() => {
        clientPortalRouter._def.procedures.getSignedDocuments._def.inputs[0]?.parse(
          validInput,
        );
      }).not.toThrow();
    });
  });

  describe("listMyThreads", () => {
    it("should validate required clientId field", () => {
      const invalidInput = {
        // Missing clientId
      };

      expect(() => {
        clientPortalRouter._def.procedures.listMyThreads._def.inputs[0]?.parse(
          invalidInput,
        );
      }).toThrow();
    });

    it("should accept valid client ID", () => {
      const validInput = {
        clientId: "550e8400-e29b-41d4-a716-446655440000",
      };

      expect(() => {
        clientPortalRouter._def.procedures.listMyThreads._def.inputs[0]?.parse(
          validInput,
        );
      }).not.toThrow();
    });
  });

  describe("getThread", () => {
    it("should validate required fields", () => {
      const invalidInput = {
        // Missing threadId and clientId
      };

      expect(() => {
        clientPortalRouter._def.procedures.getThread._def.inputs[0]?.parse(
          invalidInput,
        );
      }).toThrow();
    });

    it("should accept valid thread and client IDs", () => {
      const validInput = {
        threadId: "550e8400-e29b-41d4-a716-446655440000",
        clientId: "660e8400-e29b-41d4-a716-446655440000",
      };

      expect(() => {
        clientPortalRouter._def.procedures.getThread._def.inputs[0]?.parse(
          validInput,
        );
      }).not.toThrow();
    });
  });

  describe("listMessages", () => {
    it("should validate required fields", () => {
      const invalidInput = {
        // Missing threadId and clientId
        limit: 25,
      };

      expect(() => {
        clientPortalRouter._def.procedures.listMessages._def.inputs[0]?.parse(
          invalidInput,
        );
      }).toThrow();
    });

    it("should accept valid input with defaults", () => {
      const validInput = {
        threadId: "550e8400-e29b-41d4-a716-446655440000",
        clientId: "660e8400-e29b-41d4-a716-446655440000",
      };

      expect(() => {
        clientPortalRouter._def.procedures.listMessages._def.inputs[0]?.parse(
          validInput,
        );
      }).not.toThrow();
    });

    it("should default limit to 50", () => {
      const result =
        clientPortalRouter._def.procedures.listMessages._def.inputs[0]?.parse({
          threadId: "550e8400-e29b-41d4-a716-446655440000",
          clientId: "660e8400-e29b-41d4-a716-446655440000",
        });
      expect(result?.limit).toBe(50);
    });

    it("should default offset to 0", () => {
      const result =
        clientPortalRouter._def.procedures.listMessages._def.inputs[0]?.parse({
          threadId: "550e8400-e29b-41d4-a716-446655440000",
          clientId: "660e8400-e29b-41d4-a716-446655440000",
        });
      expect(result?.offset).toBe(0);
    });

    it("should validate limit min value", () => {
      const invalidInput = {
        threadId: "550e8400-e29b-41d4-a716-446655440000",
        clientId: "660e8400-e29b-41d4-a716-446655440000",
        limit: 0, // Below minimum of 1
      };

      expect(() => {
        clientPortalRouter._def.procedures.listMessages._def.inputs[0]?.parse(
          invalidInput,
        );
      }).toThrow();
    });

    it("should validate limit max value", () => {
      const invalidInput = {
        threadId: "550e8400-e29b-41d4-a716-446655440000",
        clientId: "660e8400-e29b-41d4-a716-446655440000",
        limit: 101, // Exceeds max of 100
      };

      expect(() => {
        clientPortalRouter._def.procedures.listMessages._def.inputs[0]?.parse(
          invalidInput,
        );
      }).toThrow();
    });

    it("should validate offset min value", () => {
      const invalidInput = {
        threadId: "550e8400-e29b-41d4-a716-446655440000",
        clientId: "660e8400-e29b-41d4-a716-446655440000",
        offset: -1, // Below minimum of 0
      };

      expect(() => {
        clientPortalRouter._def.procedures.listMessages._def.inputs[0]?.parse(
          invalidInput,
        );
      }).toThrow();
    });
  });

  describe("sendMessage", () => {
    it("should validate required fields", () => {
      const invalidInput = {
        // Missing threadId, clientId, content
        type: "text",
      };

      expect(() => {
        clientPortalRouter._def.procedures.sendMessage._def.inputs[0]?.parse(
          invalidInput,
        );
      }).toThrow();
    });

    it("should accept valid message data", () => {
      const validInput = {
        threadId: "550e8400-e29b-41d4-a716-446655440000",
        clientId: "660e8400-e29b-41d4-a716-446655440000",
        content: "Hello from client portal",
      };

      expect(() => {
        clientPortalRouter._def.procedures.sendMessage._def.inputs[0]?.parse(
          validInput,
        );
      }).not.toThrow();
    });

    it("should validate content minimum length", () => {
      const invalidInput = {
        threadId: "550e8400-e29b-41d4-a716-446655440000",
        clientId: "660e8400-e29b-41d4-a716-446655440000",
        content: "", // Empty string
      };

      expect(() => {
        clientPortalRouter._def.procedures.sendMessage._def.inputs[0]?.parse(
          invalidInput,
        );
      }).toThrow();
    });

    it("should validate content maximum length", () => {
      const invalidInput = {
        threadId: "550e8400-e29b-41d4-a716-446655440000",
        clientId: "660e8400-e29b-41d4-a716-446655440000",
        content: "a".repeat(5001), // Exceeds max of 5000
      };

      expect(() => {
        clientPortalRouter._def.procedures.sendMessage._def.inputs[0]?.parse(
          invalidInput,
        );
      }).toThrow();
    });

    it("should default type to text", () => {
      const result =
        clientPortalRouter._def.procedures.sendMessage._def.inputs[0]?.parse({
          threadId: "550e8400-e29b-41d4-a716-446655440000",
          clientId: "660e8400-e29b-41d4-a716-446655440000",
          content: "Test message",
        });
      expect(result?.type).toBe("text");
    });

    it("should accept file type", () => {
      const validInput = {
        threadId: "550e8400-e29b-41d4-a716-446655440000",
        clientId: "660e8400-e29b-41d4-a716-446655440000",
        content: "File attachment",
        type: "file" as const,
      };

      expect(() => {
        clientPortalRouter._def.procedures.sendMessage._def.inputs[0]?.parse(
          validInput,
        );
      }).not.toThrow();
    });

    it("should accept message without metadata", () => {
      const validInput = {
        threadId: "550e8400-e29b-41d4-a716-446655440000",
        clientId: "660e8400-e29b-41d4-a716-446655440000",
        content: "Message without metadata",
        type: "text" as const,
      };

      expect(() => {
        clientPortalRouter._def.procedures.sendMessage._def.inputs[0]?.parse(
          validInput,
        );
      }).not.toThrow();
    });
  });

  describe("markThreadAsRead", () => {
    it("should validate required fields", () => {
      const invalidInput = {
        // Missing threadId and clientId
      };

      expect(() => {
        clientPortalRouter._def.procedures.markThreadAsRead._def.inputs[0]?.parse(
          invalidInput,
        );
      }).toThrow();
    });

    it("should accept valid thread and client IDs", () => {
      const validInput = {
        threadId: "550e8400-e29b-41d4-a716-446655440000",
        clientId: "660e8400-e29b-41d4-a716-446655440000",
      };

      expect(() => {
        clientPortalRouter._def.procedures.markThreadAsRead._def.inputs[0]?.parse(
          validInput,
        );
      }).not.toThrow();
    });
  });

  describe("Router Structure", () => {
    it("should export all expected procedures", () => {
      const procedures = Object.keys(clientPortalRouter._def.procedures);

      expect(procedures).toContain("getMyClients");
      expect(procedures).toContain("getProposals");
      expect(procedures).toContain("getProposalById");
      expect(procedures).toContain("getInvoices");
      expect(procedures).toContain("getInvoiceById");
      expect(procedures).toContain("getDocuments");
      expect(procedures).toContain("getDocumentsToSign");
      expect(procedures).toContain("getSignedDocuments");
      expect(procedures).toContain("listMyThreads");
      expect(procedures).toContain("getThread");
      expect(procedures).toContain("listMessages");
      expect(procedures).toContain("sendMessage");
      expect(procedures).toContain("markThreadAsRead");
    });

    it("should have 15 procedures total", () => {
      const procedures = Object.keys(clientPortalRouter._def.procedures);
      expect(procedures).toHaveLength(15); // Added: getSignedProposalPdf, getSignedDocumentPdf
    });
  });
});
