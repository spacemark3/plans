import NavBar from '@/app/components/NavBar'
import ItemsBoard from '@/app/components/items/ItemsBoard'
import { getItems } from '@/app/lib/data'
import { requireSession } from '@/app/lib/session'

export default async function ChallengesPage() {
  // Verified here as well as in the proxy — deliberately redundant. Reading the
  // session also makes this page dynamic, so no `export const dynamic` is needed.
  const session = await requireSession()
  // Filtered in the query, not in the client: /trips never ships challenges and
  // vice versa.
  const items = await getItems({ kind: 'challenge' })

  return (
    <>
      <NavBar active="challenges" />
      {/* The board owns <main> so the index can sit outside it. The heading is
          still rendered here, on the server, and passed straight through. */}
      <ItemsBoard initialItems={items} me={session.u} kind="challenge">
        <h1 className="mb-1 text-poster">Challenges</h1>
        <p className="mb-6 text-sm text-ink-muted">Things to try together.</p>
      </ItemsBoard>
    </>
  )
}
