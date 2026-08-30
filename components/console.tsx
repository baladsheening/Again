'use client'

import type { PageLineView } from '@/lib/page-line'
import { CrossOffGlyph, LinkGlyph, RewriteGlyph, SettleGlyph } from './glyphs'

/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  The console — 30 August, Phase 2 step 1
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * **Tapping a line opens a console: the whole capture, and the things you can do
 * to it.** The record is an index, not a document — every line truncates to one
 * line, so everything past what fits on a row has had nowhere to exist. The row
 * is a spine label; this is the only place a capture is actually shown.
 *
 * ⚠ **It is the thing detail view, and `film-screen.tsx` is deleted into it.**
 * That screen was kept for a surface nothing opened, built for a product whose
 * only kind was a film. Replacing it rather than building beside it is the
 * brief's own instruction and *How things get fixed*'s order: the second surface
 * is removed, not kept in step.
 *
 * ⚠ **It is not navigation.** The bar stays exactly where it was, so somebody
 * looking at a capture is always visibly still on their own page. Same argument
 * the writing sheet won: **a sheet is not a route.**
 *
 * ─────────────────────────────────────────────────────────────────────────────
 *  What a tap means now
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * ⚠ **A tap on a line opened a *pick*; it opens this instead.** The pick lit the
 * foot's settle glyph and put `×` and `✎` in the line's own slot — three
 * controls for a line whose text you could not read. All three are here now, on
 * the box that shows the line they act on, which is this project's own rule that
 * **a control belongs where its effect appears** applied one more time.
 *
 * ⚠ **Settle came off the foot, and `foot.tsx` predicted it in writing.** Its
 * docblock said: *if the grouping is revisited, settle is the thing to move —
 * onto the line, where the other two that act on it already are.* It is the last
 * of the three, so the foot drops to `+` and search, which is where the Phase 2
 * brief's §3 has it ending up once the swipes arrive. It arrives one step early
 * because the console — not the swipes — is what took the pick's job.
 *
 * ⚠ **This is not the swipes.** Step 2 of the brief puts cross off and settle on
 * a directional gesture on the row and deletes `picked` outright. Nothing here
 * anticipates that: when it lands, these controls stay as the considered door and
 * the swipe becomes the reflex one.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 *  Two surfaces, and they are genuinely two
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * **Directed 30 August, and it is the question the brief left open.** Below
 * `--breakpoint-stack` this is a fixed rectangle over a blurred record; at and
 * above it the console **expands the row in place**, with no scrim and no
 * floating box. A handset has no room to show a capture where it lives; a desk
 * has the width and already stands its tools beside the column rather than under
 * it, so a takeover up there would buy nothing and cost the reader their place.
 *
 * ⚠ **One component and one mount point — the CSS decides.** It renders inside
 * the `<li>` of the line it belongs to, always. `console-sheet` is `fixed` on a
 * handset and `static` on the desk, which is the same trick `Foot`/`ToolStack`
 * and the writing strip already use: **the arrangement is the stylesheet's, so
 * the two placements cannot be given different states.**
 *
 * ⚠ **The contents and their order do not change between them.** Read from the
 * top, act at the bottom: the words first, the controls on the bottom edge,
 * because on a handset that is the only part of the screen a thumb reaches
 * without a regrip. The desk keeps the order rather than inventing a second one
 * for a pointer.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 *  How it closes
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * ⚠ **Tap the paper.** That is now the *one* exit gesture in the whole app — the
 * writing strip and the console alike — with `Escape` as the desk's key. On a
 * handset the paper is the scrim; on the desk it is `main` itself, which already
 * carried this gesture when it was letting a picked line go. Nothing here owns a
 * close control and it must not grow one: a second door to the one gesture every
 * surface shares is how a gesture stops being learnable.
 *
 * ⚠ **`✎` closes the console and hands the words to the strip.** **Not** a field
 * in here. *The page has exactly one field and it is the strip* is load-bearing
 * and already works — a second one would have to dodge the keyboard and would
 * put two occupants on one scrim. Reached this way, rewriting **is the rewrite
 * path that already exists**, entered through a different door.
 *
 * ⚠ **It renders instantly, from what the page already holds.** Everything here
 * is on the `Line` the record was already drawing. When *who else* arrives it
 * has to arrive into a space that is already there — never a spinner over the
 * whole box.
 */
export function Console({
  line,
  asking,
  crossedOff,
  onCrossOff,
  onRewrite,
  onSettle,
  onAgain,
  onDone,
  onAcceptOffer,
  onDeclineOffer,
  onOpenPhoto,
  linkLabel,
}: {
  line: PageLineView & { previewUrl?: string }
  /** The *Again?* question is standing on this line. */
  asking: boolean
  crossedOff: boolean
  onCrossOff: () => void
  /** `null` while a rewrite is already open — reopening would discard it. */
  onRewrite: (() => void) | null
  onSettle: () => void
  onAgain: () => void
  onDone: () => void
  onAcceptOffer: () => void
  onDeclineOffer: () => void
  onOpenPhoto: () => void
  linkLabel: (href: string) => string
}) {
  const photo = line.previewUrl ?? (line.id === '' ? null : `/api/media/${line.id}`)

  return (
    <div
      /*
        ⚠ **`z-10`: over the scrim, under the two bars** — the band's old rule,
        and for the band's old reason. The bar stays visible because the console
        is not navigation, and the writing strip stays reachable at `z-20`
        because the `+` is how somebody leaves this for a new capture. Inert on
        the desk, where this is in flow and nothing is stacked.

        ⚠ **`--console-from` is written on the page's host by `openConsole`, and
        is neither a prop nor state.** It is the tapped row's own `top` at the
        moment of the tap, and it is the *rise's origin only* — the box it lands
        in is a constant either way. It is not state because it feeds nothing but
        a keyframe: a number in state would re-render the record to change one
        custom property. It is not an inline `style` because **the production CSP
        blocks style attributes** (§10) — `useKeyboardHem` writes
        `--keyboard-overlap` onto the same host for the same reason, and CSSOM is
        not what a `style-src` policy blocks.
      */
      className="console-sheet z-10"
    >
      <div className="console-card">
        {/*
          ⚠ **The scrolling half, and the controls are deliberately outside it.**
          The box is fixed, so a long capture has to go somewhere; the bottom
          edge is where a thumb is and must not scroll away from it. `min-h-0` is
          what lets this shrink inside the flex column — without it the controls
          are pushed off the box the whole design rests on being fixed.

          ⚠ **It does not scroll on the desk**, because in flow there is no
          height to be inside of: the row grows to hold the capture and the page
          scrolls, which is what *expands in place* means.
        */}
        {/*
          ⚠ **`touch-action: pan-y` takes back what `console-sheet` refused, and
          `overscroll-behavior: contain` stops it chaining.** The sheet sets
          `touch-action: none` so nothing pans the record behind a box fixed to
          the glass; a capture longer than the bounds still has to be readable,
          so the one box that legitimately scrolls says so — and says that
          reaching its end is the end, not the page's turn. See the note on
          `console-sheet`.
        */}
        <div className="stack:overflow-visible min-h-0 flex-1 touch-pan-y overflow-y-auto overscroll-contain">
          {/*
            **The day, in the record's own stamp.** It is the same furniture as
            the row of mono above every group of lines — the console is one line
            of that record opened, so it says *when* in the same voice rather
            than inventing a second one.

            ⚠ **The year is the resolution, and here it can stand on its own.**
            On the row it is one number squeezed beside a clipping box; there is
            room in here, and *this line found its possibility* is exactly what a
            reader of the record cannot otherwise see.
          */}
          <p className="stamp text-muted">
            {line.dayLabel}
            {line.year !== null && <span className="ms-2">{line.year}</span>}
          </p>

          {/*
            ⚠ **The whole capture, wrapping, at the record's own type.** This is
            the one place on the page where the one-line rule does not apply —
            not an exception to it, but the reason for it: the row truncates
            *because* there is somewhere the rest of it lives. Same size, leading
            and tracking as `page-row`, so these are the same words, larger only
            by the desk's root scale.

            ⚠ **A struck line is struck here too**, with the identical pair of
            classes the row uses rather than two rules that agree.
          */}
          <p
            className={`mt-2 text-[length:var(--text-line)]/[var(--leading-line)] tracking-[-0.01em] ${
              crossedOff ? 'line-through opacity-50' : ''
            }`}
          >
            {line.text}
          </p>

          {/*
            **The photograph, at a size worth looking at.** On the row it rides
            the line in the year's slot, which is a mark saying *there is one*;
            in here it is the thing itself. Tapping it still opens it full size —
            the console is where a capture is shown, not where a picture is
            examined.

            ⚠ **The preview wins over the stored one while it exists**, for the
            row's own reason: there is no id to ask `/api/media` for until the
            upload returns, and an empty slot in the meantime is the app looking
            like it lost the photograph.
          */}
          {line.hasImage && photo && (
            <button
              type="button"
              onClick={onOpenPhoto}
              aria-label="Open the photograph"
              className="mt-3 block w-full"
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- a private route, not a CDN; see app/api/media */}
              <img
                src={photo}
                alt=""
                className="max-h-[40vh] w-full rounded-[3px] object-cover"
              />
            </button>
          )}

          {/*
            ⚠ **A real `<a>`, and the host rather than a title.** Both rules come
            straight off the row and neither is weakened by there being room:
            `noreferrer` because the destination is somewhere a person saved
            privately, and the host because **a URL is user input shaped like
            chrome** — rendering a fetched page title would be a capture claiming
            something nobody checked. §7's evidence rules come first.

            ⚠ **Struck with the line, and then it is a `<span>`.** There is no
            disabled state for an anchor — an `<a>` without an `href` is not a
            control at all — and a door out of a decision somebody has already
            made is not a door this page offers.
          */}
          {line.sourceUrl !== null &&
            (crossedOff ? (
              <span
                aria-hidden
                className="text-muted mt-3 inline-flex items-center gap-1.5 text-[0.8125rem] line-through opacity-50 [--glyph:var(--glyph-line)]"
              >
                <LinkGlyph />
                {linkLabel(line.sourceUrl)}
              </span>
            ) : (
              <a
                href={line.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted hover:text-chrome mt-3 inline-flex items-center gap-1.5 text-[0.8125rem] transition-colors [--glyph:var(--glyph-line)]"
              >
                <LinkGlyph />
                {linkLabel(line.sourceUrl)}
              </a>
            ))}

          {/*
            ⚠ **The standing question, in full, because there is room.** On the
            row it is a bare `?` in the year's slot — one character, no glyph, no
            new vocabulary. In here the question can actually be asked, which is
            what the `?` has been pointing at all along.

            ⚠ **It reuses the record's own pair rather than inventing an accept
            control**, and it reuses it *by being the same component*, so the two
            kinds of question this app asks cannot drift into looking like
            different kinds. They are not: both are one line of the record asking
            the person who wrote it to decide something, and both are answerable
            by ignoring them.
          */}
          {line.offer !== null && (
            <Ask
              ask={
                line.offer.year !== null
                  ? `${line.offer.title} (${line.offer.year})?`
                  : `${line.offer.title}?`
              }
              onYes={onAcceptOffer}
              onNo={onDeclineOffer}
            />
          )}

          {/*
            ⚠ **One question, and the word is *Again?*** The two outcomes are
            genuinely different claims — *I would do this again* against *that is
            dealt with* — and nothing about a raw capture can supply the answer.
            It is also the app's own name.
          */}
          {asking && <Ask ask="Again?" onYes={onAgain} onNo={onDone} />}

          {/*
            ─────────────────────────────────────────────────────────────────
             ⚠ WHO ELSE GOES HERE, AND THE SPACE IS DELIBERATELY EMPTY
            ─────────────────────────────────────────────────────────────────

            Phase 2's convergence sentence — *Sam too.* / *Sam has.* / *Sam wants
            to.* / *Sam has too.* — lands in this slot, and so, much later, does
            the conversation the brief holds back behind Phase 6's blocking,
            reporting and moderation requirements. **Build the space and leave it
            empty** is the brief's instruction, and this comment is it.

            ⚠ **Nothing renders here until there is something.** *Silence stays
            silent*: no *no matches yet*, no empty state for convergence on a
            line. **Nothing is the correct rendering of nothing** — and an
            absence explained is an absence the copied-provenance suppression
            rule worked hard to keep quiet.

            ⚠ **When it arrives it must arrive into a space that is already
            there**, and never as a spinner over the whole box. Everything above
            this line is on the page already; only this needs the network.
          */}
        </div>

        {/*
          ⚠ **The controls, on the bottom edge, and that is the design rather
          than a layout.** *Read from the top, act at the bottom* — on a handset
          the bottom of the box is the only part a thumb reaches without a
          regrip, and because the box never moves, neither do they.

          ⚠ **A crossed-off line offers one control and it is the way back.**
          Cross off is a resolution, not a delete — the row stays where it is,
          struck through — and while it is struck the other two would be acting
          on something somebody has said they are done with. The rewrite *goes*
          rather than going dark, which is the record's own rule for this pair: a
          dark pencil beside a struck line is the page explaining what it is
          refusing, and nothing there is the page showing one way back.
        */}
        <div className="mt-4 flex items-center justify-between [--glyph:var(--glyph-foot)]">
          <div className="flex items-center gap-5">
            <button
              type="button"
              onClick={onCrossOff}
              aria-label={crossedOff ? 'Put it back' : 'Cross it off'}
              className="text-chrome tap-target flex items-center"
            >
              <CrossOffGlyph />
            </button>

            {!crossedOff && (
              <button
                type="button"
                disabled={!onRewrite}
                onClick={() => onRewrite?.()}
                aria-label="Rewrite it"
                className={`tap-target flex items-center ${
                  onRewrite ? 'text-chrome' : 'text-muted opacity-40'
                }`}
              >
                <RewriteGlyph />
              </button>
            )}
          </div>

          {/*
            ⚠ **Settle sits apart from the other two, because it does something
            else.** Cross off and rewrite keep the line on the page; this sends it
            off the page, to the tray. The gap between them is that difference.

            ⚠ **A crossed-off line cannot be settled**, and that is the server's
            rule showing through rather than a second opinion: `resolveCapture`
            guards on `want`, so the settleable set is exactly the resolvable one,
            and the way back is the × that put it there.
          */}
          {!crossedOff && (
            <button
              type="button"
              onClick={onSettle}
              aria-label="Settle it"
              aria-expanded={asking}
              className="text-chrome tap-target flex items-center"
            >
              <SettleGlyph />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

/**
 * **One question, two answers**, and the console asks exactly the two the record
 * asks: *Again?* when a line is being settled, and *is this what you meant?*
 * when a possibility is offered.
 *
 * ⚠ **It is the record's `Question` moved in here rather than copied.** Both
 * kinds are one line of the record asking the person who wrote it to decide
 * something, and both are answerable by ignoring them; two components would be
 * two designs waiting to disagree about that.
 *
 * ⚠ **The record still renders one of them** — the offer, at the moment of
 * capture, so a question arrives visibly rather than as a mark somebody has to
 * notice. That is why this is exported.
 *
 * `gap-5` on a coarse pointer because Yes and No both carry a 44px hit area and
 * at `gap-4` the two expansions meet in the middle.
 */
export function Ask({
  ask,
  onYes,
  onNo,
}: {
  ask: string
  onYes: () => void
  onNo: () => void
}) {
  return (
    <div className="mt-4 flex flex-wrap items-center gap-4 pointer-coarse:gap-5">
      <span className="text-sm">{ask}</span>
      <button
        type="button"
        onClick={onYes}
        className="border-rule hover:border-text tap-target rounded border px-3 py-1 text-sm transition-colors"
      >
        Yes
      </button>
      <button
        type="button"
        onClick={onNo}
        className="text-muted hover:text-text tap-target text-sm transition-colors"
      >
        No
      </button>
    </div>
  )
}
