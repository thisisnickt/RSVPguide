export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";
import { fetchSingaporeNightlifeEvents } from "@/lib/eventbrite";
import { fetchRASingaporeEvents }         from "@/lib/residentAdvisor";
import type { EventInsert } from "@/lib/types";

function requireAdminKey(req: NextRequest): NextResponse | null {
  const expected = process.env.ADMIN_SECRET_KEY;
  if (!expected)
    return NextResponse.json({ error: "Not configured" }, { status: 503 });
  if (req.headers.get("x-admin-key") !== expected)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return null;
}

// ── POST /api/admin/sync ──────────────────────────────────────────────────────
// Triggers the Eventbrite + RA sync from the admin dashboard.
// Protected by x-admin-key (ADMIN_SECRET_KEY) rather than SYNC_SECRET_KEY,
// so the admin dashboard only needs to know one key.

export async function POST(request: NextRequest) {
  const authErr = requireAdminKey(request);
  if (authErr) return authErr;

  const supabase = createAdminClient();
  const today    = new Date().toISOString().split("T")[0];

  const [eventbriteEvents, raEvents] = await Promise.all([
    fetchSingaporeNightlifeEvents().catch((e) => {
      console.error("[admin/sync] Eventbrite:", e instanceof Error ? e.message : e);
      return [] as EventInsert[];
    }),
    fetchRASingaporeEvents().catch((e) => {
      console.error("[admin/sync] RA:", e instanceof Error ? e.message : e);
      return [] as EventInsert[];
    }),
  ]);

  const allEvents = [...eventbriteEvents, ...raEvents];

  if (allEvents.length === 0) {
    return NextResponse.json({
      inserted: 0, refreshed: 0, unmatched: 0,
      sources: { eventbrite: 0, resident_advisor: 0 },
      message: "No events returned from either source",
    });
  }

  // Count existing synced events before deletion
  const { count: existingCount } = await supabase
    .from("events")
    .select("id", { count: "exact", head: true })
    .gte("event_date", today)
    .or("source.like.eventbrite:%,source.like.ra:%");

  const previousCount = existingCount ?? 0;

  // Delete + re-insert
  await Promise.all([
    supabase.from("events").delete().gte("event_date", today).like("source", "eventbrite:%"),
    supabase.from("events").delete().gte("event_date", today).like("source", "ra:%"),
  ]);

  const { error: insError } = await supabase.from("events").insert(allEvents);

  if (insError) {
    return NextResponse.json({ error: insError.message }, { status: 500 });
  }

  return NextResponse.json({
    inserted:  Math.max(0, allEvents.length - previousCount),
    refreshed: Math.min(allEvents.length, previousCount),
    unmatched: allEvents.filter((e) => !e.venue_id).length,
    sources: {
      eventbrite:       eventbriteEvents.length,
      resident_advisor: raEvents.length,
    },
  });
}
