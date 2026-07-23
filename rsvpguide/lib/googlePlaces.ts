/**
 * Server-side only — never import this module from a Client Component.
 *
 * Uses the Places API (New): https://places.googleapis.com/v1/
 *
 * The GOOGLE_PLACES_API_KEY env var is not prefixed with NEXT_PUBLIC_
 * and is therefore never sent to the browser.
 */

import type { GooglePlaceResult } from "./types";

const PLACES_BASE = "https://places.googleapis.com/v1";

// ── Internal API response shapes ──────────────────────────────────────────────

interface TextSearchPlace {
  id: string;
  displayName?: { text: string };
  formattedAddress?: string;
  nationalPhoneNumber?: string;
  internationalPhoneNumber?: string;
  rating?: number;
  websiteUri?: string;
  regularOpeningHours?: {
    weekdayDescriptions: string[];
  };
  photos?: PlacePhoto[];
}

interface PlacePhoto {
  name: string;   // full resource path: "places/{id}/photos/{ref}"
  widthPx: number;
  heightPx: number;
}

interface PhotoMediaResponse {
  name:     string;
  photoUri: string;   // direct CDN URL — lh3.googleusercontent.com
}

// ── In-memory caches ──────────────────────────────────────────────────────────
// Keyed by "placeName::neighbourhood".
// null entries prevent redundant retries within the same process lifetime.

const photoCache   = new Map<string, string | null>();
const detailsCache = new Map<string, GooglePlaceResult | null>();

function assertServerSide(): void {
  if (typeof window !== "undefined") {
    throw new Error(
      "[googlePlaces] This module is server-side only. " +
        "Do not import it in Client Components."
    );
  }
}

function buildCacheKey(placeName: string, neighbourhood: string): string {
  return `${placeName.toLowerCase().trim()}::${neighbourhood.toLowerCase().trim()}`;
}

function apiKey(): string {
  const key = process.env.GOOGLE_PLACES_API_KEY;
  if (!key) throw new Error("[googlePlaces] GOOGLE_PLACES_API_KEY is not set.");
  return key;
}

function placesHeaders(fieldMask: string): HeadersInit {
  return {
    "Content-Type":     "application/json",
    "X-Goog-Api-Key":   apiKey(),
    "X-Goog-FieldMask": fieldMask,
  };
}

// ── Internal helpers ──────────────────────────────────────────────────────────

/**
 * Text Search (New) — finds the best matching place.
 * Cached by Next.js data cache for 24 h.
 */
async function findPlace(
  placeName: string,
  neighbourhood: string
): Promise<TextSearchPlace | null> {
  const query = `${placeName} Singapore`;

  const res = await fetch(`${PLACES_BASE}/places:searchText`, {
    method:  "POST",
    headers: placesHeaders(
      "places.id,places.displayName,places.formattedAddress," +
      "places.internationalPhoneNumber,places.rating,places.websiteUri," +
      "places.regularOpeningHours,places.photos"
    ),
    body: JSON.stringify({ textQuery: query }),
    next: { revalidate: 86400 },
  });

  if (!res.ok) return null;

  const data = await res.json() as {
    places?: TextSearchPlace[];
    error?: { status: string; message: string };
  };

  if (data.error || !data.places?.length) return null;

  return data.places[0];
}

/**
 * Photo Media (New) — resolves a photo resource name to a CDN URL.
 * skipHttpRedirect=true returns JSON { photoUri } (lh3.googleusercontent.com)
 * rather than a 302 redirect — gives us a stable URL to store.
 */
async function resolvePhotoUrl(photoName: string): Promise<string | null> {
  const url = new URL(`${PLACES_BASE}/${photoName}/media`);
  url.searchParams.set("maxWidthPx",       "800");
  url.searchParams.set("skipHttpRedirect", "true");
  url.searchParams.set("key",              apiKey());

  const res  = await fetch(url.toString(), { next: { revalidate: 86400 } });
  if (!res.ok) return null;

  const data = await res.json() as PhotoMediaResponse | { error?: unknown };
  if ("error" in data || !("photoUri" in data)) return null;

  return (data as PhotoMediaResponse).photoUri;
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Returns a photo URL (800 px wide) for the given venue, or null if the
 * venue cannot be found or has no photos.
 *
 * Dual-layer caching: in-memory Map + Next.js data cache (24 h).
 * SERVER-SIDE ONLY.
 */
export async function getVenuePhoto(
  placeName: string,
  neighbourhood: string
): Promise<string | null> {
  assertServerSide();

  const key = buildCacheKey(placeName, neighbourhood);
  if (photoCache.has(key)) return photoCache.get(key) ?? null;

  try {
    const place    = await findPlace(placeName, neighbourhood);
    const photoName = place?.photos?.[0]?.name ?? null;
    if (!photoName) { photoCache.set(key, null); return null; }

    const url = await resolvePhotoUrl(photoName);
    photoCache.set(key, url);
    return url;
  } catch {
    photoCache.set(key, null);
    return null;
  }
}

/**
 * Returns enriched venue details from the Places API (New), or null if the
 * venue cannot be found or the API call fails.
 *
 * Warms the photoCache as a side-effect so getVenuePhoto never needs a
 * separate lookup for the same venue.
 *
 * Dual-layer caching: in-memory Map + Next.js data cache (24 h).
 * SERVER-SIDE ONLY.
 */
export async function getVenueDetails(
  placeName: string,
  neighbourhood: string
): Promise<GooglePlaceResult | null> {
  assertServerSide();

  const key = buildCacheKey(placeName, neighbourhood);
  if (detailsCache.has(key)) return detailsCache.get(key) ?? null;

  try {
    const place = await findPlace(placeName, neighbourhood);
    if (!place) { detailsCache.set(key, null); return null; }

    const photoName = place.photos?.[0]?.name ?? null;
    const photo_url = photoName ? await resolvePhotoUrl(photoName) : null;

    const result: GooglePlaceResult = {
      place_id:               place.id,
      formatted_address:      place.formattedAddress ?? null,
      formatted_phone_number: place.internationalPhoneNumber ?? null,
      opening_hours:          place.regularOpeningHours?.weekdayDescriptions ?? null,
      rating:                 place.rating ?? null,
      website:                place.websiteUri ?? null,
      photo_url,
    };

    detailsCache.set(key, result);
    if (!photoCache.has(key)) photoCache.set(key, photo_url);

    return result;
  } catch {
    detailsCache.set(key, null);
    return null;
  }
}
