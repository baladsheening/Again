import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: {
    /**
     * Poster thumbnails are served by TMDB's CDN, not by us. Never proxy images
     * through the app (§3) — `unoptimized` keeps `next/image` from routing them
     * via `/_next/image`, so egress stays TMDB's and not ours.
     */
    unoptimized: true,
    remotePatterns: [{ protocol: 'https', hostname: 'image.tmdb.org' }],
  },

  typedRoutes: true,
}

export default nextConfig
