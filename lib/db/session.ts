import 'server-only'

import { cache } from 'react'
import { headers } from 'next/headers'

import { auth } from '@/lib/auth'

declare const brand: unique symbol

/**
 * The authenticated caller. Every function in `lib/db/` takes one of these as
 * its first argument and filters on it (§3).
 *
 * It is branded and its constructor is private to this module, so a caller
 * cannot hand a DAL function an arbitrary user id — the only way to obtain a
 * `SessionUser` is to actually have a session. That turns the convention in §3
 * from something you remember into something the type checker enforces.
 */
export type SessionUser = {
  readonly id: string
  readonly email: string
} & { readonly [brand]: 'SessionUser' }

function asSessionUser(id: string, email: string): SessionUser {
  return { id, email } as SessionUser
}

/**
 * Request-scoped. `cache()` dedupes this across every Server Component and DAL
 * call in one render, so reading it repeatedly costs one lookup.
 */
export const getSessionUser = cache(async (): Promise<SessionUser | null> => {
  const result = await auth.api.getSession({ headers: await headers() })
  if (!result?.user) return null
  return asSessionUser(result.user.id, result.user.email)
})

/**
 * For Server Actions and route handlers, which are separate entry points and
 * must re-verify the caller themselves — a page-level check does not cover them.
 */
export async function requireSessionUser(): Promise<SessionUser> {
  const sessionUser = await getSessionUser()
  if (!sessionUser) throw new UnauthorizedError()
  return sessionUser
}

export class UnauthorizedError extends Error {
  constructor() {
    super('Not authenticated')
    this.name = 'UnauthorizedError'
  }
}
