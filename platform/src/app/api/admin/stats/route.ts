import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  db,
  organizations,
  listings,
  inquiries,
  transactions,
  ecgRecords,
  user,
} from "@/lib/db";
import { sql, eq, sum } from "drizzle-orm";

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "").split(",").map((e) => e.trim()).filter(Boolean);

async function isAdmin(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) return false;
  return ADMIN_EMAILS.length === 0 || ADMIN_EMAILS.includes(session.user.email);
}

export async function GET(request: NextRequest) {
  if (!(await isAdmin(request))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const [
    orgRows,
    listingRows,
    inquiryRows,
    txRows,
    ecgTotals,
    userCount,
  ] = await Promise.all([
    db.select({
      id: organizations.id,
      name: organizations.name,
      slug: organizations.slug,
      type: organizations.type,
      country: organizations.country,
      verified: organizations.verified,
      subscriptionTier: organizations.subscriptionTier,
      subscriptionStatus: organizations.subscriptionStatus,
      createdAt: organizations.createdAt,
    }).from(organizations).orderBy(organizations.createdAt),

    db.select({
      id: listings.id,
      title: listings.title,
      type: listings.type,
      status: listings.status,
      category: listings.category,
      organizationId: listings.organizationId,
      createdAt: listings.createdAt,
    }).from(listings).orderBy(listings.createdAt),

    db.select({
      id: inquiries.id,
      status: inquiries.status,
      createdAt: inquiries.createdAt,
    }).from(inquiries).orderBy(inquiries.createdAt),

    db.select({
      id: transactions.id,
      status: transactions.status,
      amountCents: transactions.amountCents,
      platformFeeCents: transactions.platformFeeCents,
      currency: transactions.currency,
      createdAt: transactions.createdAt,
    }).from(transactions).orderBy(transactions.createdAt),

    db.select({
      totalCo2: sum(ecgRecords.co2SavedKg).mapWith(Number),
      totalMaterial: sum(ecgRecords.materialDivertedKg).mapWith(Number),
    }).from(ecgRecords),

    db.select({ count: sql<number>`count(*)`.mapWith(Number) }).from(user),
  ]);

  const succeededTx = txRows.filter((t) => t.status === "succeeded");
  const totalRevenueCents = succeededTx.reduce((s, t) => s + (t.platformFeeCents ?? 0), 0);
  const totalVolumeCents = succeededTx.reduce((s, t) => s + (t.amountCents ?? 0), 0);

  return NextResponse.json({
    summary: {
      orgs: orgRows.length,
      users: userCount[0]?.count ?? 0,
      listings: listingRows.length,
      activeListings: listingRows.filter((l) => l.status === "active").length,
      inquiries: inquiryRows.length,
      completedDeals: inquiryRows.filter((i) => i.status === "completed").length,
      totalVolumeCents,
      totalRevenueCents,
      totalCo2Kg: ecgTotals[0]?.totalCo2 ?? 0,
      totalMaterialKg: ecgTotals[0]?.totalMaterial ?? 0,
    },
    orgs: orgRows,
    recentTransactions: txRows.slice(-20).reverse(),
  });
}
