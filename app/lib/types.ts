import type { PartnerId } from './auth'

export type ItemKind = 'trip' | 'challenge'

export const ITEM_KINDS: ItemKind[] = ['trip', 'challenge']

export function isItemKind(value: unknown): value is ItemKind {
  return value === 'trip' || value === 'challenge'
}

/**
 * What crosses the RSC boundary and what the API returns — identical by
 * construction, so a client component's `ItemDTO[]` is the same shape whether it
 * arrived as a prop or as a fetch response.
 *
 * `ObjectId` and `Date` are not safely serialisable across that boundary, so
 * every read goes through the mappers in `data.ts`. Nothing raw from Mongo ever
 * reaches a component.
 */
export type ItemDTO = {
  id: string
  kind: ItemKind
  title: string
  description: string
  photoUrl: string | null
  author: PartnerId
  authorName: string
  done: boolean
  completedAt: string | null
  createdAt: string
  updatedAt: string
}

export type PostDTO = {
  id: string
  title: string
  body: string
  photoUrl: string | null
  author: PartnerId
  authorName: string
  createdAt: string
  updatedAt: string
}
