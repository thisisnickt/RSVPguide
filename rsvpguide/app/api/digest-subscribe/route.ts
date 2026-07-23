import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  try {
    const { email, name } = await request.json();

    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const normalised = email.toLowerCase().trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalised)) {
      return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
    }

    const supabase = createAdminClient();

    // Upsert so re-subscriptions (same email, was unsubscribed) are handled cleanly
    const { error } = await supabase
      .from("digest_subscribers")
      .upsert(
        { email: normalised, name: name ?? null, is_active: true },
        { onConflict: "email" }
      );

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[digest-subscribe]", message);
    return NextResponse.json({ error: "Failed to subscribe" }, { status: 500 });
  }
}
