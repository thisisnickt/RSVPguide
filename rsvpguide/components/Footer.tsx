import Link from "next/link";

const FOOTER_LINKS = [
  { label: "About",          href: "/about" },
  { label: "List a venue",   href: "/list-venue" },
  { label: "Advertise",      href: "/advertise" },
  { label: "Weekly digest",  href: "/digest" },
  { label: "Contact",        href: "/contact" },
] as const;

export default function Footer() {
  return (
    <footer className="mt-auto border-t border-[#2A2A2A] bg-[#0D0D0D]">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">

        <div className="flex flex-col gap-10 md:flex-row md:items-start md:justify-between">

          {/* Brand column */}
          <div className="flex flex-col gap-3">
            <Link href="/" className="select-none">
              <span className="font-playfair text-2xl font-bold text-white">RSVP</span>
              <span className="font-playfair text-2xl font-bold text-[#C9A84C]">guide</span>
            </Link>
            <p className="max-w-[260px] text-sm leading-relaxed text-[#A89F8C]">
              Singapore&apos;s curated nightlife and entertainment guide.
            </p>
          </div>

          {/* Nav links */}
          <nav className="flex flex-wrap gap-x-8 gap-y-3 md:pt-1">
            {FOOTER_LINKS.map(({ label, href }) => (
              <Link
                key={href}
                href={href}
                className="text-sm text-[#A89F8C] transition-colors duration-200 hover:text-[#C9A84C]"
              >
                {label}
              </Link>
            ))}
          </nav>
        </div>

        {/* Bottom bar */}
        <div className="mt-10 border-t border-[#2A2A2A] pt-6">
          <p className="text-center text-xs text-[#A89F8C]">
            © 2026 RSVPguide.com &nbsp;·&nbsp; Owned and managed by{" "}
            <a
              href="https://launched.asia"
              target="_blank"
              rel="noopener noreferrer"
              className="transition-colors hover:text-[#C9A84C]"
            >
              Launched Studios
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
