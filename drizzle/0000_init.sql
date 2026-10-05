CREATE TYPE "public"."account_type" AS ENUM('shipper', 'carrier');--> statement-breakpoint
CREATE TYPE "public"."ai_role" AS ENUM('user', 'assistant', 'system');--> statement-breakpoint
CREATE TYPE "public"."bid_status" AS ENUM('active', 'withdrawn', 'accepted', 'declined', 'expired');--> statement-breakpoint
CREATE TYPE "public"."conversation_kind" AS ENUM('inquiry', 'booking');--> statement-breakpoint
CREATE TYPE "public"."fmcsa_status" AS ENUM('unverified', 'pending', 'verified', 'failed', 'manual_review');--> statement-breakpoint
CREATE TYPE "public"."lead_type" AS ENUM('contact', 'quote', 'carrier', 'partner', 'newsletter');--> statement-breakpoint
CREATE TYPE "public"."ledger_account" AS ENUM('shipper_cash', 'escrow', 'platform_revenue', 'carrier_payable', 'carrier_paid', 'refunds');--> statement-breakpoint
CREATE TYPE "public"."load_category" AS ENUM('car_or_light_truck', 'motorcycle', 'powerboat', 'sailboat', 'personal_watercraft', 'atv_powersports', 'commercial_truck', 'vehicle_parts', 'trailer', 'rv', 'local_moving', 'long_distance_moving', 'household_items', 'office_moving', 'business_moving', 'corporate_relocation', 'student_moving', 'military_moving', 'heavy_lifting', 'freight', 'heavy_equipment', 'truck_rental', 'truck_with_driver');--> statement-breakpoint
CREATE TYPE "public"."load_source" AS ENUM('dashboard', 'landing_quote', 'assistant', 'legacy');--> statement-breakpoint
CREATE TYPE "public"."load_status" AS ENUM('draft', 'open', 'awaiting_payment', 'booked', 'assigned', 'en_route_to_pickup', 'in_transit', 'delivered', 'completed', 'cancelled', 'expired', 'disputed');--> statement-breakpoint
CREATE TYPE "public"."media_kind" AS ENUM('photo', 'document', 'pod_photo', 'pod_signature', 'pickup_photo');--> statement-breakpoint
CREATE TYPE "public"."notification_channel" AS ENUM('in_app', 'email');--> statement-breakpoint
CREATE TYPE "public"."payment_status" AS ENUM('requires_payment', 'processing', 'succeeded', 'refunded', 'partially_refunded', 'disputed', 'failed', 'canceled');--> statement-breakpoint
CREATE TYPE "public"."payout_status" AS ENUM('pending', 'scheduled', 'paid', 'reversed', 'held');--> statement-breakpoint
CREATE TYPE "public"."post_status" AS ENUM('draft', 'scheduled', 'published', 'archived');--> statement-breakpoint
CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp with time zone,
	"refresh_token_expires_at" timestamp with time zone,
	"scope" text,
	"password" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invitation" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"email" text NOT NULL,
	"role" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"inviter_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "member" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"user_id" text NOT NULL,
	"role" text DEFAULT 'dispatcher' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "organization" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"logo" text,
	"metadata" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "passkey" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text,
	"public_key" text NOT NULL,
	"user_id" text NOT NULL,
	"credential_id" text NOT NULL,
	"counter" integer NOT NULL,
	"device_type" text NOT NULL,
	"backed_up" boolean NOT NULL,
	"transports" text,
	"aaguid" text,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "rate_limit" (
	"id" text PRIMARY KEY NOT NULL,
	"key" text NOT NULL,
	"count" integer NOT NULL,
	"last_request" bigint NOT NULL,
	CONSTRAINT "rate_limit_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"token" text NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	"active_organization_id" text,
	"impersonated_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "two_factor" (
	"id" text PRIMARY KEY NOT NULL,
	"secret" text NOT NULL,
	"backup_codes" text NOT NULL,
	"user_id" text NOT NULL,
	"verified" boolean DEFAULT true,
	"failed_verification_count" integer DEFAULT 0,
	"locked_until" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"first_name" text,
	"last_name" text,
	"phone" text,
	"account_type" "account_type" DEFAULT 'shipper' NOT NULL,
	"onboarding_completed_at" timestamp with time zone,
	"locale" text DEFAULT 'en-US' NOT NULL,
	"legacy_id" text,
	"two_factor_enabled" boolean DEFAULT false,
	"role" text DEFAULT 'user',
	"banned" boolean DEFAULT false,
	"ban_reason" text,
	"ban_expires" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "carrier_profile" (
	"org_id" text PRIMARY KEY NOT NULL,
	"legal_name" text NOT NULL,
	"dba_name" text,
	"usdot_number" text,
	"mc_number" text,
	"fmcsa_status" "fmcsa_status" DEFAULT 'unverified' NOT NULL,
	"fmcsa_checked_at" timestamp with time zone,
	"fmcsa_snapshot" text,
	"insurance_expires_at" timestamp with time zone,
	"insurance_doc_key" text,
	"service_states" text[] DEFAULT '{}' NOT NULL,
	"equipment" text[] DEFAULT '{}' NOT NULL,
	"categories" "load_category"[] DEFAULT '{}' NOT NULL,
	"about" text,
	"years_in_business" integer,
	"website" text,
	"phone" text,
	"stripe_account_id" text,
	"charges_enabled" boolean DEFAULT false NOT NULL,
	"payouts_enabled" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "carrier_rate_tier" (
	"id" uuid PRIMARY KEY NOT NULL,
	"org_id" text NOT NULL,
	"from_miles" integer NOT NULL,
	"to_miles" integer NOT NULL,
	"rate_per_cu_ft_cents" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "carrier_service_rates" (
	"org_id" text PRIMARY KEY NOT NULL,
	"packing_per_cu_ft_cents" integer DEFAULT 0 NOT NULL,
	"unpacking_per_cu_ft_cents" integer DEFAULT 0 NOT NULL,
	"storage_per_cu_ft_month_cents" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bid" (
	"id" uuid PRIMARY KEY NOT NULL,
	"load_id" uuid NOT NULL,
	"carrier_org_id" text NOT NULL,
	"created_by" text NOT NULL,
	"amount_cents" integer NOT NULL,
	"estimated_pickup_at" timestamp with time zone,
	"estimated_delivery_at" timestamp with time zone,
	"message" text NOT NULL,
	"status" "bid_status" DEFAULT 'active' NOT NULL,
	"ai_assisted" boolean DEFAULT false NOT NULL,
	"legacy_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "driver_location" (
	"id" uuid PRIMARY KEY NOT NULL,
	"load_id" uuid NOT NULL,
	"driver_id" text NOT NULL,
	"lat" numeric(9, 6) NOT NULL,
	"lng" numeric(9, 6) NOT NULL,
	"accuracy_m" integer,
	"recorded_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "load" (
	"id" uuid PRIMARY KEY NOT NULL,
	"public_id" text NOT NULL,
	"shipper_id" text NOT NULL,
	"category" "load_category" NOT NULL,
	"title" text NOT NULL,
	"status" "load_status" DEFAULT 'draft' NOT NULL,
	"pickup" jsonb NOT NULL,
	"dropoff" jsonb NOT NULL,
	"distance_miles" numeric(8, 1),
	"details" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"details_version" integer DEFAULT 1 NOT NULL,
	"target_price_cents" integer,
	"estimated_volume_cu_ft" integer,
	"published_at" timestamp with time zone,
	"bidding_closes_at" timestamp with time zone,
	"accepted_bid_id" uuid,
	"carrier_org_id" text,
	"driver_id" text,
	"source" "load_source" DEFAULT 'dashboard' NOT NULL,
	"cancelled_reason" text,
	"legacy_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "load_event" (
	"id" uuid PRIMARY KEY NOT NULL,
	"load_id" uuid NOT NULL,
	"type" text NOT NULL,
	"from_status" "load_status",
	"to_status" "load_status",
	"actor_id" text,
	"payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "load_media" (
	"id" uuid PRIMARY KEY NOT NULL,
	"load_id" uuid NOT NULL,
	"kind" "media_kind" NOT NULL,
	"storage_key" text NOT NULL,
	"content_type" text,
	"uploaded_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ledger_entry" (
	"id" uuid PRIMARY KEY NOT NULL,
	"journal_id" uuid NOT NULL,
	"account" "ledger_account" NOT NULL,
	"amount_cents" integer NOT NULL,
	"currency" char(3) DEFAULT 'usd' NOT NULL,
	"ref_type" text NOT NULL,
	"ref_id" text NOT NULL,
	"memo" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payment" (
	"id" uuid PRIMARY KEY NOT NULL,
	"load_id" uuid NOT NULL,
	"bid_id" uuid NOT NULL,
	"shipper_id" text NOT NULL,
	"stripe_payment_intent_id" text,
	"currency" char(3) DEFAULT 'usd' NOT NULL,
	"amount_cents" integer NOT NULL,
	"carrier_amount_cents" integer NOT NULL,
	"platform_fee_cents" integer NOT NULL,
	"refunded_cents" integer DEFAULT 0 NOT NULL,
	"status" "payment_status" DEFAULT 'requires_payment' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payout" (
	"id" uuid PRIMARY KEY NOT NULL,
	"load_id" uuid NOT NULL,
	"payment_id" uuid NOT NULL,
	"carrier_org_id" text NOT NULL,
	"stripe_transfer_id" text,
	"currency" char(3) DEFAULT 'usd' NOT NULL,
	"amount_cents" integer NOT NULL,
	"status" "payout_status" DEFAULT 'pending' NOT NULL,
	"release_after" timestamp with time zone,
	"paid_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "stripe_event" (
	"id" text PRIMARY KEY NOT NULL,
	"type" text NOT NULL,
	"processed_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "conversation" (
	"id" uuid PRIMARY KEY NOT NULL,
	"kind" "conversation_kind" NOT NULL,
	"load_id" uuid NOT NULL,
	"shipper_id" text NOT NULL,
	"carrier_org_id" text NOT NULL,
	"last_message_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "conversation_read" (
	"conversation_id" uuid NOT NULL,
	"user_id" text NOT NULL,
	"last_read_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "conversation_read_conversation_id_user_id_pk" PRIMARY KEY("conversation_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "message" (
	"id" uuid PRIMARY KEY NOT NULL,
	"conversation_id" uuid NOT NULL,
	"sender_id" text NOT NULL,
	"body" text NOT NULL,
	"attachments" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"edited_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notification" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"type" text NOT NULL,
	"title" text NOT NULL,
	"body" text,
	"href" text,
	"read_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notification_preference" (
	"user_id" text NOT NULL,
	"channel" "notification_channel" NOT NULL,
	"type" text NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	CONSTRAINT "notification_preference_user_id_channel_type_pk" PRIMARY KEY("user_id","channel","type")
);
--> statement-breakpoint
CREATE TABLE "review" (
	"id" uuid PRIMARY KEY NOT NULL,
	"load_id" uuid NOT NULL,
	"shipper_id" text NOT NULL,
	"carrier_org_id" text NOT NULL,
	"rating" integer NOT NULL,
	"body" text,
	"carrier_reply" text,
	"carrier_replied_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "review_rating_range" CHECK ("review"."rating" between 1 and 5)
);
--> statement-breakpoint
CREATE TABLE "ai_message" (
	"id" uuid PRIMARY KEY NOT NULL,
	"thread_id" uuid NOT NULL,
	"role" "ai_role" NOT NULL,
	"parts" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ai_thread" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"title" text DEFAULT 'New conversation' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lead" (
	"id" uuid PRIMARY KEY NOT NULL,
	"type" "lead_type" NOT NULL,
	"name" text,
	"email" text,
	"phone" text,
	"payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"utm" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"gclid" text,
	"status" text DEFAULT 'new' NOT NULL,
	"user_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "newsletter_subscriber" (
	"id" uuid PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"audience" text DEFAULT 'shipper' NOT NULL,
	"confirmed_at" timestamp with time zone,
	"unsubscribed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "post" (
	"id" uuid PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"excerpt" text NOT NULL,
	"body" jsonb NOT NULL,
	"cover_key" text,
	"cover_alt" text,
	"category_id" uuid,
	"author_id" text NOT NULL,
	"status" "post_status" DEFAULT 'draft' NOT NULL,
	"published_at" timestamp with time zone,
	"seo_title" text,
	"seo_description" text,
	"canonical_url" text,
	"faq" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"reading_minutes" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "post_category" (
	"id" uuid PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"description" text
);
--> statement-breakpoint
CREATE TABLE "post_tag" (
	"id" uuid PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "post_to_tag" (
	"post_id" uuid NOT NULL,
	"tag_id" uuid NOT NULL,
	CONSTRAINT "post_to_tag_post_id_tag_id_pk" PRIMARY KEY("post_id","tag_id")
);
--> statement-breakpoint
CREATE TABLE "audit_log" (
	"id" uuid PRIMARY KEY NOT NULL,
	"actor_id" text,
	"action" text NOT NULL,
	"entity" text NOT NULL,
	"entity_id" text,
	"diff" jsonb,
	"ip" text,
	"user_agent" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "legacy_map" (
	"collection" text NOT NULL,
	"mongo_id" text NOT NULL,
	"new_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "legacy_map_collection_mongo_id_pk" PRIMARY KEY("collection","mongo_id")
);
--> statement-breakpoint
CREATE TABLE "tour_progress" (
	"user_id" text NOT NULL,
	"tour_id" text NOT NULL,
	"completed_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "tour_progress_user_id_tour_id_pk" PRIMARY KEY("user_id","tour_id")
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invitation" ADD CONSTRAINT "invitation_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invitation" ADD CONSTRAINT "invitation_inviter_id_user_id_fk" FOREIGN KEY ("inviter_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "member" ADD CONSTRAINT "member_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "member" ADD CONSTRAINT "member_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "passkey" ADD CONSTRAINT "passkey_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "two_factor" ADD CONSTRAINT "two_factor_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "carrier_profile" ADD CONSTRAINT "carrier_profile_org_id_organization_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "carrier_rate_tier" ADD CONSTRAINT "carrier_rate_tier_org_id_organization_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "carrier_service_rates" ADD CONSTRAINT "carrier_service_rates_org_id_organization_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bid" ADD CONSTRAINT "bid_load_id_load_id_fk" FOREIGN KEY ("load_id") REFERENCES "public"."load"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bid" ADD CONSTRAINT "bid_carrier_org_id_organization_id_fk" FOREIGN KEY ("carrier_org_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bid" ADD CONSTRAINT "bid_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "driver_location" ADD CONSTRAINT "driver_location_load_id_load_id_fk" FOREIGN KEY ("load_id") REFERENCES "public"."load"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "driver_location" ADD CONSTRAINT "driver_location_driver_id_user_id_fk" FOREIGN KEY ("driver_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "load" ADD CONSTRAINT "load_shipper_id_user_id_fk" FOREIGN KEY ("shipper_id") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "load" ADD CONSTRAINT "load_carrier_org_id_organization_id_fk" FOREIGN KEY ("carrier_org_id") REFERENCES "public"."organization"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "load" ADD CONSTRAINT "load_driver_id_user_id_fk" FOREIGN KEY ("driver_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "load_event" ADD CONSTRAINT "load_event_load_id_load_id_fk" FOREIGN KEY ("load_id") REFERENCES "public"."load"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "load_event" ADD CONSTRAINT "load_event_actor_id_user_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "load_media" ADD CONSTRAINT "load_media_load_id_load_id_fk" FOREIGN KEY ("load_id") REFERENCES "public"."load"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "load_media" ADD CONSTRAINT "load_media_uploaded_by_user_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment" ADD CONSTRAINT "payment_load_id_load_id_fk" FOREIGN KEY ("load_id") REFERENCES "public"."load"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment" ADD CONSTRAINT "payment_bid_id_bid_id_fk" FOREIGN KEY ("bid_id") REFERENCES "public"."bid"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment" ADD CONSTRAINT "payment_shipper_id_user_id_fk" FOREIGN KEY ("shipper_id") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payout" ADD CONSTRAINT "payout_load_id_load_id_fk" FOREIGN KEY ("load_id") REFERENCES "public"."load"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payout" ADD CONSTRAINT "payout_payment_id_payment_id_fk" FOREIGN KEY ("payment_id") REFERENCES "public"."payment"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payout" ADD CONSTRAINT "payout_carrier_org_id_organization_id_fk" FOREIGN KEY ("carrier_org_id") REFERENCES "public"."organization"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversation" ADD CONSTRAINT "conversation_load_id_load_id_fk" FOREIGN KEY ("load_id") REFERENCES "public"."load"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversation" ADD CONSTRAINT "conversation_shipper_id_user_id_fk" FOREIGN KEY ("shipper_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversation" ADD CONSTRAINT "conversation_carrier_org_id_organization_id_fk" FOREIGN KEY ("carrier_org_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversation_read" ADD CONSTRAINT "conversation_read_conversation_id_conversation_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversation"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversation_read" ADD CONSTRAINT "conversation_read_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "message" ADD CONSTRAINT "message_conversation_id_conversation_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversation"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "message" ADD CONSTRAINT "message_sender_id_user_id_fk" FOREIGN KEY ("sender_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification" ADD CONSTRAINT "notification_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_preference" ADD CONSTRAINT "notification_preference_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review" ADD CONSTRAINT "review_load_id_load_id_fk" FOREIGN KEY ("load_id") REFERENCES "public"."load"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review" ADD CONSTRAINT "review_shipper_id_user_id_fk" FOREIGN KEY ("shipper_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review" ADD CONSTRAINT "review_carrier_org_id_organization_id_fk" FOREIGN KEY ("carrier_org_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_message" ADD CONSTRAINT "ai_message_thread_id_ai_thread_id_fk" FOREIGN KEY ("thread_id") REFERENCES "public"."ai_thread"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_thread" ADD CONSTRAINT "ai_thread_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lead" ADD CONSTRAINT "lead_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "post" ADD CONSTRAINT "post_category_id_post_category_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."post_category"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "post" ADD CONSTRAINT "post_author_id_user_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "post_to_tag" ADD CONSTRAINT "post_to_tag_post_id_post_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."post"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "post_to_tag" ADD CONSTRAINT "post_to_tag_tag_id_post_tag_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."post_tag"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_actor_id_user_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tour_progress" ADD CONSTRAINT "tour_progress_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "account_user_idx" ON "account" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "invitation_org_idx" ON "invitation" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "invitation_email_idx" ON "invitation" USING btree ("email");--> statement-breakpoint
CREATE UNIQUE INDEX "member_org_user_uq" ON "member" USING btree ("organization_id","user_id");--> statement-breakpoint
CREATE INDEX "member_user_idx" ON "member" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "organization_slug_uq" ON "organization" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "passkey_user_idx" ON "passkey" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "session_token_uq" ON "session" USING btree ("token");--> statement-breakpoint
CREATE INDEX "session_user_idx" ON "session" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "two_factor_user_idx" ON "two_factor" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "two_factor_secret_idx" ON "two_factor" USING btree ("secret");--> statement-breakpoint
CREATE UNIQUE INDEX "user_email_uq" ON "user" USING btree ("email");--> statement-breakpoint
CREATE INDEX "user_legacy_idx" ON "user" USING btree ("legacy_id");--> statement-breakpoint
CREATE INDEX "verification_identifier_idx" ON "verification" USING btree ("identifier");--> statement-breakpoint
CREATE UNIQUE INDEX "carrier_usdot_uq" ON "carrier_profile" USING btree ("usdot_number");--> statement-breakpoint
CREATE UNIQUE INDEX "carrier_stripe_uq" ON "carrier_profile" USING btree ("stripe_account_id");--> statement-breakpoint
CREATE INDEX "carrier_fmcsa_idx" ON "carrier_profile" USING btree ("fmcsa_status");--> statement-breakpoint
CREATE INDEX "rate_tier_org_idx" ON "carrier_rate_tier" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "bid_load_idx" ON "bid" USING btree ("load_id","status");--> statement-breakpoint
CREATE INDEX "bid_carrier_idx" ON "bid" USING btree ("carrier_org_id","status");--> statement-breakpoint
CREATE UNIQUE INDEX "bid_active_per_carrier_uq" ON "bid" USING btree ("load_id","carrier_org_id") WHERE "bid"."status" = 'active';--> statement-breakpoint
CREATE INDEX "driver_location_load_idx" ON "driver_location" USING btree ("load_id","recorded_at");--> statement-breakpoint
CREATE UNIQUE INDEX "load_public_id_uq" ON "load" USING btree ("public_id");--> statement-breakpoint
CREATE INDEX "load_status_published_idx" ON "load" USING btree ("status","published_at");--> statement-breakpoint
CREATE INDEX "load_shipper_status_idx" ON "load" USING btree ("shipper_id","status");--> statement-breakpoint
CREATE INDEX "load_carrier_status_idx" ON "load" USING btree ("carrier_org_id","status");--> statement-breakpoint
CREATE INDEX "load_driver_idx" ON "load" USING btree ("driver_id");--> statement-breakpoint
CREATE INDEX "load_event_load_idx" ON "load_event" USING btree ("load_id","created_at");--> statement-breakpoint
CREATE INDEX "load_media_load_idx" ON "load_media" USING btree ("load_id");--> statement-breakpoint
CREATE INDEX "ledger_journal_idx" ON "ledger_entry" USING btree ("journal_id");--> statement-breakpoint
CREATE INDEX "ledger_ref_idx" ON "ledger_entry" USING btree ("ref_type","ref_id");--> statement-breakpoint
CREATE UNIQUE INDEX "payment_pi_uq" ON "payment" USING btree ("stripe_payment_intent_id");--> statement-breakpoint
CREATE INDEX "payment_load_idx" ON "payment" USING btree ("load_id");--> statement-breakpoint
CREATE INDEX "payment_shipper_idx" ON "payment" USING btree ("shipper_id");--> statement-breakpoint
CREATE UNIQUE INDEX "payout_transfer_uq" ON "payout" USING btree ("stripe_transfer_id");--> statement-breakpoint
CREATE UNIQUE INDEX "payout_load_uq" ON "payout" USING btree ("load_id");--> statement-breakpoint
CREATE INDEX "payout_carrier_idx" ON "payout" USING btree ("carrier_org_id","status");--> statement-breakpoint
CREATE UNIQUE INDEX "conversation_load_carrier_uq" ON "conversation" USING btree ("load_id","carrier_org_id");--> statement-breakpoint
CREATE INDEX "conversation_shipper_idx" ON "conversation" USING btree ("shipper_id");--> statement-breakpoint
CREATE INDEX "conversation_carrier_idx" ON "conversation" USING btree ("carrier_org_id");--> statement-breakpoint
CREATE INDEX "message_conversation_idx" ON "message" USING btree ("conversation_id","created_at");--> statement-breakpoint
CREATE INDEX "notification_user_idx" ON "notification" USING btree ("user_id","read_at","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "review_load_uq" ON "review" USING btree ("load_id");--> statement-breakpoint
CREATE INDEX "review_carrier_idx" ON "review" USING btree ("carrier_org_id");--> statement-breakpoint
CREATE INDEX "ai_message_thread_idx" ON "ai_message" USING btree ("thread_id","created_at");--> statement-breakpoint
CREATE INDEX "ai_thread_user_idx" ON "ai_thread" USING btree ("user_id","updated_at");--> statement-breakpoint
CREATE INDEX "lead_type_created_idx" ON "lead" USING btree ("type","created_at");--> statement-breakpoint
CREATE INDEX "lead_email_idx" ON "lead" USING btree ("email");--> statement-breakpoint
CREATE UNIQUE INDEX "newsletter_email_uq" ON "newsletter_subscriber" USING btree ("email");--> statement-breakpoint
CREATE UNIQUE INDEX "post_slug_uq" ON "post" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "post_status_published_idx" ON "post" USING btree ("status","published_at");--> statement-breakpoint
CREATE UNIQUE INDEX "post_category_slug_uq" ON "post_category" USING btree ("slug");--> statement-breakpoint
CREATE UNIQUE INDEX "post_tag_slug_uq" ON "post_tag" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "audit_entity_idx" ON "audit_log" USING btree ("entity","entity_id");--> statement-breakpoint
CREATE INDEX "audit_actor_idx" ON "audit_log" USING btree ("actor_id","created_at");