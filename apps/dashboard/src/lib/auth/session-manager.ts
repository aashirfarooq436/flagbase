import "server-only";

import { jwtVerify, SignJWT } from "jose";
import { cookies } from "next/headers";

import { serverEnv } from "../env";

/**
 * The session seam.
 *
 * Authentication is deliberately behind this interface so the *mechanism* is swappable: a
 * signed-JWT cookie today, an external provider (e.g. Auth0) later, without changing a
 * single call site. `withAuth` only ever calls `resolve()`. Credential verification itself
 * lives in core (`SignInUseCase`); this only carries the resulting identity.
 */
export interface SessionManager {
  /** Start a session for a subject (sets the httpOnly cookie). */
  issue(subject: { id: string }): Promise<void>;
  /** The identity of the current request, or null if unauthenticated. */
  resolve(): Promise<{ userId: string } | null>;
  /** End the session (clears the cookie). */
  destroy(): Promise<void>;
}

const ALGORITHM = "HS256";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 days

/**
 * A stateless session: a signed JWT carrying only the user id, in an httpOnly cookie.
 * The token holds identity and nothing else — role and organization are loaded fresh per
 * request, so a permission change never waits on a stale token.
 */
export class JwtSessionManager implements SessionManager {
  private secret(): Uint8Array {
    return new TextEncoder().encode(serverEnv().SESSION_SECRET);
  }

  async issue(subject: { id: string }): Promise<void> {
    const token = await new SignJWT({})
      .setProtectedHeader({ alg: ALGORITHM })
      .setSubject(subject.id)
      .setIssuedAt()
      .setExpirationTime(`${MAX_AGE_SECONDS}s`)
      .sign(this.secret());

    const store = await cookies();
    store.set(serverEnv().SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: serverEnv().NODE_ENV === "production",
      path: "/",
      maxAge: MAX_AGE_SECONDS,
    });
  }

  async resolve(): Promise<{ userId: string } | null> {
    const store = await cookies();
    const token = store.get(serverEnv().SESSION_COOKIE_NAME)?.value;
    if (!token) {
      return null;
    }
    try {
      const { payload } = await jwtVerify(token, this.secret(), {
        algorithms: [ALGORITHM],
      });
      return payload.sub ? { userId: payload.sub } : null;
    } catch {
      // Tampered, expired, or wrong-secret token — treat as no session.
      return null;
    }
  }

  async destroy(): Promise<void> {
    const store = await cookies();
    store.delete(serverEnv().SESSION_COOKIE_NAME);
  }
}

/** The app's session manager. Swap this single construction for an Auth0-backed one later. */
export const sessionManager: SessionManager = new JwtSessionManager();
