/**
 * DocuSeal Webhook Rate Limiting
 *
 * Two-tier sliding window rate limiting to prevent webhook spam:
 * - Tenant-level: 10 requests/second (prevent tenant-wide abuse)
 * - Submission-level: 1 request/second (prevent duplicate spam)
 *
 * Uses Upstash Redis in production, in-memory fallback in development.
 */

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Initialize Redis client if Upstash credentials are configured
let redis: Redis | null = null;
try {
  if (
    process.env.UPSTASH_REDIS_REST_URL &&
    process.env.UPSTASH_REDIS_REST_TOKEN
  ) {
    redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
  }
} catch (error) {
  console.warn(
    "Failed to initialize Upstash Redis for webhook rate limiting, falling back to in-memory",
    error,
  );
  redis = null;
}

/**
 * Tenant-level rate limiter: 10 requests/second
 *
 * Prevents a single tenant from overwhelming the webhook endpoint.
 * Breach returns 429 Too Many Requests.
 */
export const webhookTenantRateLimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(10, "1 s"),
      analytics: true,
      prefix: "ratelimit:webhook:tenant",
    })
  : null;

/**
 * Submission-level rate limiter: 1 request/second
 *
 * Prevents duplicate submission spam attacks.
 * Breach returns 409 Conflict (duplicate spam).
 */
export const webhookSubmissionRateLimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(1, "1 s"),
      analytics: true,
      prefix: "ratelimit:webhook:submission",
    })
  : null;

/**
 * In-memory rate limit store for development fallback
 */
interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const inMemoryStore = new Map<string, RateLimitEntry>();

/**
 * In-memory rate limit check (fallback for development)
 */
export function checkWebhookRateLimitInMemory(
  key: string,
  maxRequests: number,
  windowMs: number,
): { success: boolean; limit: number; reset: number; remaining: number } {
  const now = Date.now();
  const entry = inMemoryStore.get(key);

  // Clean up expired entries periodically (1% chance)
  if (Math.random() < 0.01) {
    for (const [k, v] of inMemoryStore.entries()) {
      if (v.resetAt < now) {
        inMemoryStore.delete(k);
      }
    }
  }

  // No entry or expired - allow and create new
  if (!entry || entry.resetAt < now) {
    inMemoryStore.set(key, {
      count: 1,
      resetAt: now + windowMs,
    });

    return {
      success: true,
      limit: maxRequests,
      remaining: maxRequests - 1,
      reset: now + windowMs,
    };
  }

  // Entry exists and not expired
  if (entry.count < maxRequests) {
    entry.count++;
    inMemoryStore.set(key, entry);

    return {
      success: true,
      limit: maxRequests,
      remaining: maxRequests - entry.count,
      reset: entry.resetAt,
    };
  }

  // Exceeded limit - deny
  return {
    success: false,
    limit: maxRequests,
    remaining: 0,
    reset: entry.resetAt,
  };
}

/**
 * Check tenant rate limit (10 req/sec)
 *
 * Returns rate limit result with success/failure and metadata
 */
export async function checkTenantRateLimit(
  tenantId: string,
): Promise<{ success: boolean; limit: number; reset: number; remaining: number }> {
  if (webhookTenantRateLimit) {
    return await webhookTenantRateLimit.limit(tenantId);
  }

  // Fallback to in-memory (development)
  console.warn(
    `[webhook-rate-limit] Using in-memory fallback for tenant ${tenantId}`,
  );
  return checkWebhookRateLimitInMemory(
    `tenant:${tenantId}`,
    10, // 10 requests
    1000, // per second
  );
}

/**
 * Check submission rate limit (1 req/sec)
 *
 * Returns rate limit result with success/failure and metadata
 */
export async function checkSubmissionRateLimit(
  submissionId: string,
): Promise<{ success: boolean; limit: number; reset: number; remaining: number }> {
  if (webhookSubmissionRateLimit) {
    return await webhookSubmissionRateLimit.limit(submissionId);
  }

  // Fallback to in-memory (development)
  console.warn(
    `[webhook-rate-limit] Using in-memory fallback for submission ${submissionId}`,
  );
  return checkWebhookRateLimitInMemory(
    `submission:${submissionId}`,
    1, // 1 request
    1000, // per second
  );
}
