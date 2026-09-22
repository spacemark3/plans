import { NextResponse, type NextRequest } from 'next/server'

import { COOKIE_NAME, verifySession } from '@/app/lib/auth'

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const session = await verifySession(request.cookies.get(COOKIE_NAME)?.value)

  if (pathname === '/') {
    return session
      ? NextResponse.redirect(new URL('/home', request.nextUrl))
      : NextResponse.next()
  }

  if (!session) return NextResponse.redirect(new URL('/', request.nextUrl))
  return NextResponse.next()
}

// /api/* is deliberately NOT matched: a JSON client needs 401, not a 307 to HTML.
// Each route handler calls getSession() itself. Each page calls requireSession().
// This redundancy is required by the Next docs — do not "optimise" it away.
//
// Do NOT add `runtime` to this config: the option is not available in Proxy
// files and setting it throws. Proxy is Node.js by default in Next 16.
// Keep in step with NAV_LINKS in app/components/navLinks.ts — a new page route
// that is missing here loses its proxy guard without any visible symptom.
export const config = {
  matcher: [
    '/',
    '/home/:path*',
    '/trips/:path*',
    '/challenges/:path*',
    '/blog/:path*',
  ],
}
