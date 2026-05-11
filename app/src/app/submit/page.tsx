"use client";

import { useState } from "react";

export default function SubmitPage() {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const form = e.currentTarget;
    const data = {
      business_name: (form.elements.namedItem("business_name") as HTMLInputElement).value,
      phone: (form.elements.namedItem("phone") as HTMLInputElement).value,
      location: (form.elements.namedItem("location") as HTMLInputElement).value,
      food_type: (form.elements.namedItem("food_type") as HTMLInputElement).value,
      quantity: (form.elements.namedItem("quantity") as HTMLInputElement).value,
      pickup_time: (form.elements.namedItem("pickup_time") as HTMLInputElement).value,
    };

    try {
      const res = await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Something went wrong");
      }

      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit");
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 pt-[72px]">
        <div className="max-w-xl mx-auto px-6 py-24 text-center">
          <div className="bg-white rounded-2xl border border-gray-200 p-12 shadow-sm">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Pickup Request Received</h2>
            <p className="text-gray-500 text-lg">
              We&apos;ll coordinate with an NGO partner shortly.
            </p>
            <button
              onClick={() => setSubmitted(false)}
              className="mt-8 text-emerald-600 font-medium hover:text-emerald-700 transition-colors"
            >
              Submit another request
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-[72px]">
      <div className="max-w-xl mx-auto px-6 py-16">
        <div className="mb-10">
          <span className="inline-block text-xs font-semibold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full mb-3">
            Submit Pickup
          </span>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Schedule a Food Pickup
          </h1>
          <p className="text-gray-500">
            Submit your surplus food details. We&apos;ll match you with an NGO partner for redistribution.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm space-y-5">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="business_name" className="block text-sm font-medium text-gray-700 mb-1.5">
              Business Name
            </label>
            <input
              id="business_name"
              name="business_name"
              type="text"
              required
              placeholder="e.g. FreshMart Supermarket"
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors"
            />
          </div>

          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1.5">
              Contact Phone
            </label>
            <input
              id="phone"
              name="phone"
              type="tel"
              required
              placeholder="+234 800 000 0000"
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors"
            />
          </div>

          <div>
            <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1.5">
              Location
            </label>
            <input
              id="location"
              name="location"
              type="text"
              required
              placeholder="e.g. 15 Marina Road, Lagos"
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="food_type" className="block text-sm font-medium text-gray-700 mb-1.5">
                Food Type
              </label>
              <input
                id="food_type"
                name="food_type"
                type="text"
                required
                placeholder="e.g. Bread, Produce"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors"
              />
            </div>
            <div>
              <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 mb-1.5">
                Quantity (kg)
              </label>
              <input
                id="quantity"
                name="quantity"
                type="text"
                required
                placeholder="e.g. 50"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors"
              />
            </div>
          </div>

          <div>
            <label htmlFor="pickup_time" className="block text-sm font-medium text-gray-700 mb-1.5">
              Preferred Pickup Time
            </label>
            <input
              id="pickup_time"
              name="pickup_time"
              type="datetime-local"
              required
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-2"
          >
            {loading ? "Submitting..." : "Submit Pickup Request"}
          </button>
        </form>
      </div>
    </div>
  );
}
