'use client'

import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'

import { posterUrl } from '@/lib/posters'

/**
 * Straight from TMDB's CDN — §3 forbids proxying images through the app, and
 * `images.unoptimized` in next.config.ts stops `next/image` routing them via
 * `/_next/image`.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 *  Where posters live, as of 9 August
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * **Not in any list.** The lists are type alone. A 32px thumbnail beside every
 * row was too small to recognise a film by and cropped square so it was not
 * even poster-shaped — decoration that failed at decorating, on the one screen
 * §11 wants type to carry.
 *
 * They survive in exactly two places, and both are functional rather than
 * decorative:
 *
 *  - **`Poster`** — the thumbnail, in the search dropdown and the intent sheet.
 *    Here it is doing a job nothing else can: telling two films with the same
 *    title apart at the moment you are choosing between them.
 *  - **`PosterReveal`** — wraps a title so tapping it opens the artwork
 *    full-bleed on black. The whole of the artwork, at the largest size TMDB
 *    has, once you have asked for it.
 *
 * That is the trade the redesign made: no poster anywhere you did not ask for
 * one, and a real poster when you did, instead of a thumbnail everywhere that
 * was neither.
 *
 * Square rather than 2:3 because poster-shaped *reads* as a poster at thumbnail
 * size; `object-top` because a film poster puts its subject in the upper half
 * and its billing block along the bottom.
 *
 * The thumbnail fetches `w154`. The expanded view names no size at all — it
 * offers the browser every width TMDB publishes and lets it pick, which is the
 * only way one box can be right on a 1x desk display and a 3x phone. Sizes and
 * the arithmetic are in `lib/posters.ts`.
 */
export function Poster({ posterPath }: { posterPath: string | null }) {
  const src = posterUrl(posterPath)

  if (!src) {
    return (
      <div
        aria-hidden
        className="bg-surface border-rule size-8 shrink-0 rounded-md border"
      />
    )
  }

  return (
    <Image
      src={src}
      alt=""
      width={32}
      height={32}
      className="bg-surface size-8 shrink-0 rounded-md object-cover object-top"
      // Decorative: the title next to it is the accessible name.
      aria-hidden
    />
  )
}

/**
 * Every width TMDB publishes for a poster, as a ladder the browser climbs
 * itself. The `w` descriptors are the files' real widths; `original` is
 * declared at 2000, which is where TMDB's poster masters top out.
 *
 * ⚠ **Nothing here may be re-tuned against a device.** The point of the ladder
 * is that no rung was chosen — see the note in `lib/posters.ts`.
 */
const REVEAL_SRCSET = (posterPath: string) =>
  [
    `${posterUrl(posterPath, 'w342')} 342w`,
    `${posterUrl(posterPath, 'w500')} 500w`,
    `${posterUrl(posterPath, 'w780')} 780w`,
    `${posterUrl(posterPath, 'original')} 2000w`,
  ].join(', ')

/**
 * The box the fitted poster renders in, stated in the viewport's own units so
 * the browser can resolve the ladder above without being told anything about
 * the device. The artwork is contained in a full-bleed black ground and posters
 * are 2:3, so its width is the viewport's width or two thirds of its height,
 * whichever binds first.
 *
 * If a browser cannot parse `min()` here the attribute is invalid and the spec
 * falls back to `100vw` — which is to say, to fetching `original`, which is
 * exactly what this file did before the ladder existed. The failure mode is the
 * old behaviour, not a broken one.
 */
const REVEAL_SIZES = 'min(100vw, 67vh)'

/**
 * Tap the title, see the poster. **Under a finger, tap anywhere and it closes**
 * — which is what this has always done and what it does again. Under a cursor
 * the ground closes and the artwork magnifies to the largest TMDB holds, with a
 * second click to come back.
 *
 * Pinch-zoom, double-tap zoom and rubber banding were all built and all removed
 * on 8 August; see docs/decisions.md. Magnifying is not their return by another
 * name. It is a *click*, which a cursor has and a finger does not: the one
 * input that can say *this part of the screen* without also being the way you
 * dismiss things. Where that distinction does not exist, neither does the
 * gesture — see `pointer` below.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 *  Three reasons the poster painted in from the top — 21 August
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * All three were structural, and none of them was the network:
 *
 *  1. **It fetched `original` on every screen.** A desk display shows this
 *     artwork across ~600 CSS px at 1x, and `original` is a 2000×3000 master —
 *     measured off TMDB: 1.87MB against `w780`'s 358KB for the same film. The
 *     ladder above hands the choice to the browser, which is the only party
 *     that knows the pixel ratio: a 3x phone still gets `original`, and the
 *     desk stops paying five times over for pixels it cannot render. This is
 *     the whole of why the browser was worse than the handset — the handset was
 *     fetching the size it needed.
 *
 *  2. **A baseline JPEG paints as it arrives.** That is not a bug to time out or
 *     a spinner to cover; it is what an `<img>` does whenever it is displayed
 *     before it is complete. So it is not displayed before it is complete — the
 *     element is transparent until `load`, and no engine can paint strips of
 *     something it is not showing. A fix at the display, which holds on every
 *     browser, rather than at the encoding, which is TMDB's.
 *
 *  3. **`next/image` lazy-loads, and this image lives in a closed `<dialog>`.**
 *     That was load-bearing by accident: `display: none` never intersects the
 *     viewport, so the lazy image was the only thing stopping a Wants list of
 *     forty rows fetching forty full-size posters on arrival. It also meant the
 *     request could not start until the dialog was *shown* and an
 *     IntersectionObserver had noticed — a frame or more of latency bought with
 *     nothing. Mounting the image on first open buys the same protection
 *     outright and starts the fetch eagerly, in the same tick as the tap.
 *
 * And the tap itself starts the fetch a beat earlier: `pointerdown` warms the
 * exact URL the ladder will pick, so the bytes are moving before the click that
 * opens the dialog exists. Deliberately not on hover — `lib/posters.ts` records
 * that these bytes are spent on a deliberate tap, and a cursor crossing a title
 * on the way somewhere else is not one.
 *
 * Renders its children unwrapped when there is no artwork, so a film TMDB has
 * no poster for is a plain title rather than a button that opens nothing.
 */
export function PosterReveal({
  posterPath,
  title,
  className,
  struck = false,
  children,
}: {
  posterPath: string | null
  title: string
  className?: string
  /**
   * Crossed off — 21 August. See `entry-row.tsx`.
   *
   * ⚠ **A boolean rather than a class from the caller, because a strikethrough
   * and this button's underline are the same CSS property.** Passing
   * `line-through` in `className` puts two `text-decoration-line` utilities on
   * one element and lets the stylesheet's ordering decide which survives — it
   * was the underline, silently, so a crossed-off row looked exactly like a live
   * one. Deciding here means only ever one of them is written, which is a
   * collision removed rather than a collision won.
   */
  struck?: boolean
  children: React.ReactNode
}) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const groundRef = useRef<HTMLDivElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)

  /**
   * ───────────────────────────────────────────────────────────────────────────
   *  What kind of pointer this click came from — 21 August
   * ───────────────────────────────────────────────────────────────────────────
   *
   * **Under a finger, the poster goes back to *tap anywhere, close it*.**
   * Magnifying is a cursor's gesture and it was wrong in the hand: the fitted
   * artwork takes the full width of a handset, so the ground it is dismissed
   * from is two thin bands, and the tap that used to close it started zooming
   * instead. The whole of the surface is a dismissal again.
   *
   * ⚠ **This is not the device branch CLAUDE.md rules out, and the difference
   * matters enough to state.** A banned branch asks *what browser is this* and
   * then corrects for it — a guess about a class of machine, made once, wrong
   * on the next one. This asks the event that actually arrived what kind of
   * input made it, which is neither a guess nor a class: a touchscreen laptop
   * magnifies under its mouse and dismisses under a finger, in the same
   * session, on the same element, and nothing had to know which laptop it was.
   * A media query cannot do that, because it describes the device rather than
   * the gesture.
   *
   * Anything that is not a mouse dismisses, and that includes a click with no
   * pointer behind it at all — the fallback is the behaviour this surface had
   * for its first two weeks, which is the safe direction to fail in.
   */
  const pointer = useRef('')

  /** Has it ever been opened? Until it has, there is no `<img>` — see (3). */
  const [mounted, setMounted] = useState(false)
  /** Has the artwork fully arrived? Until it has, it is transparent — see (2). */
  const [loaded, setLoaded] = useState(false)
  /** Shown at its own size rather than fitted to the screen. */
  const [magnified, setMagnified] = useState(false)
  /** `original` is on its way for a magnify that has been asked for. */
  const [enlarging, setEnlarging] = useState(false)

  /*
    A cached image can finish loading before React has a handler on it, and then
    `load` never fires for anyone to hear. Asking the element whether it is
    already complete covers that; the dependency is the mount, because that is
    the only moment an `<img>` appears where there was none.
  */
  useEffect(() => {
    if (imageRef.current?.complete) setLoaded(true)
  }, [mounted])

  /*
    An overflowing flex child's `auto` margins resolve to zero, so a magnified
    poster lands with its top-left corner in the top-left corner of the screen —
    the one part of a poster nobody magnified it to read. Centring the *scroll*
    rather than the artwork means the middle is where it was before the click and
    every edge is a drag away.
  */
  useEffect(() => {
    const ground = groundRef.current
    if (!ground || !magnified) return
    ground.scrollLeft = (ground.scrollWidth - ground.clientWidth) / 2
    ground.scrollTop = (ground.scrollHeight - ground.clientHeight) / 2
  }, [magnified])

  const fitted = posterUrl(posterPath, 'w780')
  const full = posterUrl(posterPath, 'original')

  if (!posterPath || !fitted || !full) return <>{children}</>

  /*
    Warm the ladder's own choice, not a size of our guessing: setting `srcset`
    and `sizes` on a detached image runs the same selection the dialog will run,
    against the same viewport, so the URL that lands in the cache is the URL the
    dialog asks for. Setting `src` alone would warm `w780` and leave a 3x phone
    to fetch `original` from cold anyway.
  */
  const warm = () => {
    if (mounted || !posterPath) return
    const probe = new window.Image()
    probe.sizes = REVEAL_SIZES
    probe.srcset = REVEAL_SRCSET(posterPath)
    probe.src = fitted
  }

  /*
    Magnifying swaps the fitted artwork for `original`, and does it only once
    `original` is in the cache. Swapping first and waiting after would blank the
    element for as long as the download took — the poster would vanish at the
    exact moment the person asked to see more of it. So the click fetches, and
    the swap happens on arrival, which is instantaneous whenever the ladder had
    already chosen `original` for the fitted view.
  */
  const magnify = () => {
    /* A finger dismisses wherever it lands — see `pointer` above. */
    if (pointer.current !== 'mouse') {
      dialogRef.current?.close()
      return
    }

    if (magnified) {
      setMagnified(false)
      return
    }
    if (enlarging) return

    setEnlarging(true)
    const probe = new window.Image()
    probe.decoding = 'async'
    probe.onload = () => {
      setEnlarging(false)
      setMagnified(true)
    }
    probe.onerror = () => setEnlarging(false)
    probe.src = full
  }

  return (
    <>
      <button
        type="button"
        onPointerDown={warm}
        onClick={() => {
          setMounted(true)
          dialogRef.current?.showModal()
        }}
        aria-label={`${title} — see the poster`}
        /*
          `text-left` because this is a paragraph of text inside a button, and
          `decoration-transparent` so the underline exists at rest and only
          takes colour on hover. Animating an underline in from nothing shifts
          nothing, but it does mean the affordance is invisible until you are
          already on it — this way the geometry is settled and only the ink
          arrives.

          **Struck, the underline goes and does not come back on hover.** The two
          lines cannot both be drawn — see `struck` above — and between an
          affordance that is deliberately almost invisible at rest and a state
          that has to be legible across the room, the state wins. The title is
          still a button; it just stops advertising it while it is crossed off.
        */
        className={`text-left decoration-1 underline-offset-[6px] transition-colors ${
          struck
            ? 'decoration-current line-through'
            : 'decoration-rule hover:decoration-muted underline'
        } ${className ?? ''}`}
      >
        {children}
      </button>

      <dialog
        ref={dialogRef}
        /*
          Magnification is a property of this viewing, not of the film. Closing
          on a magnified poster and opening it again should start where every
          other opening starts, fitted to the screen.

          Safe to answer every `close` this hears, unlike the film screen's
          handler: React dispatches `close` along its own tree rather than the
          DOM's, and this dialog is the innermost one there is.
        */
        onClose={() => setMagnified(false)}
        /*
          `backdrop:bg-black` is now the same value as `--color-bg`, and stays
          spelled out rather than switched to the token: this surface is black
          because a poster wants nothing behind it, not because it inherits the
          app's ground. If the ground ever moves off true black, this should not
          follow it.

          Full bleed, so black reaches every edge and there is nowhere to tap
          that is not the poster or its ground.
        */
        className="bg-transparent backdrop:bg-black m-0 h-full max-h-none w-full max-w-none p-0"
      >
        <div
          ref={groundRef}
          onClick={() => dialogRef.current?.close()}
          /*
            The ground. Its cursor is the ordinary arrow and its click closes,
            which is the pair that makes the poster's own cursor mean something:
            a magnifying glass inside the artwork and an arrow outside it states
            where the two different clicks are, before either is spent.

            `touch-none` is the one piece of the zoom work worth keeping, and it
            is a class rather than code. It stops the browser doing its own
            pinch and double-tap zoom on this element — which matters because an
            unhandled pinch zooms the *page*, and iOS offers no way to put page
            zoom back: `visualViewport.scale` is read-only and the
            `maximum-scale` meta has been ignored since iOS 10.

            Without it, pinching the poster and closing left the list behind
            magnified with no way back short of reloading.

            Magnified, it becomes the scroll container and gives dragging back
            as `pan-x pan-y` — the exact subtraction, since that still withholds
            `pinch-zoom` and the page behind still cannot be zoomed and
            stranded. And the artwork centres with `m-auto` rather than
            `justify-center`, because a centred flex child that overflows its
            scroll container is clipped at the start edge and the top-left
            corner of the poster becomes unreachable.

            ⚠ **In the hand that branch is dead, and deliberately so.** Only a
            mouse can magnify, so under a finger this element is `touch-none`
            for the whole of its life and the guarantee above is not a pair of
            states to reason about — it is the one state there has ever been.
            The relaxation exists for a pointer that cannot pinch anyway.
          */
          className={`flex h-full w-full cursor-default bg-black ${
            magnified
              ? 'touch-pan-x touch-pan-y overflow-auto'
              : 'touch-none items-center justify-center'
          }`}
        >
          {mounted && (
            /*
              eslint-disable-next-line @next/next/no-img-element --
              `next/image` cannot express this one. `images.unoptimized` is set
              (§3 — never proxy posters), and an unoptimized `next/image`
              overwrites `srcSet` and `sizes` with `undefined` on its way out of
              `getImgProps`, which is the entire mechanism this view now runs
              on. What it would still add — a lazy loader we specifically do not
              want here, and `width`/`height` that CSS overrides in both states —
              is the part being removed. The thumbnail above keeps it.
            */
            <img
              /*
                ⚠ **A fresh element for each mode, because a `srcSet` leaves
                something behind that removing it does not take away.** Choosing
                from a `srcSet` stamps the element with a *pixel density* — the
                ratio between the file's real width and the width `sizes` said
                the box would be — and from then on the element reports and lays
                itself out at the corrected size. Swapping in `original` and
                deleting both attributes measured 603px for a 2000px file:
                2000 ÷ 3.32, the density from a ladder that was no longer there.

                Magnified means *this artwork at its own pixel size*, so the
                element it is measured on must never have been told a box. The
                key builds one that never was, which is a state removed rather
                than a state cleared.
              */
              key={magnified ? 'magnified' : 'fitted'}
              ref={imageRef}
              src={magnified ? full : fitted}
              /* Magnified is `original` and nothing else: there is no larger rung. */
              srcSet={magnified ? undefined : REVEAL_SRCSET(posterPath)}
              sizes={magnified ? undefined : REVEAL_SIZES}
              alt={`Poster for ${title}`}
              draggable={false}
              decoding="async"
              /* The only thing on the screen, and the reason the screen opened. */
              fetchPriority="high"
              onLoad={() => setLoaded(true)}
              /* Which input this is, asked of the input rather than the device. */
              onPointerDown={(event) => {
                pointer.current = event.pointerType
              }}
              onClick={(event) => {
                /*
                  The ground's click closes; this one must not reach it — even
                  when it is going to close too, because `magnify` closes the
                  dialog itself under a finger and letting both fire would run
                  `close()` twice on a dialog that had already gone.
                */
                event.stopPropagation()
                magnify()
              }}
              /*
                Fitted: contained, never enlarged — a 2000px source shown across
                ~390 CSS px is a downscale, which is the sharpest a screen can
                render it. Magnified: its own pixel size, `max-none` so nothing
                holds it in and `m-auto` so it centres until it is too big to,
                and then scrolls.

                Transparent until `load`, so the artwork arrives whole or not at
                all — see (2) above. The fade is short enough to read as the
                picture appearing rather than as an animation of it.
              */
              className={`transition-opacity duration-200 ${loaded ? 'opacity-100' : 'opacity-0'} ${
                magnified
                  ? 'm-auto h-auto w-auto max-w-none cursor-zoom-out'
                  : `max-h-full max-w-full object-contain ${
                      enlarging ? 'cursor-progress' : 'cursor-zoom-in'
                    }`
              }`}
            />
          )}
        </div>
      </dialog>
    </>
  )
}
