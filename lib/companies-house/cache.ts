import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { companiesHouseCache } from "@/lib/db/schema";
import type { CompanyDetails, Officer, PSC } from "./client";

/**
 * Companies House API cache layer
 *
 * Provides database-backed caching with 24-hour TTL to reduce API calls
 * and improve response times for frequently accessed company data.
 */

export interface CompanyData {
  company: CompanyDetails;
  officers: Officer[];
  pscs: PSC[];
}

/**
 * Get cached company data from database
 *
 * @param companyNumber - Companies House company number
 * @returns Company data if cache hit and not expired, null otherwise
 */
export async function getCachedCompany(
  companyNumber: string,
): Promise<CompanyData | null> {
  const startTime = Date.now();

  try {
    const cached = await db
      .select()
      .from(companiesHouseCache)
      .where(eq(companiesHouseCache.companyNumber, companyNumber))
      .limit(1);

    if (cached.length === 0) {
      if (process.env.NODE_ENV === "development") {
        console.log(
          `[Companies House Cache] MISS: ${companyNumber} (not found in cache)`,
        );
      }
      return null;
    }

    const cacheEntry = cached[0];
    const now = new Date();

    // Check if cache entry has expired
    if (cacheEntry.expiresAt < now) {
      if (process.env.NODE_ENV === "development") {
        console.log(
          `[Companies House Cache] MISS: ${companyNumber} (expired at ${cacheEntry.expiresAt.toISOString()})`,
        );
      }
      return null;
    }

    const duration = Date.now() - startTime;
    if (process.env.NODE_ENV === "development") {
      console.log(
        `[Companies House Cache] HIT: ${companyNumber} (${duration}ms)`,
      );
    }

    return cacheEntry.cachedData as CompanyData;
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error(
        `[Companies House Cache] ERROR reading cache for ${companyNumber}:`,
        error,
      );
    }
    return null;
  }
}

/**
 * Store company data in cache with 24-hour TTL
 *
 * @param companyNumber - Companies House company number
 * @param data - Company data to cache
 */
export async function setCachedCompany(
  companyNumber: string,
  data: CompanyData,
): Promise<void> {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours from now

  try {
    // Use upsert pattern: try insert, on conflict update
    await db
      .insert(companiesHouseCache)
      .values({
        id: `ch-${companyNumber}`,
        companyNumber,
        cachedData: data,
        cachedAt: now,
        expiresAt,
      })
      .onConflictDoUpdate({
        target: companiesHouseCache.companyNumber,
        set: {
          cachedData: data,
          cachedAt: now,
          expiresAt,
        },
      });

    if (process.env.NODE_ENV === "development") {
      console.log(
        `[Companies House Cache] STORED: ${companyNumber} (expires ${expiresAt.toISOString()})`,
      );
    }
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error(
        `[Companies House Cache] ERROR storing cache for ${companyNumber}:`,
        error,
      );
    }
    throw error;
  }
}

/**
 * Clear cache entries
 *
 * @param companyNumber - Optional company number to clear specific entry.
 *                        If not provided, clears all cache entries.
 */
export async function clearCache(companyNumber?: string): Promise<void> {
  try {
    if (companyNumber) {
      await db
        .delete(companiesHouseCache)
        .where(eq(companiesHouseCache.companyNumber, companyNumber));

      if (process.env.NODE_ENV === "development") {
        console.log(`[Companies House Cache] CLEARED: ${companyNumber}`);
      }
    } else {
      await db.delete(companiesHouseCache);

      if (process.env.NODE_ENV === "development") {
        console.log("[Companies House Cache] CLEARED: all entries");
      }
    }
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("[Companies House Cache] ERROR clearing cache:", error);
    }
    throw error;
  }
}
