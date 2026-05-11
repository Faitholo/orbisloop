"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Package,
  Plus,
  TrendingUp,
  MessageSquare,
  Leaf,
  ArrowRight,
} from "lucide-react";

interface Listing {
  id: string;
  title: string;
  status: string;
  category: string;
  quantity: number;
  unit: string;
  inquiryCount: number;
  createdAt: string;
}

interface EcgTotals {
  totalCo2Kg: string | null;
  totalMaterialKg: string | null;
  totalCarbonCredits: string | null;
}

const STATUS_COLOR: Record<string, string> = {
  active: "bg-green-100 text-green-700",
  draft: "bg-slate-100 text-slate-600",
  paused: "bg-amber-100 text-amber-700",
  completed: "bg-blue-100 text-blue-700",
  expired: "bg-red-100 text-red-700",
};

export default function DashboardPage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [ecg, setEcg] = useState<EcgTotals | null>(null);
  const [orgId, setOrgId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/orgs")
      .then((r) => r.json())
      .then((orgs) => {
        if (orgs.length === 0) return;
        const id = orgs[0].id;
        setOrgId(id);

        fetch(`/api/listings?orgId=${id}`)
          .then((r) => r.json())
          .then(setListings);

        fetch(`/api/ecg?orgId=${id}`)
          .then((r) => r.json())
          .then((data) => setEcg(data.totals ?? null));
      });
  }, []);

  const co2Saved = parseFloat(ecg?.totalCo2Kg ?? "0");
  const materialKg = parseFloat(ecg?.totalMaterialKg ?? "0");
  const credits = parseFloat(ecg?.totalCarbonCredits ?? "0");

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-slate-500 text-sm mt-1">Your circular economy activity at a glance</p>
        </div>
        <Link
          href="/listings/new"
          className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          New listing
        </Link>
      </div>

      {/* ECG Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 bg-green-100 rounded-lg flex items-center justify-center">
              <Leaf className="w-5 h-5 text-green-600" />
            </div>
            <span className="text-sm font-medium text-slate-600">CO₂ Saved</span>
          </div>
          <p className="text-2xl font-bold text-slate-900">
            {co2Saved >= 1000 ? `${(co2Saved / 1000).toFixed(2)}t` : `${co2Saved.toFixed(0)}kg`}
          </p>
          <p className="text-xs text-slate-400 mt-1">CO₂ equivalent diverted</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 bg-blue-100 rounded-lg flex items-center justify-center">
              <Package className="w-5 h-5 text-blue-600" />
            </div>
            <span className="text-sm font-medium text-slate-600">Material Diverted</span>
          </div>
          <p className="text-2xl font-bold text-slate-900">
            {materialKg >= 1000
              ? `${(materialKg / 1000).toFixed(1)}t`
              : `${materialKg.toFixed(0)}kg`}
          </p>
          <p className="text-xs text-slate-400 mt-1">Kept out of landfill</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 bg-amber-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-amber-600" />
            </div>
            <span className="text-sm font-medium text-slate-600">Carbon Credits</span>
          </div>
          <p className="text-2xl font-bold text-slate-900">{credits.toFixed(3)}</p>
          <p className="text-xs text-slate-400 mt-1">tCO₂e equivalent</p>
        </div>
      </div>

      {/* Recent listings */}
      <div className="bg-white rounded-xl border border-slate-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-900">Your listings</h2>
          <Link
            href="/listings"
            className="text-sm text-green-600 hover:underline flex items-center gap-1"
          >
            View all <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {listings.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400">
            <Package className="w-10 h-10 mb-3" />
            <p className="text-sm">No listings yet.</p>
            <Link
              href="/listings/new"
              className="mt-3 text-sm text-green-600 hover:underline"
            >
              Create your first listing →
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {listings.slice(0, 5).map((l) => (
              <Link
                key={l.id}
                href={`/marketplace/${l.id}`}
                className="flex items-center px-6 py-4 hover:bg-slate-50 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-900 truncate">{l.title}</p>
                  <p className="text-sm text-slate-500">
                    {l.quantity} {l.unit} · {l.category.replace(/_/g, " ")}
                  </p>
                </div>
                <div className="flex items-center gap-3 ml-4">
                  <span className="flex items-center gap-1 text-xs text-slate-400">
                    <MessageSquare className="w-3.5 h-3.5" />
                    {l.inquiryCount}
                  </span>
                  <span
                    className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                      STATUS_COLOR[l.status] ?? "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {l.status}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        <Link
          href="/ecg"
          className="inline-flex items-center gap-2 px-4 py-2.5 border border-green-200 bg-green-50 text-green-700 rounded-lg text-sm font-medium hover:bg-green-100 transition-colors"
        >
          <Leaf className="w-4 h-4" />
          Full ECG report
        </Link>
        <Link
          href="/marketplace"
          className="inline-flex items-center gap-2 px-4 py-2.5 border border-slate-200 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors"
        >
          Browse marketplace →
        </Link>
      </div>
    </div>
  );
}
