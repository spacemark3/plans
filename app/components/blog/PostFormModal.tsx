'use client'

import { useState, type FormEvent } from 'react'

import Modal from '@/app/components/Modal'
import PhotoField from '@/app/components/PhotoField'
import type { PostDTO } from '@/app/lib/types'

export type PostFormState = { mode: 'create' } | { mode: 'edit'; post: PostDTO }

/**
 * Same shape as ItemFormModal, and — the point of this phase — it reuses
 * `Modal` exactly as built in Phase 2, with no changes to the shell.
 *
 * PHASE 6: no photo field yet; Phase 5's `PhotoField` drops in here and in
 * ItemFormModal at the same time.
 */
export default function PostFormModal({
  state,
  onClose,
  onSaved,
}: {
  state: PostFormState
  onClose: () => void
  onSaved: (post: PostDTO) => void
}) {
  const [title, setTitle] = useState(state.mode === 'edit' ? state.post.title : '')
  const [body, setBody] = useState(state.mode === 'edit' ? state.post.body : '')
  const [photoUrl, setPhotoUrl] = useState<string | null>(
    state.mode === 'edit' ? state.post.photoUrl : null,
  )
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    // Saving before upload() resolves would persist photoUrl: null and orphan
    // the photo. Backstop for Enter-to-submit; the button is disabled too.
    if (pending || uploading) return

    setError(null)
    setPending(true)

    try {
      const response = await fetch(
        state.mode === 'edit' ? `/api/posts/${state.post.id}` : '/api/posts',
        {
          method: state.mode === 'edit' ? 'PATCH' : 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ title, body, photoUrl }),
        },
      )
      const data = await response.json().catch(() => null)

      if (!response.ok) {
        setError(
          (data as { error?: string } | null)?.error ??
            'Non sono riuscito a salvare. Riprova.',
        )
        return
      }

      onSaved(data as PostDTO)
    } catch {
      setError('Impossibile raggiungere il server. Controlla la connessione.')
    } finally {
      setPending(false)
    }
  }

  return (
    <Modal
      open
      title={state.mode === 'edit' ? 'Modifica il post' : 'Nuovo post'}
      onClose={onClose}
    >
      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
        <div>
          <label htmlFor="post-title" className="label">
            Titolo
          </label>
          <input
            id="post-title"
            className="field"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Il nostro weekend in montagna"
            maxLength={160}
            autoFocus
            disabled={pending}
            aria-invalid={error ? true : undefined}
          />
        </div>

        <div>
          <label htmlFor="post-body" className="label">
            Testo
          </label>
          <textarea
            id="post-body"
            className="field min-h-44 resize-y"
            value={body}
            onChange={(event) => setBody(event.target.value)}
            placeholder="Racconta com'è andata..."
            maxLength={20000}
            disabled={pending}
          />
        </div>

        <PhotoField
          value={photoUrl}
          onChange={setPhotoUrl}
          onUploadingChange={setUploading}
          disabled={pending}
        />

        {error ? (
          <p role="alert" className="text-sm font-medium text-blush-700">
            {error}
          </p>
        ) : null}

        <div className="mt-1 flex flex-wrap gap-2">
          <button
            type="submit"
            className="btn-primary flex-1"
            disabled={
              pending ||
              uploading ||
              title.trim().length === 0 ||
              body.trim().length === 0
            }
          >
            {uploading
              ? 'Aspetta la foto...'
              : pending
                ? 'Salvo...'
                : state.mode === 'edit'
                  ? 'Salva'
                  : 'Pubblica'}
          </button>
          <button
            type="button"
            className="btn-ghost flex-1"
            onClick={onClose}
            disabled={pending}
          >
            Annulla
          </button>
        </div>
      </form>
    </Modal>
  )
}
