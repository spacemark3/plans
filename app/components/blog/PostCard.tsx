'use client'

import Image from 'next/image'

import AuthorChip from '@/app/components/AuthorChip'
import type { PartnerId } from '@/app/lib/auth'
import type { PostDTO } from '@/app/lib/types'

const LONG_DATE = new Intl.DateTimeFormat('it-IT', { dateStyle: 'long' })

export default function PostCard({
  post,
  me,
  pending = false,
  onEdit,
  onDelete,
}: {
  post: PostDTO
  me: PartnerId
  pending?: boolean
  onEdit: () => void
  onDelete: () => void
}) {
  return (
    <article className="card-glass p-5 sm:p-6">
      <h2 className="text-lg font-semibold">{post.title}</h2>

      <div className="mt-2 flex flex-wrap items-center gap-2">
        <AuthorChip name={post.authorName} self={post.author === me} />
        <span className="text-xs text-ink-400">
          {LONG_DATE.format(new Date(post.createdAt))}
        </span>
      </div>

      {post.photoUrl ? (
        <div className="relative mt-4 aspect-[4/3] w-full overflow-hidden rounded-field bg-blush-50">
          <Image
            src={post.photoUrl}
            alt={`Foto del post "${post.title}"`}
            fill
            sizes="(max-width: 640px) 100vw, 640px"
            className="object-cover"
          />
        </div>
      ) : null}

      <p className="mt-4 text-sm leading-relaxed whitespace-pre-wrap text-ink-700">
        {post.body}
      </p>

      <div className="mt-5 flex flex-wrap gap-2">
        <button type="button" className="btn-ghost" onClick={onEdit} disabled={pending}>
          Modifica
        </button>
        <button
          type="button"
          className="btn-ghost"
          onClick={onDelete}
          disabled={pending}
        >
          Elimina
        </button>
      </div>
    </article>
  )
}
