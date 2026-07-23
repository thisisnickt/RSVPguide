import { format, parseISO } from "date-fns";
import type { Event, Venue } from "@/lib/types";

interface DigestPreviewProps {
  weekStart: string;
  weekEnd: string;
  events: Event[];
  featuredVenues: Venue[];
}

export default function DigestPreview({
  weekStart,
  weekEnd,
  events,
  featuredVenues,
}: DigestPreviewProps) {
  const start = parseISO(weekStart);
  const end = parseISO(weekEnd);

  return (
    <div className="rounded-lg border border-brand-border bg-brand-card p-6 space-y-6">
      <div className="border-b border-brand-border pb-4">
        <h2 className="font-playfair text-2xl font-bold text-brand-text-primary">
          RSVPGuide Weekly Digest
        </h2>
        <p className="mt-1 text-sm text-brand-text-secondary">
          {format(start, "d MMMM")} – {format(end, "d MMMM yyyy")}
        </p>
      </div>

      {featuredVenues.length > 0 && (
        <section>
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-widest text-brand-gold">
            Featured Venues
          </h3>
          <ul className="space-y-2">
            {featuredVenues.map((venue) => (
              <li key={venue.id} className="text-sm text-brand-text-primary">
                <span className="font-medium">{venue.name}</span>
                <span className="ml-2 text-brand-text-secondary">{venue.city}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {events.length > 0 && (
        <section>
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-widest text-brand-gold">
            Upcoming Events
          </h3>
          <ul className="space-y-3">
            {events.map((event) => (
              <li key={event.id} className="border-l-2 border-brand-gold pl-3">
                <p className="text-sm font-medium text-brand-text-primary">{event.title}</p>
                <p className="text-xs text-brand-text-secondary">
                  {format(parseISO(event.date), "EEEE, d MMMM")} &bull; {event.start_time}
                  {event.venue ? ` — ${event.venue.name}` : ""}
                </p>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
