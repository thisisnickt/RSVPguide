/**
 * One-time script: fetch Google Places photos for every venue that has
 * photo_url = null and write the URL back to Supabase.
 *
 * Run from the project root:
 *
 *   npx tsx scripts/update-photos.ts
 *
 * Or with Node 20+ env-file flag (no dotenv needed):
 *
 *   node --env-file=.env.local --import tsx/esm scripts/update-photos.ts
 *
 * A 250 ms delay is inserted between Google API requests to stay well
 * within the free-tier rate limit (100 QPS text search, 100 QPS details).
 */

import { readFileSync } from "fs";
import { join } from "path";
import { createClient } from "@supabase/supabase-js";

// ── Load .env.local (no dotenv package required) ──────────────────────────────

function loadEnvFile(filepath: string): void {
  try {
    const raw = readFileSync(filepath, "utf8");
    for (const line of raw.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eqIdx = trimmed.indexOf("=");
      if (eqIdx < 0) continue;
      const key = trimmed.slice(0, eqIdx).trim();
      const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, "");
      if (key && !(key in process.env)) process.env[key] = val;
    }
  } catch {
    // env vars may already be set in the environment — that's fine
  }
}

loadEnvFile(join(process.cwd(), ".env.local"));

// ── Config ────────────────────────────────────────────────────────────────────

const GOOGLE_API_KEY = process.env.GOOGLE_PLACES_API_KEY;
const SUPABASE_URL   = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY    = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BASE           = "https://maps.googleapis.com/maps/api/place";
const DELAY_MS       = 250; // between requests — respect free-tier QPS

if (!GOOGLE_API_KEY) throw new Error("GOOGLE_PLACES_API_KEY is not set");
if (!SUPABASE_URL)   throw new Error("NEXT_PUBLIC_SUPABASE_URL is not set");
if (!SERVICE_KEY)    throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set");

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// ── Google Places helpers ─────────────────────────────────────────────────────

async function findPlaceId(name: string, neighbourhood: string): Promise<string | null> {
  const url = new URL(`${BASE}/textsearch/json`);
  url.searchParams.set("query", `${name} ${neighbourhood} Singapore`);
  url.searchParams.set("key", GOOGLE_API_KEY!);
  url.searchParams.set("type", "establishment");

  const res  = await fetch(url.toString());
  const data = await res.json() as { results?: { place_id: string }[] };

  return data.results?.[0]?.place_id ?? null;
}

async function getPhotoRef(placeId: string): Promise<string | null> {
  const url = new URL(`${BASE}/details/json`);
  url.searchParams.set("place_id", placeId);
  url.searchParams.set("fields", "photos");
  url.searchParams.set("key", GOOGLE_API_KEY!);

  const res  = await fetch(url.toString());
  const data = await res.json() as { result?: { photos?: { photo_reference: string }[] } };

  return data.result?.photos?.[0]?.photo_reference ?? null;
}

function buildPhotoUrl(ref: string): string {
  return (
    `${BASE}/photo` +
    `?maxwidth=800` +
    `&photo_reference=${encodeURIComponent(ref)}` +
    `&key=${GOOGLE_API_KEY}`
  );
}

async function fetchPhoto(name: string, neighbourhood: string): Promise<string | null> {
  const placeId = await findPlaceId(name, neighbourhood);
  if (!placeId) return null;

  await sleep(DELAY_MS);

  const ref = await getPhotoRef(placeId);
  if (!ref) return null;

  return buildPhotoUrl(ref);
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
  console.log(`\nFound ${total} venue${total === 1 ? "" : "s"} without photos.\n`);

  if (total === 0) {
    console.log("Nothing to do.");
    return;
  }

  let updated = 0;
  let skipped = 0;

  for (const venue of venues ?? []) {
    process.stdout.write(`  [${updated + skipped + 1}/${total}] ${venue.name} … `);

    try {
      const photoUrl = await fetchPhoto(venue.name, venue.neighbourhood);

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
    }

    await sleep(DELAY_MS);
  }

  console.log(`\nDone — ${updated} updated, ${skipped} skipped.\n`);
}

main().catch((e) => {
  console.error("\nFatal:", e instanceof Error ? e.message : e);
  process.exit(1);
});
