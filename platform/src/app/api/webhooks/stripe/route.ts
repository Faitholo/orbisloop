import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe-server";
import { db, organizations, transactions } from "@/lib/db";
import { eq } from "drizzle-orm";
import Stripe from "stripe";

export const runtime = "nodejs";

/** POST /api/webhooks/stripe */
export async function POST(request: NextRequest) {
  const sig = request.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    return NextResponse.json({ error: "Webhook secret not configured" }, { status: 500 });
  }

  let event: Stripe.Event;
  const rawBody = await request.text();

  try {
    event = stripe.webhooks.constructEvent(rawBody, sig!, webhookSecret);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;

      if (session.mode === "subscription") {
        // Subscription checkout succeeded
        const orgId = session.metadata?.orgId;
        const tier = session.metadata?.tier as string | undefined;
        if (orgId && tier) {
          await db
            .update(organizations)
            .set({
              subscriptionTier: tier as "starter" | "growth" | "enterprise",
              subscriptionStatus: "active",
              stripeSubscriptionId: session.subscription as string,
            })
            .where(eq(organizations.id, orgId));
        }
      } else if (session.mode === "payment") {
        // Deal payment succeeded
        const { txId } = session.metadata ?? {};
        if (txId) {
          await db
            .update(transactions)
            .set({ status: "succeeded", updatedAt: new Date() })
            .where(eq(transactions.id, txId));
        }
      }
      break;
    }

    case "customer.subscription.updated": {
      const sub = event.data.object as Stripe.Subscription;
      const orgId = sub.metadata?.orgId;
      if (!orgId) break;

      const tierKey = (sub.metadata?.tier ?? "free") as
        | "free"
        | "starter"
        | "growth"
        | "enterprise";
      const stripeStatus = sub.status; // active, past_due, canceled, etc.
      const internalStatus =
        stripeStatus === "active"
          ? "active"
          : stripeStatus === "past_due"
            ? "past_due"
            : stripeStatus === "canceled"
              ? "cancelled"
              : "inactive";

      await db
        .update(organizations)
        .set({
          subscriptionTier: tierKey,
          subscriptionStatus: internalStatus as
            | "active"
            | "inactive"
            | "past_due"
            | "cancelled",
          subscriptionPeriodEnd: sub.items.data[0]
            ? new Date(sub.items.data[0].current_period_end * 1000)
            : null,
        })
        .where(eq(organizations.id, orgId));
      break;
    }

    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      const orgId = sub.metadata?.orgId;
      if (!orgId) break;

      await db
        .update(organizations)
        .set({
          subscriptionTier: "free",
          subscriptionStatus: "inactive",
          stripeSubscriptionId: null,
          subscriptionPeriodEnd: null,
        })
        .where(eq(organizations.id, orgId));
      break;
    }
  }

  return NextResponse.json({ received: true });
}
