import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-serif",
  display: "swap",
});

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://rsvpguide.com";

// ── og:image note ─────────────────────────────────────────────────────────────
// Create /public/og-image.png at 1200×630 px.
// Suggested design: #0D0D0D background, "RSVP" in white Playfair Display +
// "guide" in #C9A84C, tagline "Singapore's Curated Nightlife Guide" below in
// #A89F8C, subtle Singapore skyline silhouette along the bottom edge.
// ─────────────────────────────────────────────────────────────────────────────

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),

  title: {
    default: "RSVPguide | Singapore Nightlife & Entertainment",
    template:  "%s | RSVPguide",
  },
  description:
    "Singapore's curated guide to nightlife, bars, clubs, live music and entertainment. Updated weekly.",
  keywords: [
    "Singapore nightlife",
    "Singapore bars",
    "Singapore clubs",
    "live music Singapore",
    "things to do Singapore tonight",
    "Singapore cocktail bars",
    "Clarke Quay",
    "Marina Bay Sands nightlife",
  ],

  openGraph: {
    title:       "RSVPguide | Singapore Nightlife & Entertainment",
    description: "Singapore's curated guide to nightlife, bars, clubs, live music and entertainment.",
    url:         BASE_URL,
    siteName:    "RSVPguide",
    locale:      "en_SG",
    type:        "website",
    images: [
      {
        url:    "/og-image.png",
        width:  1200,
        height: 630,
        alt:    "RSVPguide — Singapore nightlife and entertainment",
      },
    ],
  },

  twitter: {
    card:        "summary_large_image",
    title:       "RSVPguide | Singapore Nightlife & Entertainment",
    description: "Singapore's curated guide to nightlife, bars, clubs and live music.",
    images:      ["/og-image.png"],
  },

  robots: {
    index:  true,
    follow: true,
    googleBot: {
      index:               true,
      follow:              true,
      "max-image-preview": "large",
      "max-snippet":       -1,
    },
  },

  alternates: {
    canonical: BASE_URL,
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable}`}>
      <body className="flex min-h-screen flex-col bg-[#0D0D0D] text-[#F0EDE6] antialiased">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
