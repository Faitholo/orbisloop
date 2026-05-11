import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  db,
  inquiries,
  inquiryMessages,
  listings,
  organizations,
  organizationMembers,
  user,
} from "@/lib/db";
import { replyInquirySchema } from "@/lib/validators";
import { sendInquiryStatusEmail } from "@/lib/email";
import { eq, and, inArray } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const session = await auth.api.getSession({ headers: _req.headers });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [inquiry] = await db.select().from(inquiries).where(eq(inquiries.id, id));
  if (!inquiry) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const [listing] = await db.select().from(listings).where(eq(listings.id, inquiry.listingId));
  if (!listing) return NextResponse.json({ error: "Listing not found" }, { status: 404 });

  // Auth: user must belong to the seller org or buyer org
  const userMemberships = await db
    .select({ orgId: organizationMembers.organizationId })
    .from(organizationMembers)
    .where(eq(organizationMembers.userId, session.user.id));
  const userOrgIds = userMemberships.map((m) => m.orgId);

  const canView =
    userOrgIds.includes(listing.organizationId) ||
    userOrgIds.includes(inquiry.fromOrganizationId);
  if (!canView) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  // Fetch both org names in one query
  const orgRows = await db
    .select({ id: organizations.id, name: organizations.name })
    .from(organizations)
    .where(inArray(organizations.id, [listing.organizationId, inquiry.fromOrganizationId]));
  const orgMap: Record<string, string> = Object.fromEntries(orgRows.map((o) => [o.id, o.name]));

  // Fetch messages
  const rawMessages = await db
    .select()
    .from(inquiryMessages)
    .where(eq(inquiryMessages.inquiryId, id))
    .orderBy(inquiryMessages.createdAt);

  // Map sender userId → orgId via organizationMembers
  const senderUserIds = [...new Set(rawMessages.map((m) => m.senderId).filter(Boolean) as string[])];
  const senderOrgMap: Record<string, string> = {};
  if (senderUserIds.length > 0) {
    const memberships = await db
      .select({ userId: organizationMembers.userId, orgId: organizationMembers.organizationId })
      .from(organizationMembers)
      .where(inArray(organizationMembers.userId, senderUserIds));
    for (const m of memberships) {
      senderOrgMap[m.userId] = m.orgId;
    }
  }

  const messages = rawMessages.map((m) => ({
    id: m.id,
    senderOrgId: senderOrgMap[m.senderId ?? ""] ?? "",
    senderOrgName: orgMap[senderOrgMap[m.senderId ?? ""] ?? ""],
    body: m.body,
    createdAt: m.createdAt,
  }));

  return NextResponse.json({
    id: inquiry.id,
    listingId: inquiry.listingId,
    listingTitle: listing.title,
    listingOrgId: listing.organizationId,
    listingOrgName: orgMap[listing.organizationId],
    inquirerOrgId: inquiry.fromOrganizationId,
    inquirerOrgName: orgMap[inquiry.fromOrganizationId],
    status: inquiry.status,
    proposedQuantity: inquiry.proposedQuantity,
    proposedPricePerUnit: inquiry.proposedPricePerUnit,
    agreedQuantity: inquiry.agreedQuantity,
    agreedPricePerUnit: inquiry.agreedPricePerUnit,
    currency: inquiry.currency,
    message: inquiry.message,
    createdAt: inquiry.createdAt,
    completedAt: inquiry.completedAt ?? null,
    messages,
  });
}

/** PATCH — accept/decline + send a message */
export async function PATCH(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [inquiry] = await db.select().from(inquiries).where(eq(inquiries.id, id));
  if (!inquiry) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const [listing] = await db
    .select()
    .from(listings)
    .where(eq(listings.id, inquiry.listingId));

  if (!listing) return NextResponse.json({ error: "Listing not found" }, { status: 404 });

  // Only listing org can accept/decline
  const [membership] = await db
    .select()
    .from(organizationMembers)
    .where(
      and(
        eq(organizationMembers.organizationId, listing.organizationId),
        eq(organizationMembers.userId, session.user.id)
      )
    );

  if (!membership) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json();
  const parsed = replyInquirySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  }

  const now = new Date();

  const [updated] = await db
    .update(inquiries)
    .set({
      status: parsed.data.status,
      agreedQuantity: parsed.data.agreedQuantity,
      agreedPricePerUnit: parsed.data.agreedPricePerUnit,
      updatedAt: now,
    })
    .where(eq(inquiries.id, id))
    .returning();

  // Append a message if provided
  if (parsed.data.message) {
    await db.insert(inquiryMessages).values({
      id: uuidv4(),
      inquiryId: id,
      senderId: session.user.id,
      body: parsed.data.message,
      createdAt: now,
    });
  }

  // Email the inquiry sender about the status change
  void (async () => {
    try {
      const [buyerMembership] = await db
        .select({ userId: organizationMembers.userId })
        .from(organizationMembers)
        .where(
          and(
            eq(organizationMembers.organizationId, inquiry.fromOrganizationId),
            eq(organizationMembers.role, "owner")
          )
        )
        .limit(1);
      if (buyerMembership) {
        const [buyerUser] = await db
          .select({ email: user.email, name: user.name })
          .from(user)
          .where(eq(user.id, buyerMembership.userId));
        if (buyerUser) {
          await sendInquiryStatusEmail({
            toEmail: buyerUser.email,
            toName: buyerUser.name ?? "",
            listingTitle: listing.title,
            inquiryId: id,
            status: parsed.data.status as "accepted" | "declined",
          });
        }
      }
    } catch {
      // Non-fatal
    }
  })();

  return NextResponse.json(updated);
}
