/**
 * A user on the wire. Deliberately never includes `passwordHash` — the presenter drops it.
 */
export type UserResponse = {
  id: string;
  email: string;
  name: string;
  createdAt: string;
};
