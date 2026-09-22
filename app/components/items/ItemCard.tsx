'use client'

import Image from 'next/image'

import AuthorChip from '@/app/components/AuthorChip'
import type { PartnerId } from '@/app/lib/auth'
import { LONG_DATE_TIME, relativeDate } from '@/app/lib/dates'
import type { ItemDTO } from '@/app/lib/types'

/**
 * Collapsed row + inline expanded body. There is no detail route in this app:
 * expanding changes no URL and mounts no portal, the body just appears inside
 * the same card.
 *
 * The row toggle is a `<button>` and the action buttons live in the body as its
 * SIBLINGS, never nested: a button may never contain a button. Browsers recover
 * from that by splitting or dropping one, and keyboard activation then hits the
 * wrong target.
 */
export default function ItemCard({
  item,
  me,
  index,
  expanded,
  pending = false,
  onToggleExpand,
  onToggleDone,
  onEdit,
  onDelete,
}: {
  item: ItemDTO
  me: PartnerId
  /** 1-based position in its list, shown as the card's index number. */
  index: number
  expanded: boolean
  pending?: boolean
  onToggleExpand: () => void
  onToggleDone: () => void
  onEdit: () => void
  onDelete: () => void
}) {
  const bodyId = `item-${item.id}-body`

  return (
    <article
      id={`item-${item.id}`}
      /* The done state is no longer a translucent tint on the card. It is
         carried by three redundant, fully-opaque signals instead: the cyan icon
         badge, the strikethrough title, and the DONE stamp. A wash would have
         had to survive sitting under both paper and cyan; a stamp always reads.

         scroll-mt clears the sticky nav when the index jumps to this card. */
      className="frame scroll-mt-28 overflow-hidden"
    >
      <button
        type="button"
        onClick={onToggleExpand}
        aria-expanded={expanded}
        aria-controls={bodyId}
        className="flex w-full items-center gap-3 p-3 text-left"
      >
        {/* The index number, matching this card's entry in the section index. */}
        <span
          aria-hidden="true"
          className={[
            'mark h-11 w-11 shrink-0 text-sm',
            item.done ? 'bg-cyan' : 'bg-yellow',
          ].join(' ')}
        >
          {item.done ? '✓' : String(index).padStart(2, '0')}
        </span>

        {item.photoUrl ? (
          <span className="frame relative hidden h-11 w-11 shrink-0 overflow-hidden sm:block">
            <Image
              src={item.photoUrl}
              alt=""
              fill
              sizes="44px"
              className="object-cover"
            />
          </span>
        ) : null}

        <span className="min-w-0 flex-1">
          <span
            className={[
              'block truncate text-sm font-semibold',
              item.done ? 'text-ink-muted line-through' : 'text-ink',
            ].join(' ')}
          >
            {item.title}
          </span>
          <span className="mt-1 flex flex-wrap items-center gap-2">
            <AuthorChip name={item.authorName} self={item.author === me} />
            {item.done ? <span className="stamp">Done</span> : null}
            <span className="text-xs text-ink-muted">
              {relativeDate(item.createdAt)}
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
        <div className="flex flex-col gap-3 p-3">
          {item.photoUrl ? (
            <div className="frame relative aspect-[4/3] w-full overflow-hidden">
              <Image
                src={item.photoUrl}
                alt={`Photo of ${item.title}`}
                fill
                sizes="(max-width: 640px) 100vw, 640px"
                className="object-cover"
              />
            </div>
          ) : null}

          {item.description ? (
            <p className="text-sm whitespace-pre-wrap text-ink">{item.description}</p>
          ) : (
            <p className="text-sm text-ink-muted">No description.</p>
          )}

          {/* The collapsed row shows only "3 days ago"; the exact timestamp,
              with the hour, lives here. */}
          <p className="font-mono text-xs text-ink-muted">
            Added {LONG_DATE_TIME.format(new Date(item.createdAt))}
          </p>

          {item.done && item.completedAt ? (
            <p className="font-mono text-xs font-bold uppercase">
              Completed on {LONG_DATE_TIME.format(new Date(item.completedAt))}
            </p>
          ) : null}

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="btn-primary"
              onClick={onToggleDone}
              disabled={pending}
            >
              {item.done ? 'To do' : 'Done! ✓'}
            </button>
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
