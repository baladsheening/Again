import { AskThem } from './ask-them'
import type { PortalLineView } from '@/app/actions/portal'

/**
 * **What you can act on, at the top of the front page — 12 September.**
 *
 * ⚠⚠ **`product-truth.md`: *a convergence has to produce an OPPORTUNITY, not a
 * notification.*** Until 12 September the one thing that makes this app
 * different from Notes lived behind a 26px glyph in the foot, two navigations
 * from the screen people open most, while 572px above it was black. **This is
 * that thing, on that screen.**
 *
 * ─────────────────────────────────────────────────────────────────────────────
 *  The line is the whole row — 13 September, directed
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * *Get rid of `[name] too. Message [name]` and have `Message [name]` optically
 * in-line with the entry that was matched, and have `Matches!` above the
 * match(es).*
 *
 * ⚠⚠ **THE SENTENCE WENT BECAUSE THE CONTROL ATE IT.** This file argued for a
 * sentence under every line — *the sentence is the only thing on this band that
 * the record below does not already say* — and that was true while the control
 * read `Ask them`. **It stopped being true the moment the label started naming
 * people**: *Omari too. Message Omari* says one name twice in eleven
 * characters, which is density rule 2 at its most literal. One of the two had
 * to go, and the one that survives is the one you can press.
 *
 * ⚠⚠ **WHAT THAT COSTS, AND THE CONDITION UNDER WHICH IT BECOMES A BUG.**
 * `portalSentence` writes seven registers, not one: *Sam too.*, *Sam wants
 * to.*, *Sam has.*, *Sam has one.* **A bare name cannot tell those apart**, so
 * this row now silently assumes every convergence is the plain kind. **It is,
 * today** — `lend` and `guide` both need a non-null intention and nothing has
 * written one since 22 August. ⚠ **The day either becomes reachable, this
 * band is wrong rather than terse**, and the fix is the sentence coming back
 * for those kinds alone. The portal and the console still say it in full, which
 * is the surface that keeps the distinction alive in the meantime.
 *
 * ⚠ **In the row, not under it, and `page-row` is what makes that free.** It is
 * already `display: flex; align-items: center`, and `tap-target` expands a
 * control with an absolutely-positioned `::after` rather than with height — so
 * the control takes its 44px of thumb without moving the row off 34px.
 * **Design rule 3 survives by construction**: measured the same as a record
 * line, which is the line directly beneath it.
 *
 * ⚠ **`Matches!` REVERSES THIS FILE'S OWN NO-HEADING RULE, AND THE PRECONDITION
 * IS WHAT EXPIRED.** It read: *no count, no heading — density rule 2 forbids a
 * heading over a list that reads as one.* **A list reads as one when its rows
 * explain themselves**, and these rows did, in the sentence that has just gone.
 * Without it the band is a run of captures that look exactly like the record
 * below them, parted by air alone. **Removing the sentence is what earned the
 * heading**; they are one change, not two.
 *
 * ⚠ **`stamp` — the loudest thing this type scale has, and it is spent
 * deliberately.** `TODAY` was deleted from this screen the day before on the
 * grounds that it was *the loudest thing the record's type scale has, spent on
 * the least informative line on the screen*. That argument is about **what it
 * was spent on**, not about the utility: this heading is the one thing here
 * that the record cannot say, so it is the informative case the rule was
 * holding the volume for.
 *
 * ⚠⚠ **`sheen` REPLACES `text-muted` — 13 September, directed:** *give
 * `Matches!` a colour or an effect like a glistening effect that pulls people
 * to it.* **The colour is `--color-accent` and no rule bent for it**: §11 gives
 * that token to overlap *state* and nothing else, and this heading IS overlap
 * state — the word over the list of convergences, naming what the mark in the
 * gutter draws. ⚠ **The sheen is a gradient clipped to the letterforms, never a
 * glow behind them**, which is the distinction the 12 September deletion of the
 * mark's lobes turns on. See the utility in `globals.css`; it stops dead under
 * `prefers-reduced-motion`, which the global block does not cover because an
 * animation is not a transition.
 *
 * ⚠ **The word is `Matches!` in the DOM and the capitals are CSS** —
 * `wordmark`'s rule, and the week's most expensive lesson: `innerText` returns
 * the shouting where `textContent` returns the word. **Do not write it
 * uppercase in the source.**
 *
 * ─────────────────────────────────────────────────────────────────────────────
 *  What is NOT here yet
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * ⚠⚠ **THE SAME DIRECTION ASKED FOR A HORIZONTALLY SCROLLABLE ROW OF
 * RESOLUTIONS UNDER EACH MATCH** — *availability dates/ranges, images/thumbnails
 * of clips that can be watched like trailers, or whatever would help the friends
 * organise the day out.* **It is not built, and the reason is data rather than
 * design.**
 *
 * ⚠⚠ **IT IS A WAY OF EXPANDING THE EXPERIENCE, NOT A LISTING — clarified the
 * same day:** *if it's a real world experience between friends, the row
 * populates with items that may be different to matches between strangers on a
 * mere thought, as opposed to a listing/record of a movie of interest.* **So
 * its contents vary along two axes at once** — what the thing is, and what the
 * relationship is — and that is the whole difficulty rather than a detail.
 *
 * ⚠⚠ **AND THAT IS A SLOT SOLVED AS A TAXONOMY, WHICH THIS REPOSITORY HAS A
 * TOMBSTONE FOR.** `possibilities.qualifier` exists precisely because the
 * front-page brief derived one line from `kind` — year for a film, author for a
 * paper, locality for a place — and the answer was **one field, written where
 * the row is ingested by whoever knows what it means, and the surface prints
 * it.** The same answer applies here and it is the only one that scales:
 * **this component must branch on NOTHING.** It renders a list of items each
 * carrying its own words, its own optional image and its own action; the
 * difference between *a trailer*, *three Saturdays in October* and *a workshop
 * four streets away* is decided at ingest, never in a `switch` on the screen.
 * ⚠ **The day this file reads `kind` to decide what to draw, the taxonomy has
 * won and the fourth kind is a rewrite.**
 *
 * ⚠ **The strangers half is PHASE 6 and is gated behind the whole safety
 * surface** — adult eligibility, two-sided reveal, block, report, unmatch and
 * moderation. It is not a variation on this row; it is a different product
 * decision that happens to reuse it.
 *
 * ⚠ **It is NOT the rail Amendment 10 banned, and that is worth stating before
 * somebody refuses it on sight.** The exclusion names *a global or random browse
 * rail, image-only tiles, and the opening count*, and permits discovery back the
 * moment every item carries *a bounded, sourced, actionably explained reason*.
 * A row scoped to one capture that two named people both wrote is bounded and
 * explained by construction — it is the case the exclusion was holding the door
 * open for, not the one it shut.
 *
 * ⚠⚠ **WHAT IT NEEDS: availability is `offers` and `occurrences`, which is
 * PHASE 5; a thumbnail or a trailer needs a resolved possibility, and almost
 * nothing resolves, which is PHASE 4.** Today `possibility_id` is null on very
 * nearly every capture — *learn to sail* and *mememe* resolve to nothing — so
 * the row would be empty for essentially every convergence on the screen, and
 * **an empty rail draws NOTHING, not a message and not a skeleton.** Building
 * the shell now is building a component with no reachable populated state.
 * **Named, costed, not taken** — and it is the first concrete product argument
 * for the emergent catalogue.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 *  Unchanged
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * ⚠⚠ **THE ROW DOES NOT OPEN A CONSOLE, AND THAT IS NOT AN OMISSION.** *A
 * console only exists where the record is* — `foot.tsx`'s own words, and the
 * reason the portal's door on this screen navigates to `/record?portal=1`
 * rather than opening a box it cannot fill.
 *
 * ⚠ **NOTHING IS MARKED READ BY BEING SEEN HERE.** `listMyPortal` reads;
 * `readPortalLine` empties, and only the portal calls it. So this band is the
 * unread queue — self-bounding, and it does not steal the portal's own
 * emptying.
 *
 * ⚠ **No count, and nothing at all when the list is empty** — §5 forbids the
 * portal a number, and §6's *silence stays silent* forbids explaining an
 * absence. **On the ordinary day this component renders nothing and the record
 * starts at the top of the page.**
 *
 * ⚠ **Requests are deliberately NOT here.** `Accept` and `Decline` act on a
 * relationship rather than on a line, they are the one notification
 * `lib/overlap.ts` does not write, and answering somebody is a considered act
 * that belongs behind the door.
 */
export function Opportunity({ lines }: { lines: readonly PortalLineView[] }) {
  if (lines.length === 0) return null

  return (
    /*
      ⚠⚠ **SEPARATED FROM THE RECORD BY AIR — 12 September, directed**, after
      the band and the record were reported as running together.

      ⚠⚠ **NO BOX AT ALL, AND IT TOOK TWO WRONG ONES TO GET HERE.** It shipped
      first as `--color-surface` — reported in one word, *grey* — which was
      precisely **the console's DESK branch on a phone**. Then as a
      `border-rule` outline, and that was reported too.

      ⚠⚠ **THE REAL FAULT WAS THE SHAPE, NOT THE FILL. THIS APP HAS NO STATIC
      BOXES.** §11: *matte black, legible text, known icons. Text-first. **Type
      is the entire design.*** Every box in it is a surface that **floats over
      the record** for a moment. **A bordered rectangle sitting in the flow is
      the one thing on the page that is chrome for its own sake**, and it read
      as a settings panel in an app whose identity is the absence of one.

      ⚠ **The heading is what parts the two lists now, where the per-row
      sentence used to.** `--page-lead` × 1.6 below still, because the gap has
      to read as a boundary rather than as the next row's breathing.

      ⚠ **It scrolls away with the record rather than pinning**, because the
      portal is *arrival*: it is read once and moved past.
    */
    <section className="mb-[calc(var(--page-lead)*1.6)]">
      {/*
        ⚠ **A real heading, tied to the list by `aria-labelledby`.** The band is
        a landmark now rather than a loose run of rows, and a screen reader that
        meets the list first should be told what the list is — the one thing the
        rows no longer say for themselves.
      */}
      <h2 id="matches-heading" className="stamp sheen mb-1.5">
        Matches!
      </h2>
      <ol aria-labelledby="matches-heading" className="flex flex-col">
        {lines.map((line) => (
          <li key={line.id}>
            {/*
              ⚠ **The same `page-row` box as the record**, so a line is the same
              height, the same type and the same 44px target in both places —
              design rule 3, and `portal.tsx`'s own note.

              ⚠ **`truncate` on the words and `shrink-0` on the control**, which
              is the console's arrangement for `Lock`: the control keeps its
              whole word and the capture is the half that gives up width. A
              control that truncated would be *Message Om…*, which is the one
              thing on the row that cannot be guessed from context.
            */}
            <div className="page-row">
              <span className="min-w-0 flex-1 truncate">{line.text}</span>
              <AskThem text={line.text} names={line.names} chip />
            </div>
          </li>
        ))}
      </ol>
    </section>
  )
}
