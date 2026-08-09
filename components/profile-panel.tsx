'use client'

import { useRouter } from 'next/navigation'

import { authClient } from '@/lib/auth-client'

/**
 * `/profile`, which exists because the phone header does not have room for a
 * handle and a *Sign out* button (see `components/shell.tsx`).
 *
 * **Identity sits in the bottom-left corner**, which is where the rail already
 * puts it. That is the point: the same two things live in the same corner of
 * the screen at every width, and moving between a phone and a laptop does not
 * move them. It is also the reason the page is otherwise empty rather than
 * centred — a centred block would have been a different composition that
 * happened to contain the same words.
 *
 * `mt-auto` inside a `flex-1` column, so it falls to the foot of the viewport on
 * a short screen and to the foot of the content on a long one. The chain it
 * hangs off is `main` in the shell, which is a flex column for this.
 *
 * This is where `/settings` will grow — `docs/plan.md` lists three things
 * waiting on it (TMDB attribution, the iOS install note, and changing a
 * password you *do* know). None of them is built, and none was asked for.
 */
export function ProfilePanel({
  handle,
  displayName,
}: {
  handle: string
  displayName: string | null
}) {
  const router = useRouter()

  return (
    <div className="flex flex-1 flex-col">
      <div className="mt-auto flex flex-col items-start gap-4">
        {/*
          The name above the handle when there is one, because §5's shape is
          that people who know you see your name — and on your own profile you
          are the person who knows you best. `profiles.display_name` is
          collected at onboarding and, until now, rendered nowhere: Phase 2 is
          where it has to be decided properly (docs/plan.md carries it), and
          this does not pre-empt that. It shows your own name to you, which no
          visibility rule has an opinion about.
        */}
        {displayName && <p className="title">{displayName}</p>}

        {/* Sans, not mono: a displayed handle is a name, not data (§11). */}
        <span className="text-muted text-sm">@{handle}</span>

        <button
          type="button"
          onClick={async () => {
            await authClient.signOut()
            router.push('/sign-in')
            router.refresh()
          }}
          className="text-muted hover:text-text micro tap-target transition-colors"
        >
          Sign out
        </button>
      </div>
    </div>
  )
}
