/**
 * Client Portal Router Tests
 *
 * Tests for the clientPortal tRPC router
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import { clientPortalRouter } from "@/app/server/routers/clientPortal";
import {
  createCaller,
  createMockContext,
  type TestContextWithAuth,
} from "../helpers/trpc";

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
    getEmbedUrl: vi.fn(
      (submissionId: string, email: string) =>
        `https://docuseal.com/embed/${submissionId}?email=${email}`,
    ),
  },
}));

describe("app/server/routers/clientPortal.ts", () => {
  let ctx: TestContextWithAuth;
  let _caller: ReturnType<typeof createCaller<typeof clientPortalRouter>>;

  beforeEach(() => {
    ctx = createMockContext();
    _caller = createCaller(clientPortalRouter, ctx);
    vi.clearAllMocks();
  });

  describe("getMyClients", () => {
    it("should have no required input", () => {
      const procedure = clientPortalRouter._def.procedures.getMyClients;

      expect(!procedure._def.inputs || procedure._def.inputs.length === 0).toBe(
        true,
      );
    });
  });

  describe("getProposals", () => {
    it("should validate required clientId field", async () => {
      const invalidInput = {
        // Missing clientId
        status: "sent",
      };

      await expect(
        _caller.getProposals(invalidInput as Record<string, unknown>),
      ).rejects.toThrow();
    });

    it("should accept valid input without status", async () => {
      const validInput = {
        clientId: "550e8400-e29b-41d4-a716-446655440000",
      };

      await expect(_caller.getProposals(validInput)).resolves.not.toThrow();
    });

    it("should accept valid input with status", async () => {
      const validInput = {
        clientId: "550e8400-e29b-41d4-a716-446655440000",
        status: "sent" as const,
      };

      await expect(_caller.getProposals(validInput)).resolves.not.toThrow();
    });

    it("should validate status enum values", async () => {
      const invalidInput = {
        clientId: "550e8400-e29b-41d4-a716-446655440000",
        status: "invalid_status",
      };

      await expect(
        _caller.getProposals(invalidInput as Record<string, unknown>),
      ).rejects.toThrow();
    });

    it("should accept all valid status values", async () => {
      const validStatuses = ["sent", "viewed", "signed", "expired"];

      for (const status of validStatuses) {
        await expect(
          _caller.getProposals({
            clientId: "550e8400-e29b-41d4-a716-446655440000",
            status: status as unknown as "sent",
          }),
        ).resolves.not.toThrow();
      }
    });
  });

  describe("getProposalById", () => {
    it("should validate required id field", async () => {
      const invalidInput = {
        // Missing id
      };

      await expect(
        _caller.getProposalById(invalidInput as Record<string, unknown>),
      ).rejects.toThrow();
    });

    it("should accept valid proposal ID", async () => {
      const validInput = {
        id: "550e8400-e29b-41d4-a716-446655440000",
      };

      await expect(_caller.getProposalById(validInput)).resolves.not.toThrow();
    });
  });

  describe("getInvoices", () => {
    it("should validate required clientId field", async () => {
      const invalidInput = {
        // Missing clientId
        status: "sent",
      };

      await expect(
        _caller.getInvoices(invalidInput as Record<string, unknown>),
      ).rejects.toThrow();
    });

    it("should accept valid input without status", async () => {
      const validInput = {
        clientId: "550e8400-e29b-41d4-a716-446655440000",
      };

      await expect(_caller.getInvoices(validInput)).resolves.not.toThrow();
    });

    it("should accept valid input with status", async () => {
      const validInput = {
        clientId: "550e8400-e29b-41d4-a716-446655440000",
        status: "paid" as const,
      };

      await expect(_caller.getInvoices(validInput)).resolves.not.toThrow();
    });

    it("should validate status enum values", async () => {
      const invalidInput = {
        clientId: "550e8400-e29b-41d4-a716-446655440000",
        status: "draft",
      };

      await expect(
        _caller.getInvoices(invalidInput as Record<string, unknown>),
      ).rejects.toThrow();
    });

    it("should accept all valid status values", async () => {
      const validStatuses = ["sent", "paid", "overdue", "cancelled"];

      for (const status of validStatuses) {
        await expect(
          _caller.getInvoices({
            clientId: "550e8400-e29b-41d4-a716-446655440000",
            status: status as unknown as "sent",
          }),
        ).resolves.not.toThrow();
      }
    });
  });

  describe("getInvoiceById", () => {
    it("should validate required id field", async () => {
      const invalidInput = {
        // Missing id
      };

      await expect(
        _caller.getInvoiceById(invalidInput as Record<string, unknown>),
      ).rejects.toThrow();
    });

    it("should accept valid invoice ID", async () => {
      const validInput = {
        id: "550e8400-e29b-41d4-a716-446655440000",
      };

      await expect(_caller.getInvoiceById(validInput)).resolves.not.toThrow();
    });
  });

  describe("getDocuments", () => {
    it("should validate required clientId field", async () => {
      const invalidInput = {
        // Missing clientId
      };

      await expect(
        _caller.getDocuments(invalidInput as Record<string, unknown>),
      ).rejects.toThrow();
    });

    it("should accept valid client ID", async () => {
      const validInput = {
        clientId: "550e8400-e29b-41d4-a716-446655440000",
      };

      await expect(_caller.getDocuments(validInput)).resolves.not.toThrow();
    });
  });

  describe("getDocumentsToSign", () => {
    it("should validate required clientId field", async () => {
      const invalidInput = {
        // Missing clientId
      };

      await expect(
        _caller.getDocumentsToSign(invalidInput as Record<string, unknown>),
      ).rejects.toThrow();
    });

    it("should accept valid client ID", async () => {
      const validInput = {
        clientId: "550e8400-e29b-41d4-a716-446655440000",
      };

      await expect(
        _caller.getDocumentsToSign(validInput),
      ).resolves.not.toThrow();
    });
  });

  describe("getSignedDocuments", () => {
    it("should validate required clientId field", async () => {
      const invalidInput = {
        // Missing clientId
      };

      await expect(
        _caller.getSignedDocuments(invalidInput as Record<string, unknown>),
      ).rejects.toThrow();
    });

    it("should accept valid client ID", async () => {
      const validInput = {
        clientId: "550e8400-e29b-41d4-a716-446655440000",
      };

      await expect(
        _caller.getSignedDocuments(validInput),
      ).resolves.not.toThrow();
    });
  });

  describe("listMyThreads", () => {
    it("should validate required clientId field", async () => {
      const invalidInput = {
        // Missing clientId
      };

      await expect(
        _caller.listMyThreads(invalidInput as Record<string, unknown>),
      ).rejects.toThrow();
    });

    it("should accept valid client ID", async () => {
      const validInput = {
        clientId: "550e8400-e29b-41d4-a716-446655440000",
      };

      await expect(_caller.listMyThreads(validInput)).resolves.not.toThrow();
    });
  });

  describe("getThread", () => {
    it("should validate required fields", async () => {
      const invalidInput = {
        // Missing threadId and clientId
      };

      await expect(
        _caller.getThread(invalidInput as Record<string, unknown>),
      ).rejects.toThrow();
    });

    it("should accept valid thread and client IDs", async () => {
      const validInput = {
        threadId: "550e8400-e29b-41d4-a716-446655440000",
        clientId: "660e8400-e29b-41d4-a716-446655440000",
      };

      await expect(_caller.getThread(validInput)).resolves.not.toThrow();
    });
  });

  describe("listMessages", () => {
    it("should validate required fields", async () => {
      const invalidInput = {
        // Missing threadId and clientId
        limit: 25,
      };

      await expect(
        _caller.listMessages(invalidInput as Record<string, unknown>),
      ).rejects.toThrow();
    });

    it("should accept valid input with defaults", async () => {
      const validInput = {
        threadId: "550e8400-e29b-41d4-a716-446655440000",
        clientId: "660e8400-e29b-41d4-a716-446655440000",
      };

      await expect(_caller.listMessages(validInput)).resolves.not.toThrow();
    });

    it("should validate limit min value", async () => {
      const invalidInput = {
        threadId: "550e8400-e29b-41d4-a716-446655440000",
        clientId: "660e8400-e29b-41d4-a716-446655440000",
        limit: 0, // Below minimum of 1
      };

      await expect(_caller.listMessages(invalidInput)).rejects.toThrow();
    });

    it("should validate limit max value", async () => {
      const invalidInput = {
        threadId: "550e8400-e29b-41d4-a716-446655440000",
        clientId: "660e8400-e29b-41d4-a716-446655440000",
        limit: 101, // Exceeds max of 100
      };

      await expect(_caller.listMessages(invalidInput)).rejects.toThrow();
    });

    it("should validate offset min value", async () => {
      const invalidInput = {
        threadId: "550e8400-e29b-41d4-a716-446655440000",
        clientId: "660e8400-e29b-41d4-a716-446655440000",
        offset: -1, // Below minimum of 0
      };

      await expect(_caller.listMessages(invalidInput)).rejects.toThrow();
    });
  });

  describe("sendMessage", () => {
    it("should validate required fields", async () => {
      const invalidInput = {
        // Missing threadId, clientId, content
        type: "text",
      };

      await expect(
        _caller.sendMessage(invalidInput as Record<string, unknown>),
      ).rejects.toThrow();
    });

    it("should accept valid message data", async () => {
      const validInput = {
        threadId: "550e8400-e29b-41d4-a716-446655440000",
        clientId: "660e8400-e29b-41d4-a716-446655440000",
        content: "Hello from client portal",
      };

      await expect(_caller.sendMessage(validInput)).resolves.not.toThrow();
    });

    it("should validate content minimum length", async () => {
      const invalidInput = {
        threadId: "550e8400-e29b-41d4-a716-446655440000",
        clientId: "660e8400-e29b-41d4-a716-446655440000",
        content: "", // Empty string
      };

      await expect(_caller.sendMessage(invalidInput)).rejects.toThrow();
    });

    it("should validate content maximum length", async () => {
      const invalidInput = {
        threadId: "550e8400-e29b-41d4-a716-446655440000",
        clientId: "660e8400-e29b-41d4-a716-446655440000",
        content: "a".repeat(5001), // Exceeds max of 5000
      };

      await expect(_caller.sendMessage(invalidInput)).rejects.toThrow();
    });

    it("should accept file type", async () => {
      const validInput = {
        threadId: "550e8400-e29b-41d4-a716-446655440000",
        clientId: "660e8400-e29b-41d4-a716-446655440000",
        content: "File attachment",
        type: "file" as const,
      };

      await expect(_caller.sendMessage(validInput)).resolves.not.toThrow();
    });

    it("should accept message without metadata", async () => {
      const validInput = {
        threadId: "550e8400-e29b-41d4-a716-446655440000",
        clientId: "660e8400-e29b-41d4-a716-446655440000",
        content: "Message without metadata",
        type: "text" as const,
      };

      await expect(_caller.sendMessage(validInput)).resolves.not.toThrow();
    });
  });

  describe("markThreadAsRead", () => {
    it("should validate required fields", async () => {
      const invalidInput = {
        // Missing threadId and clientId
      };

      await expect(
        _caller.markThreadAsRead(invalidInput as Record<string, unknown>),
      ).rejects.toThrow();
    });

    it("should accept valid thread and client IDs", async () => {
      const validInput = {
        threadId: "550e8400-e29b-41d4-a716-446655440000",
        clientId: "660e8400-e29b-41d4-a716-446655440000",
      };

      await expect(_caller.markThreadAsRead(validInput)).resolves.not.toThrow();
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
