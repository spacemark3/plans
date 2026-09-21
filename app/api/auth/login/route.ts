import { NextResponse } from 'next/server'

import { checkPassword } from '@/app/lib/auth'
import { partnerName } from '@/app/lib/partners'
import { clientIp, consumeLoginAttempt, LOGIN_DELAY_MS, sleep } from '@/app/lib/rateLimit'
import { setSessionCookie } from '@/app/lib/session'

export async function POST(request: Request): Promise<NextResponse> {
  if (!consumeLoginAttempt(clientIp(request))) {
    return NextResponse.json(
      { error: 'Troppi tentativi. Riprova tra un minuto.' },
      { status: 429 },
    )
  }

  // A fixed delay on EVERY attempt — success and failure alike — so timing says
  // nothing about how close a guess was.
  await sleep(LOGIN_DELAY_MS)

  let password: unknown
  try {
    const body = (await request.json()) as { password?: unknown }
    password = body?.password
  } catch {
    return NextResponse.json({ error: 'Richiesta non valida.' }, { status: 400 })
  }

  if (typeof password !== 'string' || password.length === 0) {
    return NextResponse.json({ error: 'Inserisci la password.' }, { status: 400 })
  }

  const partner = await checkPassword(password)
  if (!partner) {
    return NextResponse.json({ error: 'Password non corretta.' }, { status: 401 })
  }

  await setSessionCookie(partner)
  return NextResponse.json({ ok: true, name: partnerName(partner) })
}
