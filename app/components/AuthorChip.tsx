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
  return (
    <span className={self ? 'chip' : 'chip chip-quiet'}>
      <span aria-hidden="true">{self ? '💗' : '💙'}</span>
      {name}
    </span>
  )
}

/** Handy where only the id is around and the caller already resolved names. */
export function isSelf(author: PartnerId, me: PartnerId): boolean {
  return author === me
}
