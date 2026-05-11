import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db, inquiryMessages, inquiries, listings, organizationMembers } from "@/lib/db";
import { sendMessageSchema } from "@/lib/validators";
import { eq, and, or } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [inquiry] = await db.select().from(inquiries).where(eq(inquiries.id, id));
  if (!inquiry) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const [listing] = await db
    .select()
    .from(listings)
    .where(eq(listings.id, inquiry.listingId));

  if (!listing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Sender must be member of either org
  const userMemberships = await db
    .select({ orgId: organizationMembers.organizationId })
    .from(organizationMembers)
    .where(eq(organizationMembers.userId, session.user.id));

  const orgIds = userMemberships.map((m: { orgId: string }) => m.orgId);
  const canMessage =
    orgIds.includes(listing.organizationId) ||
    orgIds.includes(inquiry.fromOrganizationId);

  if (!canMessage) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json();
  const parsed = sendMessageSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  }

  const [message] = await db
    .insert(inquiryMessages)
    .values({
      id: uuidv4(),
      inquiryId: id,
      senderId: session.user.id,
      body: parsed.data.body,
      createdAt: new Date(),
    })
    .returning();

  return NextResponse.json(message, { status: 201 });
}
