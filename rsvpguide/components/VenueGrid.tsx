import VenueCard from "./VenueCard";
import type { Venue } from "@/lib/types";

interface VenueGridProps {
  venues: Venue[];
  loading?: boolean;
}

function SkeletonCard() {
  return (
    <div className="animate-pulse overflow-hidden rounded-xl border border-[#2A2A2A] bg-[#141414]">
      <div className="h-52 bg-gradient-to-br from-[#1C1C1C] to-[#141414]" />
      <div className="p-4 space-y-3">
        <div className="h-2.5 w-20 rounded-full bg-[#1C1C1C]" />
        <div className="h-5 w-3/4 rounded bg-[#1C1C1C]" />
        <div className="space-y-1.5">
          <div className="h-3.5 w-full rounded bg-[#1C1C1C]" />
          <div className="h-3.5 w-5/6 rounded bg-[#1C1C1C]" />
        </div>
        <div className="flex gap-1.5 pt-1">
          <div className="h-5 w-24 rounded-full bg-[#1C1C1C]" />
        </div>
      </div>
      <div className="flex gap-2 px-4 pb-4">
        <div className="h-8 flex-1 rounded-lg bg-[#1C1C1C]" />
        <div className="h-8 flex-1 rounded-lg bg-[#1C1C1C]" />
      </div>
    </div>
  );
}

export default function VenueGrid({ venues, loading = false }: VenueGridProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  if (venues.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="font-playfair text-xl text-[#F0EDE6]">No venues found</p>
        <p className="mt-2 text-sm text-[#A89F8C]">
          Try adjusting your filters or search term.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {venues.map((venue, i) => (
        <VenueCard
          key={venue.id}
          venue={venue}
          priority={i < 3}
        />
      ))}
    </div>
  );
}
