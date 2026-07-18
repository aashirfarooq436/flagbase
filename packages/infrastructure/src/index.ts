export { ensureConnection } from "./lib/mongoose/connection";
export { ensureIndexes } from "./lib/mongoose/indexes";

// User
export { UserModel } from "./persistence/user/mongo-user.model";
export type { UserDocument } from "./persistence/user/mongo-user.model";
export { UserMapper } from "./persistence/user/mongo-user.mapper";
export { MongoUserRepository } from "./persistence/user/mongo-user.repository";

// Organization
export { OrganizationModel } from "./persistence/organization/mongo-organization.model";
export type { OrganizationDocument } from "./persistence/organization/mongo-organization.model";
export { OrganizationMapper } from "./persistence/organization/mongo-organization.mapper";
export { MongoOrganizationRepository } from "./persistence/organization/mongo-organization.repository";

// Member
export { MemberModel } from "./persistence/member/mongo-member.model";
export type { MemberDocument } from "./persistence/member/mongo-member.model";
export { MemberMapper } from "./persistence/member/mongo-member.mapper";
export { MongoMemberRepository } from "./persistence/member/mongo-member.repository";

// Invitation
export { InvitationModel } from "./persistence/invitation/mongo-invitation.model";
export type { InvitationDocument } from "./persistence/invitation/mongo-invitation.model";
export { InvitationMapper } from "./persistence/invitation/mongo-invitation.mapper";
export { MongoInvitationRepository } from "./persistence/invitation/mongo-invitation.repository";

// Project
export { ProjectModel } from "./persistence/project/mongo-project.model";
export type { ProjectDocument } from "./persistence/project/mongo-project.model";
export { ProjectMapper } from "./persistence/project/mongo-project.mapper";
export { MongoProjectRepository } from "./persistence/project/mongo-project.repository";

// Flag
export { FlagModel } from "./persistence/flag/mongo-flag.model";
export type { FlagDocument } from "./persistence/flag/mongo-flag.model";
export { FlagMapper } from "./persistence/flag/mongo-flag.mapper";
export { MongoFlagRepository } from "./persistence/flag/mongo-flag.repository";

// Unit of Work
export { MongoUnitOfWork } from "./lib/mongoose/mongo-unit-of-work";

// Port adapters
export { CryptoIdGenerator } from "./adapters/crypto-id-generator";
export { SystemClock } from "./adapters/system-clock";
export { CryptoTokenGenerator } from "./adapters/crypto-token-generator";
export { Sha256TokenHasher } from "./adapters/sha256-token-hasher";
export { Argon2PasswordHasher } from "./adapters/argon2-password-hasher";
export { ConsoleEmailSender } from "./adapters/console-email-sender";
export type { Logger } from "./adapters/console-email-sender";
