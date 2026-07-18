import { z } from "zod";

const MIN_PASSWORD = 8;
const MAX_PASSWORD = 128;
const MAX_NAME = 100;

// A new/changed password is checked against policy at the edge (UX-critical); the Password
// value object is the authoritative guard. A password being *verified* (sign-in, current
// password) is only checked for presence — the policy applies when setting one, not using it.

export const signUpRequestSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(MAX_NAME),
  password: z.string().min(MIN_PASSWORD).max(MAX_PASSWORD),
});
export type SignUpRequest = z.infer<typeof signUpRequestSchema>;

export const signInRequestSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});
export type SignInRequest = z.infer<typeof signInRequestSchema>;

export const updateProfileRequestSchema = z.object({
  name: z.string().min(1).max(MAX_NAME),
});
export type UpdateProfileRequest = z.infer<typeof updateProfileRequestSchema>;

export const changePasswordRequestSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(MIN_PASSWORD).max(MAX_PASSWORD),
});
export type ChangePasswordRequest = z.infer<typeof changePasswordRequestSchema>;
