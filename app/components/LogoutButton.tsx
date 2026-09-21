'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function LogoutButton() {
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
    <button
      type="button"
      onClick={onClick}
      disabled={pending}
      className="shrink-0 rounded-pill px-2.5 py-2 text-sm font-semibold text-ink-500 transition-colors hover:bg-blush-100 hover:text-blush-800 disabled:opacity-55 sm:px-3.5"
    >
      <span aria-hidden="true">👋</span>
      <span className="ml-1.5 hidden sm:inline">{pending ? 'Esco...' : 'Esci'}</span>
      <span className="sr-only sm:hidden">Esci</span>
    </button>
  )
}
