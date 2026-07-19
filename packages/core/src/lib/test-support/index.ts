/**
 * Test doubles for exercising use-cases with zero infrastructure.
 *
 * These are TEST-ONLY and are deliberately NOT re-exported from the package's public
 * surface (`src/index.ts`). They import nothing external — pure in-memory
 * implementations of core's own interfaces — so they don't affect core's purity.
 */
export { FakeClock } from "./fake-clock";
export type { SentInvitation } from "./fake-email-sender";
export { FakeEmailSender } from "./fake-email-sender";
export { FakeIdGenerator } from "./fake-id-generator";
export { FakePasswordHasher } from "./fake-password-hasher";
export { FakeTokenGenerator } from "./fake-token-generator";
export { FakeTokenHasher } from "./fake-token-hasher";
export { FakeUnitOfWork } from "./fake-unit-of-work";
export { InMemoryFlagRepository } from "./in-memory-flag.repository";
export { InMemoryInvitationRepository } from "./in-memory-invitation.repository";
export { InMemoryMemberRepository } from "./in-memory-member.repository";
export { InMemoryOrganizationRepository } from "./in-memory-organization.repository";
export { InMemoryProjectRepository } from "./in-memory-project.repository";
export { InMemoryUserRepository } from "./in-memory-user.repository";
