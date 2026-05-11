"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Search, Filter, Package, Leaf, ArrowRight } from "lucide-react";

const CATEGORIES = [
  { value: "", label: "All categories" },
  { value: "metals", label: "Metals" },
  { value: "plastics", label: "Plastics" },
  { value: "paper_cardboard", label: "Paper & Cardboard" },
  { value: "textiles", label: "Textiles" },
  { value: "electronics", label: "Electronics" },
  { value: "chemicals", label: "Chemicals" },
  { value: "food_organics", label: "Food & Organics" },
  { value: "glass", label: "Glass" },
  { value: "wood", label: "Wood" },
  { value: "rubber", label: "Rubber" },
  { value: "construction", label: "Construction" },
  { value: "machinery_equipment", label: "Machinery & Equipment" },
  { value: "packaging", label: "Packaging" },
  { value: "other", label: "Other" },
];

interface Listing {
  id: string;
  title: string;
  type: string;
  category: string;
  quantity: number;
  unit: string;
  pricePerUnit: number | null;
  currency: string | null;
  country: string | null;
  estimatedCo2SavedKg: number | null;
  circularityScore: number | null;
  createdAt: string;
}

export default function MarketplacePage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("");
  const [type, setType] = useState("");
  const [country, setCountry] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (category) params.set("category", category);
    if (type) params.set("type", type);
    if (country) params.set("country", country);

    fetch(`/api/listings?${params}`)
      .then((r) => r.json())
      .then((data) => {
        setListings(Array.isArray(data) ? data : []);
        setLoading(false);
      });
  }, [q, category, type, country]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Marketplace</h1>
        <p className="text-slate-500 text-sm mt-1">
          Discover surplus materials and resources available for circular reuse
        </p>
      </div>

      {/* Search + filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="search"
            placeholder="Search listings..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
          />
        </div>

        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="border border-slate-200 rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-green-500"
        >
          {CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>

        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="border border-slate-200 rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-green-500"
        >
          <option value="">Offers &amp; Requests</option>
          <option value="offer">Offers only</option>
          <option value="request">Requests only</option>
        </select>

        <input
          type="text"
          placeholder="Country"
          value={country}
          onChange={(e) => setCountry(e.target.value)}
          className="border border-slate-200 rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-green-500 w-36"
        />
      </div>

      {/* Results */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-slate-200 p-5 animate-pulse">
              <div className="h-4 bg-slate-100 rounded w-3/4 mb-3" />
              <div className="h-3 bg-slate-100 rounded w-1/2 mb-2" />
              <div className="h-3 bg-slate-100 rounded w-2/3" />
            </div>
          ))}
        </div>
      ) : listings.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400">
          <Package className="w-10 h-10 mb-3" />
          <p className="text-sm">No listings match your search.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {listings.map((l) => (
            <Link
              key={l.id}
              href={`/marketplace/${l.id}`}
              className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md hover:border-green-200 transition-all group"
            >
              <div className="flex items-start justify-between mb-3">
                <span
                  className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                    l.type === "offer"
                      ? "bg-green-100 text-green-700"
                      : "bg-blue-100 text-blue-700"
                  }`}
                >
                  {l.type === "offer" ? "Offer" : "Request"}
                </span>
                {l.circularityScore && (
                  <span className="text-xs text-slate-400">
                    ♻ {l.circularityScore}/100
                  </span>
                )}
              </div>

              <h3 className="font-semibold text-slate-900 group-hover:text-green-700 transition-colors line-clamp-2 mb-1">
                {l.title}
              </h3>
              <p className="text-sm text-slate-500 mb-3">
                {l.quantity} {l.unit} · {l.category.replace(/_/g, " ")}
              </p>

              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-slate-900">
                  {l.pricePerUnit != null
                    ? `${l.currency ?? "USD"} ${l.pricePerUnit}/${l.unit}`
                    : "Price negotiable"}
                </p>
                {l.estimatedCo2SavedKg && (
                  <span className="flex items-center gap-1 text-xs text-green-600">
                    <Leaf className="w-3 h-3" />
                    {l.estimatedCo2SavedKg >= 1000
                      ? `${(l.estimatedCo2SavedKg / 1000).toFixed(1)}t`
                      : `${l.estimatedCo2SavedKg.toFixed(0)}kg`}{" "}
                    CO₂
                  </span>
                )}
              </div>

              {l.country && (
                <p className="text-xs text-slate-400 mt-2">{l.country}</p>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
