import type { Metadata, Viewport } from 'next'
import { IBM_Plex_Mono, IBM_Plex_Sans, Ojuju, Space_Grotesk } from 'next/font/google'

import './globals.css'

/**
 * The previous wordmark face, kept on purpose rather than deleted — switching
 * between the two is one line in `globals.css`, where `--font-display` chooses.
 *
 * **`preload: false` is what stops the unused one costing anything.**
 * `@font-face` is lazy: a browser fetches a font only when text actually uses
 * the family, and nothing uses this one now. What would fetch it regardless is
 * next/font's default preload hint, so that is the thing turned off. The
 * declaration stays, the variable stays, the download does not happen.
 *
 * ⚠ **This flag and `--font-display` are one decision written in two files.**
 * It has been on both faces now — Space Grotesk carried it until 9 August, Ojuju
 * from then until 15 August, and Space Grotesk again since. Leaving it on the
 * face in use costs a render-blocking fetch nobody asked for; leaving it off
 * both costs the mark a flash of fallback on first paint.
 */
const spaceGrotesk = Space_Grotesk({
  variable: '--font-space-grotesk',
  subsets: ['latin'],
  weight: '500',
  display: 'swap',
  preload: false,
})

/**
 * The wordmark, and only the wordmark (§11 is silent on the name itself).
 * Static single weight — only the mark uses this, so the variable range is
 * payload nobody spends. See docs/decisions.md.
 *
 * **Back in use since 15 August**, on the instruction that Space Grotesk did not
 * work for the mark. It set the mark from 9 August until then.
 */
const ojuju = Ojuju({
  variable: '--font-ojuju',
  subsets: ['latin'],
  weight: '500',
  display: 'swap',
})

/** §11: IBM Plex Sans for interface and body. Avoid Inter. */
const plexSans = IBM_Plex_Sans({
  variable: '--font-plex-sans',
  subsets: ['latin'],
  weight: ['400', '500', '600'],
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
  title: 'Again',
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
    title: 'Again',
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
      className={`${plexSans.variable} ${plexMono.variable} ${spaceGrotesk.variable} ${ojuju.variable} h-full`}
    >
      <body className="bg-bg text-text flex min-h-full flex-col">{children}</body>
    </html>
  )
}
