import type { Metadata, Viewport } from 'next'
import { IBM_Plex_Mono, IBM_Plex_Sans, Ojuju } from 'next/font/google'

import './globals.css'

/**
 * The wordmark, and only the wordmark (§11 is silent on the name itself).
 * Static single weight — only the mark uses this, so the variable range is
 * payload nobody spends. See docs/decisions.md.
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
  description: 'Things to try. Things to do again.',
}

export const viewport: Viewport = {
  themeColor: '#0e0e10',
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

    ⚠ Support is uneven — Chrome has had it for a while, Safari is unconfirmed
    here. The `max-h` on the dropdown and the scroll-into-view on focus are the
    fixes that stand without it; this one upgrades the behaviour where it lands
    and changes nothing where it does not.
  */
  interactiveWidget: 'resizes-content',
}

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`${plexSans.variable} ${plexMono.variable} ${ojuju.variable} h-full`}
    >
      <body className="bg-bg text-text flex min-h-full flex-col">{children}</body>
    </html>
  )
}
