import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db, organizations, organizationMembers, listings, inquiries } from "@/lib/db";
import { eq, and, count } from "drizzle-orm";

/** GET /api/orgs/billing — returns billing fields + live usage for the user's org */
export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [membership] = await db
    .select({ orgId: organizationMembers.organizationId })
    .from(organizationMembers)
    .where(eq(organizationMembers.userId, session.user.id))
    .limit(1);

  if (!membership) return NextResponse.json({ error: "No organization" }, { status: 404 });

  const orgId = membership.orgId;

  const [org] = await db
    .select({
      subscriptionTier: organizations.subscriptionTier,
      subscriptionStatus: organizations.subscriptionStatus,
      subscriptionPeriodEnd: organizations.subscriptionPeriodEnd,
      stripeCustomerId: organizations.stripeCustomerId,
    })
    .from(organizations)
    .where(eq(organizations.id, orgId))
    .limit(1);

  if (!org) return NextResponse.json({ error: "Organization not found" }, { status: 404 });

  // Live usage counts
  const [{ activeListings }] = await db
    .select({ activeListings: count() })
    .from(listings)
    .where(and(eq(listings.organizationId, orgId), eq(listings.status, "active")));

  const [{ totalListings }] = await db
    .select({ totalListings: count() })
    .from(listings)
    .where(eq(listings.organizationId, orgId));

  const [{ totalInquiries }] = await db
    .select({ totalInquiries: count() })
    .from(inquiries)
    .where(eq(inquiries.fromOrganizationId, orgId));

  return NextResponse.json({
    ...org,
    usage: {
      activeListings: Number(activeListings),
      totalListings: Number(totalListings),
      totalInquiries: Number(totalInquiries),
    },
  });
}
