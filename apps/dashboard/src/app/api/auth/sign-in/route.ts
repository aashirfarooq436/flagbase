import { composition } from "@flagbase/composition";
import { signInRequestSchema, type UserResponse } from "@flagbase/contracts";
import { type NextRequest, NextResponse } from "next/server";

import { sessionManager } from "@/lib/auth/session-manager";
import { withPublicHandlers } from "@/lib/decorators";
import { toUserResponse } from "@/lib/presenters/user.presenter";

export const POST = withPublicHandlers(async (req: NextRequest) => {
  const input = signInRequestSchema.parse(await req.json());
  const user = await composition.user.signIn.execute(input);
  await sessionManager.issue(user);

  const response: UserResponse = toUserResponse(user);
  return NextResponse.json(response, { status: 200 });
});
