import { activitiesRouter } from "./routers/activities";
import { adminKycRouter } from "./routers/admin-kyc";
import { analyticsRouter } from "./routers/analytics";
import { calendarRouter } from "./routers/calendar";
import { clientPortalRouter } from "./routers/clientPortal";
import { clientPortalAdminRouter } from "./routers/clientPortalAdmin";
import { clientsRouter } from "./routers/clients";
import { complianceRouter } from "./routers/compliance";
import { dashboardRouter } from "./routers/dashboard";
import { departmentsRouter } from "./routers/departments";
import { documentsRouter } from "./routers/documents";
import { importLogsRouter } from "./routers/import-logs";
import { integrationsRouter } from "./routers/integrations";
import { invitationsRouter } from "./routers/invitations";
import { invoicesRouter } from "./routers/invoices";
import { leadsRouter } from "./routers/leads";
import { leaveRouter } from "./routers/leave";
import { legalRouter } from "./routers/legal";
import { messagesRouter } from "./routers/messages";
import { notificationsRouter } from "./routers/notifications";
import { onboardingRouter } from "./routers/onboarding";
import { pipelineRouter } from "./routers/pipeline";
import { portalRouter } from "./routers/portal";
import { pricingRouter } from "./routers/pricing";
import { pricingAdminRouter } from "./routers/pricingAdmin";
import { pricingConfigRouter } from "./routers/pricingConfig";
import { proposalsRouter } from "./routers/proposals";
import { proposalTemplatesRouter } from "./routers/proposalTemplates";
import { reportsRouter } from "./routers/reports";
import { servicesRouter } from "./routers/services";
import { settingsRouter } from "./routers/settings";
import { staffCapacityRouter } from "./routers/staffCapacity";
import { staffStatisticsRouter } from "./routers/staffStatistics";
import { taskGenerationRouter } from "./routers/task-generation";
import { tasksRouter } from "./routers/tasks";
import { taskTemplatesRouter } from "./routers/taskTemplates";
import { timesheetsRouter } from "./routers/timesheets";
import { toilRouter } from "./routers/toil";
import { transactionDataRouter } from "./routers/transactionData";
import { usersRouter } from "./routers/users";
import { workflowsRouter } from "./routers/workflows";
import { workingPatternsRouter } from "./routers/workingPatterns";
import { workTypesRouter } from "./routers/workTypes";
import { router } from "./trpc";

export const appRouter = router({
  dashboard: dashboardRouter,
  clients: clientsRouter,
  tasks: tasksRouter,
  taskGeneration: taskGenerationRouter,
  taskTemplates: taskTemplatesRouter,
  invoices: invoicesRouter,
  timesheets: timesheetsRouter,
  services: servicesRouter,
  compliance: complianceRouter,
  users: usersRouter,
  departments: departmentsRouter,
  staffCapacity: staffCapacityRouter,
  staffStatistics: staffStatisticsRouter,
  workingPatterns: workingPatternsRouter,
  settings: settingsRouter,
  workflows: workflowsRouter,
  workTypes: workTypesRouter,
  portal: portalRouter,
  pricing: pricingRouter,
  pricingAdmin: pricingAdminRouter,
  pricingConfig: pricingConfigRouter,
  proposals: proposalsRouter,
  proposalTemplates: proposalTemplatesRouter,
  reports: reportsRouter,
  transactionData: transactionDataRouter,
  leads: leadsRouter,
  leave: leaveRouter,
  toil: toilRouter,
  pipeline: pipelineRouter,
  activities: activitiesRouter,
  analytics: analyticsRouter,
  onboarding: onboardingRouter,
  adminKyc: adminKycRouter,
  invitations: invitationsRouter,
  clientPortal: clientPortalRouter,
  clientPortalAdmin: clientPortalAdminRouter,
  messages: messagesRouter,
  notifications: notificationsRouter,
  calendar: calendarRouter,
  documents: documentsRouter,
  legal: legalRouter,
  importLogs: importLogsRouter,
  integrations: integrationsRouter,
});

export type AppRouter = typeof appRouter;
