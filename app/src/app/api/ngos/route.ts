import { NextRequest, NextResponse } from "next/server";
import { createNgo, getAllNgos } from "@/lib/db";
import { geocodeAddress } from "@/lib/geo";

export async function GET() {
  const ngos = getAllNgos();
  return NextResponse.json(ngos);
}

export async function POST(request: NextRequest) {
  const body = await request.json();

  const required = ["name", "phone", "location"];
  for (const field of required) {
    if (!body[field] || typeof body[field] !== "string" || body[field].trim() === "") {
      return NextResponse.json({ error: `${field} is required` }, { status: 400 });
    }
  }

  const location = body.location.trim().slice(0, 500);

  // Geocode the address
  let latitude: number | null = null;
  let longitude: number | null = null;
  const geo = await geocodeAddress(location);
  if (geo) {
    latitude = geo.lat;
    longitude = geo.lng;
  }

  const ngo = createNgo({
    name: body.name.trim().slice(0, 200),
    phone: body.phone.trim().slice(0, 30),
    location,
    latitude,
    longitude,
    capacity: ["low", "medium", "high"].includes(body.capacity) ? body.capacity : "medium",
  });

  return NextResponse.json(ngo, { status: 201 });
}
