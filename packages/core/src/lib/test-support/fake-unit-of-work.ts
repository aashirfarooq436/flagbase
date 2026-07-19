import type {
  IUnitOfWork,
  TransactionalRepositories,
} from "../../application/ports/unit-of-work";
import { InMemoryFlagRepository } from "./in-memory-flag.repository";
import { InMemoryInvitationRepository } from "./in-memory-invitation.repository";
import { InMemoryMemberRepository } from "./in-memory-member.repository";
import { InMemoryOrganizationRepository } from "./in-memory-organization.repository";
import { InMemoryProjectRepository } from "./in-memory-project.repository";
import { InMemoryUserRepository } from "./in-memory-user.repository";

/**
 * An in-memory IUnitOfWork for testing multi-write use-cases with zero infrastructure.
 *
 * `run` simply invokes the work with the shared in-memory repositories — there is NO
 * rollback simulation. That's deliberate: the use-cases that use this validate before
 * they write, so a thrown error never leaves a partial write in their logic paths.
 * Actual atomic rollback (a mid-transaction failure undoing an earlier write) is a
 * property of MongoDB, verified in an infrastructure integration test, not here.
 *
 * `repositories` is exposed so a test can seed state beforehand and assert on it after.
 */
export class FakeUnitOfWork implements IUnitOfWork {
  readonly repositories: TransactionalRepositories;

  constructor(overrides: Partial<TransactionalRepositories> = {}) {
    this.repositories = {
      organizations:
        overrides.organizations ?? new InMemoryOrganizationRepository(),
      members: overrides.members ?? new InMemoryMemberRepository(),
      invitations: overrides.invitations ?? new InMemoryInvitationRepository(),
      users: overrides.users ?? new InMemoryUserRepository(),
      projects: overrides.projects ?? new InMemoryProjectRepository(),
      flags: overrides.flags ?? new InMemoryFlagRepository(),
    };
  }

  async run<T>(
    work: (repos: TransactionalRepositories) => Promise<T>,
  ): Promise<T> {
    return work(this.repositories);
  }
}
