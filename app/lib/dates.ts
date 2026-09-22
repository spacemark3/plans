/**
 * Every date the UI renders, formatted in one place.
 *
 * THE TIME ZONE IS PINNED ON PURPOSE. `Intl.DateTimeFormat` with no `timeZone`
 * uses whatever zone the runtime is in — the server renders in UTC on Vercel
 * while the browser renders in the visitor's local zone. The two then disagree
 * and React reports a hydration mismatch. With a date alone that only bit
 * around midnight, which is why it went unnoticed; now that the hour is shown
 * it would be wrong several times a day.
 *
 * Both partners are in Italy, so that is the zone the app speaks in. Change
 * this one constant to move the whole app.
 */
export const APP_TIME_ZONE = 'Europe/Rome'
const LOCALE = 'en-GB'

/** "22 September 2026" — for anything where the hour adds nothing. */
export const LONG_DATE = new Intl.DateTimeFormat(LOCALE, {
  dateStyle: 'long',
  timeZone: APP_TIME_ZONE,
})

/** "22 September 2026 at 14:30" — the default for creation timestamps. */
export const LONG_DATE_TIME = new Intl.DateTimeFormat(LOCALE, {
  dateStyle: 'long',
  timeStyle: 'short',
  timeZone: APP_TIME_ZONE,
})

/** "22 Sep, 14:30" — the compact form for list rows and index entries. */
export const SHORT_DATE_TIME = new Intl.DateTimeFormat(LOCALE, {
  day: 'numeric',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
  timeZone: APP_TIME_ZONE,
})

const RELATIVE = new Intl.RelativeTimeFormat(LOCALE, { numeric: 'auto' })

const DIVISIONS: { amount: number; unit: Intl.RelativeTimeFormatUnit }[] = [
  { amount: 60, unit: 'second' },
  { amount: 60, unit: 'minute' },
  { amount: 24, unit: 'hour' },
  { amount: 7, unit: 'day' },
  { amount: 4.34524, unit: 'week' },
  { amount: 12, unit: 'month' },
  { amount: Number.POSITIVE_INFINITY, unit: 'year' },
]

/**
 * "3 days ago". Unlike the formatters above this depends on `Date.now()`, so it
 * can legitimately differ between the server render and the client one — it is
 * only ever used next to an absolute timestamp, never as the sole source of
 * when something happened.
 */
export function relativeDate(iso: string): string {
  let duration = (new Date(iso).getTime() - Date.now()) / 1000
  for (const division of DIVISIONS) {
    if (Math.abs(duration) < division.amount) {
      return RELATIVE.format(Math.round(duration), division.unit)
    }
    duration /= division.amount
  }
  return ''
}
