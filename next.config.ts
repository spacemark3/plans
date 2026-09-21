import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Mongoose must not be bundled — it does dynamic requires that break under
  // the server bundler.
  serverExternalPackages: ['mongoose'],

  images: {
    // Object form, with `search: ''` set explicitly: omitting `search` allows
    // any query string, which lets someone craft optimizer URLs you did not
    // intend. A 400 from /_next/image almost always means this block is wrong.
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.public.blob.vercel-storage.com',
        port: '',
        pathname: '/**',
        search: '',
      },
    ],
  },
}

export default nextConfig
