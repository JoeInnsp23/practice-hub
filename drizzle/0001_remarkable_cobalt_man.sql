ALTER TYPE "public"."task_priority" ADD VALUE 'critical';--> statement-breakpoint
ALTER TYPE "public"."task_status" ADD VALUE 'review' BEFORE 'completed';--> statement-breakpoint
ALTER TYPE "public"."task_status" ADD VALUE 'blocked';--> statement-breakpoint
ALTER TYPE "public"."task_status" ADD VALUE 'records_received';--> statement-breakpoint
ALTER TYPE "public"."task_status" ADD VALUE 'queries_sent';--> statement-breakpoint
ALTER TYPE "public"."task_status" ADD VALUE 'queries_received';--> statement-breakpoint
CREATE TABLE "portal_categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text,
	"icon_name" varchar(50),
	"color_hex" varchar(7),
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_by_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "portal_links" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"category_id" uuid NOT NULL,
	"title" varchar(200) NOT NULL,
	"description" text,
	"url" text NOT NULL,
	"is_internal" boolean DEFAULT false NOT NULL,
	"icon_name" varchar(50),
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"target_blank" boolean DEFAULT true NOT NULL,
	"requires_auth" boolean DEFAULT false NOT NULL,
	"allowed_roles" jsonb,
	"created_by_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_favorites" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"link_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "portal_categories" ADD CONSTRAINT "portal_categories_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "portal_categories" ADD CONSTRAINT "portal_categories_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "portal_links" ADD CONSTRAINT "portal_links_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "portal_links" ADD CONSTRAINT "portal_links_category_id_portal_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."portal_categories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "portal_links" ADD CONSTRAINT "portal_links_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_favorites" ADD CONSTRAINT "user_favorites_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_favorites" ADD CONSTRAINT "user_favorites_link_id_portal_links_id_fk" FOREIGN KEY ("link_id") REFERENCES "public"."portal_links"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_portal_categories_tenant" ON "portal_categories" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_portal_categories_sort" ON "portal_categories" USING btree ("sort_order");--> statement-breakpoint
CREATE INDEX "idx_portal_categories_active" ON "portal_categories" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "idx_portal_links_tenant" ON "portal_links" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_portal_links_category" ON "portal_links" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "idx_portal_links_sort" ON "portal_links" USING btree ("sort_order");--> statement-breakpoint
CREATE INDEX "idx_portal_links_active" ON "portal_links" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "idx_portal_links_internal" ON "portal_links" USING btree ("is_internal");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_user_link_favorite" ON "user_favorites" USING btree ("user_id","link_id");--> statement-breakpoint
CREATE INDEX "idx_user_favorites_user" ON "user_favorites" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_user_favorites_link" ON "user_favorites" USING btree ("link_id");