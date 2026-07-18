import "server-only";

import { z } from "zod";

const envSchema = z.object({
  MONGODB_URI: z.string().min(1, "MONGODB_URI is required"),
  SESSION_SECRET: z
    .string()
    .min(32, "SESSION_SECRET must be at least 32 characters"),
  SESSION_COOKIE_NAME: z.string().min(1).default("flagbase_session"),
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
});

export type ServerEnv = z.infer<typeof envSchema>;

let cached: ServerEnv | null = null;

/**
 * Validated server environment.
 *
 * Parsed lazily on first use rather than at import time, so a build that runs without
 * secrets present doesn't fail — the values are only needed once a request actually runs.
 * `server-only` guarantees this module never reaches the client bundle (SESSION_SECRET
 * must never ship to the browser).
 */
export function serverEnv(): ServerEnv {
  if (cached === null) {
    cached = envSchema.parse({
      MONGODB_URI: process.env.MONGODB_URI,
      SESSION_SECRET: process.env.SESSION_SECRET,
      SESSION_COOKIE_NAME: process.env.SESSION_COOKIE_NAME,
      NODE_ENV: process.env.NODE_ENV,
    });
  }
  return cached;
}
