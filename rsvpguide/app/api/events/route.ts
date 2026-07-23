import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase";
import type { ApiResponse, Event } from "@/lib/types";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const venue_id = searchParams.get("venue_id");
    const date = searchParams.get("date");
    const performer_type = searchParams.get("performer_type");
    const page = parseInt(searchParams.get("page") ?? "1", 10);
    const limit = parseInt(searchParams.get("limit") ?? "12", 10);
    const offset = (page - 1) * limit;

    const supabase = createServiceRoleClient();
    let query = supabase
      .from("events")
      .select("*, venue:venues(*)", { count: "exact" })
      .eq("is_active", true)
      .gte("event_date", new Date().toISOString().split("T")[0])
      .order("event_date", { ascending: true })
      .range(offset, offset + limit - 1);

    if (venue_id) query = query.eq("venue_id", venue_id);
    if (date) query = query.eq("event_date", date);
    if (performer_type) query = query.eq("performer_type", performer_type);

    const { data, error, count } = await query;

    if (error) throw error;

    return NextResponse.json<ApiResponse<Event[]>>({ data: data ?? [], count: count ?? 0 });
  } catch (error) {
    return NextResponse.json({ data: [], error: "Failed to fetch events" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const supabase = createServiceRoleClient();

    const { data, error } = await supabase.from("events").insert(body).select().single();

    if (error) throw error;

    return NextResponse.json<ApiResponse<Event>>({ data }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ data: null, error: "Failed to create event" }, { status: 500 });
  }
}
