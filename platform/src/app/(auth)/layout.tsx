import type { Metadata } from "next";

export const metadata: Metadata = { title: "Sign in" };

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: "linear-gradient(180deg, #fff 0%, #ecfdf5 100%)" }}
    >
      {children}
    </div>
  );
}
