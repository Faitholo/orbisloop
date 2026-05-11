import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db, organizations, organizationMembers, listings } from "@/lib/db";
import { createListingSchema, updateListingStatusSchema } from "@/lib/validators";
import { eq, and, desc, ilike, count } from "drizzle-orm";
import { TIERS, TierKey } from "@/lib/stripe";
import { calculateEcgImpact } from "@/lib/ecg";
import { v4 as uuidv4 } from "uuid";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category");
  const type = searchParams.get("type");
  const country = searchParams.get("country");
  const q = searchParams.get("q");
  const orgId = searchParams.get("orgId");

  const conditions = [eq(listings.status, "active")];

  if (category) conditions.push(eq(listings.category, category as never));
  if (type) conditions.push(eq(listings.type, type as never));
  if (country) conditions.push(eq(listings.country, country));
  if (orgId) conditions.push(eq(listings.organizationId, orgId));
  if (q) conditions.push(ilike(listings.title, `%${q}%`));

  const results = await db
    .select()
    .from(listings)
    .where(and(...conditions))
    .orderBy(desc(listings.createdAt))
    .limit(50);

  return NextResponse.json(results);
}

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { orgId, ...listingData } = body;

  if (!orgId) {
    return NextResponse.json({ error: "orgId is required" }, { status: 422 });
  }

  // Verify user is a member of the org
  const [membership] = await db
    .select()
    .from(organizationMembers)
    .where(
      and(
        eq(organizationMembers.organizationId, orgId),
        eq(organizationMembers.userId, session.user.id)
      )
    );

  if (!membership) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // ── Tier gate: check active listing count against plan limit ──────────────
  const [org] = await db
    .select({ subscriptionTier: organizations.subscriptionTier })
    .from(organizations)
    .where(eq(organizations.id, orgId))
    .limit(1);

  const tier = (org?.subscriptionTier ?? "free") as TierKey;
  const limit = TIERS[tier].listings;

  if (limit !== Infinity) {
    const [{ activeCount }] = await db
      .select({ activeCount: count() })
      .from(listings)
      .where(and(eq(listings.organizationId, orgId), eq(listings.status, "active")));

    if (Number(activeCount) >= limit) {
      return NextResponse.json(
        {
          error: `Your ${TIERS[tier].name} plan allows ${limit} active listing${limit === 1 ? "" : "s"}. Upgrade to post more.`,
          code: "LISTING_LIMIT_REACHED",
        },
        { status: 403 }
      );
    }
  }
  // ─────────────────────────────────────────────────────────────────────────

  const parsed = createListingSchema.safeParse(listingData);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  }

  // Pre-calculate ECG estimates (per-unit × quantity)
  const quantityKg =
    parsed.data.unit === "tonnes"
      ? parsed.data.quantity * 1000
      : parsed.data.quantity;

  const ecg = calculateEcgImpact(parsed.data.category, quantityKg);

  const now = new Date();
  const [listing] = await db
    .insert(listings)
    .values({
      id: uuidv4(),
      organizationId: orgId,
      createdBy: session.user.id,
      type: parsed.data.type,
      status: "draft",
      title: parsed.data.title,
      description: parsed.data.description,
      category: parsed.data.category,
      quantity: parsed.data.quantity,
      unit: parsed.data.unit,
      pricePerUnit: parsed.data.pricePerUnit,
      currency: parsed.data.currency,
      location: parsed.data.location,
      country: parsed.data.country,
      tags: parsed.data.tags,
      availableFrom: parsed.data.availableFrom
        ? new Date(parsed.data.availableFrom)
        : null,
      availableUntil: parsed.data.availableUntil
        ? new Date(parsed.data.availableUntil)
        : null,
      estimatedCo2SavedKg: ecg.co2SavedKg,
      estimatedWaterSavedL: ecg.waterSavedL,
      circularityScore: ecg.circularityScore,
      createdAt: now,
      updatedAt: now,
    })
    .returning();

  return NextResponse.json(listing, { status: 201 });
}
