// Client-safe: TIERS config + fee constant only.
// For the server-side Stripe client, import from "@/lib/stripe-server".

export const PLATFORM_FEE_PERCENT = 0.05; // 5%

export const TIERS = {
  free: {
    name: "Free",
    price: 0,
    priceId: null as string | null,
    listings: 0,
    features: ["Browse the marketplace", "Send inquiries", "ECG impact view"],
  },
  starter: {
    name: "Starter",
    price: 49,
    priceId: process.env.STRIPE_STARTER_PRICE_ID ?? "",
    listings: 5,
    features: ["5 active listings", "Inquiry inbox", "ECG dashboard"],
  },
  growth: {
    name: "Growth",
    price: 149,
    priceId: process.env.STRIPE_GROWTH_PRICE_ID ?? "",
    listings: 20,
    features: ["20 active listings", "Priority placement", "ECG CSV export"],
  },
  enterprise: {
    name: "Enterprise",
    price: 499,
    priceId: process.env.STRIPE_ENTERPRISE_PRICE_ID ?? "",
    listings: Infinity,
    features: ["Unlimited listings", "Dedicated support", "Custom ECG reports"],
  },
} as const;

export type TierKey = keyof typeof TIERS;
