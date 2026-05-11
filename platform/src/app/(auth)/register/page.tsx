"use client";

import { useState } from "react";
import { signUp } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import Image from "next/image";

export default function RegisterPage() {
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setAuthError("");
    setLoading(true);

    const displayName = companyName ? `${username} (${companyName})` : username;
    const { error } = await signUp.email({ name: displayName, email, password });

    if (error) {
      setAuthError(error.message ?? "Could not create account.");
      setLoading(false);
    } else {
      router.replace("/onboarding");
    }
  }

  return (
    <div className="w-full max-w-md">
      <div className="mb-8 text-center">
        <Link href="/" className="inline-flex items-center gap-2 font-bold text-xl" style={{ color: "#022c22" }}>
          <Image src="/logo.png" alt="OrbisLoop" width={48} height={32} className="rounded" style={{ height: "auto" }} />
          OrbisLoop
        </Link>
        <p className="mt-2 text-slate-500 text-sm">Create your account</p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 space-y-5"
      >
        {authError && (
          <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded-lg">
            {authError}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Username</label>
          <input
            type="text"
            required
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            placeholder="janesmit"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Company name <span className="text-slate-400 font-normal">(optional)</span>
          </label>
          <input
            type="text"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            placeholder="Acme Ltd"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Work email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            placeholder="you@company.com"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Password</label>
          <input
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            placeholder="At least 8 characters"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full disabled:opacity-60 text-white font-semibold py-2.5 rounded-lg flex items-center justify-center gap-2 transition-colors"
          style={{ background: "#059669" }}
        >
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          Create account
        </button>

        <p className="text-center text-sm text-slate-500">
          Have an account?{" "}
          <Link href="/login" className="font-medium hover:underline" style={{ color: "#059669" }}>
            Sign in
          </Link>
        </p>

        <p className="text-center text-xs text-slate-400">
          By creating an account you agree to our{" "}
          <Link href="/terms" className="underline">Terms</Link> &{" "}
          <Link href="/privacy" className="underline">Privacy Policy</Link>.
        </p>
      </form>
    </div>
  );
}
