import { relations } from "drizzle-orm/relations";
import {
  account,
  activityLogs,
  amlChecks,
  announcements,
  calendarEventAttendees,
  calendarEvents,
  clientContacts,
  clientDirectors,
  clientPortalAccess,
  clientPortalAccount,
  clientPortalInvitations,
  clientPortalSession,
  clientPortalUsers,
  clientPortalVerification,
  clientPscs,
  clientServices,
  clients,
  clientTaskTemplateOverrides,
  clientTransactionData,
  compliance,
  departments,
  documentSignatures,
  documents,
  emailQueue,
  emailTemplates,
  feedback,
  importLogs,
  integrationSettings,
  invitations,
  invoiceItems,
  invoices,
  kycVerifications,
  leads,
  leaveBalances,
  leaveRequests,
  legalPages,
  messages,
  messageThreadParticipants,
  messageThreads,
  notifications,
  onboardingResponses,
  onboardingSessions,
  onboardingTasks,
  portalCategories,
  portalLinks,
  pricingRules,
  proposalNotes,
  proposalServices,
  proposalSignatures,
  proposals,
  proposalTemplates,
  proposalVersions,
  rolePermissions,
  services,
  session,
  staffCapacity,
  taskAssignmentHistory,
  taskNotes,
  tasks,
  taskTemplates,
  taskWorkflowInstances,
  tenants,
  timeEntries,
  timesheetSubmissions,
  toilAccrualHistory,
  userFavorites,
  userPermissions,
  userSettings,
  users,
  workflowEmailRules,
  workflowStages,
  workflows,
  workflowTemplates,
  workflowVersions,
  workingPatterns,
  workTypes,
  xeroConnections,
  xeroWebhookEvents,
} from "./schema";

export const activityLogsRelations = relations(activityLogs, ({ one }) => ({
  tenant: one(tenants, {
    fields: [activityLogs.tenantId],
    references: [tenants.id],
  }),
  user: one(users, {
    fields: [activityLogs.userId],
    references: [users.id],
  }),
}));

export const tenantsRelations = relations(tenants, ({ many }) => ({
  activityLogs: many(activityLogs),
  amlChecks: many(amlChecks),
  announcements: many(announcements),
  calendarEvents: many(calendarEvents),
  clientContacts: many(clientContacts),
  clientDirectors: many(clientDirectors),
  clientPscs: many(clientPscs),
  clientPortalAccesses: many(clientPortalAccess),
  clientPortalInvitations: many(clientPortalInvitations),
  clientPortalSessions: many(clientPortalSession),
  clientPortalAccounts: many(clientPortalAccount),
  clientPortalUsers: many(clientPortalUsers),
  clientPortalVerifications: many(clientPortalVerification),
  clientTaskTemplateOverrides: many(clientTaskTemplateOverrides),
  clientTransactionData: many(clientTransactionData),
  compliances: many(compliance),
  clientServices: many(clientServices),
  emailQueues: many(emailQueue),
  emailTemplates: many(emailTemplates),
  feedbacks: many(feedback),
  importLogs: many(importLogs),
  departments: many(departments),
  documents: many(documents),
  invoices: many(invoices),
  kycVerifications: many(kycVerifications),
  invitations: many(invitations),
  leaveBalances: many(leaveBalances),
  leaveRequests: many(leaveRequests),
  legalPages: many(legalPages),
  messageThreads: many(messageThreads),
  notifications: many(notifications),
  onboardingResponses: many(onboardingResponses),
  leads: many(leads),
  portalCategories: many(portalCategories),
  portalLinks: many(portalLinks),
  pricingRules: many(pricingRules),
  proposalNotes: many(proposalNotes),
  proposals: many(proposals),
  proposalSignatures: many(proposalSignatures),
  proposalTemplates: many(proposalTemplates),
  proposalVersions: many(proposalVersions),
  proposalServices: many(proposalServices),
  onboardingSessions: many(onboardingSessions),
  onboardingTasks: many(onboardingTasks),
  taskTemplates: many(taskTemplates),
  staffCapacities: many(staffCapacity),
  taskAssignmentHistories: many(taskAssignmentHistory),
  taskNotes: many(taskNotes),
  rolePermissions: many(rolePermissions),
  services: many(services),
  tasks: many(tasks),
  toilAccrualHistories: many(toilAccrualHistory),
  userPermissions: many(userPermissions),
  workTypes: many(workTypes),
  timeEntries: many(timeEntries),
  workflowEmailRules: many(workflowEmailRules),
  users: many(users),
  timesheetSubmissions: many(timesheetSubmissions),
  clients: many(clients),
  documentSignatures: many(documentSignatures),
  integrationSettings: many(integrationSettings),
  workflows: many(workflows),
  workflowVersions: many(workflowVersions),
  workflowTemplates: many(workflowTemplates),
  workingPatterns: many(workingPatterns),
  xeroConnections: many(xeroConnections),
  xeroWebhookEvents: many(xeroWebhookEvents),
}));

export const usersRelations = relations(users, ({ one, many }) => ({
  activityLogs: many(activityLogs),
  amlChecks: many(amlChecks),
  announcements: many(announcements),
  calendarEvents: many(calendarEvents),
  clientPortalAccesses: many(clientPortalAccess),
  accounts: many(account),
  clientPortalInvitations_invitedBy: many(clientPortalInvitations, {
    relationName: "clientPortalInvitations_invitedBy_users_id",
  }),
  clientPortalInvitations_revokedBy: many(clientPortalInvitations, {
    relationName: "clientPortalInvitations_revokedBy_users_id",
  }),
  clientPortalUsers: many(clientPortalUsers),
  compliances_assignedToId: many(compliance, {
    relationName: "compliance_assignedToId_users_id",
  }),
  compliances_createdById: many(compliance, {
    relationName: "compliance_createdById_users_id",
  }),
  importLogs: many(importLogs),
  departments: many(departments, {
    relationName: "departments_managerId_users_id",
  }),
  documents: many(documents),
  invoices: many(invoices),
  kycVerifications: many(kycVerifications),
  invitations: many(invitations),
  leaveBalances: many(leaveBalances),
  leaveRequests_userId: many(leaveRequests, {
    relationName: "leaveRequests_userId_users_id",
  }),
  leaveRequests_reviewedBy: many(leaveRequests, {
    relationName: "leaveRequests_reviewedBy_users_id",
  }),
  legalPages: many(legalPages),
  messageThreads: many(messageThreads),
  messages: many(messages),
  notifications: many(notifications),
  leads_assignedToId: many(leads, {
    relationName: "leads_assignedToId_users_id",
  }),
  leads_createdBy: many(leads, {
    relationName: "leads_createdBy_users_id",
  }),
  portalCategories: many(portalCategories),
  portalLinks: many(portalLinks),
  proposalNotes: many(proposalNotes),
  proposals_createdById: many(proposals, {
    relationName: "proposals_createdById_users_id",
  }),
  proposals_assignedToId: many(proposals, {
    relationName: "proposals_assignedToId_users_id",
  }),
  proposalTemplates: many(proposalTemplates),
  proposalVersions: many(proposalVersions),
  onboardingSessions: many(onboardingSessions),
  onboardingTasks: many(onboardingTasks),
  sessions: many(session),
  staffCapacities: many(staffCapacity),
  taskAssignmentHistories_fromUserId: many(taskAssignmentHistory, {
    relationName: "taskAssignmentHistory_fromUserId_users_id",
  }),
  taskAssignmentHistories_toUserId: many(taskAssignmentHistory, {
    relationName: "taskAssignmentHistory_toUserId_users_id",
  }),
  taskAssignmentHistories_changedBy: many(taskAssignmentHistory, {
    relationName: "taskAssignmentHistory_changedBy_users_id",
  }),
  taskNotes: many(taskNotes),
  taskWorkflowInstances: many(taskWorkflowInstances),
  tasks_assignedToId: many(tasks, {
    relationName: "tasks_assignedToId_users_id",
  }),
  tasks_preparerId: many(tasks, {
    relationName: "tasks_preparerId_users_id",
  }),
  tasks_reviewerId: many(tasks, {
    relationName: "tasks_reviewerId_users_id",
  }),
  tasks_createdById: many(tasks, {
    relationName: "tasks_createdById_users_id",
  }),
  toilAccrualHistories: many(toilAccrualHistory),
  userFavorites: many(userFavorites),
  userPermissions: many(userPermissions),
  userSettings: many(userSettings),
  timeEntries_userId: many(timeEntries, {
    relationName: "timeEntries_userId_users_id",
  }),
  timeEntries_approvedById: many(timeEntries, {
    relationName: "timeEntries_approvedById_users_id",
  }),
  tenant: one(tenants, {
    fields: [users.tenantId],
    references: [tenants.id],
  }),
  department: one(departments, {
    fields: [users.departmentId],
    references: [departments.id],
    relationName: "users_departmentId_departments_id",
  }),
  timesheetSubmissions_userId: many(timesheetSubmissions, {
    relationName: "timesheetSubmissions_userId_users_id",
  }),
  timesheetSubmissions_reviewedBy: many(timesheetSubmissions, {
    relationName: "timesheetSubmissions_reviewedBy_users_id",
  }),
  clients_accountManagerId: many(clients, {
    relationName: "clients_accountManagerId_users_id",
  }),
  clients_createdBy: many(clients, {
    relationName: "clients_createdBy_users_id",
  }),
  calendarEventAttendees: many(calendarEventAttendees),
  messageThreadParticipants: many(messageThreadParticipants),
  workflows: many(workflows),
  workflowVersions: many(workflowVersions),
  workingPatterns: many(workingPatterns),
  xeroConnections: many(xeroConnections),
}));

export const amlChecksRelations = relations(amlChecks, ({ one }) => ({
  tenant: one(tenants, {
    fields: [amlChecks.tenantId],
    references: [tenants.id],
  }),
  client: one(clients, {
    fields: [amlChecks.clientId],
    references: [clients.id],
  }),
  onboardingSession: one(onboardingSessions, {
    fields: [amlChecks.onboardingSessionId],
    references: [onboardingSessions.id],
  }),
  user: one(users, {
    fields: [amlChecks.approvedBy],
    references: [users.id],
  }),
}));

export const clientsRelations = relations(clients, ({ one, many }) => ({
  amlChecks: many(amlChecks),
  calendarEvents: many(calendarEvents),
  clientContacts: many(clientContacts),
  clientDirectors: many(clientDirectors),
  clientPscs: many(clientPscs),
  clientPortalAccesses: many(clientPortalAccess),
  clientPortalSessions: many(clientPortalSession),
  clientPortalAccounts: many(clientPortalAccount),
  clientPortalVerifications: many(clientPortalVerification),
  clientTaskTemplateOverrides: many(clientTaskTemplateOverrides),
  clientTransactionData: many(clientTransactionData),
  compliances: many(compliance),
  clientServices: many(clientServices),
  documents: many(documents),
  invoices: many(invoices),
  kycVerifications: many(kycVerifications),
  messageThreads: many(messageThreads),
  leads: many(leads),
  proposals: many(proposals),
  onboardingSessions: many(onboardingSessions),
  tasks: many(tasks),
  timeEntries: many(timeEntries),
  tenant: one(tenants, {
    fields: [clients.tenantId],
    references: [tenants.id],
  }),
  user_accountManagerId: one(users, {
    fields: [clients.accountManagerId],
    references: [users.id],
    relationName: "clients_accountManagerId_users_id",
  }),
  user_createdBy: one(users, {
    fields: [clients.createdBy],
    references: [users.id],
    relationName: "clients_createdBy_users_id",
  }),
  xeroConnections: many(xeroConnections),
}));

export const onboardingSessionsRelations = relations(
  onboardingSessions,
  ({ one, many }) => ({
    amlChecks: many(amlChecks),
    kycVerifications: many(kycVerifications),
    onboardingResponses: many(onboardingResponses),
    tenant: one(tenants, {
      fields: [onboardingSessions.tenantId],
      references: [tenants.id],
    }),
    client: one(clients, {
      fields: [onboardingSessions.clientId],
      references: [clients.id],
    }),
    user: one(users, {
      fields: [onboardingSessions.assignedToId],
      references: [users.id],
    }),
    onboardingTasks: many(onboardingTasks),
  }),
);

export const announcementsRelations = relations(announcements, ({ one }) => ({
  tenant: one(tenants, {
    fields: [announcements.tenantId],
    references: [tenants.id],
  }),
  user: one(users, {
    fields: [announcements.createdById],
    references: [users.id],
  }),
}));

export const calendarEventsRelations = relations(
  calendarEvents,
  ({ one, many }) => ({
    tenant: one(tenants, {
      fields: [calendarEvents.tenantId],
      references: [tenants.id],
    }),
    client: one(clients, {
      fields: [calendarEvents.clientId],
      references: [clients.id],
    }),
    task: one(tasks, {
      fields: [calendarEvents.taskId],
      references: [tasks.id],
    }),
    compliance: one(compliance, {
      fields: [calendarEvents.complianceId],
      references: [compliance.id],
    }),
    user: one(users, {
      fields: [calendarEvents.createdBy],
      references: [users.id],
    }),
    calendarEventAttendees: many(calendarEventAttendees),
  }),
);

export const tasksRelations = relations(tasks, ({ one, many }) => ({
  calendarEvents: many(calendarEvents),
  documents: many(documents),
  taskAssignmentHistories: many(taskAssignmentHistory),
  taskNotes: many(taskNotes),
  taskWorkflowInstances: many(taskWorkflowInstances),
  tenant: one(tenants, {
    fields: [tasks.tenantId],
    references: [tenants.id],
  }),
  client: one(clients, {
    fields: [tasks.clientId],
    references: [clients.id],
  }),
  user_assignedToId: one(users, {
    fields: [tasks.assignedToId],
    references: [users.id],
    relationName: "tasks_assignedToId_users_id",
  }),
  user_preparerId: one(users, {
    fields: [tasks.preparerId],
    references: [users.id],
    relationName: "tasks_preparerId_users_id",
  }),
  user_reviewerId: one(users, {
    fields: [tasks.reviewerId],
    references: [users.id],
    relationName: "tasks_reviewerId_users_id",
  }),
  user_createdById: one(users, {
    fields: [tasks.createdById],
    references: [users.id],
    relationName: "tasks_createdById_users_id",
  }),
  service: one(services, {
    fields: [tasks.serviceId],
    references: [services.id],
  }),
  taskTemplate: one(taskTemplates, {
    fields: [tasks.templateId],
    references: [taskTemplates.id],
  }),
  timeEntries: many(timeEntries),
}));

export const complianceRelations = relations(compliance, ({ one, many }) => ({
  calendarEvents: many(calendarEvents),
  tenant: one(tenants, {
    fields: [compliance.tenantId],
    references: [tenants.id],
  }),
  client: one(clients, {
    fields: [compliance.clientId],
    references: [clients.id],
  }),
  user_assignedToId: one(users, {
    fields: [compliance.assignedToId],
    references: [users.id],
    relationName: "compliance_assignedToId_users_id",
  }),
  user_createdById: one(users, {
    fields: [compliance.createdById],
    references: [users.id],
    relationName: "compliance_createdById_users_id",
  }),
}));

export const clientContactsRelations = relations(clientContacts, ({ one }) => ({
  tenant: one(tenants, {
    fields: [clientContacts.tenantId],
    references: [tenants.id],
  }),
  client: one(clients, {
    fields: [clientContacts.clientId],
    references: [clients.id],
  }),
}));

export const clientDirectorsRelations = relations(
  clientDirectors,
  ({ one }) => ({
    tenant: one(tenants, {
      fields: [clientDirectors.tenantId],
      references: [tenants.id],
    }),
    client: one(clients, {
      fields: [clientDirectors.clientId],
      references: [clients.id],
    }),
  }),
);

export const clientPscsRelations = relations(clientPscs, ({ one }) => ({
  tenant: one(tenants, {
    fields: [clientPscs.tenantId],
    references: [tenants.id],
  }),
  client: one(clients, {
    fields: [clientPscs.clientId],
    references: [clients.id],
  }),
}));

export const clientPortalAccessRelations = relations(
  clientPortalAccess,
  ({ one }) => ({
    tenant: one(tenants, {
      fields: [clientPortalAccess.tenantId],
      references: [tenants.id],
    }),
    clientPortalUser: one(clientPortalUsers, {
      fields: [clientPortalAccess.portalUserId],
      references: [clientPortalUsers.id],
    }),
    client: one(clients, {
      fields: [clientPortalAccess.clientId],
      references: [clients.id],
    }),
    user: one(users, {
      fields: [clientPortalAccess.grantedBy],
      references: [users.id],
    }),
  }),
);

export const clientPortalUsersRelations = relations(
  clientPortalUsers,
  ({ one, many }) => ({
    clientPortalAccesses: many(clientPortalAccess),
    clientPortalSessions: many(clientPortalSession),
    clientPortalAccounts: many(clientPortalAccount),
    tenant: one(tenants, {
      fields: [clientPortalUsers.tenantId],
      references: [tenants.id],
    }),
    user: one(users, {
      fields: [clientPortalUsers.invitedBy],
      references: [users.id],
    }),
  }),
);

export const accountRelations = relations(account, ({ one }) => ({
  user: one(users, {
    fields: [account.userId],
    references: [users.id],
  }),
}));

export const clientPortalInvitationsRelations = relations(
  clientPortalInvitations,
  ({ one }) => ({
    tenant: one(tenants, {
      fields: [clientPortalInvitations.tenantId],
      references: [tenants.id],
    }),
    user_invitedBy: one(users, {
      fields: [clientPortalInvitations.invitedBy],
      references: [users.id],
      relationName: "clientPortalInvitations_invitedBy_users_id",
    }),
    user_revokedBy: one(users, {
      fields: [clientPortalInvitations.revokedBy],
      references: [users.id],
      relationName: "clientPortalInvitations_revokedBy_users_id",
    }),
  }),
);

export const clientPortalSessionRelations = relations(
  clientPortalSession,
  ({ one }) => ({
    tenant: one(tenants, {
      fields: [clientPortalSession.tenantId],
      references: [tenants.id],
    }),
    client: one(clients, {
      fields: [clientPortalSession.clientId],
      references: [clients.id],
    }),
    clientPortalUser: one(clientPortalUsers, {
      fields: [clientPortalSession.userId],
      references: [clientPortalUsers.id],
    }),
  }),
);

export const clientPortalAccountRelations = relations(
  clientPortalAccount,
  ({ one }) => ({
    tenant: one(tenants, {
      fields: [clientPortalAccount.tenantId],
      references: [tenants.id],
    }),
    client: one(clients, {
      fields: [clientPortalAccount.clientId],
      references: [clients.id],
    }),
    clientPortalUser: one(clientPortalUsers, {
      fields: [clientPortalAccount.userId],
      references: [clientPortalUsers.id],
    }),
  }),
);

export const clientPortalVerificationRelations = relations(
  clientPortalVerification,
  ({ one }) => ({
    tenant: one(tenants, {
      fields: [clientPortalVerification.tenantId],
      references: [tenants.id],
    }),
    client: one(clients, {
      fields: [clientPortalVerification.clientId],
      references: [clients.id],
    }),
  }),
);

export const clientTaskTemplateOverridesRelations = relations(
  clientTaskTemplateOverrides,
  ({ one }) => ({
    tenant: one(tenants, {
      fields: [clientTaskTemplateOverrides.tenantId],
      references: [tenants.id],
    }),
    client: one(clients, {
      fields: [clientTaskTemplateOverrides.clientId],
      references: [clients.id],
    }),
    taskTemplate: one(taskTemplates, {
      fields: [clientTaskTemplateOverrides.templateId],
      references: [taskTemplates.id],
    }),
  }),
);

export const taskTemplatesRelations = relations(
  taskTemplates,
  ({ one, many }) => ({
    clientTaskTemplateOverrides: many(clientTaskTemplateOverrides),
    tenant: one(tenants, {
      fields: [taskTemplates.tenantId],
      references: [tenants.id],
    }),
    service: one(services, {
      fields: [taskTemplates.serviceId],
      references: [services.id],
    }),
    tasks: many(tasks),
    workflowTemplates: many(workflowTemplates),
  }),
);

export const clientTransactionDataRelations = relations(
  clientTransactionData,
  ({ one }) => ({
    tenant: one(tenants, {
      fields: [clientTransactionData.tenantId],
      references: [tenants.id],
    }),
    lead: one(leads, {
      fields: [clientTransactionData.leadId],
      references: [leads.id],
    }),
    client: one(clients, {
      fields: [clientTransactionData.clientId],
      references: [clients.id],
    }),
  }),
);

export const leadsRelations = relations(leads, ({ one, many }) => ({
  clientTransactionData: many(clientTransactionData),
  tenant: one(tenants, {
    fields: [leads.tenantId],
    references: [tenants.id],
  }),
  user_assignedToId: one(users, {
    fields: [leads.assignedToId],
    references: [users.id],
    relationName: "leads_assignedToId_users_id",
  }),
  client: one(clients, {
    fields: [leads.convertedToClientId],
    references: [clients.id],
  }),
  user_createdBy: one(users, {
    fields: [leads.createdBy],
    references: [users.id],
    relationName: "leads_createdBy_users_id",
  }),
  proposals: many(proposals),
}));

export const clientServicesRelations = relations(clientServices, ({ one }) => ({
  tenant: one(tenants, {
    fields: [clientServices.tenantId],
    references: [tenants.id],
  }),
  client: one(clients, {
    fields: [clientServices.clientId],
    references: [clients.id],
  }),
  service: one(services, {
    fields: [clientServices.serviceId],
    references: [services.id],
  }),
}));

export const servicesRelations = relations(services, ({ one, many }) => ({
  clientServices: many(clientServices),
  pricingRules: many(pricingRules),
  taskTemplates: many(taskTemplates),
  tenant: one(tenants, {
    fields: [services.tenantId],
    references: [tenants.id],
  }),
  tasks: many(tasks),
  timeEntries: many(timeEntries),
  invoiceItems: many(invoiceItems),
  workflows: many(workflows),
}));

export const emailQueueRelations = relations(emailQueue, ({ one }) => ({
  tenant: one(tenants, {
    fields: [emailQueue.tenantId],
    references: [tenants.id],
  }),
  emailTemplate: one(emailTemplates, {
    fields: [emailQueue.emailTemplateId],
    references: [emailTemplates.id],
  }),
}));

export const emailTemplatesRelations = relations(
  emailTemplates,
  ({ one, many }) => ({
    emailQueues: many(emailQueue),
    tenant: one(tenants, {
      fields: [emailTemplates.tenantId],
      references: [tenants.id],
    }),
    workflowEmailRules: many(workflowEmailRules),
  }),
);

export const feedbackRelations = relations(feedback, ({ one }) => ({
  tenant: one(tenants, {
    fields: [feedback.tenantId],
    references: [tenants.id],
  }),
}));

export const importLogsRelations = relations(importLogs, ({ one }) => ({
  tenant: one(tenants, {
    fields: [importLogs.tenantId],
    references: [tenants.id],
  }),
  user: one(users, {
    fields: [importLogs.importedBy],
    references: [users.id],
  }),
}));

export const departmentsRelations = relations(departments, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [departments.tenantId],
    references: [tenants.id],
  }),
  user: one(users, {
    fields: [departments.managerId],
    references: [users.id],
    relationName: "departments_managerId_users_id",
  }),
  users: many(users, {
    relationName: "users_departmentId_departments_id",
  }),
}));

export const documentsRelations = relations(documents, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [documents.tenantId],
    references: [tenants.id],
  }),
  client: one(clients, {
    fields: [documents.clientId],
    references: [clients.id],
  }),
  task: one(tasks, {
    fields: [documents.taskId],
    references: [tasks.id],
  }),
  user: one(users, {
    fields: [documents.uploadedById],
    references: [users.id],
  }),
  documentSignatures: many(documentSignatures),
}));

export const invoicesRelations = relations(invoices, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [invoices.tenantId],
    references: [tenants.id],
  }),
  client: one(clients, {
    fields: [invoices.clientId],
    references: [clients.id],
  }),
  user: one(users, {
    fields: [invoices.createdById],
    references: [users.id],
  }),
  invoiceItems: many(invoiceItems),
}));

export const kycVerificationsRelations = relations(
  kycVerifications,
  ({ one }) => ({
    onboardingSession: one(onboardingSessions, {
      fields: [kycVerifications.onboardingSessionId],
      references: [onboardingSessions.id],
    }),
    tenant: one(tenants, {
      fields: [kycVerifications.tenantId],
      references: [tenants.id],
    }),
    client: one(clients, {
      fields: [kycVerifications.clientId],
      references: [clients.id],
    }),
    user: one(users, {
      fields: [kycVerifications.approvedBy],
      references: [users.id],
    }),
  }),
);

export const invitationsRelations = relations(invitations, ({ one }) => ({
  tenant: one(tenants, {
    fields: [invitations.tenantId],
    references: [tenants.id],
  }),
  user: one(users, {
    fields: [invitations.invitedBy],
    references: [users.id],
  }),
}));

export const leaveBalancesRelations = relations(leaveBalances, ({ one }) => ({
  tenant: one(tenants, {
    fields: [leaveBalances.tenantId],
    references: [tenants.id],
  }),
  user: one(users, {
    fields: [leaveBalances.userId],
    references: [users.id],
  }),
}));

export const leaveRequestsRelations = relations(leaveRequests, ({ one }) => ({
  tenant: one(tenants, {
    fields: [leaveRequests.tenantId],
    references: [tenants.id],
  }),
  user_userId: one(users, {
    fields: [leaveRequests.userId],
    references: [users.id],
    relationName: "leaveRequests_userId_users_id",
  }),
  user_reviewedBy: one(users, {
    fields: [leaveRequests.reviewedBy],
    references: [users.id],
    relationName: "leaveRequests_reviewedBy_users_id",
  }),
}));

export const legalPagesRelations = relations(legalPages, ({ one }) => ({
  tenant: one(tenants, {
    fields: [legalPages.tenantId],
    references: [tenants.id],
  }),
  user: one(users, {
    fields: [legalPages.updatedBy],
    references: [users.id],
  }),
}));

export const messageThreadsRelations = relations(
  messageThreads,
  ({ one, many }) => ({
    tenant: one(tenants, {
      fields: [messageThreads.tenantId],
      references: [tenants.id],
    }),
    client: one(clients, {
      fields: [messageThreads.clientId],
      references: [clients.id],
    }),
    user: one(users, {
      fields: [messageThreads.createdBy],
      references: [users.id],
    }),
    messages: many(messages),
    messageThreadParticipants: many(messageThreadParticipants),
  }),
);

export const messagesRelations = relations(messages, ({ one }) => ({
  messageThread: one(messageThreads, {
    fields: [messages.threadId],
    references: [messageThreads.id],
  }),
  user: one(users, {
    fields: [messages.userId],
    references: [users.id],
  }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  tenant: one(tenants, {
    fields: [notifications.tenantId],
    references: [tenants.id],
  }),
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
}));

export const onboardingResponsesRelations = relations(
  onboardingResponses,
  ({ one }) => ({
    onboardingSession: one(onboardingSessions, {
      fields: [onboardingResponses.onboardingSessionId],
      references: [onboardingSessions.id],
    }),
    tenant: one(tenants, {
      fields: [onboardingResponses.tenantId],
      references: [tenants.id],
    }),
  }),
);

export const portalCategoriesRelations = relations(
  portalCategories,
  ({ one, many }) => ({
    tenant: one(tenants, {
      fields: [portalCategories.tenantId],
      references: [tenants.id],
    }),
    user: one(users, {
      fields: [portalCategories.createdById],
      references: [users.id],
    }),
    portalLinks: many(portalLinks),
  }),
);

export const portalLinksRelations = relations(portalLinks, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [portalLinks.tenantId],
    references: [tenants.id],
  }),
  portalCategory: one(portalCategories, {
    fields: [portalLinks.categoryId],
    references: [portalCategories.id],
  }),
  user: one(users, {
    fields: [portalLinks.createdById],
    references: [users.id],
  }),
  userFavorites: many(userFavorites),
}));

export const pricingRulesRelations = relations(pricingRules, ({ one }) => ({
  tenant: one(tenants, {
    fields: [pricingRules.tenantId],
    references: [tenants.id],
  }),
  service: one(services, {
    fields: [pricingRules.componentId],
    references: [services.id],
  }),
}));

export const proposalNotesRelations = relations(proposalNotes, ({ one }) => ({
  tenant: one(tenants, {
    fields: [proposalNotes.tenantId],
    references: [tenants.id],
  }),
  proposal: one(proposals, {
    fields: [proposalNotes.proposalId],
    references: [proposals.id],
  }),
  user: one(users, {
    fields: [proposalNotes.userId],
    references: [users.id],
  }),
}));

export const proposalsRelations = relations(proposals, ({ one, many }) => ({
  proposalNotes: many(proposalNotes),
  tenant: one(tenants, {
    fields: [proposals.tenantId],
    references: [tenants.id],
  }),
  lead: one(leads, {
    fields: [proposals.leadId],
    references: [leads.id],
  }),
  client: one(clients, {
    fields: [proposals.clientId],
    references: [clients.id],
  }),
  user_createdById: one(users, {
    fields: [proposals.createdById],
    references: [users.id],
    relationName: "proposals_createdById_users_id",
  }),
  user_assignedToId: one(users, {
    fields: [proposals.assignedToId],
    references: [users.id],
    relationName: "proposals_assignedToId_users_id",
  }),
  proposalSignatures: many(proposalSignatures),
  proposalVersions: many(proposalVersions),
  proposalServices: many(proposalServices),
}));

export const proposalSignaturesRelations = relations(
  proposalSignatures,
  ({ one }) => ({
    tenant: one(tenants, {
      fields: [proposalSignatures.tenantId],
      references: [tenants.id],
    }),
    proposal: one(proposals, {
      fields: [proposalSignatures.proposalId],
      references: [proposals.id],
    }),
  }),
);

export const proposalTemplatesRelations = relations(
  proposalTemplates,
  ({ one }) => ({
    tenant: one(tenants, {
      fields: [proposalTemplates.tenantId],
      references: [tenants.id],
    }),
    user: one(users, {
      fields: [proposalTemplates.createdById],
      references: [users.id],
    }),
  }),
);

export const proposalVersionsRelations = relations(
  proposalVersions,
  ({ one }) => ({
    tenant: one(tenants, {
      fields: [proposalVersions.tenantId],
      references: [tenants.id],
    }),
    proposal: one(proposals, {
      fields: [proposalVersions.proposalId],
      references: [proposals.id],
    }),
    user: one(users, {
      fields: [proposalVersions.createdById],
      references: [users.id],
    }),
  }),
);

export const proposalServicesRelations = relations(
  proposalServices,
  ({ one }) => ({
    tenant: one(tenants, {
      fields: [proposalServices.tenantId],
      references: [tenants.id],
    }),
    proposal: one(proposals, {
      fields: [proposalServices.proposalId],
      references: [proposals.id],
    }),
  }),
);

export const onboardingTasksRelations = relations(
  onboardingTasks,
  ({ one }) => ({
    tenant: one(tenants, {
      fields: [onboardingTasks.tenantId],
      references: [tenants.id],
    }),
    onboardingSession: one(onboardingSessions, {
      fields: [onboardingTasks.sessionId],
      references: [onboardingSessions.id],
    }),
    user: one(users, {
      fields: [onboardingTasks.assignedToId],
      references: [users.id],
    }),
  }),
);

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(users, {
    fields: [session.userId],
    references: [users.id],
  }),
}));

export const staffCapacityRelations = relations(staffCapacity, ({ one }) => ({
  tenant: one(tenants, {
    fields: [staffCapacity.tenantId],
    references: [tenants.id],
  }),
  user: one(users, {
    fields: [staffCapacity.userId],
    references: [users.id],
  }),
}));

export const taskAssignmentHistoryRelations = relations(
  taskAssignmentHistory,
  ({ one }) => ({
    tenant: one(tenants, {
      fields: [taskAssignmentHistory.tenantId],
      references: [tenants.id],
    }),
    task: one(tasks, {
      fields: [taskAssignmentHistory.taskId],
      references: [tasks.id],
    }),
    user_fromUserId: one(users, {
      fields: [taskAssignmentHistory.fromUserId],
      references: [users.id],
      relationName: "taskAssignmentHistory_fromUserId_users_id",
    }),
    user_toUserId: one(users, {
      fields: [taskAssignmentHistory.toUserId],
      references: [users.id],
      relationName: "taskAssignmentHistory_toUserId_users_id",
    }),
    user_changedBy: one(users, {
      fields: [taskAssignmentHistory.changedBy],
      references: [users.id],
      relationName: "taskAssignmentHistory_changedBy_users_id",
    }),
  }),
);

export const taskNotesRelations = relations(taskNotes, ({ one }) => ({
  tenant: one(tenants, {
    fields: [taskNotes.tenantId],
    references: [tenants.id],
  }),
  task: one(tasks, {
    fields: [taskNotes.taskId],
    references: [tasks.id],
  }),
  user: one(users, {
    fields: [taskNotes.userId],
    references: [users.id],
  }),
}));

export const taskWorkflowInstancesRelations = relations(
  taskWorkflowInstances,
  ({ one }) => ({
    workflowVersion_workflowVersionId: one(workflowVersions, {
      fields: [taskWorkflowInstances.workflowVersionId],
      references: [workflowVersions.id],
      relationName:
        "taskWorkflowInstances_workflowVersionId_workflowVersions_id",
    }),
    workflowVersion_upgradedFromVersionId: one(workflowVersions, {
      fields: [taskWorkflowInstances.upgradedFromVersionId],
      references: [workflowVersions.id],
      relationName:
        "taskWorkflowInstances_upgradedFromVersionId_workflowVersions_id",
    }),
    task: one(tasks, {
      fields: [taskWorkflowInstances.taskId],
      references: [tasks.id],
    }),
    workflow: one(workflows, {
      fields: [taskWorkflowInstances.workflowId],
      references: [workflows.id],
    }),
    user: one(users, {
      fields: [taskWorkflowInstances.upgradedById],
      references: [users.id],
    }),
  }),
);

export const workflowVersionsRelations = relations(
  workflowVersions,
  ({ one, many }) => ({
    taskWorkflowInstances_workflowVersionId: many(taskWorkflowInstances, {
      relationName:
        "taskWorkflowInstances_workflowVersionId_workflowVersions_id",
    }),
    taskWorkflowInstances_upgradedFromVersionId: many(taskWorkflowInstances, {
      relationName:
        "taskWorkflowInstances_upgradedFromVersionId_workflowVersions_id",
    }),
    workflow: one(workflows, {
      fields: [workflowVersions.workflowId],
      references: [workflows.id],
    }),
    tenant: one(tenants, {
      fields: [workflowVersions.tenantId],
      references: [tenants.id],
    }),
    user: one(users, {
      fields: [workflowVersions.createdById],
      references: [users.id],
    }),
  }),
);

export const workflowsRelations = relations(workflows, ({ one, many }) => ({
  taskWorkflowInstances: many(taskWorkflowInstances),
  workflowEmailRules: many(workflowEmailRules),
  workflowStages: many(workflowStages),
  tenant: one(tenants, {
    fields: [workflows.tenantId],
    references: [tenants.id],
  }),
  service: one(services, {
    fields: [workflows.serviceId],
    references: [services.id],
  }),
  user: one(users, {
    fields: [workflows.createdById],
    references: [users.id],
  }),
  workflowVersions: many(workflowVersions),
  workflowTemplates: many(workflowTemplates),
}));

export const rolePermissionsRelations = relations(
  rolePermissions,
  ({ one }) => ({
    tenant: one(tenants, {
      fields: [rolePermissions.tenantId],
      references: [tenants.id],
    }),
  }),
);

export const toilAccrualHistoryRelations = relations(
  toilAccrualHistory,
  ({ one }) => ({
    tenant: one(tenants, {
      fields: [toilAccrualHistory.tenantId],
      references: [tenants.id],
    }),
    user: one(users, {
      fields: [toilAccrualHistory.userId],
      references: [users.id],
    }),
    timesheetSubmission: one(timesheetSubmissions, {
      fields: [toilAccrualHistory.timesheetId],
      references: [timesheetSubmissions.id],
    }),
  }),
);

export const timesheetSubmissionsRelations = relations(
  timesheetSubmissions,
  ({ one, many }) => ({
    toilAccrualHistories: many(toilAccrualHistory),
    timeEntries: many(timeEntries),
    tenant: one(tenants, {
      fields: [timesheetSubmissions.tenantId],
      references: [tenants.id],
    }),
    user_userId: one(users, {
      fields: [timesheetSubmissions.userId],
      references: [users.id],
      relationName: "timesheetSubmissions_userId_users_id",
    }),
    user_reviewedBy: one(users, {
      fields: [timesheetSubmissions.reviewedBy],
      references: [users.id],
      relationName: "timesheetSubmissions_reviewedBy_users_id",
    }),
  }),
);

export const userFavoritesRelations = relations(userFavorites, ({ one }) => ({
  user: one(users, {
    fields: [userFavorites.userId],
    references: [users.id],
  }),
  portalLink: one(portalLinks, {
    fields: [userFavorites.linkId],
    references: [portalLinks.id],
  }),
}));

export const userPermissionsRelations = relations(
  userPermissions,
  ({ one }) => ({
    tenant: one(tenants, {
      fields: [userPermissions.tenantId],
      references: [tenants.id],
    }),
    user: one(users, {
      fields: [userPermissions.userId],
      references: [users.id],
    }),
  }),
);

export const userSettingsRelations = relations(userSettings, ({ one }) => ({
  user: one(users, {
    fields: [userSettings.userId],
    references: [users.id],
  }),
}));

export const workTypesRelations = relations(workTypes, ({ one }) => ({
  tenant: one(tenants, {
    fields: [workTypes.tenantId],
    references: [tenants.id],
  }),
}));

export const timeEntriesRelations = relations(timeEntries, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [timeEntries.tenantId],
    references: [tenants.id],
  }),
  user_userId: one(users, {
    fields: [timeEntries.userId],
    references: [users.id],
    relationName: "timeEntries_userId_users_id",
  }),
  client: one(clients, {
    fields: [timeEntries.clientId],
    references: [clients.id],
  }),
  task: one(tasks, {
    fields: [timeEntries.taskId],
    references: [tasks.id],
  }),
  service: one(services, {
    fields: [timeEntries.serviceId],
    references: [services.id],
  }),
  timesheetSubmission: one(timesheetSubmissions, {
    fields: [timeEntries.submissionId],
    references: [timesheetSubmissions.id],
  }),
  user_approvedById: one(users, {
    fields: [timeEntries.approvedById],
    references: [users.id],
    relationName: "timeEntries_approvedById_users_id",
  }),
  invoiceItems: many(invoiceItems),
}));

export const workflowEmailRulesRelations = relations(
  workflowEmailRules,
  ({ one }) => ({
    tenant: one(tenants, {
      fields: [workflowEmailRules.tenantId],
      references: [tenants.id],
    }),
    workflow: one(workflows, {
      fields: [workflowEmailRules.workflowId],
      references: [workflows.id],
    }),
    emailTemplate: one(emailTemplates, {
      fields: [workflowEmailRules.emailTemplateId],
      references: [emailTemplates.id],
    }),
  }),
);

export const workflowStagesRelations = relations(workflowStages, ({ one }) => ({
  workflow: one(workflows, {
    fields: [workflowStages.workflowId],
    references: [workflows.id],
  }),
}));

export const calendarEventAttendeesRelations = relations(
  calendarEventAttendees,
  ({ one }) => ({
    calendarEvent: one(calendarEvents, {
      fields: [calendarEventAttendees.eventId],
      references: [calendarEvents.id],
    }),
    user: one(users, {
      fields: [calendarEventAttendees.userId],
      references: [users.id],
    }),
  }),
);

export const documentSignaturesRelations = relations(
  documentSignatures,
  ({ one }) => ({
    document: one(documents, {
      fields: [documentSignatures.documentId],
      references: [documents.id],
    }),
    tenant: one(tenants, {
      fields: [documentSignatures.tenantId],
      references: [tenants.id],
    }),
  }),
);

export const integrationSettingsRelations = relations(
  integrationSettings,
  ({ one }) => ({
    tenant: one(tenants, {
      fields: [integrationSettings.tenantId],
      references: [tenants.id],
    }),
  }),
);

export const invoiceItemsRelations = relations(invoiceItems, ({ one }) => ({
  invoice: one(invoices, {
    fields: [invoiceItems.invoiceId],
    references: [invoices.id],
  }),
  timeEntry: one(timeEntries, {
    fields: [invoiceItems.timeEntryId],
    references: [timeEntries.id],
  }),
  service: one(services, {
    fields: [invoiceItems.serviceId],
    references: [services.id],
  }),
}));

export const messageThreadParticipantsRelations = relations(
  messageThreadParticipants,
  ({ one }) => ({
    messageThread: one(messageThreads, {
      fields: [messageThreadParticipants.threadId],
      references: [messageThreads.id],
    }),
    user: one(users, {
      fields: [messageThreadParticipants.userId],
      references: [users.id],
    }),
  }),
);

export const workflowTemplatesRelations = relations(
  workflowTemplates,
  ({ one }) => ({
    tenant: one(tenants, {
      fields: [workflowTemplates.tenantId],
      references: [tenants.id],
    }),
    workflow: one(workflows, {
      fields: [workflowTemplates.workflowId],
      references: [workflows.id],
    }),
    taskTemplate: one(taskTemplates, {
      fields: [workflowTemplates.templateId],
      references: [taskTemplates.id],
    }),
  }),
);

export const workingPatternsRelations = relations(
  workingPatterns,
  ({ one }) => ({
    tenant: one(tenants, {
      fields: [workingPatterns.tenantId],
      references: [tenants.id],
    }),
    user: one(users, {
      fields: [workingPatterns.userId],
      references: [users.id],
    }),
  }),
);

export const xeroConnectionsRelations = relations(
  xeroConnections,
  ({ one }) => ({
    tenant: one(tenants, {
      fields: [xeroConnections.tenantId],
      references: [tenants.id],
    }),
    client: one(clients, {
      fields: [xeroConnections.clientId],
      references: [clients.id],
    }),
    user: one(users, {
      fields: [xeroConnections.connectedBy],
      references: [users.id],
    }),
  }),
);

export const xeroWebhookEventsRelations = relations(
  xeroWebhookEvents,
  ({ one }) => ({
    tenant: one(tenants, {
      fields: [xeroWebhookEvents.tenantId],
      references: [tenants.id],
    }),
  }),
);
