import Link from 'next/link'

import LogoutButton from '@/app/components/LogoutButton'

export type NavSegment = 'home' | 'trips' | 'blog'

const LINKS: { segment: NavSegment; href: string; label: string; emoji: string }[] = [
  { segment: 'home', href: '/home', label: 'Casa', emoji: '🏡' },
  { segment: 'trips', href: '/trips', label: 'Lista', emoji: '🗺️' },
  { segment: 'blog', href: '/blog', label: 'Blog', emoji: '📖' },
]

/**
 * Stays a server component on purpose: the active segment comes down as a prop
 * rather than from `usePathname`, so the nav costs no client JS beyond the
 * logout button.
 */
export default function NavBar({ active }: { active: NavSegment }) {
  return (
    <header className="sticky top-0 z-30 px-4 pt-4 pb-2 sm:px-6">
      <nav
        aria-label="Navigazione principale"
        className="card-glass mx-auto flex w-full max-w-3xl items-center gap-1 p-2 sm:gap-2"
      >
        <ul className="flex min-w-0 flex-1 items-center gap-1 sm:gap-2">
          {LINKS.map((link) => {
            const current = link.segment === active
            return (
              <li key={link.segment} className="min-w-0">
                <Link
                  href={link.href}
                  aria-current={current ? 'page' : undefined}
                  className={[
                    'flex items-center gap-1.5 rounded-pill px-2.5 py-2 text-sm font-semibold transition-colors sm:px-3.5',
                    current
                      ? 'bg-blush-500 text-blush-50 shadow-soft'
                      : 'text-ink-600 hover:bg-blush-100 hover:text-blush-800',
                  ].join(' ')}
                >
                  <span aria-hidden="true">{link.emoji}</span>
                  <span className="truncate">{link.label}</span>
                </Link>
              </li>
            )
          })}
        </ul>
        <LogoutButton />
      </nav>
    </header>
  )
}
