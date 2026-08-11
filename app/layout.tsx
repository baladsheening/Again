import type { Metadata, Viewport } from 'next'
import { IBM_Plex_Mono, IBM_Plex_Sans, Ojuju, Space_Grotesk } from 'next/font/google'

import './globals.css'

/**
 * The wordmark, and only the wordmark (§11 is silent on the name itself).
 * Static single weight — only the mark uses this, so the variable range is
 * payload nobody spends. See docs/decisions.md.
 */
const spaceGrotesk = Space_Grotesk({
  variable: '--font-space-grotesk',
  subsets: ['latin'],
  weight: '500',
  display: 'swap',
})

/**
 * The previous wordmark face, kept on purpose rather than deleted — switching
 * back is one line in `globals.css`, where `--font-display` chooses between
 * them.
 *
 * **`preload: false` is what stops that costing anything.** `@font-face` is
 * lazy: a browser fetches a font only when text actually uses the family, and
 * nothing uses this one now. What would fetch it regardless is next/font's
 * default preload hint, so that is the thing turned off. The declaration stays,
 * the variable stays, the download does not happen.
 */
const ojuju = Ojuju({
  variable: '--font-ojuju',
  subsets: ['latin'],
  weight: '500',
  display: 'swap',
  preload: false,
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
  description: 'Things to try. Things to do again.',
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
