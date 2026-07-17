// Shared kernel
export {
  DomainError,
  ValidationError,
  NotFoundError,
  ConflictError,
  ForbiddenError,
} from "./shared/errors";
export type { DomainErrorCode } from "./shared/errors";
export { Entity } from "./shared/entity";
export { Email } from "./shared/email.vo";
export type {
  IIdGenerator,
  IClock,
  ITokenGenerator,
  IPasswordHasher,
  ITokenHasher,
  IEmailSender,
} from "./shared/ports";

// User
export { User } from "./domain/user/user.entity";
export type { UserProps } from "./domain/user/user.entity";
export { OAuthAccount } from "./domain/user/oauth-account.entity";
export type { OAuthAccountProps } from "./domain/user/oauth-account.entity";
export { OAuthProvider } from "./domain/user/oauth-provider.vo";
export type { IUserRepository } from "./domain/user/user.repository";
export type { IOAuthAccountRepository } from "./domain/user/oauth-account.repository";

// Organization
export { Organization } from "./domain/organization/organization.entity";
export type { OrganizationProps } from "./domain/organization/organization.entity";
export type { IOrganizationRepository } from "./domain/organization/organization.repository";

// Member
export { Member } from "./domain/member/member.entity";
export type { MemberProps } from "./domain/member/member.entity";
export {
  Role,
  ROLE_PERMISSIONS,
  roleHasPermission,
} from "./domain/member/role.vo";
export type { Permission } from "./domain/member/role.vo";
export type { IMemberRepository } from "./domain/member/member.repository";

// Invitation
export {
  Invitation,
  InvitationStatus,
} from "./domain/invitation/invitation.entity";
export type { InvitationProps } from "./domain/invitation/invitation.entity";
export type { IInvitationRepository } from "./domain/invitation/invitation.repository";

// Project
export { Project } from "./domain/project/project.entity";
export type { ProjectProps } from "./domain/project/project.entity";
export type { IProjectRepository } from "./domain/project/project.repository";

// Flag
export { Flag } from "./domain/flag/flag.entity";
export type { FlagProps } from "./domain/flag/flag.entity";
export { FlagKey } from "./domain/flag/flag-key.vo";
export { RolloutPercentage } from "./domain/flag/rollout-percentage.vo";
export { UserIdListRule } from "./domain/flag/targeting-rule";
export type { TargetingRule } from "./domain/flag/targeting-rule";
export type { EvaluationContext } from "./domain/flag/evaluation-context";
export type { IFlagRepository } from "./domain/flag/flag.repository";
