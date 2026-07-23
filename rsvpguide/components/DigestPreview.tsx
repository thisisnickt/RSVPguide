"use client";

import { useState } from "react";

export default function DigestPreview() {
  const [email, setEmail]     = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  const subscribe = async () => {
    const trimmed = email.trim();
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setError("Enter a valid email address.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/digest-subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmed }),
      });
      if (!res.ok) throw new Error();
      setSuccess(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="overflow-hidden rounded-xl border border-[#2A2A2A] bg-[#141414]">

      {/* Header band */}
      <div className="border-b border-[#2A2A2A] bg-[#1C1C1C] px-6 py-5">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-[#C9A84C]">
          Weekly digest
        </p>
        <h3 className="mt-1 font-playfair text-xl font-bold text-[#F0EDE6]">
          Get Singapore&apos;s best nights, weekly.
        </h3>
        <p className="mt-1 text-sm text-[#A89F8C]">
          Curated venues, upcoming events, and exclusive promotions — every Friday.
        </p>
      </div>

      {/* Input area */}
      <div className="px-6 py-5">
        {success ? (
          <div className="flex flex-col items-center gap-2 py-3 text-center">
            <span className="text-2xl text-[#C9A84C]">✦</span>
            <p className="font-playfair text-lg text-[#F0EDE6]">You&apos;re on the list.</p>
            <p className="text-sm text-[#A89F8C]">Expect us in your inbox this Friday.</p>
          </div>
        ) : (
          <>
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); if (error) setError(null); }}
                onKeyDown={(e) => e.key === "Enter" && !loading && subscribe()}
                placeholder="your@email.com"
                className="flex-1 rounded-lg border border-[#2A2A2A] bg-[#1C1C1C] px-4 py-2.5 text-sm text-[#F0EDE6] placeholder-[#A89F8C] outline-none transition-colors focus:border-[#C9A84C]/60"
              />
              <button
                type="button"
                onClick={subscribe}
                disabled={loading}
                className="rounded-lg bg-[#C9A84C] px-5 py-2.5 text-sm font-semibold text-[#0D0D0D] transition-opacity duration-200 hover:opacity-90 disabled:opacity-50"
              >
                {loading ? "…" : "Subscribe"}
              </button>
            </div>
            {error && (
              <p className="mt-2 text-xs text-red-400">{error}</p>
            )}
            <p className="mt-3 text-[11px] text-[#A89F8C]">
              No spam, ever. Unsubscribe any time.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
