"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Leaf, Info } from "lucide-react";
import { calculateEcgImpact } from "@/lib/ecg";

const CATEGORIES = [
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

const UNITS = ["kg", "tonnes", "litres", "units", "pallets", "containers"];

export default function NewListingPage() {
  const router = useRouter();
  const [orgs, setOrgs] = useState<{ id: string; name: string }[]>([]);
  const [form, setForm] = useState({
    orgId: "",
    type: "offer",
    title: "",
    description: "",
    category: "plastics",
    quantity: "",
    unit: "kg",
    pricePerUnit: "",
    currency: "USD",
    country: "",
    location: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [ecgPreview, setEcgPreview] = useState<ReturnType<typeof calculateEcgImpact> | null>(null);

  useEffect(() => {
    fetch("/api/orgs")
      .then((r) => r.json())
      .then((data) => {
        setOrgs(data);
        if (data.length > 0) setForm((f) => ({ ...f, orgId: data[0].id }));
      });
  }, []);

  useEffect(() => {
    const qty = parseFloat(form.quantity);
    if (!form.quantity || isNaN(qty) || qty <= 0) {
      setEcgPreview(null);
      return;
    }
    const kgs = form.unit === "tonnes" ? qty * 1000 : qty;
    setEcgPreview(calculateEcgImpact(form.category, kgs));
  }, [form.quantity, form.unit, form.category]);

  function set(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const payload = {
      orgId: form.orgId,
      type: form.type,
      title: form.title,
      description: form.description || undefined,
      category: form.category,
      quantity: parseFloat(form.quantity),
      unit: form.unit,
      pricePerUnit: form.pricePerUnit ? parseFloat(form.pricePerUnit) : undefined,
      currency: form.currency,
      country: form.country || undefined,
      location: form.location || undefined,
    };

    const res = await fetch("/api/listings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(JSON.stringify(data.error));
      setLoading(false);
      return;
    }

    const listing = await res.json();

    // Publish immediately
    await fetch(`/api/listings/${listing.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "active" }),
    });

    router.push("/listings");
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">New listing</h1>
        <p className="text-slate-500 text-sm mt-1">
          List surplus materials to offer or request from other businesses.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-200 p-8 space-y-6">
        {error && (
          <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded-lg">{error}</div>
        )}

        {/* Organisation */}
        {orgs.length > 1 && (
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Organisation
            </label>
            <select
              value={form.orgId}
              onChange={(e) => set("orgId", e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              {orgs.map((o) => (
                <option key={o.id} value={o.id}>{o.name}</option>
              ))}
            </select>
          </div>
        )}

        {/* Offer / Request */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Listing type
          </label>
          <div className="flex gap-3">
            {(["offer", "request"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => set("type", t)}
                className={`flex-1 py-2.5 rounded-lg border text-sm font-medium transition-colors ${
                  form.type === t
                    ? "bg-green-600 text-white border-green-600"
                    : "border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                {t === "offer" ? "I have something to offer" : "I'm looking for something"}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Title *
          </label>
          <input
            type="text"
            required
            value={form.title}
            onChange={(e) => set("title", e.target.value)}
            className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            placeholder="e.g. 5 tonnes of recycled HDPE pellets"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Category *
            </label>
            <select
              value={form.category}
              onChange={(e) => set("category", e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Quantity *
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                required
                min="0.01"
                step="0.01"
                value={form.quantity}
                onChange={(e) => set("quantity", e.target.value)}
                className="flex-1 border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="0"
              />
              <select
                value={form.unit}
                onChange={(e) => set("unit", e.target.value)}
                className="border border-slate-200 rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                {UNITS.map((u) => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* ECG preview */}
        {ecgPreview && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center gap-2 text-green-700 font-medium text-sm mb-2">
              <Leaf className="w-4 h-4" />
              Estimated ECG impact if exchanged
            </div>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div>
                <p className="text-lg font-bold text-green-800">
                  {ecgPreview.co2SavedKg >= 1000
                    ? `${(ecgPreview.co2SavedKg / 1000).toFixed(2)}t`
                    : `${ecgPreview.co2SavedKg.toFixed(0)}kg`}
                </p>
                <p className="text-xs text-green-600">CO₂ saved</p>
              </div>
              <div>
                <p className="text-lg font-bold text-green-800">
                  {ecgPreview.waterSavedL >= 1000
                    ? `${(ecgPreview.waterSavedL / 1000).toFixed(0)}kL`
                    : `${ecgPreview.waterSavedL.toFixed(0)}L`}
                </p>
                <p className="text-xs text-green-600">Water saved</p>
              </div>
              <div>
                <p className="text-lg font-bold text-green-800">
                  {ecgPreview.circularityScore}/100
                </p>
                <p className="text-xs text-green-600">Circularity score</p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Price per unit
            </label>
            <div className="flex gap-2">
              <select
                value={form.currency}
                onChange={(e) => set("currency", e.target.value)}
                className="border border-slate-200 rounded-lg px-2 py-2.5 text-sm bg-white focus:outline-none"
              >
                {["USD", "EUR", "GBP", "NGN", "KES", "ZAR"].map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.pricePerUnit}
                onChange={(e) => set("pricePerUnit", e.target.value)}
                className="flex-1 border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Leave blank = negotiable"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Country</label>
            <input
              type="text"
              value={form.country}
              onChange={(e) => set("country", e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="Nigeria"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Description</label>
          <textarea
            rows={3}
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
            className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
            placeholder="Material specs, condition, origin, logistics notes..."
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white font-semibold py-2.5 rounded-lg flex items-center justify-center gap-2 transition-colors"
        >
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          Publish listing
        </button>
      </form>
    </div>
  );
}
