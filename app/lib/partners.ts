import type { PartnerId } from './auth'

/**
 * Display names live in the environment, not in Mongo. Documents store the
 * stable id (`'a'` / `'b'`), so renaming a partner is an env edit rather than a
 * migration.
 */
export function partnerName(id: PartnerId): string {
  const name = id === 'a' ? process.env.PARTNER_A_NAME : process.env.PARTNER_B_NAME
  return name?.trim() || (id === 'a' ? 'Partner A' : 'Partner B')
}

export function otherPartner(id: PartnerId): PartnerId {
  return id === 'a' ? 'b' : 'a'
}
