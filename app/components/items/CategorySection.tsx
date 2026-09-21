'use client'

import type { ReactNode } from 'react'

/**
 * A collapsible category header plus its panel.
 *
 * The header toggle and the `+` create button are SIBLINGS, never nested. A
 * `<button>` inside a `<button>` is invalid HTML: browsers recover by splitting
 * or dropping one of them, and keyboard activation then hits the wrong target.
 * That is the single easiest thing to get wrong in this component.
 */
export default function CategorySection({
  id,
  title,
  emoji,
  count,
  open,
  onToggle,
  onCreate,
  createLabel,
  children,
}: {
  id: string
  title: string
  emoji: string
  count: number
  open: boolean
  onToggle: () => void
  onCreate: () => void
  createLabel: string
  children: ReactNode
}) {
  const panelId = `${id}-panel`

  return (
    <section className="card-glass overflow-hidden">
      <div className="flex items-center gap-2 p-2">
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={open}
          aria-controls={panelId}
          className="flex min-w-0 flex-1 items-center gap-2.5 rounded-field px-2.5 py-2 text-left transition-colors hover:bg-blush-50"
        >
          <span aria-hidden="true" className="text-xl">
            {emoji}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-base font-semibold text-ink-900">
              {title}
            </span>
          </span>
          <span className="chip chip-quiet shrink-0">{count}</span>
          <span
            aria-hidden="true"
            className={[
              'shrink-0 text-ink-400 transition-transform duration-200',
              open ? 'rotate-90' : '',
            ].join(' ')}
          >
            ›
          </span>
        </button>

        {/* Sibling of the toggle, not a child of it. */}
        <button
          type="button"
          onClick={onCreate}
          aria-label={createLabel}
          title={createLabel}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-pill bg-blush-500 text-lg font-semibold text-blush-50 shadow-soft transition-colors hover:bg-blush-600"
        >
          <span aria-hidden="true">＋</span>
        </button>
      </div>

      <div id={panelId} role="region" aria-label={title} hidden={!open}>
        <div className="px-3 pb-3">{children}</div>
      </div>
    </section>
  )
}
