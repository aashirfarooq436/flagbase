import {
  ChangeMemberRoleUseCase,
  ListMembersUseCase,
  RemoveMemberUseCase,
} from "@flagbase/core";

import type { Dependencies } from "../dependencies";

export function createMemberUseCases(deps: Dependencies) {
  return {
    changeRole: new ChangeMemberRoleUseCase(deps.memberRepository),
    remove: new RemoveMemberUseCase(deps.memberRepository),
    list: new ListMembersUseCase(deps.memberRepository),
  };
}
