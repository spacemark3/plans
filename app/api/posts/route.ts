import { NextResponse, type NextRequest } from 'next/server'

import { getPosts, toPostDTO } from '@/app/lib/data'
import Post from '@/app/lib/models/Post'
import dbConnect from '@/app/lib/mongoose'
import { getSession } from '@/app/lib/session'

export async function GET(): Promise<NextResponse> {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })

  try {
    return NextResponse.json(await getPosts())
  } catch (error) {
    console.error('GET /api/posts', error)
    return NextResponse.json({ error: 'Database non raggiungibile.' }, { status: 503 })
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })

  let payload: Record<string, unknown>
  try {
    payload = (await request.json()) as Record<string, unknown>
  } catch {
    return NextResponse.json({ error: 'Richiesta non valida.' }, { status: 400 })
  }

  const { title, body, photoUrl } = payload

  if (typeof title !== 'string' || title.trim().length === 0) {
    return NextResponse.json({ error: 'Il titolo è obbligatorio.' }, { status: 400 })
  }
  if (title.trim().length > 160) {
    return NextResponse.json(
      { error: 'Il titolo può avere al massimo 160 caratteri.' },
      { status: 400 },
    )
  }

  if (typeof body !== 'string' || body.trim().length === 0) {
    return NextResponse.json({ error: 'Il testo è obbligatorio.' }, { status: 400 })
  }
  if (body.trim().length > 20000) {
    return NextResponse.json(
      { error: 'Il testo può avere al massimo 20000 caratteri.' },
      { status: 400 },
    )
  }

  if (photoUrl !== undefined && photoUrl !== null && typeof photoUrl !== 'string') {
    return NextResponse.json({ error: 'Foto non valida.' }, { status: 400 })
  }

  try {
    await dbConnect()
    const created = await Post.create({
      title: title.trim(),
      body: body.trim(),
      photoUrl: typeof photoUrl === 'string' ? photoUrl : null,
      // From the session, never from the request body.
      author: session.u,
    })

    return NextResponse.json(toPostDTO(created.toObject()), { status: 201 })
  } catch (error) {
    console.error('POST /api/posts', error)
    return NextResponse.json({ error: 'Non sono riuscito a salvare.' }, { status: 503 })
  }
}
