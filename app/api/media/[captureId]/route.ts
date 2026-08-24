import { get } from '@vercel/blob'
import { NextResponse } from 'next/server'
import { z } from 'zod'

import { getMyCaptureImagePath, getSessionUser } from '@/lib/db'

/**
 * **The access-controlled media path** (§6), and the only way to the bytes.
 *
 * The blobs are stored with `access: 'private'`, so the store itself refuses
 * anonymous reads — the token that can open them never leaves the server. This
 * route is the door, and what it checks is not the pathname but **whose capture
 * this is**: `getMyCaptureImagePath` filters on the session user, so a request
 * either names a row belonging to the person asking or it gets nothing.
 *
 * ⚠ **An unguessable public URL is not this.** It is a secret that leaks the
 * first time somebody shares a link and cannot be revoked without deleting the
 * file. The difference matters most for exactly the content this stores: a
 * photograph somebody took of something they want.
 *
 * ⚠ **A route handler rather than a Server Action**, for the same reason the
 * TMDB proxy is one: this returns bytes with headers, it is requested by an
 * `<img>` rather than by code, and it wants to be cacheable — none of which a
 * Server Action does.
 *
 * ⚠ **404 for both *no such capture* and *not yours*.** A 403 on someone else's
 * id would confirm that the id exists, which is the one fact this route must not
 * hand out.
 *
 * ⚠ **Images on somebody else's page are a later question**, and this is not
 * where it gets answered. There is deliberately no parameter that widens the
 * check; a shared image needs the four terms `listCapturesForOtherUser` applies,
 * and it needs the visibility decision that goes with them.
 */
const idSchema = z.string().uuid()

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ captureId: string }> },
) {
  const sessionUser = await getSessionUser()
  if (!sessionUser) return new NextResponse(null, { status: 401 })

  const { captureId } = await params
  if (!idSchema.safeParse(captureId).success) return new NextResponse(null, { status: 404 })

  const path = await getMyCaptureImagePath(sessionUser, captureId)
  if (!path) return new NextResponse(null, { status: 404 })

  const blob = await get(path, { access: 'private' })
  if (!blob) return new NextResponse(null, { status: 404 })

  return new NextResponse(blob.stream, {
    headers: {
      'Content-Type': blob.headers.get('content-type') ?? 'application/octet-stream',
      /*
        ⚠ **`private`, and it is the header that matters here.** The bytes are
        one person's; a shared cache holding them under a URL another session
        could ask for would undo the check above without touching the code that
        makes it. Immutable because the pathname is a UUID — a capture's
        photograph is never replaced, only removed with the capture.
      */
      'Cache-Control': 'private, max-age=31536000, immutable',
    },
  })
}
