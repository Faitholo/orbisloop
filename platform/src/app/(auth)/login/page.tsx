"use client";

import { Suspense, useState } from "react";
import { signIn } from "@/lib/auth-client";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import Image from "next/image";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setAuthError("");
    setLoading(true);

    const { error } = await signIn.email({ email, password });

    if (error) {
      setAuthError(error.message ?? "Invalid email or password.");
      setLoading(false);
    } else {
      router.replace(callbackUrl);
    }
  }

  return (
    <div className="w-full max-w-md">
      <div className="mb-8 text-center">
        <Link href="/" className="inline-flex items-center gap-2 font-bold text-xl" style={{ color: "#022c22" }}>
          <Image src="/logo.png" alt="OrbisLoop" width={48} height={32} className="rounded" style={{ height: "auto" }} />
          OrbisLoop
        </Link>
        <p className="mt-2 text-slate-500 text-sm">Sign in to your account</p>
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
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Work email
          </label>
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
          <div className="flex justify-between items-center mb-1.5">
            <label className="block text-sm font-medium text-slate-700">Password</label>
            <Link href="/forgot-password" className="text-xs hover:underline" style={{ color: "#059669" }}>
              Forgot password?
            </Link>
          </div>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            placeholder="••••••••"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full disabled:opacity-60 text-white font-semibold py-2.5 rounded-lg flex items-center justify-center gap-2 transition-colors"
          style={{ background: "#059669" }}
        >
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          Sign in
        </button>

        <p className="text-center text-sm text-slate-500">
          No account?{" "}
          <Link href="/register" className="font-medium hover:underline" style={{ color: "#059669" }}>
            Create one
          </Link>
        </p>
      </form>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
