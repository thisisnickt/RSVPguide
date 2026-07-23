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

interface SyncResult {
  timestamp: string;
  inserted: number;
  refreshed: number;
  unmatched: number;
  sources: { eventbrite: number; resident_advisor: number };
}

// ── sessionStorage helpers ────────────────────────────────────────────────────
// sessionStorage clears automatically when the browser tab is closed.

const SS_KEY = "rsvpguide_admin";

function ssGet(): string {
  try { return sessionStorage.getItem(SS_KEY) ?? ""; } catch { return ""; }
}
function ssSet(v: string) {
  try { sessionStorage.setItem(SS_KEY, v); } catch {}
}
function ssClear() {
  try { sessionStorage.removeItem(SS_KEY); } catch {}
}

// ── Shared input / label styles ───────────────────────────────────────────────

const inputCls = "w-full rounded-lg border border-[#2A2A2A] bg-[#1C1C1C] px-4 py-2.5 text-sm text-[#F0EDE6] outline-none focus:border-[#C9A84C]/50";

// ── Component ─────────────────────────────────────────────────────────────────

export default function AdminPage() {
  const [keyInput,     setKeyInput]     = useState("");
  const [key,          setKey]          = useState("");
  const [authed,       setAuthed]       = useState(false);
  const [authError,    setAuthError]    = useState("");
  const [loading,      setLoading]      = useState(false);
  const [submissions,  setSubmissions]  = useState<Submission[]>([]);
  const [stats,        setStats]        = useState<Stats | null>(null);
  const [patchState,   setPatchState]   = useState<Record<string, "loading" | "error">>({});
  const [syncing,      setSyncing]      = useState(false);
  const [syncResult,   setSyncResult]   = useState<SyncResult | null>(null);
  const [syncError,    setSyncError]    = useState<string | null>(null);

  // ── API helpers ─────────────────────────────────────────────────────────────

  const apiFetch = useCallback(
    (url: string, opts?: RequestInit) =>
      fetch(url, {
        ...opts,
        headers: {
          "x-admin-key": key,
          "Content-Type": "application/json",
          ...opts?.headers,
        },
      }),
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
        ssClear();
        return;
      }

      const { submissions: subs } = await subsRes.json();
      const statsData             = await statsRes.json();

      setSubmissions(subs ?? []);
      setStats(statsData);
      setKey(adminKey);
      ssSet(adminKey);
      setAuthed(true);
    } catch {
      setAuthError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  // ── On mount: check sessionStorage ─────────────────────────────────────────

  useEffect(() => {
    const stored = ssGet();
    if (stored) loadData(stored);
  }, [loadData]);

  // ── Submission actions ──────────────────────────────────────────────────────

  const patch = async (id: string, status: "approved" | "rejected") => {
    setPatchState((p) => ({ ...p, [id]: "loading" }));
    try {
      const res = await apiFetch("/api/admin/submissions", {
        method: "PATCH",
        body: JSON.stringify({ id, status }),
      });
      if (!res.ok) throw new Error();
      setSubmissions((prev) => prev.filter((s) => s.id !== id));
    } catch {
      setPatchState((p) => ({ ...p, [id]: "error" }));
    }
  };

  // ── Sync trigger ────────────────────────────────────────────────────────────

  const triggerSync = async () => {
    setSyncing(true);
    setSyncError(null);
    try {
      const res = await apiFetch("/api/admin/sync", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Sync failed");
      setSyncResult({ timestamp: new Date().toISOString(), ...data });
    } catch (e) {
      setSyncError(e instanceof Error ? e.message : "Sync failed");
    } finally {
      setSyncing(false);
    }
  };

  const signOut = () => {
    ssClear();
    setAuthed(false);
    setKey("");
    setKeyInput("");
    setSubmissions([]);
    setStats(null);
    setSyncResult(null);
  };

  // ── Login form ──────────────────────────────────────────────────────────────

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
              className={inputCls}
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

  // ── Dashboard ───────────────────────────────────────────────────────────────

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 space-y-10">

      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="font-playfair text-3xl font-bold text-[#F0EDE6]">Admin Dashboard</h1>
        <button type="button" onClick={signOut}
          className="text-sm text-[#A89F8C] transition-colors hover:text-[#F0EDE6]">
          Sign out
        </button>
      </div>

      {/* ── Section B: Stats ────────────────────────────────────────────────── */}
      {stats && (
        <section>
          <h2 className="mb-4 text-[11px] font-semibold uppercase tracking-widest text-[#C9A84C]">
            Overview
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: "Active venues",    value: stats.venues },
              { label: "Upcoming events",  value: stats.events },
              { label: "Subscribers",      value: stats.subscribers },
              { label: "Pending reviews",  value: stats.pending },
            ].map(({ label, value }) => (
              <div key={label}
                className="rounded-lg border border-[#2A2A2A] bg-[#141414] p-4 text-center">
                <p className="font-playfair text-3xl font-bold text-[#C9A84C]">{value}</p>
                <p className="mt-0.5 text-xs text-[#A89F8C]">{label}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Section C: Quick actions ─────────────────────────────────────────── */}
      <section>
        <h2 className="mb-4 text-[11px] font-semibold uppercase tracking-widest text-[#C9A84C]">
          Quick actions
        </h2>
        <div className="rounded-xl border border-[#2A2A2A] bg-[#141414] p-5">
          <div className="flex flex-wrap items-center gap-4">
            <button
              type="button"
              disabled={syncing}
              onClick={triggerSync}
              className="rounded-lg bg-[#C9A84C] px-5 py-2 text-sm font-semibold text-[#0D0D0D] transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {syncing ? "Syncing…" : "Sync events from Eventbrite + RA"}
            </button>

            {syncResult && (
              <p className="text-xs text-[#A89F8C]">
                Last sync{" "}
                <span className="text-[#F0EDE6]">
                  {new Date(syncResult.timestamp).toLocaleString("en-SG")}
                </span>{" "}
                — {syncResult.inserted} new · {syncResult.refreshed} refreshed ·{" "}
                {syncResult.unmatched} unmatched
                {" "}({syncResult.sources.eventbrite} Eventbrite ·{" "}
                {syncResult.sources.resident_advisor} RA)
              </p>
            )}
          </div>

          {syncError && (
            <p className="mt-3 text-sm text-red-400">{syncError}</p>
          )}
        </div>
      </section>

      {/* ── Section A: Pending submissions ───────────────────────────────────── */}
      <section>
        <h2 className="mb-4 text-[11px] font-semibold uppercase tracking-widest text-[#C9A84C]">
          Pending submissions{submissions.length > 0 ? ` (${submissions.length})` : ""}
        </h2>

        {loading ? (
          <p className="text-sm text-[#A89F8C]">Loading…</p>
        ) : submissions.length === 0 ? (
          <div className="rounded-xl border border-[#2A2A2A] bg-[#141414] p-8 text-center">
            <p className="text-sm text-[#A89F8C]">No pending submissions.</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-[#2A2A2A]">
            <table className="w-full min-w-[720px] text-sm">
              <thead>
                <tr className="border-b border-[#2A2A2A] bg-[#1C1C1C] text-left">
                  {["Date", "Venue name", "Category", "Contact", "Email", "Message", "Actions"].map(
                    (h) => (
                      <th key={h}
                        className="px-4 py-3 text-[11px] font-semibold uppercase tracking-widest text-[#A89F8C]">
                        {h}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2A2A2A] bg-[#141414]">
                {submissions.map((s) => (
                  <tr key={s.id} className="transition-colors hover:bg-[#1C1C1C]">
                    <td className="whitespace-nowrap px-4 py-3 text-[#A89F8C]">
                      {new Date(s.created_at).toLocaleDateString("en-SG", {
                        day: "numeric", month: "short",
                      })}
                    </td>
                    <td className="px-4 py-3 font-medium text-[#F0EDE6]">{s.venue_name}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-[#A89F8C]">
                      {s.venue_category ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-[#A89F8C]">{s.contact_name}</td>
                    <td className="px-4 py-3 text-[#A89F8C]">
                      <a href={`mailto:${s.contact_email}`}
                        className="hover:text-[#C9A84C] transition-colors">
                        {s.contact_email}
                      </a>
                    </td>
                    <td className="max-w-[220px] px-4 py-3 text-[#A89F8C]">
                      <p className="line-clamp-2">{s.message ?? "—"}</p>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <div className="flex gap-2">
                        <button
                          type="button"
                          disabled={patchState[s.id] === "loading"}
                          onClick={() => patch(s.id, "approved")}
                          className="rounded border border-emerald-600 px-3 py-1 text-xs font-medium text-emerald-400 transition-colors hover:bg-emerald-600 hover:text-white disabled:opacity-50"
                        >
                          Approve
                        </button>
                        <button
                          type="button"
                          disabled={patchState[s.id] === "loading"}
                          onClick={() => patch(s.id, "rejected")}
                          className="rounded border border-red-700 px-3 py-1 text-xs font-medium text-red-400 transition-colors hover:bg-red-700 hover:text-white disabled:opacity-50"
                        >
                          Reject
                        </button>
                      </div>
                      {patchState[s.id] === "error" && (
                        <p className="mt-1 text-[10px] text-red-400">Failed</p>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
