/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Disabilita la cache per lo sviluppo
  onDemandEntries: {
    // periodo (in ms) in cui la pagina sarà mantenuta in memoria
    maxInactiveAge: 10 * 1000,
    // numero di pagine da mantenere in memoria
    pagesBufferLength: 1,
  },
  experimental: {
    typedRoutes: true
  },
  images: {
    remotePatterns: []
  },
  env: {
    NEXT_PUBLIC_MAPBOX_TOKEN: process.env.NEXT_PUBLIC_MAPBOX_TOKEN,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL
  }
};

module.exports = nextConfig;

