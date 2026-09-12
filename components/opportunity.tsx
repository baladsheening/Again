import { AskThem } from './ask-them'
import type { PortalLineView } from '@/app/actions/portal'

/**
 * **What you can act on, at the top of the front page — 12 September.**
 *
 * ⚠⚠ **`product-truth.md`: *a convergence has to produce an OPPORTUNITY, not a
 * notification.*** Until today the one thing that makes this app different from
 * Notes lived behind a 26px glyph in the foot, two navigations from the screen
 * people open most, while 572px above it was black. **This is that thing, on
 * that screen.**
 *
 * ⚠ **It is the portal's row and the portal's sentence, not a third drawing of
 * a convergence.** `page-row` for the line — the same box, the same height, the
 * same type as the record below it — and `portalSentence`'s own words under it
 * with `AskThem` riding them, which is the portal's arrangement exactly. **A
 * home band that looked like a notification would be a second way of drawing a
 * capture**, which is what `portal.tsx` already refuses.
 *
 * ⚠⚠ **THE ROW DOES NOT OPEN A CONSOLE, AND THAT IS NOT AN OMISSION.** *A
 * console only exists where the record is* — `foot.tsx`'s own words, and the
 * reason the portal's door on this screen navigates to `/record?portal=1`
 * rather than opening a box it cannot fill. So the line is a line, the sentence
 * says who, and the way out is `Ask them`, which is the whole point and needs
 * no console. **The door in the foot is still the way to the portal proper**,
 * where a row opens, empties, and where requests are answered.
 *
 * ⚠ **NOTHING IS MARKED READ BY BEING SEEN HERE.** `listMyPortal` reads;
 * `readPortalLine` empties, and only the portal calls it. So this band is the
 * unread queue — self-bounding, and it does not steal the portal's own
 * emptying.
 *
 * ⚠ **No count, no heading, and nothing at all when the list is empty** — §5
 * forbids the portal a number, §6's *silence stays silent* forbids explaining
 * an absence, and density rule 2 forbids a heading over a list that reads as
 * one. **On the ordinary day this component renders nothing and the record
 * starts at the top of the page.**
 *
 * ⚠ **Requests are deliberately NOT here.** `Accept` and `Decline` act on a
 * relationship rather than on a line, they are the one notification
 * `lib/overlap.ts` does not write, and answering somebody is a considered act
 * that belongs behind the door. **The door's `aria-label` already says which
 * of the two is waiting.**
 */
export function Opportunity({ lines }: { lines: readonly PortalLineView[] }) {
  if (lines.length === 0) return null

  return (
    /*
      ⚠⚠ **SEPARATED FROM THE RECORD BY AIR — 12 September, directed**, after
      the band and the record were reported as running together. They did: a
      convergence line and a record line are the same type at the same size, and
      the only thing parting them was `TODAY` in tracked mono — **which has since
      gone too**, because a day stamp is the archive's furniture and home is not
      the archive. See `PageLines`' `stamps` prop.

      ⚠⚠ **NO BOX AT ALL, AND IT TOOK TWO WRONG ONES TO GET HERE.** It shipped
      first as `--color-surface` — reported in one word, *grey* — which was
      precisely **the console's DESK branch on a phone**: `console-card` is
      `--glass-tint` over `blur(--glass-blur)` on a handset, measured
      `rgba(0,0,0,0.38)` and `blur(18px)`, and `--color-surface` only arrives
      above `--breakpoint-stack`. Then as a `border-rule` outline, and that was
      reported too.

      ⚠⚠ **THE REAL FAULT WAS THE SHAPE, NOT THE FILL. THIS APP HAS NO STATIC
      BOXES.** §11: *matte black, legible text, known icons. Text-first. **Type
      is the entire design.*** Every box in it is a surface that **floats over
      the record** and exists for a moment — the console, the portal, the
      composer's own card, which is a box because you type into it. **A bordered
      rectangle sitting in the flow is the one thing on the page that is chrome
      for its own sake**, and it read as a settings panel in an app whose
      identity is the absence of one.

      ⚠ **So the separation is air, and the band separates itself
      typographically anyway:** every row here carries a muted sentence under it
      and no row of the record does. That is a bigger difference than a rule, and
      it costs nothing. **`--page-lead` × 1.6 below the last sentence** — more
      than the lead above the band, because the gap has to read as a boundary
      rather than as the next row's breathing.

      ⚠ **Glass was never available here and that has not changed**: this block
      is in flow with nothing behind it but the page, and 38% black over black is
      black. **The question was only ever how to part two lists, and the answer
      turned out not to be a container.**

      ⚠ **It scrolls away with the record rather than pinning**, because the
      portal is *arrival*: it is read once and moved past. A pinned band would
      spend the top of every screen on something already seen.
    */
    <ol className="mb-[calc(var(--page-lead)*1.6)] flex flex-col">
      {lines.map((line) => (
        <li key={line.id}>
          {/*
            ⚠ **The same `page-row` box as the record**, so a line is the same
            height, the same type and the same 44px target in both places —
            design rule 3, and `portal.tsx`'s own note.
          */}
          <div className="page-row">
            <span className="min-w-0 flex-1 truncate">{line.text}</span>
          </div>
          {/*
            ⚠ **The sentence is under the line, not beside it.** Beside it the
            two would compete for the one line's width and the sentence would be
            the first thing an ellipsis ate — and the sentence is the only thing
            on this band that the record below does not already say.
          */}
          {/*
            ⚠ **`last:mb-0`, or the card is lopsided.** The gap under each
            sentence is the gap to the NEXT line; on the last one it lands inside
            the card's own padding and reads as 30px at the foot against 20 at
            the head. **The margin is between rows, so the last row has none.**
          */}
          <p className="text-muted mb-2.5 text-[0.8125rem] last:mb-0">
            {line.sentence}
            <AskThem text={line.text} />
          </p>
        </li>
      ))}
    </ol>
  )
}
