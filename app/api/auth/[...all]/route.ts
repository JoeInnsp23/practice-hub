import { toNextJsHandler } from "better-auth/next-js";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { authRateLimit, getClientIdentifier } from "@/lib/rate-limit";

export const runtime = "nodejs";

// Create the auth handler
const authHandler = toNextJsHandler(auth);

/**
 * Handle rate limiting for auth endpoints
 */
async function handleRateLimit(request: Request) {
  // Skip rate limiting if Upstash not configured (development)
  if (!authRateLimit) {
    return null;
  }

  const clientId = getClientIdentifier(request);
  const { success, limit, reset, remaining } =
    await authRateLimit.limit(clientId);

  if (!success) {
    return NextResponse.json(
      {
        error: "Too many authentication attempts. Please try again later.",
        retryAfter: Math.ceil((reset - Date.now()) / 1000),
      },
      {
        status: 429,
        headers: {
          "X-RateLimit-Limit": limit.toString(),
          "X-RateLimit-Remaining": remaining.toString(),
          "X-RateLimit-Reset": new Date(reset).toISOString(),
          "Retry-After": Math.ceil((reset - Date.now()) / 1000).toString(),
        },
      },
    );
  }

  return null;
}

/**
 * POST handler with rate limiting for sign-in and sign-up
 */
export async function POST(request: Request) {
  // Only rate limit authentication endpoints (sign-in, sign-up)
  const url = new URL(request.url);
  const shouldRateLimit =
    url.pathname.includes("/sign-in") || url.pathname.includes("/sign-up");

  if (shouldRateLimit) {
    const rateLimitResponse = await handleRateLimit(request);
    if (rateLimitResponse) return rateLimitResponse;
  }

  return authHandler.POST(request);
}

/**
 * GET handler (no rate limiting needed for session checks)
 */
export async function GET(request: Request) {
  return authHandler.GET(request);
}
