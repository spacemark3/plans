'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function LogoutButton({ className = '' }: { className?: string }) {
  const router = useRouter()
  const [pending, setPending] = useState(false)

  async function onClick() {
    if (pending) return
    setPending(true)
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      router.replace('/')
      router.refresh()
    } finally {
      setPending(false)
    }
  }

  return (
    /* The label is always visible now that the 👋 is gone, so the old
       emoji-plus-sr-only-text arrangement is no longer needed: "Log out" is
       short enough to survive the narrowest layout on its own. */
    <button
      type="button"
      onClick={onClick}
      disabled={pending}
      className={`btn-ghost shrink-0 px-2.5 sm:px-3.5 ${className}`}
    >
      {pending ? 'Logging out...' : 'Log out'}
    </button>
  )
}
