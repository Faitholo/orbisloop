import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db, organizations } from "@/lib/db";
import { stripe } from "@/lib/stripe-server";
import { eq } from "drizzle-orm";

/**
 * GET /api/billing/sync?session_id=cs_...
 * Called after a successful Stripe Checkout redirect.
 * Reads the completed session from Stripe and updates the org's subscription tier.
 */
export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const sessionId = new URL(request.url).searchParams.get("session_id");
  if (!sessionId) return NextResponse.json({ error: "Missing session_id" }, { status: 400 });

  const checkoutSession = await stripe.checkout.sessions.retrieve(sessionId, {
    expand: ["subscription"],
  });

  if (checkoutSession.payment_status !== "paid" && checkoutSession.status !== "complete") {
    return NextResponse.json({ error: "Session not completed" }, { status: 400 });
  }

  const orgId = checkoutSession.metadata?.orgId;
  const tier = checkoutSession.metadata?.tier as
    | "starter"
    | "growth"
    | "enterprise"
    | undefined;

  if (!orgId || !tier) {
    return NextResponse.json({ error: "Missing metadata" }, { status: 400 });
  }

  const subscriptionId =
    typeof checkoutSession.subscription === "string"
      ? checkoutSession.subscription
      : checkoutSession.subscription?.id ?? null;

  await db
    .update(organizations)
    .set({
      subscriptionTier: tier,
      subscriptionStatus: "active",
      stripeSubscriptionId: subscriptionId,
    })
    .where(eq(organizations.id, orgId));

  return NextResponse.json({ ok: true, tier });
}
