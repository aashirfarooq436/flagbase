import type {
  SignInRequest,
  SignUpRequest,
  UserResponse,
} from "@flagbase/contracts";

import { BaseService } from "./base.service";

/**
 * Session lifecycle — `/api/auth`. Sign up / in create the session cookie; sign out clears it.
 * The current-user lookup is NOT here — it's the user's own account, at `UserService.getProfile`
 * (`/api/users/me`).
 */
export class AuthService extends BaseService {
  /** `POST /auth/sign-up` — register and start a session. */
  signUp(body: SignUpRequest): Promise<UserResponse> {
    return this.post<UserResponse>("/auth/sign-up", body);
  }

  /** `POST /auth/sign-in` — authenticate and start a session. */
  signIn(body: SignInRequest): Promise<UserResponse> {
    return this.post<UserResponse>("/auth/sign-in", body);
  }

  /** `POST /auth/sign-out` — clear the session. Idempotent. */
  signOut(): Promise<void> {
    return this.post<void>("/auth/sign-out");
  }
}
