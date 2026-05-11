import { NextRequest, NextResponse } from "next/server";
import {
  getAllSubmissions,
  updateSubmission,
  incrementNgoCompleted,
  incrementNgoRejected,
  incrementNgoAssigned,
  getNgoById,
} from "@/lib/db";
import { rankNgosForSubmission } from "@/lib/matching";
import { notifyNgoMatched } from "@/lib/whatsapp";

/**
 * POST /api/webhooks/twilio
 * Twilio sends incoming WhatsApp messages here.
 * Expected: NGO replies "YES" or "NO" to accept/reject a matched submission.
 */
export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const body = (formData.get("Body") as string || "").trim().toUpperCase();
  const from = (formData.get("From") as string || "").replace("whatsapp:", "");

  if (!from || !body) {
    return twimlResponse("Sorry, we couldn't process your message.");
  }

  // Find the most recent matched submission assigned to an NGO with this phone
  const submissions = getAllSubmissions();
  const matched = submissions.find((s) => {
    if (s.status !== "matched" || !s.assigned_ngo_id) return false;
    const ngo = getNgoById(s.assigned_ngo_id);
    return ngo && ngo.phone.replace(/\s/g, "") === from.replace(/\s/g, "");
  });

  if (!matched || !matched.assigned_ngo_id) {
    return twimlResponse("No active match found for your number.");
  }

  if (body === "YES") {
    // NGO accepted — no status change needed (stays matched, will complete later)
    return twimlResponse(
      `✅ Accepted! Pickup from ${matched.business_name} at ${matched.location}. Pickup time: ${matched.pickup_time}`
    );
  }

  if (body === "NO") {
    // NGO rejected — reassign
    incrementNgoRejected(matched.assigned_ngo_id);

    const excludeIds = new Set<string>([matched.assigned_ngo_id]);
    const ranked = rankNgosForSubmission(matched, excludeIds);

    if (ranked.length > 0) {
      const nextNgo = ranked[0];
      updateSubmission(matched.id, { status: "matched", assigned_ngo_id: nextNgo.id });
      incrementNgoAssigned(nextNgo.id);

      const ngo = getNgoById(nextNgo.id);
      if (ngo) {
        notifyNgoMatched(ngo, matched).catch(() => {});
      }

      return twimlResponse("Understood. We'll reassign this pickup to another partner.");
    }

    // No other NGO — revert to pending
    updateSubmission(matched.id, { status: "pending", assigned_ngo_id: null });
    return twimlResponse("Understood. We'll find another partner for this pickup.");
  }

  return twimlResponse('Please reply with "YES" to accept or "NO" to decline.');
}

function twimlResponse(message: string) {
  const twiml = `<?xml version="1.0" encoding="UTF-8"?><Response><Message>${escapeXml(message)}</Message></Response>`;
  return new NextResponse(twiml, {
    status: 200,
    headers: { "Content-Type": "text/xml" },
  });
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
