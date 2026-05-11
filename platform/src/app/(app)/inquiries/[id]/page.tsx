"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import Link from "next/link";
import { ArrowLeft, Send, CheckCircle, XCircle, CreditCard, Leaf } from "lucide-react";

interface Message {
  id: string;
  senderOrgId: string;
  senderOrgName?: string;
  body: string;
  createdAt: string;
}

interface InquiryDetail {
  id: string;
  listingId: string;
  listingTitle?: string;
  listingOrgId: string;
  listingOrgName?: string;
  inquirerOrgId: string;
  inquirerOrgName?: string;
  status: string;
  proposedQuantity: number | null;
  proposedPricePerUnit: number | null;
  currency: string | null;
  message: string;
  createdAt: string;
  messages: Message[];
}

interface Org { id: string; name: string }

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700",
  accepted: "bg-green-100 text-green-700",
  declined: "bg-red-100 text-red-700",
  completed: "bg-emerald-100 text-emerald-700",
};

interface EcgResult {
  co2SavedKg: number;
  waterSavedL: number;
  energySavedKwh: number;
  landfillDivertedKg: number;
  carbonCreditEquivalent: number;
}

export default function InquiryDetailPage() {
  const { id } = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { data: session } = useSession();
  const [inquiry, setInquiry] = useState<InquiryDetail | null>(null);
  const [org, setOrg] = useState<Org | null>(null);
  const [msgBody, setMsgBody] = useState("");
  const [sending, setSending] = useState(false);
  const [actioning, setActioning] = useState(false);
  const [paying, setPaying] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [ecgResult, setEcgResult] = useState<EcgResult | null>(null);
  const [payAmount, setPayAmount] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  const load = async () => {
    const r = await fetch(`/api/inquiries/${id}`);
    if (r.ok) setInquiry(await r.json());
  };

  useEffect(() => {
    if (!session?.user) return;
    fetch("/api/orgs")
      .then((r) => r.json())
      .then((orgs: Org[]) => { if (orgs.length) setOrg(orgs[0]); });
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, id]);

  // Trigger deal completion after Stripe redirect
  useEffect(() => {
    const paymentParam = searchParams.get("payment");
    const sessionId = searchParams.get("session_id");
    if (paymentParam !== "success" || !sessionId || !session?.user) return;

    setCompleting(true);
    fetch("/api/payments/complete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.ecg) setEcgResult(data.ecg);
        return load();
      })
      .finally(() => {
        setCompleting(false);
        // Clean URL — remove payment/session_id params
        router.replace(`/inquiries/${id}`);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, session]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [inquiry?.messages]);

  const isListingOwner = org && inquiry && org.id === inquiry.listingOrgId;
  const isBuyer = org && inquiry && org.id === inquiry.inquirerOrgId;

  const handlePay = async () => {
    const cents = Math.round(parseFloat(payAmount) * 100);
    if (!cents || cents < 100) return;
    setPaying(true);
    try {
      const res = await fetch("/api/payments/create-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inquiryId: id, amountCents: cents }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } finally {
      setPaying(false);
    }
  };

  const sendMessage = async () => {
    if (!msgBody.trim() || !org) return;
    setSending(true);
    await fetch(`/api/inquiries/${id}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body: msgBody, orgId: org.id }),
    });
    setMsgBody("");
    await load();
    setSending(false);
  };

  const act = async (action: "accept" | "decline") => {
    setActioning(true);
    await fetch(`/api/inquiries/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    await load();
    setActioning(false);
  };

  if (!inquiry || completing) {
    return (
      <div className="px-4 py-8 max-w-3xl mx-auto">
        <div className="h-8 w-48 bg-slate-100 rounded animate-pulse mb-6" />
        {completing && (
          <div className="mb-4 p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-sm text-emerald-700 font-medium">
            Confirming payment and recording ECG impact…
          </div>
        )}
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-16 bg-slate-100 rounded-xl animate-pulse" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-8 max-w-3xl mx-auto">
      <Link href="/inquiries" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 mb-5">
        <ArrowLeft className="w-4 h-4" /> Back to Inquiries
      </Link>

      {/* Deal Completed banner */}
      {inquiry.status === "completed" && (
        <div className="mb-5 p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-3">
          <Leaf className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-emerald-800">Deal completed — ECG impact recorded!</p>
            {ecgResult && (
              <div className="mt-2 grid grid-cols-2 gap-x-6 gap-y-1 text-xs text-emerald-700">
                <span>CO₂ saved: <strong>{ecgResult.co2SavedKg.toFixed(1)} kg</strong></span>
                <span>Water saved: <strong>{ecgResult.waterSavedL.toFixed(0)} L</strong></span>
                <span>Energy saved: <strong>{ecgResult.energySavedKwh.toFixed(1)} kWh</strong></span>
                <span>Landfill diverted: <strong>{ecgResult.landfillDivertedKg.toFixed(1)} kg</strong></span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 mb-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs text-slate-400 mb-0.5">Regarding</p>
            <Link href={`/marketplace/${inquiry.listingId}`} className="font-semibold text-slate-900 hover:text-green-700 text-sm">
              {inquiry.listingTitle ?? `Listing ${inquiry.listingId.slice(0, 8)}`}
            </Link>
          </div>
          <span className={`shrink-0 px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${STATUS_COLORS[inquiry.status] ?? "bg-slate-100 text-slate-500"}`}>
            {inquiry.status}
          </span>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-3 text-xs text-slate-500">
          <div>
            <span className="font-medium text-slate-700">From:</span>{" "}
            {inquiry.inquirerOrgName ?? "—"}
          </div>
          <div>
            <span className="font-medium text-slate-700">To:</span>{" "}
            {inquiry.listingOrgName ?? "—"}
          </div>
          {inquiry.proposedQuantity && (
            <div>
              <span className="font-medium text-slate-700">Quantity:</span>{" "}
              {inquiry.proposedQuantity}
            </div>
          )}
          {inquiry.proposedPricePerUnit && (
            <div>
              <span className="font-medium text-slate-700">Proposed price:</span>{" "}
              {inquiry.proposedPricePerUnit} {inquiry.currency}
            </div>
          )}
        </div>

        {inquiry.message && (
          <div className="mt-3 p-3 bg-slate-50 rounded-lg text-sm text-slate-600">
            {inquiry.message}
          </div>
        )}

        {/* Accept / Decline (only listing owner, pending) */}
        {isListingOwner && inquiry.status === "pending" && (
          <div className="flex gap-3 mt-4">
            <button
              onClick={() => act("accept")}
              disabled={actioning}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition-colors"
            >
              <CheckCircle className="w-4 h-4" /> Accept
            </button>
            <button
              onClick={() => act("decline")}
              disabled={actioning}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-red-50 hover:bg-red-100 disabled:opacity-50 text-red-600 text-sm font-semibold rounded-lg transition-colors"
            >
              <XCircle className="w-4 h-4" /> Decline
            </button>
          </div>
        )}

        {/* Pay button (buyer, accepted) — hidden once completed */}
        {isBuyer && inquiry.status === "accepted" && (
          <div className="mt-4 p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
            <p className="text-sm font-medium text-emerald-800 mb-3">Ready to pay? Enter the agreed total amount.</p>
            <div className="flex items-center gap-2">
              <span className="text-slate-500 text-sm">$</span>
              <input
                type="number"
                min="1"
                step="0.01"
                placeholder="0.00"
                value={payAmount}
                onChange={(e) => setPayAmount(e.target.value)}
                className="w-36 px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <button
                onClick={handlePay}
                disabled={paying || !payAmount || parseFloat(payAmount) < 1}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#059669] hover:bg-[#047857] disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition-colors"
              >
                <CreditCard className="w-4 h-4" />
                {paying ? "Redirecting…" : "Pay now"}
              </button>
            </div>
            <p className="text-xs text-emerald-700 mt-2">A 5% platform fee will be added at checkout.</p>
          </div>
        )}
      </div>

      {/* Thread */}
      <div className="bg-white rounded-xl border border-slate-200 flex flex-col" style={{ minHeight: 320 }}>
        <div className="p-4 border-b border-slate-100 text-xs font-semibold text-slate-400 uppercase tracking-wide">
          Messages
        </div>
        <div className="flex-1 p-4 space-y-3 overflow-y-auto">
          {inquiry.messages.length === 0 && (
            <p className="text-center text-sm text-slate-300 py-6">No messages yet.</p>
          )}
          {inquiry.messages.map((m) => {
            const isMe = org && m.senderOrgId === org.id;
            return (
              <div key={m.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-xs px-4 py-2.5 rounded-2xl text-sm ${isMe ? "bg-green-600 text-white rounded-br-sm" : "bg-slate-100 text-slate-800 rounded-bl-sm"}`}>
                  <p>{m.body}</p>
                  <p className={`text-xs mt-1 ${isMe ? "text-green-200" : "text-slate-400"}`}>
                    {m.senderOrgName ?? "—"} · {new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        {inquiry.status !== "declined" && inquiry.status !== "withdrawn" && inquiry.status !== "completed" && (
          <div className="p-4 border-t border-slate-100 flex gap-2">
            <input
              value={msgBody}
              onChange={(e) => setMsgBody(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
              placeholder="Type a message…"
              className="flex-1 px-4 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
            />
            <button
              onClick={sendMessage}
              disabled={sending || !msgBody.trim()}
              className="px-4 py-2.5 bg-green-600 hover:bg-green-700 disabled:opacity-40 text-white rounded-lg transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
