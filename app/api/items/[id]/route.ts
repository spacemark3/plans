import mongoose from 'mongoose'
import { NextResponse, type NextRequest } from 'next/server'

import { deletePhoto } from '@/app/lib/blob'
import { toItemDTO } from '@/app/lib/data'
import Item from '@/app/lib/models/Item'
import dbConnect from '@/app/lib/mongoose'
import { getSession } from '@/app/lib/session'

const NOT_FOUND = { error: 'Item not found.' }

export async function PATCH(
  request: NextRequest,
  // Dynamic params are a Promise in Next 16 — it must be awaited.
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  if (!mongoose.isValidObjectId(id)) return NextResponse.json(NOT_FOUND, { status: 404 })

  let body: Record<string, unknown>
  try {
    body = (await request.json()) as Record<string, unknown>
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 })
  }

  const { title, description, photoUrl, done } = body

  if (title !== undefined) {
    if (typeof title !== 'string' || title.trim().length === 0) {
      return NextResponse.json({ error: 'A title is required.' }, { status: 400 })
    }
    if (title.trim().length > 120) {
      return NextResponse.json(
        { error: 'The title can be at most 120 characters.' },
        { status: 400 },
      )
    }
  }

  if (description !== undefined) {
    if (typeof description !== 'string') {
      return NextResponse.json({ error: 'Invalid description.' }, { status: 400 })
    }
    if (description.trim().length > 4000) {
      return NextResponse.json(
        { error: 'The description can be at most 4000 characters.' },
        { status: 400 },
      )
    }
  }

  if (photoUrl !== undefined && photoUrl !== null && typeof photoUrl !== 'string') {
    return NextResponse.json({ error: 'Invalid photo.' }, { status: 400 })
  }

  if (done !== undefined && typeof done !== 'boolean') {
    return NextResponse.json({ error: 'Invalid value.' }, { status: 400 })
  }

  try {
    await dbConnect()

    const existing = await Item.findById(id)
    if (!existing) return NextResponse.json(NOT_FOUND, { status: 404 })

    // `kind` and `author` are deliberately not patchable. An item does not
    // change category, and it never changes hands.
    if (typeof title === 'string') existing.title = title.trim()
    if (typeof description === 'string') existing.description = description.trim()

    const previousPhoto = existing.photoUrl ?? null
    let photoReplaced = false
    if (photoUrl !== undefined) {
      const next = typeof photoUrl === 'string' ? photoUrl : null
      photoReplaced = previousPhoto !== null && previousPhoto !== next
      existing.photoUrl = next
    }

    // The done/completedAt invariant lives here rather than in the schema:
    // marking an already-done item done again must NOT reset the date.
    if (typeof done === 'boolean') {
      if (done && !existing.done) {
        existing.done = true
        existing.completedAt = new Date()
      } else if (!done) {
        existing.done = false
        existing.completedAt = null
      }
    }

    await existing.save()

    // Only after the DB write has committed. A blob failure must never abort it.
    if (photoReplaced) await deletePhoto(previousPhoto)

    return NextResponse.json(toItemDTO(existing.toObject()))
  } catch (error) {
    console.error('PATCH /api/items/[id]', error)
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

    // Mongo FIRST, blob second. Reversed, a failed DB delete would leave a card
    // pointing at a 404 image forever.
    const deleted = await Item.findByIdAndDelete(id).lean<{
      photoUrl?: string | null
    } | null>()
    if (!deleted) return NextResponse.json(NOT_FOUND, { status: 404 })

    await deletePhoto(deleted.photoUrl)

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('DELETE /api/items/[id]', error)
    return NextResponse.json({ error: 'Could not delete.' }, { status: 503 })
  }
}
