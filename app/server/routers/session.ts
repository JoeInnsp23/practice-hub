import { createTRPCRouter, protectedProcedure } from "../trpc";

/**
 * Session router - Provides client-side access to session data
 * Eliminates prop drilling by allowing components to query user role and session info
 */
export const sessionRouter = createTRPCRouter({
  /**
   * Get current user's role and basic session info
   * Useful for client-side conditional rendering (e.g., admin-only components)
   */
  getRole: protectedProcedure.query(({ ctx }) => {
    return {
      role: ctx.authContext.role,
      userId: ctx.authContext.userId,
      tenantId: ctx.authContext.tenantId,
    };
  }),
});
