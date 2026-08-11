import type { MetadataRoute } from 'next'

/**
 * What the app is when it is installed rather than visited.
 *
 * **Added 11 August to remove Safari's chrome rather than fight it.** The page
 * scrolls inside `#scroll-root` and the document is held at zero — see the clamp
 * in `components/shell.tsx` — which is what keeps `position: fixed` honoured
 * while a keyboard is open. Safari collapses its own toolbar in response to the
 * *document* scrolling, so that toolbar is now permanently expanded in a browser
 * tab, and the two cannot both be had: the document scrolling is the fault, and
 * the address bar retracting was a side effect of it.
 *
 * Installed, the question stops existing. There is no address bar and no
 * toolbar, so the app's own bar at the foot is the only furniture on the screen
 * and it owns the bottom of the phone outright.
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
    description: 'Things to try. Things to do again.',
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
