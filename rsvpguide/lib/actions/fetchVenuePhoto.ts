"use server";

import { getVenuePhoto } from "@/lib/googlePlaces";

/**
 * Server Action — safe to call from both Server Components and Client
 * Components. The Google Places API key never leaves the server.
 *
 * Returns a Google Places Photo URL (800 px wide) or null when the
 * venue can't be found or has no photos.
 */
export async function fetchVenuePhoto(
  venueName: string,
  neighbourhood: string
): Promise<string | null> {
  return getVenuePhoto(venueName, neighbourhood);
}
