import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Mongoose must not be bundled — it does dynamic requires that break under
  // the server bundler.
  serverExternalPackages: ['mongoose'],
}

export default nextConfig
