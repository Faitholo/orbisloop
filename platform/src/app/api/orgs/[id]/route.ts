import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db, organizations, organizationMembers } from "@/lib/db";
import { updateOrgSchema } from "@/lib/validators";
import { eq, and } from "drizzle-orm";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const [org] = await db.select().from(organizations).where(eq(organizations.id, id));
  if (!org) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(org);
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Must be an owner or admin of this org
  const [membership] = await db
    .select()
    .from(organizationMembers)
    .where(
      and(
        eq(organizationMembers.organizationId, id),
        eq(organizationMembers.userId, session.user.id)
      )
    );

  if (!membership || !["owner", "admin"].includes(membership.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const parsed = updateOrgSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  }

  const { name, type, description, website, country, city, logoUrl } = parsed.data;

  const [updated] = await db
    .update(organizations)
    .set({
      ...(name !== undefined && { name }),
      ...(type !== undefined && { type }),
      ...(description !== undefined && { description }),
      ...(website !== undefined && { website: website || null }),
      ...(country !== undefined && { country }),
      ...(city !== undefined && { city }),
      ...(logoUrl !== undefined && { logoUrl: logoUrl || null }),
      updatedAt: new Date(),
    })
    .where(eq(organizations.id, id))
    .returning();

  return NextResponse.json(updated);
}
