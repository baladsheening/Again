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
    <header className="border-rule border-b">
      <nav
        aria-label="Main"
        className="mx-auto flex w-full max-w-2xl items-center gap-6 px-5 py-4"
      >
        <Link href="/" className="text-[15px] font-medium tracking-tight">
          Again
        </Link>

        <div className="flex flex-1 items-center gap-5">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              aria-current={pathname === link.href ? 'page' : undefined}
              className={`text-sm transition-colors ${
                pathname === link.href ? 'text-text' : 'text-muted hover:text-text'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        <span className="text-muted font-mono text-xs">@{handle}</span>

        <button
          type="button"
          onClick={async () => {
            await authClient.signOut()
            router.push('/sign-in')
            router.refresh()
          }}
          className="text-muted hover:text-text text-xs transition-colors"
        >
          Sign out
        </button>
      </nav>
    </header>
  )
}
