import type {
  ChangePasswordRequest,
  UpdateProfileRequest,
  UserResponse,
} from "@flagbase/contracts";

import { BaseService } from "./base.service";

/** The current user's own account — `/api/users/me`. */
export class UserService extends BaseService {
  /** `GET /users/me` — the signed-in user's profile. */
  getProfile(): Promise<UserResponse> {
    return this.get<UserResponse>("/users/me");
  }

  /** `PATCH /users/me` — update the display name. */
  updateProfile(body: UpdateProfileRequest): Promise<UserResponse> {
    return this.patch<UserResponse>("/users/me", body);
  }

  /** `POST /users/me/change-password` — a command; requires the current password. */
  changePassword(body: ChangePasswordRequest): Promise<void> {
    return this.post<void>("/users/me/change-password", body);
  }
}
