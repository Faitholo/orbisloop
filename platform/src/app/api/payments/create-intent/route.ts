import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db, organizations, organizationMembers, inquiries, listings, transactions } from "@/lib/db";
import { stripe } from "@/lib/stripe-server";
import { PLATFORM_FEE_PERCENT } from "@/lib/stripe";
import { eq } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";

/**
 * POST /api/payments/create-intent
 * Creates a Stripe Checkout session for a deal payment (5% platform fee).
 * Body: { inquiryId: string, amountCents: number, currency?: string }
 */
export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { inquiryId, amountCents, currency = "usd" } = body as {
    inquiryId: string;
    amountCents: number;
    currency?: string;
  };

  if (!inquiryId || !amountCents || amountCents < 100) {
    return NextResponse.json({ error: "Invalid parameters" }, { status: 400 });
  }

  // Load the inquiry with listing + orgs
  const [inquiry] = await db
    .select()
    .from(inquiries)
    .where(eq(inquiries.id, inquiryId))
    .limit(1);

  if (!inquiry) return NextResponse.json({ error: "Inquiry not found" }, { status: 404 });
  if (inquiry.status !== "accepted") {
    return NextResponse.json({ error: "Inquiry must be accepted before payment" }, { status: 400 });
  }

  // Verify caller is the buyer (inquiry creator's org)
  const [callerMembership] = await db
    .select({ orgId: organizationMembers.organizationId })
    .from(organizationMembers)
    .where(eq(organizationMembers.userId, session.user.id))
    .limit(1);

  if (!callerMembership || callerMembership.orgId !== inquiry.fromOrganizationId) {
    return NextResponse.json({ error: "Only the buyer can initiate payment" }, { status: 403 });
  }

  // Get listing to find the seller org
  const [listing] = await db
    .select({ organizationId: listings.organizationId })
    .from(listings)
    .where(eq(listings.id, inquiry.listingId))
    .limit(1);

  if (!listing) return NextResponse.json({ error: "Listing not found" }, { status: 404 });

  const platformFeeCents = Math.round(amountCents * PLATFORM_FEE_PERCENT);

  // Get/create Stripe customer for buyer org
  const [buyerOrg] = await db
    .select()
    .from(organizations)
    .where(eq(organizations.id, inquiry.fromOrganizationId))
    .limit(1);

  let customerId = buyerOrg.stripeCustomerId;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: session.user.email,
      name: buyerOrg.name,
      metadata: { orgId: buyerOrg.id },
    });
    customerId = customer.id;
    await db
      .update(organizations)
      .set({ stripeCustomerId: customerId })
      .where(eq(organizations.id, buyerOrg.id));
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const txId = uuidv4();

  const checkoutSession = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "payment",
    line_items: [
      {
        price_data: {
          currency,
          product_data: { name: `Deal payment — Inquiry #${inquiryId.slice(0, 8)}` },
          unit_amount: amountCents,
        },
        quantity: 1,
      },
    ],
    payment_intent_data: {
      application_fee_amount: platformFeeCents,
    },
    success_url: `${appUrl}/inquiries/${inquiryId}?payment=success&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${appUrl}/inquiries/${inquiryId}?payment=cancelled`,
    metadata: {
      txId,
      inquiryId,
      buyerOrgId: inquiry.fromOrganizationId,
      sellerOrgId: listing.organizationId,
    },
  });

  // Create pending transaction record
  await db.insert(transactions).values({
    id: txId,
    inquiryId,
    buyerOrgId: inquiry.fromOrganizationId,
    sellerOrgId: listing.organizationId,
    stripeCheckoutSessionId: checkoutSession.id,
    amountCents,
    platformFeeCents,
    currency,
    status: "pending",
    description: `Deal payment for inquiry ${inquiryId.slice(0, 8)}`,
  });

  return NextResponse.json({ url: checkoutSession.url, txId });
}
