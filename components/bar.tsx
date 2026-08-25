'use client'

import Link from 'next/link'

import { TrayGlyph, YouGlyph } from './glyphs'

/**
 * **The bar: the page, and where you go.** The wordmark, the settled tray, you.
 *
 * ⚠ **The undo left on 25 August, for the line it takes back.** It was here
 * because it is page-level machinery — there is one last capture, not one per
 * line — and it went because the *confusable moment* written down below it never
 * had an answer: for ten seconds after a line landed, this undo and the foot's ×
 * were both lit and both acted on it, with nothing saying that one erases and
 * the other strikes through. They are one slot on the line now, in sequence
 * rather than side by side, so the pair can no longer be seen at once. See
 * `LineTools` in `page-screen.tsx`.
 *
 * That leaves three controls, the same three on every route, which is why this
 * component no longer takes a handler of any kind.
 *
 * The split from the foot is worth stating because it was got wrong twice. This
 * bar is page-level machinery; the foot is the tools that act on a line. Search
 * is not per-line — it answers *where is that thing I wrote in June* — and the
 * camera is not per-line either, since it *starts* a capture. Neither belongs in
 * a group hung off the line the caret is in, and on the desk that error was
 * visible as a magnifying glass sitting inside an active input, which reads as a
 * search box.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 *  Controls go off; they do not disappear
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * **The bar keeps its full shape and dims what cannot act.** That is what stops
 * a blank page reading as an unfinished one, and it is the whole of the density
 * device — seven controls on an empty first run, five of them off.
 *
 * Off is `--color-text` at 28%, a fade rather than a new hex, for the same
 * reason `--color-muted` is one: a fixed grey stays the shade it was mixed
 * against black and drifts on any other ground.
 *
 * ⚠ **The chrome is `--color-chrome`, not `--color-accent`.** It spent the
 * accent until 23 August, which was the one place the Phase 1 design broke a
 * rule in CLAUDE.md rather than extending it. Splitting the token ended that:
 * §11 reserves brass for overlap, and lit brass is a different colour with a
 * different job — the thing a thumb aims at.
 *
 * ⚠ **It does not make Phase 2 easier.** Overlap still needs a colour that
 * out-shouts a brass screen, and the screen is now louder than it was. §11's
 * own argument still applies — the accent's job is to interrupt — and the
 * candidate to beat is `--color-chrome`, not the muted brass beside it. Pick it
 * when Phase 2 has something to show, not now.
 *
 * ⚠ **No rule under the bar**, and none above the foot either. Notes has none;
 * space does the separating.
 *
 * ⚠ **`'use client'` is now only for the recede's transition class**, and it is
 * kept deliberately. It used to be load-bearing: the undo carried a handler, and
 * `Screen` — which `/settled`, `/profile` and somebody else's page use — is a
 * Server Component, so passing one across that boundary was a build-time error
 * that only appeared on the routes where `undo` was `null`. With no handler left
 * anywhere in these props that hazard is gone, and the directive stays because
 * removing it is a change to what this file *is* rather than to what it does.
 */

/** The off state, spelled once. */
export const OFF = 'text-[color-mix(in_srgb,var(--color-text)_28%,transparent)]'

export function Bar({
  receded = false,
}: {
  /**
   * Off the top of the glass while the record is being read — see
   * `useChromeRecede`, which decides it, and holds it down whenever anything
   * here can act.
   *
   * ⚠ **`false` everywhere else, and that is not an oversight.** The capture
   * page is the only route with a record to read; `/settled`, `/profile` and
   * somebody else's page are short, and a bar that leaves a screen with nothing
   * behind it is furniture animating for its own sake. The day one of those
   * grows a scroll, it passes the prop.
   */
  receded?: boolean
}) {
  return (
    /*
      `translate` rather than `transform`, which Tailwind v4 gives for free —
      see the note in `chrome-recede.ts` on why the property matters.
    */
    <header
      /*
        ⚠ **One duration and one curve, so both go on the base class and only the
        `translate` switches.** They were per-direction until 24 August, when the
        exit's 240ms was judged too quick on a handset and took the return's
        340ms — see `--recede` for why the two tokens collapsed rather than being
        set equal, and why re-splitting them needs a hardware reason.
      */
      className={`fixed inset-x-0 top-0 z-20 bg-[var(--glass-tint)] px-[var(--bar-gutter)] backdrop-blur-[var(--glass-blur)] pt-[calc(env(safe-area-inset-top)+var(--bar-lead))] pb-[var(--bar-tail)] transition-[translate] duration-[var(--recede)] ease-[var(--ease-recede)] ${
        receded ? '-translate-y-full' : ''
      }`}
    >
      {/*
        ⚠ **Full width, not the reading measure.** The foot holds the measure so
        its glyphs stay over the column of text they act on; this is page-level
        machinery and sits on the window's own edges. See `--bar-gutter`.

        `--glyph` is declared on the row rather than passed to seven components:
        every `Glyph` inside inherits it, and the bar's size is one line in the
        file the bar is in. See `--glyph-bar`, and `--glyph-foot` for why the
        two bars no longer share a number.
      */}
      <div className="flex h-[var(--bar-row)] w-full items-center justify-between [--glyph:var(--glyph-bar)]">
        {/*
          The mark is the way home and nothing else — there is one page, so
          "home" is where you already are on every route but two.

          `wordmark-trim` makes the element the letters, so it centres in the row
          honestly rather than inside a line box holding room for descenders the
          capitals do not use. See the utility in globals.css, which carries the
          measurements and the warning against scaling one face's set into
          another's.
        */}
        <Link
          href="/"
          className="wordmark wordmark-trim text-chrome text-[length:var(--text-mark)]"
        >
          Again
        </Link>

        {/*
          ⚠ **The gap is derived from `--tap-floor` and the glyph**, not chosen.
          A flat 22px beside 20px glyphs put 42px between centres against a 44px
          hit area, so the areas overlapped and the later one in DOM order took
          the taps. See `--bar-gap`.
        */}
        <div className="flex items-center gap-[var(--bar-gap)]">
          {/*
            A *place* you go, which is why the glyph is a plain tray — see
            `glyphs.tsx` for the pair it makes with the foot's settle.
          */}
          <Link
            href="/settled"
            aria-label="Settled"
            className="text-chrome tap-target flex items-center"
          >
            <TrayGlyph />
          </Link>

          <Link
            href="/profile"
            aria-label="You"
            className="text-chrome tap-target flex items-center"
          >
            <YouGlyph />
          </Link>
        </div>
      </div>
    </header>
  )
}
