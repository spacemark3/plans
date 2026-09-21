import NavBar from '@/app/components/NavBar'
import ItemsBoard from '@/app/components/items/ItemsBoard'
import { getItems } from '@/app/lib/data'
import { requireSession } from '@/app/lib/session'

export default async function TripsPage() {
  // Verified here as well as in the proxy — deliberately redundant. Reading the
  // session also makes this page dynamic, so no `export const dynamic` is needed.
  const session = await requireSession()
  const items = await getItems()

  return (
    <>
      <NavBar active="trips" />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 pb-16 pt-4 sm:px-6">
        <h1 className="mb-1 text-2xl font-semibold">La lista</h1>
        <p className="mb-6 text-sm text-ink-500">Viaggi e sfide, tutto insieme.</p>
        <ItemsBoard initialItems={items} me={session.u} />
      </main>
    </>
  )
}
