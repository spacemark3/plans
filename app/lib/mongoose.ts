import mongoose from 'mongoose'

type MongooseCache = {
  conn: typeof mongoose | null
  promise: Promise<typeof mongoose> | null
}

declare global {
  var _mongoose: MongooseCache | undefined
}

/**
 * The cache object is created and published to `globalThis` EAGERLY, before any
 * await. run-invite assigns it only after awaiting the connect, so two
 * concurrent cold requests each see an empty global and each open their own
 * connection — which on a small Atlas tier is how you run out of connections.
 */
const cached: MongooseCache = globalThis._mongoose ?? { conn: null, promise: null }
globalThis._mongoose = cached

export default async function dbConnect(): Promise<typeof mongoose> {
  if (cached.conn) return cached.conn

  if (!cached.promise) {
    const uri = process.env.DATABASE_URL
    if (!uri) throw new Error('Missing DATABASE_URL environment variable')

    cached.promise = mongoose.connect(uri, {
      // Fail fast instead of buffering forever: in a serverless invocation a
      // hung query burns the whole function timeout and tells you nothing.
      bufferCommands: false,
      serverSelectionTimeoutMS: 8000,
    })
  }

  try {
    cached.conn = await cached.promise
  } catch (error) {
    // Clear the rejected promise so one transient blip doesn't poison this
    // instance for its entire lifetime.
    cached.promise = null
    throw error
  }

  return cached.conn
}
