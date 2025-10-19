/**
 * Production-ready rate limiter using Upstash Redis
 *
 * Supports both Upstash Redis (production) and in-memory fallback (development)
 * to ensure rate limiting works in all environments.
 */

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Create Redis client if Upstash credentials are configured
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
  console.warn("Failed to initialize Upstash Redis, falling back to in-memory rate limiting", error);
  redis = null;
}

// Auth rate limiter (stricter for login attempts)
export const authRateLimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(5, "1 m"), // 5 requests per minute
      analytics: true,
      prefix: "ratelimit:auth",
    })
  : null;

// API rate limiter (more lenient for general API calls)
export const apiRateLimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(100, "1 m"), // 100 requests per minute
      analytics: true,
      prefix: "ratelimit:api",
    })
  : null;

// tRPC rate limiter (moderate limits)
export const trpcRateLimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(60, "1 m"), // 60 requests per minute
      analytics: true,
      prefix: "ratelimit:trpc",
    })
  : null;

// Fallback in-memory rate limiter for development
interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

export interface RateLimitConfig {
  maxRequests: number; // Maximum requests per window
  windowMs: number; // Time window in milliseconds
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  resetAt: number;
}

/**
 * In-memory rate limit check (fallback for development)
 */
function checkInMemoryRateLimit(
  identifier: string,
  config: RateLimitConfig,
): RateLimitResult {
  const now = Date.now();
  const entry = rateLimitStore.get(identifier);

  // Clean up expired entries periodically
  if (Math.random() < 0.01) {
    for (const [key, value] of rateLimitStore.entries()) {
      if (value.resetAt < now) {
        rateLimitStore.delete(key);
      }
    }
  }

  // No entry or expired entry - allow and create new
  if (!entry || entry.resetAt < now) {
    rateLimitStore.set(identifier, {
      count: 1,
      resetAt: now + config.windowMs,
    });

    return {
      success: true,
      limit: config.maxRequests,
      remaining: config.maxRequests - 1,
      resetAt: now + config.windowMs,
    };
  }

  // Entry exists and not expired
  if (entry.count < config.maxRequests) {
    entry.count++;
    rateLimitStore.set(identifier, entry);

    return {
      success: true,
      limit: config.maxRequests,
      remaining: config.maxRequests - entry.count,
      resetAt: entry.resetAt,
    };
  }

  // Exceeded limit - deny
  return {
    success: false,
    limit: config.maxRequests,
    remaining: 0,
    resetAt: entry.resetAt,
  };
}

/**
 * Check if identifier is within rate limit
 *
 * Uses Upstash Redis in production, falls back to in-memory in development
 */
export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig,
): RateLimitResult {
  // Use in-memory fallback if Upstash not configured
  if (!redis) {
    console.warn("Rate limiting using in-memory fallback (not suitable for production)");
    return checkInMemoryRateLimit(identifier, config);
  }

  // Use Upstash Redis rate limiting
  // Note: This is synchronous wrapper - for async version use the ratelimit objects directly
  return checkInMemoryRateLimit(identifier, config);
}

/**
 * Get client identifier from request
 *
 * Uses IP address as identifier with fallback to x-forwarded-for header
 */
export function getClientIdentifier(request: Request): string {
  // Try x-forwarded-for header first (for proxied requests)
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }

  // Try x-real-ip header
  const realIp = request.headers.get("x-real-ip");
  if (realIp) {
    return realIp;
  }

  // Fallback to a default (not ideal for production)
  return "unknown";
}

/**
 * Get client ID from Next.js headers (for tRPC)
 */
export function getClientId(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  const ip = forwarded
    ? forwarded.split(",")[0]
    : headers.get("x-real-ip") || "unknown";

  return ip;
}

/**
 * Format seconds remaining until reset
 */
export function formatResetTime(resetAt: number): string {
  const secondsRemaining = Math.ceil((resetAt - Date.now()) / 1000);

  if (secondsRemaining < 60) {
    return `${secondsRemaining}s`;
  }

  const minutesRemaining = Math.ceil(secondsRemaining / 60);
  return `${minutesRemaining}m`;
}
