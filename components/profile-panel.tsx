'use client'

import { useRouter } from 'next/navigation'

import { authClient } from '@/lib/auth-client'

/**
 * `/profile`: your handle, and the way out.
 *
 * ⚠ **It is the ONLY place `signOut` is called, at every width — 31 August.**
 * This file used to say it existed because the phone header had no room for a
 * handle and a *Sign out* button, and that above `rail` the rail carried both.
 * **Phase 1 deleted the rail** (`components/shell.tsx`, gone), and for a fortnight
 * this block was still hidden above 720px — so there was no way to sign out on a
 * desktop at all. Reported and fixed; see the note on the fixed block below.
 *
 * **Identity sits in the bottom-left corner** at every width. It is the reason
 * the page is otherwise empty rather than centred — a centred block would have
 * been a different composition that happened to contain the same words.
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
        ⚠ **Fixed, so identity does not scroll away.** It sat in the flow once,
        and slid up with a long People list until the foot of the screen emptied.
        The bar above holds still on this route and so does this.

        `bg-bg`, because content now scrolls underneath it and has to stop cleanly
        at its edge rather than showing through. No rule along the top, matching the
        foot bar and the masthead: the ground does the separating.

        `gutter` is on this element because when fixed it spans the viewport and
        nothing else supplies its inset.

        ⚠⚠ **`rail:hidden` WAS HERE AND IT MEANT THERE WAS NO WAY TO SIGN OUT ON
        A DESKTOP — reported and fixed 31 August.** The variant was correct when
        it was written: above `--breakpoint-rail` the rail in
        `components/shell.tsx` carried `@handle` and *Sign out* in its own
        bottom-left corner, so this block was a duplicate of it that scrolled
        while the rail's copy held still — measured at 184px of travel on a
        1440×600.

        ⚠ **Phase 1 deleted the rail and the correction stayed.** Nothing
        replaced it, `authClient.signOut()` is called from this file and nowhere
        else, and so at 720px and up the only way out of the account was gone.
        This is *How things get fixed* read backwards: **the condition went, so
        the correction had to go with it**, and it did not. The fix is the
        deletion of one variant — nothing was added, and no second layout exists
        for anybody to keep in step.

        ⚠ **It is fixed at the bottom of the window at every width now, which is
        what it always was below `rail`.** There is no bar on this route, so the
        corner is free; `gutter` supplies the inset the viewport does not; and
        `Screen`'s own `pb-16` is what keeps a long People list off it. **If this
        block ever grows past that reservation, the padding is the thing to
        derive rather than a number to raise.**

        ⚠ **`foot-bare` and `foot-collections` in globals.css are DELETED with
        this** — `Screen` never wore either, so both were orphans of the same
        deleted rail, describing a layout no route has had since Phase 1.

        ⚠⚠ **IT IS ONE ROW SINCE 1 SEPTEMBER — directed: put the handle in line
        with *Sign out*.** It was a column of two: the pill, then the handle on
        its own `--collections-row` beneath, with a `pl-4` matching the pill's
        padding so the two sets of ink shared a left edge.

        **The alignment argument is answered rather than abandoned.** It was
        *three things on one line rather than three lines each nearly aligned* —
        the People pill's heading, the pill's word and the handle all at x=36.
        Two of those are now literally on one line, so the handle needs no indent
        at all: it takes the gutter through the pill beside it.

        ⚠ **The gap is `gap-4`, which is the pill's own `px-4`.** The handle then
        stands the same distance off the pill's edge on the outside as the word
        does on the inside — one number, stated once, rather than a second
        spacing decision beside a control that already made one.

        ⚠⚠ **THE BAR IS TALLER AND ITS AIR IS EQUAL — 1 September, directed.**
        It was `--collections-row` of height with `--collections-inset` hung
        under it, and on a notched handset that reads exactly as reported: the
        pill sat 6px off the top of the block and **24px off the bottom**,
        because the clearance was all on one side. `--collections-row` no longer
        governs this block, and nothing else reads it.

        ⚠ **`max(--bar-air / 2, --collections-inset)`, spent as one `py`.** Two
        terms, both real:

        — **The air is the top bar's own, split evenly.** ⚠ **It was
          `(--bar-lead + --bar-tail) / 2` until 1 September**, when that pair
          collapsed into one `--bar-air` spent evenly at both ends of the page —
          this block had written the mean by hand, and the mean is now the token.
          13px, and the bar's own row is on the same centre line since.
        — **Floored by the home-indicator clearance**, so the bottom half can
          never come in under it. On a device with an inset the floor wins and
          the top half grows to match, which is what keeps the contents centred
          instead of buying the clearance on one side only.

        ⚠ **It is one expression and not a branch.** No device check, no
        display-mode query, no `rail:` variant: at a 0px inset the halved air
        wins and the bar is 56px, at 34px the clearance wins and it is 66 — and
        the pill is on the centre line of both. **Do not answer a tall bar by
        subtracting from one side**; that is the arrangement this replaced.

        There is no `rail:` variant on any of the spacing here, and there must not
        be one: it is the same block at every width, which is the whole of what
        was wrong when it was not.
      */}
      {/*
        ⚠⚠ **IT IS GLASS SINCE 2 SEPTEMBER, AND IT WAS THE LAST OPAQUE BAR IN
        THE APP.** `bg-bg` painted a solid black slab across the bottom of the
        one screen whose ground is a photograph — so the paper ran the height of
        the window and then stopped dead at this edge, while the top bar, the
        writing strip and the console all let it through. It takes
        `--glass-tint` over `--glass-blur`, the two bars' own glass, so there is
        no third treatment to keep in step. **Do not put `bg-bg` back**: it is
        the same mistake as the body's, in a smaller box — see the note on
        `grain-ground` in `app/layout.tsx`.

        ⚠ **`justify-between`, so the two sit at opposite gutters.** They were
        `gap-4` at the left with 270px of empty bar to the right of them, which
        is two things huddled in a corner rather than a bar. Spread, the block
        states the same structure the top bar does — **identity on the gutter,
        the control in the far corner** — and the handle takes the left edge the
        mark takes upstairs.

        ⚠ **The handle is FIRST in the document now**, which reverses the order
        of 18 August without reversing its argument. That order existed because
        the pill held the gutter and the handle was hung off it; with the two at
        opposite ends nothing is hung off anything, and the identity is what the
        screen is about. **`gap-4` stays as the floor** so the two can never
        touch on a narrow window or a long handle.
      */}
      <div className="gutter fixed inset-x-0 bottom-0 z-20 flex items-center justify-between gap-4 bg-[var(--glass-tint)] py-[max(calc(var(--bar-air)/2),var(--collections-inset))] backdrop-blur-[var(--glass-blur)]">
        {/*
          ⚠ **The display name was here and is gone (17 August).** It was set at
          `title` size as the page's heading, with the handle beside it — and the
          argument against it is simply that nobody needs telling their own name.
          It was showing you the one fact you already have.

          What it cost at the time was agreement with the rail, which carried
          `@handle` alone in the same corner. The rail is deleted; the handle
          standing alone is what survived it.

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
          ⚠ **`Sign out` stands on the line the collections bar used to hold.**
          Before that it sat wherever the content happened to end, so the foot of
          the screen jumped every time you opened your own profile.

          ⚠ **The collections bar itself is deleted** — it went with the four
          routes in Phase 1 — so `--collections-row` and `--collections-inset` are
          now this block's own geometry rather than an agreement with something
          else on screen. They are kept because the row's height and its inset
          still have to come from somewhere, and these are measured; **do not
          re-derive them from a bar that no longer exists.**
        */}
        {/*
          `rail:min-h-0` was here to stop a phone measurement surviving the
          breakpoint, and went when the block stopped rendering above it. **The
          block renders at every width again since 31 August and the variant has
          NOT come back**: 42px is a row of text and a thumb's target, and neither
          of those is a thing a wider window changes.
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

          ⚠ **This note said `py-2` was a term in `--profile-foot`, and that
          token is DELETED — 1 September.** Its only consumer was `foot-bare`,
          which Phase 1 deleted with the rail; it has been declared and read by
          nothing since, and a token nobody reads is a number the next person
          keeps in step with a layout for no reason. What actually keeps a long
          People list off this block is `Screen`'s own `pb-16`, which the
          docblock above already names. Same rule that took Jost.
        */}
        {/*
          ⚠ **The handle carries `--color-text` now, where it was `--color-muted`
          beside a muted pill.** Two muted things at opposite ends of a bar give
          it no subject; this screen's subject is who you are, and the way out is
          the quiet thing beside it. The pill keeps the muted ink and still comes
          up to full on hover, so **the control is the thing that changes and the
          identity is the thing that does not** — which is the same reading the
          record's rows get.

          Sans, not mono: a displayed handle is a name, not data (§11).
        */}
        <span className="text-text text-sm leading-none">@{handle}</span>

        {/*
          ⚠ **The handle moved BELOW *Sign out* on 18 August and BESIDE it on 1
          September** — directed both times, and the order has not changed: the
          pill is still first, still on the gutter, and it is the handle that
          moved to it.

          ⚠ **`pl-4` is gone with the stack it existed for.** It was the pill's
          own padding, borrowed so that a handle on its own line would start
          where the pill's word does. On the same line as the pill there is no
          second left edge to agree with, and an indent here would be 16px of
          air on top of the row's `gap-4` — the same 16 spent twice.

          ⚠ **The row's own `min-h` is gone too**, for the same reason: there is
          one row and the block above is it. Two boxes claiming the same height
          is how they drift apart — and the block's height is now its air plus
          the pill inside it, so there is no second number to claim.
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
      </div>
    </div>
  )
}
