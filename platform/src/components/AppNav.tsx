"use client";

import Link from "next/link";
import Image from "next/image";
import { useSession, signOut } from "@/lib/auth-client";
import { usePathname } from "next/navigation";
import { Leaf, BarChart2, Search, Package, MessageSquare, LogOut, Settings, CreditCard, ShieldCheck } from "lucide-react";

const NAV = [
  { href: "/marketplace", label: "Marketplace", icon: Search },
  { href: "/dashboard", label: "Dashboard", icon: BarChart2 },
  { href: "/listings", label: "My Listings", icon: Package },
  { href: "/inquiries", label: "Inquiries", icon: MessageSquare },
  { href: "/ecg", label: "ECG Impact", icon: Leaf },
  { href: "/subscription", label: "Subscription", icon: CreditCard },
];

export default function AppNav() {
  const { data: session } = useSession();
  const pathname = usePathname();

  return (
    <nav className="h-16 border-b border-slate-200 bg-white flex items-center px-6 gap-6 sticky top-0 z-30">
      <Link href="/dashboard" className="flex items-center gap-2 font-bold text-slate-800 text-lg mr-4">
        <Image src="/logo.png" alt="OrbisLoop" width={48} height={32} className="rounded" style={{ height: "auto" }} />
        OrbisLoop
      </Link>

      <div className="flex items-center gap-1 flex-1">
        {NAV.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              pathname.startsWith(href)
                ? "bg-green-50 text-green-700"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </Link>
        ))}
      </div>

      {session ? (
        <div className="flex items-center gap-3">
          <Link
            href="/admin"
            className={`p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 ${
              pathname.startsWith("/admin") ? "text-green-600 bg-green-50" : ""
            }`}
            title="Admin"
          >
            <ShieldCheck className="w-4 h-4" />
          </Link>
          <Link
            href="/settings"
            className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800"
          >
            <Settings className="w-4 h-4" />
            <span className="hidden sm:inline">
              {session.user.name?.split(" ")[0] ?? session.user.email}
            </span>
          </Link>
          <button
            onClick={() => signOut()}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
            title="Sign out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <Link
          href="/login"
          className="ml-auto px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700"
        >
          Sign in
        </Link>
      )}
    </nav>
  );
}
