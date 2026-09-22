'use client'

import { useEffect, useId, useRef, type ReactNode } from 'react'

const FOCUSABLE = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',')

/**
 * The one modal shell. Owns the overlay, the dialog semantics, Escape, click
 * outside, the focus trap and the body scroll lock — and nothing
 * product-specific. `ItemFormModal`, `PostFormModal` and `ConfirmDialog` all
 * render through this, which is the whole point: there is no second copy.
 */
export default function Modal({
  open,
  title,
  onClose,
  children,
  footer,
  labelledBy,
}: {
  open: boolean
  title: string
  onClose: () => void
  children: ReactNode
  footer?: ReactNode
  /** Override the heading association when the caller renders its own title. */
  labelledBy?: string
}) {
  const panelRef = useRef<HTMLDivElement>(null)
  const restoreFocusRef = useRef<HTMLElement | null>(null)
  const generatedId = useId()
  const titleId = labelledBy ?? `${generatedId}-title`

  // Callers pass inline arrows for `onClose`. Holding it in a ref keeps the
  // effects below keyed on `open` alone — otherwise they tear down and re-run on
  // every parent render, which re-locks the scroll and yanks focus back to the
  // first field while the user is typing.
  const onCloseRef = useRef(onClose)
  useEffect(() => {
    onCloseRef.current = onClose
  })

  useEffect(() => {
    if (!open) return

    restoreFocusRef.current = document.activeElement as HTMLElement | null

    // Scroll lock. Pad by the scrollbar width so the page behind doesn't jump.
    const { body } = document
    const previousOverflow = body.style.overflow
    const previousPadding = body.style.paddingRight
    const scrollbar = window.innerWidth - document.documentElement.clientWidth
    body.style.overflow = 'hidden'
    if (scrollbar > 0) body.style.paddingRight = `${scrollbar}px`

    // Focus the first control, falling back to the panel itself.
    const panel = panelRef.current
    const target = panel?.querySelector<HTMLElement>(FOCUSABLE) ?? panel
    target?.focus()

    return () => {
      body.style.overflow = previousOverflow
      body.style.paddingRight = previousPadding
      restoreFocusRef.current?.focus?.()
    }
  }, [open])

  useEffect(() => {
    if (!open) return

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.stopPropagation()
        onCloseRef.current()
        return
      }

      if (event.key !== 'Tab') return

      const panel = panelRef.current
      if (!panel) return

      const items = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (element) => element.offsetParent !== null || element === document.activeElement,
      )
      if (items.length === 0) {
        event.preventDefault()
        panel.focus()
        return
      }

      const first = items[0]
      const last = items[items.length - 1]
      const active = document.activeElement

      // Wrap at both ends so Tab can never escape the dialog. `panel` itself is
      // the active element right after open when it holds no focusable child.
      if (event.shiftKey && (active === first || active === panel)) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && (active === last || active === panel)) {
        event.preventDefault()
        first.focus()
      } else if (active instanceof Node && !panel.contains(active)) {
        // Focus escaped (browser chrome, a stray programmatic blur) — pull it back.
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown, true)
    return () => document.removeEventListener('keydown', handleKeyDown, true)
  }, [open])

  if (!open) return null

  return (
    <div
      /* Flat ink scrim, no blur: translucency and blur were the old glass
         language. The items-end -> sm:items-center positioning stays — that is
         layout (bottom sheet on phones), not skin. */
      className="fixed inset-0 z-50 flex items-end justify-center overflow-y-auto overscroll-contain bg-ink/70 sm:items-center sm:p-6"
      onMouseDown={(event) => {
        // mousedown, not click: a drag that starts inside the panel and ends on
        // the overlay must not count as "clicked outside".
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className="card-brut w-full max-w-lg p-5 shadow-hard-lg outline-none sm:p-6"
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <h2 id={titleId} className="text-title">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="mark -mr-1 -mt-1 h-9 w-9 shrink-0 bg-pink"
          >
            <span aria-hidden="true" className="text-xl leading-none">
              ×
            </span>
          </button>
        </div>

        {children}

        {footer ? <div className="mt-5 flex flex-wrap gap-2">{footer}</div> : null}
      </div>
    </div>
  )
}
