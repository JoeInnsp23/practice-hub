/**
 * Simple in-memory rate limiter
 *
 * Tracks requests by identifier (IP address, session ID, etc.)
 * and enforces limits per time window.
 */

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
 * Check if identifier is within rate limit
 *
 * @param identifier Unique identifier (e.g., IP address, session ID)
 * @param config Rate limit configuration
 * @returns Result indicating if request is allowed
 */
export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): RateLimitResult {
  const now = Date.now();
  const entry = rateLimitStore.get(identifier);

  // Clean up expired entries periodically
  if (Math.random() < 0.01) {
    // 1% chance to clean up
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
    // Within limit - increment and allow
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
 * Get client identifier from request
 *
 * Uses IP address as identifier with fallback to x-forwarded-for header
 */
export function getClientIdentifier(request: Request): string {
  // Try x-forwarded-for header first (for proxied requests)
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    // Take first IP if multiple are present
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
