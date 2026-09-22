import type { ReactNode } from 'react'

export default function EmptyState({
  mark,
  title,
  description,
  action,
}: {
  /** A short typographic mark — the replacement for the old `emoji` prop. */
  mark: string
  title: string
  description?: string
  action?: ReactNode
}) {
  return (
    <div className="card-dashed flex flex-col items-center gap-3 px-6 py-10 text-center">
      <span aria-hidden="true" className="font-display text-poster">
        {mark}
      </span>
      <p className="font-display text-title">{title}</p>
      {description ? (
        <p className="max-w-sm text-sm text-ink-muted">{description}</p>
      ) : null}
      {action}
    </div>
  )
}
