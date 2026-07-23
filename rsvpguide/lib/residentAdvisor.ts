/**
 * Resident Advisor GraphQL integration — server-side only.
 *
 * ⚠  RA does not publish an official public API. This uses their internal
 *    GraphQL endpoint (https://ra.co/graphql) which their web app queries.
 *    Monitor for rate limiting and schema changes. A 1-second delay is
 *    inserted between paginated requests.
 *
 * Singapore area ID on RA = 11.
 * Fetches events for the next 30 days, up to 2 pages (40 events).
 */

import { createAdminClient } from "./supabase";
import type { EventInsert, PerformerType } from "./types";

const RA_GRAPHQL = "https://ra.co/graphql";
const SINGAPORE_AREA_ID = 11;
const PAGE_SIZE = 20;
const MAX_PAGES = 2;
const REQUEST_DELAY_MS = 1000; // respect unofficial rate limit

// ── Raw RA GraphQL shapes ─────────────────────────────────────────────────────

interface RAVenue {
  id: string;
  name: string;
  address?: string;
}

interface RAArtist {
  id: string;
  name: string;
}

interface RAEventData {
  id: string;
  title: string;
  contentUrl?: string;  // e.g. "/events/12345"
  date?: string;        // ISO date "YYYY-MM-DD"
  startTime?: string;   // "HH:MM:SS" or "HH:MM"
  endTime?: string;
  images?: { filename: string }[];
  venue?: RAVenue;
  artists?: RAArtist[];
}

interface RAListing {
  id: string;
  listingDate?: string;
  event: RAEventData;
}

interface RAResponse {
  data?: {
    eventListings?: {
      data: RAListing[];
      totalResults?: number;
    };
  };
  errors?: { message: string }[];
}

// ── GraphQL query ─────────────────────────────────────────────────────────────

const QUERY = `
  query RSVPGuideEventListings($filters: FilterInputDtoInput, $pageSize: Int, $page: Int) {
    eventListings(filters: $filters, pageSize: $pageSize, page: $page) {
      data {
        id
        listingDate
        event {
          id
          title
          contentUrl
          date
          startTime
          endTime
          images { filename }
          venue {
            id
            name
            address
          }
          artists {
            id
            name
          }
        }
      }
      totalResults
    }
  }
`;

// ── Venue matching (shared with Eventbrite) ───────────────────────────────────

function normaliseName(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function matchVenueId(
  raVenueName: string | undefined,
  venueMap: Map<string, string>
): string | null {
  if (!raVenueName) return null;
  const norm = normaliseName(raVenueName);
  if (venueMap.has(norm)) return venueMap.get(norm)!;
  for (const [key, id] of Array.from(venueMap.entries())) {
    if (norm.includes(key) || key.includes(norm)) return id;
  }
  return null;
}

// ── Infer performer type from artist count / event title ─────────────────────

function inferPerformerType(artists: RAArtist[], title: string): PerformerType | null {
  if (!artists.length) return null;
  const t = title.toLowerCase();
  if (t.includes("live") || t.includes("band")) return "Live Band";
  if (t.includes("dj") || t.includes("dj set")) return "DJ";
  return "DJ"; // most RA club events feature DJs
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// ── Fetch a single page ───────────────────────────────────────────────────────

async function fetchPage(
  fromDate: string,
  toDate: string,
  page: number
): Promise<RAListing[]> {
  const variables = {
    filters: {
      areas: { id: SINGAPORE_AREA_ID },
      listingDate: { gte: fromDate, lte: toDate },
    },
    pageSize: PAGE_SIZE,
    page,
  };

  const res = await fetch(RA_GRAPHQL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      // RA requires a Referer header to serve responses
      Referer: "https://ra.co",
      Origin: "https://ra.co",
      "User-Agent":
        "Mozilla/5.0 (compatible; RSVPGuide/1.0; +https://rsvpguide.com)",
    },
    body: JSON.stringify({ query: QUERY, variables }),
    next: { revalidate: 0 },
  });

  if (!res.ok) {
    throw new Error(`[ra] HTTP ${res.status} ${res.statusText}`);
  }

  const json = (await res.json()) as RAResponse;

  if (json.errors?.length) {
    throw new Error(`[ra] GraphQL error: ${json.errors[0].message}`);
  }

  return json.data?.eventListings?.data ?? [];
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Fetches upcoming Singapore club / nightlife events from Resident Advisor's
 * GraphQL API, fuzzy-matches venues, and returns EventInsert rows.
 *
 * source is stored as `ra:{listing_id}` for idempotent re-syncing.
 *
 * SERVER-SIDE ONLY.
 */
export async function fetchRASingaporeEvents(): Promise<EventInsert[]> {
  // Load venues for in-memory matching
  const supabase = createAdminClient();
  const { data: venueRows } = await supabase
    .from("venues")
    .select("id, name")
    .eq("is_active", true);
  const venueMap = new Map<string, string>(
    (venueRows ?? []).map((v) => [normaliseName(v.name), v.id])
  );

  const today = new Date().toISOString().split("T")[0];
  const in30  = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
                  .toISOString().split("T")[0];

  const allListings: RAListing[] = [];

  for (let page = 1; page <= MAX_PAGES; page++) {
    try {
      const listings = await fetchPage(today, in30, page);
      allListings.push(...listings);
      if (listings.length < PAGE_SIZE) break; // last page
      if (page < MAX_PAGES) await sleep(REQUEST_DELAY_MS);
    } catch (e) {
      console.error(`[ra] Page ${page} failed:`, e instanceof Error ? e.message : e);
      break; // stop on error — use whatever we have
    }
  }

  const results: EventInsert[] = [];

  for (const listing of allListings) {
    const ev = listing.event;
    if (!ev?.title) continue;

    const artists = ev.artists ?? [];
    const dateStr = ev.date ?? listing.listingDate ?? null;
    if (!dateStr) continue;

    results.push({
      venue_id:          matchVenueId(ev.venue?.name, venueMap),
      title:             ev.title,
      description:       null,
      event_date:        dateStr,
      start_time:        ev.startTime ?? null,
      end_time:          ev.endTime   ?? null,
      is_recurring:      false,
      recurrence_pattern:null,
      ticket_url:        ev.contentUrl ? `https://ra.co${ev.contentUrl}` : null,
      ticket_price:      null,
      performer_name:    artists[0]?.name ?? null,
      performer_type:    inferPerformerType(artists, ev.title),
      source:            `ra:${listing.id}`,
      is_active:         true,
    });
  }

  console.log(`[ra] Fetched ${results.length} events`);
  return results;
}
