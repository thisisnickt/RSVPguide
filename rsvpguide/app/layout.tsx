import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "RSVPGuide — Discover the Best Venues & Events",
    template: "%s | RSVPGuide",
  },
  description:
    "RSVPGuide is your curated guide to the best venues, bars, restaurants, and events near you.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://rsvpguide.com"),
  openGraph: {
    title: "RSVPGuide — Discover the Best Venues & Events",
    description: "Your curated guide to the best venues and events.",
    url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://rsvpguide.com",
    siteName: "RSVPGuide",
    locale: "en_GB",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable}`}>
      <body className="bg-brand-bg text-brand-text-primary antialiased">{children}</body>
    </html>
  );
}
