import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";
import { SEED_VENUES } from "@/lib/seed-venues";

/**
 * POST /api/seed
 *
 * One-time setup endpoint — inserts or updates all seed venues via upsert
 * (conflict target: slug). Protected by the x-seed-key request header.
 *
 * Usage:
 *   curl -X POST https://your-domain/api/seed \
 *        -H "x-seed-key: <SEED_SECRET_KEY>"
 */
export async function POST(request: NextRequest) {
  // ── Authentication ────────────────────────────────────────────────────────
  const expectedKey = process.env.SEED_SECRET_KEY;

  // Refuse all requests when the env var is not configured (fail-safe default)
  if (!expectedKey) {
    return NextResponse.json(
      { error: "Seed endpoint is not configured on this deployment." },
      { status: 503 }
    );
  }

  const providedKey = request.headers.get("x-seed-key");
  if (!providedKey || providedKey !== expectedKey) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // ── Upsert ────────────────────────────────────────────────────────────────
  try {
    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from("venues")
      .upsert(SEED_VENUES, { onConflict: "slug" })
      .select("id, name, slug");

    if (error) throw error;

    const count = data?.length ?? 0;

    return NextResponse.json({
      success: true,
      message: `Seeded ${count} venue${count === 1 ? "" : "s"} successfully.`,
      count,
      venues: (data ?? []).map((v) => ({ id: v.id, name: v.name, slug: v.slug })),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[seed] Supabase error:", message);
    return NextResponse.json(
      { error: "Seed failed. See server logs for details.", detail: message },
      { status: 500 }
    );
  }
}

// Disable GET — only POST is valid
export async function GET() {
  return NextResponse.json(
    { error: "Method not allowed. Use POST with x-seed-key header." },
    { status: 405 }
  );
}
