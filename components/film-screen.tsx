'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useLayoutEffect, useRef, useState, useTransition } from 'react'

import { addFilmAction, undoEntryAction } from '@/app/actions/entries'
import type { Route } from 'next'

import type { EntryState, FilmSearchResult, Intent } from '@/lib/domain'
import { claimFilmRequest } from '@/lib/film-request'
import { posterUrl } from '@/lib/posters'
import { PosterReveal } from './poster'
import { PosterTiles } from './poster-tiles'
import { paneQuery, touchQuery, useMatches } from './pointer'
import { WHERE_IT_IS, intentsFor, specFor } from '@/lib/vocabulary'
import { haptic } from '@/lib/haptics'
import { ChevronIcon } from './icon-chevron'
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
 * How much of the panel the artwork takes. **The panel's only, since 18 August.**
 *
 * It keeps two thirds because it was looked at and approved at that proportion,
 * and because a 24rem column is tall relative to its width — a half there would
 * leave the poster too small to be the thing you are looking at.
 *
 * ⚠ **A fraction of the parent, not of the viewport.** It was `h-[52svh]`, and
 * `svh` is the *screen*, which is not the same thing as the box this sits in —
 * the dialog is `h-full` today, so they agree, and they would stop agreeing the
 * moment anything gained a margin or the layout took an inset.
 *
 * ⚠ **There is no takeover twin any more, and its absence is the design.** The
 * handset ran `h-[52svh]`, then two thirds, then an even half — three numbers
 * for one question, each of them a choice about how much poster to show. The
 * poster now takes the width and whatever height 2:3 makes of it, and the words
 * are a panel over the rest: **the size of the artwork stopped being a decision
 * and became a consequence of the image.** Nothing to tune, and nothing that can
 * be wrong on a screen shape nobody has met.
 */
const ARTWORK_PANEL = 'h-2/3'

/**
 * The one mark beside the title.
 *
 * ⚠ **No ring. It had one for a single commit and it is reverted** — a hairline
 * in `currentColor`, added on 17 August so the outline sat on the `+` rather than
 * on the close, and rejected on sight. The fill alone is the shape.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 *  It was frosted glass for a day, and the day ended — 17–18 August
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * **This note is kept short on purpose, because the thing it described is gone.**
 * The control used to sit on the artwork over a scrim, and most of a day went into
 * making it read as frosted glass there: the fix turned out to be in the
 * *gradient* rather than the disc, since **frost is blurred content and a blurred
 * flat colour is that colour** — the scrim had to stop short of solid black so
 * that a fifth of the poster reached the control and the blur had something to
 * smear. The whole account is in git, at `9c467dd` and `a24fac8`.
 *
 * It ended when the words came off the poster on 18 August. There is no scrim, so
 * there is nothing behind this to blur, so `backdrop-blur-band` would be inert —
 * and the contrast floor it forced is gone with it. **The green tick was the number
 * to watch at 3.3:1 against the 3:1 WCAG 1.4.11 asks of a graphical control; on
 * flat black it is 6.0:1**, on every poster rather than on the kind ones.
 *
 * **What survives is `bg-text/8`, and its job changed.** It was the *floor* — the
 * least tint that kept the shape findable where the artwork behind it was dark.
 * With no artwork behind it, it is simply the fill. Warm rather than a cool
 * `white/8`, or the one filled control in the app would be the one thing in it
 * that is not warm.
 *
 * ⚠ **If the `+` is ever put back on the poster** — a parked want, see
 * `docs/plan.md` — the frost, the scrim and the floor come back together or not at
 * all. Do not restore one part and expect the control to read.
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
  'bg-text/8 tap-target flex size-6 shrink-0 items-center justify-center rounded-md'

/**
 * The same box when it is something you can press — directed 18 August, for a
 * mouse: the `+` gave no sign it was a control until you clicked it.
 *
 * ⚠ **Only the two states that are buttons wear this.** `CONTROL` is also the
 * settled tick and the empty box for *not yet known*, and lifting those under a
 * cursor would promise a press that does nothing. The difference between a
 * control and a marker is the whole of §5's argument for the tick ceasing to be
 * a button after ten seconds.
 *
 * ⚠ **`hover:` is not a desktop branch.** Tailwind wraps it in `(hover: hover)`,
 * so a finger cannot leave a control stuck in its hover state — which is the
 * usual reason a mouse affordance goes wrong on a phone. `cursor-pointer` is
 * needed outright: Tailwind's reset leaves a `<button>` on the default arrow.
 *
 * The lift is `bg-text/8` → `/16`, doubling a ground that is already faint. No
 * colour change: amber is overlap and `--color-listed` is *on your list* (§11),
 * and neither of those is *your mouse is here*.
 */
const CONTROL_PRESSABLE = `${CONTROL} cursor-pointer transition-colors hover:bg-text/16`

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
type Marks = Partial<Record<Intent, { entryId: string | null; state: EntryState }>> | null

export function FilmScreen({
  film,
  open,
  onClose,
  takeFocus,
}: {
  film: FilmSearchResult
  /**
   * ─────────────────────────────────────────────────────────────────────────
   *  ⚠ Mounted is no longer the same as open — 21 August
   * ─────────────────────────────────────────────────────────────────────────
   *
   * `capture-provider.tsx` used to unmount this screen on close, so every open
   * rebuilt the whole tree, re-rastered two blurs and re-decoded a poster.
   * Measured on a throttled phone profile: **237ms for the first open, 140 for
   * the second, 92 for the third** — the difference is warmth, and unmounting
   * threw it away every time. It stays mounted now and this prop says whether
   * it is showing.
   *
   * ⚠ **Three effects here read *mounted* and meant *open*, and all three are
   * now guarded.** The one that opens the dialog, the one that locks the
   * document behind the takeover — which would have left the wall unscrollable
   * after every close — and the Escape listener, which would have answered a
   * key pressed anywhere in the app. Anything added here must ask the same
   * question: does this belong to the screen existing, or to it being looked at?
   */
  open: boolean
  onClose: () => void
  /**
   * Whether a person asked for this screen. False when the page put it there —
   * see the two verbs in `capture-provider.tsx`. It decides one thing: whether
   * opening moves the keyboard's focus into it.
   */
  takeFocus: boolean
}) {
  const ref = useRef<HTMLDialogElement>(null)
  /* Which shape it is open in, and whether the next `close` is ours — see below. */
  const mode = useRef<'panel' | 'takeover' | null>(null)
  const reopening = useRef(false)

  /*
    Whether there is room to stand beside the wall rather than cover it. The number
    is `--breakpoint-pane` in globals.css and is read from there rather than
    repeated here — a width that lives in two files is a width that will disagree
    with itself.
  */
  const pane = useMatches(paneQuery)

  /*
    ⚠ **Two axes, and they answer different questions — settled 18 August after
    getting it wrong in both directions on the same evening.**

    **Shape decides the ARRANGEMENT.** `overlay` is *is this a tall narrow screen
    where a poster nearly fills the width, so the words have nowhere to go but
    over it.* That is what the glass panel, the chevron and the full-screen
    picture are a response to, and a maximally narrowed desk window has exactly
    that shape. So it is `!pane` — a width — and a narrow window is a real preview
    of the phone's layout again.

    **The pointer decides the TYPOGRAPHY.** `touch` is *is this being handled with
    a thumb.* The mono synopsis was asked for on the phone and the printing on the
    desk, and neither is about how tall the window is. See `touchQuery`.

    ⚠ **The wrong version of this put BOTH behind the pointer**, which took the
    arrangement away from a narrowed window along with the typography — five
    things moved when two were asked for. The version before that put both behind
    the width, which put the phone's typography on the desk. Neither axis alone
    is enough, and the mistake each time was using one signal for two questions.
  */
  const touch = useMatches(touchQuery)
  const overlay = !pane

  /*
    Whether the words have been pushed off the bottom to leave the poster whole
    — the overlay's only, and it lives here rather than in `FilmBody` because
    the surface that brings them back is the picture, which is the screen's.
  */
  const [receded, setReceded] = useState(false)


  /*
    `showModal()` rather than an `open` attribute, and a `<dialog>` rather than the
    hand-built overlay the intent sheet was. It brings focus containment, the
    inertness of everything behind it and Escape for nothing, all of which the
    sheet did by hand and did partially — `PosterReveal` in `poster.tsx` reached
    the same conclusion first.

    ⚠ **There was a `close()` in the cleanup here and it made this screen
    impossible to open in development.** A `<dialog>` fires `close` however it was
    closed, and `onClose` clears the state that renders this component — so the
    cleanup was asking to be unmounted. React runs every effect twice in
    development (mount, clean up, mount again) to surface exactly this kind of
    self-dependency, and it did: mount showed the dialog, the cleanup closed it,
    the close event unmounted the screen, and the second mount had nothing left to
    show. Nothing was wrong in production, where effects run once — which is why
    it went unseen, and it would have stayed unseen for as long as the dev server
    could not reach TMDB.

    **The cleanup is gone rather than guarded, because it never had a job.**
    Removing an open modal from the document takes it out of the top layer by
    itself, and React removes it the moment this component unmounts. A flag saying
    *this close is the machinery, not the person* was tried first and cannot work:
    `close` is dispatched asynchronously, so the second mount clears the flag
    before the event it was set for arrives.

    `if (!dialog.open)` is what the removal costs, and it is the whole cost:
    `showModal()` on a dialog that is already modal throws, and after the cleanup
    stopped closing it, the second mount meets one.
  */
  /*
    `show()` beside the wall, `showModal()` over it — see the class list in the
    render for why that is the whole of the difference between the two.

    **It re-runs when the width crosses `pane`**, because a dialog cannot be moved
    between the page and the top layer while it is open: rotating a tablet with a
    film open has to close it and open it again in the other mode. Without that,
    crossing upward leaves a 24rem panel wearing a full-screen backdrop, with the
    wall visible behind it and unclickable.

    ⚠ **Closing to re-open fires `close`, and `onClose` unmounts this screen.** The
    ref says which kind of close it was, and the handler *consumes* it — that is
    what makes it work where the same idea failed for the unmount case above.
    `close` is queued rather than dispatched, so a flag that is only ever set
    immediately before a close we caused is still true when that close arrives, and
    is cleared by the handler that reads it.
  */
  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return

    /*
      ⚠ **Closed means closed, and this line is what makes that true for the
      panel.** The takeover is modal and the platform dismisses it — Escape or
      the button call `close()`, the event lands, and `open` goes false as a
      consequence. The panel is `show()`, which the platform never dismisses:
      `onClose` used to close it by *unmounting* it, and nothing unmounts any
      more. Without this the desk panel stayed on screen with `open` false,
      which is the whole feature failing in the one mode it is not obvious in.

      Flagged as ours so the `close` event it fires is not read as a person
      closing something that is already closed.
    */
    if (!open) {
      if (dialog.open) {
        reopening.current = true
        dialog.close()
      }
      return
    }

    const wanted = pane ? 'panel' : 'takeover'
    if (mode.current === wanted && dialog.open) return

    if (dialog.open) {
      reopening.current = true
      dialog.close()
    }

    mode.current = wanted
    if (pane) dialog.show()
    else dialog.showModal()

    /*
      ⚠ **A screen the page opened gives the focus straight back.** Both `show()`
      and `showModal()` run the dialog focusing steps regardless of what opened
      them, so the wall's first film — presented on arrival, not chosen — landed
      the keyboard on this screen's *Close* button. The first Tab or Enter on a
      fresh page would have shut something nobody opened.

      **Handing it back is the whole correction: blur, and focus returns to the
      document**, which is where a page that has just loaded should start. There
      is nothing to restore it *to* — this runs on arrival, when nothing was
      focused — so remembering a previous element would be remembering `body`.

      Guarded by `contains`, so it can only ever undo a focus this call caused.
    */
    const focused = document.activeElement
    if (!takeFocus && focused instanceof HTMLElement && dialog.contains(focused)) {
      focused.blur()
    }
  }, [open, pane, takeFocus])

  /*
    Escape, which a modal dialog gets from the platform and a panel does not. One
    listener, and only in the mode that lacks it — the takeover would end up
    closing twice.
  */
  useEffect(() => {
    if (!pane || !open) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, pane, onClose])

  /*
    ⚠ **The effect that reserved the panel's room is DELETED — 20 August.** It set
    `--pane-open` on the root here and cleared it on the way out, which made the
    wall reflow from six columns to four the moment a poster was tapped and back
    again on close. The room is permanent now and belongs to the route rather than
    to this component: `pane-inset` in globals.css, put on by the shell on the
    wall's route. **This screen no longer has an opinion about the page's width**,
    which is the right amount for it to have. Do not reinstate the property to
    make some future surface move — a panel that changes the layout under the
    thing that opened it is the fault that was removed.
  */

  /*
    ───────────────────────────────────────────────────────────────────────────
     The wall is where you left it — 17 August, and actually so since the 18th
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

    **This does not care how the page moved: it takes the range away**, so there
    is nowhere for any of those routes to arrive. Two lines, in the order they
    matter:

    1. **The document has no scroll range while the screen is open.** `body` goes
       out of flow, and an out-of-flow box contributes nothing to its ancestors'
       scrollable overflow — so the range is not *refused*, it does not exist.
       There is nothing left for an engine to be lenient about.
    2. **The position is carried across it.** Taking the content out of flow
       forces `scrollY` to zero, so `top: -y` holds the page where it was for as
       long as the screen is open, and `scrollTo` puts it back on the way out.

    ───────────────────────────────────────────────────────────────────────────
     `overflow: hidden` on the root was the whole of line 1, and it was not
     enough — 18 August
    ───────────────────────────────────────────────────────────────────────────

    Reported from the handset: with a poster open, **a short indicator appeared
    partway down the right edge and moved under a drag** — over the artwork,
    where nothing scrolls.

    **Every box between that finger and the viewport was walked, and none of them
    can scroll.** The artwork block and this dialog are `overflow-hidden`; the
    column between them never sets `overflow`, and a `visible` box is not a scroll
    container; and the synopsis pane — the one thing on this screen that really
    does scroll — is a *sibling* of the artwork rather than an ancestor, so a
    gesture on the poster cannot reach it. Chaining goes up, never across, which
    is also why `scrollbar-none` sitting on that pane alone was never the gap.

    **So the indicator was the document's, and its shape said so twice over.** A
    stub means a long scroller, and the wall is many screens tall; *partway down*
    means it knew where you were.

    ⚠ **`overflow: hidden` on the root removes the user's ability to scroll, not
    the range.** A clipped scroller keeps its scrollable overflow, which is
    exactly what was left for an indicator to describe. Whether iOS was then
    honouring the lock and drawing a bar for a scroller nobody could move, or
    defeating it and letting the wall drift while line 2 quietly put it back,
    **the two readings share a cause and a cure**: a range that should not have
    been there. Line 1 no longer leaves one.

    ⚠ **Which means line 2 changed jobs, and it is worth knowing which.** It was
    a backstop — *the first line is why nothing moves, the second is why it does
    not matter if it does* — and a backstop is what let a broken lock ship
    looking fine. **A guard built beside a cure hides whether the cure works**:
    globals.css says it about the last lock and it was true again about this one.
    It is not a guard now, it is the mechanism that keeps the page's position
    while the flow it lived in is gone.

    ⚠ **This is the fixed body globals.css records removing on 13 August, and the
    reason it is safe here is the reason written there.** What it cost was
    Safari's address-bar collapse and pull-to-refresh — both responses to the
    *document* scrolling, and neither of them means anything under a modal that
    covers the viewport. It went out because it was permanent. This one lives as
    long as one screen is open.

    ⚠ **`left`/`right` rather than a width.** A fixed box shrinks to fit without
    them, and the wall behind would reflow to its widest row while nobody can see
    it, then reflow back on close — having moved the thing line 2 is trying to
    put back.

    ⚠ **Leaving the flow is itself a scroll event, and so is coming back.**
    Neither is a gesture, and the masthead in `shell.tsx` differences one scroll
    against the last — see the note on the scroll range there, which re-baselines
    across a change of shape rather than reading it as a flick.

    `behavior: 'instant'` because `html` sets `scroll-behavior: smooth`, and a
    restore is not a journey — smooth would animate the wall back under you.

    Written through the CSSOM rather than as a class, and that is a CSP
    requirement rather than a preference: `style-src` has no `unsafe-inline`, so
    a rendered `style` attribute is dropped in production while `el.style.x` from
    JS is untouched. See the note on `wordmark-trim` in globals.css.
  */
  useEffect(() => {
    /*
      ⚠ **Only the takeover locks the document.** Beside the wall the whole point
      is that the wall still scrolls, and the objective this lock exists for —
      *you should not find yourself somewhere else when you close it* — is not at
      risk when you can see where you are the entire time.
    */
    if (pane || !open) return

    const root = document.documentElement
    const body = document.body
    const y = window.scrollY

    const previous = {
      overflow: root.style.overflow,
      position: body.style.position,
      top: body.style.top,
      left: body.style.left,
      right: body.style.right,
    }

    root.style.overflow = 'hidden'
    body.style.position = 'fixed'
    body.style.top = `${-y}px`
    body.style.left = '0'
    body.style.right = '0'

    return () => {
      root.style.overflow = previous.overflow
      body.style.position = previous.position
      body.style.top = previous.top
      body.style.left = previous.left
      body.style.right = previous.right
      window.scrollTo({ top: y, behavior: 'instant' })
    }
  }, [open, pane])

  return (
    <dialog
      ref={ref}
      onClose={(event) => {
        /*
          ⚠ **React makes `close` propagate where the platform does not, and it
          cost this screen its own life.** `close` is a non-bubbling event: a
          native listener here would never hear a *nested* dialog close. React
          delegates from the root and dispatches along the **React tree**, so the
          full poster opened by `PosterReveal` — which is rendered inside this
          dialog — closed this one with it. Expanding the poster and dismissing it
          took the whole film screen back to the wall.

          **This is the same lesson `shell.tsx` records from the other side**, where
          a portalled dock's taps arrived at a handler on `#scroll-root` because
          React propagates through the component tree rather than the DOM. There
          it added listeners the DOM would not have; here it adds propagation the
          DOM does not have. Ask the event which element it happened to.
        */
        if (event.target !== ref.current) return

        /*
          Consumed, not merely read: this flag is set immediately before a close
          this component caused, so the first `close` to arrive after it is that
          one. Clearing it here is what stops the next real close being swallowed.
        */
        if (reopening.current) {
          reopening.current = false
          return
        }
        /*
          Closing forgets that the words were pushed away. Unmounting used to do
          this for free; now that the screen survives a close, the next opening
          has to start where every opening starts — with the words up.

          Here rather than in an effect on `open`, and not only because
          `react-hooks/set-state-in-effect` says so: this is the event that
          means it. The reopening case above returns before this line, which is
          right — a mode switch is not a close and must not reset anything.
        */
        setReceded(false)
        onClose()
      }}
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

        A unit narrower than the layout viewport is what fixes that, so there is
        nothing left over to scroll. `overflow-hidden` is the guarantee rather
        than the fix: whatever any engine decides the height should be, this
        element is never a scroll container, so it can never indicate or absorb a
        gesture again.

        ─────────────────────────────────────────────────────────────────────────
         Why it is not `dvh` — measured on the handset, 18 August
        ─────────────────────────────────────────────────────────────────────────

        ⚠ **This was `h-dvh`, and `dvh` is not stable across this screen
        opening.** Reported: the title, credit line and synopsis jump *upward* as
        the screen arrives, installed only. Two frames from the instrument that
        settled it, 45ms apart:

            24ms  dvh844 svh797 lvh844 win844 vv844 dlg844 syn521
            69ms  dvh797 svh797 lvh844 win797 vv797 dlg797 syn497

        `dvh` falls 844 → 797 — the 47px status-bar band, the same number
        `shell.tsx` adds back below. `svh` and `lvh` hold still through it, so
        the dynamic unit is the only one that moves. The artwork is a **fraction**
        of this box, so the box losing 47 takes 23.5 off the artwork and lifts
        everything under it by that much: `syn` moved 24. Symptom and measurement
        are the same number.

        **The old note here argued `dvh` was safe because only Safari's address
        bar moves it and the document is locked while this is open. That argument
        is dead** — this was reported *installed*, where there is no address bar,
        and it moved anyway. Do not restore it on that reasoning.

        ⚠ **`svh` alone would be wrong in the other direction**, and this file
        would be the third place to learn it: installed, `100svh` is the screen
        *less* that band, so the box would end 47px short. The inset is added
        back, which is `shell.tsx`'s existing expression rather than a new one —
        844 installed, and a no-op in a tab, on Android and at the desk where the
        inset reads 0. Two constants, so the box cannot change size under a
        screen that is already open.
      */
      /*
        ─────────────────────────────────────────────────────────────────────────
         Above `pane` it stands beside the wall instead of covering it — 18 August
        ─────────────────────────────────────────────────────────────────────────

        **Directed: at desk and tablet-landscape widths the film sits beside the
        wall and the wall stays live**, so tapping another poster swaps what is in
        the panel rather than closing anything.

        ⚠ **The expensive reading of that is wrong, and it is worth saying why.**
        It sounds like "make the dialog non-modal", which means hand-building the
        four things `<dialog>` was chosen for — focus containment, inertness,
        Escape, and dismissal by tapping outside. **Three of them are things a live
        wall must not have.** A panel beside the page does not trap focus, does not
        make the page inert, and is emphatically not dismissed by clicking the
        page, because clicking the page is how you change what it shows. Only
        Escape survives, and Escape on a non-modal dialog is one listener — see the
        effect above.

        So this stays one element with one set of children, and the mode is data:
        `show()` puts it in the page, `showModal()` puts it in the top layer, and
        the class list says which shape it takes. **Two behaviours, no second
        component and no second copy of the screen to keep in step.**

        ⚠ **The panel is the rail's mirror.** `right: max(0px, 50% - 36rem)` is the
        rail's own expression with the side flipped, so on a wide screen the panel
        sits at the band's edge rather than the glass's and the composition stays
        centred. The room it takes out of the page is `pane-inset` in globals.css,
        driven by a custom property — the shell never learns this exists.

        `z-30` because a dialog outside the top layer is an ordinary positioned
        element again, and the masthead is `z-20`.
      */
      data-film-panel={pane ? '' : undefined}
      className={
        pane
          ? /* `left-auto` because a `<dialog>`'s UA style pins both edges to zero,
               and a left of zero beats a right of anything. */
            /* ⚠ **No `overflow-hidden` here, unlike the takeover — 20 August.**
               The `+` is a disc centred on the picture's bottom-right corner, and
               the picture is flush with this panel's own right edge, so half the
               disc is outside this box by construction. Clipping it left a
               half-moon. The takeover keeps its clip: there the reason is `svh`
               and a box that must never become a scroll container, which is a
               different argument for the same word — see the note above.

               ⚠ **It used to cost a band of window widths, and that band no
               longer exists — 21 August.** This sits at
               `max(0px, 50% - 36rem)`, so between 1152 and the breakpoint there
               was less than the disc's radius between the panel and the viewport
               and the window cut the far half off instead. The band was 28px wide
               when the disc was 1.75rem and would be 32px now that it is 2rem —
               **a number that grows with the control is a number nobody should
               be maintaining**, which is why neither the band nor the boundary is
               written here.

               **The answer is that those are not panel widths any more.**
               `--breakpoint-pane` is the band's cap plus `--pane-corner` — the
               disc's whole diameter — so by the time this element exists, the
               margin its overhang needs exists too. Nothing here clips, insets
               or nudges to make that true: a window too narrow to hold the
               control gets the takeover, which does not draw it. See the
               breakpoint's own note in globals.css. */
            'fixed top-0 left-auto right-[max(0px,calc(50%_-_36rem))] z-30 m-0 h-[calc(100svh_+_env(safe-area-inset-top))] max-h-none w-(--pane-column) max-w-none bg-black p-0 text-text'
          : 'm-0 h-[calc(100svh_+_env(safe-area-inset-top))] max-h-none w-full max-w-none overflow-hidden bg-black p-0 text-text backdrop:bg-black'
      }
    >
      {/*
        `max-w-md` and centred. Above `rail` a takeover the width of a desk would
        be a poster stretched across a metre of screen; below it the cap is wider
        than any phone and does nothing. One layout, one class, right at both ends
        — the same move the acknowledgement band makes at its own breakpoint.

        ⚠ **The column and the picture belong to the screen; only the words are
        keyed.** See `Artwork` for why the element holding the poster is the one
        thing here that must survive a change of film.
      */}
      {!overlay ? (
        /*
          The panel beside the wall: words under the artwork on flat black, the
          picture a share of the column, nothing receding. Only reached at `pane`
          widths now — a narrowed window is a tall narrow screen and gets the
          overlay, whatever is pointing at it.
        */
        <div className="mx-auto flex h-full w-full max-w-md flex-col">
          <Artwork
            posterPath={film.posterPath}
            title={film.title}
            overlay={false}
            touch={touch}
            receded={false}
            dialogRef={ref}
          />
          <FilmBody
            key={film.externalId}
            film={film}
            overlay={false}
            touch={touch}
            handle={null}
            dialogRef={ref}
          />
        </div>
      ) : (
        <div
          /*
            ⚠ **`overflow-hidden` is the band's edge, and it is the column's own
            job rather than the band's.** Reported 20 August: the blur bled past
            the panel either side. The cause is the `scale-110` two blocks down,
            which is deliberate and must stay — a blur samples past its element's
            edges, so an unscaled copy fades out at all four sides. The two are
            not in conflict once this is here: **the scale gives the blur
            something to sample, the clip decides where it stops.**

            It says the true thing about this box rather than correcting one
            child — nothing in the takeover paints outside the column, at any
            width and whatever a future child's filter reaches for. Removing the
            collision rather than tuning the overhang, which is what a smaller
            scale would have been: 110% is not a number to trade against a
            visible edge, it is what stops the vignette.
          */
          className="@container relative mx-auto h-full w-full max-w-md overflow-hidden"
        >
          {/*
            ─────────────────────────────────────────────────────────────────────
             The surround: blurred under a cursor, black under a thumb
            ─────────────────────────────────────────────────────────────────────

            The question both answer has no third answer: a 2:3 poster and a 0.46
            screen are different shapes, so *whole* and *full-bleed* are mutually
            exclusive for the picture, and the chevron exists to make it whole. So
            when the words are away there is room left over, and something has to
            be in it.

            ⚠ **Two rulings, one for each surface, and this is the only place they
            disagree about the same pixel.** On a narrowed desk window it is **the
            same image, out of focus**, so the screen is full: cover-scaled,
            `blur-2xl`, at 70% so the sharp one in front stays the subject.

            ⚠ **On the handset it was black until 21 August, and is now the same
            image *tiled*, out of focus** — directed, and the reason the two
            differ is the shape of the room rather than the machine. A narrowed
            desk window leaves the poster short of the screen's height with room
            to crop *to*, so one cover-scaled copy fills it. On the handset the
            picture already spans the width, so there is nothing to crop to and
            only bands to continue into: the fill has to be the same picture
            repeating, or it is a second image nobody asked for. Same blur, same
            70%, and `poster-tiles.tsx` carries both numbers across so the two
            surfaces are out of focus by the same amount.

            **Neither needs state**, for the same reason: at rest the sharp
            poster covers the screen and the surround is invisible, so what
            reveals it is the same chevron that makes room for it.

            ⚠ **`inset-0` here is the COLUMN, not the screen.** This sits inside
            the `max-w-md` box two elements up, so the band is already the panel's
            width running the full height of the screen, with flat black either
            side of it at every width above 448. Asked for explicitly on 20 August
            and already the case — the answer was a `relative` somewhere else, not
            a change here. **Do not "fix" this into a screen-wide surround.**

            ⚠ **`w342`, deliberately.** It is the size the wall already fetched, so
            this costs no request at all, and there is no resolution left to see
            after that blur. Asking for the large one would double the bytes of
            every film opened to make an invisible difference.

            ⚠ **`scale-110` is not decoration.** A blur samples past the element's
            edges, where there is nothing, so an unscaled copy fades out at all
            four sides and reads as a vignette nobody asked for. **Its overhang is
            clipped by the column, not sized to fit** — see the `overflow-hidden`
            argued on that element. Do not shrink this to keep the blur inside.

            It needs no state: at rest the sharp poster covers the screen and this
            is invisible, so what reveals it is the same thing that makes room for
            it. That is also why it has no bearing on the panel's contrast floor —
            nothing is ever read against it.
          */}
          {!touch && posterUrl(film.posterPath, 'w342') && (
            <Image
              src={posterUrl(film.posterPath, 'w342') as string}
              alt=""
              aria-hidden
              width={342}
              height={513}
              className="absolute inset-0 h-full w-full scale-110 object-cover opacity-70 blur-2xl"
            />
          )}
          {/*
            No `align`, because here the picture spans the column by
            construction — `Artwork` is `inset-x-0` and receded is `150cqw`, so
            the tile is the column's width and its height is that times 1.5,
            which is the receded box exactly. Nothing to measure against.
          */}
          {touch && <PosterTiles src={posterUrl(film.posterPath, 'w342')} shown />}
          <Artwork
            posterPath={film.posterPath}
            title={film.title}
            overlay
            touch={touch}
            receded={receded}
            dialogRef={ref}
          />

          {/*
            ⚠ **One surface, two meanings, and the meaning is the state — the
            way back, chosen 18 August.** Directed: the chevron takes the panel
            *fully* off the bottom, so at the end of that travel there is
            nothing left on screen but the poster and nothing left to grab.

            A tap on the picture has closed this screen since 17 August and
            still does — while the panel is up. With the panel away the same
            surface brings it back, because the alternative was inventing a
            floating control that would sit on the poster the gesture exists to
            clear. **Its label changes with it**, so a keyboard and VoiceOver
            reach the way back exactly as a finger does — which a swipe never
            would, and this project's gesture record is 0 for 2.

            The two are also in a sensible order: the tap always undoes the last
            thing you asked for. Poster alone → the words back → the wall.
          */}
          <button
            type="button"
            onClick={() => (receded ? setReceded(false) : ref.current?.close())}
            aria-label={receded ? 'Show the details' : 'Close'}
            className="absolute inset-0"
          />

          {/*
            ⚠ **The panel is glass over the poster, which is a reversal of this
            morning and is directed.** `f6f479b` took the writing off the
            picture and deleted the scrim, the frost and the contrast floor with
            it, on the argument that legibility must not be a function of which
            film you tapped. `docs/plan.md` parked the return with one
            condition — **restore the whole recipe or none of it** — so the
            ground below is measured rather than chosen, and it is what keeps
            that argument true with the words back over the artwork.

            ⚠ **Three siblings, never nested.** An element with a
            `backdrop-filter` is a backdrop root, so a child of it has no page
            left to blur — measured at 0.0 difference in August. The blur, the
            ground and the words are siblings, and only the words are `relative`.

            The travel is `translate-y-full`, which is this box's own height and
            therefore exactly the distance to the bottom edge — no number to
            keep in step with `top-1/2`, and none to be wrong on a screen nobody
            has measured. `inert` because a panel that has left the screen
            should not still be in the tab order.
          */}
          <div
            inert={receded}
            className={`absolute inset-x-0 top-1/2 bottom-0 flex flex-col overflow-hidden transition-transform duration-300 ${
              receded ? 'translate-y-full' : 'translate-y-0'
            }`}
          >
            <div className="absolute inset-0 backdrop-blur-2xl" />
            {/*
              ⚠ **80% is derived, not chosen, and the tick is what derives it.**
              Measured over a **pure white** poster — the worst backdrop that can
              exist, rather than the brightest one TMDB happens to serve — the
              ground behind the words is `255 × (1 − alpha)`. At the 72% this was
              first written with, that is rgb(70) and `--color-listed` lands at
              **2.69:1 against a 3:1 minimum**: the same failure the old scrim had
              at 3.3:1, which is why `f6f479b` deleted the whole arrangement.

              At 80% the ground is rgb(51) and the three numbers are the tick at
              **3.61:1**, the credit line and the stamp at **4.72:1** against 4.5,
              and the title at **9.99:1**. Those hold on *every* poster, because
              nothing can be brighter than the one they were measured on.

              **So the glass is 20% of the picture, and that is the whole of what
              the picture may contribute.** If this is ever lightened for looks,
              the tick is the number that runs out first — and it runs out
              silently, on somebody else's film.
            */}
            <div className="bg-bg/80 absolute inset-0" />

            <div className="relative flex min-h-0 flex-1 flex-col">
              {/*
                ⚠ **The handle is in the title's row now, at the right — directed
                18 August, and it is the third position for it.** It was a
                full-width band above the words, centred like a sheet's grabber;
                before that the band was 32px with the title's padding under it.
                Neither was asked for again.

                ⚠ **`title` on the button is for its METRICS, not its type.** The
                button holds an svg, so the face, the tracking and the balance are
                inert — what it is there for is `line-height: 1.15` against
                `--text-title`, which makes `h-[1lh]` exactly one line of the
                heading beside it. The chevron then centres on that line at any
                type size, including the step at 64rem, without a number here.
                Same reasoning as the `+`'s `h-[1lh]` wrapper two blocks down; the
                difference is that the `+` is inline content and this is a flex
                child, so it takes the line's height rather than sitting in it.
              */}
              <FilmBody
                key={film.externalId}
                film={film}
                overlay
                touch={touch}
                dialogRef={ref}
                handle={
                  <button
                    type="button"
                    onClick={() => setReceded(true)}
                    aria-label="See the whole poster"
                    className="title text-muted hover:text-text tap-target flex h-[1lh] shrink-0 cursor-pointer items-center transition-colors"
                  >
                    <ChevronIcon className="rotate-90" size={16} />
                  </button>
                }
              />
            </div>
          </div>
        </div>
      )}
    </dialog>
  )
}

/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  Everything that belongs to one film, in a component whose identity is that
 *  film — 18 August
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * **Reported at the desk: tap a second poster and the new title, credit line and
 * synopsis arrive while the previous film's picture is still there.** Keying the
 * artwork answered the picture, and looking for why exposed the rest of it.
 *
 * Beside the wall this screen is never remounted — `capture-provider.tsx` swaps
 * the `film` prop — so **nothing here was ever reset**. For as long as the new
 * film's request was in flight you were reading the last film's director, its
 * synopsis and its **marks**: a green *already on your list* tick belonging to a
 * film you had left. The fetch below calls the marks the one thing on this
 * screen that can be wrong in a way you act on, and a swap made it exactly that.
 * `undoable` and `error` crossed the same gap, and a slow add on one film landed
 * in the next one's state.
 *
 * **The cheap answer is four `setX(null)` calls at the top of the fetch, and it
 * is the shape this repository has already reverted twice** — a list that has to
 * be complete, whose fifth entry is missing silently. So the boundary moved
 * instead. The `<dialog>`, the mode it is open in and the document it locks
 * belong to *the screen* and stay mounted; everything that describes *a film*
 * lives here, under `key={film.externalId}`. A change of film destroys this and
 * builds it again, so stale state is not cleaned up — **it cannot be held**.
 *
 * ⚠ **The dialog deliberately does NOT carry the key.** `open` is imperative
 * here — `show()` and `showModal()` from an effect, never an attribute — so a
 * remounted `<dialog>` paints one frame closed, and every tap along the wall
 * would blink. The split is what lets the element survive while its contents do
 * not.
 *
 * ⚠ **`dialogRef` rather than an `onClose` prop.** The artwork closes by calling
 * `close()` on the element and the screen's own handler decides what that means.
 * A child closing the screen through a callback would be a second route to the
 * same place, and this file already records what two routes cost.
 */
function FilmBody({
  film,
  overlay,
  touch,
  handle,
  dialogRef,
}: {
  film: FilmSearchResult
  /*
    Whether these words are glass over a poster rather than a block under one —
    a question about the screen's shape.
  */
  overlay: boolean
  /* Whether a thumb is doing this, which is what decides the typography. */
  touch: boolean
  /*
    The screen's own control, dropped into the title's row. It is passed rather
    than built here because what it does — putting these words away — is a fact
    about the screen and not about the film, and this component is rebuilt every
    time the film changes. `null` beside the wall, where nothing recedes.
  */
  handle: React.ReactNode
  /*
    ⚠ **The screen has to be closed before this navigates, and only this element
    can do it — 21 August.** `CaptureProvider` is in `app/(app)/layout.tsx`, above
    every route, so the screen **survives a client navigation**: the settled
    tick's link went to `/wants` and left the film open on top of it, still
    holding the document's scroll lock. The collection arrived frozen under a
    poster.

    The same ref `Artwork` already takes, for the same reason: a `<dialog>` is
    dismissed by closing it, not by hoping whatever rendered it notices.
  */
  dialogRef: React.RefObject<HTMLDialogElement | null>
}) {
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
    The details, and whether it is already on your list — one request, see
    `app/api/film/[id]/route.ts`.

    **Nothing waits for it.** The title, the year and the artwork all came off the
    thing that was tapped, so the screen is complete from the first frame and this
    fills in the synopsis and the marks. A spinner over a poster we already have
    would be inventing a wait.

    ⚠ **It is usually already in flight by the time this runs.** The poster starts
    it on `pointerdown` and this claims it — see `lib/film-request.ts` for why the
    hand-off is one request rather than a cache. `claimFilmRequest` starts its own
    if there is nothing to claim, so this path does not depend on having been
    prefetched and a screen opened some other way behaves identically.

    Cancelled on unmount so closing the screen does not leave a request writing
    into a component that has gone. The flag rather than the signal, because the
    request may not be the one this effect created.
  */
  useEffect(() => {
    let cancelled = false
    const request = claimFilmRequest(film.externalId)

    request.response
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error(String(res.status)))))
      .then((body) => {
        if (cancelled) return
        setDetails({
          synopsis: body.film?.synopsis ?? null,
          runtime: body.film?.runtime ?? null,
          directors: body.film?.directors ?? [],
        })
        const found: Marks = {}
        for (const entry of body.listed ?? []) {
          /*
            ⚠ **The state was always on the wire and was thrown away here until
            21 August.** `listMyCapturesForExternalId` returns it and
            `/api/film/[id]` passes it through; this loop kept the id and the
            intent and dropped the one field that says *which collection this is
            in*. Keeping it is what lets the settled tick answer a tap without a
            second request.
          */
          found[entry.intent as Intent] = {
            entryId: entry.entryId,
            state: entry.state as EntryState,
          }
        }
        setMarks(found)
      })
      .catch(() => {
        if (cancelled) return
        /*
          The synopsis is the part that fails softly — there is a line for that
          below. The marks are not: an unknown list state stays unknown rather
          than defaulting to "not on your list", because the `+` that would draw
          is the one thing on this screen that can be wrong in a way you act on.
        */
        setDetails({ synopsis: null, runtime: null, directors: [] })
      })

    return () => {
      cancelled = true
      request.abort()
    }
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
    /*
      Optimistic, like every add in this app has been: the mark is the answer to
      the tap, and the network is not part of the answer.

      `'want'` because that is where a creation lands — `addCapture` writes it for
      everyone — and this branch is only reached from a `+`, which is only drawn
      when the marks say the film is not listed. The server's own answer replaces
      it a moment later either way.
    */
    setMarks((current) => ({
      ...(current ?? {}),
      [intent]: { entryId: null, state: 'want' },
    }))

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
        [intent]: { entryId: result.value.entryId, state: result.value.state },
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
        /*
          Putting back what was taken away. Only a fresh creation is undoable, so
          the row this failed to remove is the one that was just made, and a
          creation is a `want`.
        */
        setMarks((current) => ({
          ...(current ?? {}),
          [intent]: { entryId, state: 'want' },
        }))
      }
    })
  }

  const listedPrimary = marks?.[primary]
  const undoablePrimary = undoable?.intent === primary ? undoable : null

  /*
    ⚠ **One control, two placements — 20 August.** Built here rather than twice
    below, because the two surfaces disagree about *where* it goes and about
    nothing else: same states, same labels, same undo window. A second copy of
    this call is a second place to forget `undoable`.
  */
  const addControl = (
    <AddControl
      state={marks === null ? 'unknown' : listedPrimary ? 'listed' : 'absent'}
      label={specFor('film', primary).wantLabel}
      /*
        Where it went. A fresh add is always a `want`, but a film that was
        already listed when the screen opened can be in any of the four — so this
        is read off the entry rather than assumed from the action.
      */
      /*
        ⚠ **With the row's fragment on it, when there is a row id to name.**
        There is not, for the frame between an optimistic add and the server's
        answer — and a fragment naming nothing scrolls nowhere, which is the
        same landing the collection gets anyway.
      */
      listedIn={
        listedPrimary
          ? {
              ...WHERE_IT_IS[listedPrimary.state],
              href: listedPrimary.entryId
                ? (`${WHERE_IT_IS[listedPrimary.state].href}#capture-${listedPrimary.entryId}` as Route)
                : WHERE_IT_IS[listedPrimary.state].href,
            }
          : null
      }
      onLeave={() => dialogRef.current?.close()}
      undoable={Boolean(undoablePrimary)}
      onAdd={() => add(primary)}
      onUndo={() => undoablePrimary && undo(primary, undoablePrimary.entryId)}
    />
  )

  return (
    <>
      {/*
        --- what it is, under the artwork -------------------------------

        **Directed 18 August: none of the writing overlaps the poster.** This was
        `absolute inset-x-0 bottom-0` over the foot of the artwork; it is an
        ordinary block in the column now, and everything that existed to make
        type survive a picture went with the move — see the note where the scrim
        was.

        `shrink-0` because the synopsis below is the `flex-1` that gives, and a
        title that lost a line to a long write-up would be the wrong thing to
        compress.

        ⚠ **The `+` came down with the title, and that is a decision rather than
        a consequence.** It is inline in the heading, so it followed the words by
        construction — but it was asked for explicitly, with a note that it may
        go back to **the poster's top right** later. If it does, it needs its
        frost back, and the frost needs a scrim, and the scrim needs the contrast
        floor: the note where the scrim was is the whole recipe. Do not restore
        one part of it and expect the control to read.
      */}
      {/*
        ⚠ **A row, and it is the one shape the `+`'s note argues against — for a
        different occupant.** That note explains why the *add* is inline content
        rather than a flex sibling: a row aligns a control to the block, so a
        three-line title would leave it floating beside the first line with two
        lines of nothing under it. The handle is the opposite case. It belongs to
        the panel rather than to the words, so beside the **first** line is
        exactly where it should stay however long the name runs — `items-start`
        says that, and `h-[1lh]` on the button makes "the first line" mean the
        title's own line.

        The words are wrapped in a column of their own because the credit line and
        *See the poster* are the heading's siblings — without it they would become
        flex items too and stand beside the title rather than under it. `min-w-0`
        on that column so a long unbroken word cannot push the handle off the
        gutter; the padding is back on this row for both surfaces now that the
        band above it is gone.
      */}
      <div className="gutter relative flex shrink-0 items-start gap-3 pt-5">
        {/*
          ─────────────────────────────────────────────────────────────────────
           Beside the wall the `+` is in the poster's bottom right — 20 August
          ─────────────────────────────────────────────────────────────────────

          **Directed, for the desk only.** The note further down argues why it is
          inline in the heading, and every word of that still holds *on the
          takeover*, where the words are glass over a picture and there is no
          corner that is not somebody's face. Beside the wall the picture stops
          two thirds of the way down and the corner is a real place.

          ⚠ **It is positioned off THIS row, not off the artwork, and that is
          what keeps it honest.** `bottom-full` is the row's own top edge, which
          *is* the picture's bottom edge, so there is no share of the column and
          no `h-2/3` restated here — if the artwork ever takes a different
          fraction this follows it without being told.

          ⚠ **A circle, centred on the corner itself — directed 20 August.** It
          sat wholly inside the picture, inset by the words' own gutter. Now its
          centre is the corner point: `right-0` and `bottom-full` put its right
          edge and its bottom edge on the picture's, and the two half-translates
          move it out by half its own width and half its own height, which lands
          the middle of the disc exactly there. **Nothing measures the control** —
          `1/2` is a proportion of whatever size it is, so changing `size-6`
          moves the disc and keeps it centred.

          ⚠ **`rounded-full` on the wrapper AND on what it holds.** `CONTROL` is
          `rounded-md` for the inline placement in the heading, which is still
          right there; a square tint inside a round chip is what you get if only
          one of the two is changed. The child variant keeps that a property of
          this placement rather than of the control everywhere.

          ⚠ **`pointer-events-none` on the strip, `auto` on the chip.** The
          artwork's close button is underneath and this row paints above it —
          two of the three declarations the scrim's removal deleted, back
          because the stack they arranged for is back. A full-width transparent
          bar would otherwise eat every tap aimed at the poster.

          ⚠ **The chip is OPAQUE, and that is the file's own argument being
          obeyed rather than an aesthetic call.** The scrim note: *a design
          whose contrast is a function of the image is one that is wrong on some
          image you have not met yet.* Frosted at `bg-bg/80` the tick measured
          2.7:1 over a white poster once this control's own `bg-text/8` is
          composited on top — under the 3:1 floor. On its own ground it is the
          6.0:1 it has below the artwork, on every poster there has ever been.
        */}
        {!overlay && (
          <span className="pointer-events-none absolute right-0 bottom-full flex translate-x-1/2 translate-y-1/2">
            {/*
              ⚠ **32px here, `size-6` everywhere else — "a tad bigger" twice on 20
              and 21 August, and back to this after a doubling was reverted.** The
              same reasoning as the rounding beside it: the size belongs to this
              placement, not to the control. Inline in a heading the box has to sit
              in a line of type and cannot grow past it; on a picture it has
              nothing to fit inside.

              ⚠ **There is a ceiling here, 4rem was well over it, and 2.6667rem
              is just past it.** The disc is centred on the corner, so half of it
              hangs *down* from the picture's edge into this row, against the
              row's own 20px of `pt-5`. At 2rem that half was 16px and stopped 4px
              clear of the title's first **line box**; at 2.6667rem it is 21.33px
              and reaches 1.33px into it; at 4rem it was 32px and reached 12px in.

              **The line box is not the letters, and that is the whole of the
              margin left.** A 22px title on a 1.15 line has about 5px of leading
              above its capitals, so a disc 1.33px into the box is still clear of
              the ink — measured, not reasoned, and the number is in the commit.
              What has gone is the slack: the next increase eats letters.

              ⚠ **So `pt-5` is the real limit on this control**, and the next size
              change has to derive it from `--pane-corner` rather than leave it at
              a number that happened to be enough. It is not derived today because
              the padding is also the gap between the picture and the title, which
              was set by eye — moving it to buy 1.33px would trade a looked-at
              spacing for a measurement nobody has asked for.

              ⚠ **It is `--pane-corner` rather than `size-7` because the
              breakpoint is written from it — 21 August.** Half this disc hangs
              outside the panel, and the width at which the panel is allowed to
              exist at all is the band's cap plus this. As a spacing step the two
              could part company in silence — the control grows, the window starts
              cutting it again, and nothing says why.
            */}
            <span className="bg-bg pointer-events-auto rounded-full [&>*]:size-(--pane-corner) [&>*]:rounded-full [&_svg]:size-(--pane-glyph)">
              {addControl}
            </span>
          </span>
        )}
        <div className="min-w-0 flex-1">
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
            {film.title}
            {/*
              ⚠ **Inline only on the takeover now — 20 August.** Beside the wall
              it is in the picture's bottom right, positioned off the top of this
              row; see that block. Everything below is the argument for this
              placement and it is unchanged, because the surface it was written
              for is unchanged.

              ⚠ **`aria-label` stays on the heading in both.** It is redundant
              where the control has left, and removing it conditionally would
              make the heading's accessible name depend on the layout — which is
              the sort of difference that shows up as two screens reading
              differently to a screen reader and identically to everyone else.
            */}
            {overlay && ' '}
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
            {overlay && (
              /*
                ⚠ **The gap before this is a space AND a margin, and they are not
                the same job — 21 August.** Directed: a tad more air between the
                title's last character and the `+`.

                The space above is a **break opportunity**. It is what lets the
                control fall to the end of whatever turns out to be the last line
                instead of being welded to the final word, which is the whole
                argument for setting this inline rather than as a flex sibling.
                Widening the gap by deleting it and using margin alone would have
                bought the air by taking that away.

                So the margin is the **optical separation**, and it is the only
                thing here that is a look rather than a behaviour. `em`, because
                it is the distance between two pieces of type and the title takes
                two sizes — 1.375rem, and 1.75rem above 64rem. A rem would be
                right at one of them.
              */
              <span className="relative bottom-[calc((1cap_-_1ex)/2)] ms-[0.15em] inline-flex h-[1lh] items-center align-middle">
                {addControl}
              </span>
            )}
          </h2>

          {/*
            ⚠ **`min-h-[1lh]` is the other half of the two-stage report** — the
            lurch, where `lib/film-request.ts` takes the pause. This block is
            `absolute bottom-0`, so it grows *upward*: a credit line that is
            empty on the first frame and one line high a moment later drags the
            title up with it, under your eyes, on the screen you just opened.

            **The line is reserved, not the block.** One line is what this holds
            on almost every film — the year alone is usually there from the
            tapped poster — and the case that moves is the one where it is not:
            a film with no year renders nothing at all until the request lands.
            Reserving *two* would stop a long director list reflowing as well,
            and would cost every other film a permanent empty line over its
            artwork. That trade is not worth it; this one costs nothing.

            `1lh` is the element's own line box, so it follows the type step at
            64rem without knowing the number — the same reasoning as the `+`
            wrapper above, including its Safari 16.4 floor. Where it is not
            understood the declaration drops on its own and the behaviour is
            what it was before this note.
          */}
          <p className="text-muted mt-2 min-h-[1lh] text-sm">
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

          {/*
            ─────────────────────────────────────────────────────────────────
             Seeing the poster is a control now, not the picture itself
            ─────────────────────────────────────────────────────────────────

            Asked, 18 August: can the poster in the panel be tapped to expand
            it? **Not the picture — tapping the artwork closes the screen**, and
            that is deliberate (17 August, *no visible way out: the artwork is
            it*). Overloading it in the panel and not in the takeover would have
            made the same tap mean two different things depending on how wide
            the window was, which is the divergence this screen has otherwise
            avoided. Directed instead: put the expand somewhere that is not the
            image. **So the artwork still closes, at every width, and this is
            the way to the full poster at every width.**

            ⚠ **`PosterReveal`, not a second lightbox.** It has been doing
            exactly this since 8 August for the lists — full bleed on black,
            `object-contain`, `touch-none` because an unhandled pinch zooms the
            *page* and iOS gives no way back, tap anywhere to close. Rebuilding
            any of that here would be a second copy of reasoning that took a
            day to settle. The words are its own: `see the poster` is already
            what its `aria-label` says in the lists.

            **It earns its place beyond consistency**, because the artwork above
            is `object-cover object-top` and therefore cropped. This is the only
            way to see the whole poster, which is a different thing from seeing
            a bigger one.

            ⚠ **Guarded on `large` rather than left to the component.**
            `PosterReveal` renders its children unwrapped when there is no
            artwork — right when the children are a film's title, wrong when
            they are a label, which would leave the words *See the poster*
            sitting there as text that does nothing.
          */}
          {/*
            ⚠ **Panel only, and that is a parked question rather than a
            decision.** Directed 18 August: the handset goes back to what it was
            before this control existed. It is not that the handset does not
            want a way to the full poster — it is that **where** that control
            goes there has not been settled, and a third line under the credit
            line was not it. An open row in `docs/plan.md`.

            Everything else about the two widths is identical: the words sit
            below the artwork at both, and this is the only thing that differs.
          */}
          {!overlay && film.posterPath && (
            <PosterReveal
              posterPath={film.posterPath}
              title={film.title}
              /*
                The app's quiet text-button tier, the one the resolve actions
                wear in `entry-row.tsx`: muted 14px that takes full strength on
                hover, with `tap-target` giving it a 44px hit area without
                changing the line it sits on.

                ⚠ **No underline classes here on purpose.** `PosterReveal`
                brings its own — `decoration-rule` at a 6px offset, taking
                colour on hover — and a second `underline-offset` in this string
                would be two declarations of one property resolved by stylesheet
                order rather than by anything written down. It is also the right
                underline: this is the same affordance as *tap the title, see the
                poster* in the lists, so it should look like it.

                `micro` was tried first and was wrong. It uppercases, which put
                this in the same tier as the *Synopsis* heading directly below
                it — two labels stacked, one of which is secretly a control.
              */
              className="text-muted hover:text-text tap-target mt-3 block w-fit text-sm"
            >
              See the poster
            </PosterReveal>
          )}
        </div>

        {handle}
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
        to the same line.

        ⚠ **`scrollbar-none`, because the bar was making a claim about the wrong
        thing.** Reported 17 August: an indicator still appeared and moved under
        a drag with a poster open, reading as *your scrolling is having an
        effect*. It was — on this pane, which really does scroll — but on a
        screen whose whole promise is that the wall behind it is frozen, a moving
        bar at the right edge is a statement about the page. The pane still
        scrolls; it simply stops reporting it. See the utility in globals.css for
        what that costs.
      */}
      <div className="flex min-h-0 flex-1 flex-col pt-6">
        {/*
          ⚠ **The heading is a property of there being a synopsis, not of the
          screen — directed 18 August.** It used to stand over the words *No
          synopsis for this one*, which is a heading introducing its own absence:
          two lines to say nothing, on the one screen whose lower half is already
          an open question. A film TMDB has no write-up for is the title and the
          credit line, and then black.

          **Nothing shows while the answer is unknown either.** `details` is
          `null` until the round trip lands, so this appears with the words
          rather than before them — the same rule the `+` follows two blocks up,
          where an unknown list state draws nothing rather than guessing.
        */}
        {details?.synopsis && (
          <h3 className="gutter stamp text-muted shrink-0">Synopsis</h3>
        )}

        {/*
          `safe-bottom` is back on the scroller, because the scroller is the last
          thing in the column again — the *Close* that briefly sat under it is
          gone. There is no visible way out now: the artwork closes on a tap, and
          Escape closes from a keyboard. Same as `PosterReveal`, which has never
          had one either.
        */}
        <div className="gutter safe-bottom scrollbar-none mt-3 min-h-0 flex-1 overflow-y-auto [--safe-bottom-base:1.5rem]">
          {details?.synopsis && (
            /*
              ⚠ **Both come off the POINTER, not the shape.** The printing was
              asked for on the desk and the mono on the phone, and a maximally
              narrowed desk window is still a desk: it takes the overlay's layout
              and the desk's typography. They stay two props for the day one of
              them moves without the other.

              ⚠ **A JSX comment cannot open a parenthesised expression** — this
              is the third time that has cost a build in two days. Inside `{… && (`
              the brace form is a syntax error and the plain form is not.
            */
            <PrintedSynopsis
              text={details.synopsis}
              printing={!touch}
              mono={touch}
            />
          )}

          {/*
            Full strength, not `text-muted` — a failure set in the colour reserved
            for de-emphasised metadata reads as an aside. docs/decisions.md,
            8 August, and it has survived every surface this message has lived on.
          */}
          {error && <p className="mt-6 text-sm">{error}</p>}
        </div>
      </div>
    </>
  )
}

/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  One element, two sources, and never a half-painted one — 18 August
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * **Reported at the desk: the new poster arrives and then flashes, and often
 * paints in from the top.** Measured across a swap, every frame, keeping only
 * the ones where something changed — `c` is a complete image, `·` one still
 * arriving, and the number is `naturalWidth`:
 *
 *     2ms    w342:c342  w780:c780     ← the film you were on
 *     224ms  w342:c342  w780:·0       ← an element with no image at all
 *     321ms  w342:c342  w780:·780     ← header read, pixels still landing
 *     404ms  w342:c342  w780:c780
 *
 * **180ms of a large image drawing itself over a small one that was already
 * correct.** That is the flash, and the top-down is literally what a baseline
 * JPEG looks like while it does it.
 *
 * ⚠ **The two-layer stack is gone.** It was `w342` under `original`, and it was
 * right about the problem it solved — a screen must not open on an empty
 * rectangle — but wrong that the second layer could arrive unnoticed. There is
 * one element now and two sources, and **the better source is not shown until it
 * has fully decoded off-screen**. `decode()` rather than `onLoad`, because
 * loaded is not painted; `complete` and an `onload` are the fallback for
 * anything that refuses to decode.
 *
 * ⚠ **The note this replaces argued for no state and no `onLoad`, on the
 * grounds that it would be hiding a transition nobody had asked about.** Use
 * answered that: the transition was the report. Knowing when the picture is
 * ready costs one re-render per film, which is the price of never showing half
 * a picture.
 *
 * ⚠ **This lives on the SCREEN, not on the film, and that is the other half of
 * the fix.** `FilmBody` is keyed and rebuilt on every swap; if the picture were
 * inside it, the element would be destroyed and there would be a gap with
 * nothing to paint. Here the element survives, and an `<img>` holds its last
 * frame until the next is ready — so the previous poster covers the moment the
 * new thumbnail takes to decode out of the cache, on every engine rather than
 * on the ones that happen to be quick.
 */
function Artwork({
  posterPath,
  title,
  overlay,
  touch,
  receded,
  dialogRef,
}: {
  posterPath: string | null
  title: string
  /* Whether the picture is the screen or a share of a column — a shape question. */
  overlay: boolean
  /* Whether that screen is also a 3x handset, which is what needs the big file. */
  touch: boolean
  receded: boolean
  dialogRef: React.RefObject<HTMLDialogElement | null>
}) {
  /*
    ⚠ **The panel asks for the size it can show; the takeover asks for the size
    it can show. Same rule, two boxes** — `lib/posters.ts` carries the arithmetic
    for both, and neither number is a download budget. `--pane-column` is 24rem,
    so beside the wall this is 384 CSS px and `original` was about seven times
    the pixels it can use.
  */
  const small = posterUrl(posterPath, 'w342')
  /*
    ⚠ **`original` needs BOTH axes, which is why it is the one place they meet.**
    The rule in `lib/posters.ts` is *ask for the size the box can show*, and the
    box only gets big enough to need it when a full-screen poster lands on a 3x
    handset: ~390 CSS px at 3x is ~1170 real pixels and `w780` would be an upscale.
    A narrowed desk window has the same layout at 1x or 2x, where 780 covers it
    outright, and a large touchscreen at `pane` widths has a 384px column. Either
    axis alone would fetch megabytes for a box that cannot show them.
  */
  const large = filmPoster(posterPath, overlay, touch)

  /*
    The URL that has finished decoding, not a boolean. Comparing it to the
    current `large` is what makes a change of film correct without resetting
    anything: the moment the film changes, what decoded is no longer what is
    wanted, and the small one is shown again by arithmetic rather than by
    remembering to clear a flag.
  */
  const [decoded, setDecoded] = useState<string | null>(null)

  useEffect(() => {
    if (!large) return
    let live = true

    /* `window.Image`: `Image` is next/image in this file. */
    const image = new window.Image()
    const ready = () => {
      if (live) setDecoded(large)
    }
    image.src = large
    image.decode().then(ready, () => {
      if (image.complete) ready()
      else image.onload = ready
    })

    return () => {
      live = false
    }
  }, [large])

  const src = decoded === large ? large : small

  /*
    The two states, as one transform. See the note on the box below for why this
    is here rather than in a class.

    `boxW` is the poster at cover size: as wide as the column, or as wide as a
    2:3 poster needs to be to reach the column's full height, whichever is
    greater. That `max` is what makes it right in both orientations — upright the
    height binds and the box overhangs the sides; on its side the width binds and
    it overhangs the foot. Either way the column clips it, which is what
    `object-cover` was doing before by other means.

    Receded, it scales to the column's width — *whole* — and drops to the middle
    under a thumb or stays at the top under a cursor. That last line is the
    surround's ruling read a second time; see the box's note.

    ⚠ **`transformOrigin` is the top edge, not the centre.** The scale has to
    leave the top where it is and take the difference off the bottom, because
    `translateY` is then a single number measured from a known edge. Origin
    `50% 0` keeps the horizontal centring the overhang depends on.
  */
  const boxRef = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    const box = boxRef.current
    const column = box?.parentElement
    if (!overlay || !box || !column) return

    const fit = () => {
      const width = column.clientWidth
      const height = column.clientHeight
      const boxWidth = Math.max(width, (height * 2) / 3)

      box.style.width = `${boxWidth}px`
      box.style.height = `${boxWidth * 1.5}px`
      box.style.left = `${(width - boxWidth) / 2}px`
      box.style.top = '0px'
      box.style.transformOrigin = '50% 0'
      box.style.transform = receded
        ? `translateY(${touch ? (height - width * 1.5) / 2 : 0}px) scale(${width / boxWidth})`
        : 'none'
    }

    /*
      ⚠ **A `ResizeObserver`, and a `window` resize listener will not do.** The
      first version measured on mount and listened for resizes, and measured
      **zero** — this screen is a `<dialog>` that its own effect opens a tick
      later, and until it does the column is `display: none` and has no size at
      all. Nothing resizes the window when a dialog opens, so nothing would have
      corrected it; the box happened to be re-measured by an unrelated re-render,
      which is luck and not a mechanism.

      The observer asks the question the code actually has — *what size is this
      box now* — and answers it on the first layout, on the dialog opening, and
      on a rotation, without any of the three being named.
    */
    /* Synchronously as well, so a state change moves the picture this frame. */
    fit()

    const watch = new ResizeObserver(fit)
    watch.observe(column)
    return () => watch.disconnect()
  }, [overlay, receded, touch])

  return (
    <div
      /*
        ⚠ **Two boxes, and only the overlay's moves.** Under a cursor the picture
        is a share of a column it sits inside, so it stays a flex child.

        ⚠ **The overlay's box fills the screen and settles to the poster. WHERE it
        settles is a pointer question, and it is the surround's own ruling read a
        second time.** It was pinned at the poster's own shape first, which
        reported as *the poster is only two thirds of the screen* — 585 of 844,
        two thirds exactly. Then it filled the screen and shrank to the **top**,
        which left all 259px of the difference at the foot. Then it was
        **centred**, so the gaps split evenly and a whole poster read as framed
        rather than as one that ran out.

        ⚠ **Under a cursor it is back at the top — directed 20 August — and what
        made the top wrong on the handset is what makes it right here.** The fault
        was never the alignment, it was the 259px: under a thumb that room is
        **black**, so a poster held at the top reads as one that ran out, and the
        centring is what frames it. Under a cursor that room is **the same picture
        out of focus**, so there is nothing to run out of — the foot is full and
        the top edge is the poster meeting the screen's own. Same pixel, two
        rulings, and they are the *surround's* two rulings; see that block in
        `FilmScreen`. **The handset's centring is untouched — do not unify these.**

        ⚠ **The poster keeps the column's full width on both surfaces**, directed
        after the alternative — shrinking it narrower than the column on recede —
        was offered and declined. So the band and the picture are the same width by
        construction, and the blur only ever shows at the **foot**, which is the
        only place there is room for it. Nothing here is a size to keep in step
        with the band.

        `object-cover` does the shaping: taller than 2:3 it crops the sides to
        fill, and at 2:3 it fits exactly, which is the whole poster uncropped —
        the thing the chevron is for.

        ─────────────────────────────────────────────────────────────────────
         ⚠ It animated `height` and `top` until 21 August, and it stuttered
        ─────────────────────────────────────────────────────────────────────

        Reported from the handset: the panel drops away and the picture follows
        late, in two steps, both ways. Measured rather than guessed —
        `node_modules/.probe/jolt.mjs` samples the box every frame with the CPU
        throttled: **the poster got 13 frames of a 300ms move, with a 57ms gap
        in the middle.** The panel got a smooth one over the same window.

        The asymmetry is the whole explanation, and it is a property of *which
        properties* the two animate. The panel moves with a transform, which the
        compositor runs on its own thread. `height` and `top` are layout: every
        frame relaid the box, and re-`object-cover`-ed a 2000×3000 master into a
        different-sized hole. One gesture, one of whose halves needed the main
        thread eighteen times a second and did not get it.

        **So the box no longer changes size — it is scaled.** `transform` is the
        one property this move can be expressed in that the compositor can carry
        alone, which is not a tuning of the old animation but a different animal:
        no layout, no re-cover, no main thread.

        ⚠ **The box is laid out at the RESTING size, and receding scales it
        *down*.** The other way round was available and is wrong: an upscale at
        rest would leave the state you are looking at almost all of the time
        rasterised for a smaller box. At rest the transform is `none`, so the
        picture is drawn at its own layout scale and nothing is resampled at all.

        ⚠ **The geometry is a ratio of two measured lengths, which CSS cannot
        express**, and that is why this is JavaScript and not `cqw`. A scale is a
        number; `calc()` cannot divide one length by another to produce one.
        Everything else is still arithmetic and none of it is a chosen number —
        the resting box is the poster at cover size (`max` of the two axes, so it
        is right in both orientations), and receding scales it to the column's
        width, which is what *whole* means here. `fit()` reproduces the old
        `calc(50% - 75cqw)` and `150cqw` exactly, in both orientations; it was
        checked against them before they were deleted.

        ⚠ **Written through the CSSOM, never a `style` attribute** — the CSP in
        `proxy.ts` drops those in production and nowhere else. See
        eslint.config.mjs, which bans the attribute and not this.
      */
      ref={boxRef}
      className={
        overlay
          ? 'absolute overflow-hidden transition-transform duration-300'
          : `${ARTWORK_PANEL} relative shrink-0 overflow-hidden`
      }
    >
      {src && (
        /*
          ⚠ **`width`/`height` and classes, never `fill`.** `fill` renders its
          positioning as a `style` attribute, and the CSP in `proxy.ts` drops
          every style attribute in production while `next dev` allows them — so
          it would have laid out perfectly here and collapsed on the deployed
          site. The numbers are a 2:3 aspect and nothing else; the classes do the
          layout.

          **No `key`.** This element is meant to survive a change of film — see
          the note above. Keying it would restore the gap it exists to cover.
        */
        <Image
          src={src}
          alt={`Poster for ${title}`}
          width={2000}
          height={3000}
          className="absolute inset-0 h-full w-full object-cover object-top"
          priority
        />
      )}

      {/*
        ⚠ **The scrim is deleted, and it took three other things with it — 18
        August.** It was a gradient over the foot of the artwork, stopped at
        80% rather than solid black so the `+` would have something to frost
        against, and it existed for exactly one reason: type was sitting on a
        picture. **Directed: none of the writing overlaps the poster.** So
        there is no type on the picture, and the scrim, the frost and the
        contrast floor that governed both are gone with it.

        What that bought, and it is worth stating because it was the argument
        for doing it: **legibility no longer depends on which film you tapped.**
        Over the brightest poster the title read 11:1 and the credit line 5:1,
        and the green tick — the number this file told you to watch — sat at
        3.3:1 against a 3:1 floor. On the flat ground below the artwork the
        tick is `--color-listed` on black at **6.0:1** and the title is full
        strength, on every poster there has ever been. A design whose contrast
        is a function of the image is one that is wrong on some image you have
        not met yet.
      */}

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

        **Nothing is excluded by name, and since 18 August nothing needs to
        be.** This button is the only thing in the artwork block now. The title
        and the credit line used to lie over it, which cost them
        `pointer-events-none` and cost the `+` a `pointer-events-auto` to climb
        back out — **three declarations arranging for a stack that no longer
        exists.** They are below the picture, so they are simply not in the way.
      */}

      {/*
        ⚠ **The panel's only.** On the handset the same surface has two jobs —
        close, or bring the words back — and which one depends on state this
        component does not have, so `FilmScreen` draws it there instead, over
        the whole screen rather than over the picture. Beside the wall there is
        no receding and nothing below the artwork to cover, so it stays here.
      */}
      {!overlay && (
        <button
          type="button"
          onClick={() => dialogRef.current?.close()}
          aria-label="Close"
          className="absolute inset-0"
        />
      )}
    </div>
  )
}


/**
 * Whether there is room to stand beside the wall rather than cover it.
 *
 * ⚠ **The number is not here.** `--breakpoint-pane` is declared in globals.css,
 * where the arithmetic that produced it is written down, and this reads it back
 * off the root. A breakpoint spelled once in CSS and again in JavaScript is a
 * breakpoint that will disagree with itself the first time either moves — and the
 * disagreement would be invisible, since each half would look right on its own.
 *
 * `matchMedia` takes the value as written, units and all, so nothing here has to
 * know what a rem is worth — and the number stays unquoted here, so this note
 * cannot go stale the next time the breakpoint moves.
 *
 * Read synchronously on the first render rather than in an effect: this screen
 * only ever mounts from a tap, so there is no server render to disagree with, and
 * settling it a frame later would open every desk poster as a takeover and then
 * snap it into a panel.
 */
/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  The synopsis prints — 18 August
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Directed: the synopsis arrives a character at a time, first to last, at the
 * speed someone reads quickly. **Wherever there is a cursor** — `printing` is the
 * whole of that decision, and it is now `!overlay` rather than a width, so a
 * narrowed desk window prints and a phone does not. The phone got mono instead;
 * the two were asked for on different surfaces and neither has crossed.
 *
 * ⚠ **Every character is in the layout from the first frame; only its ink
 * arrives.** The obvious build appends to a string, and it is the wrong one: the
 * paragraph would grow line by line and a word would jump to the next line as it
 * was typed, so the block reflows under the reading. Here the text is laid out
 * once and each character is revealed in place. Nothing moves, and the scroller
 * below never resizes mid-print.
 *
 * ⚠ **A span per character does NOT change where the lines break.** Line
 * breaking follows the text, not the element boundaries — an inline box is not a
 * break opportunity — so a word cut into eleven spans still wraps as one word.
 * This is the fact the whole approach rests on; if it were false the paragraph
 * would come apart mid-word.
 *
 * ⚠ **Time, not frames.** The count is derived from elapsed milliseconds every
 * frame, never incremented per tick, so it prints at one speed on a 60Hz phone,
 * a 120Hz tablet and a desk that drops frames. A per-character `setInterval` was
 * never on the table for the same reason.
 *
 * ⚠ **The ink is written with `el.style`, never a rendered `style` attribute.**
 * The CSP in `proxy.ts` drops style attributes in production while `next dev`
 * allows them; the fade itself is a class, so nothing per-character is inlined.
 *
 * ⚠ **`prefers-reduced-motion` is answered here rather than left to globals.css.**
 * That block zeroes durations, which would make each character's fade instant
 * but leave the *sequence* running for ten seconds — a slow reveal with no
 * animation in it, which is the thing the setting exists to refuse. Asked
 * directly, the whole paragraph is simply present.
 *
 * The screen reader gets the paragraph whole and once, from a copy that is not
 * animated at all; the printed copy is `aria-hidden`, and `select-none` on the
 * other keeps a copy-paste from picking up both.
 */
/*
  ⚠ **600 was a reading speed; 1800 is not, and that is the whole of the change
  made 20 August.** Directed: print faster. The original rate was anchored to
  *someone reading quickly*, and past that there is no reading to anchor to — so
  the unit that decides it is how long a whole paragraph takes. A typical TMDB
  synopsis is around 500 characters: 600wpm is about ten seconds of it, which is
  longer than anyone waits before reading past the front; 1800 is about three,
  which is a sweep you can watch to the end. **The print is now an arrival rather
  than a pace.** One constant if it moves again — 1200 is ~5s, 2400 is ~2.4s.
*/
const PRINT_WPM = 1800
/** English averages about 5.1 characters a word once the space is counted. */
const PRINT_CHARS_PER_SECOND = (PRINT_WPM * 5.1) / 60

/*
  ⚠ **The soft front is a WIDTH IN CHARACTERS, and it is the reason the rate
  cannot be changed on its own.** Each character fades rather than appearing, so
  at any moment `rate × duration` of them are part way in — that band is what
  makes the edge of the text arrive instead of stamp. Tripling the rate against a
  fixed duration would have tripled the band to 23 characters, which is most of a
  line half-lit, so the duration is **derived from the rate** and the band holds
  at the eight it was designed as.

  ⚠ **It reaches CSS as a custom property set with `el.style`, never a rendered
  `style` attribute** — the CSP in `proxy.ts` drops those in production while
  `next dev` allows them, so a per-character inline duration would have worked
  here and vanished on the deployed site. The class naming the property is static
  and compiles; only the value is written at runtime, once, on the host.
*/
const PRINT_FRONT_CHARS = 8
const PRINT_FADE_MS = Math.round((PRINT_FRONT_CHARS / PRINT_CHARS_PER_SECOND) * 1000)

function PrintedSynopsis({
  text,
  printing,
  mono,
}: {
  text: string
  printing: boolean
  mono: boolean
}) {
  const host = useRef<HTMLSpanElement>(null)
  const shown = useRef(0)

  useEffect(() => {
    const node = host.current
    if (!node) return

    /*
      ⚠ **Copied out of the live collection, not read from it.** `node.children`
      updates as React does, so a frame that lands between a swap and this
      effect being torn down indexes a list that has already changed underneath
      it — which threw on the first run of this code. Holding the elements this
      effect was started for means a late frame writes to something detached and
      harmless instead of reaching past the end of a list.
    */
    const characters = [...node.children] as HTMLElement[]
    shown.current = 0

    /* Set before anything is revealed, so no character can fade at the wrong
       speed on the first frame. Inherited, so it costs one write, not one a
       character. */
    node.style.setProperty('--print-fade', `${PRINT_FADE_MS}ms`)

    const revealTo = (n: number) => {
      for (let i = shown.current; i < n; i += 1) {
        characters[i].style.opacity = '1'
      }
      shown.current = n
    }

    if (!printing || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      revealTo(characters.length)
      return
    }

    let frame = 0

    /*
      ⚠ **The clock is the first frame's, not `performance.now()`, and mixing
      them is a real bug rather than a tidiness point.** The timestamp handed to
      a `requestAnimationFrame` callback is the moment that *frame* began, which
      can be **earlier** than the effect that scheduled it — so `now - start`
      came out negative, the count went to −10, and the next pass indexed
      backwards off the array and threw. The print then stopped before it
      started, intermittently, depending on where in the frame the screen
      happened to mount.

      Taking the origin from the first callback puts both ends on one clock, so
      the elapsed time cannot be negative. Clamping the count at zero would have
      hidden it just as well and left the two clocks in place.
    */
    let start: number | null = null

    const tick = (now: number) => {
      if (start === null) start = now
      const due = Math.min(
        characters.length,
        Math.floor(((now - start) / 1000) * PRINT_CHARS_PER_SECOND),
      )
      revealTo(due)
      if (due < characters.length) frame = requestAnimationFrame(tick)
    }

    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [text, printing])

  return (
    /*
      ⚠ **Mono on the touch surface only, and that is where it was asked for.**
      It went on everywhere first and came off the desk within the hour; the
      instruction was to leave it as it is *for the phone home app*. So the
      overlay's synopsis agrees with the stamp above it and the panel's stays
      sans, which is what it has always been.

      ⚠ **This is still the larger of two extensions to §11's mono rule**, which
      reserves the face for return counts and timestamps. A heading was eight
      characters; this is the longest run of prose in the app, and it is now on
      exactly one of the three surfaces. Recorded in docs/decisions.md.

      Where it lands it suits the printing by accident rather than by design —
      but the printing is on the *other* surface, so the two never meet.
    */
    <p className={mono ? 'font-mono text-sm' : 'text-sm'}>
      <span className="sr-only select-none">{text}</span>
      <span aria-hidden ref={host}>
        {[...text].map((character, index) => (
          /*
            The fade is a class, so it is one rule for every character rather
            than one declaration each. `PRINT_FRONT_CHARS` of them are mid-fade at
            any moment whatever the rate is, which is what gives the edge of the
            text a soft front instead of a stamping cursor — see the derivation
            above. The duration was `150` while the rate was fixed at 600wpm.
          */
          <span
            key={index}
            className="opacity-0 transition-opacity duration-(--print-fade)"
          >
            {character}
          </span>
        ))}
      </span>
    </p>
  )
}

/**
 * Whether there is room for the wall and a film at once.
 *
 * ⚠ **Exported since 20 August, and the export is the point.** `cinema-wall.tsx`
 * opens the wall's first film on arrival at these widths, and it must be asking
 * the *same* question this screen asks — a second `matchMedia` written beside it
 * would be a copy of `--breakpoint-pane`'s reading that could drift from this one
 * without either being wrong on its own. The number is still only in globals.css.
 */
/**
 * The rung this screen's artwork will ask for, on the surface it lands on.
 *
 * ⚠ **Exported for one caller and for one reason: so the fetch can start on the
 * tap instead of on the mount.** `capture-provider.tsx` knows which film was
 * chosen a whole render and commit before `Artwork` exists to ask for it, and on
 * a phone that file is 0.8–1.9MB. What it must not do is *guess* the rung — a
 * second copy of this rule would be free to drift, and the drift would show as a
 * wasted megabyte or a soft poster, neither of which announces itself.
 *
 * The rule itself is unchanged and its argument is below: `original` needs both
 * axes, so it is the one place the pointer and the layout meet.
 */
export function filmPoster(posterPath: string | null, overlay: boolean, touch: boolean) {
  return posterUrl(posterPath, overlay && touch ? 'original' : 'w780')
}

/*
  ⚠ **`paneQuery`, `touchQuery` and `useMatches` moved to `components/pointer.ts`
  on 25 August**, when the capture page needed the same answer about what is
  pointing at the screen. Two components asking one question must not each own
  the asking. They are imported at the top of this file; nothing about them
  changed.
*/

/**
 * The `+` on the artwork, and what it becomes.
 *
 * Three states and one box. `unknown` holds the space while the answer is in
 * flight, `absent` offers the add, `listed` marks it — and while §5.1's window is
 * open the mark is also the way back out, which is what let the acknowledgement
 * band go: the undo is under the finger that just added.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 *  It always answers a tap now — 21 August
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * **The question was how to show, without the word *undo*, that the tick is
 * still a button for ten seconds. The answer is that it stops mattering.**
 *
 * ⚠ **The fault worth designing against was never the unmarked window.** It was
 * the eleventh second: the settled tick was a `<span role="img">`, so a tap on it
 * did *nothing at all* — no movement, no message. Someone who taps a thing they
 * just tapped and gets silence does not conclude *the window closed*, they
 * conclude the app is broken. An indicator during the window would have made that
 * worse, not better: it would promise, and then withdraw.
 *
 * So the control never expires. **What expires is what it does.** Inside §5.1's
 * window a tap removes the entry; after it, a tap goes to the collection the
 * entry is in. Nothing is offered and then taken away, so there is nothing to
 * count down and nothing to mark.
 *
 * ⚠ **A ring in the tick's colour was built and removed on 17 August, and a pulse
 * was considered and rejected on 21st.** The ring was rejected on sight. The pulse
 * fails on its own terms: **a pulse is periodic and a window is monotonic**, so
 * second nine looks exactly like second one — it says *this is live*, never *this
 * is nearly gone*, and someone who glances at it late reaches for a control that
 * is already dead. Whatever anyone tries next, it should not be an outline and it
 * should not be a loop.
 *
 * ⚠ **The near miss is a hand-off rather than a punishment.** Tap at second
 * eleven meaning to undo and you land in the collection holding the film — which
 * is where the resolve flow lives, and so the nearest thing to what you wanted.
 * §5 has no delete; this is the most an honest control can offer.
 *
 * ⚠ **The desk loses its window indicator too, and that is the same decision.**
 * `CONTROL_PRESSABLE`'s hover lift used to appear for ten seconds and then stop,
 * which was the one surface that could see the window at all. Both states are
 * pressable now, so the lift means *this does something* rather than *this still
 * does something* — which is the true statement about it.
 */
function AddControl({
  state,
  label,
  listedIn,
  onLeave,
  undoable,
  onAdd,
  onUndo,
}: {
  state: 'unknown' | 'absent' | 'listed'
  label: string
  /** Where the entry is, once there is one. `null` until the marks land. */
  listedIn: { href: Route; label: string } | null
  /** Shut the screen, because it outlives the navigation. See `FilmBody`. */
  onLeave: () => void
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
      **Past §5.1's window: still a control, pointing at where the thing went.**
      The note at the top of this component is the argument; this is the shape of
      it. It was a `<span role="img">` until 21 August — a marker that looked
      identical to the button it had been a second earlier and did nothing when
      pressed.

      ⚠ **A `<Link>` rather than a `<button>` that pushes**, so it is a real
      destination: the accessible name says where it goes, it opens in a new tab
      on a middle click, and the browser shows the target on hover. A control that
      navigates and does not announce it is the other half of the same fault this
      is fixing.

      ⚠ **`listedIn` can be null for a frame.** `marks` arrives from a request, and
      between `listed` becoming true and that state landing there is nothing to
      point at. The marker holds the space in exactly the box a link would take,
      the way `unknown` does above — never a link to nowhere.
    */
    if (!undoable) {
      if (!listedIn) {
        return (
          <span
            className={`${CONTROL} text-listed`}
            role="img"
            aria-label={`${label} — on your list`}
          >
            <TickIcon size={14} />
          </span>
        )
      }
      return (
        <Link
          href={listedIn.href}
          onClick={onLeave}
          aria-label={`On your list — open ${listedIn.label}`}
          className={`${CONTROL_PRESSABLE} text-listed`}
        >
          <TickIcon size={14} />
        </Link>
      )
    }
    /*
      **The window, and it is deliberately unmarked.** The full argument is at the
      top of this component: the difference between this and the state below is
      what a tap *does*, not whether one is worth making, so there is nothing here
      that has to be advertised before it expires.

      ⚠ **`aria-label` is the one place the difference is stated**, because a
      screen reader announces the control rather than watching it: "Undo" for ten
      seconds, then "On your list — open Wants". The label is not decoration on a
      visual signal, it *is* the signal on that surface.
    */
    return (
      <button
        type="button"
        onClick={onUndo}
        aria-label="Undo"
        className={`${CONTROL_PRESSABLE} text-listed`}
      >
        <TickIcon size={14} />
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={onAdd}
      aria-label={label}
      className={`${CONTROL_PRESSABLE} text-text`}
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
