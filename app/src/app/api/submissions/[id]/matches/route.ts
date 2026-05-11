import { NextRequest, NextResponse } from "next/server";
import { getSubmissionById } from "@/lib/db";
import { rankNgosForSubmission } from "@/lib/matching";

/** GET /api/submissions/[id]/matches — returns ranked NGOs for a submission */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const submission = getSubmissionById(id);
  if (!submission) {
    return NextResponse.json({ error: "Submission not found" }, { status: 404 });
  }

  const ranked = rankNgosForSubmission(submission);
  return NextResponse.json(ranked);
}
