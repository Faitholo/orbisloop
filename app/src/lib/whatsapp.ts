import type { Submission, Ngo } from "./db";

/**
 * Send a WhatsApp message via Twilio.
 * Returns true on success, false if credentials not configured or send fails.
 */
async function sendWhatsApp(to: string, body: string): Promise<boolean> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_WHATSAPP_FROM; // e.g. "whatsapp:+14155238886"

  if (!accountSid || !authToken || !fromNumber) {
    console.log("[WhatsApp] Twilio not configured, skipping message");
    return false;
  }

  // Normalize phone to whatsapp: format
  const toNumber = to.startsWith("whatsapp:") ? to : `whatsapp:${to.replace(/\s/g, "")}`;

  const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
  const params = new URLSearchParams({
    From: fromNumber,
    To: toNumber,
    Body: body,
  });

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: "Basic " + Buffer.from(`${accountSid}:${authToken}`).toString("base64"),
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });
    const data = await res.json();
    if (data.sid) {
      console.log(`[WhatsApp] Message sent: ${data.sid}`);
      return true;
    }
    console.log("[WhatsApp] Send failed:", data.message || data);
    return false;
  } catch (err) {
    console.log("[WhatsApp] Error:", err);
    return false;
  }
}

/** Notify admin/business that a new submission was created */
export async function notifySubmissionCreated(submission: Submission): Promise<void> {
  const adminPhone = process.env.ADMIN_WHATSAPP_PHONE;
  if (!adminPhone) return;

  const msg = [
    `🔔 *New Pickup Request*`,
    ``,
    `*Business:* ${submission.business_name}`,
    `*Food:* ${submission.food_type}`,
    `*Quantity:* ${submission.quantity}`,
    `*Location:* ${submission.location}`,
    `*Pickup:* ${submission.pickup_time}`,
    ``,
    `Awaiting NGO match.`,
  ].join("\n");

  await sendWhatsApp(adminPhone, msg);
}

/** Notify an NGO that they've been matched with a submission */
export async function notifyNgoMatched(ngo: Ngo, submission: Submission): Promise<void> {
  const msg = [
    `🤝 *OrbisLoop — New Match*`,
    ``,
    `Hi ${ngo.name}, you've been matched with a food pickup:`,
    ``,
    `*Business:* ${submission.business_name}`,
    `*Food:* ${submission.food_type}`,
    `*Quantity:* ${submission.quantity}`,
    `*Location:* ${submission.location}`,
    `*Pickup:* ${submission.pickup_time}`,
    ``,
    `Reply *YES* to accept or *NO* to decline.`,
  ].join("\n");

  await sendWhatsApp(ngo.phone, msg);
}
