import { createDependencies } from "./dependencies";
import { createFlagUseCases } from "./features/flag";
import { createInvitationUseCases } from "./features/invitation";
import { createMemberUseCases } from "./features/member";
import { createOrganizationUseCases } from "./features/organization";
import { createProjectUseCases } from "./features/project";
import { createUserUseCases } from "./features/user";

/**
 * The composition root — the single place the object graph is assembled.
 *
 * `createDependencies()` selects the concrete adapters once (the only import of
 * `infrastructure` in the whole system); each feature module wires its use-cases against
 * those shared dependencies. The dependencies are typed as interfaces, so the wiring never
 * sees a Mongo-specific method — a wrong adapter choice can only be made in one file.
 *
 * There's no logic here — it's a wiring diagram. Route handlers import `composition` and
 * call e.g. `composition.flag.create.execute(input)`, never constructing anything.
 */
const dependencies = createDependencies();

export const composition = {
  user: createUserUseCases(dependencies),
  organization: createOrganizationUseCases(dependencies),
  member: createMemberUseCases(dependencies),
  invitation: createInvitationUseCases(dependencies),
  project: createProjectUseCases(dependencies),
  flag: createFlagUseCases(dependencies),
};
