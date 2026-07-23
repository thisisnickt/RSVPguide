export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";
import type { Venue } from "@/lib/types";

// ── Helpers ──────────────────────────────────────────────────────────────────

function err(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

// ── GET /api/venues ───────────────────────────────────────────────────────────
// Query params:
//   category?       filter by VenueCategory enum value
//   neighbourhood?  filter by neighbourhood (exact match, case-insensitive)
//   search?         full-text search on name + description
//   featured?       'true' → only is_featured = true
//   limit?          default 50
//   offset?         default 0

export async function GET(request: NextRequest) {
  try {
    const sp = new URL(request.url).searchParams;

    const category     = sp.get("category")     ?? null;
    const neighbourhood= sp.get("neighbourhood") ?? null;
    const search       = sp.get("search")        ?? null;
    const featuredOnly = sp.get("featured") === "true";
    const limit        = Math.min(Math.max(parseInt(sp.get("limit")  ?? "50", 10), 1), 200);
    const offset       = Math.max(parseInt(sp.get("offset") ?? "0",  10), 0);

    const supabase = createAdminClient();

    let query = supabase
      .from("venues")
      .select("*", { count: "exact" })
      .eq("is_active", true)
      .order("is_featured", { ascending: false })
      .order("name",        { ascending: true  })
      .range(offset, offset + limit - 1);

    if (featuredOnly)   query = query.eq("is_featured",    true);
    if (category)       query = query.eq("category",       category);
    if (neighbourhood)  query = query.ilike("neighbourhood", neighbourhood);
    if (search) {
      const term = `%${search}%`;
      query = query.or(`name.ilike.${term},description.ilike.${term}`);
    }

    const { data, error, count } = await query;

    if (error) throw error;

    return NextResponse.json({
      venues: (data ?? []) as Venue[],
      total: count ?? 0,
    });
  } catch (e) {
    console.error("[GET /api/venues]", e);
    return err("Failed to fetch venues", 500);
  }
}
