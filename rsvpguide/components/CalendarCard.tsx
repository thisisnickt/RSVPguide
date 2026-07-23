import Link from "next/link";
import { format, parseISO } from "date-fns";
import type { Event, Venue } from "@/lib/types";

// venue is required on this component (not optional like on Event)
interface CalendarCardProps {
  event: Event & { venue: Venue };
}

function formatTime(t: string | null): string | null {
  if (!t) return null;
  return t.slice(0, 5); // "21:00:00" → "21:00"
}

export default function CalendarCard({ event }: CalendarCardProps) {
  const date = parseISO(event.event_date);

  return (
    <div className="flex overflow-hidden rounded-xl border border-[#2A2A2A] bg-[#141414] transition-all duration-300 hover:border-[#C9A84C]/40 hover:bg-[#181818]">

      {/* ── Date column ── */}
      <div className="flex w-[76px] flex-shrink-0 flex-col items-center justify-center gap-0.5 bg-[#1C1C1C] py-5 text-center">
        <span className="text-[11px] font-semibold uppercase tracking-widest text-[#C9A84C]">
          {format(date, "MMM")}
        </span>
        <span className="font-playfair text-[32px] font-bold leading-none text-[#F0EDE6]">
          {format(date, "d")}
        </span>
        <span className="text-[10px] uppercase tracking-wider text-[#A89F8C]">
          {format(date, "EEE")}
        </span>
      </div>

      {/* ── Event info ── */}
      <div className="flex flex-1 flex-col justify-between p-4">
        <div>
          <Link
            href={`/venues/${event.venue.slug}`}
            className="text-[10px] font-semibold uppercase tracking-widest text-[#C9A84C] hover:underline"
          >
            {event.venue.name}
          </Link>
          <h3 className="mt-0.5 font-playfair text-[16px] font-semibold leading-snug text-[#F0EDE6]">
            {event.title}
          </h3>
          {event.description && (
            <p className="mt-1.5 line-clamp-2 text-[13px] leading-relaxed text-[#A89F8C]">
              {event.description}
            </p>
          )}
        </div>

        {/* Footer row */}
        <div className="mt-3 flex flex-wrap items-center gap-3">
          {event.start_time && (
            <span className="text-xs text-[#A89F8C]">
              {formatTime(event.start_time)}
              {event.end_time ? ` – ${formatTime(event.end_time)}` : ""}
            </span>
          )}
          {event.ticket_price && (
            <span className="rounded-full border border-[#C9A84C]/30 bg-[#C9A84C]/10 px-2.5 py-0.5 text-[11px] text-[#C9A84C]">
              {event.ticket_price}
            </span>
          )}
          {event.ticket_url && (
            <a
              href={event.ticket_url}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-auto rounded-lg bg-[#C9A84C] px-3 py-1 text-xs font-semibold text-[#0D0D0D] transition-opacity hover:opacity-90"
            >
              Get tickets →
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
