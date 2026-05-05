CREATE TYPE "public"."payment_method" AS ENUM('CASH', 'BCEL_QR', 'LDB_QR', 'JDB_QR', 'BANK_TRANSFER', 'OTHER');--> statement-breakpoint
CREATE TYPE "public"."transaction_status" AS ENUM('COMPLETED', 'VOIDED', 'REFUNDED');--> statement-breakpoint
CREATE TABLE "transaction_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"transaction_id" uuid NOT NULL,
	"product_id" uuid,
	"sku" text NOT NULL,
	"name" text NOT NULL,
	"unit_label" text NOT NULL,
	"qty" numeric(18, 4) NOT NULL,
	"unit_price_lak" numeric(18, 4) NOT NULL,
	"line_total_lak" numeric(18, 4) NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"branch_id" uuid NOT NULL,
	"cashier_id" uuid,
	"receipt_no" text NOT NULL,
	"status" "transaction_status" DEFAULT 'COMPLETED' NOT NULL,
	"payment_method" "payment_method" DEFAULT 'CASH' NOT NULL,
	"subtotal_lak" numeric(18, 4) DEFAULT '0' NOT NULL,
	"discount_lak" numeric(18, 4) DEFAULT '0' NOT NULL,
	"total_lak" numeric(18, 4) DEFAULT '0' NOT NULL,
	"paid_lak" numeric(18, 4) DEFAULT '0' NOT NULL,
	"paid_thb" numeric(18, 4) DEFAULT '0' NOT NULL,
	"exchange_rate_thb_to_lak" numeric(18, 4) DEFAULT '0' NOT NULL,
	"change_lak" numeric(18, 4) DEFAULT '0' NOT NULL,
	"note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "transaction_items" ADD CONSTRAINT "transaction_items_transaction_id_transactions_id_fk" FOREIGN KEY ("transaction_id") REFERENCES "public"."transactions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transaction_items" ADD CONSTRAINT "transaction_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_cashier_id_users_id_fk" FOREIGN KEY ("cashier_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "transaction_items_tx_idx" ON "transaction_items" USING btree ("transaction_id");--> statement-breakpoint
CREATE INDEX "transaction_items_product_idx" ON "transaction_items" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "transactions_org_created_idx" ON "transactions" USING btree ("org_id","created_at");--> statement-breakpoint
CREATE INDEX "transactions_branch_created_idx" ON "transactions" USING btree ("branch_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "transactions_org_receipt_idx" ON "transactions" USING btree ("org_id","receipt_no");