"use client";

export type { RouterOutputs } from "@/app/providers/trpc-provider";
// Re-export the trpc client and types from the provider
export { trpc, trpc as api } from "@/app/providers/trpc-provider";
