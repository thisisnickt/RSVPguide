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

export const metadata: Metadata = {
  title: {
    default: "RSVPguide | Singapore's Curated Nightlife Guide",
    template: "RSVPguide | %s",
  },
  description: "Singapore's curated nightlife and entertainment guide.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://rsvpguide.com"),
  openGraph: {
    title: "RSVPguide | Singapore's Curated Nightlife Guide",
    description: "Singapore's curated nightlife and entertainment guide.",
    url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://rsvpguide.com",
    siteName: "RSVPguide",
    locale: "en_GB",
    type: "website",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "RSVPguide — Singapore nightlife",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "RSVPguide | Singapore's Curated Nightlife Guide",
    description: "Singapore's curated nightlife and entertainment guide.",
    images: ["/og-image.png"],
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
