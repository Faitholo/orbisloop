"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

export default function Navbar() {
  const pathname = usePathname();

  // Hide navbar on auth pages
  if (pathname === "/" || pathname.startsWith("/auth") || pathname.startsWith("/dashboard")) return null;

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/92 backdrop-blur-md border-b border-gray-100">
      <div className="max-w-6xl mx-auto px-6 h-[72px] flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 font-bold text-xl text-emerald-950 no-underline">
          <Image src="/image_3fe86ce7.png" alt="OrbisLoop" width={32} height={32} className="rounded" />
          <span>OrbisLoop</span>
        </Link>
        <div className="flex items-center gap-6">
          <Link
            href="/"
            className="text-sm font-medium text-gray-500 hover:text-emerald-700 transition-colors"
          >
            Home
          </Link>
          <Link
            href="/submit"
            className={`text-sm font-medium transition-colors ${
              pathname === "/submit" ? "text-emerald-700" : "text-gray-500 hover:text-emerald-700"
            }`}
          >
            Submit Pickup
          </Link>
        </div>
      </div>
    </nav>
  );
}
