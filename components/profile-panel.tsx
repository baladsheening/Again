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
    // `flex-1` no longer pushes anything: the block below is out of the flow and
    // `mt-auto` went with the in-flow version. It stays so `main`'s column still
    // has something filling it on a screen whose only in-flow content is the
    // People pill.
    <div className="flex flex-1 flex-col">
      {/*
        ⚠ **Fixed below `rail`, so identity does not scroll away.** Every other
        screen keeps its collections at the foot whatever the page does; this one
        had its handle and sign-out sitting in the flow, so they slid up with a long
        People list and the foot of the screen emptied. Now the two edges of
        `/profile` both hold still — the masthead cannot recede here (see
        `mastheadHidden` in `components/shell.tsx`) and this cannot travel.

        `bg-bg`, because content now scrolls underneath it and has to stop cleanly
        at its edge rather than showing through. No rule along the top, matching the
        foot bar and the masthead: the ground does the separating.

        `gutter` is on this element because when fixed it spans the viewport and
        nothing else supplies its inset.

        ⚠ **`rail:hidden`, and that is a deletion rather than a second layout.**
        Above the breakpoint the rail already carries `@handle` and *Sign out* in
        its own bottom-left corner, fixed and unscrollable — so this block was a
        duplicate of it, sitting a few inches to the right and scrolling with the
        page. Measured: at 1440×600 it travelled 184px while the rail's copy held
        still.

        The alternative was giving it the fixed-over-the-content-column recipe the
        foot bar uses at rail widths (`left-[calc(max(0px,50%_-_36rem)_+_17rem)]`
        and the rest of that row in docs/plan.md). That would have been a second
        set of coupled numbers to hold a second copy of something already on
        screen. Removing the duplicate answers the same requirement and cannot be
        wrong on a width nobody measured.

        `main` reserves the height through `--profile-foot`; see `foot-bare` in
        globals.css. Nothing here is allowed to be the only thing that knows how
        tall this is.

        **No gap between the two lines below `rail`, and the handle is
        `leading-none`.** The sign-out row carries `--collections-row` of height and
        centres inside it, so the air below the handle is already inside that box:
        the ink gap comes to 14px, down from 21 when the handle had a 20px line box
        and the column a `gap-1` on top of it. Asked for as *a bit closer*, and this
        is the version that gets there without moving *Sign out* off the
        collections' line.

        There is no `rail:` variant on any of the spacing here, and there does not
        need to be: this whole block only exists below the breakpoint now.
      */}
      <div className="bg-bg gutter rail:hidden fixed inset-x-0 bottom-0 z-20 flex flex-col items-start pb-[var(--collections-inset)]">
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
          `rail:min-h-0` was here to stop this phone measurement surviving the
          breakpoint. It is gone with the variant it guarded: the block does not
          render above `rail` at all now, so there is no width at which this row's
          42px is the wrong height.
        */}
        {/*
          ⚠ **A pill, directed 18 August, and squared to the People pill on the
          same day.** It briefly wore `-ml-3`, which put its box outside the
          gutter so its words stayed on the gutter line. That was answered: the
          two pills on this screen should share an edge, so this one starts at
          the gutter like People's does and carries the same 16px of padding, and
          the handle below takes that 16 as an indent rather than this taking a
          bleed. **The alignment is now the box AND the ink**, where it used to be
          only the ink.

          `bg-surface/40` is the People pill's fill, and the same argument: full
          strength reads as grey furniture, this reads as a shape the word sits
          in. ⚠ Neither has been seen on OLED, where a 1.09:1 ground may come to
          nothing at all — if it does, the ladder is in globals.css and both
          should move together rather than this one alone.

          Its corners are 10px against the People pill's 16: a radius is read
          against the box it turns, and 16 on something this short would close the
          ends into a lozenge.

          ⚠ **`py-2` is a term in `--profile-foot`.** That reservation is what
          keeps the last person in a People list from ending up behind this block,
          and it cannot read a class from here.
        */}
        <button
          type="button"
          onClick={async () => {
            await authClient.signOut()
            router.push('/sign-in')
            router.refresh()
          }}
          className="text-muted hover:text-text bg-surface/40 hover:bg-surface/60 micro tap-target cursor-pointer rounded-[10px] px-4 py-2 transition-colors"
        >
          Sign out
        </button>

        {/*
          ⚠ **The handle moved BELOW *Sign out* on 18 August**, and the row it now
          sits in is the one *Sign out* used to hold. The rule that row exists for
          is *whatever is last lands on the line the collections vacate* — it was
          never about which of the two it was. `--profile-foot` in globals.css is
          written as the new stack.

          ⚠ **`pl-4` is the pill's own padding, so the two lines share a left
          edge.** Asked for as *indented by the same amount* — the pill's box
          starts at the gutter and its words 16px in, so the handle takes the same
          16 and both sets of ink land at x=36, which is also where the People
          pill's heading sits. Three things on one line rather than three lines
          each nearly aligned.
        */}
        <div className="flex min-h-[var(--collections-row)] items-center">
          <span className="text-muted pl-4 text-sm leading-none">@{handle}</span>
        </div>
      </div>
    </div>
  )
}
