CREATE TYPE "public"."client_status" AS ENUM('active', 'inactive', 'prospect', 'archived');--> statement-breakpoint
CREATE TYPE "public"."client_type" AS ENUM('individual', 'company', 'trust', 'partnership');--> statement-breakpoint
CREATE TYPE "public"."compliance_priority" AS ENUM('low', 'medium', 'high', 'urgent');--> statement-breakpoint
CREATE TYPE "public"."compliance_status" AS ENUM('pending', 'in_progress', 'completed', 'overdue');--> statement-breakpoint
CREATE TYPE "public"."document_type" AS ENUM('file', 'folder');--> statement-breakpoint
CREATE TYPE "public"."invoice_status" AS ENUM('draft', 'sent', 'paid', 'overdue', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."service_price_type" AS ENUM('hourly', 'fixed', 'retainer', 'project', 'percentage');--> statement-breakpoint
CREATE TYPE "public"."task_priority" AS ENUM('low', 'medium', 'high', 'urgent');--> statement-breakpoint
CREATE TYPE "public"."task_status" AS ENUM('pending', 'in_progress', 'completed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."time_entry_status" AS ENUM('draft', 'submitted', 'approved', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."work_type" AS ENUM('work', 'admin', 'training', 'meeting', 'business_development', 'research', 'holiday', 'sick', 'time_off_in_lieu');--> statement-breakpoint
CREATE TABLE "activity_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"entity_type" varchar(50) NOT NULL,
	"entity_id" uuid NOT NULL,
	"action" varchar(50) NOT NULL,
	"description" text,
	"user_id" uuid,
	"user_name" varchar(255),
	"old_values" jsonb,
	"new_values" jsonb,
	"ip_address" varchar(45),
	"user_agent" text,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
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
CREATE TABLE "compliance" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"title" varchar(255) NOT NULL,
	"type" varchar(100) NOT NULL,
	"description" text,
	"client_id" uuid NOT NULL,
	"assigned_to_id" uuid,
	"due_date" timestamp NOT NULL,
	"completed_date" timestamp,
	"reminder_date" timestamp,
	"status" "compliance_status" DEFAULT 'pending' NOT NULL,
	"priority" "compliance_priority" DEFAULT 'medium' NOT NULL,
	"notes" text,
	"attachments" jsonb,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_by_id" uuid
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
	"price" numeric(10, 2),
	"price_type" "service_price_type" DEFAULT 'fixed',
	"duration" integer,
	"tags" jsonb,
	"is_active" boolean DEFAULT true NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "task_workflow_instances" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"task_id" uuid NOT NULL,
	"workflow_id" uuid NOT NULL,
	"current_stage_id" uuid,
	"status" varchar(50) DEFAULT 'active' NOT NULL,
	"stage_progress" jsonb,
	"started_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp,
	"paused_at" timestamp,
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
	"reviewer_id" uuid,
	"created_by_id" uuid NOT NULL,
	"due_date" timestamp,
	"target_date" timestamp,
	"completed_at" timestamp,
	"estimated_hours" numeric(5, 2),
	"actual_hours" numeric(5, 2),
	"progress" integer DEFAULT 0,
	"task_type" varchar(100),
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
	"work_type" "work_type" DEFAULT 'work' NOT NULL,
	"billable" boolean DEFAULT true NOT NULL,
	"billed" boolean DEFAULT false NOT NULL,
	"rate" numeric(10, 2),
	"amount" numeric(10, 2),
	"invoice_id" uuid,
	"description" text,
	"notes" text,
	"status" time_entry_status DEFAULT 'draft' NOT NULL,
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
	"hourly_rate" numeric(10, 2),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_clerk_id_unique" UNIQUE("clerk_id")
);
--> statement-breakpoint
CREATE TABLE "workflow_stages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workflow_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"stage_order" integer NOT NULL,
	"is_required" boolean DEFAULT true NOT NULL,
	"estimated_hours" numeric(5, 2),
	"checklist_items" jsonb,
	"auto_complete" boolean DEFAULT false,
	"requires_approval" boolean DEFAULT false,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
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
	"estimated_days" integer,
	"service_id" uuid,
	"config" jsonb NOT NULL,
	"conditions" jsonb,
	"actions" jsonb,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_by_id" uuid
);
--> statement-breakpoint
ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_contacts" ADD CONSTRAINT "client_contacts_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_contacts" ADD CONSTRAINT "client_contacts_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_services" ADD CONSTRAINT "client_services_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_services" ADD CONSTRAINT "client_services_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_services" ADD CONSTRAINT "client_services_service_id_services_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."services"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clients" ADD CONSTRAINT "clients_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clients" ADD CONSTRAINT "clients_account_manager_id_users_id_fk" FOREIGN KEY ("account_manager_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clients" ADD CONSTRAINT "clients_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "compliance" ADD CONSTRAINT "compliance_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "compliance" ADD CONSTRAINT "compliance_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "compliance" ADD CONSTRAINT "compliance_assigned_to_id_users_id_fk" FOREIGN KEY ("assigned_to_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "compliance" ADD CONSTRAINT "compliance_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
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
ALTER TABLE "task_workflow_instances" ADD CONSTRAINT "task_workflow_instances_task_id_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_workflow_instances" ADD CONSTRAINT "task_workflow_instances_workflow_id_workflows_id_fk" FOREIGN KEY ("workflow_id") REFERENCES "public"."workflows"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_workflow_instances" ADD CONSTRAINT "task_workflow_instances_current_stage_id_workflow_stages_id_fk" FOREIGN KEY ("current_stage_id") REFERENCES "public"."workflow_stages"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_assigned_to_id_users_id_fk" FOREIGN KEY ("assigned_to_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_reviewer_id_users_id_fk" FOREIGN KEY ("reviewer_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "time_entries" ADD CONSTRAINT "time_entries_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "time_entries" ADD CONSTRAINT "time_entries_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "time_entries" ADD CONSTRAINT "time_entries_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "time_entries" ADD CONSTRAINT "time_entries_task_id_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "time_entries" ADD CONSTRAINT "time_entries_service_id_services_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."services"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "time_entries" ADD CONSTRAINT "time_entries_approved_by_id_users_id_fk" FOREIGN KEY ("approved_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workflow_stages" ADD CONSTRAINT "workflow_stages_workflow_id_workflows_id_fk" FOREIGN KEY ("workflow_id") REFERENCES "public"."workflows"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workflows" ADD CONSTRAINT "workflows_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workflows" ADD CONSTRAINT "workflows_service_id_services_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."services"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workflows" ADD CONSTRAINT "workflows_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_activity_entity" ON "activity_logs" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE INDEX "idx_activity_user" ON "activity_logs" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_activity_created" ON "activity_logs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_activity_tenant_entity" ON "activity_logs" USING btree ("tenant_id","entity_type","entity_id");--> statement-breakpoint
CREATE INDEX "idx_client_contact" ON "client_contacts" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "idx_primary_contact" ON "client_contacts" USING btree ("client_id","is_primary");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_client_service" ON "client_services" USING btree ("client_id","service_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_tenant_client_code" ON "clients" USING btree ("tenant_id","client_code");--> statement-breakpoint
CREATE INDEX "idx_client_name" ON "clients" USING btree ("name");--> statement-breakpoint
CREATE INDEX "idx_client_status" ON "clients" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_client_manager" ON "clients" USING btree ("account_manager_id");--> statement-breakpoint
CREATE INDEX "idx_compliance_client" ON "compliance" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "idx_compliance_assignee" ON "compliance" USING btree ("assigned_to_id");--> statement-breakpoint
CREATE INDEX "idx_compliance_status" ON "compliance" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_compliance_due_date" ON "compliance" USING btree ("due_date");--> statement-breakpoint
CREATE INDEX "idx_compliance_type" ON "compliance" USING btree ("type");--> statement-breakpoint
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
CREATE UNIQUE INDEX "idx_task_workflow_instance" ON "task_workflow_instances" USING btree ("task_id");--> statement-breakpoint
CREATE INDEX "idx_workflow_instance" ON "task_workflow_instances" USING btree ("workflow_id");--> statement-breakpoint
CREATE INDEX "idx_workflow_instance_status" ON "task_workflow_instances" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_task_assignee" ON "tasks" USING btree ("assigned_to_id");--> statement-breakpoint
CREATE INDEX "idx_task_reviewer" ON "tasks" USING btree ("reviewer_id");--> statement-breakpoint
CREATE INDEX "idx_task_client" ON "tasks" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "idx_task_status" ON "tasks" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_task_due_date" ON "tasks" USING btree ("due_date");--> statement-breakpoint
CREATE INDEX "idx_parent_task" ON "tasks" USING btree ("parent_task_id");--> statement-breakpoint
CREATE INDEX "idx_task_progress" ON "tasks" USING btree ("progress");--> statement-breakpoint
CREATE INDEX "idx_time_entry_user_date" ON "time_entries" USING btree ("user_id","date");--> statement-breakpoint
CREATE INDEX "idx_time_entry_client" ON "time_entries" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "idx_time_entry_task" ON "time_entries" USING btree ("task_id");--> statement-breakpoint
CREATE INDEX "idx_time_entry_billable" ON "time_entries" USING btree ("billable","billed");--> statement-breakpoint
CREATE INDEX "idx_time_entry_status" ON "time_entries" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_tenant_user" ON "users" USING btree ("tenant_id","clerk_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_tenant_email" ON "users" USING btree ("tenant_id","email");--> statement-breakpoint
CREATE INDEX "idx_user_role" ON "users" USING btree ("role");--> statement-breakpoint
CREATE INDEX "idx_stage_workflow" ON "workflow_stages" USING btree ("workflow_id");--> statement-breakpoint
CREATE INDEX "idx_stage_order" ON "workflow_stages" USING btree ("workflow_id","stage_order");--> statement-breakpoint
CREATE INDEX "idx_workflow_type" ON "workflows" USING btree ("type");--> statement-breakpoint
CREATE INDEX "idx_workflow_active" ON "workflows" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "idx_workflow_service" ON "workflows" USING btree ("service_id");--> statement-breakpoint

-- ============================================
-- DATABASE VIEWS FOR DENORMALIZED DATA
-- ============================================

-- Client Details View (with account manager name)
CREATE VIEW "client_details_view" AS
SELECT
    c.*,
    u.first_name AS account_manager_first_name,
    u.last_name AS account_manager_last_name,
    CONCAT(u.first_name, ' ', u.last_name) AS account_manager_name,
    u.email AS account_manager_email
FROM clients c
LEFT JOIN users u ON c.account_manager_id = u.id;--> statement-breakpoint

-- Task Details View (with client and assignee names)
CREATE VIEW "task_details_view" AS
SELECT
    t.*,
    c.name AS client_name,
    c.client_code AS client_code,
    CONCAT(u1.first_name, ' ', u1.last_name) AS assignee_name,
    u1.email AS assignee_email,
    CONCAT(u2.first_name, ' ', u2.last_name) AS reviewer_name,
    u2.email AS reviewer_email,
    CONCAT(u3.first_name, ' ', u3.last_name) AS creator_name,
    w.name AS workflow_name,
    pt.title AS parent_task_title
FROM tasks t
LEFT JOIN clients c ON t.client_id = c.id
LEFT JOIN users u1 ON t.assigned_to_id = u1.id
LEFT JOIN users u2 ON t.reviewer_id = u2.id
LEFT JOIN users u3 ON t.created_by_id = u3.id
LEFT JOIN workflows w ON t.workflow_id = w.id
LEFT JOIN tasks pt ON t.parent_task_id = pt.id;--> statement-breakpoint

-- Time Entries View (with user, client, task names)
CREATE VIEW "time_entries_view" AS
SELECT
    te.*,
    CONCAT(u.first_name, ' ', u.last_name) AS user_name,
    u.email AS user_email,
    c.name AS client_name,
    c.client_code AS client_code,
    t.title AS task_title,
    s.name AS service_name,
    s.code AS service_code,
    CONCAT(a.first_name, ' ', a.last_name) AS approver_name
FROM time_entries te
LEFT JOIN users u ON te.user_id = u.id
LEFT JOIN clients c ON te.client_id = c.id
LEFT JOIN tasks t ON te.task_id = t.id
LEFT JOIN services s ON te.service_id = s.id
LEFT JOIN users a ON te.approved_by_id = a.id;--> statement-breakpoint

-- Invoice Details View (with client information)
CREATE VIEW "invoice_details_view" AS
SELECT
    i.*,
    c.name AS client_name,
    c.client_code AS client_code,
    c.email AS client_email,
    c.vat_number AS client_vat_number,
    c.address_line1 AS client_address_line1,
    c.address_line2 AS client_address_line2,
    c.city AS client_city,
    c.postal_code AS client_postal_code,
    c.country AS client_country,
    CONCAT(u.first_name, ' ', u.last_name) AS created_by_name,
    (i.total - i.amount_paid) AS balance_due
FROM invoices i
LEFT JOIN clients c ON i.client_id = c.id
LEFT JOIN users u ON i.created_by_id = u.id;--> statement-breakpoint

-- Invoice Items View (with service details)
CREATE VIEW "invoice_items_view" AS
SELECT
    ii.*,
    i.invoice_number,
    i.client_id,
    i.status AS invoice_status,
    s.name AS service_name,
    s.code AS service_code,
    s.category AS service_category
FROM invoice_items ii
LEFT JOIN invoices i ON ii.invoice_id = i.id
LEFT JOIN services s ON ii.service_id = s.id;--> statement-breakpoint

-- Client Services View (with full service details)
CREATE VIEW "client_services_view" AS
SELECT
    cs.*,
    c.name AS client_name,
    c.client_code AS client_code,
    s.name AS service_name,
    s.code AS service_code,
    s.description AS service_description,
    s.category AS service_category,
    COALESCE(cs.custom_rate, s.default_rate) AS effective_rate
FROM client_services cs
LEFT JOIN clients c ON cs.client_id = c.id
LEFT JOIN services s ON cs.service_id = s.id;--> statement-breakpoint

-- Compliance Details View
CREATE VIEW "compliance_details_view" AS
SELECT
    comp.*,
    c.name AS client_name,
    c.client_code AS client_code,
    CONCAT(u1.first_name, ' ', u1.last_name) AS assignee_name,
    u1.email AS assignee_email,
    CONCAT(u2.first_name, ' ', u2.last_name) AS creator_name,
    CASE
        WHEN comp.due_date < CURRENT_DATE AND comp.status != 'completed' THEN true
        ELSE false
    END AS is_overdue
FROM compliance comp
LEFT JOIN clients c ON comp.client_id = c.id
LEFT JOIN users u1 ON comp.assigned_to_id = u1.id
LEFT JOIN users u2 ON comp.created_by_id = u2.id;--> statement-breakpoint

-- Activity Feed View (for dashboard)
CREATE VIEW "activity_feed_view" AS
SELECT
    al.*,
    CASE
        WHEN al.entity_type = 'client' THEN (SELECT name FROM clients WHERE id = al.entity_id)
        WHEN al.entity_type = 'task' THEN (SELECT title FROM tasks WHERE id = al.entity_id)
        WHEN al.entity_type = 'invoice' THEN (SELECT invoice_number FROM invoices WHERE id = al.entity_id)
        WHEN al.entity_type = 'compliance' THEN (SELECT title FROM compliance WHERE id = al.entity_id)
        ELSE NULL
    END AS entity_name,
    u.email AS user_email,
    CONCAT(u.first_name, ' ', u.last_name) AS user_display_name
FROM activity_logs al
LEFT JOIN users u ON al.user_id = u.id
ORDER BY al.created_at DESC;--> statement-breakpoint

-- Task Workflow View (tasks with workflow progress)
CREATE VIEW "task_workflow_view" AS
SELECT
    t.id AS task_id,
    t.title AS task_title,
    t.status AS task_status,
    t.progress AS task_progress,
    w.name AS workflow_name,
    w.type AS workflow_type,
    twi.status AS workflow_status,
    ws.name AS current_stage_name,
    ws.stage_order AS current_stage_order,
    twi.stage_progress,
    COUNT(DISTINCT ws2.id) AS total_stages
FROM tasks t
LEFT JOIN task_workflow_instances twi ON t.id = twi.task_id
LEFT JOIN workflows w ON twi.workflow_id = w.id
LEFT JOIN workflow_stages ws ON twi.current_stage_id = ws.id
LEFT JOIN workflow_stages ws2 ON ws2.workflow_id = w.id
WHERE t.workflow_id IS NOT NULL
GROUP BY t.id, t.title, t.status, t.progress, w.name, w.type,
         twi.status, ws.name, ws.stage_order, twi.stage_progress;--> statement-breakpoint

-- Dashboard KPI View (aggregated metrics)
CREATE VIEW "dashboard_kpi_view" AS
SELECT
    t.id AS tenant_id,
    -- Revenue metrics
    (SELECT COALESCE(SUM(total), 0) FROM invoices
     WHERE tenant_id = t.id AND status IN ('paid', 'sent')) AS total_revenue,
    (SELECT COALESCE(SUM(total), 0) FROM invoices
     WHERE tenant_id = t.id AND status = 'paid') AS collected_revenue,
    (SELECT COALESCE(SUM(total - amount_paid), 0) FROM invoices
     WHERE tenant_id = t.id AND status IN ('sent', 'overdue')) AS outstanding_revenue,

    -- Client metrics
    (SELECT COUNT(*) FROM clients
     WHERE tenant_id = t.id AND status = 'active') AS active_clients,
    (SELECT COUNT(*) FROM clients
     WHERE tenant_id = t.id AND created_at >= CURRENT_DATE - INTERVAL '30 days') AS new_clients_30d,

    -- Task metrics
    (SELECT COUNT(*) FROM tasks
     WHERE tenant_id = t.id AND status = 'pending') AS pending_tasks,
    (SELECT COUNT(*) FROM tasks
     WHERE tenant_id = t.id AND status = 'in_progress') AS in_progress_tasks,
    (SELECT COUNT(*) FROM tasks
     WHERE tenant_id = t.id AND status = 'completed'
     AND completed_at >= CURRENT_DATE - INTERVAL '30 days') AS completed_tasks_30d,
    (SELECT COUNT(*) FROM tasks
     WHERE tenant_id = t.id AND due_date < CURRENT_DATE
     AND status NOT IN ('completed', 'cancelled')) AS overdue_tasks,

    -- Time tracking metrics
    (SELECT COALESCE(SUM(hours), 0) FROM time_entries
     WHERE tenant_id = t.id AND date >= CURRENT_DATE - INTERVAL '30 days') AS total_hours_30d,
    (SELECT COALESCE(SUM(hours), 0) FROM time_entries
     WHERE tenant_id = t.id AND billable = true
     AND date >= CURRENT_DATE - INTERVAL '30 days') AS billable_hours_30d,

    -- Compliance metrics
    (SELECT COUNT(*) FROM compliance
     WHERE tenant_id = t.id AND status != 'completed'
     AND due_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days') AS upcoming_compliance_30d,
    (SELECT COUNT(*) FROM compliance
     WHERE tenant_id = t.id AND status != 'completed'
     AND due_date < CURRENT_DATE) AS overdue_compliance
FROM tenants t;--> statement-breakpoint

-- Monthly Revenue View (for charts)
CREATE VIEW "monthly_revenue_view" AS
SELECT
    tenant_id,
    DATE_TRUNC('month', issue_date) AS month,
    SUM(CASE WHEN status IN ('sent', 'paid', 'overdue') THEN total ELSE 0 END) AS invoiced,
    SUM(CASE WHEN status = 'paid' THEN total ELSE 0 END) AS collected,
    COUNT(*) AS invoice_count,
    COUNT(DISTINCT client_id) AS unique_clients
FROM invoices
GROUP BY tenant_id, DATE_TRUNC('month', issue_date)
ORDER BY tenant_id, month DESC;--> statement-breakpoint

-- Client Revenue View (for client breakdown charts)
CREATE VIEW "client_revenue_view" AS
SELECT
    i.tenant_id,
    i.client_id,
    c.name AS client_name,
    c.client_code,
    SUM(i.total) AS total_invoiced,
    SUM(i.amount_paid) AS total_paid,
    SUM(i.total - i.amount_paid) AS outstanding,
    COUNT(i.id) AS invoice_count,
    MIN(i.issue_date) AS first_invoice_date,
    MAX(i.issue_date) AS last_invoice_date
FROM invoices i
LEFT JOIN clients c ON i.client_id = c.id
WHERE i.status IN ('sent', 'paid', 'overdue')
GROUP BY i.tenant_id, i.client_id, c.name, c.client_code;