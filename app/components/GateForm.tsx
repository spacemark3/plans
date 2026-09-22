'use client'

import { useRouter } from 'next/navigation'
import { useState, type FormEvent } from 'react'

export default function GateForm() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (pending) return

    setError(null)
    setPending(true)

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ password }),
      })
      const data = (await response.json().catch(() => null)) as { error?: string } | null

      if (!response.ok) {
        setError(data?.error ?? 'Something went wrong. Please try again.')
        setPassword('')
        return
      }

      setPassword('')
      router.replace('/home')
      router.refresh()
    } catch {
      setError('Could not reach the server. Check your connection.')
    } finally {
      setPending(false)
    }
  }

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      <div>
        <label htmlFor="password" className="label">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          className="field"
          placeholder="Your password"
          autoComplete="current-password"
          autoFocus
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? 'password-error' : undefined}
          disabled={pending}
        />
      </div>

      {/* Reserved live region: the error appears in place, the layout doesn't
          jump. It must stay mounted even while empty or aria-live never fires.
          The `.alert` skin is an ink-on-pink block rather than coloured text —
          pink on paper is 3.19:1 and would fail AA. */}
      <p
        id="password-error"
        role="alert"
        aria-live="polite"
        className={`min-h-11 text-sm ${error ? 'alert' : ''}`}
      >
        {error}
      </p>

      <button
        type="submit"
        className="btn-primary w-full"
        disabled={pending || password.length === 0}
      >
        {pending ? 'One moment...' : 'Enter'}
      </button>
    </form>
  )
}
