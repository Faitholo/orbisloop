import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db, ecgRecords, organizationMembers } from "@/lib/db";
import { eq, and, sum, gte } from "drizzle-orm";

/** GET /api/ecg?orgId=&period= */
export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const orgId = searchParams.get("orgId");
  const period = searchParams.get("period"); // e.g. "2026-Q1"

  if (!orgId) return NextResponse.json({ error: "orgId required" }, { status: 422 });

  // Verify membership
  const [membership] = await db
    .select()
    .from(organizationMembers)
    .where(
      and(
        eq(organizationMembers.organizationId, orgId),
        eq(organizationMembers.userId, session.user.id)
      )
    );

  if (!membership) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const conditions = [eq(ecgRecords.organizationId, orgId)];
  if (period) conditions.push(eq(ecgRecords.reportingPeriod, period));

  // All records for chart data
  const records = await db
    .select()
    .from(ecgRecords)
    .where(and(...conditions))
    .orderBy(ecgRecords.recordedAt);

  // Aggregated totals
  const [totals] = await db
    .select({
      totalMaterialKg: sum(ecgRecords.materialDivertedKg),
      totalCo2Kg: sum(ecgRecords.co2SavedKg),
      totalWaterL: sum(ecgRecords.waterSavedL),
      totalEnergyKwh: sum(ecgRecords.energySavedKwh),
      totalLandfillKg: sum(ecgRecords.landfillDivertedKg),
      totalCarbonCredits: sum(ecgRecords.carbonCreditEquivalent),
    })
    .from(ecgRecords)
    .where(eq(ecgRecords.organizationId, orgId));

  return NextResponse.json({ totals, records });
}
