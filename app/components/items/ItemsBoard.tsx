'use client'

import { useRouter } from 'next/navigation'
import { useMemo, useState, type ReactNode } from 'react'

import ConfirmDialog from '@/app/components/ConfirmDialog'
import EmptyState from '@/app/components/EmptyState'
import SectionIndex, { type IndexEntry } from '@/app/components/SectionIndex'
import ItemCard from '@/app/components/items/ItemCard'
import { SHORT_DATE_TIME } from '@/app/lib/dates'
import ItemFormModal, {
  type ItemFormState,
} from '@/app/components/items/ItemFormModal'
import type { PartnerId } from '@/app/lib/auth'
import type { ItemDTO, ItemKind } from '@/app/lib/types'

/**
 * Per-category copy. Typographic marks replace the old ✈️/🎯 pair.
 *
 * Each kind owns a route now, so one board only ever renders one of these.
 */
const COPY: Record<
  ItemKind,
  { mark: string; createLabel: string; emptyTitle: string; empty: string }
> = {
  trip: {
    mark: '01',
    createLabel: 'Add a trip',
    emptyTitle: 'No trips yet',
    empty: 'Where should we go?',
  },
  challenge: {
    mark: '02',
    createLabel: 'Add a challenge',
    emptyTitle: 'No challenges yet',
    empty: 'What should we try?',
  },
}

/**
 * The client island for one category page (/trips or /challenges). It owns
 * every piece of interactive state; everything below it is presentational.
 *
 * `initialItems` arrives already filtered to `kind` by the page's getItems()
 * call, so this component never has to think about the other category. The
 * shape deliberately mirrors `BlogBoard`: create button, list or empty state,
 * then the two dialogs.
 */
export default function ItemsBoard({
  initialItems,
  me,
  kind,
  children,
}: {
  initialItems: ItemDTO[]
  me: PartnerId
  kind: ItemKind
  /**
   * The page heading, rendered on the server and passed through. This component
   * owns `<main>` so the index can be its SIBLING rather than live inside it —
   * passing server-rendered children into a client component keeps the heading
   * off the client bundle.
   */
  children: ReactNode
}) {
  const router = useRouter()
  const copy = COPY[kind]

  const [items, setItems] = useState<ItemDTO[]>(initialItems)
  // Which list is on screen. Completed items leave the to-do list entirely and
  // live behind the Done button rather than in a section underneath it.
  const [view, setView] = useState<'todo' | 'done'>('todo')
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

  const { todo, done } = useMemo(() => {
    const buckets = { todo: [] as ItemDTO[], done: [] as ItemDTO[] }
    for (const item of items) {
      if (item.done) buckets.done.push(item)
      else buckets.todo.push(item)
    }
    return buckets
  }, [items])

  // Only one of the two lists is on screen at a time.
  const visible = view === 'todo' ? todo : done

  // The index follows the visible view. It must: its entries are anchors into
  // rendered cards, and listing the hidden half would scroll to nothing.
  const indexEntries = useMemo<IndexEntry[]>(
    () =>
      visible.map((item) => ({
        id: item.id,
        anchor: `item-${item.id}`,
        label: item.title,
        meta: SHORT_DATE_TIME.format(new Date(item.createdAt)),
        done: item.done,
      })),
    [visible],
  )

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
      // The item is about to leave the list being viewed, so an expanded card
      // would be left pointing at something no longer on screen.
      setExpandedId(null)
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

  function renderCard(item: ItemDTO, index: number) {
    return (
      <li key={item.id}>
        <ItemCard
          item={item}
          me={me}
          index={index}
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
    <>
      {/* Outside <main>, and fixed to the viewport from xl up, so the list can
          never resize or shift it. */}
      <SectionIndex
        entries={indexEntries}
        label={`${copy.createLabel.replace('Add a ', '')} index`}
        onSelect={setExpandedId}
      />

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 pb-16 pt-4 sm:px-6">
        {children}

        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="btn-primary"
              onClick={() => setForm({ mode: 'create', kind })}
            >
              <span aria-hidden="true">＋</span> {copy.createLabel}
            </button>

            {/*
              A toggle button, not a link or a tab: `aria-pressed` is what tells
              a screen reader this control has an on state, and the yellow fill
              is the matching visual. Pressing it again returns to the to-do
              list, so it is the only control needed for both directions.
            */}
            <button
              type="button"
              aria-pressed={view === 'done'}
              onClick={() => {
                setView((current) => (current === 'todo' ? 'done' : 'todo'))
                setExpandedId(null)
              }}
              className={view === 'done' ? 'btn-primary' : 'btn-ghost'}
            >
              Done · {done.length}
            </button>
          </div>

          {items.length === 0 ? (
            <EmptyState
              mark={copy.mark}
              title={copy.emptyTitle}
              description={copy.empty}
            />
          ) : visible.length === 0 ? (
            <EmptyState
              mark={view === 'done' ? '✓' : copy.mark}
              title={
                view === 'done' ? 'Nothing done yet' : 'Nothing left to do'
              }
              description={
                view === 'done'
                  ? 'Tick something off and it will show up here.'
                  : 'Everything is ticked off — the Done list has them all.'
              }
            />
          ) : (
            <ul className="flex min-w-0 flex-col gap-2">
              {visible.map((item, i) => renderCard(item, i + 1))}
            </ul>
          )}

          {/* One form for create and edit alike. Keyed so each open remounts
              clean rather than showing the previous item's text. */}
          {form ? (
            <ItemFormModal
              key={form.mode === 'edit' ? form.item.id : `new-${form.kind}`}
              state={form}
              onClose={() => setForm(null)}
              onSaved={(item) => {
                upsert(item)
                setForm(null)
                // A newly created item is always a to-do. If the Done list
                // happens to be showing, it would be saved straight off-screen
                // and look like nothing happened.
                if (!item.done) setView('todo')
              }}
            />
          ) : null}

          <ConfirmDialog
            open={pendingDelete !== null}
            title="Delete this item?"
            message={
              pendingDelete
                ? `"${pendingDelete.title}" will be deleted forever. There is no going back.`
                : ''
            }
            pending={deleting}
            onConfirm={confirmDelete}
            onCancel={() => setPendingDelete(null)}
          />
        </div>
      </main>
    </>
  )
}
