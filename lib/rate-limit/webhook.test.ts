import { describe, expect, it } from "vitest";
import {
  checkSubmissionRateLimit,
  checkTenantRateLimit,
  checkWebhookRateLimitInMemory,
} from "@/lib/rate-limit/webhook";

describe("lib/rate-limit/webhook.ts", () => {
  describe("checkWebhookRateLimitInMemory", () => {
    it("should allow requests within tenant limit (10 req/sec)", () => {
      const key = `test-tenant-${Date.now()}`;

      // First 10 requests should succeed
      for (let i = 0; i < 10; i++) {
        const result = checkWebhookRateLimitInMemory(key, 10, 1000);
        expect(result.success).toBe(true);
        expect(result.limit).toBe(10);
        expect(result.remaining).toBe(10 - (i + 1));
      }
    });

    it("should block requests exceeding tenant limit", () => {
      const key = `test-tenant-exceed-${Date.now()}`;

      // Make 10 requests (max allowed)
      for (let i = 0; i < 10; i++) {
        checkWebhookRateLimitInMemory(key, 10, 1000);
      }

      // 11th request should be blocked
      const result = checkWebhookRateLimitInMemory(key, 10, 1000);
      expect(result.success).toBe(false);
      expect(result.remaining).toBe(0);
      expect(result.reset).toBeGreaterThan(Date.now());
    });

    it("should allow requests within submission limit (1 req/sec)", () => {
      const key = `test-submission-${Date.now()}`;

      // First request should succeed
      const result = checkWebhookRateLimitInMemory(key, 1, 1000);
      expect(result.success).toBe(true);
      expect(result.limit).toBe(1);
      expect(result.remaining).toBe(0);
    });

    it("should block duplicate submission spam", () => {
      const key = `test-submission-spam-${Date.now()}`;

      // First request succeeds
      const first = checkWebhookRateLimitInMemory(key, 1, 1000);
      expect(first.success).toBe(true);

      // Second request should be blocked (spam)
      const second = checkWebhookRateLimitInMemory(key, 1, 1000);
      expect(second.success).toBe(false);
      expect(second.remaining).toBe(0);
    });

    it("should reset counter after window expires", async () => {
      const key = `test-reset-${Date.now()}`;

      // Make request with 100ms window
      const first = checkWebhookRateLimitInMemory(key, 1, 100);
      expect(first.success).toBe(true);

      // Second request should be blocked
      const blocked = checkWebhookRateLimitInMemory(key, 1, 100);
      expect(blocked.success).toBe(false);

      // Wait for window to expire
      await new Promise((resolve) => setTimeout(resolve, 150));

      // Should be allowed again
      const allowed = checkWebhookRateLimitInMemory(key, 1, 100);
      expect(allowed.success).toBe(true);
      expect(allowed.remaining).toBe(0);
    });

    it("should track different keys independently", () => {
      const tenant1 = `test-tenant-${Date.now()}-a`;
      const tenant2 = `test-tenant-${Date.now()}-b`;

      // Exhaust tenant1 limit
      for (let i = 0; i < 10; i++) {
        checkWebhookRateLimitInMemory(tenant1, 10, 1000);
      }

      // tenant1 should be blocked
      const result1 = checkWebhookRateLimitInMemory(tenant1, 10, 1000);
      expect(result1.success).toBe(false);

      // tenant2 should still be allowed
      const result2 = checkWebhookRateLimitInMemory(tenant2, 10, 1000);
      expect(result2.success).toBe(true);
      expect(result2.remaining).toBe(9);
    });

    it("should return correct reset time", () => {
      const key = `test-reset-time-${Date.now()}`;
      const windowMs = 5000;

      const result = checkWebhookRateLimitInMemory(key, 10, windowMs);

      // Reset time should be approximately now + windowMs
      const expectedResetTime = Date.now() + windowMs;
      expect(result.reset).toBeGreaterThanOrEqual(expectedResetTime - 100);
      expect(result.reset).toBeLessThanOrEqual(expectedResetTime + 100);
    });
  });

  describe("checkTenantRateLimit (in-memory fallback)", () => {
    it("should enforce 10 req/sec limit", async () => {
      const tenantId = `tenant-${Date.now()}`;

      // First 10 requests should succeed
      for (let i = 0; i < 10; i++) {
        const result = await checkTenantRateLimit(tenantId);
        expect(result.success).toBe(true);
      }

      // 11th request should fail
      const result = await checkTenantRateLimit(tenantId);
      expect(result.success).toBe(false);
      expect(result.limit).toBe(10);
    });
  });

  describe("checkSubmissionRateLimit (in-memory fallback)", () => {
    it("should enforce 1 req/sec limit", async () => {
      const submissionId = `submission-${Date.now()}`;

      // First request should succeed
      const first = await checkSubmissionRateLimit(submissionId);
      expect(first.success).toBe(true);
      expect(first.remaining).toBe(0);

      // Second request should fail (spam)
      const second = await checkSubmissionRateLimit(submissionId);
      expect(second.success).toBe(false);
      expect(second.limit).toBe(1);
    });
  });

  describe("rate limit isolation", () => {
    it("should track tenant and submission limits independently", async () => {
      const tenantId = `tenant-${Date.now()}`;
      const submissionId = `submission-${Date.now()}`;

      // Use up tenant limit (10 requests)
      for (let i = 0; i < 10; i++) {
        await checkTenantRateLimit(tenantId);
      }

      // Tenant should be blocked
      const tenantResult = await checkTenantRateLimit(tenantId);
      expect(tenantResult.success).toBe(false);

      // Submission should still be allowed (different limiter)
      const submissionResult = await checkSubmissionRateLimit(submissionId);
      expect(submissionResult.success).toBe(true);
    });
  });
});
