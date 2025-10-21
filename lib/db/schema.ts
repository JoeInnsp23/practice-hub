import {
  boolean,
  date,
  decimal,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  pgView,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

// Tenants table - for multi-tenancy
export const tenants = pgTable("tenants", {
  id: text("id").primaryKey(), // Changed from uuid to text for Better Auth compatibility
  name: text("name").notNull(),
  slug: text("slug").unique().notNull(),
  metadata: jsonb("metadata"), // For storing pricing config and other tenant-specific data
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Users table - Better Auth compatible schema with tenant extension
export const users = pgTable(
  "users",
  {
    id: text("id").primaryKey(), // Better Auth requires text ID
    tenantId: text("tenant_id")
      .references(() => tenants.id)
      .notNull(),
    email: text("email").notNull().unique(),
    emailVerified: boolean("email_verified").default(false).notNull(),
    name: text("name"),
    firstName: varchar("first_name", { length: 100 }),
    lastName: varchar("last_name", { length: 100 }),
    image: text("image"),
    role: varchar("role", { length: 50 }).default("member").notNull(), // admin, accountant, member
    status: varchar("status", { length: 20 }).default("active").notNull(), // pending, active, inactive
    isActive: boolean("is_active").default(true).notNull(),
    hourlyRate: decimal("hourly_rate", { precision: 10, scale: 2 }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => ({
    emailTenantIdx: uniqueIndex("idx_tenant_email").on(
      table.tenantId,
      table.email,
    ),
    roleIdx: index("idx_user_role").on(table.role),
  }),
);

// Better Auth tables - Using official generated schema
export const sessions = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  activeOrganizationId: text("active_organization_id"), // Better Auth organization plugin
});

export const accounts = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

export const verifications = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

// Invitations table - for user invitations from admins
export const invitations = pgTable(
  "invitations",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: text("tenant_id")
      .references(() => tenants.id, { onDelete: "cascade" })
      .notNull(),
    email: text("email").notNull(),
    role: varchar("role", { length: 50 }).default("member").notNull(), // admin, accountant, member
    token: text("token").notNull().unique(),
    invitedBy: text("invited_by")
      .references(() => users.id)
      .notNull(),
    customMessage: text("custom_message"), // Optional personalized message from admin
    status: varchar("status", { length: 20 }).default("pending").notNull(), // pending, accepted, expired, cancelled
    expiresAt: timestamp("expires_at").notNull(),
    acceptedAt: timestamp("accepted_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => ({
    tokenIdx: uniqueIndex("idx_invitation_token").on(table.token),
    emailTenantIdx: index("idx_invitation_email_tenant").on(
      table.email,
      table.tenantId,
    ),
    statusIdx: index("idx_invitation_status").on(table.status),
  }),
);

// Feedback table - for user feedback and issues
export const feedback = pgTable(
  "feedback",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: text("tenant_id")
      .references(() => tenants.id, { onDelete: "cascade" })
      .notNull(),

    // User Information
    userId: varchar("user_id", { length: 255 }).notNull(),
    userEmail: varchar("user_email", { length: 255 }).notNull(),
    userName: varchar("user_name", { length: 255 }),
    userRole: varchar("user_role", { length: 50 }),

    // Feedback Details
    type: varchar("type", { length: 50 }).notNull(), // issue, feature_request, general
    title: varchar("title", { length: 255 }).notNull(),
    description: text("description").notNull(),
    category: varchar("category", { length: 50 }), // ui, performance, functionality, data, etc.

    // Technical Information
    pageUrl: varchar("page_url", { length: 500 }),
    userAgent: text("user_agent"),
    consoleLogs: text("console_logs"), // Captured console output
    screenshot: text("screenshot"), // Base64 encoded screenshot

    // Status Tracking
    status: varchar("status", { length: 50 }).default("new"), // new, in_progress, resolved, wont_fix
    priority: varchar("priority", { length: 20 }).default("medium"), // low, medium, high, critical
    assignedTo: varchar("assigned_to", { length: 255 }),

    // Response
    adminNotes: text("admin_notes"),
    resolution: text("resolution"),
    resolvedAt: timestamp("resolved_at"),
    resolvedBy: varchar("resolved_by", { length: 255 }),

    // Metadata
    metadata: jsonb("metadata"), // Additional structured data

    // Timestamps
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    tenantStatusIdx: index("idx_feedback_tenant_status").on(
      table.tenantId,
      table.status,
    ),
    userIdx: index("idx_feedback_user").on(table.userId),
    typeIdx: index("idx_feedback_type").on(table.type, table.status),
    createdAtIdx: index("idx_feedback_created_at").on(table.createdAt),
  }),
);

// Enums for CRM entities
export const clientTypeEnum = pgEnum("client_type", [
  "individual",
  "company",
  "limited_company",
  "sole_trader",
  "partnership",
  "llp",
  "trust",
  "charity",
  "other",
]);
export const clientStatusEnum = pgEnum("client_status", [
  "prospect",
  "onboarding",
  "active",
  "inactive",
  "archived",
]);
export const taskStatusEnum = pgEnum("task_status", [
  "pending",
  "in_progress",
  "review",
  "completed",
  "cancelled",
  "blocked",
  "records_received",
  "queries_sent",
  "queries_received",
]);
export const taskPriorityEnum = pgEnum("task_priority", [
  "low",
  "medium",
  "high",
  "urgent",
  "critical",
]);
export const documentTypeEnum = pgEnum("document_type", ["file", "folder"]);
export const invoiceStatusEnum = pgEnum("invoice_status", [
  "draft",
  "sent",
  "paid",
  "overdue",
  "cancelled",
]);

// Work Type enum for time entries
export const workTypeEnum = pgEnum("work_type", [
  "work",
  "admin",
  "training",
  "meeting",
  "business_development",
  "research",
  "holiday",
  "sick",
  "time_off_in_lieu",
]);

// Time Entry Status enum
export const timeEntryStatusEnum = pgEnum("time_entry_status", [
  "draft",
  "submitted",
  "approved",
  "rejected",
]);

// Clients table
export const clients = pgTable(
  "clients",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: text("tenant_id")
      .references(() => tenants.id, { onDelete: "cascade" })
      .notNull(),
    clientCode: varchar("client_code", { length: 50 }).notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    type: clientTypeEnum("type").notNull(),
    status: clientStatusEnum("status").default("onboarding").notNull(),
    email: varchar("email", { length: 255 }),
    phone: varchar("phone", { length: 50 }),
    website: varchar("website", { length: 255 }),
    vatRegistered: boolean("vat_registered").default(false).notNull(),
    vatNumber: varchar("vat_number", { length: 50 }),
    registrationNumber: varchar("registration_number", { length: 50 }),

    // Address fields
    addressLine1: varchar("address_line1", { length: 255 }),
    addressLine2: varchar("address_line2", { length: 255 }),
    city: varchar("city", { length: 100 }),
    state: varchar("state", { length: 100 }),
    postalCode: varchar("postal_code", { length: 20 }),
    country: varchar("country", { length: 100 }),

    // Relationship fields
    accountManagerId: text("account_manager_id").references(() => users.id, {
      onDelete: "set null",
    }),
    parentClientId: uuid("parent_client_id"),

    // Business fields
    incorporationDate: date("incorporation_date"),
    yearEnd: varchar("year_end", { length: 10 }), // MM-DD format
    notes: text("notes"),
    healthScore: integer("health_score").default(50), // 0-100 scale for client health
    metadata: jsonb("metadata"),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
    createdBy: text("created_by").references(() => users.id),
  },
  (table) => ({
    tenantClientCodeIdx: uniqueIndex("idx_tenant_client_code").on(
      table.tenantId,
      table.clientCode,
    ),
    nameIdx: index("idx_client_name").on(table.name),
    statusIdx: index("idx_client_status").on(table.status),
    managerIdx: index("idx_client_manager").on(table.accountManagerId),
  }),
);

// Client Contacts table
export const clientContacts = pgTable(
  "client_contacts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: text("tenant_id")
      .references(() => tenants.id, { onDelete: "cascade" })
      .notNull(),
    clientId: uuid("client_id")
      .references(() => clients.id, { onDelete: "cascade" })
      .notNull(),
    isPrimary: boolean("is_primary").default(false).notNull(),
    title: varchar("title", { length: 50 }),
    firstName: varchar("first_name", { length: 100 }).notNull(),
    middleName: varchar("middle_name", { length: 100 }),
    lastName: varchar("last_name", { length: 100 }).notNull(),
    email: varchar("email", { length: 255 }),
    phone: varchar("phone", { length: 50 }),
    mobile: varchar("mobile", { length: 50 }),
    jobTitle: varchar("job_title", { length: 100 }),
    position: varchar("position", { length: 100 }),
    department: varchar("department", { length: 100 }),

    // Address fields
    addressLine1: varchar("address_line_1", { length: 255 }),
    addressLine2: varchar("address_line_2", { length: 255 }),
    city: varchar("city", { length: 100 }),
    region: varchar("region", { length: 100 }),
    postalCode: varchar("postal_code", { length: 20 }),
    country: varchar("country", { length: 100 }),

    notes: text("notes"),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    clientContactIdx: index("idx_client_contact").on(table.clientId),
    primaryContactIdx: index("idx_primary_contact").on(
      table.clientId,
      table.isPrimary,
    ),
  }),
);

// Client Directors table
export const clientDirectors = pgTable(
  "client_directors",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: text("tenant_id")
      .references(() => tenants.id, { onDelete: "cascade" })
      .notNull(),
    clientId: uuid("client_id")
      .references(() => clients.id, { onDelete: "cascade" })
      .notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    officerRole: varchar("officer_role", { length: 100 }), // director, secretary, etc.
    appointedOn: date("appointed_on"),
    resignedOn: date("resigned_on"),
    isActive: boolean("is_active").default(true).notNull(),
    nationality: varchar("nationality", { length: 100 }),
    occupation: varchar("occupation", { length: 100 }),
    dateOfBirth: varchar("date_of_birth", { length: 20 }), // Month and year only from Companies House
    address: text("address"), // Service address
    metadata: jsonb("metadata"), // For additional Companies House data
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    clientDirectorIdx: index("idx_client_director").on(table.clientId),
    activeIdx: index("idx_director_active").on(table.isActive),
  }),
);

// Client PSCs (Persons with Significant Control) table
export const clientPSCs = pgTable(
  "client_pscs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: text("tenant_id")
      .references(() => tenants.id, { onDelete: "cascade" })
      .notNull(),
    clientId: uuid("client_id")
      .references(() => clients.id, { onDelete: "cascade" })
      .notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    kind: varchar("kind", { length: 100 }), // individual-person-with-significant-control, corporate-entity-person-with-significant-control
    notifiedOn: date("notified_on"),
    ceasedOn: date("ceased_on"),
    isActive: boolean("is_active").default(true).notNull(),
    nationality: varchar("nationality", { length: 100 }),
    dateOfBirth: varchar("date_of_birth", { length: 20 }), // Month and year only
    naturesOfControl: jsonb("natures_of_control"), // Array of control types
    address: text("address"), // Service address
    metadata: jsonb("metadata"), // For additional Companies House data
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    clientPSCIdx: index("idx_client_psc").on(table.clientId),
    activeIdx: index("idx_psc_active").on(table.isActive),
  }),
);

// Service Price Type Enum
export const servicePriceTypeEnum = pgEnum("service_price_type", [
  "hourly",
  "fixed",
  "retainer",
  "project",
  "percentage",
]);

// Services table
export const services = pgTable(
  "services",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: text("tenant_id")
      .references(() => tenants.id, { onDelete: "cascade" })
      .notNull(),
    code: varchar("code", { length: 50 }).notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description"),
    category: varchar("category", { length: 100 }),

    // Pricing fields
    defaultRate: decimal("default_rate", { precision: 10, scale: 2 }),
    price: decimal("price", { precision: 10, scale: 2 }), // Alias for defaultRate
    priceType: servicePriceTypeEnum("price_type").default("fixed"),
    duration: integer("duration"), // Duration in minutes

    // Additional fields
    tags: jsonb("tags"), // Array of strings
    isActive: boolean("is_active").default(true).notNull(),
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    tenantServiceCodeIdx: uniqueIndex("idx_tenant_service_code").on(
      table.tenantId,
      table.code,
    ),
    categoryIdx: index("idx_service_category").on(table.category),
  }),
);

// Client Services table (many-to-many)
export const clientServices = pgTable(
  "client_services",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: text("tenant_id")
      .references(() => tenants.id, { onDelete: "cascade" })
      .notNull(),
    clientId: uuid("client_id")
      .references(() => clients.id, { onDelete: "cascade" })
      .notNull(),
    serviceComponentId: uuid("service_component_id")
      .references(() => serviceComponents.id, { onDelete: "cascade" })
      .notNull(),
    customRate: decimal("custom_rate", { precision: 10, scale: 2 }),
    startDate: date("start_date"),
    endDate: date("end_date"),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    clientServiceIdx: uniqueIndex("idx_client_service").on(
      table.clientId,
      table.serviceComponentId,
    ),
  }),
);

// Xero Connections table - Stores OAuth tokens for Xero API integration
export const xeroConnections = pgTable(
  "xero_connections",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: text("tenant_id")
      .references(() => tenants.id, { onDelete: "cascade" })
      .notNull(),
    clientId: uuid("client_id")
      .references(() => clients.id, { onDelete: "cascade" })
      .notNull(),

    // Xero OAuth tokens
    accessToken: text("access_token").notNull(),
    refreshToken: text("refresh_token").notNull(),
    expiresAt: timestamp("expires_at").notNull(),

    // Xero organization details
    xeroTenantId: text("xero_tenant_id").notNull(), // Xero's tenant ID (different from our tenantId)
    xeroTenantName: text("xero_tenant_name"),
    xeroOrganisationId: text("xero_organisation_id"),

    // Connection metadata
    isActive: boolean("is_active").default(true).notNull(),
    lastSyncAt: timestamp("last_sync_at"),
    syncStatus: varchar("sync_status", { length: 50 }).default("connected"), // connected, error, disconnected
    syncError: text("sync_error"),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
    connectedBy: text("connected_by").references(() => users.id),
  },
  (table) => ({
    clientIdx: uniqueIndex("idx_xero_client").on(table.clientId),
    tenantIdx: index("idx_xero_tenant").on(table.tenantId),
  }),
);

// Tasks table
export const tasks = pgTable(
  "tasks",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: text("tenant_id")
      .references(() => tenants.id, { onDelete: "cascade" })
      .notNull(),
    title: varchar("title", { length: 255 }).notNull(),
    description: text("description"),
    status: taskStatusEnum("status").default("pending").notNull(),
    priority: taskPriorityEnum("priority").default("medium").notNull(),

    // Assignment
    clientId: uuid("client_id").references(() => clients.id, {
      onDelete: "set null",
    }),
    assignedToId: text("assigned_to_id").references(() => users.id, {
      onDelete: "set null",
    }),
    reviewerId: text("reviewer_id").references(() => users.id, {
      onDelete: "set null",
    }),
    createdById: text("created_by_id")
      .references(() => users.id, { onDelete: "set null" })
      .notNull(),

    // Dates
    dueDate: timestamp("due_date"),
    targetDate: timestamp("target_date"),
    completedAt: timestamp("completed_at"),
    estimatedHours: decimal("estimated_hours", { precision: 5, scale: 2 }),
    actualHours: decimal("actual_hours", { precision: 5, scale: 2 }),

    // Progress tracking
    progress: integer("progress").default(0), // 0-100 percentage
    taskType: varchar("task_type", { length: 100 }),

    // Categorization
    category: varchar("category", { length: 100 }),
    tags: jsonb("tags"),

    // Parent task for subtasks
    parentTaskId: uuid("parent_task_id"),

    // Workflow
    workflowId: uuid("workflow_id"),
    isRecurring: boolean("is_recurring").default(false),
    recurringPattern: jsonb("recurring_pattern"),

    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    assigneeIdx: index("idx_task_assignee").on(table.assignedToId),
    reviewerIdx: index("idx_task_reviewer").on(table.reviewerId),
    clientTaskIdx: index("idx_task_client").on(table.clientId),
    statusIdx: index("idx_task_status").on(table.status),
    dueDateIdx: index("idx_task_due_date").on(table.dueDate),
    parentTaskIdx: index("idx_parent_task").on(table.parentTaskId),
    progressIdx: index("idx_task_progress").on(table.progress),
  }),
);

// Time Entries table
export const timeEntries = pgTable(
  "time_entries",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: text("tenant_id")
      .references(() => tenants.id, { onDelete: "cascade" })
      .notNull(),
    userId: text("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    clientId: uuid("client_id").references(() => clients.id, {
      onDelete: "set null",
    }),
    taskId: uuid("task_id").references(() => tasks.id, {
      onDelete: "set null",
    }),
    serviceComponentId: uuid("service_component_id").references(
      () => serviceComponents.id,
      { onDelete: "set null" },
    ),

    // Time tracking
    date: date("date").notNull(),
    startTime: varchar("start_time", { length: 8 }), // HH:MM:SS
    endTime: varchar("end_time", { length: 8 }), // HH:MM:SS
    hours: decimal("hours", { precision: 5, scale: 2 }).notNull(),

    // Work type
    workType: workTypeEnum("work_type").default("work").notNull(),

    // Billing
    billable: boolean("billable").default(true).notNull(),
    billed: boolean("billed").default(false).notNull(),
    rate: decimal("rate", { precision: 10, scale: 2 }),
    amount: decimal("amount", { precision: 10, scale: 2 }),
    invoiceId: uuid("invoice_id"),

    description: text("description"),
    notes: text("notes"),

    // Approval workflow
    status: timeEntryStatusEnum("status").default("draft").notNull(),
    submittedAt: timestamp("submitted_at"),
    approvedById: text("approved_by_id").references(() => users.id, {
      onDelete: "set null",
    }),
    approvedAt: timestamp("approved_at"),

    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    userDateIdx: index("idx_time_entry_user_date").on(table.userId, table.date),
    clientTimeIdx: index("idx_time_entry_client").on(table.clientId),
    taskTimeIdx: index("idx_time_entry_task").on(table.taskId),
    billableIdx: index("idx_time_entry_billable").on(
      table.billable,
      table.billed,
    ),
    statusIdx: index("idx_time_entry_status").on(table.status),
  }),
);

// Documents table
export const documents = pgTable(
  "documents",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: text("tenant_id")
      .references(() => tenants.id, { onDelete: "cascade" })
      .notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    type: documentTypeEnum("type").notNull(),

    // File information
    mimeType: varchar("mime_type", { length: 100 }),
    size: integer("size"), // in bytes
    url: text("url"),
    thumbnailUrl: text("thumbnail_url"),

    // Folder structure
    parentId: uuid("parent_id"),
    path: text("path"), // Full path for quick lookups

    // Associations
    clientId: uuid("client_id").references(() => clients.id, {
      onDelete: "cascade",
    }),
    taskId: uuid("task_id").references(() => tasks.id, { onDelete: "cascade" }),

    // Metadata
    description: text("description"),
    tags: jsonb("tags"),
    version: integer("version").default(1),
    isArchived: boolean("is_archived").default(false),

    // Sharing
    isPublic: boolean("is_public").default(false),
    shareToken: varchar("share_token", { length: 100 }),
    shareExpiresAt: timestamp("share_expires_at"),

    // Upload info
    uploadedById: text("uploaded_by_id")
      .references(() => users.id, { onDelete: "set null" })
      .notNull(),

    // Signature fields
    requiresSignature: boolean("requires_signature").default(false).notNull(),
    signatureStatus: varchar("signature_status", { length: 20 }).default(
      "none",
    ), // 'none' | 'pending' | 'signed' | 'declined'
    docusealSubmissionId: text("docuseal_submission_id"),
    docusealTemplateId: text("docuseal_template_id"),
    signedPdfUrl: text("signed_pdf_url"), // DEPRECATED: Use signedPdfKey instead
    signedPdfKey: text("signed_pdf_key"), // S3 key for secure presigned URL access
    signedPdfUrlExpiresAt: timestamp("signed_pdf_url_expires_at"), // Optional: Track presigned URL expiration for auditing
    signedAt: timestamp("signed_at"),
    signedBy: varchar("signed_by", { length: 255 }),

    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    parentIdx: index("idx_document_parent").on(table.parentId),
    clientDocIdx: index("idx_document_client").on(table.clientId),
    taskDocIdx: index("idx_document_task").on(table.taskId),
    pathIdx: index("idx_document_path").on(table.path),
    shareTokenIdx: index("idx_document_share_token").on(table.shareToken),
  }),
);

// Document Signatures table - Audit trail for document signatures
export const documentSignatures = pgTable(
  "document_signatures",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    documentId: uuid("document_id")
      .references(() => documents.id, { onDelete: "cascade" })
      .notNull(),
    tenantId: text("tenant_id")
      .references(() => tenants.id, { onDelete: "cascade" })
      .notNull(),

    // Signer information
    signerEmail: varchar("signer_email", { length: 255 }).notNull(),
    signerName: varchar("signer_name", { length: 255 }).notNull(),

    // DocuSeal integration
    docusealSubmissionId: text("docuseal_submission_id").notNull().unique(),
    auditTrail: jsonb("audit_trail").notNull(), // Full audit metadata from DocuSeal
    documentHash: text("document_hash"), // SHA-256 of signed PDF

    // Signed PDF
    signedPdfUrl: text("signed_pdf_url"),

    // Timestamps
    signedAt: timestamp("signed_at").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    documentIdx: index("idx_document_signature_document").on(table.documentId),
    submissionIdx: index("idx_document_signature_submission").on(
      table.docusealSubmissionId,
    ),
  }),
);

// Invoices table
export const invoices = pgTable(
  "invoices",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: text("tenant_id")
      .references(() => tenants.id, { onDelete: "cascade" })
      .notNull(),
    invoiceNumber: varchar("invoice_number", { length: 50 }).notNull(),
    clientId: uuid("client_id")
      .references(() => clients.id, { onDelete: "restrict" })
      .notNull(),

    // Dates
    issueDate: date("issue_date").notNull(),
    dueDate: date("due_date").notNull(),
    paidDate: date("paid_date"),

    // Amounts
    subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
    taxRate: decimal("tax_rate", { precision: 5, scale: 2 }).default("0"),
    taxAmount: decimal("tax_amount", { precision: 10, scale: 2 }).default("0"),
    discount: decimal("discount", { precision: 10, scale: 2 }).default("0"),
    total: decimal("total", { precision: 10, scale: 2 }).notNull(),
    amountPaid: decimal("amount_paid", { precision: 10, scale: 2 }).default(
      "0",
    ),

    status: invoiceStatusEnum("status").default("draft").notNull(),

    // Details
    currency: varchar("currency", { length: 3 }).default("GBP"),
    notes: text("notes"),
    terms: text("terms"),

    // References
    purchaseOrderNumber: varchar("po_number", { length: 100 }),

    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
    createdById: text("created_by_id").references(() => users.id, {
      onDelete: "set null",
    }),
  },
  (table) => ({
    tenantInvoiceNumberIdx: uniqueIndex("idx_tenant_invoice_number").on(
      table.tenantId,
      table.invoiceNumber,
    ),
    clientInvoiceIdx: index("idx_invoice_client").on(table.clientId),
    statusIdx: index("idx_invoice_status").on(table.status),
    dueDateIdx: index("idx_invoice_due_date").on(table.dueDate),
  }),
);

// Invoice Items table
export const invoiceItems = pgTable(
  "invoice_items",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    invoiceId: uuid("invoice_id")
      .references(() => invoices.id, { onDelete: "cascade" })
      .notNull(),
    description: text("description").notNull(),
    quantity: decimal("quantity", { precision: 10, scale: 2 }).notNull(),
    rate: decimal("rate", { precision: 10, scale: 2 }).notNull(),
    amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),

    // References
    timeEntryId: uuid("time_entry_id").references(() => timeEntries.id, {
      onDelete: "set null",
    }),
    serviceComponentId: uuid("service_component_id").references(
      () => serviceComponents.id,
      { onDelete: "set null" },
    ),

    sortOrder: integer("sort_order").default(0),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    invoiceIdx: index("idx_invoice_item_invoice").on(table.invoiceId),
  }),
);

// Workflows table
export const workflows = pgTable(
  "workflows",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: text("tenant_id")
      .references(() => tenants.id, { onDelete: "cascade" })
      .notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description"),
    type: varchar("type", { length: 50 }).notNull(), // task_template, automation, approval
    trigger: varchar("trigger", { length: 100 }), // manual, schedule, event
    isActive: boolean("is_active").default(true).notNull(),
    estimatedDays: integer("estimated_days"),

    // Service association
    serviceComponentId: uuid("service_component_id").references(
      () => serviceComponents.id,
      { onDelete: "set null" },
    ),

    // Configuration
    config: jsonb("config").notNull(), // Workflow-specific configuration
    conditions: jsonb("conditions"), // Conditions for automatic triggers
    actions: jsonb("actions"), // Actions to perform

    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
    createdById: text("created_by_id").references(() => users.id, {
      onDelete: "set null",
    }),
  },
  (table) => ({
    typeIdx: index("idx_workflow_type").on(table.type),
    activeIdx: index("idx_workflow_active").on(table.isActive),
    serviceIdx: index("idx_workflow_service").on(table.serviceComponentId),
  }),
);

// ============================================
// NEW SCHEMA ENHANCEMENTS
// ============================================

// Compliance Status Enum
export const complianceStatusEnum = pgEnum("compliance_status", [
  "pending",
  "in_progress",
  "completed",
  "overdue",
]);

// Compliance Priority Enum
export const compliancePriorityEnum = pgEnum("compliance_priority", [
  "low",
  "medium",
  "high",
  "urgent",
]);

// Compliance table
export const compliance = pgTable(
  "compliance",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: text("tenant_id")
      .references(() => tenants.id, { onDelete: "cascade" })
      .notNull(),

    // Core fields
    title: varchar("title", { length: 255 }).notNull(),
    type: varchar("type", { length: 100 }).notNull(), // VAT Return, Annual Accounts, CT600, etc.
    description: text("description"),

    // Relationships
    clientId: uuid("client_id")
      .references(() => clients.id, { onDelete: "cascade" })
      .notNull(),
    assignedToId: text("assigned_to_id").references(() => users.id, {
      onDelete: "set null",
    }),

    // Dates
    dueDate: timestamp("due_date").notNull(),
    completedDate: timestamp("completed_date"),
    reminderDate: timestamp("reminder_date"),

    // Status
    status: complianceStatusEnum("status").default("pending").notNull(),
    priority: compliancePriorityEnum("priority").default("medium").notNull(),

    // Additional fields
    notes: text("notes"),
    attachments: jsonb("attachments"), // Array of document IDs or URLs
    metadata: jsonb("metadata"),

    // Timestamps
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
    createdById: text("created_by_id").references(() => users.id, {
      onDelete: "set null",
    }),
  },
  (table) => ({
    clientIdx: index("idx_compliance_client").on(table.clientId),
    assigneeIdx: index("idx_compliance_assignee").on(table.assignedToId),
    statusIdx: index("idx_compliance_status").on(table.status),
    dueDateIdx: index("idx_compliance_due_date").on(table.dueDate),
    typeIdx: index("idx_compliance_type").on(table.type),
  }),
);

// ============================================
// PROPOSAL HUB & PRICING SYSTEM
// ============================================

// Service Component Category Enum
export const serviceComponentCategoryEnum = pgEnum(
  "service_component_category",
  [
    "compliance",
    "vat",
    "bookkeeping",
    "payroll",
    "management",
    "secretarial",
    "tax_planning",
    "addon",
  ],
);

// Pricing Model Enum
export const pricingModelEnum = pgEnum("pricing_model", [
  "turnover",
  "transaction",
  "both",
  "fixed",
]);

// Pricing Rule Type Enum
export const pricingRuleTypeEnum = pgEnum("pricing_rule_type", [
  "turnover_band",
  "transaction_band",
  "employee_band",
  "per_unit",
  "fixed",
]);

// Lead Status Enum
export const leadStatusEnum = pgEnum("lead_status", [
  "new",
  "contacted",
  "qualified",
  "proposal_sent",
  "negotiating",
  "converted",
  "lost",
]);

// Proposal Status Enum
export const proposalStatusEnum = pgEnum("proposal_status", [
  "draft",
  "sent",
  "viewed",
  "signed",
  "rejected",
  "expired",
]);

// Proposal Sales Stage Enum - tracks sales pipeline stage independently from document status
export const salesStageEnum = pgEnum("sales_stage", [
  "enquiry",
  "qualified",
  "proposal_sent",
  "follow_up",
  "won",
  "lost",
  "dormant",
]);

// Transaction Data Source Enum
export const transactionDataSourceEnum = pgEnum("transaction_data_source", [
  "xero",
  "manual",
  "estimated",
]);

// Service Components table - catalog of all services (master table)
export const serviceComponents = pgTable(
  "service_components",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: text("tenant_id")
      .references(() => tenants.id, { onDelete: "cascade" })
      .notNull(),

    // Core fields
    code: varchar("code", { length: 50 }).notNull(), // e.g., 'COMP_ACCOUNTS', 'BOOK_BASIC'
    name: varchar("name", { length: 255 }).notNull(),
    category: serviceComponentCategoryEnum("category").notNull(),
    description: text("description"),

    // Pricing configuration
    pricingModel: pricingModelEnum("pricing_model").notNull(),
    basePrice: decimal("base_price", { precision: 10, scale: 2 }),
    price: decimal("price", { precision: 10, scale: 2 }), // Alias for basePrice
    priceType: servicePriceTypeEnum("price_type").default("fixed"),
    defaultRate: decimal("default_rate", { precision: 10, scale: 2 }),
    duration: integer("duration"), // Duration in minutes
    supportsComplexity: boolean("supports_complexity").default(false).notNull(),

    // Additional fields
    tags: jsonb("tags"), // Array of strings

    // Status
    isActive: boolean("is_active").default(true).notNull(),

    // Metadata
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    tenantCodeIdx: uniqueIndex("idx_service_component_code").on(
      table.tenantId,
      table.code,
    ),
    categoryIdx: index("idx_service_component_category").on(table.category),
    activeIdx: index("idx_service_component_active").on(table.isActive),
  }),
);

// Pricing Rules table - defines pricing for each service component
export const pricingRules = pgTable(
  "pricing_rules",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: text("tenant_id")
      .references(() => tenants.id, { onDelete: "cascade" })
      .notNull(),
    componentId: uuid("component_id")
      .references(() => serviceComponents.id, { onDelete: "cascade" })
      .notNull(),

    // Rule type and range
    ruleType: pricingRuleTypeEnum("rule_type").notNull(),
    minValue: decimal("min_value", { precision: 15, scale: 2 }), // For bands
    maxValue: decimal("max_value", { precision: 15, scale: 2 }), // For bands
    price: decimal("price", { precision: 10, scale: 2 }).notNull(),

    // Optional complexity level
    complexityLevel: varchar("complexity_level", { length: 50 }), // clean, average, complex, disaster

    // Additional configuration
    metadata: jsonb("metadata"), // Additional rule config
    isActive: boolean("is_active").default(true).notNull(),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    componentIdx: index("idx_pricing_rule_component").on(table.componentId),
    ruleTypeIdx: index("idx_pricing_rule_type").on(table.ruleType),
    activeIdx: index("idx_pricing_rule_active").on(table.isActive),
  }),
);

// Leads table - prospect/lead management
export const leads = pgTable(
  "leads",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: text("tenant_id")
      .references(() => tenants.id, { onDelete: "cascade" })
      .notNull(),

    // Lead information
    firstName: varchar("first_name", { length: 100 }).notNull(),
    lastName: varchar("last_name", { length: 100 }).notNull(),
    email: varchar("email", { length: 255 }).notNull(),
    phone: varchar("phone", { length: 50 }),
    mobile: varchar("mobile", { length: 50 }),

    // Company information
    companyName: varchar("company_name", { length: 255 }),
    position: varchar("position", { length: 100 }),
    website: varchar("website", { length: 255 }),

    // Lead details
    status: leadStatusEnum("status").default("new").notNull(),
    source: varchar("source", { length: 100 }), // referral, website, cold_call, etc.
    industry: varchar("industry", { length: 100 }),
    estimatedTurnover: decimal("estimated_turnover", {
      precision: 15,
      scale: 2,
    }),
    estimatedEmployees: integer("estimated_employees"),

    // Lead qualification
    qualificationScore: integer("qualification_score"), // 1-10 rating
    interestedServices: jsonb("interested_services"), // Array of service codes

    // Tracking
    notes: text("notes"),
    lastContactedAt: timestamp("last_contacted_at"),
    nextFollowUpAt: timestamp("next_follow_up_at"),

    // Assignment
    assignedToId: text("assigned_to_id").references(() => users.id, {
      onDelete: "set null",
    }),

    // Conversion
    convertedToClientId: uuid("converted_to_client_id").references(
      () => clients.id,
      {
        onDelete: "set null",
      },
    ),
    convertedAt: timestamp("converted_at"),

    // Timestamps
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
    createdBy: text("created_by").references(() => users.id, {
      onDelete: "set null",
    }),
  },
  (table) => ({
    tenantIdx: index("idx_lead_tenant").on(table.tenantId),
    statusIdx: index("idx_lead_status").on(table.status),
    emailIdx: index("idx_lead_email").on(table.email),
    assignedIdx: index("idx_lead_assigned").on(table.assignedToId),
    createdAtIdx: index("idx_lead_created").on(table.createdAt),
  }),
);

// Proposals table - main proposal records
export const proposals = pgTable(
  "proposals",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: text("tenant_id")
      .references(() => tenants.id, { onDelete: "cascade" })
      .notNull(),

    // Relationships
    leadId: uuid("lead_id").references(() => leads.id, {
      onDelete: "set null",
    }),
    quoteId: uuid("quote_id"), // Future: reference to quotes table
    clientId: uuid("client_id").references(() => clients.id, {
      onDelete: "set null",
    }),

    // Proposal details
    proposalNumber: varchar("proposal_number", { length: 50 }).notNull(),
    title: varchar("title", { length: 255 }).notNull(),
    status: proposalStatusEnum("status").default("draft").notNull(),
    salesStage: salesStageEnum("sales_stage").default("enquiry").notNull(),

    // Business context (from lead/client)
    turnover: varchar("turnover", { length: 100 }),
    industry: varchar("industry", { length: 100 }),
    monthlyTransactions: integer("monthly_transactions"),

    // Pricing information
    pricingModelUsed: varchar("pricing_model_used", { length: 10 }), // 'A' or 'B'
    monthlyTotal: decimal("monthly_total", {
      precision: 10,
      scale: 2,
    }).notNull(),
    annualTotal: decimal("annual_total", { precision: 10, scale: 2 }).notNull(),

    // Document URLs
    pdfUrl: text("pdf_url"),
    signedPdfUrl: text("signed_pdf_url"),

    // DocuSeal integration
    docusealTemplateId: text("docuseal_template_id"),
    docusealSubmissionId: text("docuseal_submission_id"),
    docusealSignedPdfUrl: text("docuseal_signed_pdf_url"), // DEPRECATED: Use docusealSignedPdfKey instead
    docusealSignedPdfKey: text("docuseal_signed_pdf_key"), // S3 key for secure presigned URL access
    docusealSignedPdfUrlExpiresAt: timestamp("docuseal_signed_pdf_url_expires_at"), // Optional: Track presigned URL expiration for auditing
    documentHash: text("document_hash"), // SHA-256 hash of final signed PDF

    // Template and content
    templateId: uuid("template_id"),
    customTerms: text("custom_terms"),
    termsAndConditions: text("terms_and_conditions"),
    notes: text("notes"),
    validUntil: timestamp("valid_until"),

    // Version control
    version: integer("version").default(1).notNull(),

    // Additional data
    metadata: jsonb("metadata"), // For storing discounts, custom fields, etc.

    // Timestamps
    createdAt: timestamp("created_at").defaultNow().notNull(),
    sentAt: timestamp("sent_at"),
    viewedAt: timestamp("viewed_at"),
    signedAt: timestamp("signed_at"),
    expiresAt: timestamp("expires_at"),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),

    // Creator
    createdById: text("created_by_id").references(() => users.id, {
      onDelete: "set null",
    }),
  },
  (table) => ({
    tenantIdx: index("idx_proposal_tenant").on(table.tenantId),
    leadIdx: index("idx_proposal_lead").on(table.leadId),
    clientIdx: index("idx_proposal_client").on(table.clientId),
    statusIdx: index("idx_proposal_status").on(table.status),
    createdAtIdx: index("idx_proposal_created").on(table.createdAt),
    proposalNumberIdx: uniqueIndex("idx_proposal_number").on(
      table.tenantId,
      table.proposalNumber,
    ),
  }),
);

// Proposal Services table - individual services in a proposal
export const proposalServices = pgTable(
  "proposal_services",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: text("tenant_id")
      .references(() => tenants.id, { onDelete: "cascade" })
      .notNull(),
    proposalId: uuid("proposal_id")
      .references(() => proposals.id, { onDelete: "cascade" })
      .notNull(),

    // Service details (denormalized for snapshot)
    componentCode: varchar("component_code", { length: 50 }).notNull(),
    componentName: varchar("component_name", { length: 255 }).notNull(),
    calculation: text("calculation"), // Description of how price was calculated
    price: varchar("price", { length: 50 }).notNull(), // Stored as string for flexibility
    config: jsonb("config"), // Service-specific configuration (complexity, employees, etc.)

    // Sort order
    sortOrder: integer("sort_order").default(0),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    proposalIdx: index("idx_proposal_service_proposal").on(table.proposalId),
    componentCodeIdx: index("idx_proposal_service_code").on(
      table.componentCode,
    ),
  }),
);

// Proposal Versions table - stores historical versions of proposals
export const proposalVersions = pgTable(
  "proposal_versions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: text("tenant_id")
      .references(() => tenants.id, { onDelete: "cascade" })
      .notNull(),

    // Relationships
    proposalId: uuid("proposal_id")
      .references(() => proposals.id, { onDelete: "cascade" })
      .notNull(),

    // Version information
    version: integer("version").notNull(), // 1, 2, 3, etc.

    // Snapshot of proposal data at this version
    proposalNumber: varchar("proposal_number", { length: 50 }).notNull(),
    title: varchar("title", { length: 255 }).notNull(),
    status: proposalStatusEnum("status").notNull(),

    // Business context
    turnover: varchar("turnover", { length: 100 }),
    industry: varchar("industry", { length: 100 }),
    monthlyTransactions: integer("monthly_transactions"),

    // Pricing
    pricingModelUsed: varchar("pricing_model_used", { length: 10 }),
    monthlyTotal: decimal("monthly_total", { precision: 10, scale: 2 }).notNull(),
    annualTotal: decimal("annual_total", { precision: 10, scale: 2 }).notNull(),

    // Services snapshot (denormalized for historical accuracy)
    services: jsonb("services").notNull(), // Array of service objects

    // Content
    customTerms: text("custom_terms"),
    termsAndConditions: text("terms_and_conditions"),
    notes: text("notes"),

    // Document URLs for this version
    pdfUrl: text("pdf_url"),

    // Change metadata
    changeDescription: text("change_description"), // What changed in this version
    createdById: text("created_by_id")
      .references(() => users.id, { onDelete: "set null" })
      .notNull(),
    createdByName: varchar("created_by_name", { length: 255 }), // Denormalized for history

    // Timestamps
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    proposalIdx: index("idx_proposal_version_proposal").on(table.proposalId),
    versionIdx: index("idx_proposal_version_number").on(table.proposalId, table.version),
    createdAtIdx: index("idx_proposal_version_created").on(table.createdAt),
  }),
);

// Client Transaction Data table - stores transaction volume data for pricing
export const clientTransactionData = pgTable(
  "client_transaction_data",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: text("tenant_id")
      .references(() => tenants.id, { onDelete: "cascade" })
      .notNull(),

    // Relationships
    leadId: uuid("lead_id").references(() => leads.id, {
      onDelete: "set null",
    }),
    clientId: uuid("client_id").references(() => clients.id, {
      onDelete: "cascade",
    }),

    // Transaction data
    monthlyTransactions: integer("monthly_transactions").notNull(),
    dataSource: transactionDataSourceEnum("data_source").notNull(),

    // Raw data from Xero (if applicable)
    xeroDataJson: jsonb("xero_data_json"),

    // Timestamps
    lastUpdated: timestamp("last_updated").defaultNow().notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    tenantIdx: index("idx_transaction_data_tenant").on(table.tenantId),
    clientIdx: index("idx_transaction_data_client").on(table.clientId),
    leadIdx: index("idx_transaction_data_lead").on(table.leadId),
  }),
);

// Proposal Signatures table - tracks e-signature status
export const proposalSignatures = pgTable(
  "proposal_signatures",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: text("tenant_id")
      .references(() => tenants.id, { onDelete: "cascade" })
      .notNull(),
    proposalId: uuid("proposal_id")
      .references(() => proposals.id, { onDelete: "cascade" })
      .notNull(),

    // DocuSeal integration
    docusealSubmissionId: text("docuseal_submission_id").unique(),
    signatureType: varchar("signature_type", { length: 50 })
      .notNull()
      .default("electronic"), // electronic | wet_ink
    signatureMethod: varchar("signature_method", { length: 50 }).notNull(), // docuseal | canvas (legacy)

    // Signer information
    signerEmail: varchar("signer_email", { length: 255 }).notNull(),
    signerName: varchar("signer_name", { length: 255 }).notNull(),

    // UK SES Compliance fields
    signingCapacity: varchar("signing_capacity", { length: 100 }), // Director | Authorized Signatory
    companyInfo: jsonb("company_info"), // { name, number, authority_check }
    auditTrail: jsonb("audit_trail").notNull(), // Full audit metadata
    documentHash: text("document_hash"), // SHA-256 of signed PDF

    // Technical metadata
    signatureData: text("signature_data").notNull(), // Base64 for legacy, DocuSeal ID for new
    signedAt: timestamp("signed_at").notNull(),
    viewedAt: timestamp("viewed_at"), // When document was first viewed
    ipAddress: varchar("ip_address", { length: 45 }),
    userAgent: text("user_agent"), // Browser/device information

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    proposalIdx: index("idx_signature_proposal").on(table.proposalId),
    docusealIdx: index("idx_signature_docuseal").on(table.docusealSubmissionId),
  }),
);

// ============================================
// END PROPOSAL HUB & PRICING SYSTEM
// ============================================

// ============================================
// ONBOARDING SYSTEM
// ============================================

// Onboarding Status Enum
export const onboardingStatusEnum = pgEnum("onboarding_status", [
  "not_started",
  "in_progress",
  "pending_questionnaire", // Client needs to complete AML questionnaire
  "pending_approval", // Awaiting staff approval after AML check
  "approved", // Onboarding approved, client has full access
  "rejected", // Onboarding rejected
  "completed",
]);

// Onboarding Priority Enum
export const onboardingPriorityEnum = pgEnum("onboarding_priority", [
  "low",
  "medium",
  "high",
]);

// Onboarding Sessions table - tracks onboarding progress for each client
export const onboardingSessions = pgTable(
  "onboarding_sessions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: text("tenant_id")
      .references(() => tenants.id, { onDelete: "cascade" })
      .notNull(),

    // Client relationship
    clientId: uuid("client_id")
      .references(() => clients.id, { onDelete: "cascade" })
      .notNull(),

    // Session details
    startDate: timestamp("start_date").notNull(),
    targetCompletionDate: timestamp("target_completion_date"),
    actualCompletionDate: timestamp("actual_completion_date"),

    // Status and priority
    status: onboardingStatusEnum("status").default("not_started").notNull(),
    priority: onboardingPriorityEnum("priority").default("medium").notNull(),

    // Assignment
    assignedToId: text("assigned_to_id").references(() => users.id, {
      onDelete: "set null",
    }),

    // Progress tracking
    progress: integer("progress").default(0).notNull(), // 0-100 percentage
    notes: text("notes"),

    // Timestamps
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    tenantIdx: index("idx_onboarding_session_tenant").on(table.tenantId),
    clientIdx: index("idx_onboarding_session_client").on(table.clientId),
    statusIdx: index("idx_onboarding_session_status").on(table.status),
    assignedIdx: index("idx_onboarding_session_assigned").on(
      table.assignedToId,
    ),
  }),
);

// Onboarding Tasks table - individual checklist items for each session
export const onboardingTasks = pgTable(
  "onboarding_tasks",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: text("tenant_id")
      .references(() => tenants.id, { onDelete: "cascade" })
      .notNull(),
    sessionId: uuid("session_id")
      .references(() => onboardingSessions.id, { onDelete: "cascade" })
      .notNull(),

    // Task details (from template)
    taskName: varchar("task_name", { length: 255 }).notNull(),
    description: text("description"),
    required: boolean("required").default(true).notNull(),
    sequence: integer("sequence").notNull(), // Order of task
    days: integer("days").default(0).notNull(), // Days offset from start

    // Tracking
    dueDate: timestamp("due_date"),
    completionDate: timestamp("completion_date"),
    done: boolean("done").default(false).notNull(),
    notes: text("notes"),

    // Assignment
    assignedToId: text("assigned_to_id").references(() => users.id, {
      onDelete: "set null",
    }),

    // Progress weight for calculating overall session progress
    progressWeight: integer("progress_weight").default(5).notNull(), // 1-10 scale

    // Timestamps
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    sessionIdx: index("idx_onboarding_task_session").on(table.sessionId),
    sequenceIdx: index("idx_onboarding_task_sequence").on(
      table.sessionId,
      table.sequence,
    ),
    assignedIdx: index("idx_onboarding_task_assigned").on(table.assignedToId),
    doneIdx: index("idx_onboarding_task_done").on(table.done),
  }),
);

// Onboarding Questionnaire Responses table
export const onboardingResponses = pgTable(
  "onboarding_responses",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: text("tenant_id")
      .references(() => tenants.id, { onDelete: "cascade" })
      .notNull(),
    onboardingSessionId: uuid("onboarding_session_id")
      .references(() => onboardingSessions.id, { onDelete: "cascade" })
      .notNull(),

    // Question and answer
    questionKey: varchar("question_key", { length: 255 }).notNull(), // e.g., "company_name", "directors"
    answerValue: jsonb("answer_value"), // Flexible storage for any answer type
    extractedFromAi: boolean("extracted_from_ai").default(false), // AI pre-filled
    verifiedByUser: boolean("verified_by_user").default(false), // User confirmed

    // Timestamps
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    tenantIdx: index("idx_onboarding_response_tenant").on(table.tenantId),
    sessionIdx: index("idx_onboarding_response_session").on(
      table.onboardingSessionId,
    ),
  }),
);

// AML Checks table - ComplyCube integration
export const amlChecks = pgTable(
  "aml_checks",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: text("tenant_id")
      .references(() => tenants.id, { onDelete: "cascade" })
      .notNull(),
    clientId: uuid("client_id")
      .references(() => clients.id, { onDelete: "cascade" })
      .notNull(),
    onboardingSessionId: uuid("onboarding_session_id").references(
      () => onboardingSessions.id,
      { onDelete: "cascade" },
    ),

    // ComplyCube integration
    provider: varchar("provider", { length: 50 })
      .default("complycube")
      .notNull(),
    checkId: varchar("check_id", { length: 255 }).notNull(), // ComplyCube check ID
    status: varchar("status", { length: 50 }).notNull(), // pending, complete, failed
    riskLevel: varchar("risk_level", { length: 50 }), // low, medium, high
    outcome: varchar("outcome", { length: 50 }), // clear, consider, attention
    reportUrl: text("report_url"), // S3 URL to PDF report

    // Approval workflow
    checkedAt: timestamp("checked_at"),
    approvedBy: text("approved_by").references(() => users.id),
    approvedAt: timestamp("approved_at"),
    rejectionReason: text("rejection_reason"),

    // Metadata
    metadata: jsonb("metadata"), // Store full ComplyCube response

    // Timestamps
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    tenantIdx: index("idx_aml_check_tenant").on(table.tenantId),
    clientIdx: index("idx_aml_check_client").on(table.clientId),
    sessionIdx: index("idx_aml_check_session").on(table.onboardingSessionId),
    statusIdx: index("idx_aml_check_status").on(table.status),
    checkIdIdx: index("idx_aml_check_check_id").on(table.checkId),
  }),
);

// KYC Verifications table - LEM Verify integration
export const kycVerifications = pgTable(
  "kyc_verifications",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: text("tenant_id")
      .references(() => tenants.id, { onDelete: "cascade" })
      .notNull(),
    clientId: uuid("client_id")
      .references(() => clients.id, { onDelete: "cascade" })
      .notNull(),
    onboardingSessionId: uuid("onboarding_session_id").references(
      () => onboardingSessions.id,
      { onDelete: "cascade" },
    ),

    // LEM Verify integration
    lemverifyId: varchar("lemverify_id", { length: 255 }).notNull(), // LEM Verify verification ID
    clientRef: varchar("client_ref", { length: 255 }).notNull(), // Our reference
    status: varchar("status", { length: 50 }).notNull(), // completed, pending, failed
    outcome: varchar("outcome", { length: 50 }), // pass, fail, refer

    // Document verification results
    documentType: varchar("document_type", { length: 50 }), // passport, driving_licence
    documentVerified: boolean("document_verified").default(false),
    documentData: jsonb("document_data"), // Extracted document data

    // Biometric verification results
    facematchResult: varchar("facematch_result", { length: 50 }), // pass, fail
    facematchScore: decimal("facematch_score", { precision: 5, scale: 2 }), // 0-100
    livenessResult: varchar("liveness_result", { length: 50 }), // pass, fail
    livenessScore: decimal("liveness_score", { precision: 5, scale: 2 }), // 0-100

    // AML screening results (via LexisNexis)
    amlResult: jsonb("aml_result"), // Full AML check response
    amlStatus: varchar("aml_status", { length: 50 }), // clear, match, pep
    pepMatch: boolean("pep_match").default(false),
    sanctionsMatch: boolean("sanctions_match").default(false),
    watchlistMatch: boolean("watchlist_match").default(false),
    adverseMediaMatch: boolean("adverse_media_match").default(false),

    // Documents and reports
    reportUrl: text("report_url"), // PDF report URL
    documentsUrl: jsonb("documents_url"), // URLs to uploaded documents

    // Approval workflow
    approvedBy: text("approved_by").references(() => users.id),
    approvedAt: timestamp("approved_at"),
    rejectionReason: text("rejection_reason"),

    // Metadata
    metadata: jsonb("metadata"), // Store full LEM Verify response

    // Timestamps
    createdAt: timestamp("created_at").defaultNow().notNull(),
    completedAt: timestamp("completed_at"),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    tenantIdx: index("idx_kyc_verification_tenant").on(table.tenantId),
    clientIdx: index("idx_kyc_verification_client").on(table.clientId),
    sessionIdx: index("idx_kyc_verification_session").on(
      table.onboardingSessionId,
    ),
    statusIdx: index("idx_kyc_verification_status").on(table.status),
    lemverifyIdIdx: index("idx_kyc_verification_lemverify_id").on(
      table.lemverifyId,
    ),
  }),
);

// ============================================
// END ONBOARDING SYSTEM
// ============================================

// Workflow Stages table
export const workflowStages = pgTable(
  "workflow_stages",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    workflowId: uuid("workflow_id")
      .references(() => workflows.id, { onDelete: "cascade" })
      .notNull(),

    // Stage details
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description"),
    stageOrder: integer("stage_order").notNull(),
    isRequired: boolean("is_required").default(true).notNull(),

    // Time estimates
    estimatedHours: decimal("estimated_hours", { precision: 5, scale: 2 }),

    // Checklist items stored as JSON
    checklistItems: jsonb("checklist_items"), // Array of {id, text, isRequired}

    // Configuration
    autoComplete: boolean("auto_complete").default(false), // Auto-complete when all checklist items done
    requiresApproval: boolean("requires_approval").default(false),

    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    workflowIdx: index("idx_stage_workflow").on(table.workflowId),
    orderIdx: index("idx_stage_order").on(table.workflowId, table.stageOrder),
  }),
);

// Task Workflow Instances table
export const taskWorkflowInstances = pgTable(
  "task_workflow_instances",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    taskId: uuid("task_id")
      .references(() => tasks.id, { onDelete: "cascade" })
      .notNull(),
    workflowId: uuid("workflow_id")
      .references(() => workflows.id, { onDelete: "cascade" })
      .notNull(),

    // Current state
    currentStageId: uuid("current_stage_id").references(
      () => workflowStages.id,
      {
        onDelete: "set null",
      },
    ),
    status: varchar("status", { length: 50 }).default("active").notNull(), // active, paused, completed, cancelled

    // Progress tracking (JSON structure for flexibility)
    stageProgress: jsonb("stage_progress"), // {stageId: {completed: bool, checklistItems: {itemId: bool}}}

    // Timestamps
    startedAt: timestamp("started_at").defaultNow().notNull(),
    completedAt: timestamp("completed_at"),
    pausedAt: timestamp("paused_at"),

    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    taskIdx: uniqueIndex("idx_task_workflow_instance").on(table.taskId),
    workflowIdx: index("idx_workflow_instance").on(table.workflowId),
    statusIdx: index("idx_workflow_instance_status").on(table.status),
  }),
);

// Activity Logs table
export const activityLogs = pgTable(
  "activity_logs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: text("tenant_id")
      .references(() => tenants.id, { onDelete: "cascade" })
      .notNull(),

    // Entity reference
    entityType: varchar("entity_type", { length: 50 }).notNull(), // task, client, invoice, etc.
    entityId: uuid("entity_id").notNull(),

    // Action details
    action: varchar("action", { length: 50 }).notNull(), // created, updated, deleted, status_changed, etc.
    description: text("description"),

    // User who performed action
    userId: text("user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    userName: varchar("user_name", { length: 255 }), // Denormalized for performance

    // Changes tracking
    oldValues: jsonb("old_values"), // Previous state
    newValues: jsonb("new_values"), // New state

    // Additional context
    ipAddress: varchar("ip_address", { length: 45 }),
    userAgent: text("user_agent"),
    metadata: jsonb("metadata"),

    // Timestamp
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    entityIdx: index("idx_activity_entity").on(
      table.entityType,
      table.entityId,
    ),
    userIdx: index("idx_activity_user").on(table.userId),
    createdAtIdx: index("idx_activity_created").on(table.createdAt),
    tenantEntityIdx: index("idx_activity_tenant_entity").on(
      table.tenantId,
      table.entityType,
      table.entityId,
    ),
  }),
);

// User Permissions table - for granular permission control
export const userPermissions = pgTable(
  "user_permissions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: text("tenant_id")
      .references(() => tenants.id, { onDelete: "cascade" })
      .notNull(),
    userId: text("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    module: varchar("module", { length: 50 }).notNull(), // "clients" | "tasks" | "invoices" | "proposals" | etc.
    canView: boolean("can_view").notNull().default(true),
    canCreate: boolean("can_create").notNull().default(false),
    canEdit: boolean("can_edit").notNull().default(false),
    canDelete: boolean("can_delete").notNull().default(false),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    userModuleIdx: uniqueIndex("idx_user_module").on(
      table.userId,
      table.module,
    ),
    tenantIdx: index("idx_permissions_tenant").on(table.tenantId),
  }),
);

// Role Permissions table - for default role-based permissions
export const rolePermissions = pgTable(
  "role_permissions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: text("tenant_id")
      .references(() => tenants.id, { onDelete: "cascade" })
      .notNull(),
    role: varchar("role", { length: 50 }).notNull(), // "admin" | "org:admin" | "user" | "viewer"
    module: varchar("module", { length: 50 }).notNull(),
    canView: boolean("can_view").notNull().default(true),
    canCreate: boolean("can_create").notNull().default(false),
    canEdit: boolean("can_edit").notNull().default(false),
    canDelete: boolean("can_delete").notNull().default(false),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    roleModuleIdx: uniqueIndex("idx_role_module").on(
      table.tenantId,
      table.role,
      table.module,
    ),
  }),
);

// Portal Categories table - for organizing links
export const portalCategories = pgTable(
  "portal_categories",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: text("tenant_id")
      .references(() => tenants.id, { onDelete: "cascade" })
      .notNull(),

    // Category details
    name: varchar("name", { length: 100 }).notNull(),
    description: text("description"),
    iconName: varchar("icon_name", { length: 50 }), // Lucide icon name
    colorHex: varchar("color_hex", { length: 7 }), // Hex color code
    sortOrder: integer("sort_order").default(0).notNull(),
    isActive: boolean("is_active").default(true).notNull(),

    // Metadata
    createdById: text("created_by_id").references(() => users.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    tenantIdx: index("idx_portal_categories_tenant").on(table.tenantId),
    sortOrderIdx: index("idx_portal_categories_sort").on(table.sortOrder),
    activeIdx: index("idx_portal_categories_active").on(table.isActive),
  }),
);

// Portal Links table - individual links/apps
export const portalLinks = pgTable(
  "portal_links",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: text("tenant_id")
      .references(() => tenants.id, { onDelete: "cascade" })
      .notNull(),
    categoryId: uuid("category_id")
      .references(() => portalCategories.id, { onDelete: "cascade" })
      .notNull(),

    // Link details
    title: varchar("title", { length: 200 }).notNull(),
    description: text("description"),
    url: text("url").notNull(),
    isInternal: boolean("is_internal").default(false).notNull(), // Internal vs external link
    iconName: varchar("icon_name", { length: 50 }), // Lucide icon name
    sortOrder: integer("sort_order").default(0).notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    targetBlank: boolean("target_blank").default(true).notNull(), // Open in new tab

    // Access control
    requiresAuth: boolean("requires_auth").default(false).notNull(),
    allowedRoles: jsonb("allowed_roles"), // Array of roles that can see this link

    // Metadata
    createdById: text("created_by_id").references(() => users.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    tenantIdx: index("idx_portal_links_tenant").on(table.tenantId),
    categoryIdx: index("idx_portal_links_category").on(table.categoryId),
    sortOrderIdx: index("idx_portal_links_sort").on(table.sortOrder),
    activeIdx: index("idx_portal_links_active").on(table.isActive),
    internalIdx: index("idx_portal_links_internal").on(table.isInternal),
  }),
);

// User Favorites table - track favorite links/apps per user
export const userFavorites = pgTable(
  "user_favorites",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    linkId: uuid("link_id")
      .references(() => portalLinks.id, { onDelete: "cascade" })
      .notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    userLinkIdx: uniqueIndex("idx_user_link_favorite").on(
      table.userId,
      table.linkId,
    ),
    userIdx: index("idx_user_favorites_user").on(table.userId),
    linkIdx: index("idx_user_favorites_link").on(table.linkId),
  }),
);

// ============================================
// DATABASE VIEWS
// ============================================
// Views are created via custom SQL migrations and managed with .existing()
// flag to prevent drizzle-kit from trying to recreate them

// Dashboard KPI View - aggregated metrics for dashboard
export const dashboardKpiView = pgView("dashboard_kpi_view", {
  tenantId: text("tenant_id").notNull(),
  totalRevenue: decimal("total_revenue", { precision: 10, scale: 2 }),
  collectedRevenue: decimal("collected_revenue", { precision: 10, scale: 2 }),
  outstandingRevenue: decimal("outstanding_revenue", {
    precision: 10,
    scale: 2,
  }),
  activeClients: integer("active_clients"),
  newClients30d: integer("new_clients_30d"),
  pendingTasks: integer("pending_tasks"),
  inProgressTasks: integer("in_progress_tasks"),
  completedTasks30d: integer("completed_tasks_30d"),
  overdueTasks: integer("overdue_tasks"),
  totalHours30d: decimal("total_hours_30d", { precision: 10, scale: 2 }),
  billableHours30d: decimal("billable_hours_30d", { precision: 10, scale: 2 }),
  upcomingCompliance30d: integer("upcoming_compliance_30d"),
  overdueCompliance: integer("overdue_compliance"),
}).existing();

// Activity Feed View - activity logs with entity names and user info
export const activityFeedView = pgView("activity_feed_view", {
  id: uuid("id").notNull(),
  tenantId: text("tenant_id").notNull(),
  entityType: varchar("entity_type", { length: 50 }).notNull(),
  entityId: uuid("entity_id").notNull(),
  entityName: text("entity_name"),
  action: varchar("action", { length: 50 }).notNull(),
  description: text("description"),
  userId: text("user_id"),
  userName: varchar("user_name", { length: 255 }),
  userDisplayName: text("user_display_name"),
  userEmail: text("user_email"),
  oldValues: jsonb("old_values"),
  newValues: jsonb("new_values"),
  ipAddress: varchar("ip_address", { length: 45 }),
  userAgent: text("user_agent"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").notNull(),
}).existing();

// Task Details View - tasks with client and assignee names
export const taskDetailsView = pgView("task_details_view", {
  // All task fields
  id: uuid("id").notNull(),
  tenantId: text("tenant_id").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  status: varchar("status", { length: 50 }),
  priority: varchar("priority", { length: 50 }),
  clientId: uuid("client_id"),
  assignedToId: text("assigned_to_id"),
  reviewerId: text("reviewer_id"),
  createdById: text("created_by_id").notNull(),
  dueDate: timestamp("due_date"),
  targetDate: timestamp("target_date"),
  completedAt: timestamp("completed_at"),
  estimatedHours: decimal("estimated_hours", { precision: 5, scale: 2 }),
  actualHours: decimal("actual_hours", { precision: 5, scale: 2 }),
  progress: integer("progress"),
  taskType: varchar("task_type", { length: 100 }),
  category: varchar("category", { length: 100 }),
  tags: jsonb("tags"),
  parentTaskId: uuid("parent_task_id"),
  workflowId: uuid("workflow_id"),
  isRecurring: boolean("is_recurring"),
  recurringPattern: jsonb("recurring_pattern"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
  // Joined fields
  clientName: varchar("client_name", { length: 255 }),
  clientCode: varchar("client_code", { length: 50 }),
  assigneeName: text("assignee_name"),
  assigneeEmail: text("assignee_email"),
  reviewerName: text("reviewer_name"),
  reviewerEmail: text("reviewer_email"),
  creatorName: text("creator_name"),
  workflowName: varchar("workflow_name", { length: 255 }),
  parentTaskTitle: varchar("parent_task_title", { length: 255 }),
}).existing();

// Client Details View - clients with account manager information
export const clientDetailsView = pgView("client_details_view", {
  // All client fields
  id: uuid("id").notNull(),
  tenantId: text("tenant_id").notNull(),
  clientCode: varchar("client_code", { length: 50 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  type: varchar("type", { length: 50 }),
  status: varchar("status", { length: 50 }),
  email: varchar("email", { length: 255 }),
  phone: varchar("phone", { length: 50 }),
  website: varchar("website", { length: 255 }),
  vatNumber: varchar("vat_number", { length: 50 }),
  registrationNumber: varchar("registration_number", { length: 50 }),
  addressLine1: varchar("address_line1", { length: 255 }),
  addressLine2: varchar("address_line2", { length: 255 }),
  city: varchar("city", { length: 100 }),
  state: varchar("state", { length: 100 }),
  postalCode: varchar("postal_code", { length: 20 }),
  country: varchar("country", { length: 100 }),
  accountManagerId: text("account_manager_id"),
  parentClientId: uuid("parent_client_id"),
  incorporationDate: date("incorporation_date"),
  yearEnd: varchar("year_end", { length: 10 }),
  notes: text("notes"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
  createdBy: text("created_by"),
  // Joined fields
  accountManagerFirstName: varchar("account_manager_first_name", {
    length: 100,
  }),
  accountManagerLastName: varchar("account_manager_last_name", { length: 100 }),
  accountManagerName: text("account_manager_name"),
  accountManagerEmail: text("account_manager_email"),
}).existing();

// Compliance Details View - compliance items with client and assignee info
export const complianceDetailsView = pgView("compliance_details_view", {
  id: uuid("id").notNull(),
  tenantId: text("tenant_id").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  type: varchar("type", { length: 100 }).notNull(),
  description: text("description"),
  clientId: uuid("client_id").notNull(),
  assignedToId: text("assigned_to_id"),
  dueDate: timestamp("due_date").notNull(),
  completedDate: timestamp("completed_date"),
  reminderDate: timestamp("reminder_date"),
  status: varchar("status", { length: 50 }),
  priority: varchar("priority", { length: 50 }),
  notes: text("notes"),
  attachments: jsonb("attachments"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
  createdById: text("created_by_id"),
  // Joined fields
  clientName: varchar("client_name", { length: 255 }),
  clientCode: varchar("client_code", { length: 50 }),
  assigneeName: text("assignee_name"),
  assigneeEmail: text("assignee_email"),
  creatorName: text("creator_name"),
  isOverdue: boolean("is_overdue"),
}).existing();

// Time Entries View - time entries with user, client, and task names
export const timeEntriesView = pgView("time_entries_view", {
  id: uuid("id").notNull(),
  tenantId: text("tenant_id").notNull(),
  userId: text("user_id").notNull(),
  clientId: uuid("client_id"),
  taskId: uuid("task_id"),
  serviceId: uuid("service_id"),
  date: date("date").notNull(),
  startTime: varchar("start_time", { length: 8 }),
  endTime: varchar("end_time", { length: 8 }),
  hours: decimal("hours", { precision: 5, scale: 2 }).notNull(),
  workType: varchar("work_type", { length: 50 }),
  billable: boolean("billable"),
  billed: boolean("billed"),
  rate: decimal("rate", { precision: 10, scale: 2 }),
  amount: decimal("amount", { precision: 10, scale: 2 }),
  invoiceId: uuid("invoice_id"),
  description: text("description"),
  notes: text("notes"),
  status: varchar("status", { length: 50 }),
  submittedAt: timestamp("submitted_at"),
  approvedById: text("approved_by_id"),
  approvedAt: timestamp("approved_at"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
  // Joined fields
  userName: text("user_name"),
  userEmail: text("user_email"),
  clientName: varchar("client_name", { length: 255 }),
  clientCode: varchar("client_code", { length: 50 }),
  taskTitle: varchar("task_title", { length: 255 }),
  serviceName: varchar("service_name", { length: 255 }),
  serviceCode: varchar("service_code", { length: 50 }),
  approverName: text("approver_name"),
}).existing();

// Invoice Details View - invoices with client information
export const invoiceDetailsView = pgView("invoice_details_view", {
  id: uuid("id").notNull(),
  tenantId: text("tenant_id").notNull(),
  invoiceNumber: varchar("invoice_number", { length: 50 }).notNull(),
  clientId: uuid("client_id").notNull(),
  issueDate: date("issue_date").notNull(),
  dueDate: date("due_date").notNull(),
  paidDate: date("paid_date"),
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
  taxRate: decimal("tax_rate", { precision: 5, scale: 2 }),
  taxAmount: decimal("tax_amount", { precision: 10, scale: 2 }),
  discount: decimal("discount", { precision: 10, scale: 2 }),
  total: decimal("total", { precision: 10, scale: 2 }).notNull(),
  amountPaid: decimal("amount_paid", { precision: 10, scale: 2 }),
  status: varchar("status", { length: 50 }),
  currency: varchar("currency", { length: 3 }),
  notes: text("notes"),
  terms: text("terms"),
  purchaseOrderNumber: varchar("po_number", { length: 100 }),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
  createdById: text("created_by_id"),
  // Joined fields
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
  balanceDue: decimal("balance_due", { precision: 10, scale: 2 }),
}).existing();

// ==================== CLIENT PORTAL TABLES ====================
// External client portal with separate authentication

// Client Portal Users - External client accounts (separate from staff users)
export const clientPortalUsers = pgTable(
  "client_portal_users",
  {
    id: text("id").primaryKey(), // Better Auth user ID
    tenantId: text("tenant_id")
      .references(() => tenants.id)
      .notNull(),
    email: text("email").notNull(),
    firstName: varchar("first_name", { length: 100 }),
    lastName: varchar("last_name", { length: 100 }),
    phone: varchar("phone", { length: 50 }),
    status: varchar("status", { length: 20 }).default("active").notNull(), // active, suspended, invited
    lastLoginAt: timestamp("last_login_at"),
    invitedBy: text("invited_by").references(() => users.id),
    invitedAt: timestamp("invited_at"),
    acceptedAt: timestamp("accepted_at"),
    metadata: jsonb("metadata"), // Custom fields, preferences, etc.
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => ({
    emailIdx: index("client_portal_users_email_idx").on(table.email),
    tenantIdx: index("client_portal_users_tenant_idx").on(table.tenantId),
  }),
);

// Client Portal Access - Links portal users to clients (many-to-many)
// Enables multi-client access for users who manage multiple entities
export const clientPortalAccess = pgTable(
  "client_portal_access",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: text("tenant_id")
      .references(() => tenants.id)
      .notNull(),
    portalUserId: text("portal_user_id")
      .references(() => clientPortalUsers.id, { onDelete: "cascade" })
      .notNull(),
    clientId: uuid("client_id")
      .references(() => clients.id, { onDelete: "cascade" })
      .notNull(),
    role: varchar("role", { length: 50 }).default("viewer").notNull(), // viewer, editor, admin
    grantedBy: text("granted_by").references(() => users.id),
    grantedAt: timestamp("granted_at").defaultNow().notNull(),
    expiresAt: timestamp("expires_at"), // Optional expiration for temporary access
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => ({
    userClientIdx: uniqueIndex("client_portal_access_user_client_idx").on(
      table.portalUserId,
      table.clientId,
    ),
    clientIdx: index("client_portal_access_client_idx").on(table.clientId),
    tenantIdx: index("client_portal_access_tenant_idx").on(table.tenantId),
  }),
);

// Client Portal Invitations - Tracks invitation workflow
export const clientPortalInvitations = pgTable(
  "client_portal_invitations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: text("tenant_id")
      .references(() => tenants.id)
      .notNull(),
    email: text("email").notNull(),
    firstName: varchar("first_name", { length: 100 }),
    lastName: varchar("last_name", { length: 100 }),
    clientIds: jsonb("client_ids").notNull(), // Array of client UUIDs to grant access to
    role: varchar("role", { length: 50 }).default("viewer").notNull(),
    token: text("token").notNull().unique(), // Secure invitation token
    invitedBy: text("invited_by")
      .references(() => users.id)
      .notNull(),
    status: varchar("status", { length: 20 }).default("pending").notNull(), // pending, accepted, expired, revoked
    sentAt: timestamp("sent_at").defaultNow().notNull(),
    expiresAt: timestamp("expires_at").notNull(), // 7 days default
    acceptedAt: timestamp("accepted_at"),
    revokedAt: timestamp("revoked_at"),
    revokedBy: text("revoked_by").references(() => users.id),
    metadata: jsonb("metadata"), // Custom message, etc.
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => ({
    emailIdx: index("client_portal_invitations_email_idx").on(table.email),
    tokenIdx: uniqueIndex("client_portal_invitations_token_idx").on(
      table.token,
    ),
    statusIdx: index("client_portal_invitations_status_idx").on(table.status),
    tenantIdx: index("client_portal_invitations_tenant_idx").on(table.tenantId),
  }),
);

// Client Portal Better Auth tables - Separate from staff auth
export const clientPortalSessions = pgTable("client_portal_session", {
  id: text("id").primaryKey(),
  tenantId: text("tenant_id")
    .references(() => tenants.id)
    .notNull(),
  clientId: uuid("client_id")
    .references(() => clients.id)
    .notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => clientPortalUsers.id, { onDelete: "cascade" }),
});

export const clientPortalAccounts = pgTable("client_portal_account", {
  id: text("id").primaryKey(),
  tenantId: text("tenant_id")
    .references(() => tenants.id)
    .notNull(),
  clientId: uuid("client_id")
    .references(() => clients.id)
    .notNull(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => clientPortalUsers.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

export const clientPortalVerifications = pgTable("client_portal_verification", {
  id: text("id").primaryKey(),
  tenantId: text("tenant_id")
    .references(() => tenants.id)
    .notNull(),
  clientId: uuid("client_id")
    .references(() => clients.id)
    .notNull(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

// ============================================================================
// Phase 1: Communication & Collaboration Features
// ============================================================================

// Message Threads - Conversation threads (DM or team channels)
export const messageThreads = pgTable(
  "message_threads",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: text("tenant_id")
      .references(() => tenants.id)
      .notNull(),
    type: varchar("type", { length: 20 }).notNull(), // 'direct', 'team_channel', 'client'
    name: varchar("name", { length: 255 }), // For channels (null for DM)
    description: text("description"), // For channels
    isPrivate: boolean("is_private").default(false).notNull(), // For channels
    clientId: uuid("client_id").references(() => clients.id), // If type='client', link to client
    createdBy: text("created_by")
      .references(() => users.id)
      .notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
    lastMessageAt: timestamp("last_message_at"), // For sorting threads
  },
  (table) => ({
    tenantIdx: index("message_threads_tenant_idx").on(table.tenantId),
    typeIdx: index("message_threads_type_idx").on(table.type),
    clientIdx: index("message_threads_client_idx").on(table.clientId),
    lastMessageIdx: index("message_threads_last_message_idx").on(
      table.lastMessageAt,
    ),
  }),
);

// Message Thread Participants - Who is in each thread
// Supports both staff users and client portal users
export const messageThreadParticipants = pgTable(
  "message_thread_participants",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    threadId: uuid("thread_id")
      .references(() => messageThreads.id, { onDelete: "cascade" })
      .notNull(),
    // Polymorphic participant - can be staff or client portal user
    participantType: varchar("participant_type", { length: 20 })
      .default("staff")
      .notNull(), // 'staff' | 'client_portal'
    participantId: text("participant_id").notNull(), // users.id OR clientPortalUsers.id
    // Legacy field - kept for backward compatibility with existing staff threads
    userId: text("user_id").references(() => users.id, { onDelete: "cascade" }),
    role: varchar("role", { length: 20 }).default("member").notNull(), // 'admin', 'member'
    joinedAt: timestamp("joined_at").defaultNow().notNull(),
    lastReadAt: timestamp("last_read_at"), // For unread count
    mutedUntil: timestamp("muted_until"), // For muting notifications
  },
  (table) => ({
    threadParticipantIdx: uniqueIndex(
      "message_thread_participants_thread_participant_idx",
    ).on(table.threadId, table.participantType, table.participantId),
    participantIdx: index("message_thread_participants_participant_idx").on(
      table.participantType,
      table.participantId,
    ),
    // Keep legacy index for existing queries
    userIdx: index("message_thread_participants_user_idx").on(table.userId),
  }),
);

// Messages - Individual messages in threads
// Supports messages from both staff users and client portal users
export const messages = pgTable(
  "messages",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    threadId: uuid("thread_id")
      .references(() => messageThreads.id, { onDelete: "cascade" })
      .notNull(),
    // Polymorphic sender - can be staff or client portal user
    senderType: varchar("sender_type", { length: 20 })
      .default("staff")
      .notNull(), // 'staff' | 'client_portal'
    senderId: text("sender_id").notNull(), // users.id OR clientPortalUsers.id
    // Legacy field - kept for backward compatibility
    userId: text("user_id").references(() => users.id),
    content: text("content").notNull(),
    type: varchar("type", { length: 20 }).default("text").notNull(), // 'text', 'file', 'system'
    metadata: jsonb("metadata"), // For file URLs, mentions, etc.
    replyToId: uuid("reply_to_id"), // For threaded replies
    isEdited: boolean("is_edited").default(false).notNull(),
    isDeleted: boolean("is_deleted").default(false).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => ({
    threadIdx: index("messages_thread_idx").on(table.threadId),
    senderIdx: index("messages_sender_idx").on(
      table.senderType,
      table.senderId,
    ),
    // Keep legacy index for existing queries
    userIdx: index("messages_user_idx").on(table.userId),
    createdAtIdx: index("messages_created_at_idx").on(table.createdAt),
  }),
);

// Notifications - User notifications
export const notifications = pgTable(
  "notifications",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: text("tenant_id")
      .references(() => tenants.id)
      .notNull(),
    userId: text("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    type: varchar("type", { length: 50 }).notNull(), // 'task_assigned', 'mention', 'client_message', 'approval_needed', etc.
    title: varchar("title", { length: 255 }).notNull(),
    message: text("message").notNull(),
    actionUrl: text("action_url"), // Where to navigate when clicked
    entityType: varchar("entity_type", { length: 50 }), // 'task', 'message', 'client', etc.
    entityId: uuid("entity_id"), // ID of related entity
    isRead: boolean("is_read").default(false).notNull(),
    readAt: timestamp("read_at"),
    metadata: jsonb("metadata"), // Additional data
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    userIsReadIdx: index("notifications_user_is_read_idx").on(
      table.userId,
      table.isRead,
    ),
    tenantIdx: index("notifications_tenant_idx").on(table.tenantId),
    createdAtIdx: index("notifications_created_at_idx").on(table.createdAt),
  }),
);

// Calendar Events - Events, meetings, deadlines
export const calendarEvents = pgTable(
  "calendar_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: text("tenant_id")
      .references(() => tenants.id)
      .notNull(),
    title: varchar("title", { length: 255 }).notNull(),
    description: text("description"),
    type: varchar("type", { length: 30 }).notNull(), // 'meeting', 'deadline', 'event', 'out_of_office'
    startTime: timestamp("start_time").notNull(),
    endTime: timestamp("end_time").notNull(),
    allDay: boolean("all_day").default(false).notNull(),
    location: varchar("location", { length: 255 }), // Physical or virtual location
    clientId: uuid("client_id").references(() => clients.id), // If client-related
    taskId: uuid("task_id").references(() => tasks.id), // If task-related
    complianceId: uuid("compliance_id").references(() => compliance.id), // If compliance deadline
    createdBy: text("created_by")
      .references(() => users.id)
      .notNull(),
    metadata: jsonb("metadata"), // Meeting link, notes, etc.
    reminderMinutes: integer("reminder_minutes"), // Minutes before event to remind (15, 30, 60, etc.)
    isRecurring: boolean("is_recurring").default(false).notNull(),
    recurrenceRule: text("recurrence_rule"), // iCal RRULE format
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => ({
    tenantIdx: index("calendar_events_tenant_idx").on(table.tenantId),
    startTimeIdx: index("calendar_events_start_time_idx").on(table.startTime),
    clientIdx: index("calendar_events_client_idx").on(table.clientId),
    taskIdx: index("calendar_events_task_idx").on(table.taskId),
    typeIdx: index("calendar_events_type_idx").on(table.type),
  }),
);

// Calendar Event Attendees - Who is invited to events
export const calendarEventAttendees = pgTable(
  "calendar_event_attendees",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    eventId: uuid("event_id")
      .references(() => calendarEvents.id, { onDelete: "cascade" })
      .notNull(),
    userId: text("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    status: varchar("status", { length: 20 }).default("pending").notNull(), // 'pending', 'accepted', 'declined', 'tentative'
    isOptional: boolean("is_optional").default(false).notNull(),
    respondedAt: timestamp("responded_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    eventUserIdx: uniqueIndex("calendar_event_attendees_event_user_idx").on(
      table.eventId,
      table.userId,
    ),
    userIdx: index("calendar_event_attendees_user_idx").on(table.userId),
    statusIdx: index("calendar_event_attendees_status_idx").on(table.status),
  }),
);
