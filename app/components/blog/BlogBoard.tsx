'use client'

import { useRouter } from 'next/navigation'
import { useMemo, useState, type ReactNode } from 'react'

import ConfirmDialog from '@/app/components/ConfirmDialog'
import EmptyState from '@/app/components/EmptyState'
import SectionIndex, { type IndexEntry } from '@/app/components/SectionIndex'
import PostCard from '@/app/components/blog/PostCard'
import { SHORT_DATE_TIME } from '@/app/lib/dates'
import PostFormModal, {
  type PostFormState,
} from '@/app/components/blog/PostFormModal'
import type { PartnerId } from '@/app/lib/auth'
import type { PostDTO } from '@/app/lib/types'

/**
 * The single client island for /blog. Deliberately the same shape as
 * ItemsBoard, and it reuses `Modal` and `ConfirmDialog` unchanged — which is
 * what this phase is meant to prove about the Phase 2 factoring.
 */
export default function BlogBoard({
  initialPosts,
  me,
  children,
}: {
  initialPosts: PostDTO[]
  me: PartnerId
  /**
   * The page heading, rendered on the server and passed through. This component
   * owns `<main>` so the index can be its SIBLING rather than live inside it.
   */
  children: ReactNode
}) {
  const router = useRouter()

  const [posts, setPosts] = useState<PostDTO[]>(initialPosts)
  // Accordion: at most one post open at a time, same as the item lists.
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [form, setForm] = useState<PostFormState | null>(null)
  const [pendingDelete, setPendingDelete] = useState<PostDTO | null>(null)
  const [deleting, setDeleting] = useState(false)

  // Same render-phase resync as ItemsBoard; see the note there.
  const [syncedFrom, setSyncedFrom] = useState<PostDTO[]>(initialPosts)
  if (syncedFrom !== initialPosts) {
    setSyncedFrom(initialPosts)
    setPosts(initialPosts)
  }

  const indexEntries = useMemo<IndexEntry[]>(
    () =>
      posts.map((post) => ({
        id: post.id,
        anchor: `post-${post.id}`,
        label: post.title,
        meta: SHORT_DATE_TIME.format(new Date(post.createdAt)),
      })),
    [posts],
  )

  function upsert(post: PostDTO) {
    setPosts((current) => {
      const index = current.findIndex((candidate) => candidate.id === post.id)
      if (index === -1) return [post, ...current]
      const next = current.slice()
      next[index] = post
      return next
    })
    setForm(null)
    router.refresh()
  }

  async function confirmDelete() {
    if (!pendingDelete) return
    const { id } = pendingDelete
    setDeleting(true)
    try {
      const response = await fetch(`/api/posts/${id}`, { method: 'DELETE' })
      if (!response.ok) return
      setPosts((current) => current.filter((candidate) => candidate.id !== id))
      if (expandedId === id) setExpandedId(null)
      setPendingDelete(null)
      router.refresh()
    } catch {
      // Keep the dialog open so the failure is visible rather than silent.
    } finally {
      setDeleting(false)
    }
  }

  return (
    <>
      {/* Outside <main>, and fixed to the viewport from xl up, so the feed can
          never resize or shift it. */}
      <SectionIndex
        entries={indexEntries}
        label="Posts index"
        onSelect={setExpandedId}
      />

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 pb-16 pt-4 sm:px-6">
        {children}

        <div className="flex flex-col gap-4">
          <div>
            <button
              type="button"
              className="btn-primary"
              onClick={() => setForm({ mode: 'create' })}
            >
              <span aria-hidden="true">＋</span> Write a post
            </button>
          </div>

          {posts.length === 0 ? (
            <EmptyState
              mark="¶"
              title="No posts yet"
              description="This is where our thoughts and stories about what we have done will live."
            />
          ) : (
            <ul className="flex min-w-0 flex-col gap-3">
              {posts.map((post, i) => (
                <li key={post.id}>
                  <PostCard
                    post={post}
                    me={me}
                    index={i + 1}
                    expanded={expandedId === post.id}
                    onToggleExpand={() =>
                      setExpandedId((current) =>
                        current === post.id ? null : post.id,
                      )
                    }
                    onEdit={() => setForm({ mode: 'edit', post })}
                    onDelete={() => setPendingDelete(post)}
                  />
                </li>
              ))}
            </ul>
          )}

          {form ? (
            <PostFormModal
              key={form.mode === 'edit' ? form.post.id : 'new'}
              state={form}
              onClose={() => setForm(null)}
              onSaved={upsert}
            />
          ) : null}

          <ConfirmDialog
            open={pendingDelete !== null}
            title="Delete this post?"
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
