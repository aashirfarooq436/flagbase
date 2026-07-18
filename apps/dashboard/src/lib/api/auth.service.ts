import type {
  SignInRequest,
  SignUpRequest,
  UserResponse,
} from "@flagbase/contracts";

import { BaseService } from "./base.service";

export class AuthService extends BaseService {
  signUp(body: SignUpRequest): Promise<UserResponse> {
    return this.post<UserResponse>("/auth/sign-up", body);
  }

  signIn(body: SignInRequest): Promise<UserResponse> {
    return this.post<UserResponse>("/auth/sign-in", body);
  }

  signOut(): Promise<void> {
    return this.post<void>("/auth/sign-out");
  }

  me(): Promise<UserResponse> {
    return this.get<UserResponse>("/auth/me");
  }
}
