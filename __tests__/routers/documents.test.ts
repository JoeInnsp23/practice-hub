/**
 * Documents Router Tests
 *
 * Tests for the documents tRPC router
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import { documentsRouter } from "@/app/server/routers/documents";
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
    returning: vi.fn(),
    innerJoin: vi.fn().mockReturnThis(),
    leftJoin: vi.fn().mockReturnThis(),
  },
}));

// Mock S3 storage
vi.mock("@/lib/storage/s3", () => ({
  deleteFromS3: vi.fn().mockResolvedValue(undefined),
  getPresignedUrl: vi.fn().mockResolvedValue("https://example.com/signed-url"),
}));

// Mock DocuSeal client
vi.mock("@/lib/docuseal/client", () => ({
  docusealClient: {
    createSubmission: vi.fn().mockResolvedValue({
      id: "submission-123",
    }),
    getEmbedUrl: vi.fn().mockReturnValue("https://docuseal.com/embed/123"),
  },
}));

describe("app/server/routers/documents.ts", () => {
  let ctx: Context;
  let caller: ReturnType<typeof createCaller<typeof documentsRouter>>;

  beforeEach(() => {
    ctx = createMockContext();
    caller = createCaller(documentsRouter, ctx);
    vi.clearAllMocks();
  });

  describe("list", () => {
    it("should accept empty input", () => {
      expect(() => {
        documentsRouter._def.procedures.list._def.inputs[0]?.parse({});
      }).not.toThrow();
    });

    it("should accept parentId filter", () => {
      expect(() => {
        documentsRouter._def.procedures.list._def.inputs[0]?.parse({
          parentId: "550e8400-e29b-41d4-a716-446655440000",
        });
      }).not.toThrow();
    });

    it("should accept null parentId for root documents", () => {
      expect(() => {
        documentsRouter._def.procedures.list._def.inputs[0]?.parse({
          parentId: null,
        });
      }).not.toThrow();
    });

    it("should accept clientId filter", () => {
      expect(() => {
        documentsRouter._def.procedures.list._def.inputs[0]?.parse({
          clientId: "550e8400-e29b-41d4-a716-446655440000",
        });
      }).not.toThrow();
    });

    it("should accept search parameter", () => {
      expect(() => {
        documentsRouter._def.procedures.list._def.inputs[0]?.parse({
          search: "invoice",
        });
      }).not.toThrow();
    });

    it("should accept tags filter", () => {
      expect(() => {
        documentsRouter._def.procedures.list._def.inputs[0]?.parse({
          tags: ["tax", "important"],
        });
      }).not.toThrow();
    });

    it("should accept type filter", () => {
      expect(() => {
        documentsRouter._def.procedures.list._def.inputs[0]?.parse({
          type: "file",
        });
      }).not.toThrow();
    });

    it("should accept pagination parameters", () => {
      expect(() => {
        documentsRouter._def.procedures.list._def.inputs[0]?.parse({
          limit: 25,
          offset: 50,
        });
      }).not.toThrow();
    });

    it("should validate limit max value", () => {
      expect(() => {
        documentsRouter._def.procedures.list._def.inputs[0]?.parse({
          limit: 150, // Exceeds max of 100
        });
      }).toThrow();
    });
  });

  describe("get", () => {
    it("should accept valid document ID", () => {
      const validInput = {
        documentId: "550e8400-e29b-41d4-a716-446655440000",
      };

      expect(() => {
        documentsRouter._def.procedures.get._def.inputs[0]?.parse(validInput);
      }).not.toThrow();
    });

    it("should validate UUID format", () => {
      const invalidInput = {
        documentId: "not-a-uuid",
      };

      expect(() => {
        documentsRouter._def.procedures.get._def.inputs[0]?.parse(
          invalidInput,
        );
      }).toThrow();
    });
  });

  describe("createFolder", () => {
    it("should validate required name field", () => {
      const invalidInput = {
        // Missing name
        description: "Test folder",
      };

      expect(() => {
        documentsRouter._def.procedures.createFolder._def.inputs[0]?.parse(
          invalidInput,
        );
      }).toThrow();
    });

    it("should accept valid folder data", () => {
      const validInput = {
        name: "Tax Documents",
        description: "Client tax filings",
      };

      expect(() => {
        documentsRouter._def.procedures.createFolder._def.inputs[0]?.parse(
          validInput,
        );
      }).not.toThrow();
    });

    it("should accept optional fields", () => {
      const validInput = {
        name: "Client Folder",
        description: "All client documents",
        parentId: "550e8400-e29b-41d4-a716-446655440000",
        clientId: "660e8400-e29b-41d4-a716-446655440000",
        tags: ["important", "archived"],
      };

      expect(() => {
        documentsRouter._def.procedures.createFolder._def.inputs[0]?.parse(
          validInput,
        );
      }).not.toThrow();
    });

    it("should accept null parentId", () => {
      const validInput = {
        name: "Root Folder",
        parentId: null,
      };

      expect(() => {
        documentsRouter._def.procedures.createFolder._def.inputs[0]?.parse(
          validInput,
        );
      }).not.toThrow();
    });
  });

  describe("update", () => {
    it("should validate required documentId field", () => {
      const invalidInput = {
        // Missing documentId
        name: "Updated Name",
      };

      expect(() => {
        documentsRouter._def.procedures.update._def.inputs[0]?.parse(
          invalidInput,
        );
      }).toThrow();
    });

    it("should accept valid update data", () => {
      const validInput = {
        documentId: "550e8400-e29b-41d4-a716-446655440000",
        name: "Renamed Document",
      };

      expect(() => {
        documentsRouter._def.procedures.update._def.inputs[0]?.parse(
          validInput,
        );
      }).not.toThrow();
    });

    it("should accept partial updates", () => {
      const validInput = {
        documentId: "550e8400-e29b-41d4-a716-446655440000",
        description: "Updated description",
        tags: ["updated"],
      };

      expect(() => {
        documentsRouter._def.procedures.update._def.inputs[0]?.parse(
          validInput,
        );
      }).not.toThrow();
    });

    it("should accept null values for optional fields", () => {
      const validInput = {
        documentId: "550e8400-e29b-41d4-a716-446655440000",
        parentId: null,
        clientId: null,
      };

      expect(() => {
        documentsRouter._def.procedures.update._def.inputs[0]?.parse(
          validInput,
        );
      }).not.toThrow();
    });
  });

  describe("delete", () => {
    it("should accept valid document ID", () => {
      const validInput = {
        documentId: "550e8400-e29b-41d4-a716-446655440000",
      };

      expect(() => {
        documentsRouter._def.procedures.delete._def.inputs[0]?.parse(
          validInput,
        );
      }).not.toThrow();
    });

    it("should validate UUID format", () => {
      const invalidInput = {
        documentId: "invalid",
      };

      expect(() => {
        documentsRouter._def.procedures.delete._def.inputs[0]?.parse(
          invalidInput,
        );
      }).toThrow();
    });
  });

  describe("getPresignedUrl", () => {
    it("should accept valid document ID", () => {
      const validInput = {
        documentId: "550e8400-e29b-41d4-a716-446655440000",
      };

      expect(() => {
        documentsRouter._def.procedures.getPresignedUrl._def.inputs[0]?.parse(
          validInput,
        );
      }).not.toThrow();
    });

    it("should accept custom expiration time", () => {
      const validInput = {
        documentId: "550e8400-e29b-41d4-a716-446655440000",
        expiresIn: 7200, // 2 hours
      };

      expect(() => {
        documentsRouter._def.procedures.getPresignedUrl._def.inputs[0]?.parse(
          validInput,
        );
      }).not.toThrow();
    });

    it("should validate min expiration time", () => {
      const invalidInput = {
        documentId: "550e8400-e29b-41d4-a716-446655440000",
        expiresIn: 30, // Below minimum of 60 seconds
      };

      expect(() => {
        documentsRouter._def.procedures.getPresignedUrl._def.inputs[0]?.parse(
          invalidInput,
        );
      }).toThrow();
    });

    it("should validate max expiration time", () => {
      const invalidInput = {
        documentId: "550e8400-e29b-41d4-a716-446655440000",
        expiresIn: 90000, // Above maximum of 86400 seconds (24 hours)
      };

      expect(() => {
        documentsRouter._def.procedures.getPresignedUrl._def.inputs[0]?.parse(
          invalidInput,
        );
      }).toThrow();
    });
  });

  describe("createShareLink", () => {
    it("should accept valid document ID", () => {
      const validInput = {
        documentId: "550e8400-e29b-41d4-a716-446655440000",
      };

      expect(() => {
        documentsRouter._def.procedures.createShareLink._def.inputs[0]?.parse(
          validInput,
        );
      }).not.toThrow();
    });

    it("should accept optional expiration", () => {
      const validInput = {
        documentId: "550e8400-e29b-41d4-a716-446655440000",
        expiresIn: 86400, // 24 hours
      };

      expect(() => {
        documentsRouter._def.procedures.createShareLink._def.inputs[0]?.parse(
          validInput,
        );
      }).not.toThrow();
    });
  });

  describe("getSharedDocument", () => {
    it("should accept valid share token", () => {
      const validInput = {
        shareToken: "abc123-token",
      };

      expect(() => {
        documentsRouter._def.procedures.getSharedDocument._def.inputs[0]?.parse(
          validInput,
        );
      }).not.toThrow();
    });

    it("should validate token is a string", () => {
      expect(() => {
        documentsRouter._def.procedures.getSharedDocument._def.inputs[0]?.parse(
          {},
        );
      }).toThrow();
    });
  });

  describe("revokeShareLink", () => {
    it("should accept valid document ID", () => {
      const validInput = {
        documentId: "550e8400-e29b-41d4-a716-446655440000",
      };

      expect(() => {
        documentsRouter._def.procedures.revokeShareLink._def.inputs[0]?.parse(
          validInput,
        );
      }).not.toThrow();
    });
  });

  describe("getStorageStats", () => {
    it("should have no required input", () => {
      const procedure = documentsRouter._def.procedures.getStorageStats;

      expect(
        !procedure._def.inputs || procedure._def.inputs.length === 0,
      ).toBe(true);
    });
  });

  describe("search", () => {
    it("should validate required query field", () => {
      const invalidInput = {
        // Missing query
        limit: 10,
      };

      expect(() => {
        documentsRouter._def.procedures.search._def.inputs[0]?.parse(
          invalidInput,
        );
      }).toThrow();
    });

    it("should accept valid search query", () => {
      const validInput = {
        query: "tax documents",
      };

      expect(() => {
        documentsRouter._def.procedures.search._def.inputs[0]?.parse(
          validInput,
        );
      }).not.toThrow();
    });

    it("should accept optional filters", () => {
      const validInput = {
        query: "invoice",
        clientId: "550e8400-e29b-41d4-a716-446655440000",
        tags: ["paid", "2024"],
        limit: 50,
      };

      expect(() => {
        documentsRouter._def.procedures.search._def.inputs[0]?.parse(
          validInput,
        );
      }).not.toThrow();
    });

    it("should validate minimum query length", () => {
      const invalidInput = {
        query: "", // Empty string not allowed (min 1)
      };

      expect(() => {
        documentsRouter._def.procedures.search._def.inputs[0]?.parse(
          invalidInput,
        );
      }).toThrow();
    });
  });

  describe("createSignatureDocument", () => {
    it("should validate required fields", () => {
      const invalidInput = {
        // Missing name, clientId, url
        description: "Test document",
      };

      expect(() => {
        documentsRouter._def.procedures.createSignatureDocument._def.inputs[0]?.parse(
          invalidInput,
        );
      }).toThrow();
    });

    it("should accept valid signature document data", () => {
      const validInput = {
        name: "Contract.pdf",
        clientId: "550e8400-e29b-41d4-a716-446655440000",
        url: "https://s3.example.com/documents/contract.pdf",
      };

      expect(() => {
        documentsRouter._def.procedures.createSignatureDocument._def.inputs[0]?.parse(
          validInput,
        );
      }).not.toThrow();
    });

    it("should accept optional metadata fields", () => {
      const validInput = {
        name: "Agreement.pdf",
        clientId: "550e8400-e29b-41d4-a716-446655440000",
        url: "https://s3.example.com/documents/agreement.pdf",
        description: "Service agreement requiring signature",
        size: 204800,
        mimeType: "application/pdf",
      };

      expect(() => {
        documentsRouter._def.procedures.createSignatureDocument._def.inputs[0]?.parse(
          validInput,
        );
      }).not.toThrow();
    });

    it("should validate URL format", () => {
      const invalidInput = {
        name: "Contract.pdf",
        clientId: "550e8400-e29b-41d4-a716-446655440000",
        url: "not-a-valid-url",
      };

      expect(() => {
        documentsRouter._def.procedures.createSignatureDocument._def.inputs[0]?.parse(
          invalidInput,
        );
      }).toThrow();
    });
  });

  describe("getSigningStatus", () => {
    it("should accept valid document ID", () => {
      const validInput = {
        documentId: "550e8400-e29b-41d4-a716-446655440000",
      };

      expect(() => {
        documentsRouter._def.procedures.getSigningStatus._def.inputs[0]?.parse(
          validInput,
        );
      }).not.toThrow();
    });
  });

  describe("Router Structure", () => {
    it("should export all expected procedures", () => {
      const procedures = Object.keys(documentsRouter._def.procedures);

      expect(procedures).toContain("list");
      expect(procedures).toContain("get");
      expect(procedures).toContain("createFolder");
      expect(procedures).toContain("update");
      expect(procedures).toContain("delete");
      expect(procedures).toContain("getPresignedUrl");
      expect(procedures).toContain("createShareLink");
      expect(procedures).toContain("getSharedDocument");
      expect(procedures).toContain("revokeShareLink");
      expect(procedures).toContain("getStorageStats");
      expect(procedures).toContain("search");
      expect(procedures).toContain("createSignatureDocument");
      expect(procedures).toContain("getSigningStatus");
    });

    it("should have 13 procedures total", () => {
      const procedures = Object.keys(documentsRouter._def.procedures);
      expect(procedures).toHaveLength(13);
    });
  });
});
