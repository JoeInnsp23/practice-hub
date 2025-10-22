import { activitiesRouter } from "./routers/activities";
import { adminKycRouter } from "./routers/admin-kyc";
import { analyticsRouter } from "./routers/analytics";
import { calendarRouter } from "./routers/calendar";
import { clientPortalRouter } from "./routers/clientPortal";
import { clientPortalAdminRouter } from "./routers/clientPortalAdmin";
import { clientsRouter } from "./routers/clients";
import { complianceRouter } from "./routers/compliance";
import { dashboardRouter } from "./routers/dashboard";
import { documentsRouter } from "./routers/documents";
import { integrationsRouter } from "./routers/integrations";
import { invitationsRouter } from "./routers/invitations";
import { invoicesRouter } from "./routers/invoices";
import { leadsRouter } from "./routers/leads";
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
import { servicesRouter } from "./routers/services";
import { settingsRouter } from "./routers/settings";
import { tasksRouter } from "./routers/tasks";
import { taskTemplatesRouter } from "./routers/taskTemplates";
import { timesheetsRouter } from "./routers/timesheets";
import { transactionDataRouter } from "./routers/transactionData";
import { usersRouter } from "./routers/users";
import { workflowsRouter } from "./routers/workflows";
import { router } from "./trpc";

export const appRouter = router({
  dashboard: dashboardRouter,
  clients: clientsRouter,
  tasks: tasksRouter,
  taskTemplates: taskTemplatesRouter,
  invoices: invoicesRouter,
  timesheets: timesheetsRouter,
  services: servicesRouter,
  compliance: complianceRouter,
  users: usersRouter,
  settings: settingsRouter,
  workflows: workflowsRouter,
  portal: portalRouter,
  pricing: pricingRouter,
  pricingAdmin: pricingAdminRouter,
  pricingConfig: pricingConfigRouter,
  proposals: proposalsRouter,
  proposalTemplates: proposalTemplatesRouter,
  transactionData: transactionDataRouter,
  leads: leadsRouter,
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
  integrations: integrationsRouter,
});

export type AppRouter = typeof appRouter;
