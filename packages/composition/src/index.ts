export { composition } from "./composition-root";

// Re-exposed from the one package allowed to touch infrastructure, so the delivery layer
// (withDb, the startup path) can manage the Mongo connection without importing
// @flagbase/infrastructure directly.
export { ensureConnection, ensureIndexes } from "@flagbase/infrastructure";
