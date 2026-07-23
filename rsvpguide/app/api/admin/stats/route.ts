export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";

function requireAdminKey(request: NextRequest): NextResponse | null {
  const expected = process.env.ADMIN_SECRET_KEY;
  if (!expected)
    return NextResponse.json({ error: "Not configured" }, { status: 503 });
  if (request.headers.get("x-admin-key") !== expected)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return null;
}

// ── GET /api/admin/stats ──────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  const authError = requireAdminKey(request);
  if (authError) return authError;

  try {
    const supabase = createAdminClient();
    const today = new Date().toISOString().split("T")[0];

    const [venues, events, subscribers, pending] = await Promise.all([
      supabase
        .from("venues")
        .select("id", { count: "exact", head: true })
        .eq("is_active", true),
      supabase
        .from("events")
        .select("id", { count: "exact", head: true })
        .eq("is_active", true)
        .gte("event_date", today),
      supabase
        .from("digest_subscribers")
        .select("id", { count: "exact", head: true })
        .eq("is_active", true),
      supabase
        .from("submissions")
        .select("id", { count: "exact", head: true })
        .eq("status", "pending"),
    ]);

    return NextResponse.json({
      venues:      venues.count      ?? 0,
      events:      events.count      ?? 0,
      subscribers: subscribers.count ?? 0,
      pending:     pending.count     ?? 0,
    });
  } catch (e) {
    console.error("[GET /api/admin/stats]", e);
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
  }
}
