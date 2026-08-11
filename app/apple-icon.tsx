import { ImageResponse } from 'next/og'

/**
 * The home-screen icon, for the installed app — see `app/manifest.ts`.
 *
 * iOS takes this from the `apple-touch-icon` link rather than from the
 * manifest's `icons`, and Next emits that link itself from this file's
 * existence. Without it the home screen shows a screenshot of the page, which
 * on a matte-black app is a black rectangle with some posters in it.
 *
 * 180px is the size iOS asks for on a 3× handset and the one it scales the rest
 * from.
 *
 * ⚠ **Not IBM Plex, and it should be.** §11 sets the interface in Plex Sans, but
 * `ImageResponse` rasterises with its own bundled face and needs real font bytes
 * to use another — which means shipping a TTF for one glyph, on a machine that
 * cannot reach Google Fonts to fetch one. **This is a placeholder**: the right
 * end state is a designed asset, at which point this file becomes a PNG in
 * `public/` and the manifest gains a proper `icons` array.
 *
 * No rounded corners and no padding ring. iOS masks the square itself, and a
 * shape drawn inside a shape it is about to be clipped by is how an icon ends up
 * with two edges.
 */

export const size = { width: 180, height: 180 }
export const contentType = 'image/png'

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        /*
          **The one place a `style` attribute is correct.** The rule exists
          because `proxy.ts` sets `style-src` with no `unsafe-inline`, so an
          attribute is dropped in production and nowhere else. Nothing here ever
          reaches a browser: Satori rasterises this tree to a PNG at build time,
          it accepts inline styles and only inline styles, and no CSP is
          involved at any point. A class would silently do nothing.
        */
        // eslint-disable-next-line no-restricted-syntax
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          /* Matches --color-bg and the manifest's two colours. */
          background: '#000000',
          color: '#fafafa',
          fontSize: 116,
          /*
            The wordmark's own initial, in the wordmark's own case. The mark was
            in caps for part of 10 August and is now `Again` — if it moves again,
            this moves with it.
          */
          letterSpacing: '-0.04em',
        }}
      >
        A
      </div>
    ),
    size,
  )
}
