/** @type {import('next').NextConfig} */
const nextConfig = {
  // ── Hosting mode ─────────────────────────────────────────────────────────
  //
  // 'standalone' produces a self-contained Node.js server in
  // .next/standalone/server.js — required for Hostinger VPS (Node.js app).
  //
  // ⚠  If you are on Hostinger SHARED hosting (not VPS) you must change this
  //    to 'export' for a fully static HTML build. However, static export
  //    DISABLES all API routes (/api/*), server actions, and ISR. This project
  //    relies heavily on API routes, so Hostinger VPS is strongly recommended.
  //    See SETUP.md for full deployment instructions.
  //
  output: "standalone",

  // ── Image optimisation ────────────────────────────────────────────────────
  images: {
    // remotePatterns is the recommended (and more secure) way to allow
    // external image domains. The deprecated `images.domains` string-array
    // is not used here because it allows any path from those hosts.
    remotePatterns: [
      {
        // Google Places Photo API — redirects to lh3.googleusercontent.com
        protocol: "https",
        hostname: "maps.googleapis.com",
        pathname: "/maps/api/place/photo**",
      },
      {
        // Primary Google CDN host for Place Photo redirects
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      {
        // Secondary Google Maps / Street View CDN
        protocol: "https",
        hostname: "streetviewpixels-pa.googleapis.com",
      },
      {
        // Unsplash — backup / placeholder venue photos
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
};

export default nextConfig;
