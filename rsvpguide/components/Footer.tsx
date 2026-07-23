import Link from "next/link";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-brand-border bg-brand-bg mt-auto">
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <Link href="/" className="font-playfair text-xl font-bold text-brand-gold">
            RSVPGuide
          </Link>
          <nav className="flex items-center gap-6 text-sm text-brand-text-secondary">
            <Link href="/venues" className="hover:text-brand-text-primary transition-colors">
              Venues
            </Link>
            <Link href="/calendar" className="hover:text-brand-text-primary transition-colors">
              Events
            </Link>
          </nav>
          <p className="text-xs text-brand-text-secondary">
            &copy; {currentYear} RSVPGuide. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
