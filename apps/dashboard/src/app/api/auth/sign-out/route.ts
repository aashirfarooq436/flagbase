import { NextResponse } from "next/server";

import { sessionManager } from "@/lib/auth/session-manager";

/** Clears the session cookie. Idempotent — safe to call with an already-expired session. */
export async function POST() {
  await sessionManager.destroy();
  return new NextResponse(null, { status: 204 });
}
