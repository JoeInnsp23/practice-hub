-- Create onboarding status enum
CREATE TYPE "public"."onboarding_status" AS ENUM('not_started', 'in_progress', 'completed');

-- Create onboarding priority enum
CREATE TYPE "public"."onboarding_priority" AS ENUM('low', 'medium', 'high');

-- Create onboarding_sessions table
CREATE TABLE IF NOT EXISTS "onboarding_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"client_id" uuid NOT NULL,
	"start_date" timestamp NOT NULL,
	"target_completion_date" timestamp,
	"actual_completion_date" timestamp,
	"status" "onboarding_status" DEFAULT 'not_started' NOT NULL,
	"priority" "onboarding_priority" DEFAULT 'medium' NOT NULL,
	"assigned_to_id" uuid,
	"progress" integer DEFAULT 0 NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

-- Create onboarding_tasks table
CREATE TABLE IF NOT EXISTS "onboarding_tasks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"session_id" uuid NOT NULL,
	"task_name" varchar(255) NOT NULL,
	"description" text,
	"required" boolean DEFAULT true NOT NULL,
	"sequence" integer NOT NULL,
	"days" integer DEFAULT 0 NOT NULL,
	"due_date" timestamp,
	"completion_date" timestamp,
	"done" boolean DEFAULT false NOT NULL,
	"notes" text,
	"assigned_to_id" uuid,
	"progress_weight" integer DEFAULT 5 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

-- Add foreign keys for onboarding_sessions
ALTER TABLE "onboarding_sessions" ADD CONSTRAINT "onboarding_sessions_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "onboarding_sessions" ADD CONSTRAINT "onboarding_sessions_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "onboarding_sessions" ADD CONSTRAINT "onboarding_sessions_assigned_to_id_users_id_fk" FOREIGN KEY ("assigned_to_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;

-- Add foreign keys for onboarding_tasks
ALTER TABLE "onboarding_tasks" ADD CONSTRAINT "onboarding_tasks_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "onboarding_tasks" ADD CONSTRAINT "onboarding_tasks_session_id_onboarding_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."onboarding_sessions"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "onboarding_tasks" ADD CONSTRAINT "onboarding_tasks_assigned_to_id_users_id_fk" FOREIGN KEY ("assigned_to_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;

-- Create indexes for onboarding_sessions
CREATE INDEX IF NOT EXISTS "idx_onboarding_session_tenant" ON "onboarding_sessions" USING btree ("tenant_id");
CREATE INDEX IF NOT EXISTS "idx_onboarding_session_client" ON "onboarding_sessions" USING btree ("client_id");
CREATE INDEX IF NOT EXISTS "idx_onboarding_session_status" ON "onboarding_sessions" USING btree ("status");
CREATE INDEX IF NOT EXISTS "idx_onboarding_session_assigned" ON "onboarding_sessions" USING btree ("assigned_to_id");

-- Create indexes for onboarding_tasks
CREATE INDEX IF NOT EXISTS "idx_onboarding_task_session" ON "onboarding_tasks" USING btree ("session_id");
CREATE INDEX IF NOT EXISTS "idx_onboarding_task_sequence" ON "onboarding_tasks" USING btree ("session_id","sequence");
CREATE INDEX IF NOT EXISTS "idx_onboarding_task_assigned" ON "onboarding_tasks" USING btree ("assigned_to_id");
CREATE INDEX IF NOT EXISTS "idx_onboarding_task_done" ON "onboarding_tasks" USING btree ("done");
