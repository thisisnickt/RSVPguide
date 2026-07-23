import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase";
import type { ApiResponse, Venue } from "@/lib/types";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const neighbourhood = searchParams.get("neighbourhood");
    const search = searchParams.get("search");
    const page = parseInt(searchParams.get("page") ?? "1", 10);
    const limit = parseInt(searchParams.get("limit") ?? "12", 10);
    const offset = (page - 1) * limit;

    const supabase = createServiceRoleClient();
    let query = supabase
      .from("venues")
      .select("*", { count: "exact" })
      .eq("is_active", true)
      .order("is_featured", { ascending: false })
      .order("name", { ascending: true })
      .range(offset, offset + limit - 1);

    if (category) query = query.eq("category", category);
    if (neighbourhood) query = query.ilike("neighbourhood", `%${neighbourhood}%`);
    if (search) query = query.ilike("name", `%${search}%`);

    const { data, error, count } = await query;

    if (error) throw error;

    return NextResponse.json<ApiResponse<Venue[]>>({ data: data ?? [], count: count ?? 0 });
  } catch (error) {
    return NextResponse.json({ data: [], error: "Failed to fetch venues" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const supabase = createServiceRoleClient();

    const { data, error } = await supabase.from("venues").insert(body).select().single();

    if (error) throw error;

    return NextResponse.json<ApiResponse<Venue>>({ data }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ data: null, error: "Failed to create venue" }, { status: 500 });
  }
}
