import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM = "OrbisLoop <notifications@orbisloop.com>";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

function wrap(title: string, body: string) {
  return `<!DOCTYPE html><html><body style="font-family:sans-serif;color:#1e293b;max-width:560px;margin:0 auto;padding:32px 16px">
<div style="margin-bottom:24px">
  <span style="font-weight:800;font-size:18px;color:#059669">OrbisLoop</span>
</div>
<h2 style="font-size:20px;font-weight:700;margin-bottom:8px">${title}</h2>
${body}
<hr style="border:none;border-top:1px solid #e2e8f0;margin:32px 0"/>
<p style="font-size:12px;color:#94a3b8">OrbisLoop — Circular Economy Platform. <a href="${APP_URL}" style="color:#059669">Visit platform</a></p>
</body></html>`;
}

export async function sendInquiryReceivedEmail({
  toEmail, toName, fromOrgName, listingTitle, inquiryId, message,
}: {
  toEmail: string; toName: string; fromOrgName: string;
  listingTitle: string; inquiryId: string; message: string;
}) {
  const link = `${APP_URL}/inquiries/${inquiryId}`;
  await resend.emails.send({
    from: FROM,
    to: toEmail,
    subject: `New inquiry on "${listingTitle}"`,
    html: wrap(
      "You have a new inquiry",
      `<p style="margin-bottom:12px"><strong>${fromOrgName}</strong> sent an inquiry on your listing <strong>${listingTitle}</strong>.</p>
<blockquote style="border-left:3px solid #e2e8f0;margin:0;padding:8px 16px;color:#64748b;font-style:italic">${message}</blockquote>
<p style="margin-top:20px"><a href="${link}" style="background:#059669;color:#fff;padding:10px 20px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px">View inquiry</a></p>`
    ),
  });
}

export async function sendInquiryStatusEmail({
  toEmail, toName, listingTitle, inquiryId, status,
}: {
  toEmail: string; toName: string; listingTitle: string; inquiryId: string; status: "accepted" | "declined";
}) {
  const accepted = status === "accepted";
  const link = `${APP_URL}/inquiries/${inquiryId}`;
  await resend.emails.send({
    from: FROM,
    to: toEmail,
    subject: `Your inquiry on "${listingTitle}" was ${status}`,
    html: wrap(
      `Inquiry ${accepted ? "accepted ✓" : "declined"}`,
      `<p>Your inquiry on <strong>${listingTitle}</strong> has been <strong>${status}</strong>.</p>
${accepted
  ? `<p style="margin-top:8px">You can now proceed to payment from the inquiry thread.</p>`
  : `<p style="margin-top:8px">The listing owner declined this time. Browse the marketplace for other opportunities.</p>`}
<p style="margin-top:20px"><a href="${link}" style="background:#059669;color:#fff;padding:10px 20px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px">View inquiry</a></p>`
    ),
  });
}

export async function sendDealCompletedEmail({
  toEmail, listingTitle, inquiryId, co2SavedKg,
}: {
  toEmail: string; listingTitle: string; inquiryId: string; co2SavedKg: number;
}) {
  const link = `${APP_URL}/inquiries/${inquiryId}`;
  const co2 = co2SavedKg >= 1000 ? `${(co2SavedKg / 1000).toFixed(2)}t` : `${co2SavedKg.toFixed(0)}kg`;
  await resend.emails.send({
    from: FROM,
    to: toEmail,
    subject: `Deal completed — "${listingTitle}"`,
    html: wrap(
      "Deal completed 🎉",
      `<p>Payment has been confirmed for <strong>${listingTitle}</strong>. The deal is now complete.</p>
<p style="margin-top:12px;padding:16px;background:#f0fdf4;border-radius:8px;color:#166534">
  ♻ <strong>${co2} CO₂</strong> equivalent diverted from landfill — recorded in your ECG report.
</p>
<p style="margin-top:20px"><a href="${link}" style="background:#059669;color:#fff;padding:10px 20px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px">View deal</a></p>`
    ),
  });
}
