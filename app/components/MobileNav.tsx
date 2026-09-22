'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'

import LogoutButton from '@/app/components/LogoutButton'
import type { NavLink, NavSegment } from '@/app/components/navLinks'

/**
 * The small-screen navigation: a hamburger button plus a disclosure panel.
 *
 * This exists as its own client island so `NavBar` can stay a SERVER component.
 * Only the open/closed state needs JavaScript, so only that ships to the
 * browser — the links themselves are rendered on the server either way.
 *
 * It is a disclosure, not a dialog: no focus trap, no scroll lock, no
 * aria-modal. The panel sits in the normal flow directly after its trigger, so
 * Tab simply walks into it and back out, which is the behaviour people expect
 * from a nav menu and is markedly less to go wrong than a modal.
 */
export default function MobileNav({
  links,
  active,
}: {
  links: readonly NavLink[]
  active: NavSegment
}) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const toggleRef = useRef<HTMLButtonElement>(null)

  // Escape closes and returns focus to the trigger, so a keyboard user is never
  // stranded inside a panel that is about to disappear.
  useEffect(() => {
    if (!open) return

    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== 'Escape') return
      setOpen(false)
      toggleRef.current?.focus()
    }

    function onPointerDown(event: MouseEvent) {
      const container = containerRef.current
      if (container && !container.contains(event.target as Node)) setOpen(false)
    }

    document.addEventListener('keydown', onKeyDown)
    document.addEventListener('mousedown', onPointerDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.removeEventListener('mousedown', onPointerDown)
    }
  }, [open])

  return (
    <div ref={containerRef} className="w-full sm:hidden">
      <div className="flex items-center justify-between gap-2">
        <span className="font-display text-title truncate">
          {links.find((link) => link.segment === active)?.label ?? 'Menu'}
        </span>

        <button
          ref={toggleRef}
          type="button"
          onClick={() => setOpen((current) => !current)}
          aria-expanded={open}
          aria-controls="mobile-nav-panel"
          aria-label={open ? 'Close menu' : 'Open menu'}
          className="btn-ghost h-11 w-11 shrink-0 px-0"
        >
          {/* Three bars that collapse into an X. aria-hidden because the
              button's aria-label already names the control. */}
          <span aria-hidden="true" className="flex h-4 w-5 flex-col justify-between">
            <span
              className={[
                'block h-[3px] w-full bg-ink transition-transform duration-100',
                open ? 'translate-y-[6.5px] rotate-45' : '',
              ].join(' ')}
            />
            <span
              className={[
                'block h-[3px] w-full bg-ink transition-opacity duration-100',
                open ? 'opacity-0' : '',
              ].join(' ')}
            />
            <span
              className={[
                'block h-[3px] w-full bg-ink transition-transform duration-100',
                open ? '-translate-y-[6.5px] -rotate-45' : '',
              ].join(' ')}
            />
          </span>
        </button>
      </div>

      {/* Kept mounted and toggled with `hidden` so aria-controls always points
          at a real element. */}
      <div id="mobile-nav-panel" hidden={!open} className="rule mt-2 pt-2">
        <ul className="flex flex-col gap-2">
          {links.map((link) => (
            <li key={link.segment}>
              <Link
                href={link.href}
                aria-current={link.segment === active ? 'page' : undefined}
                onClick={() => setOpen(false)}
                className={[
                  'w-full',
                  link.segment === active ? 'btn-primary' : 'btn-ghost',
                ].join(' ')}
              >
                {link.label}
              </Link>
            </li>
          ))}
          <li className="mt-1">
            <LogoutButton className="w-full" />
          </li>
        </ul>
      </div>
    </div>
  )
}
