"use client";

import { useEffect, useState, useCallback } from "react";
import StatusBadge from "@/components/StatusBadge";

interface Ngo {
  id: string;
  name: string;
  phone: string;
  location: string;
  latitude: number | null;
  longitude: number | null;
  capacity: string;
  total_assigned: number;
  total_completed: number;
  total_rejected: number;
}

interface Submission {
  id: string;
  business_name: string;
  phone: string;
  location: string;
  latitude: number | null;
  longitude: number | null;
  food_type: string;
  quantity: string;
  pickup_time: string;
  status: string;
  assigned_ngo_id: string | null;
  created_at: string;
}

interface RankedNgo extends Ngo {
  distance_km: number | null;
  reliability_score: number;
}

const ADMIN_PASSWORD = "orbisloop2024";

export default function AdminPage() {
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [tab, setTab] = useState<"submissions" | "ngos">("submissions");
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [ngos, setNgos] = useState<Ngo[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const [subsRes, ngosRes] = await Promise.all([
        fetch("/api/submissions"),
        fetch("/api/ngos"),
      ]);
      setSubmissions(await subsRes.json());
      setNgos(await ngosRes.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authenticated) {
      fetchData();
      const interval = setInterval(fetchData, 10000);
      return () => clearInterval(interval);
    }
  }, [authenticated, fetchData]);

  function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      setAuthenticated(true);
      setAuthError("");
    } else {
      setAuthError("Incorrect password");
    }
  }

  async function updateSubmission(id: string, data: Record<string, string | null>) {
    await fetch(`/api/submissions/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    fetchData();
  }

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-gray-50 pt-[72px] flex items-center justify-center">
        <div className="w-full max-w-sm px-6">
          <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm">
            <h2 className="text-xl font-bold text-gray-900 mb-1">Admin Login</h2>
            <p className="text-sm text-gray-500 mb-6">Enter the admin password to continue</p>
            <form onSubmit={handleLogin} className="space-y-4">
              {authError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2.5 rounded-lg text-sm">
                  {authError}
                </div>
              )}
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors"
              />
              <button
                type="submit"
                className="w-full py-2.5 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700 transition-colors"
              >
                Log In
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  const totalKg = submissions
    .filter((s) => s.status === "completed")
    .reduce((sum, s) => {
      const num = parseFloat(s.quantity);
      return sum + (isNaN(num) ? 0 : num);
    }, 0);

  const pendingCount = submissions.filter((s) => s.status === "pending").length;
  const matchedCount = submissions.filter((s) => s.status === "matched").length;
  const completedCount = submissions.filter((s) => s.status === "completed").length;

  const ngoMap = new Map(ngos.map((n) => [n.id, n]));

  return (
    <div className="min-h-screen bg-gray-50 pt-[72px]">
      <div className="max-w-7xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <span className="inline-block text-xs font-semibold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full mb-3">
              Dashboard
            </span>
            <h1 className="text-3xl font-bold text-gray-900">Admin Panel</h1>
          </div>
          <button
            onClick={() => setAuthenticated(false)}
            className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            Log out
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <p className="text-sm text-gray-500 mb-1">Total Requests</p>
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
            <p className="text-sm text-gray-500 mb-1">NGO Partners</p>
            <p className="text-2xl font-bold text-violet-600">{ngos.length}</p>
          </div>
          <div className="bg-emerald-600 rounded-xl p-5 text-white">
            <p className="text-sm text-emerald-100 mb-1">Food Recovered</p>
            <p className="text-2xl font-bold">{totalKg.toLocaleString()} kg</p>
            <p className="text-xs text-emerald-200 mt-1">{completedCount} completed</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-gray-100 rounded-lg p-1 w-fit">
          <button
            onClick={() => setTab("submissions")}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              tab === "submissions" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            For Supermarkets
          </button>
          <button
            onClick={() => setTab("ngos")}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              tab === "ngos" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            For NGOs
          </button>
        </div>

        {loading ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center text-gray-400">
            Loading...
          </div>
        ) : tab === "submissions" ? (
          <SubmissionsTable
            submissions={submissions}
            ngoMap={ngoMap}
            ngos={ngos}
            onUpdate={updateSubmission}
          />
        ) : (
          <NgosPanel ngos={ngos} onRefresh={fetchData} />
        )}
      </div>
    </div>
  );
}

// ─── Submissions Table ───

function SubmissionsTable({
  submissions,
  ngoMap,
  ngos,
  onUpdate,
}: {
  submissions: Submission[];
  ngoMap: Map<string, Ngo>;
  ngos: Ngo[];
  onUpdate: (id: string, data: Record<string, string | null>) => void;
}) {
  if (submissions.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center text-gray-400">
        No submissions yet
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/50">
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Business</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Food</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Qty</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Location</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Pickup</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Status</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Assigned NGO</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody>
            {submissions.map((s) => (
              <SubmissionRow
                key={s.id}
                submission={s}
                ngoMap={ngoMap}
                ngos={ngos}
                onUpdate={onUpdate}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SubmissionRow({
  submission: s,
  ngoMap,
  ngos,
  onUpdate,
}: {
  submission: Submission;
  ngoMap: Map<string, Ngo>;
  ngos: Ngo[];
  onUpdate: (id: string, data: Record<string, string | null>) => void;
}) {
  const [showMatches, setShowMatches] = useState(false);
  const [matches, setMatches] = useState<RankedNgo[]>([]);
  const [loadingMatches, setLoadingMatches] = useState(false);

  const assignedNgo = s.assigned_ngo_id ? ngoMap.get(s.assigned_ngo_id) : null;
  const reliability = assignedNgo
    ? assignedNgo.total_assigned > 0
      ? assignedNgo.total_completed / assignedNgo.total_assigned
      : 1.0
    : null;

  const pickupDate = new Date(s.pickup_time);
  const formattedPickup = pickupDate.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

  async function fetchMatches() {
    if (showMatches) {
      setShowMatches(false);
      return;
    }
    setLoadingMatches(true);
    try {
      const res = await fetch(`/api/submissions/${s.id}/matches`);
      setMatches(await res.json());
      setShowMatches(true);
    } finally {
      setLoadingMatches(false);
    }
  }

  return (
    <>
      <tr className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
        <td className="px-4 py-3.5">
          <div className="font-medium text-gray-900">{s.business_name}</div>
          <div className="text-xs text-gray-400">{s.phone}</div>
        </td>
        <td className="px-4 py-3.5 text-gray-700">{s.food_type}</td>
        <td className="px-4 py-3.5 text-gray-700">{s.quantity}</td>
        <td className="px-4 py-3.5 text-gray-700 max-w-[140px] truncate">{s.location}</td>
        <td className="px-4 py-3.5 text-gray-500 text-xs whitespace-nowrap">{formattedPickup}</td>
        <td className="px-4 py-3.5">
          <StatusBadge status={s.status} />
        </td>
        <td className="px-4 py-3.5">
          {assignedNgo ? (
            <div>
              <div className="font-medium text-gray-900 text-xs">{assignedNgo.name}</div>
              {reliability !== null && (
                <div className="flex items-center gap-1 mt-0.5">
                  <ReliabilityBar score={reliability} />
                  <span className="text-[10px] text-gray-400">{(reliability * 100).toFixed(0)}%</span>
                </div>
              )}
            </div>
          ) : (
            <select
              value=""
              onChange={(e) => {
                if (e.target.value) {
                  onUpdate(s.id, { assigned_ngo_id: e.target.value, status: "matched" });
                }
              }}
              className="w-full min-w-[120px] px-2 py-1.5 text-xs border border-gray-200 rounded-md text-gray-700 bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500/30 focus:border-emerald-400 transition-colors"
            >
              <option value="">Assign NGO...</option>
              {ngos.map((n) => (
                <option key={n.id} value={n.id}>{n.name}</option>
              ))}
            </select>
          )}
        </td>
        <td className="px-4 py-3.5">
          <div className="flex items-center gap-1.5">
            <select
              value={s.status}
              onChange={(e) => onUpdate(s.id, { status: e.target.value })}
              className="px-2 py-1.5 text-xs border border-gray-200 rounded-md text-gray-700 bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500/30 focus:border-emerald-400 transition-colors"
            >
              <option value="pending">Pending</option>
              <option value="matched">Matched</option>
              <option value="completed">Completed</option>
              <option value="rejected">Rejected</option>
            </select>
            <button
              onClick={fetchMatches}
              disabled={loadingMatches}
              className="px-2 py-1.5 text-xs border border-emerald-200 text-emerald-700 rounded-md hover:bg-emerald-50 transition-colors whitespace-nowrap"
              title="View ranked NGO matches"
            >
              {loadingMatches ? "..." : showMatches ? "Hide" : "Matches"}
            </button>
          </div>
        </td>
      </tr>
      {showMatches && (
        <tr>
          <td colSpan={8} className="px-4 py-3 bg-emerald-50/40">
            <div className="text-xs font-semibold text-gray-600 mb-2">Ranked NGO Matches</div>
            {matches.length === 0 ? (
              <p className="text-xs text-gray-400">No NGOs available</p>
            ) : (
              <div className="grid gap-2">
                {matches.map((m, i) => (
                  <div
                    key={m.id}
                    className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs ${
                      i === 0 ? "bg-emerald-100/60 border border-emerald-200" : "bg-white border border-gray-100"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {i === 0 && (
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-200 px-1.5 py-0.5 rounded">
                          BEST
                        </span>
                      )}
                      <span className="font-medium text-gray-900">{m.name}</span>
                      <span className="text-gray-400">({m.capacity})</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-gray-500">
                        {m.distance_km !== null ? `${m.distance_km.toFixed(1)} km` : "— km"}
                      </span>
                      <div className="flex items-center gap-1">
                        <ReliabilityBar score={m.reliability_score} />
                        <span className="text-gray-500">{(m.reliability_score * 100).toFixed(0)}%</span>
                      </div>
                      {s.assigned_ngo_id !== m.id && (
                        <button
                          onClick={() => onUpdate(s.id, { assigned_ngo_id: m.id, status: "matched" })}
                          className="px-2 py-1 bg-emerald-600 text-white rounded hover:bg-emerald-700 transition-colors"
                        >
                          Assign
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </td>
        </tr>
      )}
    </>
  );
}

function ReliabilityBar({ score }: { score: number }) {
  const pct = Math.round(score * 100);
  const color = pct >= 80 ? "bg-emerald-500" : pct >= 50 ? "bg-amber-500" : "bg-red-500";
  return (
    <div className="w-12 h-1.5 bg-gray-200 rounded-full overflow-hidden">
      <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

// ─── NGOs Panel ───

function NgosPanel({ ngos, onRefresh }: { ngos: Ngo[]; onRefresh: () => void }) {
  const [showForm, setShowForm] = useState(false);
  const [formLoading, setFormLoading] = useState(false);

  async function handleAddNgo(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormLoading(true);
    const form = e.currentTarget;
    const data = {
      name: (form.elements.namedItem("name") as HTMLInputElement).value,
      phone: (form.elements.namedItem("phone") as HTMLInputElement).value,
      location: (form.elements.namedItem("location") as HTMLInputElement).value,
      capacity: (form.elements.namedItem("capacity") as HTMLSelectElement).value,
    };

    await fetch("/api/ngos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    form.reset();
    setShowForm(false);
    setFormLoading(false);
    onRefresh();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-gray-900">NGO Partners</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 text-sm font-medium bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
        >
          {showForm ? "Cancel" : "+ Add NGO"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleAddNgo} className="bg-white rounded-xl border border-gray-200 p-6 mb-6 shadow-sm">
          <div className="grid md:grid-cols-4 gap-4">
            <input
              name="name"
              required
              placeholder="NGO Name"
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
            <input
              name="phone"
              required
              placeholder="WhatsApp Phone (e.g. +234...)"
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
            <input
              name="location"
              required
              placeholder="Address / Location"
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
            <div className="flex gap-2">
              <select
                name="capacity"
                defaultValue="medium"
                className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
              <button
                type="submit"
                disabled={formLoading}
                className="px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50"
              >
                {formLoading ? "..." : "Add"}
              </button>
            </div>
          </div>
        </form>
      )}

      {ngos.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center text-gray-400">
          No NGO partners yet. Add one to enable auto-matching.
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Name</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Phone</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Location</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Capacity</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Reliability</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Stats</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Coords</th>
                </tr>
              </thead>
              <tbody>
                {ngos.map((n) => {
                  const score = n.total_assigned > 0 ? n.total_completed / n.total_assigned : 1.0;
                  return (
                    <tr key={n.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                      <td className="px-4 py-3.5 font-medium text-gray-900">{n.name}</td>
                      <td className="px-4 py-3.5 text-gray-600">{n.phone}</td>
                      <td className="px-4 py-3.5 text-gray-600 max-w-[180px] truncate">{n.location}</td>
                      <td className="px-4 py-3.5">
                        <span className={`inline-block px-2 py-0.5 text-xs font-medium rounded-full capitalize ${
                          n.capacity === "high" ? "bg-emerald-50 text-emerald-700" :
                          n.capacity === "medium" ? "bg-blue-50 text-blue-700" : "bg-gray-100 text-gray-600"
                        }`}>{n.capacity}</span>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1.5">
                          <ReliabilityBar score={score} />
                          <span className="text-xs text-gray-500">{(score * 100).toFixed(0)}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-xs text-gray-500">
                        {n.total_completed}/{n.total_assigned} done · {n.total_rejected} rejected
                      </td>
                      <td className="px-4 py-3.5 text-xs text-gray-400">
                        {n.latitude && n.longitude
                          ? `${n.latitude.toFixed(3)}, ${n.longitude.toFixed(3)}`
                          : "Not geocoded"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
