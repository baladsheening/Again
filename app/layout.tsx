import type { Metadata, Viewport } from 'next'
import { Bebas_Neue, IBM_Plex_Mono, Instrument_Serif, Schibsted_Grotesk } from 'next/font/google'

import './globals.css'

/*
 * ─────────────────────────────────────────────────────────────────────────────
 *  Jost is DELETED — 1 September
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * It set the mark from 21 August, in capitals, chosen after looking at eleven
 * faces set as AGAIN. The mark is Instrument Serif now — directed, *the font is
 * meant to be the one we used for the logo on the log in screen* — so nothing
 * points at `--font-jost` and the declaration goes with it.
 *
 * ⚠ **Deleted rather than left declared, which is this file's own rule**, applied
 * to Ojuju and Space Grotesk before it: a font declared and pointed at by nothing
 * is a font the next person reapplies without knowing why it was there. The
 * reserve below is one slot, deliberately, and it is Bebas Neue's.
 *
 * ⚠ **It was not free to leave in.** next/font preloads by default, so a face no
 * rule named was still a `<link rel=preload>` on every page in the app. That is
 * what `preload: false` exists for on the two faces that keep it — and a face
 * with no consumer at all does not need the flag, it needs deleting.
 *
 * Jost's complete fence — 1.445 / −0.37 / −0.375 / 0.7 / 0 / 0.1525, advance
 * 2.6592 setting KEEP at 0.08em — is in git and in globals.css's history.
 */

/**
 * The reserve. **Held on purpose, for a refresh later — directed 21 August.**
 *
 * Bebas Neue has no lowercase at all: the family is capitals, which makes it the
 * one face here that cannot be set in the wrong case. Condensed marquee caps,
 * and the `I` in AGAIN carries the same weight as the `N` beside it.
 *
 * **`preload: false` is what stops it costing anything.** `@font-face` is lazy —
 * a browser fetches a font only when text actually uses the family, and nothing
 * uses this one. What would fetch it regardless is next/font's default preload
 * hint, so that is the thing turned off. The declaration stays, the variable
 * stays, the download does not happen.
 *
 * ⚠ **This flag and `--font-display` are one decision written in two files**, and
 * switching is more than those two lines: `wordmark-trim` and the `--wordmark-*`
 * tokens in globals.css are measurements of a *specific face in a specific
 * case*, and Bebas Neue's complete set is written down beside the live one
 * there, ready to swap. Read that note before switching; do not switch this flag
 * alone. ⚠ **Four of its numbers are still measured for AGAIN and are marked so
 * in that block** — point `serifmark.mjs` at `--font-bebas-neue` and read them
 * off before believing them.
 */
const bebasNeue = Bebas_Neue({
  variable: '--font-bebas-neue',
  subsets: ['latin'],
  weight: '400',
  display: 'swap',
  preload: false,
})

/**
 * The interface and body face — **Schibsted Grotesk since 1 September**, and
 * still a deviation from §11, which names IBM Plex Sans.
 *
 * ⚠ **It replaces Fira Sans, which held this since 21 August, and the reason is
 * LEADING rather than taste.** Directed: a face that is readable and distinctive
 * and *lets the lines sit closer together than Fira Sans does*. Fira's box is
 * 1.2em of ascent and descent at any size, which is what a line box has to hold
 * before any leading is added; a grotesque drawn for news setting carries less,
 * so the same 18px type can be set on less than 28px without the descenders of
 * one line reaching the capitals of the next.
 *
 * ⚠ **The face is not the whole of that gap and must not be sold as if it were.**
 * A record row is `--line-hem` + `--leading-line` + `--line-hem` = 8 + 28 + 8,
 * so 16 of the 44px between two lines is padding that was chosen, and the 44
 * itself is `--tap-floor`. This change makes tightening *possible*; it does not
 * tighten anything on its own. See `--leading-line`.
 *
 * Schibsted Grotesk is a Norwegian newspaper commission — drawn for small sizes,
 * for density, and with the narrow apertures and short extenders that go with
 * it. It is a grotesque where the mark is now a high-contrast serif, which is a
 * sharper pairing than Fira's humanist warmth made against Jost.
 *
 * ⚠ **It breaks the Plex superfamily, and the cost lands on the mono.** Plex Sans
 * and Plex Mono share skeletons, so a return count sat inside a sentence
 * invisibly. Plex Mono stays — §11 names it and nothing asked for it to move —
 * but it is now a *contrast* against the text rather than a sibling of it. That
 * argument survives the change of face unaltered; what does not survive is its
 * escape hatch. **Fira Mono is no longer the answer**, because Fira Sans is no
 * longer the body. Schibsted has no mono, so if the pairing ever reads as a
 * mismatch it is a fresh choice rather than a sibling to reach for.
 */
const bodySans = Schibsted_Grotesk({
  variable: '--font-body-sans',
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  display: 'swap',
})

/**
 * **The same face, slanted — for one thing: a capture that is not in the record
 * yet.**
 *
 * ⚠⚠ **`unsent` NO LONGER EXISTS, so nothing in the app names this — found 1
 * September, while swapping the face.** That utility was deleted with the
 * writing band, and this docblock went on citing it as "the only rule that names
 * it" for a week. **It is kept anyway, and the reason is not inertia:** the
 * guarantee below is that a slant on this page is drawn and never synthesised,
 * and the day a draft state comes back the alternative is a sheared roman that
 * nobody notices is wrong. `preload: false` means it costs a declaration and no
 * bytes. **If it is still unused when something else forces a look at this file,
 * delete it** — the rule that took Jost applies here too, only without the
 * preload that made Jost urgent.
 *
 * ⚠ **A real italic, because the alternative is a fake one.** `font-style:
 * italic` against a family loaded upright-only does not fail — the browser
 * *synthesises* a slant by shearing the roman, which on a page whose §11 rule is
 * *type is the entire design* is the one outcome worth spending a request to
 * avoid. Schibsted Grotesk has a drawn italic, as Fira Sans did; this is it.
 *
 * ⚠ **400 alone.** The body is the only thing that can be unsent, and it is the
 * only weight on the page that this can reach. A `style` array on the loader
 * above would have crossed with its three weights and declared six faces to use
 * one.
 *
 * **`preload: false`, for the reason Bebas Neue carries it**: `@font-face` is
 * lazy, so the file is fetched the first time somebody has a draft on screen and
 * never on a page that has none. What would fetch it regardless is next/font's
 * default preload hint, so that is the thing turned off.
 */
const bodySansItalic = Schibsted_Grotesk({
  variable: '--font-body-italic',
  subsets: ['latin'],
  weight: '400',
  style: 'italic',
  display: 'swap',
  preload: false,
})

/**
 * **The zine treatment's display face — 31 August. THE WORDMARK'S FACE TOO,
 * since 1 September.**
 *
 * A high-contrast serif for the two screens that are composition rather than
 * record: the sign-in wall's mark and the first run's command. It is the free
 * face nearest the direction that was briefed (`Ogg`, which is licensed and not
 * on this machine) — narrow, sharply cut, and it holds together at the poster
 * sizes those two screens set it at.
 *
 * ⚠ **It is now the wordmark's face as well, and this note used to say the
 * opposite.** It read *it is NOT the wordmark's face… that is the same job as
 * the rename, and it wants doing with it rather than before it.* The rename went
 * first and this followed a day later, directed — which is the order that let the
 * record column's two moves be told apart. `--font-display` and `--font-serif`
 * both resolve here now; the fence at the top of globals.css is re-measured for
 * it, and the two tokens deliberately stay two.
 *
 * ⚠ **One weight — 400 — and the fence carries it.** `--wordmark-weight` exists
 * because this family has no 500 and the `wordmark` utility used to ask for one.
 *
 * **Preloaded, unlike the two reserve faces.** The sign-in wall is the first
 * page a new account ever sees and this face is the largest thing on it, so a
 * swap here is the swap a stranger watches — and it is now on the bar of every
 * signed-in screen as well, which is a second reason not to let it flash.
 */
const instrumentSerif = Instrument_Serif({
  variable: '--font-serif-face',
  subsets: ['latin'],
  weight: '400',
  display: 'swap',
})

/**
 * §11: IBM Plex Mono for return counts and timestamps. The mono is not
 * ornament — counts are data, and they're the one number in the product that
 * can't be inflated.
 */
const plexMono = IBM_Plex_Mono({
  variable: '--font-plex-mono',
  subsets: ['latin'],
  weight: ['400', '500'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Keep',
  /*
    The tagline, and it is the tagline that lives here rather than a description
    written for this slot — see `app/sign-in/page.tsx`, where the same line sits
    under the mark, and `docs/decisions.md` for why the two are one string.

    ⚠ **The second line on the sign-in page is deliberately not here.** This is a
    sentence a search result or a link preview shows on its own, and the pair
    reads as a lockup rather than as a description.
  */
  description: 'things to try. things to try again.',
  /*
    Installed to the home screen, the app runs without Safari's chrome — see
    `app/manifest.ts` for why that is worth having rather than merely tidy.

    ⚠ **This is the half iOS actually obeys.** The manifest's `display:
    'standalone'` is only honoured from 16.4; `apple-mobile-web-app-capable`,
    which this emits, is what has decided it for a decade and still decides it
    on anything older. Setting one without the other silently half-works, which
    is the worst of the three outcomes because it looks done.
  */
  appleWebApp: {
    capable: true,
    title: 'Keep',
    /*
      The web view extends under the status bar rather than being pushed below a
      black strip, which is the same arrangement `viewportFit: 'cover'` already
      sets up for the browser — and every surface that needs to keep clear of it
      already spends `env(safe-area-inset-top)` to do so.

      On a pure-black app the visible difference is nil either way. The reason to
      prefer this one is that the two modes then behave identically, so a
      spacing fault cannot appear in the installed app and nowhere else.
    */
    statusBarStyle: 'black-translucent',
  },
}

export const viewport: Viewport = {
  // Matches --color-bg. iOS tints the status-bar strip from this, so a mismatch
  // shows as a lighter band across the top of every screen.
  themeColor: '#000000',
  // Responsive from 320px up (§10).
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  /*
    Shrink the layout viewport when the software keyboard opens, instead of
    letting it sit over the page.

    Without this a browser resizes only the *visual* viewport: the page still
    believes it has the full height, lays content out underneath the keyboard in
    good faith, and ordinary scrolling cannot reach it. That is what made the
    capture dropdown unusable in landscape.

    ⚠ **iOS Safari ignores this, measured on the handset on 11 August.** With the
    keyboard open the probe read `cli 660` against `vv.h 389`: the layout viewport
    did not shrink by a pixel, and that 271px difference is exactly the scroll
    range iOS then invented for the document — see the clamp in
    `components/shell.tsx`, which is what actually holds the phone case together.

    Kept because it is correct and free where it does land, and Chrome has had it
    for a while. But **nothing may be built on the assumption that it works.** The
    comment above said "Safari is unconfirmed here" while three fixes downstream
    quietly relied on it; unconfirmed is now confirmed, in the negative.
  */
  interactiveWidget: 'resizes-content',
}

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`${bodySans.variable} ${bodySansItalic.variable} ${plexMono.variable} ${bebasNeue.variable} ${instrumentSerif.variable} h-full`}
    >
      {/*
        ⚠⚠ **`bg-bg` CAME OFF THE BODY ON 1 SEPTEMBER AND MUST NOT GO BACK.** It
        was a second, redundant coat of `--color-bg`: `html` already paints it in
        globals.css, and an html background *is* the canvas background, so the
        page looked identical with or without this class.

        It is not harmless now. `grain-ground` below sits at `z-index: -1` so that
        every screen gets the paper without having to opt in, and **a negative-z
        child paints above its parent's background and below its grandparent's**.
        With a background on the body the paper is painted over and vanishes — on
        every screen at once, with nothing in the console to say so.
      */}
      <body className="text-text flex min-h-full flex-col">
        {/*
          **The paper, mounted once for the whole app — 1 September, directed.**

          It was on two screens: the sign-in wall, and the record *while empty*.
          The second is the one that mattered — it goes the instant a line lands,
          so with a real record it was never on screen at all, and the ground had
          never been seen in daily use. Here it is on every route, signed in or
          out, and there is one mount rather than one per screen.

          ⚠ **It is outside `{children}` on purpose.** Route content re-renders;
          this must not, or a client navigation re-rasterises a full-bleed
          photograph. Sitting in the root layout it is painted once per document.

          ⚠ **`aria-hidden` because it is a texture with no content in it**, and
          `pointer-events: none` in the utility so it can never take a tap meant
          for the record it sits under.
        */}
        <div aria-hidden className="grain-ground" />
        {children}
      </body>
    </html>
  )
}
