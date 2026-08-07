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
