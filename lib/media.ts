import 'server-only'

import { del, put } from '@vercel/blob'

/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  User images: a storage layer, not a button
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * §6's requirements, all of them: object storage outside Postgres, size and
 * type limits, EXIF stripping, an access-controlled media path, retained
 * provenance, reportable and removable assets. This file is the first four; the
 * row owns the last two — `image_path` hangs off the capture, so the owner, the
 * moment and the removal all belong to the record rather than to the file.
 *
 * ⚠ **Nothing here is reachable without a store.** `imagesAvailable()` is what
 * the camera glyph reads, and a control that cannot act goes off — which is the
 * foot's own rule, and it means deploying with no Blob store is safe rather than
 * broken.
 */

/**
 * Whether the app has anywhere to put a photograph.
 *
 * ⚠ **Checked rather than assumed, because the failure is silent otherwise.**
 * `put` without a token throws at the moment somebody is trying to save a
 * capture — which is the one moment this product promises nothing will go
 * wrong. The glyph is dark instead, and the person never reaches the path.
 */
export function imagesAvailable() {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN?.trim())
}

/**
 * **Eight megabytes**, which is a large photograph from a current handset and
 * an unreasonable one from anything else.
 *
 * ⚠ **Enforced on the bytes, not on what the client says.** A `File`'s reported
 * size is a claim; the length of what arrived is a fact. It is checked after
 * reading rather than before, because the read is the measurement.
 */
export const IMAGE_MAX_BYTES = 8 * 1024 * 1024

/**
 * **Three types, and HEIC is deliberately not one.**
 *
 * ⚠ **An `accept` of these three is what makes an iPhone convert.** Safari hands
 * over HEIC when the picker accepts `image/*`, and decoding HEIC needs a native
 * codec this project is not going to carry — so the file input names these three
 * and iOS transcodes on the way out. Accepting HEIC here and failing later would
 * put the failure after the photograph rather than before it.
 */
export const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const

export type MediaFailure = 'unavailable' | 'too-large' | 'wrong-type' | 'unreadable'

/* -------------------------------------------------------------------------- */
/*  Stripping                                                                  */
/* -------------------------------------------------------------------------- */

/**
 * ⚠ **A photograph carries where it was taken, and the app must not.** EXIF on
 * a handset photo routinely holds GPS to a few metres, the device, and the
 * second it was taken. This product's whole position is private-first, and
 * `CLAUDE.md` puts continuous background location outside Release 1 — storing a
 * co-ordinate that arrived inside a JPEG would be that, by accident, with no
 * consent step anywhere near it.
 *
 * ⚠ **Structural, not a library.** These are three container formats and the
 * metadata lives in named blocks in all three; dropping the blocks is exact and
 * has no decode step, so there is nothing to get wrong about colour, quality or
 * orientation. **Re-encoding was the alternative and it is worse**: it needs a
 * native codec, it costs quality on every save, and it would silently rotate
 * every photograph whose orientation lived in the tag being removed.
 *
 * ⚠ **Orientation goes with it, and that is accepted.** A JPEG whose EXIF said
 * *rotate 90°* will display unrotated. The alternative is keeping the block that
 * also holds the GPS, or decoding to apply it — and between a sideways photo and
 * a stored location, the sideways photo wins. Browsers only honour it for
 * `image-orientation: from-image` anyway, which is the default but applies to
 * the tag we are removing.
 */
export function stripMetadata(bytes: Uint8Array, type: string): Uint8Array {
  if (type === 'image/jpeg') return stripJpeg(bytes)
  if (type === 'image/png') return stripPng(bytes)
  if (type === 'image/webp') return stripWebp(bytes)
  return bytes
}

/**
 * JPEG: copy every segment except `APPn` and `COM`.
 *
 * EXIF is `APP1`, JFIF is `APP0`, Photoshop's blocks are `APP13`, and the
 * comment marker is where cameras put free text. Everything that describes the
 * *image* — the quantisation tables, the Huffman tables, the frame header — is
 * a different marker and is copied untouched. From `SOS` on, the file is
 * entropy-coded data with no segment structure, so it is copied verbatim.
 */
function stripJpeg(bytes: Uint8Array): Uint8Array {
  if (bytes.length < 4 || bytes[0] !== 0xff || bytes[1] !== 0xd8) return bytes

  const keep: [number, number][] = [[0, 2]]
  let i = 2

  while (i + 3 < bytes.length) {
    if (bytes[i] !== 0xff) break
    const marker = bytes[i + 1]

    /* Standalone markers: two bytes, no length. */
    if (marker === 0xd8 || marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) {
      keep.push([i, i + 2])
      i += 2
      continue
    }

    /* From here on the file is entropy-coded. Copy the rest as it is. */
    if (marker === 0xda) {
      keep.push([i, bytes.length])
      break
    }

    const length = (bytes[i + 2] << 8) | bytes[i + 3]
    if (length < 2) break
    const end = i + 2 + length
    if (end > bytes.length) break

    const isApp = marker >= 0xe0 && marker <= 0xef
    const isComment = marker === 0xfe
    if (!isApp && !isComment) keep.push([i, end])

    i = end
  }

  return splice(bytes, keep)
}

/**
 * PNG: copy every chunk except the ones that carry text or EXIF.
 *
 * ⚠ **A PNG's own chunk CRCs are per chunk**, so dropping whole chunks leaves
 * every remaining CRC correct. There is no file-level checksum to repair, which
 * is why this needs no rewriting at all.
 */
function stripPng(bytes: Uint8Array): Uint8Array {
  const SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]
  if (bytes.length < 8 || SIGNATURE.some((b, n) => bytes[n] !== b)) return bytes

  const drop = new Set(['eXIf', 'tEXt', 'zTXt', 'iTXt', 'tIME'])
  const keep: [number, number][] = [[0, 8]]
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
  let i = 8

  while (i + 8 <= bytes.length) {
    const length = view.getUint32(i)
    const name = String.fromCharCode(bytes[i + 4], bytes[i + 5], bytes[i + 6], bytes[i + 7])
    const end = i + 12 + length
    if (end > bytes.length) break
    if (!drop.has(name)) keep.push([i, end])
    i = end
    if (name === 'IEND') break
  }

  return splice(bytes, keep)
}

/**
 * WebP: copy every RIFF chunk except `EXIF` and `XMP `, then correct the RIFF
 * size.
 *
 * ⚠ **The container length has to be rewritten**, unlike PNG's — a RIFF header
 * states the size of everything after it, and a file whose header disagrees with
 * its contents is a file some decoders reject and others read past the end of.
 */
function stripWebp(bytes: Uint8Array): Uint8Array {
  const ascii = (at: number) =>
    String.fromCharCode(bytes[at], bytes[at + 1], bytes[at + 2], bytes[at + 3])
  if (bytes.length < 12 || ascii(0) !== 'RIFF' || ascii(8) !== 'WEBP') return bytes

  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
  const keep: [number, number][] = [[0, 12]]
  let i = 12

  while (i + 8 <= bytes.length) {
    const name = ascii(i)
    /*
      ⚠ **The size follows the name here, where PNG puts it first.** Reading it
      at the name's own offset gives four ASCII bytes as a little-endian
      integer — an enormous length, one chunk, and every later chunk silently
      dropped. Caught by the test that asserts the picture data survives.
    */
    const length = view.getUint32(i + 4, true)
    /* RIFF chunks are padded to an even length; the pad is part of the chunk. */
    const end = i + 8 + length + (length % 2)
    if (end > bytes.length) break
    if (name !== 'EXIF' && name !== 'XMP ') keep.push([i, end])
    i = end
  }

  const out = splice(bytes, keep)
  new DataView(out.buffer, out.byteOffset, out.byteLength).setUint32(4, out.length - 8, true)
  return out
}

/** The kept ranges, concatenated. */
function splice(bytes: Uint8Array, keep: [number, number][]): Uint8Array {
  const size = keep.reduce((n, [from, to]) => n + (to - from), 0)
  const out = new Uint8Array(size)
  let at = 0
  for (const [from, to] of keep) {
    out.set(bytes.subarray(from, to), at)
    at += to - from
  }
  return out
}

/* -------------------------------------------------------------------------- */
/*  Storing                                                                    */
/* -------------------------------------------------------------------------- */

/**
 * Put one image in the store and hand back its pathname.
 *
 * ⚠ **Private, so the pathname is not a capability.** The bytes are reachable
 * only through a token that never leaves the server — see `image_path` in the
 * schema for why an unguessable public URL is not an access-controlled media
 * path.
 *
 * ⚠ **Namespaced by owner, and the name is random.** The prefix is not
 * security — the store's privacy is — but it makes *everything belonging to this
 * person* a single listable prefix, which is what a deletion request needs.
 */
export async function storeImage(
  userId: string,
  file: File,
): Promise<{ ok: true; path: string } | { ok: false; reason: MediaFailure }> {
  if (!imagesAvailable()) return { ok: false, reason: 'unavailable' }
  if (!IMAGE_TYPES.includes(file.type as (typeof IMAGE_TYPES)[number])) {
    return { ok: false, reason: 'wrong-type' }
  }

  let bytes: Uint8Array
  try {
    bytes = new Uint8Array(await file.arrayBuffer())
  } catch {
    return { ok: false, reason: 'unreadable' }
  }

  /* Measured, not claimed — see `IMAGE_MAX_BYTES`. */
  if (bytes.length === 0 || bytes.length > IMAGE_MAX_BYTES) {
    return { ok: false, reason: 'too-large' }
  }

  const clean = stripMetadata(bytes, file.type)
  const extension = file.type === 'image/jpeg' ? 'jpg' : file.type.slice('image/'.length)

  /*
    A `Blob` rather than the array: the client takes a `PutBody`, and wrapping
    the bytes is exact where a `Buffer` cast would be a claim about a runtime.
  */
  const body = new Blob([clean as BlobPart], { type: file.type })

  const blob = await put(`captures/${userId}/${crypto.randomUUID()}.${extension}`, body, {
    access: 'private',
    contentType: file.type,
    /*
      The pathname is chosen here and has to survive: a random suffix would make
      the row's `image_path` disagree with the object the moment two uploads
      collide on a name that cannot collide.
    */
    addRandomSuffix: false,
  })

  return { ok: true, path: blob.pathname }
}

/**
 * Take one out of the store.
 *
 * ⚠ **Best effort, and the caller must not wait on it for correctness.** It is
 * used to clean up after a capture that failed to write, where the alternative
 * to a failed delete is an orphaned object nobody can reach — the row that would
 * have pointed at it does not exist.
 */
export async function removeImage(path: string) {
  try {
    await del(path)
  } catch {
    /* An orphan in a private store is unreachable. Losing the delete is not. */
  }
}
