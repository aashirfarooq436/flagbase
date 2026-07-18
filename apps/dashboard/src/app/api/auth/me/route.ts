import { NextResponse } from "next/server";

import { withAppHandlers } from "@/lib/decorators";
import { toUserResponse } from "@/lib/presenters/user.presenter";

// withAppHandlers already loaded (and validated) the session user via withUser, so the route
// is just a presenter call — a stale session was rejected with 401 before we got here.
export const GET = withAppHandlers(async (_req, ctx) => {
  return NextResponse.json(toUserResponse(ctx.user));
});
