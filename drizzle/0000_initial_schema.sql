CREATE TABLE "organizations" (
	"id" uuid PRIMARY KEY NOT NULL,
	"name" varchar(120) NOT NULL,
	"base_currency" varchar(3) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"status" varchar(8) DEFAULT 'ACTIVE' NOT NULL,
	CONSTRAINT "chk_organization_name" CHECK (length(trim("organizations"."name")) > 0),
	CONSTRAINT "chk_organization_currency" CHECK ("organizations"."base_currency" IN ('BRL', 'USD', 'EUR')),
	CONSTRAINT "chk_organization_dates" CHECK ("organizations"."updated_at" >= "organizations"."created_at"),
	CONSTRAINT "chk_organization_status" CHECK ("organizations"."status" IN ('ACTIVE', 'INACTIVE'))
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY NOT NULL,
	"name" varchar(120) NOT NULL,
	"email" varchar(120) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"status" varchar(8) DEFAULT 'ACTIVE' NOT NULL,
	"email_verified_at" timestamp with time zone,
	CONSTRAINT "chk_user_name" CHECK (length(trim("users"."name")) > 0),
	CONSTRAINT "chk_user_email" CHECK (length(trim("users"."email")) > 0),
	CONSTRAINT "chk_user_dates" CHECK ("users"."updated_at" >= "users"."created_at"),
	CONSTRAINT "chk_user_status" CHECK ("users"."status" IN ('ACTIVE', 'INACTIVE')),
	CONSTRAINT "chk_user_email_verified_at" CHECK ("users"."email_verified_at" IS NULL OR ("users"."email_verified_at" >= "users"."created_at" AND "users"."email_verified_at" <= "users"."updated_at"))
);
--> statement-breakpoint
CREATE UNIQUE INDEX "idx_users_email_unique" ON "users" USING btree (lower("email"));