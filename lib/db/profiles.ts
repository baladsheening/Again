import 'server-only'

import { eq } from 'drizzle-orm'

import { db } from './client'
import { profiles, type Profile } from './schema'
import type { SessionUser } from './session'
import { err, ok, type Result } from './result'
import { validateHandle } from '@/lib/handles'

export async function getMyProfile(sessionUser: SessionUser): Promise<Profile | null> {
  const [profile] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.id, sessionUser.id))
    .limit(1)

  return profile ?? null
}

/**
 * Public by handle. There is no discovery and no search for strangers (§2) —
 * you reach someone's page because you already know their handle.
 */
export async function getProfileByHandle(
  _viewer: SessionUser,
  handle: string,
): Promise<Profile | null> {
  const [profile] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.handle, handle.toLowerCase()))
    .limit(1)

  return profile ?? null
}

export async function createProfile(
  sessionUser: SessionUser,
  input: { handle: string; displayName?: string },
): Promise<Result<Profile>> {
  const validated = validateHandle(input.handle)
  if (!validated.ok) return err('invalid', validated.error)

  try {
    const [profile] = await db
      .insert(profiles)
      .values({
        id: sessionUser.id,
        handle: validated.handle,
        handleSkeleton: validated.skeleton,
        displayName: input.displayName ?? null,
      })
      .returning()

    return ok(profile)
  } catch (cause) {
    // Unique violation on either `handle` or `handle_skeleton`. Both mean the
    // same thing to the person typing: someone already reads as that.
    if (isUniqueViolation(cause)) return err('conflict', 'That handle is taken.')
    throw cause
  }
}

function isUniqueViolation(cause: unknown): boolean {
  return (
    typeof cause === 'object' &&
    cause !== null &&
    'code' in cause &&
    (cause as { code?: string }).code === '23505'
  )
}
