import type { MongoAbility } from "@casl/ability";

/**
 * What an actor can do to a subject. `manage` is CASL's wildcard — it subsumes every other
 * action, so granting `manage` already implies `read`/`create`/`update`/`delete`.
 */
export type AppAction = "read" | "create" | "update" | "delete" | "manage";

/** The resources authorization is checked against — PascalCase, mirroring the domain aggregates. */
export type AppSubject = "Organization" | "Project" | "Flag" | "Member";

/** The CASL ability type this app builds and checks against. */
export type AppAbility = MongoAbility<[AppAction, AppSubject]>;
