// Shared kernel
export { Email } from "./shared/email.vo";
export { Entity } from "./shared/entity";
export {
  ConflictError,
  DomainError,
  type DomainErrorCode,
  ForbiddenError,
  NotFoundError,
  UnauthenticatedError,
  ValidationError,
} from "./shared/errors";
export { Password } from "./shared/password.vo";

// Application ports & contracts
export type {
  IClock,
  IEmailSender,
  IIdGenerator,
  IPasswordHasher,
  ITokenGenerator,
  ITokenHasher,
} from "./application/ports";
export type {
  IUnitOfWork,
  TransactionalRepositories,
} from "./application/ports/unit-of-work";
export type { IUseCase } from "./application/use-cases/use-case";

// User
export {
  type ChangePasswordInput,
  ChangePasswordUseCase,
} from "./application/use-cases/user/change-password/change-password.use-case";
export {
  type GetCurrentUserInput,
  GetCurrentUserUseCase,
} from "./application/use-cases/user/get-current-user/get-current-user.use-case";
export {
  type SignInInput,
  SignInUseCase,
} from "./application/use-cases/user/sign-in/sign-in.use-case";
export {
  type SignUpInput,
  SignUpUseCase,
} from "./application/use-cases/user/sign-up/sign-up.use-case";
export {
  type UpdateProfileInput,
  UpdateProfileUseCase,
} from "./application/use-cases/user/update-profile/update-profile.use-case";
export { User, type UserProps } from "./domain/user/user.entity";
export type { IUserRepository } from "./domain/user/user.repository";

// Organization
export {
  type CreateOrganizationInput,
  CreateOrganizationUseCase,
} from "./application/use-cases/organization/create-organization/create-organization.use-case";
export {
  type GetOrganizationInput,
  GetOrganizationUseCase,
} from "./application/use-cases/organization/get-organization/get-organization.use-case";
export {
  type ListMyOrganizationsInput,
  ListMyOrganizationsUseCase,
} from "./application/use-cases/organization/list-my-organizations/list-my-organizations.use-case";
export {
  type RenameOrganizationInput,
  RenameOrganizationUseCase,
} from "./application/use-cases/organization/rename-organization/rename-organization.use-case";
export {
  Organization,
  type OrganizationProps,
} from "./domain/organization/organization.entity";
export type { IOrganizationRepository } from "./domain/organization/organization.repository";

// Member
export {
  type ChangeMemberRoleInput,
  ChangeMemberRoleUseCase,
} from "./application/use-cases/member/change-member-role/change-member-role.use-case";
export {
  type GetMembershipInput,
  GetMembershipUseCase,
} from "./application/use-cases/member/get-membership/get-membership.use-case";
export {
  type ListMembersInput,
  ListMembersUseCase,
} from "./application/use-cases/member/list-members/list-members.use-case";
export {
  type RemoveMemberInput,
  RemoveMemberUseCase,
} from "./application/use-cases/member/remove-member/remove-member.use-case";
export { Member, type MemberProps } from "./domain/member/member.entity";
export type { IMemberRepository } from "./domain/member/member.repository";
export {
  type Permission,
  Role,
  ROLE_PERMISSIONS,
  roleHasPermission,
} from "./domain/member/role";

// Invitation
export {
  type AcceptInvitationInput,
  AcceptInvitationUseCase,
} from "./application/use-cases/invitation/accept-invitation/accept-invitation.use-case";
export {
  type InviteMemberInput,
  InviteMemberUseCase,
} from "./application/use-cases/invitation/invite-member/invite-member.use-case";
export {
  type ListPendingInvitationsInput,
  ListPendingInvitationsUseCase,
} from "./application/use-cases/invitation/list-pending-invitations/list-pending-invitations.use-case";
export {
  type RejectInvitationInput,
  RejectInvitationUseCase,
} from "./application/use-cases/invitation/reject-invitation/reject-invitation.use-case";
export {
  type RevokeInvitationInput,
  RevokeInvitationUseCase,
} from "./application/use-cases/invitation/revoke-invitation/revoke-invitation.use-case";
export {
  Invitation,
  type InvitationProps,
  InvitationStatus,
} from "./domain/invitation/invitation.entity";
export type { IInvitationRepository } from "./domain/invitation/invitation.repository";

// Project
export {
  type CreateProjectInput,
  CreateProjectUseCase,
} from "./application/use-cases/project/create-project/create-project.use-case";
export {
  type DeleteProjectInput,
  DeleteProjectUseCase,
} from "./application/use-cases/project/delete-project/delete-project.use-case";
export {
  type GetProjectInput,
  GetProjectUseCase,
} from "./application/use-cases/project/get-project/get-project.use-case";
export {
  type ListProjectsInput,
  ListProjectsUseCase,
} from "./application/use-cases/project/list-projects/list-projects.use-case";
export {
  type RenameProjectInput,
  RenameProjectUseCase,
} from "./application/use-cases/project/rename-project/rename-project.use-case";
export { Project, type ProjectProps } from "./domain/project/project.entity";
export type { IProjectRepository } from "./domain/project/project.repository";

// Flag
export {
  type CreateFlagInput,
  CreateFlagUseCase,
} from "./application/use-cases/flag/create-flag/create-flag.use-case";
export {
  type DeleteFlagInput,
  DeleteFlagUseCase,
} from "./application/use-cases/flag/delete-flag/delete-flag.use-case";
export {
  type EvaluateFlagInput,
  EvaluateFlagUseCase,
} from "./application/use-cases/flag/evaluate-flag/evaluate-flag.use-case";
export {
  type GetFlagInput,
  GetFlagUseCase,
} from "./application/use-cases/flag/get-flag/get-flag.use-case";
export {
  type ListFlagsInput,
  ListFlagsUseCase,
} from "./application/use-cases/flag/list-flags/list-flags.use-case";
export {
  type SetFlagEnabledInput,
  SetFlagEnabledUseCase,
} from "./application/use-cases/flag/set-flag-enabled/set-flag-enabled.use-case";
export {
  type TargetingRuleInput,
  type UpdateFlagRulesInput,
  UpdateFlagRulesUseCase,
} from "./application/use-cases/flag/update-flag-rules/update-flag-rules.use-case";
export type { EvaluationContext } from "./domain/flag/evaluation-context";
export { Flag, type FlagProps } from "./domain/flag/flag.entity";
export type { IFlagRepository } from "./domain/flag/flag.repository";
export { FlagKey } from "./domain/flag/flag-key.vo";
export { RolloutPercentage } from "./domain/flag/rollout-percentage.vo";
export {
  type TargetingRule,
  UserIdListRule,
} from "./domain/flag/targeting-rule";
