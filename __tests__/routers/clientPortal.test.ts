/**
 * Client Portal Router Tests
 *
 * Tests for the clientPortal tRPC router
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { clientPortalRouter } from "@/app/server/routers/clientPortal";
import {
  cleanupTestData,
  createTestClient,
  createTestInvoice,
  createTestMessageThread,
  createTestMessageThreadParticipant,
  createTestProposal,
  createTestTenant,
  createTestUser,
  type TestDataTracker,
} from "../helpers/factories";
import {
  createClientPortalCaller,
  createMockClientPortalAuthContext,
} from "../helpers/trpc";

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
  let portalCaller: ReturnType<
    typeof createClientPortalCaller<typeof clientPortalRouter>
  >;
  const tracker: TestDataTracker = {
    tenants: [],
    users: [],
    clients: [],
    proposals: [],
    invoices: [],
    messageThreads: [],
    messageThreadParticipants: [],
    messages: [],
  };

  beforeEach(() => {
    portalCaller = createClientPortalCaller(clientPortalRouter);
    vi.clearAllMocks();
  });

  afterEach(async () => {
    await cleanupTestData(tracker);
    // Reset tracker arrays
    tracker.tenants = [];
    tracker.users = [];
    tracker.clients = [];
    tracker.proposals = [];
    tracker.invoices = [];
    tracker.messageThreads = [];
    tracker.messageThreadParticipants = [];
    tracker.messages = [];
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
        portalCaller.getProposals(invalidInput as Record<string, unknown>),
      ).rejects.toThrow();
    });

    it("should accept valid input without status", async () => {
      const validInput = {
        clientId: "550e8400-e29b-41d4-a716-446655440000",
      };

      await expect(
        portalCaller.getProposals(validInput),
      ).resolves.not.toThrow();
    });

    it("should accept valid input with status", async () => {
      const validInput = {
        clientId: "550e8400-e29b-41d4-a716-446655440000",
        status: "sent" as const,
      };

      await expect(
        portalCaller.getProposals(validInput),
      ).resolves.not.toThrow();
    });

    it("should validate status enum values", async () => {
      const invalidInput = {
        clientId: "550e8400-e29b-41d4-a716-446655440000",
        status: "invalid_status",
      };

      await expect(
        portalCaller.getProposals(invalidInput as Record<string, unknown>),
      ).rejects.toThrow();
    });

    it("should accept all valid status values", async () => {
      const validStatuses = ["sent", "viewed", "signed", "expired"];

      for (const status of validStatuses) {
        await expect(
          portalCaller.getProposals({
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
        portalCaller.getProposalById(invalidInput as Record<string, unknown>),
      ).rejects.toThrow();
    });

    it("should accept valid proposal ID", async () => {
      const tenantId = await createTestTenant();
      tracker.tenants?.push(tenantId);

      const userId = await createTestUser(tenantId);
      tracker.users?.push(userId);

      const client = await createTestClient(tenantId, userId);
      tracker.clients?.push(client.id);

      const proposal = await createTestProposal(tenantId, client.id, {
        status: "sent",
      });
      tracker.proposals?.push(proposal.id);

      const clientPortalAuthContext = createMockClientPortalAuthContext({
        tenantId,
        currentClientId: client.id,
        email: client.email || undefined,
        clientAccess: [
          {
            clientId: client.id,
            clientName: client.name,
            role: "viewer",
            isActive: true,
          },
        ],
      });
      const portalCaller = createClientPortalCaller(clientPortalRouter, {
        clientPortalAuthContext,
      });

      await expect(
        portalCaller.getProposalById({ id: proposal.id }),
      ).resolves.not.toThrow();
    });
  });

  describe("getInvoices", () => {
    it("should validate required clientId field", async () => {
      const invalidInput = {
        // Missing clientId
        status: "sent",
      };

      await expect(
        portalCaller.getInvoices(invalidInput as Record<string, unknown>),
      ).rejects.toThrow();
    });

    it("should accept valid input without status", async () => {
      const validInput = {
        clientId: "550e8400-e29b-41d4-a716-446655440000",
      };

      await expect(portalCaller.getInvoices(validInput)).resolves.not.toThrow();
    });

    it("should accept valid input with status", async () => {
      const validInput = {
        clientId: "550e8400-e29b-41d4-a716-446655440000",
        status: "paid" as const,
      };

      await expect(portalCaller.getInvoices(validInput)).resolves.not.toThrow();
    });

    it("should validate status enum values", async () => {
      const invalidInput = {
        clientId: "550e8400-e29b-41d4-a716-446655440000",
        status: "draft",
      };

      await expect(
        portalCaller.getInvoices(invalidInput as Record<string, unknown>),
      ).rejects.toThrow();
    });

    it("should accept all valid status values", async () => {
      const validStatuses = ["sent", "paid", "overdue", "cancelled"];

      for (const status of validStatuses) {
        await expect(
          portalCaller.getInvoices({
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
        portalCaller.getInvoiceById(invalidInput as Record<string, unknown>),
      ).rejects.toThrow();
    });

    it("should accept valid invoice ID", async () => {
      const tenantId = await createTestTenant();
      tracker.tenants?.push(tenantId);

      const userId = await createTestUser(tenantId);
      tracker.users?.push(userId);

      const client = await createTestClient(tenantId, userId);
      tracker.clients?.push(client.id);

      const invoice = await createTestInvoice(tenantId, client.id, userId, {
        status: "sent",
      });
      tracker.invoices?.push(invoice.id);

      const clientPortalAuthContext = createMockClientPortalAuthContext({
        tenantId,
        currentClientId: client.id,
        email: client.email || undefined,
        clientAccess: [
          {
            clientId: client.id,
            clientName: client.name,
            role: "viewer",
            isActive: true,
          },
        ],
      });
      const portalCaller = createClientPortalCaller(clientPortalRouter, {
        clientPortalAuthContext,
      });

      await expect(
        portalCaller.getInvoiceById({ id: invoice.id }),
      ).resolves.not.toThrow();
    });
  });

  describe("getDocuments", () => {
    it("should validate required clientId field", async () => {
      const invalidInput = {
        // Missing clientId
      };

      await expect(
        portalCaller.getDocuments(invalidInput as Record<string, unknown>),
      ).rejects.toThrow();
    });

    it("should accept valid client ID", async () => {
      const validInput = {
        clientId: "550e8400-e29b-41d4-a716-446655440000",
      };

      await expect(
        portalCaller.getDocuments(validInput),
      ).resolves.not.toThrow();
    });
  });

  describe("getDocumentsToSign", () => {
    it("should validate required clientId field", async () => {
      const invalidInput = {
        // Missing clientId
      };

      await expect(
        portalCaller.getDocumentsToSign(
          invalidInput as Record<string, unknown>,
        ),
      ).rejects.toThrow();
    });

    it("should accept valid client ID", async () => {
      const validInput = {
        clientId: "550e8400-e29b-41d4-a716-446655440000",
      };

      await expect(
        portalCaller.getDocumentsToSign(validInput),
      ).resolves.not.toThrow();
    });
  });

  describe("getSignedDocuments", () => {
    it("should validate required clientId field", async () => {
      const invalidInput = {
        // Missing clientId
      };

      await expect(
        portalCaller.getSignedDocuments(
          invalidInput as Record<string, unknown>,
        ),
      ).rejects.toThrow();
    });

    it("should accept valid client ID", async () => {
      const validInput = {
        clientId: "550e8400-e29b-41d4-a716-446655440000",
      };

      await expect(
        portalCaller.getSignedDocuments(validInput),
      ).resolves.not.toThrow();
    });
  });

  describe("listMyThreads", () => {
    it("should validate required clientId field", async () => {
      const invalidInput = {
        // Missing clientId
      };

      await expect(
        portalCaller.listMyThreads(invalidInput as Record<string, unknown>),
      ).rejects.toThrow();
    });

    it("should accept valid client ID", async () => {
      const validInput = {
        clientId: "550e8400-e29b-41d4-a716-446655440000",
      };

      await expect(
        portalCaller.listMyThreads(validInput),
      ).resolves.not.toThrow();
    });
  });

  describe("getThread", () => {
    it("should validate required fields", async () => {
      const invalidInput = {
        // Missing threadId and clientId
      };

      await expect(
        portalCaller.getThread(invalidInput as Record<string, unknown>),
      ).rejects.toThrow();
    });

    it("should accept valid thread and client IDs", async () => {
      const tenantId = await createTestTenant();
      tracker.tenants?.push(tenantId);

      const userId = await createTestUser(tenantId);
      tracker.users?.push(userId);

      const client = await createTestClient(tenantId, userId);
      tracker.clients?.push(client.id);

      const clientPortalAuthContext = createMockClientPortalAuthContext({
        tenantId,
        currentClientId: client.id,
        email: client.email || undefined,
        clientAccess: [
          {
            clientId: client.id,
            clientName: client.name,
            role: "viewer",
            isActive: true,
          },
        ],
      });

      const thread = await createTestMessageThread(tenantId, userId, {
        clientId: client.id,
        type: "client",
      });
      tracker.messageThreads?.push(thread.id);

      // Add client portal user as participant
      const participant = await createTestMessageThreadParticipant(
        thread.id,
        clientPortalAuthContext.portalUserId,
        {
          participantType: "client_portal",
        },
      );
      tracker.messageThreadParticipants?.push(participant.id);
      const portalCaller = createClientPortalCaller(clientPortalRouter, {
        clientPortalAuthContext,
      });

      await expect(
        portalCaller.getThread({ threadId: thread.id, clientId: client.id }),
      ).resolves.not.toThrow();
    });
  });

  describe("listMessages", () => {
    it("should validate required fields", async () => {
      const invalidInput = {
        // Missing threadId and clientId
        limit: 25,
      };

      await expect(
        portalCaller.listMessages(invalidInput as Record<string, unknown>),
      ).rejects.toThrow();
    });

    it("should accept valid input with defaults", async () => {
      const tenantId = await createTestTenant();
      tracker.tenants?.push(tenantId);

      const userId = await createTestUser(tenantId);
      tracker.users?.push(userId);

      const client = await createTestClient(tenantId, userId);
      tracker.clients?.push(client.id);

      const clientPortalAuthContext = createMockClientPortalAuthContext({
        tenantId,
        currentClientId: client.id,
        email: client.email || undefined,
        clientAccess: [
          {
            clientId: client.id,
            clientName: client.name,
            role: "viewer",
            isActive: true,
          },
        ],
      });

      const thread = await createTestMessageThread(tenantId, userId, {
        clientId: client.id,
        type: "client",
      });
      tracker.messageThreads?.push(thread.id);

      // Add client portal user as participant
      const participant = await createTestMessageThreadParticipant(
        thread.id,
        clientPortalAuthContext.portalUserId,
        {
          participantType: "client_portal",
        },
      );
      tracker.messageThreadParticipants?.push(participant.id);
      const portalCaller = createClientPortalCaller(clientPortalRouter, {
        clientPortalAuthContext,
      });

      await expect(
        portalCaller.listMessages({ threadId: thread.id, clientId: client.id }),
      ).resolves.not.toThrow();
    });

    it("should validate limit min value", async () => {
      const invalidInput = {
        threadId: "550e8400-e29b-41d4-a716-446655440000",
        clientId: "550e8400-e29b-41d4-a716-446655440000",
        limit: 0, // Below minimum of 1
      };

      await expect(portalCaller.listMessages(invalidInput)).rejects.toThrow();
    });

    it("should validate limit max value", async () => {
      const invalidInput = {
        threadId: "550e8400-e29b-41d4-a716-446655440000",
        clientId: "550e8400-e29b-41d4-a716-446655440000",
        limit: 101, // Exceeds max of 100
      };

      await expect(portalCaller.listMessages(invalidInput)).rejects.toThrow();
    });

    it("should validate offset min value", async () => {
      const invalidInput = {
        threadId: "550e8400-e29b-41d4-a716-446655440000",
        clientId: "550e8400-e29b-41d4-a716-446655440000",
        offset: -1, // Below minimum of 0
      };

      await expect(portalCaller.listMessages(invalidInput)).rejects.toThrow();
    });
  });

  describe("sendMessage", () => {
    it("should validate required fields", async () => {
      const invalidInput = {
        // Missing threadId, clientId, content
        type: "text",
      };

      await expect(
        portalCaller.sendMessage(invalidInput as Record<string, unknown>),
      ).rejects.toThrow();
    });

    it("should accept valid message data", async () => {
      const tenantId = await createTestTenant();
      tracker.tenants?.push(tenantId);

      const userId = await createTestUser(tenantId);
      tracker.users?.push(userId);

      const client = await createTestClient(tenantId, userId);
      tracker.clients?.push(client.id);

      const clientPortalAuthContext = createMockClientPortalAuthContext({
        tenantId,
        currentClientId: client.id,
        email: client.email || undefined,
        clientAccess: [
          {
            clientId: client.id,
            clientName: client.name,
            role: "viewer",
            isActive: true,
          },
        ],
      });

      const thread = await createTestMessageThread(tenantId, userId, {
        clientId: client.id,
        type: "client",
      });
      tracker.messageThreads?.push(thread.id);

      // Add client portal user as participant
      const participant = await createTestMessageThreadParticipant(
        thread.id,
        clientPortalAuthContext.portalUserId,
        {
          participantType: "client_portal",
        },
      );
      tracker.messageThreadParticipants?.push(participant.id);
      const portalCaller = createClientPortalCaller(clientPortalRouter, {
        clientPortalAuthContext,
      });

      const result = await portalCaller.sendMessage({
        threadId: thread.id,
        clientId: client.id,
        content: "Hello from client portal",
      });
      tracker.messages?.push(result.id);

      await expect(Promise.resolve(result)).resolves.not.toThrow();
    });

    it("should validate content minimum length", async () => {
      const invalidInput = {
        threadId: "550e8400-e29b-41d4-a716-446655440000",
        clientId: "550e8400-e29b-41d4-a716-446655440000",
        content: "", // Empty string
      };

      await expect(portalCaller.sendMessage(invalidInput)).rejects.toThrow();
    });

    it("should validate content maximum length", async () => {
      const invalidInput = {
        threadId: "550e8400-e29b-41d4-a716-446655440000",
        clientId: "550e8400-e29b-41d4-a716-446655440000",
        content: "a".repeat(5001), // Exceeds max of 5000
      };

      await expect(portalCaller.sendMessage(invalidInput)).rejects.toThrow();
    });

    it("should accept file type", async () => {
      const tenantId = await createTestTenant();
      tracker.tenants?.push(tenantId);

      const userId = await createTestUser(tenantId);
      tracker.users?.push(userId);

      const client = await createTestClient(tenantId, userId);
      tracker.clients?.push(client.id);

      const clientPortalAuthContext = createMockClientPortalAuthContext({
        tenantId,
        currentClientId: client.id,
        email: client.email || undefined,
        clientAccess: [
          {
            clientId: client.id,
            clientName: client.name,
            role: "viewer",
            isActive: true,
          },
        ],
      });

      const thread = await createTestMessageThread(tenantId, userId, {
        clientId: client.id,
        type: "client",
      });
      tracker.messageThreads?.push(thread.id);

      // Add client portal user as participant
      const participant = await createTestMessageThreadParticipant(
        thread.id,
        clientPortalAuthContext.portalUserId,
        {
          participantType: "client_portal",
        },
      );
      tracker.messageThreadParticipants?.push(participant.id);
      const portalCaller = createClientPortalCaller(clientPortalRouter, {
        clientPortalAuthContext,
      });

      const result = await portalCaller.sendMessage({
        threadId: thread.id,
        clientId: client.id,
        content: "File attachment",
        type: "file" as const,
      });
      tracker.messages?.push(result.id);

      await expect(Promise.resolve(result)).resolves.not.toThrow();
    });

    it("should accept message without metadata", async () => {
      const tenantId = await createTestTenant();
      tracker.tenants?.push(tenantId);

      const userId = await createTestUser(tenantId);
      tracker.users?.push(userId);

      const client = await createTestClient(tenantId, userId);
      tracker.clients?.push(client.id);

      const clientPortalAuthContext = createMockClientPortalAuthContext({
        tenantId,
        currentClientId: client.id,
        email: client.email || undefined,
        clientAccess: [
          {
            clientId: client.id,
            clientName: client.name,
            role: "viewer",
            isActive: true,
          },
        ],
      });

      const thread = await createTestMessageThread(tenantId, userId, {
        clientId: client.id,
        type: "client",
      });
      tracker.messageThreads?.push(thread.id);

      // Add client portal user as participant
      const participant = await createTestMessageThreadParticipant(
        thread.id,
        clientPortalAuthContext.portalUserId,
        {
          participantType: "client_portal",
        },
      );
      tracker.messageThreadParticipants?.push(participant.id);
      const portalCaller = createClientPortalCaller(clientPortalRouter, {
        clientPortalAuthContext,
      });

      const result = await portalCaller.sendMessage({
        threadId: thread.id,
        clientId: client.id,
        content: "Message without metadata",
        type: "text" as const,
      });
      tracker.messages?.push(result.id);

      await expect(Promise.resolve(result)).resolves.not.toThrow();
    });
  });

  describe("markThreadAsRead", () => {
    it("should validate required fields", async () => {
      const invalidInput = {
        // Missing threadId and clientId
      };

      await expect(
        portalCaller.markThreadAsRead(invalidInput as Record<string, unknown>),
      ).rejects.toThrow();
    });

    it("should accept valid thread and client IDs", async () => {
      const validInput = {
        threadId: "550e8400-e29b-41d4-a716-446655440000",
        clientId: "550e8400-e29b-41d4-a716-446655440000",
      };

      await expect(
        portalCaller.markThreadAsRead(validInput),
      ).resolves.not.toThrow();
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
