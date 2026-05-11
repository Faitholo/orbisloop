import { NextRequest, NextResponse } from "next/server";
import { getUserById, updateUser } from "@/lib/db";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = getUserById(id);
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }
  return NextResponse.json({
    id: user.id,
    email: user.email,
    role: user.role,
    phone: user.phone,
    organization: user.organization,
    created_at: user.created_at,
  });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();

  const user = updateUser(id, {
    email: body.email,
    phone: body.phone,
    organization: body.organization,
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json({
    id: user.id,
    email: user.email,
    role: user.role,
    phone: user.phone,
    organization: user.organization,
    created_at: user.created_at,
  });
}
