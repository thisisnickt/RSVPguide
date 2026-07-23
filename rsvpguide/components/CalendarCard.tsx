import Link from "next/link";
import { format, parseISO } from "date-fns";
import type { Event } from "@/lib/types";

interface CalendarCardProps {
  event: Event;
}

export default function CalendarCard({ event }: CalendarCardProps) {
  const eventDate = parseISO(event.event_date);

  return (
    <div className="flex gap-4 rounded-lg border border-brand-border bg-brand-card p-4 transition-colors hover:border-brand-gold">
      <div className="flex w-14 flex-shrink-0 flex-col items-center justify-center rounded bg-brand-surface py-2 text-center">
        <span className="text-xs font-medium uppercase tracking-wide text-brand-gold">
          {format(eventDate, "MMM")}
        </span>
        <span className="text-2xl font-bold text-brand-text-primary leading-tight">
          {format(eventDate, "dd")}
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="font-playfair font-semibold text-brand-text-primary line-clamp-1">
          {event.title}
        </h3>
        {event.venue && (
          <Link
            href={`/venues/${event.venue.slug}`}
            className="mt-0.5 block text-sm text-brand-gold hover:underline"
          >
            {event.venue.name}
          </Link>
        )}
        <p className="mt-1 text-sm text-brand-text-secondary line-clamp-2">{event.description}</p>
        <div className="mt-2 flex items-center justify-between">
          <span className="text-xs text-brand-text-secondary">
            {event.start_time}{event.end_time ? ` – ${event.end_time}` : ""}
          </span>
          {event.ticket_price && (
            <span className="text-xs font-medium text-brand-gold">
              {event.ticket_price}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
