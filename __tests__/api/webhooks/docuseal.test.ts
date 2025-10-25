/**
 * DocuSeal Webhook Handler Tests
 *
 * Comprehensive test suite for app/api/webhooks/docuseal/route.ts
 * Tests all event types, security, rate limiting, idempotency, and error handling
 */

import crypto from "node:crypto";
import * as Sentry from "@sentry/nextjs";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Import real handler
import { POST } from "@/app/api/webhooks/docuseal/route";

// ==================== MOCKS ====================

// Hoisted variables (accessible in vi.mock factories)
const {
  mockProposals,
  mockProposalSignatures,
  mockClientPortalUsers,
  currentTableRef,
  selectSpy,
  fromSpy,
  whereSpy,
  limitSpy,
  updateSpy,
  setSpy,
  insertSpy,
  valuesSpy,
  returningSpy,
} = vi.hoisted(() => {
  const mockProposals: any[] = [];
  const mockProposalSignatures: any[] = [];
  const mockClientPortalUsers: any[] = [];
  const currentTableRef = { value: null as string | null };

  return {
    mockProposals,
    mockProposalSignatures,
    mockClientPortalUsers,
    currentTableRef,
    selectSpy: vi.fn(),
    fromSpy: vi.fn(),
    whereSpy: vi.fn(),
    limitSpy: vi.fn(),
    updateSpy: vi.fn(),
    setSpy: vi.fn(),
    insertSpy: vi.fn(),
    valuesSpy: vi.fn(),
    returningSpy: vi.fn(),
  };
});

vi.mock("@/lib/db", () => {
  const createDbInterface = () => {
    const obj: any = {};
    obj.select = selectSpy.mockImplementation(() => obj);
    obj.from = fromSpy.mockImplementation((table: any) => {
      currentTableRef.value = table;
      return obj;
    });
    obj.where = whereSpy.mockImplementation(() => obj);
    obj.limit = limitSpy.mockImplementation(() => {
      const currentTable = currentTableRef.value;
      if (
        currentTable === "proposal_signatures_table" ||
        currentTable === "document_signatures_table"
      ) {
        return mockProposalSignatures;
      }
      if (currentTable === "proposals_table") {
        return mockProposals;
      }
      if (currentTable === "client_portal_users_table") {
        return mockClientPortalUsers;
      }
      return [];
    });
    obj.update = updateSpy.mockImplementation(() => obj);
    obj.set = setSpy.mockImplementation(() => obj);
    obj.insert = insertSpy.mockImplementation(() => obj);
    obj.values = valuesSpy.mockImplementation(() => obj);
    obj.returning = returningSpy.mockResolvedValue([]);
    return obj;
  };

  const mockDb = createDbInterface();
  mockDb.transaction = vi.fn(async (cb: any) => {
    const tx = createDbInterface();
    return await cb(tx);
  });

  return {
    db: mockDb,
  };
});

// Mock schema
vi.mock("@/lib/db/schema", () => ({
  proposals: "proposals_table",
  proposalSignatures: "proposal_signatures_table",
  activityLogs: "activity_logs_table",
  documents: "documents_table",
  documentSignatures: "document_signatures_table",
  clientPortalUsers: "client_portal_users_table",
}));

// Mock rate limiting
vi.mock("@/lib/rate-limit/webhook", () => ({
  checkTenantRateLimit: vi.fn().mockResolvedValue({
    success: true,
    limit: 10,
    remaining: 9,
    reset: Date.now() + 1000,
  }),
  checkSubmissionRateLimit: vi.fn().mockResolvedValue({
    success: true,
    limit: 1,
    remaining: 0,
    reset: Date.now() + 1000,
  }),
}));

// Mock DocuSeal client
vi.mock("@/lib/docuseal/client", () => ({
  docusealClient: {
    downloadSignedPdf: vi
      .fn()
      .mockResolvedValue(Buffer.from("mock-pdf-content")),
  },
}));

// Mock S3 upload
vi.mock("@/lib/s3/upload", () => ({
  uploadToS3: vi
    .fn()
    .mockResolvedValue("https://s3.example.com/proposals/signed/mock.pdf"),
}));

// Mock email handlers
vi.mock("@/lib/docuseal/email-handler", () => ({
  sendSignedConfirmation: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/email/send-proposal-email", () => ({
  sendProposalDeclinedTeamEmail: vi.fn().mockResolvedValue({ success: true }),
  sendProposalExpiredTeamEmail: vi.fn().mockResolvedValue({ success: true }),
}));

// Mock Sentry
vi.mock("@sentry/nextjs", () => ({
  captureException: vi.fn(),
  captureMessage: vi.fn(),
  addBreadcrumb: vi.fn(),
}));

// Mock auto-conversion
vi.mock("@/lib/client-portal/auto-convert-lead", () => ({
  autoConvertLeadToClient: vi.fn().mockResolvedValue(null),
}));

// Mock UK compliance
vi.mock("@/lib/docuseal/uk-compliance-fields", () => ({
  extractAuditTrail: vi.fn().mockReturnValue({
    signerName: "John Doe",
    signerEmail: "john@example.com",
    signedAt: "2025-01-15T10:30:00Z",
    viewedAt: "2025-01-15T10:25:00Z",
    ipAddress: "192.168.1.1",
    userAgent: "Mozilla/5.0",
    signingCapacity: "Director",
    companyName: "Test Company Ltd",
    companyNumber: "12345678",
    authorityConfirmed: true,
    consentConfirmed: true,
    sessionMetadata: {
      submissionId: "sub_123",
      templateId: "tmpl_456",
      status: "completed",
    },
  }),
}));

// ==================== HELPER FUNCTIONS ====================

/**
 * Generate HMAC-SHA256 signature for webhook payload
 */
function generateWebhookSignature(payload: string, secret: string): string {
  return crypto.createHmac("sha256", secret).update(payload).digest("hex");
}

/**
 * Create mock Request object with headers and body
 */
function createWebhookRequest(
  event: any,
  options: {
    signature?: string;
    timestamp?: number;
    secret?: string;
  } = {},
): Request {
  const secret = options.secret || process.env.DOCUSEAL_WEBHOOK_SECRET!;
  const body = JSON.stringify(event);
  const signature = options.signature || generateWebhookSignature(body, secret);
  const timestamp = options.timestamp || Math.floor(Date.now() / 1000);

  return new Request("http://localhost:3000/api/webhooks/docuseal", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-docuseal-signature": signature,
      "x-docuseal-timestamp": timestamp.toString(),
    },
    body,
  });
}

/**
 * Create 'submission.completed' event payload
 */
function createCompletedEvent(overrides: any = {}) {
  return {
    event: "submission.completed",
    data: {
      id: "sub_123abc",
      template_id: "tmpl_456def",
      status: "completed",
      completed_at: new Date().toISOString(),
      metadata: {
        tenant_id: "tenant_test",
        proposal_id: "prop_789ghi",
        proposal_number: "PROP-2025-001",
        ...overrides.metadata,
      },
      submitters: [
        {
          name: "John Doe",
          email: "john@example.com",
          completed_at: new Date().toISOString(),
          ...overrides.submitter,
        },
      ],
      ...overrides,
    },
  };
}

/**
 * Create 'submission.declined' event payload
 */
function createDeclinedEvent(overrides: any = {}) {
  return {
    event: "submission.declined",
    data: {
      id: "sub_declined_123",
      metadata: {
        tenant_id: "tenant_test",
        proposal_id: "prop_declined",
        signer_email: "john@example.com",
        ...overrides.metadata,
      },
      ...overrides,
    },
  };
}

/**
 * Create 'submission.expired' event payload
 */
function createExpiredEvent(overrides: any = {}) {
  return {
    event: "submission.expired",
    data: {
      id: "sub_expired_123",
      metadata: {
        tenant_id: "tenant_test",
        proposal_id: "prop_expired",
        ...overrides.metadata,
      },
      ...overrides,
    },
  };
}

/**
 * Setup mock proposal in database
 */
function setupMockProposal(proposal: any) {
  mockProposals.length = 0;
  mockProposals.push({
    id: "prop_789ghi",
    proposalNumber: "PROP-2025-001",
    status: "sent",
    tenantId: "tenant_test",
    leadId: null,
    ...proposal,
  });
}

// ==================== TESTS ====================

describe("DocuSeal Webhook Handler", () => {
  beforeEach(async () => {
    // Setup environment
    process.env.DOCUSEAL_WEBHOOK_SECRET = "test-webhook-secret-key";

    // Reset mocks
    vi.clearAllMocks();
    mockProposals.length = 0;
    mockProposalSignatures.length = 0;
    mockClientPortalUsers.length = 0;
    currentTableRef.value = null;

    // Reset rate limiters to default (allow requests)
    const { checkTenantRateLimit, checkSubmissionRateLimit } = await import(
      "@/lib/rate-limit/webhook"
    );
    vi.mocked(checkTenantRateLimit).mockResolvedValue({
      success: true,
      limit: 10,
      remaining: 9,
      reset: Date.now() + 1000,
    });
    vi.mocked(checkSubmissionRateLimit).mockResolvedValue({
      success: true,
      limit: 1,
      remaining: 0,
      reset: Date.now() + 1000,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("processes 'completed' event and updates proposal to 'signed'", async () => {
    // Setup
    setupMockProposal({ id: "prop_789ghi", status: "sent" });
    const event = createCompletedEvent();
    const request = createWebhookRequest(event);

    const { uploadToS3 } = await import("@/lib/s3/upload");
    const { sendSignedConfirmation } = await import(
      "@/lib/docuseal/email-handler"
    );

    // Execute
    const response = await POST(request);

    // Assert response
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toEqual({ ok: true });

    // Assert database updates
    expect(db.transaction).toHaveBeenCalled();
    expect(updateSpy).toHaveBeenCalled();
    expect(setSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "signed",
      }),
    );

    // Assert signature record created
    expect(insertSpy).toHaveBeenCalled();

    // Assert S3 upload called
    expect(uploadToS3).toHaveBeenCalledWith(
      expect.any(Buffer),
      expect.stringMatching(/proposals\/signed\/sub_123abc\.pdf/),
      "application/pdf",
    );

    // Assert email sent
    expect(sendSignedConfirmation).toHaveBeenCalledWith(
      expect.objectContaining({
        recipientEmail: "john@example.com",
        proposalNumber: "PROP-2025-001",
      }),
    );
  });

  it("returns cached response for duplicate 'completed' event (idempotency)", async () => {
    // Setup - signature already exists
    mockProposalSignatures.push({
      id: "sig_existing",
      docusealSubmissionId: "sub_123abc",
    });

    const event = createCompletedEvent();
    const request = createWebhookRequest(event);

    // Execute
    const response = await POST(request);

    // Assert response
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toEqual({ ok: true, cached: true });

    // Assert NO database mutations (transaction not called for cached)
    expect(updateSpy).not.toHaveBeenCalled();

    // Assert Sentry message captured
    expect(Sentry.captureMessage).toHaveBeenCalledWith(
      "DocuSeal webhook already processed (idempotent)",
      expect.objectContaining({
        tags: expect.objectContaining({
          source: "docuseal_webhook",
        }),
      }),
    );
  });

  it("processes 'declined' event and updates proposal to 'rejected'", async () => {
    // Setup
    setupMockProposal({
      id: "prop_declined",
      status: "sent",
      proposalNumber: "PROP-2025-002",
    });
    const event = createDeclinedEvent();
    const request = createWebhookRequest(event);

    const { sendProposalDeclinedTeamEmail } = await import(
      "@/lib/email/send-proposal-email"
    );

    // Execute
    const response = await POST(request);

    // Assert response
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toEqual({ ok: true });

    // Assert proposal status updated
    expect(db.transaction).toHaveBeenCalled();
    expect(setSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "rejected",
      }),
    );

    // Assert team email sent
    expect(sendProposalDeclinedTeamEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        proposalId: "prop_declined",
        signerEmail: "john@example.com",
      }),
    );

    // Assert Sentry message captured
    expect(Sentry.captureMessage).toHaveBeenCalledWith(
      "Proposal signature declined",
      expect.anything(),
    );
  });

  it("processes 'expired' event and updates proposal to 'expired'", async () => {
    // Setup
    setupMockProposal({
      id: "prop_expired",
      status: "sent",
      proposalNumber: "PROP-2025-003",
    });
    const event = createExpiredEvent();
    const request = createWebhookRequest(event);

    const { sendProposalExpiredTeamEmail } = await import(
      "@/lib/email/send-proposal-email"
    );

    // Execute
    const response = await POST(request);

    // Assert response
    expect(response.status).toBe(200);

    // Assert status update
    expect(db.transaction).toHaveBeenCalled();
    expect(setSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "expired",
      }),
    );

    // Assert team email sent
    expect(sendProposalExpiredTeamEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        proposalId: "prop_expired",
      }),
    );

    // Assert Sentry message captured
    expect(Sentry.captureMessage).toHaveBeenCalledWith(
      "Proposal signature expired",
      expect.anything(),
    );
  });

  it("rejects request with missing signature header", async () => {
    const event = createCompletedEvent();
    const request = new Request("http://localhost:3000/api/webhooks/docuseal", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        // Missing x-docuseal-signature
        "x-docuseal-timestamp": Math.floor(Date.now() / 1000).toString(),
      },
      body: JSON.stringify(event),
    });

    // Execute
    const response = await POST(request);

    // Assert
    expect(response.status).toBe(401);
    const body = await response.text();
    expect(body).toBe("Missing signature");

    // Assert Sentry error captured
    expect(Sentry.captureException).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "Missing DocuSeal webhook signature",
      }),
      expect.objectContaining({
        tags: expect.objectContaining({
          source: "docuseal_webhook",
        }),
        extra: expect.objectContaining({
          operation: "webhook_signature_missing",
        }),
      }),
    );
  });

  it("rejects request with invalid signature", async () => {
    const event = createCompletedEvent();
    const request = createWebhookRequest(event, {
      signature: "invalid_signature_12345",
    });

    // Execute
    const response = await POST(request);

    // Assert
    expect(response.status).toBe(401);
    const body = await response.text();
    expect(body).toBe("Invalid signature");

    // Assert Sentry error captured
    expect(Sentry.captureException).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "Invalid DocuSeal webhook signature",
      }),
      expect.objectContaining({
        tags: expect.objectContaining({
          operation: "webhook_signature_invalid",
        }),
      }),
    );
  });

  it("rate limits tenant after 10 requests per second (returns 429)", async () => {
    // Setup rate limiter to fail
    const { checkTenantRateLimit } = await import("@/lib/rate-limit/webhook");
    const resetTime = Date.now() + 1000;

    vi.mocked(checkTenantRateLimit).mockResolvedValue({
      success: false,
      limit: 10,
      remaining: 0,
      reset: resetTime,
    });

    const event = createCompletedEvent();
    const request = createWebhookRequest(event);

    // Execute
    const response = await POST(request);

    // Assert
    expect(response.status).toBe(429);
    const body = await response.json();
    expect(body).toEqual(
      expect.objectContaining({
        error: "Rate limit exceeded for tenant",
        retryAfter: expect.any(Number),
      }),
    );

    // Assert rate limit headers
    expect(response.headers.get("X-RateLimit-Limit")).toBe("10");
    expect(response.headers.get("X-RateLimit-Remaining")).toBe("0");
    expect(response.headers.get("Retry-After")).toBeTruthy();

    // Assert Sentry error captured
    expect(Sentry.captureException).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "DocuSeal webhook tenant rate limit exceeded",
      }),
      expect.objectContaining({
        tags: expect.objectContaining({
          limit_type: "tenant",
        }),
      }),
    );
  });

  it("prevents submission spam with 409 Conflict (2+ requests in 1 second)", async () => {
    // Setup submission rate limiter to fail
    const { checkSubmissionRateLimit } = await import(
      "@/lib/rate-limit/webhook"
    );
    const resetTime = Date.now() + 1000;

    vi.mocked(checkSubmissionRateLimit).mockResolvedValue({
      success: false,
      limit: 1,
      remaining: 0,
      reset: resetTime,
    });

    const event = createCompletedEvent();
    const request = createWebhookRequest(event);

    // Execute
    const response = await POST(request);

    // Assert
    expect(response.status).toBe(409);
    const body = await response.json();
    expect(body).toEqual(
      expect.objectContaining({
        error: "Duplicate submission spam detected",
        retryAfter: expect.any(Number),
      }),
    );

    // Assert Sentry error captured
    expect(Sentry.captureException).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "DocuSeal webhook submission spam detected",
      }),
      expect.objectContaining({
        tags: expect.objectContaining({
          limit_type: "submission",
        }),
      }),
    );
  });

  it("creates activity log only once per real event (not on cached)", async () => {
    // Setup
    setupMockProposal({ id: "prop_789ghi", status: "sent" });
    const event = createCompletedEvent();
    const request = createWebhookRequest(event);

    // Execute first request (real event)
    const response1 = await POST(request);
    expect(response1.status).toBe(200);

    // Verify activity log created
    const insertCallCount = insertSpy.mock.calls.length;
    expect(insertCallCount).toBeGreaterThan(0);

    // Setup for idempotent request
    mockProposalSignatures.push({
      id: "sig_existing",
      docusealSubmissionId: "sub_123abc",
    });
    vi.clearAllMocks();

    // Execute duplicate request (cached)
    const request2 = createWebhookRequest(event);
    const response2 = await POST(request2);
    expect(response2.status).toBe(200);
    const body2 = await response2.json();
    expect(body2.cached).toBe(true);

    // Verify NO new inserts (no activity log created)
    expect(insertSpy).not.toHaveBeenCalled();
  });

  it("captures Sentry errors for all error branches", async () => {
    const testCases = [
      {
        name: "missing signature",
        request: () => {
          const event = createCompletedEvent();
          return new Request("http://localhost:3000/api/webhooks/docuseal", {
            method: "POST",
            body: JSON.stringify(event),
            headers: {
              "x-docuseal-timestamp": Math.floor(Date.now() / 1000).toString(),
            },
          });
        },
        expectedStatus: 401,
        expectedSentryCall: "Missing DocuSeal webhook signature",
      },
      {
        name: "invalid signature",
        request: () => {
          const event = createCompletedEvent();
          return createWebhookRequest(event, { signature: "bad_sig" });
        },
        expectedStatus: 401,
        expectedSentryCall: "Invalid DocuSeal webhook signature",
      },
      {
        name: "missing timestamp",
        request: () => {
          const event = createCompletedEvent();
          const body = JSON.stringify(event);
          const sig = generateWebhookSignature(
            body,
            process.env.DOCUSEAL_WEBHOOK_SECRET!,
          );
          return new Request("http://localhost:3000/api/webhooks/docuseal", {
            method: "POST",
            body,
            headers: {
              "x-docuseal-signature": sig,
              // Missing timestamp
            },
          });
        },
        expectedStatus: 400,
        expectedSentryCall: "Missing DocuSeal webhook timestamp",
      },
    ];

    for (const testCase of testCases) {
      vi.clearAllMocks();

      const response = await POST(testCase.request());

      expect(response.status).toBe(testCase.expectedStatus);
      expect(Sentry.captureException).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining(testCase.expectedSentryCall),
        }),
        expect.anything(),
      );
    }
  });
});
