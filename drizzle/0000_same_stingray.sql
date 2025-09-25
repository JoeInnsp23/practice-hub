CREATE TYPE "public"."client_status" AS ENUM('active', 'inactive', 'prospect', 'archived');--> statement-breakpoint
CREATE TYPE "public"."client_type" AS ENUM('individual', 'company', 'trust', 'partnership');--> statement-breakpoint
CREATE TYPE "public"."document_type" AS ENUM('file', 'folder');--> statement-breakpoint
CREATE TYPE "public"."invoice_status" AS ENUM('draft', 'sent', 'paid', 'overdue', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."task_priority" AS ENUM('low', 'medium', 'high', 'urgent');--> statement-breakpoint
CREATE TYPE "public"."task_status" AS ENUM('pending', 'in_progress', 'completed', 'cancelled');--> statement-breakpoint
CREATE TABLE "client_contacts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"client_id" uuid NOT NULL,
	"is_primary" boolean DEFAULT false NOT NULL,
	"title" varchar(50),
	"first_name" varchar(100) NOT NULL,
	"last_name" varchar(100) NOT NULL,
	"email" varchar(255),
	"phone" varchar(50),
	"mobile" varchar(50),
	"position" varchar(100),
	"department" varchar(100),
	"notes" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "client_services" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"client_id" uuid NOT NULL,
	"service_id" uuid NOT NULL,
	"custom_rate" numeric(10, 2),
	"start_date" date,
	"end_date" date,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clients" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"client_code" varchar(50) NOT NULL,
	"name" varchar(255) NOT NULL,
	"type" "client_type" NOT NULL,
	"status" "client_status" DEFAULT 'active' NOT NULL,
	"email" varchar(255),
	"phone" varchar(50),
	"website" varchar(255),
	"vat_number" varchar(50),
	"registration_number" varchar(50),
	"address_line1" varchar(255),
	"address_line2" varchar(255),
	"city" varchar(100),
	"state" varchar(100),
	"postal_code" varchar(20),
	"country" varchar(100),
	"account_manager_id" uuid,
	"parent_client_id" uuid,
	"incorporation_date" date,
	"year_end" varchar(10),
	"notes" text,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_by" uuid
);
--> statement-breakpoint
CREATE TABLE "documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"type" "document_type" NOT NULL,
	"mime_type" varchar(100),
	"size" integer,
	"url" text,
	"thumbnail_url" text,
	"parent_id" uuid,
	"path" text,
	"client_id" uuid,
	"task_id" uuid,
	"description" text,
	"tags" jsonb,
	"version" integer DEFAULT 1,
	"is_archived" boolean DEFAULT false,
	"is_public" boolean DEFAULT false,
	"share_token" varchar(100),
	"share_expires_at" timestamp,
	"uploaded_by_id" uuid NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "feedback" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"user_email" varchar(255) NOT NULL,
	"user_name" varchar(255),
	"user_role" varchar(50),
	"type" varchar(50) NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text NOT NULL,
	"category" varchar(50),
	"page_url" varchar(500),
	"user_agent" text,
	"console_logs" text,
	"screenshot" text,
	"status" varchar(50) DEFAULT 'new',
	"priority" varchar(20) DEFAULT 'medium',
	"assigned_to" varchar(255),
	"admin_notes" text,
	"resolution" text,
	"resolved_at" timestamp,
	"resolved_by" varchar(255),
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invoice_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"invoice_id" uuid NOT NULL,
	"description" text NOT NULL,
	"quantity" numeric(10, 2) NOT NULL,
	"rate" numeric(10, 2) NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"time_entry_id" uuid,
	"service_id" uuid,
	"sort_order" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invoices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"invoice_number" varchar(50) NOT NULL,
	"client_id" uuid NOT NULL,
	"issue_date" date NOT NULL,
	"due_date" date NOT NULL,
	"paid_date" date,
	"subtotal" numeric(10, 2) NOT NULL,
	"tax_rate" numeric(5, 2) DEFAULT '0',
	"tax_amount" numeric(10, 2) DEFAULT '0',
	"discount" numeric(10, 2) DEFAULT '0',
	"total" numeric(10, 2) NOT NULL,
	"amount_paid" numeric(10, 2) DEFAULT '0',
	"status" "invoice_status" DEFAULT 'draft' NOT NULL,
	"currency" varchar(3) DEFAULT 'GBP',
	"notes" text,
	"terms" text,
	"po_number" varchar(100),
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_by_id" uuid
);
--> statement-breakpoint
CREATE TABLE "services" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"code" varchar(50) NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"category" varchar(100),
	"default_rate" numeric(10, 2),
	"is_active" boolean DEFAULT true NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tasks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"status" "task_status" DEFAULT 'pending' NOT NULL,
	"priority" "task_priority" DEFAULT 'medium' NOT NULL,
	"client_id" uuid,
	"assigned_to_id" uuid,
	"created_by_id" uuid NOT NULL,
	"due_date" timestamp,
	"completed_at" timestamp,
	"estimated_hours" numeric(5, 2),
	"actual_hours" numeric(5, 2),
	"category" varchar(100),
	"tags" jsonb,
	"parent_task_id" uuid,
	"workflow_id" uuid,
	"is_recurring" boolean DEFAULT false,
	"recurring_pattern" jsonb,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tenants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "tenants_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "time_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"client_id" uuid,
	"task_id" uuid,
	"service_id" uuid,
	"date" date NOT NULL,
	"start_time" varchar(8),
	"end_time" varchar(8),
	"hours" numeric(5, 2) NOT NULL,
	"billable" boolean DEFAULT true NOT NULL,
	"billed" boolean DEFAULT false NOT NULL,
	"rate" numeric(10, 2),
	"amount" numeric(10, 2),
	"invoice_id" uuid,
	"description" text,
	"notes" text,
	"status" varchar(50) DEFAULT 'draft',
	"submitted_at" timestamp,
	"approved_by_id" uuid,
	"approved_at" timestamp,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"clerk_id" text NOT NULL,
	"tenant_id" uuid NOT NULL,
	"email" text NOT NULL,
	"first_name" varchar(100),
	"last_name" varchar(100),
	"role" varchar(50) DEFAULT 'member' NOT NULL,
	"status" varchar(20) DEFAULT 'active' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_clerk_id_unique" UNIQUE("clerk_id")
);
--> statement-breakpoint
CREATE TABLE "workflows" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"type" varchar(50) NOT NULL,
	"trigger" varchar(100),
	"is_active" boolean DEFAULT true NOT NULL,
	"config" jsonb NOT NULL,
	"conditions" jsonb,
	"actions" jsonb,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_by_id" uuid
);
--> statement-breakpoint
ALTER TABLE "client_contacts" ADD CONSTRAINT "client_contacts_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_contacts" ADD CONSTRAINT "client_contacts_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_services" ADD CONSTRAINT "client_services_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_services" ADD CONSTRAINT "client_services_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_services" ADD CONSTRAINT "client_services_service_id_services_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."services"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clients" ADD CONSTRAINT "clients_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clients" ADD CONSTRAINT "clients_account_manager_id_users_id_fk" FOREIGN KEY ("account_manager_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clients" ADD CONSTRAINT "clients_parent_client_id_clients_id_fk" FOREIGN KEY ("parent_client_id") REFERENCES "public"."clients"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clients" ADD CONSTRAINT "clients_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_parent_id_documents_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."documents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_task_id_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_uploaded_by_id_users_id_fk" FOREIGN KEY ("uploaded_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feedback" ADD CONSTRAINT "feedback_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice_items" ADD CONSTRAINT "invoice_items_invoice_id_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice_items" ADD CONSTRAINT "invoice_items_time_entry_id_time_entries_id_fk" FOREIGN KEY ("time_entry_id") REFERENCES "public"."time_entries"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice_items" ADD CONSTRAINT "invoice_items_service_id_services_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."services"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "services" ADD CONSTRAINT "services_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_assigned_to_id_users_id_fk" FOREIGN KEY ("assigned_to_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_parent_task_id_tasks_id_fk" FOREIGN KEY ("parent_task_id") REFERENCES "public"."tasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "time_entries" ADD CONSTRAINT "time_entries_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "time_entries" ADD CONSTRAINT "time_entries_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "time_entries" ADD CONSTRAINT "time_entries_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "time_entries" ADD CONSTRAINT "time_entries_task_id_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "time_entries" ADD CONSTRAINT "time_entries_service_id_services_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."services"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "time_entries" ADD CONSTRAINT "time_entries_approved_by_id_users_id_fk" FOREIGN KEY ("approved_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workflows" ADD CONSTRAINT "workflows_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workflows" ADD CONSTRAINT "workflows_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_client_contact" ON "client_contacts" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "idx_primary_contact" ON "client_contacts" USING btree ("client_id","is_primary");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_client_service" ON "client_services" USING btree ("client_id","service_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_tenant_client_code" ON "clients" USING btree ("tenant_id","client_code");--> statement-breakpoint
CREATE INDEX "idx_client_name" ON "clients" USING btree ("name");--> statement-breakpoint
CREATE INDEX "idx_client_status" ON "clients" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_client_manager" ON "clients" USING btree ("account_manager_id");--> statement-breakpoint
CREATE INDEX "idx_document_parent" ON "documents" USING btree ("parent_id");--> statement-breakpoint
CREATE INDEX "idx_document_client" ON "documents" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "idx_document_task" ON "documents" USING btree ("task_id");--> statement-breakpoint
CREATE INDEX "idx_document_path" ON "documents" USING btree ("path");--> statement-breakpoint
CREATE INDEX "idx_document_share_token" ON "documents" USING btree ("share_token");--> statement-breakpoint
CREATE INDEX "idx_feedback_tenant_status" ON "feedback" USING btree ("tenant_id","status");--> statement-breakpoint
CREATE INDEX "idx_feedback_user" ON "feedback" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_feedback_type" ON "feedback" USING btree ("type","status");--> statement-breakpoint
CREATE INDEX "idx_feedback_created_at" ON "feedback" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_invoice_item_invoice" ON "invoice_items" USING btree ("invoice_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_tenant_invoice_number" ON "invoices" USING btree ("tenant_id","invoice_number");--> statement-breakpoint
CREATE INDEX "idx_invoice_client" ON "invoices" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "idx_invoice_status" ON "invoices" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_invoice_due_date" ON "invoices" USING btree ("due_date");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_tenant_service_code" ON "services" USING btree ("tenant_id","code");--> statement-breakpoint
CREATE INDEX "idx_service_category" ON "services" USING btree ("category");--> statement-breakpoint
CREATE INDEX "idx_task_assignee" ON "tasks" USING btree ("assigned_to_id");--> statement-breakpoint
CREATE INDEX "idx_task_client" ON "tasks" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "idx_task_status" ON "tasks" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_task_due_date" ON "tasks" USING btree ("due_date");--> statement-breakpoint
CREATE INDEX "idx_parent_task" ON "tasks" USING btree ("parent_task_id");--> statement-breakpoint
CREATE INDEX "idx_time_entry_user_date" ON "time_entries" USING btree ("user_id","date");--> statement-breakpoint
CREATE INDEX "idx_time_entry_client" ON "time_entries" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "idx_time_entry_task" ON "time_entries" USING btree ("task_id");--> statement-breakpoint
CREATE INDEX "idx_time_entry_billable" ON "time_entries" USING btree ("billable","billed");--> statement-breakpoint
CREATE INDEX "idx_time_entry_status" ON "time_entries" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_tenant_user" ON "users" USING btree ("tenant_id","clerk_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_tenant_email" ON "users" USING btree ("tenant_id","email");--> statement-breakpoint
CREATE INDEX "idx_user_role" ON "users" USING btree ("role");--> statement-breakpoint
CREATE INDEX "idx_workflow_type" ON "workflows" USING btree ("type");--> statement-breakpoint
CREATE INDEX "idx_workflow_active" ON "workflows" USING btree ("is_active");