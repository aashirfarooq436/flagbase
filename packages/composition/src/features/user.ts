import {
  ChangePasswordUseCase,
  GetCurrentUserUseCase,
  SignInUseCase,
  SignUpUseCase,
  UpdateProfileUseCase,
} from "@flagbase/core";

import type { Dependencies } from "../dependencies";

export function createUserUseCases(deps: Dependencies) {
  return {
    signUp: new SignUpUseCase(
      deps.userRepository,
      deps.passwordHasher,
      deps.idGenerator,
      deps.clock,
    ),
    signIn: new SignInUseCase(deps.userRepository, deps.passwordHasher),
    updateProfile: new UpdateProfileUseCase(deps.userRepository),
    changePassword: new ChangePasswordUseCase(
      deps.userRepository,
      deps.passwordHasher,
    ),
    getCurrent: new GetCurrentUserUseCase(deps.userRepository),
  };
}
