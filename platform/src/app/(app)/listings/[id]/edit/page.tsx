"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { Loader2, Leaf, ArrowLeft } from "lucide-react";
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

interface ListingForm {
  type: string;
  title: string;
  description: string;
  category: string;
  quantity: string;
  unit: string;
  pricePerUnit: string;
  currency: string;
  country: string;
  location: string;
}

export default function EditListingPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [form, setForm] = useState<ListingForm>({
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
  const [loadingData, setLoadingData] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [ecgPreview, setEcgPreview] = useState<ReturnType<typeof calculateEcgImpact> | null>(null);

  // Load existing listing
  useEffect(() => {
    fetch(`/api/listings/${id}`)
      .then((r) => {
        if (!r.ok) { setNotFound(true); return null; }
        return r.json();
      })
      .then((data) => {
        if (!data) return;
        setForm({
          type: data.type ?? "offer",
          title: data.title ?? "",
          description: data.description ?? "",
          category: data.category ?? "plastics",
          quantity: data.quantity != null ? String(data.quantity) : "",
          unit: data.unit ?? "kg",
          pricePerUnit: data.pricePerUnit != null ? String(data.pricePerUnit) : "",
          currency: data.currency ?? "USD",
          country: data.country ?? "",
          location: data.location ?? "",
        });
      })
      .finally(() => setLoadingData(false));
  }, [id]);

  // ECG preview
  useEffect(() => {
    const qty = parseFloat(form.quantity);
    if (!form.quantity || isNaN(qty) || qty <= 0) {
      setEcgPreview(null);
      return;
    }
    const kgs = form.unit === "tonnes" ? qty * 1000 : qty;
    setEcgPreview(calculateEcgImpact(form.category, kgs));
  }, [form.quantity, form.unit, form.category]);

  function set(field: keyof ListingForm, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);

    const payload = {
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

    const res = await fetch(`/api/listings/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(typeof data.error === "string" ? data.error : JSON.stringify(data.error));
      setSaving(false);
      return;
    }

    router.push("/listings");
  }

  if (loadingData) {
    return (
      <div className="max-w-2xl space-y-4">
        <div className="h-8 w-40 bg-slate-100 rounded animate-pulse" />
        <div className="h-96 bg-slate-100 rounded-xl animate-pulse" />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="max-w-2xl text-center py-20">
        <p className="text-slate-500 mb-3">Listing not found.</p>
        <Link href="/listings" className="text-green-600 font-semibold hover:underline">
          Back to listings
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <Link
          href="/listings"
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 mb-3"
        >
          <ArrowLeft className="w-4 h-4" /> Back to listings
        </Link>
        <h1 className="text-2xl font-bold text-slate-900">Edit listing</h1>
        <p className="text-slate-500 text-sm mt-1">Update the details of your listing.</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-200 p-8 space-y-6">
        {error && (
          <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded-lg">{error}</div>
        )}

        {/* Offer / Request */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Listing type</label>
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
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Title *</label>
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
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Category *</label>
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
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Quantity *</label>
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
                <p className="text-lg font-bold text-green-800">{ecgPreview.circularityScore}/100</p>
                <p className="text-xs text-green-600">Circularity score</p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Price per unit</label>
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

        <div className="flex gap-3">
          <Link
            href="/listings"
            className="flex-1 text-center py-2.5 rounded-lg border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white font-semibold py-2.5 rounded-lg flex items-center justify-center gap-2 transition-colors"
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            Save changes
          </button>
        </div>
      </form>
    </div>
  );
}
