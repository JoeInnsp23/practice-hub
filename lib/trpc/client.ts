"use client";

// Re-export centralized types
export type { RouterOutputs } from "@/lib/trpc/types";
// Re-export the trpc client from the provider
export { trpc, trpc as api } from "@/app/providers/trpc-provider";
