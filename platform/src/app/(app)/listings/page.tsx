"use client";

import { useEffect, useState } from "react";
import { useSession } from "@/lib/auth-client";
import Link from "next/link";
import { Plus, Eye, Edit2, Pause, Play, CheckCircle } from "lucide-react";
import StatusBadge from "@/components/StatusBadge";

interface Listing {
  id: string;
  title: string;
  type: "offer" | "request";
  category: string;
  quantity: number;
  unit: string;
  status: string;
  country: string | null;
  pricePerUnit: number | null;
  currency: string | null;
  inquiryCount: number;
  createdAt: string;
}

interface Org { id: string; name: string }

export default function ListingsPage() {
  const { data: session } = useSession();
  const [listings, setListings] = useState<Listing[]>([]);
  const [org, setOrg] = useState<Org | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session?.user) return;
    fetch("/api/orgs")
      .then((r) => r.json())
      .then((orgs: Org[]) => {
        if (!orgs.length) { setLoading(false); return; }
        const o = orgs[0];
        setOrg(o);
        return fetch(`/api/listings?orgId=${o.id}&limit=100`);
      })
      .then((r) => r?.json())
      .then((data) => {
        if (data) setListings(Array.isArray(data) ? data : data.listings ?? []);
      })
      .finally(() => setLoading(false));
  }, [session]);

  const filtered =
    statusFilter === "all"
      ? listings
      : listings.filter((l) => l.status === statusFilter);

  const handleStatus = async (id: string, status: string) => {
    await fetch(`/api/listings/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setListings((prev) =>
      prev.map((l) => (l.id === id ? { ...l, status } : l))
    );
  };

  return (
    <div className="px-4 py-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Listings</h1>
          {org && <p className="text-sm text-slate-500 mt-0.5">{org.name}</p>}
        </div>
        <Link
          href="/listings/new"
          className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" /> New Listing
        </Link>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-5 flex-wrap">
        {["all", "active", "draft", "paused", "completed", "expired"].map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold capitalize transition-colors ${
              statusFilter === s
                ? "bg-green-600 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {loading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-slate-100 rounded-xl animate-pulse" />
          ))}
        </div>
      )}

      {!loading && !org && (
        <div className="text-center py-20 text-slate-400">
          <p className="mb-3">You haven&apos;t set up an organisation yet.</p>
          <Link href="/onboarding" className="text-green-600 font-semibold hover:underline">
            Set up your organisation →
          </Link>
        </div>
      )}

      {!loading && org && filtered.length === 0 && (
        <div className="text-center py-20 text-slate-400">
          No {statusFilter !== "all" ? statusFilter : ""} listings yet.{" "}
          <Link href="/listings/new" className="text-green-600 font-semibold hover:underline">
            Create one →
          </Link>
        </div>
      )}

      {!loading && filtered.length > 0 && (
        <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white overflow-hidden">
          {filtered.map((l) => (
            <div key={l.id} className="flex items-center gap-4 px-5 py-4">
              {/* Type badge */}
              <span
                className={`shrink-0 px-2 py-0.5 rounded text-xs font-bold uppercase ${
                  l.type === "offer"
                    ? "bg-green-100 text-green-700"
                    : "bg-blue-100 text-blue-700"
                }`}
              >
                {l.type}
              </span>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-slate-900 truncate">{l.title}</p>
                <p className="text-xs text-slate-400">
                  {l.quantity} {l.unit} · {l.category.replace("_", " ")}
                  {l.country ? ` · ${l.country}` : ""}
                  {l.pricePerUnit != null
                    ? ` · ${l.pricePerUnit} ${l.currency}`
                    : " · Open price"}
                </p>
              </div>

              {/* Inquiry count */}
              <span className="text-xs text-slate-500 shrink-0">
                {l.inquiryCount} inquir{l.inquiryCount === 1 ? "y" : "ies"}
              </span>

              {/* Status */}
              <StatusBadge status={l.status} />

              {/* Actions */}
              <div className="flex gap-1 shrink-0">
                <Link
                  href={`/marketplace/${l.id}`}
                  title="View"
                  className="p-1.5 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-700"
                >
                  <Eye className="w-4 h-4" />
                </Link>
                {l.status !== "completed" && (
                  <Link
                    href={`/listings/${l.id}/edit`}
                    title="Edit"
                    className="p-1.5 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-700"
                  >
                    <Edit2 className="w-4 h-4" />
                  </Link>
                )}
                {l.status === "draft" || l.status === "paused" ? (
                  <button
                    title="Activate"
                    onClick={() => handleStatus(l.id, "active")}
                    className="p-1.5 rounded hover:bg-green-50 text-slate-400 hover:text-green-600"
                  >
                    <Play className="w-4 h-4" />
                  </button>
                ) : l.status === "active" ? (
                  <button
                    title="Pause"
                    onClick={() => handleStatus(l.id, "paused")}
                    className="p-1.5 rounded hover:bg-yellow-50 text-slate-400 hover:text-yellow-600"
                  >
                    <Pause className="w-4 h-4" />
                  </button>
                ) : null}
                {l.status === "active" && (
                  <button
                    title="Mark complete"
                    onClick={() => handleStatus(l.id, "completed")}
                    className="p-1.5 rounded hover:bg-emerald-50 text-slate-400 hover:text-emerald-600"
                  >
                    <CheckCircle className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
