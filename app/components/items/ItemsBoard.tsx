'use client'

import { useRouter } from 'next/navigation'
import { useMemo, useState } from 'react'

import ConfirmDialog from '@/app/components/ConfirmDialog'
import EmptyState from '@/app/components/EmptyState'
import CategorySection from '@/app/components/items/CategorySection'
import ItemCard from '@/app/components/items/ItemCard'
import ItemFormModal, {
  type ItemFormState,
} from '@/app/components/items/ItemFormModal'
import type { PartnerId } from '@/app/lib/auth'
import type { ItemDTO, ItemKind } from '@/app/lib/types'

const SECTIONS: {
  kind: ItemKind
  title: string
  emoji: string
  createLabel: string
  empty: string
}[] = [
  {
    kind: 'trip',
    title: 'Viaggi',
    emoji: '✈️',
    createLabel: 'Aggiungi un viaggio',
    empty: 'Nessun viaggio, per ora. Dove andiamo?',
  },
  {
    kind: 'challenge',
    title: 'Sfide',
    emoji: '🎯',
    createLabel: 'Aggiungi una sfida',
    empty: 'Nessuna sfida, per ora. Cosa proviamo?',
  },
]

/**
 * The single client island for /trips. It owns every piece of interactive
 * state; everything below it is presentational.
 */
export default function ItemsBoard({
  initialItems,
  me,
}: {
  initialItems: ItemDTO[]
  me: PartnerId
}) {
  const router = useRouter()

  const [items, setItems] = useState<ItemDTO[]>(initialItems)
  const [open, setOpen] = useState<Record<ItemKind, boolean>>({
    trip: true,
    challenge: true,
  })
  // Accordion: at most one card expanded at a time.
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [form, setForm] = useState<ItemFormState | null>(null)
  const [pendingDelete, setPendingDelete] = useState<ItemDTO | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  // The server stays the source of truth; local state is only a latency hider.
  // When router.refresh() lands, `initialItems` arrives with a new identity and
  // we resync from it.
  //
  // This is React's "adjust state during render" pattern rather than a
  // useEffect, on purpose: a setState inside an effect would fire a second
  // render pass after every refresh (React 19's react-hooks/set-state-in-effect
  // flags exactly that). Adjusting here re-renders this component immediately,
  // before anything is committed to the DOM, so there is no flash and no
  // cascade. Local edits keep their own identity, so an optimistic splice
  // survives until the real data replaces it.
  const [syncedFrom, setSyncedFrom] = useState<ItemDTO[]>(initialItems)
  if (syncedFrom !== initialItems) {
    setSyncedFrom(initialItems)
    setItems(initialItems)
  }

  // Four derived lists: {trip, challenge} x {todo, done}.
  const lists = useMemo(() => {
    const empty = () => ({ todo: [] as ItemDTO[], done: [] as ItemDTO[] })
    const grouped: Record<ItemKind, { todo: ItemDTO[]; done: ItemDTO[] }> = {
      trip: empty(),
      challenge: empty(),
    }
    for (const item of items) {
      const bucket = grouped[item.kind]
      if (!bucket) continue
      if (item.done) bucket.done.push(item)
      else bucket.todo.push(item)
    }
    return grouped
  }, [items])

  function upsert(item: ItemDTO) {
    setItems((current) => {
      const index = current.findIndex((candidate) => candidate.id === item.id)
      if (index === -1) return [item, ...current]
      const next = current.slice()
      next[index] = item
      return next
    })
    router.refresh()
  }

  async function toggleDone(item: ItemDTO) {
    setBusyId(item.id)
    try {
      const response = await fetch(`/api/items/${item.id}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ done: !item.done }),
      })
      if (!response.ok) return
      upsert((await response.json()) as ItemDTO)
    } catch {
      // Leave the item as it was; the next refresh reconciles.
    } finally {
      setBusyId(null)
    }
  }

  async function confirmDelete() {
    if (!pendingDelete) return
    const { id } = pendingDelete
    setDeleting(true)
    try {
      const response = await fetch(`/api/items/${id}`, { method: 'DELETE' })
      if (!response.ok) return
      setItems((current) => current.filter((candidate) => candidate.id !== id))
      if (expandedId === id) setExpandedId(null)
      setPendingDelete(null)
      router.refresh()
    } catch {
      // Keep the dialog open so the failure is visible rather than silent.
    } finally {
      setDeleting(false)
    }
  }

  function renderCard(item: ItemDTO) {
    return (
      <li key={item.id}>
        <ItemCard
          item={item}
          me={me}
          expanded={expandedId === item.id}
          pending={busyId === item.id}
          onToggleExpand={() =>
            setExpandedId((current) => (current === item.id ? null : item.id))
          }
          onToggleDone={() => toggleDone(item)}
          onEdit={() => setForm({ mode: 'edit', item })}
          onDelete={() => setPendingDelete(item)}
        />
      </li>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {SECTIONS.map((section) => {
        const { todo, done } = lists[section.kind]
        return (
          <CategorySection
            key={section.kind}
            id={section.kind}
            title={section.title}
            emoji={section.emoji}
            // The counter tracks what is still to do, so marking something done
            // decrements it.
            count={todo.length}
            open={open[section.kind]}
            onToggle={() =>
              setOpen((current) => ({
                ...current,
                [section.kind]: !current[section.kind],
              }))
            }
            onCreate={() => setForm({ mode: 'create', kind: section.kind })}
            createLabel={section.createLabel}
          >
            {todo.length === 0 && done.length === 0 ? (
              <EmptyState emoji={section.emoji} title={section.empty} />
            ) : (
              <div className="flex flex-col gap-3">
                {todo.length > 0 ? (
                  <ul className="flex flex-col gap-2">{todo.map(renderCard)}</ul>
                ) : null}

                {/* Done items stay inside the same section, muted, below. */}
                {done.length > 0 ? (
                  <div className="flex flex-col gap-2">
                    <p className="px-1 text-xs font-semibold tracking-wide text-ink-400 uppercase">
                      Fatti · {done.length}
                    </p>
                    <ul className="flex flex-col gap-2 opacity-80">
                      {done.map(renderCard)}
                    </ul>
                  </div>
                ) : null}
              </div>
            )}
          </CategorySection>
        )
      })}

      {/* One form for create and edit alike. Keyed so each open remounts clean
          rather than showing the previous item's text. */}
      {form ? (
        <ItemFormModal
          key={form.mode === 'edit' ? form.item.id : `new-${form.kind}`}
          state={form}
          onClose={() => setForm(null)}
          onSaved={(item) => {
            upsert(item)
            setForm(null)
          }}
        />
      ) : null}

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Eliminare questa voce?"
        message={
          pendingDelete
            ? `"${pendingDelete.title}" verrà eliminata per sempre. Non si può tornare indietro.`
            : ''
        }
        pending={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  )
}
