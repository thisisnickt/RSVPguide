import VenueCard from "./VenueCard";
import type { Venue } from "@/lib/types";

interface VenueGridProps {
  venues: Venue[];
  loading?: boolean;
}

export default function VenueGrid({ venues, loading = false }: VenueGridProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="animate-pulse overflow-hidden rounded-lg border border-brand-border bg-brand-card">
            <div className="h-48 bg-brand-surface" />
            <div className="p-4 space-y-2">
              <div className="h-5 w-3/4 rounded bg-brand-surface" />
              <div className="h-4 w-full rounded bg-brand-surface" />
              <div className="h-4 w-2/3 rounded bg-brand-surface" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (venues.length === 0) {
    return (
      <div className="py-16 text-center">
        <p className="text-brand-text-secondary">No venues found.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {venues.map((venue) => (
        <VenueCard key={venue.id} venue={venue} />
      ))}
    </div>
  );
}
