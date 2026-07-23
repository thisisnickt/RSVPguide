"use client";

import { useState } from "react";
import axios from "axios";
import type { VenueCategory } from "@/lib/types";

const CATEGORIES: VenueCategory[] = [
  "Dance Club",
  "Cocktail Bar",
  "Rooftop Bar",
  "Pub / Brewery",
];

export default function SubmissionForm() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const body = Object.fromEntries(formData.entries());

    try {
      await axios.post("/api/submissions", body);
      setSuccess(true);
      (e.target as HTMLFormElement).reset();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="rounded-lg border border-brand-border bg-brand-card p-6 text-center">
        <p className="text-brand-gold font-semibold">Thank you for your submission!</p>
        <p className="mt-1 text-sm text-brand-text-secondary">
          We&apos;ll review your listing and be in touch shortly.
        </p>
        <button
          onClick={() => setSuccess(false)}
          className="mt-4 text-sm text-brand-text-secondary underline hover:text-brand-text-primary"
        >
          Submit another venue
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 rounded-lg border border-brand-border bg-brand-card p-6"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs text-brand-text-secondary">
            Venue Name <span className="text-brand-gold">*</span>
          </label>
          <input
            name="venue_name"
            required
            className="w-full rounded border border-brand-border bg-brand-surface px-3 py-2 text-sm text-brand-text-primary outline-none focus:border-brand-gold"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-brand-text-secondary">Venue Website</label>
          <input
            name="venue_website"
            type="url"
            placeholder="https://"
            className="w-full rounded border border-brand-border bg-brand-surface px-3 py-2 text-sm text-brand-text-primary placeholder-brand-text-secondary outline-none focus:border-brand-gold"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs text-brand-text-secondary">Category</label>
          <select
            name="venue_category"
            className="w-full rounded border border-brand-border bg-brand-surface px-3 py-2 text-sm text-brand-text-primary outline-none focus:border-brand-gold"
          >
            <option value="">Select a category</option>
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs text-brand-text-secondary">Neighbourhood</label>
          <input
            name="venue_neighbourhood"
            placeholder="e.g. Clarke Quay"
            className="w-full rounded border border-brand-border bg-brand-surface px-3 py-2 text-sm text-brand-text-primary placeholder-brand-text-secondary outline-none focus:border-brand-gold"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs text-brand-text-secondary">
            Your Name <span className="text-brand-gold">*</span>
          </label>
          <input
            name="contact_name"
            required
            className="w-full rounded border border-brand-border bg-brand-surface px-3 py-2 text-sm text-brand-text-primary outline-none focus:border-brand-gold"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-brand-text-secondary">
            Your Email <span className="text-brand-gold">*</span>
          </label>
          <input
            name="contact_email"
            type="email"
            required
            className="w-full rounded border border-brand-border bg-brand-surface px-3 py-2 text-sm text-brand-text-primary outline-none focus:border-brand-gold"
          />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-xs text-brand-text-secondary">Additional Details</label>
        <textarea
          name="message"
          rows={3}
          placeholder="Tell us about your venue — events, capacity, vibe..."
          className="w-full resize-none rounded border border-brand-border bg-brand-surface px-3 py-2 text-sm text-brand-text-primary placeholder-brand-text-secondary outline-none focus:border-brand-gold"
        />
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded bg-brand-gold py-2.5 text-sm font-semibold text-brand-bg transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {loading ? "Submitting..." : "Submit Venue"}
      </button>
    </form>
  );
}
