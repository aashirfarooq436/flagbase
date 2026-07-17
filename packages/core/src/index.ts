// Shared kernel
export {
  DomainError,
  ValidationError,
  NotFoundError,
  ConflictError,
  ForbiddenError,
  UnauthenticatedError,
} from "./shared/errors";
export type { DomainErrorCode } from "./shared/errors";
export { Entity } from "./shared/entity";
export { Email } from "./shared/email.vo";
export { Password } from "./shared/password.vo";
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
export type { IUserRepository } from "./domain/user/user.repository";

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

// Use-cases
export type { IUseCase } from "./use-cases/use-case";
export { SignUpUseCase } from "./use-cases/sign-up/sign-up.use-case";
export type { SignUpInput } from "./use-cases/sign-up/sign-up.use-case";
export { SignInUseCase } from "./use-cases/sign-in/sign-in.use-case";
export type { SignInInput } from "./use-cases/sign-in/sign-in.use-case";
export { CreateFlagUseCase } from "./use-cases/create-flag/create-flag.use-case";
export type { CreateFlagInput } from "./use-cases/create-flag/create-flag.use-case";
export { SetFlagEnabledUseCase } from "./use-cases/set-flag-enabled/set-flag-enabled.use-case";
export type { SetFlagEnabledInput } from "./use-cases/set-flag-enabled/set-flag-enabled.use-case";
export { UpdateFlagRulesUseCase } from "./use-cases/update-flag-rules/update-flag-rules.use-case";
export type {
  UpdateFlagRulesInput,
  TargetingRuleInput,
} from "./use-cases/update-flag-rules/update-flag-rules.use-case";
export { EvaluateFlagUseCase } from "./use-cases/evaluate-flag/evaluate-flag.use-case";
export type { EvaluateFlagInput } from "./use-cases/evaluate-flag/evaluate-flag.use-case";
export { ListFlagsUseCase } from "./use-cases/list-flags/list-flags.use-case";
export type { ListFlagsInput } from "./use-cases/list-flags/list-flags.use-case";
