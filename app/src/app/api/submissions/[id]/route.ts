import { NextRequest, NextResponse } from "next/server";
import {
  getSubmissionById,
  updateSubmission,
  incrementNgoAssigned,
  incrementNgoCompleted,
  incrementNgoRejected,
  getNgoById,
} from "@/lib/db";
import { rankNgosForSubmission } from "@/lib/matching";
import { notifyNgoMatched } from "@/lib/whatsapp";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const existing = getSubmissionById(id);
  if (!existing) {
    return NextResponse.json({ error: "Submission not found" }, { status: 404 });
  }

  const body = await request.json();

  const validStatuses = ["pending", "matched", "completed", "rejected"];
  if (body.status && !validStatuses.includes(body.status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  // Handle rejection → reassign to next best NGO
  if (body.status === "rejected" && existing.assigned_ngo_id) {
    incrementNgoRejected(existing.assigned_ngo_id);

    // Collect all NGOs that have already been tried (the current one)
    const excludeIds = new Set<string>([existing.assigned_ngo_id]);

    // Find next best match
    const ranked = rankNgosForSubmission(existing, excludeIds);
    if (ranked.length > 0) {
      const nextNgo = ranked[0];
      updateSubmission(id, { status: "matched", assigned_ngo_id: nextNgo.id });
      incrementNgoAssigned(nextNgo.id);

      const ngo = getNgoById(nextNgo.id);
      if (ngo) {
        notifyNgoMatched(ngo, existing).catch(() => {});
      }

      return NextResponse.json(getSubmissionById(id));
    }

    // No NGO available — set back to pending
    const updated = updateSubmission(id, { status: "pending", assigned_ngo_id: null });
    return NextResponse.json(updated);
  }

  // Handle completion → update NGO reliability
  if (body.status === "completed" && existing.assigned_ngo_id) {
    incrementNgoCompleted(existing.assigned_ngo_id);
  }

  // Handle manual NGO assignment
  if (body.assigned_ngo_id && body.assigned_ngo_id !== existing.assigned_ngo_id) {
    const ngo = getNgoById(body.assigned_ngo_id);
    if (!ngo) {
      return NextResponse.json({ error: "NGO not found" }, { status: 400 });
    }
    incrementNgoAssigned(ngo.id);
    notifyNgoMatched(ngo, existing).catch(() => {});
  }

  const updated = updateSubmission(id, {
    status: body.status,
    assigned_ngo_id: body.assigned_ngo_id,
  });

  return NextResponse.json(updated);
}
