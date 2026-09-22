'use client'

import Image from 'next/image'

import AuthorChip from '@/app/components/AuthorChip'
import type { PartnerId } from '@/app/lib/auth'
import { LONG_DATE_TIME } from '@/app/lib/dates'
import type { PostDTO } from '@/app/lib/types'

/**
 * Collapsed row + inline expanded body — the same interaction as `ItemCard`,
 * because a feed of full posts gets long fast and the index beside it is only
 * useful if the list it points into is scannable.
 *
 * The row toggle is a `<button>` and the Edit/Delete buttons live in the body
 * as its SIBLINGS, never nested: a button may never contain a button.
 */
export default function PostCard({
  post,
  me,
  index,
  expanded,
  pending = false,
  onToggleExpand,
  onEdit,
  onDelete,
}: {
  post: PostDTO
  me: PartnerId
  /** 1-based position in the feed, shown as the card's index number. */
  index: number
  expanded: boolean
  pending?: boolean
  onToggleExpand: () => void
  onEdit: () => void
  onDelete: () => void
}) {
  const bodyId = `post-${post.id}-body`

  return (
    <article
      id={`post-${post.id}`}
      /* scroll-mt clears the sticky nav when the index jumps to this card. */
      className="card-brut scroll-mt-28 overflow-hidden"
    >
      <button
        type="button"
        onClick={onToggleExpand}
        aria-expanded={expanded}
        aria-controls={bodyId}
        className="flex w-full items-center gap-3 p-4 text-left"
      >
        <span aria-hidden="true" className="mark h-11 w-11 shrink-0 bg-cyan text-sm">
          {String(index).padStart(2, '0')}
        </span>

        <span className="min-w-0 flex-1">
          <span className="block truncate font-display text-title">
            {post.title}
          </span>
          <span className="mt-1 flex flex-wrap items-center gap-2">
            <AuthorChip name={post.authorName} self={post.author === me} />
            <span className="font-mono text-xs text-ink-muted">
              {LONG_DATE_TIME.format(new Date(post.createdAt))}
            </span>
          </span>
        </span>

        <span
          aria-hidden="true"
          className={[
            'shrink-0 text-xl transition-transform duration-100',
            expanded ? 'rotate-90' : '',
          ].join(' ')}
        >
          ›
        </span>
      </button>

      <div id={bodyId} hidden={!expanded} className="rule">
        <div className="flex flex-col gap-4 p-4">
          {post.photoUrl ? (
            <div className="frame relative aspect-[4/3] w-full overflow-hidden">
              <Image
                src={post.photoUrl}
                alt={`Photo from the post "${post.title}"`}
                fill
                sizes="(max-width: 640px) 100vw, 640px"
                className="object-cover"
              />
            </div>
          ) : null}

          <p className="text-sm leading-relaxed whitespace-pre-wrap text-ink">
            {post.body}
          </p>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="btn-ghost"
              onClick={onEdit}
              disabled={pending}
            >
              Edit
            </button>
            <button
              type="button"
              className="btn-ghost"
              onClick={onDelete}
              disabled={pending}
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </article>
  )
}
