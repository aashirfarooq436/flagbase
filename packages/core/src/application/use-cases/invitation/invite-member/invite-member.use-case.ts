import { Invitation } from "../../../../domain/invitation/invitation.entity";
import type { IInvitationRepository } from "../../../../domain/invitation/invitation.repository";
import type { IMemberRepository } from "../../../../domain/member/member.repository";
import type { Role } from "../../../../domain/member/role.vo";
import type { IOrganizationRepository } from "../../../../domain/organization/organization.repository";
import type { IUserRepository } from "../../../../domain/user/user.repository";
import { Email } from "../../../../shared/email.vo";
import { ConflictError, NotFoundError } from "../../../../shared/errors";
import type {
  IClock,
  IEmailSender,
  IIdGenerator,
  ITokenGenerator,
  ITokenHasher,
} from "../../../ports";
import type { IUseCase } from "../../use-case";

const INVITATION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export type InviteMemberInput = {
  organizationId: string;
  inviterUserId: string;
  email: string;
  role: Role;
};

/**
 * Invites someone to an organization by email.
 *
 * Not a transaction: it's a single write (the invitation) followed by a side effect (the
 * email). If the email fails after the invitation is saved, the invitation still exists
 * and can be resent — so atomicity buys nothing here, unlike the multi-write use-cases.
 *
 * The raw token appears only in the email; the invitation stores its hash. `Invitation.create`
 * rejects the Owner role — ownership is transferred, not invited.
 */
export class InviteMemberUseCase
  implements IUseCase<InviteMemberInput, Invitation>
{
  constructor(
    private readonly organizationRepository: IOrganizationRepository,
    private readonly userRepository: IUserRepository,
    private readonly memberRepository: IMemberRepository,
    private readonly invitationRepository: IInvitationRepository,
    private readonly tokenGenerator: ITokenGenerator,
    private readonly tokenHasher: ITokenHasher,
    private readonly emailSender: IEmailSender,
    private readonly idGenerator: IIdGenerator,
    private readonly clock: IClock,
  ) {}

  async execute(input: InviteMemberInput): Promise<Invitation> {
    const organization = await this.organizationRepository.findById(
      input.organizationId,
    );
    if (organization === null) {
      throw new NotFoundError(
        `Organization ${input.organizationId} not found`,
      );
    }

    const email = new Email(input.email);

    // Already a member? (Only checkable when the invitee already has an account.)
    const invitee = await this.userRepository.findByEmail(email);
    if (invitee !== null) {
      const membership = await this.memberRepository.findByOrganizationAndUser(
        organization.id,
        invitee.id,
      );
      if (membership !== null) {
        throw new ConflictError(
          "This user is already a member of the organization",
        );
      }
    }

    // Don't issue a second outstanding invitation to the same address.
    const pending =
      await this.invitationRepository.findPendingByOrganizationAndEmail(
        organization.id,
        email,
      );
    if (pending !== null) {
      throw new ConflictError(
        "An invitation for this email is already pending",
      );
    }

    const rawToken = this.tokenGenerator.generate();
    const now = this.clock.now();

    const invitation = Invitation.create({
      id: this.idGenerator.generate(),
      organizationId: organization.id,
      email,
      role: input.role,
      tokenHash: this.tokenHasher.hash(rawToken),
      invitedByUserId: input.inviterUserId,
      expiresAt: new Date(now.getTime() + INVITATION_TTL_MS),
      now,
    });

    await this.invitationRepository.save(invitation);
    await this.emailSender.sendInvitation(email, rawToken, organization.name);

    return invitation;
  }
}
