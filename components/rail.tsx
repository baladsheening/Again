import Image from 'next/image'

import type { RailTile } from '@/lib/db'
import { posterUrl } from '@/lib/posters'

/**
 * **The browse half.** Amendment 7: the rail is the image and nothing else, and
 * a possibility without one never enters it.
 *
 * ⚠⚠ **A SERVER COMPONENT, HANDED INTO `ComposeScreen` AS A NODE.** That screen
 * is `'use client'` because the composer is, and this is pure markup with no
 * state — so it goes down as a prop rather than being pulled across the
 * boundary, which is the render-prop arrangement the portal already uses for
 * the console. **It adds nothing to the client bundle.**
 *
 * ⚠⚠ **THE TILES TOUCH AND THE RAIL IS AS TALL AS THE SPACE — directed 6
 * September, and the two are one answer.** *The images stuck to each other and
 * bigger; there's a big space between the rail and the top of the sheet the
 * composer lays on.* **A tile has no width of its own any more.** It is as tall
 * as whatever is left between the bar and the composer, and `aspect-2/3` makes
 * the width follow — so the gap closes because the picture grew into it, and
 * neither number is one anybody picked. ⚠ **`--tile-width` is deleted**: a
 * width tuned against one screen's gap is a gap again on the next.
 *
 * ⚠ **There is no tap yet.** §3 of the front-page brief has a tap opening the
 * possibility into an enlarged view with the words beneath it; that is the next
 * step and it is what makes this a `<button>`. Until then a tile is an image
 * and nothing else, because a control that does nothing is worse than no
 * control.
 */
export function Rail({ tiles }: { tiles: RailTile[] }) {
  /*
    ⚠ **An empty rail draws NOTHING — not a message, not a skeleton.** §6's
    *silence stays silent*, and Phase 5's *an area without source coverage does
    not render a misleading rail* said the same thing from the other end.
  */
  if (tiles.length === 0) return null

  return (
    /*
      ⚠ **`touch-pan-x` — which IS `touch-action: pan-x` — and it is the whole
      of design rule 5 here.** *One gesture means one thing across the app* —
      the record's rows own the horizontal swipe for the lock, so this must be a
      **scroller** rather than a gesture with a verb. **The day a swipe on a
      tile is given one it collides with the lock**, and this line is what it
      has to answer to. ⚠ **Not an inline `style`:** §10 blocks those under the
      production CSP and nowhere else, so a page that works locally is unstyled
      in production.

      ⚠⚠ **`rail-track` IS THE NO-SCROLLBAR RULE — directed: *there should
      absolutely be no scroll bar.*** Its own utility carries the cost: **the
      rail gives no sign of its length or where you are in it.**

      ⚠⚠ **IT BLEEDS PAST THE COLUMN, AND WITH THE BAR GONE THAT WAS THE ONLY
      THING SAYING *THERE IS MORE THIS WAY* — WHICH WAS NOT ENOUGH.** A tile as
      wide as 2:3 of the full height measured **386.8 of a 390px handset**: one
      picture, 3px of the next, and nothing at all to say the rail moves. **The
      cap below is the answer** and the bleed is still what it works through.

      ⚠ **`@container` is here for that cap**, so the tile measures itself
      against **the rail** rather than the window. A `vw` would be right on a
      handset, where the rail is the screen, and wrong on the desk, where it is
      the column.

      ⚠ **`min-h-0` is not decoration.** A flex item's default `min-height` is
      `auto`, which refuses to shrink below its content — so without it the rail
      would push past the composer instead of fitting the space `flex-1` gives
      it, and the height the tiles derive from would be the wrong one.

      ⚠⚠ **THE SNAP IS A POSITION-PRESERVING MECHANISM, NOT A FEEL — 6
      September, and it is the whole of a reported bug.** Reported from the
      device: *the rail slides across to another image when it downsizes.* It
      did, and it is arithmetic rather than animation: `scrollLeft` is an
      absolute pixel offset into content whose width **collapses 44% when the
      keyboard rises** — measured 7488px → 4227px while `scrollLeft` sat frozen
      at 927, which slides the corpus **two and a half tiles** under a
      stationary eye. Nothing was scrolling; the content moved out from under
      the number.

      ⚠ **CSS's own answer, so there is no JavaScript and no observer.** A snap
      container re-resolves its snap position after a relayout, so the tile that
      was at the start edge is still at the start edge when every tile has
      changed size — measured in **both** engines: first tile 3 → 3 with
      `scrollLeft` recomputed 937 → 531, and 3 again on the way back. Without
      it, 3 → 5. ⚠ **A `ResizeObserver` scaling `scrollLeft` by the ratio of
      `scrollWidth` was the alternative and lands within 8px of this** — it was
      refused because it puts client code in a rail whose whole point is that it
      is server-rendered markup.

      ⚠ **`mandatory`, not `proximity`.** Only mandatory guarantees the
      re-snap; proximity may leave the offset where it was, which is the bug.
      Safe here because a snap area larger than the scrollport is what traps a
      mandatory scroller and a tile is **80cqw** — deliberately smaller. ⚠ **No
      `scroll-snap-stop`**: a fling should cross several tiles, because this is
      browsing.

      ⚠ **`start`, and it makes an existing rule true rather than adding one.**
      *A fifth of the next tile is always visible* was true at rest only by luck
      before; aligned to the start edge it is true at every rest position. ⚠ **It
      does not touch the bleed** — the track still runs past the column, so the
      tile at the far end is still cut.
    */
    <div className="rail-track @container -mx-[var(--gutter-l)] min-h-0 flex-1 snap-x snap-mandatory touch-pan-x overflow-x-auto overscroll-x-contain">
      {/*
        ⚠ **`gap-0`, written rather than omitted.** The tiles touching is the
        direction, not the absence of a decision — a gap is what a reader would
        put back without knowing it had been taken out.
      */}
      <ul className="flex h-full w-max gap-0">
        {tiles.map((tile) => (
          <Tile key={tile.id} tile={tile} />
        ))}
      </ul>
    </div>
  )
}

/**
 * One tile: the openings above, the picture below, and nothing else.
 *
 * ⚠ **The words are deliberately absent.** Directed: *for users to find out
 * what each image signifies, they have to tap it.* `title` and `qualifier` ride
 * the row and are drawn only in the opened view. ⚠ **Do not answer *I can't
 * tell what these are* by putting the title back** — the answer is one tap
 * away, and the tile saying nothing is the design rather than a gap in it.
 */
function Tile({ tile }: { tile: RailTile }) {
  /*
    ⚠ **`w500` fixed, rather than measured against the box.** `PosterReveal`
    measures because it is full-bleed and its box is the window. This box is now
    height-driven and can reach roughly a screen's width, so 500 is a downscale
    on a 1× desk and a mild upscale on a 3× handset — **and the rung above would
    triple the bytes of a rail nobody has scrolled yet.** If the tiles read soft
    on a real handset, this is the one line to move.
  */
  const src = posterUrl(tile.imagePath, 'w500')

  return (
    /*
      ⚠ **`rail-focus` is the centre tile being full size and its neighbours
      receding from it** — a `view(x)` scroll timeline, **no JavaScript**, and
      guarded by `@supports` so an engine without scroll-driven animations gets
      every tile at full size rather than every tile shrunk. Its own utility in
      `globals.css` carries the argument.

      ⚠⚠ **`w-fit`, AND IT IS WHAT MAKES THE ASPECT WORK AT ALL.** The first
      build gave the frame `flex-1` and let `aspect-2/3` derive the width from
      it — **and every tile came out 5px wide**, measured. A flex item's width is
      resolved *before* its flexed height is, so the ratio had no height to work
      from and the tile collapsed to the width of the text inside it. **A
      definite height is what an aspect ratio needs**, so the frame is given one
      below and the tile shrink-wraps to whatever width the ratio then produces.
    */
    <li className="rail-focus h-full w-fit shrink-0 snap-start">
      {/*
        ⚠ **Nothing is drawn for a zero, and that is the density rule rather
        than taste.** *Cut anything the screen already says* — a `0` above every
        tile in a corpus nobody has opened is the most repeated string on the
        screen saying nothing. The row keeps its height either way, so the
        pictures stay on one line.

        ⚠ **Mono at `--text-micro`, but NOT `stamp`.** That utility is tracked
        +0.22em and uppercased, which is right for a word like TODAY and wrong
        for a number — tracking a numeral that far reads as spaced-out digits.
        §11's mono is for *counts and timestamps*, which this is.

        ⚠ **`--color-muted`, never `--color-chrome` or `--color-accent`.** Brass
        means *a control* and the accent means *this converged*; a count is
        neither, and §11's scarcity rule takes both.

        ⚠ **Indented by a hem, because the tiles touch now.** Hard against the
        picture's left edge it would read as belonging to the tile before it.
      */}
      <div className="h-[calc(var(--text-micro)*1.3)] shrink-0 ps-[var(--line-hem)] font-[family-name:var(--font-mono)] text-[length:var(--text-micro)] leading-[1.3]">
        {tile.openCount > 0 && <span className="text-muted">{tile.openCount}</span>}
      </div>

      {/*
        ⚠⚠ **HEIGHT FIRST, WIDTH FROM THE ASPECT.** The height is the rail's,
        less the count row above; `aspect-2/3` derives the width from it. So
        *bigger* and *the gap closes* are one change, and **nothing here is a
        typed size.**

        ⚠⚠ **THE HEIGHT MUST BE DEFINITE — `flex-1` HERE PRODUCED 5px TILES.**
        A flex item's width is resolved before its flexed height is, so a ratio
        given `flex-1` has no height to work from and the tile collapses to the
        width of its own text. `calc(100% - <the count row>)` is a real height,
        which is what an aspect ratio needs. ⚠ **Do not "tidy" this back to
        `flex-1`.**

        ⚠⚠ **`80cqw` IS A RULE RATHER THAN A NUMBER: A FIFTH OF THE NEXT TILE
        IS ALWAYS VISIBLE.** Not a width tuned against one screen — every
        surface gets the same promise, and **it only binds where it is needed**:
        on a 390 handset 2:3 of the full height wants 386.8 and the cap holds it
        to 312, while on the desk 2:3 wants 393 of a 947px rail and the cap never
        fires, so the desk keeps its two and a half tiles untouched.

        ⚠⚠ **THE CAP IS SPENT ON THE HEIGHT, NOT ON A `max-width`, AND THAT
        REVERSES HOW IT WAS FIRST BUILT.** As a `max-width` over a definite
        height it produced a **312 × 600 frame holding a 312 × 468 poster** —
        the ratio simply not honoured, and 132px of frame ground under every
        picture. **A band inside the tile reads as a broken picture where the
        same emptiness below the rail reads as page**, so the frame takes the
        smaller of *the height available* and *the height the capped width
        allows*, and is therefore **always 2:3**. The slack lands under the rail
        as ground.

        ⚠ **`min()` of two heights, so one expression covers both surfaces.**
        The handset takes the second term (the cap binds) and the desk takes the
        first (it does not). **No branch, no breakpoint.**

        ⚠⚠ **AND THIS IS WHY THE COMPOSER'S GLASS STILL HAS NOTHING BEHIND IT ON
        A HANDSET.** Running the rail under the composer was proposed and does
        **not** work: for a picture to reach the glass it would have to be 594px
        tall, which at 2:3 is 396px wide — **wider than a 390px screen**, so the
        cap that puts a fifth of the next tile on screen makes it arithmetically
        impossible. ⚠ **The recorded prediction in `compose-screen.tsx` — *the
        fix is the browse half, not a ground* — is therefore TESTED AND WRONG on
        a handset.** If the composer needs an edge it needs the console's own
        answer: a ground that **lifts** toward `--color-surface` rather than
        sinking toward the page.

        ⚠ **No rounding, because the tiles touch.** A radius on a flush strip
        cuts four notches of ground at every seam, which reads as a mistake
        rather than a shape. **Rounding and gaps go together; so do square
        corners and touching.**

        ⚠ **The picture is FITTED, never cropped to fill.** A poster survives and
        a landscape image letterboxes onto the frame's ground. **The reverse
        reads broken and there is no bespoke art to crop to.**
      */}
      <div className="bg-surface relative aspect-2/3 h-[min(calc(100%-var(--text-micro)*1.3),calc(80cqw*1.5))] overflow-hidden">
        {/*
          ⚠⚠ **THE NAME LIVES INSIDE THIS `relative` BOX, AND PUTTING IT ON THE
          `<li>` BROKE THE WHOLE PAGE.** `sr-only` is `position: absolute` **with
          no offsets**, so with no positioned ancestor each span resolved against
          the **initial containing block** and **escaped the rail's clipping**:
          twenty-four of them stretched the document to **3792px on a 390px
          handset**, the mobile viewport zoomed out to fit at 4×, and **the
          composer and the foot went off the bottom of the screen.** ⚠ **Nothing
          in a typecheck, a lint or a build saw it** and the tiles still looked
          right — what found it was `frontpage.mjs` reporting that `<main>`
          intercepted a click meant for the composer.

          ⚠⚠ **AND IT IS WHY `alt` IS EMPTY.** With the title on `alt`, a poster
          path TMDB no longer serves draws **the alt text and a broken-image
          icon** — words, on a tile whose whole design is that it has none. Two
          of the first three tiles on the dev database did it. An empty `alt`
          marks the image decorative, so a browser renders **nothing at all** for
          one that fails and the frame's ground is what is left. ⚠ **Do not put
          the title back on `alt`**: it reads like the accessible fix and it is
          the bug. ⚠ **Nor is it stale data to clean up** — TMDB withdraws
          artwork, so a path that resolved at ingest can stop at any time.
        */}
        <span className="sr-only">{tile.title}</span>
        {src && <Image src={src} alt="" fill sizes="100vw" className="object-contain" />}
      </div>
    </li>
  )
}
