import { handleUpload, type HandleUploadBody } from '@vercel/blob/client'
import { NextResponse } from 'next/server'

import { getSession } from '@/app/lib/session'

/** Must stay in step with the client-side check in PhotoField. */
export const ALLOWED_CONTENT_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
  'image/gif',
]

export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024

/**
 * The security boundary for client uploads.
 *
 * The browser sends the image bytes STRAIGHT to blob.vercel-storage.com; this
 * route only mints a short-lived token. That is the whole point of the
 * architecture — it is what lets a phone-sized photo through at all, since a
 * serverless function body is capped around 4.5 MB. Anyone "simplifying" this
 * into a server-side upload reintroduces that cap.
 */
export async function POST(request: Request): Promise<NextResponse> {
  // Read the session BEFORE handleUpload and pin it: onBeforeGenerateToken runs
  // inside handleUpload's own async flow, where the request context that
  // cookies() depends on is no longer reliably ours.
  const session = await getSession()

  // Reject here, before handleUpload, rather than only inside
  // onBeforeGenerateToken. Two reasons:
  //
  //  1. handleUpload validates BLOB_READ_WRITE_TOKEN before it ever calls
  //     onBeforeGenerateToken, so with no store configured an anonymous request
  //     fails with "No read-write token found" — rejected, but for the wrong
  //     reason, which makes the auth gate impossible to actually test.
  //  2. It makes this handler match every other route in the app: session check
  //     first, 401 JSON in Italian.
  //
  // The check inside onBeforeGenerateToken stays as well — defence in depth.
  if (!session) {
    return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
  }

  let body: HandleUploadBody
  try {
    body = (await request.json()) as HandleUploadBody
  } catch {
    return NextResponse.json({ error: 'Richiesta non valida.' }, { status: 400 })
  }

  try {
    const result = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async () => {
        // No session, no token. This is the only gate on uploads.
        if (!session) throw new Error('Non autorizzato')

        return {
          allowedContentTypes: ALLOWED_CONTENT_TYPES,
          maximumSizeInBytes: MAX_UPLOAD_BYTES,
          addRandomSuffix: true,
          tokenPayload: JSON.stringify({ u: session.u }),
        }
      },
      onUploadCompleted: async () => {
        // Webhook-driven, and it does NOT fire on localhost.
        //
        // NOTHING REQUIRED GOES HERE, by design: the client persists the
        // document itself once upload() resolves. Any logic placed here would
        // work in production and be silently broken in development, in a way
        // that looks like a Blob bug.
      },
    })

    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 400 })
  }
}
