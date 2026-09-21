import type { PartnerId } from './auth'
import dbConnect from './mongoose'
import Item from './models/Item'
import Post from './models/Post'
import { partnerName } from './partners'
import type { ItemDTO, ItemKind, PostDTO } from './types'

/**
 * The shape `.lean()` actually hands back. Mongoose's own lean typings are
 * loose, so we pin it here and convert in exactly one place.
 */
type LeanItem = {
  _id: unknown
  kind: string
  title: string
  description?: string | null
  photoUrl?: string | null
  author: string
  done?: boolean | null
  completedAt?: Date | null
  createdAt: Date
  updatedAt: Date
}

function iso(value: Date | string | null | undefined): string | null {
  if (!value) return null
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString()
}

/**
 * The single crossing point between Mongo and everything else. Every read —
 * server component and route handler alike — goes through here, so `id` is
 * always a string and every date is always an ISO string.
 */
export function toItemDTO(doc: LeanItem): ItemDTO {
  return {
    id: String(doc._id),
    kind: doc.kind as ItemKind,
    title: doc.title,
    description: doc.description ?? '',
    photoUrl: doc.photoUrl ?? null,
    author: doc.author as PartnerId,
    authorName: partnerName(doc.author as PartnerId),
    done: Boolean(doc.done),
    completedAt: iso(doc.completedAt),
    createdAt: iso(doc.createdAt)!,
    updatedAt: iso(doc.updatedAt)!,
  }
}

export async function getItems(filter?: {
  kind?: ItemKind
  done?: boolean
}): Promise<ItemDTO[]> {
  await dbConnect()

  const query: Record<string, unknown> = {}
  if (filter?.kind) query.kind = filter.kind
  if (typeof filter?.done === 'boolean') query.done = filter.done

  const docs = await Item.find(query).sort({ createdAt: -1 }).lean<LeanItem[]>().exec()
  return docs.map(toItemDTO)
}

export async function getItemById(id: string): Promise<ItemDTO | null> {
  await dbConnect()
  const doc = await Item.findById(id).lean<LeanItem | null>().exec()
  return doc ? toItemDTO(doc) : null
}

type LeanPost = {
  _id: unknown
  title: string
  body: string
  photoUrl?: string | null
  author: string
  createdAt: Date
  updatedAt: Date
}

/** The Post counterpart of `toItemDTO` — same contract, same single crossing point. */
export function toPostDTO(doc: LeanPost): PostDTO {
  return {
    id: String(doc._id),
    title: doc.title,
    body: doc.body,
    photoUrl: doc.photoUrl ?? null,
    author: doc.author as PartnerId,
    authorName: partnerName(doc.author as PartnerId),
    createdAt: iso(doc.createdAt)!,
    updatedAt: iso(doc.updatedAt)!,
  }
}

export async function getPosts(): Promise<PostDTO[]> {
  await dbConnect()
  const docs = await Post.find({}).sort({ createdAt: -1 }).lean<LeanPost[]>().exec()
  return docs.map(toPostDTO)
}

export type HomeSummary = {
  items: Record<ItemKind, { todo: number; done: number }>
  postCount: number
  /** The three most recently added items, regardless of category. */
  recentItems: ItemDTO[]
  latestPost: PostDTO | null
}

export async function getHomeSummary(): Promise<HomeSummary> {
  await dbConnect()

  // One round trip instead of five sequential ones — counts come from an
  // aggregate rather than four separate countDocuments calls.
  const [grouped, postCount, recentDocs, latestPostDocs] = await Promise.all([
    Item.aggregate<{ _id: { kind: string; done: boolean }; n: number }>([
      { $group: { _id: { kind: '$kind', done: '$done' }, n: { $sum: 1 } } },
    ]).exec(),
    Post.countDocuments({}).exec(),
    Item.find({}).sort({ createdAt: -1 }).limit(3).lean<LeanItem[]>().exec(),
    Post.find({}).sort({ createdAt: -1 }).limit(1).lean<LeanPost[]>().exec(),
  ])

  const items: Record<ItemKind, { todo: number; done: number }> = {
    trip: { todo: 0, done: 0 },
    challenge: { todo: 0, done: 0 },
  }

  for (const row of grouped) {
    const bucket = items[row._id.kind as ItemKind]
    if (!bucket) continue
    if (row._id.done) bucket.done += row.n
    else bucket.todo += row.n
  }

  return {
    items,
    postCount,
    recentItems: recentDocs.map(toItemDTO),
    latestPost: latestPostDocs[0] ? toPostDTO(latestPostDocs[0]) : null,
  }
}
