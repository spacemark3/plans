/**
 * Session signing and password identification.
 *
 * This module imports NOTHING — no `next/*`, no `node:*` — so it is safe to pull
 * into the proxy bundle. It uses Web Crypto (`crypto.subtle`), which works in
 * both the Node.js and Edge runtimes, so one module serves the proxy, the route
 * handlers and the server components with no branching.
 *
 * The token is deliberately not a JWT: no header negotiation, no `alg: none` bug
 * class, no dependency. The `v1.` prefix gives us a rotation path.
 */

export type PartnerId = 'a' | 'b'
export type Session = { u: PartnerId; iat: number; exp: number }

export const COOKIE_NAME = 'bl_session'
export const MAX_AGE_SECONDS = 60 * 60 * 24 * 30

const enc = new TextEncoder()

/** base64url-encode bytes, without Buffer. */
function b64url(bytes: Uint8Array): string {
  let binary = ''
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i])
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

/** base64url-decode to bytes, without Buffer. Throws on malformed input. */
function unb64url(value: string): Uint8Array {
  const padded = value.replace(/-/g, '+').replace(/_/g, '/')
  const binary = atob(padded + '='.repeat((4 - (padded.length % 4)) % 4))
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return bytes
}

// The cache is an optimization only — correctness must not depend on it, since
// proxy invocations are not guaranteed to share module state.
let keyPromise: Promise<CryptoKey> | null = null

function getKey(): Promise<CryptoKey> {
  if (!keyPromise) {
    const secret = process.env.AUTH_SECRET
    if (!secret) throw new Error('Missing AUTH_SECRET environment variable')
    keyPromise = crypto.subtle.importKey(
      'raw',
      enc.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign'],
    )
  }
  return keyPromise
}

async function mac(data: string): Promise<string> {
  const signature = await crypto.subtle.sign('HMAC', await getKey(), enc.encode(data))
  return b64url(new Uint8Array(signature))
}

/** Constant-time compare of equal-length ASCII. */
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diff === 0
}

export async function signSession(u: PartnerId): Promise<string> {
  const now = Math.floor(Date.now() / 1000)
  const body = b64url(
    enc.encode(JSON.stringify({ u, iat: now, exp: now + MAX_AGE_SECONDS })),
  )
  return `v1.${body}.${await mac(body)}`
}

export async function verifySession(token?: string | null): Promise<Session | null> {
  if (!token) return null

  const parts = token.split('.')
  if (parts.length !== 3) return null

  const [version, body, signature] = parts
  if (version !== 'v1') return null

  if (!safeEqual(signature, await mac(body))) return null

  let payload: unknown
  try {
    payload = JSON.parse(new TextDecoder().decode(unb64url(body)))
  } catch {
    return null
  }

  if (typeof payload !== 'object' || payload === null) return null
  const { u, iat, exp } = payload as Record<string, unknown>

  if (u !== 'a' && u !== 'b') return null
  if (typeof iat !== 'number' || typeof exp !== 'number') return null
  // `exp` lives inside the signed payload — the cookie's own maxAge is only a
  // client-side convenience and is not trusted.
  if (exp * 1000 <= Date.now()) return null

  return { u, iat, exp }
}

/**
 * Identify which partner a password belongs to. Both sides are HMAC'd first
 * so comparison is always over fixed-length digests — no length or early-exit
 * leak. Both candidates are always evaluated (no short-circuit).
 */
export async function checkPassword(candidate: string): Promise<PartnerId | null> {
  const a = process.env.PARTNER_A_PASSWORD
  const b = process.env.PARTNER_B_PASSWORD

  const c = await mac(`pw:${candidate}`)
  // An unconfigured partner must never match, not even against an empty candidate.
  const isA = !!a && safeEqual(c, await mac(`pw:${a}`))
  const isB = !!b && safeEqual(c, await mac(`pw:${b}`))
  if (isA && isB) return null // passwords identical — refuse, identity is ambiguous
  return isA ? 'a' : isB ? 'b' : null
}
