/**
 * Simple in-memory cache with TTL (Time To Live)
 *
 * Provides generic caching functionality with automatic expiration
 * to reduce repeated database reads and improve performance.
 */

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

class SimpleCache<T> {
  private store = new Map<string, CacheEntry<T>>();

  /**
   * Get value from cache
   *
   * @param key Cache key
   * @returns Cached value or null if not found or expired
   */
  get(key: string): T | null {
    const entry = this.store.get(key);

    if (!entry) {
      return null;
    }

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }

    return entry.value;
  }

  /**
   * Set value in cache with TTL
   *
   * @param key Cache key
   * @param value Value to cache
   * @param ttlMs Time to live in milliseconds (default: 30 seconds)
   */
  set(key: string, value: T, ttlMs = 30000): void {
    this.store.set(key, {
      value,
      expiresAt: Date.now() + ttlMs,
    });

    // Periodically clean up expired entries (1% chance)
    if (Math.random() < 0.01) {
      this.cleanup();
    }
  }

  /**
   * Delete value from cache
   *
   * @param key Cache key
   */
  delete(key: string): void {
    this.store.delete(key);
  }

  /**
   * Clear all cached values
   */
  clear(): void {
    this.store.clear();
  }

  /**
   * Clean up expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (entry.expiresAt < now) {
        this.store.delete(key);
      }
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): { size: number; keys: string[] } {
    return {
      size: this.store.size,
      keys: Array.from(this.store.keys()),
    };
  }
}

/**
 * Cache for onboarding questionnaire responses
 *
 * TTL: 30 seconds (data can change frequently as users update fields)
 */
export const questionnaireResponsesCache = new SimpleCache<
  Record<string, { value: any; extractedFromAi: boolean; verifiedByUser: boolean }>
>();

/**
 * Invalidate questionnaire cache for a specific session
 *
 * Call this when questionnaire data is updated
 */
export function invalidateQuestionnaireCache(onboardingSessionId: string): void {
  questionnaireResponsesCache.delete(onboardingSessionId);
}
