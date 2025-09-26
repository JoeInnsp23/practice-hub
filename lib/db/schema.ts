import {
  pgTable,
  uuid,
  text,
  timestamp,
  boolean,
  varchar,
  index,
  uniqueIndex,
  jsonb,
  integer,
  decimal,
  date,
  pgEnum,
} from "drizzle-orm/pg-core";

// Tenants table - for multi-tenancy
export const tenants = pgTable("tenants", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").unique().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Users table - linked to Clerk and tenants
export const users = pgTable(
  "users",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    clerkId: text("clerk_id").unique().notNull(),
    tenantId: uuid("tenant_id")
      .references(() => tenants.id)
      .notNull(),
    email: text("email").notNull(),
    firstName: varchar("first_name", { length: 100 }),
    lastName: varchar("last_name", { length: 100 }),
    role: varchar("role", { length: 50 }).default("member").notNull(), // admin, accountant, member
    status: varchar("status", { length: 20 }).default("active").notNull(), // pending, active, inactive
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    tenantUserIdx: uniqueIndex("idx_tenant_user").on(
      table.tenantId,
      table.clerkId,
    ),
    emailTenantIdx: uniqueIndex("idx_tenant_email").on(
      table.tenantId,
      table.email,
    ),
    roleIdx: index("idx_user_role").on(table.role),
  }),
);

// Feedback table - for user feedback and issues
export const feedback = pgTable(
  "feedback",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id")
      .references(() => tenants.id, { onDelete: "cascade" })
      .notNull(),

    // User Information
    userId: varchar("user_id", { length: 255 }).notNull(), // Clerk user ID
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
  "trust",
  "partnership",
]);
export const clientStatusEnum = pgEnum("client_status", [
  "active",
  "inactive",
  "prospect",
  "archived",
]);
export const taskStatusEnum = pgEnum("task_status", [
  "pending",
  "in_progress",
  "completed",
  "cancelled",
]);
export const taskPriorityEnum = pgEnum("task_priority", [
  "low",
  "medium",
  "high",
  "urgent",
]);
export const documentTypeEnum = pgEnum("document_type", ["file", "folder"]);
export const invoiceStatusEnum = pgEnum("invoice_status", [
  "draft",
  "sent",
  "paid",
  "overdue",
  "cancelled",
]);

// Clients table
export const clients = pgTable(
  "clients",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id")
      .references(() => tenants.id, { onDelete: "cascade" })
      .notNull(),
    clientCode: varchar("client_code", { length: 50 }).notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    type: clientTypeEnum("type").notNull(),
    status: clientStatusEnum("status").default("active").notNull(),
    email: varchar("email", { length: 255 }),
    phone: varchar("phone", { length: 50 }),
    website: varchar("website", { length: 255 }),
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
    accountManagerId: uuid("account_manager_id").references(() => users.id, {
      onDelete: "set null",
    }),
    parentClientId: uuid("parent_client_id"),

    // Business fields
    incorporationDate: date("incorporation_date"),
    yearEnd: varchar("year_end", { length: 10 }), // MM-DD format
    notes: text("notes"),
    metadata: jsonb("metadata"),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
    createdBy: uuid("created_by").references(() => users.id),
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
    tenantId: uuid("tenant_id")
      .references(() => tenants.id, { onDelete: "cascade" })
      .notNull(),
    clientId: uuid("client_id")
      .references(() => clients.id, { onDelete: "cascade" })
      .notNull(),
    isPrimary: boolean("is_primary").default(false).notNull(),
    title: varchar("title", { length: 50 }),
    firstName: varchar("first_name", { length: 100 }).notNull(),
    lastName: varchar("last_name", { length: 100 }).notNull(),
    email: varchar("email", { length: 255 }),
    phone: varchar("phone", { length: 50 }),
    mobile: varchar("mobile", { length: 50 }),
    position: varchar("position", { length: 100 }),
    department: varchar("department", { length: 100 }),
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

// Services table
export const services = pgTable(
  "services",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id")
      .references(() => tenants.id, { onDelete: "cascade" })
      .notNull(),
    code: varchar("code", { length: 50 }).notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description"),
    category: varchar("category", { length: 100 }),
    defaultRate: decimal("default_rate", { precision: 10, scale: 2 }),
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
    tenantId: uuid("tenant_id")
      .references(() => tenants.id, { onDelete: "cascade" })
      .notNull(),
    clientId: uuid("client_id")
      .references(() => clients.id, { onDelete: "cascade" })
      .notNull(),
    serviceId: uuid("service_id")
      .references(() => services.id, { onDelete: "cascade" })
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
      table.serviceId,
    ),
  }),
);

// Tasks table
export const tasks = pgTable(
  "tasks",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id")
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
    assignedToId: uuid("assigned_to_id").references(() => users.id, {
      onDelete: "set null",
    }),
    createdById: uuid("created_by_id")
      .references(() => users.id, { onDelete: "set null" })
      .notNull(),

    // Dates
    dueDate: timestamp("due_date"),
    completedAt: timestamp("completed_at"),
    estimatedHours: decimal("estimated_hours", { precision: 5, scale: 2 }),
    actualHours: decimal("actual_hours", { precision: 5, scale: 2 }),

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
    clientTaskIdx: index("idx_task_client").on(table.clientId),
    statusIdx: index("idx_task_status").on(table.status),
    dueDateIdx: index("idx_task_due_date").on(table.dueDate),
    parentTaskIdx: index("idx_parent_task").on(table.parentTaskId),
  }),
);

// Time Entries table
export const timeEntries = pgTable(
  "time_entries",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id")
      .references(() => tenants.id, { onDelete: "cascade" })
      .notNull(),
    userId: uuid("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    clientId: uuid("client_id").references(() => clients.id, {
      onDelete: "set null",
    }),
    taskId: uuid("task_id").references(() => tasks.id, {
      onDelete: "set null",
    }),
    serviceId: uuid("service_id").references(() => services.id, {
      onDelete: "set null",
    }),

    // Time tracking
    date: date("date").notNull(),
    startTime: varchar("start_time", { length: 8 }), // HH:MM:SS
    endTime: varchar("end_time", { length: 8 }), // HH:MM:SS
    hours: decimal("hours", { precision: 5, scale: 2 }).notNull(),

    // Billing
    billable: boolean("billable").default(true).notNull(),
    billed: boolean("billed").default(false).notNull(),
    rate: decimal("rate", { precision: 10, scale: 2 }),
    amount: decimal("amount", { precision: 10, scale: 2 }),
    invoiceId: uuid("invoice_id"),

    description: text("description"),
    notes: text("notes"),

    // Approval workflow
    status: varchar("status", { length: 50 }).default("draft"), // draft, submitted, approved, rejected
    submittedAt: timestamp("submitted_at"),
    approvedById: uuid("approved_by_id").references(() => users.id, {
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
    tenantId: uuid("tenant_id")
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
    uploadedById: uuid("uploaded_by_id")
      .references(() => users.id, { onDelete: "set null" })
      .notNull(),

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

// Invoices table
export const invoices = pgTable(
  "invoices",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id")
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
    createdById: uuid("created_by_id").references(() => users.id, {
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
    serviceId: uuid("service_id").references(() => services.id, {
      onDelete: "set null",
    }),

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
    tenantId: uuid("tenant_id")
      .references(() => tenants.id, { onDelete: "cascade" })
      .notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description"),
    type: varchar("type", { length: 50 }).notNull(), // task_template, automation, approval
    trigger: varchar("trigger", { length: 100 }), // manual, schedule, event
    isActive: boolean("is_active").default(true).notNull(),

    // Configuration
    config: jsonb("config").notNull(), // Workflow-specific configuration
    conditions: jsonb("conditions"), // Conditions for automatic triggers
    actions: jsonb("actions"), // Actions to perform

    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
    createdById: uuid("created_by_id").references(() => users.id, {
      onDelete: "set null",
    }),
  },
  (table) => ({
    typeIdx: index("idx_workflow_type").on(table.type),
    activeIdx: index("idx_workflow_active").on(table.isActive),
  }),
);
