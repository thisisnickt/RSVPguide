import Link from "next/link";

export default function Header() {
  return (
    <header className="border-b border-brand-border bg-brand-bg">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
        <Link href="/" className="font-playfair text-2xl font-bold text-brand-gold">
          RSVPGuide
        </Link>
        <nav className="flex items-center gap-6">
          <Link href="/venues" className="text-sm text-brand-text-secondary hover:text-brand-text-primary transition-colors">
            Venues
          </Link>
          <Link href="/calendar" className="text-sm text-brand-text-secondary hover:text-brand-text-primary transition-colors">
            Events
          </Link>
        </nav>
      </div>
    </header>
  );
}
