export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";
import type { SubmissionStatus } from "@/lib/types";

// ── Auth helper ───────────────────────────────────────────────────────────────

function requireAdminKey(request: NextRequest): NextResponse | null {
  const expected = process.env.ADMIN_SECRET_KEY;
  if (!expected) {
    return NextResponse.json(
      { error: "Admin endpoint is not configured on this deployment." },
      { status: 503 }
    );
  }
  if (request.headers.get("x-admin-key") !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null; // authorised
}

// ── GET /api/admin/submissions ────────────────────────────────────────────────
// Returns all pending submissions ordered by created_at desc.
// Requires x-admin-key header.

export async function GET(request: NextRequest) {
  const authError = requireAdminKey(request);
  if (authError) return authError;

  try {
    const supabase = createAdminClient();

    const { data, error, count } = await supabase
      .from("submissions")
      .select("*", { count: "exact" })
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json({
      submissions: data ?? [],
      total: count ?? 0,
    });
  } catch (e) {
    console.error("[GET /api/admin/submissions]", e);
    return NextResponse.json({ error: "Failed to fetch submissions" }, { status: 500 });
  }
}

// ── PATCH /api/admin/submissions ──────────────────────────────────────────────
// Body: { id: string, status: "approved" | "rejected" }
// Requires x-admin-key header.

export async function PATCH(request: NextRequest) {
  const authError = requireAdminKey(request);
  if (authError) return authError;

  let id: unknown, status: unknown;

  try {
    ({ id, status } = await request.json());
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!id || typeof id !== "string") {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  const VALID_STATUSES: SubmissionStatus[] = ["approved", "rejected"];
  if (!status || !VALID_STATUSES.includes(status as SubmissionStatus)) {
    return NextResponse.json(
      { error: `status must be one of: ${VALID_STATUSES.join(", ")}` },
      { status: 400 }
    );
  }

  try {
    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from("submissions")
      .update({ status: status as SubmissionStatus })
      .eq("id", id)
      .select("id, status")
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json({ error: "Submission not found" }, { status: 404 });
      }
      throw error;
    }

    return NextResponse.json({ success: true, submission: data });
  } catch (e) {
    console.error("[PATCH /api/admin/submissions]", e);
    return NextResponse.json({ error: "Failed to update submission" }, { status: 500 });
  }
}
