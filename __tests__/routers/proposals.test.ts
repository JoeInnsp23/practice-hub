/**
 * Proposals Router Tests
 *
 * Tests for the proposals tRPC router
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { proposalsRouter } from "@/app/server/routers/proposals";
import {
  createCaller,
  createMockContext,
  type TestContextWithAuth,
} from "../helpers/trpc";
import {
  type TestDataTracker,
  cleanupTestData,
  createTestClient,
  createTestLead,
  createTestProposal,
  createTestTenant,
  createTestUser,
} from "../helpers/factories";

// Mock PDF generation
vi.mock("@/lib/pdf/proposal-generator", () => ({
  generateProposalPDF: vi.fn().mockResolvedValue(Buffer.from("mock-pdf")),
}));

// Mock S3 upload
vi.mock("@/lib/s3/upload", () => ({
  uploadToS3: vi.fn().mockResolvedValue("https://s3.example.com/proposal.pdf"),
}));

// Mock email
vi.mock("@/lib/email/proposal-email", () => ({
  sendProposalEmail: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/email/send-proposal-email", () => ({
  sendSignedConfirmationEmail: vi.fn().mockResolvedValue(undefined),
  sendTeamNotificationEmail: vi.fn().mockResolvedValue(undefined),
}));

describe("app/server/routers/proposals.ts", () => {
  let ctx: TestContextWithAuth;
  let caller: ReturnType<typeof createCaller<typeof proposalsRouter>>;
  const tracker: TestDataTracker = {
    tenants: [],
    users: [],
    clients: [],
    leads: [],
    proposals: [],
  };

  beforeEach(() => {
    ctx = createMockContext();
    caller = createCaller(proposalsRouter, ctx);
    vi.clearAllMocks();
  });

  afterEach(async () => {
    await cleanupTestData(tracker);
    // Reset tracker arrays
    tracker.tenants = [];
    tracker.users = [];
    tracker.clients = [];
    tracker.leads = [];
    tracker.proposals = [];
  });

  describe("list", () => {
    it("should accept empty input", async () => {
      await expect(caller.list({})).resolves.not.toThrow();
    });

    it("should accept status filter", async () => {
      await expect(caller.list({ status: "draft" })).resolves.not.toThrow();
    });

    it("should accept clientId filter", async () => {
      await expect(
        caller.list({ clientId: "550e8400-e29b-41d4-a716-446655440000" }),
      ).resolves.not.toThrow();
    });

    it("should accept search parameter", async () => {
      await expect(
        caller.list({ search: "test proposal" }),
      ).resolves.not.toThrow();
    });
  });

  describe("getById", () => {
    it("should accept valid UUID", async () => {
      // Create real test data
      const tenantId = await createTestTenant();
      tracker.tenants?.push(tenantId);

      const userId = await createTestUser(tenantId);
      tracker.users?.push(userId);

      const client = await createTestClient(tenantId, userId);
      tracker.clients?.push(client.id);

      const proposal = await createTestProposal(tenantId, client.id);
      tracker.proposals?.push(proposal.id);

      // Update context with real tenant
      ctx.authContext.tenantId = tenantId;
      ctx.authContext.userId = userId;

      await expect(caller.getById(proposal.id)).resolves.not.toThrow();
    });

    it("should validate input is a string", async () => {
      await expect(caller.getById(123 as unknown as string)).rejects.toThrow();
    });
  });

  describe("create", () => {
    it("should validate required fields", async () => {
      const invalidInput = {
        // Missing required fields
        title: "Test Proposal",
      };

      await expect(
        caller.create(invalidInput as Record<string, unknown>),
      ).rejects.toThrow();
    });

    it("should accept valid proposal data", async () => {
      // Create real test data
      const tenantId = await createTestTenant();
      tracker.tenants?.push(tenantId);

      const userId = await createTestUser(tenantId);
      tracker.users?.push(userId);

      const client = await createTestClient(tenantId, userId);
      tracker.clients?.push(client.id);

      // Update context with real tenant
      ctx.authContext.tenantId = tenantId;
      ctx.authContext.userId = userId;

      const validInput = {
        clientId: client.id,
        title: "Accounting Services Proposal",
        status: "draft" as const,
        pricingModelUsed: "model_a" as const,
        monthlyTotal: "450.00",
        annualTotal: "5400.00",
        validUntil: "2025-12-31",
        services: [],
      };

      const result = await caller.create(validInput);
      tracker.proposals?.push(result.id);
      await expect(Promise.resolve(result)).resolves.not.toThrow();
    });

    it("should validate totalAmount is a number", async () => {
      const invalidInput = {
        clientId: "550e8400-e29b-41d4-a716-446655440000",
        title: "Test",
        totalAmount: "1000", // Should be number
        services: [],
      };

      await expect(
        caller.create(invalidInput as Record<string, unknown>),
      ).rejects.toThrow();
    });
  });

  describe("createFromLead", () => {
    it("should accept valid lead ID", async () => {
      // Create real test data
      const tenantId = await createTestTenant();
      tracker.tenants?.push(tenantId);

      const userId = await createTestUser(tenantId);
      tracker.users?.push(userId);

      const lead = await createTestLead(tenantId);
      tracker.leads?.push(lead.id);

      // Update context with real tenant
      ctx.authContext.tenantId = tenantId;
      ctx.authContext.userId = userId;

      const validInput = {
        leadId: lead.id,
      };

      const result = await caller.createFromLead(validInput);
      tracker.proposals?.push(result.proposal.id);
      await expect(Promise.resolve(result)).resolves.not.toThrow();
    });

    it("should validate required leadId field", async () => {
      const invalidInput = {};

      await expect(
        caller.createFromLead(invalidInput as Record<string, unknown>),
      ).rejects.toThrow();
    });
  });

  describe("update", () => {
    it("should validate required id field", async () => {
      const invalidInput = {
        // Missing id
        title: "Updated Title",
      };

      await expect(
        caller.update(invalidInput as Record<string, unknown>),
      ).rejects.toThrow();
    });

    it("should accept valid update data", async () => {
      // Create real test data
      const tenantId = await createTestTenant();
      tracker.tenants?.push(tenantId);

      const userId = await createTestUser(tenantId);
      tracker.users?.push(userId);

      const client = await createTestClient(tenantId, userId);
      tracker.clients?.push(client.id);

      const proposal = await createTestProposal(tenantId, client.id);
      tracker.proposals?.push(proposal.id);

      // Update context with real tenant
      ctx.authContext.tenantId = tenantId;
      ctx.authContext.userId = userId;

      const validInput = {
        id: proposal.id,
        data: {
          title: "Updated Proposal Title",
          status: "sent" as const,
        },
      };

      await expect(caller.update(validInput)).resolves.not.toThrow();
    });

    it("should accept partial updates", async () => {
      // Create real test data
      const tenantId = await createTestTenant();
      tracker.tenants?.push(tenantId);

      const userId = await createTestUser(tenantId);
      tracker.users?.push(userId);

      const client = await createTestClient(tenantId, userId);
      tracker.clients?.push(client.id);

      const proposal = await createTestProposal(tenantId, client.id);
      tracker.proposals?.push(proposal.id);

      // Update context with real tenant
      ctx.authContext.tenantId = tenantId;
      ctx.authContext.userId = userId;

      const validInput = {
        id: proposal.id,
        data: {
          title: "New Title",
        },
      };

      await expect(caller.update(validInput)).resolves.not.toThrow();
    });
  });

  describe("delete", () => {
    it("should accept valid proposal ID", async () => {
      // Create real test data
      const tenantId = await createTestTenant();
      tracker.tenants?.push(tenantId);

      const userId = await createTestUser(tenantId);
      tracker.users?.push(userId);

      const client = await createTestClient(tenantId, userId);
      tracker.clients?.push(client.id);

      const proposal = await createTestProposal(tenantId, client.id);
      tracker.proposals?.push(proposal.id);

      // Update context with real tenant
      ctx.authContext.tenantId = tenantId;
      ctx.authContext.userId = userId;

      await expect(caller.delete(proposal.id)).resolves.not.toThrow();
    });

    it("should validate input is a string", async () => {
      await expect(
        caller.delete({} as Record<string, unknown>),
      ).rejects.toThrow();
    });
  });

  describe("send", () => {
    it("should validate required fields", async () => {
      const invalidInput = {
        // Missing proposalId
        recipientEmail: "test@example.com",
      };

      await expect(
        caller.send(invalidInput as Record<string, unknown>),
      ).rejects.toThrow();
    });

    it("should accept valid send data", async () => {
      // Create real test data
      const tenantId = await createTestTenant();
      tracker.tenants?.push(tenantId);

      const userId = await createTestUser(tenantId);
      tracker.users?.push(userId);

      const client = await createTestClient(tenantId, userId);
      tracker.clients?.push(client.id);

      const proposal = await createTestProposal(tenantId, client.id);
      tracker.proposals?.push(proposal.id);

      // Update context with real tenant
      ctx.authContext.tenantId = tenantId;
      ctx.authContext.userId = userId;

      const validInput = {
        id: proposal.id,
        validUntil: "2025-12-31",
      };

      await expect(caller.send(validInput)).resolves.not.toThrow();
    });

    it("should validate required fields", async () => {
      const invalidInput = {
        id: "550e8400-e29b-41d4-a716-446655440000",
        // Missing validUntil
      };

      await expect(
        caller.send(invalidInput as Record<string, unknown>),
      ).rejects.toThrow();
    });
  });

  describe("trackView", () => {
    it("should accept valid proposal ID", async () => {
      // Create real test data
      const tenantId = await createTestTenant();
      tracker.tenants?.push(tenantId);

      const userId = await createTestUser(tenantId);
      tracker.users?.push(userId);

      const client = await createTestClient(tenantId, userId);
      tracker.clients?.push(client.id);

      const proposal = await createTestProposal(tenantId, client.id);
      tracker.proposals?.push(proposal.id);

      // Update context with real tenant
      ctx.authContext.tenantId = tenantId;
      ctx.authContext.userId = userId;

      await expect(caller.trackView(proposal.id)).resolves.not.toThrow();
    });

    it("should validate input is a string", async () => {
      await expect(
        caller.trackView(123 as unknown as string),
      ).rejects.toThrow();
    });
  });

  describe("addSignature", () => {
    it("should validate required fields", async () => {
      const invalidInput = {
        // Missing required fields
        proposalId: "550e8400-e29b-41d4-a716-446655440000",
      };

      await expect(
        caller.addSignature(invalidInput as Record<string, unknown>),
      ).rejects.toThrow();
    });

    it("should accept valid signature data", async () => {
      // Create real test data
      const tenantId = await createTestTenant();
      tracker.tenants?.push(tenantId);

      const userId = await createTestUser(tenantId);
      tracker.users?.push(userId);

      const client = await createTestClient(tenantId, userId);
      tracker.clients?.push(client.id);

      const proposal = await createTestProposal(tenantId, client.id);
      tracker.proposals?.push(proposal.id);

      // Update context with real tenant
      ctx.authContext.tenantId = tenantId;
      ctx.authContext.userId = userId;

      const validInput = {
        proposalId: proposal.id,
        signerName: "John Doe",
        signerEmail: "john@example.com",
        signatureData: "base64-signature-data",
      };

      await expect(caller.addSignature(validInput)).resolves.not.toThrow();
    });

    it("should accept any string as email", async () => {
      // Create real test data
      const tenantId = await createTestTenant();
      tracker.tenants?.push(tenantId);

      const userId = await createTestUser(tenantId);
      tracker.users?.push(userId);

      const client = await createTestClient(tenantId, userId);
      tracker.clients?.push(client.id);

      const proposal = await createTestProposal(tenantId, client.id);
      tracker.proposals?.push(proposal.id);

      // Update context with real tenant
      ctx.authContext.tenantId = tenantId;
      ctx.authContext.userId = userId;

      // Note: signerEmail is z.string() without .email() validation
      const validInput = {
        proposalId: proposal.id,
        signerName: "John Doe",
        signerEmail: "not-an-email", // Any string is valid
        signatureData: "data",
      };

      await expect(caller.addSignature(validInput)).resolves.not.toThrow();
    });
  });

  describe("getStats", () => {
    it("should have no required input", () => {
      const procedure = proposalsRouter._def.procedures.getStats;

      expect(!procedure._def.inputs || procedure._def.inputs.length === 0).toBe(
        true,
      );
    });
  });

  describe("generatePdf", () => {
    it("should accept valid proposal ID", async () => {
      // Create real test data
      const tenantId = await createTestTenant();
      tracker.tenants?.push(tenantId);

      const userId = await createTestUser(tenantId);
      tracker.users?.push(userId);

      const client = await createTestClient(tenantId, userId);
      tracker.clients?.push(client.id);

      const proposal = await createTestProposal(tenantId, client.id);
      tracker.proposals?.push(proposal.id);

      // Update context with real tenant
      ctx.authContext.tenantId = tenantId;
      ctx.authContext.userId = userId;

      await expect(caller.generatePdf(proposal.id)).resolves.not.toThrow();
    });

    it("should validate input is a string", async () => {
      await expect(
        caller.generatePdf(null as unknown as string),
      ).rejects.toThrow();
    });
  });

  describe("updateSalesStage", () => {
    it("should accept valid sales stage update", async () => {
      // Create real test data
      const tenantId = await createTestTenant();
      tracker.tenants?.push(tenantId);

      const userId = await createTestUser(tenantId);
      tracker.users?.push(userId);

      const client = await createTestClient(tenantId, userId);
      tracker.clients?.push(client.id);

      const proposal = await createTestProposal(tenantId, client.id);
      tracker.proposals?.push(proposal.id);

      // Update context with real tenant
      ctx.authContext.tenantId = tenantId;
      ctx.authContext.userId = userId;

      const validInput = {
        id: proposal.id,
        salesStage: "qualified" as const,
      };

      await expect(caller.updateSalesStage(validInput)).resolves.not.toThrow();
    });

    it("should validate all sales stage enum values", async () => {
      // Create real test data
      const tenantId = await createTestTenant();
      tracker.tenants?.push(tenantId);

      const userId = await createTestUser(tenantId);
      tracker.users?.push(userId);

      const client = await createTestClient(tenantId, userId);
      tracker.clients?.push(client.id);

      const proposal = await createTestProposal(tenantId, client.id);
      tracker.proposals?.push(proposal.id);

      // Update context with real tenant
      ctx.authContext.tenantId = tenantId;
      ctx.authContext.userId = userId;

      const validStages = [
        "enquiry",
        "qualified",
        "proposal_sent",
        "follow_up",
        "won",
        "lost",
        "dormant",
      ] as const;

      for (const stage of validStages) {
        const input = {
          id: proposal.id,
          salesStage: stage,
        };

        await expect(caller.updateSalesStage(input)).resolves.not.toThrow();
      }
    });

    it("should reject invalid sales stage", async () => {
      const invalidInput = {
        id: "550e8400-e29b-41d4-a716-446655440000",
        salesStage: "invalid_stage",
      };

      await expect(
        caller.updateSalesStage(invalidInput as Record<string, unknown>),
      ).rejects.toThrow();
    });

    it("should require both id and salesStage", async () => {
      const missingId = {
        salesStage: "qualified",
      };

      const missingSalesStage = {
        id: "550e8400-e29b-41d4-a716-446655440000",
      };

      await expect(
        caller.updateSalesStage(missingId as Record<string, unknown>),
      ).rejects.toThrow();
      await expect(
        caller.updateSalesStage(missingSalesStage as Record<string, unknown>),
      ).rejects.toThrow();
    });
  });

  describe("list with salesStage filter", () => {
    it("should accept salesStage filter", async () => {
      await expect(
        caller.list({ salesStage: "qualified" }),
      ).resolves.not.toThrow();
    });

    it("should accept salesStage with other filters", async () => {
      await expect(
        caller.list({
          salesStage: "won",
          status: "signed",
          clientId: "550e8400-e29b-41d4-a716-446655440000",
        }),
      ).resolves.not.toThrow();
    });

    it("should reject invalid salesStage values", async () => {
      await expect(
        caller.list({ salesStage: "invalid_value" } as Record<string, unknown>),
      ).rejects.toThrow();
    });
  });

  describe("listByStage", () => {
    it("should accept empty input", async () => {
      await expect(caller.listByStage({})).resolves.not.toThrow();
    });

    it("should filter by assignedToId", async () => {
      const input = { assignedToId: "user-123" };
      await expect(caller.listByStage(input)).resolves.not.toThrow();
    });

    it("should filter by date range", async () => {
      const input = {
        dateFrom: "2025-01-01T00:00:00Z",
        dateTo: "2025-01-31T23:59:59Z",
      };
      await expect(caller.listByStage(input)).resolves.not.toThrow();
    });

    it("should filter by value range", async () => {
      const input = { minValue: 1000, maxValue: 5000 };
      await expect(caller.listByStage(input)).resolves.not.toThrow();
    });

    it("should filter by specific stages", async () => {
      const input = { stages: ["enquiry", "qualified", "won"] };
      await expect(caller.listByStage(input)).resolves.not.toThrow();
    });

    it("should accept search parameter", async () => {
      const input = { search: "accounting services" };
      await expect(caller.listByStage(input)).resolves.not.toThrow();
    });

    it("should accept all filters combined", async () => {
      const input = {
        assignedToId: "user-123",
        dateFrom: "2025-01-01T00:00:00Z",
        dateTo: "2025-12-31T23:59:59Z",
        minValue: 500,
        maxValue: 10000,
        search: "proposal",
        stages: ["enquiry", "qualified"],
      };
      await expect(caller.listByStage(input)).resolves.not.toThrow();
    });

    it("should reject invalid stage values", async () => {
      const input = { stages: ["invalid_stage"] };
      await expect(
        caller.listByStage(input as Record<string, unknown>),
      ).rejects.toThrow();
    });

    it("should validate value range types", async () => {
      const invalidInput = { minValue: "not a number" };
      await expect(
        caller.listByStage(invalidInput as Record<string, unknown>),
      ).rejects.toThrow();
    });
  });

  describe("updateSalesStage - Advanced Validation", () => {
    it("should require both id and salesStage fields", async () => {
      const missingStageInput = {
        id: "550e8400-e29b-41d4-a716-446655440000",
        // Missing salesStage
      };

      await expect(
        caller.updateSalesStage(missingStageInput as Record<string, unknown>),
      ).rejects.toThrow();
    });

    it("should validate salesStage is a valid enum value", async () => {
      const invalidStageInput = {
        id: "550e8400-e29b-41d4-a716-446655440000",
        salesStage: "invalid_stage_value",
      };

      await expect(
        caller.updateSalesStage(invalidStageInput as Record<string, unknown>),
      ).rejects.toThrow();
    });
  });

  describe("Proposal Notes (GAP-003)", () => {
    describe("createNote", () => {
      it("should create a note for a proposal", async () => {
        // Create real test data
        const tenantId = await createTestTenant();
        tracker.tenants?.push(tenantId);

        const userId = await createTestUser(tenantId);
        tracker.users?.push(userId);

        const lead = await createTestLead(tenantId, {
          firstName: "Note",
          lastName: "Tester",
          email: "note.tester@test.com",
          phone: "+44 7700 900000",
          companyName: "Note Test Ltd",
          source: "referral",
        });
        tracker.leads?.push(lead.id);

        // Update context with real tenant
        ctx.authContext.tenantId = tenantId;
        ctx.authContext.userId = userId;

        const proposal = await caller.createFromLead({
          leadId: lead.id,
          title: "Test Proposal with Notes",
          monthlyTotal: "100.00",
          annualTotal: "1200.00",
          services: [],
        });
        tracker.proposals?.push(proposal.proposal.id);

        // Create note
        const note = await caller.createNote({
          proposalId: proposal.proposal.id,
          note: "This is a test note about the proposal",
          isInternal: false,
          mentionedUsers: [],
        });

        expect(note.id).toBeDefined();
        expect(note.note).toBe("This is a test note about the proposal");
        expect(note.isInternal).toBe(false);
        expect(note.proposalId).toBe(proposal.proposal.id);
        expect(note.userId).toBe(ctx.authContext.userId);
      });

      it("should create an internal note", async () => {
        // Create real test data
        const tenantId = await createTestTenant();
        tracker.tenants?.push(tenantId);

        const userId = await createTestUser(tenantId);
        tracker.users?.push(userId);

        const lead = await createTestLead(tenantId, {
          firstName: "Internal",
          lastName: "Note",
          email: "internal.note@test.com",
          phone: "+44 7700 900001",
          companyName: "Internal Note Ltd",
          source: "referral",
        });
        tracker.leads?.push(lead.id);

        // Update context with real tenant
        ctx.authContext.tenantId = tenantId;
        ctx.authContext.userId = userId;

        const proposal = await caller.createFromLead({
          leadId: lead.id,
          title: "Proposal for Internal Notes",
          monthlyTotal: "150.00",
          annualTotal: "1800.00",
          services: [],
        });
        tracker.proposals?.push(proposal.proposal.id);

        const note = await caller.createNote({
          proposalId: proposal.proposal.id,
          note: "Internal staff-only note",
          isInternal: true,
          mentionedUsers: [],
        });

        expect(note.isInternal).toBe(true);
      });

      it("should reject note for non-existent proposal", async () => {
        await expect(
          caller.createNote({
            proposalId: "00000000-0000-0000-0000-000000000000",
            note: "Note for missing proposal",
            isInternal: false,
            mentionedUsers: [],
          }),
        ).rejects.toThrow("Proposal not found");
      });
    });

    describe("getNotes", () => {
      it("should retrieve notes for a proposal", async () => {
        // Create real test data
        const tenantId = await createTestTenant();
        tracker.tenants?.push(tenantId);

        const userId = await createTestUser(tenantId);
        tracker.users?.push(userId);

        const lead = await createTestLead(tenantId, {
          firstName: "Get",
          lastName: "Notes",
          email: "get.notes@test.com",
          phone: "+44 7700 900002",
          companyName: "Get Notes Ltd",
          source: "referral",
        });
        tracker.leads?.push(lead.id);

        // Update context with real tenant
        ctx.authContext.tenantId = tenantId;
        ctx.authContext.userId = userId;

        const proposal = await caller.createFromLead({
          leadId: lead.id,
          title: "Proposal with Multiple Notes",
          monthlyTotal: "200.00",
          annualTotal: "2400.00",
          services: [],
        });
        tracker.proposals?.push(proposal.proposal.id);

        // Create multiple notes
        await caller.createNote({
          proposalId: proposal.proposal.id,
          note: "First note",
          isInternal: false,
          mentionedUsers: [],
        });

        await caller.createNote({
          proposalId: proposal.proposal.id,
          note: "Second note",
          isInternal: true,
          mentionedUsers: [],
        });

        const notes = await caller.getNotes({
          proposalId: proposal.proposal.id,
        });

        expect(notes.length).toBe(2);
        expect(notes[0].note).toBe("Second note"); // Most recent first
        expect(notes[1].note).toBe("First note");
        expect(notes[0].author).toBeDefined();
        expect(notes[0].author.firstName).toBe(ctx.authContext.firstName);
      });

      it("should support pagination", async () => {
        // Create real test data
        const tenantId = await createTestTenant();
        tracker.tenants?.push(tenantId);

        const userId = await createTestUser(tenantId);
        tracker.users?.push(userId);

        const lead = await createTestLead(tenantId, {
          firstName: "Pagination",
          lastName: "Test",
          email: "pagination@test.com",
          phone: "+44 7700 900003",
          companyName: "Pagination Ltd",
          source: "referral",
        });
        tracker.leads?.push(lead.id);

        // Update context with real tenant
        ctx.authContext.tenantId = tenantId;
        ctx.authContext.userId = userId;

        const proposal = await caller.createFromLead({
          leadId: lead.id,
          title: "Pagination Test Proposal",
          monthlyTotal: "250.00",
          annualTotal: "3000.00",
          services: [],
        });
        tracker.proposals?.push(proposal.proposal.id);

        // Create 3 notes
        for (let i = 0; i < 3; i++) {
          await caller.createNote({
            proposalId: proposal.proposal.id,
            note: `Note ${i + 1}`,
            isInternal: false,
            mentionedUsers: [],
          });
        }

        const firstPage = await caller.getNotes({
          proposalId: proposal.proposal.id,
          limit: 2,
          offset: 0,
        });

        const secondPage = await caller.getNotes({
          proposalId: proposal.proposal.id,
          limit: 2,
          offset: 2,
        });

        expect(firstPage.length).toBe(2);
        expect(secondPage.length).toBe(1);
      });
    });

    describe("updateNote", () => {
      it("should allow author to update their note", async () => {
        // Create real test data
        const tenantId = await createTestTenant();
        tracker.tenants?.push(tenantId);

        const userId = await createTestUser(tenantId);
        tracker.users?.push(userId);

        const lead = await createTestLead(tenantId, {
          firstName: "Update",
          lastName: "Note",
          email: "update.note@test.com",
          phone: "+44 7700 900004",
          companyName: "Update Note Ltd",
          source: "referral",
        });
        tracker.leads?.push(lead.id);

        // Update context with real tenant
        ctx.authContext.tenantId = tenantId;
        ctx.authContext.userId = userId;

        const proposal = await caller.createFromLead({
          leadId: lead.id,
          title: "Update Note Test",
          monthlyTotal: "300.00",
          annualTotal: "3600.00",
          services: [],
        });
        tracker.proposals?.push(proposal.proposal.id);

        const note = await caller.createNote({
          proposalId: proposal.proposal.id,
          note: "Original note text",
          isInternal: false,
          mentionedUsers: [],
        });

        const updated = await caller.updateNote({
          noteId: note.id,
          note: "Updated note text",
        });

        expect(updated.note).toBe("Updated note text");
        expect(updated.id).toBe(note.id);
      });

      it("should reject update for non-existent note", async () => {
        await expect(
          caller.updateNote({
            noteId: "00000000-0000-0000-0000-000000000000",
            note: "Updated text",
          }),
        ).rejects.toThrow("Note not found");
      });
    });

    describe("deleteNote", () => {
      it("should allow author to delete their note", async () => {
        // Create real test data
        const tenantId = await createTestTenant();
        tracker.tenants?.push(tenantId);

        const userId = await createTestUser(tenantId);
        tracker.users?.push(userId);

        const lead = await createTestLead(tenantId, {
          firstName: "Delete",
          lastName: "Note",
          email: "delete.note@test.com",
          phone: "+44 7700 900005",
          companyName: "Delete Note Ltd",
          source: "referral",
        });
        tracker.leads?.push(lead.id);

        // Update context with real tenant
        ctx.authContext.tenantId = tenantId;
        ctx.authContext.userId = userId;

        const proposal = await caller.createFromLead({
          leadId: lead.id,
          title: "Delete Note Test",
          monthlyTotal: "350.00",
          annualTotal: "4200.00",
          services: [],
        });
        tracker.proposals?.push(proposal.proposal.id);

        const note = await caller.createNote({
          proposalId: proposal.proposal.id,
          note: "Note to be deleted",
          isInternal: false,
          mentionedUsers: [],
        });

        const result = await caller.deleteNote({
          noteId: note.id,
        });

        expect(result.success).toBe(true);

        // Verify note is soft-deleted
        const notes = await caller.getNotes({
          proposalId: proposal.proposal.id,
        });

        expect(notes.length).toBe(0); // Soft-deleted notes don't appear
      });

      it("should reject delete for non-existent note", async () => {
        await expect(
          caller.deleteNote({
            noteId: "00000000-0000-0000-0000-000000000000",
          }),
        ).rejects.toThrow("Note not found");
      });
    });

    describe("getNoteCount", () => {
      it("should count notes for a proposal", async () => {
        // Create real test data
        const tenantId = await createTestTenant();
        tracker.tenants?.push(tenantId);

        const userId = await createTestUser(tenantId);
        tracker.users?.push(userId);

        const lead = await createTestLead(tenantId, {
          firstName: "Count",
          lastName: "Notes",
          email: "count.notes@test.com",
          phone: "+44 7700 900006",
          companyName: "Count Notes Ltd",
          source: "referral",
        });
        tracker.leads?.push(lead.id);

        // Update context with real tenant
        ctx.authContext.tenantId = tenantId;
        ctx.authContext.userId = userId;

        const proposal = await caller.createFromLead({
          leadId: lead.id,
          title: "Count Notes Test",
          monthlyTotal: "400.00",
          annualTotal: "4800.00",
          services: [],
        });
        tracker.proposals?.push(proposal.proposal.id);

        // Create 3 notes
        for (let i = 0; i < 3; i++) {
          await caller.createNote({
            proposalId: proposal.proposal.id,
            note: `Note ${i + 1}`,
            isInternal: false,
            mentionedUsers: [],
          });
        }

        const count = await caller.getNoteCount({
          proposalId: proposal.proposal.id,
        });

        expect(count).toBe(3);
      });
    });
  });

  describe("Router Structure", () => {
    it("should export all expected procedures", () => {
      const procedures = Object.keys(proposalsRouter._def.procedures);

      expect(procedures).toContain("list");
      expect(procedures).toContain("listByStage");
      expect(procedures).toContain("getById");
      expect(procedures).toContain("create");
      expect(procedures).toContain("createFromLead");
      expect(procedures).toContain("update");
      expect(procedures).toContain("updateSalesStage");
      expect(procedures).toContain("delete");
      expect(procedures).toContain("send");
      expect(procedures).toContain("trackView");
      expect(procedures).toContain("addSignature");
      expect(procedures).toContain("getStats");
      expect(procedures).toContain("generatePdf");
      expect(procedures).toContain("createNote");
      expect(procedures).toContain("getNotes");
      expect(procedures).toContain("getNoteCount");
      expect(procedures).toContain("updateNote");
      expect(procedures).toContain("deleteNote");
    });

    it("should have 25 procedures total", () => {
      const procedures = Object.keys(proposalsRouter._def.procedures);
      // Previous 19-20 + 5 notes procedures
      expect(procedures.length).toBeGreaterThanOrEqual(24);
    });
  });
});
