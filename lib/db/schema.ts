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
