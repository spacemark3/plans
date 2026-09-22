import type { PartnerId } from '@/app/lib/auth'

/**
 * Server-safe: takes the already-resolved display name, so it never needs
 * `process.env` and can be rendered from a client component too.
 */
export default function AuthorChip({
  name,
  self = false,
}: {
  name: string
  /** True when this is the logged-in partner — worth a gentle visual nudge. */
  self?: boolean
}) {
  /* Replaces the old 💗/💙 pair. `name` is already resolved upstream by
     partnerName(), which never returns an empty string, so charAt(0) is safe.
     aria-hidden keeps it decorative — a screen reader still reads only the
     name, exactly as it did with the emoji. */
  const initial = name.trim().charAt(0).toUpperCase()

  return (
    <span className={self ? 'chip' : 'chip chip-quiet'}>
      <span
        aria-hidden="true"
        className="flex h-4 w-4 items-center justify-center border-2 border-ink text-[0.625rem] leading-none"
      >
        {initial}
      </span>
      {name}
    </span>
  )
}

/** Handy where only the id is around and the caller already resolved names. */
export function isSelf(author: PartnerId, me: PartnerId): boolean {
  return author === me
}
