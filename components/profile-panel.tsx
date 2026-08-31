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

        **No gap between the two lines below `rail`, and the handle is
        `leading-none`.** The sign-out row carries `--collections-row` of height and
        centres inside it, so the air below the handle is already inside that box:
        the ink gap comes to 14px, down from 21 when the handle had a 20px line box
        and the column a `gap-1` on top of it. Asked for as *a bit closer*, and this
        is the version that gets there without moving *Sign out* off the
        collections' line.

        There is no `rail:` variant on any of the spacing here, and there must not
        be one: it is the same block at every width, which is the whole of what
        was wrong when it was not.
      */}
      <div className="bg-bg gutter fixed inset-x-0 bottom-0 z-20 flex flex-col items-start pb-[var(--collections-inset)]">
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
