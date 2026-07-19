export { ensureConnection } from "./lib/mongoose/connection";
export { ensureIndexes } from "./lib/mongoose/indexes";

// User
export { UserMapper } from "./persistence/user/mongo-user.mapper";
export type { UserDocument } from "./persistence/user/mongo-user.model";
export { UserModel } from "./persistence/user/mongo-user.model";
export { MongoUserRepository } from "./persistence/user/mongo-user.repository";

// Organization
export { OrganizationMapper } from "./persistence/organization/mongo-organization.mapper";
export type { OrganizationDocument } from "./persistence/organization/mongo-organization.model";
export { OrganizationModel } from "./persistence/organization/mongo-organization.model";
export { MongoOrganizationRepository } from "./persistence/organization/mongo-organization.repository";

// Member
export { MemberMapper } from "./persistence/member/mongo-member.mapper";
export type { MemberDocument } from "./persistence/member/mongo-member.model";
export { MemberModel } from "./persistence/member/mongo-member.model";
export { MongoMemberRepository } from "./persistence/member/mongo-member.repository";

// Invitation
export { InvitationMapper } from "./persistence/invitation/mongo-invitation.mapper";
export type { InvitationDocument } from "./persistence/invitation/mongo-invitation.model";
export { InvitationModel } from "./persistence/invitation/mongo-invitation.model";
export { MongoInvitationRepository } from "./persistence/invitation/mongo-invitation.repository";

// Project
export { ProjectMapper } from "./persistence/project/mongo-project.mapper";
export type { ProjectDocument } from "./persistence/project/mongo-project.model";
export { ProjectModel } from "./persistence/project/mongo-project.model";
export { MongoProjectRepository } from "./persistence/project/mongo-project.repository";

// Flag
export { FlagMapper } from "./persistence/flag/mongo-flag.mapper";
export type { FlagDocument } from "./persistence/flag/mongo-flag.model";
export { FlagModel } from "./persistence/flag/mongo-flag.model";
export { MongoFlagRepository } from "./persistence/flag/mongo-flag.repository";

// Unit of Work
export { MongoUnitOfWork } from "./lib/mongoose/mongo-unit-of-work";

// Port adapters
export { Argon2PasswordHasher } from "./adapters/argon2-password-hasher";
export { ConsoleEmailSender } from "./adapters/console-email-sender";
export { CryptoIdGenerator } from "./adapters/crypto-id-generator";
export { CryptoTokenGenerator } from "./adapters/crypto-token-generator";
export { Sha256TokenHasher } from "./adapters/sha256-token-hasher";
export { SystemClock } from "./adapters/system-clock";
export type { Logger } from "@flagbase/shared/logger";
