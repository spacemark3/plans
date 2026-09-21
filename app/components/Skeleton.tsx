/**
 * Server-safe placeholder block. `aria-hidden` throughout — a loading skeleton
 * is decorative, and the `loading.tsx` wrapper announces the wait once instead.
 */
export default function Skeleton({ className = '' }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={`block animate-pulse rounded-field bg-ink-100 ${className}`}
    />
  )
}
