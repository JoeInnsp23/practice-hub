CREATE TYPE "public"."pricing_model" AS ENUM('turnover', 'transaction', 'both', 'fixed');--> statement-breakpoint
CREATE TYPE "public"."pricing_rule_type" AS ENUM('turnover_band', 'transaction_band', 'per_unit', 'fixed');--> statement-breakpoint
CREATE TYPE "public"."proposal_status" AS ENUM('draft', 'sent', 'viewed', 'signed', 'rejected', 'expired');--> statement-breakpoint
CREATE TYPE "public"."service_component_category" AS ENUM('compliance', 'vat', 'bookkeeping', 'payroll', 'management', 'secretarial', 'tax_planning', 'addon');--> statement-breakpoint
CREATE TYPE "public"."transaction_data_source" AS ENUM('xero', 'manual', 'estimated');--> statement-breakpoint
CREATE TABLE "client_directors" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"client_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"officer_role" varchar(100),
	"appointed_on" date,
	"resigned_on" date,
	"is_active" boolean DEFAULT true NOT NULL,
	"nationality" varchar(100),
	"occupation" varchar(100),
	"date_of_birth" varchar(20),
	"address" text,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "client_pscs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"client_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"kind" varchar(100),
	"notified_on" date,
	"ceased_on" date,
	"is_active" boolean DEFAULT true NOT NULL,
	"nationality" varchar(100),
	"date_of_birth" varchar(20),
	"natures_of_control" jsonb,
	"address" text,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "client_transaction_data" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"lead_id" uuid,
	"client_id" uuid,
	"monthly_transactions" integer NOT NULL,
	"data_source" "transaction_data_source" NOT NULL,
	"xero_data_json" jsonb,
	"last_updated" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pricing_rules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"component_id" uuid NOT NULL,
	"rule_type" "pricing_rule_type" NOT NULL,
	"min_value" numeric(15, 2),
	"max_value" numeric(15, 2),
	"price" numeric(10, 2) NOT NULL,
	"complexity_level" varchar(50),
	"metadata" jsonb,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "proposal_services" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"proposal_id" uuid NOT NULL,
	"component_id" uuid NOT NULL,
	"quantity" numeric(10, 2) DEFAULT '1',
	"unit_price" numeric(10, 2) NOT NULL,
	"monthly_price" numeric(10, 2) NOT NULL,
	"pricing_model" varchar(10),
	"custom_notes" text,
	"sort_order" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "proposal_signatures" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"proposal_id" uuid NOT NULL,
	"signer_email" varchar(255) NOT NULL,
	"signer_name" varchar(255) NOT NULL,
	"signer_role" varchar(100),
	"signed_at" timestamp,
	"ip_address" varchar(45),
	"signature_image_url" text,
	"docuseal_signature_id" varchar(255),
	"status" varchar(50) DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "proposals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"lead_id" uuid,
	"quote_id" uuid,
	"client_id" uuid,
	"title" varchar(255) NOT NULL,
	"status" "proposal_status" DEFAULT 'draft' NOT NULL,
	"pricing_model_used" varchar(10),
	"monthly_total" numeric(10, 2) NOT NULL,
	"annual_total" numeric(10, 2) NOT NULL,
	"pdf_url" text,
	"signed_pdf_url" text,
	"template_id" uuid,
	"custom_terms" text,
	"notes" text,
	"version" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"sent_at" timestamp,
	"viewed_at" timestamp,
	"signed_at" timestamp,
	"expires_at" timestamp,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_by_id" uuid
);
--> statement-breakpoint
CREATE TABLE "service_components" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"code" varchar(50) NOT NULL,
	"name" varchar(255) NOT NULL,
	"category" "service_component_category" NOT NULL,
	"description" text,
	"pricing_model" "pricing_model" NOT NULL,
	"base_price" numeric(10, 2),
	"supports_complexity" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "client_contacts" ADD COLUMN "middle_name" varchar(100);--> statement-breakpoint
ALTER TABLE "client_contacts" ADD COLUMN "job_title" varchar(100);--> statement-breakpoint
ALTER TABLE "client_contacts" ADD COLUMN "address_line_1" varchar(255);--> statement-breakpoint
ALTER TABLE "client_contacts" ADD COLUMN "address_line_2" varchar(255);--> statement-breakpoint
ALTER TABLE "client_contacts" ADD COLUMN "city" varchar(100);--> statement-breakpoint
ALTER TABLE "client_contacts" ADD COLUMN "region" varchar(100);--> statement-breakpoint
ALTER TABLE "client_contacts" ADD COLUMN "postal_code" varchar(20);--> statement-breakpoint
ALTER TABLE "client_contacts" ADD COLUMN "country" varchar(100);--> statement-breakpoint
ALTER TABLE "clients" ADD COLUMN "health_score" integer DEFAULT 50;--> statement-breakpoint
ALTER TABLE "client_directors" ADD CONSTRAINT "client_directors_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_directors" ADD CONSTRAINT "client_directors_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_pscs" ADD CONSTRAINT "client_pscs_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_pscs" ADD CONSTRAINT "client_pscs_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_transaction_data" ADD CONSTRAINT "client_transaction_data_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_transaction_data" ADD CONSTRAINT "client_transaction_data_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pricing_rules" ADD CONSTRAINT "pricing_rules_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pricing_rules" ADD CONSTRAINT "pricing_rules_component_id_service_components_id_fk" FOREIGN KEY ("component_id") REFERENCES "public"."service_components"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "proposal_services" ADD CONSTRAINT "proposal_services_proposal_id_proposals_id_fk" FOREIGN KEY ("proposal_id") REFERENCES "public"."proposals"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "proposal_services" ADD CONSTRAINT "proposal_services_component_id_service_components_id_fk" FOREIGN KEY ("component_id") REFERENCES "public"."service_components"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "proposal_signatures" ADD CONSTRAINT "proposal_signatures_proposal_id_proposals_id_fk" FOREIGN KEY ("proposal_id") REFERENCES "public"."proposals"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "proposals" ADD CONSTRAINT "proposals_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "proposals" ADD CONSTRAINT "proposals_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "proposals" ADD CONSTRAINT "proposals_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_components" ADD CONSTRAINT "service_components_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_client_director" ON "client_directors" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "idx_director_active" ON "client_directors" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "idx_client_psc" ON "client_pscs" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "idx_psc_active" ON "client_pscs" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "idx_transaction_data_tenant" ON "client_transaction_data" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_transaction_data_client" ON "client_transaction_data" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "idx_transaction_data_lead" ON "client_transaction_data" USING btree ("lead_id");--> statement-breakpoint
CREATE INDEX "idx_pricing_rule_component" ON "pricing_rules" USING btree ("component_id");--> statement-breakpoint
CREATE INDEX "idx_pricing_rule_type" ON "pricing_rules" USING btree ("rule_type");--> statement-breakpoint
CREATE INDEX "idx_pricing_rule_active" ON "pricing_rules" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "idx_proposal_service_proposal" ON "proposal_services" USING btree ("proposal_id");--> statement-breakpoint
CREATE INDEX "idx_proposal_service_component" ON "proposal_services" USING btree ("component_id");--> statement-breakpoint
CREATE INDEX "idx_signature_proposal" ON "proposal_signatures" USING btree ("proposal_id");--> statement-breakpoint
CREATE INDEX "idx_signature_status" ON "proposal_signatures" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_signature_docuseal" ON "proposal_signatures" USING btree ("docuseal_signature_id");--> statement-breakpoint
CREATE INDEX "idx_proposal_tenant" ON "proposals" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_proposal_client" ON "proposals" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "idx_proposal_status" ON "proposals" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_proposal_created" ON "proposals" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_service_component_code" ON "service_components" USING btree ("tenant_id","code");--> statement-breakpoint
CREATE INDEX "idx_service_component_category" ON "service_components" USING btree ("category");--> statement-breakpoint
CREATE INDEX "idx_service_component_active" ON "service_components" USING btree ("is_active");