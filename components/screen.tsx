import { Bar } from './bar'

/**
 * The frame for every route that is not the page: the bar, and a column under
 * it.
 *
 * ⚠ **The page does not use this**, and the reason is the undo. `PageScreen`
 * renders its own `<Bar>` with a live undo glyph and its own `<Foot>`, because
 * both act on state it owns; a frame that wrapped it would have to reach up for
 * that through a context whose only subscriber is the thing publishing to it.
 * Here there is nothing to reach for — nothing on these routes creates a
 * capture, so the undo is dark and the foot's four tools have no line to act on
 * and are absent rather than off.
 *
 * The measure and the top clearance are the page's, deliberately: `/settled`,
 * `/profile` and somebody else's page are the same column of text at a different
 * moment, and a second set of numbers would be a second thing to keep true.
 *
 * ⚠⚠ **THE MINIMUM HEIGHT IS `svh`, AND THE `+ env(safe-area-inset-top)` IT
 * CARRIED FOR A FORTNIGHT WAS A NOTCH-SIZED BUG — measured 2 September.** The
 * column was a viewport **plus** the top inset, so on a notched handset every
 * route using this frame was 891px of column in an 844px window: the document
 * scrolled on pages that fit, and `/profile`'s last element landed **17px above
 * the fold** where it should have had the frame's own 64px of foot air. At a 0px
 * inset — a browser, an Android, the desk — both expressions compute the same
 * thing, **which is why it survived every measurement taken on this machine**.
 * Same shape as the `--sheet-clearance` bug: right by construction everywhere
 * except the one surface the app is installed on.
 *
 * ⚠ **The inset was never needed here.** The bar is fixed and overlaps this
 * column; what clears it is the `pt`, which reads `--bar-height` and has the
 * inset inside it already. Adding it a second time to the *height* only made the
 * box taller than the screen. **Do not put it back**: if a route ever needs to
 * reach under the status bar, that is a job for the thing that paints there —
 * `grain-ground`, which bleeds a quarter of the viewport past both edges.
 *
 * ⚠ **What the minimum height is still for:** a short route wants a full column
 * under the bar rather than a stub of one, and `/profile` puts its last element
 * at the end of that column with `mt-auto`. **In flow, not pinned** — a long
 * People list pushes it off the screen like any other content, which is the
 * difference between this and the fixed bar it replaced.
 *
 * ⚠ **`pb-16` was a RESERVATION and is now just the column's foot air.** It
 * kept a long People list off the fixed block that used to cross the bottom of
 * `/profile`. There is nothing down there to clear on any route, so what it does
 * now is stop the last line sitting on the edge of the glass.
 */
export function Screen({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Bar />
      <main className="gutter mx-auto flex min-h-svh w-full max-w-[var(--page-measure)] flex-col pt-[calc(var(--bar-height)+1.25rem)] pb-16">
        {children}
      </main>
    </>
  )
}
