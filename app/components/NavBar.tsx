import Link from 'next/link'

import LogoutButton from '@/app/components/LogoutButton'
import MobileNav from '@/app/components/MobileNav'
import { NAV_LINKS, type NavSegment } from '@/app/components/navLinks'

export type { NavSegment }

/**
 * Stays a server component on purpose: the active segment comes down as a prop
 * rather than from `usePathname`, so the nav costs no client JS beyond the
 * logout button and the mobile disclosure toggle.
 *
 * Two renderings, one source of truth (`NAV_LINKS`):
 *  - below `sm`, `MobileNav` shows the current page's name and a hamburger.
 *  - at `sm` and up, the links sit inline as buttons.
 *
 * They are swapped with `hidden`/`sm:flex` rather than by measuring the
 * viewport in JS, so the correct one is in the very first HTML the browser
 * gets — no flash of the wrong nav on load.
 */
export default function NavBar({ active }: { active: NavSegment }) {
  return (
    <header className="sticky top-0 z-30 px-4 pt-4 pb-2 sm:px-6">
      <nav
        aria-label="Main navigation"
        className="card-brut mx-auto flex w-full max-w-3xl items-center gap-1 p-2 sm:gap-2"
      >
        <MobileNav links={NAV_LINKS} active={active} />

        <ul className="hidden min-w-0 flex-1 items-center gap-1 sm:flex sm:gap-2">
          {NAV_LINKS.map((link) => {
            const current = link.segment === active
            return (
              <li key={link.segment} className="min-w-0">
                <Link
                  href={link.href}
                  aria-current={current ? 'page' : undefined}
                  /* btn-primary / btn-ghost are purely presentational here —
                     they give the link the same ink rule, offset shadow and
                     press physics as every other control. The active state is
                     the yellow fill; aria-current still carries the meaning. */
                  className={[
                    'w-full px-2 sm:px-3.5',
                    current ? 'btn-primary' : 'btn-ghost',
                  ].join(' ')}
                >
                  <span className="truncate">{link.label}</span>
                </Link>
              </li>
            )
          })}
        </ul>

        <div className="hidden sm:block">
          <LogoutButton />
        </div>
      </nav>
    </header>
  )
}
