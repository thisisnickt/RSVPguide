import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

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
    default: "RSVPGuide — Singapore's Curated Nightlife Guide",
    template: "%s | RSVPGuide",
  },
  description:
    "Singapore's curated guide to the best bars, clubs, rooftop venues and events.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://rsvpguide.com"),
  openGraph: {
    title: "RSVPGuide — Singapore's Curated Nightlife Guide",
    description: "Singapore's curated guide to the best bars, clubs, rooftop venues and events.",
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
      <body className="flex min-h-screen flex-col bg-[#0D0D0D] text-[#F0EDE6] antialiased">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
