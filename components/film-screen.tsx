'use client'

import Image from 'next/image'
import { useEffect, useRef, useState, useTransition } from 'react'

import { addFilmAction, undoEntryAction } from '@/app/actions/entries'
import type { FilmSearchResult, Intent } from '@/lib/domain'
import { posterUrl } from '@/lib/posters'
import { intentsFor, specFor } from '@/lib/vocabulary'
import { haptic } from './haptics'
import { CloseIcon } from './icon-close'
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
 * ⚠ **Both intents survive, and that is not optional.** Intent is a property of
 * the entry (§4), and a `+` alone would have collapsed it to whichever one the
 * default happened to be. The primary is the `+` on the artwork; the secondary is
 * a quiet control under the synopsis. Which is what the sheet offered — the same
 * two things, without a modal, and now with the film in front of you when you
 * choose.
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
 * The two circles on the artwork.
 *
 * ⚠ **`black/70` and no blur, and both halves are deliberate.** These sit over
 * whatever the poster happens to be, so the ground has to be dark enough to carry
 * a stroke icon against a bright one. Measured against the worst case — a bright
 * poster with no scrim over it — the green tick reads 3.2:1 at 70%, 4.0 at 80%
 * and 1.7 at 50%, against the 3:1 WCAG 1.4.11 asks of a graphical control. **70%
 * is therefore near the floor and not a number to keep loosening by eye.**
 *
 * ⚠ **In practice both circles sit on ground that is nearly black anyway, and
 * that is worth knowing before this is tuned again.** Asked on 17 August for a
 * touch more see-through; it went 80 → 70. But the `+` moved onto the title's
 * line, which is inside the scrim's `from-black` end, so what shows through is a
 * poster that has already been taken most of the way to black. **If the point is
 * to see artwork through the control, the thing to change is the scrim's depth,
 * not this alpha** — going further here spends the contrast floor and buys almost
 * nothing visible.
 *
 * No `backdrop-blur`, because a blur clipped to a rounded border is the exact
 * combination WebKit has a history of rendering wrong, and a control that
 * sometimes has no ground is worse than one that is plainly opaque. The band at
 * the foot of the app is where glass belongs; this is a button.
 */
const CONTROL =
  'bg-black/70 tap-target flex size-9 shrink-0 items-center justify-center rounded-full'

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
  const [primary, ...secondary] = intentsFor('film')

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
    // Inside the gesture: iOS plays a haptic for a tap and not for what follows
    // one. See `haptics.tsx`.
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
      */
      className="m-0 h-full max-h-none w-full max-w-none bg-black p-0 text-text backdrop:bg-black"
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
          */}
          <div
            aria-hidden
            className="absolute inset-x-0 bottom-0 h-3/5 bg-gradient-to-t from-black via-black/70 to-transparent"
          />

          {/*
            --- the way out, on the artwork's top line -----------------------

            Alone up here since the `+` moved down to the title block on
            17 August. It keeps the corner rather than moving with it: closing is
            furniture, and furniture belongs at the edge of a screen, away from
            the thing the screen is about.
          */}
          <div className="gutter absolute inset-x-0 top-0 flex items-start pt-[calc(env(safe-area-inset-top)+0.75rem)]">
            <button
              type="button"
              onClick={() => ref.current?.close()}
              aria-label="Close"
              className={CONTROL}
            >
              <CloseIcon />
            </button>
          </div>

          {/* --- what it is, over the foot of the artwork --------------------- */}
          <div className="gutter absolute inset-x-0 bottom-0 pb-5">
            {/*
              **The `+` sits on the title's line, directed 17 August.** It has been
              in two places before this: the artwork's top right, opposite the
              close, which put the one thing this screen is *for* in the corner
              reserved for furniture; and under the credit line, which read as an
              afterthought to the metadata rather than as the action on the film.
              On the title's own line it is unambiguous — this is the film, and
              this is what you do about it.

              ⚠ **`items-start`, so a title that wraps does not move it.** The
              circle is 36px against a 25px line box, so aligning to the top puts
              it beside the *first* line and leaves it there whether the title runs
              to one line or three. `items-center` would have centred it against
              the whole block, which means the control's position would depend on
              the length of a film's name.

              ⚠ **Which is why the circle is centred inside a box one line tall
              rather than aligned to the row.** Reported: it sat low. It did, and
              the arithmetic says by how much — `items-start` puts a 36px circle's
              *top* on the line box's top, so its centre lands 18px down while the
              first line's centre is at 12.6px. Five and a half pixels below where
              the eye expects it, on the largest type in the app.

              The wrapper is `h-[1lh]` wearing `title`, so it is exactly one line
              of the heading beside it — the same font size, the same line height,
              and it follows the type step at 64rem without anything here knowing
              the number. The circle centres in that and overflows it evenly.
              **Derived, not measured**: a `mt-` of five-and-a-half pixels would be
              right at 22px type and wrong at 28px.

              What remains is about 1.5px: a line box holds room for descenders, so
              its centre sits a little below the cap-to-baseline band the eye
              actually reads. `--wordmark-drop` in globals.css is the same
              correction made explicitly, and is where to look if this still reads
              low. It is not made here because 1.5px does not earn a second number.

              ⚠ `1lh` is Safari 16.4 and Chrome 109. Where it is not understood the
              declaration is dropped, the wrapper takes its content's height, and
              the circle lands exactly where it did before — the old behaviour, not
              a broken one.

              ⚠ **No `justify-between`: the control follows the title rather than
              holding the right edge.** Asked for on 17 August — *bring it closer
              to the title*. Pushed to the gutter it was a control at the far side
              of the screen from the thing it acts on, and on a short name that is
              most of the width of a phone. The heading takes its own text's width
              and the circle sits at the end of it, so the pair reads as one line
              rather than as two ends of a row.

              A long title still wraps to the full column and the circle still ends
              up at the edge — the two cases have the same rule and only look
              different because the title's width differs, which is the right kind
              of difference to have.

              `min-w-0` on the heading because a flex child will not shrink below
              its content otherwise, and a long title would push the control off
              the gutter instead of wrapping.
            */}
            <div className="flex items-start gap-3">
              <h2 className="title min-w-0">{film.title}</h2>

              {/*
                ⚠ **The slot is drawn from the first frame and its contents are
                not.** `marks === null` is *not yet known*, and a `+` drawn then
                would be claiming the film is not on your list before anything has
                asked. The circle is there, so the layout is settled and the title
                beside it never reflows; the glyph inside waits for the answer.

                The tick is green, and the green means *this is on your list*
                rather than *that worked*. See `--color-listed` in globals.css for
                what that distinction costs and why it is drawn that way round.
              */}
              <span className="title flex h-[1lh] shrink-0 items-center">
                <AddControl
                  state={marks === null ? 'unknown' : listedPrimary ? 'listed' : 'absent'}
                  label={specFor('film', primary).wantLabel}
                  undoable={Boolean(undoablePrimary)}
                  onAdd={() => add(primary)}
                  onUndo={() => undoablePrimary && undo(primary, undoablePrimary.entryId)}
                />
              </span>
            </div>

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

          <div className="gutter safe-bottom mt-3 min-h-0 flex-1 overflow-y-auto [--safe-bottom-base:1.5rem]">
            <p className="text-sm">
              {details === null ? '' : (details.synopsis ?? 'No synopsis for this one.')}
            </p>

            <div className="mt-8 flex flex-col items-start gap-4">
              {secondary.map((intent) => (
                <SecondaryIntent
                  key={intent}
                  label={specFor('film', intent).wantLabel}
                  state={marks === null ? 'unknown' : marks[intent] ? 'listed' : 'absent'}
                  undoable={undoable?.intent === intent}
                  onAdd={() => add(intent)}
                  onUndo={() => {
                    if (undoable?.intent === intent) undo(intent, undoable.entryId)
                  }}
                />
              ))}
            </div>

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
  if (state === 'unknown') {
    return <div aria-hidden className={`${CONTROL} opacity-40`} />
  }

  if (state === 'listed') {
    /*
      A button only while it can do something. §5 has no delete: after ten seconds
      this is a state marker, and a control that silently stops working would be
      worse than one that was never a control.
    */
    if (!undoable) {
      return (
        <div className={`${CONTROL} text-listed`} role="img" aria-label={`${label} — on your list`}>
          <TickIcon />
        </div>
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

/**
 * The other intent — *Want a copy* for a film. A quiet text control rather than a
 * second circle on the artwork: §8 wants one prominent action and the rarer one
 * beneath it, which is what the sheet did and the only part of the sheet worth
 * keeping.
 */
function SecondaryIntent({
  label,
  state,
  undoable,
  onAdd,
  onUndo,
}: {
  label: string
  state: 'unknown' | 'absent' | 'listed'
  undoable: boolean
  onAdd: () => void
  onUndo: () => void
}) {
  if (state === 'unknown') {
    return <span aria-hidden className="text-muted text-sm opacity-40">{label}</span>
  }

  if (state === 'listed') {
    const mark = (
      <>
        <span className="text-listed">
          <TickIcon />
        </span>
        {label}
      </>
    )
    if (!undoable) {
      return (
        <span className="text-muted flex items-center gap-2 text-sm">
          {mark}
          <span className="sr-only"> — on your list</span>
        </span>
      )
    }
    return (
      <button
        type="button"
        onClick={onUndo}
        className="text-muted tap-target flex items-center gap-2 text-sm underline underline-offset-4"
      >
        {mark}
        <span className="sr-only"> — undo</span>
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={onAdd}
      className="text-muted hover:text-text tap-target text-left text-sm underline underline-offset-4 transition-colors"
    >
      {label}
    </button>
  )
}

/**
 * §11 permits known icons, and a plus is the known one for "add this". Same
 * inline-rather-than-a-package reasoning as `icon-close.tsx`, and `currentColor`
 * so the control's own state decides its colour.
 */
function PlusIcon() {
  return (
    <svg
      width="16"
      height="16"
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
