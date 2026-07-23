"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { FiMenu, FiX } from "react-icons/fi";

const NAV_LINKS = [
  { label: "Venues",      href: "/venues" },
  { label: "This Week",   href: "/calendar" },
  { label: "Dining",      href: "/dining" },
  { label: "Promotions",  href: "/promotions" },
] as const;

/** Renders /public/logo.png if present; falls back to the text logo. */
function Logo() {
  const [imgError, setImgError] = useState(false);

  if (imgError) {
    return (
      <>
        <span className="font-playfair text-xl font-bold tracking-tight text-white">RSVP</span>
        <span className="font-playfair text-xl font-bold tracking-tight text-[#C9A84C]">guide</span>
      </>
    );
  }

  return (
    <Image
      src="/logo.png"
      alt="RSVPguide"
      width={120}
      height={36}
      priority
      className="h-9 w-auto object-contain"
      onError={() => setImgError(true)}
    />
  );
}

export default function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-[#2A2A2A] bg-[#0D0D0D]">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">

        {/* ── Logo ── */}
        <Link
          href="/"
          className="select-none"
          onClick={() => setOpen(false)}
        >
          <Logo />
        </Link>

        {/* ── Centre nav (desktop) ── */}
        <nav className="hidden items-center gap-7 md:flex">
          {NAV_LINKS.map(({ label, href }) => (
            <Link
              key={href}
              href={href}
              className="text-[11px] font-medium uppercase tracking-widest text-[#A89F8C] transition-colors duration-200 hover:text-[#C9A84C]"
            >
              {label}
            </Link>
          ))}
        </nav>

        {/* ── Right side ── */}
        <div className="flex items-center gap-3">
          <Link
            href="/submit"
            className="hidden items-center gap-1 rounded border border-[#C9A84C] px-4 py-1.5 text-[11px] font-semibold tracking-wide text-[#C9A84C] transition-all duration-200 hover:bg-[#C9A84C] hover:text-[#0D0D0D] sm:inline-flex"
          >
            List your venue →
          </Link>

          {/* Hamburger (mobile only) */}
          <button
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            className="flex h-9 w-9 items-center justify-center rounded text-[#A89F8C] hover:text-[#F0EDE6] md:hidden"
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <FiX size={20} /> : <FiMenu size={20} />}
          </button>
        </div>
      </div>

      {/* ── Mobile dropdown ── */}
      {open && (
        <div className="border-t border-[#2A2A2A] bg-[#0D0D0D] px-4 pb-5 md:hidden">
          <nav className="flex flex-col gap-5 pt-5">
            {NAV_LINKS.map(({ label, href }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className="text-sm uppercase tracking-widest text-[#A89F8C] hover:text-[#C9A84C]"
              >
                {label}
              </Link>
            ))}
            <Link
              href="/submit"
              onClick={() => setOpen(false)}
              className="mt-1 inline-flex w-fit items-center gap-1 rounded border border-[#C9A84C] px-4 py-1.5 text-[11px] font-semibold tracking-wide text-[#C9A84C]"
            >
              List your venue →
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
