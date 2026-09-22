/**
 * Server-safe placeholder block. `aria-hidden` throughout — a loading skeleton
 * is decorative, and the `loading.tsx` wrapper announces the wait once instead.
 *
 * No shimmer: a soft pulse is the opposite of this design language, and a
 * hard-edged empty frame already reads as "not here yet".
 */
export default function Skeleton({ className = '' }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={`frame block ${className}`}
    />
  )
}
