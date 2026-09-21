import { del } from '@vercel/blob'

/**
 * Best-effort blob deletion. Never throws.
 *
 * Every caller runs this AFTER the database write has already succeeded, and a
 * failure here must never roll anything back: an orphaned blob costs pennies,
 * an orphaned record costs sanity. Also a no-op when there is no photo, so
 * callers don't have to guard — and so it stays silent before a Blob store
 * exists at all.
 */
export async function deletePhoto(url: string | null | undefined): Promise<void> {
  if (!url) return

  try {
    await del(url)
  } catch (error) {
    console.error('deletePhoto failed (ignored):', url, error)
  }
}
