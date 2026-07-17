import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import { afterAll, afterEach, beforeAll } from "vitest";

/**
 * Wires an in-process MongoDB into the calling test file: connect before all tests,
 * wipe every collection between tests, tear down after. Registers the vitest hooks on
 * the current file's suite.
 *
 * `onReady` is where a test builds indexes it depends on — Mongoose creates them lazily,
 * so a uniqueness test must `await SomeModel.init()` here or the constraint won't exist
 * when the test runs.
 */
export function useMongoTestEnv(onReady?: () => Promise<void>): void {
  let mongod: MongoMemoryServer;

  beforeAll(async () => {
    mongod = await MongoMemoryServer.create();
    await mongoose.connect(mongod.getUri());
    if (onReady) {
      await onReady();
    }
  });

  afterEach(async () => {
    const collections = mongoose.connection.collections;
    await Promise.all(
      Object.values(collections).map((collection) => collection.deleteMany({})),
    );
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongod.stop();
  });
}
