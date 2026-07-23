import Link from "next/link";
import { createAdminClient } from "@/lib/supabase";
import VenueCard from "@/components/VenueCard";
import CalendarCard from "@/components/CalendarCard";
import DigestPreview from "@/components/DigestPreview";
import type { Event, Venue } from "@/lib/types";

const STATS = [
  { value: "30", label: "Premium venues" },
  { value: "12", label: "Weekly events" },
  { value: "8",  label: "Neighbourhoods" },
];

type EventWithVenue = Event & { venue: Venue };

async function getFeaturedVenues(): Promise<Venue[]> {
  try {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from("venues")
      .select("*")
      .eq("is_active", true)
      .eq("is_featured", true)
      .order("name", { ascending: true })
      .limit(4);
    return (data ?? []) as Venue[];
  } catch {
    return [];
  }
}

async function getUpcomingEvents(): Promise<EventWithVenue[]> {
  try {
    const supabase = createAdminClient();
    const today = new Date().toISOString().split("T")[0];
    const { data } = await supabase
      .from("events")
      .select("*, venue:venues(*)")
      .eq("is_active", true)
      .gte("event_date", today)
      .order("event_date", { ascending: true })
      .order("start_time", { ascending: true })
      .limit(6);
    return (data ?? []) as unknown as EventWithVenue[];
  } catch {
    return [];
  }
}

export default async function HomePage() {
  const [featuredVenues, events] = await Promise.all([
    getFeaturedVenues(),
    getUpcomingEvents(),
  ]);

  return (
    <>
      {/* ── Hero ─────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden border-b border-[#2A2A2A] bg-[#0D0D0D] px-4 py-24 text-center sm:py-32">
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="h-[700px] w-[700px] rounded-full bg-[#C9A84C]/5 blur-3xl" />
        </div>
        <div className="relative mx-auto max-w-3xl">
          <p className="mb-5 text-[11px] font-semibold uppercase tracking-[0.3em] text-[#C9A84C]">
            Singapore&apos;s premier nightlife guide
          </p>
          <h1 className="font-playfair text-5xl font-bold leading-[1.1] text-[#F0EDE6] sm:text-[52px]">
            Where to go.{" "}
            <span className="text-[#C9A84C]">What&apos;s on.</span>
            <br />Tonight.
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-[#A89F8C]">
            Curated bars, clubs, live music and entertainment across Singapore
            — updated weekly.
          </p>

          {/* Stats */}
          <div className="mt-10 flex flex-wrap items-center justify-center divide-x divide-[#2A2A2A]">
            {STATS.map(({ value, label }) => (
              <div key={label} className="px-8 text-center first:pl-0 last:pr-0">
                <p className="font-playfair text-3xl font-bold text-[#C9A84C]">{value}</p>
                <p className="mt-0.5 text-xs uppercase tracking-widest text-[#A89F8C]">{label}</p>
              </div>
            ))}
          </div>

          {/* CTAs */}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/venues"
              className="rounded-lg bg-[#C9A84C] px-7 py-3 text-sm font-semibold text-[#0D0D0D] transition-opacity hover:opacity-90"
            >
              Explore venues →
            </Link>
            <Link
              href="/calendar"
              className="rounded-lg border border-[#2A2A2A] px-7 py-3 text-sm font-medium text-[#A89F8C] transition-colors hover:border-[#C9A84C]/40 hover:text-[#F0EDE6]"
            >
              This week&apos;s events →
            </Link>
          </div>
        </div>
      </section>

      {/* ── Editor's picks ───────────────────────────────────────── */}
      {featuredVenues.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
          <div className="mb-8 flex items-end justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#C9A84C]">
                Handpicked
              </p>
              <h2 className="mt-1 font-playfair text-3xl font-bold text-[#F0EDE6]">
                Editor&apos;s picks
              </h2>
            </div>
            <Link
              href="/venues?featured=true"
              className="text-sm text-[#A89F8C] transition-colors hover:text-[#C9A84C]"
            >
              View all →
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            {featuredVenues.map((venue, i) => (
              <VenueCard key={venue.id} venue={venue} priority={i < 2} />
            ))}
          </div>
        </section>
      )}

      {/* ── This week ────────────────────────────────────────────── */}
      {events.length > 0 && (
        <section className="border-t border-[#2A2A2A] bg-[#0D0D0D] px-4 py-16 sm:px-6">
          <div className="mx-auto max-w-7xl">
            <div className="mb-8 flex items-end justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#C9A84C]">
                  Events
                </p>
                <h2 className="mt-1 font-playfair text-3xl font-bold text-[#F0EDE6]">
                  This week in Singapore
                </h2>
              </div>
              <Link
                href="/calendar"
                className="text-sm text-[#A89F8C] transition-colors hover:text-[#C9A84C]"
              >
                Full calendar →
              </Link>
            </div>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {events.map((event) => (
                <CalendarCard key={event.id} event={event} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Digest signup ────────────────────────────────────────── */}
      <section className="border-t border-[#2A2A2A] bg-[#0D0D0D] px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-xl">
          <DigestPreview />
        </div>
      </section>
    </>
  );
}
