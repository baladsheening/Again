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

        **Both corrections are on the bottom since 16 August**, when the tagline
        became two lines and the header grew 20px:

          mouse  113.76px above the pair, 94px below  → 19.76 → pad bottom 20
          touch  113.76px above the pair, 104px below →  9.76 → pad bottom 10

        Touch is lighter because `control-box` grows the fields and the button to
        48px there, which adds 10px below the pair while the header and the 12px
        switches do not move. Both numbers are the difference itself, and both are
        **measured in a browser rather than derived** — the .76 is the mark's ink
        and is rounded away deliberately.

        ⚠ **The touch number changed side, not just size.** It was `pt-1` — 4px on
        top, because the block used to be heavier *below* on a coarse pointer. One
        line of tagline was enough to reverse that, which is the argument for
        measuring these rather than adjusting them.

        Neither depends on the safe-area inset, unlike the `--safe-bottom-base`
        lever this replaced, so both hold on any screen. A device that reports
        neither pointer gets no correction and sits about 10px low, which is the
        right way to fail.
      */}
      <div className="my-auto flex w-full flex-col gap-7 pointer-coarse:pb-[10px] pointer-fine:pb-[20px]">
        {/*
          `text-start`, not `text-left`: the mark and tagline hang off the same
          edge as the first input, and which edge that is follows the writing
          direction rather than being pinned to the left. Nothing else in here
          uses a physical direction, so this stays correct under `dir="rtl"`.
        */}
        {/*
          **14px of visible air, expressed as what it is** (15 August).

          The h1's box is `--text-wordmark` tall (`wordmark` sets `line-height:
          1`), but the ink inside it is not centred on that box — so the gap the
          eye sees is the box gap plus wherever the ink actually stops, which is
          `--wordmark-slack`. The box gap is the difference, and 14 is the design
          constant.

          ⚠ **The slack is negative for this mark**, because Ojuju hangs `Again`'s
          `g` below the box rather than stopping short of it — so this subtraction
          makes the gap *bigger*, not smaller, and lands at about 17.8px of box
          for 14px of visible air. Do not "simplify" the minus sign away; it is
          what lets one expression serve both kinds of face without a branch.

          It has been three literals — `gap-4`, then 9px when the mark had no
          descender, then wrong again when the type size changed hours later.
          None of them are the number now; the measurement is.

          ⚠ **This follows the mark's *word* and *face*, not its size or case.**
          Either changes `--wordmark-slack`, `wordmark-trim` and the masthead row
          together — the table on `wordmark-trim` has the measurements and says to
          re-measure rather than reason.
        */}
        <div className="flex flex-col gap-[calc(14px_-_var(--wordmark-slack))] text-start">
          <h1 className="wordmark text-wordmark">Again</h1>
          {/*
            Holding a line of this on one line is what set the stacked container
            to `max-w-sm`. It had been `max-w-xs`, which leaves 280px after the
            gutter — narrower than the sentence, and narrower than any phone made
            in years. Shrinking the type to fit 280px was the wrong lever; the
            container was the thing that was wrong.

            **Two lines since 16 August**, and they are one block rather than two
            children of the header: the gap above is the mark-to-tagline distance
            and is far too much between two lines that restate each other. Sitting
            them in their own wrapper with no gap gives them the leading of a
            wrapped paragraph, which is what they are.

            ⚠ **The second line is the longer one now** — 43 characters against
            35 — so it is what the container's width has to hold. Measured at
            320px, the tightest screen this app targets: it still sets on one
            line, with the container at 280px after the gutter. It is the line to
            check against if this copy is ever rewritten longer, and a wrap would
            put the form a further 10px low.

            ⚠ **Adding this line moved both correction numbers above**, because it
            grew the block over the field pair by 20px — and it reversed the sign
            of one of them. They are measured, not reasoned.
          */}
          <div>
            <p className="text-muted text-sm">things to try. things to try again.</p>
            <p className="text-muted text-sm">the things i want. the things i’d buy again.</p>
          </div>
        </div>

        <SignInForm />
      </div>
    </main>
  )
}
