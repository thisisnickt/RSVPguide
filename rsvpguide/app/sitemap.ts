import type { MetadataRoute } from "next";
import { createAdminClient } from "@/lib/supabase";

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://rsvpguide.com";

const STATIC: MetadataRoute.Sitemap = [
  {
    url:             BASE,
    lastModified:    new Date(),
    changeFrequency: "daily",
    priority:        1.0,
  },
  {
    url:             `${BASE}/venues`,
    lastModified:    new Date(),
    changeFrequency: "daily",
    priority:        0.9,
  },
  {
    url:             `${BASE}/calendar`,
    lastModified:    new Date(),
    changeFrequency: "daily",
    priority:        0.8,
  },
  {
    url:             `${BASE}/submit`,
    lastModified:    new Date(),
    changeFrequency: "monthly",
    priority:        0.5,
  },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  try {
    const supabase = createAdminClient();
    const { data: venues } = await supabase
      .from("venues")
      .select("slug, updated_at")
      .eq("is_active", true)
      .order("name");

    const venueRoutes: MetadataRoute.Sitemap = (venues ?? []).map((v) => ({
      url:             `${BASE}/venues/${v.slug}`,
      lastModified:    new Date(v.updated_at),
      changeFrequency: "weekly" as const,
      priority:        0.8,
    }));

    return [...STATIC, ...venueRoutes];
  } catch {
    // Fall back to static routes if Supabase is unavailable at build time
    return STATIC;
  }
}
