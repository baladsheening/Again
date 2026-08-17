'use client'

import Image from 'next/image'
import { useEffect, useRef, useState, useTransition } from 'react'

import { addFilmAction, undoEntryAction } from '@/app/actions/entries'
import type { FilmSearchResult, Intent } from '@/lib/domain'
import { posterUrl } from '@/lib/posters'
import { intentsFor, specFor } from '@/lib/vocabulary'
import { haptic } from '@/lib/haptics'
import { TickIcon } from './icon-tick'

/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  The film, when you tap its poster — 17 August
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Directed, with a layout. **The artwork takes the top of the screen edge to
 * edge, the synopsis takes the bottom, and a `+` over the poster adds the film.**
 *
 * It replaces two surfaces: the intent sheet, which asked *see or a copy?* as a
 * modal over the wall, and the acknowledgement band, which answered from the foot
 * of the screen a second later. Both are gone.
 *
 * **The reason it is better is the order of the questions.** The sheet asked
 * which want you meant before telling you what the film was — and the moment that
 * matters is a poster on the wall you do not recognise. This answers *what is
 * this* first, and the add is a control on the answer rather than a modal in
 * front of it. It also puts the confirmation where your finger already is, which
 * is what let the band go.
 *
 * ⚠ **It is a step past §2's "images beyond poster thumbnails".** The wall took
 * the first step; this is the second, taken deliberately and recorded here rather
 * than discovered later. What it does not do is add a *second kind* of image:
 * this is the poster, cropped, not the backdrop still the reference layout used.
 * One image type in the app, at three sizes, all from TMDB's CDN (§10 — never
 * proxied).
 *
 * ─────────────────────────────────────────────────────────────────────────────
 *  *Want a copy* is gone, and it takes a collection's inflow with it
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Directed 17 August. The screen offers one intent now: the `+` adds a
 * *Want to see*, and there is no second control.
 *
 * ⚠ **This is a product change wearing the clothes of a layout change, and the
 * consequence is worth writing down where the next person will meet it.** Intent
 * is a property of the entry (§4) and `own` still exists everywhere else — in
 * `lib/vocabulary.ts`, in the schema, in the resolve flow. What has gone is the
 * only place a person could *create* one. So:
 *
 *   - **Nothing new lands in Fixtures.** `own` resolves to `fixture` (§5), and
 *     with no way to make an `own` want, that collection can only grow by copying
 *     someone else's — `copyEntry` carries the source's intent over deliberately.
 *   - Existing `own` entries are untouched. Nothing is ever deleted (§5), and they
 *     still resolve, still appear, still participate in overlap as the `lend`
 *     match.
 *
 * If Fixtures is meant to stay a live collection, this is the thing to come back
 * to — not by restoring a control that has been rejected, but by deciding where
 * *Want a copy* belongs, if anywhere.
 */

/**
 * ⚠ **The client's own copy of §5.1's window, as the band's was.** The authority
 * is `UNDO_WINDOW_MS` in `lib/db/entries.ts`, which cannot be imported here —
 * `lib/db` is `server-only`, by §3. If they ever disagree the server wins and the
 * undo simply fails, which is the right way round for a divergence to break.
 */
const UNDO_WINDOW_MS = 10_000

/**
 * Two thirds of the screen for the artwork, the rest for the words. Directed
 * 17 August, up from a half.
 *
 * ⚠ **A fraction of the parent, not of the viewport.** It was `h-[52svh]`, and
 * `svh` is the *screen*, which is not the same thing as the box this sits in —
 * the dialog is `h-full` today, so they agree, and they would stop agreeing the
 * moment anything gained a margin or the layout took an inset. `h-2/3` is two
 * thirds of whatever it is inside, which is what "two thirds" was asked for.
 *
 * The pane below takes the remainder and scrolls, so a long synopsis costs a
 * scroll rather than a squeeze — and `Want a copy`, which sits under it, can now
 * fall below the fold on a wordy film. That is the trade this fraction makes.
 */
const ARTWORK = 'h-2/3'

/**
 * The one circle on the artwork.
 *
 * ⚠ **No ring. It had one for a single commit and it is reverted** — a hairline
 * in `currentColor`, added on 17 August so the outline sat on the `+` rather than
 * on the close, and rejected on sight. The fill alone is the shape.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 *  Glass, 17 August — and the fill had to invert to get there
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Asked for: make the circle more glass-like, with a blur. Then, once it had one:
 * *it looks a bit grey, I want a frosted glass effect.*
 *
 * ⚠ **Both reports are about the same thing, and it is not in this class.** It
 * read grey because it *was* grey — a flat `#171716` with nothing varying inside
 * it. **Frost is blurred content, and there was no content**: this control sits
 * at the foot of the scrim, and the scrim's lower end was solid black, so the
 * backdrop being blurred was a sheet of black. Blur a flat colour and you get the
 * flat colour back.
 *
 * **So the fix is in the gradient, not the disc** — see the scrim in the render,
 * which stops at 80% instead of reaching solid. A fifth of the poster now reaches
 * this control, and the blur has something to smear: over a warm poster the disc
 * picks up warmth and loses saturation against its surroundings, which is what
 * frosted glass does and what no tint can imitate on its own.
 *
 * The tint stays, thinned to `text/8`, and it is doing a different job from the
 * frost: **it is the floor.** Over a dark passage of artwork there is nothing to
 * blur and nothing to see, and a control that disappears on dark posters would be
 * worse than one that is flat on all of them. Eight percent of the aged paper is
 * the least that keeps the shape findable when the picture behind it is black.
 * **Warm, not white** — `--color-text` rather than a cool `white/8`, or the one
 * glass control in the app would be the one thing in it that is not warm.
 *
 * `backdrop-blur-band` is the app's single glass strength, the 24px the home
 * wall's caption frosts artwork by. There is one number for glass here and this
 * is now its second reader.
 *
 * ⚠ **The contrast floor moved with the scrim, and this is where it now sits.**
 * Worst case is the brightest poster: the scrim lets through about 40/255, the
 * tint lifts it to about `#373737`, and against that the `+` reads 9.3:1 and the
 * green tick 3.3:1 — past the 3:1 WCAG 1.4.11 asks of a graphical control, and
 * not past it by much. **The tick is the number to watch.** Lightening the scrim
 * further, or thickening this tint, spends it.
 *
 * ⚠ **This reverses a caution written here on the same day**, and the caution
 * still holds as a thing to watch rather than as a reason not to: WebKit has a
 * history of misrendering `backdrop-filter` clipped to a rounded border —
 * sometimes painting the backdrop unclipped, sometimes dropping it. If this
 * circle ever shows a square of blur or no blur at all on iOS, that is the known
 * cause and it is not this file's arithmetic that is wrong.
 */
/*
  ⚠ **`size-6`, down from 9 then 8 then 7 across 17 August, and `tap-target` is
  why that is free.** The visible shape is 24px and the hit area stays 44px — the
  utility centres a transparent pseudo-element on the control and floors it at the
  touch minimum, so the mark can be as small as it looks right without the target
  following it down. Shrinking a control that carried its own hit area would have
  been a legibility change *and* an accessibility one.

  ⚠ **A rounded square rather than a circle, directed 17 August — and the corner
  shrinks with the box or it stops being one.** `rounded-md` is 6px on 24px, the
  same quarter-of-the-side the previous pair held at 8 on 28. Holding the radius
  still while the box came down would have walked the shape back toward the circle
  it was asked to stop being: at 24px, an 8px corner is a third of the side.

  **Deliberately not `--radius-artwork`.** That token is the corner the posters and
  the banners over them share, and its own note says nothing else reads it — chips
  and controls have their own scale and are not artwork. This sits *on* the
  artwork without being any of it, and tying its corner to the poster's would
  invent a relationship that is not there.
*/
const CONTROL =
  'bg-text/8 backdrop-blur-band tap-target flex size-6 shrink-0 items-center justify-center rounded-md'

type Details = {
  synopsis: string | null
  runtime: number | null
  directors: string[]
}

/**
 * What is on your list, by intent. **`null` means not yet known**, which is a
 * different thing from an empty object and is why this is not a plain record: a
 * `+` drawn before the answer arrives is a control that says *not on your list*
 * without having asked.
 */
type Marks = Partial<Record<Intent, { entryId: string | null }>> | null

export function FilmScreen({
  film,
  onClose,
}: {
  film: FilmSearchResult
  onClose: () => void
}) {
  const ref = useRef<HTMLDialogElement>(null)
  /*
    The first intent and only the first. `intentsFor` still returns both — the
    vocabulary is unchanged — and this screen deliberately reads one of them; see
    the note at the top for what that costs Fixtures.
  */
  const [primary] = intentsFor('film')

  const [details, setDetails] = useState<Details | null>(null)
  const [marks, setMarks] = useState<Marks>(null)
  const [undoable, setUndoable] = useState<{ intent: Intent; entryId: string } | null>(
    null,
  )
  const [error, setError] = useState<string | null>(null)
  const [, startTransition] = useTransition()

  /*
    `showModal()` rather than an `open` attribute, and a `<dialog>` rather than the
    hand-built overlay the intent sheet was. It brings focus containment, the
    inertness of everything behind it and Escape for nothing, all of which the
    sheet did by hand and did partially — `PosterReveal` in `poster.tsx` reached
    the same conclusion first.
  */
  useEffect(() => {
    const dialog = ref.current
    dialog?.showModal()
    return () => dialog?.close()
  }, [])

  /*
    ───────────────────────────────────────────────────────────────────────────
     The wall is where you left it — 17 August
    ───────────────────────────────────────────────────────────────────────────

    **Objective, in the words it was reported in: you should not be able to swipe
    while a poster is open and find yourself somewhere else on the wall when you
    close it.**

    ⚠ **The first attempt is reverted, and the reason it was the wrong shape is
    worth more than the reason it did not work.** It was `touch-none` on the
    artwork, `overscroll-contain` on the pane and `overscroll-none` on the
    dialog — three declarations, each blocking one route by which a gesture can
    reach the document. That is a defence built from a *list*, and a list is only
    as good as its completeness: momentum after the finger has gone, a wheel over
    a margin, a focus that reveals something, the browser's own address-bar
    reflow. Every one of those is another line, and the failure of any one of
    them looks exactly like the failure the report describes.

    **This does not care how the page moved.** Two lines, in the order they
    matter:

    1. **The document is held still while the screen is open.** `overflow:
       hidden` on the root removes the scroll range, so there is nothing to
       scroll into and the position cannot change. This is the lock globals.css
       records taking *off* on 13 August — and the note there is about a lock
       that was permanent, which cost Safari's address-bar collapse and
       pull-to-refresh on every screen in the app. Neither of those means
       anything under a modal that covers the viewport, and it is put back the
       moment the screen closes.
    2. **The position is put back regardless.** `scrollY` is read on the way in
       and restored on the way out, so if the lock is defeated on some engine —
       and iOS has defeated more than one scroll lock in this project's lifetime
       — the objective still holds. The first line is why nothing moves; the
       second is why it does not matter if it does.

    `behavior: 'instant'` because `html` sets `scroll-behavior: smooth`, and a
    restore is not a journey — smooth would animate the wall back under you.

    Written through the CSSOM rather than as a class, and that is a CSP
    requirement rather than a preference: `style-src` has no `unsafe-inline`, so
    a rendered `style` attribute is dropped in production while `el.style.x` from
    JS is untouched. See the note on `wordmark-trim` in globals.css.
  */
  useEffect(() => {
    const root = document.documentElement
    const previous = root.style.overflow
    const y = window.scrollY

    root.style.overflow = 'hidden'

    return () => {
      root.style.overflow = previous
      window.scrollTo({ top: y, behavior: 'instant' })
    }
  }, [])

  /*
    The details, and whether it is already on your list — one request, see
    `app/api/film/[id]/route.ts`.

    **Nothing waits for it.** The title, the year and the artwork all came off the
    thing that was tapped, so the screen is complete from the first frame and this
    fills in the synopsis and the marks. A spinner over a poster we already have
    would be inventing a wait.

    Aborted on unmount so closing the screen does not leave a request writing into
    a component that has gone.
  */
  useEffect(() => {
    const abort = new AbortController()

    fetch(`/api/film/${encodeURIComponent(film.externalId)}`, { signal: abort.signal })
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error(String(res.status)))))
      .then((body) => {
        setDetails({
          synopsis: body.film?.synopsis ?? null,
          runtime: body.film?.runtime ?? null,
          directors: body.film?.directors ?? [],
        })
        const found: Marks = {}
        for (const entry of body.listed ?? []) {
          found[entry.intent as Intent] = { entryId: entry.entryId }
        }
        setMarks(found)
      })
      .catch(() => {
        if (abort.signal.aborted) return
        /*
          The synopsis is the part that fails softly — there is a line for that
          below. The marks are not: an unknown list state stays unknown rather
          than defaulting to "not on your list", because the `+` that would draw
          is the one thing on this screen that can be wrong in a way you act on.
        */
        setDetails({ synopsis: null, runtime: null, directors: [] })
      })

    return () => abort.abort()
  }, [film.externalId])

  /* §5.1. The offer expires; the row does not (§5 — nothing is ever deleted). */
  useEffect(() => {
    if (!undoable) return
    const timer = setTimeout(() => setUndoable(null), UNDO_WINDOW_MS)
    return () => clearTimeout(timer)
  }, [undoable])

  function add(intent: Intent) {
    // Inside the gesture: a haptic answers a finger, and every platform that has
    // one refuses it once the gesture is over. See `lib/haptics.ts` — on iOS this
    // currently does nothing, and that is not for want of trying.
    haptic()
    setError(null)
    // Optimistic, like every add in this app has been: the mark is the answer to
    // the tap, and the network is not part of the answer.
    setMarks((current) => ({ ...(current ?? {}), [intent]: { entryId: null } }))

    startTransition(async () => {
      const result = await addFilmAction({ externalId: film.externalId, intent })

      if (!result.ok) {
        setMarks((current) => {
          const next = { ...(current ?? {}) }
          delete next[intent]
          return next
        })
        setError(result.message)
        return
      }

      setMarks((current) => ({
        ...(current ?? {}),
        [intent]: { entryId: result.value.entryId },
      }))

      /*
        Only a real creation is undoable. Tapping `+` on something already on
        your list is idempotent (§10) — it returns the row that was there, and
        offering to undo it would be offering to delete something you did not
        just add.
      */
      if (result.value.created) {
        setUndoable({ intent, entryId: result.value.entryId })
      }
    })
  }

  function undo(intent: Intent, entryId: string) {
    haptic()
    setUndoable(null)
    setMarks((current) => {
      const next = { ...(current ?? {}) }
      delete next[intent]
      return next
    })

    startTransition(async () => {
      const result = await undoEntryAction(entryId)
      if (!result.ok) {
        setError(result.message)
        setMarks((current) => ({ ...(current ?? {}), [intent]: { entryId } }))
      }
    })
  }

  const large = posterUrl(film.posterPath, 'original')
  const small = posterUrl(film.posterPath, 'w342')
  const listedPrimary = marks?.[primary]
  const undoablePrimary = undoable?.intent === primary ? undoable : null

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      aria-label={film.title}
      /*
        Full bleed on black. `backdrop:bg-black` spelled out rather than taken
        from the token, for the reason `PosterReveal` gives: this is black because
        artwork wants nothing behind it, not because it inherits the app's ground.

        ─────────────────────────────────────────────────────────────────────────
         `h-dvh` and `overflow-hidden`: the dialog was the thing scrolling
        ─────────────────────────────────────────────────────────────────────────

        Reported: a scrollbar on the right while swiping, even though the wall
        behind was correctly held still. Both halves of that were true, and
        together they name the culprit — **it was not the document, it was this
        element.**

        Two facts meet. A `<dialog>`'s UA style is `overflow: auto`, so it becomes
        a scroller the moment its content is taller than it is. And `h-full` on a
        modal dialog is 100% of the *initial containing block*, which is the
        **layout** viewport — the full height of the screen including the strip
        Safari's address bar is sitting over. So on a phone with chrome showing,
        the box was taller than the visible area by exactly the height of that
        bar, and the overflow it produced was scrollable and indicated.

        Nothing moved on the wall because the lock was working. What moved was the
        screen itself, inside a box slightly too tall for the window.

        `h-dvh` is the *visible* viewport rather than the layout one, so there is
        nothing left over to scroll. `overflow-hidden` is the guarantee rather
        than the fix: whatever any engine decides the height should be, this
        element is never a scroll container, so it can never indicate or absorb a
        gesture again.

        ⚠ **`dvh` rather than `svh`.** `svh` is the *smallest* viewport, which
        would leave a strip of the screen unpainted whenever the address bar is
        already collapsed. The usual objection to `dvh` — that it changes as the
        chrome moves, resizing the layout underneath you — does not reach here:
        Safari collapses its bar in response to the *document* scrolling, and the
        document is locked for as long as this screen is open. See the effect
        above.
      */
      className="m-0 h-dvh max-h-none w-full max-w-none overflow-hidden bg-black p-0 text-text backdrop:bg-black"
    >
      {/*
        `max-w-md` and centred. Above `rail` a takeover the width of a desk would
        be a poster stretched across a metre of screen; below it the cap is wider
        than any phone and does nothing. One layout, one class, right at both ends
        — the same move the acknowledgement band makes at its own breakpoint.
      */}
      <div className="mx-auto flex h-full w-full max-w-md flex-col">
        <div className={`${ARTWORK} relative shrink-0 overflow-hidden`}>
          {small && (
            /*
              ⚠ **Two layers, and the small one is the point.** `w342` is what the
              wall already fetched, so it is in the browser's cache and paints on
              the first frame; `original` arrives over it a moment later. Without
              this the screen opens on an empty rectangle for as long as a 1MB
              image takes on mobile data — which is the one thing a tap-to-open
              screen must not do.

              No state and no `onLoad`: the second image simply paints over the
              first when it has something to paint. A fade would need to know when
              that happened, and knowing costs a re-render to hide a transition
              nobody asked for.
            */
            <Image
              src={small}
              alt=""
              aria-hidden
              /*
                ⚠ **`width`/`height` and classes, never `fill`.** `fill` renders
                its positioning as a `style` attribute, and the CSP in `proxy.ts`
                drops every style attribute in production while `next dev` allows
                them — so it would have laid out perfectly here and collapsed on
                the deployed site. That divergence has already cost this project a
                masthead and a wordmark (10 August); see the note on
                `wordmark-trim` in globals.css. The numbers are the source's own
                aspect, which is all they are for: the classes do the layout.
              */
              width={342}
              height={513}
              className="absolute inset-0 h-full w-full object-cover object-top"
              priority
            />
          )}
          {large && (
            <Image
              src={large}
              alt={`Poster for ${film.title}`}
              width={2000}
              height={3000}
              className="absolute inset-0 h-full w-full object-cover object-top"
              priority
            />
          )}

          {/*
            The scrim. Type over artwork is unreadable without one, and this is the
            same argument the wall's caption band makes — a gradient rather than a
            blur here because the artwork below the words is what the screen is
            for, and a blur would take the bottom third of it.

            ⚠ **It stops at 80% rather than reaching solid black, and that is what
            makes the `+` frosted rather than grey.** Reported 17 August: the glass
            circle looked grey. It was — a flat tint over a flat ground, because
            the backdrop it was blurring at this height was *solid black*, and a
            blurred flat colour is that colour. Letting a fifth of the poster reach
            the bottom of the gradient gives the blur something to work on, and
            frost is blurred content or it is nothing. **The control's own classes
            could not have fixed this.**

            The cost is paid in text contrast and it is affordable: against the
            brightest poster the ground here goes from black to about `#282828`,
            where the title still reads 11:1 and the credit line 5:1. ⚠ Taking it
            below 80% keeps going in the same direction — a little more frost, a
            little less floor — and the number that runs out first is the green
            tick's, at 3.3:1 today. See `CONTROL`.
          */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 bottom-0 h-3/5 bg-gradient-to-t from-black/80 via-black/60 to-transparent"
          />

          {/*
            ─────────────────────────────────────────────────────────────────────
             The artwork is the way back — 17 August
            ─────────────────────────────────────────────────────────────────────

            Directed: tapping the artwork returns you to the wall. Which is the
            interaction `PosterReveal` in `poster.tsx` has had since 8 August —
            *tap the title, see the poster; tap anywhere, close it* — and the
            reason it works there is the reason it works here: a picture that
            opened on a tap is a picture that should shut on one.

            ⚠ **A `<button>` covering the artwork, not an `onClick` on the div.**
            The same call the intent sheet's scrim made, in its own words: a click
            handler on a div is something only a mouse can find, while a button is
            reachable from a keyboard and announced as a control. It costs one
            element and it is the difference between an affordance and a secret.

            **Nothing is excluded by name.** The layer below it is artwork, the
            layer above it is the title block, and that block is
            `pointer-events-none` with the `+` alone restoring them — so a tap on
            the poster, on the title, on the credit line or on the empty half of
            that row all reach this, and only the one control does not. No
            `closest()` check, no list of things to ignore, nothing to keep in step
            when something is added to the block later.
          */}
          <button
            type="button"
            onClick={() => ref.current?.close()}
            aria-label="Close"
            className="absolute inset-0"
          />

          {/*
            --- what it is, over the foot of the artwork ---------------------

            `pointer-events-none`, so this block is *read* rather than tapped and
            everything under it is the artwork's own close button — see the note
            there. The `+` inside puts them back for itself.
          */}
          <div className="gutter pointer-events-none absolute inset-x-0 bottom-0 pb-5">
            {/*
              ─────────────────────────────────────────────────────────────────
               The `+` ends the title, on whichever line the title ends
              ─────────────────────────────────────────────────────────────────

              It has been in three places today: the artwork's top right, opposite
              the close, which put the one thing this screen is *for* in the corner
              reserved for furniture; under the credit line, which read as an
              afterthought to the metadata; and beside the title in a flex row,
              which was right for a one-line name and wrong for every other —
              a row aligns the control to the *block*, so a title that ran to three
              lines left the control floating beside the first with two lines of
              nothing under it.

              ⚠ **So it is not beside the heading any more, it is inside it.** The
              control is inline content, after the last word, with an ordinary
              space in front of it: it flows, so it ends up at the end of the last
              line whatever that line turns out to be, at any width and any length
              of name. There is no case analysis and no breakpoint — the same rule
              produces the one-line answer and the four-line answer.

              ⚠ **`h-[1lh]` on the wrapper is what stops the last line growing.**
              An inline box taller than the line it sits in would push that line
              past the ones above it, and uneven leading in a wrapped title is the
              sort of thing you see without being able to name. The wrapper is
              exactly one line high — it inherits the heading's size and line
              height, so it follows the type step at 64rem without knowing the
              number — and the mark centres in it and overflows evenly, which costs
              the line box nothing.

              ─────────────────────────────────────────────────────────────────
               `align-middle` is not the middle the eye reads — 17 August
              ─────────────────────────────────────────────────────────────────

              Asked: *are we sure it sits optically in line with the words beside
              it?* We were not, and it did not. **`vertical-align: middle` centres
              a box on the x-height band by definition** — its whole meaning is
              *baseline plus half the x-height* — and a title set in title case is
              read against its **capitals**, not its x-height. The two bands do not
              share a centre: for IBM Plex Sans, cap height is 0.698em and
              x-height 0.516em, so the cap band's centre sits `(cap − x) / 2` —
              about 2px at 22px type — **above** where `align-middle` puts things.

              That is the correction, and it is written as the expression rather
              than as the 2px: `bottom: calc((1cap - 1ex) / 2)` on a relatively
              positioned box, which shifts it up by exactly that much. **`cap` and
              `ex` are the font's own metrics**, so this stays right at 28px type
              on a desk, and stays right if the face is ever changed — which a
              measured margin would not. It is the same move `--wordmark-drop`
              makes in globals.css: take the band the eye reads rather than the box
              the layout gives you.

              Relative positioning, so the shift is visual only and the line box is
              untouched — a margin would have moved the layout and grown the line.

              ⚠ **Also asked: which side is it on?** Whichever side the language
              ends its lines on. The mark is inline content in the heading, not a
              positioned element, so it flows — after the last word in English, and
              at the left of the last line in an RTL context, with nothing here
              needing to know which. Untested: nothing in this app sets `dir`, so
              this is a property of the construction rather than something that has
              been exercised.

              ⚠ `1lh`, `1cap` and `1ex` — `ex` is universal; the other two are
              Safari 16.4 and Chrome 109. Where either is not understood its
              declaration is dropped on its own: without `lh` the final line of a
              wrapped title is a few pixels taller than its siblings, without `cap`
              the mark sits where it did before this note. Degrades to slightly
              wrong, never to broken.

              ⚠ **`aria-label` on the heading, because the control lives in it
              now.** A heading takes its accessible name from its contents, so
              without this it would announce as *"The Zone of Interest, Want to
              see"* — the title welded to a button's label. The label pins the
              heading to the film's name; the button keeps its own name and stays a
              separate stop for anything navigating by control.
            */}
            <h2 className="title" aria-label={film.title}>
              {film.title}{' '}
              {/*
                ⚠ **The slot is drawn from the first frame and its contents are
                not.** `marks === null` is *not yet known*, and a `+` drawn then
                would be claiming the film is not on your list before anything has
                asked. The circle is there, so the line is laid out and the title
                never reflows around it; the glyph inside waits for the answer.

                The tick is green, and the green means *this is on your list*
                rather than *that worked*. See `--color-listed` in globals.css for
                what that distinction costs and why it is drawn that way round.
              */}
              <span className="pointer-events-auto relative bottom-[calc((1cap_-_1ex)/2)] inline-flex h-[1lh] items-center align-middle">
                <AddControl
                  state={marks === null ? 'unknown' : listedPrimary ? 'listed' : 'absent'}
                  label={specFor('film', primary).wantLabel}
                  undoable={Boolean(undoablePrimary)}
                  onAdd={() => add(primary)}
                  onUndo={() => undoablePrimary && undo(primary, undoablePrimary.entryId)}
                />
              </span>
            </h2>

            <p className="text-muted mt-2 text-sm">
              {/*
                Director, year, runtime — the three things that decide whether you
                want a film tonight, in the order you ask them. Joined with a
                middot rather than laid out in rows: they are one line of
                metadata, and three rows of one item each is a table of contents
                for nothing.

                §2 is the reason the list stops there. No rating, no score, no
                stars — the reference layout leads with 5.1/10 and that is exactly
                what this product does not do.
              */}
              {[
                details?.directors.length
                  ? `Directed by ${details.directors.join(', ')}`
                  : null,
                film.year ? String(film.year) : null,
                details?.runtime ? `${details.runtime} min` : null,
              ]
                .filter(Boolean)
                .join(' · ')}
            </p>
          </div>
        </div>

        {/*
          --- the synopsis, and the other intent ---------------------------

          **The word holds still and the writing moves under it**, directed
          17 August. The heading used to scroll away with its own paragraph, which
          made a long synopsis a wall of text with nothing naming it once you were
          three lines in.

          ⚠ **`min-h-0` on both this column and the scroller inside it, and it is
          the whole mechanism.** A flex item's automatic minimum size is its
          content, so a `flex-1` child with more text than room grows the column
          instead of scrolling — the overflow never happens, so `overflow-y-auto`
          has nothing to do and the artwork above gets squeezed instead. Setting
          the floor to zero is what lets the box be smaller than what is in it,
          which is the precondition for scrolling at all.

          The `gutter` sits on the heading and the scroller separately rather than
          on the column, so that the writing scrolls under a heading that is inset
          to the same line — and so the scrollbar, where there is one, lands at the
          pane's edge rather than inside the text.
        */}
        <div className="flex min-h-0 flex-1 flex-col pt-6">
          <h3 className="gutter micro text-muted shrink-0">Synopsis</h3>

          {/*
            `safe-bottom` is back on the scroller, because the scroller is the last
            thing in the column again — the *Close* that briefly sat under it is
            gone. There is no visible way out now: the artwork closes on a tap, and
            Escape closes from a keyboard. Same as `PosterReveal`, which has never
            had one either.
          */}
          <div className="gutter safe-bottom mt-3 min-h-0 flex-1 overflow-y-auto [--safe-bottom-base:1.5rem]">
            <p className="text-sm">
              {details === null ? '' : (details.synopsis ?? 'No synopsis for this one.')}
            </p>

            {/*
              Full strength, not `text-muted` — a failure set in the colour reserved
              for de-emphasised metadata reads as an aside. docs/decisions.md,
              8 August, and it has survived every surface this message has lived on.
            */}
            {error && <p className="mt-6 text-sm">{error}</p>}
          </div>
        </div>
      </div>
    </dialog>
  )
}

/**
 * The `+` on the artwork, and what it becomes.
 *
 * Three states and one box. `unknown` holds the space while the answer is in
 * flight, `absent` offers the add, `listed` marks it — and while §5.1's window is
 * open the mark is also the way back out, which is what let the acknowledgement
 * band go: the undo is under the finger that just added.
 */
function AddControl({
  state,
  label,
  undoable,
  onAdd,
  onUndo,
}: {
  state: 'unknown' | 'absent' | 'listed'
  label: string
  undoable: boolean
  onAdd: () => void
  onUndo: () => void
}) {
  /*
    ⚠ **`span`, not `div`, in both non-button states.** This control is inline
    content inside the `<h2>` now, and a heading takes phrasing content — a `div`
    there is invalid markup that browsers repair by guessing. `CONTROL` sets
    `display: flex`, so what the element is called changes nothing about how it
    draws.
  */
  if (state === 'unknown') {
    return <span aria-hidden className={`${CONTROL} opacity-40`} />
  }

  if (state === 'listed') {
    /*
      A button only while it can do something. §5 has no delete: after ten seconds
      this is a state marker, and a control that silently stops working would be
      worse than one that was never a control.
    */
    if (!undoable) {
      return (
        <span
          className={`${CONTROL} text-listed`}
          role="img"
          aria-label={`${label} — on your list`}
        >
          <TickIcon />
        </span>
      )
    }
    return (
      <button
        type="button"
        onClick={onUndo}
        aria-label="Undo"
        className={`${CONTROL} text-listed`}
      >
        <TickIcon />
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={onAdd}
      aria-label={label}
      className={`${CONTROL} text-text`}
    >
      <PlusIcon />
    </button>
  )
}

/*
  A `SecondaryIntent` lived here — the quiet *Want a copy* control under the
  synopsis — and it went with its call site on 17 August. Deleted rather than left
  unreferenced, for the reason the `return-count` utility was deleted from
  globals.css: a component with no callers is a component waiting to be reapplied
  by someone who does not know why it existed. The reasoning that would matter to
  whoever needs it back is at the top of this file, not here.
*/

/**
 * §11 permits known icons, and a plus is the known one for "add this". Same
 * inline-rather-than-a-package reasoning as `icon-close.tsx`, and `currentColor`
 * so the control's own state decides its colour.
 *
 * ⚠ **14px, following the box down on 17 August.** A plus is two strokes and no
 * interior, so it needs air around it to read as a mark rather than as a fill: at
 * 16px in a 24px box it left 4px a side and looked crowded. This holds roughly
 * the proportion it had at 28, which is what "smaller" was asking for — the
 * control, not the glyph inside it pressing against the corners.
 */
function PlusIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 12 12"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.25"
      strokeLinecap="round"
      aria-hidden="true"
      className="shrink-0"
    >
      <path d="M6 2.5v7M2.5 6h7" />
    </svg>
  )
}
