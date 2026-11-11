CREATE TABLE "square_connection" (
	"merchant_id" text PRIMARY KEY NOT NULL,
	"environment" text NOT NULL,
	"access_token" text NOT NULL,
	"refresh_token" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"scopes" text[] NOT NULL,
	"location_id" text,
	"business_name" text,
	"connected_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"revoked_at" timestamp with time zone
);
--> statement-breakpoint
DO $$
BEGIN
  EXECUTE 'ALTER TABLE public.square_connection ENABLE ROW LEVEL SECURITY';
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    EXECUTE 'REVOKE ALL ON TABLE public.square_connection FROM anon, authenticated';
  END IF;
END $$;
