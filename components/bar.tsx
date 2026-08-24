'use client'

import Link from 'next/link'

import { TrayGlyph, UndoGlyph, YouGlyph } from './glyphs'

/**
 * **The bar: the page, and where you go.** The wordmark, undo, the settled tray,
 * you.
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
 * ⚠ **`'use client'`, because the undo carries a handler.** Every route renders
 * this, and `Screen` — which `/settled`, `/profile` and somebody else's page use
 * — is a Server Component: passing an event handler across that boundary is a
 * build-time error, and it is one that only appears on the routes where `undo`
 * is `null`, because a component with no handler in its props looks fine until
 * something reads the one inside it. The alternative was rendering a `<span>`
 * when there is nothing to undo, which loses `disabled` — and the platform
 * saying a control cannot act is half of what "off, not gone" means.
 */

/** The off state, spelled once. */
export const OFF = 'text-[color-mix(in_srgb,var(--color-text)_28%,transparent)]'

export function Bar({
  undo = null,
  receded = false,
}: {
  /**
   * The bar's undo, and it **deletes** — the single exception to §5.1.
   *
   * ⚠ **It carries the ten-second window as a colour**: brass while live, off
   * once past. That is Notes' own undo/redo grammar doing real work, and it
   * replaces both the inline undo control and the retreating hairline an earlier
   * draft proposed.
   *
   * ⚠ **The confusable moment is narrow and real.** For ten seconds after a line
   * lands, this and the foot's × are both lit and both act on it, and nothing
   * says one erases while the other strikes through. Undo being dark almost
   * always is most of what keeps them apart. If that proves too thin on
   * hardware, the fix is a word rather than a glyph on the undo — not a new
   * colour.
   *
   * `null` on every screen that is not the page: nothing else creates a capture,
   * so nothing else has one to take back.
   */
  undo?: { live: boolean; onUndo: () => void } | null
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
      className={`bg-bg fixed inset-x-0 top-0 z-20 px-[var(--bar-gutter)] pt-[calc(env(safe-area-inset-top)+var(--bar-lead))] pb-[var(--bar-tail)] transition-[translate] duration-(--recede) ease-out ${
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
          <button
            type="button"
            /*
              Present and off rather than absent, like everything else in the two
              bars. `disabled` rather than a missing handler, so the platform
              says so too.
            */
            disabled={!undo?.live}
            onClick={() => undo?.onUndo()}
            aria-label="Undo the last capture"
            className={`tap-target flex items-center transition-colors ${
              undo?.live ? 'text-chrome' : OFF
            }`}
          >
            <UndoGlyph />
          </button>

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
