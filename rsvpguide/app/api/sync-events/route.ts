export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";
import { fetchSingaporeNightlifeEvents } from "@/lib/eventbrite";
import { fetchRASingaporeEvents }         from "@/lib/residentAdvisor";
import type { EventInsert } from "@/lib/types";

// ── Auth helper ───────────────────────────────────────────────────────────────

function requireSyncKey(req: NextRequest): NextResponse | null {
  const expected = process.env.SYNC_SECRET_KEY;
  if (!expected)
    return NextResponse.json({ error: "SYNC_SECRET_KEY is not configured" }, { status: 503 });
  if (req.headers.get("x-sync-key") !== expected)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return null;
}

// ── POST /api/sync-events ─────────────────────────────────────────────────────
//
// Fetches upcoming Singapore events from Eventbrite and Resident Advisor in
// parallel, then syncs them into Supabase using a delete-then-insert strategy:
//
//   1. Delete all future events whose source starts with "eventbrite:" or "ra:"
//   2. Insert the full refreshed set
//
// This ensures the calendar always reflects the latest data from both platforms.
// Events manually entered (source = null or other prefix) are never touched.
//
// Returns: { inserted, refreshed, unmatched, sources }
//
// Requires header:  x-sync-key: <SYNC_SECRET_KEY>

export async function POST(request: NextRequest) {
  const authError = requireSyncKey(request);
  if (authError) return authError;

  const supabase = createAdminClient();
  const today    = new Date().toISOString().split("T")[0];

  // ── 1. Fetch from both sources in parallel ──────────────────────────────────

  const [eventbriteEvents, raEvents] = await Promise.all([
    fetchSingaporeNightlifeEvents().catch((e) => {
      console.error("[sync-events] Eventbrite fetch failed:", e instanceof Error ? e.message : e);
      return [] as EventInsert[];
    }),
    fetchRASingaporeEvents().catch((e) => {
      console.error("[sync-events] RA fetch failed:", e instanceof Error ? e.message : e);
      return [] as EventInsert[];
    }),
  ]);

  const allEvents = [...eventbriteEvents, ...raEvents];

  if (allEvents.length === 0) {
    return NextResponse.json({
      inserted: 0,
      refreshed: 0,
      unmatched: 0,
      sources: { eventbrite: 0, resident_advisor: 0 },
      message: "No events returned from either source",
    });
  }

  // ── 2. Count existing synced events (to distinguish insert vs refresh) ───────

  const { count: existingCount } = await supabase
    .from("events")
    .select("id", { count: "exact", head: true })
    .gte("event_date", today)
    .or("source.like.eventbrite:%,source.like.ra:%");

  const previousCount = existingCount ?? 0;

  // ── 3. Delete all future externally-synced events ────────────────────────────
  //      Two separate deletes because `.or()` with `.like()` is not reliably
  //      supported in all Supabase JS client versions.

  const [{ error: delEb }, { error: delRa }] = await Promise.all([
    supabase.from("events").delete()
      .gte("event_date", today)
      .like("source", "eventbrite:%"),
    supabase.from("events").delete()
      .gte("event_date", today)
      .like("source", "ra:%"),
  ]);

  if (delEb) console.error("[sync-events] Delete Eventbrite events:", delEb.message);
  if (delRa) console.error("[sync-events] Delete RA events:", delRa.message);

  // ── 4. Insert fresh events ───────────────────────────────────────────────────

  const { error: insError } = await supabase
    .from("events")
    .insert(allEvents);

  if (insError) {
    console.error("[sync-events] Insert error:", insError.message);
    return NextResponse.json(
      { error: "Failed to insert events", detail: insError.message },
      { status: 500 }
    );
  }

  // ── 5. Stats ─────────────────────────────────────────────────────────────────

  const unmatched  = allEvents.filter((e) => !e.venue_id).length;
  const refreshed  = Math.min(allEvents.length, previousCount);
  const inserted   = Math.max(0, allEvents.length - previousCount);

  console.log(
    `[sync-events] Done — ` +
    `${eventbriteEvents.length} from Eventbrite, ` +
    `${raEvents.length} from RA, ` +
    `${inserted} new, ${refreshed} refreshed, ${unmatched} unmatched`
  );

  return NextResponse.json({
    inserted,
    refreshed,
    unmatched,
    sources: {
      eventbrite:       eventbriteEvents.length,
      resident_advisor: raEvents.length,
    },
  });
}
