'use client'

import { useId, useState } from 'react'

export type IndexEntry = {
  /** The DOM id of the card this entry points at. */
  anchor: string
  /** Identifies the entry to the parent so it can open the right card. */
  id: string
  label: string
  meta?: string
  done?: boolean
}

/**
 * The numbered index for a section.
 *
 * It is rendered OUTSIDE `<main>` and, from `xl` up, positioned `fixed` against
 * the viewport. That is the point: it no longer shares a grid with the list, so
 * nothing the list does — growing, shrinking, a long title, an expanded card —
 * can move or resize it. Its left edge is computed from the centred content
 * column rather than hard-coded, and clamped so it can never slide off-screen:
 *
 *   main is max-w-3xl (48rem) centred  ->  its left edge is 50% - 24rem
 *   the index is 13rem wide + 1rem gap ->  50% - 38rem
 *   max(1rem, ...)                     ->  never negative on a narrow window
 *
 * Below `xl` there is no room for a gutter, so it becomes a disclosure that
 * starts CLOSED: a long index above the content would otherwise push the actual
 * list off the first screen on a phone.
 *
 * It lives in the client island rather than the server page because it has to
 * track items added, renamed and deleted without a round trip.
 */
export default function SectionIndex({
  entries,
  onSelect,
  label,
}: {
  entries: readonly IndexEntry[]
  onSelect?: (id: string) => void
  /** Names the landmark, e.g. "Trips index". */
  label: string
}) {
  const [open, setOpen] = useState(false)
  const panelId = useId()

  if (entries.length === 0) return null

  return (
    <div className="mx-auto w-full max-w-3xl px-4 pt-4 sm:px-6 xl:fixed xl:top-24 xl:left-[max(1rem,calc(50%-38rem))] xl:z-20 xl:mx-0 xl:w-52 xl:max-w-none xl:px-0 xl:pt-0">
      {/* The toggle exists only below xl; above it the panel is always open. */}
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
        aria-controls={panelId}
        className="btn-ghost w-full justify-between xl:hidden"
      >
        <span>Index · {entries.length}</span>
        <span
          aria-hidden="true"
          className={[
            'text-xl transition-transform duration-100',
            open ? 'rotate-90' : '',
          ].join(' ')}
        >
          ›
        </span>
      </button>

      {/*
        Visibility is a class, not the `hidden` attribute: `hidden` would need
        overriding at xl and the two mechanisms would fight. The panel stays
        mounted either way so aria-controls always points at a real element.
      */}
      <nav
        id={panelId}
        aria-label={label}
        className={[
          open ? 'block' : 'hidden',
          'card-brut mt-2 max-h-72 overflow-y-auto p-3',
          'xl:mt-0 xl:block xl:max-h-[calc(100vh-8rem)]',
        ].join(' ')}
      >
        <p className="text-section mb-2 hidden font-mono xl:block">Index</p>

        <ol className="flex flex-col gap-1">
          {entries.map((entry, i) => (
            <li key={entry.id}>
              <a
                href={`#${entry.anchor}`}
                onClick={() => {
                  onSelect?.(entry.id)
                  // On a phone the open panel covers the content it just
                  // jumped to, so get it out of the way.
                  setOpen(false)
                }}
                className="flex gap-2 px-1 py-1 text-xs hover:bg-yellow"
              >
                <span aria-hidden="true" className="font-mono font-bold">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span className="min-w-0 flex-1">
                  <span
                    className={[
                      'block truncate font-semibold',
                      entry.done ? 'line-through' : '',
                    ].join(' ')}
                  >
                    {entry.label}
                  </span>
                  {entry.meta ? (
                    <span className="block truncate font-mono text-ink-muted">
                      {entry.meta}
                    </span>
                  ) : null}
                </span>
              </a>
            </li>
          ))}
        </ol>
      </nav>
    </div>
  )
}
