/**
 * Centralized tRPC Type Definitions
 *
 * This file provides type-safe access to tRPC router outputs using the official
 * inferRouterOutputs helper from @trpc/server. This follows tRPC best practices
 * and avoids the need for conditional type extraction with `any` fallbacks.
 *
 * Usage: Import specific types from this file, or use RouterOutputs["router"]["procedure"]
 * for any router output.
 *
 * @see https://trpc.io/docs/server/infer-types
 */

import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "@/app/server";

/**
 * Base type for all router outputs
 * Usage: RouterOutputs['routerName']['procedureName']
 *
 * @example
 * type MyData = RouterOutputs["clients"]["list"];
 * type SingleClient = RouterOutputs["clients"]["getById"];
 */
export type RouterOutputs = inferRouterOutputs<AppRouter>;

// ============================================================================
// COMMONLY USED TYPES (Verified to exist in routers)
// ============================================================================

/**
 * Client Types
 */
export type ClientListOutput = RouterOutputs["clients"]["list"];
export type Client = ClientListOutput["clients"][number];
export type ClientWithRelations = RouterOutputs["clients"]["getById"];

/**
 * Task Types
 */
export type TaskListOutput = RouterOutputs["tasks"]["list"];
export type Task = TaskListOutput["tasks"][number];
export type TaskWithRelations = RouterOutputs["tasks"]["getById"];

/**
 * Invoice Types
 */
export type InvoiceListOutput = RouterOutputs["invoices"]["list"];
export type Invoice = InvoiceListOutput["invoices"][number];
export type InvoiceWithRelations = RouterOutputs["invoices"]["getById"];
export type InvoiceLineItem = InvoiceWithRelations["items"][number];

/**
 * Proposal Types
 */
export type ProposalListOutput = RouterOutputs["proposals"]["list"];
export type Proposal = ProposalListOutput["proposals"][number];
export type ProposalWithRelations = RouterOutputs["proposals"]["getById"];

/**
 * Document Types
 */
export type DocumentListOutput = RouterOutputs["documents"]["list"];
export type Document = DocumentListOutput["documents"][number];

/**
 * Calendar Types
 */
export type CalendarEventListOutput = RouterOutputs["calendar"]["listEvents"];
export type CalendarEvent = CalendarEventListOutput[number];

/**
 * Notification Types
 */
export type NotificationListOutput = RouterOutputs["notifications"]["list"];
export type Notification = NotificationListOutput[number];

/**
 * Message Types
 */
export type MessageThreadListOutput = RouterOutputs["messages"]["listThreads"];
export type MessageThread = MessageThreadListOutput[number];
export type MessageThreadDetails = RouterOutputs["messages"]["getThread"];
export type Message = RouterOutputs["messages"]["listMessages"][number];

/**
 * User Types
 */
export type UserListOutput = RouterOutputs["users"]["list"];
export type User = UserListOutput["users"][number];
export type UserWithRelations = RouterOutputs["users"]["getById"];

/**
 * Leave Management Types
 */
export type LeaveHistoryOutput = RouterOutputs["leave"]["getHistory"];
export type LeaveRequest = LeaveHistoryOutput["requests"][number];
export type LeaveBalance = RouterOutputs["leave"]["getBalance"];

/**
 * Working Pattern Types
 */
export type WorkingPatternListOutput = RouterOutputs["workingPatterns"]["list"];
export type WorkingPattern =
  WorkingPatternListOutput["workingPatterns"][number];

/**
 * Staff Capacity Types
 */
export type StaffCapacityListOutput = RouterOutputs["staffCapacity"]["list"];
export type StaffCapacityRecord =
  StaffCapacityListOutput["capacityRecords"][number];
export type StaffUtilization = RouterOutputs["staffCapacity"]["getUtilization"];

/**
 * Staff Statistics Types
 */
export type StaffComparisonOutput =
  RouterOutputs["staffStatistics"]["getStaffComparison"];
export type StaffMemberComparison = StaffComparisonOutput["staff"][number];

/**
 * Work Type Types
 */
export type WorkTypeListOutput = RouterOutputs["workTypes"]["list"];
export type WorkType = WorkTypeListOutput["workTypes"][number];

/**
 * Lead Types
 */
export type LeadListOutput = RouterOutputs["leads"]["list"];
export type Lead = LeadListOutput["leads"][number];
export type LeadWithRelations = RouterOutputs["leads"]["getById"];

/**
 * Onboarding Types
 */
export type OnboardingSessionListOutput = RouterOutputs["onboarding"]["list"];
export type OnboardingSession = OnboardingSessionListOutput["sessions"][number];
export type OnboardingSessionWithRelations =
  RouterOutputs["onboarding"]["getById"];

/**
 * Service Types
 */
export type ServiceListOutput = RouterOutputs["services"]["list"];
export type Service = ServiceListOutput["services"][number];
export type ServiceWithRelations = RouterOutputs["services"]["getById"];

/**
 * Timesheet Types
 */
export type TimesheetListOutput = RouterOutputs["timesheets"]["list"];
export type Timesheet = TimesheetListOutput["timeEntries"][number];

/**
 * Workflow Types
 */
export type WorkflowListOutput = RouterOutputs["workflows"]["list"];
export type Workflow = WorkflowListOutput[number];
export type WorkflowWithRelations = RouterOutputs["workflows"]["getById"];

// ============================================================================
// USAGE NOTES
// ============================================================================
//
// For any router output not listed above, use the base RouterOutputs type:
//
// Example:
//   type MyCustomType = RouterOutputs["routerName"]["procedureName"];
//   type ListItem = MyCustomType["items"][number];
//
// This ensures type safety while allowing flexibility for all router outputs.
//
// ============================================================================
