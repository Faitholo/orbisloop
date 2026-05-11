import { z } from "zod";

export const createOrgSchema = z.object({
  name: z.string().min(2).max(100),
  slug: z
    .string()
    .min(2)
    .max(60)
    .regex(/^[a-z0-9-]+$/, "Slug can only contain lowercase letters, numbers and hyphens"),
  type: z.enum([
    "manufacturer",
    "retailer",
    "distributor",
    "recycler",
    "processor",
    "broker",
    "other",
  ]),
  description: z.string().max(500).optional(),
  website: z.string().url().optional().or(z.literal("")),
  country: z.string().min(2).max(80),
  city: z.string().max(80).optional(),
});

export const createListingSchema = z.object({
  type: z.enum(["offer", "request"]),
  title: z.string().min(5).max(120),
  description: z.string().max(2000).optional(),
  category: z.enum([
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
  ]),
  quantity: z.number().positive(),
  unit: z.enum(["kg", "tonnes", "litres", "units", "pallets", "containers"]),
  pricePerUnit: z.number().nonnegative().optional(),
  currency: z.string().length(3).default("USD"),
  availableFrom: z.string().datetime().optional(),
  availableUntil: z.string().datetime().optional(),
  location: z.string().max(200).optional(),
  country: z.string().max(80).optional(),
  tags: z.array(z.string().max(30)).max(10).optional(),
});

export const updateOrgSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  type: z.enum(["manufacturer", "retailer", "distributor", "recycler", "processor", "broker", "other"]).optional(),
  description: z.string().max(500).optional(),
  website: z.string().url().optional().or(z.literal("")),
  country: z.string().min(2).max(80).optional(),
  city: z.string().max(80).optional(),
  logoUrl: z.string().url().optional().or(z.literal("")),
});

export const updateListingStatusSchema = z.object({
  status: z.enum(["draft", "active", "paused", "completed", "expired"]),
});

export const updateListingSchema = createListingSchema.partial().extend({
  status: z.enum(["draft", "active", "paused", "completed", "expired"]).optional(),
});

export const createInquirySchema = z.object({
  message: z.string().min(10).max(1000),
  proposedQuantity: z.number().positive().optional(),
  proposedPricePerUnit: z.number().nonnegative().optional(),
});

export const replyInquirySchema = z.object({
  status: z.enum(["accepted", "declined"]),
  message: z.string().max(500).optional(),
  agreedQuantity: z.number().positive().optional(),
  agreedPricePerUnit: z.number().nonnegative().optional(),
});

export const sendMessageSchema = z.object({
  body: z.string().min(1).max(2000),
});

export type CreateOrgInput = z.infer<typeof createOrgSchema>;
export type UpdateOrgInput = z.infer<typeof updateOrgSchema>;
export type CreateListingInput = z.infer<typeof createListingSchema>;
export type UpdateListingInput = z.infer<typeof updateListingSchema>;
export type CreateInquiryInput = z.infer<typeof createInquirySchema>;
export type ReplyInquiryInput = z.infer<typeof replyInquirySchema>;
