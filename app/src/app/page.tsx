import Link from "next/link";
import Image from "next/image";

export default function AuthPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50/50 to-white flex items-center justify-center px-6">
      <div className="max-w-2xl w-full py-16">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-2.5 mb-6">
            <Image src="/image_3fe86ce7.png" alt="OrbisLoop" width={44} height={44} className="rounded-lg" />
            <span className="text-2xl font-bold text-emerald-950">OrbisLoop</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight mb-3">
            Welcome to OrbisLoop
          </h1>
          <p className="text-gray-500 text-lg max-w-md mx-auto">
            Choose how you&apos;d like to get started
          </p>
        </div>

        {/* Role Cards */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Supermarket Card */}
          <Link
            href="/auth/supermarket"
            className="group bg-white rounded-2xl border border-gray-200 p-8 hover:border-emerald-300 hover:shadow-lg transition-all"
          >
            <div className="w-14 h-14 bg-emerald-100 rounded-xl flex items-center justify-center mb-5 group-hover:bg-emerald-200 transition-colors">
              <svg className="w-7 h-7 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">For Supermarkets</h2>
            <p className="text-gray-500 text-sm leading-relaxed mb-4">
              Submit surplus food for pickup and redistribution. Reduce waste and support your community.
            </p>
            <span className="inline-flex items-center text-sm font-semibold text-emerald-600 group-hover:text-emerald-700">
              Get Started
              <svg className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </span>
          </Link>

          {/* NGO Card */}
          <Link
            href="/auth/ngo"
            className="group bg-white rounded-2xl border border-gray-200 p-8 hover:border-sky-300 hover:shadow-lg transition-all"
          >
            <div className="w-14 h-14 bg-sky-100 rounded-xl flex items-center justify-center mb-5 group-hover:bg-sky-200 transition-colors">
              <svg className="w-7 h-7 text-sky-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">For NGOs</h2>
            <p className="text-gray-500 text-sm leading-relaxed mb-4">
              Accept and manage food pickups for your community. Get matched with nearby businesses.
            </p>
            <span className="inline-flex items-center text-sm font-semibold text-sky-600 group-hover:text-sky-700">
              Get Started
              <svg className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </span>
          </Link>
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-gray-400 mt-10">
          Powering the circular economy &mdash; one meal at a time.
        </p>
      </div>
    </div>
  );
}
