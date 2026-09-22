'use client'

import { upload } from '@vercel/blob/client'
import Image from 'next/image'
import { useEffect, useRef, useState, type ChangeEvent } from 'react'

/** Kept in step with ALLOWED_CONTENT_TYPES in app/api/upload/route.ts. */
const ACCEPT = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif', 'image/gif']
const MAX_BYTES = 10 * 1024 * 1024

function humanSize(bytes: number): string {
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

/**
 * Picker + local preview + direct-to-Blob upload.
 *
 * The client-side type/size checks are a courtesy that fails fast with a clear
 * message — they are NOT the security boundary. The real limits are enforced
 * server-side in /api/upload when the token is minted, because anything here
 * can be bypassed.
 */
export default function PhotoField({
  value,
  onChange,
  onUploadingChange,
  disabled = false,
}: {
  value: string | null
  onChange: (url: string | null) => void
  /** Lets the parent form disable submit while an upload is in flight. */
  onUploadingChange: (uploading: boolean) => void
  disabled?: boolean
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [progress, setProgress] = useState(0)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Object URLs leak until revoked.
  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview)
    }
  }, [preview])

  function setUploadingBoth(next: boolean) {
    setUploading(next)
    onUploadingChange(next)
  }

  async function onPick(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    // Let the same file be picked again after a remove.
    event.target.value = ''
    if (!file) return

    setError(null)

    if (!ACCEPT.includes(file.type)) {
      setError('Unsupported format. Use JPG, PNG, WEBP, HEIC or GIF.')
      return
    }
    if (file.size > MAX_BYTES) {
      setError(`That photo is too large (${humanSize(file.size)}). Maximum 10 MB.`)
      return
    }

    const localPreview = URL.createObjectURL(file)
    setPreview((current) => {
      if (current) URL.revokeObjectURL(current)
      return localPreview
    })

    setProgress(0)
    setUploadingBoth(true)

    try {
      const blob = await upload(file.name, file, {
        access: 'public',
        handleUploadUrl: '/api/upload',
        onUploadProgress: ({ percentage }) => setProgress(percentage),
      })
      onChange(blob.url)
    } catch (uploadError) {
      const message = (uploadError as Error)?.message ?? ''
      setError(
        /unauthorized/i.test(message)
          ? 'Session expired. Reload the page and try again.'
          : 'Upload failed. Please try again.',
      )
      setPreview((current) => {
        if (current) URL.revokeObjectURL(current)
        return null
      })
      onChange(null)
    } finally {
      setUploadingBoth(false)
    }
  }

  function remove() {
    setPreview((current) => {
      if (current) URL.revokeObjectURL(current)
      return null
    })
    setError(null)
    setProgress(0)
    // Note: the previously uploaded blob is only deleted once the document is
    // saved (PATCH replaces it) or deleted. A photo uploaded and then abandoned
    // by cancelling the form stays orphaned — pennies, and never a broken record.
    onChange(null)
  }

  const shown = preview ?? value

  return (
    <div>
      <span className="label">
        Photo <span className="font-normal text-ink-muted">(optional)</span>
      </span>

      {shown ? (
        <div className="frame relative overflow-hidden">
          <div className="relative aspect-[4/3] w-full">
            {preview ? (
              // Local object URL — next/image can't optimize it, and shouldn't.
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={preview}
                alt="Preview of the chosen photo"
                className="absolute inset-0 h-full w-full object-cover"
              />
            ) : (
              <Image
                src={shown}
                alt="Attached photo"
                fill
                sizes="(max-width: 640px) 100vw, 640px"
                className="object-cover"
              />
            )}
          </div>

          {uploading ? (
            <div className="absolute inset-x-0 bottom-0 bg-ink/70 p-2">
              <div
                role="progressbar"
                aria-valuenow={Math.round(progress)}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label="Photo upload"
                className="meter w-full"
              >
                {/* The only inline style in the app, and a legitimate one: the
                    width is live React state, not a static value. */}
                <div className="meter-fill" style={{ width: `${progress}%` }} />
              </div>
              <p className="mt-1 text-center font-mono text-xs font-bold text-paper">
                Uploading... {Math.round(progress)}%
              </p>
            </div>
          ) : null}
        </div>
      ) : (
        <button
          type="button"
          className="btn-ghost w-full"
          onClick={() => inputRef.current?.click()}
          disabled={disabled || uploading}
        >
          <span aria-hidden="true">[ + ]</span> Choose a photo
        </button>
      )}

      {shown && !uploading ? (
        <div className="mt-2 flex flex-wrap gap-2">
          <button
            type="button"
            className="btn-ghost flex-1"
            onClick={() => inputRef.current?.click()}
            disabled={disabled}
          >
            Change
          </button>
          <button
            type="button"
            className="btn-ghost flex-1"
            onClick={remove}
            disabled={disabled}
          >
            Remove
          </button>
        </div>
      ) : null}

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT.join(',')}
        className="sr-only"
        onChange={onPick}
        disabled={disabled || uploading}
      />

      {error ? (
        <p role="alert" className="alert mt-2 text-sm">
          {error}
        </p>
      ) : null}
    </div>
  )
}
