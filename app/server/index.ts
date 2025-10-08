import { activitiesRouter } from "./routers/activities";
import { clientsRouter } from "./routers/clients";
import { complianceRouter } from "./routers/compliance";
import { dashboardRouter } from "./routers/dashboard";
import { invitationsRouter } from "./routers/invitations";
import { invoicesRouter } from "./routers/invoices";
import { leadsRouter } from "./routers/leads";
import { onboardingRouter } from "./routers/onboarding";
import { pipelineRouter } from "./routers/pipeline";
import { portalRouter } from "./routers/portal";
import { pricingRouter } from "./routers/pricing";
import { pricingAdminRouter } from "./routers/pricingAdmin";
import { pricingConfigRouter } from "./routers/pricingConfig";
import { proposalsRouter } from "./routers/proposals";
import { servicesRouter } from "./routers/services";
import { settingsRouter } from "./routers/settings";
import { tasksRouter } from "./routers/tasks";
import { timesheetsRouter } from "./routers/timesheets";
import { transactionDataRouter } from "./routers/transactionData";
import { usersRouter } from "./routers/users";
import { workflowsRouter } from "./routers/workflows";
import { router } from "./trpc";

export const appRouter = router({
  dashboard: dashboardRouter,
  clients: clientsRouter,
  tasks: tasksRouter,
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
  transactionData: transactionDataRouter,
  leads: leadsRouter,
  pipeline: pipelineRouter,
  activities: activitiesRouter,
  onboarding: onboardingRouter,
  invitations: invitationsRouter,
});

export type AppRouter = typeof appRouter;
