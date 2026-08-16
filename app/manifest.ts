import type { MetadataRoute } from 'next'

/**
 * What the app is when it is installed rather than visited.
 *
 * **Added 11 August to remove Safari's chrome rather than fight it.** At the
 * time the document was held at zero to keep `position: fixed` honoured with a
 * keyboard open, and since Safari collapses its toolbar in response to the
 * *document* scrolling, that toolbar was permanently expanded in a browser tab.
 * Installing was the way out: no address bar, no toolbar, and the app's own bar
 * at the foot owning the bottom of the phone outright.
 *
 * ⚠ **The trade this describes no longer exists, and this is kept anyway.** The
 * document scrolls again since 13 August — the lock was measured unnecessary,
 * see app/globals.css — so the address bar retracts in a tab like anywhere else.
 * Standalone is still the better place for this app to live, but it is now a
 * preference rather than a workaround, and nothing here is load-bearing for the
 * keyboard.
 *
 * ⚠ **iOS reads two different things and both are needed.** `display` here is
 * honoured from iOS 16.4; before that, and still most reliably, it is
 * `apple-mobile-web-app-capable` that decides — set through `appleWebApp` in
 * `app/layout.tsx`. Changing one without the other silently half-works.
 *
 * No `icons` array. iOS takes its home-screen icon from the
 * `apple-touch-icon` link, which `app/apple-icon.tsx` generates and Next wires
 * up on its own — the array here is what Chrome uses for its install prompt, and
 * that wants real raster assets at fixed sizes rather than a generated route.
 * Worth doing when Android is a target; it is not one today (§2).
 *
 * No `orientation`. The shell has a landscape dock at 45rem and handsets cross
 * that turned sideways, so locking it would remove a layout that already exists.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Again',
    short_name: 'Again',
    /* The tagline, the same string `app/layout.tsx` sets as the description. */
    description: 'things to try. things to try again.',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    /*
      Both black, and both matter. `background_color` paints the splash screen
      while the app boots, `theme_color` tints the system furniture around it —
      either one wrong is a light flash on a matte-black app, which is the most
      visible possible way to get this wrong (§11).

      Spelled out rather than taken from `--color-bg`, for the same reason the
      header's shadow is: this file cannot read a CSS token. If that token ever
      moves, this moves with it by hand.
    */
    background_color: '#000000',
    theme_color: '#000000',
  }
}
