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
  description: 'What would you try, and try again?',
}

export const viewport: Viewport = {
  themeColor: '#0e0e10',
  // Responsive from 320px up (§10).
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
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
