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
    <ol className="flex flex-col">
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
          <p className="text-muted mb-2.5 text-[0.8125rem]">
            {line.sentence}
            <AskThem text={line.text} />
          </p>
        </li>
      ))}
    </ol>
  )
}
