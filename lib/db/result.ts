import 'server-only'

/**
 * Typed `Result` returns from `lib/db/` rather than thrown exceptions for
 * expected failures (§10). Thrown exceptions stay for genuine bugs, where an
 * error boundary is the right response.
 */
export type Result<T, E extends string = ErrorCode> =
  | { ok: true; value: T }
  | { ok: false; error: E; message: string }

export type ErrorCode =
  | 'not_found'
  | 'forbidden'
  | 'conflict'
  | 'invalid'
  | 'rate_limited'
  /*
     ⚠ **`already` stood here and is deleted — 12 September, directed.** It was
     added that morning because a CONTROL hung off one refusal: the composer's
     *Update*, on *Already on your record.* **The direction that made a live
     twin re-enter itself removed the refusal**, so nothing returns the code and
     nothing reads it. A member of a shared union that no caller can produce is
     a branch every consumer has to ignore.
  */

export function ok<T>(value: T): Result<T, never> {
  return { ok: true, value }
}

export function err<E extends string = ErrorCode>(
  error: E,
  message: string,
): Result<never, E> {
  return { ok: false, error, message }
}
