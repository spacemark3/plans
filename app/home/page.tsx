import Link from 'next/link'

import AuthorChip from '@/app/components/AuthorChip'
import EmptyState from '@/app/components/EmptyState'
import NavBar from '@/app/components/NavBar'
import { getHomeSummary } from '@/app/lib/data'
import { partnerName } from '@/app/lib/partners'
import { requireSession } from '@/app/lib/session'

const KIND_EMOJI = { trip: '✈️', challenge: '🎯' } as const
const LONG_DATE = new Intl.DateTimeFormat('it-IT', { dateStyle: 'long' })

function StatCard({
  emoji,
  label,
  todo,
  done,
}: {
  emoji: string
  label: string
  todo: number
  done: number
}) {
  return (
    <div className="card-glass flex flex-col gap-1 p-4">
      <span className="flex items-center gap-1.5 text-xs font-semibold text-ink-500">
        <span aria-hidden="true">{emoji}</span>
        {label}
      </span>
      <span className="text-2xl font-semibold text-ink-900">{todo}</span>
      <span className="text-xs text-ink-400">
        da fare · {done} {done === 1 ? 'fatto' : 'fatti'}
      </span>
    </div>
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
          <h1 className="text-2xl font-semibold">Ciao, {me}!</h1>
          <AuthorChip name={me} self />
        </div>

        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
          <StatCard
            emoji={KIND_EMOJI.trip}
            label="Viaggi"
            todo={summary.items.trip.todo}
            done={summary.items.trip.done}
          />
          <StatCard
            emoji={KIND_EMOJI.challenge}
            label="Sfide"
            todo={summary.items.challenge.todo}
            done={summary.items.challenge.done}
          />
          <div className="card-glass col-span-2 flex flex-col gap-1 p-4 sm:col-span-1">
            <span className="flex items-center gap-1.5 text-xs font-semibold text-ink-500">
              <span aria-hidden="true">📖</span>
              Post
            </span>
            <span className="text-2xl font-semibold text-ink-900">
              {summary.postCount}
            </span>
            <span className="text-xs text-ink-400">
              {summary.postCount === 1 ? 'racconto' : 'racconti'}
            </span>
          </div>
        </div>

        {nothingYet ? (
          <EmptyState
            emoji="🫧"
            title="Si comincia!"
            description="Non c'è ancora niente. Aggiungete il primo viaggio o la prima sfida."
            action={
              <Link href="/trips" className="btn-primary mt-1">
                Vai alla lista
              </Link>
            }
          />
        ) : (
          <div className="flex flex-col gap-6">
            <section>
              <div className="mb-3 flex items-center justify-between gap-3">
                <h2 className="text-base font-semibold">Aggiunti di recente</h2>
                <Link
                  href="/trips"
                  className="text-sm font-semibold text-blush-700 hover:text-blush-800"
                >
                  Vedi tutto
                </Link>
              </div>

              {summary.recentItems.length === 0 ? (
                <p className="text-sm text-ink-400">Ancora niente in lista.</p>
              ) : (
                <ul className="flex flex-col gap-2">
                  {summary.recentItems.map((item) => (
                    <li
                      key={item.id}
                      className="flex items-center gap-3 rounded-field border border-blush-100 bg-glass-strong p-3"
                    >
                      <span
                        aria-hidden="true"
                        className={[
                          'flex h-10 w-10 shrink-0 items-center justify-center rounded-field text-lg',
                          item.done ? 'bg-sage-100' : 'bg-blush-100',
                        ].join(' ')}
                      >
                        {item.done ? '✓' : KIND_EMOJI[item.kind]}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span
                          className={[
                            'block truncate text-sm font-semibold',
                            item.done ? 'text-ink-500 line-through' : 'text-ink-900',
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
                <h2 className="text-base font-semibold">Ultimo post</h2>
                <Link
                  href="/blog"
                  className="text-sm font-semibold text-blush-700 hover:text-blush-800"
                >
                  Vedi tutto
                </Link>
              </div>

              {summary.latestPost ? (
                <Link
                  href="/blog"
                  className="card-glass block p-5 transition-shadow hover:shadow-lift"
                >
                  <h3 className="text-base font-semibold">
                    {summary.latestPost.title}
                  </h3>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <AuthorChip
                      name={summary.latestPost.authorName}
                      self={summary.latestPost.author === session.u}
                    />
                    <span className="text-xs text-ink-400">
                      {LONG_DATE.format(new Date(summary.latestPost.createdAt))}
                    </span>
                  </div>
                  <p className="mt-3 line-clamp-3 text-sm text-ink-600">
                    {summary.latestPost.body}
                  </p>
                </Link>
              ) : (
                <p className="text-sm text-ink-400">Nessun post, per ora.</p>
              )}
            </section>
          </div>
        )}
      </main>
    </>
  )
}
