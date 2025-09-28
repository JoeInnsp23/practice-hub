CREATE TYPE "public"."compliance_priority" AS ENUM('low', 'medium', 'high', 'urgent');--> statement-breakpoint
CREATE TYPE "public"."compliance_status" AS ENUM('pending', 'in_progress', 'completed', 'overdue');--> statement-breakpoint
CREATE TYPE "public"."service_price_type" AS ENUM('hourly', 'fixed', 'retainer', 'project', 'percentage');--> statement-breakpoint
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
ALTER TABLE "services" ADD COLUMN "price" numeric(10, 2);--> statement-breakpoint
ALTER TABLE "services" ADD COLUMN "price_type" "service_price_type" DEFAULT 'fixed';--> statement-breakpoint
ALTER TABLE "services" ADD COLUMN "duration" integer;--> statement-breakpoint
ALTER TABLE "services" ADD COLUMN "tags" jsonb;--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN "reviewer_id" uuid;--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN "target_date" timestamp;--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN "progress" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN "task_type" varchar(100);--> statement-breakpoint
ALTER TABLE "workflows" ADD COLUMN "estimated_days" integer;--> statement-breakpoint
ALTER TABLE "workflows" ADD COLUMN "service_id" uuid;--> statement-breakpoint
ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "compliance" ADD CONSTRAINT "compliance_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "compliance" ADD CONSTRAINT "compliance_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "compliance" ADD CONSTRAINT "compliance_assigned_to_id_users_id_fk" FOREIGN KEY ("assigned_to_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "compliance" ADD CONSTRAINT "compliance_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_workflow_instances" ADD CONSTRAINT "task_workflow_instances_task_id_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_workflow_instances" ADD CONSTRAINT "task_workflow_instances_workflow_id_workflows_id_fk" FOREIGN KEY ("workflow_id") REFERENCES "public"."workflows"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_workflow_instances" ADD CONSTRAINT "task_workflow_instances_current_stage_id_workflow_stages_id_fk" FOREIGN KEY ("current_stage_id") REFERENCES "public"."workflow_stages"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workflow_stages" ADD CONSTRAINT "workflow_stages_workflow_id_workflows_id_fk" FOREIGN KEY ("workflow_id") REFERENCES "public"."workflows"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_activity_entity" ON "activity_logs" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE INDEX "idx_activity_user" ON "activity_logs" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_activity_created" ON "activity_logs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_activity_tenant_entity" ON "activity_logs" USING btree ("tenant_id","entity_type","entity_id");--> statement-breakpoint
CREATE INDEX "idx_compliance_client" ON "compliance" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "idx_compliance_assignee" ON "compliance" USING btree ("assigned_to_id");--> statement-breakpoint
CREATE INDEX "idx_compliance_status" ON "compliance" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_compliance_due_date" ON "compliance" USING btree ("due_date");--> statement-breakpoint
CREATE INDEX "idx_compliance_type" ON "compliance" USING btree ("type");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_task_workflow_instance" ON "task_workflow_instances" USING btree ("task_id");--> statement-breakpoint
CREATE INDEX "idx_workflow_instance" ON "task_workflow_instances" USING btree ("workflow_id");--> statement-breakpoint
CREATE INDEX "idx_workflow_instance_status" ON "task_workflow_instances" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_stage_workflow" ON "workflow_stages" USING btree ("workflow_id");--> statement-breakpoint
CREATE INDEX "idx_stage_order" ON "workflow_stages" USING btree ("workflow_id","stage_order");--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_reviewer_id_users_id_fk" FOREIGN KEY ("reviewer_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workflows" ADD CONSTRAINT "workflows_service_id_services_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."services"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_task_reviewer" ON "tasks" USING btree ("reviewer_id");--> statement-breakpoint
CREATE INDEX "idx_task_progress" ON "tasks" USING btree ("progress");--> statement-breakpoint
CREATE INDEX "idx_workflow_service" ON "workflows" USING btree ("service_id");