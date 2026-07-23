import Image from "next/image";
import Link from "next/link";
import type { Venue, VenueCategory } from "@/lib/types";

interface VenueCardProps {
  venue: Venue;
  priority?: boolean;
}

// Colour-coded category badge
const CATEGORY_BADGE: Record<VenueCategory, string> = {
  "Dance Club":    "bg-rose-950/80 text-rose-300 border border-rose-700/40",
  "Cocktail Bar":  "bg-sky-950/80 text-sky-300 border border-sky-700/40",
  "Rooftop Bar":   "bg-emerald-950/80 text-emerald-300 border border-emerald-700/40",
  "Pub / Brewery": "bg-amber-950/80 text-amber-300 border border-amber-700/40",
};

// Emoji icon shown in the dark placeholder when no photo is available
const CATEGORY_ICON: Record<VenueCategory, string> = {
  "Dance Club":    "🎧",
  "Cocktail Bar":  "🍸",
  "Rooftop Bar":   "🌆",
  "Pub / Brewery": "🍺",
};

export default function VenueCard({ venue, priority = false }: VenueCardProps) {
  const badge = CATEGORY_BADGE[venue.category];
  const icon  = CATEGORY_ICON[venue.category];

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-xl border border-[#2A2A2A] bg-[#141414] transition-all duration-300 hover:border-[#C9A84C]/40 hover:bg-[#181818] hover:shadow-[0_0_24px_rgba(201,168,76,0.08)]">

      {/* ── Stretched card link (z-[1]) ── */}
      <Link
        href={`/venues/${venue.slug}`}
        className="absolute inset-0 z-[1]"
        aria-label={`View ${venue.name}`}
      />

      {/* ── Photo / placeholder ── */}
      <div className="relative h-52 w-full overflow-hidden">
        {venue.photo_url ? (
          <>
            <Image
              src={venue.photo_url}
              alt={venue.name}
              fill
              priority={priority}
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            />
            {/* Bottom gradient overlay for text readability */}
            <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-[#141414] via-[#141414]/40 to-transparent" />
          </>
        ) : (
          // Dark placeholder with centred category icon
          <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-gradient-to-br from-[#1C1C1C] via-[#141414] to-[#0D0D0D]">
            <span className="text-5xl opacity-25 select-none">{icon}</span>
          </div>
        )}

        {/* Category badge */}
        <span className={`absolute left-3 top-3 z-[2] rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-widest backdrop-blur-sm ${badge}`}>
          {venue.category}
        </span>

        {/* Featured badge */}
        {venue.is_featured && (
          <span className="absolute right-3 top-3 z-[2] rounded-full bg-[#C9A84C] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-[#0D0D0D]">
            Featured
          </span>
        )}
      </div>

      {/* ── Body ── */}
      <div className="flex flex-1 flex-col p-4 pb-3">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-[#C9A84C]">
          {venue.neighbourhood}
        </p>
        <h3 className="mt-1 font-playfair text-[17px] font-semibold leading-snug text-[#F0EDE6] transition-colors duration-200 group-hover:text-[#C9A84C]">
          {venue.name}
        </h3>
        {venue.description && (
          <p className="mt-2 line-clamp-2 text-[13px] leading-relaxed text-[#A89F8C]">
            {venue.description}
          </p>
        )}

        {/* Pills */}
        <div className="mt-3 flex flex-wrap gap-1.5">
          {venue.hours && (
            <span className="rounded-full border border-[#2A2A2A] bg-[#1C1C1C] px-2.5 py-0.5 text-[11px] text-[#A89F8C]">
              {venue.hours}
            </span>
          )}
          {venue.known_promotions && (
            <span className="rounded-full border border-[#C9A84C]/25 bg-[#C9A84C]/10 px-2.5 py-0.5 text-[11px] text-[#C9A84C]">
              {venue.known_promotions}
            </span>
          )}
        </div>
      </div>

      {/* ── Buttons (z-[2] sits above the stretched link) ── */}
      <div className="relative z-[2] flex gap-2 px-4 pb-4">
        {(venue.booking_url ?? venue.website) && (
          <a
            href={venue.booking_url ?? venue.website ?? "#"}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 rounded-lg bg-[#C9A84C] py-2 text-center text-xs font-semibold text-[#0D0D0D] transition-opacity duration-200 hover:opacity-90"
          >
            Book / Tickets
          </a>
        )}
        {venue.website && (
          <a
            href={venue.website}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 rounded-lg border border-[#2A2A2A] py-2 text-center text-xs font-medium text-[#A89F8C] transition-colors duration-200 hover:border-[#C9A84C]/40 hover:text-[#F0EDE6]"
          >
            Website
          </a>
        )}
      </div>
    </div>
  );
}
