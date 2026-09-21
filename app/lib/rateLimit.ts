/**
 * Fixed-window, in-memory rate limiting for the login route.
 *
 * HONEST CAVEAT: on Vercel this Map lives inside a single lambda instance, so
 * the limit is per-instance, not global. Under concurrency an attacker can get
 * more attempts than the nominal budget. This is a speed bump, not a wall — the
 * real defense is password entropy, which is why the README tells the couple to
 * use passphrases.
 */

const WINDOW_MS = 60_000
const MAX_ATTEMPTS = 10

/** Fixed delay applied to EVERY login attempt, success and failure alike, so
 *  response time never reveals whether a password was close. */
export const LOGIN_DELAY_MS = 300

type Window = { count: number; resetAt: number }

const attempts = new Map<string, Window>()

/** Drop expired windows so the Map cannot grow without bound. */
function sweep(now: number): void {
  for (const [key, window] of attempts) {
    if (window.resetAt <= now) attempts.delete(key)
  }
}

/** Returns true when the request is allowed to proceed. */
export function consumeLoginAttempt(ip: string): boolean {
  const now = Date.now()
  if (attempts.size > 1000) sweep(now)

  const existing = attempts.get(ip)
  if (!existing || existing.resetAt <= now) {
    attempts.set(ip, { count: 1, resetAt: now + WINDOW_MS })
    return true
  }

  existing.count += 1
  return existing.count <= MAX_ATTEMPTS
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/** Best-effort client address. Behind Vercel, `x-forwarded-for` is set. */
export function clientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0].trim()
  return request.headers.get('x-real-ip')?.trim() || 'unknown'
}
