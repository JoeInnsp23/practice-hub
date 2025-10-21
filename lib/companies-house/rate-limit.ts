import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { companiesHouseRateLimit } from "@/lib/db/schema";

/**
 * Companies House API Rate Limiting
 *
 * Implements database-backed rate limiting to comply with Companies House API limits:
 * - Maximum 600 requests per 5-minute window
 * - Single global counter tracked in database
 * - Automatic window reset after 5 minutes
 */

const RATE_LIMIT_MAX_REQUESTS = 600;
const RATE_LIMIT_WINDOW_MS = 5 * 60 * 1000; // 5 minutes in milliseconds
const GLOBAL_RATE_LIMIT_ID = "global";

/**
 * Check if a request can be made within the current rate limit
 *
 * @returns Promise<boolean> - true if within limit, false if exceeded
 */
export async function checkRateLimit(): Promise<boolean> {
  // Get or create the global rate limit record
  const [record] = await db
    .select()
    .from(companiesHouseRateLimit)
    .where(eq(companiesHouseRateLimit.id, GLOBAL_RATE_LIMIT_ID))
    .limit(1);

  // If no record exists, initialize it
  if (!record) {
    await db.insert(companiesHouseRateLimit).values({
      id: GLOBAL_RATE_LIMIT_ID,
      requestsCount: 0,
      windowStart: new Date(),
      updatedAt: new Date(),
    });
    return true;
  }

  const now = new Date();
  const windowStartTime = new Date(record.windowStart);
  const timeSinceWindowStart = now.getTime() - windowStartTime.getTime();

  // If window has expired (> 5 minutes), reset is needed
  if (timeSinceWindowStart >= RATE_LIMIT_WINDOW_MS) {
    await resetRateLimitWindow();
    return true;
  }

  // Check if we're within the limit
  return record.requestsCount < RATE_LIMIT_MAX_REQUESTS;
}

/**
 * Increment the rate limit counter after making an API request
 *
 * @returns Promise<void>
 */
export async function incrementRateLimit(): Promise<void> {
  // Get the current record
  const [record] = await db
    .select()
    .from(companiesHouseRateLimit)
    .where(eq(companiesHouseRateLimit.id, GLOBAL_RATE_LIMIT_ID))
    .limit(1);

  if (!record) {
    // Initialize if doesn't exist
    await db.insert(companiesHouseRateLimit).values({
      id: GLOBAL_RATE_LIMIT_ID,
      requestsCount: 1,
      windowStart: new Date(),
      updatedAt: new Date(),
    });
    return;
  }

  const now = new Date();
  const windowStartTime = new Date(record.windowStart);
  const timeSinceWindowStart = now.getTime() - windowStartTime.getTime();

  // If window has expired, reset before incrementing
  if (timeSinceWindowStart >= RATE_LIMIT_WINDOW_MS) {
    await db
      .update(companiesHouseRateLimit)
      .set({
        requestsCount: 1,
        windowStart: now,
        updatedAt: now,
      })
      .where(eq(companiesHouseRateLimit.id, GLOBAL_RATE_LIMIT_ID));
  } else {
    // Increment counter within current window
    await db
      .update(companiesHouseRateLimit)
      .set({
        requestsCount: record.requestsCount + 1,
        updatedAt: now,
      })
      .where(eq(companiesHouseRateLimit.id, GLOBAL_RATE_LIMIT_ID));
  }
}

/**
 * Reset the rate limit window and counter
 *
 * @returns Promise<void>
 */
export async function resetRateLimitWindow(): Promise<void> {
  const now = new Date();

  await db
    .update(companiesHouseRateLimit)
    .set({
      requestsCount: 0,
      windowStart: now,
      updatedAt: now,
    })
    .where(eq(companiesHouseRateLimit.id, GLOBAL_RATE_LIMIT_ID));
}

/**
 * Get current rate limit status for monitoring
 *
 * @returns Promise<{ requestsCount: number; windowStart: Date; remainingRequests: number; windowResetIn: number }>
 */
export async function getRateLimitStatus(): Promise<{
  requestsCount: number;
  windowStart: Date;
  remainingRequests: number;
  windowResetIn: number;
}> {
  const [record] = await db
    .select()
    .from(companiesHouseRateLimit)
    .where(eq(companiesHouseRateLimit.id, GLOBAL_RATE_LIMIT_ID))
    .limit(1);

  if (!record) {
    return {
      requestsCount: 0,
      windowStart: new Date(),
      remainingRequests: RATE_LIMIT_MAX_REQUESTS,
      windowResetIn: RATE_LIMIT_WINDOW_MS,
    };
  }

  const now = new Date();
  const windowStartTime = new Date(record.windowStart);
  const timeSinceWindowStart = now.getTime() - windowStartTime.getTime();
  const windowResetIn = Math.max(
    0,
    RATE_LIMIT_WINDOW_MS - timeSinceWindowStart,
  );

  return {
    requestsCount: record.requestsCount,
    windowStart: windowStartTime,
    remainingRequests: Math.max(
      0,
      RATE_LIMIT_MAX_REQUESTS - record.requestsCount,
    ),
    windowResetIn,
  };
}
