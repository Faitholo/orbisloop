import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  db,
  inquiries,
  listings,
  transactions,
  ecgRecords,
  organizations,
  organizationMembers,
  user,
} from "@/lib/db";
import { stripe } from "@/lib/stripe-server";
import { calculateEcgImpact } from "@/lib/ecg";
import { sendDealCompletedEmail } from "@/lib/email";
import { eq, inArray } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";

/**
 * POST /api/payments/complete
 * Called by the buyer's browser after Stripe redirects back with ?payment=success&session_id=...
 * Body: { sessionId: string }
 *
 * - Verifies the Stripe session succeeded
 * - Marks the transaction as succeeded
 * - Marks the inquiry as completed
 * - Creates ECG records for both buyer + seller orgs
 * - Marks the listing as completed
 */
export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json() as { sessionId?: string };
  const { sessionId } = body;

  if (!sessionId) {
    return NextResponse.json({ error: "sessionId is required" }, { status: 400 });
  }

  // Retrieve the Stripe checkout session
  let checkoutSession: Awaited<ReturnType<typeof stripe.checkout.sessions.retrieve>>;
  try {
    checkoutSession = await stripe.checkout.sessions.retrieve(sessionId);
  } catch {
    return NextResponse.json({ error: "Invalid Stripe session" }, { status: 400 });
  }

  if (checkoutSession.payment_status !== "paid") {
    return NextResponse.json({ error: "Payment not completed" }, { status: 400 });
  }

  const { txId, inquiryId, buyerOrgId, sellerOrgId } = (checkoutSession.metadata ?? {}) as {
    txId?: string;
    inquiryId?: string;
    buyerOrgId?: string;
    sellerOrgId?: string;
  };

  if (!txId || !inquiryId || !buyerOrgId || !sellerOrgId) {
    return NextResponse.json({ error: "Missing metadata on Stripe session" }, { status: 400 });
  }

  // Verify the caller is the buyer
  const [callerMembership] = await db
    .select({ orgId: organizationMembers.organizationId })
    .from(organizationMembers)
    .where(eq(organizationMembers.userId, session.user.id))
    .limit(1);

  if (!callerMembership || callerMembership.orgId !== buyerOrgId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Load inquiry and listing
  const [inquiry] = await db
    .select()
    .from(inquiries)
    .where(eq(inquiries.id, inquiryId))
    .limit(1);

  if (!inquiry) {
    return NextResponse.json({ error: "Inquiry not found" }, { status: 404 });
  }

  // Idempotency guard — if already completed, return success without re-running
  if (inquiry.status === "completed") {
    return NextResponse.json({ ok: true, alreadyCompleted: true });
  }

  const [listing] = await db
    .select()
    .from(listings)
    .where(eq(listings.id, inquiry.listingId))
    .limit(1);

  if (!listing) {
    return NextResponse.json({ error: "Listing not found" }, { status: 404 });
  }

  const now = new Date();

  // Mark transaction succeeded
  await db
    .update(transactions)
    .set({ status: "succeeded" })
    .where(eq(transactions.id, txId));

  // Mark inquiry completed
  await db
    .update(inquiries)
    .set({ status: "completed", completedAt: now, updatedAt: now })
    .where(eq(inquiries.id, inquiryId));

  // Close the listing
  await db
    .update(listings)
    .set({ status: "completed", updatedAt: now })
    .where(eq(listings.id, listing.id));

  // Calculate ECG impact
  const quantityKg = (() => {
    const qty = inquiry.agreedQuantity ?? inquiry.proposedQuantity ?? listing.quantity;
    return listing.unit === "tonnes" ? qty * 1000 : qty;
  })();

  const ecg = calculateEcgImpact(listing.category, quantityKg);
  const reportingPeriod = `${now.getFullYear()}-Q${Math.ceil((now.getMonth() + 1) / 3)}`;

  const baseRecord = {
    listingId: listing.id,
    inquiryId,
    materialDivertedKg: ecg.landfillDivertedKg,
    co2SavedKg: ecg.co2SavedKg,
    waterSavedL: ecg.waterSavedL,
    energySavedKwh: ecg.energySavedKwh,
    landfillDivertedKg: ecg.landfillDivertedKg,
    carbonCreditEquivalent: ecg.carbonCreditEquivalent,
    category: listing.category,
    reportingPeriod,
    recordedAt: now,
  };

  await db.insert(ecgRecords).values([
    { id: uuidv4(), organizationId: sellerOrgId, ...baseRecord },
    { id: uuidv4(), organizationId: buyerOrgId, ...baseRecord },
  ]);

  // Email both parties
  void (async () => {
    try {
      const orgOwners = await db
        .select({ userId: organizationMembers.userId, orgId: organizationMembers.organizationId })
        .from(organizationMembers)
        .where(
          inArray(organizationMembers.organizationId, [buyerOrgId, sellerOrgId])
        );
      // Pick one owner per org
      const ownerMap: Record<string, string> = {};
      for (const m of orgOwners) {
        if (m.orgId === buyerOrgId && !ownerMap[buyerOrgId]) ownerMap[buyerOrgId] = m.userId;
        if (m.orgId === sellerOrgId && !ownerMap[sellerOrgId]) ownerMap[sellerOrgId] = m.userId;
      }
      const ownerIds = Object.values(ownerMap);
      if (ownerIds.length) {
        const ownerUsers = await db
          .select({ id: user.id, email: user.email })
          .from(user)
          .where(inArray(user.id, ownerIds));
        for (const u of ownerUsers) {
          await sendDealCompletedEmail({
            toEmail: u.email,
            listingTitle: listing.title,
            inquiryId,
            co2SavedKg: ecg.co2SavedKg,
          });
        }
      }
    } catch {
      // Non-fatal
    }
  })();

  return NextResponse.json({ ok: true, ecg });
}
