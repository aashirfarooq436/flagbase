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
} from "./application/ports";

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
} from "./domain/member/role";
export type { Permission } from "./domain/member/role";
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
export type { IUseCase } from "./application/use-cases/use-case";
export type {
  IUnitOfWork,
  TransactionalRepositories,
} from "./application/ports/unit-of-work";
export { SignUpUseCase } from "./application/use-cases/user/sign-up/sign-up.use-case";
export type { SignUpInput } from "./application/use-cases/user/sign-up/sign-up.use-case";
export { SignInUseCase } from "./application/use-cases/user/sign-in/sign-in.use-case";
export type { SignInInput } from "./application/use-cases/user/sign-in/sign-in.use-case";
export { UpdateProfileUseCase } from "./application/use-cases/user/update-profile/update-profile.use-case";
export type { UpdateProfileInput } from "./application/use-cases/user/update-profile/update-profile.use-case";
export { ChangePasswordUseCase } from "./application/use-cases/user/change-password/change-password.use-case";
export type { ChangePasswordInput } from "./application/use-cases/user/change-password/change-password.use-case";
export { CreateOrganizationUseCase } from "./application/use-cases/organization/create-organization/create-organization.use-case";
export type { CreateOrganizationInput } from "./application/use-cases/organization/create-organization/create-organization.use-case";
export { InviteMemberUseCase } from "./application/use-cases/invitation/invite-member/invite-member.use-case";
export type { InviteMemberInput } from "./application/use-cases/invitation/invite-member/invite-member.use-case";
export { AcceptInvitationUseCase } from "./application/use-cases/invitation/accept-invitation/accept-invitation.use-case";
export type { AcceptInvitationInput } from "./application/use-cases/invitation/accept-invitation/accept-invitation.use-case";
export { ChangeMemberRoleUseCase } from "./application/use-cases/member/change-member-role/change-member-role.use-case";
export type { ChangeMemberRoleInput } from "./application/use-cases/member/change-member-role/change-member-role.use-case";
export { RemoveMemberUseCase } from "./application/use-cases/member/remove-member/remove-member.use-case";
export type { RemoveMemberInput } from "./application/use-cases/member/remove-member/remove-member.use-case";
export { RevokeInvitationUseCase } from "./application/use-cases/invitation/revoke-invitation/revoke-invitation.use-case";
export type { RevokeInvitationInput } from "./application/use-cases/invitation/revoke-invitation/revoke-invitation.use-case";
export { RejectInvitationUseCase } from "./application/use-cases/invitation/reject-invitation/reject-invitation.use-case";
export type { RejectInvitationInput } from "./application/use-cases/invitation/reject-invitation/reject-invitation.use-case";
export { ListPendingInvitationsUseCase } from "./application/use-cases/invitation/list-pending-invitations/list-pending-invitations.use-case";
export type { ListPendingInvitationsInput } from "./application/use-cases/invitation/list-pending-invitations/list-pending-invitations.use-case";
export { RenameOrganizationUseCase } from "./application/use-cases/organization/rename-organization/rename-organization.use-case";
export type { RenameOrganizationInput } from "./application/use-cases/organization/rename-organization/rename-organization.use-case";
export { GetOrganizationUseCase } from "./application/use-cases/organization/get-organization/get-organization.use-case";
export type { GetOrganizationInput } from "./application/use-cases/organization/get-organization/get-organization.use-case";
export { ListMyOrganizationsUseCase } from "./application/use-cases/organization/list-my-organizations/list-my-organizations.use-case";
export type { ListMyOrganizationsInput } from "./application/use-cases/organization/list-my-organizations/list-my-organizations.use-case";
export { ListMembersUseCase } from "./application/use-cases/member/list-members/list-members.use-case";
export type { ListMembersInput } from "./application/use-cases/member/list-members/list-members.use-case";
export { CreateProjectUseCase } from "./application/use-cases/project/create-project/create-project.use-case";
export type { CreateProjectInput } from "./application/use-cases/project/create-project/create-project.use-case";
export { ListProjectsUseCase } from "./application/use-cases/project/list-projects/list-projects.use-case";
export type { ListProjectsInput } from "./application/use-cases/project/list-projects/list-projects.use-case";
export { GetProjectUseCase } from "./application/use-cases/project/get-project/get-project.use-case";
export type { GetProjectInput } from "./application/use-cases/project/get-project/get-project.use-case";
export { RenameProjectUseCase } from "./application/use-cases/project/rename-project/rename-project.use-case";
export type { RenameProjectInput } from "./application/use-cases/project/rename-project/rename-project.use-case";
export { DeleteProjectUseCase } from "./application/use-cases/project/delete-project/delete-project.use-case";
export type { DeleteProjectInput } from "./application/use-cases/project/delete-project/delete-project.use-case";
export { CreateFlagUseCase } from "./application/use-cases/flag/create-flag/create-flag.use-case";
export type { CreateFlagInput } from "./application/use-cases/flag/create-flag/create-flag.use-case";
export { SetFlagEnabledUseCase } from "./application/use-cases/flag/set-flag-enabled/set-flag-enabled.use-case";
export type { SetFlagEnabledInput } from "./application/use-cases/flag/set-flag-enabled/set-flag-enabled.use-case";
export { UpdateFlagRulesUseCase } from "./application/use-cases/flag/update-flag-rules/update-flag-rules.use-case";
export type {
  UpdateFlagRulesInput,
  TargetingRuleInput,
} from "./application/use-cases/flag/update-flag-rules/update-flag-rules.use-case";
export { EvaluateFlagUseCase } from "./application/use-cases/flag/evaluate-flag/evaluate-flag.use-case";
export type { EvaluateFlagInput } from "./application/use-cases/flag/evaluate-flag/evaluate-flag.use-case";
export { ListFlagsUseCase } from "./application/use-cases/flag/list-flags/list-flags.use-case";
export type { ListFlagsInput } from "./application/use-cases/flag/list-flags/list-flags.use-case";
export { GetFlagUseCase } from "./application/use-cases/flag/get-flag/get-flag.use-case";
export type { GetFlagInput } from "./application/use-cases/flag/get-flag/get-flag.use-case";
export { DeleteFlagUseCase } from "./application/use-cases/flag/delete-flag/delete-flag.use-case";
export type { DeleteFlagInput } from "./application/use-cases/flag/delete-flag/delete-flag.use-case";
