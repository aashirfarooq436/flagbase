// Shared kernel
export {
  DomainError,
  ValidationError,
  NotFoundError,
  ConflictError,
  ForbiddenError,
  UnauthenticatedError,
  type DomainErrorCode,
} from "./shared/errors";
export { Entity } from "./shared/entity";
export { Email } from "./shared/email.vo";
export { Password } from "./shared/password.vo";

// Application ports & contracts
export type {
  IIdGenerator,
  IClock,
  ITokenGenerator,
  IPasswordHasher,
  ITokenHasher,
  IEmailSender,
} from "./application/ports";
export type { IUseCase } from "./application/use-cases/use-case";
export type {
  IUnitOfWork,
  TransactionalRepositories,
} from "./application/ports/unit-of-work";

// User
export { User, type UserProps } from "./domain/user/user.entity";
export type { IUserRepository } from "./domain/user/user.repository";
export {
  SignUpUseCase,
  type SignUpInput,
} from "./application/use-cases/user/sign-up/sign-up.use-case";
export {
  SignInUseCase,
  type SignInInput,
} from "./application/use-cases/user/sign-in/sign-in.use-case";
export {
  UpdateProfileUseCase,
  type UpdateProfileInput,
} from "./application/use-cases/user/update-profile/update-profile.use-case";
export {
  ChangePasswordUseCase,
  type ChangePasswordInput,
} from "./application/use-cases/user/change-password/change-password.use-case";
export {
  GetCurrentUserUseCase,
  type GetCurrentUserInput,
} from "./application/use-cases/user/get-current-user/get-current-user.use-case";

// Organization
export {
  Organization,
  type OrganizationProps,
} from "./domain/organization/organization.entity";
export type { IOrganizationRepository } from "./domain/organization/organization.repository";
export {
  CreateOrganizationUseCase,
  type CreateOrganizationInput,
} from "./application/use-cases/organization/create-organization/create-organization.use-case";
export {
  RenameOrganizationUseCase,
  type RenameOrganizationInput,
} from "./application/use-cases/organization/rename-organization/rename-organization.use-case";
export {
  GetOrganizationUseCase,
  type GetOrganizationInput,
} from "./application/use-cases/organization/get-organization/get-organization.use-case";
export {
  ListMyOrganizationsUseCase,
  type ListMyOrganizationsInput,
} from "./application/use-cases/organization/list-my-organizations/list-my-organizations.use-case";

// Member
export { Member, type MemberProps } from "./domain/member/member.entity";
export {
  Role,
  ROLE_PERMISSIONS,
  roleHasPermission,
  type Permission,
} from "./domain/member/role";
export type { IMemberRepository } from "./domain/member/member.repository";
export {
  ChangeMemberRoleUseCase,
  type ChangeMemberRoleInput,
} from "./application/use-cases/member/change-member-role/change-member-role.use-case";
export {
  RemoveMemberUseCase,
  type RemoveMemberInput,
} from "./application/use-cases/member/remove-member/remove-member.use-case";
export {
  ListMembersUseCase,
  type ListMembersInput,
} from "./application/use-cases/member/list-members/list-members.use-case";
export {
  GetMembershipUseCase,
  type GetMembershipInput,
} from "./application/use-cases/member/get-membership/get-membership.use-case";

// Invitation
export {
  Invitation,
  InvitationStatus,
  type InvitationProps,
} from "./domain/invitation/invitation.entity";
export type { IInvitationRepository } from "./domain/invitation/invitation.repository";
export {
  InviteMemberUseCase,
  type InviteMemberInput,
} from "./application/use-cases/invitation/invite-member/invite-member.use-case";
export {
  AcceptInvitationUseCase,
  type AcceptInvitationInput,
} from "./application/use-cases/invitation/accept-invitation/accept-invitation.use-case";
export {
  RevokeInvitationUseCase,
  type RevokeInvitationInput,
} from "./application/use-cases/invitation/revoke-invitation/revoke-invitation.use-case";
export {
  RejectInvitationUseCase,
  type RejectInvitationInput,
} from "./application/use-cases/invitation/reject-invitation/reject-invitation.use-case";
export {
  ListPendingInvitationsUseCase,
  type ListPendingInvitationsInput,
} from "./application/use-cases/invitation/list-pending-invitations/list-pending-invitations.use-case";

// Project
export { Project, type ProjectProps } from "./domain/project/project.entity";
export type { IProjectRepository } from "./domain/project/project.repository";
export {
  CreateProjectUseCase,
  type CreateProjectInput,
} from "./application/use-cases/project/create-project/create-project.use-case";
export {
  ListProjectsUseCase,
  type ListProjectsInput,
} from "./application/use-cases/project/list-projects/list-projects.use-case";
export {
  GetProjectUseCase,
  type GetProjectInput,
} from "./application/use-cases/project/get-project/get-project.use-case";
export {
  RenameProjectUseCase,
  type RenameProjectInput,
} from "./application/use-cases/project/rename-project/rename-project.use-case";
export {
  DeleteProjectUseCase,
  type DeleteProjectInput,
} from "./application/use-cases/project/delete-project/delete-project.use-case";

// Flag
export { Flag, type FlagProps } from "./domain/flag/flag.entity";
export { FlagKey } from "./domain/flag/flag-key.vo";
export { RolloutPercentage } from "./domain/flag/rollout-percentage.vo";
export {
  UserIdListRule,
  type TargetingRule,
} from "./domain/flag/targeting-rule";
export type { EvaluationContext } from "./domain/flag/evaluation-context";
export type { IFlagRepository } from "./domain/flag/flag.repository";
export {
  CreateFlagUseCase,
  type CreateFlagInput,
} from "./application/use-cases/flag/create-flag/create-flag.use-case";
export {
  SetFlagEnabledUseCase,
  type SetFlagEnabledInput,
} from "./application/use-cases/flag/set-flag-enabled/set-flag-enabled.use-case";
export {
  UpdateFlagRulesUseCase,
  type UpdateFlagRulesInput,
  type TargetingRuleInput,
} from "./application/use-cases/flag/update-flag-rules/update-flag-rules.use-case";
export {
  EvaluateFlagUseCase,
  type EvaluateFlagInput,
} from "./application/use-cases/flag/evaluate-flag/evaluate-flag.use-case";
export {
  ListFlagsUseCase,
  type ListFlagsInput,
} from "./application/use-cases/flag/list-flags/list-flags.use-case";
export {
  GetFlagUseCase,
  type GetFlagInput,
} from "./application/use-cases/flag/get-flag/get-flag.use-case";
export {
  DeleteFlagUseCase,
  type DeleteFlagInput,
} from "./application/use-cases/flag/delete-flag/delete-flag.use-case";
