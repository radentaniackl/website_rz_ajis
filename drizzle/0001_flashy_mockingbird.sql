CREATE TABLE "ajis_account" (
	"user_id" bigint NOT NULL,
	"type" text NOT NULL,
	"provider" text NOT NULL,
	"provider_account_id" text NOT NULL,
	"refresh_token" text,
	"access_token" text,
	"expires_at" integer,
	"token_type" text,
	"scope" text,
	"id_token" text,
	"session_state" text,
	CONSTRAINT "ajis_account_pkey" PRIMARY KEY("provider","provider_account_id")
);
--> statement-breakpoint
CREATE TABLE "ajis_audit_log" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"user_id" bigint,
	"action" varchar(100) NOT NULL,
	"ip_address" varchar(45),
	"user_agent" text,
	"details" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ajis_session" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" bigint NOT NULL,
	"expires" timestamp NOT NULL,
	"session_token" text NOT NULL,
	"access_token" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "ajis_session_session_token_unique" UNIQUE("session_token"),
	CONSTRAINT "ajis_session_session_token_key" UNIQUE("session_token")
);
--> statement-breakpoint
CREATE TABLE "ajis_verification_token" (
	"identifier" text NOT NULL,
	"token" text NOT NULL,
	"expires" timestamp NOT NULL,
	CONSTRAINT "ajis_verification_token_pkey" PRIMARY KEY("identifier","token")
);
--> statement-breakpoint
ALTER TABLE "ajis_user" ADD COLUMN "email" varchar(255);--> statement-breakpoint
ALTER TABLE "ajis_user" ADD COLUMN "failed_login_attempts" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "ajis_user" ADD COLUMN "locked_until" timestamp;--> statement-breakpoint
ALTER TABLE "pembinaan" ADD COLUMN "p3A" text;--> statement-breakpoint
ALTER TABLE "ajis_account" ADD CONSTRAINT "ajis_account_user_id_ajis_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."ajis_user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ajis_audit_log" ADD CONSTRAINT "ajis_audit_log_user_id_ajis_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."ajis_user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ajis_session" ADD CONSTRAINT "ajis_session_user_id_ajis_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."ajis_user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "ajis_account_user_id_idx" ON "ajis_account" USING btree ("user_id" int8_ops);--> statement-breakpoint
ALTER TABLE "pembinaan" DROP COLUMN "p3a";