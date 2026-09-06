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
 * ⚠ **There is no tap yet.** §3 of the front-page brief has a tap opening the
 * possibility into an enlarged view with the words beneath it; that is the next
 * step and it is what makes this a `<button>`. Until then a tile is an
 * `<img>` and nothing else, because a control that does nothing is worse than
 * no control.
 */
export function Rail({ tiles }: { tiles: RailTile[] }) {
  /*
    ⚠ **An empty rail draws NOTHING — not a message, not a skeleton.** §6's
    *silence stays silent*, and Phase 5's *an area without source coverage does
    not render a misleading rail* said the same thing from the other end. The
    column's own padding holds the space open either way.
  */
  if (tiles.length === 0) return null

  return (
    /*
      ⚠ **`touch-pan-x` — which IS `touch-action: pan-x` — and nothing else,
      and it is the whole of design rule 5 here.** ⚠ **Not an inline `style`:**
      §10 blocks those under the production CSP, and it is blocked nowhere else,
      so a page that works locally is unstyled in production. The utility
      compiles to a real rule.
      *One gesture means one thing across the app* — the record's rows own the
      horizontal swipe for the lock, so this must be a **scroller** rather than
      a gesture with a verb. **The day a swipe on a tile is given one it
      collides with the lock**, and this line is what it has to answer to.

      ⚠ **It bleeds past the column.** The negative margin cancels the gutter
      and the track puts it back as padding, so a tile can run off both edges —
      which is what says *there is more this way* without an indicator, exactly
      as the record's fade does downward. A rail that stopped at the column's
      edge would read as a finished row of three.
    */
    <div className="-mx-[var(--gutter-l)] touch-pan-x overflow-x-auto overscroll-x-contain">
      <ul className="flex w-max gap-[var(--page-lead)] px-[var(--gutter-l)]">
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
    measures because it is full-bleed and its box is the window; this box is
    `--tile-width` and known. 9rem at a 3× handset wants 432 real pixels and
    12rem at a 2× desk wants 384 — **both inside 500, and a 2:3 poster at that
    rung is small enough that 24 of them lazy-load without thought.** A 3×
    desk display is the one case that would want more, and it is rare enough to
    accept softness at.
  */
  const src = posterUrl(tile.imagePath, 'w500')

  return (
    <li className="w-[var(--tile-width)] shrink-0">
      {/*
        ⚠⚠ **THE NAME IS HERE AND NOT ON THE `alt`, AND A SCREENSHOT IS WHAT
        FOUND IT.** With the title on `alt`, a poster path TMDB no longer
        serves draws **the alt text and a broken-image icon** — words, on a tile
        whose whole design is that it has none. Seen on the first look at this
        screen; two of the first three tiles on the dev database did it.

        ⚠ **`alt=""` is what fixes it, and only because the name moved here.**
        An empty `alt` marks the image decorative, so a browser renders
        **nothing at all** for one that fails — no icon, no text — and the
        frame's own ground is what is left. The reader who cannot see it is told
        by this span instead, so nothing is lost. ⚠ **Do not put the title back
        on `alt`**: it reads like the accessible fix and it is the bug.

        ⚠ **It is not a stale-data problem to fix in the data.** TMDB withdraws
        artwork; a path that resolved at ingest can stop resolving at any time,
        so **the tile has to survive a dead URL on a screen it cannot re-check.**

        ⚠⚠ **AND THE SPAN LIVES INSIDE THE FRAME, WHICH IS `relative` —
        PUTTING IT ON THE `<li>` BROKE THE WHOLE PAGE.** `sr-only` is
        `position: absolute` **with no offsets**, so with no positioned
        ancestor each span resolved against the **initial containing block** and
        **escaped the rail's clipping**: twenty-four of them at their static
        positions stretched the document to **3792px** on a 390px handset, the
        mobile viewport zoomed out to fit at 4×, and **the composer and the foot
        went off the bottom of the screen entirely.**

        ⚠ **Nothing in a typecheck, a lint or a build saw it**, and the tiles
        still looked right in the screenshot — what found it was
        `frontpage.mjs` reporting that `<main>` intercepted a click meant for
        the composer. **An off-screen composer is what a page four times too
        large looks like from the top.**
      */}
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
      */}
      <div className="h-[calc(var(--text-micro)*1.3)] font-[family-name:var(--font-mono)] text-[length:var(--text-micro)] leading-[1.3]">
        {tile.openCount > 0 && (
          <span className="text-muted">
            {tile.openCount}
            <span className="sr-only"> openings</span>
          </span>
        )}
      </div>

      {/*
        ⚠ **One aspect, one height, always** — design rule 3. The frame is 2:3
        and the picture is FITTED inside it, never cropped to fill: a poster
        survives, and a landscape image letterboxes onto the ground rather than
        being cut. **The reverse reads broken and there is no bespoke art to
        crop to.**

        ⚠ **2:3 is a number to LOOK AT.** Posters are the only asset we get free
        at scale and the only one that cannot survive a crop, so the rail starts
        there — but a row of tall portraits on half a handset wants seeing
        before it is committed to.
      */}
      <div className="bg-surface relative mt-[var(--line-hem)] aspect-2/3 w-full overflow-hidden rounded-lg">
        <span className="sr-only">{tile.title}</span>
        {src && (
          <Image
            src={src}
            /* ⚠ Empty on purpose — the name is the `sr-only` span above. */
            alt=""
            fill
            sizes="var(--tile-width)"
            className="object-contain"
          />
        )}
      </div>
    </li>
  )
}
