'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

import ConfirmDialog from '@/app/components/ConfirmDialog'
import EmptyState from '@/app/components/EmptyState'
import PostCard from '@/app/components/blog/PostCard'
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
}: {
  initialPosts: PostDTO[]
  me: PartnerId
}) {
  const router = useRouter()

  const [posts, setPosts] = useState<PostDTO[]>(initialPosts)
  const [form, setForm] = useState<PostFormState | null>(null)
  const [pendingDelete, setPendingDelete] = useState<PostDTO | null>(null)
  const [deleting, setDeleting] = useState(false)

  // Same render-phase resync as ItemsBoard; see the note there.
  const [syncedFrom, setSyncedFrom] = useState<PostDTO[]>(initialPosts)
  if (syncedFrom !== initialPosts) {
    setSyncedFrom(initialPosts)
    setPosts(initialPosts)
  }

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
      setPendingDelete(null)
      router.refresh()
    } catch {
      // Keep the dialog open so the failure is visible rather than silent.
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <button
          type="button"
          className="btn-primary"
          onClick={() => setForm({ mode: 'create' })}
        >
          <span aria-hidden="true">＋</span> Scrivi un post
        </button>
      </div>

      {posts.length === 0 ? (
        <EmptyState
          emoji="📖"
          title="Nessun post, per ora"
          description="Qui finiranno i pensieri e i racconti di quello che abbiamo fatto."
        />
      ) : (
        <ul className="flex flex-col gap-4">
          {posts.map((post) => (
            <li key={post.id}>
              <PostCard
                post={post}
                me={me}
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
        title="Eliminare questo post?"
        message={
          pendingDelete
            ? `"${pendingDelete.title}" verrà eliminato per sempre. Non si può tornare indietro.`
            : ''
        }
        pending={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  )
}
