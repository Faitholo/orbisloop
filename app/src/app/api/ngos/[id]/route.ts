import { NextRequest, NextResponse } from "next/server";
import { getNgoById, updateNgo } from "@/lib/db";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const ngo = getNgoById(id);
  if (!ngo) return NextResponse.json({ error: "NGO not found" }, { status: 404 });
  return NextResponse.json(ngo);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const existing = getNgoById(id);
  if (!existing) return NextResponse.json({ error: "NGO not found" }, { status: 404 });

  const body = await request.json();
  const updated = updateNgo(id, {
    name: body.name?.trim().slice(0, 200),
    phone: body.phone?.trim().slice(0, 30),
    location: body.location?.trim().slice(0, 500),
    latitude: body.latitude,
    longitude: body.longitude,
    capacity: ["low", "medium", "high"].includes(body.capacity) ? body.capacity : undefined,
  });

  return NextResponse.json(updated);
}
