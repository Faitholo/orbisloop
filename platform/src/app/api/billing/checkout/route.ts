import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db, organizations, organizationMembers } from "@/lib/db";
import { stripe } from "@/lib/stripe-server";
import { TIERS, TierKey } from "@/lib/stripe";
import { eq } from "drizzle-orm";

/** POST /api/billing/checkout — creates a Stripe Checkout session for subscription upgrade */
export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const tier = body.tier as TierKey;

  if (!tier || tier === "free" || !TIERS[tier]) {
    return NextResponse.json({ error: "Invalid tier" }, { status: 400 });
  }

  const priceId = TIERS[tier].priceId;
  if (!priceId) {
    return NextResponse.json({ error: "Price not configured" }, { status: 400 });
  }

  // Get user's organization
  const [membership] = await db
    .select({ orgId: organizationMembers.organizationId })
    .from(organizationMembers)
    .where(eq(organizationMembers.userId, session.user.id))
    .limit(1);

  if (!membership) {
    return NextResponse.json({ error: "No organization found" }, { status: 404 });
  }

  const [org] = await db
    .select()
    .from(organizations)
    .where(eq(organizations.id, membership.orgId))
    .limit(1);

  if (!org) {
    return NextResponse.json({ error: "Organization not found" }, { status: 404 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  // Ensure Stripe customer exists
  let customerId = org.stripeCustomerId;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: session.user.email,
      name: org.name,
      metadata: { orgId: org.id },
    });
    customerId = customer.id;
    await db
      .update(organizations)
      .set({ stripeCustomerId: customerId })
      .where(eq(organizations.id, org.id));
  }

  const checkoutSession = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${appUrl}/subscription?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${appUrl}/subscription?cancelled=true`,
    metadata: { orgId: org.id, tier },
    subscription_data: { metadata: { orgId: org.id, tier } },
  });

  return NextResponse.json({ url: checkoutSession.url });
}
