import { router } from "./trpc";
import { dashboardRouter } from "./routers/dashboard";
import { clientsRouter } from "./routers/clients";
import { tasksRouter } from "./routers/tasks";
import { invoicesRouter } from "./routers/invoices";
import { timesheetsRouter } from "./routers/timesheets";
import { servicesRouter } from "./routers/services";
import { complianceRouter } from "./routers/compliance";
import { usersRouter } from "./routers/users";
import { settingsRouter } from "./routers/settings";
import { workflowsRouter } from "./routers/workflows";
import { portalRouter } from "./routers/portal";

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
});

export type AppRouter = typeof appRouter;