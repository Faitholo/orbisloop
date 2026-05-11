"use client";

import { useEffect, useState } from "react";
import { useSession } from "@/lib/auth-client";
import { Loader2, Building2, User, Check } from "lucide-react";

const ORG_TYPES = [
  { value: "manufacturer", label: "Manufacturer" },
  { value: "retailer", label: "Retailer" },
  { value: "distributor", label: "Distributor" },
  { value: "recycler", label: "Recycler" },
  { value: "processor", label: "Processor" },
  { value: "broker", label: "Broker" },
  { value: "other", label: "Other" },
];

interface Org {
  id: string;
  name: string;
  slug: string;
  type: string;
  description: string | null;
  website: string | null;
  logoUrl: string | null;
  country: string;
  city: string | null;
  verified: boolean;
  subscriptionTier: string;
}

export default function SettingsPage() {
  const { data: session } = useSession();
  const [tab, setTab] = useState<"org" | "account">("org");
  const [org, setOrg] = useState<Org | null>(null);
  const [loading, setLoading] = useState(true);

  // Org form
  const [orgForm, setOrgForm] = useState({
    name: "", type: "", description: "", website: "", country: "", city: "", logoUrl: "",
  });
  const [orgSaving, setOrgSaving] = useState(false);
  const [orgSuccess, setOrgSuccess] = useState(false);
  const [orgError, setOrgError] = useState("");

  // Account form
  const [accountForm, setAccountForm] = useState({ name: "", currentPassword: "", newPassword: "" });
  const [accountSaving, setAccountSaving] = useState(false);
  const [accountSuccess, setAccountSuccess] = useState(false);
  const [accountError, setAccountError] = useState("");

  useEffect(() => {
    if (!session?.user) return;
    setAccountForm((f) => ({ ...f, name: session.user.name ?? "" }));
    fetch("/api/orgs")
      .then((r) => r.json())
      .then((orgs: Org[]) => {
        if (orgs.length) {
          const o = orgs[0];
          setOrg(o);
          setOrgForm({
            name: o.name,
            type: o.type,
            description: o.description ?? "",
            website: o.website ?? "",
            country: o.country,
            city: o.city ?? "",
            logoUrl: o.logoUrl ?? "",
          });
        }
      })
      .finally(() => setLoading(false));
  }, [session]);

  function setOrgField(field: string, value: string) {
    setOrgForm((f) => ({ ...f, [field]: value }));
  }

  async function saveOrg(e: React.FormEvent) {
    e.preventDefault();
    if (!org) return;
    setOrgError("");
    setOrgSuccess(false);
    setOrgSaving(true);

    const res = await fetch(`/api/orgs/${org.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(orgForm),
    });

    if (!res.ok) {
      const data = await res.json();
      setOrgError(typeof data.error === "string" ? data.error : "Could not save changes.");
    } else {
      const updated = await res.json();
      setOrg(updated);
      setOrgSuccess(true);
      setTimeout(() => setOrgSuccess(false), 3000);
    }
    setOrgSaving(false);
  }

  async function saveAccount(e: React.FormEvent) {
    e.preventDefault();
    setAccountError("");
    setAccountSuccess(false);
    setAccountSaving(true);

    try {
      // Update display name via Better Auth
      const res = await fetch("/api/auth/update-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: accountForm.name }),
      });
      if (!res.ok) throw new Error("Failed to update name");

      // Change password if provided
      if (accountForm.newPassword) {
        if (!accountForm.currentPassword) {
          setAccountError("Current password is required to set a new password.");
          setAccountSaving(false);
          return;
        }
        const pwRes = await fetch("/api/auth/change-password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            currentPassword: accountForm.currentPassword,
            newPassword: accountForm.newPassword,
          }),
        });
        if (!pwRes.ok) {
          const data = await pwRes.json();
          setAccountError(data.message ?? "Incorrect current password.");
          setAccountSaving(false);
          return;
        }
        setAccountForm((f) => ({ ...f, currentPassword: "", newPassword: "" }));
      }

      setAccountSuccess(true);
      setTimeout(() => setAccountSuccess(false), 3000);
    } catch {
      setAccountError("Could not save account changes.");
    }
    setAccountSaving(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
        <p className="text-slate-500 text-sm mt-1">Manage your organisation and account details.</p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setTab("org")}
          className={`flex items-center gap-2 px-5 py-2.5 text-sm font-semibold border-b-2 transition-colors ${
            tab === "org" ? "border-green-600 text-green-700" : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          <Building2 className="w-4 h-4" /> Organisation
        </button>
        <button
          onClick={() => setTab("account")}
          className={`flex items-center gap-2 px-5 py-2.5 text-sm font-semibold border-b-2 transition-colors ${
            tab === "account" ? "border-green-600 text-green-700" : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          <User className="w-4 h-4" /> Account
        </button>
      </div>

      {/* Org tab */}
      {tab === "org" && (
        <>
          {!org ? (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 text-sm text-amber-800">
              You haven&apos;t set up an organisation yet.{" "}
              <a href="/onboarding" className="font-semibold underline">Create one →</a>
            </div>
          ) : (
            <form onSubmit={saveOrg} className="bg-white rounded-xl border border-slate-200 p-8 space-y-5">
              {orgError && (
                <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded-lg">{orgError}</div>
              )}
              {orgSuccess && (
                <div className="bg-green-50 text-green-700 text-sm px-4 py-3 rounded-lg flex items-center gap-2">
                  <Check className="w-4 h-4" /> Changes saved.
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Organisation name *</label>
                  <input
                    required
                    value={orgForm.name}
                    onChange={(e) => setOrgField("name", e.target.value)}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Type *</label>
                  <select
                    value={orgForm.type}
                    onChange={(e) => setOrgField("type", e.target.value)}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    {ORG_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Country *</label>
                  <input
                    required
                    value={orgForm.country}
                    onChange={(e) => setOrgField("country", e.target.value)}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Nigeria"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">City</label>
                  <input
                    value={orgForm.city}
                    onChange={(e) => setOrgField("city", e.target.value)}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Lagos"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Website</label>
                <input
                  type="url"
                  value={orgForm.website}
                  onChange={(e) => setOrgField("website", e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="https://yourcompany.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Description</label>
                <textarea
                  rows={3}
                  value={orgForm.description}
                  onChange={(e) => setOrgField("description", e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                  placeholder="What does your organisation do?"
                />
              </div>

              <div className="pt-1 flex items-center justify-between">
                <p className="text-xs text-slate-400">
                  Slug: <span className="font-mono">{org.slug}</span>
                  {org.verified && (
                    <span className="ml-2 text-green-600 font-medium">✓ Verified</span>
                  )}
                  {" · "}Plan: <span className="capitalize font-medium">{org.subscriptionTier}</span>
                </p>
                <button
                  type="submit"
                  disabled={orgSaving}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white text-sm font-semibold rounded-lg transition-colors"
                >
                  {orgSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                  Save changes
                </button>
              </div>
            </form>
          )}
        </>
      )}

      {/* Account tab */}
      {tab === "account" && (
        <form onSubmit={saveAccount} className="bg-white rounded-xl border border-slate-200 p-8 space-y-5">
          {accountError && (
            <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded-lg">{accountError}</div>
          )}
          {accountSuccess && (
            <div className="bg-green-50 text-green-700 text-sm px-4 py-3 rounded-lg flex items-center gap-2">
              <Check className="w-4 h-4" /> Account updated.
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Display name</label>
            <input
              value={accountForm.name}
              onChange={(e) => setAccountForm((f) => ({ ...f, name: e.target.value }))}
              className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
            <input
              disabled
              value={session?.user.email ?? ""}
              className="w-full border border-slate-100 rounded-lg px-3 py-2.5 text-sm bg-slate-50 text-slate-400 cursor-not-allowed"
            />
            <p className="text-xs text-slate-400 mt-1">Email cannot be changed.</p>
          </div>

          <div className="border-t border-slate-100 pt-5">
            <p className="text-sm font-semibold text-slate-700 mb-4">Change password</p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Current password</label>
                <input
                  type="password"
                  autoComplete="current-password"
                  value={accountForm.currentPassword}
                  onChange={(e) => setAccountForm((f) => ({ ...f, currentPassword: e.target.value }))}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">New password</label>
                <input
                  type="password"
                  autoComplete="new-password"
                  value={accountForm.newPassword}
                  onChange={(e) => setAccountForm((f) => ({ ...f, newPassword: e.target.value }))}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Leave blank to keep current password"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={accountSaving}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white text-sm font-semibold rounded-lg transition-colors"
            >
              {accountSaving && <Loader2 className="w-4 h-4 animate-spin" />}
              Save account
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
