/**
 * Documents Router Integration Tests
 *
 * Integration-level tests for the documents tRPC router.
 * Tests verify database operations, tenant isolation, and business logic.
 *
 * Cleanup Strategy: Unique test IDs + afterEach cleanup (per Task 0 spike findings)
 */

import { TRPCError } from "@trpc/server";
import { and, eq } from "drizzle-orm";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { documentsRouter } from "@/app/server/routers/documents";
import { db } from "@/lib/db";
import { activityLogs, documents } from "@/lib/db/schema";
import {
  cleanupTestData,
  createTestClient,
  createTestDocument,
  createTestTenant,
  createTestUser,
  type TestDataTracker,
} from "../helpers/factories";
import {
  createCaller,
  createMockContext,
  type TestContextWithAuth,
} from "../helpers/trpc";

// Mock S3 storage to prevent actual S3 operations
vi.mock("@/lib/storage/s3", () => ({
  deleteFromS3: vi.fn().mockResolvedValue(undefined),
  getPresignedUrl: vi.fn().mockResolvedValue("https://example.com/signed-url"),
}));

// Mock DocuSeal client to prevent actual API calls
vi.mock("@/lib/docuseal/client", () => ({
  docusealClient: {
    createSubmission: vi.fn().mockResolvedValue({
      id: "submission-123",
    }),
    getEmbedUrl: vi.fn().mockReturnValue("https://docuseal.com/embed/123"),
  },
}));

describe("app/server/routers/documents.ts (Integration)", () => {
  let ctx: TestContextWithAuth;
  let caller: ReturnType<typeof createCaller<typeof documentsRouter>>;
  const tracker: TestDataTracker = {
    tenants: [],
    users: [],
    clients: [],
    documents: [],
  };

  beforeEach(async () => {
    // Create test tenant and user for each test
    const tenantId = await createTestTenant();
    const userId = await createTestUser(tenantId, { role: "admin" });

    tracker.tenants?.push(tenantId);
    tracker.users?.push(userId);

    // Create mock context with test tenant and user
    ctx = createMockContext({
      authContext: {
        userId,
        tenantId,
        organizationName: "Test Organization",
        role: "admin",
        email: `test-${crypto.randomUUID()}@example.com`,
        firstName: "Test",
        lastName: "User",
      },
    });

    caller = createCaller(documentsRouter, ctx);
    vi.clearAllMocks();
  });

  afterEach(async () => {
    await cleanupTestData(tracker);
    // Reset tracker
    tracker.tenants = [];
    tracker.users = [];
    tracker.clients = [];
    tracker.documents = [];
  });

  describe("createFolder (Integration)", () => {
    it("should create folder and persist to database", async () => {
      const input = {
        name: `Test Folder ${Date.now()}`,
        description: "Test folder description",
      };

      const result = await caller.createFolder(input);
      tracker.documents?.push(result.id);

      expect(result.id).toBeDefined();
      expect(result.name).toBe(input.name);
      expect(result.type).toBe("folder");
      expect(result.tenantId).toBe(ctx.authContext.tenantId);
      expect(result.uploadedById).toBe(ctx.authContext.userId);
      expect(result.path).toBe(`/${input.name}`);

      // Verify database persistence
      const [dbFolder] = await db
        .select()
        .from(documents)
        .where(eq(documents.id, result.id));

      expect(dbFolder).toBeDefined();
      expect(dbFolder.name).toBe(input.name);
      expect(dbFolder.type).toBe("folder");
      expect(dbFolder.tenantId).toBe(ctx.authContext.tenantId);
    });

    it("should create folder with client association", async () => {
      const client = await createTestClient(
        ctx.authContext.tenantId,
        ctx.authContext.userId,
      );
      tracker.clients?.push(client.id);

      const input = {
        name: `Client Folder ${Date.now()}`,
        clientId: client.id,
      };

      const result = await caller.createFolder(input);
      tracker.documents?.push(result.id);

      expect(result.clientId).toBe(client.id);

      // Verify database persistence
      const [dbFolder] = await db
        .select()
        .from(documents)
        .where(eq(documents.id, result.id));

      expect(dbFolder.clientId).toBe(client.id);
    });

    it("should create nested folder with correct path", async () => {
      // Create parent folder
      const parent = await caller.createFolder({
        name: `Parent ${Date.now()}`,
      });
      tracker.documents?.push(parent.id);

      // Create child folder
      const child = await caller.createFolder({
        name: `Child ${Date.now()}`,
        parentId: parent.id,
      });
      tracker.documents?.push(child.id);

      expect(child.parentId).toBe(parent.id);
      expect(child.path).toBe(`${parent.path}/${child.name}`);

      // Verify database persistence
      const [dbChild] = await db
        .select()
        .from(documents)
        .where(eq(documents.id, child.id));

      expect(dbChild.parentId).toBe(parent.id);
      expect(dbChild.path).toBe(`${parent.path}/${child.name}`);
    });

    it("should create folder with tags", async () => {
      const input = {
        name: `Tagged Folder ${Date.now()}`,
        tags: ["important", "2024"],
      };

      const result = await caller.createFolder(input);
      tracker.documents?.push(result.id);

      expect(result.tags).toEqual(["important", "2024"]);
    });

    it("should throw NOT_FOUND for invalid parent folder", async () => {
      const nonExistentId = crypto.randomUUID();

      await expect(
        caller.createFolder({
          name: "Test Folder",
          parentId: nonExistentId,
        }),
      ).rejects.toThrow("Parent folder not found");
    });

    it("should throw BAD_REQUEST when parent is not a folder", async () => {
      // Create a file (not a folder)
      const client = await createTestClient(
        ctx.authContext.tenantId,
        ctx.authContext.userId,
      );
      tracker.clients?.push(client.id);

      const file = await createTestDocument(
        ctx.authContext.tenantId,
        client.id,
        ctx.authContext.userId,
        { type: "file" },
      );
      tracker.documents?.push(file.id);

      await expect(
        caller.createFolder({
          name: "Test Folder",
          parentId: file.id,
        }),
      ).rejects.toThrow("Parent must be a folder");
    });
  });

  describe("list (Integration)", () => {
    it("should list documents with tenant isolation", async () => {
      const client = await createTestClient(
        ctx.authContext.tenantId,
        ctx.authContext.userId,
      );
      tracker.clients?.push(client.id);

      const doc1 = await createTestDocument(
        ctx.authContext.tenantId,
        client.id,
        ctx.authContext.userId,
        { name: "Document 1.pdf" },
      );
      const doc2 = await createTestDocument(
        ctx.authContext.tenantId,
        client.id,
        ctx.authContext.userId,
        { name: "Document 2.pdf" },
      );
      tracker.documents?.push(doc1.id, doc2.id);

      const result = await caller.list({});

      expect(result.documents).toBeDefined();
      expect(result.documents.length).toBeGreaterThanOrEqual(2);

      // Verify tenant isolation
      for (const doc of result.documents) {
        expect(doc.document.tenantId).toBe(ctx.authContext.tenantId);
      }

      // Verify our test documents are in the list
      const docIds = result.documents.map(
        (d: (typeof result.documents)[0]) => d.document.id,
      );
      expect(docIds).toContain(doc1.id);
      expect(docIds).toContain(doc2.id);
    });

    it("should filter by client ID", async () => {
      const client1 = await createTestClient(
        ctx.authContext.tenantId,
        ctx.authContext.userId,
      );
      const client2 = await createTestClient(
        ctx.authContext.tenantId,
        ctx.authContext.userId,
      );
      tracker.clients?.push(client1.id, client2.id);

      const doc1 = await createTestDocument(
        ctx.authContext.tenantId,
        client1.id,
        ctx.authContext.userId,
        { name: "Client 1 Doc.pdf" },
      );
      const doc2 = await createTestDocument(
        ctx.authContext.tenantId,
        client2.id,
        ctx.authContext.userId,
        { name: "Client 2 Doc.pdf" },
      );
      tracker.documents?.push(doc1.id, doc2.id);

      const result = await caller.list({ clientId: client1.id });

      // All returned documents should belong to client1
      for (const doc of result.documents) {
        expect(doc.document.clientId).toBe(client1.id);
      }

      // Verify client1 doc is present
      const docIds = result.documents.map(
        (d: (typeof result.documents)[0]) => d.document.id,
      );
      expect(docIds).toContain(doc1.id);
    });

    it("should filter by type (file vs folder)", async () => {
      const client = await createTestClient(
        ctx.authContext.tenantId,
        ctx.authContext.userId,
      );
      tracker.clients?.push(client.id);

      const folder = await caller.createFolder({
        name: `Test Folder ${Date.now()}`,
      });
      const file = await createTestDocument(
        ctx.authContext.tenantId,
        client.id,
        ctx.authContext.userId,
      );
      tracker.documents?.push(folder.id, file.id);

      // Filter for folders only
      const folderResult = await caller.list({ type: "folder" });
      for (const doc of folderResult.documents) {
        expect(doc.document.type).toBe("folder");
      }

      // Filter for files only
      const fileResult = await caller.list({ type: "file" });
      for (const doc of fileResult.documents) {
        expect(doc.document.type).toBe("file");
      }
    });

    it("should filter by search term", async () => {
      const client = await createTestClient(
        ctx.authContext.tenantId,
        ctx.authContext.userId,
      );
      tracker.clients?.push(client.id);

      const doc = await createTestDocument(
        ctx.authContext.tenantId,
        client.id,
        ctx.authContext.userId,
        {
          name: "Searchable Tax Document.pdf",
          description: "Tax filing for 2024",
        },
      );
      tracker.documents?.push(doc.id);

      // Search by name
      const result = await caller.list({ search: "Searchable" });
      const docIds = result.documents.map(
        (d: (typeof result.documents)[0]) => d.document.id,
      );
      expect(docIds).toContain(doc.id);
    });

    it("should filter by parent folder", async () => {
      const client = await createTestClient(
        ctx.authContext.tenantId,
        ctx.authContext.userId,
      );
      tracker.clients?.push(client.id);

      // Create parent folder
      const parent = await caller.createFolder({
        name: `Parent ${Date.now()}`,
      });
      tracker.documents?.push(parent.id);

      // Create document in parent folder
      const doc = await createTestDocument(
        ctx.authContext.tenantId,
        client.id,
        ctx.authContext.userId,
        { parentId: parent.id },
      );
      tracker.documents?.push(doc.id);

      // List documents in parent folder
      const result = await caller.list({ parentId: parent.id });

      expect(result.documents.length).toBeGreaterThanOrEqual(1);
      const docIds = result.documents.map(
        (d: (typeof result.documents)[0]) => d.document.id,
      );
      expect(docIds).toContain(doc.id);
    });

    it("should list root-level documents with null parentId", async () => {
      const client = await createTestClient(
        ctx.authContext.tenantId,
        ctx.authContext.userId,
      );
      tracker.clients?.push(client.id);

      // Create root-level document
      const doc = await createTestDocument(
        ctx.authContext.tenantId,
        client.id,
        ctx.authContext.userId,
        { parentId: null },
      );
      tracker.documents?.push(doc.id);

      // List root-level documents
      const result = await caller.list({ parentId: null });

      // All returned documents should have null parentId
      for (const d of result.documents) {
        expect(d.document.parentId).toBeNull();
      }
    });

    it("should respect pagination limits", async () => {
      const result = await caller.list({ limit: 5, offset: 0 });

      expect(result.documents.length).toBeLessThanOrEqual(5);
    });
  });

  describe("get (Integration)", () => {
    it("should retrieve document by ID", async () => {
      const client = await createTestClient(
        ctx.authContext.tenantId,
        ctx.authContext.userId,
      );
      tracker.clients?.push(client.id);

      const doc = await createTestDocument(
        ctx.authContext.tenantId,
        client.id,
        ctx.authContext.userId,
        { name: "Get Test Document.pdf" },
      );
      tracker.documents?.push(doc.id);

      const result = await caller.get({ documentId: doc.id });

      expect(result.document.id).toBe(doc.id);
      expect(result.document.name).toBe("Get Test Document.pdf");
      expect(result.document.tenantId).toBe(ctx.authContext.tenantId);
      expect(result.uploader).toBeDefined();
      expect(result.uploader.id).toBe(ctx.authContext.userId);
    });

    it("should throw NOT_FOUND for non-existent document", async () => {
      const nonExistentId = crypto.randomUUID();

      await expect(caller.get({ documentId: nonExistentId })).rejects.toThrow(
        "Document not found",
      );
    });

    it("should prevent cross-tenant access (CRITICAL)", async () => {
      // Create document for tenant A
      const tenantAId = await createTestTenant();
      const userAId = await createTestUser(tenantAId);
      const clientAId = await createTestClient(tenantAId, userAId);
      tracker.tenants?.push(tenantAId);
      tracker.users?.push(userAId);
      tracker.clients?.push(clientAId.id);

      const docA = await createTestDocument(tenantAId, clientAId.id, userAId, {
        name: "Tenant A Document.pdf",
      });
      tracker.documents?.push(docA.id);

      // Attempt to access tenant A's document from tenant B (our test tenant)
      await expect(caller.get({ documentId: docA.id })).rejects.toThrow(
        "Document not found",
      );

      // The error should be NOT_FOUND, not FORBIDDEN (data should be invisible)
      try {
        await caller.get({ documentId: docA.id });
        throw new Error("Should have thrown");
      } catch (error) {
        expect(error).toBeInstanceOf(TRPCError);
        expect((error as TRPCError).code).toBe("NOT_FOUND");
      }
    });
  });

  describe("update (Integration)", () => {
    it("should update document and persist changes", async () => {
      const client = await createTestClient(
        ctx.authContext.tenantId,
        ctx.authContext.userId,
      );
      tracker.clients?.push(client.id);

      const doc = await createTestDocument(
        ctx.authContext.tenantId,
        client.id,
        ctx.authContext.userId,
        { name: "Original Name.pdf", description: "Original description" },
      );
      tracker.documents?.push(doc.id);

      const result = await caller.update({
        documentId: doc.id,
        name: "Updated Name.pdf",
        description: "Updated description",
      });

      expect(result.name).toBe("Updated Name.pdf");
      expect(result.description).toBe("Updated description");

      // Verify database persistence
      const [dbDoc] = await db
        .select()
        .from(documents)
        .where(eq(documents.id, doc.id));

      expect(dbDoc.name).toBe("Updated Name.pdf");
      expect(dbDoc.description).toBe("Updated description");
    });

    it("should update document tags", async () => {
      const client = await createTestClient(
        ctx.authContext.tenantId,
        ctx.authContext.userId,
      );
      tracker.clients?.push(client.id);

      const doc = await createTestDocument(
        ctx.authContext.tenantId,
        client.id,
        ctx.authContext.userId,
        { tags: [] },
      );
      tracker.documents?.push(doc.id);

      const result = await caller.update({
        documentId: doc.id,
        tags: ["important", "reviewed"],
      });

      expect(result.tags).toEqual(["important", "reviewed"]);

      // Verify database persistence
      const [dbDoc] = await db
        .select()
        .from(documents)
        .where(eq(documents.id, doc.id));

      expect(dbDoc.tags).toEqual(["important", "reviewed"]);
    });

    it("should move document to different parent folder", async () => {
      const client = await createTestClient(
        ctx.authContext.tenantId,
        ctx.authContext.userId,
      );
      tracker.clients?.push(client.id);

      // Create two folders
      const folder1 = await caller.createFolder({
        name: `Folder 1 ${Date.now()}`,
      });
      const folder2 = await caller.createFolder({
        name: `Folder 2 ${Date.now()}`,
      });
      tracker.documents?.push(folder1.id, folder2.id);

      // Create document in folder1
      const doc = await createTestDocument(
        ctx.authContext.tenantId,
        client.id,
        ctx.authContext.userId,
        { parentId: folder1.id, name: "Movable.pdf" },
      );
      tracker.documents?.push(doc.id);

      // Move to folder2
      const result = await caller.update({
        documentId: doc.id,
        parentId: folder2.id,
      });

      expect(result.parentId).toBe(folder2.id);
      expect(result.path).toBe(`${folder2.path}/Movable.pdf`);
    });

    it("should move document to root level with null parentId", async () => {
      const client = await createTestClient(
        ctx.authContext.tenantId,
        ctx.authContext.userId,
      );
      tracker.clients?.push(client.id);

      // Create folder
      const folder = await caller.createFolder({
        name: `Folder ${Date.now()}`,
      });
      tracker.documents?.push(folder.id);

      // Create document in folder
      const doc = await createTestDocument(
        ctx.authContext.tenantId,
        client.id,
        ctx.authContext.userId,
        { parentId: folder.id, name: "MoveToRoot.pdf" },
      );
      tracker.documents?.push(doc.id);

      // Move to root
      const result = await caller.update({
        documentId: doc.id,
        parentId: null,
      });

      expect(result.parentId).toBeNull();
      expect(result.path).toBe("/MoveToRoot.pdf");
    });

    it("should throw NOT_FOUND for non-existent document", async () => {
      const nonExistentId = crypto.randomUUID();

      await expect(
        caller.update({
          documentId: nonExistentId,
          name: "Should Fail",
        }),
      ).rejects.toThrow("Document not found");
    });

    it("should throw BAD_REQUEST for invalid parent folder", async () => {
      const client = await createTestClient(
        ctx.authContext.tenantId,
        ctx.authContext.userId,
      );
      tracker.clients?.push(client.id);

      const doc = await createTestDocument(
        ctx.authContext.tenantId,
        client.id,
        ctx.authContext.userId,
      );
      tracker.documents?.push(doc.id);

      const nonExistentParentId = crypto.randomUUID();

      await expect(
        caller.update({
          documentId: doc.id,
          parentId: nonExistentParentId,
        }),
      ).rejects.toThrow("Invalid parent folder");
    });

    it("should prevent cross-tenant update", async () => {
      // Create document for different tenant
      const tenantAId = await createTestTenant();
      const userAId = await createTestUser(tenantAId);
      const clientAId = await createTestClient(tenantAId, userAId);
      tracker.tenants?.push(tenantAId);
      tracker.users?.push(userAId);
      tracker.clients?.push(clientAId.id);

      const docA = await createTestDocument(tenantAId, clientAId.id, userAId);
      tracker.documents?.push(docA.id);

      // Attempt to update from different tenant
      await expect(
        caller.update({
          documentId: docA.id,
          name: "Malicious Update",
        }),
      ).rejects.toThrow("Document not found");
    });
  });

  describe("delete (Integration)", () => {
    it("should delete file document", async () => {
      const client = await createTestClient(
        ctx.authContext.tenantId,
        ctx.authContext.userId,
      );
      tracker.clients?.push(client.id);

      const doc = await createTestDocument(
        ctx.authContext.tenantId,
        client.id,
        ctx.authContext.userId,
        { type: "file" },
      );
      tracker.documents?.push(doc.id);

      const result = await caller.delete({ documentId: doc.id });

      expect(result.success).toBe(true);

      // Verify document is deleted from database
      const [dbDoc] = await db
        .select()
        .from(documents)
        .where(eq(documents.id, doc.id));

      expect(dbDoc).toBeUndefined();
    });

    it("should delete empty folder", async () => {
      const folder = await caller.createFolder({
        name: `Empty Folder ${Date.now()}`,
      });
      tracker.documents?.push(folder.id);

      const result = await caller.delete({ documentId: folder.id });

      expect(result.success).toBe(true);

      // Verify folder is deleted
      const [dbFolder] = await db
        .select()
        .from(documents)
        .where(eq(documents.id, folder.id));

      expect(dbFolder).toBeUndefined();
    });

    it("should throw BAD_REQUEST when deleting non-empty folder", async () => {
      const client = await createTestClient(
        ctx.authContext.tenantId,
        ctx.authContext.userId,
      );
      tracker.clients?.push(client.id);

      // Create folder
      const folder = await caller.createFolder({
        name: `Non-Empty Folder ${Date.now()}`,
      });
      tracker.documents?.push(folder.id);

      // Create document in folder
      const doc = await createTestDocument(
        ctx.authContext.tenantId,
        client.id,
        ctx.authContext.userId,
        { parentId: folder.id },
      );
      tracker.documents?.push(doc.id);

      // Attempt to delete non-empty folder
      await expect(caller.delete({ documentId: folder.id })).rejects.toThrow(
        "Cannot delete folder with contents",
      );

      // Verify folder still exists
      const [dbFolder] = await db
        .select()
        .from(documents)
        .where(eq(documents.id, folder.id));

      expect(dbFolder).toBeDefined();
    });

    it("should throw NOT_FOUND for non-existent document", async () => {
      const nonExistentId = crypto.randomUUID();

      await expect(
        caller.delete({ documentId: nonExistentId }),
      ).rejects.toThrow("Document not found");
    });

    it("should prevent cross-tenant deletion", async () => {
      // Create document for different tenant
      const tenantAId = await createTestTenant();
      const userAId = await createTestUser(tenantAId);
      const clientAId = await createTestClient(tenantAId, userAId);
      tracker.tenants?.push(tenantAId);
      tracker.users?.push(userAId);
      tracker.clients?.push(clientAId.id);

      const docA = await createTestDocument(tenantAId, clientAId.id, userAId);
      tracker.documents?.push(docA.id);

      // Attempt to delete from different tenant
      await expect(caller.delete({ documentId: docA.id })).rejects.toThrow(
        "Document not found",
      );

      // Verify document still exists
      const [dbDoc] = await db
        .select()
        .from(documents)
        .where(eq(documents.id, docA.id));

      expect(dbDoc).toBeDefined();
    });
  });

  describe("getPresignedUrl (Integration)", () => {
    it("should generate presigned URL for file", async () => {
      const client = await createTestClient(
        ctx.authContext.tenantId,
        ctx.authContext.userId,
      );
      tracker.clients?.push(client.id);

      const doc = await createTestDocument(
        ctx.authContext.tenantId,
        client.id,
        ctx.authContext.userId,
        { type: "file", url: "https://s3.example.com/bucket/test.pdf" },
      );
      tracker.documents?.push(doc.id);

      const result = await caller.getPresignedUrl({
        documentId: doc.id,
        expiresIn: 3600,
      });

      expect(result.url).toBeDefined();
      expect(result.expiresIn).toBe(3600);
      expect(result.expiresAt).toBeInstanceOf(Date);
    });

    it("should throw NOT_FOUND for non-existent document", async () => {
      const nonExistentId = crypto.randomUUID();

      await expect(
        caller.getPresignedUrl({ documentId: nonExistentId }),
      ).rejects.toThrow("Document not found");
    });

    it("should throw BAD_REQUEST for folder (not file)", async () => {
      const folder = await caller.createFolder({
        name: `Test Folder ${Date.now()}`,
      });
      tracker.documents?.push(folder.id);

      await expect(
        caller.getPresignedUrl({ documentId: folder.id }),
      ).rejects.toThrow("Document is not a file");
    });

    it("should prevent cross-tenant access", async () => {
      // Create document for different tenant
      const tenantAId = await createTestTenant();
      const userAId = await createTestUser(tenantAId);
      const clientAId = await createTestClient(tenantAId, userAId);
      tracker.tenants?.push(tenantAId);
      tracker.users?.push(userAId);
      tracker.clients?.push(clientAId.id);

      const docA = await createTestDocument(tenantAId, clientAId.id, userAId, {
        type: "file",
        url: "https://s3.example.com/bucket/test.pdf",
      });
      tracker.documents?.push(docA.id);

      // Attempt to get presigned URL from different tenant
      await expect(
        caller.getPresignedUrl({ documentId: docA.id }),
      ).rejects.toThrow("Document not found");
    });
  });

  describe("createShareLink (Integration)", () => {
    it("should create shareable link for document", async () => {
      const client = await createTestClient(
        ctx.authContext.tenantId,
        ctx.authContext.userId,
      );
      tracker.clients?.push(client.id);

      const doc = await createTestDocument(
        ctx.authContext.tenantId,
        client.id,
        ctx.authContext.userId,
        { type: "file" },
      );
      tracker.documents?.push(doc.id);

      const result = await caller.createShareLink({
        documentId: doc.id,
        expiresIn: 86400, // 24 hours
      });

      expect(result.shareToken).toBeDefined();
      expect(result.shareUrl).toContain(result.shareToken);
      expect(result.expiresAt).toBeInstanceOf(Date);

      // Verify database update
      const [dbDoc] = await db
        .select()
        .from(documents)
        .where(eq(documents.id, doc.id));

      expect(dbDoc.isPublic).toBe(true);
      expect(dbDoc.shareToken).toBe(result.shareToken);
      expect(dbDoc.shareExpiresAt).toBeInstanceOf(Date);
    });

    it("should create share link without expiration", async () => {
      const client = await createTestClient(
        ctx.authContext.tenantId,
        ctx.authContext.userId,
      );
      tracker.clients?.push(client.id);

      const doc = await createTestDocument(
        ctx.authContext.tenantId,
        client.id,
        ctx.authContext.userId,
        { type: "file" },
      );
      tracker.documents?.push(doc.id);

      const result = await caller.createShareLink({
        documentId: doc.id,
      });

      expect(result.shareToken).toBeDefined();
      expect(result.expiresAt).toBeNull();

      // Verify database
      const [dbDoc] = await db
        .select()
        .from(documents)
        .where(eq(documents.id, doc.id));

      expect(dbDoc.shareExpiresAt).toBeNull();
    });

    it("should throw NOT_FOUND for non-existent document", async () => {
      const nonExistentId = crypto.randomUUID();

      await expect(
        caller.createShareLink({ documentId: nonExistentId }),
      ).rejects.toThrow("Document not found");
    });

    it("should throw BAD_REQUEST for folder", async () => {
      const folder = await caller.createFolder({
        name: `Test Folder ${Date.now()}`,
      });
      tracker.documents?.push(folder.id);

      await expect(
        caller.createShareLink({ documentId: folder.id }),
      ).rejects.toThrow("Only files can be shared");
    });

    it("should prevent cross-tenant access", async () => {
      // Create document for different tenant
      const tenantAId = await createTestTenant();
      const userAId = await createTestUser(tenantAId);
      const clientAId = await createTestClient(tenantAId, userAId);
      tracker.tenants?.push(tenantAId);
      tracker.users?.push(userAId);
      tracker.clients?.push(clientAId.id);

      const docA = await createTestDocument(tenantAId, clientAId.id, userAId, {
        type: "file",
      });
      tracker.documents?.push(docA.id);

      // Attempt to create share link from different tenant
      await expect(
        caller.createShareLink({ documentId: docA.id }),
      ).rejects.toThrow("Document not found");
    });
  });

  describe("getSharedDocument (Integration)", () => {
    it("should retrieve document by share token", async () => {
      const client = await createTestClient(
        ctx.authContext.tenantId,
        ctx.authContext.userId,
      );
      tracker.clients?.push(client.id);

      const doc = await createTestDocument(
        ctx.authContext.tenantId,
        client.id,
        ctx.authContext.userId,
        { type: "file", name: "Shared Document.pdf" },
      );
      tracker.documents?.push(doc.id);

      // Create share link
      const shareResult = await caller.createShareLink({ documentId: doc.id });

      // Get shared document
      const result = await caller.getSharedDocument({
        shareToken: shareResult.shareToken,
      });

      expect(result.document.id).toBe(doc.id);
      expect(result.document.name).toBe("Shared Document.pdf");
      expect(result.uploader).toBeDefined();
    });

    it("should throw NOT_FOUND for invalid share token", async () => {
      await expect(
        caller.getSharedDocument({ shareToken: "invalid-token-123" }),
      ).rejects.toThrow("Shared document not found");
    });

    it("should throw FORBIDDEN for expired share link", async () => {
      const client = await createTestClient(
        ctx.authContext.tenantId,
        ctx.authContext.userId,
      );
      tracker.clients?.push(client.id);

      const doc = await createTestDocument(
        ctx.authContext.tenantId,
        client.id,
        ctx.authContext.userId,
        { type: "file" },
      );
      tracker.documents?.push(doc.id);

      // Create share link
      const shareResult = await caller.createShareLink({ documentId: doc.id });

      // Manually expire the share link
      await db
        .update(documents)
        .set({ shareExpiresAt: new Date(Date.now() - 1000) }) // 1 second ago
        .where(eq(documents.id, doc.id));

      // Attempt to access expired link
      await expect(
        caller.getSharedDocument({ shareToken: shareResult.shareToken }),
      ).rejects.toThrow("Share link has expired");
    });

    it("should throw NOT_FOUND for revoked share link", async () => {
      const client = await createTestClient(
        ctx.authContext.tenantId,
        ctx.authContext.userId,
      );
      tracker.clients?.push(client.id);

      const doc = await createTestDocument(
        ctx.authContext.tenantId,
        client.id,
        ctx.authContext.userId,
        { type: "file" },
      );
      tracker.documents?.push(doc.id);

      // Create and revoke share link
      const shareResult = await caller.createShareLink({ documentId: doc.id });
      await caller.revokeShareLink({ documentId: doc.id });

      // Attempt to access revoked link (token is nulled, so it's NOT_FOUND)
      await expect(
        caller.getSharedDocument({ shareToken: shareResult.shareToken }),
      ).rejects.toThrow("Shared document not found");
    });
  });

  describe("revokeShareLink (Integration)", () => {
    it("should revoke share link", async () => {
      const client = await createTestClient(
        ctx.authContext.tenantId,
        ctx.authContext.userId,
      );
      tracker.clients?.push(client.id);

      const doc = await createTestDocument(
        ctx.authContext.tenantId,
        client.id,
        ctx.authContext.userId,
        { type: "file" },
      );
      tracker.documents?.push(doc.id);

      // Create share link
      await caller.createShareLink({ documentId: doc.id });

      // Revoke share link
      const result = await caller.revokeShareLink({ documentId: doc.id });

      expect(result.success).toBe(true);

      // Verify database update
      const [dbDoc] = await db
        .select()
        .from(documents)
        .where(eq(documents.id, doc.id));

      expect(dbDoc.isPublic).toBe(false);
      expect(dbDoc.shareToken).toBeNull();
      expect(dbDoc.shareExpiresAt).toBeNull();
    });

    it("should succeed even if document is not shared", async () => {
      const client = await createTestClient(
        ctx.authContext.tenantId,
        ctx.authContext.userId,
      );
      tracker.clients?.push(client.id);

      const doc = await createTestDocument(
        ctx.authContext.tenantId,
        client.id,
        ctx.authContext.userId,
      );
      tracker.documents?.push(doc.id);

      // Revoke share link (even though none exists)
      const result = await caller.revokeShareLink({ documentId: doc.id });

      expect(result.success).toBe(true);
    });

    it("should prevent cross-tenant access", async () => {
      // Create document for different tenant
      const tenantAId = await createTestTenant();
      const userAId = await createTestUser(tenantAId);
      const clientAId = await createTestClient(tenantAId, userAId);
      tracker.tenants?.push(tenantAId);
      tracker.users?.push(userAId);
      tracker.clients?.push(clientAId.id);

      const docA = await createTestDocument(tenantAId, clientAId.id, userAId, {
        type: "file",
      });
      tracker.documents?.push(docA.id);

      // Attempt to revoke from different tenant (should silently fail)
      const result = await caller.revokeShareLink({ documentId: docA.id });

      // Should succeed but not affect the other tenant's document
      expect(result.success).toBe(true);

      // Verify other tenant's document unchanged
      const [dbDoc] = await db
        .select()
        .from(documents)
        .where(eq(documents.id, docA.id));

      expect(dbDoc).toBeDefined();
    });
  });

  describe("getStorageStats (Integration)", () => {
    it("should calculate storage statistics for tenant", async () => {
      const client = await createTestClient(
        ctx.authContext.tenantId,
        ctx.authContext.userId,
      );
      tracker.clients?.push(client.id);

      // Create multiple files
      const doc1 = await createTestDocument(
        ctx.authContext.tenantId,
        client.id,
        ctx.authContext.userId,
        { type: "file", size: 1024, mimeType: "application/pdf" },
      );
      const doc2 = await createTestDocument(
        ctx.authContext.tenantId,
        client.id,
        ctx.authContext.userId,
        { type: "file", size: 2048, mimeType: "image/png" },
      );
      tracker.documents?.push(doc1.id, doc2.id);

      const result = await caller.getStorageStats();

      expect(result.totalFiles).toBeGreaterThanOrEqual(2);
      expect(result.totalSize).toBeGreaterThanOrEqual(3072); // 1024 + 2048
      expect(result.totalSizeFormatted).toBeDefined();
      expect(result.byMimeType).toBeDefined();
      expect(result.quota).toBeDefined();
      expect(result.quotaUsedPercent).toBeGreaterThanOrEqual(0);
    });

    it("should only count files from current tenant", async () => {
      // Create document for different tenant
      const tenantAId = await createTestTenant();
      const userAId = await createTestUser(tenantAId);
      const clientAId = await createTestClient(tenantAId, userAId);
      tracker.tenants?.push(tenantAId);
      tracker.users?.push(userAId);
      tracker.clients?.push(clientAId.id);

      const docA = await createTestDocument(tenantAId, clientAId.id, userAId, {
        type: "file",
        size: 999999,
      });
      tracker.documents?.push(docA.id);

      // Get stats for our test tenant (should not include tenantA's large file)
      const result = await caller.getStorageStats();

      // Total size should not include the 999999 bytes from tenantA
      expect(result.totalSize).toBeLessThan(999999);
    });
  });

  describe("search (Integration)", () => {
    it("should search documents by query", async () => {
      const client = await createTestClient(
        ctx.authContext.tenantId,
        ctx.authContext.userId,
      );
      tracker.clients?.push(client.id);

      const doc = await createTestDocument(
        ctx.authContext.tenantId,
        client.id,
        ctx.authContext.userId,
        {
          name: "Searchable Invoice 2024.pdf",
          description: "Annual invoice for tax purposes",
        },
      );
      tracker.documents?.push(doc.id);

      // Search by name
      const result = await caller.search({ query: "Searchable" });

      expect(result.length).toBeGreaterThanOrEqual(1);
      const docIds = result.map((r: (typeof result)[0]) => r.document.id);
      expect(docIds).toContain(doc.id);
    });

    it("should filter search by client", async () => {
      const client1 = await createTestClient(
        ctx.authContext.tenantId,
        ctx.authContext.userId,
      );
      const client2 = await createTestClient(
        ctx.authContext.tenantId,
        ctx.authContext.userId,
      );
      tracker.clients?.push(client1.id, client2.id);

      const doc1 = await createTestDocument(
        ctx.authContext.tenantId,
        client1.id,
        ctx.authContext.userId,
        { name: "Test Document.pdf" },
      );
      const doc2 = await createTestDocument(
        ctx.authContext.tenantId,
        client2.id,
        ctx.authContext.userId,
        { name: "Test Document.pdf" },
      );
      tracker.documents?.push(doc1.id, doc2.id);

      // Search filtered by client1
      const result = await caller.search({
        query: "Test",
        clientId: client1.id,
      });

      // All results should belong to client1
      for (const r of result) {
        expect(r.document.clientId).toBe(client1.id);
      }
    });

    it("should respect search limit", async () => {
      const result = await caller.search({ query: "test", limit: 5 });

      expect(result.length).toBeLessThanOrEqual(5);
    });

    it("should enforce tenant isolation in search", async () => {
      // Create document for different tenant with distinctive name
      const tenantAId = await createTestTenant();
      const userAId = await createTestUser(tenantAId);
      const clientAId = await createTestClient(tenantAId, userAId);
      tracker.tenants?.push(tenantAId);
      tracker.users?.push(userAId);
      tracker.clients?.push(clientAId.id);

      const docA = await createTestDocument(tenantAId, clientAId.id, userAId, {
        name: `UNIQUE-TENANT-A-${Date.now()}.pdf`,
      });
      tracker.documents?.push(docA.id);

      // Search from our test tenant should not find tenantA's document
      const result = await caller.search({ query: "UNIQUE-TENANT-A" });

      const docIds = result.map((r: (typeof result)[0]) => r.document.id);
      expect(docIds).not.toContain(docA.id);
    });
  });

  describe("getSigningStatus (Integration)", () => {
    it("should return status for document not requiring signature", async () => {
      const client = await createTestClient(
        ctx.authContext.tenantId,
        ctx.authContext.userId,
      );
      tracker.clients?.push(client.id);

      const doc = await createTestDocument(
        ctx.authContext.tenantId,
        client.id,
        ctx.authContext.userId,
        { requiresSignature: false },
      );
      tracker.documents?.push(doc.id);

      const result = await caller.getSigningStatus({ documentId: doc.id });

      expect(result.requiresSignature).toBe(false);
      expect(result.status).toBe("none");
    });

    it("should return status for document requiring signature", async () => {
      const client = await createTestClient(
        ctx.authContext.tenantId,
        ctx.authContext.userId,
      );
      tracker.clients?.push(client.id);

      const doc = await createTestDocument(
        ctx.authContext.tenantId,
        client.id,
        ctx.authContext.userId,
        {
          requiresSignature: true,
          signatureStatus: "pending",
        },
      );
      tracker.documents?.push(doc.id);

      const result = await caller.getSigningStatus({ documentId: doc.id });

      expect(result.requiresSignature).toBe(true);
      expect(result.status).toBe("pending");
    });

    it("should throw NOT_FOUND for non-existent document", async () => {
      const nonExistentId = crypto.randomUUID();

      await expect(
        caller.getSigningStatus({ documentId: nonExistentId }),
      ).rejects.toThrow("Document not found");
    });

    it("should prevent cross-tenant access", async () => {
      // Create document for different tenant
      const tenantAId = await createTestTenant();
      const userAId = await createTestUser(tenantAId);
      const clientAId = await createTestClient(tenantAId, userAId);
      tracker.tenants?.push(tenantAId);
      tracker.users?.push(userAId);
      tracker.clients?.push(clientAId.id);

      const docA = await createTestDocument(tenantAId, clientAId.id, userAId, {
        requiresSignature: true,
      });
      tracker.documents?.push(docA.id);

      // Attempt to get signing status from different tenant
      await expect(
        caller.getSigningStatus({ documentId: docA.id }),
      ).rejects.toThrow("Document not found");
    });
  });

  describe("Bulk Operations (Integration)", () => {
    let testClientId: string;

    beforeEach(async () => {
      // Create a test client for document tests
      const client = await createTestClient(
        ctx.authContext.tenantId,
        ctx.authContext.userId,
      );
      testClientId = client.id;
      tracker.clients?.push(testClientId);
    });

    describe("bulkMove", () => {
      it("should move multiple documents to folder", async () => {
        // Create a folder
        const folder = await createTestDocument(
          ctx.authContext.tenantId,
          testClientId,
          ctx.authContext.userId,
          { type: "folder", name: "Test Folder" },
        );
        tracker.documents?.push(folder.id);

        // Create 3 test documents
        const doc1 = await createTestDocument(
          ctx.authContext.tenantId,
          testClientId,
          ctx.authContext.userId,
        );
        const doc2 = await createTestDocument(
          ctx.authContext.tenantId,
          testClientId,
          ctx.authContext.userId,
        );
        const doc3 = await createTestDocument(
          ctx.authContext.tenantId,
          testClientId,
          ctx.authContext.userId,
        );
        tracker.documents?.push(doc1.id, doc2.id, doc3.id);

        const result = await caller.bulkMove({
          documentIds: [doc1.id, doc2.id, doc3.id],
          parentId: folder.id,
        });

        expect(result.success).toBe(true);
        expect(result.count).toBe(3);

        // Verify database state
        const updatedDocs = await db
          .select()
          .from(documents)
          .where(eq(documents.id, doc1.id));

        expect(updatedDocs[0].parentId).toBe(folder.id);
      });

      it("should enforce multi-tenant isolation", async () => {
        // Create a different tenant
        const otherTenantId = await createTestTenant();
        const otherUserId = await createTestUser(otherTenantId);
        tracker.tenants?.push(otherTenantId);
        tracker.users?.push(otherUserId);

        const otherClient = await createTestClient(otherTenantId, otherUserId);
        tracker.clients?.push(otherClient.id);

        const otherDoc = await createTestDocument(
          otherTenantId,
          otherClient.id,
          otherUserId,
        );
        tracker.documents?.push(otherDoc.id);

        // Create a folder in current tenant
        const currentFolder = await createTestDocument(
          ctx.authContext.tenantId,
          testClientId,
          ctx.authContext.userId,
          { type: "folder", name: "Current Folder" },
        );
        tracker.documents?.push(currentFolder.id);

        // Try to move document from different tenant
        await expect(
          caller.bulkMove({
            documentIds: [otherDoc.id],
            parentId: currentFolder.id,
          }),
        ).rejects.toThrow("One or more documents not found");
      });

      it("should log activity for bulk move (AC22)", async () => {
        const folder = await createTestDocument(
          ctx.authContext.tenantId,
          testClientId,
          ctx.authContext.userId,
          { type: "folder", name: "Test Folder" },
        );
        tracker.documents?.push(folder.id);

        const doc1 = await createTestDocument(
          ctx.authContext.tenantId,
          testClientId,
          ctx.authContext.userId,
        );
        const doc2 = await createTestDocument(
          ctx.authContext.tenantId,
          testClientId,
          ctx.authContext.userId,
        );
        tracker.documents?.push(doc1.id, doc2.id);

        await caller.bulkMove({
          documentIds: [doc1.id, doc2.id],
          parentId: folder.id,
        });

        // Verify activity logs (AC22 - Audit Logging)
        const logs = await db
          .select()
          .from(activityLogs)
          .where(
            and(
              eq(activityLogs.action, "bulk_move"),
              eq(activityLogs.tenantId, ctx.authContext.tenantId),
            ),
          );

        expect(logs.length).toBeGreaterThanOrEqual(2);
        expect(logs[0].description).toContain("Bulk moved document");
      });
    });

    describe("bulkChangeCategory", () => {
      it("should change tags for multiple documents (replace mode - AC13)", async () => {
        // Create documents with existing tags
        const doc1 = await createTestDocument(
          ctx.authContext.tenantId,
          testClientId,
          ctx.authContext.userId,
          { tags: ["old-tag-1", "old-tag-2"] },
        );
        const doc2 = await createTestDocument(
          ctx.authContext.tenantId,
          testClientId,
          ctx.authContext.userId,
          { tags: ["old-tag-1"] },
        );
        tracker.documents?.push(doc1.id, doc2.id);

        const result = await caller.bulkChangeCategory({
          documentIds: [doc1.id, doc2.id],
          tags: ["new-tag-1", "new-tag-2"],
          addTags: false, // Replace mode
        });

        expect(result.success).toBe(true);
        expect(result.count).toBe(2);

        // Verify database state - tags should be replaced
        const updatedDocs = await db
          .select()
          .from(documents)
          .where(eq(documents.id, doc1.id));

        expect(updatedDocs[0].tags).toEqual(["new-tag-1", "new-tag-2"]);
      });

      it("should add tags to existing tags (add mode - AC13)", async () => {
        // Create documents with existing tags
        const doc1 = await createTestDocument(
          ctx.authContext.tenantId,
          testClientId,
          ctx.authContext.userId,
          { tags: ["existing-tag"] },
        );
        const doc2 = await createTestDocument(
          ctx.authContext.tenantId,
          testClientId,
          ctx.authContext.userId,
          { tags: ["existing-tag"] },
        );
        tracker.documents?.push(doc1.id, doc2.id);

        const result = await caller.bulkChangeCategory({
          documentIds: [doc1.id, doc2.id],
          tags: ["new-tag"],
          addTags: true, // Add mode
        });

        expect(result.success).toBe(true);
        expect(result.count).toBe(2);

        // Verify database state - tags should be merged
        const updatedDocs = await db
          .select()
          .from(documents)
          .where(eq(documents.id, doc1.id));

        expect(updatedDocs[0].tags).toContain("existing-tag");
        expect(updatedDocs[0].tags).toContain("new-tag");
        expect(updatedDocs[0].tags?.length).toBe(2);
      });

      it("should log activity for bulk category change (AC22)", async () => {
        const doc1 = await createTestDocument(
          ctx.authContext.tenantId,
          testClientId,
          ctx.authContext.userId,
        );
        const doc2 = await createTestDocument(
          ctx.authContext.tenantId,
          testClientId,
          ctx.authContext.userId,
        );
        tracker.documents?.push(doc1.id, doc2.id);

        await caller.bulkChangeCategory({
          documentIds: [doc1.id, doc2.id],
          tags: ["test-tag"],
          addTags: false,
        });

        // Verify activity logs (AC22 - Audit Logging)
        const logs = await db
          .select()
          .from(activityLogs)
          .where(
            and(
              eq(activityLogs.action, "bulk_change_category"),
              eq(activityLogs.tenantId, ctx.authContext.tenantId),
            ),
          );

        expect(logs.length).toBeGreaterThanOrEqual(2);
        expect(logs[0].description).toContain("Bulk changed tags for document");
      });
    });

    describe("bulkDelete", () => {
      it("should delete multiple documents", async () => {
        const doc1 = await createTestDocument(
          ctx.authContext.tenantId,
          testClientId,
          ctx.authContext.userId,
        );
        const doc2 = await createTestDocument(
          ctx.authContext.tenantId,
          testClientId,
          ctx.authContext.userId,
        );
        tracker.documents?.push(doc1.id, doc2.id);

        const result = await caller.bulkDelete({
          documentIds: [doc1.id, doc2.id],
        });

        expect(result.success).toBe(true);
        expect(result.count).toBe(2);

        // Verify documents are deleted
        const deletedDocs = await db
          .select()
          .from(documents)
          .where(eq(documents.id, doc1.id));

        expect(deletedDocs.length).toBe(0);

        // Remove from tracker since they're deleted
        tracker.documents = tracker.documents?.filter(
          (id) => id !== doc1.id && id !== doc2.id,
        );
      });

      it("should enforce multi-tenant isolation", async () => {
        // Create a different tenant
        const otherTenantId = await createTestTenant();
        const otherUserId = await createTestUser(otherTenantId);
        tracker.tenants?.push(otherTenantId);
        tracker.users?.push(otherUserId);

        const otherClient = await createTestClient(otherTenantId, otherUserId);
        tracker.clients?.push(otherClient.id);

        const otherDoc = await createTestDocument(
          otherTenantId,
          otherClient.id,
          otherUserId,
        );
        tracker.documents?.push(otherDoc.id);

        // Try to delete document from different tenant
        await expect(
          caller.bulkDelete({
            documentIds: [otherDoc.id],
          }),
        ).rejects.toThrow("One or more documents not found");
      });

      it("should log activity for bulk delete (AC22)", async () => {
        const doc1 = await createTestDocument(
          ctx.authContext.tenantId,
          testClientId,
          ctx.authContext.userId,
        );
        const doc2 = await createTestDocument(
          ctx.authContext.tenantId,
          testClientId,
          ctx.authContext.userId,
        );
        tracker.documents?.push(doc1.id, doc2.id);

        await caller.bulkDelete({
          documentIds: [doc1.id, doc2.id],
        });

        // Verify activity logs (AC22 - Audit Logging)
        const logs = await db
          .select()
          .from(activityLogs)
          .where(
            and(
              eq(activityLogs.action, "bulk_delete"),
              eq(activityLogs.tenantId, ctx.authContext.tenantId),
            ),
          );

        expect(logs.length).toBeGreaterThanOrEqual(2);
        expect(logs[0].description).toContain("Bulk deleted document");

        // Remove from tracker since they're deleted
        tracker.documents = tracker.documents?.filter(
          (id) => id !== doc1.id && id !== doc2.id,
        );
      });
    });

    describe("Transaction Safety (AC23)", () => {
      it("should rollback on partial failure - bulkMove", async () => {
        // Create a folder
        const folder = await createTestDocument(
          ctx.authContext.tenantId,
          testClientId,
          ctx.authContext.userId,
          { type: "folder", name: "Test Folder" },
        );
        tracker.documents?.push(folder.id);

        // Create one valid document
        const validDoc = await createTestDocument(
          ctx.authContext.tenantId,
          testClientId,
          ctx.authContext.userId,
        );
        tracker.documents?.push(validDoc.id);

        const nonExistentDocId = crypto.randomUUID();

        // Try to move one valid and one non-existent document
        await expect(
          caller.bulkMove({
            documentIds: [validDoc.id, nonExistentDocId],
            parentId: folder.id,
          }),
        ).rejects.toThrow("One or more documents not found");

        // Verify valid document was NOT moved (transaction rolled back)
        const unchangedDoc = await db
          .select()
          .from(documents)
          .where(eq(documents.id, validDoc.id))
          .limit(1);

        expect(unchangedDoc[0].parentId).not.toBe(folder.id);
      });
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
      expect(procedures).toContain("bulkMove");
      expect(procedures).toContain("bulkChangeCategory");
      expect(procedures).toContain("bulkDelete");
    });

    it("should have 16 procedures total", () => {
      const procedures = Object.keys(documentsRouter._def.procedures);
      expect(procedures).toHaveLength(16);
    });
  });
});
