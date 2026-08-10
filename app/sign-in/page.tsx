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
      className="gutter safe-bottom mx-auto flex w-full max-w-sm flex-1 flex-col pt-[calc(3rem+env(safe-area-inset-bottom))]"
      // 3rem, matching /onboarding and /reset-password. This was briefly 4rem, to
      // lift the fields to the midline; the extra rem worked on a laptop and
      // overshot on any phone with an indicator, because it was correcting a
      // fixed imbalance with a device-variable property. The correction moved to
      // the block below, where it belongs.
      style={{ '--safe-bottom-base': '3rem' } as React.CSSProperties}
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
          `gap-4`, and it is worth knowing why it briefly was not (10 August).

          The h1's box is 36px (`wordmark` sets `line-height: 1`), but the ink
          inside it is not centred: the baseline lands 30px down, so the mark's
          `g` hangs 2px *below* its own box. The gap the eye sees is the box gap
          plus that overhang — 14px of visible air from a 16px `gap-4`.

          While the mark was in caps it had no descender, the ink stopped 5px
          *above* the box, and the same `gap-4` read as 21px — the tagline
          visibly drifting off the mark. It was cut to 9px for those few hours
          and is back now that the `g` is.

          ⚠ **This gap is a consequence of the mark's case**, which is set by
          one `text-transform` in globals.css. If the case changes again, this
          number and the header trims in `components/shell.tsx` change with it.
        */}
        <div className="flex flex-col gap-4 text-start">
          <h1 className="wordmark text-wordmark">Again</h1>
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
