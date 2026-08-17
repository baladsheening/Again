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
export function ProfilePanel({ handle }: { handle: string }) {
  const router = useRouter()

  return (
    <div className="flex flex-1 flex-col">
      {/*
        `gap-1` between the handle and *Sign out*, where the block used to run on
        `gap-4`. The sign-out row carries `--collections-row` of its own height now
        and centres inside it, so most of the old gap is inside that box — keeping
        gap-4 as well would have added it twice.
      */}
      <div className="mt-auto flex flex-col items-start gap-1">
        {/*
          ⚠ **The display name was here and is gone (17 August).** It was set at
          `title` size as the page's heading, with the handle beside it — and the
          argument against it is simply that nobody needs telling their own name.
          It was showing you the one fact you already have.

          What it cost was agreement: the rail carries `@handle` alone in its own
          bottom-left corner, so the same two things in the same corner at every
          width were not in fact the same two things. They are now.

          `display_name` itself is untouched and still does its job — §5's identity
          rule (`nameFor`) shows it to people who track you back, which is the
          audience it was collected for. This screen is not that audience.

          ⚠ **It is not the `<h1>`, and that is a change of mind within the hour.**
          The name used to be, on the argument that the identity is the heading — so
          the handle inherited it. But the People list sits above this block and
          carries an `<h2>`, and this block is pinned to the foot by `mt-auto`, so it
          can never come first in the document. The outline read *h2 then h1*, which
          is an outline defect, and it was one this session introduced by adding the
          People section above an identity block that had always been the only thing
          on the page.

          The page's `<h1>` is `sr-only` in `app/(app)/profile/page.tsx`, where it
          can precede the `<h2>`. Fixing the order was the option that did not
          require unpinning this from the corner it is deliberately in.

          Sans, not mono: a displayed handle is a name, not data (§11).
        */}
        <span className="text-muted text-sm">@{handle}</span>

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
