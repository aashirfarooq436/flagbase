import type { IFlagRepository } from "../../domain/flag/flag.repository";
import type { IInvitationRepository } from "../../domain/invitation/invitation.repository";
import type { IMemberRepository } from "../../domain/member/member.repository";
import type { IOrganizationRepository } from "../../domain/organization/organization.repository";
import type { IProjectRepository } from "../../domain/project/project.repository";
import type { IUserRepository } from "../../domain/user/user.repository";

/**
 * The repositories a unit of work exposes, all bound to the same transaction.
 *
 * Anything a use-case does through these inside `IUnitOfWork.run` is part of one
 * atomic transaction. The bundle is deliberately complete rather than per-use-case —
 * a unit of work is the transactional gateway to persistence, and a use-case simply
 * reaches for the two or three repositories it needs.
 */
export interface TransactionalRepositories {
  organizations: IOrganizationRepository;
  members: IMemberRepository;
  invitations: IInvitationRepository;
  users: IUserRepository;
  projects: IProjectRepository;
  flags: IFlagRepository;
}

/**
 * Runs a piece of work atomically: everything inside the callback commits together or
 * not at all.
 *
 * This port lives at the use-case layer, NOT in the kernel (`shared/`), because it
 * references the domain repository interfaces — and the kernel must stay free of
 * domain-feature dependencies. Kernel ports (IClock, IIdGenerator) reference nothing
 * domain-specific; this one aggregates repositories, so it sits with the use-cases
 * that use it.
 *
 * Only multi-write use-cases (CreateOrganization, AcceptInvitation) take this. A
 * single-write use-case injects the one repository it needs directly — no transaction,
 * no ceremony.
 */
export interface IUnitOfWork {
  run<T>(work: (repos: TransactionalRepositories) => Promise<T>): Promise<T>;
}
