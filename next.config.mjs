/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Keep the native pg driver in the Node runtime (out of the bundler).
  serverExternalPackages: ['pg'],
}

export default nextConfig
