import {
  CreateFlagUseCase,
  DeleteFlagUseCase,
  EvaluateFlagUseCase,
  GetFlagUseCase,
  ListFlagsUseCase,
  SetFlagEnabledUseCase,
  UpdateFlagRulesUseCase,
} from "@flagbase/core";

import type { Dependencies } from "../dependencies";

export function createFlagUseCases(deps: Dependencies) {
  return {
    create: new CreateFlagUseCase(
      deps.projectRepository,
      deps.flagRepository,
      deps.idGenerator,
      deps.clock,
    ),
    setEnabled: new SetFlagEnabledUseCase(
      deps.flagRepository,
      deps.projectRepository,
      deps.clock,
    ),
    updateRules: new UpdateFlagRulesUseCase(
      deps.flagRepository,
      deps.projectRepository,
      deps.clock,
    ),
    evaluate: new EvaluateFlagUseCase(
      deps.flagRepository,
      deps.projectRepository,
    ),
    list: new ListFlagsUseCase(deps.flagRepository, deps.projectRepository),
    get: new GetFlagUseCase(deps.flagRepository, deps.projectRepository),
    delete: new DeleteFlagUseCase(deps.flagRepository, deps.projectRepository),
  };
}
