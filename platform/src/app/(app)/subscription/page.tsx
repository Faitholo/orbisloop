"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { Check, Zap, TrendingUp, Building2, Package, MessageSquare, BarChart2, FileText } from "lucide-react";
import { TIERS, TierKey } from "@/lib/stripe";

interface Usage {
  activeListings: number;
  totalListings: number;
  totalInquiries: number;
}

interface OrgBilling {
  subscriptionTier: string;
  subscriptionStatus: string;
  subscriptionPeriodEnd: string | null;
  stripeCustomerId: string | null;
  usage: Usage;
}

const TIER_ICONS: Record<string, React.ReactNode> = {
  free: <Zap size={22} className="text-slate-400" />,
  starter: <Zap size={22} className="text-emerald-500" />,
  growth: <TrendingUp size={22} className="text-emerald-600" />,
  enterprise: <Building2 size={22} className="text-emerald-700" />,
};

const TIER_ORDER: TierKey[] = ["free", "starter", "growth", "enterprise"];

function UsageBar({ used, limit }: { used: number; limit: number | typeof Infinity }) {
  if (limit === Infinity) return null;
  const pct = Math.min(100, Math.round((used / (limit || 1)) * 100));
  const color = pct >= 90 ? "bg-red-400" : pct >= 70 ? "bg-amber-400" : "bg-emerald-400";
  return (
    <div className="mt-1 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
      <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

function SubscriptionContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [billing, setBilling] = useState<OrgBilling | null>(null);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState<TierKey | null>(null);
  const [openPortal, setOpenPortal] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const sessionId = searchParams.get("session_id");
  const cancelled = searchParams.get("cancelled");
  const success = searchParams.get("success");

  const loadBilling = () =>
    fetch("/api/orgs/billing")
      .then((r) => r.json())
      .then((data) => { setBilling(data); setLoading(false); })
      .catch(() => setLoading(false));

  useEffect(() => {
    if (sessionId) {
      setSyncing(true);
      fetch(`/api/billing/sync?session_id=${sessionId}`)
        .then(() => loadBilling())
        .finally(() => {
          setSyncing(false);
          router.replace("/subscription?success=true");
        });
    } else {
      loadBilling();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  async function handleUpgrade(tier: TierKey) {
    setUpgrading(tier);
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier }),
      });
      const data = await res.json();
      if (data.url) router.push(data.url);
    } finally {
      setUpgrading(null);
    }
  }

  async function handlePortal() {
    setOpenPortal(true);
    try {
      const res = await fetch("/api/billing/portal", { method: "POST" });
      const data = await res.json();
      if (data.url) router.push(data.url);
    } finally {
      setOpenPortal(false);
    }
  }

  const currentTier = (billing?.subscriptionTier ?? "free") as TierKey;
  const usage = billing?.usage ?? { activeListings: 0, totalListings: 0, totalInquiries: 0 };
  const listingLimit = TIERS[currentTier].listings;

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold text-[#022c22] mb-1">Subscription</h1>
      <p className="text-slate-500 mb-8">Manage your plan and track feature usage.</p>

      {syncing && (
        <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-700 text-sm">
          Activating your subscription…
        </div>
      )}
      {!syncing && success && (
        <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-700 text-sm">
          Your subscription is now active. Welcome to {TIERS[currentTier]?.name ?? "your new plan"}!
        </div>
      )}
      {cancelled && (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg text-amber-700 text-sm">
          Checkout cancelled. Your plan was not changed.
        </div>
      )}

      {/* Current plan + usage summary */}
      {!loading && billing && (
        <div className="mb-8 bg-white border border-slate-200 rounded-xl overflow-hidden">
          {/* Header row */}
          <div className="flex items-center justify-between gap-4 px-5 py-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              {TIER_ICONS[currentTier]}
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wide leading-none mb-0.5">Current plan</p>
                <p className="text-lg font-semibold text-[#022c22] leading-tight">
                  {TIERS[currentTier]?.name}
                  <span className={`ml-2 text-xs px-2 py-0.5 rounded-full font-medium ${
                    billing.subscriptionStatus === "active"
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-slate-100 text-slate-500"
                  }`}>
                    {billing.subscriptionStatus === "active" ? "Active" : "Inactive"}
                  </span>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {billing.subscriptionPeriodEnd && (
                <p className="text-xs text-slate-400 hidden sm:block">
                  Renews {new Date(billing.subscriptionPeriodEnd).toLocaleDateString()}
                </p>
              )}
              {billing.stripeCustomerId && (
                <button
                  onClick={handlePortal}
                  disabled={openPortal}
                  className="text-sm px-4 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition"
                >
                  {openPortal ? "Opening…" : "Manage billing"}
                </button>
              )}
            </div>
          </div>

          {/* Usage stats grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-y sm:divide-y-0 divide-slate-100">
            {/* Active listings */}
            <div className="px-5 py-4">
              <div className="flex items-center gap-1.5 text-slate-400 text-xs mb-1">
                <Package size={13} /> Active Listings
              </div>
              <p className="text-xl font-bold text-[#022c22]">
                {usage.activeListings}
                <span className="text-sm font-normal text-slate-400">
                  {" "}/ {listingLimit === Infinity ? "∞" : listingLimit}
                </span>
              </p>
              <UsageBar used={usage.activeListings} limit={listingLimit} />
              {listingLimit !== Infinity && listingLimit > 0 && (
                <p className="text-xs text-slate-400 mt-1">
                  {listingLimit - usage.activeListings} remaining
                </p>
              )}
              {listingLimit === 0 && (
                <p className="text-xs text-amber-500 mt-1">Upgrade to post listings</p>
              )}
              {listingLimit === Infinity && (
                <p className="text-xs text-emerald-600 mt-1">Unlimited</p>
              )}
            </div>

            {/* Total listings ever */}
            <div className="px-5 py-4">
              <div className="flex items-center gap-1.5 text-slate-400 text-xs mb-1">
                <FileText size={13} /> Total Listings
              </div>
              <p className="text-xl font-bold text-[#022c22]">{usage.totalListings}</p>
              <p className="text-xs text-slate-400 mt-1">All time</p>
            </div>

            {/* Inquiries sent */}
            <div className="px-5 py-4">
              <div className="flex items-center gap-1.5 text-slate-400 text-xs mb-1">
                <MessageSquare size={13} /> Inquiries Sent
              </div>
              <p className="text-xl font-bold text-[#022c22]">{usage.totalInquiries}</p>
              <p className="text-xs text-slate-400 mt-1">All time</p>
            </div>

            {/* ECG reporting */}
            <div className="px-5 py-4">
              <div className="flex items-center gap-1.5 text-slate-400 text-xs mb-1">
                <BarChart2 size={13} /> ECG Reporting
              </div>
              <p className="text-sm font-semibold text-[#022c22] mt-1">
                {currentTier === "free" ? (
                  <span className="text-slate-400">Not available</span>
                ) : currentTier === "starter" ? (
                  "Dashboard"
                ) : currentTier === "growth" ? (
                  "Dashboard + CSV"
                ) : (
                  <span className="text-emerald-600">Custom reports</span>
                )}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Pricing grid */}
      <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-4">Plans</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {TIER_ORDER.map((key) => {
          const tier = TIERS[key];
          const isCurrent = key === currentTier;
          const currentIdx = TIER_ORDER.indexOf(currentTier);
          const keyIdx = TIER_ORDER.indexOf(key);
          const isUpgrade = keyIdx > currentIdx && key !== "free";
          const isDowngrade = keyIdx < currentIdx && key !== "free";

          return (
            <div
              key={key}
              className={`relative bg-white rounded-xl border p-5 flex flex-col transition ${
                isCurrent
                  ? "border-emerald-400 ring-1 ring-emerald-400 shadow-sm"
                  : "border-slate-200 hover:border-emerald-200"
              }`}
            >
              {isCurrent && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-xs bg-emerald-600 text-white px-3 py-0.5 rounded-full whitespace-nowrap">
                  Current plan
                </span>
              )}

              <div className="flex items-center gap-2 mb-2">
                {TIER_ICONS[key]}
                <span className="font-semibold text-[#022c22]">{tier.name}</span>
              </div>

              <p className="text-2xl font-bold text-[#022c22] mb-0.5">
                {tier.price === 0 ? "Free" : `$${tier.price}`}
                {tier.price > 0 && <span className="text-sm font-normal text-slate-400">/mo</span>}
              </p>

              {/* Listing limit — show live usage on current tier */}
              <div className="mb-3">
                <p className="text-xs text-slate-500 font-medium">
                  {isCurrent ? (
                    tier.listings === Infinity ? (
                      <span className="text-emerald-600 font-semibold">Unlimited listings</span>
                    ) : tier.listings === 0 ? (
                      <span className="text-amber-500">No listings (upgrade to post)</span>
                    ) : (
                      <>
                        <span className="text-[#022c22] font-bold">{usage.activeListings}</span>
                        <span className="text-slate-400"> / {tier.listings} listings used</span>
                      </>
                    )
                  ) : (
                    <span className="text-slate-400">
                      {tier.listings === Infinity ? "Unlimited" : tier.listings === 0 ? "No" : tier.listings}{" "}
                      listing{tier.listings !== 1 ? "s" : ""}
                    </span>
                  )}
                </p>
                {isCurrent && tier.listings !== Infinity && tier.listings > 0 && (
                  <UsageBar used={usage.activeListings} limit={tier.listings} />
                )}
              </div>

              <ul className="flex-1 space-y-1.5 mb-5">
                {tier.features.map((f: string) => (
                  <li key={f} className="flex items-start gap-2 text-xs text-slate-600">
                    <Check size={13} className="text-emerald-500 mt-0.5 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>

              {key === "free" ? (
                <div className="text-xs text-center text-slate-400 py-2">
                  {isCurrent ? "You are on this plan" : "Always free"}
                </div>
              ) : isCurrent ? (
                <div className="text-xs text-center text-emerald-600 font-medium py-2">
                  ✓ Your current plan
                </div>
              ) : (
                <button
                  onClick={() => handleUpgrade(key)}
                  disabled={upgrading === key}
                  className={`w-full py-2 rounded-lg text-sm font-medium transition disabled:opacity-50 ${
                    isUpgrade
                      ? "bg-[#059669] text-white hover:bg-[#047857]"
                      : isDowngrade
                        ? "border border-slate-200 text-slate-500 hover:bg-slate-50"
                        : "border border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {upgrading === key
                    ? "Redirecting…"
                    : isUpgrade
                      ? `Upgrade to ${tier.name}`
                      : `Switch to ${tier.name}`}
                </button>
              )}
            </div>
          );
        })}
      </div>

      <p className="text-center text-xs text-slate-400 mt-8">
        All paid plans are billed monthly and can be cancelled anytime.{" "}
        A 5% platform fee applies on completed deals.
      </p>
    </div>
  );
}

export default function SubscriptionPage() {
  return (
    <Suspense fallback={<div className="p-10 text-center text-slate-400">Loading…</div>}>
      <SubscriptionContent />
    </Suspense>
  );
}
