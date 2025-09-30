-- Add lead status enum
CREATE TYPE "public"."lead_status" AS ENUM('new', 'contacted', 'qualified', 'proposal_sent', 'negotiating', 'converted', 'lost');

-- Create leads table
CREATE TABLE "leads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"first_name" varchar(100) NOT NULL,
	"last_name" varchar(100) NOT NULL,
	"email" varchar(255) NOT NULL,
	"phone" varchar(50),
	"mobile" varchar(50),
	"company_name" varchar(255),
	"position" varchar(100),
	"website" varchar(255),
	"status" "lead_status" DEFAULT 'new' NOT NULL,
	"source" varchar(100),
	"industry" varchar(100),
	"estimated_turnover" numeric(15, 2),
	"estimated_employees" integer,
	"qualification_score" integer,
	"interested_services" jsonb,
	"notes" text,
	"last_contacted_at" timestamp,
	"next_follow_up_at" timestamp,
	"assigned_to_id" uuid,
	"converted_to_client_id" uuid,
	"converted_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_by" uuid
);

-- Add foreign keys for leads
ALTER TABLE "leads" ADD CONSTRAINT "leads_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "leads" ADD CONSTRAINT "leads_assigned_to_id_users_id_fk" FOREIGN KEY ("assigned_to_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
ALTER TABLE "leads" ADD CONSTRAINT "leads_converted_to_client_id_clients_id_fk" FOREIGN KEY ("converted_to_client_id") REFERENCES "public"."clients"("id") ON DELETE set null ON UPDATE no action;
ALTER TABLE "leads" ADD CONSTRAINT "leads_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;

-- Create indexes for leads
CREATE INDEX "idx_lead_tenant" ON "leads" USING btree ("tenant_id");
CREATE INDEX "idx_lead_status" ON "leads" USING btree ("status");
CREATE INDEX "idx_lead_email" ON "leads" USING btree ("email");
CREATE INDEX "idx_lead_assigned" ON "leads" USING btree ("assigned_to_id");
CREATE INDEX "idx_lead_created" ON "leads" USING btree ("created_at");

-- Update proposals table - add missing fields
ALTER TABLE "proposals" ADD COLUMN "proposal_number" varchar(50) NOT NULL DEFAULT 'TEMP-0000';
ALTER TABLE "proposals" ADD COLUMN "turnover" varchar(100);
ALTER TABLE "proposals" ADD COLUMN "industry" varchar(100);
ALTER TABLE "proposals" ADD COLUMN "monthly_transactions" integer;
ALTER TABLE "proposals" ADD COLUMN "terms_and_conditions" text;
ALTER TABLE "proposals" ADD COLUMN "valid_until" timestamp;

-- Update leadId to reference leads table
ALTER TABLE "proposals" ADD CONSTRAINT "proposals_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE set null ON UPDATE no action;

-- Add lead index to proposals
CREATE INDEX "idx_proposal_lead" ON "proposals" USING btree ("lead_id");

-- Create unique index for proposal_number
CREATE UNIQUE INDEX "idx_proposal_number" ON "proposals" USING btree ("tenant_id", "proposal_number");

-- Update proposal_services table structure
-- Drop old proposal_services table and recreate with correct structure
DROP TABLE IF EXISTS "proposal_services" CASCADE;

CREATE TABLE "proposal_services" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"proposal_id" uuid NOT NULL,
	"component_code" varchar(50) NOT NULL,
	"component_name" varchar(255) NOT NULL,
	"calculation" text,
	"price" varchar(50) NOT NULL,
	"config" jsonb,
	"sort_order" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

-- Add foreign keys for proposal_services
ALTER TABLE "proposal_services" ADD CONSTRAINT "proposal_services_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "proposal_services" ADD CONSTRAINT "proposal_services_proposal_id_proposals_id_fk" FOREIGN KEY ("proposal_id") REFERENCES "public"."proposals"("id") ON DELETE cascade ON UPDATE no action;

-- Create indexes for proposal_services
CREATE INDEX "idx_proposal_service_proposal" ON "proposal_services" USING btree ("proposal_id");
CREATE INDEX "idx_proposal_service_code" ON "proposal_services" USING btree ("component_code");

-- Update client_transaction_data to reference leads
ALTER TABLE "client_transaction_data" ADD CONSTRAINT "client_transaction_data_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE set null ON UPDATE no action;

-- Update proposal_signatures table to match schema
ALTER TABLE "proposal_signatures" DROP COLUMN IF EXISTS "signer_role";
ALTER TABLE "proposal_signatures" DROP COLUMN IF EXISTS "status";
ALTER TABLE "proposal_signatures" DROP COLUMN IF EXISTS "signature_image_url";
ALTER TABLE "proposal_signatures" DROP COLUMN IF EXISTS "docuseal_signature_id";
ALTER TABLE "proposal_signatures" ADD COLUMN IF NOT EXISTS "tenant_id" uuid NOT NULL;
ALTER TABLE "proposal_signatures" ADD COLUMN IF NOT EXISTS "signature_data" text NOT NULL;

-- Add foreign key for proposal_signatures tenant_id if not exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'proposal_signatures_tenant_id_tenants_id_fk'
    ) THEN
        ALTER TABLE "proposal_signatures" ADD CONSTRAINT "proposal_signatures_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;
    END IF;
END $$;
