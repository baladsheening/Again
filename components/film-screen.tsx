'use client'

import Image from 'next/image'
import { useEffect, useRef, useState, useTransition } from 'react'

import { addFilmAction, undoEntryAction } from '@/app/actions/entries'
import type { FilmSearchResult, Intent } from '@/lib/domain'
import { posterUrl } from '@/lib/posters'
import { intentsFor, specFor } from '@/lib/vocabulary'
import { haptic } from './haptics'
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
 * The one circle on the artwork.
 *
 * ⚠ **No ring. It had one for a single commit and it is reverted** — a hairline
 * in `currentColor`, added on 17 August so the outline sat on the `+` rather than
 * on the close, and rejected on sight. The fill alone is the shape.
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
          */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 bottom-0 h-3/5 bg-gradient-to-t from-black via-black/70 to-transparent"
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
              An inline box 36px tall inside a 25px line would push that line
              taller than the ones above it, and uneven leading in a wrapped title
              is the sort of thing you see without being able to name. The wrapper
              is exactly one line high — it wears `title`, so it takes the
              heading's own size and line height and follows the type step at 64rem
              without knowing the number — and the circle centres in it and
              overflows evenly, which costs the line box nothing.

              `align-middle` puts that box's centre a half-pixel from the line's
              own centre. The alternative, baseline alignment, would hang it from
              the text's baseline and put it low again — which is what was reported
              of the previous arrangement, where a 36px circle's *top* met the line
              box's top and its centre landed five and a half pixels below the
              type's.

              ⚠ `1lh` is Safari 16.4 and Chrome 109. Where it is not understood the
              declaration is dropped, the wrapper takes its content's height, and
              the only cost is that the final line of a wrapped title is a few
              pixels taller than its siblings. Degrades to ugly, never to broken.

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
              <span className="pointer-events-auto inline-flex h-[1lh] items-center align-middle">
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

          <div className="gutter mt-3 min-h-0 flex-1 overflow-y-auto pb-5">
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

          {/*
            --- the way out ---------------------------------------------------

            **A word at the foot, not a circle on the poster.** It was a black
            disc in the artwork's top-left corner; this is where it landed on
            17 August, and the reasons are §11's rather than this screen's.

            **Type-first.** This app takes furniture *off* pictures — the lists
            lost their thumbnails for the same reason. A circle sitting on a
            poster is a control drawn on top of the one thing the screen is for;
            a word in the type column is a control where the app keeps its
            controls.

            **Thumb height.** The top-left corner of a large phone is the hardest
            place on the screen to reach one-handed, and it was holding the only
            visible way out. The foot is where a thumb already is.

            ⚠ **Outside the scroller, and that is the part that matters.** It is a
            sibling of the pane above rather than the last thing in it, so a long
            synopsis cannot push it below the fold. **A close you have to scroll
            to find is worse than one you cannot reach** — which is the failure
            this move would otherwise have swapped one for.

            No rule along the top: the ground does the separating, as it does
            under the masthead and over the collections bar. `components/profile-panel.tsx`
            makes the same call for the same reason.

            `micro`, so it reads as the app's caption tier rather than as a second
            action competing with the intents above it. Escape still closes, and
            always did — this is the affordance, not the mechanism.
          */}
          <div className="gutter safe-bottom shrink-0 [--safe-bottom-base:1.25rem]">
            <button
              type="button"
              onClick={() => ref.current?.close()}
              className="text-muted hover:text-text micro tap-target transition-colors"
            >
              Close
            </button>
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
