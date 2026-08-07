/**
 * Handle validation (§10). Homoglyph impersonation matters in an app built on
 * knowing who someone is — the whole product is "this list belongs to my
 * friend", so a handle that reads as someone else's is the attack that matters.
 *
 * Pure module, no server dependencies, so it is directly testable.
 */

const RESERVED = new Set([
  // Routes (§8) and their obvious neighbours.
  'me',
  'u',
  'overlap',
  'swap',
  'swaps',
  'notifications',
  'settings',
  'api',
  'auth',
  'login',
  'signin',
  'signup',
  'logout',
  'register',
  'new',
  'search',
  'about',
  'help',
  'support',
  'terms',
  'privacy',
  'legal',
  'admin',
  'root',
  'system',
  'staff',
  'official',
  'again',
  'null',
  'undefined',
  'static',
  '_next',
  'public',
  'assets',
  'favicon',
  'manifest',
  'sw',
  'robots',
  'sitemap',
])

/** After normalisation a handle is this and nothing else. */
const SHAPE = /^[a-z0-9_]{2,20}$/

/** Zero-width and soft-hyphen characters: invisible, so they must not survive. */
const INVISIBLE = /[\u200B-\u200D\uFEFF\u00AD\u2060]/g

/**
 * Characters that read as each other at UI sizes. Folding to a skeleton lets us
 * reject `cla1re` when `claire` exists, and `rnark` when `mark` does.
 */
const CONFUSABLES: Array<[RegExp, string]> = [
  [/0/g, 'o'],
  [/[1l]/g, 'i'],
  [/5/g, 's'],
  [/8/g, 'b'],
  [/2/g, 'z'],
  [/rn/g, 'm'],
  [/vv/g, 'w'],
  [/_/g, ''],
]

/**
 * NFKC first, so composed and decomposed forms compare equal and full-width
 * characters collapse to ASCII. Then strip the invisibles, which would
 * otherwise let two different handles render identically.
 */
export function normaliseHandle(input: string): string {
  return input.normalize('NFKC').toLowerCase().replace(INVISIBLE, '').trim()
}

/**
 * The comparison key for impersonation. Two handles with the same skeleton may
 * not both exist — this is what `profiles.handle_skeleton` stores and indexes.
 */
export function handleSkeleton(handle: string): string {
  let s = normaliseHandle(handle)
  for (const [pattern, replacement] of CONFUSABLES) s = s.replace(pattern, replacement)
  return s
}

export type HandleError = 'shape' | 'reserved'

export function validateHandle(
  input: string,
): { ok: true; handle: string; skeleton: string } | { ok: false; error: HandleError } {
  const handle = normaliseHandle(input)

  if (!SHAPE.test(handle)) return { ok: false, error: 'shape' }
  if (RESERVED.has(handle)) return { ok: false, error: 'reserved' }

  const skeleton = handleSkeleton(handle)
  // A handle whose skeleton collides with a reserved word is reserved too.
  if (RESERVED.has(skeleton)) return { ok: false, error: 'reserved' }

  return { ok: true, handle, skeleton }
}

export const HANDLE_ERROR_COPY: Record<HandleError, string> = {
  shape: 'Letters, numbers and underscores. Between 2 and 20 characters.',
  reserved: 'That handle is taken.',
}
