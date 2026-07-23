/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        // Google Places Photo API — the URL itself redirects to lh3.googleusercontent.com
        protocol: "https",
        hostname: "maps.googleapis.com",
        pathname: "/maps/api/place/photo**",
      },
      {
        // Primary Google CDN host that Place Photo redirects land on
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      {
        // Google Street View / Maps photos sometimes serve from here
        protocol: "https",
        hostname: "streetviewpixels-pa.googleapis.com",
      },
      {
        // Unsplash backup photos
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
};

export default nextConfig;
