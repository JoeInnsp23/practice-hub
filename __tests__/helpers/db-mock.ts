/**
 * Drizzle ORM Database Mock Helper
 *
 * Creates a proper thenable database mock for testing tRPC routers.
 *
 * Key features:
 * - Query chains return thenable objects (implement .then())
 * - Awaiting queries resolves to empty arrays by default
 * - Supports chaining: select().from().where().orderBy().limit()
 * - Supports transactions with proper callback
 * - Can be extended per-test to return specific data
 *
 * Usage:
 * ```typescript
 * import { createDbMock } from "@/__tests__/helpers/db-mock";
 *
 * vi.mock("@/lib/db", () => ({
 *   db: createDbMock(),
 * }));
 * ```
 *
 * To return specific data in a test:
 * ```typescript
 * beforeEach(() => {
 *   vi.mocked(db.select).mockReturnValueOnce(
 *     createQueryMock([{ id: "123", name: "Test" }])
 *   );
 * });
 * ```
 *
 */

import { vi } from "vitest";

/**
 * Create a thenable query mock that resolves to the given value when awaited.
 *
 * This implements the minimum interface needed for Drizzle query chains:
 * - All builder methods return the query object for chaining
 * - The `then` method makes it awaitable, resolving to the provided value
 *
 * @param resolveValue - Value to resolve to when awaited (default: empty array)
 * @returns A thenable query mock object
 */
export function createQueryMock<T = any[]>(resolveValue: T = [] as any): any {
  // Declare query object first to avoid TypeScript circular reference errors
  const query: any = {};

  // Assign all methods that return the query for chaining
  query.select = vi.fn().mockReturnValue(query);
  query.from = vi.fn().mockReturnValue(query);
  query.where = vi.fn().mockReturnValue(query);
  query.having = vi.fn().mockReturnValue(query);
  query.orderBy = vi.fn().mockReturnValue(query);
  query.groupBy = vi.fn().mockReturnValue(query);
  query.limit = vi.fn().mockReturnValue(query);
  query.offset = vi.fn().mockReturnValue(query);

  // Join methods
  query.leftJoin = vi.fn().mockReturnValue(query);
  query.rightJoin = vi.fn().mockReturnValue(query);
  query.innerJoin = vi.fn().mockReturnValue(query);
  query.fullJoin = vi.fn().mockReturnValue(query);

  // Mutation methods
  query.set = vi.fn().mockReturnValue(query);
  query.values = vi.fn().mockReturnValue(query);
  query.returning = vi.fn().mockResolvedValue(resolveValue);
  query.onConflictDoNothing = vi.fn().mockReturnValue(query);
  query.onConflictDoUpdate = vi.fn().mockReturnValue(query);

  // Make it thenable - THIS IS THE KEY FIX!
  // When you `await` this query, it calls `then()` which resolves to resolveValue
  query.then = vi.fn((resolve: (value: T) => void) => {
    // Simulate async resolution
    return Promise.resolve(resolveValue).then(resolve);
  });

  // Make it catchable (for error handling tests)
  query.catch = vi.fn((reject) => Promise.resolve(resolveValue).catch(reject));

  // Execute method (some Drizzle patterns use explicit .execute())
  query.execute = vi.fn().mockResolvedValue(resolveValue);

  return query;
}

/**
 * Create a complete database mock with proper thenable query pattern.
 *
 * All query methods return thenable query mocks that resolve to empty arrays.
 * Tests can override individual methods to return specific data.
 *
 * @returns A complete database mock object
 */
export function createDbMock() {
  const db: any = {
    // Query methods
    select: vi.fn(() => createQueryMock([])),
    selectDistinct: vi.fn(() => createQueryMock([])),
    selectDistinctOn: vi.fn(() => createQueryMock([])),

    // Mutation methods
    insert: vi.fn(() => createQueryMock([])),
    update: vi.fn(() => createQueryMock([])),
    delete: vi.fn(() => createQueryMock([])),

    // Transaction support
    transaction: vi.fn(async (callback: (tx: any) => Promise<any>) => {
      // Execute callback with the same db mock (acts as transaction)
      return await callback(db);
    }),

    // Query builder (less common, but some code uses db.query.*)
    query: {},
  };

  return db;
}

/**
 * Create a mock that simulates a database error.
 * Useful for testing error handling paths.
 *
 * @param errorMessage - Error message to throw
 * @returns A query mock that rejects with the error
 */
export function createErrorMock(errorMessage = "Database error"): any {
  const error = new Error(errorMessage);

  // Declare query object first to avoid TypeScript circular reference errors
  const query: any = {};

  // Assign methods
  query.select = vi.fn().mockReturnValue(query);
  query.from = vi.fn().mockReturnValue(query);
  query.where = vi.fn().mockReturnValue(query);

  query.then = vi.fn((_, reject) => {
    if (reject) reject(error);
    return Promise.reject(error);
  });

  query.catch = vi.fn((reject) => {
    if (reject) reject(error);
    return Promise.reject(error);
  });

  return query;
}
