import type { Metadata } from "next";
import AppNav from "@/components/AppNav";

export const metadata: Metadata = { title: "Dashboard" };

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <AppNav />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8">
        {children}
      </main>
    </div>
  );
}
