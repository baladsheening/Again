import 'server-only'

import { eq } from 'drizzle-orm'

import { db } from './client'
import { profiles, user, type Profile } from './schema'
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

/** The onboarding field's own cap (`app/actions/profile.ts`), applied here too. */
const DISPLAY_NAME_MAX = 60

/**
 * Whether the name an account signed up with can be shown to other people.
 *
 * ⚠ **Sign-up does `name: name || email`** (`components/sign-in-form.tsx`), so
 * `user.name` is not merely optional — it can *be* the account's email address.
 * Seeding a display name from it without this check would put people's email
 * addresses in front of their friends, which is a worse failure than having no
 * name at all.
 *
 * Rejecting anything containing `@` covers that case by construction rather than
 * by comparing against this particular email, and it is right on its own terms:
 * `@` is how the app writes a handle, so a display name carrying one would read
 * as one.
 */
function usableAsDisplayName(name: string | null | undefined): string | null {
  const trimmed = name?.trim()
  if (!trimmed || trimmed.includes('@')) return null
  return trimmed.slice(0, DISPLAY_NAME_MAX)
}

/**
 * `displayName` is optional at onboarding, and when it is left blank the name
 * from sign-up stands in.
 *
 * The app asks for a name twice — once at sign-up, once at onboarding — and
 * before this the second one silently won even when empty. §5's identity rule
 * reads `display_name`, so anyone who skipped the optional field was shown to
 * their friends as `@handle`: the rule never fired for the account that had
 * already given its name. Found by driving the rule against real rows rather
 * than by reading it.
 *
 * The optional field survives as an override, because the name you go by is not
 * always the name on the account.
 */
export async function createProfile(
  sessionUser: SessionUser,
  input: { handle: string; displayName?: string },
): Promise<Result<Profile>> {
  const validated = validateHandle(input.handle)
  if (!validated.ok) return err('invalid', validated.error)

  let displayName = usableAsDisplayName(input.displayName)

  if (!displayName) {
    const [account] = await db
      .select({ name: user.name })
      .from(user)
      .where(eq(user.id, sessionUser.id))
      .limit(1)

    displayName = usableAsDisplayName(account?.name)
  }

  try {
    const [profile] = await db
      .insert(profiles)
      .values({
        id: sessionUser.id,
        handle: validated.handle,
        handleSkeleton: validated.skeleton,
        displayName,
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
