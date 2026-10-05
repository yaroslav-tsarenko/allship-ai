CREATE TABLE "email_opt_out" (
	"email" text NOT NULL,
	"sequence" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "email_opt_out_email_sequence_pk" PRIMARY KEY("email","sequence")
);
--> statement-breakpoint
CREATE TABLE "email_send" (
	"id" uuid PRIMARY KEY NOT NULL,
	"enrollment_id" uuid,
	"sequence" text NOT NULL,
	"step" integer NOT NULL,
	"email" text NOT NULL,
	"user_id" text,
	"template" text NOT NULL,
	"subject" text NOT NULL,
	"category" text NOT NULL,
	"status" text DEFAULT 'sending' NOT NULL,
	"error" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "email_send" ADD CONSTRAINT "email_send_enrollment_id_email_enrollment_id_fk" FOREIGN KEY ("enrollment_id") REFERENCES "public"."email_enrollment"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_send" ADD CONSTRAINT "email_send_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "email_send_step_uq" ON "email_send" USING btree ("enrollment_id","step");--> statement-breakpoint
CREATE INDEX "email_send_email_created_idx" ON "email_send" USING btree ("email","created_at");--> statement-breakpoint
CREATE INDEX "email_send_created_idx" ON "email_send" USING btree ("created_at");--> statement-breakpoint
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['email_send', 'email_opt_out'] LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
      EXECUTE format('REVOKE ALL ON TABLE public.%I FROM anon, authenticated', t);
    END IF;
  END LOOP;
END $$;
