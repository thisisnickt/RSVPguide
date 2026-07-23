"use client";

import { useState } from "react";
import type { VenueCategory } from "@/lib/types";

const CATEGORIES: VenueCategory[] = [
  "Dance Club",
  "Cocktail Bar",
  "Rooftop Bar",
  "Pub / Brewery",
];

const NEIGHBOURHOODS = [
  "Clarke Quay", "Marina Bay",     "Tanjong Pagar", "Amoy Street",
  "Bukit Pasoh",  "Boat Quay",     "CBD",           "City Hall",
  "Orchard",      "Bugis",         "Chinatown",     "Club Street",
  "Duxton",       "Bras Basah",
] as const;

// ── Types ───────────────────────────────────────────────────────────────────

interface Fields {
  venue_name:          string;
  venue_website:       string;
  venue_category:      string;
  venue_neighbourhood: string;
  contact_name:        string;
  contact_email:       string;
  message:             string;
}

type FieldErrors = Partial<Record<keyof Fields, string>>;

const EMPTY: Fields = {
  venue_name: "", venue_website: "", venue_category: "",
  venue_neighbourhood: "", contact_name: "", contact_email: "", message: "",
};

// ── Validation ──────────────────────────────────────────────────────────────

function validate(f: Fields): FieldErrors {
  const errs: FieldErrors = {};
  if (!f.venue_name.trim())   errs.venue_name   = "Required";
  if (!f.contact_name.trim()) errs.contact_name = "Required";
  if (!f.contact_email.trim()) {
    errs.contact_email = "Required";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.contact_email)) {
    errs.contact_email = "Enter a valid email";
  }
  return errs;
}

// ── Helpers ─────────────────────────────────────────────────────────────────

const labelClass = "mb-1.5 block text-[11px] font-medium uppercase tracking-widest text-[#A89F8C]";
const selectClass = "w-full rounded-lg border border-[#2A2A2A] bg-[#1C1C1C] px-3 py-2.5 text-sm text-[#F0EDE6] outline-none transition-colors focus:border-[#C9A84C]/60";

function inputCls(hasError: boolean) {
  return [
    "w-full rounded-lg border px-3 py-2.5 text-sm text-[#F0EDE6] bg-[#1C1C1C]",
    "outline-none transition-colors placeholder-[#A89F8C]",
    hasError
      ? "border-red-500/60 focus:border-red-500"
      : "border-[#2A2A2A] focus:border-[#C9A84C]/60",
  ].join(" ");
}

// ── Component ────────────────────────────────────────────────────────────────

export default function SubmissionForm() {
  const [fields,    setFields]    = useState<Fields>(EMPTY);
  const [errors,    setErrors]    = useState<FieldErrors>({});
  const [loading,   setLoading]   = useState(false);
  const [success,   setSuccess]   = useState(false);
  const [serverErr, setServerErr] = useState<string | null>(null);
  // Captured before form reset so success message stays personal
  const [sentName,  setSentName]  = useState("");
  const [sentEmail, setSentEmail] = useState("");

  const set = (key: keyof Fields, val: string) => {
    setFields((p) => ({ ...p, [key]: val }));
    if (errors[key]) setErrors((p) => ({ ...p, [key]: undefined }));
  };

  const submit = async () => {
    const errs = validate(fields);
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setLoading(true);
    setServerErr(null);
    try {
      const res = await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(fields),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Server error");
      }
      setSentName(fields.contact_name.trim());
      setSentEmail(fields.contact_email.trim());
      setSuccess(true);
      setFields(EMPTY);
    } catch (e) {
      setServerErr(e instanceof Error ? e.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ── Success state ──────────────────────────────────────────────────────────

  if (success) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-xl border border-[#2A2A2A] bg-[#141414] px-8 py-12 text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-full border border-[#C9A84C]/40 bg-[#C9A84C]/10 text-xl text-[#C9A84C]">
          ✓
        </span>
        <p className="font-playfair text-xl text-[#F0EDE6]">
          Thanks {sentName} — we&apos;ll review your submission and be in touch at{" "}
          <span className="text-[#C9A84C]">{sentEmail}</span> within 48 hours.
        </p>
        <p className="text-sm text-[#A89F8C]">We review every submission personally.</p>
        <div
          role="button"
          tabIndex={0}
          onClick={() => setSuccess(false)}
          onKeyDown={(e) => e.key === "Enter" && setSuccess(false)}
          className="mt-1 cursor-pointer text-sm text-[#A89F8C] underline-offset-2 hover:text-[#F0EDE6] hover:underline"
        >
          Submit another venue
        </div>
      </div>
    );
  }

  // ── Form ──────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-4 rounded-xl border border-[#2A2A2A] bg-[#141414] p-6">

      {/* Row 1: Venue name + Website */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass}>
            Venue Name <span className="text-[#C9A84C]">*</span>
          </label>
          <input
            type="text"
            value={fields.venue_name}
            onChange={(e) => set("venue_name", e.target.value)}
            placeholder="e.g. Zouk"
            className={inputCls(!!errors.venue_name)}
          />
          {errors.venue_name && (
            <p className="mt-1 text-xs text-red-400">{errors.venue_name}</p>
          )}
        </div>
        <div>
          <label className={labelClass}>Venue Website</label>
          <input
            type="url"
            value={fields.venue_website}
            onChange={(e) => set("venue_website", e.target.value)}
            placeholder="https://"
            className={inputCls(!!errors.venue_website)}
          />
        </div>
      </div>

      {/* Row 2: Category + Neighbourhood */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass}>Category</label>
          <select
            value={fields.venue_category}
            onChange={(e) => set("venue_category", e.target.value)}
            className={selectClass}
          >
            <option value="">Select category</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass}>Neighbourhood</label>
          <select
            value={fields.venue_neighbourhood}
            onChange={(e) => set("venue_neighbourhood", e.target.value)}
            className={selectClass}
          >
            <option value="">Select neighbourhood</option>
            {NEIGHBOURHOODS.map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Row 3: Contact name + email */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass}>
            Contact Name <span className="text-[#C9A84C]">*</span>
          </label>
          <input
            type="text"
            value={fields.contact_name}
            onChange={(e) => set("contact_name", e.target.value)}
            placeholder="Your name"
            className={inputCls(!!errors.contact_name)}
          />
          {errors.contact_name && (
            <p className="mt-1 text-xs text-red-400">{errors.contact_name}</p>
          )}
        </div>
        <div>
          <label className={labelClass}>
            Contact Email <span className="text-[#C9A84C]">*</span>
          </label>
          <input
            type="email"
            value={fields.contact_email}
            onChange={(e) => set("contact_email", e.target.value)}
            placeholder="you@email.com"
            className={inputCls(!!errors.contact_email)}
          />
          {errors.contact_email && (
            <p className="mt-1 text-xs text-red-400">{errors.contact_email}</p>
          )}
        </div>
      </div>

      {/* Message */}
      <div>
        <label className={labelClass}>Message / Additional Info</label>
        <textarea
          value={fields.message}
          onChange={(e) => set("message", e.target.value)}
          rows={4}
          placeholder="Tell us about your venue — events, vibe, capacity, upcoming programming…"
          className="w-full resize-none rounded-lg border border-[#2A2A2A] bg-[#1C1C1C] px-3 py-2.5 text-sm text-[#F0EDE6] placeholder-[#A89F8C] outline-none transition-colors focus:border-[#C9A84C]/60"
        />
      </div>

      {serverErr && <p className="text-sm text-red-400">{serverErr}</p>}

      {/* Submit */}
      <div
        role="button"
        tabIndex={0}
        onClick={loading ? undefined : submit}
        onKeyDown={(e) => !loading && e.key === "Enter" && submit()}
        aria-disabled={loading}
        className={`flex w-full select-none items-center justify-center rounded-lg bg-[#C9A84C] py-3 text-sm font-semibold text-[#0D0D0D] transition-opacity duration-200 ${
          loading ? "cursor-not-allowed opacity-60" : "cursor-pointer hover:opacity-90"
        }`}
      >
        {loading ? "Submitting…" : "Submit Venue"}
      </div>
    </div>
  );
}
