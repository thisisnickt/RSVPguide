export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// ── POST /api/digest-subscribe ────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  let email: unknown, name: unknown;

  try {
    ({ email, name } = await request.json());
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!email || typeof email !== "string") {
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }

  const normalised = email.toLowerCase().trim();

  if (!EMAIL_RE.test(normalised)) {
    return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
  }

  try {
    const supabase = createAdminClient();

    const { error } = await supabase
      .from("digest_subscribers")
      .upsert(
        {
          email:     normalised,
          name:      name && typeof name === "string" ? name.trim() : null,
          is_active: true,
        },
        { onConflict: "email" }
      );

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("[POST /api/digest-subscribe]", e);
    return NextResponse.json({ error: "Failed to subscribe" }, { status: 500 });
  }
}
