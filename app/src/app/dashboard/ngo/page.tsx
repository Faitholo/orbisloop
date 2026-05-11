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
  created_at: string;
}

interface NgoData {
  id: string;
  name: string;
  total_assigned: number;
  total_completed: number;
  total_rejected: number;
}

interface UserData {
  id: string;
  email: string;
  role: string;
  phone: string | null;
  organization: string;
  created_at: string;
}

export default function NgoDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<UserData | null>(null);
  const [ngo, setNgo] = useState<NgoData | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [tab, setTab] = useState<"assigned" | "account">("assigned");
  const [loading, setLoading] = useState(true);
  const [accountLoading, setAccountLoading] = useState(false);
  const [accountMsg, setAccountMsg] = useState("");

  useEffect(() => {
    const stored = localStorage.getItem("orbisloop_user");
    if (!stored) { router.push("/auth/ngo"); return; }
    const parsed = JSON.parse(stored);
    if (parsed.role !== "ngo") { router.push("/"); return; }
    setUser(parsed);
  }, [router]);

  const fetchData = useCallback(async () => {
    if (!user) return;
    try {
      // Find the NGO record matching this user's phone
      const ngosRes = await fetch("/api/ngos");
      const allNgos = await ngosRes.json();
      const matchedNgo = allNgos.find((n: NgoData & { phone: string }) => n.phone === user.phone);

      if (matchedNgo) {
        setNgo(matchedNgo);
        const subsRes = await fetch(`/api/submissions?ngo_id=${matchedNgo.id}`);
        setSubmissions(await subsRes.json());
      }
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchData();
      const interval = setInterval(fetchData, 10000);
      return () => clearInterval(interval);
    }
  }, [user, fetchData]);

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

  const activeCount = submissions.filter(s => s.status === "matched").length;
  const completedCount = submissions.filter(s => s.status === "completed").length;
  const reliabilityScore = ngo && ngo.total_assigned > 0
    ? Math.round((ngo.total_completed / ngo.total_assigned) * 100)
    : 100;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image src="/image_3fe86ce7.png" alt="OrbisLoop" width={28} height={28} className="rounded" />
            <span className="font-bold text-emerald-950">OrbisLoop</span>
            <span className="text-xs bg-sky-100 text-sky-700 px-2 py-0.5 rounded-full font-medium">NGO Partner</span>
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
            <p className="text-sm text-gray-500 mb-1">Total Assigned</p>
            <p className="text-2xl font-bold text-gray-900">{ngo?.total_assigned || 0}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <p className="text-sm text-gray-500 mb-1">Active Pickups</p>
            <p className="text-2xl font-bold text-blue-600">{activeCount}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <p className="text-sm text-gray-500 mb-1">Completed</p>
            <p className="text-2xl font-bold text-emerald-600">{completedCount}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <p className="text-sm text-gray-500 mb-1">Reliability Score</p>
            <p className="text-2xl font-bold text-violet-600">{reliabilityScore}%</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-gray-100 rounded-lg p-1 w-fit">
          <button
            onClick={() => setTab("assigned")}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              tab === "assigned" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Assigned to Me
          </button>
          <button
            onClick={() => setTab("account")}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              tab === "account" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Account
          </button>
        </div>

        {/* Assigned Tab */}
        {tab === "assigned" && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            {loading ? (
              <div className="p-12 text-center text-gray-400">Loading...</div>
            ) : !ngo ? (
              <div className="p-12 text-center">
                <p className="text-gray-400">Your NGO profile is not yet linked. Please contact an admin or ensure your phone number matches your NGO record.</p>
              </div>
            ) : submissions.length === 0 ? (
              <div className="p-12 text-center">
                <p className="text-gray-400">No pickups assigned to you yet. You&apos;ll be notified when a match is made.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      <th className="px-5 py-3">Business</th>
                      <th className="px-5 py-3">Food Type</th>
                      <th className="px-5 py-3">Qty</th>
                      <th className="px-5 py-3">Location</th>
                      <th className="px-5 py-3">Pickup Time</th>
                      <th className="px-5 py-3">Status</th>
                      <th className="px-5 py-3">Contact</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {submissions.map(s => (
                      <tr key={s.id} className="hover:bg-gray-50/50">
                        <td className="px-5 py-3.5 font-medium text-gray-900">{s.business_name}</td>
                        <td className="px-5 py-3.5 text-gray-600">{s.food_type}</td>
                        <td className="px-5 py-3.5 text-gray-600">{s.quantity}</td>
                        <td className="px-5 py-3.5 text-gray-600 max-w-[200px] truncate">{s.location}</td>
                        <td className="px-5 py-3.5 text-gray-600">{new Date(s.pickup_time).toLocaleString()}</td>
                        <td className="px-5 py-3.5"><StatusBadge status={s.status} /></td>
                        <td className="px-5 py-3.5 text-gray-500 text-xs">{s.phone}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
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
                <label htmlFor="organization" className="block text-sm font-medium text-gray-700 mb-1.5">Organization Name</label>
                <input id="organization" name="organization" type="text" required defaultValue={user.organization}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-colors" />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">Email Address</label>
                <input id="email" name="email" type="email" required defaultValue={user.email}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-colors" />
              </div>
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1.5">Phone Number</label>
                <input id="phone" name="phone" type="tel" defaultValue={user.phone || ""}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-colors" />
              </div>
              <div className="flex items-center gap-3">
                <button type="submit" disabled={accountLoading}
                  className="px-6 py-2.5 bg-sky-600 text-white font-semibold rounded-lg hover:bg-sky-700 transition-all disabled:opacity-50">
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
