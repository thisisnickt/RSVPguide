export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";
import type { Event, Venue } from "@/lib/types";

type EventWithVenue = Event & {
  venue: Pick<Venue, "name" | "slug" | "neighbourhood">;
};

// ── GET /api/events ───────────────────────────────────────────────────────────
// Query params:
//   from_date?  ISO date, default: today
//   to_date?    ISO date, default: today + 14 days
//   venue_id?   UUID, filter to a single venue
//   limit?      default 20, max 100

export async function GET(request: NextRequest) {
  try {
    const sp = new URL(request.url).searchParams;

    const today   = new Date().toISOString().split("T")[0];
    const in14    = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
                      .toISOString().split("T")[0];

    const fromDate = sp.get("from_date") ?? today;
    const toDate   = sp.get("to_date")   ?? in14;
    const venueId  = sp.get("venue_id")  ?? null;
    const limit    = Math.min(Math.max(parseInt(sp.get("limit") ?? "20", 10), 1), 100);

    // Basic date validation
    if (fromDate > toDate) {
      return NextResponse.json(
        { error: "from_date must not be after to_date" },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    let query = supabase
      .from("events")
      .select("*, venue:venues(name, slug, neighbourhood)")
      .eq("is_active", true)
      .gte("event_date", fromDate)
      .lte("event_date", toDate)
      .order("event_date",  { ascending: true })
      .order("start_time",  { ascending: true })
      .limit(limit);

    if (venueId) query = query.eq("venue_id", venueId);

    const { data, error } = await query;

    if (error) throw error;

    return NextResponse.json({
      events: (data ?? []) as EventWithVenue[],
    });
  } catch (e) {
    console.error("[GET /api/events]", e);
    return NextResponse.json({ error: "Failed to fetch events" }, { status: 500 });
  }
}
