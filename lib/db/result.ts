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

export function ok<T>(value: T): Result<T, never> {
  return { ok: true, value }
}

export function err<E extends string = ErrorCode>(
  error: E,
  message: string,
): Result<never, E> {
  return { ok: false, error, message }
}
