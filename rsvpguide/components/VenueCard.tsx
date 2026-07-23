import Image from "next/image";
import Link from "next/link";
import type { Venue } from "@/lib/types";

interface VenueCardProps {
  venue: Venue;
}

export default function VenueCard({ venue }: VenueCardProps) {
  return (
    <Link href={`/venues/${venue.slug}`} className="group block">
      <div className="overflow-hidden rounded-lg border border-brand-border bg-brand-card transition-colors hover:border-brand-gold">
        <div className="relative h-48 w-full bg-brand-surface">
          {venue.photo_url ? (
            <Image
              src={venue.photo_url}
              alt={venue.name}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <span className="text-4xl text-brand-text-secondary opacity-30">&#9965;</span>
            </div>
          )}
          {venue.is_featured && (
            <span className="absolute left-2 top-2 rounded bg-brand-gold px-2 py-0.5 text-xs font-semibold text-brand-bg">
              Featured
            </span>
          )}
        </div>
        <div className="p-4">
          <h3 className="font-playfair text-lg font-semibold text-brand-text-primary group-hover:text-brand-gold transition-colors">
            {venue.name}
          </h3>
          <p className="mt-1 text-sm text-brand-text-secondary line-clamp-2">{venue.description}</p>
          <div className="mt-3 flex items-center justify-between">
            <span className="text-xs text-brand-text-secondary">{venue.neighbourhood}</span>
            <span className="rounded bg-brand-surface px-2 py-0.5 text-xs text-brand-text-secondary">
              {venue.category}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
