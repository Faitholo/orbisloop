import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db, organizations, organizationMembers } from "@/lib/db";
import { createOrgSchema } from "@/lib/validators";
import { eq } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";

export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const membership = await db
    .select({ organization: organizations })
    .from(organizationMembers)
    .innerJoin(organizations, eq(organizationMembers.organizationId, organizations.id))
    .where(eq(organizationMembers.userId, session.user.id));

  return NextResponse.json(membership.map((m: { organization: typeof organizations.$inferSelect }) => m.organization));
}

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const parsed = createOrgSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  }

  const now = new Date();
  const orgId = uuidv4();

  const [org] = await db
    .insert(organizations)
    .values({ id: orgId, ...parsed.data, createdAt: now, updatedAt: now })
    .returning();

  await db.insert(organizationMembers).values({
    id: uuidv4(),
    organizationId: orgId,
    userId: session.user.id,
    role: "owner",
    createdAt: now,
  });

  return NextResponse.json(org, { status: 201 });
}
