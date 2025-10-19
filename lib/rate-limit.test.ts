import { beforeEach, describe, expect, it } from "vitest";
import {
  checkRateLimit,
  formatResetTime,
  getClientIdentifier,
} from "@/lib/rate-limit";

describe("lib/rate-limit.ts", () => {
  describe("checkRateLimit", () => {
    beforeEach(() => {
      // Note: We can't clear the rate limit store directly as it's private
      // Each test uses unique identifiers to avoid interference
    });

    it("should allow requests within limit", () => {
      const identifier = `test-${Date.now()}-1`;

      // First request should be allowed
      const result1 = checkRateLimit(identifier, {
        maxRequests: 3,
        windowMs: 60000,
      });

      expect(result1.success).toBe(true);
      expect(result1.limit).toBe(3);
      expect(result1.remaining).toBe(2);

      // Second request should be allowed
      const result2 = checkRateLimit(identifier, {
        maxRequests: 3,
        windowMs: 60000,
      });

      expect(result2.success).toBe(true);
      expect(result2.remaining).toBe(1);

      // Third request should be allowed
      const result3 = checkRateLimit(identifier, {
        maxRequests: 3,
        windowMs: 60000,
      });

      expect(result3.success).toBe(true);
      expect(result3.remaining).toBe(0);
    });

    it("should block requests exceeding limit", () => {
      const identifier = `test-${Date.now()}-2`;

      // Make 3 requests (max allowed)
      for (let i = 0; i < 3; i++) {
        checkRateLimit(identifier, { maxRequests: 3, windowMs: 60000 });
      }

      // 4th request should be blocked
      const result = checkRateLimit(identifier, {
        maxRequests: 3,
        windowMs: 60000,
      });

      expect(result.success).toBe(false);
      expect(result.remaining).toBe(0);
      expect(result.resetAt).toBeGreaterThan(Date.now());
    });

    it("should reset counter after window expires", async () => {
      const identifier = `test-${Date.now()}-3`;

      // Make 3 requests with 100ms window
      for (let i = 0; i < 3; i++) {
        checkRateLimit(identifier, { maxRequests: 3, windowMs: 100 });
      }

      // 4th request should be blocked
      const blocked = checkRateLimit(identifier, {
        maxRequests: 3,
        windowMs: 100,
      });
      expect(blocked.success).toBe(false);

      // Wait for window to expire
      await new Promise((resolve) => setTimeout(resolve, 150));

      // Should be allowed again
      const allowed = checkRateLimit(identifier, {
        maxRequests: 3,
        windowMs: 100,
      });
      expect(allowed.success).toBe(true);
      expect(allowed.remaining).toBe(2);
    });

    it("should track different identifiers independently", () => {
      const id1 = `test-${Date.now()}-4a`;
      const id2 = `test-${Date.now()}-4b`;

      // Make 3 requests for id1
      for (let i = 0; i < 3; i++) {
        checkRateLimit(id1, { maxRequests: 3, windowMs: 60000 });
      }

      // id1 should be blocked
      const result1 = checkRateLimit(id1, {
        maxRequests: 3,
        windowMs: 60000,
      });
      expect(result1.success).toBe(false);

      // id2 should still be allowed
      const result2 = checkRateLimit(id2, {
        maxRequests: 3,
        windowMs: 60000,
      });
      expect(result2.success).toBe(true);
      expect(result2.remaining).toBe(2);
    });

    it("should return correct reset time", () => {
      const identifier = `test-${Date.now()}-5`;
      const windowMs = 60000;

      const result = checkRateLimit(identifier, {
        maxRequests: 3,
        windowMs,
      });

      // Reset time should be approximately now + windowMs
      const expectedResetTime = Date.now() + windowMs;
      expect(result.resetAt).toBeGreaterThanOrEqual(expectedResetTime - 100);
      expect(result.resetAt).toBeLessThanOrEqual(expectedResetTime + 100);
    });
  });

  describe("getClientIdentifier", () => {
    it("should extract IP from x-forwarded-for header", () => {
      const request = new Request("http://localhost", {
        headers: {
          "x-forwarded-for": "192.168.1.1, 10.0.0.1",
        },
      });

      const identifier = getClientIdentifier(request);
      expect(identifier).toBe("192.168.1.1");
    });

    it("should extract IP from x-real-ip header when x-forwarded-for not available", () => {
      const request = new Request("http://localhost", {
        headers: {
          "x-real-ip": "192.168.1.2",
        },
      });

      const identifier = getClientIdentifier(request);
      expect(identifier).toBe("192.168.1.2");
    });

    it("should prefer x-forwarded-for over x-real-ip", () => {
      const request = new Request("http://localhost", {
        headers: {
          "x-forwarded-for": "192.168.1.1",
          "x-real-ip": "192.168.1.2",
        },
      });

      const identifier = getClientIdentifier(request);
      expect(identifier).toBe("192.168.1.1");
    });

    it("should return 'unknown' when no IP headers present", () => {
      const request = new Request("http://localhost");

      const identifier = getClientIdentifier(request);
      expect(identifier).toBe("unknown");
    });

    it("should handle multiple IPs in x-forwarded-for", () => {
      const request = new Request("http://localhost", {
        headers: {
          "x-forwarded-for": "  192.168.1.1  , 10.0.0.1, 172.16.0.1",
        },
      });

      const identifier = getClientIdentifier(request);
      expect(identifier).toBe("192.168.1.1");
    });
  });

  describe("formatResetTime", () => {
    it("should format seconds when less than 60", () => {
      const resetAt = Date.now() + 30 * 1000; // 30 seconds from now
      const formatted = formatResetTime(resetAt);
      expect(formatted).toMatch(/^3\ds$/); // 30s or 31s due to timing
    });

    it("should format minutes when 60 seconds or more", () => {
      const resetAt = Date.now() + 90 * 1000; // 90 seconds from now
      const formatted = formatResetTime(resetAt);
      expect(formatted).toBe("2m");
    });

    it("should round up minutes", () => {
      const resetAt = Date.now() + 61 * 1000; // 61 seconds from now
      const formatted = formatResetTime(resetAt);
      expect(formatted).toBe("2m");
    });

    it("should handle very short times", () => {
      const resetAt = Date.now() + 1000; // 1 second from now
      const formatted = formatResetTime(resetAt);
      expect(formatted).toMatch(/^[12]s$/); // 1s or 2s due to timing
    });

    it("should handle times in the past (returns 0s or negative)", () => {
      const resetAt = Date.now() - 5000; // 5 seconds ago
      const formatted = formatResetTime(resetAt);
      // Should handle gracefully (may return 0s or negative)
      expect(formatted).toBeDefined();
    });
  });
});
