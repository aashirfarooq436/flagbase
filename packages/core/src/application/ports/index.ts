/**
 * Ports — the interfaces the application layer needs from the outside world, which
 * infrastructure implements.
 *
 * They live here, an application concern, rather than in the kernel: the kernel holds
 * pure domain primitives (entities, value objects, errors), while the application layer
 * declares what it needs from outside. The dividing principle across all of them: inject
 * what varies by environment (time, ids, hashing, email); keep pure what must never vary
 * (rollout bucketing is math inside the domain, not a port).
 */
export type { IClock } from "./clock";
export type { IEmailSender } from "./email-sender";
export type { IIdGenerator } from "./id-generator";
export type { IPasswordHasher } from "./password-hasher";
export type { ITokenGenerator } from "./token-generator";
export type { ITokenHasher } from "./token-hasher";
export type { IUnitOfWork, TransactionalRepositories } from "./unit-of-work";
