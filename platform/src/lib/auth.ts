import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/lib/db";
import { user, session, account, verification } from "@/lib/db/schema";
import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

async function sendEmail(opts: { to: string; subject: string; html: string }) {
  if (!resend) {
    // Dev mode: log email to console instead of sending
    console.log(`\n[DEV EMAIL] To: ${opts.to}\nSubject: ${opts.subject}\n${opts.html}\n`);
    return;
  }
  await resend.emails.send({
    from: "OrbisLoop <no-reply@orbisloop.com>",
    ...opts,
  });
}

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: { user, session, account, verification },
  }),
  emailAndPassword: {
    enabled: true,
    // In dev (no RESEND_API_KEY) skip email verification so you can log in immediately
    requireEmailVerification: !!process.env.RESEND_API_KEY,
    sendResetPassword: async ({ user, url }) => {
      await sendEmail({
        to: user.email,
        subject: "Reset your OrbisLoop password",
        html: `<p>Click <a href="${url}">here</a> to reset your password. Link expires in 1 hour.</p>`,
      });
    },
  },
  emailVerification: {
    sendVerificationEmail: async ({ user, url }) => {
      await sendEmail({
        to: user.email,
        subject: "Verify your OrbisLoop account",
        html: `<p>Welcome to OrbisLoop! Click <a href="${url}">here</a> to verify your email.</p>`,
      });
    },
    sendOnSignUp: !!process.env.RESEND_API_KEY,
    autoSignInAfterVerification: true,
  },
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5, // cache session on client for 5 min
    },
  },
  rateLimit: {
    enabled: true,
    window: 60,
    max: 10,
  },
  trustedOrigins: [
    process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
    "http://192.168.18.15:3000",
    "http://localhost:3000",
  ],
});

export type Session = typeof auth.$Infer.Session;
