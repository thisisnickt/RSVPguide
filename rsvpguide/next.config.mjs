/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        // Google Places Photo API — redirects to lh3.googleusercontent.com
        protocol: "https",
        hostname: "maps.googleapis.com",
        pathname: "/maps/api/place/photo**",
      },
      {
        // Actual CDN host that Google redirects the photo request to
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
    ],
  },
};

export default nextConfig;
