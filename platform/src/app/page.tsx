import Link from "next/link";
import Image from "next/image";
import { ArrowRight, BarChart2, Search, Shield, Zap, Leaf } from "lucide-react";

const FEATURES = [
  {
    icon: Search,
    title: "Materials Marketplace",
    desc: "List and discover surplus materials, by-products, and assets. Filter by category, quantity, and location.",
  },
  {
    icon: Zap,
    title: "Instant Matching",
    desc: "Smart inquiry flow connects buyers and sellers directly. Accept, negotiate, and close deals on-platform.",
  },
  {
    icon: BarChart2,
    title: "ECG Impact Tracking",
    desc: "Every completed exchange automatically calculates CO₂ saved, water conserved, and carbon credit equivalents.",
  },
  {
    icon: Shield,
    title: "B2B Native",
    desc: "Organisation-level accounts, multi-member teams, verified profiles, and governance-ready reporting.",
  },
];

const STATS = [
  { value: "3.5×", label: "More materials reused vs. virgin" },
  { value: "68%", label: "Average CO₂ reduction per tonne" },
  { value: "120+", label: "Material categories supported" },
];

export default function Home() {
  return (
    <div className="min-h-screen" style={{ fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", color: "#334155" }}>

      {/* Nav */}
      <header
        className="h-[72px] sticky top-0 z-30 flex items-center px-6"
        style={{ background: "rgba(255,255,255,0.92)", backdropFilter: "blur(12px)", borderBottom: "1px solid #e2e8f0", boxShadow: "0 1px 2px 0 rgb(0 0 0 / 0.05)" }}
      >
        <div className="flex items-center justify-between w-full max-w-6xl mx-auto">
          <Link href="/" className="flex items-center gap-2.5 font-bold text-lg no-underline" style={{ color: "#022c22" }}>
            <Image src="/logo.png" alt="OrbisLoop" width={54} height={36} className="rounded" style={{ height: "auto" }} />
            OrbisLoop
          </Link>
          <div className="flex items-center gap-6">
            <Link href="/login" className="text-sm font-medium transition-colors" style={{ color: "#475569" }}>
              Sign in
            </Link>
            <Link
              href="/register"
              className="px-5 py-2 text-sm font-semibold text-white rounded-full transition-colors"
              style={{ background: "#059669" }}
            >
              Get started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section
        className="flex flex-col items-center text-center px-6 pt-24 pb-20"
        style={{ background: "linear-gradient(180deg, #fff 0%, #ecfdf5 100%)" }}
      >
        <div
          className="inline-flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-full mb-6"
          style={{ background: "#d1fae5", color: "#047857" }}
        >
          <Leaf className="w-3.5 h-3.5" />
          B2B Circular Economy Marketplace
        </div>
        <h1
          className="font-extrabold leading-tight mb-6 max-w-4xl"
          style={{ fontSize: "clamp(2.25rem, 5vw, 3.5rem)", letterSpacing: "-0.02em", color: "#022c22" }}
        >
          Turn your waste into{" "}
          <span style={{ color: "#059669" }}>another company&apos;s resource</span>
        </h1>
        <p className="text-xl max-w-2xl mx-auto mb-10" style={{ color: "#475569", lineHeight: 1.7 }}>
          OrbisLoop connects businesses to trade surplus materials, equipment, and
          by-products — with built-in ECG impact tracking on every deal.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/register"
            className="inline-flex items-center gap-2 px-8 py-3.5 font-semibold text-white rounded-xl text-base transition-colors"
            style={{ background: "#059669", boxShadow: "0 10px 15px -3px rgb(5 150 105 / 0.25)" }}
          >
            Start for free
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/marketplace"
            className="inline-flex items-center gap-2 px-8 py-3.5 font-medium rounded-xl text-base transition-colors"
            style={{ border: "1px solid #e2e8f0", background: "#fff", color: "#334155" }}
          >
            Browse marketplace
          </Link>
        </div>
      </section>

      {/* Stats bar */}
      <section style={{ background: "linear-gradient(135deg, #064e3b 0%, #022c22 100%)" }}>
        <div className="max-w-5xl mx-auto px-6 py-12 grid grid-cols-3 gap-8 text-center text-white">
          {STATS.map((s) => (
            <div key={s.label}>
              <p className="text-3xl font-bold">{s.value}</p>
              <p className="text-sm mt-1" style={{ color: "#6ee7b7" }}>{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="max-w-5xl mx-auto px-6 py-24" style={{ background: "#fff" }}>
        <div className="text-center mb-14">
          <h2 className="text-3xl font-bold mb-3" style={{ color: "#022c22" }}>
            Everything you need for circular commerce
          </h2>
          <p className="max-w-xl mx-auto" style={{ color: "#64748b" }}>
            From discovery to deal close to impact report — OrbisLoop handles the full loop.
          </p>
        </div>
        <div className="grid sm:grid-cols-2 gap-6">
          {FEATURES.map(({ icon: Icon, title, desc }) => (
            <div
              key={title}
              className="rounded-2xl p-7 transition-shadow hover:shadow-lg"
              style={{ border: "1px solid #e2e8f0", background: "#fff" }}
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
                style={{ background: "#d1fae5" }}
              >
                <Icon className="w-5 h-5" style={{ color: "#059669" }} />
              </div>
              <h3 className="font-semibold mb-2 text-lg" style={{ color: "#022c22" }}>{title}</h3>
              <p className="text-sm leading-relaxed" style={{ color: "#64748b" }}>{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="py-24" style={{ background: "#f8fafc" }}>
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-14" style={{ color: "#022c22" }}>How it works</h2>
          <div className="grid sm:grid-cols-3 gap-8">
            {[
              {
                step: "01",
                title: "Create your organisation",
                desc: "Sign up, set up your company profile, and choose your type — manufacturer, recycler, retailer, and more.",
              },
              {
                step: "02",
                title: "List or discover",
                desc: "Post surplus materials as an offer, or request what you need. Browse the live marketplace filtered by category and location.",
              },
              {
                step: "03",
                title: "Close the loop",
                desc: "Send an inquiry, negotiate, and accept. The platform records your ECG impact automatically when a deal closes.",
              },
            ].map(({ step, title, desc }) => (
              <div key={step} className="text-center">
                <div
                  className="w-12 h-12 font-bold text-lg rounded-2xl flex items-center justify-center mx-auto mb-5 text-white"
                  style={{ background: "#059669" }}
                >
                  {step}
                </div>
                <h3 className="font-semibold mb-2" style={{ color: "#022c22" }}>{title}</h3>
                <p className="text-sm" style={{ color: "#64748b" }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section
        className="py-24 text-center text-white"
        style={{ background: "linear-gradient(135deg, #064e3b 0%, #022c22 100%)" }}
      >
        <div className="max-w-2xl mx-auto px-6">
          <h2 className="text-3xl font-bold mb-4">Ready to close the loop?</h2>
          <p className="mb-8" style={{ color: "#a7f3d0" }}>
            Join the businesses already trading surplus materials and measuring their real-world impact.
          </p>
          <Link
            href="/register"
            className="inline-flex items-center gap-2 px-8 py-3.5 font-semibold text-white rounded-xl text-base transition-colors"
            style={{ background: "#10b981", boxShadow: "0 10px 15px -3px rgb(16 185 129 / 0.3)" }}
          >
            Get started — it&apos;s free
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: "1px solid #e2e8f0", background: "#fff" }} className="py-8">
        <div className="max-w-5xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm" style={{ color: "#94a3b8" }}>
          <div className="flex items-center gap-2 font-semibold" style={{ color: "#334155" }}>
            <Image src="/logo.png" alt="OrbisLoop" width={33} height={22} className="rounded" style={{ height: "auto" }} />
            OrbisLoop
          </div>
          <div className="flex gap-6">
            <Link href="/terms" className="transition-colors hover:text-slate-600">Terms</Link>
            <Link href="/privacy" className="transition-colors hover:text-slate-600">Privacy</Link>
          </div>
          <p>© {new Date().getFullYear()} OrbisLoop</p>
        </div>
      </footer>
    </div>
  );
}
