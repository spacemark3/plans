import mongoose from 'mongoose'
import { NextResponse, type NextRequest } from 'next/server'

import { deletePhoto } from '@/app/lib/blob'
import { toPostDTO } from '@/app/lib/data'
import Post from '@/app/lib/models/Post'
import dbConnect from '@/app/lib/mongoose'
import { getSession } from '@/app/lib/session'

const NOT_FOUND = { error: 'Post not found.' }

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  if (!mongoose.isValidObjectId(id)) return NextResponse.json(NOT_FOUND, { status: 404 })

  let payload: Record<string, unknown>
  try {
    payload = (await request.json()) as Record<string, unknown>
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 })
  }

  const { title, body, photoUrl } = payload

  if (title !== undefined) {
    if (typeof title !== 'string' || title.trim().length === 0) {
      return NextResponse.json({ error: 'A title is required.' }, { status: 400 })
    }
    if (title.trim().length > 160) {
      return NextResponse.json(
        { error: 'The title can be at most 160 characters.' },
        { status: 400 },
      )
    }
  }

  if (body !== undefined) {
    if (typeof body !== 'string' || body.trim().length === 0) {
      return NextResponse.json({ error: 'The text is required.' }, { status: 400 })
    }
    if (body.trim().length > 20000) {
      return NextResponse.json(
        { error: 'The text can be at most 20000 characters.' },
        { status: 400 },
      )
    }
  }

  if (photoUrl !== undefined && photoUrl !== null && typeof photoUrl !== 'string') {
    return NextResponse.json({ error: 'Invalid photo.' }, { status: 400 })
  }

  try {
    await dbConnect()

    const existing = await Post.findById(id)
    if (!existing) return NextResponse.json(NOT_FOUND, { status: 404 })

    // `author` is deliberately not patchable — a post never changes hands.
    if (typeof title === 'string') existing.title = title.trim()
    if (typeof body === 'string') existing.body = body.trim()

    const previousPhoto = existing.photoUrl ?? null
    let photoReplaced = false
    if (photoUrl !== undefined) {
      const next = typeof photoUrl === 'string' ? photoUrl : null
      photoReplaced = previousPhoto !== null && previousPhoto !== next
      existing.photoUrl = next
    }

    await existing.save()

    // Only after the DB write has committed.
    if (photoReplaced) await deletePhoto(previousPhoto)

    return NextResponse.json(toPostDTO(existing.toObject()))
  } catch (error) {
    console.error('PATCH /api/posts/[id]', error)
    return NextResponse.json({ error: 'Could not save.' }, { status: 503 })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  if (!mongoose.isValidObjectId(id)) return NextResponse.json(NOT_FOUND, { status: 404 })

  try {
    await dbConnect()

    // Mongo first, blob second — same ordering rule as items.
    const deleted = await Post.findByIdAndDelete(id).lean<{
      photoUrl?: string | null
    } | null>()
    if (!deleted) return NextResponse.json(NOT_FOUND, { status: 404 })

    await deletePhoto(deleted.photoUrl)

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('DELETE /api/posts/[id]', error)
    return NextResponse.json({ error: 'Could not delete.' }, { status: 503 })
  }
}
