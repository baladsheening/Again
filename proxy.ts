import { NextResponse, type NextRequest } from 'next/server'

/**
 * Security headers (§10). Named `proxy` rather than `middleware` — Next.js 16
 * renamed the convention and the runtime is Node.js.
 *
 * The CSP is nonce-based because §10 requires no `unsafe-inline`. The usual
 * objection to nonces is that they force dynamic rendering; that costs this app
 * nothing, since every page is behind auth and personal to the viewer, so none
 * of it was ever going to be statically cached.
 */
export function proxy(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64')
  const isDev = process.env.NODE_ENV === 'development'

  /*
    ⚠ **`style-src`'s nonce does not cover `style="…"` attributes, and nothing
    can.** A nonce is an attribute on a `<style>` element; a style *attribute*
    has nowhere to carry one, so this policy drops every inline style the server
    renders — while `next dev`'s `unsafe-inline` renders them fine. That
    divergence shipped a masthead with no safe-area padding and a wordmark with
    no trims, and neither was visible outside production (found 10 August).

    Nothing in the app renders a `style` attribute now; `no-restricted-syntax` in
    eslint.config.mjs enforces it, and the values that used to live in one are in
    app/globals.css. Writing `el.style.x` from an effect is a different thing and
    stays allowed — CSP governs the parsing of attributes, not the CSSOM.

    So the style nonce buys nothing today: the app ships one linked stylesheet
    and no `<style>` elements. It stays because the cost is a base64 string, and
    the alternative — `'self'` alone — quietly permits the first inline `<style>`
    anything adds.

    Do not "fix" a blocked style by adding `style-src-attr 'unsafe-inline'`. It
    would work, and it would re-open every inline style in the app to anything
    that can inject an attribute. Move the declaration into globals.css instead.
  */
  const csp = `
    default-src 'self';
    script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isDev ? " 'unsafe-eval'" : ''};
    style-src 'self' ${isDev ? "'unsafe-inline'" : `'nonce-${nonce}'`};
    img-src 'self' blob: data: https://image.tmdb.org;
    font-src 'self';
    connect-src 'self';
    worker-src 'self';
    manifest-src 'self';
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    frame-ancestors 'none';
    upgrade-insecure-requests;
  `
    .replace(/\s{2,}/g, ' ')
    .trim()

  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-nonce', nonce)
  requestHeaders.set('Content-Security-Policy', csp)

  const response = NextResponse.next({ request: { headers: requestHeaders } })

  response.headers.set('Content-Security-Policy', csp)
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')

  if (!isDev) {
    response.headers.set(
      'Strict-Transport-Security',
      'max-age=63072000; includeSubDomains; preload',
    )
  }

  return response
}

export const config = {
  matcher: [
    {
      // Poster images come straight from TMDB's CDN, so `_next/image` is not in
      // the path for them — we never proxy images through the app (§3).
      source: '/((?!api|_next/static|_next/image|favicon.ico|manifest.webmanifest|sw.js).*)',
      missing: [
        { type: 'header', key: 'next-router-prefetch' },
        { type: 'header', key: 'purpose', value: 'prefetch' },
      ],
    },
  ],
}
