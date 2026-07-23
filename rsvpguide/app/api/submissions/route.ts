export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";

// ── Validation ────────────────────────────────────────────────────────────────

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface SubmissionBody {
  venue_name:          unknown;
  contact_name:        unknown;
  contact_email:       unknown;
  venue_website?:      unknown;
  venue_category?:     unknown;
  venue_neighbourhood?:unknown;
  message?:            unknown;
}

function validateSubmission(body: SubmissionBody) {
  const fields: Record<string, string> = {};

  if (!body.venue_name || typeof body.venue_name !== "string" || !body.venue_name.trim()) {
    fields.venue_name = "Venue name is required";
  }
  if (!body.contact_name || typeof body.contact_name !== "string" || !body.contact_name.trim()) {
    fields.contact_name = "Contact name is required";
  }
  if (!body.contact_email || typeof body.contact_email !== "string") {
    fields.contact_email = "Contact email is required";
  } else if (!EMAIL_RE.test(body.contact_email.trim())) {
    fields.contact_email = "Enter a valid email address";
  }

  return Object.keys(fields).length > 0 ? fields : null;
}

// ── POST /api/submissions ─────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  let body: SubmissionBody;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  // Client-side mirrored validation on the server
  const fieldErrors = validateSubmission(body);
  if (fieldErrors) {
    return NextResponse.json(
      { error: "Validation failed", fields: fieldErrors },
      { status: 400 }
    );
  }

  try {
    const supabase = createAdminClient();

    const row = {
      venue_name:           String(body.venue_name).trim(),
      contact_name:         String(body.contact_name).trim(),
      contact_email:        String(body.contact_email).trim().toLowerCase(),
      venue_website:        body.venue_website        ? String(body.venue_website).trim()        : null,
      venue_category:       body.venue_category       ? String(body.venue_category).trim()       : null,
      venue_neighbourhood:  body.venue_neighbourhood  ? String(body.venue_neighbourhood).trim()  : null,
      message:              body.message              ? String(body.message).trim()              : null,
      status:               "pending" as const,
    };

    const { error } = await supabase.from("submissions").insert(row);

    if (error) throw error;

    return NextResponse.json(
      { success: true, message: "Submission received" },
      { status: 201 }
    );
  } catch (e) {
    console.error("[POST /api/submissions]", e);
    return NextResponse.json({ error: "Failed to save submission" }, { status: 500 });
  }
}
