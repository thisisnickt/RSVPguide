export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";
import type { Event, Venue } from "@/lib/types";

// ── GET /api/venues/[slug] ────────────────────────────────────────────────────
// Returns the venue + all upcoming events for it.

export async function GET(
  _request: NextRequest,
  { params }: { params: { slug: string } }
) {
  const { slug } = params;

  if (!slug) {
    return NextResponse.json({ error: "Slug is required" }, { status: 400 });
  }

  try {
    const supabase = createAdminClient();
    const today = new Date().toISOString().split("T")[0];

    // Fetch venue and upcoming events in parallel
    const [venueResult, eventsResult] = await Promise.all([
      supabase
        .from("venues")
        .select("*")
        .eq("slug", slug)
        .eq("is_active", true)
        .single(),

      supabase
        .from("events")
        .select("*")
        .eq("is_active", true)
        .gte("event_date", today)
        .order("event_date", { ascending: true })
        .order("start_time", { ascending: true }),
    ]);

    if (venueResult.error) {
      // Supabase returns PGRST116 when no row is found with .single()
      if (venueResult.error.code === "PGRST116") {
        return NextResponse.json({ error: "Venue not found" }, { status: 404 });
      }
      throw venueResult.error;
    }

    if (!venueResult.data) {
      return NextResponse.json({ error: "Venue not found" }, { status: 404 });
    }

    // Filter events to only those belonging to this venue
    const venue = venueResult.data as Venue;
    const events = (eventsResult.data ?? []).filter(
      (e) => e.venue_id === venue.id
    ) as Event[];

    return NextResponse.json({ venue, events });
  } catch (e) {
    console.error(`[GET /api/venues/${slug}]`, e);
    return NextResponse.json({ error: "Failed to fetch venue" }, { status: 500 });
  }
}
