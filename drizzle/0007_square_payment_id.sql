ALTER TABLE "payment" ADD COLUMN "square_payment_id" text;--> statement-breakpoint
CREATE UNIQUE INDEX "payment_square_uq" ON "payment" USING btree ("square_payment_id");