import { NextResponse, type NextRequest } from 'next/server'

import { getItems, toItemDTO } from '@/app/lib/data'
import Item from '@/app/lib/models/Item'
import dbConnect from '@/app/lib/mongoose'
import { getSession } from '@/app/lib/session'
import { isItemKind } from '@/app/lib/types'

export async function GET(request: NextRequest): Promise<NextResponse> {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = request.nextUrl

  const kindParam = searchParams.get('kind')
  if (kindParam !== null && !isItemKind(kindParam)) {
    return NextResponse.json({ error: 'Invalid category.' }, { status: 400 })
  }

  const doneParam = searchParams.get('done')
  if (doneParam !== null && doneParam !== 'true' && doneParam !== 'false') {
    return NextResponse.json({ error: 'Invalid filter.' }, { status: 400 })
  }

  try {
    const items = await getItems({
      kind: kindParam ?? undefined,
      done: doneParam === null ? undefined : doneParam === 'true',
    })
    return NextResponse.json(items)
  } catch (error) {
    console.error('GET /api/items', error)
    return NextResponse.json({ error: 'Database unreachable.' }, { status: 503 })
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: Record<string, unknown>
  try {
    body = (await request.json()) as Record<string, unknown>
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 })
  }

  const { kind, title, description, photoUrl } = body

  if (!isItemKind(kind)) {
    return NextResponse.json({ error: 'Invalid category.' }, { status: 400 })
  }

  if (typeof title !== 'string' || title.trim().length === 0) {
    return NextResponse.json({ error: 'A title is required.' }, { status: 400 })
  }
  if (title.trim().length > 120) {
    return NextResponse.json(
      { error: 'The title can be at most 120 characters.' },
      { status: 400 },
    )
  }

  if (description !== undefined && typeof description !== 'string') {
    return NextResponse.json({ error: 'Invalid description.' }, { status: 400 })
  }
  if (typeof description === 'string' && description.trim().length > 4000) {
    return NextResponse.json(
      { error: 'The description can be at most 4000 characters.' },
      { status: 400 },
    )
  }

  if (photoUrl !== undefined && photoUrl !== null && typeof photoUrl !== 'string') {
    return NextResponse.json({ error: 'Invalid photo.' }, { status: 400 })
  }

  try {
    await dbConnect()
    const created = await Item.create({
      kind,
      title: title.trim(),
      description: typeof description === 'string' ? description.trim() : '',
      photoUrl: typeof photoUrl === 'string' ? photoUrl : null,
      // Authorship comes from the SESSION. Any `author` in the body is ignored
      // on purpose — a client must never be able to write as the other partner.
      author: session.u,
      done: false,
      completedAt: null,
    })

    return NextResponse.json(toItemDTO(created.toObject()), { status: 201 })
  } catch (error) {
    console.error('POST /api/items', error)
    return NextResponse.json({ error: 'Could not save.' }, { status: 503 })
  }
}
