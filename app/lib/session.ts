import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

import {
  COOKIE_NAME,
  MAX_AGE_SECONDS,
  signSession,
  verifySession,
  type PartnerId,
  type Session,
} from './auth'

/**
 * The Next-aware wrapper around `auth.ts`. Kept in its own module so that
 * `next/headers` never enters the proxy bundle.
 */

export async function getSession(): Promise<Session | null> {
  // `cookies()` is async in Next 16 — it must be awaited.
  const cookieStore = await cookies()
  return verifySession(cookieStore.get(COOKIE_NAME)?.value)
}

/**
 * For pages. `redirect()` throws by design — never call this inside a try/catch
 * that swallows, or the redirect becomes a silent 500.
 *
 * Reading cookies also opts the page into dynamic rendering automatically, so
 * no `export const dynamic` is needed anywhere.
 */
export async function requireSession(): Promise<Session> {
  const session = await getSession()
  if (!session) redirect('/')
  return session
}

/** Legal only in a Route Handler or Server Action — never in a server component. */
export async function setSessionCookie(u: PartnerId): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.set(COOKIE_NAME, await signSession(u), {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: MAX_AGE_SECONDS,
    // A `Secure` cookie over http://localhost is silently dropped by the
    // browser, which looks like "login 200s then bounces straight back to the
    // gate". Gate it on NODE_ENV.
    secure: process.env.NODE_ENV === 'production',
  })
}

export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.set(COOKIE_NAME, '', {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
    secure: process.env.NODE_ENV === 'production',
  })
}
