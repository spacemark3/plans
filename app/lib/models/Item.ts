import mongoose, { Schema, type Model } from 'mongoose'

import type { PartnerId } from '../auth'
import type { ItemKind } from '../types'

/**
 * Declared explicitly rather than via `InferSchemaType`, which reads
 * `{ type: String, default: null }` as plain `string` and then rejects every
 * assignment of `null` the handlers legitimately make.
 */
export type ItemSchemaType = {
  kind: ItemKind
  title: string
  description: string
  photoUrl: string | null
  author: PartnerId
  done: boolean
  completedAt: Date | null
  createdAt: Date
  updatedAt: Date
}

const ItemSchema = new Schema<ItemSchemaType>(
  {
    kind: { type: String, required: true, enum: ['trip', 'challenge'], index: true },
    title: { type: String, required: true, trim: true, maxlength: 120 },
    description: { type: String, default: '', trim: true, maxlength: 4000 },
    photoUrl: { type: String, default: null },
    author: { type: String, required: true, enum: ['a', 'b'] },
    done: { type: Boolean, default: false, index: true },
    // The done/completedAt invariant is enforced in the PATCH handler, not here:
    // re-saving a done item must not reset the date it was completed.
    completedAt: { type: Date, default: null },
  },
  { timestamps: true },
)

ItemSchema.index({ kind: 1, done: 1, createdAt: -1 })

/**
 * The `mongoose.models.Item ||` guard is mandatory: dev HMR re-evaluates this
 * module and a second `model()` call with the same name throws
 * OverwriteModelError.
 */
const Item: Model<ItemSchemaType> =
  (mongoose.models.Item as Model<ItemSchemaType>) ||
  mongoose.model<ItemSchemaType>('Item', ItemSchema)

export default Item
