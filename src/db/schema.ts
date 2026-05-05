/**
 * HupSup POS — Database Schema
 *
 * Phase 1 (MVP) schema covering: organizations, branches, users,
 * memberships/roles, audit logs.
 *
 * Sprint 0 only includes core tenancy tables. Catalog/inventory/POS
 * tables will be added in Sprint 1+.
 */

import {
  pgTable,
  uuid,
  text,
  timestamp,
  boolean,
  pgEnum,
  jsonb,
  index,
  uniqueIndex,
  primaryKey,
  numeric,
  integer,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ─────────────────────────────────────────────────────────────────────────────
// Enums
// ─────────────────────────────────────────────────────────────────────────────

export const businessTypeEnum = pgEnum("business_type", [
  "RETAIL",
  "RESTAURANT",
  "SERVICE",
  "MIXED",
]);

export const planTierEnum = pgEnum("plan_tier", [
  "FREE",
  "STARTER",
  "PRO",
  "PREMIUM",
  "BUYOUT",
]);

export const roleEnum = pgEnum("role", [
  "OWNER",
  "MANAGER",
  "CASHIER",
  "WAITER",
  "KITCHEN",
  "STOCK",
  "ACCOUNTANT",
]);

export const localeEnum = pgEnum("locale", ["th", "lo", "en"]);

export const paymentMethodEnum = pgEnum("payment_method", [
  "CASH",
  "BCEL_QR",
  "LDB_QR",
  "JDB_QR",
  "BANK_TRANSFER",
  "OTHER",
]);

export const transactionStatusEnum = pgEnum("transaction_status", [
  "COMPLETED",
  "VOIDED",
  "REFUNDED",
]);

// ─────────────────────────────────────────────────────────────────────────────
// Organizations (tenants)
// ─────────────────────────────────────────────────────────────────────────────

export const organizations = pgTable(
  "organizations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    businessType: businessTypeEnum("business_type").notNull().default("RETAIL"),
    plan: planTierEnum("plan").notNull().default("FREE"),
    baseCurrency: text("base_currency").notNull().default("LAK"),
    defaultLocale: localeEnum("default_locale").notNull().default("th"),
    logoUrl: text("logo_url"),
    settings: jsonb("settings").$type<Record<string, unknown>>().default({}),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [uniqueIndex("organizations_slug_idx").on(table.slug)],
);

// ─────────────────────────────────────────────────────────────────────────────
// Branches (stores under an organization)
// ─────────────────────────────────────────────────────────────────────────────

export const branches = pgTable(
  "branches",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: uuid("org_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    code: text("code").notNull(),
    address: text("address"),
    phone: text("phone"),
    timezone: text("timezone").notNull().default("Asia/Vientiane"),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("branches_org_idx").on(table.orgId),
    uniqueIndex("branches_org_code_idx").on(table.orgId, table.code),
  ],
);

// ─────────────────────────────────────────────────────────────────────────────
// Users (global identity, can belong to multiple orgs)
// ─────────────────────────────────────────────────────────────────────────────

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    email: text("email"),
    phone: text("phone"),
    name: text("name").notNull(),
    passwordHash: text("password_hash"),
    locale: localeEnum("locale").notNull().default("th"),
    avatarUrl: text("avatar_url"),
    emailVerifiedAt: timestamp("email_verified_at", { withTimezone: true }),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("users_email_idx").on(table.email),
    uniqueIndex("users_phone_idx").on(table.phone),
  ],
);

// ─────────────────────────────────────────────────────────────────────────────
// Memberships — link users to organizations with roles + branch scope
// ─────────────────────────────────────────────────────────────────────────────

export const memberships = pgTable(
  "memberships",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    orgId: uuid("org_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    role: roleEnum("role").notNull(),
    /** If null, the user has access to all branches in the org. */
    branchId: uuid("branch_id").references(() => branches.id, {
      onDelete: "cascade",
    }),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    primaryKey({ columns: [table.userId, table.orgId] }),
    index("memberships_org_idx").on(table.orgId),
  ],
);

// ─────────────────────────────────────────────────────────────────────────────
// Categories — product groups, scoped per org
// ─────────────────────────────────────────────────────────────────────────────

export const categories = pgTable(
  "categories",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: uuid("org_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    description: text("description"),
    sortOrder: integer("sort_order").notNull().default(0),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("categories_org_idx").on(table.orgId),
    uniqueIndex("categories_org_name_idx").on(table.orgId, table.name),
  ],
);

// ─────────────────────────────────────────────────────────────────────────────
// Products — sellable items (retail goods, restaurant menu items, services)
// ─────────────────────────────────────────────────────────────────────────────

export const products = pgTable(
  "products",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: uuid("org_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    categoryId: uuid("category_id").references(() => categories.id, {
      onDelete: "set null",
    }),
    sku: text("sku").notNull(),
    barcode: text("barcode"),
    name: text("name").notNull(),
    description: text("description"),
    /** Free-form unit label, e.g. "piece", "kg", "ໂຫລ", "ຂວດ". */
    unitLabel: text("unit_label").notNull().default("piece"),
    /** Cost price in the listed currency, stored as numeric(18,4). */
    costPrice: numeric("cost_price", { precision: 18, scale: 4 })
      .notNull()
      .default("0"),
    sellPrice: numeric("sell_price", { precision: 18, scale: 4 })
      .notNull()
      .default("0"),
    currency: text("currency").notNull().default("LAK"),
    trackStock: boolean("track_stock").notNull().default(false),
    /** Approximate stock level (single-branch MVP). Multi-branch stock comes later. */
    stockOnHand: numeric("stock_on_hand", { precision: 18, scale: 4 })
      .notNull()
      .default("0"),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("products_org_idx").on(table.orgId),
    uniqueIndex("products_org_sku_idx").on(table.orgId, table.sku),
    uniqueIndex("products_org_barcode_idx").on(table.orgId, table.barcode),
    index("products_category_idx").on(table.categoryId),
  ],
);

// ─────────────────────────────────────────────────────────────────────────────
// Transactions (sales / receipts)
// ─────────────────────────────────────────────────────────────────────────────
//
// Money is stored in LAK (the org base currency for Phase 1) using
// numeric(18,4) so we never lose precision to JS floats. THB tendered is
// recorded separately for receipt traceability — the conversion to LAK
// happens at sale time using `exchangeRateThbToLak` (1 THB = X LAK), which
// is also persisted on the row so historical receipts stay auditable.

export const transactions = pgTable(
  "transactions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: uuid("org_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    branchId: uuid("branch_id")
      .notNull()
      .references(() => branches.id, { onDelete: "restrict" }),
    cashierId: uuid("cashier_id").references(() => users.id, {
      onDelete: "set null",
    }),
    receiptNo: text("receipt_no").notNull(),
    status: transactionStatusEnum("status").notNull().default("COMPLETED"),
    paymentMethod: paymentMethodEnum("payment_method")
      .notNull()
      .default("CASH"),
    subtotalLak: numeric("subtotal_lak", { precision: 18, scale: 4 })
      .notNull()
      .default("0"),
    discountLak: numeric("discount_lak", { precision: 18, scale: 4 })
      .notNull()
      .default("0"),
    totalLak: numeric("total_lak", { precision: 18, scale: 4 })
      .notNull()
      .default("0"),
    paidLak: numeric("paid_lak", { precision: 18, scale: 4 })
      .notNull()
      .default("0"),
    paidThb: numeric("paid_thb", { precision: 18, scale: 4 })
      .notNull()
      .default("0"),
    exchangeRateThbToLak: numeric("exchange_rate_thb_to_lak", {
      precision: 18,
      scale: 4,
    })
      .notNull()
      .default("0"),
    changeLak: numeric("change_lak", { precision: 18, scale: 4 })
      .notNull()
      .default("0"),
    note: text("note"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("transactions_org_created_idx").on(table.orgId, table.createdAt),
    index("transactions_branch_created_idx").on(
      table.branchId,
      table.createdAt,
    ),
    uniqueIndex("transactions_org_receipt_idx").on(
      table.orgId,
      table.receiptNo,
    ),
  ],
);

export const transactionItems = pgTable(
  "transaction_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    // Denormalised orgId for tenant isolation — AGENTS.md forbids
    // org_id-less business tables. Mirrors the parent transaction's org so a
    // direct query against transaction_items still gets a tenant filter
    // without joining through transactions.
    orgId: uuid("org_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    transactionId: uuid("transaction_id")
      .notNull()
      .references(() => transactions.id, { onDelete: "cascade" }),
    productId: uuid("product_id").references(() => products.id, {
      onDelete: "set null",
    }),
    sku: text("sku").notNull(),
    name: text("name").notNull(),
    unitLabel: text("unit_label").notNull(),
    qty: numeric("qty", { precision: 18, scale: 4 }).notNull(),
    unitPriceLak: numeric("unit_price_lak", {
      precision: 18,
      scale: 4,
    }).notNull(),
    lineTotalLak: numeric("line_total_lak", {
      precision: 18,
      scale: 4,
    }).notNull(),
    sortOrder: integer("sort_order").notNull().default(0),
  },
  (table) => [
    index("transaction_items_org_tx_idx").on(table.orgId, table.transactionId),
    index("transaction_items_product_idx").on(table.productId),
  ],
);

// ─────────────────────────────────────────────────────────────────────────────
// Audit log (Phase 1: mutations against business-critical data)
// ─────────────────────────────────────────────────────────────────────────────

export const auditLogs = pgTable(
  "audit_logs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: uuid("org_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    userId: uuid("user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    action: text("action").notNull(),
    entityType: text("entity_type").notNull(),
    entityId: text("entity_id"),
    before: jsonb("before").$type<Record<string, unknown>>(),
    after: jsonb("after").$type<Record<string, unknown>>(),
    ip: text("ip"),
    userAgent: text("user_agent"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("audit_logs_org_created_idx").on(table.orgId, table.createdAt),
  ],
);

// ─────────────────────────────────────────────────────────────────────────────
// Relations
// ─────────────────────────────────────────────────────────────────────────────

export const organizationsRelations = relations(organizations, ({ many }) => ({
  branches: many(branches),
  memberships: many(memberships),
  categories: many(categories),
  products: many(products),
  transactions: many(transactions),
}));

export const transactionsRelations = relations(
  transactions,
  ({ one, many }) => ({
    org: one(organizations, {
      fields: [transactions.orgId],
      references: [organizations.id],
    }),
    branch: one(branches, {
      fields: [transactions.branchId],
      references: [branches.id],
    }),
    cashier: one(users, {
      fields: [transactions.cashierId],
      references: [users.id],
    }),
    items: many(transactionItems),
  }),
);

export const transactionItemsRelations = relations(
  transactionItems,
  ({ one }) => ({
    org: one(organizations, {
      fields: [transactionItems.orgId],
      references: [organizations.id],
    }),
    transaction: one(transactions, {
      fields: [transactionItems.transactionId],
      references: [transactions.id],
    }),
    product: one(products, {
      fields: [transactionItems.productId],
      references: [products.id],
    }),
  }),
);

export const categoriesRelations = relations(categories, ({ one, many }) => ({
  org: one(organizations, {
    fields: [categories.orgId],
    references: [organizations.id],
  }),
  products: many(products),
}));

export const productsRelations = relations(products, ({ one }) => ({
  org: one(organizations, {
    fields: [products.orgId],
    references: [organizations.id],
  }),
  category: one(categories, {
    fields: [products.categoryId],
    references: [categories.id],
  }),
}));

export const branchesRelations = relations(branches, ({ one, many }) => ({
  org: one(organizations, {
    fields: [branches.orgId],
    references: [organizations.id],
  }),
  memberships: many(memberships),
}));

export const usersRelations = relations(users, ({ many }) => ({
  memberships: many(memberships),
}));

export const membershipsRelations = relations(memberships, ({ one }) => ({
  user: one(users, {
    fields: [memberships.userId],
    references: [users.id],
  }),
  org: one(organizations, {
    fields: [memberships.orgId],
    references: [organizations.id],
  }),
  branch: one(branches, {
    fields: [memberships.branchId],
    references: [branches.id],
  }),
}));

// ─────────────────────────────────────────────────────────────────────────────
// Type exports
// ─────────────────────────────────────────────────────────────────────────────

export type Organization = typeof organizations.$inferSelect;
export type NewOrganization = typeof organizations.$inferInsert;
export type Branch = typeof branches.$inferSelect;
export type NewBranch = typeof branches.$inferInsert;
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Membership = typeof memberships.$inferSelect;
export type NewMembership = typeof memberships.$inferInsert;
export type Category = typeof categories.$inferSelect;
export type NewCategory = typeof categories.$inferInsert;
export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;
export type Transaction = typeof transactions.$inferSelect;
export type NewTransaction = typeof transactions.$inferInsert;
export type TransactionItem = typeof transactionItems.$inferSelect;
export type NewTransactionItem = typeof transactionItems.$inferInsert;
export type PaymentMethod = (typeof paymentMethodEnum.enumValues)[number];
export type TransactionStatus =
  (typeof transactionStatusEnum.enumValues)[number];
export type AuditLog = typeof auditLogs.$inferSelect;
export type Role = (typeof roleEnum.enumValues)[number];
export type Locale = (typeof localeEnum.enumValues)[number];
export type BusinessType = (typeof businessTypeEnum.enumValues)[number];
