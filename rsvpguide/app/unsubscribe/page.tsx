"use client";

import { useState } from "react";
import Link from "next/link";

export default function UnsubscribePage() {
  const [email,   setEmail]   = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  const handleUnsubscribe = async () => {
    const trimmed = email.trim();
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setError("Enter a valid email address.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/digest-subscribe", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmed }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Request failed");
      }

      setSuccess(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="w-full max-w-md text-center">
        {success ? (
          <>
            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full border border-[#C9A84C]/30 bg-[#C9A84C]/10 text-2xl text-[#C9A84C]">
              ✓
            </div>
            <h1 className="font-playfair text-2xl font-bold text-[#F0EDE6]">
              You&apos;ve been unsubscribed.
            </h1>
            <p className="mt-3 text-sm text-[#A89F8C]">
              We&apos;ve removed{" "}
              <span className="text-[#F0EDE6]">{email}</span> from the weekly
              digest. You can re-subscribe any time from the homepage.
            </p>
            <Link
              href="/"
              className="mt-6 inline-block text-sm text-[#A89F8C] transition-colors hover:text-[#C9A84C]"
            >
              ← Back to RSVPguide
            </Link>
          </>
        ) : (
          <>
            <h1 className="font-playfair text-3xl font-bold text-[#F0EDE6]">
              Unsubscribe
            </h1>
            <p className="mt-3 text-sm text-[#A89F8C]">
              Enter your email address to unsubscribe from the RSVPguide weekly digest.
            </p>
            <div className="mt-8 space-y-3">
              <input
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); if (error) setError(null); }}
                onKeyDown={(e) => e.key === "Enter" && !loading && handleUnsubscribe()}
                placeholder="your@email.com"
                className="w-full rounded-lg border border-[#2A2A2A] bg-[#1C1C1C] px-4 py-3 text-sm text-[#F0EDE6] placeholder-[#A89F8C] outline-none focus:border-[#C9A84C]/50"
              />
              {error && <p className="text-xs text-red-400 text-left">{error}</p>}
              <button
                type="button"
                disabled={loading || !email}
                onClick={handleUnsubscribe}
                className="w-full rounded-lg bg-[#C9A84C] py-3 text-sm font-semibold text-[#0D0D0D] transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {loading ? "Processing…" : "Unsubscribe"}
              </button>
            </div>
            <Link
              href="/"
              className="mt-6 inline-block text-sm text-[#A89F8C] transition-colors hover:text-[#C9A84C]"
            >
              ← Back to RSVPguide
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
