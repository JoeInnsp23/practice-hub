CREATE TYPE "public"."time_entry_status" AS ENUM('draft', 'submitted', 'approved', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."work_type" AS ENUM('work', 'admin', 'training', 'meeting', 'business_development', 'research', 'holiday', 'sick', 'time_off_in_lieu');--> statement-breakpoint
ALTER TABLE "clients" DROP CONSTRAINT "clients_parent_client_id_clients_id_fk";
--> statement-breakpoint
ALTER TABLE "documents" DROP CONSTRAINT "documents_parent_id_documents_id_fk";
--> statement-breakpoint
ALTER TABLE "tasks" DROP CONSTRAINT "tasks_parent_task_id_tasks_id_fk";
--> statement-breakpoint
ALTER TABLE "time_entries" ALTER COLUMN "status" SET DEFAULT 'draft'::time_entry_status;--> statement-breakpoint
ALTER TABLE "time_entries" ALTER COLUMN "status" SET DATA TYPE time_entry_status USING "status"::time_entry_status;--> statement-breakpoint
ALTER TABLE "time_entries" ALTER COLUMN "status" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "time_entries" ADD COLUMN "work_type" "work_type" DEFAULT 'work' NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "hourly_rate" numeric(10, 2);