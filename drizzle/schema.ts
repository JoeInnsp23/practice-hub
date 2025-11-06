import { pgTable, index, foreignKey, uuid, text, varchar, jsonb, timestamp, boolean, integer, date, uniqueIndex, unique, numeric, type AnyPgColumn, real, pgView, bigint, pgEnum } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

export const announcementPriority = pgEnum("announcement_priority", ['info', 'warning', 'critical'])
export const clientStatus = pgEnum("client_status", ['prospect', 'onboarding', 'active', 'inactive', 'archived'])
export const clientType = pgEnum("client_type", ['individual', 'company', 'limited_company', 'sole_trader', 'partnership', 'llp', 'trust', 'charity', 'other'])
export const compliancePriority = pgEnum("compliance_priority", ['low', 'medium', 'high', 'urgent'])
export const complianceStatus = pgEnum("compliance_status", ['pending', 'in_progress', 'completed', 'overdue'])
export const documentType = pgEnum("document_type", ['file', 'folder'])
export const importEntityType = pgEnum("import_entity_type", ['clients', 'tasks', 'services'])
export const importStatus = pgEnum("import_status", ['pending', 'processing', 'completed', 'failed', 'partial'])
export const invoiceStatus = pgEnum("invoice_status", ['draft', 'sent', 'paid', 'overdue', 'cancelled'])
export const leadStatus = pgEnum("lead_status", ['new', 'contacted', 'qualified', 'proposal_sent', 'negotiating', 'converted', 'lost'])
export const leaveStatus = pgEnum("leave_status", ['pending', 'approved', 'rejected', 'cancelled'])
export const leaveType = pgEnum("leave_type", ['annual_leave', 'sick_leave', 'toil', 'unpaid', 'other'])
export const onboardingPriority = pgEnum("onboarding_priority", ['low', 'medium', 'high'])
export const onboardingStatus = pgEnum("onboarding_status", ['not_started', 'in_progress', 'pending_questionnaire', 'pending_approval', 'approved', 'rejected', 'completed'])
export const pricingModel = pgEnum("pricing_model", ['turnover', 'transaction', 'both', 'fixed'])
export const pricingRuleType = pgEnum("pricing_rule_type", ['turnover_band', 'transaction_band', 'employee_band', 'per_unit', 'fixed'])
export const proposalStatus = pgEnum("proposal_status", ['draft', 'sent', 'viewed', 'signed', 'rejected', 'expired'])
export const recurringFrequency = pgEnum("recurring_frequency", ['daily', 'weekly', 'monthly', 'quarterly', 'annually'])
export const salesStage = pgEnum("sales_stage", ['enquiry', 'qualified', 'proposal_sent', 'follow_up', 'won', 'lost', 'dormant'])
export const serviceComponentCategory = pgEnum("service_component_category", ['compliance', 'vat', 'bookkeeping', 'payroll', 'management', 'secretarial', 'tax_planning', 'addon'])
export const servicePriceType = pgEnum("service_price_type", ['hourly', 'fixed', 'retainer', 'project', 'percentage'])
export const taskPriority = pgEnum("task_priority", ['low', 'medium', 'high', 'urgent', 'critical'])
export const taskStatus = pgEnum("task_status", ['pending', 'in_progress', 'review', 'completed', 'cancelled', 'blocked', 'records_received', 'queries_sent', 'queries_received'])
export const timeEntryStatus = pgEnum("time_entry_status", ['draft', 'submitted', 'approved', 'rejected'])
export const transactionDataSource = pgEnum("transaction_data_source", ['xero', 'manual', 'estimated'])
export const workType = pgEnum("work_type", ['work', 'admin', 'training', 'meeting', 'business_development', 'research', 'holiday', 'sick', 'time_off_in_lieu'])


export const activityLogs = pgTable("activity_logs", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	tenantId: text("tenant_id").notNull(),
	entityType: varchar("entity_type", { length: 50 }).notNull(),
	entityId: uuid("entity_id").notNull(),
	action: varchar({ length: 50 }).notNull(),
	description: text(),
	userId: text("user_id"),
	userName: varchar("user_name", { length: 255 }),
	oldValues: jsonb("old_values"),
	newValues: jsonb("new_values"),
	ipAddress: varchar("ip_address", { length: 45 }),
	userAgent: text("user_agent"),
	metadata: jsonb(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_activity_created").using("btree", table.createdAt.asc().nullsLast().op("timestamp_ops")),
	index("idx_activity_entity").using("btree", table.entityType.asc().nullsLast().op("text_ops"), table.entityId.asc().nullsLast().op("uuid_ops")),
	index("idx_activity_tenant_entity").using("btree", table.tenantId.asc().nullsLast().op("text_ops"), table.entityType.asc().nullsLast().op("text_ops"), table.entityId.asc().nullsLast().op("text_ops")),
	index("idx_activity_user").using("btree", table.userId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.tenantId],
			foreignColumns: [tenants.id],
			name: "activity_logs_tenant_id_tenants_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "activity_logs_user_id_users_id_fk"
		}).onDelete("set null"),
]);

export const amlChecks = pgTable("aml_checks", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	tenantId: text("tenant_id").notNull(),
	clientId: uuid("client_id").notNull(),
	onboardingSessionId: uuid("onboarding_session_id"),
	provider: varchar({ length: 50 }).default('complycube').notNull(),
	checkId: varchar("check_id", { length: 255 }).notNull(),
	status: varchar({ length: 50 }).notNull(),
	riskLevel: varchar("risk_level", { length: 50 }),
	outcome: varchar({ length: 50 }),
	reportUrl: text("report_url"),
	checkedAt: timestamp("checked_at", { mode: 'string' }),
	approvedBy: text("approved_by"),
	approvedAt: timestamp("approved_at", { mode: 'string' }),
	rejectionReason: text("rejection_reason"),
	metadata: jsonb(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_aml_check_check_id").using("btree", table.checkId.asc().nullsLast().op("text_ops")),
	index("idx_aml_check_client").using("btree", table.clientId.asc().nullsLast().op("uuid_ops")),
	index("idx_aml_check_session").using("btree", table.onboardingSessionId.asc().nullsLast().op("uuid_ops")),
	index("idx_aml_check_status").using("btree", table.status.asc().nullsLast().op("text_ops")),
	index("idx_aml_check_tenant").using("btree", table.tenantId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.tenantId],
			foreignColumns: [tenants.id],
			name: "aml_checks_tenant_id_tenants_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.clientId],
			foreignColumns: [clients.id],
			name: "aml_checks_client_id_clients_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.onboardingSessionId],
			foreignColumns: [onboardingSessions.id],
			name: "aml_checks_onboarding_session_id_onboarding_sessions_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.approvedBy],
			foreignColumns: [users.id],
			name: "aml_checks_approved_by_users_id_fk"
		}),
]);

export const announcements = pgTable("announcements", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	tenantId: text("tenant_id").notNull(),
	title: varchar({ length: 200 }).notNull(),
	content: text().notNull(),
	icon: varchar({ length: 50 }).notNull(),
	iconColor: varchar("icon_color", { length: 7 }).notNull(),
	priority: announcementPriority().default('info').notNull(),
	isPinned: boolean("is_pinned").default(false).notNull(),
	publishedAt: timestamp("published_at", { mode: 'string' }).defaultNow().notNull(),
	startsAt: timestamp("starts_at", { mode: 'string' }),
	endsAt: timestamp("ends_at", { mode: 'string' }),
	isActive: boolean("is_active").default(true).notNull(),
	createdById: text("created_by_id").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("announcements_ends_at_idx").using("btree", table.tenantId.asc().nullsLast().op("text_ops"), table.endsAt.asc().nullsLast().op("timestamp_ops")),
	index("announcements_pin_created_idx").using("btree", table.tenantId.asc().nullsLast().op("bool_ops"), table.isPinned.asc().nullsLast().op("text_ops"), table.createdAt.asc().nullsLast().op("text_ops")),
	index("announcements_starts_at_idx").using("btree", table.tenantId.asc().nullsLast().op("timestamp_ops"), table.startsAt.asc().nullsLast().op("timestamp_ops")),
	index("announcements_tenant_active_idx").using("btree", table.tenantId.asc().nullsLast().op("bool_ops"), table.isActive.asc().nullsLast().op("bool_ops")),
	foreignKey({
			columns: [table.tenantId],
			foreignColumns: [tenants.id],
			name: "announcements_tenant_id_tenants_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.createdById],
			foreignColumns: [users.id],
			name: "announcements_created_by_id_users_id_fk"
		}),
]);

export const calendarEvents = pgTable("calendar_events", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	tenantId: text("tenant_id").notNull(),
	title: varchar({ length: 255 }).notNull(),
	description: text(),
	type: varchar({ length: 30 }).notNull(),
	startTime: timestamp("start_time", { mode: 'string' }).notNull(),
	endTime: timestamp("end_time", { mode: 'string' }).notNull(),
	allDay: boolean("all_day").default(false).notNull(),
	location: varchar({ length: 255 }),
	clientId: uuid("client_id"),
	taskId: uuid("task_id"),
	complianceId: uuid("compliance_id"),
	createdBy: text("created_by").notNull(),
	metadata: jsonb(),
	reminderMinutes: integer("reminder_minutes"),
	isRecurring: boolean("is_recurring").default(false).notNull(),
	recurrenceRule: text("recurrence_rule"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("calendar_events_client_idx").using("btree", table.clientId.asc().nullsLast().op("uuid_ops")),
	index("calendar_events_start_time_idx").using("btree", table.startTime.asc().nullsLast().op("timestamp_ops")),
	index("calendar_events_task_idx").using("btree", table.taskId.asc().nullsLast().op("uuid_ops")),
	index("calendar_events_tenant_idx").using("btree", table.tenantId.asc().nullsLast().op("text_ops")),
	index("calendar_events_type_idx").using("btree", table.type.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.tenantId],
			foreignColumns: [tenants.id],
			name: "calendar_events_tenant_id_tenants_id_fk"
		}),
	foreignKey({
			columns: [table.clientId],
			foreignColumns: [clients.id],
			name: "calendar_events_client_id_clients_id_fk"
		}),
	foreignKey({
			columns: [table.taskId],
			foreignColumns: [tasks.id],
			name: "calendar_events_task_id_tasks_id_fk"
		}),
	foreignKey({
			columns: [table.complianceId],
			foreignColumns: [compliance.id],
			name: "calendar_events_compliance_id_compliance_id_fk"
		}),
	foreignKey({
			columns: [table.createdBy],
			foreignColumns: [users.id],
			name: "calendar_events_created_by_users_id_fk"
		}),
]);

export const clientContacts = pgTable("client_contacts", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	tenantId: text("tenant_id").notNull(),
	clientId: uuid("client_id").notNull(),
	isPrimary: boolean("is_primary").default(false).notNull(),
	title: varchar({ length: 50 }),
	firstName: varchar("first_name", { length: 100 }).notNull(),
	middleName: varchar("middle_name", { length: 100 }),
	lastName: varchar("last_name", { length: 100 }).notNull(),
	email: varchar({ length: 255 }),
	phone: varchar({ length: 50 }),
	mobile: varchar({ length: 50 }),
	jobTitle: varchar("job_title", { length: 100 }),
	position: varchar({ length: 100 }),
	department: varchar({ length: 100 }),
	addressLine1: varchar("address_line_1", { length: 255 }),
	addressLine2: varchar("address_line_2", { length: 255 }),
	city: varchar({ length: 100 }),
	region: varchar({ length: 100 }),
	postalCode: varchar("postal_code", { length: 20 }),
	country: varchar({ length: 100 }),
	notes: text(),
	isActive: boolean("is_active").default(true).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_client_contact").using("btree", table.clientId.asc().nullsLast().op("uuid_ops")),
	index("idx_primary_contact").using("btree", table.clientId.asc().nullsLast().op("bool_ops"), table.isPrimary.asc().nullsLast().op("bool_ops")),
	foreignKey({
			columns: [table.tenantId],
			foreignColumns: [tenants.id],
			name: "client_contacts_tenant_id_tenants_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.clientId],
			foreignColumns: [clients.id],
			name: "client_contacts_client_id_clients_id_fk"
		}).onDelete("cascade"),
]);

export const clientDirectors = pgTable("client_directors", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	tenantId: text("tenant_id").notNull(),
	clientId: uuid("client_id").notNull(),
	name: varchar({ length: 255 }).notNull(),
	officerRole: varchar("officer_role", { length: 100 }),
	appointedOn: date("appointed_on"),
	resignedOn: date("resigned_on"),
	isActive: boolean("is_active").default(true).notNull(),
	nationality: varchar({ length: 100 }),
	occupation: varchar({ length: 100 }),
	dateOfBirth: varchar("date_of_birth", { length: 20 }),
	address: text(),
	metadata: jsonb(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_client_director").using("btree", table.clientId.asc().nullsLast().op("uuid_ops")),
	index("idx_director_active").using("btree", table.isActive.asc().nullsLast().op("bool_ops")),
	foreignKey({
			columns: [table.tenantId],
			foreignColumns: [tenants.id],
			name: "client_directors_tenant_id_tenants_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.clientId],
			foreignColumns: [clients.id],
			name: "client_directors_client_id_clients_id_fk"
		}).onDelete("cascade"),
]);

export const clientPscs = pgTable("client_pscs", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	tenantId: text("tenant_id").notNull(),
	clientId: uuid("client_id").notNull(),
	name: varchar({ length: 255 }).notNull(),
	kind: varchar({ length: 100 }),
	notifiedOn: date("notified_on"),
	ceasedOn: date("ceased_on"),
	isActive: boolean("is_active").default(true).notNull(),
	nationality: varchar({ length: 100 }),
	dateOfBirth: varchar("date_of_birth", { length: 20 }),
	naturesOfControl: jsonb("natures_of_control"),
	address: text(),
	metadata: jsonb(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_client_psc").using("btree", table.clientId.asc().nullsLast().op("uuid_ops")),
	index("idx_psc_active").using("btree", table.isActive.asc().nullsLast().op("bool_ops")),
	foreignKey({
			columns: [table.tenantId],
			foreignColumns: [tenants.id],
			name: "client_pscs_tenant_id_tenants_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.clientId],
			foreignColumns: [clients.id],
			name: "client_pscs_client_id_clients_id_fk"
		}).onDelete("cascade"),
]);

export const clientPortalAccess = pgTable("client_portal_access", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	tenantId: text("tenant_id").notNull(),
	portalUserId: text("portal_user_id").notNull(),
	clientId: uuid("client_id").notNull(),
	role: varchar({ length: 50 }).default('viewer').notNull(),
	grantedBy: text("granted_by"),
	grantedAt: timestamp("granted_at", { mode: 'string' }).defaultNow().notNull(),
	expiresAt: timestamp("expires_at", { mode: 'string' }),
	isActive: boolean("is_active").default(true).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("client_portal_access_client_idx").using("btree", table.clientId.asc().nullsLast().op("uuid_ops")),
	index("client_portal_access_tenant_idx").using("btree", table.tenantId.asc().nullsLast().op("text_ops")),
	uniqueIndex("client_portal_access_user_client_idx").using("btree", table.portalUserId.asc().nullsLast().op("uuid_ops"), table.clientId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.tenantId],
			foreignColumns: [tenants.id],
			name: "client_portal_access_tenant_id_tenants_id_fk"
		}),
	foreignKey({
			columns: [table.portalUserId],
			foreignColumns: [clientPortalUsers.id],
			name: "client_portal_access_portal_user_id_client_portal_users_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.clientId],
			foreignColumns: [clients.id],
			name: "client_portal_access_client_id_clients_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.grantedBy],
			foreignColumns: [users.id],
			name: "client_portal_access_granted_by_users_id_fk"
		}),
]);

export const account = pgTable("account", {
	id: text().primaryKey().notNull(),
	accountId: text("account_id").notNull(),
	providerId: text("provider_id").notNull(),
	userId: text("user_id").notNull(),
	accessToken: text("access_token"),
	refreshToken: text("refresh_token"),
	idToken: text("id_token"),
	accessTokenExpiresAt: timestamp("access_token_expires_at", { mode: 'string' }),
	refreshTokenExpiresAt: timestamp("refresh_token_expires_at", { mode: 'string' }),
	scope: text(),
	password: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "account_user_id_users_id_fk"
		}).onDelete("cascade"),
]);

export const clientPortalInvitations = pgTable("client_portal_invitations", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	tenantId: text("tenant_id").notNull(),
	email: text().notNull(),
	firstName: varchar("first_name", { length: 100 }),
	lastName: varchar("last_name", { length: 100 }),
	clientIds: jsonb("client_ids").notNull(),
	role: varchar({ length: 50 }).default('viewer').notNull(),
	token: text().notNull(),
	invitedBy: text("invited_by").notNull(),
	status: varchar({ length: 20 }).default('pending').notNull(),
	sentAt: timestamp("sent_at", { mode: 'string' }).defaultNow().notNull(),
	expiresAt: timestamp("expires_at", { mode: 'string' }).notNull(),
	acceptedAt: timestamp("accepted_at", { mode: 'string' }),
	revokedAt: timestamp("revoked_at", { mode: 'string' }),
	revokedBy: text("revoked_by"),
	metadata: jsonb(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("client_portal_invitations_email_idx").using("btree", table.email.asc().nullsLast().op("text_ops")),
	index("client_portal_invitations_status_idx").using("btree", table.status.asc().nullsLast().op("text_ops")),
	index("client_portal_invitations_tenant_idx").using("btree", table.tenantId.asc().nullsLast().op("text_ops")),
	uniqueIndex("client_portal_invitations_token_idx").using("btree", table.token.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.tenantId],
			foreignColumns: [tenants.id],
			name: "client_portal_invitations_tenant_id_tenants_id_fk"
		}),
	foreignKey({
			columns: [table.invitedBy],
			foreignColumns: [users.id],
			name: "client_portal_invitations_invited_by_users_id_fk"
		}),
	foreignKey({
			columns: [table.revokedBy],
			foreignColumns: [users.id],
			name: "client_portal_invitations_revoked_by_users_id_fk"
		}),
	unique("client_portal_invitations_token_unique").on(table.token),
]);

export const clientPortalSession = pgTable("client_portal_session", {
	id: text().primaryKey().notNull(),
	tenantId: text("tenant_id").notNull(),
	clientId: uuid("client_id").notNull(),
	expiresAt: timestamp("expires_at", { mode: 'string' }).notNull(),
	token: text().notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
	ipAddress: text("ip_address"),
	userAgent: text("user_agent"),
	userId: text("user_id").notNull(),
}, (table) => [
	foreignKey({
			columns: [table.tenantId],
			foreignColumns: [tenants.id],
			name: "client_portal_session_tenant_id_tenants_id_fk"
		}),
	foreignKey({
			columns: [table.clientId],
			foreignColumns: [clients.id],
			name: "client_portal_session_client_id_clients_id_fk"
		}),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [clientPortalUsers.id],
			name: "client_portal_session_user_id_client_portal_users_id_fk"
		}).onDelete("cascade"),
	unique("client_portal_session_token_unique").on(table.token),
]);

export const clientPortalAccount = pgTable("client_portal_account", {
	id: text().primaryKey().notNull(),
	tenantId: text("tenant_id").notNull(),
	clientId: uuid("client_id").notNull(),
	accountId: text("account_id").notNull(),
	providerId: text("provider_id").notNull(),
	userId: text("user_id").notNull(),
	accessToken: text("access_token"),
	refreshToken: text("refresh_token"),
	idToken: text("id_token"),
	accessTokenExpiresAt: timestamp("access_token_expires_at", { mode: 'string' }),
	refreshTokenExpiresAt: timestamp("refresh_token_expires_at", { mode: 'string' }),
	scope: text(),
	password: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.tenantId],
			foreignColumns: [tenants.id],
			name: "client_portal_account_tenant_id_tenants_id_fk"
		}),
	foreignKey({
			columns: [table.clientId],
			foreignColumns: [clients.id],
			name: "client_portal_account_client_id_clients_id_fk"
		}),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [clientPortalUsers.id],
			name: "client_portal_account_user_id_client_portal_users_id_fk"
		}).onDelete("cascade"),
]);

export const clientPortalUsers = pgTable("client_portal_users", {
	id: text().primaryKey().notNull(),
	tenantId: text("tenant_id").notNull(),
	email: text().notNull(),
	firstName: varchar("first_name", { length: 100 }),
	lastName: varchar("last_name", { length: 100 }),
	phone: varchar({ length: 50 }),
	status: varchar({ length: 20 }).default('active').notNull(),
	lastLoginAt: timestamp("last_login_at", { mode: 'string' }),
	invitedBy: text("invited_by"),
	invitedAt: timestamp("invited_at", { mode: 'string' }),
	acceptedAt: timestamp("accepted_at", { mode: 'string' }),
	metadata: jsonb(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("client_portal_users_email_idx").using("btree", table.email.asc().nullsLast().op("text_ops")),
	index("client_portal_users_tenant_idx").using("btree", table.tenantId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.tenantId],
			foreignColumns: [tenants.id],
			name: "client_portal_users_tenant_id_tenants_id_fk"
		}),
	foreignKey({
			columns: [table.invitedBy],
			foreignColumns: [users.id],
			name: "client_portal_users_invited_by_users_id_fk"
		}),
]);

export const clientPortalVerification = pgTable("client_portal_verification", {
	id: text().primaryKey().notNull(),
	tenantId: text("tenant_id").notNull(),
	clientId: uuid("client_id").notNull(),
	identifier: text().notNull(),
	value: text().notNull(),
	expiresAt: timestamp("expires_at", { mode: 'string' }).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.tenantId],
			foreignColumns: [tenants.id],
			name: "client_portal_verification_tenant_id_tenants_id_fk"
		}),
	foreignKey({
			columns: [table.clientId],
			foreignColumns: [clients.id],
			name: "client_portal_verification_client_id_clients_id_fk"
		}),
]);

export const clientTaskTemplateOverrides = pgTable("client_task_template_overrides", {
	id: text().primaryKey().notNull(),
	tenantId: text("tenant_id").notNull(),
	clientId: uuid("client_id").notNull(),
	templateId: text("template_id").notNull(),
	customDueDate: date("custom_due_date"),
	customPriority: taskPriority("custom_priority"),
	isDisabled: boolean("is_disabled").default(false).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	uniqueIndex("client_task_template_overrides_client_template_unique").using("btree", table.clientId.asc().nullsLast().op("text_ops"), table.templateId.asc().nullsLast().op("text_ops")),
	index("client_task_template_overrides_tenant_id_idx").using("btree", table.tenantId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.tenantId],
			foreignColumns: [tenants.id],
			name: "client_task_template_overrides_tenant_id_tenants_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.clientId],
			foreignColumns: [clients.id],
			name: "client_task_template_overrides_client_id_clients_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.templateId],
			foreignColumns: [taskTemplates.id],
			name: "client_task_template_overrides_template_id_task_templates_id_fk"
		}).onDelete("cascade"),
]);

export const clientTransactionData = pgTable("client_transaction_data", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	tenantId: text("tenant_id").notNull(),
	leadId: uuid("lead_id"),
	clientId: uuid("client_id"),
	monthlyTransactions: integer("monthly_transactions").notNull(),
	dataSource: transactionDataSource("data_source").notNull(),
	xeroDataJson: jsonb("xero_data_json"),
	lastUpdated: timestamp("last_updated", { mode: 'string' }).defaultNow().notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_transaction_data_client").using("btree", table.clientId.asc().nullsLast().op("uuid_ops")),
	index("idx_transaction_data_lead").using("btree", table.leadId.asc().nullsLast().op("uuid_ops")),
	index("idx_transaction_data_tenant").using("btree", table.tenantId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.tenantId],
			foreignColumns: [tenants.id],
			name: "client_transaction_data_tenant_id_tenants_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.leadId],
			foreignColumns: [leads.id],
			name: "client_transaction_data_lead_id_leads_id_fk"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.clientId],
			foreignColumns: [clients.id],
			name: "client_transaction_data_client_id_clients_id_fk"
		}).onDelete("cascade"),
]);

export const compliance = pgTable("compliance", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	tenantId: text("tenant_id").notNull(),
	title: varchar({ length: 255 }).notNull(),
	type: varchar({ length: 100 }).notNull(),
	description: text(),
	clientId: uuid("client_id").notNull(),
	assignedToId: text("assigned_to_id"),
	dueDate: timestamp("due_date", { mode: 'string' }).notNull(),
	completedDate: timestamp("completed_date", { mode: 'string' }),
	reminderDate: timestamp("reminder_date", { mode: 'string' }),
	status: complianceStatus().default('pending').notNull(),
	priority: compliancePriority().default('medium').notNull(),
	notes: text(),
	attachments: jsonb(),
	metadata: jsonb(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
	createdById: text("created_by_id"),
}, (table) => [
	index("idx_compliance_assignee").using("btree", table.assignedToId.asc().nullsLast().op("text_ops")),
	index("idx_compliance_client").using("btree", table.clientId.asc().nullsLast().op("uuid_ops")),
	index("idx_compliance_due_date").using("btree", table.dueDate.asc().nullsLast().op("timestamp_ops")),
	index("idx_compliance_status").using("btree", table.status.asc().nullsLast().op("enum_ops")),
	index("idx_compliance_type").using("btree", table.type.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.tenantId],
			foreignColumns: [tenants.id],
			name: "compliance_tenant_id_tenants_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.clientId],
			foreignColumns: [clients.id],
			name: "compliance_client_id_clients_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.assignedToId],
			foreignColumns: [users.id],
			name: "compliance_assigned_to_id_users_id_fk"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.createdById],
			foreignColumns: [users.id],
			name: "compliance_created_by_id_users_id_fk"
		}).onDelete("set null"),
]);

export const companiesHouseCache = pgTable("companies_house_cache", {
	id: text().primaryKey().notNull(),
	companyNumber: text("company_number").notNull(),
	cachedData: jsonb("cached_data").notNull(),
	cachedAt: timestamp("cached_at", { mode: 'string' }).defaultNow().notNull(),
	expiresAt: timestamp("expires_at", { mode: 'string' }).notNull(),
}, (table) => [
	uniqueIndex("companies_house_cache_company_number_idx").using("btree", table.companyNumber.asc().nullsLast().op("text_ops")),
	index("companies_house_cache_expires_at_idx").using("btree", table.expiresAt.asc().nullsLast().op("timestamp_ops")),
	unique("companies_house_cache_company_number_unique").on(table.companyNumber),
]);

export const companiesHouseRateLimit = pgTable("companies_house_rate_limit", {
	id: text().default('global').primaryKey().notNull(),
	requestsCount: integer("requests_count").default(0).notNull(),
	windowStart: timestamp("window_start", { mode: 'string' }).notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
});

export const clientServices = pgTable("client_services", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	tenantId: text("tenant_id").notNull(),
	clientId: uuid("client_id").notNull(),
	serviceId: uuid("service_id").notNull(),
	customRate: numeric("custom_rate", { precision: 10, scale:  2 }),
	startDate: date("start_date"),
	endDate: date("end_date"),
	isActive: boolean("is_active").default(true).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	uniqueIndex("idx_client_service").using("btree", table.clientId.asc().nullsLast().op("uuid_ops"), table.serviceId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.tenantId],
			foreignColumns: [tenants.id],
			name: "client_services_tenant_id_tenants_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.clientId],
			foreignColumns: [clients.id],
			name: "client_services_client_id_clients_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.serviceId],
			foreignColumns: [services.id],
			name: "client_services_service_id_services_id_fk"
		}).onDelete("cascade"),
]);

export const emailQueue = pgTable("email_queue", {
	id: text().primaryKey().notNull(),
	tenantId: text("tenant_id").notNull(),
	emailTemplateId: text("email_template_id"),
	recipientEmail: text("recipient_email").notNull(),
	recipientName: text("recipient_name"),
	subject: text().notNull(),
	bodyHtml: text("body_html").notNull(),
	bodyText: text("body_text"),
	variables: jsonb(),
	status: text().notNull(),
	sendAt: timestamp("send_at", { mode: 'string' }).notNull(),
	sentAt: timestamp("sent_at", { mode: 'string' }),
	errorMessage: text("error_message"),
	attempts: integer().default(0).notNull(),
	maxAttempts: integer("max_attempts").default(3).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("email_queue_recipient_email_idx").using("btree", table.recipientEmail.asc().nullsLast().op("text_ops")),
	index("email_queue_send_at_idx").using("btree", table.sendAt.asc().nullsLast().op("timestamp_ops")),
	index("email_queue_status_idx").using("btree", table.status.asc().nullsLast().op("text_ops")),
	index("email_queue_template_id_idx").using("btree", table.emailTemplateId.asc().nullsLast().op("text_ops")),
	index("email_queue_tenant_id_idx").using("btree", table.tenantId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.tenantId],
			foreignColumns: [tenants.id],
			name: "email_queue_tenant_id_tenants_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.emailTemplateId],
			foreignColumns: [emailTemplates.id],
			name: "email_queue_email_template_id_email_templates_id_fk"
		}),
]);

export const emailTemplates = pgTable("email_templates", {
	id: text().primaryKey().notNull(),
	tenantId: text("tenant_id").notNull(),
	templateName: text("template_name").notNull(),
	templateType: text("template_type").notNull(),
	subject: text().notNull(),
	bodyHtml: text("body_html").notNull(),
	bodyText: text("body_text"),
	variables: text().array(),
	isActive: boolean("is_active").default(true).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("email_templates_active_idx").using("btree", table.isActive.asc().nullsLast().op("bool_ops")),
	index("email_templates_tenant_id_idx").using("btree", table.tenantId.asc().nullsLast().op("text_ops")),
	index("email_templates_type_idx").using("btree", table.templateType.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.tenantId],
			foreignColumns: [tenants.id],
			name: "email_templates_tenant_id_tenants_id_fk"
		}).onDelete("cascade"),
]);

export const feedback = pgTable("feedback", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	tenantId: text("tenant_id").notNull(),
	userId: varchar("user_id", { length: 255 }).notNull(),
	userEmail: varchar("user_email", { length: 255 }).notNull(),
	userName: varchar("user_name", { length: 255 }),
	userRole: varchar("user_role", { length: 50 }),
	type: varchar({ length: 50 }).notNull(),
	title: varchar({ length: 255 }).notNull(),
	description: text().notNull(),
	category: varchar({ length: 50 }),
	pageUrl: varchar("page_url", { length: 500 }),
	userAgent: text("user_agent"),
	consoleLogs: text("console_logs"),
	screenshot: text(),
	status: varchar({ length: 50 }).default('new'),
	priority: varchar({ length: 20 }).default('medium'),
	assignedTo: varchar("assigned_to", { length: 255 }),
	adminNotes: text("admin_notes"),
	resolution: text(),
	resolvedAt: timestamp("resolved_at", { mode: 'string' }),
	resolvedBy: varchar("resolved_by", { length: 255 }),
	metadata: jsonb(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_feedback_created_at").using("btree", table.createdAt.asc().nullsLast().op("timestamp_ops")),
	index("idx_feedback_tenant_status").using("btree", table.tenantId.asc().nullsLast().op("text_ops"), table.status.asc().nullsLast().op("text_ops")),
	index("idx_feedback_type").using("btree", table.type.asc().nullsLast().op("text_ops"), table.status.asc().nullsLast().op("text_ops")),
	index("idx_feedback_user").using("btree", table.userId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.tenantId],
			foreignColumns: [tenants.id],
			name: "feedback_tenant_id_tenants_id_fk"
		}).onDelete("cascade"),
]);

export const importLogs = pgTable("import_logs", {
	id: text().primaryKey().notNull(),
	tenantId: text("tenant_id").notNull(),
	entityType: importEntityType("entity_type").notNull(),
	fileName: text("file_name").notNull(),
	status: importStatus().default('pending').notNull(),
	totalRows: integer("total_rows").notNull(),
	processedRows: integer("processed_rows").default(0).notNull(),
	failedRows: integer("failed_rows").default(0).notNull(),
	skippedRows: integer("skipped_rows").default(0).notNull(),
	errors: jsonb(),
	dryRun: boolean("dry_run").default(false).notNull(),
	importedBy: text("imported_by").notNull(),
	startedAt: timestamp("started_at", { mode: 'string' }).defaultNow().notNull(),
	completedAt: timestamp("completed_at", { mode: 'string' }),
	metadata: jsonb(),
}, (table) => [
	index("import_logs_entity_type_idx").using("btree", table.entityType.asc().nullsLast().op("enum_ops")),
	index("import_logs_imported_by_idx").using("btree", table.importedBy.asc().nullsLast().op("text_ops")),
	index("import_logs_started_at_idx").using("btree", table.startedAt.asc().nullsLast().op("timestamp_ops")),
	index("import_logs_status_idx").using("btree", table.status.asc().nullsLast().op("enum_ops")),
	index("import_logs_tenant_id_idx").using("btree", table.tenantId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.tenantId],
			foreignColumns: [tenants.id],
			name: "import_logs_tenant_id_tenants_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.importedBy],
			foreignColumns: [users.id],
			name: "import_logs_imported_by_users_id_fk"
		}).onDelete("set null"),
]);

export const departments = pgTable("departments", {
	id: text().primaryKey().notNull(),
	tenantId: text("tenant_id").notNull(),
	name: text().notNull(),
	description: text(),
	managerId: text("manager_id"),
	isActive: boolean("is_active").default(true).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.tenantId],
			foreignColumns: [tenants.id],
			name: "departments_tenant_id_tenants_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.managerId],
			foreignColumns: [users.id],
			name: "departments_manager_id_users_id_fk"
		}),
]);

export const documents = pgTable("documents", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	tenantId: text("tenant_id").notNull(),
	name: varchar({ length: 255 }).notNull(),
	type: documentType().notNull(),
	mimeType: varchar("mime_type", { length: 100 }),
	size: integer(),
	url: text(),
	thumbnailUrl: text("thumbnail_url"),
	parentId: uuid("parent_id"),
	path: text(),
	clientId: uuid("client_id"),
	taskId: uuid("task_id"),
	description: text(),
	tags: jsonb(),
	version: integer().default(1),
	isArchived: boolean("is_archived").default(false),
	isPublic: boolean("is_public").default(false),
	shareToken: varchar("share_token", { length: 100 }),
	shareExpiresAt: timestamp("share_expires_at", { mode: 'string' }),
	uploadedById: text("uploaded_by_id").notNull(),
	requiresSignature: boolean("requires_signature").default(false).notNull(),
	signatureStatus: varchar("signature_status", { length: 20 }).default('none'),
	docusealSubmissionId: text("docuseal_submission_id"),
	docusealTemplateId: text("docuseal_template_id"),
	signedPdfUrl: text("signed_pdf_url"),
	signedPdfKey: text("signed_pdf_key"),
	signedPdfUrlExpiresAt: timestamp("signed_pdf_url_expires_at", { mode: 'string' }),
	signedAt: timestamp("signed_at", { mode: 'string' }),
	signedBy: varchar("signed_by", { length: 255 }),
	metadata: jsonb(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_document_client").using("btree", table.clientId.asc().nullsLast().op("uuid_ops")),
	index("idx_document_parent").using("btree", table.parentId.asc().nullsLast().op("uuid_ops")),
	index("idx_document_path").using("btree", table.path.asc().nullsLast().op("text_ops")),
	index("idx_document_share_token").using("btree", table.shareToken.asc().nullsLast().op("text_ops")),
	index("idx_document_task").using("btree", table.taskId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.tenantId],
			foreignColumns: [tenants.id],
			name: "documents_tenant_id_tenants_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.clientId],
			foreignColumns: [clients.id],
			name: "documents_client_id_clients_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.taskId],
			foreignColumns: [tasks.id],
			name: "documents_task_id_tasks_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.uploadedById],
			foreignColumns: [users.id],
			name: "documents_uploaded_by_id_users_id_fk"
		}).onDelete("set null"),
]);

export const invoices = pgTable("invoices", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	tenantId: text("tenant_id").notNull(),
	invoiceNumber: varchar("invoice_number", { length: 50 }).notNull(),
	clientId: uuid("client_id").notNull(),
	issueDate: date("issue_date").notNull(),
	dueDate: date("due_date").notNull(),
	paidDate: date("paid_date"),
	subtotal: numeric({ precision: 10, scale:  2 }).notNull(),
	taxRate: numeric("tax_rate", { precision: 5, scale:  2 }).default('0'),
	taxAmount: numeric("tax_amount", { precision: 10, scale:  2 }).default('0'),
	discount: numeric({ precision: 10, scale:  2 }).default('0'),
	total: numeric({ precision: 10, scale:  2 }).notNull(),
	amountPaid: numeric("amount_paid", { precision: 10, scale:  2 }).default('0'),
	status: invoiceStatus().default('draft').notNull(),
	currency: varchar({ length: 3 }).default('GBP'),
	notes: text(),
	terms: text(),
	poNumber: varchar("po_number", { length: 100 }),
	xeroInvoiceId: text("xero_invoice_id"),
	xeroSyncStatus: text("xero_sync_status"),
	xeroLastSyncedAt: timestamp("xero_last_synced_at", { mode: 'string' }),
	xeroSyncError: text("xero_sync_error"),
	metadata: jsonb(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
	createdById: text("created_by_id"),
}, (table) => [
	index("idx_invoice_client").using("btree", table.clientId.asc().nullsLast().op("uuid_ops")),
	index("idx_invoice_due_date").using("btree", table.dueDate.asc().nullsLast().op("date_ops")),
	index("idx_invoice_status").using("btree", table.status.asc().nullsLast().op("enum_ops")),
	index("idx_invoice_xero_id").using("btree", table.xeroInvoiceId.asc().nullsLast().op("text_ops")),
	index("idx_invoice_xero_sync_status").using("btree", table.xeroSyncStatus.asc().nullsLast().op("text_ops")),
	uniqueIndex("idx_tenant_invoice_number").using("btree", table.tenantId.asc().nullsLast().op("text_ops"), table.invoiceNumber.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.tenantId],
			foreignColumns: [tenants.id],
			name: "invoices_tenant_id_tenants_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.clientId],
			foreignColumns: [clients.id],
			name: "invoices_client_id_clients_id_fk"
		}).onDelete("restrict"),
	foreignKey({
			columns: [table.createdById],
			foreignColumns: [users.id],
			name: "invoices_created_by_id_users_id_fk"
		}).onDelete("set null"),
]);

export const kycVerifications = pgTable("kyc_verifications", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	tenantId: text("tenant_id").notNull(),
	clientId: uuid("client_id").notNull(),
	onboardingSessionId: uuid("onboarding_session_id"),
	lemverifyId: varchar("lemverify_id", { length: 255 }).notNull(),
	clientRef: varchar("client_ref", { length: 255 }).notNull(),
	status: varchar({ length: 50 }).notNull(),
	outcome: varchar({ length: 50 }),
	documentType: varchar("document_type", { length: 50 }),
	documentVerified: boolean("document_verified").default(false),
	documentData: jsonb("document_data"),
	facematchResult: varchar("facematch_result", { length: 50 }),
	facematchScore: numeric("facematch_score", { precision: 5, scale:  2 }),
	livenessResult: varchar("liveness_result", { length: 50 }),
	livenessScore: numeric("liveness_score", { precision: 5, scale:  2 }),
	amlResult: jsonb("aml_result"),
	amlStatus: varchar("aml_status", { length: 50 }),
	pepMatch: boolean("pep_match").default(false),
	sanctionsMatch: boolean("sanctions_match").default(false),
	watchlistMatch: boolean("watchlist_match").default(false),
	adverseMediaMatch: boolean("adverse_media_match").default(false),
	reportUrl: text("report_url"),
	documentsUrl: jsonb("documents_url"),
	approvedBy: text("approved_by"),
	approvedAt: timestamp("approved_at", { mode: 'string' }),
	rejectionReason: text("rejection_reason"),
	metadata: jsonb(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	completedAt: timestamp("completed_at", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_kyc_verification_client").using("btree", table.clientId.asc().nullsLast().op("uuid_ops")),
	index("idx_kyc_verification_lemverify_id").using("btree", table.lemverifyId.asc().nullsLast().op("text_ops")),
	index("idx_kyc_verification_session").using("btree", table.onboardingSessionId.asc().nullsLast().op("uuid_ops")),
	index("idx_kyc_verification_status").using("btree", table.status.asc().nullsLast().op("text_ops")),
	index("idx_kyc_verification_tenant").using("btree", table.tenantId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.onboardingSessionId],
			foreignColumns: [onboardingSessions.id],
			name: "kyc_verifications_onboarding_session_id_onboarding_sessions_id_"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.tenantId],
			foreignColumns: [tenants.id],
			name: "kyc_verifications_tenant_id_tenants_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.clientId],
			foreignColumns: [clients.id],
			name: "kyc_verifications_client_id_clients_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.approvedBy],
			foreignColumns: [users.id],
			name: "kyc_verifications_approved_by_users_id_fk"
		}),
]);

export const invitations = pgTable("invitations", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	tenantId: text("tenant_id").notNull(),
	email: text().notNull(),
	role: varchar({ length: 50 }).default('member').notNull(),
	token: text().notNull(),
	invitedBy: text("invited_by").notNull(),
	customMessage: text("custom_message"),
	status: varchar({ length: 20 }).default('pending').notNull(),
	expiresAt: timestamp("expires_at", { mode: 'string' }).notNull(),
	acceptedAt: timestamp("accepted_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_invitation_email_tenant").using("btree", table.email.asc().nullsLast().op("text_ops"), table.tenantId.asc().nullsLast().op("text_ops")),
	index("idx_invitation_status").using("btree", table.status.asc().nullsLast().op("text_ops")),
	uniqueIndex("idx_invitation_token").using("btree", table.token.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.tenantId],
			foreignColumns: [tenants.id],
			name: "invitations_tenant_id_tenants_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.invitedBy],
			foreignColumns: [users.id],
			name: "invitations_invited_by_users_id_fk"
		}),
	unique("invitations_token_unique").on(table.token),
]);

export const leaveBalances = pgTable("leave_balances", {
	id: text().primaryKey().notNull(),
	tenantId: text("tenant_id").notNull(),
	userId: text("user_id").notNull(),
	year: integer().notNull(),
	annualEntitlement: real("annual_entitlement").default(25).notNull(),
	annualUsed: real("annual_used").default(0).notNull(),
	sickUsed: real("sick_used").default(0).notNull(),
	toilBalance: real("toil_balance").default(0).notNull(),
	carriedOver: real("carried_over").default(0).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_leave_balances_tenant").using("btree", table.tenantId.asc().nullsLast().op("text_ops")),
	uniqueIndex("idx_leave_balances_user_year").using("btree", table.userId.asc().nullsLast().op("int4_ops"), table.year.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.tenantId],
			foreignColumns: [tenants.id],
			name: "leave_balances_tenant_id_tenants_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "leave_balances_user_id_users_id_fk"
		}).onDelete("cascade"),
]);

export const leaveRequests = pgTable("leave_requests", {
	id: text().primaryKey().notNull(),
	tenantId: text("tenant_id").notNull(),
	userId: text("user_id").notNull(),
	leaveType: leaveType("leave_type").notNull(),
	startDate: date("start_date").notNull(),
	endDate: date("end_date").notNull(),
	daysCount: real("days_count").notNull(),
	status: leaveStatus().default('pending').notNull(),
	notes: text(),
	requestedAt: timestamp("requested_at", { mode: 'string' }).defaultNow().notNull(),
	reviewedBy: text("reviewed_by"),
	reviewedAt: timestamp("reviewed_at", { mode: 'string' }),
	reviewerComments: text("reviewer_comments"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_leave_requests_date_range").using("btree", table.startDate.asc().nullsLast().op("date_ops"), table.endDate.asc().nullsLast().op("date_ops")),
	index("idx_leave_requests_status").using("btree", table.status.asc().nullsLast().op("enum_ops")),
	index("idx_leave_requests_tenant").using("btree", table.tenantId.asc().nullsLast().op("text_ops")),
	index("idx_leave_requests_user").using("btree", table.userId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.tenantId],
			foreignColumns: [tenants.id],
			name: "leave_requests_tenant_id_tenants_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "leave_requests_user_id_users_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.reviewedBy],
			foreignColumns: [users.id],
			name: "leave_requests_reviewed_by_users_id_fk"
		}),
]);

export const legalPages = pgTable("legal_pages", {
	id: text().primaryKey().notNull(),
	tenantId: text("tenant_id").notNull(),
	pageType: text("page_type").notNull(),
	content: text().notNull(),
	version: integer().default(1).notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
	updatedBy: text("updated_by"),
}, (table) => [
	index("idx_legal_pages_tenant_type").using("btree", table.tenantId.asc().nullsLast().op("text_ops"), table.pageType.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.tenantId],
			foreignColumns: [tenants.id],
			name: "legal_pages_tenant_id_tenants_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.updatedBy],
			foreignColumns: [users.id],
			name: "legal_pages_updated_by_users_id_fk"
		}),
]);

export const messageThreads = pgTable("message_threads", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	tenantId: text("tenant_id").notNull(),
	type: varchar({ length: 20 }).notNull(),
	name: varchar({ length: 255 }),
	description: text(),
	isPrivate: boolean("is_private").default(false).notNull(),
	clientId: uuid("client_id"),
	createdBy: text("created_by").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
	lastMessageAt: timestamp("last_message_at", { mode: 'string' }),
}, (table) => [
	index("message_threads_client_idx").using("btree", table.clientId.asc().nullsLast().op("uuid_ops")),
	index("message_threads_last_message_idx").using("btree", table.lastMessageAt.asc().nullsLast().op("timestamp_ops")),
	index("message_threads_tenant_idx").using("btree", table.tenantId.asc().nullsLast().op("text_ops")),
	index("message_threads_type_idx").using("btree", table.type.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.tenantId],
			foreignColumns: [tenants.id],
			name: "message_threads_tenant_id_tenants_id_fk"
		}),
	foreignKey({
			columns: [table.clientId],
			foreignColumns: [clients.id],
			name: "message_threads_client_id_clients_id_fk"
		}),
	foreignKey({
			columns: [table.createdBy],
			foreignColumns: [users.id],
			name: "message_threads_created_by_users_id_fk"
		}),
]);

export const messages = pgTable("messages", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	threadId: uuid("thread_id").notNull(),
	senderType: varchar("sender_type", { length: 20 }).default('staff').notNull(),
	senderId: text("sender_id").notNull(),
	userId: text("user_id"),
	content: text().notNull(),
	type: varchar({ length: 20 }).default('text').notNull(),
	metadata: jsonb(),
	replyToId: uuid("reply_to_id"),
	isEdited: boolean("is_edited").default(false).notNull(),
	isDeleted: boolean("is_deleted").default(false).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("messages_created_at_idx").using("btree", table.createdAt.asc().nullsLast().op("timestamp_ops")),
	index("messages_sender_idx").using("btree", table.senderType.asc().nullsLast().op("text_ops"), table.senderId.asc().nullsLast().op("text_ops")),
	index("messages_thread_idx").using("btree", table.threadId.asc().nullsLast().op("uuid_ops")),
	index("messages_user_idx").using("btree", table.userId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.threadId],
			foreignColumns: [messageThreads.id],
			name: "messages_thread_id_message_threads_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "messages_user_id_users_id_fk"
		}),
]);

export const notifications = pgTable("notifications", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	tenantId: text("tenant_id").notNull(),
	userId: text("user_id").notNull(),
	type: varchar({ length: 50 }).notNull(),
	title: varchar({ length: 255 }).notNull(),
	message: text().notNull(),
	actionUrl: text("action_url"),
	entityType: varchar("entity_type", { length: 50 }),
	entityId: uuid("entity_id"),
	isRead: boolean("is_read").default(false).notNull(),
	readAt: timestamp("read_at", { mode: 'string' }),
	metadata: jsonb(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("notifications_created_at_idx").using("btree", table.createdAt.asc().nullsLast().op("timestamp_ops")),
	index("notifications_tenant_idx").using("btree", table.tenantId.asc().nullsLast().op("text_ops")),
	index("notifications_user_is_read_idx").using("btree", table.userId.asc().nullsLast().op("bool_ops"), table.isRead.asc().nullsLast().op("bool_ops")),
	foreignKey({
			columns: [table.tenantId],
			foreignColumns: [tenants.id],
			name: "notifications_tenant_id_tenants_id_fk"
		}),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "notifications_user_id_users_id_fk"
		}).onDelete("cascade"),
]);

export const onboardingResponses = pgTable("onboarding_responses", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	tenantId: text("tenant_id").notNull(),
	onboardingSessionId: uuid("onboarding_session_id").notNull(),
	questionKey: varchar("question_key", { length: 255 }).notNull(),
	answerValue: jsonb("answer_value"),
	extractedFromAi: boolean("extracted_from_ai").default(false),
	verifiedByUser: boolean("verified_by_user").default(false),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_onboarding_response_session").using("btree", table.onboardingSessionId.asc().nullsLast().op("uuid_ops")),
	index("idx_onboarding_response_tenant").using("btree", table.tenantId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.onboardingSessionId],
			foreignColumns: [onboardingSessions.id],
			name: "onboarding_responses_onboarding_session_id_onboarding_sessions_"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.tenantId],
			foreignColumns: [tenants.id],
			name: "onboarding_responses_tenant_id_tenants_id_fk"
		}).onDelete("cascade"),
]);

export const leads = pgTable("leads", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	tenantId: text("tenant_id").notNull(),
	firstName: varchar("first_name", { length: 100 }).notNull(),
	lastName: varchar("last_name", { length: 100 }).notNull(),
	email: varchar({ length: 255 }).notNull(),
	phone: varchar({ length: 50 }),
	mobile: varchar({ length: 50 }),
	companyName: varchar("company_name", { length: 255 }),
	position: varchar({ length: 100 }),
	website: varchar({ length: 255 }),
	status: leadStatus().default('new').notNull(),
	source: varchar({ length: 100 }),
	industry: varchar({ length: 100 }),
	estimatedTurnover: numeric("estimated_turnover", { precision: 15, scale:  2 }),
	estimatedEmployees: integer("estimated_employees"),
	qualificationScore: integer("qualification_score"),
	interestedServices: jsonb("interested_services"),
	notes: text(),
	lastContactedAt: timestamp("last_contacted_at", { mode: 'string' }),
	nextFollowUpAt: timestamp("next_follow_up_at", { mode: 'string' }),
	assignedToId: text("assigned_to_id"),
	convertedToClientId: uuid("converted_to_client_id"),
	convertedAt: timestamp("converted_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
	createdBy: text("created_by"),
}, (table) => [
	index("idx_lead_assigned").using("btree", table.assignedToId.asc().nullsLast().op("text_ops")),
	index("idx_lead_created").using("btree", table.createdAt.asc().nullsLast().op("timestamp_ops")),
	index("idx_lead_email").using("btree", table.email.asc().nullsLast().op("text_ops")),
	index("idx_lead_status").using("btree", table.status.asc().nullsLast().op("enum_ops")),
	index("idx_lead_tenant").using("btree", table.tenantId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.tenantId],
			foreignColumns: [tenants.id],
			name: "leads_tenant_id_tenants_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.assignedToId],
			foreignColumns: [users.id],
			name: "leads_assigned_to_id_users_id_fk"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.convertedToClientId],
			foreignColumns: [clients.id],
			name: "leads_converted_to_client_id_clients_id_fk"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.createdBy],
			foreignColumns: [users.id],
			name: "leads_created_by_users_id_fk"
		}).onDelete("set null"),
]);

export const portalCategories = pgTable("portal_categories", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	tenantId: text("tenant_id").notNull(),
	name: varchar({ length: 100 }).notNull(),
	description: text(),
	iconName: varchar("icon_name", { length: 50 }),
	colorHex: varchar("color_hex", { length: 7 }),
	sortOrder: integer("sort_order").default(0).notNull(),
	isActive: boolean("is_active").default(true).notNull(),
	createdById: text("created_by_id"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_portal_categories_active").using("btree", table.isActive.asc().nullsLast().op("bool_ops")),
	index("idx_portal_categories_sort").using("btree", table.sortOrder.asc().nullsLast().op("int4_ops")),
	index("idx_portal_categories_tenant").using("btree", table.tenantId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.tenantId],
			foreignColumns: [tenants.id],
			name: "portal_categories_tenant_id_tenants_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.createdById],
			foreignColumns: [users.id],
			name: "portal_categories_created_by_id_users_id_fk"
		}).onDelete("set null"),
]);

export const portalLinks = pgTable("portal_links", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	tenantId: text("tenant_id").notNull(),
	categoryId: uuid("category_id").notNull(),
	title: varchar({ length: 200 }).notNull(),
	description: text(),
	url: text().notNull(),
	isInternal: boolean("is_internal").default(false).notNull(),
	iconName: varchar("icon_name", { length: 50 }),
	sortOrder: integer("sort_order").default(0).notNull(),
	isActive: boolean("is_active").default(true).notNull(),
	targetBlank: boolean("target_blank").default(true).notNull(),
	requiresAuth: boolean("requires_auth").default(false).notNull(),
	allowedRoles: jsonb("allowed_roles"),
	createdById: text("created_by_id"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_portal_links_active").using("btree", table.isActive.asc().nullsLast().op("bool_ops")),
	index("idx_portal_links_category").using("btree", table.categoryId.asc().nullsLast().op("uuid_ops")),
	index("idx_portal_links_internal").using("btree", table.isInternal.asc().nullsLast().op("bool_ops")),
	index("idx_portal_links_sort").using("btree", table.sortOrder.asc().nullsLast().op("int4_ops")),
	index("idx_portal_links_tenant").using("btree", table.tenantId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.tenantId],
			foreignColumns: [tenants.id],
			name: "portal_links_tenant_id_tenants_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.categoryId],
			foreignColumns: [portalCategories.id],
			name: "portal_links_category_id_portal_categories_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.createdById],
			foreignColumns: [users.id],
			name: "portal_links_created_by_id_users_id_fk"
		}).onDelete("set null"),
]);

export const pricingRules = pgTable("pricing_rules", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	tenantId: text("tenant_id").notNull(),
	componentId: uuid("component_id").notNull(),
	ruleType: pricingRuleType("rule_type").notNull(),
	minValue: numeric("min_value", { precision: 15, scale:  2 }),
	maxValue: numeric("max_value", { precision: 15, scale:  2 }),
	price: numeric({ precision: 10, scale:  2 }).notNull(),
	complexityLevel: varchar("complexity_level", { length: 50 }),
	metadata: jsonb(),
	isActive: boolean("is_active").default(true).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_pricing_rule_active").using("btree", table.isActive.asc().nullsLast().op("bool_ops")),
	index("idx_pricing_rule_service").using("btree", table.componentId.asc().nullsLast().op("uuid_ops")),
	index("idx_pricing_rule_type").using("btree", table.ruleType.asc().nullsLast().op("enum_ops")),
	foreignKey({
			columns: [table.tenantId],
			foreignColumns: [tenants.id],
			name: "pricing_rules_tenant_id_tenants_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.componentId],
			foreignColumns: [services.id],
			name: "pricing_rules_component_id_services_id_fk"
		}).onDelete("cascade"),
]);

export const proposalNotes = pgTable("proposal_notes", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	tenantId: text("tenant_id").notNull(),
	proposalId: uuid("proposal_id").notNull(),
	userId: text("user_id").notNull(),
	note: text().notNull(),
	isInternal: boolean("is_internal").default(false).notNull(),
	mentionedUsers: text("mentioned_users").array().default([""]).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
	deletedAt: timestamp("deleted_at", { mode: 'string' }),
}, (table) => [
	index("proposal_notes_proposal_id_idx").using("btree", table.proposalId.asc().nullsLast().op("uuid_ops")),
	index("proposal_notes_tenant_id_idx").using("btree", table.tenantId.asc().nullsLast().op("text_ops")),
	index("proposal_notes_user_id_idx").using("btree", table.userId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.tenantId],
			foreignColumns: [tenants.id],
			name: "proposal_notes_tenant_id_tenants_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.proposalId],
			foreignColumns: [proposals.id],
			name: "proposal_notes_proposal_id_proposals_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "proposal_notes_user_id_users_id_fk"
		}).onDelete("cascade"),
]);

export const proposals = pgTable("proposals", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	tenantId: text("tenant_id").notNull(),
	leadId: uuid("lead_id"),
	quoteId: uuid("quote_id"),
	clientId: uuid("client_id"),
	proposalNumber: varchar("proposal_number", { length: 50 }).notNull(),
	title: varchar({ length: 255 }).notNull(),
	status: proposalStatus().default('draft').notNull(),
	salesStage: salesStage("sales_stage").default('enquiry').notNull(),
	lossReason: varchar("loss_reason", { length: 255 }),
	lossReasonDetails: text("loss_reason_details"),
	turnover: varchar({ length: 100 }),
	industry: varchar({ length: 100 }),
	monthlyTransactions: integer("monthly_transactions"),
	pricingModelUsed: varchar("pricing_model_used", { length: 10 }),
	monthlyTotal: numeric("monthly_total", { precision: 10, scale:  2 }).notNull(),
	annualTotal: numeric("annual_total", { precision: 10, scale:  2 }).notNull(),
	pdfUrl: text("pdf_url"),
	signedPdfUrl: text("signed_pdf_url"),
	docusealTemplateId: text("docuseal_template_id"),
	docusealSubmissionId: text("docuseal_submission_id"),
	docusealSignedPdfUrl: text("docuseal_signed_pdf_url"),
	docusealSignedPdfKey: text("docuseal_signed_pdf_key"),
	docusealSignedPdfUrlExpiresAt: timestamp("docuseal_signed_pdf_url_expires_at", { mode: 'string' }),
	documentHash: text("document_hash"),
	templateId: uuid("template_id"),
	customTerms: text("custom_terms"),
	termsAndConditions: text("terms_and_conditions"),
	notes: text(),
	validUntil: timestamp("valid_until", { mode: 'string' }),
	version: integer().default(1).notNull(),
	metadata: jsonb(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	sentAt: timestamp("sent_at", { mode: 'string' }),
	viewedAt: timestamp("viewed_at", { mode: 'string' }),
	signedAt: timestamp("signed_at", { mode: 'string' }),
	expiresAt: timestamp("expires_at", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
	createdById: text("created_by_id"),
	assignedToId: text("assigned_to_id"),
}, (table) => [
	index("idx_proposal_assignee").using("btree", table.assignedToId.asc().nullsLast().op("text_ops")),
	index("idx_proposal_client").using("btree", table.clientId.asc().nullsLast().op("uuid_ops")),
	index("idx_proposal_created").using("btree", table.createdAt.asc().nullsLast().op("timestamp_ops")),
	index("idx_proposal_lead").using("btree", table.leadId.asc().nullsLast().op("uuid_ops")),
	uniqueIndex("idx_proposal_number").using("btree", table.tenantId.asc().nullsLast().op("text_ops"), table.proposalNumber.asc().nullsLast().op("text_ops")),
	index("idx_proposal_sales_stage").using("btree", table.salesStage.asc().nullsLast().op("enum_ops")),
	index("idx_proposal_status").using("btree", table.status.asc().nullsLast().op("enum_ops")),
	index("idx_proposal_tenant").using("btree", table.tenantId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.tenantId],
			foreignColumns: [tenants.id],
			name: "proposals_tenant_id_tenants_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.leadId],
			foreignColumns: [leads.id],
			name: "proposals_lead_id_leads_id_fk"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.clientId],
			foreignColumns: [clients.id],
			name: "proposals_client_id_clients_id_fk"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.createdById],
			foreignColumns: [users.id],
			name: "proposals_created_by_id_users_id_fk"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.assignedToId],
			foreignColumns: [users.id],
			name: "proposals_assigned_to_id_users_id_fk"
		}).onDelete("set null"),
]);

export const proposalSignatures = pgTable("proposal_signatures", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	tenantId: text("tenant_id").notNull(),
	proposalId: uuid("proposal_id").notNull(),
	docusealSubmissionId: text("docuseal_submission_id"),
	signatureType: varchar("signature_type", { length: 50 }).default('electronic').notNull(),
	signatureMethod: varchar("signature_method", { length: 50 }).notNull(),
	signerEmail: varchar("signer_email", { length: 255 }).notNull(),
	signerName: varchar("signer_name", { length: 255 }).notNull(),
	signingCapacity: varchar("signing_capacity", { length: 100 }),
	companyInfo: jsonb("company_info"),
	auditTrail: jsonb("audit_trail").notNull(),
	documentHash: text("document_hash"),
	signatureData: text("signature_data").notNull(),
	signedAt: timestamp("signed_at", { mode: 'string' }).notNull(),
	viewedAt: timestamp("viewed_at", { mode: 'string' }),
	ipAddress: varchar("ip_address", { length: 45 }),
	userAgent: text("user_agent"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_signature_docuseal").using("btree", table.docusealSubmissionId.asc().nullsLast().op("text_ops")),
	index("idx_signature_proposal").using("btree", table.proposalId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.tenantId],
			foreignColumns: [tenants.id],
			name: "proposal_signatures_tenant_id_tenants_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.proposalId],
			foreignColumns: [proposals.id],
			name: "proposal_signatures_proposal_id_proposals_id_fk"
		}).onDelete("cascade"),
	unique("proposal_signatures_docuseal_submission_id_unique").on(table.docusealSubmissionId),
]);

export const proposalTemplates = pgTable("proposal_templates", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	tenantId: text("tenant_id").notNull(),
	name: varchar({ length: 255 }).notNull(),
	description: text(),
	category: varchar({ length: 100 }),
	defaultServices: jsonb("default_services").notNull(),
	termsAndConditions: text("terms_and_conditions"),
	notes: text(),
	isDefault: boolean("is_default").default(false).notNull(),
	isActive: boolean("is_active").default(true).notNull(),
	createdById: text("created_by_id").notNull(),
	createdByName: varchar("created_by_name", { length: 255 }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_template_category").using("btree", table.category.asc().nullsLast().op("text_ops")),
	index("idx_template_is_default").using("btree", table.tenantId.asc().nullsLast().op("text_ops"), table.isDefault.asc().nullsLast().op("text_ops")),
	index("idx_template_tenant").using("btree", table.tenantId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.tenantId],
			foreignColumns: [tenants.id],
			name: "proposal_templates_tenant_id_tenants_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.createdById],
			foreignColumns: [users.id],
			name: "proposal_templates_created_by_id_users_id_fk"
		}).onDelete("set null"),
]);

export const proposalVersions = pgTable("proposal_versions", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	tenantId: text("tenant_id").notNull(),
	proposalId: uuid("proposal_id").notNull(),
	version: integer().notNull(),
	proposalNumber: varchar("proposal_number", { length: 50 }).notNull(),
	title: varchar({ length: 255 }).notNull(),
	status: proposalStatus().notNull(),
	turnover: varchar({ length: 100 }),
	industry: varchar({ length: 100 }),
	monthlyTransactions: integer("monthly_transactions"),
	pricingModelUsed: varchar("pricing_model_used", { length: 10 }),
	monthlyTotal: numeric("monthly_total", { precision: 10, scale:  2 }).notNull(),
	annualTotal: numeric("annual_total", { precision: 10, scale:  2 }).notNull(),
	services: jsonb().notNull(),
	customTerms: text("custom_terms"),
	termsAndConditions: text("terms_and_conditions"),
	notes: text(),
	pdfUrl: text("pdf_url"),
	changeDescription: text("change_description"),
	createdById: text("created_by_id").notNull(),
	createdByName: varchar("created_by_name", { length: 255 }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_proposal_version_created").using("btree", table.createdAt.asc().nullsLast().op("timestamp_ops")),
	index("idx_proposal_version_number").using("btree", table.proposalId.asc().nullsLast().op("uuid_ops"), table.version.asc().nullsLast().op("int4_ops")),
	index("idx_proposal_version_proposal").using("btree", table.proposalId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.tenantId],
			foreignColumns: [tenants.id],
			name: "proposal_versions_tenant_id_tenants_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.proposalId],
			foreignColumns: [proposals.id],
			name: "proposal_versions_proposal_id_proposals_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.createdById],
			foreignColumns: [users.id],
			name: "proposal_versions_created_by_id_users_id_fk"
		}).onDelete("set null"),
]);

export const proposalServices = pgTable("proposal_services", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	tenantId: text("tenant_id").notNull(),
	proposalId: uuid("proposal_id").notNull(),
	componentCode: varchar("component_code", { length: 50 }).notNull(),
	componentName: varchar("component_name", { length: 255 }).notNull(),
	calculation: text(),
	price: varchar({ length: 50 }).notNull(),
	config: jsonb(),
	sortOrder: integer("sort_order").default(0),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_proposal_service_code").using("btree", table.componentCode.asc().nullsLast().op("text_ops")),
	index("idx_proposal_service_proposal").using("btree", table.proposalId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.tenantId],
			foreignColumns: [tenants.id],
			name: "proposal_services_tenant_id_tenants_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.proposalId],
			foreignColumns: [proposals.id],
			name: "proposal_services_proposal_id_proposals_id_fk"
		}).onDelete("cascade"),
]);

export const onboardingSessions = pgTable("onboarding_sessions", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	tenantId: text("tenant_id").notNull(),
	clientId: uuid("client_id").notNull(),
	startDate: timestamp("start_date", { mode: 'string' }).notNull(),
	targetCompletionDate: timestamp("target_completion_date", { mode: 'string' }),
	actualCompletionDate: timestamp("actual_completion_date", { mode: 'string' }),
	status: onboardingStatus().default('not_started').notNull(),
	priority: onboardingPriority().default('medium').notNull(),
	assignedToId: text("assigned_to_id"),
	progress: integer().default(0).notNull(),
	notes: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_onboarding_session_assigned").using("btree", table.assignedToId.asc().nullsLast().op("text_ops")),
	index("idx_onboarding_session_client").using("btree", table.clientId.asc().nullsLast().op("uuid_ops")),
	index("idx_onboarding_session_status").using("btree", table.status.asc().nullsLast().op("enum_ops")),
	index("idx_onboarding_session_tenant").using("btree", table.tenantId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.tenantId],
			foreignColumns: [tenants.id],
			name: "onboarding_sessions_tenant_id_tenants_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.clientId],
			foreignColumns: [clients.id],
			name: "onboarding_sessions_client_id_clients_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.assignedToId],
			foreignColumns: [users.id],
			name: "onboarding_sessions_assigned_to_id_users_id_fk"
		}).onDelete("set null"),
]);

export const onboardingTasks = pgTable("onboarding_tasks", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	tenantId: text("tenant_id").notNull(),
	sessionId: uuid("session_id").notNull(),
	taskName: varchar("task_name", { length: 255 }).notNull(),
	description: text(),
	required: boolean().default(true).notNull(),
	sequence: integer().notNull(),
	days: integer().default(0).notNull(),
	dueDate: timestamp("due_date", { mode: 'string' }),
	completionDate: timestamp("completion_date", { mode: 'string' }),
	done: boolean().default(false).notNull(),
	notes: text(),
	assignedToId: text("assigned_to_id"),
	progressWeight: integer("progress_weight").default(5).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_onboarding_task_assigned").using("btree", table.assignedToId.asc().nullsLast().op("text_ops")),
	index("idx_onboarding_task_done").using("btree", table.done.asc().nullsLast().op("bool_ops")),
	index("idx_onboarding_task_sequence").using("btree", table.sessionId.asc().nullsLast().op("uuid_ops"), table.sequence.asc().nullsLast().op("uuid_ops")),
	index("idx_onboarding_task_session").using("btree", table.sessionId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.tenantId],
			foreignColumns: [tenants.id],
			name: "onboarding_tasks_tenant_id_tenants_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.sessionId],
			foreignColumns: [onboardingSessions.id],
			name: "onboarding_tasks_session_id_onboarding_sessions_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.assignedToId],
			foreignColumns: [users.id],
			name: "onboarding_tasks_assigned_to_id_users_id_fk"
		}).onDelete("set null"),
]);

export const session = pgTable("session", {
	id: text().primaryKey().notNull(),
	expiresAt: timestamp("expires_at", { mode: 'string' }).notNull(),
	token: text().notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
	ipAddress: text("ip_address"),
	userAgent: text("user_agent"),
	userId: text("user_id").notNull(),
	activeOrganizationId: text("active_organization_id"),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "session_user_id_users_id_fk"
		}).onDelete("cascade"),
	unique("session_token_unique").on(table.token),
]);

export const taskTemplates = pgTable("task_templates", {
	id: text().primaryKey().notNull(),
	tenantId: text("tenant_id").notNull(),
	serviceId: uuid("service_id").notNull(),
	namePattern: text("name_pattern").notNull(),
	descriptionPattern: text("description_pattern"),
	estimatedHours: real("estimated_hours"),
	priority: taskPriority().default('medium').notNull(),
	taskType: varchar("task_type", { length: 100 }),
	dueDateOffsetDays: integer("due_date_offset_days").default(0).notNull(),
	dueDateOffsetMonths: integer("due_date_offset_months").default(0).notNull(),
	isRecurring: boolean("is_recurring").default(false).notNull(),
	recurringFrequency: recurringFrequency("recurring_frequency"),
	recurringDayOfMonth: integer("recurring_day_of_month"),
	isActive: boolean("is_active").default(true).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("task_templates_active_idx").using("btree", table.isActive.asc().nullsLast().op("bool_ops")),
	index("task_templates_service_id_idx").using("btree", table.serviceId.asc().nullsLast().op("uuid_ops")),
	index("task_templates_tenant_id_idx").using("btree", table.tenantId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.tenantId],
			foreignColumns: [tenants.id],
			name: "task_templates_tenant_id_tenants_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.serviceId],
			foreignColumns: [services.id],
			name: "task_templates_service_id_services_id_fk"
		}).onDelete("cascade"),
]);

export const staffCapacity = pgTable("staff_capacity", {
	id: text().primaryKey().notNull(),
	tenantId: text("tenant_id").notNull(),
	userId: text("user_id").notNull(),
	effectiveFrom: date("effective_from").notNull(),
	weeklyHours: real("weekly_hours").notNull(),
	notes: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_staff_capacity_effective_from").using("btree", table.effectiveFrom.asc().nullsLast().op("date_ops")),
	index("idx_staff_capacity_tenant").using("btree", table.tenantId.asc().nullsLast().op("text_ops")),
	index("idx_staff_capacity_user").using("btree", table.userId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.tenantId],
			foreignColumns: [tenants.id],
			name: "staff_capacity_tenant_id_tenants_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "staff_capacity_user_id_users_id_fk"
		}).onDelete("cascade"),
]);

export const taskAssignmentHistory = pgTable("task_assignment_history", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	tenantId: text("tenant_id").notNull(),
	taskId: uuid("task_id").notNull(),
	fromUserId: text("from_user_id"),
	toUserId: text("to_user_id").notNull(),
	changedBy: text("changed_by").notNull(),
	changeReason: text("change_reason"),
	assignmentType: varchar("assignment_type", { length: 20 }).notNull(),
	changedAt: timestamp("changed_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("task_assignment_history_changed_at_idx").using("btree", table.changedAt.asc().nullsLast().op("timestamp_ops")),
	index("task_assignment_history_task_id_idx").using("btree", table.taskId.asc().nullsLast().op("uuid_ops")),
	index("task_assignment_history_tenant_id_idx").using("btree", table.tenantId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.tenantId],
			foreignColumns: [tenants.id],
			name: "task_assignment_history_tenant_id_tenants_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.taskId],
			foreignColumns: [tasks.id],
			name: "task_assignment_history_task_id_tasks_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.fromUserId],
			foreignColumns: [users.id],
			name: "task_assignment_history_from_user_id_users_id_fk"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.toUserId],
			foreignColumns: [users.id],
			name: "task_assignment_history_to_user_id_users_id_fk"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.changedBy],
			foreignColumns: [users.id],
			name: "task_assignment_history_changed_by_users_id_fk"
		}).onDelete("set null"),
]);

export const taskNotes = pgTable("task_notes", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	tenantId: text("tenant_id").notNull(),
	taskId: uuid("task_id").notNull(),
	userId: text("user_id").notNull(),
	note: text().notNull(),
	isInternal: boolean("is_internal").default(false).notNull(),
	mentionedUsers: text("mentioned_users").array().default([""]).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
	deletedAt: timestamp("deleted_at", { mode: 'string' }),
}, (table) => [
	index("task_notes_task_id_idx").using("btree", table.taskId.asc().nullsLast().op("uuid_ops")),
	index("task_notes_tenant_id_idx").using("btree", table.tenantId.asc().nullsLast().op("text_ops")),
	index("task_notes_user_id_idx").using("btree", table.userId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.tenantId],
			foreignColumns: [tenants.id],
			name: "task_notes_tenant_id_tenants_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.taskId],
			foreignColumns: [tasks.id],
			name: "task_notes_task_id_tasks_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "task_notes_user_id_users_id_fk"
		}).onDelete("cascade"),
]);

export const taskWorkflowInstances = pgTable("task_workflow_instances", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	taskId: uuid("task_id").notNull(),
	workflowId: uuid("workflow_id").notNull(),
	workflowVersionId: uuid("workflow_version_id").notNull(),
	version: integer().notNull(),
	stagesSnapshot: jsonb("stages_snapshot").notNull(),
	currentStageId: uuid("current_stage_id"),
	status: varchar({ length: 50 }).default('active').notNull(),
	stageProgress: jsonb("stage_progress"),
	upgradedFromVersionId: uuid("upgraded_from_version_id"),
	upgradedAt: timestamp("upgraded_at", { mode: 'string' }),
	upgradedById: text("upgraded_by_id"),
	startedAt: timestamp("started_at", { mode: 'string' }).defaultNow().notNull(),
	completedAt: timestamp("completed_at", { mode: 'string' }),
	pausedAt: timestamp("paused_at", { mode: 'string' }),
	metadata: jsonb(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	uniqueIndex("idx_task_workflow_instance").using("btree", table.taskId.asc().nullsLast().op("uuid_ops")),
	index("idx_workflow_instance").using("btree", table.workflowId.asc().nullsLast().op("uuid_ops")),
	index("idx_workflow_instance_status").using("btree", table.status.asc().nullsLast().op("text_ops")),
	index("idx_workflow_instance_version").using("btree", table.workflowVersionId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.workflowVersionId],
			foreignColumns: [workflowVersions.id],
			name: "task_workflow_instances_workflow_version_id_workflow_versions_i"
		}).onDelete("restrict"),
	foreignKey({
			columns: [table.upgradedFromVersionId],
			foreignColumns: [workflowVersions.id],
			name: "task_workflow_instances_upgraded_from_version_id_workflow_versi"
		}),
	foreignKey({
			columns: [table.taskId],
			foreignColumns: [tasks.id],
			name: "task_workflow_instances_task_id_tasks_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.workflowId],
			foreignColumns: [workflows.id],
			name: "task_workflow_instances_workflow_id_workflows_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.upgradedById],
			foreignColumns: [users.id],
			name: "task_workflow_instances_upgraded_by_id_users_id_fk"
		}),
]);

export const rolePermissions = pgTable("role_permissions", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	tenantId: text("tenant_id").notNull(),
	role: varchar({ length: 50 }).notNull(),
	module: varchar({ length: 50 }).notNull(),
	canView: boolean("can_view").default(true).notNull(),
	canCreate: boolean("can_create").default(false).notNull(),
	canEdit: boolean("can_edit").default(false).notNull(),
	canDelete: boolean("can_delete").default(false).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	uniqueIndex("idx_role_module").using("btree", table.tenantId.asc().nullsLast().op("text_ops"), table.role.asc().nullsLast().op("text_ops"), table.module.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.tenantId],
			foreignColumns: [tenants.id],
			name: "role_permissions_tenant_id_tenants_id_fk"
		}).onDelete("cascade"),
]);

export const services = pgTable("services", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	tenantId: text("tenant_id").notNull(),
	code: varchar({ length: 50 }).notNull(),
	name: varchar({ length: 255 }).notNull(),
	category: serviceComponentCategory().notNull(),
	description: text(),
	pricingModel: pricingModel("pricing_model").notNull(),
	basePrice: numeric("base_price", { precision: 10, scale:  2 }),
	price: numeric({ precision: 10, scale:  2 }),
	priceType: servicePriceType("price_type").default('fixed'),
	defaultRate: numeric("default_rate", { precision: 10, scale:  2 }),
	duration: integer(),
	supportsComplexity: boolean("supports_complexity").default(false).notNull(),
	tags: jsonb(),
	isActive: boolean("is_active").default(true).notNull(),
	metadata: jsonb(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_service_active").using("btree", table.isActive.asc().nullsLast().op("bool_ops")),
	index("idx_service_category").using("btree", table.category.asc().nullsLast().op("enum_ops")),
	uniqueIndex("idx_service_code").using("btree", table.tenantId.asc().nullsLast().op("text_ops"), table.code.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.tenantId],
			foreignColumns: [tenants.id],
			name: "services_tenant_id_tenants_id_fk"
		}).onDelete("cascade"),
]);

export const tasks = pgTable("tasks", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	tenantId: text("tenant_id").notNull(),
	title: varchar({ length: 255 }).notNull(),
	description: text(),
	status: taskStatus().default('pending').notNull(),
	priority: taskPriority().default('medium').notNull(),
	clientId: uuid("client_id"),
	assignedToId: text("assigned_to_id"),
	preparerId: text("preparer_id"),
	reviewerId: text("reviewer_id"),
	createdById: text("created_by_id").notNull(),
	periodEndDate: timestamp("period_end_date", { mode: 'string' }),
	dueDate: timestamp("due_date", { mode: 'string' }),
	targetDate: timestamp("target_date", { mode: 'string' }),
	completedAt: timestamp("completed_at", { mode: 'string' }),
	estimatedHours: numeric("estimated_hours", { precision: 5, scale:  2 }),
	actualHours: numeric("actual_hours", { precision: 5, scale:  2 }),
	progress: integer().default(0),
	taskType: varchar("task_type", { length: 100 }),
	category: varchar({ length: 100 }),
	tags: jsonb(),
	parentTaskId: uuid("parent_task_id"),
	workflowId: uuid("workflow_id"),
	isRecurring: boolean("is_recurring").default(false),
	recurringPattern: jsonb("recurring_pattern"),
	recurringFrequency: recurringFrequency("recurring_frequency"),
	recurringDayOfMonth: integer("recurring_day_of_month"),
	serviceId: uuid("service_id"),
	autoGenerated: boolean("auto_generated").default(false).notNull(),
	templateId: text("template_id"),
	generatedAt: timestamp("generated_at", { mode: 'string' }),
	metadata: jsonb(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_parent_task").using("btree", table.parentTaskId.asc().nullsLast().op("uuid_ops")),
	index("idx_task_assignee").using("btree", table.assignedToId.asc().nullsLast().op("text_ops")),
	index("idx_task_auto_generated").using("btree", table.autoGenerated.asc().nullsLast().op("bool_ops")),
	index("idx_task_client").using("btree", table.clientId.asc().nullsLast().op("uuid_ops")),
	index("idx_task_due_date").using("btree", table.dueDate.asc().nullsLast().op("timestamp_ops")),
	index("idx_task_preparer").using("btree", table.preparerId.asc().nullsLast().op("text_ops")),
	index("idx_task_progress").using("btree", table.progress.asc().nullsLast().op("int4_ops")),
	index("idx_task_reviewer").using("btree", table.reviewerId.asc().nullsLast().op("text_ops")),
	index("idx_task_service").using("btree", table.serviceId.asc().nullsLast().op("uuid_ops")),
	index("idx_task_status").using("btree", table.status.asc().nullsLast().op("enum_ops")),
	index("idx_task_template").using("btree", table.templateId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.tenantId],
			foreignColumns: [tenants.id],
			name: "tasks_tenant_id_tenants_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.clientId],
			foreignColumns: [clients.id],
			name: "tasks_client_id_clients_id_fk"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.assignedToId],
			foreignColumns: [users.id],
			name: "tasks_assigned_to_id_users_id_fk"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.preparerId],
			foreignColumns: [users.id],
			name: "tasks_preparer_id_users_id_fk"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.reviewerId],
			foreignColumns: [users.id],
			name: "tasks_reviewer_id_users_id_fk"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.createdById],
			foreignColumns: [users.id],
			name: "tasks_created_by_id_users_id_fk"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.serviceId],
			foreignColumns: [services.id],
			name: "tasks_service_id_services_id_fk"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.templateId],
			foreignColumns: [taskTemplates.id],
			name: "tasks_template_id_task_templates_id_fk"
		}).onDelete("set null"),
]);

export const tenants = pgTable("tenants", {
	id: text().primaryKey().notNull(),
	name: text().notNull(),
	slug: text().notNull(),
	metadata: jsonb(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	unique("tenants_slug_unique").on(table.slug),
]);

export const toilAccrualHistory = pgTable("toil_accrual_history", {
	id: text().primaryKey().notNull(),
	tenantId: text("tenant_id").notNull(),
	userId: text("user_id").notNull(),
	timesheetId: uuid("timesheet_id"),
	weekEnding: date("week_ending").notNull(),
	hoursAccrued: real("hours_accrued").notNull(),
	loggedHours: real("logged_hours").notNull(),
	contractedHours: real("contracted_hours").notNull(),
	accrualDate: timestamp("accrual_date", { mode: 'string' }).defaultNow().notNull(),
	expiryDate: date("expiry_date").notNull(),
	expired: boolean().default(false).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_toil_accrual_expiry").using("btree", table.expiryDate.asc().nullsLast().op("date_ops")),
	index("idx_toil_accrual_tenant").using("btree", table.tenantId.asc().nullsLast().op("text_ops")),
	index("idx_toil_accrual_user").using("btree", table.userId.asc().nullsLast().op("text_ops")),
	index("idx_toil_accrual_week_ending").using("btree", table.weekEnding.asc().nullsLast().op("date_ops")),
	foreignKey({
			columns: [table.tenantId],
			foreignColumns: [tenants.id],
			name: "toil_accrual_history_tenant_id_tenants_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "toil_accrual_history_user_id_users_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.timesheetId],
			foreignColumns: [timesheetSubmissions.id],
			name: "toil_accrual_history_timesheet_id_timesheet_submissions_id_fk"
		}).onDelete("set null"),
]);

export const userFavorites = pgTable("user_favorites", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: text("user_id").notNull(),
	linkId: uuid("link_id").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_user_favorites_link").using("btree", table.linkId.asc().nullsLast().op("uuid_ops")),
	index("idx_user_favorites_user").using("btree", table.userId.asc().nullsLast().op("text_ops")),
	uniqueIndex("idx_user_link_favorite").using("btree", table.userId.asc().nullsLast().op("uuid_ops"), table.linkId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "user_favorites_user_id_users_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.linkId],
			foreignColumns: [portalLinks.id],
			name: "user_favorites_link_id_portal_links_id_fk"
		}).onDelete("cascade"),
]);

export const userPermissions = pgTable("user_permissions", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	tenantId: text("tenant_id").notNull(),
	userId: text("user_id").notNull(),
	module: varchar({ length: 50 }).notNull(),
	canView: boolean("can_view").default(true).notNull(),
	canCreate: boolean("can_create").default(false).notNull(),
	canEdit: boolean("can_edit").default(false).notNull(),
	canDelete: boolean("can_delete").default(false).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_permissions_tenant").using("btree", table.tenantId.asc().nullsLast().op("text_ops")),
	uniqueIndex("idx_user_module").using("btree", table.userId.asc().nullsLast().op("text_ops"), table.module.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.tenantId],
			foreignColumns: [tenants.id],
			name: "user_permissions_tenant_id_tenants_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "user_permissions_user_id_users_id_fk"
		}).onDelete("cascade"),
]);

export const userSettings = pgTable("user_settings", {
	id: text().primaryKey().notNull(),
	userId: text("user_id").notNull(),
	emailNotifications: boolean("email_notifications").default(true),
	inAppNotifications: boolean("in_app_notifications").default(true),
	digestEmail: text("digest_email").default('daily'),
	notifTaskAssigned: boolean("notif_task_assigned").default(true),
	notifTaskMention: boolean("notif_task_mention").default(true),
	notifTaskReassigned: boolean("notif_task_reassigned").default(true),
	notifDeadlineApproaching: boolean("notif_deadline_approaching").default(true),
	notifApprovalNeeded: boolean("notif_approval_needed").default(true),
	notifClientMessage: boolean("notif_client_message").default(true),
	theme: text().default('system'),
	language: text().default('en'),
	timezone: text().default('Europe/London'),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "user_settings_user_id_users_id_fk"
		}).onDelete("cascade"),
	unique("user_settings_user_id_unique").on(table.userId),
]);

export const workTypes = pgTable("work_types", {
	id: text().primaryKey().notNull(),
	tenantId: text("tenant_id").notNull(),
	code: text().notNull(),
	label: text().notNull(),
	colorCode: text("color_code").notNull(),
	isActive: boolean("is_active").default(true).notNull(),
	sortOrder: integer("sort_order").default(0).notNull(),
	isBillable: boolean("is_billable").default(true).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_work_type_sort_order").using("btree", table.sortOrder.asc().nullsLast().op("int4_ops")),
	uniqueIndex("idx_work_type_tenant_code").using("btree", table.tenantId.asc().nullsLast().op("text_ops"), table.code.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.tenantId],
			foreignColumns: [tenants.id],
			name: "work_types_tenant_id_tenants_id_fk"
		}).onDelete("cascade"),
]);

export const timeEntries = pgTable("time_entries", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	tenantId: text("tenant_id").notNull(),
	userId: text("user_id").notNull(),
	clientId: uuid("client_id"),
	taskId: uuid("task_id"),
	serviceId: uuid("service_id"),
	date: date().notNull(),
	startTime: varchar("start_time", { length: 8 }),
	endTime: varchar("end_time", { length: 8 }),
	hours: numeric({ precision: 5, scale:  2 }).notNull(),
	workType: text("work_type").default('WORK').notNull(),
	billable: boolean().default(true).notNull(),
	billed: boolean().default(false).notNull(),
	rate: numeric({ precision: 10, scale:  2 }),
	amount: numeric({ precision: 10, scale:  2 }),
	invoiceId: uuid("invoice_id"),
	description: text(),
	notes: text(),
	status: timeEntryStatus().default('draft').notNull(),
	submissionId: uuid("submission_id"),
	submittedAt: timestamp("submitted_at", { mode: 'string' }),
	approvedById: text("approved_by_id"),
	approvedAt: timestamp("approved_at", { mode: 'string' }),
	metadata: jsonb(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_time_entry_billable").using("btree", table.billable.asc().nullsLast().op("bool_ops"), table.billed.asc().nullsLast().op("bool_ops")),
	index("idx_time_entry_client").using("btree", table.clientId.asc().nullsLast().op("uuid_ops")),
	index("idx_time_entry_status").using("btree", table.status.asc().nullsLast().op("enum_ops")),
	index("idx_time_entry_task").using("btree", table.taskId.asc().nullsLast().op("uuid_ops")),
	index("idx_time_entry_user_date").using("btree", table.userId.asc().nullsLast().op("text_ops"), table.date.asc().nullsLast().op("text_ops")),
	index("idx_time_entry_work_type").using("btree", table.workType.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.tenantId],
			foreignColumns: [tenants.id],
			name: "time_entries_tenant_id_tenants_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "time_entries_user_id_users_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.clientId],
			foreignColumns: [clients.id],
			name: "time_entries_client_id_clients_id_fk"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.taskId],
			foreignColumns: [tasks.id],
			name: "time_entries_task_id_tasks_id_fk"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.serviceId],
			foreignColumns: [services.id],
			name: "time_entries_service_id_services_id_fk"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.submissionId],
			foreignColumns: [timesheetSubmissions.id],
			name: "time_entries_submission_id_timesheet_submissions_id_fk"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.approvedById],
			foreignColumns: [users.id],
			name: "time_entries_approved_by_id_users_id_fk"
		}).onDelete("set null"),
]);

export const verification = pgTable("verification", {
	id: text().primaryKey().notNull(),
	identifier: text().notNull(),
	value: text().notNull(),
	expiresAt: timestamp("expires_at", { mode: 'string' }).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
});

export const workflowEmailRules = pgTable("workflow_email_rules", {
	id: text().primaryKey().notNull(),
	tenantId: text("tenant_id").notNull(),
	workflowId: uuid("workflow_id").notNull(),
	stageId: uuid("stage_id"),
	emailTemplateId: text("email_template_id").notNull(),
	recipientType: text("recipient_type").notNull(),
	customRecipientEmail: text("custom_recipient_email"),
	sendDelayHours: integer("send_delay_hours").default(0).notNull(),
	isActive: boolean("is_active").default(true).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("workflow_email_rules_stage_id_idx").using("btree", table.stageId.asc().nullsLast().op("uuid_ops")),
	index("workflow_email_rules_template_id_idx").using("btree", table.emailTemplateId.asc().nullsLast().op("text_ops")),
	index("workflow_email_rules_tenant_id_idx").using("btree", table.tenantId.asc().nullsLast().op("text_ops")),
	index("workflow_email_rules_workflow_id_idx").using("btree", table.workflowId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.tenantId],
			foreignColumns: [tenants.id],
			name: "workflow_email_rules_tenant_id_tenants_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.workflowId],
			foreignColumns: [workflows.id],
			name: "workflow_email_rules_workflow_id_workflows_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.emailTemplateId],
			foreignColumns: [emailTemplates.id],
			name: "workflow_email_rules_email_template_id_email_templates_id_fk"
		}).onDelete("cascade"),
]);

export const users = pgTable("users", {
	id: text().primaryKey().notNull(),
	tenantId: text("tenant_id").notNull(),
	email: text().notNull(),
	emailVerified: boolean("email_verified").default(false).notNull(),
	name: text(),
	firstName: varchar("first_name", { length: 100 }),
	lastName: varchar("last_name", { length: 100 }),
	image: text(),
	role: varchar({ length: 50 }).default('member').notNull(),
	status: varchar({ length: 20 }).default('active').notNull(),
	isActive: boolean("is_active").default(true).notNull(),
	departmentId: text("department_id"),
	hourlyRate: numeric("hourly_rate", { precision: 10, scale:  2 }),
	timesheetMinWeeklyHours: real("timesheet_min_weekly_hours").default(37.5),
	timesheetDailyTargetHours: real("timesheet_daily_target_hours").default(7.5),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	uniqueIndex("idx_tenant_email").using("btree", table.tenantId.asc().nullsLast().op("text_ops"), table.email.asc().nullsLast().op("text_ops")),
	index("idx_user_role").using("btree", table.role.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.tenantId],
			foreignColumns: [tenants.id],
			name: "users_tenant_id_tenants_id_fk"
		}),
	foreignKey({
			columns: [table.departmentId],
			foreignColumns: [departments.id],
			name: "users_department_id_departments_id_fk"
		}),
	unique("users_email_unique").on(table.email),
]);

export const timesheetSubmissions = pgTable("timesheet_submissions", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	tenantId: text("tenant_id").notNull(),
	userId: text("user_id").notNull(),
	weekStartDate: date("week_start_date").notNull(),
	weekEndDate: date("week_end_date").notNull(),
	status: text().notNull(),
	totalHours: numeric("total_hours", { precision: 7, scale:  2 }).notNull(),
	submittedAt: timestamp("submitted_at", { mode: 'string' }).defaultNow().notNull(),
	reviewedBy: text("reviewed_by"),
	reviewedAt: timestamp("reviewed_at", { mode: 'string' }),
	reviewerComments: text("reviewer_comments"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("timesheet_submissions_reviewer_idx").using("btree", table.reviewedBy.asc().nullsLast().op("text_ops")),
	index("timesheet_submissions_status_idx").using("btree", table.status.asc().nullsLast().op("text_ops")),
	index("timesheet_submissions_tenant_id_idx").using("btree", table.tenantId.asc().nullsLast().op("text_ops")),
	uniqueIndex("timesheet_submissions_user_week_unique").using("btree", table.userId.asc().nullsLast().op("date_ops"), table.weekStartDate.asc().nullsLast().op("text_ops")),
	index("timesheet_submissions_week_date_idx").using("btree", table.weekStartDate.asc().nullsLast().op("date_ops")),
	foreignKey({
			columns: [table.tenantId],
			foreignColumns: [tenants.id],
			name: "timesheet_submissions_tenant_id_tenants_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "timesheet_submissions_user_id_users_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.reviewedBy],
			foreignColumns: [users.id],
			name: "timesheet_submissions_reviewed_by_users_id_fk"
		}).onDelete("set null"),
]);

export const workflowStages = pgTable("workflow_stages", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	workflowId: uuid("workflow_id").notNull(),
	name: varchar({ length: 255 }).notNull(),
	description: text(),
	stageOrder: integer("stage_order").notNull(),
	isRequired: boolean("is_required").default(true).notNull(),
	estimatedHours: numeric("estimated_hours", { precision: 5, scale:  2 }),
	checklistItems: jsonb("checklist_items"),
	autoComplete: boolean("auto_complete").default(false),
	requiresApproval: boolean("requires_approval").default(false),
	metadata: jsonb(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_stage_order").using("btree", table.workflowId.asc().nullsLast().op("int4_ops"), table.stageOrder.asc().nullsLast().op("int4_ops")),
	index("idx_stage_workflow").using("btree", table.workflowId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.workflowId],
			foreignColumns: [workflows.id],
			name: "workflow_stages_workflow_id_workflows_id_fk"
		}).onDelete("cascade"),
]);

export const clients = pgTable("clients", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	tenantId: text("tenant_id").notNull(),
	clientCode: varchar("client_code", { length: 50 }).notNull(),
	name: varchar({ length: 255 }).notNull(),
	type: clientType().notNull(),
	status: clientStatus().default('onboarding').notNull(),
	email: varchar({ length: 255 }),
	phone: varchar({ length: 50 }),
	website: varchar({ length: 255 }),
	vatRegistered: boolean("vat_registered").default(false).notNull(),
	vatNumber: varchar("vat_number", { length: 50 }),
	vatValidationStatus: text("vat_validation_status"),
	vatValidatedAt: timestamp("vat_validated_at", { mode: 'string' }),
	registrationNumber: varchar("registration_number", { length: 50 }),
	addressLine1: varchar("address_line1", { length: 255 }),
	addressLine2: varchar("address_line2", { length: 255 }),
	city: varchar({ length: 100 }),
	state: varchar({ length: 100 }),
	postalCode: varchar("postal_code", { length: 20 }),
	country: varchar({ length: 100 }),
	accountManagerId: text("account_manager_id"),
	parentClientId: uuid("parent_client_id"),
	incorporationDate: date("incorporation_date"),
	yearEnd: varchar("year_end", { length: 10 }),
	notes: text(),
	healthScore: integer("health_score").default(50),
	xeroContactId: text("xero_contact_id"),
	xeroSyncStatus: text("xero_sync_status"),
	xeroLastSyncedAt: timestamp("xero_last_synced_at", { mode: 'string' }),
	xeroSyncError: text("xero_sync_error"),
	metadata: jsonb(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
	createdBy: text("created_by"),
}, (table) => [
	index("idx_client_manager").using("btree", table.accountManagerId.asc().nullsLast().op("text_ops")),
	index("idx_client_name").using("btree", table.name.asc().nullsLast().op("text_ops")),
	index("idx_client_status").using("btree", table.status.asc().nullsLast().op("enum_ops")),
	index("idx_client_xero_contact_id").using("btree", table.xeroContactId.asc().nullsLast().op("text_ops")),
	index("idx_client_xero_sync_status").using("btree", table.xeroSyncStatus.asc().nullsLast().op("text_ops")),
	uniqueIndex("idx_tenant_client_code").using("btree", table.tenantId.asc().nullsLast().op("text_ops"), table.clientCode.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.tenantId],
			foreignColumns: [tenants.id],
			name: "clients_tenant_id_tenants_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.accountManagerId],
			foreignColumns: [users.id],
			name: "clients_account_manager_id_users_id_fk"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.createdBy],
			foreignColumns: [users.id],
			name: "clients_created_by_users_id_fk"
		}),
]);

export const calendarEventAttendees = pgTable("calendar_event_attendees", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	eventId: uuid("event_id").notNull(),
	userId: text("user_id").notNull(),
	status: varchar({ length: 20 }).default('pending').notNull(),
	isOptional: boolean("is_optional").default(false).notNull(),
	respondedAt: timestamp("responded_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	uniqueIndex("calendar_event_attendees_event_user_idx").using("btree", table.eventId.asc().nullsLast().op("uuid_ops"), table.userId.asc().nullsLast().op("text_ops")),
	index("calendar_event_attendees_status_idx").using("btree", table.status.asc().nullsLast().op("text_ops")),
	index("calendar_event_attendees_user_idx").using("btree", table.userId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.eventId],
			foreignColumns: [calendarEvents.id],
			name: "calendar_event_attendees_event_id_calendar_events_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "calendar_event_attendees_user_id_users_id_fk"
		}).onDelete("cascade"),
]);

export const documentSignatures = pgTable("document_signatures", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	documentId: uuid("document_id").notNull(),
	tenantId: text("tenant_id").notNull(),
	signerEmail: varchar("signer_email", { length: 255 }).notNull(),
	signerName: varchar("signer_name", { length: 255 }).notNull(),
	docusealSubmissionId: text("docuseal_submission_id").notNull(),
	auditTrail: jsonb("audit_trail").notNull(),
	documentHash: text("document_hash"),
	signedPdfUrl: text("signed_pdf_url"),
	signedAt: timestamp("signed_at", { mode: 'string' }).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_document_signature_document").using("btree", table.documentId.asc().nullsLast().op("uuid_ops")),
	index("idx_document_signature_submission").using("btree", table.docusealSubmissionId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.documentId],
			foreignColumns: [documents.id],
			name: "document_signatures_document_id_documents_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.tenantId],
			foreignColumns: [tenants.id],
			name: "document_signatures_tenant_id_tenants_id_fk"
		}).onDelete("cascade"),
	unique("document_signatures_docuseal_submission_id_unique").on(table.docusealSubmissionId),
]);

export const integrationSettings = pgTable("integration_settings", {
	id: text().primaryKey().notNull(),
	tenantId: text("tenant_id").notNull(),
	integrationType: text("integration_type").notNull(),
	enabled: boolean().default(false).notNull(),
	credentials: text(),
	config: jsonb(),
	lastSyncAt: timestamp("last_sync_at", { mode: 'string' }),
	syncStatus: text("sync_status"),
	syncError: text("sync_error"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("integration_settings_tenant_id_idx").using("btree", table.tenantId.asc().nullsLast().op("text_ops")),
	uniqueIndex("integration_settings_tenant_type_idx").using("btree", table.tenantId.asc().nullsLast().op("text_ops"), table.integrationType.asc().nullsLast().op("text_ops")),
	index("integration_settings_type_idx").using("btree", table.integrationType.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.tenantId],
			foreignColumns: [tenants.id],
			name: "integration_settings_tenant_id_tenants_id_fk"
		}).onDelete("cascade"),
]);

export const invoiceItems = pgTable("invoice_items", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	invoiceId: uuid("invoice_id").notNull(),
	description: text().notNull(),
	quantity: numeric({ precision: 10, scale:  2 }).notNull(),
	rate: numeric({ precision: 10, scale:  2 }).notNull(),
	amount: numeric({ precision: 10, scale:  2 }).notNull(),
	timeEntryId: uuid("time_entry_id"),
	serviceId: uuid("service_id"),
	sortOrder: integer("sort_order").default(0),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_invoice_item_invoice").using("btree", table.invoiceId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.invoiceId],
			foreignColumns: [invoices.id],
			name: "invoice_items_invoice_id_invoices_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.timeEntryId],
			foreignColumns: [timeEntries.id],
			name: "invoice_items_time_entry_id_time_entries_id_fk"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.serviceId],
			foreignColumns: [services.id],
			name: "invoice_items_service_id_services_id_fk"
		}).onDelete("set null"),
]);

export const messageThreadParticipants = pgTable("message_thread_participants", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	threadId: uuid("thread_id").notNull(),
	participantType: varchar("participant_type", { length: 20 }).default('staff').notNull(),
	participantId: text("participant_id").notNull(),
	userId: text("user_id"),
	role: varchar({ length: 20 }).default('member').notNull(),
	joinedAt: timestamp("joined_at", { mode: 'string' }).defaultNow().notNull(),
	lastReadAt: timestamp("last_read_at", { mode: 'string' }),
	mutedUntil: timestamp("muted_until", { mode: 'string' }),
}, (table) => [
	index("message_thread_participants_participant_idx").using("btree", table.participantType.asc().nullsLast().op("text_ops"), table.participantId.asc().nullsLast().op("text_ops")),
	uniqueIndex("message_thread_participants_thread_participant_idx").using("btree", table.threadId.asc().nullsLast().op("text_ops"), table.participantType.asc().nullsLast().op("uuid_ops"), table.participantId.asc().nullsLast().op("uuid_ops")),
	index("message_thread_participants_user_idx").using("btree", table.userId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.threadId],
			foreignColumns: [messageThreads.id],
			name: "message_thread_participants_thread_id_message_threads_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "message_thread_participants_user_id_users_id_fk"
		}).onDelete("cascade"),
]);

export const workflows = pgTable("workflows", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	tenantId: text("tenant_id").notNull(),
	version: integer().default(1).notNull(),
	currentVersionId: uuid("current_version_id"),
	name: varchar({ length: 255 }).notNull(),
	description: text(),
	type: varchar({ length: 50 }).notNull(),
	trigger: varchar({ length: 100 }),
	isActive: boolean("is_active").default(true).notNull(),
	estimatedDays: integer("estimated_days"),
	serviceId: uuid("service_id"),
	config: jsonb().notNull(),
	conditions: jsonb(),
	actions: jsonb(),
	metadata: jsonb(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
	createdById: text("created_by_id"),
}, (table) => [
	index("idx_workflow_active").using("btree", table.isActive.asc().nullsLast().op("bool_ops")),
	index("idx_workflow_service").using("btree", table.serviceId.asc().nullsLast().op("uuid_ops")),
	index("idx_workflow_type").using("btree", table.type.asc().nullsLast().op("text_ops")),
	index("idx_workflow_version").using("btree", table.id.asc().nullsLast().op("uuid_ops"), table.version.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.tenantId],
			foreignColumns: [tenants.id],
			name: "workflows_tenant_id_tenants_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.serviceId],
			foreignColumns: [services.id],
			name: "workflows_service_id_services_id_fk"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.createdById],
			foreignColumns: [users.id],
			name: "workflows_created_by_id_users_id_fk"
		}).onDelete("set null"),
]);

export const workflowVersions = pgTable("workflow_versions", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	workflowId: uuid("workflow_id").notNull(),
	tenantId: text("tenant_id").notNull(),
	version: integer().notNull(),
	name: varchar({ length: 255 }).notNull(),
	description: text(),
	type: varchar({ length: 50 }).notNull(),
	trigger: varchar({ length: 100 }),
	estimatedDays: integer("estimated_days"),
	serviceId: uuid("service_id"),
	config: jsonb().notNull(),
	stagesSnapshot: jsonb("stages_snapshot").notNull(),
	changeDescription: text("change_description"),
	changeType: varchar("change_type", { length: 50 }),
	publishNotes: text("publish_notes"),
	isActive: boolean("is_active").default(false).notNull(),
	publishedAt: timestamp("published_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	createdById: text("created_by_id"),
}, (table) => [
	index("idx_workflow_version_active").using("btree", table.workflowId.asc().nullsLast().op("uuid_ops"), table.isActive.asc().nullsLast().op("uuid_ops")),
	index("idx_workflow_version_created").using("btree", table.createdAt.asc().nullsLast().op("timestamp_ops")),
	uniqueIndex("idx_workflow_version_number").using("btree", table.workflowId.asc().nullsLast().op("uuid_ops"), table.version.asc().nullsLast().op("uuid_ops")),
	index("idx_workflow_version_workflow").using("btree", table.workflowId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.workflowId],
			foreignColumns: [workflows.id],
			name: "workflow_versions_workflow_id_workflows_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.tenantId],
			foreignColumns: [tenants.id],
			name: "workflow_versions_tenant_id_tenants_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.createdById],
			foreignColumns: [users.id],
			name: "workflow_versions_created_by_id_users_id_fk"
		}).onDelete("set null"),
]);

export const workflowTemplates = pgTable("workflow_templates", {
	id: text().primaryKey().notNull(),
	tenantId: text("tenant_id").notNull(),
	workflowId: uuid("workflow_id").notNull(),
	stageId: text("stage_id"),
	templateId: text("template_id").notNull(),
	triggerType: varchar("trigger_type", { length: 50 }).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("workflow_templates_template_id_idx").using("btree", table.templateId.asc().nullsLast().op("text_ops")),
	index("workflow_templates_tenant_id_idx").using("btree", table.tenantId.asc().nullsLast().op("text_ops")),
	index("workflow_templates_trigger_type_idx").using("btree", table.triggerType.asc().nullsLast().op("text_ops")),
	index("workflow_templates_workflow_id_idx").using("btree", table.workflowId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.tenantId],
			foreignColumns: [tenants.id],
			name: "workflow_templates_tenant_id_tenants_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.workflowId],
			foreignColumns: [workflows.id],
			name: "workflow_templates_workflow_id_workflows_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.templateId],
			foreignColumns: [taskTemplates.id],
			name: "workflow_templates_template_id_task_templates_id_fk"
		}).onDelete("cascade"),
]);

export const workingPatterns = pgTable("working_patterns", {
	id: text().primaryKey().notNull(),
	tenantId: text("tenant_id").notNull(),
	userId: text("user_id").notNull(),
	patternType: varchar("pattern_type", { length: 50 }).notNull(),
	contractedHours: real("contracted_hours").notNull(),
	mondayHours: real("monday_hours").default(0).notNull(),
	tuesdayHours: real("tuesday_hours").default(0).notNull(),
	wednesdayHours: real("wednesday_hours").default(0).notNull(),
	thursdayHours: real("thursday_hours").default(0).notNull(),
	fridayHours: real("friday_hours").default(0).notNull(),
	saturdayHours: real("saturday_hours").default(0).notNull(),
	sundayHours: real("sunday_hours").default(0).notNull(),
	effectiveFrom: date("effective_from").notNull(),
	notes: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_working_patterns_effective_from").using("btree", table.effectiveFrom.asc().nullsLast().op("date_ops")),
	index("idx_working_patterns_tenant").using("btree", table.tenantId.asc().nullsLast().op("text_ops")),
	index("idx_working_patterns_user").using("btree", table.userId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.tenantId],
			foreignColumns: [tenants.id],
			name: "working_patterns_tenant_id_tenants_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "working_patterns_user_id_users_id_fk"
		}).onDelete("cascade"),
]);

export const xeroConnections = pgTable("xero_connections", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	tenantId: text("tenant_id").notNull(),
	clientId: uuid("client_id").notNull(),
	accessToken: text("access_token").notNull(),
	refreshToken: text("refresh_token").notNull(),
	expiresAt: timestamp("expires_at", { mode: 'string' }).notNull(),
	xeroTenantId: text("xero_tenant_id").notNull(),
	xeroTenantName: text("xero_tenant_name"),
	xeroOrganisationId: text("xero_organisation_id"),
	isActive: boolean("is_active").default(true).notNull(),
	lastSyncAt: timestamp("last_sync_at", { mode: 'string' }),
	syncStatus: varchar("sync_status", { length: 50 }).default('connected'),
	syncError: text("sync_error"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
	connectedBy: text("connected_by"),
}, (table) => [
	uniqueIndex("idx_xero_client").using("btree", table.clientId.asc().nullsLast().op("uuid_ops")),
	index("idx_xero_tenant").using("btree", table.tenantId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.tenantId],
			foreignColumns: [tenants.id],
			name: "xero_connections_tenant_id_tenants_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.clientId],
			foreignColumns: [clients.id],
			name: "xero_connections_client_id_clients_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.connectedBy],
			foreignColumns: [users.id],
			name: "xero_connections_connected_by_users_id_fk"
		}),
]);

export const xeroWebhookEvents = pgTable("xero_webhook_events", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	tenantId: text("tenant_id").notNull(),
	eventId: text("event_id").notNull(),
	eventType: text("event_type").notNull(),
	eventCategory: text("event_category").notNull(),
	eventDateUtc: timestamp("event_date_utc", { mode: 'string' }).notNull(),
	resourceId: text("resource_id").notNull(),
	resourceUrl: text("resource_url"),
	xeroTenantId: text("xero_tenant_id").notNull(),
	processed: boolean().default(false).notNull(),
	processedAt: timestamp("processed_at", { mode: 'string' }),
	processingError: text("processing_error"),
	rawPayload: jsonb("raw_payload").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("xero_webhook_events_created_at_idx").using("btree", table.createdAt.asc().nullsLast().op("timestamp_ops")),
	index("xero_webhook_events_event_category_idx").using("btree", table.eventCategory.asc().nullsLast().op("text_ops")),
	uniqueIndex("xero_webhook_events_event_id_idx").using("btree", table.eventId.asc().nullsLast().op("text_ops")),
	index("xero_webhook_events_event_type_idx").using("btree", table.eventType.asc().nullsLast().op("text_ops")),
	index("xero_webhook_events_processed_idx").using("btree", table.processed.asc().nullsLast().op("bool_ops")),
	index("xero_webhook_events_tenant_id_idx").using("btree", table.tenantId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.tenantId],
			foreignColumns: [tenants.id],
			name: "xero_webhook_events_tenant_id_tenants_id_fk"
		}).onDelete("cascade"),
	unique("xero_webhook_events_event_id_unique").on(table.eventId),
]);
export const clientDetailsView = pgView("client_details_view", {	id: uuid(),
	tenantId: text("tenant_id"),
	clientCode: varchar("client_code", { length: 50 }),
	name: varchar({ length: 255 }),
	type: clientType(),
	status: clientStatus(),
	email: varchar({ length: 255 }),
	phone: varchar({ length: 50 }),
	website: varchar({ length: 255 }),
	vatRegistered: boolean("vat_registered"),
	vatNumber: varchar("vat_number", { length: 50 }),
	vatValidationStatus: text("vat_validation_status"),
	vatValidatedAt: timestamp("vat_validated_at", { mode: 'string' }),
	registrationNumber: varchar("registration_number", { length: 50 }),
	addressLine1: varchar("address_line1", { length: 255 }),
	addressLine2: varchar("address_line2", { length: 255 }),
	city: varchar({ length: 100 }),
	state: varchar({ length: 100 }),
	postalCode: varchar("postal_code", { length: 20 }),
	country: varchar({ length: 100 }),
	accountManagerId: text("account_manager_id"),
	parentClientId: uuid("parent_client_id"),
	incorporationDate: date("incorporation_date"),
	yearEnd: varchar("year_end", { length: 10 }),
	notes: text(),
	healthScore: integer("health_score"),
	xeroContactId: text("xero_contact_id"),
	xeroSyncStatus: text("xero_sync_status"),
	xeroLastSyncedAt: timestamp("xero_last_synced_at", { mode: 'string' }),
	xeroSyncError: text("xero_sync_error"),
	metadata: jsonb(),
	createdAt: timestamp("created_at", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
	createdBy: text("created_by"),
	accountManagerFirstName: varchar("account_manager_first_name", { length: 100 }),
	accountManagerLastName: varchar("account_manager_last_name", { length: 100 }),
	accountManagerName: text("account_manager_name"),
	accountManagerEmail: text("account_manager_email"),
}).as(sql`SELECT c.id, c.tenant_id, c.client_code, c.name, c.type, c.status, c.email, c.phone, c.website, c.vat_registered, c.vat_number, c.vat_validation_status, c.vat_validated_at, c.registration_number, c.address_line1, c.address_line2, c.city, c.state, c.postal_code, c.country, c.account_manager_id, c.parent_client_id, c.incorporation_date, c.year_end, c.notes, c.health_score, c.xero_contact_id, c.xero_sync_status, c.xero_last_synced_at, c.xero_sync_error, c.metadata, c.created_at, c.updated_at, c.created_by, u.first_name AS account_manager_first_name, u.last_name AS account_manager_last_name, concat(u.first_name, ' ', u.last_name) AS account_manager_name, u.email AS account_manager_email FROM clients c LEFT JOIN users u ON c.account_manager_id = u.id`);

export const complianceDetailsView = pgView("compliance_details_view", {	id: uuid(),
	tenantId: text("tenant_id"),
	title: varchar({ length: 255 }),
	type: varchar({ length: 100 }),
	description: text(),
	clientId: uuid("client_id"),
	assignedToId: text("assigned_to_id"),
	dueDate: timestamp("due_date", { mode: 'string' }),
	completedDate: timestamp("completed_date", { mode: 'string' }),
	reminderDate: timestamp("reminder_date", { mode: 'string' }),
	status: complianceStatus(),
	priority: compliancePriority(),
	notes: text(),
	attachments: jsonb(),
	metadata: jsonb(),
	createdAt: timestamp("created_at", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
	createdById: text("created_by_id"),
	clientName: varchar("client_name", { length: 255 }),
	clientCode: varchar("client_code", { length: 50 }),
	assigneeName: text("assignee_name"),
	assigneeEmail: text("assignee_email"),
	creatorName: text("creator_name"),
	isOverdue: boolean("is_overdue"),
}).as(sql`SELECT comp.id, comp.tenant_id, comp.title, comp.type, comp.description, comp.client_id, comp.assigned_to_id, comp.due_date, comp.completed_date, comp.reminder_date, comp.status, comp.priority, comp.notes, comp.attachments, comp.metadata, comp.created_at, comp.updated_at, comp.created_by_id, c.name AS client_name, c.client_code, concat(u1.first_name, ' ', u1.last_name) AS assignee_name, u1.email AS assignee_email, concat(u2.first_name, ' ', u2.last_name) AS creator_name, CASE WHEN comp.due_date < CURRENT_DATE AND comp.status <> 'completed'::compliance_status THEN true ELSE false END AS is_overdue FROM compliance comp LEFT JOIN clients c ON comp.client_id = c.id LEFT JOIN users u1 ON comp.assigned_to_id = u1.id LEFT JOIN users u2 ON comp.created_by_id = u2.id`);

export const taskDetailsView = pgView("task_details_view", {	id: uuid(),
	tenantId: text("tenant_id"),
	title: varchar({ length: 255 }),
	description: text(),
	status: taskStatus(),
	priority: taskPriority(),
	clientId: uuid("client_id"),
	assignedToId: text("assigned_to_id"),
	preparerId: text("preparer_id"),
	reviewerId: text("reviewer_id"),
	createdById: text("created_by_id"),
	periodEndDate: timestamp("period_end_date", { mode: 'string' }),
	dueDate: timestamp("due_date", { mode: 'string' }),
	targetDate: timestamp("target_date", { mode: 'string' }),
	completedAt: timestamp("completed_at", { mode: 'string' }),
	estimatedHours: numeric("estimated_hours", { precision: 5, scale:  2 }),
	actualHours: numeric("actual_hours", { precision: 5, scale:  2 }),
	progress: integer(),
	taskType: varchar("task_type", { length: 100 }),
	category: varchar({ length: 100 }),
	tags: jsonb(),
	parentTaskId: uuid("parent_task_id"),
	workflowId: uuid("workflow_id"),
	isRecurring: boolean("is_recurring"),
	recurringPattern: jsonb("recurring_pattern"),
	recurringFrequency: recurringFrequency("recurring_frequency"),
	recurringDayOfMonth: integer("recurring_day_of_month"),
	serviceId: uuid("service_id"),
	autoGenerated: boolean("auto_generated"),
	templateId: text("template_id"),
	generatedAt: timestamp("generated_at", { mode: 'string' }),
	metadata: jsonb(),
	createdAt: timestamp("created_at", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
	clientName: varchar("client_name", { length: 255 }),
	clientCode: varchar("client_code", { length: 50 }),
	assigneeName: text("assignee_name"),
	assigneeEmail: text("assignee_email"),
	reviewerName: text("reviewer_name"),
	reviewerEmail: text("reviewer_email"),
	preparerName: text("preparer_name"),
	preparerEmail: text("preparer_email"),
	creatorName: text("creator_name"),
	workflowName: varchar("workflow_name", { length: 255 }),
	parentTaskTitle: varchar("parent_task_title", { length: 255 }),
}).as(sql`SELECT t.id, t.tenant_id, t.title, t.description, t.status, t.priority, t.client_id, t.assigned_to_id, t.preparer_id, t.reviewer_id, t.created_by_id, t.period_end_date, t.due_date, t.target_date, t.completed_at, t.estimated_hours, t.actual_hours, t.progress, t.task_type, t.category, t.tags, t.parent_task_id, t.workflow_id, t.is_recurring, t.recurring_pattern, t.recurring_frequency, t.recurring_day_of_month, t.service_id, t.auto_generated, t.template_id, t.generated_at, t.metadata, t.created_at, t.updated_at, c.name AS client_name, c.client_code, concat(u1.first_name, ' ', u1.last_name) AS assignee_name, u1.email AS assignee_email, concat(u2.first_name, ' ', u2.last_name) AS reviewer_name, u2.email AS reviewer_email, concat(u3.first_name, ' ', u3.last_name) AS preparer_name, u3.email AS preparer_email, concat(u4.first_name, ' ', u4.last_name) AS creator_name, w.name AS workflow_name, pt.title AS parent_task_title FROM tasks t LEFT JOIN clients c ON t.client_id = c.id LEFT JOIN users u1 ON t.assigned_to_id = u1.id LEFT JOIN users u2 ON t.reviewer_id = u2.id LEFT JOIN users u3 ON t.preparer_id = u3.id LEFT JOIN users u4 ON t.created_by_id = u4.id LEFT JOIN workflows w ON t.workflow_id = w.id LEFT JOIN tasks pt ON t.parent_task_id = pt.id`);

export const timeEntriesView = pgView("time_entries_view", {	id: uuid(),
	tenantId: text("tenant_id"),
	userId: text("user_id"),
	clientId: uuid("client_id"),
	taskId: uuid("task_id"),
	serviceId: uuid("service_id"),
	date: date(),
	startTime: varchar("start_time", { length: 8 }),
	endTime: varchar("end_time", { length: 8 }),
	hours: numeric({ precision: 5, scale:  2 }),
	workType: text("work_type"),
	billable: boolean(),
	billed: boolean(),
	rate: numeric({ precision: 10, scale:  2 }),
	amount: numeric({ precision: 10, scale:  2 }),
	invoiceId: uuid("invoice_id"),
	description: text(),
	notes: text(),
	status: timeEntryStatus(),
	submissionId: uuid("submission_id"),
	submittedAt: timestamp("submitted_at", { mode: 'string' }),
	approvedById: text("approved_by_id"),
	approvedAt: timestamp("approved_at", { mode: 'string' }),
	metadata: jsonb(),
	createdAt: timestamp("created_at", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
	userName: text("user_name"),
	userEmail: text("user_email"),
	clientName: varchar("client_name", { length: 255 }),
	clientCode: varchar("client_code", { length: 50 }),
	taskTitle: varchar("task_title", { length: 255 }),
	serviceName: varchar("service_name", { length: 255 }),
	serviceCode: varchar("service_code", { length: 50 }),
	approverName: text("approver_name"),
}).as(sql`SELECT te.id, te.tenant_id, te.user_id, te.client_id, te.task_id, te.service_id, te.date, te.start_time, te.end_time, te.hours, te.work_type, te.billable, te.billed, te.rate, te.amount, te.invoice_id, te.description, te.notes, te.status, te.submission_id, te.submitted_at, te.approved_by_id, te.approved_at, te.metadata, te.created_at, te.updated_at, concat(u.first_name, ' ', u.last_name) AS user_name, u.email AS user_email, c.name AS client_name, c.client_code, t.title AS task_title, s.name AS service_name, s.code AS service_code, concat(a.first_name, ' ', a.last_name) AS approver_name FROM time_entries te LEFT JOIN users u ON te.user_id = u.id LEFT JOIN clients c ON te.client_id = c.id LEFT JOIN tasks t ON te.task_id = t.id LEFT JOIN services s ON te.service_id = s.id LEFT JOIN users a ON te.approved_by_id = a.id`);

export const activityFeedView = pgView("activity_feed_view", {	id: uuid(),
	tenantId: text("tenant_id"),
	entityType: varchar("entity_type", { length: 50 }),
	entityId: uuid("entity_id"),
	action: varchar({ length: 50 }),
	description: text(),
	userId: text("user_id"),
	userName: varchar("user_name", { length: 255 }),
	oldValues: jsonb("old_values"),
	newValues: jsonb("new_values"),
	ipAddress: varchar("ip_address", { length: 45 }),
	userAgent: text("user_agent"),
	metadata: jsonb(),
	createdAt: timestamp("created_at", { mode: 'string' }),
	entityName: varchar("entity_name"),
	userEmail: text("user_email"),
	userDisplayName: text("user_display_name"),
}).as(sql`SELECT al.id, al.tenant_id, al.entity_type, al.entity_id, al.action, al.description, al.user_id, al.user_name, al.old_values, al.new_values, al.ip_address, al.user_agent, al.metadata, al.created_at, CASE WHEN al.entity_type::text = 'client'::text THEN ( SELECT clients.name FROM clients WHERE clients.id = al.entity_id) WHEN al.entity_type::text = 'task'::text THEN ( SELECT tasks.title FROM tasks WHERE tasks.id = al.entity_id) WHEN al.entity_type::text = 'invoice'::text THEN ( SELECT invoices.invoice_number FROM invoices WHERE invoices.id = al.entity_id) WHEN al.entity_type::text = 'compliance'::text THEN ( SELECT compliance.title FROM compliance WHERE compliance.id = al.entity_id) ELSE NULL::character varying END AS entity_name, u.email AS user_email, concat(u.first_name, ' ', u.last_name) AS user_display_name FROM activity_logs al LEFT JOIN users u ON al.user_id = u.id ORDER BY al.created_at DESC`);

export const invoiceDetailsView = pgView("invoice_details_view", {	id: uuid(),
	tenantId: text("tenant_id"),
	invoiceNumber: varchar("invoice_number", { length: 50 }),
	clientId: uuid("client_id"),
	issueDate: date("issue_date"),
	dueDate: date("due_date"),
	paidDate: date("paid_date"),
	subtotal: numeric({ precision: 10, scale:  2 }),
	taxRate: numeric("tax_rate", { precision: 5, scale:  2 }),
	taxAmount: numeric("tax_amount", { precision: 10, scale:  2 }),
	discount: numeric({ precision: 10, scale:  2 }),
	total: numeric({ precision: 10, scale:  2 }),
	amountPaid: numeric("amount_paid", { precision: 10, scale:  2 }),
	status: invoiceStatus(),
	currency: varchar({ length: 3 }),
	notes: text(),
	terms: text(),
	poNumber: varchar("po_number", { length: 100 }),
	xeroInvoiceId: text("xero_invoice_id"),
	xeroSyncStatus: text("xero_sync_status"),
	xeroLastSyncedAt: timestamp("xero_last_synced_at", { mode: 'string' }),
	xeroSyncError: text("xero_sync_error"),
	metadata: jsonb(),
	createdAt: timestamp("created_at", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
	createdById: text("created_by_id"),
	clientName: varchar("client_name", { length: 255 }),
	clientCode: varchar("client_code", { length: 50 }),
	clientEmail: varchar("client_email", { length: 255 }),
	clientVatNumber: varchar("client_vat_number", { length: 50 }),
	clientAddressLine1: varchar("client_address_line1", { length: 255 }),
	clientAddressLine2: varchar("client_address_line2", { length: 255 }),
	clientCity: varchar("client_city", { length: 100 }),
	clientPostalCode: varchar("client_postal_code", { length: 20 }),
	clientCountry: varchar("client_country", { length: 100 }),
	createdByName: text("created_by_name"),
	balanceDue: numeric("balance_due"),
}).as(sql`SELECT i.id, i.tenant_id, i.invoice_number, i.client_id, i.issue_date, i.due_date, i.paid_date, i.subtotal, i.tax_rate, i.tax_amount, i.discount, i.total, i.amount_paid, i.status, i.currency, i.notes, i.terms, i.po_number, i.xero_invoice_id, i.xero_sync_status, i.xero_last_synced_at, i.xero_sync_error, i.metadata, i.created_at, i.updated_at, i.created_by_id, c.name AS client_name, c.client_code, c.email AS client_email, c.vat_number AS client_vat_number, c.address_line1 AS client_address_line1, c.address_line2 AS client_address_line2, c.city AS client_city, c.postal_code AS client_postal_code, c.country AS client_country, concat(u.first_name, ' ', u.last_name) AS created_by_name, i.total - i.amount_paid AS balance_due FROM invoices i LEFT JOIN clients c ON i.client_id = c.id LEFT JOIN users u ON i.created_by_id = u.id`);

export const dashboardKpiView = pgView("dashboard_kpi_view", {	tenantId: text("tenant_id"),
	totalRevenue: numeric("total_revenue"),
	collectedRevenue: numeric("collected_revenue"),
	outstandingRevenue: numeric("outstanding_revenue"),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	activeClients: bigint("active_clients", { mode: "number" }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	newClients30D: bigint("new_clients_30d", { mode: "number" }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	pendingTasks: bigint("pending_tasks", { mode: "number" }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	inProgressTasks: bigint("in_progress_tasks", { mode: "number" }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	completedTasks30D: bigint("completed_tasks_30d", { mode: "number" }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	overdueTasks: bigint("overdue_tasks", { mode: "number" }),
	totalHours30D: numeric("total_hours_30d"),
	billableHours30D: numeric("billable_hours_30d"),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	upcomingCompliance30D: bigint("upcoming_compliance_30d", { mode: "number" }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	overdueCompliance: bigint("overdue_compliance", { mode: "number" }),
}).as(sql`SELECT id AS tenant_id, ( SELECT COALESCE(sum(invoices.total), 0::numeric) AS "coalesce" FROM invoices WHERE invoices.tenant_id = t.id AND (invoices.status = ANY (ARRAY['paid'::invoice_status, 'sent'::invoice_status]))) AS total_revenue, ( SELECT COALESCE(sum(invoices.total), 0::numeric) AS "coalesce" FROM invoices WHERE invoices.tenant_id = t.id AND invoices.status = 'paid'::invoice_status) AS collected_revenue, ( SELECT COALESCE(sum(invoices.total - invoices.amount_paid), 0::numeric) AS "coalesce" FROM invoices WHERE invoices.tenant_id = t.id AND (invoices.status = ANY (ARRAY['sent'::invoice_status, 'overdue'::invoice_status]))) AS outstanding_revenue, ( SELECT count(*) AS count FROM clients WHERE clients.tenant_id = t.id AND clients.status = 'active'::client_status) AS active_clients, ( SELECT count(*) AS count FROM clients WHERE clients.tenant_id = t.id AND clients.created_at >= (CURRENT_DATE - '30 days'::interval)) AS new_clients_30d, ( SELECT count(*) AS count FROM tasks WHERE tasks.tenant_id = t.id AND tasks.status = 'pending'::task_status) AS pending_tasks, ( SELECT count(*) AS count FROM tasks WHERE tasks.tenant_id = t.id AND tasks.status = 'in_progress'::task_status) AS in_progress_tasks, ( SELECT count(*) AS count FROM tasks WHERE tasks.tenant_id = t.id AND tasks.status = 'completed'::task_status AND tasks.completed_at >= (CURRENT_DATE - '30 days'::interval)) AS completed_tasks_30d, ( SELECT count(*) AS count FROM tasks WHERE tasks.tenant_id = t.id AND tasks.due_date < CURRENT_DATE AND (tasks.status <> ALL (ARRAY['completed'::task_status, 'cancelled'::task_status]))) AS overdue_tasks, ( SELECT COALESCE(sum(time_entries.hours), 0::numeric) AS "coalesce" FROM time_entries WHERE time_entries.tenant_id = t.id AND time_entries.date >= (CURRENT_DATE - '30 days'::interval)) AS total_hours_30d, ( SELECT COALESCE(sum(time_entries.hours), 0::numeric) AS "coalesce" FROM time_entries WHERE time_entries.tenant_id = t.id AND time_entries.billable = true AND time_entries.date >= (CURRENT_DATE - '30 days'::interval)) AS billable_hours_30d, ( SELECT count(*) AS count FROM compliance WHERE compliance.tenant_id = t.id AND compliance.status <> 'completed'::compliance_status AND compliance.due_date >= CURRENT_DATE AND compliance.due_date <= (CURRENT_DATE + '30 days'::interval)) AS upcoming_compliance_30d, ( SELECT count(*) AS count FROM compliance WHERE compliance.tenant_id = t.id AND compliance.status <> 'completed'::compliance_status AND compliance.due_date < CURRENT_DATE) AS overdue_compliance FROM tenants t`);

export const monthlyRevenueView = pgView("monthly_revenue_view", {	tenantId: text("tenant_id"),
	month: timestamp({ withTimezone: true, mode: 'string' }),
	invoiced: numeric(),
	collected: numeric(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	invoiceCount: bigint("invoice_count", { mode: "number" }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	uniqueClients: bigint("unique_clients", { mode: "number" }),
}).as(sql`SELECT tenant_id, date_trunc('month'::text, issue_date::timestamp with time zone) AS month, sum( CASE WHEN status = ANY (ARRAY['sent'::invoice_status, 'paid'::invoice_status, 'overdue'::invoice_status]) THEN total ELSE 0::numeric END) AS invoiced, sum( CASE WHEN status = 'paid'::invoice_status THEN total ELSE 0::numeric END) AS collected, count(*) AS invoice_count, count(DISTINCT client_id) AS unique_clients FROM invoices GROUP BY tenant_id, (date_trunc('month'::text, issue_date::timestamp with time zone)) ORDER BY tenant_id, (date_trunc('month'::text, issue_date::timestamp with time zone)) DESC`);

export const clientRevenueView = pgView("client_revenue_view", {	tenantId: text("tenant_id"),
	clientId: uuid("client_id"),
	clientName: varchar("client_name", { length: 255 }),
	clientCode: varchar("client_code", { length: 50 }),
	totalInvoiced: numeric("total_invoiced"),
	totalPaid: numeric("total_paid"),
	outstanding: numeric(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	invoiceCount: bigint("invoice_count", { mode: "number" }),
	firstInvoiceDate: date("first_invoice_date"),
	lastInvoiceDate: date("last_invoice_date"),
}).as(sql`SELECT i.tenant_id, i.client_id, c.name AS client_name, c.client_code, sum(i.total) AS total_invoiced, sum(i.amount_paid) AS total_paid, sum(i.total - i.amount_paid) AS outstanding, count(i.id) AS invoice_count, min(i.issue_date) AS first_invoice_date, max(i.issue_date) AS last_invoice_date FROM invoices i LEFT JOIN clients c ON i.client_id = c.id WHERE i.status = ANY (ARRAY['sent'::invoice_status, 'paid'::invoice_status, 'overdue'::invoice_status]) GROUP BY i.tenant_id, i.client_id, c.name, c.client_code`);