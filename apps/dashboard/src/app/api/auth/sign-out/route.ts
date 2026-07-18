import { HttpStatus } from "@flagbase/shared/http";

import { sessionManager } from "@/lib/auth/session-manager";
import { route } from "@/lib/route";

export const POST = route({
  access: "public",
  status: HttpStatus.NoContent,
  handle: async () => {
    await sessionManager.destroy();
  },
});
