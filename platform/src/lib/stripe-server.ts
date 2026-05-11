// Server-only: Stripe client. Do NOT import this in client components.
import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
