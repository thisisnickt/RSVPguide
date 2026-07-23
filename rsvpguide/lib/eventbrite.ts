/**
 * Eventbrite API integration — server-side only.
 *
 * Requires EVENTBRITE_API_KEY in environment.
 * Uses Eventbrite Search API v3 to fetch upcoming Singapore nightlife events
 * and fuzzy-matches each event's venue against our Supabase venues table.
 */

import { createAdminClient } from "./supabase";
import type { EventInsert } from "./types";

// ── Raw Eventbrite API shapes ─────────────────────────────────────────────────

interface EBText    { text: string }
interface EBDateTime { utc: string; local: string } // local = "YYYY-MM-DDTHH:MM:SS"

interface EBPrice {
  currency: string;
  major_value: string; // e.g. "35.00"
  display: string;     // e.g. "SGD 35.00"
}

interface EBTicketAvailability {
  is_free: boolean;
  minimum_ticket_price?: EBPrice;
}

interface EBVenue {
  id: string;
  name: string;
}

interface EBEvent {
  id: string;
  name: EBText;
  description: EBText;
  start: EBDateTime;
  end: EBDateTime;
  url: string;
  is_free: boolean;
  ticket_availability?: EBTicketAvailability;
  venue?: EBVenue;
}

interface EBSearchResponse {
  events?: EBEvent[];
  error_description?: string;
}

// ── Venue matching helpers ────────────────────────────────────────────────────

function normaliseName(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function buildVenueMap(
  rows: { id: string; name: string }[]
): Map<string, string> {
  const map = new Map<string, string>();
  for (const r of rows) map.set(normaliseName(r.name), r.id);
  return map;
}

function matchVenueId(
  ebVenueName: string | undefined,
  venueMap: Map<string, string>
): string | null {
  if (!ebVenueName) return null;
  const norm = normaliseName(ebVenueName);

  // 1. Exact normalised match
  if (venueMap.has(norm)) return venueMap.get(norm)!;

  // 2. Our venue name is contained in the Eventbrite venue name, or vice versa
  for (const [key, id] of Array.from(venueMap.entries())) {
    if (norm.includes(key) || key.includes(norm)) return id;
  }

  return null;
}

// ── Price formatting ──────────────────────────────────────────────────────────

function formatPrice(ev: EBEvent): string | null {
  if (ev.is_free) return "Free";
  const price = ev.ticket_availability?.minimum_ticket_price;
  return price ? `From ${price.display}` : null;
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Fetches upcoming Singapore nightlife / music events from Eventbrite,
 * fuzzy-matches each event's venue against our Supabase venues table, and
 * returns an array of EventInsert rows ready to upsert.
 *
 * source is stored as `eventbrite:{event_id}` for idempotent re-syncing.
 *
 * SERVER-SIDE ONLY.
 */
export async function fetchSingaporeNightlifeEvents(): Promise<EventInsert[]> {
  const apiKey = process.env.EVENTBRITE_API_KEY;
  if (!apiKey) {
    console.warn("[eventbrite] EVENTBRITE_API_KEY is not set — skipping");
    return [];
  }

  // Load venues for in-memory matching (one DB round-trip total)
  const supabase = createAdminClient();
  const { data: venueRows } = await supabase
    .from("venues")
    .select("id, name")
    .eq("is_active", true);
  const venueMap = buildVenueMap(venueRows ?? []);

  // Build date range: now → +30 days
  const now  = new Date();
  const in30 = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  const url = new URL("https://www.eventbriteapi.com/v3/events/search/");
  url.searchParams.set("location.address",      "Singapore");
  url.searchParams.set("categories",            "103");       // Music
  url.searchParams.set("subcategories",         "3.2");       // Club
  url.searchParams.set("start_date.range_start", now.toISOString());
  url.searchParams.set("start_date.range_end",  in30.toISOString());
  url.searchParams.set("expand",                "venue,ticket_availability");
  url.searchParams.set("page_size",             "50");

  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${apiKey}` },
    next: { revalidate: 0 }, // always fresh — never cache the sync call
  });

  if (!res.ok) {
    throw new Error(
      `[eventbrite] HTTP ${res.status} ${res.statusText}`
    );
  }

  const data = (await res.json()) as EBSearchResponse;

  if (data.error_description) {
    throw new Error(`[eventbrite] API error: ${data.error_description}`);
  }

  const results: EventInsert[] = [];

  for (const ev of data.events ?? []) {
    const [datePart, startPart] = ev.start.local.split("T");
    const [,         endPart]   = ev.end.local.split("T");

    results.push({
      venue_id:          matchVenueId(ev.venue?.name, venueMap),
      title:             ev.name.text,
      description:       ev.description?.text || null,
      event_date:        datePart,
      start_time:        startPart ?? null,
      end_time:          endPart   ?? null,
      is_recurring:      false,
      recurrence_pattern:null,
      ticket_url:        ev.url,
      ticket_price:      formatPrice(ev),
      performer_name:    null,
      performer_type:    null,
      source:            `eventbrite:${ev.id}`,
      is_active:         true,
    });
  }

  console.log(`[eventbrite] Fetched ${results.length} events`);
  return results;
}
