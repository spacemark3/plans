import Link from 'next/link'

export default function NotFound() {
  return (
    <main className="flex flex-1 items-center justify-center px-4 py-10 sm:px-6">
      <div className="card-brut w-full max-w-sm p-6 text-center sm:p-8">
        <span aria-hidden="true" className="mark bg-cyan px-3 py-1 text-poster">
          404
        </span>
        <h1 className="mt-3 text-title">Page not found</h1>
        <p className="mt-2 text-sm text-ink-muted">
          This page does not exist. Maybe the link is old.
        </p>

        {/* Deliberately /home and not /: the proxy bounces a signed-in visitor
            from / to /home anyway, and an unauthenticated one from /home to /,
            so this single link lands correctly either way. */}
        <Link href="/home" className="btn-primary mt-6 w-full">
          Back home
        </Link>
      </div>
    </main>
  )
}
