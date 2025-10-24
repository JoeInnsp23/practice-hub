/**
 * tRPC Testing Helpers
 *
 * Utilities for testing tRPC routers with mocked auth context
 */

import type { Context } from "@/app/server/context";
import type { AuthContext } from "@/lib/auth";

/**
 * Create a mock auth context for testing
 */
export function createMockAuthContext(
  overrides: Partial<AuthContext> = {},
): AuthContext {
  return {
    userId: overrides.userId || "test-user-id",
    tenantId: overrides.tenantId || "test-tenant-id",
    organizationName: overrides.organizationName || "Test Organization",
    role: overrides.role || "user",
    email: overrides.email || "test@example.com",
    firstName: overrides.firstName || "Test",
    lastName: overrides.lastName || "User",
  };
}

/**
 * Create a mock admin auth context for testing
 */
export function createMockAdminContext(
  overrides: Partial<AuthContext> = {},
): AuthContext {
  return createMockAuthContext({
    role: "admin",
    ...overrides,
  });
}

/**
 * Create a mock tRPC context for testing
 */
export function createMockContext(overrides: Partial<Context> = {}): Context {
  const authContext = overrides.authContext || createMockAuthContext();

  return {
    session: overrides.session ?? {
      user: {
        id: authContext.userId,
        createdAt: new Date(),
        updatedAt: new Date(),
        email: authContext.email,
        emailVerified: true,
        name: `${authContext.firstName} ${authContext.lastName}`,
        image: null,
      },
      session: {
        id: "test-session-id",
        createdAt: new Date(),
        updatedAt: new Date(),
        userId: authContext.userId,
        expiresAt: new Date(Date.now() + 86400000), // 24 hours
        token: "test-token",
        ipAddress: "127.0.0.1",
        userAgent: "test-agent",
      },
    },
    authContext,
  };
}

/**
 * Create a test caller for a tRPC router
 *
 * @example
 * ```ts
 * const caller = createCaller(clientsRouter);
 * const result = await caller.list({ search: "test" });
 * ```
 */
export function createCaller<TRouter extends Record<string, any>>(
  router: TRouter,
  context: Context = createMockContext(),
) {
  return router.createCaller(context);
}

/**
 * Create a test caller with admin context
 */
export function createAdminCaller<TRouter extends Record<string, any>>(
  router: TRouter,
  overrides: Partial<Context> = {},
) {
  const adminContext = createMockContext({
    ...overrides,
    authContext: createMockAdminContext(overrides.authContext ?? undefined),
  });
  return router.createCaller(adminContext);
}
