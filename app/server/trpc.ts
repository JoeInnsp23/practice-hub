import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import type { Context } from "./context";

const t = initTRPC.context<Context>().create({
  transformer: superjson,
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

export const router = t.router;
export const publicProcedure = t.procedure;
export const protectedProcedure = t.procedure.use(isAuthed);
export const adminProcedure = t.procedure.use(isAdmin);
