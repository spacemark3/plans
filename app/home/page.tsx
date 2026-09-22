import Link from 'next/link'

import AuthorChip from '@/app/components/AuthorChip'
import EmptyState from '@/app/components/EmptyState'
import NavBar from '@/app/components/NavBar'
import { getHomeSummary } from '@/app/lib/data'
import { LONG_DATE_TIME } from '@/app/lib/dates'
import { partnerName } from '@/app/lib/partners'
import { requireSession } from '@/app/lib/session'

/** Typographic marks replace the old ✈️/🎯 pair. */
const KIND_MARK = { trip: '01', challenge: '02' } as const

function StatCard({
  label,
  todo,
  done,
  fill,
  href,
}: {
  label: string
  todo: number
  done: number
  /** A spot-colour fill token class — the card's whole identity. */
  fill: string
  /** Each category owns a route, so the card is the way into it. */
  href: string
}) {
  return (
    <Link
      href={href}
      className={`card-brut flex flex-col gap-1 p-4 transition-transform hover:-translate-x-1 hover:-translate-y-1 ${fill}`}
    >
      <span className="text-section font-mono">{label}</span>
      <span className="font-display text-poster">{todo}</span>
      <span className="text-xs font-semibold">
        to do · {done} done
      </span>
    </Link>
  )
}

export default async function HomePage() {
  // Every page verifies independently — the proxy is a convenience, not the
  // authorization boundary.
  const session = await requireSession()
  const summary = await getHomeSummary()

  const me = partnerName(session.u)
  const nothingYet =
    summary.recentItems.length === 0 && summary.latestPost === null

  return (
    <>
      <NavBar active="home" />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 pb-16 pt-4 sm:px-6">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-poster">Hi, {me}!</h1>
          <AuthorChip name={me} self />
        </div>

        {/* Three spot colours, one per card — the poster's whole palette in a row. */}
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
          <StatCard
            label="Trips"
            todo={summary.items.trip.todo}
            done={summary.items.trip.done}
            fill="bg-yellow"
            href="/trips"
          />
          <StatCard
            label="Challenges"
            todo={summary.items.challenge.todo}
            done={summary.items.challenge.done}
            fill="bg-pink"
            href="/challenges"
          />
          <Link
            href="/blog"
            className="card-brut col-span-2 flex flex-col gap-1 bg-cyan p-4 transition-transform hover:-translate-x-1 hover:-translate-y-1 sm:col-span-1"
          >
            <span className="text-section font-mono">Posts</span>
            <span className="font-display text-poster">{summary.postCount}</span>
            <span className="text-xs font-semibold">
              {summary.postCount === 1 ? 'story' : 'stories'}
            </span>
          </Link>
        </div>

        {nothingYet ? (
          <EmptyState
            mark="*"
            title="Let’s begin!"
            description="Nothing here yet. Add your first trip or challenge."
            action={
              <Link href="/trips" className="btn-primary mt-1">
                Go to the list
              </Link>
            }
          />
        ) : (
          <div className="flex flex-col gap-6">
            <section>
              <div className="mb-3 flex items-center justify-between gap-3">
                <h2 className="text-section font-mono">Recently added</h2>
                <Link
                  href="/trips"
                  className="text-sm font-semibold underline decoration-2 underline-offset-4"
                >
                  See all
                </Link>
              </div>

              {summary.recentItems.length === 0 ? (
                <p className="text-sm text-ink-muted">Nothing in the list yet.</p>
              ) : (
                <ul className="flex flex-col gap-2">
                  {summary.recentItems.map((item) => (
                    <li
                      key={item.id}
                      className="frame flex items-center gap-3 p-3"
                    >
                      <span
                        aria-hidden="true"
                        className={[
                          'mark h-10 w-10 shrink-0 text-sm',
                          item.done ? 'bg-cyan' : 'bg-yellow',
                        ].join(' ')}
                      >
                        {item.done ? '✓' : KIND_MARK[item.kind]}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span
                          className={[
                            'block truncate text-sm font-semibold',
                            item.done ? 'text-ink-muted line-through' : 'text-ink',
                          ].join(' ')}
                        >
                          {item.title}
                        </span>
                        <span className="mt-1 block">
                          <AuthorChip
                            name={item.authorName}
                            self={item.author === session.u}
                          />
                        </span>
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section>
              <div className="mb-3 flex items-center justify-between gap-3">
                <h2 className="text-section font-mono">Latest post</h2>
                <Link
                  href="/blog"
                  className="text-sm font-semibold underline decoration-2 underline-offset-4"
                >
                  See all
                </Link>
              </div>

              {summary.latestPost ? (
                <Link
                  href="/blog"
                  className="card-brut block p-5 transition-transform hover:-translate-x-1 hover:-translate-y-1"
                >
                  <h3 className="text-title">{summary.latestPost.title}</h3>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <AuthorChip
                      name={summary.latestPost.authorName}
                      self={summary.latestPost.author === session.u}
                    />
                    <span className="text-xs text-ink-muted">
                      {LONG_DATE_TIME.format(new Date(summary.latestPost.createdAt))}
                    </span>
                  </div>
                  <p className="mt-3 line-clamp-3 text-sm text-ink-muted">
                    {summary.latestPost.body}
                  </p>
                </Link>
              ) : (
                <p className="text-sm text-ink-muted">No posts yet.</p>
              )}
            </section>
          </div>
        )}
      </main>
    </>
  )
}
