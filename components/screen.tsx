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
 * ⚠ **The minimum height's stated job is spent — 2 September.** It was here so
 * `/profile` could pin its identity block to the foot with `mt-auto`, and that
 * block is deleted: the profile is three things down a column now, with nothing
 * pinned. It is kept because a short route still wants a full column under the
 * bar rather than a stub of one, **but nothing depends on it any more** — if it
 * ever gets in the way, it goes, and no layout has to be kept in step with it.
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
      <main className="gutter mx-auto flex min-h-[calc(100svh_+_env(safe-area-inset-top))] w-full max-w-[var(--page-measure)] flex-col pt-[calc(var(--bar-height)+1.25rem)] pb-16">
        {children}
      </main>
    </>
  )
}
