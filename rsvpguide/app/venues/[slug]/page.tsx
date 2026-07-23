import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase";
import CalendarCard from "@/components/CalendarCard";
import type { Event, Venue } from "@/lib/types";

// ── Static generation ─────────────────────────────────────────────────────────

export const dynamicParams = true; // SSR on demand for slugs not in build

export async function generateStaticParams() {
  try {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from("venues")
      .select("slug")
      .eq("is_active", true);
    return (data ?? []).map(({ slug }) => ({ slug }));
  } catch {
    return [];
  }
}

// ── SEO ───────────────────────────────────────────────────────────────────────

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  try {
    const supabase = createAdminClient();
    const { data: v } = await supabase
      .from("venues")
      .select("name, description, neighbourhood, category")
      .eq("slug", params.slug)
      .single();

    if (!v) return { title: "Venue Not Found" };

    return {
      title: v.name,
      description:
        v.description ??
        `${v.name} — ${v.category} in ${v.neighbourhood}, Singapore.`,
    };
  } catch {
    return { title: "Venue" };
  }
}

// ── Data ──────────────────────────────────────────────────────────────────────

type EventWithVenue = Event & { venue: Venue };

async function getVenueAndEvents(slug: string) {
  const supabase = createAdminClient();
  const today = new Date().toISOString().split("T")[0];

  const [venueRes, eventsRes] = await Promise.all([
    supabase.from("venues").select("*").eq("slug", slug).eq("is_active", true).single(),
    supabase
      .from("events")
      .select("*")
      .eq("is_active", true)
      .gte("event_date", today)
      .order("event_date", { ascending: true })
      .order("start_time", { ascending: true }),
  ]);

  return { venue: venueRes.data as Venue | null, rawEvents: eventsRes.data ?? [] };
}

// ── Category badge colour ─────────────────────────────────────────────────────

const BADGE: Record<string, string> = {
  "Dance Club":   "bg-rose-950/80 text-rose-300",
  "Cocktail Bar": "bg-sky-950/80 text-sky-300",
  "Rooftop Bar":  "bg-emerald-950/80 text-emerald-300",
  "Pub / Brewery":"bg-amber-950/80 text-amber-300",
};

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function VenuePage({
  params,
}: {
  params: { slug: string };
}) {
  const { venue, rawEvents } = await getVenueAndEvents(params.slug);

  if (!venue) notFound();

  // Attach venue to events for CalendarCard
  const events: EventWithVenue[] = rawEvents
    .filter((e) => e.venue_id === venue.id)
    .map((e) => ({ ...(e as unknown as Event), venue }));

  const drinks = venue.signature_drinks
    ? venue.signature_drinks.split(",").map((d) => d.trim()).filter(Boolean)
    : [];

  const instagramUrl = venue.instagram
    ? `https://instagram.com/${venue.instagram.replace("@", "")}`
    : null;

  return (
    <article>
      {/* ── Hero image ────────────────────────────────────────────── */}
      <div className="relative h-[400px] w-full overflow-hidden bg-gradient-to-br from-[#1C1C1C] to-[#0D0D0D]">
        {venue.photo_url && (
          <Image
            src={venue.photo_url}
            alt={venue.name}
            fill
            priority
            className="object-cover"
            sizes="100vw"
          />
        )}
        {/* Gold-tinted overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0D0D0D] via-[#0D0D0D]/40 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#C9A84C]/5 to-transparent" />

        {/* Category badge */}
        <div className="absolute left-6 top-6">
          <span className={`rounded-full border border-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-widest backdrop-blur-sm ${BADGE[venue.category] ?? "bg-[#1C1C1C] text-[#A89F8C]"}`}>
            {venue.category}
          </span>
        </div>
      </div>

      {/* ── Main content ──────────────────────────────────────────── */}
      <div className="mx-auto max-w-4xl px-4 pb-20 sm:px-6">

        {/* Back link */}
        <div className="py-6">
          <Link
            href="/venues"
            className="text-sm text-[#A89F8C] transition-colors hover:text-[#C9A84C]"
          >
            ← Back to all venues
          </Link>
        </div>

        {/* Header */}
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#C9A84C]">
          {venue.neighbourhood}
        </p>
        <h1 className="mt-1 font-playfair text-4xl font-bold leading-tight text-[#F0EDE6] sm:text-5xl">
          {venue.name}
        </h1>

        {/* Key info strip */}
        <div className="mt-6 flex flex-wrap items-center gap-4 border-b border-[#2A2A2A] pb-6">
          {venue.hours && (
            <span className="flex items-center gap-2 text-sm text-[#A89F8C]">
              <span className="text-[#C9A84C]">◷</span> {venue.hours}
            </span>
          )}
          {venue.address && (
            <span className="text-sm text-[#A89F8C]">{venue.address}</span>
          )}
          {venue.phone && (
            <a href={`tel:${venue.phone}`} className="text-sm text-[#A89F8C] hover:text-[#F0EDE6]">
              {venue.phone}
            </a>
          )}
        </div>

        {/* CTA buttons */}
        <div className="mt-6 flex flex-wrap gap-3">
          {venue.booking_url && (
            <a
              href={venue.booking_url}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg bg-[#C9A84C] px-6 py-2.5 text-sm font-semibold text-[#0D0D0D] transition-opacity hover:opacity-90"
            >
              Book / Get tickets
            </a>
          )}
          {venue.website && (
            <a
              href={venue.website}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg border border-[#2A2A2A] px-6 py-2.5 text-sm font-medium text-[#A89F8C] transition-colors hover:border-[#C9A84C]/40 hover:text-[#F0EDE6]"
            >
              Visit website ↗
            </a>
          )}
        </div>

        {/* Description */}
        {venue.description && (
          <p className="mt-8 text-base leading-relaxed text-[#A89F8C]">
            {venue.description}
          </p>
        )}

        {/* Signature drinks */}
        {drinks.length > 0 && (
          <section className="mt-10">
            <h2 className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-[#C9A84C]">
              Signature drinks
            </h2>
            <div className="flex flex-wrap gap-2">
              {drinks.map((drink) => (
                <span
                  key={drink}
                  className="rounded-full border border-[#2A2A2A] bg-[#1C1C1C] px-3 py-1 text-sm text-[#F0EDE6]"
                >
                  {drink}
                </span>
              ))}
            </div>
          </section>
        )}

        {/* Entertainment */}
        {venue.entertainment && (
          <section className="mt-8">
            <h2 className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-[#C9A84C]">
              Programming
            </h2>
            <p className="text-sm leading-relaxed text-[#A89F8C]">{venue.entertainment}</p>
          </section>
        )}

        {/* Promotions */}
        {venue.known_promotions && (
          <section className="mt-8 rounded-xl border border-[#C9A84C]/20 bg-[#C9A84C]/5 p-4">
            <h2 className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-[#C9A84C]">
              Offers & promotions
            </h2>
            <p className="text-sm text-[#F0EDE6]">{venue.known_promotions}</p>
          </section>
        )}

        {/* Upcoming events */}
        {events.length > 0 && (
          <section className="mt-12">
            <h2 className="mb-4 font-playfair text-2xl font-bold text-[#F0EDE6]">
              Upcoming events
            </h2>
            <div className="flex flex-col gap-3">
              {events.map((event) => (
                <CalendarCard key={event.id} event={event} />
              ))}
            </div>
          </section>
        )}

        {/* Instagram */}
        {instagramUrl && venue.instagram && (
          <div className="mt-10 border-t border-[#2A2A2A] pt-8">
            <a
              href={instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm text-[#A89F8C] transition-colors hover:text-[#C9A84C]"
            >
              <span>Instagram</span>
              <span className="font-medium">{venue.instagram}</span>
              <span>↗</span>
            </a>
          </div>
        )}
      </div>
    </article>
  );
}
