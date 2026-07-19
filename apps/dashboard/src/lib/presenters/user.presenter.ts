import type { UserResponse } from "@flagbase/contracts";
import type { User } from "@flagbase/core";

/** Maps a User entity to its wire DTO — deliberately dropping `passwordHash`. */
export function toUserResponse(user: User): UserResponse {
  return {
    id: user.id,
    email: user.email.value,
    name: user.name,
    createdAt: user.createdAt.toISOString(),
  };
}
