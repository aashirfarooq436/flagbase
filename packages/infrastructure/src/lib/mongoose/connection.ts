import mongoose from "mongoose";

/**
 * A single, reused Mongoose connection.
 *
 * On Vercel every serverless invocation may reuse a warm process, and Next.js hot
 * reload re-runs modules constantly. Without caching, each would open a new
 * connection and exhaust the database's connection pool. Stashing the connection (and
 * the in-flight promise, so concurrent callers await the same connect) on globalThis
 * survives both.
 *
 * The URI is a parameter, not read from process.env here. Infrastructure implements
 * behavior; it doesn't own configuration — the composition root reads the environment
 * and passes the URI in.
 */

type ConnectionCache = {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
};

const globalForMongoose = globalThis as unknown as {
  __flagbaseMongoose?: ConnectionCache;
};

const cache: ConnectionCache = globalForMongoose.__flagbaseMongoose ?? {
  conn: null,
  promise: null,
};
globalForMongoose.__flagbaseMongoose = cache;

export async function ensureConnection(uri: string): Promise<typeof mongoose> {
  if (cache.conn) {
    return cache.conn;
  }

  if (!cache.promise) {
    // bufferCommands: false surfaces "not connected" as an immediate error instead of
    // silently queueing a query against a connection that never arrives.
    //
    // autoIndex: false disables Mongoose's implicit background index build. It's off by
    // design, not by omission: a background build gives no guarantee the unique-index
    // race backstops exist when the first writes land. The startup path builds them
    // explicitly and awaited via ensureIndexes() (see lib/mongoose/indexes.ts).
    cache.promise = mongoose.connect(uri, {
      bufferCommands: false,
      autoIndex: false,
    });
  }

  cache.conn = await cache.promise;
  return cache.conn;
}
