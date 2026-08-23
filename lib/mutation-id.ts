/**
 * A stable id for one capture submission (§6, §13).
 *
 * ⚠ **`crypto.randomUUID()` is not always there, and the place it is missing is
 * exactly where this app gets tested.** It is gated on a *secure context*, so it
 * exists on https and on localhost and is `undefined` on `http://192.168.x.x` —
 * which is how a handset reaches a `next start` running on the desk. A bare call
 * would throw on the one surface the four-second capture has to be measured on,
 * and nowhere else.
 *
 * `crypto.getRandomValues` carries no such gate. So the UUID is assembled from
 * it, and `randomUUID` is used when it is there because a native implementation
 * is the better one.
 *
 * ⚠ **Not `Math.random()` anywhere in the fallback.** The id is a submission
 * key, and two captures colliding on one means the second is silently swallowed
 * as a retry of the first — a lost line, with nothing on screen to say so.
 */
export function mutationId(): string {
  if (typeof crypto.randomUUID === 'function') return crypto.randomUUID()

  const bytes = crypto.getRandomValues(new Uint8Array(16))
  /* Version 4, variant 1 — the two fields a v4 UUID is required to pin. */
  bytes[6] = (bytes[6] & 0x0f) | 0x40
  bytes[8] = (bytes[8] & 0x3f) | 0x80

  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
}
