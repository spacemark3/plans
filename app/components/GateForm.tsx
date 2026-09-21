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
        setError(data?.error ?? 'Qualcosa è andato storto. Riprova.')
        setPassword('')
        return
      }

      setPassword('')
      router.replace('/home')
      router.refresh()
    } catch {
      setError('Impossibile raggiungere il server. Controlla la connessione.')
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
          placeholder="La tua password"
          autoComplete="current-password"
          autoFocus
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? 'password-error' : undefined}
          disabled={pending}
        />
      </div>

      {/* Reserved live region: the error appears in place, the layout doesn't jump. */}
      <p
        id="password-error"
        role="alert"
        aria-live="polite"
        className="min-h-5 text-sm font-medium text-blush-700"
      >
        {error}
      </p>

      <button
        type="submit"
        className="btn-primary w-full"
        disabled={pending || password.length === 0}
      >
        {pending ? 'Un attimo...' : 'Entra'}
      </button>
    </form>
  )
}
