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
  //     first, 401 JSON.
  //
  // The check inside onBeforeGenerateToken stays as well — defence in depth.
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: HandleUploadBody
  try {
    body = (await request.json()) as HandleUploadBody
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 })
  }

  try {
    const result = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async () => {
        // No session, no token. This is the only gate on uploads.
        if (!session) throw new Error('Unauthorized')

        return {
          allowedContentTypes: ALLOWED_CONTENT_TYPES,
          maximumSizeInBytes: MAX_UPLOAD_BYTES,
          addRandomSuffix: true,
          tokenPayload: JSON.stringify({ u: session.u }),
        }
      },
      // NO `onUploadCompleted` — deliberately absent, not forgotten.
      //
      // It is optional in @vercel/blob, and nothing is required here by
      // design: the client persists the document itself once upload()
      // resolves. Passing an empty handler is not free — handleUpload then has
      // to resolve a public callbackUrl for the completion webhook, which is
      // impossible off Vercel (it checks `process.env.VERCEL !== '1'`), so
      // every upload in development logged:
      //
      //   onUploadCompleted provided but no callbackUrl could be determined.
      //
      // That was a console.warn, not a throw — the POST still returned 200 and
      // the upload worked — but it is alarming noise on a healthy request.
      //
      // If post-upload work is ever genuinely needed, add the handler back and
      // remember the webhook NEVER fires on localhost: such logic works in
      // production and is silently dead in development, which looks exactly
      // like a Blob bug.
    })

    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 400 })
  }
}
