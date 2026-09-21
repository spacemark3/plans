import type { ReactNode } from 'react'

export default function EmptyState({
  emoji,
  title,
  description,
  action,
}: {
  emoji: string
  title: string
  description?: string
  action?: ReactNode
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-card border border-dashed border-blush-200 px-6 py-10 text-center">
      <span aria-hidden="true" className="text-4xl">
        {emoji}
      </span>
      <p className="text-base font-semibold text-ink-800">{title}</p>
      {description ? (
        <p className="max-w-sm text-sm text-ink-500">{description}</p>
      ) : null}
      {action}
    </div>
  )
}
