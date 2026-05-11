"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import StatusBadge from "@/components/StatusBadge";

interface Submission {
  id: string;
  business_name: string;
  phone: string;
  location: string;
  food_type: string;
  quantity: string;
  pickup_time: string;
  status: string;
  assigned_ngo_id: string | null;
  created_at: string;
}

interface UserData {
  id: string;
  email: string;
  role: string;
  phone: string | null;
  organization: string;
  created_at: string;
}

export default function SupermarketDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<UserData | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [tab, setTab] = useState<"submissions" | "new" | "account">("submissions");
  const [loading, setLoading] = useState(true);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState(false);
  const [accountLoading, setAccountLoading] = useState(false);
  const [accountMsg, setAccountMsg] = useState("");

  useEffect(() => {
    const stored = localStorage.getItem("orbisloop_user");
    if (!stored) { router.push("/auth/supermarket"); return; }
    const parsed = JSON.parse(stored);
    if (parsed.role !== "supermarket") { router.push("/"); return; }
    setUser(parsed);
  }, [router]);

  const fetchSubmissions = useCallback(async () => {
    if (!user) return;
    try {
      const res = await fetch(`/api/submissions?user_id=${user.id}`);
      setSubmissions(await res.json());
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchSubmissions();
      const interval = setInterval(fetchSubmissions, 10000);
      return () => clearInterval(interval);
    }
  }, [user, fetchSubmissions]);

  async function handleNewSubmission(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormLoading(true);
    setFormError("");
    setFormSuccess(false);

    const form = e.currentTarget;
    const data = {
      business_name: user!.organization,
      phone: (form.elements.namedItem("phone") as HTMLInputElement).value,
      location: (form.elements.namedItem("location") as HTMLInputElement).value,
      food_type: (form.elements.namedItem("food_type") as HTMLInputElement).value,
      quantity: (form.elements.namedItem("quantity") as HTMLInputElement).value,
      pickup_time: (form.elements.namedItem("pickup_time") as HTMLInputElement).value,
      user_id: user!.id,
    };

    try {
      const res = await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Something went wrong");
      }
      setFormSuccess(true);
      form.reset();
      fetchSubmissions();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to submit");
    } finally {
      setFormLoading(false);
    }
  }

  async function handleAccountUpdate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setAccountLoading(true);
    setAccountMsg("");

    const form = e.currentTarget;
    const data = {
      organization: (form.elements.namedItem("organization") as HTMLInputElement).value,
      email: (form.elements.namedItem("email") as HTMLInputElement).value,
      phone: (form.elements.namedItem("phone") as HTMLInputElement).value,
    };

    try {
      const res = await fetch(`/api/users/${user!.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Update failed");
      const updated = await res.json();
      setUser(updated);
      localStorage.setItem("orbisloop_user", JSON.stringify(updated));
      setAccountMsg("Account updated successfully");
    } catch {
      setAccountMsg("Failed to update account");
    } finally {
      setAccountLoading(false);
    }
  }

  function handleLogout() {
    localStorage.removeItem("orbisloop_user");
    router.push("/");
  }

  if (!user) return null;

  const pendingCount = submissions.filter(s => s.status === "pending").length;
  const matchedCount = submissions.filter(s => s.status === "matched").length;
  const completedCount = submissions.filter(s => s.status === "completed").length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image src="/image_3fe86ce7.png" alt="OrbisLoop" width={28} height={28} className="rounded" />
            <span className="font-bold text-emerald-950">OrbisLoop</span>
            <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-medium">Supermarket</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500">{user.organization}</span>
            <button onClick={handleLogout} className="text-sm text-gray-400 hover:text-red-500 transition-colors">
              Log Out
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <p className="text-sm text-gray-500 mb-1">Total Submissions</p>
            <p className="text-2xl font-bold text-gray-900">{submissions.length}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <p className="text-sm text-gray-500 mb-1">Pending</p>
            <p className="text-2xl font-bold text-amber-600">{pendingCount}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <p className="text-sm text-gray-500 mb-1">Matched</p>
            <p className="text-2xl font-bold text-blue-600">{matchedCount}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <p className="text-sm text-gray-500 mb-1">Completed</p>
            <p className="text-2xl font-bold text-emerald-600">{completedCount}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-gray-100 rounded-lg p-1 w-fit">
          {(["submissions", "new", "account"] as const).map(t => (
            <button
              key={t}
              onClick={() => { setTab(t); setFormSuccess(false); setFormError(""); }}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                tab === t ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {t === "submissions" ? "My Submissions" : t === "new" ? "New Submission" : "Account"}
            </button>
          ))}
        </div>

        {/* Submissions Tab */}
        {tab === "submissions" && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            {loading ? (
              <div className="p-12 text-center text-gray-400">Loading...</div>
            ) : submissions.length === 0 ? (
              <div className="p-12 text-center">
                <p className="text-gray-400 mb-4">No submissions yet</p>
                <button onClick={() => setTab("new")} className="text-emerald-600 font-medium hover:text-emerald-700">
                  Create your first submission &rarr;
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      <th className="px-5 py-3">Food Type</th>
                      <th className="px-5 py-3">Qty</th>
                      <th className="px-5 py-3">Location</th>
                      <th className="px-5 py-3">Pickup Time</th>
                      <th className="px-5 py-3">Status</th>
                      <th className="px-5 py-3">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {submissions.map(s => (
                      <tr key={s.id} className="hover:bg-gray-50/50">
                        <td className="px-5 py-3.5 font-medium text-gray-900">{s.food_type}</td>
                        <td className="px-5 py-3.5 text-gray-600">{s.quantity}</td>
                        <td className="px-5 py-3.5 text-gray-600 max-w-[200px] truncate">{s.location}</td>
                        <td className="px-5 py-3.5 text-gray-600">{new Date(s.pickup_time).toLocaleString()}</td>
                        <td className="px-5 py-3.5"><StatusBadge status={s.status} /></td>
                        <td className="px-5 py-3.5 text-gray-400 text-xs">{new Date(s.created_at).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* New Submission Tab */}
        {tab === "new" && (
          <div className="max-w-xl">
            {formSuccess && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-lg text-sm mb-4">
                Submission created successfully! An NGO partner will be matched shortly.
                <button onClick={() => { setFormSuccess(false); setTab("submissions"); }} className="ml-2 font-medium underline">
                  View submissions
                </button>
              </div>
            )}
            <form onSubmit={handleNewSubmission} className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm space-y-5">
              {formError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{formError}</div>
              )}
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1.5">Contact Phone</label>
                <input id="phone" name="phone" type="tel" required defaultValue={user.phone || ""}
                  placeholder="+234 800 000 0000"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors" />
              </div>
              <div>
                <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1.5">Pickup Location</label>
                <input id="location" name="location" type="text" required placeholder="e.g. 15 Marina Road, Lagos"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="food_type" className="block text-sm font-medium text-gray-700 mb-1.5">Food Type</label>
                  <input id="food_type" name="food_type" type="text" required placeholder="e.g. Bread, Produce"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors" />
                </div>
                <div>
                  <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 mb-1.5">Quantity (kg)</label>
                  <input id="quantity" name="quantity" type="text" required placeholder="e.g. 50"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors" />
                </div>
              </div>
              <div>
                <label htmlFor="pickup_time" className="block text-sm font-medium text-gray-700 mb-1.5">Preferred Pickup Time</label>
                <input id="pickup_time" name="pickup_time" type="datetime-local" required
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors" />
              </div>
              <button type="submit" disabled={formLoading}
                className="w-full py-3 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                {formLoading ? "Submitting..." : "Submit Pickup Request"}
              </button>
            </form>
          </div>
        )}

        {/* Account Tab */}
        {tab === "account" && (
          <div className="max-w-xl">
            <form onSubmit={handleAccountUpdate} className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm space-y-5">
              {accountMsg && (
                <div className={`px-4 py-3 rounded-lg text-sm border ${
                  accountMsg.includes("success") ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-red-50 border-red-200 text-red-700"
                }`}>{accountMsg}</div>
              )}
              <div>
                <label htmlFor="organization" className="block text-sm font-medium text-gray-700 mb-1.5">Business Name</label>
                <input id="organization" name="organization" type="text" required defaultValue={user.organization}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors" />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">Email Address</label>
                <input id="email" name="email" type="email" required defaultValue={user.email}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors" />
              </div>
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1.5">Phone Number</label>
                <input id="phone" name="phone" type="tel" defaultValue={user.phone || ""}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors" />
              </div>
              <div className="flex items-center gap-3">
                <button type="submit" disabled={accountLoading}
                  className="px-6 py-2.5 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700 transition-all disabled:opacity-50">
                  {accountLoading ? "Saving..." : "Save Changes"}
                </button>
                <span className="text-xs text-gray-400">Member since {new Date(user.created_at).toLocaleDateString()}</span>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
