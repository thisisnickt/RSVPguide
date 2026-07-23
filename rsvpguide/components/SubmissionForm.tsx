"use client";

import { useState } from "react";
import axios from "axios";

interface SubmissionFormProps {
  type?: "venue" | "event";
}

export default function SubmissionForm({ type = "venue" }: SubmissionFormProps) {
  const [formType, setFormType] = useState<"venue" | "event">(type);
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
      await axios.post("/api/submissions", { ...body, type: formType });
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
        <p className="mt-1 text-sm text-brand-text-secondary">We'll review it and get back to you.</p>
        <button
          onClick={() => setSuccess(false)}
          className="mt-4 text-sm text-brand-text-secondary underline hover:text-brand-text-primary"
        >
          Submit another
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border border-brand-border bg-brand-card p-6">
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setFormType("venue")}
          className={`flex-1 rounded py-2 text-sm font-medium transition-colors ${
            formType === "venue"
              ? "bg-brand-gold text-brand-bg"
              : "border border-brand-border text-brand-text-secondary hover:border-brand-gold"
          }`}
        >
          Venue
        </button>
        <button
          type="button"
          onClick={() => setFormType("event")}
          className={`flex-1 rounded py-2 text-sm font-medium transition-colors ${
            formType === "event"
              ? "bg-brand-gold text-brand-bg"
              : "border border-brand-border text-brand-text-secondary hover:border-brand-gold"
          }`}
        >
          Event
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs text-brand-text-secondary">Your Name</label>
          <input
            name="name"
            required
            className="w-full rounded border border-brand-border bg-brand-surface px-3 py-2 text-sm text-brand-text-primary outline-none focus:border-brand-gold"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-brand-text-secondary">Your Email</label>
          <input
            name="email"
            type="email"
            required
            className="w-full rounded border border-brand-border bg-brand-surface px-3 py-2 text-sm text-brand-text-primary outline-none focus:border-brand-gold"
          />
        </div>
      </div>

      {formType === "venue" ? (
        <>
          <div>
            <label className="mb-1 block text-xs text-brand-text-secondary">Venue Name</label>
            <input
              name="venue_name"
              required
              className="w-full rounded border border-brand-border bg-brand-surface px-3 py-2 text-sm text-brand-text-primary outline-none focus:border-brand-gold"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-brand-text-secondary">Venue Address</label>
            <input
              name="venue_address"
              className="w-full rounded border border-brand-border bg-brand-surface px-3 py-2 text-sm text-brand-text-primary outline-none focus:border-brand-gold"
            />
          </div>
        </>
      ) : (
        <>
          <div>
            <label className="mb-1 block text-xs text-brand-text-secondary">Event Title</label>
            <input
              name="event_title"
              required
              className="w-full rounded border border-brand-border bg-brand-surface px-3 py-2 text-sm text-brand-text-primary outline-none focus:border-brand-gold"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-brand-text-secondary">Event Date</label>
            <input
              name="event_date"
              type="date"
              required
              className="w-full rounded border border-brand-border bg-brand-surface px-3 py-2 text-sm text-brand-text-primary outline-none focus:border-brand-gold"
            />
          </div>
        </>
      )}

      <div>
        <label className="mb-1 block text-xs text-brand-text-secondary">Additional Details</label>
        <textarea
          name="message"
          rows={3}
          className="w-full rounded border border-brand-border bg-brand-surface px-3 py-2 text-sm text-brand-text-primary outline-none focus:border-brand-gold resize-none"
        />
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded bg-brand-gold py-2.5 text-sm font-semibold text-brand-bg transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {loading ? "Submitting..." : "Submit"}
      </button>
    </form>
  );
}
