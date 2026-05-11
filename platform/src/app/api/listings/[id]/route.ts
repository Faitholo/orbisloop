import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db, listings, organizationMembers } from "@/lib/db";
import { updateListingSchema } from "@/lib/validators";
import { eq, and } from "drizzle-orm";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const [listing] = await db.select().from(listings).where(eq(listings.id, id));
  if (!listing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(listing);
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [listing] = await db.select().from(listings).where(eq(listings.id, id));
  if (!listing) return NextResponse.json({ error: "Not found" }, { status: 404 });

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
  const parsed = updateListingSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  }

  const { status, type, title, description, category, quantity, unit,
          pricePerUnit, currency, availableFrom, availableUntil,
          location, country, tags } = parsed.data;

  const [updated] = await db
    .update(listings)
    .set({
      ...(status !== undefined && { status }),
      ...(type !== undefined && { type }),
      ...(title !== undefined && { title }),
      ...(description !== undefined && { description }),
      ...(category !== undefined && { category }),
      ...(quantity !== undefined && { quantity }),
      ...(unit !== undefined && { unit }),
      ...(pricePerUnit !== undefined && { pricePerUnit }),
      ...(currency !== undefined && { currency }),
      ...(availableFrom !== undefined && { availableFrom: new Date(availableFrom) }),
      ...(availableUntil !== undefined && { availableUntil: new Date(availableUntil) }),
      ...(location !== undefined && { location }),
      ...(country !== undefined && { country }),
      ...(tags !== undefined && { tags }),
      updatedAt: new Date(),
    })
    .where(eq(listings.id, id))
    .returning();

  return NextResponse.json(updated);
}
