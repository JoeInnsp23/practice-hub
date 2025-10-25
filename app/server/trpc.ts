import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { getClientId, trpcRateLimit } from "@/lib/rate-limit";
import { captureTRPCError } from "@/lib/sentry";
import type { Context } from "./context";

const t = initTRPC.context<Context>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    // Log errors to Sentry (except auth errors)
    if (
      error.code !== "UNAUTHORIZED" &&
      error.code !== "FORBIDDEN" &&
      error.cause instanceof Error
    ) {
      captureTRPCError(
        error.cause,
        shape.data.path || "unknown",
        undefined, // input will be added in middleware if needed
      );
    }

    return shape;
  },
});

// Middleware for rate limiting (applies to all procedures)
const rateLimitMiddleware = t.middleware(async ({ ctx: _ctx, next }) => {
  // Skip rate limiting if Upstash not configured (development)
  if (!trpcRateLimit) {
    return next();
  }

  // Get client identifier from headers
  const headers = await import("next/headers").then((mod) => mod.headers());
  const clientId = getClientId(headers);

  const { success, reset } = await trpcRateLimit.limit(clientId);

  if (!success) {
    throw new TRPCError({
      code: "TOO_MANY_REQUESTS",
      message: `Rate limit exceeded. Try again in ${Math.ceil((reset - Date.now()) / 1000)} seconds.`,
    });
  }

  return next();
});

// Middleware to check if user is authenticated
const isAuthed = t.middleware(({ next, ctx }) => {
  if (!ctx.session?.user) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }

  // Also check if we have tenant context
  if (!ctx.authContext) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "User not found in organization",
    });
  }

  return next({
    ctx: {
      session: ctx.session,
      authContext: ctx.authContext,
    },
  });
});

// Middleware to check if user is admin
const isAdmin = t.middleware(({ next, ctx }) => {
  if (!ctx.session?.user) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }

  if (!ctx.authContext) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "User not found in organization",
    });
  }

  // Check for admin role
  if (ctx.authContext.role !== "admin") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Admin access required",
    });
  }

  return next({
    ctx: {
      session: ctx.session,
      authContext: ctx.authContext,
    },
  });
});

// Middleware to check if client portal user is authenticated
const isClientPortalAuthed = t.middleware(({ next, ctx }) => {
  if (!ctx.clientPortalSession?.user) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Client portal authentication required",
    });
  }

  if (!ctx.clientPortalAuthContext) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Client not found or access denied",
    });
  }

  return next({
    ctx: {
      clientPortalSession: ctx.clientPortalSession,
      clientPortalAuthContext: ctx.clientPortalAuthContext,
    },
  });
});

export const router = t.router;
export const publicProcedure = t.procedure.use(rateLimitMiddleware);
export const protectedProcedure = t.procedure
  .use(rateLimitMiddleware)
  .use(isAuthed);
export const adminProcedure = t.procedure.use(rateLimitMiddleware).use(isAdmin);
export const clientPortalProcedure = t.procedure
  .use(rateLimitMiddleware)
  .use(isClientPortalAuthed);
