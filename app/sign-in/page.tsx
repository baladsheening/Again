import { redirect } from 'next/navigation'

import { SignInForm } from '@/components/sign-in-form'
import { getSessionUser } from '@/lib/db'

export default async function SignInPage() {
  if (await getSessionUser()) redirect('/')

  // `max-w-sm` at every width, matching /onboarding and /reset-password. The
  // container used to widen to 42.5rem at 560px, where the form went inline and
  // needed the room to divide up; the form is stacked now, and a stacked form in
  // 680px is a column of very wide, very short boxes.
  return (
    <main
      // The top padding carries the *bottom* safe-area inset on purpose, and it
      // is not a typo. `safe-bottom` adds that inset below for clearance, which
      // is right, but this element's padding is also what `my-auto` centres
      // inside — so an inset on one side only moves the content up by half of it,
      // and the more home indicator a device has, the higher the form floats.
      // Mirroring the inset on top keeps the centring box symmetric on every
      // device. It replaces `py-12`, whose only remaining job was this 3rem top;
      // one declaration per edge now, and no override to reason about.
      //
      // The `3rem` base matches /onboarding and /reset-password. It was briefly
      // 4rem, to lift the fields to the midline; the extra rem worked on a laptop
      // and overshot on any phone with an indicator, because it was correcting a
      // fixed imbalance with a device-variable property. The correction moved to
      // the block below, where it belongs.
      //
      // ⚠ An arbitrary *property* class rather than the `style` attribute this
      // was, and that is not cosmetic: the CSP in proxy.ts allows no inline style
      // attributes, so this declaration was being dropped in production and
      // nowhere else. See the note on `wordmark-trim` in globals.css.
      className="gutter safe-bottom mx-auto flex w-full max-w-sm flex-1 flex-col [--safe-bottom-base:3rem] pt-[calc(3rem+env(safe-area-inset-bottom))]"
    >
      {/*
        `my-auto`, not `justify-center` on the parent. When a phone keyboard
        takes half a landscape viewport the content is taller than the container,
        and centred flex content then overflows in *both* directions — the top
        goes above the scroll origin and cannot be reached. Auto margins collapse
        to zero when there is no free space, so this degrades to top-aligned and
        stays scrollable.
      */}
      {/*
        Optical centring, not spacing — nothing renders in this padding. `my-auto`
        centres the whole block (mark, tagline, fields, button, switches), but the
        thing that should look centred is the field pair, and the block is not
        symmetric about it. Padding the light side makes it symmetric, which moves
        the pair by half of what you add.

        **The correction changes side with the pointer**, which is why there are
        two classes rather than one with an override:

          mouse  100px above the pair, 94px below  → 6px short  → pad bottom 6
          touch  100px above the pair, 104px below → 4px over   → pad top 4

        Touch is heavier below because `control-box` grows the fields and the
        button to 48px there while the header and the 12px switches do not move.
        Both numbers are the difference itself, derived from the control heights
        and gaps in `components/sign-in-form.tsx` — the switches' `mt-4` is inside
        the 94/104, so it counted twice when it was added. Neither depends on the
        safe-area inset, unlike the `--safe-bottom-base` lever this replaced, so
        both hold on any screen. A device that reports neither pointer gets no
        correction and is 3px low, which is the right way to fail.
      */}
      <div className="my-auto flex w-full flex-col gap-7 pointer-coarse:pt-1 pointer-fine:pb-[6px]">
        {/*
          `text-start`, not `text-left`: the mark and tagline hang off the same
          edge as the first input, and which edge that is follows the writing
          direction rather than being pinned to the left. Nothing else in here
          uses a physical direction, so this stays correct under `dir="rtl"`.
        */}
        {/*
          **14px of visible air, expressed as what it is** (15 August).

          The h1's box is `--text-wordmark` tall (`wordmark` sets `line-height:
          1`), but the ink inside it is not centred — the baseline sits low, and
          with a descender-less mark the ink stops short of the bottom of the box
          by `--wordmark-slack`. So the gap the eye sees is the box gap plus that
          slack, and the box gap has to be the difference.

          With `again` the `g` hung 2px *below* its box and a 16px `gap-4` read as
          14. `need` has no descender, so the same `gap-4` read as 21 and the
          tagline visibly drifted off the mark; it was briefly the literal 9px,
          which is the number this page also carried for the few hours the mark
          was in caps on 10 August, for exactly the same reason.

          It is not a literal now, because the type size changed the same day and
          9px stopped being right. 14 is the design constant; the slack is
          measured and scales with the mark.

          ⚠ **This is a consequence of the mark's *word*, not its size or case.**
          A word with a descender changes `--wordmark-slack`, `wordmark-trim` and
          the masthead row together — the table on `wordmark-trim` has both sets
          of measurements, and says to re-measure rather than reason.
        */}
        <div className="flex flex-col gap-[calc(14px_-_var(--wordmark-slack))] text-start">
          <h1 className="wordmark text-wordmark">Need</h1>
          {/*
            Holding this on one line is what set the stacked container to
            `max-w-sm`. It had been `max-w-xs`, which leaves 280px after the
            gutter — narrower than the sentence, and narrower than any phone
            made in years. Shrinking the type to fit 280px was the wrong lever;
            the container was the thing that was wrong.
          */}
          <p className="text-muted text-sm">Things to try. Things to do again.</p>
        </div>

        <SignInForm />
      </div>
    </main>
  )
}
