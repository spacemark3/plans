/**
 * The navigation model, in its own module so the server `NavBar` and the client
 * `MobileNav` island can share it without either importing the other — which
 * would drag `NavBar` into the client bundle and defeat the point of keeping it
 * a server component.
 */
export type NavSegment = 'home' | 'trips' | 'challenges' | 'blog'

export type NavLink = {
  segment: NavSegment
  href: string
  label: string
}

/**
 * Trips and challenges each own a route now. Anything added here must ALSO be
 * added to the matcher in `proxy.ts`, or the page silently loses its proxy
 * guard — `requireSession()` still protects it, but that redundancy is
 * deliberate and losing half of it quietly is exactly the failure to avoid.
 */
export const NAV_LINKS: readonly NavLink[] = [
  { segment: 'home', href: '/home', label: 'Home' },
  { segment: 'trips', href: '/trips', label: 'Trips' },
  { segment: 'challenges', href: '/challenges', label: 'Challenges' },
  { segment: 'blog', href: '/blog', label: 'Blog' },
]
