import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";
import type { ApiResponse, Submission } from "@/lib/types";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    const supabase = createAdminClient();
    let query = supabase
      .from("submissions")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false });

    if (status) query = query.eq("status", status);

    const { data, error, count } = await query;

    if (error) throw error;

    return NextResponse.json<ApiResponse<Submission[]>>({ data: data ?? [], count: count ?? 0 });
  } catch (error) {
    return NextResponse.json({ data: [], error: "Failed to fetch submissions" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const supabase = createAdminClient();

    const submission = {
      ...body,
      status: "pending",
    };

    const { data, error } = await supabase.from("submissions").insert(submission).select().single();

    if (error) throw error;

    return NextResponse.json<ApiResponse<Submission>>({ data }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ data: null, error: "Failed to create submission" }, { status: 500 });
  }
}
