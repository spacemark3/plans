'use client'

import { useState, type FormEvent } from 'react'

import Modal from '@/app/components/Modal'
import PhotoField from '@/app/components/PhotoField'
import type { ItemDTO, ItemKind } from '@/app/lib/types'

/** Create for a given category, or edit an existing item. */
export type ItemFormState =
  | { mode: 'create'; kind: ItemKind }
  | { mode: 'edit'; item: ItemDTO }

/** Each category carries its own heading and placeholder copy. */
const COPY: Record<ItemKind, { create: string; edit: string; hint: string }> = {
  trip: {
    create: 'New trip',
    edit: 'Edit trip',
    hint: 'Northern lights in Norway',
  },
  challenge: {
    create: 'New challenge',
    edit: 'Edit challenge',
    hint: 'Run a half marathon',
  },
}

/**
 * One component, four jobs: new trip, new challenge, edit trip, edit challenge.
 * Heading, endpoint and method are all derived from `state` — which is what
 * lets two create buttons and every card's Edit share a single form.
 *
 * PHASE 4: still no photo field (Phase 5 adds `PhotoField`, and must then also
 * disable submit while an upload is in flight).
 */
export default function ItemFormModal({
  state,
  onClose,
  onSaved,
}: {
  state: ItemFormState
  onClose: () => void
  onSaved: (item: ItemDTO) => void
}) {
  const kind = state.mode === 'create' ? state.kind : state.item.kind
  const words = COPY[kind]

  const [title, setTitle] = useState(state.mode === 'edit' ? state.item.title : '')
  const [description, setDescription] = useState(
    state.mode === 'edit' ? state.item.description : '',
  )
  const [photoUrl, setPhotoUrl] = useState<string | null>(
    state.mode === 'edit' ? state.item.photoUrl : null,
  )
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  const heading = state.mode === 'edit' ? words.edit : words.create

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    // Saving before upload() resolves would persist photoUrl: null and orphan
    // the photo. The submit button is disabled too; this is the backstop for
    // Enter-to-submit.
    if (pending || uploading) return

    setError(null)
    setPending(true)

    try {
      const response = await fetch(
        state.mode === 'edit' ? `/api/items/${state.item.id}` : '/api/items',
        {
          method: state.mode === 'edit' ? 'PATCH' : 'POST',
          headers: { 'content-type': 'application/json' },
          // No `author` here, and none would be honoured: the server stamps it
          // from the session.
          body: JSON.stringify(
            state.mode === 'edit'
              ? { title, description, photoUrl }
              : { kind, title, description, photoUrl },
          ),
        },
      )
      const data = await response.json().catch(() => null)

      if (!response.ok) {
        setError(
          (data as { error?: string } | null)?.error ??
            'Could not save. Please try again.',
        )
        return
      }

      onSaved(data as ItemDTO)
    } catch {
      setError('Could not reach the server. Check your connection.')
    } finally {
      setPending(false)
    }
  }

  return (
    <Modal open title={heading} onClose={onClose}>
      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
        <div>
          <label htmlFor="item-title" className="label">
            Title
          </label>
          <input
            id="item-title"
            className="field"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder={words.hint}
            maxLength={120}
            autoFocus
            disabled={pending}
            aria-invalid={error ? true : undefined}
          />
        </div>

        <div>
          <label htmlFor="item-description" className="label">
            Description <span className="font-normal text-ink-muted">(optional)</span>
          </label>
          <textarea
            id="item-description"
            className="field min-h-28 resize-y"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Some detail, a link, a date..."
            maxLength={4000}
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
          <p role="alert" className="alert text-sm">
            {error}
          </p>
        ) : null}

        <div className="mt-1 flex flex-wrap gap-2">
          <button
            type="submit"
            className="btn-primary flex-1"
            disabled={pending || uploading || title.trim().length === 0}
          >
            {uploading
              ? 'Waiting for photo...'
              : pending
                ? 'Saving...'
                : state.mode === 'edit'
                  ? 'Save'
                  : 'Add'}
          </button>
          <button
            type="button"
            className="btn-ghost flex-1"
            onClick={onClose}
            disabled={pending}
          >
            Cancel
          </button>
        </div>
      </form>
    </Modal>
  )
}
