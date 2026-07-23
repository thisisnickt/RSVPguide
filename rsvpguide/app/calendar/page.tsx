import type { Metadata } from "next";
import { format, parseISO } from "date-fns";
import { createAdminClient } from "@/lib/supabase";
import CalendarCard from "@/components/CalendarCard";
import type { Event, Venue } from "@/lib/types";

export const metadata: Metadata = {
  title: "This Week",
  description: "Live music, DJ nights and events in Singapore this week.",
};

export const revalidate = 3600;

type EventWithVenue = Event & { venue: Venue };

async function getEvents(): Promise<EventWithVenue[]> {
  try {
    const supabase = createAdminClient();
    const today = new Date().toISOString().split("T")[0];
    const in30   = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
                     .toISOString().split("T")[0];

    const { data } = await supabase
      .from("events")
      .select("*, venue:venues(*)")
      .eq("is_active", true)
      .gte("event_date", today)
      .lte("event_date", in30)
      .order("event_date", { ascending: true })
      .order("start_time", { ascending: true });

    return (data ?? []) as unknown as EventWithVenue[];
  } catch {
    return [];
  }
}

export default async function CalendarPage() {
  const events = await getEvents();

  // Group by event_date
  const grouped = events.reduce<Record<string, EventWithVenue[]>>((acc, event) => {
    const key = event.event_date;
    if (!acc[key]) acc[key] = [];
    acc[key].push(event);
    return acc;
  }, {});

  const sortedDates = Object.keys(grouped).sort();

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      {/* Page header */}
      <div className="mb-10">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#C9A84C]">
          Events
        </p>
        <h1 className="mt-1 font-playfair text-4xl font-bold text-[#F0EDE6]">
          This week in Singapore
        </h1>
        <p className="mt-2 text-sm text-[#A89F8C]">
          DJ nights, live music and entertainment — next 30 days
        </p>
      </div>

      {sortedDates.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <p className="font-playfair text-xl text-[#F0EDE6]">No events listed yet</p>
          <p className="mt-2 text-sm text-[#A89F8C]">
            Check back soon — we update the calendar weekly.
          </p>
        </div>
      ) : (
        <div className="space-y-10">
          {sortedDates.map((dateStr) => (
            <section key={dateStr}>
              {/* Date heading */}
              <div className="mb-4 flex items-center gap-4">
                <h2 className="font-playfair text-xl font-semibold text-[#F0EDE6]">
                  {format(parseISO(dateStr), "EEEE d MMMM")}
                </h2>
                <div className="h-px flex-1 bg-[#2A2A2A]" />
              </div>

              {/* Events for this date */}
              <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                {grouped[dateStr].map((event) => (
                  <CalendarCard key={event.id} event={event} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
