"use client";

import { useCallback, useEffect, useState } from "react";
import type { Submission } from "@/lib/types";

// ── Types ─────────────────────────────────────────────────────────────────────

interface Stats {
  venues: number;
  events: number;
  subscribers: number;
  pending: number;
}

// ── Cookie helpers ────────────────────────────────────────────────────────────

const COOKIE = "rsvpguide_admin";

function readCookie(): string {
  if (typeof document === "undefined") return "";
  const m = document.cookie.match(new RegExp(`(?:^|; )${COOKIE}=([^;]*)`));
  return m ? decodeURIComponent(m[1]) : "";
}

function writeCookie(value: string) {
  document.cookie = `${COOKIE}=${encodeURIComponent(value)}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Strict`;
}

function clearCookie() {
  document.cookie = `${COOKIE}=; path=/; max-age=0`;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function AdminPage() {
  const [key,          setKey]          = useState("");
  const [keyInput,     setKeyInput]     = useState("");
  const [authed,       setAuthed]       = useState(false);
  const [authError,    setAuthError]    = useState("");
  const [loading,      setLoading]      = useState(false);
  const [submissions,  setSubmissions]  = useState<Submission[]>([]);
  const [stats,        setStats]        = useState<Stats | null>(null);
  const [patchStatus,  setPatchStatus]  = useState<Record<string, string>>({});

  // ── API helpers ─────────────────────────────────────────────────────────────

  const adminFetch = useCallback(
    (url: string, opts?: RequestInit) =>
      fetch(url, { ...opts, headers: { "x-admin-key": key, "Content-Type": "application/json", ...opts?.headers } }),
    [key]
  );

  const loadData = useCallback(async (adminKey: string) => {
    setLoading(true);
    setAuthError("");
    try {
      const [subsRes, statsRes] = await Promise.all([
        fetch("/api/admin/submissions", { headers: { "x-admin-key": adminKey } }),
        fetch("/api/admin/stats",       { headers: { "x-admin-key": adminKey } }),
      ]);

      if (subsRes.status === 401 || statsRes.status === 401) {
        setAuthError("Invalid admin key.");
        setAuthed(false);
        clearCookie();
        return;
      }

      const { submissions: subs } = await subsRes.json();
      const statsData             = await statsRes.json();

      setSubmissions(subs ?? []);
      setStats(statsData);
      setAuthed(true);
      setKey(adminKey);
      writeCookie(adminKey);
    } catch {
      setAuthError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  // ── On mount: check cookie ───────────────────────────────────────────────────

  useEffect(() => {
    const stored = readCookie();
    if (stored) loadData(stored);
  }, [loadData]);

  // ── Patch submission status ──────────────────────────────────────────────────

  const patch = async (id: string, status: "approved" | "rejected") => {
    setPatchStatus((p) => ({ ...p, [id]: "loading" }));
    try {
      const res = await adminFetch("/api/admin/submissions", {
        method: "PATCH",
        body: JSON.stringify({ id, status }),
      });
      if (!res.ok) throw new Error();
      setSubmissions((prev) => prev.filter((s) => s.id !== id));
      setPatchStatus((p) => ({ ...p, [id]: "done" }));
    } catch {
      setPatchStatus((p) => ({ ...p, [id]: "error" }));
    }
  };

  // ── Login form ───────────────────────────────────────────────────────────────

  if (!authed) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4">
        <div className="w-full max-w-sm rounded-xl border border-[#2A2A2A] bg-[#141414] p-8">
          <h1 className="font-playfair text-2xl font-bold text-[#F0EDE6]">Admin</h1>
          <p className="mt-1 text-sm text-[#A89F8C]">Enter your admin key to continue.</p>
          <div className="mt-6 space-y-3">
            <input
              type="password"
              value={keyInput}
              onChange={(e) => setKeyInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && keyInput && loadData(keyInput)}
              placeholder="Admin key"
              className="w-full rounded-lg border border-[#2A2A2A] bg-[#1C1C1C] px-4 py-2.5 text-sm text-[#F0EDE6] outline-none focus:border-[#C9A84C]/50"
            />
            {authError && <p className="text-xs text-red-400">{authError}</p>}
            <button
              type="button"
              disabled={!keyInput || loading}
              onClick={() => loadData(keyInput)}
              className="w-full rounded-lg bg-[#C9A84C] py-2.5 text-sm font-semibold text-[#0D0D0D] transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {loading ? "Verifying…" : "Sign in"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Dashboard ────────────────────────────────────────────────────────────────

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="font-playfair text-3xl font-bold text-[#F0EDE6]">Admin</h1>
        <button
          type="button"
          onClick={() => { clearCookie(); setAuthed(false); setKey(""); }}
          className="text-sm text-[#A89F8C] hover:text-[#F0EDE6]"
        >
          Sign out
        </button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: "Total venues",    value: stats.venues },
            { label: "Active events",   value: stats.events },
            { label: "Subscribers",     value: stats.subscribers },
            { label: "Pending reviews", value: stats.pending },
          ].map(({ label, value }) => (
            <div key={label} className="rounded-lg border border-[#2A2A2A] bg-[#141414] p-4 text-center">
              <p className="font-playfair text-2xl font-bold text-[#C9A84C]">{value}</p>
              <p className="mt-0.5 text-xs text-[#A89F8C]">{label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Submissions */}
      <h2 className="mb-4 text-lg font-semibold text-[#F0EDE6]">
        Pending submissions{submissions.length > 0 ? ` (${submissions.length})` : ""}
      </h2>

      {loading ? (
        <p className="text-sm text-[#A89F8C]">Loading…</p>
      ) : submissions.length === 0 ? (
        <p className="rounded-lg border border-[#2A2A2A] bg-[#141414] p-6 text-center text-sm text-[#A89F8C]">
          No pending submissions.
        </p>
      ) : (
        <div className="space-y-3">
          {submissions.map((s) => (
            <div
              key={s.id}
              className="rounded-lg border border-[#2A2A2A] bg-[#141414] p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-[#F0EDE6]">{s.venue_name}</p>
                  <p className="text-sm text-[#A89F8C]">
                    {s.contact_name} &middot; {s.contact_email}
                  </p>
                  {(s.venue_category || s.venue_neighbourhood) && (
                    <p className="mt-1 text-xs text-[#A89F8C]">
                      {[s.venue_category, s.venue_neighbourhood].filter(Boolean).join(" · ")}
                    </p>
                  )}
                  {s.message && (
                    <p className="mt-2 text-sm text-[#A89F8C] line-clamp-2">{s.message}</p>
                  )}
                  <p className="mt-1 text-[11px] text-[#A89F8C]/60">
                    {new Date(s.created_at).toLocaleDateString("en-SG", {
                      day: "numeric", month: "short", year: "numeric",
                    })}
                  </p>
                </div>

                <div className="flex gap-2 flex-shrink-0">
                  <button
                    type="button"
                    disabled={patchStatus[s.id] === "loading"}
                    onClick={() => patch(s.id, "approved")}
                    className="rounded-lg bg-emerald-700 px-3 py-1.5 text-xs font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                  >
                    Approve
                  </button>
                  <button
                    type="button"
                    disabled={patchStatus[s.id] === "loading"}
                    onClick={() => patch(s.id, "rejected")}
                    className="rounded-lg border border-[#2A2A2A] bg-[#1C1C1C] px-3 py-1.5 text-xs font-semibold text-[#A89F8C] transition-colors hover:border-red-500/50 hover:text-red-400 disabled:opacity-50"
                  >
                    Reject
                  </button>
                </div>
              </div>
              {patchStatus[s.id] === "error" && (
                <p className="mt-2 text-xs text-red-400">Update failed — try again.</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
