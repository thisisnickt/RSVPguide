/**
 * Server-side only — never import this module from a Client Component.
 * The GOOGLE_PLACES_API_KEY env var is not prefixed with NEXT_PUBLIC_
 * and is therefore never sent to the browser.
 */

import type { GooglePlaceResult } from "./types";

const BASE_URL = "https://maps.googleapis.com/maps/api/place";

// ----------------------------------------------------------------
// Raw API response shapes (internal — not exported)
// ----------------------------------------------------------------
interface RawPhoto {
  photo_reference: string;
  height: number;
  width: number;
}

interface RawPlaceDetails {
  place_id?: string;
  formatted_address?: string;
  formatted_phone_number?: string;
  rating?: number;
  website?: string;
  photos?: RawPhoto[];
  opening_hours?: {
    weekday_text?: string[];
  };
}

interface TextSearchResult {
  place_id: string;
}

// ----------------------------------------------------------------
// In-memory caches — keyed by "placeName::neighbourhood".
// Survive for the lifetime of the Node.js process (warm deploys,
// serverless container reuse). A null entry means "already looked up,
// nothing found" so we don't make redundant API calls.
// ----------------------------------------------------------------
const photoCache = new Map<string, string | null>();
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

// ----------------------------------------------------------------
// Internal helpers
// ----------------------------------------------------------------

/**
 * Text Search → returns the first matching place_id, or null.
 * Results are cached by Next.js data cache for 24 hours.
 */
async function findPlaceId(
  placeName: string,
  neighbourhood: string
): Promise<string | null> {
  const query = `${placeName} ${neighbourhood}`;
  const url = new URL(`${BASE_URL}/textsearch/json`);
  url.searchParams.set("query", query);
  url.searchParams.set("key", apiKey());
  url.searchParams.set("type", "establishment");

  const response = await fetch(url.toString(), {
    next: { revalidate: 86400 }, // 24-hour Next.js data cache
  });

  if (!response.ok) return null;

  const data = await response.json();
  const results: TextSearchResult[] = data.results ?? [];

  return results[0]?.place_id ?? null;
}

/**
 * Place Details → returns raw detail fields for a known place_id.
 * Results are cached by Next.js data cache for 24 hours.
 */
async function fetchRawDetails(placeId: string): Promise<RawPlaceDetails | null> {
  const fields = [
    "place_id",
    "formatted_address",
    "formatted_phone_number",
    "opening_hours",
    "rating",
    "website",
    "photos",
  ].join(",");

  const url = new URL(`${BASE_URL}/details/json`);
  url.searchParams.set("place_id", placeId);
  url.searchParams.set("fields", fields);
  url.searchParams.set("key", apiKey());

  const response = await fetch(url.toString(), {
    next: { revalidate: 86400 },
  });

  if (!response.ok) return null;

  const data = await response.json();
  return (data.result as RawPlaceDetails) ?? null;
}

/**
 * Builds the Place Photo URL for a given photo_reference.
 * The URL redirects to an image hosted on Google's CDN.
 * Add maps.googleapis.com to next.config.mjs remotePatterns
 * to use with next/image.
 */
function buildPhotoUrl(photoReference: string, maxWidth = 800): string {
  return (
    `${BASE_URL}/photo` +
    `?maxwidth=${maxWidth}` +
    `&photo_reference=${encodeURIComponent(photoReference)}` +
    `&key=${apiKey()}`
  );
}

// ----------------------------------------------------------------
// Public API
// ----------------------------------------------------------------

/**
 * Returns a photo URL (800 px wide) for the given venue, or null if
 * the venue cannot be found or has no photos.
 *
 * Results are held in an in-memory cache for the process lifetime and
 * in the Next.js data cache for 24 hours.
 *
 * SERVER-SIDE ONLY.
 */
export async function getVenuePhoto(
  placeName: string,
  neighbourhood: string
): Promise<string | null> {
  assertServerSide();

  const key = buildCacheKey(placeName, neighbourhood);

  if (photoCache.has(key)) {
    return photoCache.get(key) ?? null;
  }

  try {
    const placeId = await findPlaceId(placeName, neighbourhood);
    if (!placeId) {
      photoCache.set(key, null);
      return null;
    }

    const details = await fetchRawDetails(placeId);
    const photoRef = details?.photos?.[0]?.photo_reference ?? null;

    if (!photoRef) {
      photoCache.set(key, null);
      return null;
    }

    const url = buildPhotoUrl(photoRef);
    photoCache.set(key, url);
    return url;
  } catch {
    // Graceful degradation — never throw to callers
    photoCache.set(key, null);
    return null;
  }
}

/**
 * Returns enriched venue details from the Google Places API, or null
 * if the venue cannot be found or the API call fails.
 *
 * Internally calls getVenuePhoto so both the photo and the structured
 * details are retrieved in a single lookup (two API calls total).
 *
 * Results are held in an in-memory cache for the process lifetime and
 * in the Next.js data cache for 24 hours.
 *
 * SERVER-SIDE ONLY.
 */
export async function getVenueDetails(
  placeName: string,
  neighbourhood: string
): Promise<GooglePlaceResult | null> {
  assertServerSide();

  const key = buildCacheKey(placeName, neighbourhood);

  if (detailsCache.has(key)) {
    return detailsCache.get(key) ?? null;
  }

  try {
    const placeId = await findPlaceId(placeName, neighbourhood);
    if (!placeId) {
      detailsCache.set(key, null);
      return null;
    }

    const raw = await fetchRawDetails(placeId);
    if (!raw) {
      detailsCache.set(key, null);
      return null;
    }

    const photoRef = raw.photos?.[0]?.photo_reference ?? null;
    const photo_url = photoRef ? buildPhotoUrl(photoRef) : null;

    const result: GooglePlaceResult = {
      place_id: placeId,
      formatted_address: raw.formatted_address ?? null,
      formatted_phone_number: raw.formatted_phone_number ?? null,
      opening_hours: raw.opening_hours?.weekday_text ?? null,
      rating: raw.rating ?? null,
      website: raw.website ?? null,
      photo_url,
    };

    detailsCache.set(key, result);

    // Keep the photo cache warm as a side-effect
    if (!photoCache.has(key)) {
      photoCache.set(key, photo_url);
    }

    return result;
  } catch {
    detailsCache.set(key, null);
    return null;
  }
}
