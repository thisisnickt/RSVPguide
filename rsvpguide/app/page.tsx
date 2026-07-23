import Link from "next/link";
import DigestPreview from "@/components/DigestPreview";

const STATS = [
  { value: "30+",   label: "Curated venues" },
  { value: "4",     label: "Categories" },
  { value: "Weekly", label: "Event digest" },
];

const CATEGORIES = [
  { label: "Dance Clubs",       slug: "Dance Club",    emoji: "🎧", desc: "World-class DJs, multi-room venues, Singapore's nightlife icons." },
  { label: "Cocktail Bars",     slug: "Cocktail Bar",  emoji: "🍸", desc: "Asia's 50 Best regulars, foraged ingredients, masterful bartenders." },
  { label: "Rooftop Bars",      slug: "Rooftop Bar",   emoji: "🌆", desc: "Skyline views, sunset sets, and Singapore's most dramatic backdrops." },
  { label: "Pubs & Breweries",  slug: "Pub / Brewery", emoji: "🍺", desc: "Craft brews, communal tables, and laid-back good times." },
];

export default function HomePage() {
  return (
    <>
      {/* ── Hero ────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden border-b border-[#2A2A2A] bg-[#0D0D0D] px-4 py-24 text-center sm:py-32">
        {/* Subtle radial glow */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="h-[600px] w-[600px] rounded-full bg-[#C9A84C]/5 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-3xl">
          <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.25em] text-[#C9A84C]">
            Singapore&apos;s curated nightlife guide
          </p>
          <h1 className="font-playfair text-5xl font-bold leading-tight text-[#F0EDE6] sm:text-6xl">
            The city&apos;s best nights,<br />
            <span className="text-[#C9A84C]">curated for you.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-[#A89F8C]">
            Discover Singapore&apos;s finest cocktail bars, dance clubs, rooftop venues and craft breweries —
            all in one place.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/venues"
              className="rounded-lg bg-[#C9A84C] px-7 py-3 text-sm font-semibold text-[#0D0D0D] transition-opacity hover:opacity-90"
            >
              Browse all venues
            </Link>
            <Link
              href="/calendar"
              className="rounded-lg border border-[#2A2A2A] px-7 py-3 text-sm font-medium text-[#A89F8C] transition-colors hover:border-[#C9A84C]/40 hover:text-[#F0EDE6]"
            >
              This week&apos;s events
            </Link>
          </div>
        </div>
      </section>

      {/* ── Stats strip ─────────────────────────────────────────── */}
      <section className="border-b border-[#2A2A2A] bg-[#141414]">
        <div className="mx-auto flex max-w-4xl divide-x divide-[#2A2A2A]">
          {STATS.map(({ value, label }) => (
            <div key={label} className="flex flex-1 flex-col items-center py-6 text-center">
              <span className="font-playfair text-2xl font-bold text-[#C9A84C]">{value}</span>
              <span className="mt-0.5 text-xs uppercase tracking-widest text-[#A89F8C]">{label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Category grid ───────────────────────────────────────── */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#C9A84C]">
          Explore by category
        </p>
        <h2 className="font-playfair text-3xl font-bold text-[#F0EDE6]">
          What are you looking for?
        </h2>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {CATEGORIES.map(({ label, slug, emoji, desc }) => (
            <Link
              key={slug}
              href={`/venues?category=${encodeURIComponent(slug)}`}
              className="group flex flex-col gap-3 rounded-xl border border-[#2A2A2A] bg-[#141414] p-5 transition-all duration-300 hover:border-[#C9A84C]/40 hover:bg-[#181818]"
            >
              <span className="text-3xl">{emoji}</span>
              <div>
                <h3 className="font-playfair text-lg font-semibold text-[#F0EDE6] group-hover:text-[#C9A84C] transition-colors">
                  {label}
                </h3>
                <p className="mt-1 text-[13px] leading-relaxed text-[#A89F8C]">{desc}</p>
              </div>
              <span className="mt-auto text-xs text-[#C9A84C] group-hover:underline">
                Browse {label.toLowerCase()} →
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* ── Digest signup ───────────────────────────────────────── */}
      <section className="border-t border-[#2A2A2A] bg-[#0D0D0D] px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-xl">
          <DigestPreview />
        </div>
      </section>
    </>
  );
}
