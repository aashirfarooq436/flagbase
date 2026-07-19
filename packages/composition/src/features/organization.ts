import {
  CreateOrganizationUseCase,
  GetOrganizationBySlugUseCase,
  GetOrganizationUseCase,
  ListMyOrganizationsUseCase,
  RenameOrganizationUseCase,
} from "@flagbase/core";

import type { Dependencies } from "../dependencies";

export function createOrganizationUseCases(deps: Dependencies) {
  return {
    // multi-write → Unit of Work
    create: new CreateOrganizationUseCase(
      deps.unitOfWork,
      deps.idGenerator,
      deps.clock,
    ),
    rename: new RenameOrganizationUseCase(deps.organizationRepository),
    get: new GetOrganizationUseCase(deps.organizationRepository),
    getBySlug: new GetOrganizationBySlugUseCase(deps.organizationRepository),
    listMine: new ListMyOrganizationsUseCase(
      deps.memberRepository,
      deps.organizationRepository,
    ),
  };
}
