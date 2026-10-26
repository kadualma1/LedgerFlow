CREATE TABLE "memberships" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"role" varchar(8) NOT NULL,
	"status" varchar(8) DEFAULT 'ACTIVE' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "chk_membership_role" CHECK ("memberships"."role" IN ('OPERATOR', 'ADMIN', 'VIEWER')),
	CONSTRAINT "chk_membership_status" CHECK ("memberships"."status" IN ('ACTIVE', 'INACTIVE')),
	CONSTRAINT "chk_membership_dates" CHECK ("memberships"."updated_at" >= "memberships"."created_at")
);
--> statement-breakpoint
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "idx_memberships_user_organization_unique" ON "memberships" USING btree ("user_id","organization_id");--> statement-breakpoint
CREATE INDEX "idx_memberships_user_id" ON "memberships" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_memberships_organization_id" ON "memberships" USING btree ("organization_id");