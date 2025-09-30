import { clientsRouter } from "./routers/clients";
import { complianceRouter } from "./routers/compliance";
import { dashboardRouter } from "./routers/dashboard";
import { invoicesRouter } from "./routers/invoices";
import { portalRouter } from "./routers/portal";
import { pricingRouter } from "./routers/pricing";
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
  proposals: proposalsRouter,
  transactionData: transactionDataRouter,
});

export type AppRouter = typeof appRouter;
