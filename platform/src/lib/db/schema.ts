import {
  pgTable,
  text,
  timestamp,
  boolean,
  integer,
  real,
  pgEnum,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";

// ─── Enums ───────────────────────────────────────────────────────────────────

export const orgTypeEnum = pgEnum("org_type", [
  "manufacturer",
  "retailer",
  "distributor",
  "recycler",
  "processor",
  "broker",
  "other",
]);

export const listingStatusEnum = pgEnum("listing_status", [
  "draft",
  "active",
  "paused",
  "completed",
  "expired",
]);

export const listingTypeEnum = pgEnum("listing_type", [
  "offer",   // org has something available
  "request", // org is looking for something
]);

export const materialCategoryEnum = pgEnum("material_category", [
  "metals",
  "plastics",
  "paper_cardboard",
  "textiles",
  "electronics",
  "chemicals",
  "food_organics",
  "glass",
  "wood",
  "rubber",
  "construction",
  "machinery_equipment",
  "packaging",
  "other",
]);

export const unitEnum = pgEnum("unit", [
  "kg",
  "tonnes",
  "litres",
  "units",
  "pallets",
  "containers",
]);

export const inquiryStatusEnum = pgEnum("inquiry_status", [
  "pending",
  "accepted",
  "declined",
  "completed",
  "cancelled",
]);

export const memberRoleEnum = pgEnum("member_role", ["owner", "admin", "member"]);

// ─── Better Auth tables ───────────────────────────────────────────────────────

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ─── Organizations ────────────────────────────────────────────────────────────

export const organizations = pgTable("organizations", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  type: orgTypeEnum("type").notNull(),
  description: text("description"),
  website: text("website"),
  logoUrl: text("logo_url"),
  country: text("country").notNull(),
  city: text("city"),
  verified: boolean("verified").notNull().default(false),
  // Billing
  stripeCustomerId: text("stripe_customer_id"),
  subscriptionTier: text("subscription_tier").$type<"free" | "starter" | "growth" | "enterprise">().notNull().default("free"),
  subscriptionStatus: text("subscription_status").$type<"active" | "inactive" | "past_due" | "cancelled">().notNull().default("inactive"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  subscriptionPeriodEnd: timestamp("subscription_period_end"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (t) => [uniqueIndex("org_slug_idx").on(t.slug)]);

export const organizationMembers = pgTable("organization_members", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  role: memberRoleEnum("role").notNull().default("member"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [
  uniqueIndex("org_member_unique_idx").on(t.organizationId, t.userId),
]);

// ─── Listings ─────────────────────────────────────────────────────────────────

export const listings = pgTable("listings", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  createdBy: text("created_by")
    .notNull()
    .references(() => user.id),
  type: listingTypeEnum("type").notNull(),
  status: listingStatusEnum("status").notNull().default("draft"),
  title: text("title").notNull(),
  description: text("description"),
  category: materialCategoryEnum("category").notNull(),
  quantity: real("quantity").notNull(),
  unit: unitEnum("unit").notNull(),
  pricePerUnit: real("price_per_unit"),   // null = open to negotiation / free
  currency: text("currency").default("USD"),
  availableFrom: timestamp("available_from"),
  availableUntil: timestamp("available_until"),
  location: text("location"),
  country: text("country"),
  imageUrls: text("image_urls").array(),
  tags: text("tags").array(),
  viewCount: integer("view_count").notNull().default(0),
  inquiryCount: integer("inquiry_count").notNull().default(0),
  // ECG
  estimatedCo2SavedKg: real("estimated_co2_saved_kg"),
  estimatedWaterSavedL: real("estimated_water_saved_l"),
  circularityScore: integer("circularity_score"),  // 0-100
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (t) => [
  index("listing_org_idx").on(t.organizationId),
  index("listing_status_idx").on(t.status),
  index("listing_category_idx").on(t.category),
]);

// ─── Inquiries ────────────────────────────────────────────────────────────────

export const inquiries = pgTable("inquiries", {
  id: text("id").primaryKey(),
  listingId: text("listing_id")
    .notNull()
    .references(() => listings.id, { onDelete: "cascade" }),
  fromOrganizationId: text("from_organization_id")
    .notNull()
    .references(() => organizations.id),
  fromUserId: text("from_user_id")
    .notNull()
    .references(() => user.id),
  status: inquiryStatusEnum("status").notNull().default("pending"),
  message: text("message"),
  proposedQuantity: real("proposed_quantity"),
  proposedPricePerUnit: real("proposed_price_per_unit"),
  // When accepted — finalised deal terms
  agreedQuantity: real("agreed_quantity"),
  agreedPricePerUnit: real("agreed_price_per_unit"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (t) => [
  index("inquiry_listing_idx").on(t.listingId),
  index("inquiry_org_idx").on(t.fromOrganizationId),
]);

export const inquiryMessages = pgTable("inquiry_messages", {
  id: text("id").primaryKey(),
  inquiryId: text("inquiry_id")
    .notNull()
    .references(() => inquiries.id, { onDelete: "cascade" }),
  senderId: text("sender_id")
    .notNull()
    .references(() => user.id),
  body: text("body").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ─── ECG Tracking ─────────────────────────────────────────────────────────────

export const ecgRecords = pgTable("ecg_records", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  inquiryId: text("inquiry_id")
    .references(() => inquiries.id),
  listingId: text("listing_id")
    .references(() => listings.id),

  // Environmental
  materialDivertedKg: real("material_diverted_kg").notNull().default(0),
  co2SavedKg: real("co2_saved_kg").notNull().default(0),
  waterSavedL: real("water_saved_l").notNull().default(0),
  energySavedKwh: real("energy_saved_kwh").notNull().default(0),
  landfillDivertedKg: real("landfill_diverted_kg").notNull().default(0),

  // Carbon
  carbonCreditEquivalent: real("carbon_credit_equivalent"),  // tonnes CO2e
  carbonBaselineKg: real("carbon_baseline_kg"),              // what it would have been

  // Governance
  category: materialCategoryEnum("category"),
  reportingPeriod: text("reporting_period"),  // e.g. "2026-Q1"
  verifiedBy: text("verified_by"),            // future: third-party verifier
  notes: text("notes"),

  recordedAt: timestamp("recorded_at").notNull().defaultNow(),
});

// ─── Transactions ─────────────────────────────────────────────────────────────

export const transactions = pgTable("transactions", {
  id: text("id").primaryKey(),
  inquiryId: text("inquiry_id").references(() => inquiries.id),
  buyerOrgId: text("buyer_org_id")
    .notNull()
    .references(() => organizations.id),
  sellerOrgId: text("seller_org_id")
    .notNull()
    .references(() => organizations.id),
  stripeCheckoutSessionId: text("stripe_checkout_session_id").unique(),
  amountCents: integer("amount_cents").notNull(),
  platformFeeCents: integer("platform_fee_cents").notNull(),
  currency: text("currency").notNull().default("usd"),
  status: text("status")
    .$type<"pending" | "succeeded" | "failed" | "refunded">()
    .notNull()
    .default("pending"),
  description: text("description"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (t) => [
  index("tx_inquiry_idx").on(t.inquiryId),
  index("tx_buyer_idx").on(t.buyerOrgId),
]);

// ─── Type exports ─────────────────────────────────────────────────────────────

export type User = typeof user.$inferSelect;
export type Organization = typeof organizations.$inferSelect;
export type OrganizationMember = typeof organizationMembers.$inferSelect;
export type Listing = typeof listings.$inferSelect;
export type Inquiry = typeof inquiries.$inferSelect;
export type InquiryMessage = typeof inquiryMessages.$inferSelect;
export type EcgRecord = typeof ecgRecords.$inferSelect;
export type Transaction = typeof transactions.$inferSelect;
