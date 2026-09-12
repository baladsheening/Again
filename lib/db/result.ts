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
  /**
   * **This is already on your record** — 12 September, and it is deliberately
   * not `conflict`.
   *
   * ⚠ **A code rather than a message, because a CONTROL hangs off it.** The
   * composer offers *Update* on this one refusal and on no other, and the
   * alternative was the action string-matching the copy it was handed —
   * brittle, and it would make the wording load-bearing the day somebody
   * improves it. `conflict` is what every other collision in the layer returns,
   * so it cannot carry a meaning only one of them has.
   */
  | 'already'

export function ok<T>(value: T): Result<T, never> {
  return { ok: true, value }
}

export function err<E extends string = ErrorCode>(
  error: E,
  message: string,
): Result<never, E> {
  return { ok: false, error, message }
}
