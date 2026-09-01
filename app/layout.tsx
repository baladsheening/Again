import type { Metadata, Viewport } from 'next'
import { Bebas_Neue, Fira_Sans, IBM_Plex_Mono, Instrument_Serif } from 'next/font/google'

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
 * The interface and body face — **Fira Sans since 21 August, and a deviation
 * from §11, which names IBM Plex Sans.**
 *
 * Directed: the menus and the collection rows should go with Jost, and be
 * readable without getting boring or overwhelming. Plex Sans is neither of the
 * last two, but it is *engineered* in the same rational way Jost is, and two
 * rational faces beside each other read as one slightly inconsistent voice
 * rather than as a pairing.
 *
 * Fira Sans is humanist where Jost is geometric, which is the contrast the
 * pairing was missing, and it was drawn for small text on screens — the one
 * thing this app asks of it, in the rail's 12px uppercase labels and in a list
 * of film titles. See docs/decisions.md.
 *
 * ⚠ **It breaks the Plex superfamily, and the cost lands on the mono.** Plex Sans
 * and Plex Mono share skeletons, so a return count sat inside a sentence
 * invisibly. Plex Mono stays — §11 names it and nothing asked for it to move —
 * but it is now a *contrast* against the text rather than a sibling of it. If
 * that ever reads as a mismatch the answer is Fira Mono, which is Fira Sans's
 * actual sibling, and it is one line here plus `--font-mono`.
 */
const firaSans = Fira_Sans({
  variable: '--font-fira-sans',
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  display: 'swap',
})

/**
 * **The same face, slanted — for one thing: a capture that is not in the record
 * yet.** See `unsent` in globals.css, which is the only rule that names it.
 *
 * ⚠ **A real italic, because the alternative is a fake one.** `font-style:
 * italic` against a family loaded upright-only does not fail — the browser
 * *synthesises* a slant by shearing the roman, which on a page whose §11 rule is
 * *type is the entire design* is the one outcome worth spending a request to
 * avoid. Fira Sans has a drawn italic; this is it.
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
const firaSansItalic = Fira_Sans({
  variable: '--font-fira-italic',
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
      className={`${firaSans.variable} ${firaSansItalic.variable} ${plexMono.variable} ${bebasNeue.variable} ${instrumentSerif.variable} h-full`}
    >
      <body className="bg-bg text-text flex min-h-full flex-col">{children}</body>
    </html>
  )
}
