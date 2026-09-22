import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Mongoose must not be bundled — it does dynamic requires that break under
  // the server bundler.
  serverExternalPackages: ['mongoose'],

  images: {
    // DEV ONLY — never true in a deployed build.
    //
    // Next 16's image optimizer resolves the upstream host with
    // `lookup(host, { family: 0, hints: dns.ALL })` and refuses the image if
    // ANY returned address is non-public. On a DNS64/NAT64 network — which
    // this developer machine is on — every hostname also resolves to a
    // synthesized `64:ff9b::/96` address. That prefix is IANA-reserved, so
    // `isPrivateIp()` calls it private and the whole fetch is rejected, even
    // though it encodes the same public IPv4 that resolved alongside it.
    //
    // The symptom is a 400 `"url" parameter is not allowed` from
    // /_next/image — identical to a remotePatterns miss, which is what makes
    // it so misleading. The tell is in the dev server log:
    //   ⨯ upstream image <url> resolved to private ip ["64:ff9b::..."]
    // If photos render in production but not locally, this is why.
    dangerouslyAllowLocalIP: process.env.NODE_ENV === 'development',

    // Object form, with `search: ''` set explicitly: omitting `search` allows
    // any query string, which lets someone craft optimizer URLs you did not
    // intend. A 400 from /_next/image can also mean this block is wrong —
    // check the log line above before suspecting it.
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
