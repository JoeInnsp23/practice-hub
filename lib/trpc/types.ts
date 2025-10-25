/**
 * Centralized tRPC Type Definitions
 *
 * This file provides type-safe access to tRPC router outputs using the official
 * inferRouterOutputs helper from @trpc/server. This follows tRPC best practices
 * and avoids the need for conditional type extraction with `any` fallbacks.
 *
 * @see https://trpc.io/docs/server/infer-types
 */

import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "@/app/server";

/**
 * Infer all router output types from the AppRouter
 * Usage: RouterOutputs['routerName']['procedureName']
 */
export type RouterOutputs = inferRouterOutputs<AppRouter>;

/**
 * Working Patterns Types
 */
export type WorkingPatternListOutput = RouterOutputs["workingPatterns"]["list"];
export type WorkingPattern =
  WorkingPatternListOutput["workingPatterns"][number];

/**
 * Leave Request Types
 */
export type LeaveHistoryOutput = RouterOutputs["leave"]["getHistory"];
export type LeaveRequest = LeaveHistoryOutput["requests"][number];

/**
 * Staff Statistics Types
 */
export type StaffComparisonOutput =
  RouterOutputs["staffStatistics"]["getStaffComparison"];
export type StaffMemberComparison = StaffComparisonOutput["staff"][number];
