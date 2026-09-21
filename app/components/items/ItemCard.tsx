'use client'

import Image from 'next/image'

import AuthorChip from '@/app/components/AuthorChip'
import type { PartnerId } from '@/app/lib/auth'
import type { ItemDTO } from '@/app/lib/types'

const KIND_EMOJI: Record<string, string> = { trip: '✈️', challenge: '🎯' }

const RELATIVE = new Intl.RelativeTimeFormat('it', { numeric: 'auto' })
const LONG_DATE = new Intl.DateTimeFormat('it-IT', { dateStyle: 'long' })

const DIVISIONS: { amount: number; unit: Intl.RelativeTimeFormatUnit }[] = [
  { amount: 60, unit: 'second' },
  { amount: 60, unit: 'minute' },
  { amount: 24, unit: 'hour' },
  { amount: 7, unit: 'day' },
  { amount: 4.34524, unit: 'week' },
  { amount: 12, unit: 'month' },
  { amount: Number.POSITIVE_INFINITY, unit: 'year' },
]

function relativeDate(iso: string): string {
  let duration = (new Date(iso).getTime() - Date.now()) / 1000
  for (const division of DIVISIONS) {
    if (Math.abs(duration) < division.amount) {
      return RELATIVE.format(Math.round(duration), division.unit)
    }
    duration /= division.amount
  }
  return ''
}

/**
 * Collapsed row + inline expanded body. There is no detail route in this app:
 * expanding changes no URL and mounts no portal, the body just appears inside
 * the same card.
 *
 * The row toggle is a `<button>` and the action buttons live in the body as its
 * SIBLINGS — same rule as CategorySection, a button may never contain a button.
 */
export default function ItemCard({
  item,
  me,
  expanded,
  pending = false,
  onToggleExpand,
  onToggleDone,
  onEdit,
  onDelete,
}: {
  item: ItemDTO
  me: PartnerId
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
      className={[
        'overflow-hidden rounded-field border transition-colors',
        item.done
          ? 'border-sage-200 bg-sage-50/60'
          : 'border-blush-100 bg-glass-strong',
      ].join(' ')}
    >
      <button
        type="button"
        onClick={onToggleExpand}
        aria-expanded={expanded}
        aria-controls={bodyId}
        className="flex w-full items-center gap-3 p-3 text-left transition-colors hover:bg-blush-50/60"
      >
        {item.photoUrl ? (
          <span className="relative h-11 w-11 shrink-0 overflow-hidden rounded-field bg-blush-100">
            <Image
              src={item.photoUrl}
              alt=""
              fill
              sizes="44px"
              className="object-cover"
            />
          </span>
        ) : (
          <span
            aria-hidden="true"
            className={[
              'flex h-11 w-11 shrink-0 items-center justify-center rounded-field text-xl',
              item.done ? 'bg-sage-100' : 'bg-blush-100',
            ].join(' ')}
          >
            {item.done ? '✓' : (KIND_EMOJI[item.kind] ?? '⭐')}
          </span>
        )}

        <span className="min-w-0 flex-1">
          <span
            className={[
              'block truncate text-sm font-semibold',
              item.done ? 'text-ink-500 line-through' : 'text-ink-900',
            ].join(' ')}
          >
            {item.title}
          </span>
          <span className="mt-1 flex flex-wrap items-center gap-2">
            <AuthorChip name={item.authorName} self={item.author === me} />
            <span className="text-xs text-ink-400">{relativeDate(item.createdAt)}</span>
          </span>
        </span>

        <span
          aria-hidden="true"
          className={[
            'shrink-0 text-ink-400 transition-transform duration-200',
            expanded ? 'rotate-90' : '',
          ].join(' ')}
        >
          ›
        </span>
      </button>

      <div id={bodyId} hidden={!expanded} className="border-t border-blush-100">
        <div className="flex flex-col gap-3 p-3">
          {item.photoUrl ? (
            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-field bg-blush-50">
              <Image
                src={item.photoUrl}
                alt={`Foto di ${item.title}`}
                fill
                sizes="(max-width: 640px) 100vw, 640px"
                className="object-cover"
              />
            </div>
          ) : null}

          {item.description ? (
            <p className="text-sm whitespace-pre-wrap text-ink-600">{item.description}</p>
          ) : (
            <p className="text-sm text-ink-400">Nessuna descrizione.</p>
          )}

          {item.done && item.completedAt ? (
            <p className="text-xs font-semibold text-sage-700">
              Completato il {LONG_DATE.format(new Date(item.completedAt))}
            </p>
          ) : null}

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="btn-primary"
              onClick={onToggleDone}
              disabled={pending}
            >
              {item.done ? 'Da fare' : 'Fatto! ✓'}
            </button>
            <button
              type="button"
              className="btn-ghost"
              onClick={onEdit}
              disabled={pending}
            >
              Modifica
            </button>
            <button
              type="button"
              className="btn-ghost"
              onClick={onDelete}
              disabled={pending}
            >
              Elimina
            </button>
          </div>
        </div>
      </div>
    </article>
  )
}
