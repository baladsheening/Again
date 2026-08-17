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
      {/*
        `gap-1` between the name row and *Sign out*, where the block used to run on
        `gap-4`. The sign-out row carries `--collections-row` of its own height now
        and centres inside it, so most of the old gap is inside that box — keeping
        gap-4 as well would have added it twice and pushed the name up off the
        corner it is anchored to.
      */}
      <div className="mt-auto flex flex-col items-start gap-1">
        {/*
          The name above the handle when there is one, because §5's shape is
          that people who know you see your name — and on your own profile you
          are the person who knows you best. `profiles.display_name` is
          collected at onboarding and, until now, rendered nowhere: Phase 2 is
          where it has to be decided properly (docs/plan.md carries it), and
          this does not pre-empt that. It shows your own name to you, which no
          visibility rule has an opinion about.
        */}
        {/*
          **It is the `<h1>`, because it already was one in everything but the
          tag.** The page had no heading until 15 August and nor did any other
          signed-in route; here the largest type on the screen is the person's
          name, so the fix is to say so rather than to add a second thing. `p` to
          `h1` is block to block with the same class, so nothing moves.

          The `sr-only` fallback is for an account with no display name, which is
          allowed — the field is optional at onboarding. A page whose heading
          disappears with its data is the same fault one layer down.
        */}
        {/*
          The handle sits **beside** the name rather than under it, and which side
          it lands on is left to the writing direction: they are inline siblings in
          a flex row, so `dir="rtl"` reverses them without a rule of its own. Any
          `ml-`/`text-left` here would have been a second, silent decision about
          language — the flow already knows.

          `items-baseline` and not `items-center`: the two are 24px and 14px of
          type, and centring their boxes would set the smaller one adrift of the
          line the larger one sits on. A name and its handle read as one line, so
          they share a baseline.

          The `@` stays outside the `h1`. Both belong on the same line visually,
          but the heading of this page is the person's name — folding the handle in
          would make the accessibility tree announce *"Omar @collateralflora"* as
          one heading.

          The `sr-only` fallback is for an account with no display name, which is
          allowed. In that case the handle is standing in as the name, which is
          exactly what `nameFor` does everywhere else in the app.
        */}
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          {displayName ? (
            <h1 className="title">{displayName}</h1>
          ) : (
            <h1 className="sr-only">Profile</h1>
          )}

          {/* Sans, not mono: a displayed handle is a name, not data (§11). */}
          <span className="text-muted text-sm">@{handle}</span>
        </div>

        {/*
          ⚠ **`Sign out` stands on the collections' line.** This screen is the one
          place the bar at the foot is hidden (`showCollections` in
          `components/shell.tsx`), and before this the sign-out sat wherever the
          content happened to end — so the foot of the screen jumped every time you
          opened your own profile and jumped back when you left.

          The row wears `--collections-row` and centres in it, which is exactly what
          the bar's own row does; `main`'s bottom padding on this route is set to
          the bar's own inset for the same reason. Both numbers are tokens in
          globals.css, so the two feet cannot drift apart.
        */}
        {/*
          `rail:min-h-0` — the row is a phone measurement and must not survive the
          breakpoint. Above `rail` there is no bar at the foot to line up with; the
          rail's own identity block is the thing in that corner, and it sets its
          sign-out on a bare `micro` line. Leaving the 42px box in place moved this
          screen 14px away from the rail's line, which is the same fault one
          breakpoint up.
        */}
        <div className="flex min-h-[var(--collections-row)] items-center rail:min-h-0">
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
    </div>
  )
}
