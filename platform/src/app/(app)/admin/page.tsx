"use client";

import { useEffect, useState } from "react";
import { useSession } from "@/lib/auth-client";
import Link from "next/link";
import {
  Building2, Package, MessageSquare, Leaf, DollarSign,
  Users, TrendingUp, ShieldAlert,
} from "lucide-react";

interface Summary {
  orgs: number;
  users: number;
  listings: number;
  activeListings: number;
  inquiries: number;
  completedDeals: number;
  totalVolumeCents: number;
  totalRevenueCents: number;
  totalCo2Kg: number;
  totalMaterialKg: number;
}

interface Org {
  id: string;
  name: string;
  slug: string;
  type: string;
  country: string;
  verified: boolean;
  subscriptionTier: string;
  subscriptionStatus: string;
  createdAt: string;
}

interface Transaction {
  id: string;
  status: string;
  amountCents: number;
  platformFeeCents: number;
  currency: string;
  createdAt: string;
}

const TIER_COLORS: Record<string, string> = {
  free: "bg-slate-100 text-slate-600",
  starter: "bg-blue-100 text-blue-700",
  growth: "bg-purple-100 text-purple-700",
  enterprise: "bg-amber-100 text-amber-700",
};

function fmt(cents: number, currency = "USD") {
  return new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 0 }).format(cents / 100);
}

export default function AdminPage() {
  const { data: session } = useSession();
  const [summary, setSummary] = useState<Summary | null>(null);
  const [orgs, setOrgs] = useState<Org[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [tab, setTab] = useState<"overview" | "orgs" | "transactions">("overview");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!session?.user) return;
    fetch("/api/admin/stats")
      .then((r) => {
        if (r.status === 403) { setError("Access denied."); return null; }
        return r.json();
      })
      .then((data) => {
        if (!data) return;
        setSummary(data.summary);
        setOrgs(data.orgs);
        setTransactions(data.recentTransactions);
      });
  }, [session]);

  if (error) {
    return (
      <div className="max-w-xl mx-auto py-24 text-center">
        <ShieldAlert className="w-12 h-12 text-red-400 mx-auto mb-4" />
        <h1 className="text-xl font-bold text-slate-800 mb-2">Access denied</h1>
        <p className="text-slate-500 text-sm">Your account is not authorised to view the admin panel.</p>
        <Link href="/dashboard" className="mt-4 inline-block text-green-600 hover:underline text-sm">← Back to dashboard</Link>
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-8 w-40 bg-slate-100 rounded" />
        <div className="grid grid-cols-4 gap-4">{[1,2,3,4].map(i=><div key={i} className="h-24 bg-slate-100 rounded-xl"/>)}</div>
        <div className="h-64 bg-slate-100 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Admin Panel</h1>
          <p className="text-slate-500 text-sm mt-0.5">Platform overview</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200">
        {(["overview", "orgs", "transactions"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-5 py-2.5 text-sm font-semibold capitalize border-b-2 transition-colors ${
              tab === t ? "border-green-600 text-green-700" : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Overview */}
      {tab === "overview" && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: "Organisations", value: summary.orgs, icon: Building2, color: "bg-blue-50 text-blue-600" },
              { label: "Users", value: summary.users, icon: Users, color: "bg-purple-50 text-purple-600" },
              { label: "Active Listings", value: `${summary.activeListings} / ${summary.listings}`, icon: Package, color: "bg-green-50 text-green-600" },
              { label: "Inquiries", value: summary.inquiries, icon: MessageSquare, color: "bg-amber-50 text-amber-600" },
            ].map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="bg-white rounded-xl border border-slate-200 p-5">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-3 ${color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <p className="text-2xl font-bold text-slate-900">{value}</p>
                <p className="text-xs text-slate-400 mt-1">{label}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: "Completed Deals", value: summary.completedDeals, icon: TrendingUp, color: "bg-emerald-50 text-emerald-600" },
              { label: "Total Deal Volume", value: fmt(summary.totalVolumeCents), icon: DollarSign, color: "bg-green-50 text-green-600" },
              { label: "Platform Revenue", value: fmt(summary.totalRevenueCents), icon: DollarSign, color: "bg-teal-50 text-teal-600" },
              { label: "CO₂ Saved", value: summary.totalCo2Kg >= 1000 ? `${(summary.totalCo2Kg/1000).toFixed(1)}t` : `${Math.round(summary.totalCo2Kg)}kg`, icon: Leaf, color: "bg-green-50 text-green-600" },
            ].map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="bg-white rounded-xl border border-slate-200 p-5">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-3 ${color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <p className="text-2xl font-bold text-slate-900">{value}</p>
                <p className="text-xs text-slate-400 mt-1">{label}</p>
              </div>
            ))}
          </div>

          {/* Tier breakdown */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h2 className="font-semibold text-slate-800 mb-4">Subscription tier breakdown</h2>
            <div className="grid grid-cols-4 gap-3">
              {(["free", "starter", "growth", "enterprise"] as const).map((tier) => {
                const count = orgs.filter((o) => o.subscriptionTier === tier).length;
                return (
                  <div key={tier} className={`rounded-lg p-4 text-center ${TIER_COLORS[tier]}`}>
                    <p className="text-2xl font-bold">{count}</p>
                    <p className="text-xs font-medium capitalize mt-1">{tier}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Orgs */}
      {tab === "orgs" && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
                <th className="px-5 py-3">Organisation</th>
                <th className="px-5 py-3">Type</th>
                <th className="px-5 py-3">Country</th>
                <th className="px-5 py-3">Tier</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {orgs.map((org) => (
                <tr key={org.id} className="hover:bg-slate-50">
                  <td className="px-5 py-3">
                    <p className="font-medium text-slate-900">{org.name}</p>
                    <p className="text-xs text-slate-400 font-mono">{org.slug}</p>
                  </td>
                  <td className="px-5 py-3 capitalize text-slate-600">{org.type.replace("_", " ")}</td>
                  <td className="px-5 py-3 text-slate-600">{org.country}</td>
                  <td className="px-5 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${TIER_COLORS[org.subscriptionTier]}`}>
                      {org.subscriptionTier}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${org.verified ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"}`}>
                      {org.verified ? "Verified" : "Unverified"}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-slate-400 text-xs">{new Date(org.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {orgs.length === 0 && (
            <p className="text-center text-slate-400 py-12">No organisations yet.</p>
          )}
        </div>
      )}

      {/* Transactions */}
      {tab === "transactions" && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
                <th className="px-5 py-3">ID</th>
                <th className="px-5 py-3">Amount</th>
                <th className="px-5 py-3">Platform fee</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {transactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-slate-50">
                  <td className="px-5 py-3 font-mono text-xs text-slate-400">{tx.id.slice(0, 8)}</td>
                  <td className="px-5 py-3 font-semibold text-slate-900">{fmt(tx.amountCents, tx.currency?.toUpperCase() ?? "USD")}</td>
                  <td className="px-5 py-3 text-slate-600">{fmt(tx.platformFeeCents, tx.currency?.toUpperCase() ?? "USD")}</td>
                  <td className="px-5 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                      tx.status === "succeeded" ? "bg-green-100 text-green-700" :
                      tx.status === "pending" ? "bg-yellow-100 text-yellow-700" :
                      "bg-red-100 text-red-700"
                    }`}>{tx.status}</span>
                  </td>
                  <td className="px-5 py-3 text-slate-400 text-xs">{new Date(tx.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {transactions.length === 0 && (
            <p className="text-center text-slate-400 py-12">No transactions yet.</p>
          )}
        </div>
      )}
    </div>
  );
}
