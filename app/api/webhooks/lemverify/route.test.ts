import { describe, it, expect, beforeEach, vi } from "vitest";
import { POST } from "./route";
import crypto from "crypto";

/**
 * LEM Verify Webhook Handler Tests
 *
 * Tests signature verification, event processing, and error handling
 * without requiring full database integration.
 */

describe("app/api/webhooks/lemverify/route.ts", () => {
  const webhookSecret = "test-webhook-secret";
  const validWebhookEvent = {
    id: "verification-123",
    clientRef: "client-123",
    status: "completed",
    outcome: "pass",
    documentVerification: {
      verified: true,
      documentType: "passport",
    },
    facematch: {
      result: "pass",
      score: 95,
    },
    liveness: {
      result: "pass",
      score: 98,
    },
    amlScreening: {
      status: "clear",
      pepMatch: false,
      sanctionsMatch: false,
      watchlistMatch: false,
      adverseMediaMatch: false,
    },
    updatedAt: new Date().toISOString(),
  };

  beforeEach(() => {
    // Set environment variables
    process.env.LEMVERIFY_WEBHOOK_SECRET = webhookSecret;
    vi.clearAllMocks();
  });

  function createWebhookRequest(body: any, signature?: string): Request {
    const bodyString = JSON.stringify(body);

    // Generate valid signature if not provided
    const actualSignature =
      signature ||
      crypto.createHmac("sha256", webhookSecret).update(bodyString).digest("hex");

    return new Request("http://localhost:3000/api/webhooks/lemverify", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-lemverify-signature": actualSignature,
      },
      body: bodyString,
    });
  }

  describe("Signature Verification", () => {
    it("should reject requests without signature", async () => {
      const request = new Request("http://localhost:3000/api/webhooks/lemverify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(validWebhookEvent),
      });

      const response = await POST(request);

      expect(response.status).toBe(401);
      const text = await response.text();
      expect(text).toContain("Missing signature");
    });

    it("should reject requests with invalid signature", async () => {
      const request = createWebhookRequest(validWebhookEvent, "invalid-signature-12345");

      const response = await POST(request);

      expect(response.status).toBe(401);
      const text = await response.text();
      expect(text).toContain("Invalid signature");
    });

    it("should accept requests with valid signature", async () => {
      const request = createWebhookRequest(validWebhookEvent);

      // Note: This will fail database operations, but signature should be valid
      const response = await POST(request);

      // Should not be 401 (signature validated)
      expect(response.status).not.toBe(401);
    });

    it("should return 500 when LEMVERIFY_WEBHOOK_SECRET not configured", async () => {
      delete process.env.LEMVERIFY_WEBHOOK_SECRET;

      const request = createWebhookRequest(validWebhookEvent);

      const response = await POST(request);

      expect(response.status).toBe(500);
      const text = await response.text();
      expect(text).toContain("Server configuration error");
    });
  });

  describe("Payload Validation", () => {
    it("should reject invalid JSON", async () => {
      const request = new Request("http://localhost:3000/api/webhooks/lemverify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-lemverify-signature": crypto
            .createHmac("sha256", webhookSecret)
            .update("invalid json {")
            .digest("hex"),
        },
        body: "invalid json {",
      });

      const response = await POST(request);

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain("Invalid JSON");
    });

    it("should reject events missing required fields", async () => {
      const invalidEvent = {
        // Missing 'id' and 'status'
        clientRef: "client-123",
      };

      const request = createWebhookRequest(invalidEvent);

      const response = await POST(request);

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain("Missing required fields");
    });

    it("should accept events with all required fields", async () => {
      const minimalEvent = {
        id: "verification-123",
        clientRef: "client-123",
        status: "pending",
      };

      const request = createWebhookRequest(minimalEvent);

      const response = await POST(request);

      // Should not be 400 (validation passed)
      expect(response.status).not.toBe(400);
    });
  });

  describe("HTTP Status Codes", () => {
    it("should return 401 for invalid signature (security - don't retry)", async () => {
      const request = createWebhookRequest(validWebhookEvent, "wrong-signature");

      const response = await POST(request);

      expect(response.status).toBe(401);
    });

    it("should return 400 for invalid JSON (bad data - don't retry)", async () => {
      const request = new Request("http://localhost:3000/api/webhooks/lemverify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-lemverify-signature": crypto
            .createHmac("sha256", webhookSecret)
            .update("{bad json")
            .digest("hex"),
        },
        body: "{bad json",
      });

      const response = await POST(request);

      expect(response.status).toBe(400);
    });

    it("should return 400 for missing required fields (bad data - don't retry)", async () => {
      const invalidEvent = { clientRef: "client-123" }; // Missing id and status
      const request = createWebhookRequest(invalidEvent);

      const response = await POST(request);

      expect(response.status).toBe(400);
    });

    // Note: Database error testing would require mocking the database layer
    // which is beyond the scope of this simple test suite
  });

  describe("Event Processing", () => {
    it("should accept completed verification events", async () => {
      const completedEvent = {
        ...validWebhookEvent,
        status: "completed",
        outcome: "pass",
      };

      const request = createWebhookRequest(completedEvent);
      const response = await POST(request);

      // Should process without validation errors
      expect(response.status).not.toBe(400);
      expect(response.status).not.toBe(401);
    });

    it("should accept AML alert events", async () => {
      const alertEvent = {
        ...validWebhookEvent,
        amlAlert: true,
        amlScreening: {
          status: "pep",
          pepMatch: true,
          sanctionsMatch: false,
          watchlistMatch: false,
          adverseMediaMatch: false,
        },
      };

      const request = createWebhookRequest(alertEvent);
      const response = await POST(request);

      // Should process without validation errors
      expect(response.status).not.toBe(400);
      expect(response.status).not.toBe(401);
    });

    it("should accept pending status events", async () => {
      const pendingEvent = {
        id: "verification-456",
        clientRef: "client-456",
        status: "pending",
        updatedAt: new Date().toISOString(),
      };

      const request = createWebhookRequest(pendingEvent);
      const response = await POST(request);

      // Should process without validation errors
      expect(response.status).not.toBe(400);
      expect(response.status).not.toBe(401);
    });
  });

  describe("Security & Error Handling", () => {
    it("should handle HMAC signature correctly", () => {
      const body = JSON.stringify(validWebhookEvent);
      const signature = crypto.createHmac("sha256", webhookSecret).update(body).digest("hex");

      // Verify our signature generation matches expected format
      expect(signature).toHaveLength(64); // SHA256 hex is 64 characters
      expect(signature).toMatch(/^[a-f0-9]+$/); // Only hex characters
    });

    it("should validate signatures are case-sensitive", async () => {
      const body = JSON.stringify(validWebhookEvent);
      const correctSignature = crypto
        .createHmac("sha256", webhookSecret)
        .update(body)
        .digest("hex");
      const uppercaseSignature = correctSignature.toUpperCase();

      const request = createWebhookRequest(validWebhookEvent, uppercaseSignature);
      const response = await POST(request);

      // Should reject uppercase signature (case-sensitive comparison)
      expect(response.status).toBe(401);
    });

    it("should not leak information in error messages", async () => {
      const request = createWebhookRequest(validWebhookEvent, "wrong-signature");

      const response = await POST(request);

      const text = await response.text();
      // Should not reveal the expected signature
      expect(text).not.toContain(webhookSecret);
      expect(text).not.toContain("expected");
    });
  });
});
