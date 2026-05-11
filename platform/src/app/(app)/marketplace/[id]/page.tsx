"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Leaf, MessageSquare, ArrowLeft, Loader2 } from "lucide-react";

interface Listing {
  id: string;
  title: string;
  type: string;
  status: string;
  category: string;
  quantity: number;
  unit: string;
  pricePerUnit: number | null;
  currency: string | null;
  description: string | null;
  country: string | null;
  estimatedCo2SavedKg: number | null;
  circularityScore: number | null;
  inquiryCount: number;
  organizationId: string;
}

export default function ListingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [listing, setListing] = useState<Listing | null>(null);
  const [orgs, setOrgs] = useState<{ id: string; name: string }[]>([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [message, setMessage] = useState("");
  const [proposedQty, setProposedQty] = useState("");
  const [proposedPrice, setProposedPrice] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/listings/${id}`).then((r) => r.json()).then(setListing);
    fetch("/api/orgs").then((r) => {
      if (r.status === 401) { setIsAuthenticated(false); return null; }
      setIsAuthenticated(true);
      return r.json();
    }).then((data) => { if (data) setOrgs(data); });
  }, [id]);

  const myOrg = orgs[0];
  const isOwner = myOrg && listing?.organizationId === myOrg.id;

  async function sendInquiry(e: React.FormEvent) {
    e.preventDefault();
    if (!isAuthenticated) {
      router.push(`/login?callbackUrl=/marketplace/${id}`);
      return;
    }
    if (!myOrg || !listing) return;
    setError("");
    setSending(true);

    const res = await fetch("/api/inquiries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        listingId: listing.id,
        fromOrgId: myOrg.id,
        message,
        proposedQuantity: proposedQty ? parseFloat(proposedQty) : undefined,
        proposedPricePerUnit: proposedPrice ? parseFloat(proposedPrice) : undefined,
      }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error?.formErrors?.[0] ?? "Could not send inquiry.");
      setSending(false);
      return;
    }

    setSent(true);
    setSending(false);
    const data = await res.json();
    if (data.id) router.push(`/inquiries/${data.id}`);
  }

  if (!listing) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl space-y-6">
      <Link
        href="/marketplace"
        className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to marketplace
      </Link>

      <div className="bg-white rounded-xl border border-slate-200 p-8 space-y-6">
        <div className="flex items-start justify-between">
          <span
            className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
              listing.type === "offer"
                ? "bg-green-100 text-green-700"
                : "bg-blue-100 text-blue-700"
            }`}
          >
            {listing.type === "offer" ? "Offer" : "Request"}
          </span>
          {listing.circularityScore && (
            <span className="text-sm text-slate-500">
              ♻ Circularity score: <strong>{listing.circularityScore}/100</strong>
            </span>
          )}
        </div>

        <div>
          <h1 className="text-2xl font-bold text-slate-900">{listing.title}</h1>
          <p className="text-slate-500 mt-1">
            {listing.quantity} {listing.unit} · {listing.category.replace(/_/g, " ")}
            {listing.country && ` · ${listing.country}`}
          </p>
        </div>

        {listing.description && (
          <p className="text-slate-700 text-sm leading-relaxed">{listing.description}</p>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-slate-50 rounded-lg p-4">
            <p className="text-xs text-slate-500 mb-1">Price</p>
            <p className="font-semibold text-slate-900">
              {listing.pricePerUnit != null
                ? `${listing.currency ?? "USD"} ${listing.pricePerUnit} / ${listing.unit}`
                : "Open to negotiation"}
            </p>
          </div>
          {listing.estimatedCo2SavedKg && (
            <div className="bg-green-50 rounded-lg p-4">
              <p className="text-xs text-green-600 mb-1 flex items-center gap-1">
                <Leaf className="w-3 h-3" />
                Estimated CO₂ impact
              </p>
              <p className="font-semibold text-green-800">
                {listing.estimatedCo2SavedKg >= 1000
                  ? `${(listing.estimatedCo2SavedKg / 1000).toFixed(2)}t`
                  : `${listing.estimatedCo2SavedKg.toFixed(0)}kg`}{" "}
                CO₂e saved
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Owner action strip */}
      {isOwner && (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-center justify-between gap-4">
          <p className="text-sm text-slate-600">
            This is your listing.{" "}
            <span className="font-medium text-slate-800">
              {listing.inquiryCount} inquir{listing.inquiryCount === 1 ? "y" : "ies"}
            </span>{" "}
            received.
          </p>
          <div className="flex gap-2 shrink-0">
            <Link
              href={`/listings/${listing.id}/edit`}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 text-slate-600 hover:bg-white transition-colors"
            >
              Edit listing
            </Link>
            <Link
              href={`/inquiries?listingId=${listing.id}`}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-green-600 hover:bg-green-700 text-white transition-colors"
            >
              View inquiries
            </Link>
          </div>
        </div>
      )}

      {/* Inquiry form */}
      {!isOwner && (
        <div className="bg-white rounded-xl border border-slate-200 p-8">
          <h2 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-green-600" />
            Send an inquiry
          </h2>

          {!isAuthenticated ? (
            <div className="text-center py-6">
              <p className="text-slate-500 text-sm mb-4">Sign in to send an inquiry to this listing.</p>
              <Link
                href={`/login?callbackUrl=/marketplace/${id}`}
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg text-sm transition-colors"
              >
                Sign in to inquire
              </Link>
            </div>
          ) : sent ? (
            <div className="bg-green-50 text-green-700 rounded-lg px-4 py-4 text-sm">
              ✓ Inquiry sent! The listing owner will respond via the platform.
            </div>
          ) : (
            <form onSubmit={sendInquiry} className="space-y-4">
              {error && (
                <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded-lg">{error}</div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Message *
                </label>
                <textarea
                  required
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                  placeholder="Introduce your company and describe your interest..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Proposed quantity ({listing.unit})
                  </label>
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={proposedQty}
                    onChange={(e) => setProposedQty(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Optional"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Proposed price / {listing.unit}
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={proposedPrice}
                    onChange={(e) => setProposedPrice(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Optional"
                  />
                </div>
              </div>

              {!myOrg && (
                <p className="text-sm text-amber-600 bg-amber-50 px-4 py-3 rounded-lg">
                  You need to <Link href="/onboarding" className="underline font-medium">set up an organisation</Link> before you can send inquiries.
                </p>
              )}
              <button
                type="submit"
                disabled={sending || !myOrg}
                className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white font-semibold py-2.5 rounded-lg flex items-center justify-center gap-2 transition-colors"
              >
                {sending && <Loader2 className="w-4 h-4 animate-spin" />}
                Send inquiry
              </button>

            </form>
          )}
        </div>
      )}
    </div>
  );
}
