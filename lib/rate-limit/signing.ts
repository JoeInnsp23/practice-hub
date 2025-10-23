/**
 * Proposal Signing Rate Limiting
 *
 * Prevents abuse of public signing endpoints with per-IP + proposalId limits:
 * - getProposalForSignature: 20 requests/10s per IP+proposalId
 * - submitSignature: 5 requests/10s per IP+proposalId
 *
 * Uses in-memory store (can be upgraded to Redis if needed).
 */

import * as Sentry from "@sentry/nextjs";
import { TRPCError } from "@trpc/server";

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

// In-memory store: key = `${ip}:${proposalId}`
const signingRateLimitStore = new Map<string, RateLimitEntry>();

/**
 * Check signing rate limit for a specific IP + proposalId combination
 *
 * @param ip - Client IP address
 * @param proposalId - Proposal ID being accessed
 * @param config - Rate limit configuration (maxRequests, windowMs)
 * @throws TRPCError with code TOO_MANY_REQUESTS if limit exceeded
 */
export async function checkSigningRateLimit(
  ip: string,
  proposalId: string,
  config: RateLimitConfig,
): Promise<void> {
  const key = `${ip}:${proposalId}`;
  const now = Date.now();
  const entry = signingRateLimitStore.get(key);

  // Clean up expired entries periodically (1% chance to reduce overhead)
  if (Math.random() < 0.01) {
    for (const [k, v] of signingRateLimitStore.entries()) {
      if (v.resetAt < now) {
        signingRateLimitStore.delete(k);
      }
    }
  }

  // No entry or expired - allow and create new entry
  if (!entry || entry.resetAt < now) {
    signingRateLimitStore.set(key, {
      count: 1,
      resetAt: now + config.windowMs,
    });
    return;
  }

  // Check if limit exceeded
  if (entry.count >= config.maxRequests) {
    // Log to Sentry with signing_rate_limit tag
    Sentry.captureMessage("Signing rate limit exceeded", {
      level: "warning",
      tags: {
        signing_rate_limit: "exceeded",
        endpoint: "signing",
      },
      extra: {
        ip,
        proposalId,
        count: entry.count,
        maxRequests: config.maxRequests,
        windowMs: config.windowMs,
      },
    });

    // Throw TOO_MANY_REQUESTS error
    throw new TRPCError({
      code: "TOO_MANY_REQUESTS",
      message: "Too many requests. Please try again later.",
    });
  }

  // Increment counter
  entry.count++;
  signingRateLimitStore.set(key, entry);
}

/**
 * Extract client IP from Next.js Headers
 */
export function getClientIp(headers: Headers): string {
  // Check x-forwarded-for header first (for proxies/load balancers)
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }

  // Fallback to x-real-ip
  const realIp = headers.get("x-real-ip");
  if (realIp) {
    return realIp;
  }

  // Last resort fallback
  return "unknown";
}
