'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'

import { authClient } from '@/lib/auth-client'

/**
 * §11: the accent marks overlap state and nothing else — not on links, not on
 * the active tab. The active item here is distinguished by text colour alone.
 */
export function Nav({ handle }: { handle: string }) {
  const pathname = usePathname()
  const router = useRouter()

  const links = [
    { href: '/', label: 'Add' },
    { href: '/me', label: 'Me' },
  ] as const

  return (
    // pt on the header, not the nav: the rule and background should reach the
    // top of the screen while the content clears the notch.
    <header className="border-rule border-b pt-[env(safe-area-inset-top)]">
      <nav
        aria-label="Main"
        className="gutter mx-auto flex w-full max-w-xl items-center gap-4 py-3 sm:gap-5"
      >
        {/* -mt-px: optical alignment against the tabs beside it. */}
        <Link href="/" className="wordmark -mt-px shrink-0 text-wordmark-nav">
          Again
        </Link>

        {/*
          min-w-0 so this group yields space to the handle rather than forcing
          the row wider than 320px; the links inside it never shrink.

          -my-3/py-3 on each link expands the tap target to the full height of
          the header. Without it the target is the height of the text, around
          20px, against a 44px floor.
        */}
        <div className="flex min-w-0 flex-1 items-center gap-4">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              aria-current={pathname === link.href ? 'page' : undefined}
              className={`shrink-0 -my-3 py-3 text-sm transition-colors ${
                pathname === link.href ? 'text-text' : 'text-muted hover:text-text'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/*
          Sans, not mono: a displayed handle is a name, not data (§11).
          Truncates because it is the only variable-width thing in the row, so
          it is the only thing that can be allowed to give.
        */}
        <span className="text-muted min-w-0 truncate text-xs">@{handle}</span>

        <button
          type="button"
          onClick={async () => {
            await authClient.signOut()
            router.push('/sign-in')
            router.refresh()
          }}
          className="text-muted hover:text-text -my-3 shrink-0 py-3 text-xs transition-colors"
        >
          Sign out
        </button>
      </nav>
    </header>
  )
}
