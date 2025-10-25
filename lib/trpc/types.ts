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

// ============================================================================
// DASHBOARD TYPES
// ============================================================================

/**
 * Dashboard router types
 * Used for dashboard widgets and metrics
 */
export type DashboardMetrics = RouterOutputs["dashboard"]["getMetrics"];
export type DashboardRecentActivity =
  RouterOutputs["dashboard"]["getRecentActivity"];

// ============================================================================
// CLIENT TYPES
// ============================================================================

/**
 * Client management types
 * Pattern: list procedure returns { clients: T[] }, extract individual client
 */
export type ClientListOutput = RouterOutputs["clients"]["list"];
export type Client = ClientListOutput["clients"][number];

/**
 * Client with full relations (from getById)
 */
export type ClientWithRelations = RouterOutputs["clients"]["getById"];

// ============================================================================
// TASK TYPES
// ============================================================================

/**
 * Task management types
 * Supports task assignment, workflow stages, and checklist items
 */
export type TaskListOutput = RouterOutputs["tasks"]["list"];
export type Task = TaskListOutput["tasks"][number];
export type TaskWithRelations = RouterOutputs["tasks"]["getById"];
export type TaskStats = RouterOutputs["tasks"]["getStats"];

// ============================================================================
// TASK GENERATION TYPES
// ============================================================================

/**
 * Task generation from templates (Story 3.2)
 */
export type TaskGenerationPreview =
  RouterOutputs["taskGeneration"]["previewGeneration"];
export type TaskGenerationResult =
  RouterOutputs["taskGeneration"]["generateFromTemplates"];

// ============================================================================
// TASK TEMPLATE TYPES
// ============================================================================

/**
 * Task template types for recurring task creation
 */
export type TaskTemplateListOutput = RouterOutputs["taskTemplates"]["list"];
export type TaskTemplate = TaskTemplateListOutput["templates"][number];
export type TaskTemplateWithRelations =
  RouterOutputs["taskTemplates"]["getById"];

// ============================================================================
// INVOICE TYPES
// ============================================================================

/**
 * Invoice management types
 * Pattern: list returns { invoices: T[] }
 */
export type InvoiceListOutput = RouterOutputs["invoices"]["list"];
export type Invoice = InvoiceListOutput["invoices"][number];
export type InvoiceWithRelations = RouterOutputs["invoices"]["getById"];
export type InvoiceLineItem = InvoiceWithRelations["items"][number];
export type InvoiceStats = RouterOutputs["invoices"]["getStats"];

// ============================================================================
// TIMESHEET TYPES
// ============================================================================

/**
 * Timesheet tracking types
 */
export type TimesheetListOutput = RouterOutputs["timesheets"]["list"];
export type Timesheet = TimesheetListOutput["timesheets"][number];
export type TimesheetEntry = RouterOutputs["timesheets"]["getById"];
export type TimesheetSummary = RouterOutputs["timesheets"]["getSummary"];

// ============================================================================
// SERVICE TYPES
// ============================================================================

/**
 * Service management types
 */
export type ServiceListOutput = RouterOutputs["services"]["list"];
export type Service = ServiceListOutput["services"][number];
export type ServiceWithRelations = RouterOutputs["services"]["getById"];

// ============================================================================
// COMPLIANCE TYPES
// ============================================================================

/**
 * Compliance deadline tracking types
 */
export type ComplianceListOutput = RouterOutputs["compliance"]["list"];
export type ComplianceDeadline = ComplianceListOutput["deadlines"][number];
export type ComplianceWithRelations = RouterOutputs["compliance"]["getById"];

// ============================================================================
// USER TYPES
// ============================================================================

/**
 * User management types
 */
export type UserListOutput = RouterOutputs["users"]["list"];
export type User = UserListOutput["users"][number];
export type UserWithRelations = RouterOutputs["users"]["getById"];

// ============================================================================
// DEPARTMENT TYPES
// ============================================================================

/**
 * Department organization types
 */
export type DepartmentListOutput = RouterOutputs["departments"]["list"];
export type Department = DepartmentListOutput["departments"][number];
export type DepartmentWithRelations = RouterOutputs["departments"]["getById"];

// ============================================================================
// STAFF CAPACITY TYPES
// ============================================================================

/**
 * Staff capacity planning types
 */
export type StaffCapacityListOutput = RouterOutputs["staffCapacity"]["list"];
export type StaffCapacityRecord =
  StaffCapacityListOutput["capacityRecords"][number];
export type StaffUtilization = RouterOutputs["staffCapacity"]["getUtilization"];

// ============================================================================
// STAFF STATISTICS TYPES
// ============================================================================

/**
 * Staff statistics and comparison types
 */
export type StaffComparisonOutput =
  RouterOutputs["staffStatistics"]["getStaffComparison"];
export type StaffMemberComparison = StaffComparisonOutput["staff"][number];

// ============================================================================
// WORKING PATTERN TYPES
// ============================================================================

/**
 * Working pattern types for staff scheduling
 */
export type WorkingPatternListOutput = RouterOutputs["workingPatterns"]["list"];
export type WorkingPattern =
  WorkingPatternListOutput["workingPatterns"][number];
export type WorkingPatternWithRelations =
  RouterOutputs["workingPatterns"]["getById"];

// ============================================================================
// SETTINGS TYPES
// ============================================================================

/**
 * User and tenant settings types
 */
export type UserSettings = RouterOutputs["settings"]["getUserSettings"];
export type TenantSettings = RouterOutputs["settings"]["getTenantSettings"];

// ============================================================================
// WORKFLOW TYPES
// ============================================================================

/**
 * Workflow automation types
 */
export type WorkflowListOutput = RouterOutputs["workflows"]["list"];
export type Workflow = WorkflowListOutput["workflows"][number];
export type WorkflowWithRelations = RouterOutputs["workflows"]["getById"];
export type WorkflowVersion = RouterOutputs["workflows"]["getVersions"];
export type WorkflowInstance = RouterOutputs["workflows"]["getInstanceById"];

// ============================================================================
// WORK TYPE TYPES
// ============================================================================

/**
 * Work type categorization types
 */
export type WorkTypeListOutput = RouterOutputs["workTypes"]["list"];
export type WorkType = WorkTypeListOutput["workTypes"][number];

// ============================================================================
// PORTAL TYPES
// ============================================================================

/**
 * Portal operations types (legacy)
 * Note: May be deprecated in favor of clientPortal
 */
export type PortalClient = RouterOutputs["portal"]["getClient"];

// ============================================================================
// PRICING TYPES
// ============================================================================

/**
 * Pricing calculation types
 */
export type PricingCalculation = RouterOutputs["pricing"]["calculate"];
export type PricingComponentPrice = RouterOutputs["pricing"]["getComponentPrice"];

// ============================================================================
// PRICING ADMIN TYPES
// ============================================================================

/**
 * Admin pricing management types
 */
export type PricingComponentListOutput = RouterOutputs["pricingAdmin"]["list"];
export type PricingComponent =
  PricingComponentListOutput["components"][number];
export type PricingComponentWithRelations =
  RouterOutputs["pricingAdmin"]["getById"];

// ============================================================================
// PRICING CONFIG TYPES
// ============================================================================

/**
 * Tenant-specific pricing configuration types
 */
export type TenantPricingConfig =
  RouterOutputs["pricingConfig"]["getTenantConfig"];
export type PricingOverride =
  RouterOutputs["pricingConfig"]["getOverrides"]["overrides"][number];

// ============================================================================
// PROPOSAL TYPES
// ============================================================================

/**
 * Proposal management types
 * Includes DocuSeal e-signature integration
 */
export type ProposalListOutput = RouterOutputs["proposals"]["list"];
export type Proposal = ProposalListOutput["proposals"][number];
export type ProposalWithRelations = RouterOutputs["proposals"]["getById"];
export type ProposalVersion =
  RouterOutputs["proposals"]["getVersions"]["versions"][number];
export type ProposalPublicView = RouterOutputs["proposals"]["getPublicProposal"];
export type ProposalSignature =
  RouterOutputs["proposals"]["getSignatureStatus"];

// ============================================================================
// PROPOSAL TEMPLATE TYPES
// ============================================================================

/**
 * Proposal template types
 */
export type ProposalTemplateListOutput =
  RouterOutputs["proposalTemplates"]["list"];
export type ProposalTemplate =
  ProposalTemplateListOutput["templates"][number];
export type ProposalTemplateWithRelations =
  RouterOutputs["proposalTemplates"]["getById"];

// ============================================================================
// REPORT TYPES
// ============================================================================

/**
 * Report generation types
 */
export type ReportListOutput = RouterOutputs["reports"]["list"];
export type Report = ReportListOutput["reports"][number];
export type ReportData = RouterOutputs["reports"]["generate"];

// ============================================================================
// TRANSACTION DATA TYPES
// ============================================================================

/**
 * Transaction data import types for AI extraction
 */
export type TransactionImportPreview =
  RouterOutputs["transactionData"]["previewImport"];
export type TransactionImportResult =
  RouterOutputs["transactionData"]["importTransactions"];

// ============================================================================
// LEAD TYPES
// ============================================================================

/**
 * Lead management types
 */
export type LeadListOutput = RouterOutputs["leads"]["list"];
export type Lead = LeadListOutput["leads"][number];
export type LeadWithRelations = RouterOutputs["leads"]["getById"];

// ============================================================================
// LEAVE TYPES
// ============================================================================

/**
 * Leave request and tracking types
 */
export type LeaveHistoryOutput = RouterOutputs["leave"]["getHistory"];
export type LeaveRequest = LeaveHistoryOutput["requests"][number];
export type LeaveBalance = RouterOutputs["leave"]["getBalance"];
export type LeaveStats = RouterOutputs["leave"]["getStats"];

// ============================================================================
// TOIL TYPES
// ============================================================================

/**
 * Time Off In Lieu tracking types
 */
export type ToilBalance = RouterOutputs["toil"]["getBalance"];
export type ToilHistory = RouterOutputs["toil"]["getHistory"]["records"][number];

// ============================================================================
// PIPELINE TYPES
// ============================================================================

/**
 * Sales pipeline types
 */
export type PipelineStageListOutput = RouterOutputs["pipeline"]["getStages"];
export type PipelineStage = PipelineStageListOutput["stages"][number];
export type PipelineStats = RouterOutputs["pipeline"]["getStats"];

// ============================================================================
// ACTIVITY TYPES
// ============================================================================

/**
 * Activity log types for audit trail
 */
export type ActivityListOutput = RouterOutputs["activities"]["list"];
export type Activity = ActivityListOutput["activities"][number];
export type ActivityStats = RouterOutputs["activities"]["getStats"];

// ============================================================================
// ANALYTICS TYPES
// ============================================================================

/**
 * Analytics dashboard types
 */
export type AnalyticsDashboard = RouterOutputs["analytics"]["getDashboard"];
export type AnalyticsRevenue = RouterOutputs["analytics"]["getRevenue"];
export type AnalyticsClientGrowth =
  RouterOutputs["analytics"]["getClientGrowth"];

// ============================================================================
// ONBOARDING TYPES
// ============================================================================

/**
 * Client onboarding session types
 */
export type OnboardingSessionListOutput = RouterOutputs["onboarding"]["list"];
export type OnboardingSession =
  OnboardingSessionListOutput["sessions"][number];
export type OnboardingSessionWithRelations =
  RouterOutputs["onboarding"]["getById"];
export type OnboardingQuestionnaireResponses =
  RouterOutputs["onboarding"]["getQuestionnaire"];

// ============================================================================
// ADMIN KYC TYPES
// ============================================================================

/**
 * KYC review and verification types
 */
export type KycReviewListOutput = RouterOutputs["adminKyc"]["list"];
export type KycReview = KycReviewListOutput["sessions"][number];
export type KycReviewWithRelations = RouterOutputs["adminKyc"]["getById"];

// ============================================================================
// INVITATION TYPES
// ============================================================================

/**
 * User invitation types
 */
export type InvitationListOutput = RouterOutputs["invitations"]["list"];
export type Invitation = InvitationListOutput["invitations"][number];

// ============================================================================
// CLIENT PORTAL TYPES
// ============================================================================

/**
 * Client portal self-service types
 */
export type ClientPortalDashboard =
  RouterOutputs["clientPortal"]["getDashboard"];
export type ClientPortalDocuments =
  RouterOutputs["clientPortal"]["getDocuments"]["documents"][number];
export type ClientPortalInvoices =
  RouterOutputs["clientPortal"]["getInvoices"]["invoices"][number];

// ============================================================================
// CLIENT PORTAL ADMIN TYPES
// ============================================================================

/**
 * Client portal admin management types
 */
export type ClientPortalConfig =
  RouterOutputs["clientPortalAdmin"]["getConfig"];
export type ClientPortalUserListOutput =
  RouterOutputs["clientPortalAdmin"]["listUsers"];
export type ClientPortalUser =
  ClientPortalUserListOutput["users"][number];

// ============================================================================
// MESSAGE TYPES
// ============================================================================

/**
 * Messaging and thread types
 */
export type MessageThreadListOutput = RouterOutputs["messages"]["listThreads"];
export type MessageThread = MessageThreadListOutput["threads"][number];
export type MessageThreadDetails = RouterOutputs["messages"]["getThread"];
export type Message = RouterOutputs["messages"]["getMessages"]["messages"][number];

// ============================================================================
// NOTIFICATION TYPES
// ============================================================================

/**
 * Notification system types
 */
export type NotificationListOutput = RouterOutputs["notifications"]["list"];
export type Notification = NotificationListOutput["notifications"][number];
export type NotificationStats = RouterOutputs["notifications"]["getStats"];

// ============================================================================
// CALENDAR TYPES
// ============================================================================

/**
 * Calendar event types
 */
export type CalendarEventListOutput = RouterOutputs["calendar"]["list"];
export type CalendarEvent = CalendarEventListOutput["events"][number];
export type CalendarEventWithRelations = RouterOutputs["calendar"]["getById"];

// ============================================================================
// DOCUMENT TYPES
// ============================================================================

/**
 * Document management types
 */
export type DocumentListOutput = RouterOutputs["documents"]["list"];
export type Document = DocumentListOutput["documents"][number];
export type DocumentWithRelations = RouterOutputs["documents"]["getById"];

// ============================================================================
// LEGAL TYPES
// ============================================================================

/**
 * Legal compliance and document types
 */
export type LegalDocumentListOutput = RouterOutputs["legal"]["list"];
export type LegalDocument = LegalDocumentListOutput["documents"][number];

// ============================================================================
// IMPORT LOG TYPES
// ============================================================================

/**
 * Import operation tracking types
 */
export type ImportLogListOutput = RouterOutputs["importLogs"]["list"];
export type ImportLog = ImportLogListOutput["logs"][number];
export type ImportLogWithDetails = RouterOutputs["importLogs"]["getById"];

// ============================================================================
// INTEGRATION TYPES
// ============================================================================

/**
 * Third-party integration types
 */
export type IntegrationListOutput = RouterOutputs["integrations"]["list"];
export type Integration = IntegrationListOutput["integrations"][number];
export type IntegrationConfig = RouterOutputs["integrations"]["getConfig"];
