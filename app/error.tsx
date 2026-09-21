'use client' // Error boundaries must be Client Components

import { useEffect } from 'react'

/**
 * Root error boundary.
 *
 * In Next 16 the recovery prop is `unstable_retry`, not `reset`: it re-fetches
 * and re-renders the segment, whereas `reset` only re-renders the children
 * without re-fetching. Almost every failure this app can hit is a transient
 * database blip, so re-fetching is the one that can actually recover.
 */
export default function GlobalError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string }
  unstable_retry: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <main className="flex flex-1 items-center justify-center px-4 py-10 sm:px-6">
      <div className="card-glass w-full max-w-sm p-6 text-center sm:p-8">
        <span aria-hidden="true" className="text-4xl">
          🌧️
        </span>
        <h1 className="mt-3 text-xl font-semibold">Qualcosa è andato storto</h1>
        <p className="mt-2 text-sm text-ink-500">
          Probabilmente è solo un intoppo momentaneo. Riprova tra un istante.
        </p>

        {error.digest ? (
          <p className="mt-3 font-mono text-xs text-ink-400">
            Codice: {error.digest}
          </p>
        ) : null}

        <div className="mt-6 flex flex-wrap gap-2">
          <button
            type="button"
            className="btn-primary flex-1"
            onClick={() => unstable_retry()}
          >
            Riprova
          </button>
          <a href="/home" className="btn-ghost flex-1">
            Torna a casa
          </a>
        </div>
      </div>
    </main>
  )
}
