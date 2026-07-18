import {
  CreateProjectUseCase,
  DeleteProjectUseCase,
  GetProjectUseCase,
  ListProjectsUseCase,
  RenameProjectUseCase,
} from "@flagbase/core";

import type { Dependencies } from "../dependencies";

export function createProjectUseCases(deps: Dependencies) {
  return {
    create: new CreateProjectUseCase(
      deps.projectRepository,
      deps.idGenerator,
      deps.clock,
    ),
    list: new ListProjectsUseCase(deps.projectRepository),
    get: new GetProjectUseCase(deps.projectRepository),
    rename: new RenameProjectUseCase(deps.projectRepository),
    delete: new DeleteProjectUseCase(
      deps.projectRepository,
      deps.flagRepository,
    ),
  };
}
