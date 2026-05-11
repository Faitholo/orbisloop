import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  db,
  inquiries,
  listings,
  organizations,
  organizationMembers,
  user,
} from "@/lib/db";
import { createInquirySchema } from "@/lib/validators";
import { sendInquiryReceivedEmail } from "@/lib/email";
import { eq, and, or, inArray, desc } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";

/** GET /api/inquiries?orgId=&role=received|sent  OR  ?listingId= */
export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const listingId = searchParams.get("listingId");
  const orgId = searchParams.get("orgId");
  const role = searchParams.get("role"); // "received" | "sent"

  // Verify user membership
  const userMemberships = await db
    .select({ orgId: organizationMembers.organizationId })
    .from(organizationMembers)
    .where(eq(organizationMembers.userId, session.user.id));
  const userOrgIds = userMemberships.map((m) => m.orgId);

  let rawInquiries: (typeof inquiries.$inferSelect)[];

  if (listingId) {
    // Return all inquiries for a specific listing (for listing owner)
    const [listing] = await db.select({ orgId: listings.organizationId }).from(listings).where(eq(listings.id, listingId));
    if (!listing || !userOrgIds.includes(listing.orgId)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    rawInquiries = await db
      .select()
      .from(inquiries)
      .where(eq(inquiries.listingId, listingId))
      .orderBy(desc(inquiries.createdAt));

  } else if (orgId && userOrgIds.includes(orgId)) {
    if (role === "received") {
      // Inquiries received on this org's listings
      const orgListings = await db
        .select({ id: listings.id })
        .from(listings)
        .where(eq(listings.organizationId, orgId));
      const listingIds = orgListings.map((l) => l.id);
      if (listingIds.length === 0) return NextResponse.json([]);
      rawInquiries = await db
        .select()
        .from(inquiries)
        .where(inArray(inquiries.listingId, listingIds))
        .orderBy(desc(inquiries.createdAt));
    } else {
      // Sent — inquiries this org created
      rawInquiries = await db
        .select()
        .from(inquiries)
        .where(eq(inquiries.fromOrganizationId, orgId))
        .orderBy(desc(inquiries.createdAt));
    }
  } else {
    return NextResponse.json({ error: "orgId or listingId required" }, { status: 422 });
  }

  if (rawInquiries.length === 0) return NextResponse.json([]);

  // Enrich with listing titles and org names
  const listingIds = [...new Set(rawInquiries.map((i) => i.listingId))];
  const buyerOrgIds = [...new Set(rawInquiries.map((i) => i.fromOrganizationId))];

  const listingRows = await db
    .select({ id: listings.id, title: listings.title, organizationId: listings.organizationId })
    .from(listings)
    .where(inArray(listings.id, listingIds));

  const listingMap = Object.fromEntries(listingRows.map((l) => [l.id, l]));

  // Collect all unique org IDs (buyer + seller) then fetch names
  const allOrgIds = [...new Set([
    ...buyerOrgIds,
    ...listingRows.map((l) => l.organizationId),
  ])];
  const allOrgs = await db
    .select({ id: organizations.id, name: organizations.name })
    .from(organizations)
    .where(inArray(organizations.id, allOrgIds));
  const orgMap = Object.fromEntries(allOrgs.map((o) => [o.id, o.name]));

  const enriched = rawInquiries.map((i) => {
    const listing = listingMap[i.listingId];
    return {
      id: i.id,
      listingId: i.listingId,
      listingTitle: listing?.title,
      listingOrgId: listing?.organizationId,
      listingOrgName: listing ? orgMap[listing.organizationId] : undefined,
      inquirerOrgId: i.fromOrganizationId,
      inquirerOrgName: orgMap[i.fromOrganizationId],
      status: i.status,
      proposedQuantity: i.proposedQuantity,
      proposedPricePerUnit: i.proposedPricePerUnit,
      currency: i.currency,
      message: i.message,
      createdAt: i.createdAt,
    };
  });

  return NextResponse.json(enriched);
}

/** POST /api/inquiries — send an inquiry on a listing */
export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { listingId, fromOrgId, ...rest } = body;

  if (!listingId || !fromOrgId) {
    return NextResponse.json({ error: "listingId and fromOrgId are required" }, { status: 422 });
  }

  const parsed = createInquirySchema.safeParse(rest);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  }

  // Verify membership
  const [membership] = await db
    .select()
    .from(organizationMembers)
    .where(
      and(
        eq(organizationMembers.organizationId, fromOrgId),
        eq(organizationMembers.userId, session.user.id)
      )
    );

  if (!membership) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const [listing] = await db.select().from(listings).where(eq(listings.id, listingId));
  if (!listing) return NextResponse.json({ error: "Listing not found" }, { status: 404 });
  if (listing.organizationId === fromOrgId) {
    return NextResponse.json({ error: "Cannot inquire on your own listing" }, { status: 422 });
  }

  const now = new Date();
  const inquiryId = uuidv4();

  const [inquiry] = await db
    .insert(inquiries)
    .values({
      id: inquiryId,
      listingId,
      fromOrganizationId: fromOrgId,
      fromUserId: session.user.id,
      status: "pending",
      message: parsed.data.message,
      proposedQuantity: parsed.data.proposedQuantity,
      proposedPricePerUnit: parsed.data.proposedPricePerUnit,
      createdAt: now,
      updatedAt: now,
    })
    .returning();

  // Increment inquiry count
  await db
    .update(listings)
    .set({ inquiryCount: (listing.inquiryCount ?? 0) + 1, updatedAt: now })
    .where(eq(listings.id, listingId));

  // Email the listing org's owner
  void (async () => {
    try {
      // Get the listing org's owner user
      const [listingOrg] = await db
        .select({ id: organizations.id, name: organizations.name })
        .from(organizations)
        .where(eq(organizations.id, listing.organizationId));
      const ownerMembership = await db
        .select({ userId: organizationMembers.userId })
        .from(organizationMembers)
        .where(
          and(
            eq(organizationMembers.organizationId, listing.organizationId),
            eq(organizationMembers.role, "owner")
          )
        )
        .limit(1);
      if (ownerMembership.length) {
        const [ownerUser] = await db
          .select({ email: user.email, name: user.name })
          .from(user)
          .where(eq(user.id, ownerMembership[0].userId));
        const [fromOrg] = await db
          .select({ name: organizations.name })
          .from(organizations)
          .where(eq(organizations.id, fromOrgId));
        if (ownerUser && listingOrg && fromOrg) {
          await sendInquiryReceivedEmail({
            toEmail: ownerUser.email,
            toName: ownerUser.name ?? "",
            fromOrgName: fromOrg.name,
            listingTitle: listing.title,
            inquiryId,
            message: parsed.data.message,
          });
        }
      }
    } catch {
      // Non-fatal: email failure should not block the response
    }
  })();

  return NextResponse.json(inquiry, { status: 201 });
}
