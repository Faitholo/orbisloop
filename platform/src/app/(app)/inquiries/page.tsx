"use client";

import { useEffect, useState } from "react";
import { useSession } from "@/lib/auth-client";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { MessageSquare, ChevronRight, ArrowLeft } from "lucide-react";

interface Inquiry {
  id: string;
  listingId: string;
  listingTitle?: string;
  inquirerOrgId: string;
  inquirerOrgName?: string;
  listingOrgId: string;
  listingOrgName?: string;
  status: string;
  proposedQuantity: number | null;
  proposedPricePerUnit: number | null;
  currency: string | null;
  message: string;
  createdAt: string;
}

interface Org { id: string; name: string }

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700",
  accepted: "bg-green-100 text-green-700",
  declined: "bg-red-100 text-red-700",
  withdrawn: "bg-slate-100 text-slate-500",
};

export default function InquiriesPage() {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const listingId = searchParams.get("listingId");
  const [org, setOrg] = useState<Org | null>(null);
  const [received, setReceived] = useState<Inquiry[]>([]);
  const [sent, setSent] = useState<Inquiry[]>([]);
  const [listingFiltered, setListingFiltered] = useState<Inquiry[]>([]);
  const [tab, setTab] = useState<"received" | "sent">("received");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session?.user) return;
    fetch("/api/orgs")
      .then((r) => r.json())
      .then(async (orgs: Org[]) => {
        if (!orgs.length) { setLoading(false); return; }
        const o = orgs[0];
        setOrg(o);
        if (listingId) {
          const data = await fetch(`/api/inquiries?listingId=${listingId}`).then((r) => r.json());
          setListingFiltered(Array.isArray(data) ? data : []);
        } else {
          const [recv, snt] = await Promise.all([
            fetch(`/api/inquiries?orgId=${o.id}&role=received`).then((r) => r.json()),
            fetch(`/api/inquiries?orgId=${o.id}&role=sent`).then((r) => r.json()),
          ]);
          setReceived(Array.isArray(recv) ? recv : recv.inquiries ?? []);
          setSent(Array.isArray(snt) ? snt : snt.inquiries ?? []);
        }
      })
      .finally(() => setLoading(false));
  }, [session, listingId]);

  const list = listingId ? listingFiltered : (tab === "received" ? received : sent);

  return (
    <div className="px-4 py-8 max-w-4xl mx-auto">
      <div className="mb-6">
        {listingId && (
          <Link
            href="/inquiries"
            className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 mb-3"
          >
            <ArrowLeft className="w-4 h-4" /> All inquiries
          </Link>
        )}
        <h1 className="text-2xl font-bold text-slate-900">
          {listingId ? "Listing inquiries" : "Inquiries"}
        </h1>
        {org && <p className="text-sm text-slate-500 mt-0.5">{org.name}</p>}
      </div>

      {/* Tabs — hidden when filtering by listing */}
      {!listingId && (
        <div className="flex border-b border-slate-200 mb-6">
          {(["received", "sent"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-5 py-2.5 text-sm font-semibold capitalize border-b-2 transition-colors ${
                tab === t
                  ? "border-green-600 text-green-700"
                  : "border-transparent text-slate-500 hover:text-slate-700"
              }`}
            >
              {t}{" "}
              <span className="ml-1 text-xs font-normal text-slate-400">
                ({t === "received" ? received.length : sent.length})
              </span>
            </button>
          ))}
        </div>
      )}
      {listingId && <div className="mb-6" />}

      {loading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-slate-100 rounded-xl animate-pulse" />
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

      {!loading && org && list.length === 0 && (
        <div className="flex flex-col items-center py-20 text-slate-400 gap-3">
          <MessageSquare className="w-10 h-10 text-slate-200" />
          <p>No {tab} inquiries yet.</p>
          {tab === "sent" && (
            <Link href="/marketplace" className="text-green-600 font-semibold hover:underline text-sm">
              Browse the marketplace →
            </Link>
          )}
        </div>
      )}

      {!loading && list.length > 0 && (
        <div className="space-y-3">
          {list.map((inq) => {
            const counterparty =
              tab === "received"
                ? inq.inquirerOrgName ?? "Unknown company"
                : inq.listingOrgName ?? "Unknown company";

            return (
              <Link
                key={inq.id}
                href={`/inquiries/${inq.id}`}
                className="flex items-center gap-4 p-4 bg-white rounded-xl border border-slate-200 hover:border-green-300 hover:shadow-sm transition-all group"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="font-semibold text-slate-900 truncate text-sm">
                      {inq.listingTitle ?? `Inquiry #${inq.id.slice(0, 8)}`}
                    </p>
                    <span
                      className={`shrink-0 px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${
                        STATUS_COLORS[inq.status] ?? "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {inq.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 truncate">
                    {tab === "received" ? "From" : "To"}: {counterparty}
                    {inq.proposedQuantity
                      ? ` · ${inq.proposedQuantity} units proposed`
                      : ""}
                    {inq.proposedPricePerUnit
                      ? ` @ ${inq.proposedPricePerUnit} ${inq.currency ?? ""}`
                      : ""}
                  </p>
                  <p className="text-xs text-slate-300 mt-1 line-clamp-1">{inq.message}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0 text-xs text-slate-400">
                  <span>{new Date(inq.createdAt).toLocaleDateString()}</span>
                  <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-green-500 transition-colors" />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
