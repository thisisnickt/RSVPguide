/**
 * One-time script: fetch Google Places photos for every venue that has
 * photo_url = null and write the URL back to Supabase.
 *
 * Uses the Places API (New): https://places.googleapis.com/v1/
 * (the legacy maps.googleapis.com/maps/api/place/* endpoints require
 *  separate enablement in Google Cloud Console and are not needed here)
 *
 * Run from the rsvpguide project directory:
 *
 *   npx tsx scripts/update-photos.ts
 *
 * Or with Node 20+ native env-file loading:
 *
 *   node --env-file=.env.local --import tsx/esm scripts/update-photos.ts
 */

import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";

// ── Load .env.local ───────────────────────────────────────────────────────────

function loadEnvFile(filepath: string): boolean {
  try {
    const raw = readFileSync(filepath, "utf8");
    let loaded = 0;
    for (const line of raw.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eqIdx = trimmed.indexOf("=");
      if (eqIdx < 0) continue;
      const key = trimmed.slice(0, eqIdx).trim();
      const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, "");
      if (key) { process.env[key] = val; loaded++; }
    }
    console.log(`  Loaded ${loaded} variables from ${filepath}`);
    return true;
  } catch {
    return false;
  }
}

const __filename  = fileURLToPath(import.meta.url);
const projectRoot = join(dirname(__filename), "..");

const loaded =
  loadEnvFile(join(process.cwd(), ".env.local")) ||
  loadEnvFile(join(projectRoot,   ".env.local"));

if (!loaded) console.warn("  ⚠ No .env.local found — using existing process.env values");

// ── Config ────────────────────────────────────────────────────────────────────

const API_KEY     = process.env.GOOGLE_PLACES_API_KEY;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY;
const PLACES_BASE  = "https://places.googleapis.com/v1";
const DELAY_MS     = 350;

if (!API_KEY)      { console.error("\nFatal: GOOGLE_PLACES_API_KEY is not set"); process.exit(1); }
if (!SUPABASE_URL || SUPABASE_URL === "your_supabase_url_here") {
  console.error("\nFatal: NEXT_PUBLIC_SUPABASE_URL is not set correctly");
  process.exit(1);
}
if (!SERVICE_KEY  || SERVICE_KEY === "your_service_role_key_here") {
  console.error("\nFatal: SUPABASE_SERVICE_ROLE_KEY is not set correctly");
  process.exit(1);
}

console.log(`\n  Google API key: ${API_KEY.slice(0, 8)}...${API_KEY.slice(-4)}`);
console.log(`  Supabase URL:   ${SUPABASE_URL}\n`);

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// ── Places API (New) helpers ──────────────────────────────────────────────────

function placesHeaders() {
  return {
    "Content-Type":    "application/json",
    "X-Goog-Api-Key":  API_KEY!,
  };
}

interface TextSearchResult {
  id: string;
  displayName?: { text: string };
  formattedAddress?: string;
}

interface PlaceDetailsPhoto {
  name: string;   // full resource name: "places/{id}/photos/{ref}"
  widthPx: number;
  heightPx: number;
}

interface PhotoMediaResponse {
  name:     string;
  photoUri: string;   // the actual CDN URL (lh3.googleusercontent.com)
}

/**
 * Text Search (New) → returns the first matching place ID, or null.
 * POST https://places.googleapis.com/v1/places:searchText
 */
async function findPlaceId(
  venueName: string,
  debug = false
): Promise<string | null> {
  const query = `${venueName} Singapore`;

  const res  = await fetch(`${PLACES_BASE}/places:searchText`, {
    method:  "POST",
    headers: {
      ...placesHeaders(),
      "X-Goog-FieldMask": "places.id,places.displayName,places.formattedAddress",
    },
    body: JSON.stringify({ textQuery: query }),
  });

  const data = await res.json() as { places?: TextSearchResult[]; error?: { message: string; status: string } };

  if (debug) {
    console.log("\n  ── Raw Text Search response (first venue debug) ──");
    console.log(`  Query:   ${query}`);
    console.log(`  HTTP:    ${res.status}`);
    if (data.error) {
      console.log(`  Error:   ${data.error.status} — ${data.error.message}`);
    } else if (data.places?.length) {
      const p = data.places[0];
      console.log(`  Top hit: "${p.displayName?.text}" — ${p.formattedAddress}`);
      console.log(`  place_id: ${p.id}`);
    } else {
      console.log("  places: [] (no results)");
    }
    console.log("  ──────────────────────────────────────────────────\n");
  }

  if (data.error) {
    const { status, message } = data.error;
    if (status === "PERMISSION_DENIED" || status === "UNAUTHENTICATED") {
      throw new Error(
        `Places API key rejected (${status}). ` +
        `Ensure the 'Places API (New)' is enabled in Google Cloud Console ` +
        `and billing is active. Detail: ${message}`
      );
    }
    if (status === "RESOURCE_EXHAUSTED") {
      throw new Error(`Google API quota exceeded (${status})`);
    }
    // Other errors (INVALID_ARGUMENT etc.) — log but continue
    console.warn(`  ⚠ API warning: ${status} — ${message}`);
    return null;
  }

  return data.places?.[0]?.id ?? null;
}

/**
 * Place Details (New) → returns the first photo resource name, or null.
 * GET https://places.googleapis.com/v1/places/{id}
 */
async function getPhotoResourceName(placeId: string): Promise<string | null> {
  const res  = await fetch(`${PLACES_BASE}/places/${placeId}`, {
    headers: {
      ...placesHeaders(),
      "X-Goog-FieldMask": "photos",
    },
  });

  const data = await res.json() as { photos?: PlaceDetailsPhoto[]; error?: { message: string } };

  if (data.error || !data.photos?.length) return null;

  return data.photos[0].name; // e.g. "places/ChIJ.../photos/AUacSh..."
}

/**
 * Photo Media (New) → returns the direct CDN URL for the photo.
 * GET https://places.googleapis.com/v1/{photoName}/media?maxWidthPx=800&skipHttpRedirect=true
 *
 * skipHttpRedirect=true returns JSON { photoUri } instead of a 302 redirect,
 * giving us a stable lh3.googleusercontent.com URL to store in Supabase.
 */
async function getPhotoUrl(photoName: string): Promise<string | null> {
  const url = new URL(`${PLACES_BASE}/${photoName}/media`);
  url.searchParams.set("maxWidthPx",        "800");
  url.searchParams.set("skipHttpRedirect",  "true");
  url.searchParams.set("key",               API_KEY!);

  const res  = await fetch(url.toString());
  const data = await res.json() as PhotoMediaResponse | { error?: { message: string } };

  if ("error" in data || !("photoUri" in data)) return null;

  return (data as PhotoMediaResponse).photoUri;
}

async function fetchVenuePhoto(name: string, debug = false): Promise<string | null> {
  const placeId = await findPlaceId(name, debug);
  if (!placeId) return null;

  await sleep(DELAY_MS);

  const photoName = await getPhotoResourceName(placeId);
  if (!photoName) return null;

  await sleep(DELAY_MS);

  return getPhotoUrl(photoName);
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const { data: venues, error } = await supabase
    .from("venues")
    .select("id, name, neighbourhood")
    .is("photo_url", null)
    .eq("is_active", true)
    .order("name");

  if (error) throw error;

  const total = venues?.length ?? 0;
  console.log(`Found ${total} venue${total === 1 ? "" : "s"} without photos.\n`);

  if (total === 0) {
    console.log("Nothing to do — all venues already have photos.");
    return;
  }

  let updated = 0;
  let skipped = 0;

  for (let i = 0; i < (venues?.length ?? 0); i++) {
    const venue   = venues![i];
    const isFirst = i === 0; // verbose API response debug for the first venue

    process.stdout.write(`  [${i + 1}/${total}] ${venue.name} … `);

    try {
      const photoUrl = await fetchVenuePhoto(venue.name, isFirst);

      if (!photoUrl) {
        console.log("no photo found");
        skipped++;
        await sleep(DELAY_MS);
        continue;
      }

      const { error: updateErr } = await supabase
        .from("venues")
        .update({ photo_url: photoUrl })
        .eq("id", venue.id);

      if (updateErr) throw updateErr;

      console.log("✓");
      updated++;
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.log(`✗  ${msg}`);
      skipped++;

      // Abort on key/quota errors — they affect every subsequent request
      if (
        msg.includes("PERMISSION_DENIED") ||
        msg.includes("UNAUTHENTICATED") ||
        msg.includes("quota exceeded")
      ) {
        console.error("\nAborting: API-level error affects all requests.");
        break;
      }
    }

    await sleep(DELAY_MS);
  }

  console.log(`\nDone — ${updated} updated, ${skipped} skipped.\n`);
}

main().catch((e) => {
  console.error("\nFatal:", e instanceof Error ? e.message : e);
  process.exit(1);
});
