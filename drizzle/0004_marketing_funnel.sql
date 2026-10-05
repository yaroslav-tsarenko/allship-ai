CREATE TABLE "email_enrollment" (
	"id" uuid PRIMARY KEY NOT NULL,
	"sequence" text NOT NULL,
	"email" text NOT NULL,
	"user_id" text,
	"lead_id" uuid,
	"load_id" uuid,
	"step" integer DEFAULT 0 NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"next_send_at" timestamp with time zone,
	"last_sent_at" timestamp with time zone,
	"stop_reason" text,
	"context" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "email_enrollment_active_uq" UNIQUE NULLS NOT DISTINCT("email","sequence","load_id")
);
--> statement-breakpoint
CREATE TABLE "email_suppression" (
	"email" text PRIMARY KEY NOT NULL,
	"reason" text NOT NULL,
	"scope" text DEFAULT 'marketing' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "partner_logo" (
	"id" uuid PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"image_key" text NOT NULL,
	"href" text,
	"relationship" text NOT NULL,
	"published" boolean DEFAULT false NOT NULL,
	"sort" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "testimonial" (
	"id" uuid PRIMARY KEY NOT NULL,
	"quote" text NOT NULL,
	"author_name" text NOT NULL,
	"author_detail" text,
	"rating" integer,
	"source_label" text NOT NULL,
	"source_url" text,
	"reviewed_at" timestamp with time zone,
	"audience" text DEFAULT 'any' NOT NULL,
	"placements" text[] DEFAULT '{}' NOT NULL,
	"published" boolean DEFAULT false NOT NULL,
	"sort" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "carrier_profile" ADD COLUMN "instant_quotes" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "carrier_profile" ADD COLUMN "instant_quote_min_miles" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "carrier_profile" ADD COLUMN "instant_quote_max_miles" integer DEFAULT 3500 NOT NULL;--> statement-breakpoint
ALTER TABLE "bid" ADD COLUMN "origin" text DEFAULT 'manual' NOT NULL;--> statement-breakpoint
ALTER TABLE "load" ADD COLUMN "publish_on_verify" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "load" ADD COLUMN "bidding_days" integer DEFAULT 5 NOT NULL;--> statement-breakpoint
ALTER TABLE "email_enrollment" ADD CONSTRAINT "email_enrollment_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_enrollment" ADD CONSTRAINT "email_enrollment_lead_id_lead_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."lead"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "email_enrollment_due_idx" ON "email_enrollment" USING btree ("status","next_send_at");--> statement-breakpoint
CREATE INDEX "email_enrollment_email_idx" ON "email_enrollment" USING btree ("email","sequence");--> statement-breakpoint
CREATE INDEX "partner_logo_published_idx" ON "partner_logo" USING btree ("published","sort");--> statement-breakpoint
CREATE INDEX "testimonial_published_idx" ON "testimonial" USING btree ("published","sort");--> statement-breakpoint
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['testimonial', 'partner_logo', 'email_enrollment', 'email_suppression'] LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
      EXECUTE format('REVOKE ALL ON TABLE public.%I FROM anon, authenticated', t);
    END IF;
  END LOOP;
END $$;
--> statement-breakpoint
UPDATE carrier_profile SET instant_quotes = true WHERE org_id IN (SELECT DISTINCT org_id FROM carrier_rate_tier);
