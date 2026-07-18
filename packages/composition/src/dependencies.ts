import type {
  IClock,
  IEmailSender,
  IFlagRepository,
  IIdGenerator,
  IInvitationRepository,
  IMemberRepository,
  IOrganizationRepository,
  IPasswordHasher,
  IProjectRepository,
  ITokenGenerator,
  ITokenHasher,
  IUnitOfWork,
  IUserRepository,
} from "@flagbase/core";
import {
  Argon2PasswordHasher,
  ConsoleEmailSender,
  CryptoIdGenerator,
  CryptoTokenGenerator,
  MongoFlagRepository,
  MongoInvitationRepository,
  MongoMemberRepository,
  MongoOrganizationRepository,
  MongoProjectRepository,
  MongoUnitOfWork,
  MongoUserRepository,
  Sha256TokenHasher,
  SystemClock,
} from "@flagbase/infrastructure";

/**
 * The set of driven adapters every use-case is wired against — typed as the interfaces
 * (ports), so feature wiring can never reach a Mongo-specific method.
 */
export type Dependencies = {
  userRepository: IUserRepository;
  organizationRepository: IOrganizationRepository;
  memberRepository: IMemberRepository;
  invitationRepository: IInvitationRepository;
  projectRepository: IProjectRepository;
  flagRepository: IFlagRepository;
  unitOfWork: IUnitOfWork;
  idGenerator: IIdGenerator;
  clock: IClock;
  tokenGenerator: ITokenGenerator;
  tokenHasher: ITokenHasher;
  passwordHasher: IPasswordHasher;
  emailSender: IEmailSender;
};

/**
 * Selects the concrete adapter for every port. This is the ONE place that names
 * infrastructure classes — swapping Mongo for Postgres, or the console email sender for a
 * real provider, is a change here and nowhere else.
 *
 * The repositories are non-transactional (no session); the two multi-write use-cases take
 * the Unit of Work, which builds its own session-bound repositories inside a transaction.
 *
 * No I/O happens here — constructing these only stores references. The Mongo connection is
 * established per request by the delivery layer's `withDb`.
 */
export function createDependencies(): Dependencies {
  return {
    userRepository: new MongoUserRepository(),
    organizationRepository: new MongoOrganizationRepository(),
    memberRepository: new MongoMemberRepository(),
    invitationRepository: new MongoInvitationRepository(),
    projectRepository: new MongoProjectRepository(),
    flagRepository: new MongoFlagRepository(),
    unitOfWork: new MongoUnitOfWork(),
    idGenerator: new CryptoIdGenerator(),
    clock: new SystemClock(),
    tokenGenerator: new CryptoTokenGenerator(),
    tokenHasher: new Sha256TokenHasher(),
    passwordHasher: new Argon2PasswordHasher(),
    emailSender: new ConsoleEmailSender(),
  };
}
