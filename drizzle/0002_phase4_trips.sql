CREATE TYPE "public"."dispute_reason" AS ENUM('damage', 'not_delivered', 'late', 'missing_items', 'overcharge', 'no_show', 'other');--> statement-breakpoint
CREATE TYPE "public"."dispute_status" AS ENUM('open', 'resolved_release', 'resolved_refund', 'resolved_split', 'withdrawn');--> statement-breakpoint
CREATE TABLE "dispute" (
	"id" uuid PRIMARY KEY NOT NULL,
	"load_id" uuid NOT NULL,
	"opened_by" text NOT NULL,
	"opened_by_role" text NOT NULL,
	"reason" "dispute_reason" NOT NULL,
	"details" text NOT NULL,
	"previous_status" text NOT NULL,
	"status" "dispute_status" DEFAULT 'open' NOT NULL,
	"resolution" text,
	"refund_cents" integer,
	"resolved_by" text,
	"resolved_at" timestamp with time zone,
	"evidence" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "driver_location" ADD COLUMN "heading_deg" integer;--> statement-breakpoint
ALTER TABLE "driver_location" ADD COLUMN "speed_mph" integer;--> statement-breakpoint
ALTER TABLE "load" ADD COLUMN "assigned_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "load" ADD COLUMN "picked_up_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "load" ADD COLUMN "delivered_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "load" ADD COLUMN "completed_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "load" ADD COLUMN "pod_recipient_name" text;--> statement-breakpoint
ALTER TABLE "payment" ADD COLUMN "stripe_charge_id" text;--> statement-breakpoint
ALTER TABLE "payout" ADD COLUMN "failure_reason" text;--> statement-breakpoint
ALTER TABLE "dispute" ADD CONSTRAINT "dispute_load_id_load_id_fk" FOREIGN KEY ("load_id") REFERENCES "public"."load"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dispute" ADD CONSTRAINT "dispute_opened_by_user_id_fk" FOREIGN KEY ("opened_by") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dispute" ADD CONSTRAINT "dispute_resolved_by_user_id_fk" FOREIGN KEY ("resolved_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "dispute_load_idx" ON "dispute" USING btree ("load_id");--> statement-breakpoint
CREATE INDEX "dispute_status_idx" ON "dispute" USING btree ("status","created_at");--> statement-breakpoint
CREATE INDEX "load_status_delivered_idx" ON "load" USING btree ("status","delivered_at");