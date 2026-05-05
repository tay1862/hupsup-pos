DROP INDEX "transaction_items_tx_idx";--> statement-breakpoint
ALTER TABLE "transaction_items" ADD COLUMN "org_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "transaction_items" ADD CONSTRAINT "transaction_items_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "transaction_items_org_tx_idx" ON "transaction_items" USING btree ("org_id","transaction_id");