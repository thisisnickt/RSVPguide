import type { Metadata } from "next";
import { createAdminClient } from "@/lib/supabase";
import type { Venue } from "@/lib/types";
import VenuesClient from "./VenuesClient";

export const metadata: Metadata = {
  title: "All Venues",
  description:
    "Browse Singapore's best bars, clubs, rooftop bars and nightlife venues.",
};

async function getAllVenues(): Promise<Venue[]> {
  try {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from("venues")
      .select("*")
      .eq("is_active", true)
      .order("is_featured", { ascending: false })
      .order("name",        { ascending: true });
    return (data ?? []) as Venue[];
  } catch {
    return [];
  }
}

export default async function VenuesPage() {
  const venues = await getAllVenues();

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="mb-8">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#C9A84C]">
          Directory
        </p>
        <h1 className="mt-1 font-playfair text-4xl font-bold text-[#F0EDE6]">
          All Venues
        </h1>
        <p className="mt-2 text-sm text-[#A89F8C]">
          {venues.length} curated venues across Singapore
        </p>
      </div>

      <VenuesClient initialVenues={venues} />
    </div>
  );
}
