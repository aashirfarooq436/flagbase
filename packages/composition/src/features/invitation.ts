import {
  AcceptInvitationUseCase,
  InviteMemberUseCase,
  ListPendingInvitationsUseCase,
  RejectInvitationUseCase,
  RevokeInvitationUseCase,
} from "@flagbase/core";

import type { Dependencies } from "../dependencies";

export function createInvitationUseCases(deps: Dependencies) {
  return {
    invite: new InviteMemberUseCase(
      deps.organizationRepository,
      deps.userRepository,
      deps.memberRepository,
      deps.invitationRepository,
      deps.tokenGenerator,
      deps.tokenHasher,
      deps.emailSender,
      deps.idGenerator,
      deps.clock,
    ),
    // multi-write → Unit of Work
    accept: new AcceptInvitationUseCase(
      deps.unitOfWork,
      deps.tokenHasher,
      deps.idGenerator,
      deps.clock,
    ),
    revoke: new RevokeInvitationUseCase(deps.invitationRepository),
    reject: new RejectInvitationUseCase(
      deps.invitationRepository,
      deps.tokenHasher,
    ),
    listPending: new ListPendingInvitationsUseCase(deps.invitationRepository),
  };
}
