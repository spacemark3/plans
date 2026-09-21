import mongoose, { Schema, type Model } from 'mongoose'

import type { PartnerId } from '../auth'

/** Declared explicitly for the same reason as Item: `default: null` must stay nullable. */
export type PostSchemaType = {
  title: string
  body: string
  photoUrl: string | null
  author: PartnerId
  createdAt: Date
  updatedAt: Date
}

const PostSchema = new Schema<PostSchemaType>(
  {
    title: { type: String, required: true, trim: true, maxlength: 160 },
    body: { type: String, required: true, trim: true, maxlength: 20000 },
    photoUrl: { type: String, default: null },
    author: { type: String, required: true, enum: ['a', 'b'] },
  },
  { timestamps: true },
)

PostSchema.index({ createdAt: -1 })

/** Same HMR guard as every model here — a second model() call throws. */
const Post: Model<PostSchemaType> =
  (mongoose.models.Post as Model<PostSchemaType>) ||
  mongoose.model<PostSchemaType>('Post', PostSchema)

export default Post
