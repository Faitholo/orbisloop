import { NextRequest, NextResponse } from "next/server";
import { createSubmission, getAllSubmissions, getSubmissionsByUserId, getSubmissionsByNgoId, updateSubmission, incrementNgoAssigned, getNgoById } from "@/lib/db";
import { geocodeAddress } from "@/lib/geo";
import { rankNgosForSubmission } from "@/lib/matching";
import { notifySubmissionCreated, notifyNgoMatched } from "@/lib/whatsapp";

export async function GET(request: NextRequest) {
  const userId = request.nextUrl.searchParams.get("user_id");
  const ngoId = request.nextUrl.searchParams.get("ngo_id");

  if (userId) {
    return NextResponse.json(getSubmissionsByUserId(userId));
  }
  if (ngoId) {
    return NextResponse.json(getSubmissionsByNgoId(ngoId));
  }
  return NextResponse.json(getAllSubmissions());
}

export async function POST(request: NextRequest) {
  try {
  const body = await request.json();

  const required = ["business_name", "phone", "location", "food_type", "quantity", "pickup_time"];
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

  const sanitized = {
    business_name: body.business_name.trim().slice(0, 200),
    phone: body.phone.trim().slice(0, 30),
    location,
    latitude,
    longitude,
    food_type: body.food_type.trim().slice(0, 200),
    quantity: body.quantity.trim().slice(0, 100),
    pickup_time: body.pickup_time.trim().slice(0, 50),
    user_id: body.user_id || null,
  };

  const submission = createSubmission(sanitized);

  // Notify admin via WhatsApp
  notifySubmissionCreated(submission).catch(() => {});

  // Auto-match: find best NGO
  const ranked = rankNgosForSubmission(submission);
  if (ranked.length > 0) {
    const bestNgo = ranked[0];
    updateSubmission(submission.id, { status: "matched", assigned_ngo_id: bestNgo.id });
    incrementNgoAssigned(bestNgo.id);
    submission.status = "matched";
    submission.assigned_ngo_id = bestNgo.id;

    // Notify NGO via WhatsApp
    const ngo = getNgoById(bestNgo.id);
    if (ngo) {
      notifyNgoMatched(ngo, submission).catch(() => {});
    }
  }

  return NextResponse.json(submission, { status: 201 });
  } catch (err) {
    console.error("Submission error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
